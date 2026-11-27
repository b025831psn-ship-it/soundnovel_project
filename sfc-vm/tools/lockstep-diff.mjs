#!/usr/bin/env node
import fs from 'node:fs';

const [referencePath, vmPath, toleranceArg = '64', lookaheadArg = '64',
  referenceStartArg = '-Infinity', vmStartArg = '-Infinity'] = process.argv.slice(2);
if (!referencePath || !vmPath) throw new Error(
  'usage: lockstep-diff.mjs reference.tsv vm.tsv [master-tolerance] [resync-lookahead] [reference-start-master] [vm-start-master]',
);
const tolerance = Number(toleranceArg), lookahead = Number(lookaheadArg);
const number = (text, radix = 10) => Number.parseInt(text, radix);

function parse(path) {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n');
  return lines.flatMap((line, index) => {
    const c = line.split('\t');
    if (c[0] === 'KAMAI_CPU') return [{
      sourceLine: index + 1, master: number(c[1]), frame: null,
      pc: number(c[2], 16), opcode: number(c[3], 16),
      a: null, x: null, y: null, s: null, d: null, dbr: null, p: null,
      ioAddress: null, ioValue: null,
    }];
    if (c[0] === 'KAMAI_FLOW') return [{
      sourceLine: index + 1, master: number(c[1]), frame: number(c[2]),
      pc: number(c[3], 16), opcode: number(c[4], 16),
      a: number(c[5], 16), x: number(c[6], 16), y: number(c[7], 16),
      s: number(c[8], 16), d: number(c[9], 16), dbr: number(c[10], 16), p: number(c[11], 16),
      ioAddress: c[12] ? number(c[12], 16) : null, ioValue: c[13] ? number(c[13], 16) : null,
    }];
    if (c[0] === 'master' || c.length < 11) return [];
    return [{
      sourceLine: index + 1, master: number(c[0]), frame: number(c[1]),
      pc: number(c[2]), opcode: number(c[3]), a: number(c[4]), x: number(c[5]), y: number(c[6]),
      s: number(c[7]), d: number(c[8]), dbr: number(c[9]), p: number(c[10]),
      ioAddress: c[11] ? number(c[11]) : null, ioValue: c[12] ? number(c[12]) : null,
    }];
  });
}

const reference = parse(referencePath).filter((row) => row.master >= Number(referenceStartArg));
const vm = parse(vmPath).filter((row) => row.master >= Number(vmStartArg));
const key = (row) => `${row.pc}:${row.opcode}`;
const compact = (row) => row && ({ line: row.sourceLine, master: row.master, frame: row.frame,
  pc: row.pc.toString(16).padStart(6, '0'), opcode: row.opcode.toString(16).padStart(2, '0'),
  a: row.a, x: row.x, y: row.y, s: row.s, d: row.d, dbr: row.dbr, p: row.p,
  ioAddress: row.ioAddress, ioValue: row.ioValue });
let ri = 0, vi = 0, firstPc = null, firstRegisters = null, firstIo = null, firstMaster = null;
let firstMasterDrift = null, baselineDelta = null;
while (ri < reference.length && vi < vm.length) {
  const r = reference[ri], v = vm[vi];
  baselineDelta ??= v.master - r.master;
  if (!firstMaster && Math.abs(v.master - r.master) > tolerance)
    firstMaster = { referenceIndex: ri, vmIndex: vi, delta: v.master - r.master,
      reference: compact(r), vm: compact(v) };
  if (!firstMasterDrift && Math.abs((v.master - r.master) - baselineDelta) > tolerance)
    firstMasterDrift = { referenceIndex: ri, vmIndex: vi, baselineDelta,
      delta: v.master - r.master, drift: (v.master - r.master) - baselineDelta,
      reference: compact(r), vm: compact(v) };
  if (key(r) !== key(v)) {
    let match = null;
    for (let distance = 1; distance <= lookahead && !match; distance++) {
      if (vi + distance < vm.length && key(r) === key(vm[vi + distance]))
        match = { skipReference: 0, skipVm: distance };
      if (ri + distance < reference.length && key(reference[ri + distance]) === key(v))
        match = { skipReference: distance, skipVm: 0 };
    }
    firstPc ??= { referenceIndex: ri, vmIndex: vi, reference: compact(r), vm: compact(v), resync: match };
    if (!match) break;
    ri += match.skipReference; vi += match.skipVm;
    continue;
  }
  const registerNames = ['a', 'x', 'y', 's', 'd', 'dbr'];
  const changed = registerNames.filter((name) => r[name] !== null && v[name] !== null && r[name] !== v[name]);
  if (!firstRegisters && changed.length)
    firstRegisters = { referenceIndex: ri, vmIndex: vi, changed, reference: compact(r), vm: compact(v) };
  if (!firstIo && (r.ioAddress !== v.ioAddress || r.ioValue !== v.ioValue)
    && (r.ioAddress !== null || v.ioAddress !== null))
    firstIo = { referenceIndex: ri, vmIndex: vi, reference: compact(r), vm: compact(v) };
  ri++; vi++;
}
console.log(JSON.stringify({ referenceRows: reference.length, vmRows: vm.length, tolerance,
  comparedReferenceRows: ri, comparedVmRows: vi, firstPc, firstRegisters, firstIo,
  firstMaster, firstMasterDrift }, null, 2));
