import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalInstructionTrace,
  firstTraceDifference,
  formatTraceDifference,
  jsonLines,
  parseJsonLines,
} from "../src/trace.js";

test("instruction events have a stable JSONL representation", () => {
  const event = canonicalInstructionTrace({
    pc: 0x80010000,
    instruction: 0x24020001,
    nextPc: 0x80010004,
    hook: false,
  });
  assert.deepEqual(event, {
    kind: "instruction",
    pc: "0x80010000",
    opcode: "0x24020001",
    nextPc: "0x80010004",
  });
  assert.deepEqual(parseJsonLines(jsonLines([event])), [event]);
});

test("trace comparison reports the first divergent field", () => {
  const expected = [{ kind: "instruction", pc: "0x80010000", opcode: "0x00000000", nextPc: "0x80010004" }];
  const actual = [{ ...expected[0], nextPc: "0x80010008" }];
  const difference = firstTraceDifference(expected, actual);
  assert.deepEqual(difference, {
    index: 0,
    field: "nextPc",
    expected: "0x80010004",
    actual: "0x80010008",
  });
  assert.match(formatTraceDifference(difference), /line 1, field nextPc/);
});

test("trace comparison detects truncation", () => {
  assert.deepEqual(firstTraceDifference([{}], []), {
    index: 0,
    field: "length",
    expected: 1,
    actual: 0,
  });
});

test("invalid JSONL identifies its source line", () => {
  assert.throws(() => parseJsonLines("{}\nnot-json\n"), /line 2/);
});
