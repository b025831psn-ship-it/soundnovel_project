#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SfcBus } from '../bus.js';
import { Cpu65816 } from '../cpu.js';

const [
  romPath, apuModulePath, outputPath, targetArg = '5700',
  limitArg = '200000000', iplPath = '', joypadPath = '', snapshotDir = '',
  semanticSnapshotRowArg = '-1', watchWramArg = '', probePcArg = '',
] = process.argv.slice(2);
if (!romPath || !apuModulePath || !outputPath) throw new Error(
  'usage: trace-apu.mjs ROM.sfc APU-MODULE output.tsv [target-frame] [instruction-limit] [spc-ipl.bin] [joypad.tsv] [snapshot-dir] [semantic-row] [watch-wram-hex-csv] [probe-pc-hex-csv]',
);

const { APU } = await import(pathToFileURL(apuModulePath));
const apu = new APU();
if (iplPath) apu.cpu.loadIplImage(fs.readFileSync(iplPath));
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
output.write('frame\tcpu_cycle\tdir(w/r)\tport\tvalue\n');
let frame = 0;
let inVblank = false;
let pendingNmiAt = Infinity;
let cpu;
const semanticSnapshotRow = Number(semanticSnapshotRowArg);
let semanticRows = 0;
const lastApuRead = [null, null, null, null];
let semanticSnapshot = null;
const saveSnapshot = (label) => {
  if (!snapshotDir) return;
  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.writeFileSync(`${snapshotDir}/vm-wram-${label}.bin`, bus.wram);
  fs.writeFileSync(`${snapshotDir}/vm-vram-${label}.bin`, bus.vram);
};
const bus = new SfcBus(fs.readFileSync(romPath), {
  apu,
  eventLimit: 0,
  apuTraceLimit: 0,
  onApuAccess: (event) => {
    output.write(`${frame}\t${event.masterCycle}\t${event.direction}\t${event.port}\t${event.value.toString(16).padStart(2, '0').toUpperCase()}\n`);
    const semantic = event.direction === 'w' || lastApuRead[event.port] !== event.value;
    if (event.direction === 'r') lastApuRead[event.port] = event.value;
    if (!semantic) return;
    if (semanticRows === semanticSnapshotRow) {
      saveSnapshot(`semantic-${semanticRows}`);
      semanticSnapshot = { row: semanticRows, frame, masterCycle: event.masterCycle,
        direction: event.direction, port: event.port, value: event.value, pc: cpu?.address() ?? null };
    }
    semanticRows++;
  },
  onNmiEnable: (master) => {
    if (inVblank) pendingNmiAt = Math.min(pendingNmiAt, master + 12);
  },
});
cpu = new Cpu65816(bus, { traceLimit: 0 });
const targetFrame = Number(targetArg);
const instructionLimit = Number(limitArg);
let nextFrame = 1_368;
let nextNmi = 306_904;
let frameLength = 357_368;
let e1xxInstructions = 0;
const frameStats = {};
const parseHexCsv = (text) => text ? text.split(',').map((value) => Number.parseInt(value, 16)) : [];
const watchedWram = parseHexCsv(watchWramArg);
const probePcs = new Set(parseHexCsv(probePcArg));
const watchedValues = new Map(watchedWram.map((address) => [address, bus.wram[address]]));
const watchedWriters = new Map();
const pcProbes = [];

let failure = null;
try {
  for (let index = 0; index < instructionLimit && frame < targetFrame; index++) {
    const instructionAddress = cpu.address();
    if (probePcs.has(instructionAddress)) pcProbes.push({ frame, pc: instructionAddress,
      a: cpu.a, x: cpu.x, y: cpu.y, dbr: cpu.dbr, p: cpu.p });
    cpu.step();
    for (const address of watchedWram) {
      if (bus.wram[address] === watchedValues.get(address)) continue;
      watchedValues.set(address, bus.wram[address]);
      watchedWriters.set(address, { frame, pc: instructionAddress, value: bus.wram[address] });
    }
    if (cpu.pbr === 0x02 && (cpu.pc & 0xff00) === 0xe100) e1xxInstructions++;
    while (cpu.masterCycle >= nextFrame) {
      frame++;
      if (frame === 95 || frame === 209) {
        saveSnapshot(`frame-${frame}`);
        frameStats[frame] = { executed: cpu.executed, masterCycle: cpu.masterCycle, e1xxInstructions,
          watchedWriters: Object.fromEntries([...watchedWriters].map(([address, writer]) =>
            [`0x${address.toString(16).padStart(4, '0')}`, writer])),
        };
      }
      inVblank = false;
      nextFrame += frameLength;
      frameLength = frameLength === 357_368 ? 357_360 : 357_368;
    }
    while (cpu.masterCycle >= nextNmi) {
      inVblank = true;
      const buttons = joypadPath ? (joypad.get(frame) ?? 0)
        : (frame > 300 && frame % 90 < 2 ? 0x0080 : 0);
      bus.setController1(buttons);
      if (bus.io[0x4200 - 0x2000] & 0x80) cpu.nmi();
      nextNmi += frameLength;
    }
    if (cpu.masterCycle >= pendingNmiAt) {
      pendingNmiAt = Infinity;
      cpu.nmi();
    }
  }
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
}

await new Promise((resolve, reject) => output.end((error) => error ? reject(error) : resolve()));
console.log(JSON.stringify({
  frame, executed: cpu.executed, masterCycle: cpu.masterCycle,
  apuAccesses: bus.apuAccessCount, address: cpu.address(), failure,
  semanticRows, semanticSnapshot, frameStats, e1xxInstructions, pcProbes,
}, null, 2));
if (failure) process.exitCode = 1;
