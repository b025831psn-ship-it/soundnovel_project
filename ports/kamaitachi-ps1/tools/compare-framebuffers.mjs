#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const [originalPath, portPath, widthText = "320", heightText = "240"] = process.argv.slice(2);
if (!originalPath || !portPath) {
  console.error("usage: node tools/compare-framebuffers.mjs ORIGINAL.rgba PORT.rgba [WIDTH] [HEIGHT]");
  process.exit(2);
}
const width = Number(widthText), height = Number(heightText), expected = width * height * 4;
const [original, port] = await Promise.all([readFile(originalPath), readFile(portPath)]);
if (original.length !== expected || port.length !== expected)
  throw new Error(`expected two ${expected}-byte RGBA framebuffers, got ${original.length} and ${port.length}`);
let differentPixels = 0, absoluteError = 0, maximumChannelError = 0;
for (let pixel = 0; pixel < width * height; pixel++) {
  let different = false;
  for (let channel = 0; channel < 4; channel++) {
    const difference = Math.abs(original[pixel * 4 + channel] - port[pixel * 4 + channel]);
    absoluteError += difference; maximumChannelError = Math.max(maximumChannelError, difference);
    different ||= difference !== 0;
  }
  differentPixels += Number(different);
}
console.log(JSON.stringify({ width, height, differentPixels,
  differentPercent: differentPixels * 100 / (width * height),
  meanAbsoluteChannelError: absoluteError / expected, maximumChannelError }, null, 2));
