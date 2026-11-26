// Replays the private native input and checks VM RGB565 frames against the
// four native checkpoints in docs/screen-hashes.json.
// Usage: node tools/check-vm-ppu.mjs <rom> <apu-ports.tsv> <ipl.bin> <screen-hashes.json>
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createApuLink, readInputTrace, rgbaToRgb565, ZakuroVM } from '../vm/index.js';

const [romPath, tracePath, iplPath, hashesPath] = process.argv.slice(2);
if (!hashesPath) throw new Error('expected ROM, trace, IPL, and screen hash manifest');
const [rom, inputFrames, ipl, powerOnDsp, manifest] = await Promise.all([
  readFile(romPath), readInputTrace(join(dirname(tracePath), 'input.tsv')), readFile(iplPath),
  readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin')),
  readFile(hashesPath, 'utf8').then(JSON.parse),
]);
const romHash = createHash('sha256').update(rom).digest('hex');
const expected = manifest[romHash];
if (!expected) throw new Error(`unrecognized ROM ${romHash}`);
const wanted = new Map(Object.entries(expected).map(([label, hash]) => [hash, label]));
const found = {};
const samples = {};
const { link } = createApuLink({ ipl, powerOnDsp });
let vm, choiceField = null, stopField = inputFrames.length + 240;
vm = new ZakuroVM({ rom, masterLink: link, inputFrames, onFrame({ field, rgba }) {
  const hash = createHash('sha256').update(rgbaToRgb565(rgba)).digest('hex');
  const label = wanted.get(hash);
  if (label && found[label] == null) found[label] = { field, hash };
  const touch = vm?.getTouchState();
  if (choiceField == null && touch?.choice?.ready) {
    choiceField = field; samples.choice = { field, hash }; vm.setJoypad(0x0080); stopField = field + 240;
    if (process.env.ZAKURO_PPU_FRAME_OUT) {
      const rgb = new Uint8Array(256 * 224 * 3);
      for (let i = 0, j = 0; i < rgba.length; i += 4) { rgb[j++] = rgba[i]; rgb[j++] = rgba[i + 1]; rgb[j++] = rgba[i + 2]; }
      writeFile(process.env.ZAKURO_PPU_FRAME_OUT, Buffer.concat([Buffer.from('P6\n256 224\n255\n'), rgb]));
    }
  } else if (choiceField != null && field === choiceField + 180) {
    samples.branch = { field, hash };
  }
} });
vm.reset();
let instructions = 0;
while (!vm.cpu.stopped && vm.ppu.field < stopField) { vm.step(); instructions++; }
const result = {
  romHash, instructions, lastField: vm.ppu.field, choiceField,
  modesUsed: [...vm.ppu.modesUsed].sort(), expected, found, samples,
  missing: Object.keys(expected).filter(label => !found[label]),
};
console.log(JSON.stringify(result, null, 2));
if (result.missing.length) process.exitCode = 1;
