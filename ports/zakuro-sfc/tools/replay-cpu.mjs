// Replays the CPU side of an emulator run (every $2140-$2143 access, in master clocks) into
// this APU and checks every CPU read against what the APU returns at that moment.
// Usage: node tools/replay-cpu.mjs <rom.sfc> <port-data> [--link | --map | --lead-spc n]
//   --link: through sound/master-link.js with this driver's LINK_TIMING (what the VM will use)
//   --ipl ipl.bin: run the real 64-byte IPL from power-on through the link (local file only)
//   <port-data>/trace/apu-ports.tsv : frame  master_cycle  dir(w|r)  port  value
//   <port-data>/sound/boot-dsp.bin  : power-on DSP registers of the same run
//   <port-data>/sound/boot-aram.bin : $F4-$F7 hold the port outputs the IPL left
// Master clocks become SPC clocks with the VM contract (15664/328125, see sound/master-link.js),
// or with the run's own per-frame clock-map.tsv when `--map` is given. Accesses before the
// driver's first instruction belong to the IPL transfer, which APU.boot() stands in for:
// their writes only set the port latches.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { APU } from '../sound/apu.js';
import { SPC_NUM, SPC_DEN, MasterLink } from '../sound/master-link.js';
import { APU_TIMING, LINK_TIMING, POWER_ON, checkRom, readBootRecords } from './rom.mjs';
import { parseTsv } from './replay-spc.mjs';

export function clockMapper(map) {
  const m = map.map(([, a, b]) => [Number(a), Number(b)]);
  let i = 0;
  return (master) => {
    while (i + 1 < m.length && m[i + 1][0] <= master) i++;
    const [a0, b0] = m[i], [a1, b1] = m[Math.min(i + 1, m.length - 1)];
    return a1 === a0 ? b0 : b0 + Math.floor(((master - a0) * (b1 - b0)) / (a1 - a0));
  };
}

export function replayCpu({ records, ports, toSpc, bootDsp = null, iplPorts = [0, 0xbb, 0, 0], lead = 0, timing = APU_TIMING, link = null, dsp = null, ipl = null }) {
  const apu = new APU();
  if (bootDsp) apu.dsp.regs.set(bootDsp);
  apu.cpu.dspAccessOffset = timing.dspAccessOffset;
  if (ipl) return replayFromPowerOn({ apu, ipl, ports, link, dsp });
  apu.boot(records, { iplClocks: timing.iplClocks, timerLead: timing.timerLead });
  apu.cpu.ram[0] = records.at(-1).dest & 0xff; apu.cpu.ram[1] = records.at(-1).dest >> 8;
  // The IPL leaves its outputs on the ports: $BB on port 1 (from its $BBAA greeting) and
  // its last echo on port 0. The driver does not touch port 1 until its first runtime
  // transfer, so the CPU still reads $BB there.
  iplPorts.forEach((v, i) => { apu.cpu.portOut[i] = v; });
  const entry = timing.iplClocks;
  // With `link`, accesses go through the VM link (master clock, port timing rules);
  // otherwise through `toSpc` with the APU stepped to each access.
  const dspGot = [];
  apu.cpu.onDspWrite = (t, r, v) => dspGot.push([t + timing.iplClocks, r, v]);
  const ml = link ? new MasterLink(apu, link === true ? LINK_TIMING : link) : null;
  if (ml) ml.target = -entry; // cpu.clock counts from the driver entry
  let reads = 0, writes = 0, mismatches = 0, first = null, skipped = 0;
  const bad = [];
  for (const [frame, master, dir, port, value] of ports) {
    const m = Number(master), t = toSpc(m) - entry, p = Number(port) & 3, v = parseInt(value, 16);
    if (t < 0) { if (dir === 'w') apu.cpuWrite(p, v); skipped++; if (ml) ml.advanceTo(m); continue; }
    if (dir === 'w') { if (ml) ml.write(m, p, v); else { while (apu.cpu.clock < t + lead) apu.cpu.step(); apu.cpuWrite(p, v); } writes++; continue; }
    reads++;
    let got;
    if (ml) got = ml.read(m, p); else { while (apu.cpu.clock < t + lead) apu.cpu.step(); got = apu.cpuRead(p); }
    if (got !== v) { mismatches++; if (bad.length < 5) bad.push({ frame: Number(frame), master: m, spc: t + entry, port: p, want: v, got }); }
  }
  first = bad[0] ?? null;
  let dspMatched = null;
  if (dsp) {
    const want = dsp.map(([t, r, v]) => [Number(t), parseInt(r, 16), parseInt(v, 16)]).filter(([t]) => t >= timing.iplClocks);
    // The log runs past the last CPU access; keep the APU going without input to its end.
    while (apu.cpu.clock + timing.iplClocks < want.at(-1)[0] + 16) apu.cpu.step();
    let i = 0; for (; i < want.length && i < dspGot.length; i++) if (want[i][1] !== dspGot[i][1] || want[i][2] !== dspGot[i][2]) break;
    dspMatched = { want: want.length, matched: i };
  }
  return { skipped, writes, reads, mismatches, first, bad, dsp: dspMatched };
}

// Runs the real IPL from power-on, every access through the VM link (what the VM does when
// the IPL image is supplied).
function replayFromPowerOn({ apu, ipl, ports, link, dsp }) {
  apu.cpu.loadIplImage(ipl);
  for (const t of apu.cpu.timers) t.phase = POWER_ON.timerPhase % t.period;
  apu.cpu.dspAccessOffset = POWER_ON.dspAccessOffset;
  const dspGot = [];
  apu.cpu.onDspWrite = (t, r, v) => dspGot.push([t, r, v]);
  const ml = new MasterLink(apu, link === true || !link ? LINK_TIMING : link);
  let reads = 0, writes = 0, mismatches = 0; const bad = [];
  for (const [frame, master, dir, port, value] of ports) {
    const m = Number(master), p = Number(port) & 3, v = parseInt(value, 16);
    if (dir === 'w') { ml.write(m, p, v); writes++; continue; }
    reads++;
    const got = ml.read(m, p);
    if (got !== v) { mismatches++; if (bad.length < 5) bad.push({ frame: Number(frame), master: m, port: p, want: v, got }); }
  }
  let dspMatched = null;
  if (dsp) {
    const want = dsp.map(([t, r, v]) => [Number(t), parseInt(r, 16), parseInt(v, 16)]);
    while (apu.cpu.clock < want.at(-1)[0] + 16) apu.cpu.step();
    let i = 0; for (; i < want.length && i < dspGot.length; i++) if (want[i][1] !== dspGot[i][1] || want[i][2] !== dspGot[i][2]) break;
    dspMatched = { want: want.length, matched: i };
  }
  return { skipped: 0, writes, reads, mismatches, first: bad[0] ?? null, bad, dsp: dspMatched };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const flag = (name) => { const i = args.indexOf(name); return i < 0 ? false : (args.splice(i, 1), true); };
  const opt = (name, d) => { const i = args.indexOf(name); return i < 0 ? d : args.splice(i, 2)[1]; };
  const iplPath = opt('--ipl', null);
  const useMap = flag('--map'), useLink = flag('--link'), lead = Number(opt('--lead-spc', 0));
  const [romPath, dataDir] = args;
  const rom = readFileSync(romPath); checkRom(rom);
  const read = (p) => readFileSync(path.join(dataDir, p));
  const toSpc = useMap ? clockMapper(parseTsv(read('trace/clock-map.tsv').toString()))
    : (master) => Math.floor((master * SPC_NUM) / SPC_DEN);
  const aram = read('sound/boot-aram.bin');
  const r = replayCpu({ records: readBootRecords(rom), ports: parseTsv(read('trace/apu-ports.tsv').toString()), toSpc, bootDsp: read('sound/boot-dsp.bin'), iplPorts: [...aram.subarray(0xf4, 0xf8)], lead, link: useLink, dsp: parseTsv(read('trace/dsp-writes.tsv').toString()),
    ipl: iplPath ? readFileSync(iplPath) : null });
  console.log(JSON.stringify(r));
  process.exitCode = r.mismatches ? 1 : 0;
}
