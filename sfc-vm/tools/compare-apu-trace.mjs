#!/usr/bin/env node
import fs from 'node:fs';

const [referencePath, vmPath, maxFrameArg = 'Infinity'] = process.argv.slice(2);
if (!referencePath || !vmPath) throw new Error(
  'usage: compare-apu-trace.mjs reference.tsv vm.tsv [max-frame]',
);
const maxFrame = Number(maxFrameArg);
const parse = (path) => fs.readFileSync(path, 'utf8').trim().split('\n').slice(1)
  .map((line) => line.split('\t')).filter((row) => Number(row[0]) <= maxFrame);
const reference = parse(referencePath);
const vm = parse(vmPath);
let matched = 0;
let maxCycleDelta = 0;
while (matched < reference.length && matched < vm.length) {
  const expected = reference[matched], actual = vm[matched];
  if (expected[2] !== actual[2] || expected[3] !== actual[3]
    || expected[4].toLowerCase() !== actual[4].toLowerCase()) break;
  maxCycleDelta = Math.max(maxCycleDelta, Math.abs(Number(actual[1]) - Number(expected[1])));
  matched++;
}
console.log(JSON.stringify({
  referenceRows: reference.length,
  vmRows: vm.length,
  matchedRows: matched,
  maxCycleDelta,
  firstMismatch: matched < reference.length || matched < vm.length
    ? { reference: reference[matched] ?? null, vm: vm[matched] ?? null }
    : null,
}, null, 2));
