const hex32 = (value) => `0x${(value >>> 0).toString(16).padStart(8, "0")}`;

export function canonicalInstructionTrace(event) {
  return {
    kind: event.hook ? "hook" : "instruction",
    pc: hex32(event.pc),
    opcode: event.instruction == null ? null : hex32(event.instruction),
    nextPc: hex32(event.nextPc),
  };
}

export function jsonLines(events) {
  return events.map((event) => JSON.stringify(event)).join("\n") + (events.length ? "\n" : "");
}

export function parseJsonLines(text) {
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new SyntaxError(`invalid trace JSON on line ${index + 1}: ${error.message}`); }
  });
}

export function firstTraceDifference(expected, actual, fields = ["kind", "pc", "opcode", "nextPc"]) {
  const count = Math.min(expected.length, actual.length);
  for (let index = 0; index < count; index++) {
    for (const field of fields) {
      if (expected[index]?.[field] !== actual[index]?.[field]) {
        return { index, field, expected: expected[index]?.[field], actual: actual[index]?.[field] };
      }
    }
  }
  if (expected.length !== actual.length)
    return { index: count, field: "length", expected: expected.length, actual: actual.length };
  return null;
}

export function formatTraceDifference(difference) {
  if (!difference) return "traces match";
  const line = difference.index + 1;
  return `trace differs at line ${line}, field ${difference.field}: expected ${JSON.stringify(difference.expected)}, got ${JSON.stringify(difference.actual)}`;
}
