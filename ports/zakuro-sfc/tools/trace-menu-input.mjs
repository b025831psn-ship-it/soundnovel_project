// Locates the native page-wait joypad dispatch without decoding dialogue.
// Usage: node tools/trace-menu-input.mjs <rom> <apu-ports.tsv> <ipl.bin> [field]
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createApuLink, readInputTrace, ZakuroVM } from '../vm/index.js';

const [romPath, tracePath, iplPath, fieldText = '2230'] = process.argv.slice(2);
const targetField = Number(fieldText);
const [rom, inputFrames, ipl, powerOnDsp] = await Promise.all([
  readFile(romPath), readInputTrace(join(dirname(tracePath), 'input.tsv')), readFile(iplPath),
  readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin')),
]);
inputFrames.fill(0, targetField);
const { link } = createApuLink({ ipl, powerOnDsp });
const reads = [], seen = new Set(); let vm;
vm = new ZakuroVM({ rom, masterLink: link, inputFrames, onJoypadRead(event) {
  if (vm.ppu.field < targetField || seen.has(`${vm.cpu.PB}:${vm.cpu.PC}:${event.address}`)) return;
  seen.add(`${vm.cpu.PB}:${vm.cpu.PC}:${event.address}`);
  const address = (vm.cpu.PB << 16) | vm.cpu.PC;
  reads.push({ field: vm.ppu.field, pc: `${vm.cpu.PB.toString(16).padStart(2,'0')}:${vm.cpu.PC.toString(16).padStart(4,'0')}`,
    register: event.address.toString(16), value: event.value,
    bytes: Array.from({ length: 8 }, (_, i) => vm.bus.readProgram(address >>> 16, ((address + i) & 0xffff))).map(v => v.toString(16).padStart(2,'0')).join('') });
} });
vm.reset(); vm.skipRender = true;
while (!vm.cpu.stopped && vm.ppu.field < targetField + 30) vm.step();
console.log(JSON.stringify({ targetField, reads }, null, 2));
