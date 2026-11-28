// Usage: node tools/oracle/render-song.mjs <dir with SLPS_017.94 + MUS.PAC> <song> [seconds] [out.wav]
// Plays one song through sound/module.js driving the ORIGINAL libsnd code (oracle) and writes
// a WAV + SPU register log to the given paths (keep them local; never commit).
import { readFileSync, writeFileSync } from "node:fs";
import { LibsndOracle } from "./libsnd-oracle.mjs";
import { SoundModule } from "../../sound/module.js";
import { readSoundTables } from "../../sound/container.js";
import { parseVabHead } from "../../sound/vab.js";

const [dir, songArg, secArg = "10", outPath] = process.argv.slice(2);
const exe = readFileSync(dir + "/SLPS_017.94");
export function pac(path) {
  const d = readFileSync(path); const e = [];
  for (let i = 0; ; i += 4) { const id = d.readUInt16LE(i), s = d.readUInt16LE(i + 2); if (id === 0xffff) { e.push({ end: s }); break; } e.push({ id, s }); }
  const m = new Map(); e.slice(0, -1).forEach((x, i) => m.set(x.id, d.subarray(x.s * 2048, (e[i + 1].s ?? e[i + 1].end) * 2048))); return m;
}
const mus = pac(dir + "/MUS.PAC");
const be = (b, o) => b.readUInt32BE(o);
const loadMember = (kind, id) => {
  if (kind !== "MUS") return null;
  const b = mus.get(id); if (!b) throw new Error("no MUS member " + id);
  const h0 = be(b, 0), b0 = be(b, 4), s0 = be(b, 8);
  const h = parseVabHead(b, h0);
  return { head: { fsize: h.size, bytes: b.subarray(h0, h0 + h.headSize) }, body: b.subarray(b0, b0 + h.bodySize), seq: b.subarray(s0, h0) };
};
const o = new LibsndOracle(exe);
const mod = new SoundModule(o.ss, readSoundTables(exe), { loadMember });
const t0 = Date.now();
mod.reset();
mod.playMusic(+songArg, 0);
const start = o.frames;
for (let f = 0; f < +secArg * 60; f++) { mod.vsync(); mod.frame(); o.frame(1); }
const pcm = o.pcm();
let peak = 0, nz = 0; for (const s of pcm) { const a = Math.abs(s); if (a > peak) peak = a; if (a > 64) nz++; }
const keyOns = o.log.filter((e) => e[1] === 0x188 || e[1] === 0x18a).length;
console.log(JSON.stringify({ song: +songArg, frames: o.frames, startFrame: start, samples: pcm.length / 2, peak, audible: nz, spuWrites: o.log.length, keyOnWrites: keyOns, insns: o.cpu.steps, ms: Date.now() - t0 }));
if (outPath) {
  const h = Buffer.alloc(44); const n = pcm.length * 2;
  h.write("RIFF", 0); h.writeUInt32LE(36 + n, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(44100, 24); h.writeUInt32LE(44100 * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(n, 40);
  writeFileSync(outPath, Buffer.concat([h, Buffer.from(pcm.buffer)]));
  writeFileSync(outPath + ".spu.json", JSON.stringify(o.log));
}
