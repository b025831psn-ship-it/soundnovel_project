// Replays the native checkpoint input schedule and writes VM RGB565 frames.
// Usage: node tools/capture-vm-checkpoints.mjs <program-dir> <apu-ports.tsv> <ipl.bin> <out-dir>
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createApuLink, readInputTrace, rgbaToRgb565, ZakuroVM } from '../vm/index.js';
import { readProgramData } from './program-data.mjs';

const [programDirectory, tracePath, iplPath, outputDirectory] = process.argv.slice(2);
const [program, inputFrames, ipl, powerOnDsp] = await Promise.all([
  readProgramData(programDirectory), readInputTrace(join(dirname(tracePath), 'input.tsv')),
  readFile(iplPath), readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin')),
]);
await mkdir(outputDirectory, { recursive: true });
const { link } = createApuLink({ ipl, powerOnDsp });
const vm = new ZakuroVM({ program, sram: program.sram, masterLink: link, inputFrames });
vm.reset(); vm.skipRender = true;
function field(mask = 0) {
  vm.setJoypad(mask); const before = vm.ppu.field;
  while (!vm.cpu.stopped && vm.ppu.field === before) vm.step();
}
function fields(count, mask = 0) { for (let index = 0; index < count; index++) field(mask); }
const hashes = {};
async function capture(label) {
  field();
  const bytes = rgbaToRgb565(vm.ppu.presentField(vm.ppu.field, vm.bus.clock.master, true));
  await writeFile(join(outputDirectory, `${label}.rgb565`), bytes);
  hashes[label] = createHash('sha256').update(bytes).digest('hex');
}
for (let step = 0; step < 28; step++) {
  if (step) fields(3, [1,3,6,8,10,12].includes(step) ? 0x1000 : 0x0080);
  fields(step ? 180 : 300);
  if (step === 10) await capture('opening');
  else if (step === 27) await capture('choice');
  else field();
}
const choiceState = structuredClone(vm.saveState());
for (const option of [1, 2]) {
  vm.loadState(structuredClone(choiceState));
  if (option === 2) { fields(3, 0x0400); fields(12); }
  fields(3, 0x0080); fields(180); await capture(`option-${option}`);
}
console.log(JSON.stringify(hashes, null, 2));
