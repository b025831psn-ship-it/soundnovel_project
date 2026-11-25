#!/usr/bin/env node
import fs from 'node:fs';

const [nativePath, vmPath, outputPath, framesArg = '5700'] = process.argv.slice(2);
if (!nativePath || !vmPath || !outputPath) throw new Error(
  'usage: pixel-diff.mjs native.rgba vm.rgba output.json [frames=5700]',
);
const width = 256, height = 224, frameBytes = width * height * 4;
const nativeFd = fs.openSync(nativePath, 'r'), vmFd = fs.openSync(vmPath, 'r');
const native = Buffer.allocUnsafe(frameBytes), vm = Buffer.allocUnsafe(frameBytes);
const frames = Number(framesArg), differences = [], top = [];
for (let frame = 1; frame <= frames; frame++) {
  if (fs.readSync(nativeFd, native, 0, frameBytes, null) !== frameBytes
    || fs.readSync(vmFd, vm, 0, frameBytes, null) !== frameBytes)
    throw new Error(`short RGBA stream at frame ${frame}`);
  let pixels = 0, minX = width, minY = height, maxX = -1, maxY = -1;
  for (let pixel = 0; pixel < width * height; pixel++) {
    const at = pixel * 4;
    if (native[at] === vm[at] && native[at + 1] === vm[at + 1]
      && native[at + 2] === vm[at + 2] && native[at + 3] === vm[at + 3]) continue;
    pixels++;
    const x = pixel % width, y = Math.floor(pixel / width);
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  if (pixels) {
    const row = { nmi: frame, differentPixels: pixels,
      boundingBox: { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 } };
    differences.push(row); top.push(row);
    top.sort((a, b) => b.differentPixels - a.differentPixels || a.nmi - b.nmi);
    if (top.length > 10) top.length = 10;
  }
}
fs.closeSync(nativeFd); fs.closeSync(vmFd);
const byNmi = new Map(differences.map((row) => [row.nmi, row]));
fs.writeFileSync(outputPath, `${JSON.stringify({ width, height, frames,
  mismatchingFrames: differences.length, topFrames: top,
  nameConfirmation: byNmi.get(2063) ?? { nmi: 2063, differentPixels: 0, boundingBox: null },
  differences }, null, 2)}\n`);
console.log(JSON.stringify({ frames, mismatchingFrames: differences.length, topFrames: top,
  nameConfirmation: byNmi.get(2063) ?? null }, null, 2));
