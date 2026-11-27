// Per frame: VM NMI entry point (interrupted PC, offset from VBlank) and the delta of the first 3088d4 read.
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [vmDir, romPath, tracePath, iplPath, stopRow = '600000', fromFrame = '395'] = process.argv.slice(2);
const { createApuLink, readApuPorts, readInputTrace, ZakuroVM } = await import(pathToFileURL(resolve(vmDir, 'vm/index.js')));
const { vblankBoundary, vblankOrdinal } = await import(pathToFileURL(resolve(vmDir, 'vm/master-clock.js')));
const [rom, ref, ipl, inputFrames, powerOnDsp] = await Promise.all([readFile(romPath), readApuPorts(tracePath), readFile(iplPath),
  readInputTrace(join(dirname(tracePath), 'input.tsv')), readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin'))]);
const { link } = createApuLink({ ipl, powerOnDsp });
const got = []; const nmis = [];
const vm = new ZakuroVM({ rom, masterLink: link, inputFrames, trace(a) { got.push({ ...a, pc: (vm.cpu.PB << 16) | vm.cpu.PC }); } });
const orig = vm.cpu.nmi.bind(vm.cpu);
let lastPc = 0, lastOp = 0, lastStart = 0;
vm.cpu.nmi = () => { const m = vm.bus.clock.master, v = vblankOrdinal(m); nmis.push({ v, off: m - vblankBoundary(v), pc: vm.cpu.PB << 16 | vm.cpu.PC, lastPc, lastOp, lastLen: m - lastStart, row: got.length }); orig(); };
vm.reset();
while (got.length < Number(stopRow) && !vm.cpu.stopped) { lastPc = vm.cpu.PB << 16 | vm.cpu.PC; lastOp = vm.bus.readMapped(lastPc); lastStart = vm.bus.clock.master; vm.step(); }
for (const n of nmis) {
  if (n.v < Number(fromFrame)) continue;
  const g = got[n.row], r = ref[n.row];
  if (!g || !r) break;
  console.log(`v${n.v} entry+${n.off} intr ${n.pc.toString(16)} last ${n.lastPc.toString(16)} op ${n.lastOp.toString(16)} (${n.lastLen})  row#${n.row + 1} ${g.dir}${g.port} pc ${g.pc.toString(16)} delta ${g.master - r.master}  refOff ${r.master - vblankBoundary(n.v)}`);
}
