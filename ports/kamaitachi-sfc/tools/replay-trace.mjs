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

// Index of the CPU write that ends the IPL transfer (the port-0 write after the last
// `$2142/$2143 = 00 02` pair before the driver's "Chun" handshake). The high-level upload
// stands in for everything up to and including that row.
export function findIplEnd(ports) {
  let pairAt = -1;
  for (let i = 0; i < ports.length; i++) {
    const [, , dir, port, value] = ports[i];
    if (dir !== 'w') continue;
    if (port === '3' && value === '02' && i > 0 && ports[i - 1][3] === '2' && ports[i - 1][4] === '00') pairAt = i;
    if (port === '1' && value === '68' && i > 0 && ports[i - 1][3] === '0' && ports[i - 1][4] === '43') break;
  }
  if (pairAt < 0) return -1;
  for (let i = pairAt + 1; i < ports.length; i++) if (ports[i][2] === 'w' && ports[i][3] === '0') return i;
  return -1;
}

export function replay({ records, ports, dsp, masterHz = 21477272, apu = new APU(), start = null, syncLimit = 8192, progress = false, keep = null, calibrate = true }) {
  const got = [];
  apu.cpu.onDspWrite = (t, r, v) => got.push([t, r, v]);
  apu.cpu.uploadRecords(records);
  const s0 = start ?? Math.max(0, findIplEnd(ports));
  apu.cpu.portOut[0] = parseInt(ports[s0]?.[4] ?? '0', 16); // IPL echoes the final port-0 value before jumping
  const s = start ?? Math.max(0, findIplEnd(ports));
  const m0 = ports.length ? Number(ports[s][1]) : 0;
  // SPC clocks per master clock. The emulator's APU clock is not exactly 1.024 MHz against
  // its master clock, so when a DSP log covers the same span the ratio is taken from it.
  let ratio = SPC_CLOCK_HZ / masterHz;
  if (calibrate && dsp.length > 1 && ports.length > s + 1) {
    ratio = (Number(dsp.at(-1)[0]) - Number(dsp[0][0])) / (Number(ports.at(-1)[1]) - m0);
  }
  const toSpc = (c) => Math.floor((Number(c) - m0) * ratio);
  const readMismatch = []; let reads = 0, writes = 0, syncs = 0, maxLag = 0, mismatches = 0;
  let base = 0; const failed = [-1, -1, -1, -1]; const lastSeen = [...apu.cpu.portOut];
  for (let i = s + 1; i < ports.length; i++) {
    const [frame, cyc, dir, port, value] = ports[i];
    if (progress && i % 200000 === 0) console.error(i, frame, apu.cpu.clock, syncs, mismatches, got.length);
    const at = toSpc(cyc) + base;
    while (apu.cpu.clock < at) apu.cpu.step();
    const p = Number(port) & 3, v = parseInt(value, 16);
    if (dir === 'w') { apu.cpuWrite(p, v); writes++; }
    else {
      reads++;
      // The CPU polls until the SPC answers, so a read showing a new value is a sync
      // point: run the SPC (bounded) until it produces that value and record the lag.
      // Repeated polls of an unchanged value are not checked: this SPC may answer earlier.
      const changed = v !== lastSeen[p]; lastSeen[p] = v;
      if (changed && apu.cpuRead(p) !== v) {
        const from = apu.cpu.clock;
        while (apu.cpuRead(p) !== v && apu.cpu.clock - from < syncLimit) apu.cpu.step();
        const lag = apu.cpu.clock - from;
        const changed = v !== lastSeen[p]; lastSeen[p] = v;
      if (changed && apu.cpuRead(p) !== v) { if (readMismatch.length < 20) readMismatch.push({ row: i + 2, frame, cyc, port: p, want: v, got: apu.cpuRead(p) }); mismatches++; }
        else { failed[p] = -1; syncs++; maxLag = Math.max(maxLag, lag); base += lag; }
      }
    }
  }
  const want = dsp.map(([t, r, v]) => [Number(t), parseInt(r, 16), parseInt(v, 16)]);
  // Align clocks on the first DSP write; report drift after that.
  const offset = want.length && got.length ? want[0][0] - got[0][0] : 0;
  let firstDiff = -1, maxDrift = 0, matched = 0;
  for (let i = 0; i < want.length; i++) {
    const g = got[i];
    if (!g || g[1] !== want[i][1] || g[2] !== want[i][2]) { firstDiff = i; break; }
    matched++; maxDrift = Math.max(maxDrift, Math.abs(g[0] + offset - want[i][0]));
  }
  // Per-register comparison: each register's value sequence with repeated equal writes
  // collapsed. Tolerates interleaving shifts between timer-driven and command-driven writes.
  const perReg = (list) => {
    const m = new Map();
    for (const [t, r, v] of list) { const a = m.get(r) ?? []; if (!a.length || a.at(-1)[1] !== v) a.push([t, v]); m.set(r, a); }
    return m;
  };
  const pw = perReg(want), pg = perReg(got); const regDiff = [];
  for (const [r, a] of pw) {
    const b = pg.get(r) ?? [];
    let k = 0; while (k < a.length && k < b.length && a[k][1] === b[k][1]) k++;
    if (k < a.length) regDiff.push({ reg: r.toString(16), index: k, of: a.length, wantAt: a[k][0], want: a[k][1].toString(16), got: b[k]?.[1]?.toString(16) ?? null, gotAt: b[k]?.[0] ?? null });
  }
  regDiff.sort((x, y) => x.wantAt - y.wantAt);
  const hex = (r) => r && [r[0], r[1].toString(16), r[2].toString(16)];
  if (keep) keep.got = got;
  return { start: s, spcPerMaster: ratio, writes, reads, syncs, maxLag, readMismatchCount: mismatches, readMismatch,
    dspWant: want.length, dspGot: got.length, regsCompared: pw.size, regDiffCount: regDiff.length, regDiff: regDiff.slice(0, 12), matched, firstDiff, clockOffset: offset, maxDrift,
    context: firstDiff >= 0 ? { want: want.slice(Math.max(0, firstDiff - 3), firstDiff + 3).map(hex), got: got.slice(Math.max(0, firstDiff - 3), firstDiff + 3).map(hex) } : null };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [romPath, portsPath, dspPath, , hz] = process.argv.slice(2);
  const records = readIplRecords(readFileSync(romPath));
  const r = replay({ records, ports: parseTsv(readFileSync(portsPath, 'utf8')), dsp: parseTsv(readFileSync(dspPath, 'utf8')), masterHz: hz ? Number(hz) : undefined, progress: !!process.env.PROGRESS });
  console.log(JSON.stringify(r, null, 1));
  process.exitCode = r.firstDiff >= 0 || r.readMismatch.length ? 1 : 0;
}
