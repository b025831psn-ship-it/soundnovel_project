#!/usr/bin/env node
import fs from 'node:fs';

const [nativePath, vmPath] = process.argv.slice(2);
if (!nativePath || !vmPath) throw new Error('usage: compare-raw-apu.mjs native-apu-ports-pc.tsv vm-apu.tsv');
const rows = (path) => fs.readFileSync(path, 'utf8').trim().split('\n').slice(1).map((line) => line.split('\t'));
const native = rows(nativePath), vm = rows(vmPath);
let lastZero = -1, firstDelta = null, firstMismatch = null, compared = 0;
for (; compared < native.length && compared < vm.length; compared++) {
  const n = native[compared], v = vm[compared];
  if (n[5] !== v[2] || n[6] !== v[3] || n[7].toLowerCase() !== v[4].toLowerCase()) {
    firstMismatch = { row: compared, native: n, vm: v };
    break;
  }
  const delta = Number(v[1]) - Number(n[4]);
  if (delta === 0) lastZero = compared;
  else if (!firstDelta) { firstDelta = { row: compared, delta, native: n, vm: v }; break; }
}
console.log(JSON.stringify({ nativeRows: native.length, vmRows: vm.length, comparedRows: compared,
  lastZeroRow: lastZero, firstDelta, firstMismatch,
  exhausted: !firstDelta && !firstMismatch ? (native.length === vm.length ? 'both' : native.length < vm.length ? 'native' : 'vm') : null,
}, null, 2));
