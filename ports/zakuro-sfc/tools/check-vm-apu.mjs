import { readFile } from 'node:fs/promises';
import { ApuTraceComparator, createApuLink, readApuPorts, ZakuroVM } from '../vm/index.js';

const [romPath, tracePath, iplPath] = process.argv.slice(2);
if (!romPath || !tracePath) {
  console.error('usage: node tools/check-vm-apu.mjs ROM apu-ports.tsv [private/ipl.bin]');
  process.exit(2);
}

const [rom, reference, ipl] = await Promise.all([
  readFile(romPath), readApuPorts(tracePath), iplPath ? readFile(iplPath) : null,
]);
const comparator = new ApuTraceComparator(reference);
const { link, bootMode } = createApuLink({ rom, ipl });
let mismatch = null;
const vm = new ZakuroVM({
  rom,
  masterLink: link,
  trace(access) {
    if (mismatch) return;
    try { comparator.observe(access); } catch (error) { mismatch = error; }
  },
});
vm.reset();

const maxInstructions = Number(process.env.ZAKURO_VM_MAX_INSTRUCTIONS ?? 20_000_000);
let instructions = 0;
while (!mismatch && !vm.cpu.stopped && instructions < maxInstructions) { vm.step(); instructions++; }

const result = {
  instructions,
  matchedRows: comparator.index,
  totalRows: reference.length,
  maxMasterDelta: comparator.maxMasterDelta,
  master: vm.bus.clock.master,
  pc: `${vm.cpu.PB.toString(16).padStart(2, '0')}:${vm.cpu.PC.toString(16).padStart(4, '0')}`,
  mismatch: mismatch?.message ?? null,
  bootMode,
};
console.log(JSON.stringify(result, null, 2));
if (mismatch) process.exitCode = 1;
