// Replays the SPC-side port log (what the SPC700 saw on $F4-$F7 and when) and compares
// this SPC700+S-DSP's own port writes and DSP writes with the emulator, in SPC clocks.
// Usage: node tools/replay-spc.mjs <rom.sfc> <spc-ports.tsv> <dsp-writes.tsv>
//   spc-ports.tsv : spc_cycle  dir(w|r)  port  value  (r = first SPC cycle a new value was seen)
//   dsp-writes.tsv: spc_cycle  reg  value
// Both logs count from IPL start. The high-level upload starts this core at the driver
// entry, so the clock offset is fixed by the driver's first DSP write, which comes before
// any port input.
import { readFileSync } from 'node:fs';
import { APU } from '../sound/apu.js';
import { readIplRecords } from './rom.mjs';
import { parseTsv } from './replay-trace.mjs';

export function replaySpc({ records, spcPorts, dsp, apu = new APU(), lead = 1 }) {
  const dspGot = [], portGot = [];
  apu.cpu.onDspWrite = (t, r, v) => dspGot.push([t, r, v]);
  apu.cpu.onPortWrite = (t, p, v) => portGot.push([t, p, v]);
  apu.boot(records);
  while (!dspGot.length) apu.cpu.step();
  const offset = Number(dsp[0][0]) - dspGot[0][0];

  const want = dsp.map(([t, r, v]) => [Number(t) - offset, parseInt(r, 16), parseInt(v, 16)]);
  const inputs = [], portWant = [];
  for (const [t, dir, p, v] of spcPorts) {
    const at = Number(t) - offset; if (at < 0) continue;
    (dir === 'r' ? inputs : portWant).push([at, Number(p) & 3, parseInt(v, 16)]);
  }
  const end = Math.max(want.at(-1)?.[0] ?? 0, portWant.at(-1)?.[0] ?? 0) + 1000;
  let k = 0;
  while (apu.cpu.clock < end) {
    while (k < inputs.length && inputs[k][0] - lead <= apu.cpu.clock) { apu.cpuWrite(inputs[k][1], inputs[k][2]); k++; }
    apu.cpu.step();
  }

  const cmp = (a, b) => {
    let i = 0, maxDrift = 0;
    for (; i < a.length; i++) {
      if (!b[i] || a[i][1] !== b[i][1] || a[i][2] !== b[i][2]) break;
      maxDrift = Math.max(maxDrift, Math.abs(a[i][0] - b[i][0]));
    }
    const ctx = i < a.length ? { want: a.slice(Math.max(0, i - 3), i + 4), got: b.slice(Math.max(0, i - 3), i + 4) } : null;
    return { want: a.length, got: b.length, matched: i, maxDrift, ctx };
  };
  const portsDsp = portWant.filter(([t]) => t >= 0);
  return { offset, ports: cmp(portsDsp, portGot.filter(([t]) => t >= 0)), dsp: cmp(want, dspGot) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [romPath, portsPath, dspPath] = process.argv.slice(2);
  const r = replaySpc({ records: readIplRecords(readFileSync(romPath)),
    spcPorts: parseTsv(readFileSync(portsPath, 'utf8')), dsp: parseTsv(readFileSync(dspPath, 'utf8')) });
  const hex = (x) => x && x.map((e) => [e[0], e[1].toString(16), e[2].toString(16)]);
  for (const k of ['ports', 'dsp']) if (r[k].ctx) r[k].ctx = { want: hex(r[k].ctx.want), got: hex(r[k].ctx.got) };
  console.log(JSON.stringify(r));
  process.exitCode = r.ports.matched < r.ports.want || r.dsp.matched < r.dsp.want ? 1 : 0;
}
