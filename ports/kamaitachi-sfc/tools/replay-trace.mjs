// Replays an emulator APU-port log against this SPC700+S-DSP and compares DSP writes.
// Usage: node tools/replay-trace.mjs <rom.sfc> <apu-ports.tsv> <dsp-writes.tsv> [--master-hz 21477272]
//   apu-ports.tsv : frame  cpu_cycle  dir(w|r)  port  value   (cpu_cycle in master clocks)
//   dsp-writes.tsv: spc_cycle  reg  value                      (0 = IPL start)
// CPU writes are applied when the SPC clock reaches the converted time. CPU reads are
// checked against portOut at that time. DSP writes are compared in order by (reg, value);
// clock drift is reported separately.
import { readFileSync } from 'node:fs';
import { APU, SPC_CLOCK_HZ } from '../sound/apu.js';
import { readIplRecords } from './rom.mjs';

export function parseTsv(text) {
  return text.split('\n').filter((l) => l && !l.startsWith('#') && !/^[a-z_]+\t/i.test(l)).map((l) => l.split('\t'));
}

export function replay({ records, ports, dsp, masterHz = 21477272, apu = new APU() }) {
  const got = [];
  apu.cpu.onDspWrite = (t, r, v) => got.push([t, r, v]);
  apu.cpu.uploadRecords(records);
  const t0 = ports.length ? Number(ports[0][1]) : 0;
  const toSpc = (c) => Math.round(((Number(c) - t0) * SPC_CLOCK_HZ) / masterHz);
  const readMismatch = [];
  for (const [frame, cyc, dir, port, value] of ports) {
    const at = toSpc(cyc);
    while (apu.cpu.clock < at) apu.cpu.step();
    const p = Number(port) & 3, v = parseInt(value, 16);
    if (dir === 'w') apu.cpuWrite(p, v);
    else if (apu.cpuRead(p) !== v && readMismatch.length < 20) readMismatch.push({ frame, cyc, port: p, want: v, got: apu.cpuRead(p) });
  }
  const want = dsp.map(([t, r, v]) => [Number(t), parseInt(r, 16), parseInt(v, 16)]);
  while (got.length < want.length && apu.cpu.clock < (want.at(-1)?.[0] ?? 0) + SPC_CLOCK_HZ) apu.cpu.step();
  let firstDiff = -1, maxDrift = 0;
  for (let i = 0; i < want.length; i++) {
    const g = got[i];
    if (!g || g[1] !== want[i][1] || g[2] !== want[i][2]) { firstDiff = i; break; }
    maxDrift = Math.max(maxDrift, Math.abs(g[0] - want[i][0]));
  }
  return { dspWant: want.length, dspGot: got.length, firstDiff, maxDrift, readMismatch,
    context: firstDiff >= 0 ? { want: want.slice(Math.max(0, firstDiff - 3), firstDiff + 3), got: got.slice(Math.max(0, firstDiff - 3), firstDiff + 3) } : null };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [romPath, portsPath, dspPath, , hz] = process.argv.slice(2);
  const records = readIplRecords(readFileSync(romPath));
  const r = replay({ records, ports: parseTsv(readFileSync(portsPath, 'utf8')), dsp: parseTsv(readFileSync(dspPath, 'utf8')), masterHz: hz ? Number(hz) : undefined });
  console.log(JSON.stringify(r, null, 1));
  process.exitCode = r.firstDiff >= 0 || r.readMismatch.length ? 1 : 0;
}
