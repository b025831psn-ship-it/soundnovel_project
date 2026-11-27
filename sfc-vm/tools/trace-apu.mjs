#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SfcMachine } from '../machine.js';

const [
  romPath, apuModulePath, outputPath, targetArg = '5700',
  limitArg = '200000000', iplPath = '', joypadPath = '', snapshotDir = '',
  semanticSnapshotRowArg = '-1', watchWramArg = '', probePcArg = '',
  instructionTracePath = '', instructionTraceStartArg = 'Infinity', instructionTraceEndArg = '-1',
  spcPortTracePath = '', dspTracePath = '', wramFillArg = '00',
] = process.argv.slice(2);
if (!romPath || !apuModulePath || !outputPath) throw new Error(
  'usage: trace-apu.mjs ROM.sfc APU-MODULE output.tsv [target-frame] [instruction-limit] [spc-ipl.bin] [joypad.tsv] [snapshot-dir] [semantic-row] [watch-wram-hex-csv] [probe-pc-hex-csv] [instruction-trace.tsv] [trace-start-master] [trace-end-master] [spc-port-trace.tsv] [dsp-trace.tsv] [wram-fill-hex]',
);

const { APU } = await import(pathToFileURL(apuModulePath));
const spcPortTrace = [], dspTrace = [];
const apu = new APU({
  onPortWrite: (clock, port, value) => spcPortTrace.push([clock, port, value]),
  // DSP reference traces use the external SPC clock origin.  The core starts
  // CORE_DELAY clocks later, so callbacks from the core need that delay added
  // (the same contract used by replay-link.mjs).
  onDspWrite: (clock, reg, value) => dspTrace.push([clock + (APU.CORE_DELAY ?? 0), reg, value]),
});
apu.powerOn(iplPath ? fs.readFileSync(iplPath) : null);
const joypad = new Map();
if (joypadPath) {
  for (const line of fs.readFileSync(joypadPath, 'utf8').trim().split('\n').slice(1)) {
    const [frameText, , addressText, valueText] = line.split('\t');
    const frame = Number(frameText), address = Number.parseInt(addressText, 16);
    if (address !== 0x4218 && address !== 0x4219) continue;
    const shift = address === 0x4218 ? 0 : 8;
    joypad.set(frame, (joypad.get(frame) ?? 0) | (Number.parseInt(valueText, 16) << shift));
  }
}
const output = fs.createWriteStream(outputPath);
output.write('frame\tcpu_cycle\tdir(w/r)\tport\tvalue\tpc\topcode\n');
let machine;
const semanticSnapshotRow = Number(semanticSnapshotRowArg);
let semanticRows = 0;
const lastApuRead = [null, null, null, null];
let semanticSnapshot = null;
const saveSnapshot = (label) => {
  if (!snapshotDir) return;
  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.writeFileSync(`${snapshotDir}/vm-wram-${label}.bin`, machine.bus.wram);
  fs.writeFileSync(`${snapshotDir}/vm-vram-${label}.bin`, machine.bus.vram);
};
const joypadAtFrame = (frame) => joypadPath ? (joypad.get(frame) ?? 0)
  : (frame > 300 && frame % 90 < 2 ? 0x0080 : 0);
machine = new SfcMachine({
  rom: fs.readFileSync(romPath),
  apu,
  joypad: joypadAtFrame,
  busOptions: {
    eventLimit: 0,
    apuTraceLimit: 0,
    wramInitialValue: Number.parseInt(wramFillArg, 16),
    onApuAccess: (event) => {
      const ins = machine?.cpu.currentInstruction;
      output.write(`${machine.frame}\t${event.masterCycle}\t${event.direction}\t${event.port}\t${event.value.toString(16).padStart(2, '0').toUpperCase()}\t${ins ? ins.address.toString(16).padStart(6, '0').toUpperCase() : ''}\t${ins ? ins.opcode.toString(16).padStart(2, '0').toUpperCase() : ''}\n`);
      const semantic = event.direction === 'w' || lastApuRead[event.port] !== event.value;
      if (event.direction === 'r') lastApuRead[event.port] = event.value;
      if (!semantic) return;
      if (semanticRows === semanticSnapshotRow) {
        saveSnapshot(`semantic-${semanticRows}`);
        semanticSnapshot = { row: semanticRows, frame: machine.frame, masterCycle: event.masterCycle,
          direction: event.direction, port: event.port, value: event.value, pc: machine?.cpu.address() ?? null };
      }
      semanticRows++;
    },
  },
  cpuOptions: { traceLimit: 0 },
  onFrame: (frame) => {
    if (frame === 95 || frame === 209) {
      saveSnapshot(`frame-${frame}`);
      frameStats[frame] = { executed: machine.cpu.executed, masterCycle: machine.master, e1xxInstructions,
        watchedWriters: Object.fromEntries([...watchedWriters].map(([address, writer]) =>
          [`0x${address.toString(16).padStart(4, '0')}`, writer])),
      };
    }
  },
  onNmi: (frame) => {
    if (nmiSnapshotFrames.has(frame) && !savedNmiFrames.has(frame)) {
      saveSnapshot(`nmi-frame-${frame}`); savedNmiFrames.add(frame);
    }
  },
  onInstruction: (instructionAddress) => {
    for (const address of watchedWram) {
      if (machine.bus.wram[address] === watchedValues.get(address)) continue;
      watchedValues.set(address, machine.bus.wram[address]);
      watchedWriters.set(address, { frame: machine.frame, pc: instructionAddress,
        value: machine.bus.wram[address] });
    }
    if (machine.cpu.pbr === 0x02 && (machine.cpu.pc & 0xff00) === 0xe100) e1xxInstructions++;
  },
});
const { bus, cpu } = machine;
const targetFrame = Number(targetArg);
const instructionLimit = Number(limitArg);
let e1xxInstructions = 0;
const frameStats = {};
const parseHexCsv = (text) => text ? text.split(',').map((value) => Number.parseInt(value, 16)) : [];
const watchedWram = parseHexCsv(watchWramArg);
const probePcs = new Set(parseHexCsv(probePcArg));
const watchedValues = new Map(watchedWram.map((address) => [address, bus.wram[address]]));
const watchedWriters = new Map();
const pcProbes = [];
const pcDistribution = {};
const distributionFrames = new Set([94, 95, 96, 97, 98, 99, 100, 205, 206, 207, 208, 209, 210]);
const nmiSnapshotFrames = new Set([94, 95, 96, 97, 98, 99, 100]);
const savedNmiFrames = new Set();
const instructionTraceStart = Number(instructionTraceStartArg);
const instructionTraceEnd = Number(instructionTraceEndArg);
const instructionTrace = [];

let failure = null;
try {
  for (let index = 0; index < instructionLimit && machine.frame < targetFrame; index++) {
    const instructionAddress = cpu.address();
    if (distributionFrames.has(machine.frame)) {
      const stat = pcDistribution[machine.frame] ??= { total: 0, decompress: 0, e1xx: 0, dbE0: 0, scheduler: 0, other: 0 };
      stat.total++;
      if (instructionAddress >= 0x029a00 && instructionAddress <= 0x029fff) stat.decompress++;
      else if (instructionAddress >= 0x02e100 && instructionAddress <= 0x02e1ff) stat.e1xx++;
      else if (instructionAddress >= 0x02db00 && instructionAddress <= 0x02e0ff) stat.dbE0++;
      else if (instructionAddress >= 0x008000 && instructionAddress <= 0x008fff) stat.scheduler++;
      else stat.other++;
    }
    if (cpu.masterCycle >= instructionTraceStart && cpu.masterCycle <= instructionTraceEnd)
      instructionTrace.push([cpu.masterCycle, machine.frame, instructionAddress, bus.read8(instructionAddress),
        cpu.a, cpu.x, cpu.y, cpu.s, cpu.d, cpu.dbr, cpu.p].join('\t'));
    if (probePcs.has(instructionAddress)) pcProbes.push({ masterCycle: cpu.masterCycle, frame: machine.frame, pc: instructionAddress,
      a: cpu.a, x: cpu.x, y: cpu.y, dbr: cpu.dbr, p: cpu.p });
    machine.step();
  }
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
}

await new Promise((resolve, reject) => output.end((error) => error ? reject(error) : resolve()));
if (instructionTracePath) fs.writeFileSync(instructionTracePath,
  `master\tframe\tpc\topcode\ta\tx\ty\ts\td\tdbr\tp\n${instructionTrace.join('\n')}\n`);
if (spcPortTracePath) fs.writeFileSync(spcPortTracePath,
  `spc_cycle\tdir(w/r)\tport\tvalue\n${spcPortTrace.map(([c, p, v]) =>
    `${c}\tw\t${p}\t${v.toString(16).padStart(2, '0').toUpperCase()}`).join('\n')}\n`);
if (dspTracePath) fs.writeFileSync(dspTracePath,
  `spc_cycle\treg\tvalue\n${dspTrace.map(([c, r, v]) =>
    `${c}\t${r.toString(16).padStart(2, '0').toUpperCase()}\t${v.toString(16).padStart(2, '0').toUpperCase()}`).join('\n')}\n`);
console.log(JSON.stringify({
  frame: machine.frame, executed: cpu.executed, masterCycle: cpu.masterCycle,
  apuAccesses: bus.apuAccessCount, address: cpu.address(), failure,
  semanticRows, semanticSnapshot, frameStats, e1xxInstructions, pcProbes, pcDistribution,
}, null, 2));
if (failure) process.exitCode = 1;
