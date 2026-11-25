const hex = (value, width = 2) => `0x${value.toString(16).padStart(width, "0")}`;

const TOP_COMMANDS = new Set([0x0c, 0x08, 0x15, 0x31, 0x53, 0x1c, 0x2f, 0x2d, 0x17]);

export class ScenarioFault extends Error {
  constructor(reason, event, events = []) {
    super(`${reason} at ${event.resourceId}:${event.recordId}+${hex(event.offset, 4)} (${event.handler})`);
    this.reason = reason; this.event = event; this.events = events;
  }
}

function fixedLength(row) {
  return row?.classification === "fixed" && Number.isInteger(row.operandLength) ? row.operandLength : null;
}

function operandLength(row, bytes, pc) {
  const fixed = fixedLength(row); if (fixed != null) return fixed;
  const u8 = (index) => bytes[pc + index];
  switch (row?.lengthRule) {
    case "2+2*u8(0)": return u8(0) == null ? null : 2 + 2 * u8(0);
    case "u8(0)==0?2:1": return u8(0) == null ? null : u8(0) === 0 ? 2 : 1;
    case "2+(u8(2)!=0)": return u8(2) == null ? null : 2 + Number(u8(2) !== 0);
    case "4+(u8(4)!=0)": return u8(4) == null ? null : 4 + Number(u8(4) !== 0);
    case "2+4*u8(0)": return u8(0) == null ? null : 2 + 4 * u8(0);
    default: return null;
  }
}

export class ScenarioVM {
  constructor({ primaryHandlers, sub1dHandlers, primaryLengths = [], sub1dLengths = [], choicePolicy = "first", maxSteps = 100000 }) {
    if (primaryHandlers.length !== 256) throw new Error("primary handler table must contain 256 entries");
    if (sub1dHandlers.length !== 108) throw new Error("1d handler table must contain 108 entries");
    this.primaryHandlers = primaryHandlers; this.sub1dHandlers = sub1dHandlers;
    this.primaryLengths = primaryLengths; this.sub1dLengths = sub1dLengths;
    this.choicePolicy = choicePolicy; this.maxSteps = maxSteps;
  }

  run(bytes, { resourceId, recordId }) {
    const events = []; let pc = 0; let steps = 0; const base = { resourceId, recordId };
    while (pc < bytes.length) {
      if (++steps > this.maxSteps) throw new ScenarioFault("step-limit", { ...base, offset: pc, handler: "n/a" }, events);
      const offset = pc; const opcode = bytes[pc++]; const handler = this.primaryHandlers[opcode];
      const event = { ...base, offset, opcode: hex(opcode), handler, status: "implemented" };
      if (opcode === 0x00) {
        const start = pc;
        while (pc < bytes.length && bytes[pc] !== 0) pc++;
        if (pc >= bytes.length) throw new ScenarioFault("unterminated-text", event, events);
        const payload = bytes.slice(start, pc++);
        events.push({ ...event, kind: "text", byteLength: payload.length, text: new TextDecoder("shift_jis").decode(payload) });
        continue;
      }
      if (opcode === 0x1d) {
        if (pc >= bytes.length) throw new ScenarioFault("missing-1d-subopcode", event, events);
        const subOffset = pc; const subopcode = bytes[pc++]; const subhandler = this.sub1dHandlers[subopcode];
        const subevent = { ...event, offset: subOffset, kind: "subcommand", subopcode: hex(subopcode), handler: subhandler || "out-of-range" };
        if (subopcode === 0x03) { events.push({ ...subevent, status: "implemented", effect: "name-entry-modes-0-then-1" }); continue; }
        const length = operandLength(this.sub1dLengths[subopcode], bytes, pc);
        if (length == null || pc + length > bytes.length) {
          events.push({ ...subevent, status: "unknown-length" });
          throw new ScenarioFault("unknown-1d-operand-length", { ...subevent, status: "unknown-length" }, events);
        }
        const operands = [...bytes.slice(pc, pc + length)]; pc += length;
        events.push({ ...subevent, status: "stub", operandLength: length, operands }); continue;
      }
      const length = operandLength(this.primaryLengths[opcode], bytes, pc);
      if (length == null || pc + length > bytes.length) {
        const stopped = { ...event, status: "unknown-length", kind: "command" }; events.push(stopped);
        throw new ScenarioFault("unknown-operand-length", stopped, events);
      }
      const operands = [...bytes.slice(pc, pc + length)]; pc += length;
      events.push({ ...event, status: TOP_COMMANDS.has(opcode) ? "decoded" : "stub", kind: "command", operandLength: length, operands });
    }
    events.push({ ...base, offset: pc, kind: "terminal", reason: "record-end" }); return events;
  }
}

export function opcodeStatus(primaryHandlers, sub1dHandlers, primaryLengths = [], sub1dLengths = []) {
  return {
    primary: primaryHandlers.map((handler, opcode) => ({ opcode: hex(opcode), handler,
      operandLength: fixedLength(primaryLengths[opcode]), lengthRule: primaryLengths[opcode]?.lengthRule,
      status: opcode === 0x00 || opcode === 0x1d ? "implemented" : TOP_COMMANDS.has(opcode) ? "decoded" : "stub" })),
    sub1d: sub1dHandlers.map((handler, opcode) => ({ opcode: hex(opcode), handler,
      operandLength: fixedLength(sub1dLengths[opcode]), lengthRule: sub1dLengths[opcode]?.lengthRule,
      status: opcode === 0x03 ? "implemented" : "stub" })),
  };
}
