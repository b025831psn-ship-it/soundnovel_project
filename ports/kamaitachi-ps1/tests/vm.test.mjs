import assert from "node:assert/strict";
import test from "node:test";
import { ScenarioFault, ScenarioVM, opcodeStatus } from "../src/vm.js";

const primary = Array.from({ length: 256 }, (_, opcode) => `0x${(0x80010000 + opcode * 4).toString(16)}`);
const sub1d = Array.from({ length: 108 }, (_, opcode) => `0x${(0x80020000 + opcode * 4).toString(16)}`);

test("fresh-play shaped record emits Shift-JIS text and name entry", () => {
  const text = new TextEncoder().encode("ABC");
  const events = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d })
    .run(Uint8Array.from([0x00, ...text, 0x00, 0x1d, 0x03]), { resourceId: 25, recordId: 7 });
  assert.deepEqual(events.map((event) => event.kind), ["text", "subcommand", "terminal"]);
  assert.equal(events[1].handler, sub1d[3]);
});

test("unknown primary and sub opcodes cite handlers and stop", () => {
  const vm = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d });
  assert.throws(() => vm.run(Uint8Array.of(0x45), { resourceId: 1, recordId: 2 }),
    (error) => error instanceof ScenarioFault && error.event.handler === primary[0x45]);
  assert.throws(() => vm.run(Uint8Array.of(0x1d, 0x04), { resourceId: 1, recordId: 2 }),
    (error) => error instanceof ScenarioFault && error.event.handler === sub1d[4]);
});

test("fixed and handler-proven variable lengths let stubs continue", () => {
  const primaryLengths = Array(256);
  primaryLengths[0x0c] = { classification: "fixed", operandLength: 2 };
  primaryLengths[0x13] = { classification: "variable", lengthRule: "4+2*u8(0)" };
  const events = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d, primaryLengths })
    .run(Uint8Array.of(0x0c, 1, 2, 0x13, 1, 9, 8, 7, 6, 5, 0x00, 0x00),
      { resourceId: 1, recordId: 2 });
  assert.deepEqual(events.filter((event) => ["command", "choice"].includes(event.kind)).map((event) => event.operandLength), [2, 6]);
  assert.deepEqual(events.find((event) => event.kind === "choice").options,
    [{ index: 0, label: 0x0708, target: { resourceId: 1, recordId: 800 } },
      { index: 1, label: 0x0506, target: { resourceId: 1, recordId: 286 } }]);
  assert.equal(events.at(-1).kind, "choice");
});

test("opcode report covers every primary and 1d sub-dispatch slot", () => {
  const report = opcodeStatus(primary, sub1d);
  assert.equal(report.primary.length, 256);
  assert.equal(report.sub1d.length, 108);
  assert.equal(report.primary.filter((row) => row.status === "implemented").length, 25);
  assert.equal(report.sub1d.filter((row) => row.status === "implemented").length, 1);
});

test("control transfers expose resolved labels and return locations", () => {
  const lengths = Array(256);
  for (const opcode of [0x01, 0x02, 0x1e]) lengths[opcode] = { classification: "fixed", operandLength: 2 };
  lengths[0x15] = { classification: "fixed", operandLength: 0 };
  const vm = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d, primaryLengths: lengths });
  const jump = vm.run(Uint8Array.of(0x01, 0xb2, 0x61), { resourceId: 25, recordId: 8 }).at(-1);
  assert.deepEqual(jump.target, { label: 25010, resourceId: 25, recordId: 10 });
  const call = vm.run(Uint8Array.of(0x02, 0xb1, 0x61), { resourceId: 25, recordId: 8 }).at(-1);
  assert.deepEqual(call.returnTo, { resourceId: 25, recordId: 8, offset: 3 });
  assert.equal(vm.run(Uint8Array.of(0x15), { resourceId: 25, recordId: 9 }).at(-1).kind, "return");
  assert.equal(vm.run(Uint8Array.of(0x1e, 0xb2, 0x61), { resourceId: 25, recordId: 8 }).at(-1).kind, "branch");
});

test("conditional families keep their distinct target encodings", () => {
  const lengths = Array(256);
  lengths[0x45] = { classification: "fixed", operandLength: 4 };
  lengths[0x56] = { classification: "fixed", operandLength: 4 };
  lengths[0x57] = { classification: "variable", lengthRule: "6+4*u8(0)" };
  lengths[0x5e] = { classification: "fixed", operandLength: 5 };
  const vm = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d, primaryLengths: lengths });
  assert.deepEqual(vm.run(Uint8Array.of(0x45, 0x0f, 0, 0xee, 5),
    { resourceId: 25, recordId: 24 }).at(-1).target,
  { kind: "resource-offset", resourceId: 25, resourceOffset: 1518 });
  assert.deepEqual(vm.run(Uint8Array.of(0x56, 0xb9, 0x69, 0x8f, 0),
    { resourceId: 27, recordId: 63 }).at(-1).target,
  { label: 27065, resourceId: 27, recordId: 65 });
  assert.deepEqual(vm.run(Uint8Array.of(0x5e, 5, 0x42, 0x4a, 0x96, 0),
    { resourceId: 27, recordId: 76 }).at(-1).target,
  { label: 19010, resourceId: 19, recordId: 10 });
  const table = vm.run(Uint8Array.of(0x57, 1, 0x3e, 0x11, 0, 0xed, 0, 0x1c, 0, 0xee, 0),
    { resourceId: 0, recordId: 16 }).at(-1);
  assert.deepEqual(table.options.map((option) => option.target), [
    { kind: "label-or-resource-offset", labelTarget: { label: 17, resourceId: 0, recordId: 17 },
      offsetTarget: { kind: "resource-offset", resourceId: 0, resourceOffset: 17 } },
    { kind: "label-or-resource-offset", labelTarget: { label: 28, resourceId: 0, recordId: 28 },
      offsetTarget: { kind: "resource-offset", resourceId: 0, resourceOffset: 28 } },
  ]);
  const hub = vm.run(Uint8Array.of(0x57, 1, 0x11, 0x7e, 0x69, 2, 0, 0x98, 0x3a, 8, 0),
    { resourceId: 27, recordId: 5 }).at(-1);
  assert.deepEqual(hub.options.map((option) => option.target), [
    { label: 27006, resourceId: 27, recordId: 6 },
    { label: 15000, resourceId: 15, recordId: 0 },
  ]);
});

test("remaining retail cursor writers expose branches and unlock-only paths", () => {
  const lengths = Array(256);
  for (const opcode of [0x0e, 0x0f, 0x24, 0x25]) lengths[opcode] = { classification: "fixed", operandLength: 3 };
  lengths[0x40] = { classification: "fixed", operandLength: 4 };
  for (const opcode of [0x54, 0x55, 0x5d]) lengths[opcode] = { classification: "fixed", operandLength: 5 };
  const vm = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d, primaryLengths: lengths });
  for (const opcode of [0x0e, 0x0f, 0x24, 0x25]) {
    const branch = vm.run(Uint8Array.of(opcode, 7, 0xee, 5), { resourceId: 27, recordId: 2 }).at(-1);
    assert.equal(branch.kind, "branch");
    assert.deepEqual(branch.target, { label: 1518, resourceId: 1, recordId: 518 });
  }
  assert.equal(vm.run(Uint8Array.of(0x40, 7, 3, 0xee, 5),
    { resourceId: 27, recordId: 2 }).at(-1).target.label, 1518);
  for (const opcode of [0x54, 0x55, 0x5d]) {
    const branch = vm.run(Uint8Array.of(opcode, 7, 0xee, 5, 9, 0), { resourceId: 27, recordId: 2 }).at(-1);
    assert.equal(branch.target.label, 1518);
    assert.equal(branch.unlockRequired, true);
    assert.deepEqual(branch.unlockFlag.encoded, [9, 0]);
  }
});

test("variable dispatch tables and chapter transitions stay executable", () => {
  const lengths = Array(256);
  lengths[0x03] = { classification: "fixed", operandLength: 0 };
  lengths[0x44] = { classification: "fixed", operandLength: 0 };
  lengths[0x78] = { classification: "variable", lengthRule: "4+2*u8(0)" };
  lengths[0xbc] = { classification: "variable", lengthRule: "6+4*u8(0)" };
  const vm = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d, primaryLengths: lengths });
  assert.equal(vm.run(Uint8Array.of(0x03), { resourceId: 27, recordId: 1 }).at(-1).kind, "return");
  assert.deepEqual(vm.run(Uint8Array.of(0x44), { resourceId: 31, recordId: 11 }).at(-1).resume,
    { resourceId: 27, recordId: 0, offset: 0 });
  const table78 = vm.run(Uint8Array.of(0x78, 1, 0, 0xee, 5, 0xef, 5),
    { resourceId: 27, recordId: 1 }).find((event) => event.kind === "resource-table");
  assert.equal(table78.kind, "resource-table");
  assert.deepEqual(table78.entries.map((row) => row.target.label), [1518, 1519]);
  const tableBc = vm.run(Uint8Array.of(0xbc, 1, 0, 0xee, 5, 1, 0, 2, 0, 0xef, 5),
    { resourceId: 27, recordId: 1 }).find((event) => event.kind === "resource-table");
  assert.equal(tableBc.kind, "resource-table");
  assert.deepEqual(tableBc.entries.map((row) => row.target.label), [1518, 1519]);
});
