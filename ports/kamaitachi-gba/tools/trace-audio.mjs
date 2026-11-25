// Replays the scenario on the native timeline and compares every audio call with mGBA.
//
//   node tools/trace-audio.mjs <port-data> <native.tsv> [frames] [choice-index] [timing-json]
//
// native.tsv comes from kamaitachi-gba-kor/tools/mgba_scene_audio_probe.c. The port starts at
// entry row 27000; the native log reaches it at its first bank-1B dispatch, which becomes frame 0.
// Each JS dispatch is held until the frame the cartridge dispatched the same op (a JS dispatch that
// comes later is reported as lag), choices take the item the probe took, and frames on which the
// cartridge skipped 0800A414 / 0800A3E0 (transition waits the port does not have yet) skip them
// here too. Both logs are then normalized (player addresses to indexes, song headers to song
// numbers, m4a calls made inside m4aSongNumStart/Stop dropped) and the first differences printed.
import fs from "node:fs";
import path from "node:path";
import { VM } from "../src/vm.js";
import { M4A, Memory } from "../sound/m4a.js";

const [data, nativePath, framesText = "30000", choiceIndexText = "0", timingPath] = process.argv.slice(2);
if (!nativePath) throw new Error("usage: trace-audio.mjs <port-data> <native.tsv> [frames] [choice-index] [timing-json]");
const choiceIndex = Number(choiceIndexText);
const read = (name) => fs.readFileSync(path.join(data, name));
const banks = {};
for (const name of fs.readdirSync(path.join(data, "scenario")))
  if (name.endsWith(".bin")) banks[parseInt(name, 16)] = new Uint8Array(read(`scenario/${name}`));
const config = JSON.parse(read("sound/m4a.json"));
const memory = new Memory(new Uint8Array(read("sound/m4a.bin")), config.base);
const engine = new M4A(memory, config);
const tables = JSON.parse(read("sound/scene-audio.json"));
tables.effectBytes = new Uint8Array(read("sound/effects.bin"));
const selectedTimingPath = timingPath ?? path.join(data, "scenario-timing.json");
const transitionTimings = fs.existsSync(selectedTimingPath)
  ? JSON.parse(fs.readFileSync(selectedTimingPath)) : null;

const BUFFER = 0x020067f4; // RAM copy of the current bank; 020006F4 points into it
const hex = (v) => (v >>> 0).toString(16);
const rows = fs.readFileSync(nativePath, "utf8").split("\n").map((line) => line.split("\t"))
  .filter((r) => /^\d+$/.test(r[0]) && ["op", "call", "ram"].includes(r[1]));
const start = Number(rows.find((r) => r[1] === "op" && parseInt(r[2], 16) === 0x1b)[0]);

// Native log, normalized.
const players = new Map(), songs = new Map();
for (let i = 0; i < config.playerCount; i++) players.set(memory.u32(config.players + 12 * i), i);
for (let i = 0; i < config.songCount; i++) songs.set(memory.u32(config.songTable + 8 * i), i);
const native = [], nativeOps = [], gate = [], marks = new Map();
let inner = false;
for (const r of rows) {
  const frame = Number(r[0]) - start;
  if (frame < 0) continue;
  if (r[1] === "op") {
    gate.push(frame);
    nativeOps.push({ bank: parseInt(r[2], 16), offset: parseInt(r[3], 16) - BUFFER });
    native.push(`${frame}\top\t${hex(parseInt(r[2], 16))}\t${hex(parseInt(r[3], 16) - BUFFER)}\t${r[4]}`);
  } else if (r[1] === "ram") native.push(`${frame}\tram\t${r.slice(2).join("\t")}`);
  else if (["frame", "irq", "effects"].includes(r[2])) {
    if (!marks.has(frame)) marks.set(frame, new Set());
    marks.get(frame).add(r[2]);
  } else {
    const [name] = r.slice(2), a = r.slice(3).map((v) => parseInt(v, 16));
    if (name === "songStart" || name === "songStop") {
      native.push(`${frame}\tcall\t${name}\t${hex(a[0])}`);
      inner = true;
      continue;
    }
    if ((name === "mplayStart" || name === "mplayStop") && inner) { inner = false; continue; }
    inner = false;
    const p = hex(players.get(a[0]) ?? a[0]);
    if (name === "mplayStart") native.push(`${frame}\tcall\t${name}\t${p}\t${hex(songs.get(a[1]) ?? a[1])}`);
    else if (name === "mplayStop" || name === "immInit") native.push(`${frame}\tcall\t${name}\t${p}`);
    else native.push(`${frame}\tcall\t${name}\t${p}\t${hex(a[1] & 0xffff)}\t${hex(a[2] & 0xffff)}`);
  }
}

// JS run on the native timeline.
let frame = 0, index = 0;
const js = [], lags = [];
const names = { startSong: "songStart", stopSong: "songStop", immInit: "immInit", volumeControl: "volume",
  panControl: "pan", pitchControl: "pitch", playerStart: "mplayStart", playerStop: "mplayStop" };
const audio = new Proxy(engine, {
  get(target, key) {
    const value = target[key];
    if (typeof value !== "function") return value;
    if (!names[key]) return value.bind(target);
    return (...a) => {
      const shown = ["volume", "pan", "pitch"].includes(names[key]) ? [a[0], a[1], a[2] & 0xffff] : a;
      js.push(`${frame}\tcall\t${names[key]}\t${shown.map(hex).join("\t")}`);
      return value.apply(target, a);
    };
  },
});
const vm = new VM({ banks, audio, audioTables: tables, transitionTimings,
  text: { feed: () => "none" } });
const step = vm.step.bind(vm);
vm.step = () => {
  if (vm.halted || vm.waiting !== "none") return step();
  if (index >= gate.length) return false;
  if (gate[index] > frame) return false;
  if (gate[index] < frame) lags.push(`${index}:+${frame - gate[index]}`);
  index++;
  js.push(`${frame}\top\t${hex(vm.bank)}\t${hex(vm.offset)}\t${vm.banks[vm.bank][vm.offset].toString(16).padStart(2, "0")}`);
  return step();
};
let last = "";
for (; frame < Number(framesText) && !vm.halted && index < gate.length; frame++) {
  if (vm.waiting === "click") vm.resume();
  if (vm.waiting === "choice") {
    // Follow the branch the cartridge actually took. Some 57/16 blocks use a
    // precomputed result and continue after 16 instead of jumping to an entry;
    // an unmatched next native cursor is represented by resume(-1).
    const next = nativeOps[index];
    const selected = vm.choiceState?.entries.findIndex(({ row }) => {
      const bank = Math.floor(row / 1000), index = row % 1000;
      return bank === next?.bank && vm.rows[bank]?.[index] === next.offset;
    });
    vm.resume(selected >= 0 ? selected : (next ? -1 : choiceIndex));
  }
  vm.skipAudioIrq = !marks.get(frame)?.has("irq");
  vm.skipAudioFrame = !marks.get(frame)?.has("frame");
  vm.vblank();
  engine.vblank();
  const now = `${vm.sound.request}\t${vm.sound.applied}\t${vm.sound.fadeLeft}`;
  if (now !== last && frame > 0) js.push(`${frame}\tram\t${now}`);
  last = now;
}

// The native log's first line is the state before the port's first frame.
// A halt stops the port mid-frame, so its last frame is left out.
const end = vm.halted ? frame - 1 : frame;
const within = (line) => Number(line.split("\t")[0]) < end;
const expected = native.filter((line) => within(line) && !/^0\tram\t/.test(line));
js.splice(0, js.length, ...js.filter(within));
let differences = 0;
for (let i = 0; i < Math.max(expected.length, js.length) && differences < 20; i++) {
  if (expected[i] === js[i]) continue;
  console.log(`${i + 1}\n- ${expected[i] ?? "<missing>"}\n+ ${js[i] ?? "<missing>"}`);
  differences++;
}
const calls = js.filter((line) => line.includes("\tcall\t")).length;
console.error(JSON.stringify({ frames: end, lines: js.length, calls, differences, lags: lags.slice(0, 10),
  halted: vm.halted, unimplemented: [...vm.unimplemented].map((op) => op.toString(16)) }));
process.exitCode = differences ? 1 : 0;
