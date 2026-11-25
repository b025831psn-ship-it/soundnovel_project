#!/usr/bin/env node
import fs from 'node:fs';

const [nativePath, vmPath, outputPath = ''] = process.argv.slice(2);
if (!nativePath || !vmPath) throw new Error('usage: compare-long-run.mjs native.tsv vm.tsv [report.json]');
const read = (path) => fs.readFileSync(path, 'utf8').trim().split('\n').slice(1).map((line) => {
  const [sourceFrame, wram, vram, cgram, oam, nmiPc, apuRaw, apuSemantic, apuCount, emuFrame] = line.split('\t');
  return { frame: Number(emuFrame ?? sourceFrame), sourceFrame: Number(sourceFrame),
    wram, vram, cgram, oam, nmiPc, apuRaw, apuSemantic, apuCount };
});
const native = read(nativePath), vm = read(vmPath);
const byFrame = (rows) => new Map(rows.map((row) => [row.frame, row]));
const vmFrames = byFrame(vm);
let bestOffset = 0, bestMatches = -1;
for (let offset = -3; offset <= 3; offset++) {
  let matches = 0;
  for (const row of native.slice(0, 300)) if (vmFrames.get(row.frame + offset)?.wram === row.wram) matches++;
  if (matches > bestMatches) { bestMatches = matches; bestOffset = offset; }
}

const fields = ['wram', 'vram', 'cgram', 'oam', 'nmiPc', 'apuRaw', 'apuSemantic', 'apuCount'];
const report = { nativeFrames: native.length, vmFrames: vm.length, vmFrameOffset: bestOffset,
  alignmentMatchesInFirst300: bestMatches, fields: {} };
for (const field of fields) {
  const intervals = [];
  let open = null, compared = 0, mismatched = 0;
  for (const expected of native) {
    const actual = vmFrames.get(expected.frame + bestOffset);
    if (!actual) continue;
    compared++;
    const mismatch = expected[field] !== actual[field];
    if (mismatch) {
      mismatched++;
      open ??= { nativeStart: expected.frame, vmStart: actual.frame, expected: expected[field], actual: actual[field] };
      open.nativeEnd = expected.frame; open.vmEnd = actual.frame;
    } else if (open) { intervals.push(open); open = null; }
  }
  if (open) intervals.push(open);
  report.fields[field] = { compared, mismatched, intervals };
}
const json = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) fs.writeFileSync(outputPath, json);
process.stdout.write(json);
