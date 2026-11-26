// Usage: node tools/oracle/run-all-oracle.mjs <dir with SLPS_017.94, MUS.PAC, VCE.PAC> [seconds]
// Every song and every effect through sound/module.js + the original libsnd (oracle).
// Prints counts only (no audio is written).
import { readFileSync } from "node:fs";
import { LibsndOracle } from "./libsnd-oracle.mjs";
import { SoundModule } from "../../sound/module.js";
import { readSoundTables, vceParts } from "../../sound/container.js";
import { parseVabHead } from "../../sound/vab.js";

const [dir, secArg = "30"] = process.argv.slice(2);
const exe = readFileSync(dir + "/SLPS_017.94");
const tables = readSoundTables(exe);
function pac(path) {
  const d = readFileSync(path); const e = [];
  for (let i = 0; ; i += 4) { const id = d.readUInt16LE(i), s = d.readUInt16LE(i + 2); if (id === 0xffff) { e.push({ end: s }); break; } e.push({ id, s }); }
  const m = new Map(); e.slice(0, -1).forEach((x, i) => m.set(x.id, d.subarray(x.s * 2048, (e[i + 1].s ?? e[i + 1].end) * 2048))); return m;
}
const mus = pac(dir + "/MUS.PAC"), vce = pac(dir + "/VCE.PAC");
const be = (b, o) => b.readUInt32BE(o);
export function musMember(b) {
  const h0 = be(b, 0), b0 = be(b, 4), s0 = be(b, 8); const h = parseVabHead(b, h0);
  return { head: { fsize: h.size, bytes: b.subarray(h0, h0 + h.headSize) }, body: b.subarray(b0, b0 + h.bodySize), seq: b.subarray(s0, h0) };
}
export function vceMember(b) {
  const p = vceParts(b); const h = parseVabHead(p.head.bytes, 0);
  return { head: { fsize: h.size, bytes: p.head.bytes }, body: p.body.bytes, script: p.script.bytes };
}
const stats = (o, from) => { let peak = 0, loud = 0; for (const blk of o.out.slice(from)) for (const s of blk) { const a = Math.abs(s); if (a > peak) peak = a; if (a > 256) loud++; } return { peak, loud }; };
const frames = +secArg * 60;
const res = { songs: [], effects: [], errors: [] };
const fresh = () => { const o = new LibsndOracle(exe); const mod = new SoundModule(o.ss, tables, { loadMember: (k, id) => k === "MUS" ? musMember(mus.get(id)) : null }); mod.reset(); return { o, mod }; };
const t0 = Date.now();
for (const [id] of mus) {
  if (tables.musicSilence.includes(id) || id >= tables.songs.length) continue;
  try {
    const { o, mod } = fresh(); mod.playMusic(id, 0); const from = o.out.length;
    for (let f = 0; f < frames; f++) { mod.vsync(); mod.frame(); o.frame(1); }
    res.songs.push({ id, ...stats(o, from), keyOns: o.log.filter((e) => e[1] === 0x188 && e[2]).length, playing: mod.music.playing });
  } catch (e) { res.errors.push({ song: id, err: e.message }); }
}
for (const [id, b] of vce) {
  try {
    const { o, mod } = fresh(); const from = o.out.length;
    if (!mod.startEffect(1000 + id, 0, 0, vceMember(b))) { res.errors.push({ effect: id, err: "start failed" }); continue; }
    let f = 0; for (; f < frames && mod.active[0]; f++) { mod.vsync(); mod.frame(); o.frame(1); }
    res.effects.push({ id, frames: f, ended: !mod.active[0], ...stats(o, from) });
  } catch (e) { res.errors.push({ effect: id, err: e.message }); }
}
const silentSongs = res.songs.filter((s) => s.peak < 512).map((s) => s.id);
const silentFx = res.effects.filter((s) => s.peak < 512).map((s) => s.id);
console.log(JSON.stringify({ songs: res.songs.length, silentSongs, effects: res.effects.length, silentEffects: silentFx.length, silentFxIds: silentFx.slice(0, 30), loopingFx: res.effects.filter((e) => !e.ended).length, errors: res.errors.slice(0, 10), nErrors: res.errors.length, sec: (Date.now() - t0) / 1000 }));
