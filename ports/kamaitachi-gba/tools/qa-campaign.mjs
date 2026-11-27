// Replays the original's 100% campaign (qa/kamaitachi-gba-beta: mGBA, pad input only) on the port
// without a screen, and compares what the original recorded.
//
//   node tools/qa-campaign.mjs <port-data> <out.json> <campaign.json>... [--names names.json]
//
// The campaign files are the original's runs in order (original-campaign.json, then the later
// stages). Each round's next_route is played from where the previous round ended, the way the
// original's explore.py follow_job plays it: A every 4 frames while reading, a choice taken with
// DOWN x k then A once it has been up for 20 frames, then 30 idle frames; after 終 the ending
// screens are read on with A and an idle bookshelf saves to book 1 (A, UP, A). The real VM and
// native screens (src/boot.js) run; only the picture, sound and text drawing are left out.
//
// Checked: every choice comes up at the site the original recorded (bank:pointer-0x020067F4 file
// offset, written here as the original's bank:offset+0x7F4), each round adds the ending records
// the original recorded (opcode 0D flags 1-79, saved in the book), and the final book.
// --names: {alias: "UDLRA..S"} key strings for the culprit grid (from the original tool's
// name_grid.keys_for, which plans them on the cartridge's grid).
import fs from "node:fs";
import path from "node:path";
import { VM } from "../src/vm.js";
import { NativeFont, TextWindow } from "../src/font.js";
import { Assets, SceneLoader } from "../src/scene.js";
import { Boot, KEY } from "../src/boot.js";

const args = process.argv.slice(2);
const namesAt = args.indexOf("--names");
const nameKeys = namesAt >= 0 ? JSON.parse(fs.readFileSync(args.splice(namesAt, 2)[1])) : {};
const [dataPath, outPath, ...campaignPaths] = args;
if (!campaignPaths.length) throw new Error("usage: qa-campaign.mjs <port-data> <out.json> <campaign.json>... [--names names.json]");
const SITE_BASE = 0x7f4;
const SHELF_BANK = 0x27, ENDING_BANK = 0x1f, STORY_MIN = 0x1a, SYSTEM_BANK = 0x19;

class FileAssets extends Assets {
  async response(file) {
    return new Response(fs.readFileSync(path.join(this.base, file)));
  }
}
// The screen and sound are not looked at: every property reads as a no-op function unless set.
const quiet = () => new Proxy({}, {
  get: (target, key) => (key in target || typeof key === "symbol" || key === "then" ? target[key] : () => undefined),
});
class MemoryBooks {
  constructor() { this.data = [null, null, null]; this.suspend = { read: () => null, write: () => true, erase: () => {} }; }
  read(book) { return this.data[book] ? structuredClone(this.data[book]) : null; }
  write(book, data) { this.data[book] = structuredClone(data); return true; }
  erase(book) { this.data[book] = null; }
  copy(from, to) { this.data[to] = structuredClone(this.data[from]); }
  any() { return this.data.some(Boolean); }
}

const assets = new FileAssets(dataPath);
const manifest = await assets.json("manifest.json");
const banks = {};
for (const file of manifest.files.filter((entry) => entry.path.startsWith("scenario/")))
  banks[Number.parseInt(file.path.slice(-6, -4), 16)] = await assets.bin(file.path);
const font = new NativeFont(await assets.bin("font/glyphs.bin"), await assets.bin("font/lookup.bin"));
const screen = quiet();
const text = new TextWindow({ 1: "透", 2: "真理" });
const vm = new VM({ banks, scene: new SceneLoader(assets, screen), text, entryRow: 31000,
  transitionTimings: await assets.json("scenario-timing.json").catch(() => null) });
const books = new MemoryBooks();
// The script variables the campaign touches (opcodes 40 and 41), for the log comparison.
const varsUsed = new Set(), flagsUsed = new Set();
vm.trace = (e) => {
  if (e.opcode === 0x40 || e.opcode === 0x41) varsUsed.add(e.args[0]);
  if ([0x0d, 0x0e, 0x0f, 0x1a, 0x54, 0x55].includes(e.opcode)) flagsUsed.add(e.args[0]);
};
if (process.env.QA_TRACE) {
  const [tb, lo, hi] = process.env.QA_TRACE.split(",").map((x) => Number.parseInt(x, 16));
  vm.trace = (e) => { if (e.bank === tb && e.offset >= lo && e.offset < hi) console.log("trace", e.offset.toString(16), e.opcode.toString(16), e.args, e.wait, "flags", records().join(","), "ready", vm.ram.inputReady, vm.ram.choiceSkip); };
}
const boot = await new Boot({ vm, screen, assets, font, sound: vm.sound, books }).load();
boot.originalLoadTiming = false;
boot.draw = () => {}; // drawing only
if (process.env.QA_DEBUG === "1") for (const name of ["question", "saveTo", "endingChoice", "bookmarks", "confirm"]) {
  const original = boot[name].bind(boot);
  boot[name] = function* (...a) { console.log(`> ${name} f${frames}`, JSON.stringify(a).slice(0, 60)); const r = yield* original(...a); console.log(`< ${name} f${frames} ->`, r); return r; };
}
vm.system = boot;
text.nameBytes = boot.names;

// One frame of the player's loop (main.js) with `keys` held.
let frames = 0;
const DEBUG = process.env.QA_DEBUG === "1";
let lastBank = -1, lastWaiting = null;
const previous = new Set();
function frame(keys = []) {
  const held = new Set(keys);
  const pressed = (key) => held.has(key) && !previous.has(key);
  if (pressed("UP")) vm.moveChoice(-1);
  if (pressed("DOWN")) vm.moveChoice(1);
  if (pressed("SELECT")) vm.select();
  if (pressed("A") && (vm.waiting === "click" || vm.waiting === "choice")) vm.resume();
  let trigger = 0, mask = 0;
  for (const key of Object.keys(KEY)) {
    if (pressed(key)) trigger |= KEY[key];
    if (held.has(key)) mask |= KEY[key];
  }
  vm.vblank();
  boot.vblank();
  if (vm.waiting === "boot") boot.frame(trigger, mask);
  if (DEBUG && (vm.bank !== lastBank || vm.waiting !== lastWaiting)) {
    console.log(`f${frames} bank ${vm.bank.toString(16)} ${site()} ${vm.waiting} node ${vm.ram.node} rec ${records().join(",")} books ${books.data.map(Boolean)}`);
    lastBank = vm.bank; lastWaiting = vm.waiting;
  }
  previous.clear();
  for (const key of held) previous.add(key);
  frames++;
}
const idle = (n) => { for (let i = 0; i < n; i++) frame(); };
const tap = (key, hold = 2, after = 6) => { for (let i = 0; i < hold; i++) frame([key]); idle(after); };

const site = () => `${vm.bank.toString(16).padStart(2, "0")}:${(vm.offset + SITE_BASE).toString(16).padStart(5, "0")}`;
const atChoice = () => vm.waiting === "choice";
const atCulprit = () => vm.waiting === "boot" && vm.banks[vm.bank][vm.offset - 2] === 0x1d && vm.banks[vm.bank][vm.offset - 1] === 0x04;
const records = () => [...vm.ram.flags.keys()].filter((n) => n > 0 && n < 80 && vm.ram.flags[n]);
const bookRecords = (book = 0) => {
  const flags = books.data[book]?.state?.ram?.flags;
  const bytes = flags?.$bytes ?? flags;
  return bytes ? Object.entries(bytes).filter(([n, v]) => n > 0 && n < 80 && v).map(([n]) => Number(n)) : [];
};

let selectMute = false;
// explore.py press_select: read on, pressing SELECT at each page wait until var 2 is set.
function pressSelect(limit = 4000) {
  for (let i = 0; i < limit / 16; i++) {
    if (vm.ram.vars[2] === 1 || vm.ram.selectArmed !== 1) return;
    tap("SELECT", 2, 6);
    if (vm.ram.vars[2] === 1) return;
    tap("A", 2, 6);
  }
}
// explore.py run_until_event: until a menu has been up for a while or the playthrough ends.
function runUntilEvent(limit = 120000) {
  let stable = 0, last = null, previousBank = null;
  const before = new Set(records());
  for (let f = 0; f < limit; f++) {
    const info = () => ({ records: records().filter((n) => !before.has(n)), node: vm.ram.node, bank: vm.bank });
    if (vm.ram.selectArmed === 1) { if (!selectMute) return { kind: "select", info: info() }; }
    else selectMute = false;
    if (vm.bank === ENDING_BANK && previousBank !== null && previousBank >= STORY_MIN && previousBank !== ENDING_BANK)
      return { kind: "end", info: info() };
    previousBank = vm.bank;
    const key = `${vm.bank}:${vm.offset}:${vm.waiting}`;
    stable = key === last ? stable + 1 : 0;
    last = key;
    if (atChoice()) {
      if (stable >= 20) return { kind: vm.bank === SYSTEM_BANK ? "system" : "choice", info: info() };
      frame();
      continue;
    }
    if (atCulprit()) {
      if (stable >= 120) return { kind: "name", info: info() };
      frame();
      continue;
    }
    if (stable >= 1800) return { kind: "end", info: info() };
    frame(f % 4 < 2 ? ["A"] : []);
  }
  return { kind: "stall", info: { node: vm.ram.node, bank: vm.bank } };
}

// QA_LOG=<file>: the state at every choice, name entry and round end (JSON lines), for comparing
// with the same log taken from the original.
const stepLog = process.env.QA_LOG ? fs.openSync(process.env.QA_LOG, "w") : null;
const logged = { round: 0, step: 0 };
const hexOf = (bytes) => Buffer.from(bytes).toString("hex");
function logStep(kind) {
  if (stepLog === null) return;
  fs.writeSync(stepLog, JSON.stringify({ round: logged.round, step: logged.step++, kind, site: site(), node: vm.ram.node,
    flags: hexOf(vm.ram.flags), vars: hexOf(vm.ram.vars) }) + "\n");
}

function choose(k) {
  logStep("choice");
  for (let i = 0; i < k; i++) tap("DOWN");
  tap("A", 2, 4);
}

// explore.py settle_and_save: an idle bookshelf saves to book 1; done once a story bank runs.
function settleAndSave(limit = 30000) {
  let shelf = 0, seen = false;
  for (let f = 0; f < limit; f++) {
    if (vm.bank === SHELF_BANK) {
      seen = true;
      if (++shelf >= 300) {
        if (DEBUG) console.log("save_book at", frames, "layer glyphs", boot.layer?.glyphs?.length, "run", Boolean(boot.run));
        tap("A", 2, 60); tap("UP", 2, 30); tap("A", 2, 300); shelf = 0; continue;
      }
      frame();
      continue;
    }
    if (seen && vm.bank >= STORY_MIN && vm.bank !== ENDING_BANK) return true;
    shelf = 0;
    if (atChoice()) frame(); else frame(f % 4 < 2 ? ["A"] : []);
  }
  return false;
}

function typeName(keys) {
  logStep("name");
  const map = { U: "UP", D: "DOWN", L: "LEFT", R: "RIGHT", A: "A", S: "START" };
  for (const k of keys) tap(map[k]);
}

const report = { started: new Date().toISOString(), rounds: [], mismatches: [] };
let have = new Set();
let roundNumber = 0;
const nameInputs = (() => {
  // The culprit menus' entries as the original tool lists them (explore.py name_inputs).
  const script = JSON.parse(fs.readFileSync(path.join(dataPath, "../data/kamaitachi.ja.json"))).nodes;
  return Object.entries(script).filter(([, v]) => v.input).map(([id, v]) => {
    const seen = new Set(), entries = [];
    for (const m of v.input.match) { if (seen.has(m.as)) continue; seen.add(m.as); entries.push(m.aliases[0]); }
    entries.push("ぬぬぬ");
    return { bank: Number.parseInt(id.slice(1, 3), 16), start: Number.parseInt(id.slice(4, 8), 16), entries };
  });
})();

for (const campaignPath of campaignPaths) {
  const campaign = JSON.parse(fs.readFileSync(campaignPath));
  for (const round of campaign.rounds) {
    if (!round.next_route || !round.new_records?.length) continue;
    roundNumber++;
    const t0 = Date.now(), f0 = frames;
    logged.round = roundNumber;
    logged.step = 0;
    const result = { round: roundNumber, from: `${path.basename(campaignPath)} ${round.round}회차`, expected: round.new_records,
      steps: round.next_route.length };
    let why = null, event = null;
    // follow_job: from power on (first round) or the previous round's end, read on.
    for (const step of [...round.next_route, null]) {
      while (true) {
        event = runUntilEvent();
        if (event.kind === "select" && (step === null || !step[0].includes(":select:"))) { selectMute = true; idle(4); continue; }
        if (event.kind !== "system") break;
        choose(0); // the welcome menu: そのまま はじめる
      }
      if (step === null) break;
      const [menu, k] = step;
      if (menu.includes(":select:")) {
        if (event.kind !== "select") { why = `expected SELECT ${menu}, got ${event.kind} ${site()}`; break; }
        selectMute = true;
        if (k === 1) pressSelect();
        idle(4);
        continue;
      }
      if (menu.includes(":name:")) {
        if (event.kind !== "name") { why = `expected name entry ${menu}, got ${event.kind} ${site()}`; break; }
        const offset = Number.parseInt(menu.slice(8), 16), bank = Number.parseInt(menu.slice(0, 2), 16);
        const input = nameInputs.filter((i) => i.bank === bank && i.start <= offset).sort((a, b) => b.start - a.start)[0];
        const alias = input?.entries[k] ?? "あ";
        if (!nameKeys[alias]) { why = `no grid keys for ${alias}`; break; }
        typeName(nameKeys[alias]);
        continue;
      }
      if (event.kind !== "choice" || site() !== menu) { why = `expected ${menu}, got ${event.kind} ${site()} (node ${vm.ram.node})`; break; }
      choose(k);
      idle(30);
    }
    if (!why) {
      if (event.kind !== "end") why = `route ended in ${event.kind} ${site()}`;
      else if (!settleAndSave()) why = `bookshelf did not save (bank ${vm.bank.toString(16)})`;
    }
    logStep("end");
    const book = bookRecords();
    const gained = book.filter((n) => !have.has(n));
    Object.assign(result, { got: gained, book: book.length, frames: frames - f0, ms: Date.now() - t0 });
    if (why) result.error = why;
    const missing = round.new_records.filter((n) => !gained.includes(n));
    const extra = gained.filter((n) => !round.new_records.includes(n));
    if (why || missing.length || extra.length) report.mismatches.push({ ...result, missing, extra });
    report.rounds.push(result);
    console.log(JSON.stringify(result));
    have = new Set(book);
    if (why) break;
  }
  if (report.mismatches.some((m) => m.error)) break;
}
const final = bookRecords();
Object.assign(report, { finished: new Date().toISOString(), frames, varsUsed: [...varsUsed].sort((a, b) => a - b), flagsUsed: [...flagsUsed].sort((a, b) => a - b), bookRecords: final, f52: Boolean(vm.ram.flags[52]), f54: Boolean(vm.ram.flags[54]) });
fs.writeFileSync(outPath, JSON.stringify(report, null, 1));
console.log(JSON.stringify({ rounds: report.rounds.length, mismatches: report.mismatches.length, book: final.length, f52: report.f52, f54: report.f54 }));
