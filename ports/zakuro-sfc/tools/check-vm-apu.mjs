import { readFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
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
const instructionTrace = process.env.ZAKURO_VM_INSTRUCTION_TRACE
  ? createWriteStream(process.env.ZAKURO_VM_INSTRUCTION_TRACE) : null;
instructionTrace?.write('instruction\tmaster_cycle\tpc\topcode\n');
const milestones = {};
while (!mismatch && !vm.cpu.stopped && instructions < maxInstructions) {
  const pc = (vm.cpu.PB << 16) | vm.cpu.PC;
  if (instructionTrace && vm.bus.clock.master >= 25_000_000 && vm.bus.clock.master <= 73_000_000) {
    const opcode = vm.bus.readMapped(pc);
    instructionTrace.write(`${instructions}\t${vm.bus.clock.master}\t${pc.toString(16).padStart(6, '0')}\t${opcode.toString(16).padStart(2, '0')}\n`);
  }
  if (pc === 0x00938e && milestones.nmiEnable == null) milestones.nmiEnable = vm.bus.clock.master;
  if (pc === 0x009326 && milestones.state0 == null) milestones.state0 = vm.bus.clock.master;
  if (pc === 0x3086ca && milestones.iplUpload == null) milestones.iplUpload = vm.bus.clock.master;
  vm.step(); instructions++;
}
instructionTrace?.end();

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
