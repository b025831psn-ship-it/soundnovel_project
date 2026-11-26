#!/usr/bin/env node
import fs from 'node:fs';

const [nativePath, vmPath, outputPath, framesArg = '5700', formatArg = 'bgr555'] = process.argv.slice(2);
if (!nativePath || !vmPath || !outputPath) throw new Error(
  'usage: pixel-diff.mjs native.rgba vm.rgba output.json [frames=5700]',
);
const width = 256, height = 224, frameBytes = width * height * 4;
const nativeFd = fs.openSync(nativePath, 'r'), vmFd = fs.openSync(vmPath, 'r');
const native = Buffer.allocUnsafe(frameBytes), previous = Buffer.allocUnsafe(frameBytes);
const next = Buffer.allocUnsafe(frameBytes), vm = Buffer.allocUnsafe(frameBytes);
const frames = Number(framesArg), differences = [], top = [], phaseWins = { '-1': 0, '0': 0, '1': 0 };
const offsetStats = Object.fromEntries([-1, 0, 1].map((offset) => [offset,
  { comparableFrames: 0, mismatchingFrames: 0, totalDifferentPixels: 0 }]));
const channel = formatArg === 'bgr555' ? (value) => Math.round(value * 31 / 255) : (value) => value;
function compare(reference, candidate, detail = true) {
  let pixels = 0, minX = width, minY = height, maxX = -1, maxY = -1;
  const maximum = [0, 0, 0];
  for (let pixel = 0; pixel < width * height; pixel++) {
    const at = pixel * 4;
    let different = false;
    for (let c = 0; c < 3; c++) {
      const delta = Math.abs(channel(reference[at + c]) - channel(candidate[at + c]));
      maximum[c] = Math.max(maximum[c], delta); different ||= delta !== 0;
    }
    if (!different) continue;
    pixels++;
    if (detail) {
      const x = pixel % width, y = Math.floor(pixel / width);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  return { pixels, maximum,
    boundingBox: !pixels || !detail ? null : { minX, minY, maxX, maxY,
      width: maxX - minX + 1, height: maxY - minY + 1 } };
}
for (let frame = 1; frame <= frames; frame++) {
  if (fs.readSync(nativeFd, native, 0, frameBytes, (frame - 1) * frameBytes) !== frameBytes
    || fs.readSync(vmFd, vm, 0, frameBytes, (frame - 1) * frameBytes) !== frameBytes)
    throw new Error(`short RGBA stream at frame ${frame}`);
  const aligned = compare(native, vm);
  const phase = [{ offset: 0, pixels: aligned.pixels }];
  if (frame > 1 && fs.readSync(nativeFd, previous, 0, frameBytes, (frame - 2) * frameBytes) === frameBytes)
    phase.push({ offset: -1, pixels: compare(previous, vm, false).pixels });
  if (frame < frames && fs.readSync(nativeFd, next, 0, frameBytes, frame * frameBytes) === frameBytes)
    phase.push({ offset: 1, pixels: compare(next, vm, false).pixels });
  phase.sort((a, b) => a.pixels - b.pixels || Math.abs(a.offset) - Math.abs(b.offset));
  for (const entry of phase) {
    const stats = offsetStats[entry.offset]; stats.comparableFrames++;
    stats.mismatchingFrames += entry.pixels !== 0; stats.totalDifferentPixels += entry.pixels;
  }
  phaseWins[String(phase[0].offset)]++;
  if (aligned.pixels) {
    const row = { nmi: frame, differentPixels: aligned.pixels,
      boundingBox: aligned.boundingBox,
      maxChannelDifference: { r: aligned.maximum[0], g: aligned.maximum[1], b: aligned.maximum[2] },
      bestNativeFrameOffset: phase[0].offset, bestOffsetDifferentPixels: phase[0].pixels };
    differences.push(row); top.push(row);
    top.sort((a, b) => b.differentPixels - a.differentPixels || a.nmi - b.nmi);
    if (top.length > 10) top.length = 10;
  }
}
fs.closeSync(nativeFd); fs.closeSync(vmFd);
const byNmi = new Map(differences.map((row) => [row.nmi, row]));
fs.writeFileSync(outputPath, `${JSON.stringify({ width, height, format: formatArg, frames,
  mismatchingFrames: differences.length, topFrames: top,
  phaseWins,
  offsetStats,
  nameConfirmation: byNmi.get(2063) ?? { nmi: 2063, differentPixels: 0, boundingBox: null },
  differences }, null, 2)}\n`);
console.log(JSON.stringify({ format: formatArg, frames, mismatchingFrames: differences.length, topFrames: top,
  phaseWins,
  offsetStats,
  nameConfirmation: byNmi.get(2063) ?? null }, null, 2));
