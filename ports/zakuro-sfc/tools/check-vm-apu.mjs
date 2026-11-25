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
const firstDeltas = [];
const vm = new ZakuroVM({
  rom,
  masterLink: link,
  trace(access) {
    if (mismatch) return;
    try {
      const delta = comparator.observe(access);
      if (firstDeltas.length < 32) firstDeltas.push(delta);
    } catch (error) { mismatch = error; }
  },
});
vm.reset();

const maxInstructions = Number(process.env.ZAKURO_VM_MAX_INSTRUCTIONS ?? 20_000_000);
let instructions = 0;
const milestones = {};
while (!mismatch && !vm.cpu.stopped && instructions < maxInstructions) {
  const pc = (vm.cpu.PB << 16) | vm.cpu.PC;
  if (pc === 0x00938e && milestones.nmiEnable == null) milestones.nmiEnable = vm.bus.clock.master;
  if (pc === 0x009326 && milestones.state0 == null) milestones.state0 = vm.bus.clock.master;
  if (pc === 0x3086ca && milestones.iplUpload == null) milestones.iplUpload = vm.bus.clock.master;
  vm.step(); instructions++;
}

const result = {
  instructions,
  matchedRows: comparator.index,
  totalRows: reference.length,
  maxMasterDelta: comparator.maxMasterDelta,
  master: vm.bus.clock.master,
  pc: `${vm.cpu.PB.toString(16).padStart(2, '0')}:${vm.cpu.PC.toString(16).padStart(4, '0')}`,
  mismatch: mismatch?.message ?? null,
  bootMode,
  dmaBytes: vm.bus.dmaBytes,
  dmaMasterCycles: vm.bus.dmaMasterCycles,
  dmaTransfers: vm.bus.dmaTransfers,
  dmaChannels: vm.bus.dmaChannels,
  firstDeltas,
  milestones,
  hdmaEvents: vm.bus.hdmaEvents,
  cpuCycles: vm.cpu.cycles,
  busAccesses: vm.bus.accessCount,
};
console.log(JSON.stringify(result, null, 2));
if (mismatch) process.exitCode = 1;
