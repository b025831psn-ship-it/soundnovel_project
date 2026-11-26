// Render one song of the cartridge's sound data to a WAV file (for checking the port by ear or tools).
// Usage: node render.mjs <port-data/sound dir> <song number> <seconds> <out.wav>
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { M4A, Memory } from './m4a.js';

const [dir, song, seconds, out] = process.argv.slice(2);
const cfg = JSON.parse(readFileSync(path.join(dir, 'm4a.json'), 'utf8'));
const engine = new M4A(new Memory(new Uint8Array(readFileSync(path.join(dir, 'm4a.bin'))), cfg.base), cfg);
engine.startSong(Number(song));
const frames = Math.ceil(Number(seconds) * 59.7275);
const pcm = new Int16Array(frames * cfg.samplesPerVBlank * 2);
let k = 0, peak = 0, sum = 0;
for (let f = 0; f < frames; f++) {
  const { r, l } = engine.vblank();
  for (let i = 0; i < r.length; i++) {
    const L = Math.max(-1, Math.min(1, l[i])), R = Math.max(-1, Math.min(1, r[i]));
    pcm[k++] = L * 32767; pcm[k++] = R * 32767;
    peak = Math.max(peak, Math.abs(L), Math.abs(R)); sum += L * L + R * R;
  }
}
const data = Buffer.from(pcm.buffer);
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(cfg.mixRate, 24);
h.writeUInt32LE(cfg.mixRate * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
writeFileSync(out, Buffer.concat([h, data]));
console.log(`song ${song}: ${frames} frames, peak ${peak.toFixed(3)}, rms ${Math.sqrt(sum / (k || 1)).toFixed(4)}, player ${engine.players.findIndex((p) => p.song === Number(song))}`);
