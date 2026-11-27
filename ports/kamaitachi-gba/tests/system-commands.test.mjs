import test from "node:test";
import assert from "node:assert/strict";
import { Boot } from "../src/boot.js";
import { VM } from "../src/vm.js";
import { SYSTEM_TEXT_BASE } from "../src/rom-text.js";

const ram = () => new VM({ banks: { 0: Uint8Array.of(0) } }).ram;

// 1D 24 (0800973A): the unlocks from the ending records (020024EC + n).
test("1D 24 opens 0x33-0x36 from the ending records", () => {
  const boot = Object.create(Boot.prototype);
  const r = ram();
  boot.command(0x24, r);
  assert.deepEqual([r.flags[0x33], r.flags[0x34], r.flags[0x35], r.flags[0x36]], [0, 0, 0, 0]);
  r.flags[3] = 1;
  boot.command(0x24, r);
  assert.equal(r.flags[0x33], 1);
  for (let n = 1; n <= 0x14; n++) r.flags[n] = 1;
  boot.command(0x24, r);
  assert.equal(r.flags[0x34], 0); // ending 43 (0x2B) is still missing
  r.flags[0x2b] = 1;
  boot.command(0x24, r);
  assert.equal(r.flags[0x34], 1);
  assert.equal(r.flags[0x36], 0);
  for (let n = 1; n <= 0x2b; n++) r.flags[n] = 1;
  boot.command(0x24, r);
  assert.equal(r.flags[0x35], 1);
  assert.equal(r.flags[0x36], 1);
});

// 1D 21 (08012CF4(0x21)): the culprit typed into slot 0 picks the option; slot 4 gets the name.
test("1D 21 matches the culprit's name", () => {
  const blob = new Uint8Array(0xc000 - 0x9400);
  const put = (address, bytes) => blob.set([...bytes, 0], address - SYSTEM_TEXT_BASE);
  // 田中: たなか (0801B884) -> 田中さん (0801B8B4); 美樹本: みきもと (0801B834).
  put(0x1b884, [0x82, 0xbd, 0x82, 0xc8, 0x82, 0xa9]);
  put(0x1b8b4, [0x93, 0x63, 0x92, 0x86, 0x82, 0xb3, 0x82, 0xf1]);
  put(0x1b834, [0x82, 0xdd, 0x82, 0xab, 0x82, 0xe0, 0x82, 0xc6]);
  const boot = Object.create(Boot.prototype);
  boot.systemText = blob;
  boot.names = { 0: [0x82, 0xbd, 0x82, 0xc8, 0x82, 0xa9] };
  const r = ram();
  boot.command(0x21, r);
  assert.equal(r.choicePreset, 1);
  assert.deepEqual(boot.names[0], [0x93, 0x63, 0x92, 0x86, 0x82, 0xb3, 0x82, 0xf1]);
  assert.deepEqual(boot.names[4], boot.names[0]);
  boot.names = { 0: [0x82, 0xa0] }; // no suspect: the default entry
  boot.command(0x21, r);
  assert.equal(r.choicePreset, 4);
});

// 1D 6A / 6B and 0800750C: SELECT at a page wait sets var 2 and reads on, only while armed.
test("SELECT is taken at page waits only after 1D 6A", () => {
  const boot = Object.create(Boot.prototype);
  const vm = new VM({ banks: { 0: Uint8Array.of(0) } });
  vm.waiting = "click";
  assert.equal(vm.select(), false);
  boot.command(0x6a, vm.ram);
  assert.equal(vm.select(), true);
  assert.equal(vm.ram.vars[2], 1);
  boot.command(0x6b, vm.ram);
  assert.equal(vm.ram.selectArmed, 0);
});
