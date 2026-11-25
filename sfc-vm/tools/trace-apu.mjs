#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SfcBus } from '../bus.js';
import { Cpu65816 } from '../cpu.js';

const [
  romPath, apuModulePath, outputPath, targetArg = '5700',
  limitArg = '200000000', iplPath = '',
] = process.argv.slice(2);
if (!romPath || !apuModulePath || !outputPath) throw new Error(
  'usage: trace-apu.mjs ROM.sfc APU-MODULE output.tsv [target-frame] [instruction-limit] [spc-ipl.bin]',
);

const { APU } = await import(pathToFileURL(apuModulePath));
const apu = new APU();
if (iplPath) apu.cpu.loadIplImage(fs.readFileSync(iplPath));
const output = fs.createWriteStream(outputPath);
output.write('frame\tcpu_cycle\tdir(w/r)\tport\tvalue\n');
let frame = 0;
const bus = new SfcBus(fs.readFileSync(romPath), {
  apu,
  eventLimit: 0,
  apuTraceLimit: 0,
  onApuAccess: (event) => output.write(
    `${frame}\t${event.masterCycle}\t${event.direction}\t${event.port}\t${event.value.toString(16).padStart(2, '0').toUpperCase()}\n`,
  ),
});
const cpu = new Cpu65816(bus, { traceLimit: 0 });
const targetFrame = Number(targetArg);
const instructionLimit = Number(limitArg);
let nextFrame = 1_368;
let nextNmi = 306_904;
let frameLength = 357_368;

for (let index = 0; index < instructionLimit && frame < targetFrame; index++) {
  cpu.step();
  while (cpu.masterCycle >= nextFrame) {
    frame++;
    nextFrame += frameLength;
    frameLength = frameLength === 357_368 ? 357_360 : 357_368;
  }
  while (cpu.masterCycle >= nextNmi) {
    const buttons = frame > 300 && frame % 90 < 2 ? 0x0080 : 0;
    bus.setController1(buttons);
    if (bus.io[0x4200 - 0x2000] & 0x80) cpu.nmi();
    nextNmi += frameLength;
  }
}

await new Promise((resolve, reject) => output.end((error) => error ? reject(error) : resolve()));
console.log(JSON.stringify({
  frame, executed: cpu.executed, masterCycle: cpu.masterCycle,
  apuAccesses: bus.apuAccessCount, address: cpu.address(),
}, null, 2));
