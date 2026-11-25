// Boots the Zakuro SPC driver and plays one music request through the real APUIO transfer
// protocol, then writes the S-DSP output as a WAV file.
// Usage: node tools/play-request.mjs <rom.sfc> <audio/manifest.json> <request> <seconds> [out.wav] [--gauss dsp-gauss.bin]
// The per-request `uploads` (ARAM ranges in upload order) and `.aram` images come from
// zakuro-sfc-kor tools/build_audio_images.py. Until the 65c816 VM drives the APU, the
// main-CPU side of $30:8383 is reproduced by tools/cpu-side.mjs. CPU-side timing is not
// modelled (the APU runs while the CPU polls), so this checks the SPC/DSP side only.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { APU, SAMPLE_RATE } from '../sound/apu.js';
import { checkRom, readBootRecords } from './rom.mjs';
import { CpuSide } from './cpu-side.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1]; };
const gaussPath = opt('--gauss');
const [romPath, manifestPath, request, seconds, outPath] = args;
const rom = readFileSync(romPath); checkRom(rom);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entry = manifest.images.find((e) => e.request === Number(request));
if (!entry) throw new Error(`request ${request} not in manifest`);
const image = readFileSync(path.join(path.dirname(manifestPath), entry.file));
const gauss = gaussPath ? new Int16Array(new Uint8Array(readFileSync(gaussPath)).buffer) : null;

const apu = new APU({ gauss });
apu.boot(readBootRecords(rom));
const cpu = new CpuSide(apu);
cpu.idle(0.1);
const t0 = apu.cpu.clock;
const ranges = entry.uploads.map((u) => ({ dest: u.aramDestination, bytes: image.subarray(u.aramDestination, u.aramDestination + u.length) }));
cpu.upload(ranges);
for (const r of ranges) {
  const got = Buffer.from(apu.cpu.ram.subarray(r.dest, r.dest + r.bytes.length));
  if (Buffer.compare(got, Buffer.from(r.bytes))) throw new Error(`ARAM $${r.dest.toString(16)} differs after transfer`);
}
const total = ranges.reduce((s, r) => s + r.bytes.length, 0);
console.log(`request ${entry.request}: ${ranges.length} ranges, ${total} bytes, transfer ${apu.cpu.clock - t0} SPC clocks, ARAM verified`);
apu.cpuWrite(0, manifest.runtimeProtocol?.startMusicPort0 ?? 1);
const pcm = apu.render(Math.round(Number(seconds) * SAMPLE_RATE));
let peak = 0, first = -1;
for (let i = 0; i < pcm.length; i++) {
  const a = Math.abs(pcm[i]);
  if (a > peak) peak = a;
  if (a && first < 0) first = i >> 1;
}
console.log(`peak ${peak}, first sound at ${first < 0 ? 'none' : (first / SAMPLE_RATE).toFixed(3) + ' s'}`);
if (outPath) writeFileSync(outPath, wav(pcm));

function wav(pcm) {
  const h = Buffer.alloc(44), n = pcm.length * 2;
  h.write('RIFF', 0); h.writeUInt32LE(36 + n, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SAMPLE_RATE, 24); h.writeUInt32LE(SAMPLE_RATE * 4, 28);
  h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(n, 40);
  return Buffer.concat([h, Buffer.from(pcm.buffer, pcm.byteOffset, n)]);
}
