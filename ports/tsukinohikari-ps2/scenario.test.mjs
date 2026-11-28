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
