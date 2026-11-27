// Verifies a real ROM-free choice fork repeats APUIO rows and frame hashes exactly.
// Usage: node tools/check-state-roundtrip.mjs <program-dir> <apu-ports.tsv> <ipl.bin>
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createApuLink, readInputTrace, rgbaToRgb565, ZakuroVM } from '../vm/index.js';
import { readProgramData } from './program-data.mjs';

const [programDirectory, tracePath, iplPath] = process.argv.slice(2);
const [program, inputFrames, ipl, powerOnDsp] = await Promise.all([
  readProgramData(programDirectory), readInputTrace(join(dirname(tracePath), 'input.tsv')),
  readFile(iplPath), readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin')),
]);
const { link } = createApuLink({ ipl, powerOnDsp });
let active = null;
const vm = new ZakuroVM({ program, sram: program.sram, masterLink: link, inputFrames,
  trace(row) { active?.rows.push({ ...row }); } });
vm.reset(); vm.skipRender = true;
while (!vm.cpu.stopped && !vm.getTouchState().choice?.ready) vm.step();
const fork = structuredClone(vm.saveState());

function advanceField(mask, result) {
  vm.setJoypad(mask);
  const before = vm.ppu.field;
  while (!vm.cpu.stopped && vm.ppu.field === before) vm.step();
  const rgba = vm.ppu.presentField(vm.ppu.field, vm.bus.clock.master, true);
  result.hashes.push(createHash('sha256').update(rgbaToRgb565(rgba)).digest('hex'));
}

function runBranch() {
  const result = { rows: [], hashes: [] }; active = result;
  advanceField(0x0400, result); // Down
  advanceField(0, result);
  advanceField(0x0080, result); // A
  for (let field = 0; field < 120; field++) advanceField(0, result);
  active = null;
  return result;
}

const first = runBranch();
vm.loadState(structuredClone(fork));
const second = runBranch();
assert.deepEqual(second.rows, first.rows);
assert.deepEqual(second.hashes, first.hashes);
console.log(JSON.stringify({ forkField: vm.ppu.field - 123, replayFields: first.hashes.length,
  apuRows: first.rows.length, frameHashes: first.hashes.length, exact: true }, null, 2));
