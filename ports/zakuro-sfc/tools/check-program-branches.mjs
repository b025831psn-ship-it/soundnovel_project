// Verifies the ROM-free complete image can leave the first choice on option 2.
// Usage: node tools/check-program-branches.mjs <program-dir> <apu-ports.tsv> <ipl.bin>
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createApuLink, readInputTrace, ZakuroVM } from '../vm/index.js';
import { readProgramData } from './program-data.mjs';

const [programDirectory, tracePath, iplPath] = process.argv.slice(2);
const [program, inputFrames, ipl, powerOnDsp] = await Promise.all([
  readProgramData(programDirectory), readInputTrace(join(dirname(tracePath), 'input.tsv')),
  readFile(iplPath), readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin')),
]);
const { link } = createApuLink({ ipl, powerOnDsp });
let readyField = null, phase = 0, stopField = Infinity, observedField = -1;
const vm = new ZakuroVM({ program, sram: program.sram, masterLink: link, inputFrames });
vm.reset(); vm.skipRender = true;
while (!vm.cpu.stopped && vm.ppu.field < stopField) {
  vm.step();
  const field = vm.ppu.field;
  if (field === observedField) continue;
  observedField = field;
  const touch = vm.getTouchState();
  if (readyField == null && touch.choice?.ready) {
    readyField = field; phase = 1; vm.setJoypad(0x0400); // Down
  } else if (phase === 1) { phase = 2; vm.setJoypad(0); }
  else if (phase === 2) { phase = 3; vm.setJoypad(0x0080); stopField = field + 240; } // A
}
if (readyField == null || vm.cpu.stopped) throw new Error('ROM-free branch replay did not complete');
console.log(JSON.stringify({ readyField, lastField: vm.ppu.field,
  pc: `${vm.cpu.PB.toString(16).padStart(2,'0')}:${vm.cpu.PC.toString(16).padStart(4,'0')}`,
  touch: vm.getTouchState() }, null, 2));
