const hex = (value, width = 2) => `0x${value.toString(16).padStart(width, "0")}`;

export class ScenarioFault extends Error {
  constructor(reason, event, events = []) {
    super(`${reason} at ${event.resourceId}:${event.recordId}+${hex(event.offset, 4)} (${event.handler})`);
    this.reason = reason;
    this.event = event;
    this.events = events;
  }
}

export class ScenarioVM {
  constructor({ primaryHandlers, sub1dHandlers, choicePolicy = "first", maxSteps = 100000 }) {
    if (primaryHandlers.length !== 256) throw new Error("primary handler table must contain 256 entries");
    if (sub1dHandlers.length !== 108) throw new Error("1d handler table must contain 108 entries");
    this.primaryHandlers = primaryHandlers;
    this.sub1dHandlers = sub1dHandlers;
    this.choicePolicy = choicePolicy;
    this.maxSteps = maxSteps;
  }

  run(bytes, { resourceId, recordId }) {
    const events = [];
    let pc = 0;
    let steps = 0;
    const base = { resourceId, recordId };
    while (pc < bytes.length) {
      if (++steps > this.maxSteps) throw new ScenarioFault("step-limit", { ...base, offset: pc, handler: "n/a" });
      const offset = pc;
      const opcode = bytes[pc++];
      const handler = this.primaryHandlers[opcode];
      const event = { ...base, offset, opcode: hex(opcode), handler, status: "implemented" };
      if (opcode === 0x00) {
        const start = pc;
        while (pc < bytes.length && bytes[pc] !== 0) pc++;
        if (pc >= bytes.length) throw new ScenarioFault("unterminated-text", event, events);
        const payload = bytes.slice(start, pc++);
        events.push({ ...event, kind: "text", byteLength: payload.length,
          text: new TextDecoder("shift_jis").decode(payload) });
        continue;
      }
      if (opcode === 0x1d) {
        if (pc >= bytes.length) throw new ScenarioFault("missing-1d-subopcode", event, events);
        const subOffset = pc;
        const subopcode = bytes[pc++];
        const subhandler = this.sub1dHandlers[subopcode];
        const subevent = { ...event, offset: subOffset, kind: "subcommand", subopcode: hex(subopcode),
          handler: subhandler || "out-of-range" };
        if (subopcode === 0x03) {
          events.push({ ...subevent, status: "implemented", effect: "name-entry-modes-0-then-1" });
          continue;
        }
        events.push({ ...subevent, status: "stub" });
        throw new ScenarioFault("stubbed-1d-subopcode", { ...subevent, status: "stub" }, events);
      }
      const stub = { ...event, status: "stub", kind: "command" };
      events.push(stub);
      throw new ScenarioFault("stubbed-opcode", stub, events);
    }
    events.push({ ...base, offset: pc, kind: "terminal", reason: "record-end" });
    return events;
  }
}

export function opcodeStatus(primaryHandlers, sub1dHandlers) {
  return {
    primary: primaryHandlers.map((handler, opcode) => ({ opcode: hex(opcode), handler,
      status: opcode === 0x00 || opcode === 0x1d ? "implemented" : "stub" })),
    sub1d: sub1dHandlers.map((handler, opcode) => ({ opcode: hex(opcode), handler,
      status: opcode === 0x03 ? "implemented" : "stub" })),
  };
}
