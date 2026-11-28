import assert from "node:assert/strict";
import {Scenario} from "./scenario.mjs";
const cmd = (opcode,args) => ({kind:"command", opcode,args});
const text = ja => ({kind:"text", ja});
const rows = [
  {items:[cmd(4,"021203"), {kind:"choice", target:1}, {kind:"choice", target:2}]},
  {items:[text("A")]},
  {items:[cmd(4,"911203000200030001")]},
  {items:[cmd(5,"4003"),text("B")]},
];
const vm = new Scenario(rows);
assert.equal(vm.next().kind,"choice");
const saved = new Scenario(rows,vm.state);
saved.choose(1);
assert.equal(saved.next().ja,"B");
assert.equal(saved.state.marks[3],true);
vm.choose(0);
assert.equal(vm.next().ja,"A");
assert.equal(vm.state.flags[259],1);

// Two conditions choose how many rows from the original option table are visible.
const conditionalRows = [
  {items: [cmd(4, "83000012100102000301"), ...[1, 2, 3].map(target => ({kind: "choice", target}))]},
  ...[1, 2, 3].map(n => ({items: [text(String(n))]})),
];
const conditional = new Scenario(conditionalRows);
assert.equal(conditional.next().options.length, 2);
assert.throws(() => conditional.choose(2));
const unlocked = new Scenario(conditionalRows);
unlocked.state.flags[257] = 1;
assert.equal(unlocked.next().options.length, 3);
new Scenario(conditionalRows, unlocked.state).choose(2);

const presentation = new Scenario([{items: [
  cmd(1, "0234"), cmd(8, "030104"), cmd(6, "0121"), text("unreachable")
]}]);
assert.deepEqual(presentation.next(), {kind: "textPosition", id: undefined, row: 3, column: 4});
assert.equal(presentation.next().index, 4);
const ending = presentation.next();
assert.equal(ending.type, 1);
assert.equal(ending.number, 2);
assert.equal(ending.sound, 1);
assert.deepEqual(new Scenario(presentation.rows, presentation.state).next(), ending);
