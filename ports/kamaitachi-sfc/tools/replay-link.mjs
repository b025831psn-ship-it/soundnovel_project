// Drives the APU through sound/master-link.js with the emulator's CPU-side APU log
// (apu-ports.tsv, master clock from reset) and checks every CPU read against the log.
// This verifies the VM contract itself: no calibration, no waiting on read values.
// Usage: node tools/replay-link.mjs <rom.sfc> <apu-ports.tsv> <dsp-writes.tsv>
// The high-level upload starts at the driver entry; the SPC clock origin is fixed by the
// driver's first DSP write (as in replay-spc.mjs), so link time = master * 15664/328125.
import { readFileSync } from 'node:fs';
import { APU } from '../sound/apu.js';
import { MasterLink } from '../sound/master-link.js';
import { readIplRecords } from './rom.mjs';
import { parseTsv, findIplEnd } from './replay-trace.mjs';

export function replayLink({ records, ports, dsp, apu = new APU(), progress = false, portLog = null, lags = {} }) {
  let first = null;
  if (portLog) apu.cpu.onPortWrite = (t, p, v) => portLog.push([t, p, v]);
  apu.cpu.onDspWrite = (t) => { if (first === null) first = t; };
  apu.boot(records);
  while (first === null) apu.cpu.step();
  const offset = Number(dsp[0][0]) - first; // emulator SPC clock = this clock + offset
  const link = new MasterLink(apu, lags);
  link.master = 0; link.rem = 0; link.target = -offset;
  const s = findIplEnd(ports);
  // The IPL echoes the final port-0 value a few clocks before it jumps to the driver
  // (Snes9x: 16 clocks); until then the CPU still sees the previous echo.
  let prev = s - 1; while (prev >= 0 && !(ports[prev][2] === 'w' && ports[prev][3] === '0')) prev--;
  apu.cpu.portOut[0] = parseInt(ports[prev][4], 16);
  const echoAt = -16, echo = parseInt(ports[s][4], 16); let echoed = false;
  let reads = 0, bad = 0, firstBad = null;
  for (let i = s + 1; i < ports.length; i++) {
    const [frame, master, dir, port, value] = ports[i];
    const m = Number(master), p = Number(port), v = parseInt(value, 16);
    if (!echoed && Math.floor(m * 15664 / 328125) - offset >= echoAt) { apu.cpu.portOut[0] = echo; echoed = true; }
    if (dir === 'w') { link.write(m, p, v); continue; }
    reads++;
    const got = link.read(m, p);
    if (got !== v) { bad++; firstBad ??= { row: i, frame: Number(frame), master: m, port: p, want: v, got }; }
    if (progress && i % 500000 === 0) console.error(`${i}/${ports.length} bad=${bad}`);
  }
  return { offset, reads, bad, firstBad };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [rom, portsPath, dspPath] = process.argv.slice(2);
  const r = replayLink({
    records: readIplRecords(readFileSync(rom)),
    ports: parseTsv(readFileSync(portsPath, 'utf8')),
    dsp: parseTsv(readFileSync(dspPath, 'utf8')),
    progress: !!process.env.PROGRESS, lags: process.env.LAGS ? JSON.parse(process.env.LAGS) : {},
  });
  console.log(JSON.stringify(r));
}
