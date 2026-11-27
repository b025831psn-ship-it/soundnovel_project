// Usage: node tools/bench-ppu.mjs <rom> <apu-ports.tsv> <ipl.bin> [field] [iterations]
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { createApuLink, readInputTrace, renderFrame, ZakuroVM } from '../vm/index.js';

const [romPath, tracePath, iplPath, fieldText = '900', iterationText = '100'] = process.argv.slice(2);
const targetField = Number(fieldText), iterations = Number(iterationText);
const [rom, inputFrames, ipl, powerOnDsp] = await Promise.all([
  readFile(romPath), readInputTrace(join(dirname(tracePath), 'input.tsv')), readFile(iplPath),
  readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin')),
]);
const { link } = createApuLink({ ipl, powerOnDsp });
const vm = new ZakuroVM({ rom, masterLink: link, inputFrames });
vm.reset(); vm.skipRender = true;
while (!vm.cpu.stopped && vm.ppu.field < targetField) vm.step();
renderFrame(vm.ppu);
const started = performance.now();
for (let index = 0; index < iterations; index++) renderFrame(vm.ppu);
const elapsed = performance.now() - started;
console.log(JSON.stringify({ field: vm.ppu.field, mode: vm.ppu.io[0x105] & 7,
  iterations, elapsedMs: elapsed, msPerField: elapsed / iterations,
  decodedTiles: [vm.ppu.tileValid2, vm.ppu.tileValid4, vm.ppu.tileValid8]
    .reduce((sum, valid) => sum + valid.reduce((count, epoch) => count + (epoch === vm.ppu.tileEpoch), 0), 0),
  registers: Object.fromEntries([0x2100,0x2101,0x2105,0x2107,0x2108,0x2109,0x210a,
    0x210b,0x210c,0x2123,0x2124,0x2125,0x2126,0x2127,0x2128,0x2129,0x212a,
    0x212b,0x212c,0x212d,0x212e,0x212f,0x2130,0x2131,0x2132,0x2133]
    .map(address => [address.toString(16), vm.ppu.io[address - 0x2000]])) }, null, 2));
