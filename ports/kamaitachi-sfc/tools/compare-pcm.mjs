// Compares this APU's S-DSP output with an emulator PCM capture, sample for sample.
// Usage: node tools/compare-pcm.mjs <rom.sfc> <spc-ports.tsv> <dsp-gauss.bin> <audio.pcm> <first_sample_spc_cycle>
//   audio.pcm: 32 kHz stereo s16le, before any resampler. Cycles count from IPL start.
// SPC-side port inputs are replayed at their logged SPC cycles; the boot uses APU.boot()
// with the IPL duration taken from the driver's first DSP write in the same run.
import { readFileSync } from 'node:fs';
import { APU } from '../sound/apu.js';
import { readIplRecords } from './rom.mjs';
import { parseTsv } from './replay-trace.mjs';

export function comparePcm({ records, spcPorts, gauss, ref, firstCycle, iplClocks = 621677 }) {
  const apu = new APU({ gauss });
  const out = []; const clk = [];
  apu.dsp.onSample = (l, r) => { out.push(l, r); clk.push(apu.cpu.clock); };
  apu.boot(records, { iplClocks });
  const inputs = spcPorts.filter((r) => r[1] === 'r').map(([t, , p, v]) => [Number(t) - iplClocks, Number(p) & 3, parseInt(v, 16)]).filter((r) => r[0] >= 0);
  const n = ref.length / 2, first = firstCycle - iplClocks;
  const end = first + n * 32 + 64;
  let k = 0;
  while (apu.cpu.clock < end) {
    while (k < inputs.length && inputs[k][0] - 1 <= apu.cpu.clock) { apu.cpuWrite(inputs[k][1], inputs[k][2]); k++; }
    apu.cpu.step();
  }
  const s = clk.findIndex((c) => c >= first);
  let equal = 0, maxErr = 0; const bad = [];
  for (let i = 0; i < n; i++) for (let ch = 0; ch < 2; ch++) {
    const d = Math.abs((out[(s + i) * 2 + ch] ?? 0) - ref[i * 2 + ch]);
    if (!d) equal++; else { if (bad.length < 20) bad.push(i); if (d > maxErr) maxErr = d; }
  }
  return { frames: n, equalValues: equal, totalValues: n * 2, maxErr, firstBad: bad };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [romPath, portsPath, gaussPath, pcmPath, first] = process.argv.slice(2);
  const g = readFileSync(gaussPath), p = readFileSync(pcmPath);
  const r = comparePcm({ records: readIplRecords(readFileSync(romPath)), spcPorts: parseTsv(readFileSync(portsPath, 'utf8')),
    gauss: new Int16Array(g.buffer, g.byteOffset, 512), ref: new Int16Array(p.buffer, p.byteOffset, p.length / 2), firstCycle: Number(first) });
  console.log(JSON.stringify(r));
  process.exitCode = r.equalValues === r.totalValues ? 0 : 1;
}
