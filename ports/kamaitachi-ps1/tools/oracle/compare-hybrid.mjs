// Usage: node tools/oracle/compare-hybrid.mjs <dir> [seconds] [songs=1,2|all] [effects=ids|all|none] [only=name,..]
// Runs each song/effect twice through sound/module.js: original libsnd only, then with the
// JS routines from sound/lib swapped in. Reports the first SPU-write and RAM difference.
// RAMP=frame,up|down,amount,frames[,startVol] starts a crescendo/decrescendo on the song at that frame
// (the game itself only uses decrescendo, through stopMusic). TEMPO=frame,target,step,frames
// starts a tempo ramp by setting the fields directly (the EXE has no setter for it).
// UI=frame:n,frame:n.. plays UI sounds (SsUtKeyOn). STOP=frame,fade[,song] stops the music (fade frames, 0 = at once) and optionally starts another.
import { readFileSync } from "node:fs";
import { LibsndOracle } from "./libsnd-oracle.mjs";
import { attachHybrid } from "./hybrid.mjs";
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

function run(kind, id, hybrid) {
  const o = new LibsndOracle(exe);
  let used = [], hits = new Map();
  if (hybrid) ({ used, hits } = attachHybrid(o, { only }));
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
  const la = a.o.log, lb = b.o.log; let i = 0;
  while (i < la.length && i < lb.length && la[i].join() === lb[i].join()) i++;
  let ramDiff = -1;
  const A = a.o.cpu.ram, B = b.o.cpu.ram;
  for (let x = 0x78000; x < 0x1fef00; x++) if (A[x] !== B[x]) { ramDiff = x; break; }
  const same = i === la.length && i === lb.length && ramDiff < 0;
  if (!same) { bad++; console.log(JSON.stringify({ kind, id, writes: [la.length, lb.length], firstDiff: i, native: la[i], port: lb[i], ramDiff: ramDiff < 0 ? null : "0x" + (0x80000000 + ramDiff).toString(16) })); }
}
console.log(JSON.stringify({ songs: songs.length, effects: effects.length, mismatches: bad, ported: usedNames.length, neverCalled: usedNames.filter((n) => !hit.has(n)), sec: (Date.now() - t0) / 1000 }));
