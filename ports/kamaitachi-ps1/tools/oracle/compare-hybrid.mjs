// Usage: node tools/oracle/compare-hybrid.mjs <dir> [seconds] [songs=1,2|all] [effects=ids|all|none] [only=name,..]
// Runs each song/effect twice through sound/module.js: original libsnd only, then with the
// JS routines from sound/lib swapped in. Reports the first SPU-write and RAM difference.
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
const mus = pac(dir + "/MUS.PAC"), vce = pac(dir + "/VCE.PAC");
const be = (b, o) => b.readUInt32BE(o);
const musMember = (b) => { const h0 = be(b, 0), b0 = be(b, 4), s0 = be(b, 8); const h = parseVabHead(b, h0); return { head: { fsize: h.size, bytes: b.subarray(h0, h0 + h.headSize) }, body: b.subarray(b0, b0 + h.bodySize), seq: b.subarray(s0, h0) }; };
const vceMember = (b) => { const p = vceParts(b); const h = parseVabHead(p.head.bytes, 0); return { head: { fsize: h.size, bytes: p.head.bytes }, body: p.body.bytes, script: p.script.bytes }; };
const only = onlyArg ? onlyArg.split(",") : undefined;
const frames = +secArg * 60;

function run(kind, id, hybrid) {
  const o = new LibsndOracle(exe);
  let used = [];
  if (hybrid) used = attachHybrid(o, { only }).used;
  const mod = new SoundModule(o.ss, tables, { loadMember: (k, i) => k === "MUS" ? musMember(mus.get(i)) : null });
  mod.reset();
  if (kind === "song") mod.playMusic(id, 0); else mod.startEffect(1000 + id, 0, 0, vceMember(vce.get(id)));
  for (let f = 0; f < frames; f++) { mod.vsync(); mod.frame(); o.frame(1); }
  return { o, used };
}
const ids = (arg, all) => arg === "none" ? [] : arg === "all" ? all : arg.split(",").map(Number);
const songs = ids(songsArg, [...mus.keys()].filter((id) => !tables.musicSilence.includes(id) && id < tables.songs.length));
const effects = ids(fxArg, [...vce.keys()]);
let bad = 0, usedNames;
const t0 = Date.now();
for (const [kind, list] of [["song", songs], ["effect", effects]]) for (const id of list) {
  const a = run(kind, id, false), b = run(kind, id, true); usedNames = b.used;
  const la = a.o.log, lb = b.o.log; let i = 0;
  while (i < la.length && i < lb.length && la[i].join() === lb[i].join()) i++;
  let ramDiff = -1;
  const A = a.o.cpu.ram, B = b.o.cpu.ram;
  for (let x = 0x78000; x < 0x1fef00; x++) if (A[x] !== B[x]) { ramDiff = x; break; }
  const same = i === la.length && i === lb.length && ramDiff < 0;
  if (!same) { bad++; console.log(JSON.stringify({ kind, id, writes: [la.length, lb.length], firstDiff: i, native: la[i], port: lb[i], ramDiff: ramDiff < 0 ? null : "0x" + (0x80000000 + ramDiff).toString(16) })); }
}
console.log(JSON.stringify({ songs: songs.length, effects: effects.length, mismatches: bad, ported: usedNames, sec: (Date.now() - t0) / 1000 }));
