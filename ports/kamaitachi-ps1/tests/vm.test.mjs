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
  primaryLengths[0x13] = { classification: "variable", lengthRule: "2+2*u8(0)" };
  const events = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d, primaryLengths })
    .run(Uint8Array.of(0x0c, 1, 2, 0x13, 2, 9, 8, 7, 6, 5, 0x00, 0x00),
      { resourceId: 1, recordId: 2 });
  assert.deepEqual(events.filter((event) => event.kind === "command").map((event) => event.operandLength), [2, 6]);
  assert.equal(events.at(-1).reason, "record-end");
});

test("opcode report covers every primary and 1d sub-dispatch slot", () => {
  const report = opcodeStatus(primary, sub1d);
  assert.equal(report.primary.length, 256);
  assert.equal(report.sub1d.length, 108);
  assert.equal(report.primary.filter((row) => row.status === "implemented").length, 2);
  assert.equal(report.sub1d.filter((row) => row.status === "implemented").length, 1);
});
