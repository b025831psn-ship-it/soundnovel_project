// Variable and condition semantics of Sn4Vm against the EE tables
// (calc 0x00219670, compare 0x002196B0). Uses a synthetic program only.
//   node ports/kamaitachi2-ps2/tools/test-sn4-ops.mjs
import assert from 'node:assert/strict';
import { Sn4Vm } from '../sn4.js';

const set = (v, op, value) => ({op: 0x68, offset: 0, args: [{var: v, op, value}]});
const copy = (v, op, source) => ({op: 0x69, offset: 0, args: [{var: v, op, source}]});
function run(ops, hooks = {}) {
  const vm = new Sn4Vm({entry: 'a', labels: [{label: 'a', offset: 0, ops}, {label: 'no', offset: 0, ops: []}]}, hooks);
  const event = vm.run();
  return {vm, event};
}
const value = (ops, v = 1) => run(ops).vm.variables.get(v);

assert.equal(value([set(1, 6, 10), set(1, 2, 3)]), 7, '2 subtracts');
assert.equal(value([set(1, 6, 10), set(1, 3, 3)]), 13, '3 adds');
assert.equal(value([set(1, 6, 10), set(1, 4, 3)]), 30, '4 multiplies');
assert.equal(value([set(1, 6, -7), set(1, 5, 2)]), -3, '5 divides toward zero');
assert.equal(value([set(1, 6, -7), set(1, 13, 3)]), -1, '13 keeps the dividend sign');
assert.equal(value([set(1, 6, 0x7fff), set(1, 3, 1)]), -0x8000, 'values are signed 16-bit');
assert.equal(value([set(2, 6, 5), set(1, 6, 1), copy(1, 3, 2)]), 6, '0x69 reads the source variable');
for (const draw of [0, 0.5, 0.999999]) {
  const original = Math.random;
  Math.random = () => draw;
  try { assert.equal(value([set(1, 14, 4)]), Math.floor(draw * 5), `14 draws 0..4 (${draw})`); }
  finally { Math.random = original; }
}
const unknown = [];
assert.equal(run([set(1, 6, 9), set(1, 0, 1)], {unknown: op => unknown.push(op)}).vm.variables.get(1), 9);
assert.deepEqual(unknown, [0x68], 'operators the EE rejects are reported');

// CommandIf runs the next command when true and jumps when false.
const cases = {6: [3, 3], 7: [3, 3], 8: [4, 3], 9: [2, 3], 10: [3, 3], 11: [3, 3], 12: [2, 3]};
for (const [cmp, [left, right]] of Object.entries(cases)) {
  const pass = run([set(1, 6, left), {op: 0x70, offset: 0, args: [{var: 1, cmp: +cmp, value: right, target: 'no'}]}]);
  assert.equal(pass.event.label, 'a', `cmp ${cmp} true falls through`);
  const fail = run([set(1, 6, left), {op: 0x70, offset: 0, args: [{var: 1, cmp: +cmp, value: right + (cmp === '8' || cmp === '10' ? 5 : cmp === '9' || cmp === '11' ? -5 : cmp === '12' ? -1 : 1), target: 'no'}]}]);
  assert.equal(fail.event.label, 'no', `cmp ${cmp} false jumps`);
}
const other = run([set(1, 6, 2), set(2, 6, 2), {op: 0x71, offset: 0, args: [{var: 1, cmp: 12, other: 2, target: 'no'}]}]);
assert.equal(other.event.label, 'no', '0x71 compares two variables');
console.log('sn4 variable/condition semantics: PASS');
