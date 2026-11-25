import { readFile } from 'node:fs/promises';
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { finished } from 'node:stream/promises';
import { dirname, join } from 'node:path';
import { ApuTraceComparator, createApuLink, readApuPorts, readInputTrace, scanlineTiming, ZakuroVM } from '../vm/index.js';
import { readProgramData } from './program-data.mjs';
import { readBootRecords } from './rom.mjs';

const [romPath, tracePath, iplPath] = process.argv.slice(2);
if (!romPath || !tracePath) {
  console.error('usage: node tools/check-vm-apu.mjs ROM apu-ports.tsv [private/ipl.bin]');
  process.exit(2);
}

const useProgramData = romPath.endsWith('.json') || romPath.endsWith('program');
const [image, reference, ipl, inputFrames, powerOnDsp] = await Promise.all([
  useProgramData ? readProgramData(romPath.endsWith('.json') ? dirname(romPath) : romPath) : readFile(romPath),
  readApuPorts(tracePath), iplPath ? readFile(iplPath) : null,
  readInputTrace(join(dirname(tracePath), 'input.tsv')),
  readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin')),
]);
const comparator = new ApuTraceComparator(reference);
const bootRecords = !ipl && !useProgramData ? readBootRecords(image) : null;
const { apu, link, bootMode } = createApuLink({ ipl, powerOnDsp, bootRecords });
let mismatch = null;
const firstDeltas = [];
const accessTrace = process.env.ZAKURO_VM_ACCESS_TRACE
  ? createWriteStream(process.env.ZAKURO_VM_ACCESS_TRACE) : null;
accessTrace?.write('master_cycle\tdir\tport\tvalue\n');
const spcTrace = process.env.ZAKURO_VM_SPC_TRACE
  ? createWriteStream(process.env.ZAKURO_VM_SPC_TRACE) : null;
spcTrace?.write('spc_cycle\teffective_cycle\topcode\tport\tvalue\n');
if (spcTrace) apu.cpu.onPortWrite = (clock, port, value) => {
  const opcode = apu.cpu.curOp;
  spcTrace.write(`${clock}\t${clock + (link.writeLag[opcode] || link.readLag)}\t${opcode.toString(16).padStart(2, '0')}\t${port}\t${value.toString(16).padStart(2, '0')}\n`);
};
const vm = new ZakuroVM({
  ...(useProgramData ? { program: image } : { rom: image }),
  inputFrames,
  masterLink: link,
  trace(access) {
    accessTrace?.write(`${access.master}\t${access.dir}\t${access.port}\t${access.value.toString(16).padStart(2, '0')}\n`);
    if (mismatch) return;
    try {
      const delta = comparator.observe(access);
      if (firstDeltas.length < 32) firstDeltas.push(delta);
    } catch (error) { mismatch = error; }
  },
});
vm.reset();

const stateTrace = process.env.ZAKURO_VM_STATE_TRACE
  ? createWriteStream(process.env.ZAKURO_VM_STATE_TRACE) : null;
const nmiTrace = process.env.ZAKURO_VM_NMI_TRACE
  ? createWriteStream(process.env.ZAKURO_VM_NMI_TRACE) : null;
stateTrace?.write('field\tmaster_cycle\tpc\tvalue\tinside_nmi\n');
nmiTrace?.write('field\tmaster_cycle\tpc\n');
let insideNmi = false;
const wramNmiDir = process.env.ZAKURO_VM_WRAM_NMI_DIR;
const wramNmiFirst = Number(process.env.ZAKURO_VM_WRAM_NMI_FIRST ?? 395);
const wramNmiLast = Number(process.env.ZAKURO_VM_WRAM_NMI_LAST ?? 404);
const dumpedWramFields = new Set();
if (wramNmiDir) mkdirSync(wramNmiDir, { recursive: true });
const wramWriteTrace = process.env.ZAKURO_VM_WRAM_WRITE_TRACE
  ? createWriteStream(process.env.ZAKURO_VM_WRAM_WRITE_TRACE) : null;
const watchedWram = new Set((process.env.ZAKURO_VM_WRAM_WATCH ?? '').split(',').filter(Boolean).map((v) => Number.parseInt(v, 16)));
wramWriteTrace?.write('field\tmaster_cycle\taddress\tpc\tvalue\tinside_nmi\n');
const dmaTrace = process.env.ZAKURO_VM_DMA_TRACE
  ? createWriteStream(process.env.ZAKURO_VM_DMA_TRACE) : null;
dmaTrace?.write('field\tstart_master\tend_master\tmask\tchannels\tbytes\tinside_nmi\n');
vm.bus.onDma = (dma) => {
  const field = scanlineTiming(dma.startMaster).field;
  dmaTrace?.write(`${field}\t${dma.startMaster}\t${dma.endMaster}\t${dma.mask.toString(16).padStart(2, '0')}\t${dma.channels}\t${dma.bytes}\t${insideNmi ? 1 : 0}\n`);
};
vm.cpu.onNmi = () => {
  insideNmi = true;
  const field = scanlineTiming(vm.bus.clock.master).field;
  const pc = (vm.cpu.PB << 16) | vm.cpu.PC;
  if (wramNmiDir && field >= wramNmiFirst && field <= wramNmiLast && !dumpedWramFields.has(field)) {
    writeFileSync(join(wramNmiDir, `wram-nmi-${field}.bin`), vm.bus.wram);
    dumpedWramFields.add(field);
  }
  if (nmiTrace && field >= 71 && field <= 404) {
    nmiTrace.write(`${field}\t${vm.bus.clock.master}\t${pc.toString(16).padStart(6, '0')}\n`);
  }
};
if (stateTrace || wramWriteTrace) {
  const busWrite = vm.bus.write.bind(vm.bus);
  vm.bus.write = (address, value) => {
    busWrite(address, value);
    const target = address & 0xffffff;
    const field = scanlineTiming(vm.bus.clock.master).field;
    const bank = target >>> 16;
    const wramOffset = bank === 0x7e || bank === 0x7f ? target & 0x1ffff
      : ((bank & 0x40) === 0 && (target & 0xffff) < 0x2000 ? target & 0xffff : -1);
    if (wramWriteTrace && watchedWram.has(wramOffset)) {
      const pc = (vm.cpu._opPB << 16) | vm.cpu._opPC;
      wramWriteTrace.write(`${field}\t${vm.bus.clock.master}\t${target.toString(16).padStart(6, '0')}\t${pc.toString(16).padStart(6, '0')}\t${(value & 0xff).toString(16).padStart(2, '0')}\t${insideNmi ? 1 : 0}\n`);
    }
    if (stateTrace && ((((bank & 0x40) === 0) && (target & 0xffff) === 0x01ec) || target === 0x7e01ec)) {
      const pc = (vm.cpu._opPB << 16) | vm.cpu._opPC;
      stateTrace.write(`${field}\t${vm.bus.clock.master}\t${pc.toString(16).padStart(6, '0')}\t${(value & 0xff).toString(16).padStart(2, '0')}\t${insideNmi ? 1 : 0}\n`);
    }
  };
}

const maxInstructions = Number(process.env.ZAKURO_VM_MAX_INSTRUCTIONS ?? 20_000_000);
const stopMaster = Number(process.env.ZAKURO_VM_STOP_MASTER ?? Number.MAX_SAFE_INTEGER);
const keepRunning = process.env.ZAKURO_VM_KEEP_RUNNING === '1';
let instructions = 0;
const instructionTrace = process.env.ZAKURO_VM_INSTRUCTION_TRACE
  ? createWriteStream(process.env.ZAKURO_VM_INSTRUCTION_TRACE) : null;
const instructionTraceStart = Number(process.env.ZAKURO_VM_TRACE_START ?? 25_000_000);
const instructionTraceEnd = Number(process.env.ZAKURO_VM_TRACE_END ?? 73_000_000);
instructionTrace?.write('instruction\tmaster_cycle\tpc\topcode\n');
const milestones = {};
while ((!mismatch || keepRunning) && !vm.cpu.stopped && instructions < maxInstructions
  && vm.bus.clock.master < stopMaster) {
  const pc = (vm.cpu.PB << 16) | vm.cpu.PC;
  const opcode = vm.bus.readMapped(pc);
  if (instructionTrace && vm.bus.clock.master >= instructionTraceStart && vm.bus.clock.master <= instructionTraceEnd) {
    instructionTrace.write(`${instructions}\t${vm.bus.clock.master}\t${pc.toString(16).padStart(6, '0')}\t${opcode.toString(16).padStart(2, '0')}\n`);
  }
  if (pc === 0x00938e && milestones.nmiEnable == null) milestones.nmiEnable = vm.bus.clock.master;
  if (pc === 0x009326 && milestones.state0 == null) milestones.state0 = vm.bus.clock.master;
  if (pc === 0x3086ca && milestones.iplUpload == null) milestones.iplUpload = vm.bus.clock.master;
  vm.step(); instructions++;
  if (insideNmi && opcode === 0x40) insideNmi = false;
}
instructionTrace?.end();
stateTrace?.end();
nmiTrace?.end();
accessTrace?.end();
spcTrace?.end();
wramWriteTrace?.end();
dmaTrace?.end();
await Promise.all([instructionTrace, stateTrace, nmiTrace, accessTrace, spcTrace, wramWriteTrace, dmaTrace].filter(Boolean).map(stream => finished(stream)));

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
