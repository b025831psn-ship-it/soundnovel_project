#!/usr/bin/env node
import fs from 'node:fs';

const [nativePath, vmPath, outputPath = ''] = process.argv.slice(2);
if (!nativePath || !vmPath) throw new Error('usage: compare-timing-matrix.mjs native.tsv vm.tsv [report.json]');
const read = (path) => fs.readFileSync(path, 'utf8').trim().split('\n').slice(1).map((line) => line.split('\t'));
const native = read(nativePath), vm = read(vmPath);
const differences = [];
let excluded = 0;
for (let index = 0; index < Math.max(native.length, vm.length); index++) {
  const expected = native[index], actual = vm[index];
  if (expected && ['cb', 'db'].includes(expected[0])) { excluded++; continue; }
  if (!expected || !actual || expected.slice(0, 4).join('\t') !== actual.slice(0, 4).join('\t')) {
    differences.push({ row: index + 2, key: expected?.slice(0, 3).join('/') ?? null,
      native: expected?.[3] ?? null, vm: actual?.[3] ?? null,
      delta: expected && actual ? Number(actual[3]) - Number(expected[3]) : null });
  }
}
const byProfile = {};
for (const difference of differences) {
  const profile = difference.key?.split('/')[2] ?? 'missing';
  byProfile[profile] = (byProfile[profile] ?? 0) + 1;
}
const report = { rows: native.length, compared: native.length - excluded, excluded,
  differenceCount: differences.length, byProfile, differences };
const json = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) fs.writeFileSync(outputPath, json);
process.stdout.write(json);
