const word = (bytes, at) => bytes[at] * 256 + bytes[at + 1];

export function branchInfo(command, record) {
  if (command.op !== 4) throw Error("Expected a scenario branch");
  const data = command.payload;
  const mode = data[0] >> 4 & 3;
  if (mode === 0) return { kind: "choice", options: command.options };
  if (mode === 2 && data.length === 3) return { kind: "jump", target: word(data, 1) };
  if (mode !== 1) throw Error("Unknown branch format at " + command.offset);
  const count = data[0] & 15;
  const hasDefault = Boolean(data[0] & 128);
  const tail = 1 + count * 6;
  if (!count || data.length !== tail + (hasDefault ? 2 : 0)) throw Error("Invalid branch table length");
  const tests = [];
  for (let offset = 1; offset < tail; offset += 6) {
    tests.push({
      bank: data[offset] >> 4 ? 1 : 0,
      index: data[offset + 1],
      comparison: data[offset + 2],
      operand: data[offset + 3],
      target: word(data, offset + 4),
    });
  }
  return { kind: "conditional", tests, fallback: hasDefault ? word(data, tail) : record + 1 };
}

export function resolveConditional(branch, flags) {
  // SLPS-01462 0x8001d368: use the first matching unsigned byte comparison.
  for (const test of branch.tests) {
    const value = flags[test.bank][test.index];
    if (!Number.isInteger(value) || value < 0 || value > 255) throw Error("Invalid flag byte");
    const rhs = test.operand;
    const compares = [value === rhs, value !== rhs, value < rhs, value > rhs, value <= rhs, value >= rhs];
    if (compares[test.comparison]) return test.target;
  }
  return branch.fallback;
}
