// Usage: node tools/oracle/compare-hybrid.mjs <dir> [seconds] [songs=1,2|all] [effects=ids|all|none] [only=name,..]
// Runs each song/effect twice through sound/module.js: original libsnd only, then with the
// JS routines from sound/lib swapped in. Reports the first SPU-write and RAM difference.
// JS=1 runs the second pass on sound/lib/ss.js alone (no EXE, no CPU; library data from
// sound/lib/data.js) and also compares the rendered samples. JS=exe seeds that run's RAM
// with the whole EXE image instead and lists the initialised words the port read (DATA=1).
// Debugging: SNAP=frame diffs RAM at that frame, WATCH=addr[,frame] logs writes to a halfword,
// TRAPW=frame,reg,value prints the JS stack for that SPU write (JS runs), RAMDIFF=1 lists RAM differences.
// RAMP=frame,up|down,amount,frames[,startVol] starts a crescendo/decrescendo on the song at that frame
// (the game itself only uses decrescendo, through stopMusic). TEMPO=frame,target,step,frames
// starts a tempo ramp by setting the fields directly (the EXE has no setter for it).
// UI=frame:n,frame:n.. plays UI sounds (SsUtKeyOn). STOP=frame,fade[,song] stops the music (fade frames, 0 = at once) and optionally starts another.
import { readFileSync } from "node:fs";
import { LibsndOracle } from "./libsnd-oracle.mjs";
import { attachHybrid } from "./hybrid.mjs";
import { JsSs } from "../../sound/lib/ss.js";
import { NAME_AT } from "../../sound/lib/index.js";
import { SoundModule } from "../../sound/module.js";
import { readSoundTables, vceParts } from "../../sound/container.js";
import { parseVabHead } from "../../sound/vab.js";

const [dir, secArg = "20", songsArg = "1", fxArg = "none", onlyArg] = process.argv.slice(2);
const exe = readFileSync(dir + "/SLPS_017.94");
const tables = readSoundTables(exe);
function pac(path) {
  const d = readFileSync(path); const e = [];
  for (let i = 0; ; i += 4) { const id = d.readUInt16LE(i), s = d.readUInt16LE(i + 2); if (id === 0xffff) { e.push({ end: s }); break; } e.push({ id, s }); }
  const m = new Map(); e.slice(0, -1).forEach((x, i) => m.set(x.id, d.subarray(x.s * 2048, (e[i + 1].s ?? e[i + 1].end) * 2048))); return m;
}
const mus = pac(dir + "/MUS.PAC"), vce = pac(dir + "/VCE.PAC"), bin = pac(dir + "/BIN.PAC");
const be = (b, o) => b.readUInt32BE(o);
const musMember = (b) => { const h0 = be(b, 0), b0 = be(b, 4), s0 = be(b, 8); const h = parseVabHead(b, h0); return { head: { fsize: h.size, bytes: b.subarray(h0, h0 + h.headSize) }, body: b.subarray(b0, b0 + h.bodySize), seq: b.subarray(s0, h0) }; };
const vceMember = (b) => { const p = vceParts(b); const h = parseVabHead(p.head.bytes, 0); return { head: { fsize: h.size, bytes: p.head.bytes }, body: p.body.bytes, script: p.script.bytes }; };
const uiBanks = () => { const p = vceParts(bin.get(1)).parts; return [0, 1, 2, 3, 4].map((i) => ({ head: { fsize: parseVabHead(p[2 * i].bytes, 0).size, bytes: p[2 * i].bytes }, body: p[2 * i + 1].bytes })); };
const only = onlyArg ? onlyArg.split(",") : undefined;
const frames = +secArg * 60;

const JS = process.env.JS;
const exeBase = exe.readUInt32LE(0x18), exeImg = exe.subarray(0x800, 0x800 + exe.readUInt32LE(0x1c));
const dataRead = new Map();
// RAM the libetc/libapi/BIOS code keeps for itself (callback tables); the JS platform keeps it in JS.
const PLATFORM_RAM = []; // none: sound/lib/platform.js keeps the words libetc stores near the library data
// EXE data the JS-only run never loads (the library does not read it) and the original left as is.
const exeOnly = (x, b, a) => { const o = x - (exeBase - 0x80000000); return JS === "1" && b === 0 && o >= 0 && o < exeImg.length && a === exeImg[o]; };
const platformOwned = (x) => PLATFORM_RAM.some(([a, b]) => x >= a && x < b);
// The JS-only library behind the oracle's shape: .ss, .log, .frame(), .cpu (call/u32/write/ram).
function jsOnly() {
  const j = new JsSs(JS === "exe" ? { image: (m) => m.setBytes(exeBase, exeImg) } : {});
  const m = j.mem, lib = j.lib;
  if (process.env.TRAPW) { const [f, o, v] = process.env.TRAPW.split(",").map(Number); const w = m.onSpuWrite; m.onSpuWrite = (a, b) => { if (j.frames === f && a === o && b === v) console.log(new Error("trap").stack); w(a, b); }; }
  if (JS === "exe") {
    const written = new Set(), r = m.read.bind(m), w = m.write.bind(m), end = exeBase + exeImg.length;
    m.read = (a, n) => { const p = ((a & 0x1fffffff) | 0x80000000) >>> 0; if (p >= exeBase && p < end) for (let i = 0; i < n; i++) { const q = p + i; if (!written.has(q) && exeImg[q - exeBase]) dataRead.set(q, 1); } return r(a, n); };
    m.write = (a, v, n) => { const p = ((a & 0x1fffffff) | 0x80000000) >>> 0; for (let i = 0; i < n; i++) written.add(p + i); return w(a, v, n); };
  }
  j.cpu = { ram: m.ram, u32: (a) => m.read(a, 4), write: (a, v, n) => m.write(a, v, n), call: (a, args) => lib[NAME_AT.get(a >>> 0)](...args) };
  return j;
}

function run(kind, id, hybrid) {
  let used = [], hits = new Map(), o;
  if (hybrid && JS) o = jsOnly();
  else { o = new LibsndOracle(exe); if (hybrid) ({ used, hits } = attachHybrid(o, { only })); }
  if (process.env.WATCH) { const [wa, wf] = process.env.WATCH.split(",").map(Number), mm = o.mem ?? o.cpu, w0 = mm.write.bind(mm); mm.write = (a, v, n) => { if (((a ^ wa) & 0x1ffffffe) === 0 && (!wf || (o.frames >= wf - 1 && o.frames <= wf))) console.log(hybrid ? (JS ? "js" : "hy") : "na", o.frames, (a >>> 0).toString(16), v, n, JS && hybrid ? new Error().stack.split("\n").slice(2, 5).map((x) => x.trim().split(" ")[1]).join("<") : ""); return w0(a, v, n); }; }
  const mod = new SoundModule(o.ss, tables, { loadMember: (k, i) => k === "MUS" ? musMember(mus.get(i)) : k === "UI" ? uiBanks() : null });
  mod.reset();
  const ui = process.env.UI?.split(",").map((x) => x.split(":").map(Number));
  if (ui) mod.loadUiBanks();
  if (kind === "song") mod.playMusic(id, 0); else mod.startEffect(1000 + id, 0, 0, vceMember(vce.get(id)));
  const stop = process.env.STOP?.split(","), ramp = process.env.RAMP?.split(","), tempo = process.env.TEMPO?.split(",");
  for (let f = 0; f < frames; f++) {
    if (ramp && kind === "song" && f === +ramp[0]) {
      const acc = mod.music.acc, cpu = o.cpu;
      if (ramp[4]) cpu.call(0x800592c8, [acc, 0, +ramp[4], +ramp[4]]); // SsSeqSetVol
      cpu.call(0x80059618, [acc, 0, +ramp[2], +ramp[3]]); // the original ramp setup, native in both runs
      const p = (cpu.u32(0x801fdfd8 + acc * 4) + 0x98) >>> 0, up = ramp[1] === "up";
      cpu.write(p, (cpu.u32(p) & ~0x30) | (up ? 0x10 : 0x20), 4);
    }
    if (tempo && kind === "song" && f === +tempo[0]) {
      const cpu = o.cpu, p = (cpu.u32(0x801fdfd8 + mod.music.acc * 4)) >>> 0;
      cpu.write(p + 0xac, +tempo[1], 4); cpu.write(p + 0x4e, +tempo[2], 2); cpu.write(p + 0xa8, +tempo[3], 4);
      cpu.write(p + 0x98, cpu.u32(p + 0x98) | 0x40, 4);
    }
    if (stop && kind === "song" && f === +stop[0]) mod.stopMusic(+stop[1]);
    if (stop?.[2] && kind === "song" && f === +stop[0] + 1 + (+stop[1] ? +stop[1] + 30 : 0)) mod.playMusic(+stop[2], 0);
    for (const [uf, n] of ui ?? []) if (uf === f) mod.playUi(n);
    if (process.env.SNAP && f === +process.env.SNAP) o.snap = (o.mem ?? o.cpu).ram.slice();
    mod.vsync(); mod.frame(); o.frame(1);
  }
  return { o, used, hits };
}
const ids = (arg, all) => arg === "none" ? [] : arg === "all" ? all : arg.split(",").map(Number);
const songs = ids(songsArg, [...mus.keys()].filter((id) => !tables.musicSilence.includes(id) && id < tables.songs.length));
const effects = ids(fxArg, [...vce.keys()]);
let bad = 0, usedNames; const hit = new Set();
const t0 = Date.now();
for (const [kind, list] of [["song", songs], ["effect", effects]]) for (const id of list) {
  const a = run(kind, id, false), b = run(kind, id, true); usedNames = b.used; for (const k of b.hits.keys()) hit.add(k);
  if (JS) b.o.cpu.ram = b.o.mem.ram;
  const la = a.o.log, lb = b.o.log; let i = 0;
  while (i < la.length && i < lb.length && la[i].join() === lb[i].join()) i++;
  let ramDiff = -1;
  const A = a.o.cpu.ram, B = b.o.cpu.ram;
  for (let x = 0x78000; x < 0x1fef00; x++) if (A[x] !== B[x] && !(JS && (platformOwned(x) || exeOnly(x, B[x], A[x])))) { ramDiff = x; break; }
  let pcmDiff = -1;
  if (JS) { const pa = a.o.pcm(), pb = b.o.pcm(); for (let x = 0; x < Math.max(pa.length, pb.length); x++) if (pa[x] !== pb[x]) { pcmDiff = x; break; } }
  const same = i === la.length && i === lb.length && ramDiff < 0 && pcmDiff < 0;
  if (process.env.SNAP) { const r = []; for (let x = 0x78000; x < 0x1fef00; x++) if (a.o.snap[x] !== b.o.snap[x] && !platformOwned(x) && !exeOnly(x, b.o.snap[x], a.o.snap[x])) r.push((0x80000000 + x).toString(16) + ":" + a.o.snap[x] + "/" + b.o.snap[x]); console.log("snap", JSON.stringify(r.slice(0, 60))); }
  if (process.env.RAMDIFF && ramDiff >= 0) { const r = []; for (let x = 0x78000; x < 0x1fef00; x++) if (A[x] !== B[x] && !platformOwned(x) && !exeOnly(x, B[x], A[x])) r.push(x); console.log(JSON.stringify(r.slice(0, 200).map((x) => (0x80000000 + x).toString(16)))); }
  if (!same) { bad++; console.log(JSON.stringify({ kind, id, writes: [la.length, lb.length], firstDiff: i, native: la[i], port: lb[i], ramDiff: ramDiff < 0 ? null : "0x" + (0x80000000 + ramDiff).toString(16), pcmDiff: pcmDiff < 0 ? null : pcmDiff })); }
}
if (JS) {
  console.log(JSON.stringify({ songs: songs.length, effects: effects.length, mismatches: bad, jsOnly: JS, sec: (Date.now() - t0) / 1000 }));
  if (process.env.DATA) console.log(JSON.stringify([...dataRead.keys()].sort((x, y) => x - y).map((x) => x.toString(16))));
} else console.log(JSON.stringify({ songs: songs.length, effects: effects.length, mismatches: bad, ported: usedNames.length, neverCalled: usedNames.filter((n) => !hit.has(n)), sec: (Date.now() - t0) / 1000 }));
