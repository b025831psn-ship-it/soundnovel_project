#!/usr/bin/env node
import fs from 'node:fs';
import { renderMode3Bg1 } from '../ppu.js';

const [prefix, output] = process.argv.slice(2);
if (!prefix || !output) throw new Error('usage: node render-snapshot.mjs SNAPSHOT_PREFIX OUTPUT.ppm');
const bus = {
  vram: fs.readFileSync(`${prefix}.vram.bin`),
  cgram: fs.readFileSync(`${prefix}.cgram.bin`),
  oam: fs.readFileSync(`${prefix}.oam.bin`),
  io: fs.readFileSync(`${prefix}.io.bin`),
};
const pixels = renderMode3Bg1(bus);
const header = Buffer.from('P6\n256 224\n255\n');
const rgb = Buffer.alloc(256 * 224 * 3);
for (let input = 0, outputIndex = 0; input < pixels.length; input += 4)
  rgb.set(pixels.subarray(input, input + 3), outputIndex), outputIndex += 3;
fs.writeFileSync(output, Buffer.concat([header, rgb]));
