#!/usr/bin/env node
import fs from 'node:fs';

const [referencePath, vmPath, maxFrameArg = 'Infinity', mode = 'all'] = process.argv.slice(2);
if (!referencePath || !vmPath) throw new Error(
  'usage: compare-apu-trace.mjs reference.tsv vm.tsv [max-frame] [all|semantic]',
);
const maxFrame = Number(maxFrameArg);
if (mode !== 'all' && mode !== 'semantic') throw new Error(`unknown comparison mode: ${mode}`);
const parse = (path) => {
  const rows = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1)
    .map((line) => line.split('\t')).filter((row) => Number(row[0]) <= maxFrame);
  if (mode === 'all') return rows;
  const lastRead = [null, null, null, null];
  return rows.filter((row) => {
    if (row[2] === 'w') return true;
    const port = Number(row[3]), changed = lastRead[port] !== row[4].toLowerCase();
    lastRead[port] = row[4].toLowerCase();
    return changed;
  });
};
const reference = parse(referencePath);
const vm = parse(vmPath);
let matched = 0;
let maxCycleDelta = 0;
let maxCycleDeltaAt = null;
let firstDeltaJump = null;
let previousDelta = null;
while (matched < reference.length && matched < vm.length) {
  const expected = reference[matched], actual = vm[matched];
  if (expected[2] !== actual[2] || expected[3] !== actual[3]
    || expected[4].toLowerCase() !== actual[4].toLowerCase()) break;
  const delta = Number(actual[1]) - Number(expected[1]);
  if (Math.abs(delta) > maxCycleDelta) {
    maxCycleDelta = Math.abs(delta);
    maxCycleDeltaAt = { row: matched, delta, reference: expected, vm: actual };
  }
  if (!firstDeltaJump && previousDelta !== null && Math.abs(delta - previousDelta) > 100_000)
    firstDeltaJump = { row: matched, previousDelta, delta, reference: expected, vm: actual };
  previousDelta = delta;
  matched++;
}
console.log(JSON.stringify({
  referenceRows: reference.length,
  vmRows: vm.length,
  mode,
  matchedRows: matched,
  maxCycleDelta,
  maxCycleDeltaAt,
  firstDeltaJump,
  firstMismatch: matched < reference.length || matched < vm.length
    ? { reference: reference[matched] ?? null, vm: vm[matched] ?? null }
    : null,
}, null, 2));
