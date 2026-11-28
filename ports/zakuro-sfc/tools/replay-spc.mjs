// Replays the SPC-side port log of an emulator run against this SPC700+S-DSP and compares,
// in SPC clocks: boot ARAM/DSP, the SPC's own port writes, DSP register writes, and PCM.
// Usage: node tools/replay-spc.mjs <rom.sfc> <port-data> [--gauss dsp-gauss.bin] [--entry 1223778] [--pcm-first 679996] [--lead 4]
//   <port-data>/trace/spc-ports.tsv : spc_cycle  dir(w|r)  port  value
//   <port-data>/trace/dsp-writes.tsv: spc_cycle  reg  value
//   <port-data>/trace/audio-f0040-f1000.pcm and its first-sample cycle (--pcm-first)
// Port inputs are applied `--lead` clocks before the logged read, which is a bus-access time.
//   <port-data>/sound/boot-aram.bin, boot-dsp.bin: state when the driver runs its first
//   instruction at `--entry` (SPC cycle from power-on).
// All cycles count from power-on. The high-level IPL upload stands in for the IPL ROM, so
// this core starts at the driver entry with APU.boot({ iplClocks: entry }).
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { APU } from '../sound/apu.js';
import { APU_TIMING, checkRom, readBootRecords } from './rom.mjs';

export const parseTsv = (text) => text.split('\n').filter((l) => l && !/^[a-z_]/i.test(l)).map((l) => l.split('\t'));

export function replaySpc({ records, spcPorts, dsp, entry, gauss = null, pcm = null, pcmFirst = 0, lead = 4, bootAram = null, bootDsp = null, pcmShift = 0, timerLead = APU_TIMING.timerLead, dspAccessOffset = APU_TIMING.dspAccessOffset }) {
  const apu = new APU({ gauss });
  const dspGot = [], portGot = [], out = [], outClk = [];
  apu.cpu.onDspWrite = (t, r, v) => dspGot.push([t + entry, r, v]);
  apu.cpu.onPortWrite = (t, p, v) => portGot.push([t + entry, p, v]);
  // DSP registers are undefined at power-on and the IPL never writes them, so the reference
  // run's values at the driver entry are its power-on values. They must be in place while
  // the DSP free-runs through the IPL stage: EDL decides when the echo offset wraps.
  if (bootDsp) apu.dsp.regs.set(bootDsp);
  apu.cpu.dspAccessOffset = dspAccessOffset;
  apu.boot(records, { iplClocks: entry, timerLead });
  // The IPL leaves its last destination pointer at $00-$01.
  apu.cpu.ram[0] = records.at(-1).dest & 0xff; apu.cpu.ram[1] = records.at(-1).dest >> 8;
  let bootDiff = null;
  if (bootAram) {
    const d = []; for (let i = 0; i < 0x10000; i++) if (apu.cpu.ram[i] !== bootAram[i] && !(i >= 0xf0 && i <= 0xff)) d.push(i);
    bootDiff = { count: d.length, first: d.slice(0, 8).map((a) => a.toString(16)) };
  }
  if (pcm) apu.dsp.onSample = (l, r) => { out.push(l, r); outClk.push(apu.cpu.clock + entry); };

  const want = dsp.map(([t, r, v]) => [Number(t), parseInt(r, 16), parseInt(v, 16)]).filter(([t]) => t >= entry);
  const inputs = [], portWant = [];
  for (const [t, dir, p, v] of spcPorts) {
    const at = Number(t); if (at < entry) continue;
    (dir === 'r' ? inputs : portWant).push([at, Number(p) & 3, parseInt(v, 16)]);
  }
  const pcmEnd = pcm ? pcmFirst + (pcm.length / 2) * 32 + 64 : 0;
  const end = Math.max(want.at(-1)?.[0] ?? 0, portWant.at(-1)?.[0] ?? 0, pcmEnd) + 1000;
  let k = 0;
  while (apu.cpu.clock + entry < end) {
    while (k < inputs.length && inputs[k][0] - lead <= apu.cpu.clock + entry) { apu.cpuWrite(inputs[k][1], inputs[k][2]); k++; }
    apu.cpu.step();
  }

  const cmp = (a, b) => {
    let i = 0, maxDrift = 0;
    for (; i < a.length; i++) {
      if (!b[i] || a[i][1] !== b[i][1] || a[i][2] !== b[i][2]) break;
      maxDrift = Math.max(maxDrift, Math.abs(a[i][0] - b[i][0]));
    }
    const hex = (x) => x.map((e) => [e[0], e[1].toString(16), e[2].toString(16)]);
    const ctx = i < a.length ? { want: hex(a.slice(Math.max(0, i - 3), i + 4)), got: hex(b.slice(Math.max(0, i - 3), i + 4)) } : null;
    return { want: a.length, got: b.length, matched: i, maxDrift, ctx };
  };
  const result = { entry, bootDiff, ports: cmp(portWant, portGot), dsp: cmp(want, dspGot) };
  if (pcm) {
    // Reference sample i is at pcmFirst + 32*i. Samples before this core starts (the IPL
    // stage) are compared as silence. `pcmShift` moves the reference by whole samples.
    const n = pcm.length / 2, base = Math.round((outClk[0] - pcmFirst) / 32) + pcmShift;
    let equal = 0, maxErr = 0; const bad = [];
    for (let i = 0; i < n; i++) for (let ch = 0; ch < 2; ch++) {
      const j = i - base, mine = j < 0 ? 0 : (out[j * 2 + ch] ?? 0);
      const d = Math.abs(mine - pcm[i * 2 + ch]);
      if (!d) equal++; else { if (bad.length < 10) bad.push(i); if (d > maxErr) maxErr = d; }
    }
    result.pcm = { frames: n, coreStartsAtSample: base, phase: outClk[0] - pcmFirst - base * 32, equalValues: equal, totalValues: n * 2, maxErr, firstBad: bad };
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (name, d = null) => { const i = args.indexOf(name); return i < 0 ? d : args.splice(i, 2)[1]; };
  const gaussPath = opt('--gauss'), entry = Number(opt('--entry', APU_TIMING.iplClocks)), pcmFirst = Number(opt('--pcm-first', 679996)), pcmShift = Number(opt('--pcm-shift', 0));
  const [romPath, dataDir] = args;
  const rom = readFileSync(romPath); checkRom(rom);
  const read = (p) => readFileSync(path.join(dataDir, p));
  const g = gaussPath ? readFileSync(gaussPath) : null;
  const pcmPath = path.join(dataDir, 'trace/audio-f0040-f1000.pcm');
  const p = g && existsSync(pcmPath) ? readFileSync(pcmPath) : null;
  const r = replaySpc({
    records: readBootRecords(rom), entry, lead: Number(opt('--lead', 4)),
    spcPorts: parseTsv(read('trace/spc-ports.tsv').toString()), dsp: parseTsv(read('trace/dsp-writes.tsv').toString()),
    bootAram: read('sound/boot-aram.bin'), bootDsp: read('sound/boot-dsp.bin'),
    gauss: g && new Int16Array(g.buffer, g.byteOffset, 512),
    pcm: p && new Int16Array(p.buffer, p.byteOffset, p.length / 2), pcmFirst, pcmShift,
  });
  console.log(JSON.stringify(r, null, 1));
  const ok = r.ports.matched === r.ports.want && r.dsp.matched === r.dsp.want && (!r.pcm || r.pcm.equalValues === r.pcm.totalValues);
  process.exitCode = ok ? 0 : 1;
}
