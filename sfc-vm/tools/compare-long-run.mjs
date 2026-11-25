#!/usr/bin/env node
import fs from 'node:fs';

const [nativePath, vmPath, outputPath = ''] = process.argv.slice(2);
if (!nativePath || !vmPath) throw new Error('usage: compare-long-run.mjs native.tsv vm.tsv [report.json]');
const read = (path) => {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n');
  const headers = lines[0].split('\t');
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => {
    const key = header === 'nmi_pc' ? 'nmiPc' : header === 'apu_raw' ? 'apuRaw'
      : header === 'apu_semantic' ? 'apuSemantic' : header === 'apu_count' ? 'apuCount' : header;
    const value = line.split('\t')[index];
    return [key, header === 'nmi' || header === 'frame' ? Number(value) : value];
  })));
};
const native = read(nativePath), vm = read(vmPath);
const key = native[0]?.nmi == null ? 'frame' : 'nmi';
const vmFrames = new Map(vm.map((row) => [row[key], row]));
const bestOffset = 0;
const bestMatches = native.slice(0, 300).filter((row) => vmFrames.get(row[key])?.wram === row.wram).length;

const fields = ['wram', 'vram', 'cgram', 'oam', 'nmiPc', 'apuRaw', 'apuSemantic', 'apuCount', 'framebuffer'];
const report = { nativeFrames: native.length, vmFrames: vm.length, vmFrameOffset: bestOffset,
  alignmentMatchesInFirst300: bestMatches, fields: {} };
for (const field of fields) {
  const intervals = [];
  let open = null, compared = 0, mismatched = 0;
  for (const expected of native) {
    const actual = vmFrames.get(expected[key]);
    if (!actual) continue;
    compared++;
    const mismatch = expected[field] !== actual[field];
    if (mismatch) {
      mismatched++;
      open ??= { nativeStart: expected[key], vmStart: actual[key], expected: expected[field], actual: actual[field] };
      open.nativeEnd = expected[key]; open.vmEnd = actual[key];
    } else if (open) { intervals.push(open); open = null; }
  }
  if (open) intervals.push(open);
  report.fields[field] = { compared, mismatched, intervals };
}
const json = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) fs.writeFileSync(outputPath, json);
process.stdout.write(json);
