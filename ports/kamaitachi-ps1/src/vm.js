const hex = (value, width = 2) => `0x${value.toString(16).padStart(width, "0")}`;

const TOP_COMMANDS = new Set([0x0c, 0x08, 0x15, 0x31, 0x53, 0x1c, 0x2f, 0x2d, 0x17]);
const OFFSET_BRANCHES = new Set([0x45]);
const labelTarget = (operands) => {
  const label = (operands[1] << 8) | operands[0];
  return { label, resourceId: Math.floor(label / 1000), recordId: label % 1000 };
};
const resourceOffsetTarget = (resourceId, operands) => ({
  kind: "resource-offset", resourceId,
  resourceOffset: (operands.at(-1) << 8) | operands.at(-2),
});

export class ScenarioFault extends Error {
  constructor(reason, event, events = []) {
    super(`${reason} at ${event.resourceId}:${event.recordId}+${hex(event.offset, 4)} (${event.handler})`);
    this.reason = reason; this.event = event; this.events = events;
  }
}

function fixedLength(row) {
  return row?.classification === "fixed" && Number.isInteger(row.operandLength) ? row.operandLength : null;
}

function operandLength(row, bytes, pc, primaryLengths = []) {
  const fixed = fixedLength(row); if (fixed != null) return fixed;
  const u8 = (index) => bytes[pc + index];
  switch (row?.lengthRule) {
    case "4+2*u8(0)": return u8(0) == null ? null : 4 + 2 * u8(0);
    case "u8(0)==0?2:1": return u8(0) == null ? null : u8(0) === 0 ? 2 : 1;
    case "2+nested(2)": return nestedLength(bytes, pc + 2, primaryLengths, 2);
    case "4+nested(4)": return nestedLength(bytes, pc + 4, primaryLengths, 4);
    case "6+4*u8(0)": return u8(0) == null ? null : 6 + 4 * u8(0);
    default: return null;
  }
}

function nestedLength(bytes, opcodePc, primaryLengths, prefix) {
  // A wrapper may end exactly at a record boundary; the nested opcode then
  // starts the following record and the wrapper itself consumed only prefix.
  const opcode = bytes[opcodePc]; if (opcode == null) return prefix;
  if (opcode === 0x00 || opcode === 0x17) {
    const payload = opcodePc + (opcode === 0x17 ? 2 : 1);
    let end = payload; while (end < bytes.length && bytes[end] !== 0) end++;
    return end < bytes.length ? prefix + (end - opcodePc + 1) : null;
  }
  const nested = operandLength(primaryLengths[opcode], bytes, opcodePc + 1, primaryLengths);
  return nested == null ? null : prefix + 1 + nested;
}

export class ScenarioVM {
  constructor({ primaryHandlers, sub1dHandlers, primaryLengths = [], sub1dLengths = [], choicePolicy = "first", maxSteps = 100000 }) {
    if (primaryHandlers.length !== 256) throw new Error("primary handler table must contain 256 entries");
    if (sub1dHandlers.length !== 108) throw new Error("1d handler table must contain 108 entries");
    this.primaryHandlers = primaryHandlers; this.sub1dHandlers = sub1dHandlers;
    this.primaryLengths = primaryLengths; this.sub1dLengths = sub1dLengths;
    this.choicePolicy = choicePolicy; this.maxSteps = maxSteps;
  }

  run(bytes, { resourceId, recordId, offset: startOffset = 0 }) {
    const events = []; let pc = startOffset; let steps = 0; const base = { resourceId, recordId };
    while (pc < bytes.length) {
      if (++steps > this.maxSteps) throw new ScenarioFault("step-limit", { ...base, offset: pc, handler: "n/a" }, events);
      const offset = pc; const opcode = bytes[pc++]; const handler = this.primaryHandlers[opcode];
      const event = { ...base, offset, opcode: hex(opcode), handler, status: "implemented" };
      if (opcode === 0x00) {
        if (pc === bytes.length) {
          events.push({ ...event, kind: "text-boundary", reason: "record-terminal-zero" });
          continue;
        }
        const start = pc;
        while (pc < bytes.length && bytes[pc] !== 0) pc++;
        if (pc >= bytes.length) {
          const payload = bytes.slice(start);
          events.push({ ...event, kind: "text", byteLength: payload.length, terminated: false,
            reason: "resource-terminal-text", text: new TextDecoder("shift_jis").decode(payload) });
          continue;
        }
        const payload = bytes.slice(start, pc++);
        events.push({ ...event, kind: "text", byteLength: payload.length, text: new TextDecoder("shift_jis").decode(payload) });
        continue;
      }
      if (opcode === 0x17) {
        if (pc >= bytes.length) throw new ScenarioFault("missing-text-mode", event, events);
        const mode = bytes[pc++]; const start = pc;
        while (pc < bytes.length && bytes[pc] !== 0) pc++;
        if (pc >= bytes.length) throw new ScenarioFault("unterminated-text", { ...event, mode }, events);
        const payload = bytes.slice(start, pc++);
        events.push({ ...event, kind: "text", mode, byteLength: payload.length,
          text: new TextDecoder("shift_jis").decode(payload) });
        continue;
      }
      if (opcode === 0x1d) {
        if (pc >= bytes.length) throw new ScenarioFault("missing-1d-subopcode", event, events);
        const subOffset = pc; const subopcode = bytes[pc++]; const subhandler = this.sub1dHandlers[subopcode];
        const subevent = { ...event, offset: subOffset, kind: "subcommand", subopcode: hex(subopcode), handler: subhandler || "out-of-range" };
        if (subopcode === 0x03) { events.push({ ...subevent, status: "implemented", effect: "name-entry-modes-0-then-1" }); continue; }
        const length = operandLength(this.sub1dLengths[subopcode], bytes, pc, this.primaryLengths);
        if (length == null || pc + length > bytes.length) {
          events.push({ ...subevent, status: "unknown-length" });
          throw new ScenarioFault("unknown-1d-operand-length", { ...subevent, status: "unknown-length" }, events);
        }
        const operands = [...bytes.slice(pc, pc + length)]; pc += length;
        events.push({ ...subevent, status: "stub", operandLength: length, operands }); continue;
      }
      const length = operandLength(this.primaryLengths[opcode], bytes, pc, this.primaryLengths);
      if (length == null || pc + length > bytes.length) {
        const stopped = { ...event, status: "unknown-length", kind: "command" }; events.push(stopped);
        throw new ScenarioFault("unknown-operand-length", stopped, events);
      }
      const operands = [...bytes.slice(pc, pc + length)]; pc += length;
      if (opcode === 0x01 || opcode === 0x02) {
        const target = labelTarget(operands);
        events.push({ ...event, status: "implemented", kind: opcode === 0x01 ? "jump" : "call",
          target, returnTo: opcode === 0x02 ? { resourceId, recordId, offset: pc } : null,
          operandLength: length, operands });
        return events;
      }
      if (opcode === 0x03) {
        events.push({ ...event, status: "implemented", kind: "jump",
          target: { kind: "next-resource", recordId: 0 }, operandLength: length, operands });
        return events;
      }
      if (opcode === 0x15) {
        events.push({ ...event, status: "implemented", kind: "return", target: null,
          operandLength: length, operands });
        return events;
      }
      if (opcode === 0x1e) {
        const target = resourceOffsetTarget(resourceId, operands);
        events.push({ ...event, status: "implemented", kind: "branch", target,
          fallthrough: { resourceId, recordId, offset: pc },
          condition: { kind: "retail-condition-latch-equals", address: "0x80079296" },
          operandLength: length, operands });
        return events;
      }
      if (OFFSET_BRANCHES.has(opcode)) {
        const target = resourceOffsetTarget(resourceId, operands);
        events.push({ ...event, status: "implemented", kind: "branch", target,
          fallthrough: { resourceId, recordId, offset: pc },
          condition: { kind: "retail-flag-expression", opcode: hex(opcode),
            operands: operands.slice(0, -2) }, operandLength: length, operands });
        return events;
      }
      if (opcode === 0x56) {
        const target = labelTarget(operands.slice(0, 2));
        events.push({ ...event, status: "implemented", kind: "branch", target,
          fallthrough: { resourceId, recordId, offset: pc },
          condition: { kind: "retail-flag-expression", opcode: hex(opcode),
            operands: operands.slice(2) }, operandLength: length, operands });
        return events;
      }
      if (opcode === 0x5e) {
        const targetRecord = (operands.at(-1) << 8) | operands.at(-2);
        events.push({ ...event, status: "implemented", kind: "branch",
          target: { resourceId, recordId: targetRecord, offset: 0 },
          fallthrough: { resourceId, recordId, offset: pc },
          condition: { kind: "retail-flag-expression", opcode: hex(opcode),
            operands: operands.slice(0, -2) }, operandLength: length, operands });
        return events;
      }
      if (opcode === 0x3c) {
        events.push({ ...event, status: "implemented", kind: "flag-store",
          flag: `condition:${operands[1]}`, value: operands[0], operandLength: length, operands });
        continue;
      }
      if (opcode === 0x4b) {
        const label = labelTarget(operands);
        events.push({ ...event, status: "implemented", kind: "flag-store",
          flag: "next-resource", value: label.resourceId, label: label.label,
          operandLength: length, operands });
        continue;
      }
      if (opcode === 0x44) {
        events.push({ ...event, status: "implemented", kind: "ending",
          id: "title-return", evidence: "unique handler 0x8002188c transition",
          operandLength: length, operands });
        return events;
      }
      if (opcode === 0x13) {
        const options = [];
        for (let index = 2; index + 1 < operands.length; index += 2) {
          const target = labelTarget(operands.slice(index, index + 2));
          options.push({ index: options.length, label: target.label,
            target: { resourceId: target.resourceId, recordId: target.recordId } });
        }
        events.push({ ...event, status: "implemented", kind: "choice", optionCount: options.length,
          mode: operands[0], flags: operands[1], options, target: null, operandLength: length, operands });
        return events;
      }
      if (opcode === 0x57) {
        const options = [];
        for (let index = 4; index + 1 < operands.length; index += 4) {
          const targetRecord = (operands[index + 1] << 8) | operands[index];
          options.push({ index: options.length,
            target: { resourceId, recordId: targetRecord, offset: 0 } });
        }
        events.push({ ...event, status: "implemented", kind: "choice-table", options,
          fallthrough: { resourceId, recordId, offset: pc }, operandLength: length, operands });
        return events;
      }
      events.push({ ...event, status: TOP_COMMANDS.has(opcode) ? "decoded" : "stub", kind: "command", operandLength: length, operands });
    }
    events.push({ ...base, offset: pc, kind: "terminal", reason: "record-end" }); return events;
  }
}

export function opcodeStatus(primaryHandlers, sub1dHandlers, primaryLengths = [], sub1dLengths = []) {
  return {
    primary: primaryHandlers.map((handler, opcode) => ({ opcode: hex(opcode), handler,
      operandLength: fixedLength(primaryLengths[opcode]), lengthRule: primaryLengths[opcode]?.lengthRule,
      status: opcode === 0x00 || opcode === 0x1d || opcode === 0x13 ? "implemented" : TOP_COMMANDS.has(opcode) ? "decoded" : "stub" })),
    sub1d: sub1dHandlers.map((handler, opcode) => ({ opcode: hex(opcode), handler,
      operandLength: fixedLength(sub1dLengths[opcode]), lengthRule: sub1dLengths[opcode]?.lengthRule,
      status: opcode === 0x03 ? "implemented" : "stub" })),
  };
}
