import test from "node:test";
import assert from "node:assert/strict";
import { VM, HANDLERS } from "../src/vm.js";
import { TextWindow } from "../src/font.js";

function bank(rows) {
  const tableBytes = rows.length * 2;
  const offsets = [];
  let cursor = tableBytes;
  for (const row of rows) {
    offsets.push(cursor);
    cursor += row.length;
  }
  return Uint8Array.from([
    ...offsets.flatMap((offset) => [offset & 255, offset >> 8]),
    ...rows.flat(),
  ]);
}

test("required opcode table retains native handler evidence", () => {
  const required = [
    0x00, 0x01, 0x02, 0x03, 0x04, 0x0d, 0x0e, 0x0f, 0x13, 0x1a, 0x21, 0x22,
    0x23, 0x25, 0x40, 0x41, 0x56, 0x57, 0x5e,
  ];
  assert.ok(required.every((opcode) => HANDLERS[opcode]));
});

test("LE row IDs, jump, call and return use row tables", () => {
  const banks = {
    27: bank([
      [0x02, 0x7a, 0x69, 0x01, 0x79, 0x69],
      [0x03],
      [0x41, 2, 7, 0x03],
    ]),
  };
  const vm = new VM({ banks });
  while (vm.step());
  assert.equal(vm.ram.vars[2], 7);
  assert.equal(vm.ram.stack.length, 0);
});

test("shared flags and branch directions match native meanings", () => {
  const banks = {
    27: bank([
      [0x0d, 4, 0x0f, 4, 0x7a, 0x69, 0x41, 1, 1],
      [0x03],
      [0x1a, 4, 0x0e, 4, 0x7b, 0x69],
      [0x41, 1, 9, 0x03],
    ]),
  };
  const vm = new VM({ banks });
  while (vm.step());
  assert.equal(vm.ram.flags[4], 0);
  assert.equal(vm.ram.vars[1], 9);
});

test("bit and variable comparisons jump when set/equal", () => {
  const banks = {
    27: bank([
      [0x21, 3, 0x25, 3, 0x7a, 0x69],
      [0x03],
      [0x41, 5, 6, 0x40, 5, 6, 0x7b, 0x69],
      [0x5e, 3, 0x7c, 0x69, 0x34, 0x12],
      [0x22, 3, 0x03],
    ]),
  };
  const vm = new VM({ banks });
  while (vm.step());
  assert.equal(vm.ram.bits[3], 0);
  assert.equal(vm.ram.vars[5], 6);
});

test("23 only changes group and 56 ignores its key while jumping", () => {
  const banks = {
    27: bank([[0x23, 10, 99, 0x56, 0x79, 0x69, 0x78, 0x56], [0x03]]),
  };
  const vm = new VM({ banks });
  while (vm.step());
  assert.equal(vm.ram.group, 2);
  assert.equal(vm.ram.vars[99], 0);
});

test("13 and 57 consume all variable-length choice entries", () => {
  const vm13 = new VM({ banks: { 27: bank([[0x13, 1, 0, 1, 0, 2, 0]]) } });
  vm13.step();
  assert.deepEqual(vm13.choiceState.entries, [{ row: 1 }, { row: 2 }]);
  const vm57 = new VM({
    banks: { 27: bank([[0x57, 1, 2, 1, 0, 10, 0, 2, 0, 11, 0]]) },
  });
  vm57.step();
  assert.deepEqual(vm57.choiceState.entries, [
    { row: 1, key: 10 },
    { row: 2, key: 11 },
  ]);
});

test("00 text scans CP932 pairs and control arguments", () => {
  const text = new TextWindow({ 1: "透" });
  const vm = new VM({
    banks: { 27: bank([[0x00, 0x82, 0xa0, 0x6e, 1, 0x72, 0x00]]) },
    text,
  });
  vm.step();
  assert.equal(vm.waiting, "click");
  assert.equal(text.fragments[1], "透");
});

test("04 uses a little-endian request", () => {
  let request;
  const vm = new VM({
    banks: { 27: bank([[0x04, 0x34, 0x12, 0x03]]) },
    scene: {
      request: (value) => {
        request = value;
      },
    },
  });
  vm.step();
  assert.equal(request, 0x1234);
});

test("30/31/32 map scenario requests to the MP2K API", () => {
  const calls = [];
  const audio = {
    startSong: (song) => calls.push(["start", song]),
    stopSong: (song) => calls.push(["stop", song]),
    fadeOut: (player, speed) => calls.push(["fade", player, speed]),
  };
  const vm = new VM({
    banks: {
      27: bank([
        [0x30, 1, 0, 0x31, 10, 0, 1, 0, 0x32, 20, 0, 2, 0, 0x30, 3, 0, 0x03],
      ]),
    },
    musicMap: [5, 8, 13, -1],
    audio,
  });
  while (vm.step());
  assert.deepEqual(calls, [
    ["start", 8],
    ["fade", 0, 100],
    ["start", 13],
    ["stop", 13],
  ]);
});

test("opening effect opcodes preserve alignment through the first choice", () => {
  const row = [
    0x29, 2, 0xf6, 0x00, 0x2e, 1, 10, 0x5f, 3, 0, 0x58, 4, 0, 0x15, 0x2c, 0x35,
    1, 5, 0, 0x1c, 7, 0x37, 8, 0, 0x3e, 0x57, 1, 0, 1, 0, 2, 0, 2, 0, 3, 0,
  ];
  const vm = new VM({ banks: { 27: bank([row]) } });
  while (vm.step());
  assert.equal(vm.waiting, "choice");
  assert.deepEqual(vm.choiceState.entries, [
    { row: 1, key: 2 },
    { row: 2, key: 3 },
  ]);
});
