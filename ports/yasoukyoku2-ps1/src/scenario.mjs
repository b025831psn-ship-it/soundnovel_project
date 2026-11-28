// SLPS-03213 dispatcher 0x80024bfc. The service layer owns display, sound,
// script calls and state. Offsets always address the currently loaded resource.
const handlers = [
  0, 0x26368, 0x264bc, 0x26510, 0x263a8, 0x2648c, 0x263cc, 0x25db4,
  0x25f68, 0x26588, 0x26658, 0x266ec, 0x26750, 0x267a8, 0x2598c, 0x2598c,
  0x26a28, 0x26964, 0x26a60, 0x26a8c, 0x25c60, 0x2681c, 0x2681c, 0x26910,
  0x25af0, 0x26ca8, 0x26d44, 0x26dec, 0x26dc0, 0x26e18, 0x26e88, 0x26ee8,
  0x26fd0, 0x26aac, 0x26b6c, 0x26c4c, 0, 0x2677c, 0x26ff8, 0x27018,
  0x27064, 0x270c8, 0x260fc, 0x270f4, 0x27098, 0x2714c, 0x271f0,
];

export function nextTextCommand(bytes, offset) {
  // Original 0x80027690 accepts a narrower upper range than generic CP932.
  while (offset < bytes.length && bytes[offset] !== 0x40) {
    const lead = bytes[offset];
    offset += (lead >= 0x81 && lead <= 0x9f) || (lead >= 0xe0 && lead <= 0xea) ? 2 : 1;
  }
  if (offset >= bytes.length) throw new RangeError("unterminated scenario text");
  return offset;
}

export function runScenarioSlice(state, services, limit = 100000) {
  for (let step = 0; step < limit; step++) {
    const { bytes, pc } = state;
    if (!Number.isInteger(pc) || pc < 0 || pc + 2 > bytes.length) {
      throw new RangeError("scenario PC outside resource: " + pc);
    }
    const opcode = bytes[pc + 1];
    let next = pc + 2;
    let yieldFrame = false;
    if (bytes[pc] === 0x40 && opcode < handlers.length) {
      if (opcode === 0x24) return "end";
      if (opcode === 0) {
        // The original skips consecutive markers with a temporary cursor,
        // then restores the outer operand pointer in its common tail.
        let marker = pc;
        while (bytes[marker] === 0x40 && bytes[marker + 1] === 0) {
          marker += 10;
          if (marker > bytes.length) throw new RangeError("truncated scenario marker");
        }
      } else {
        const address = 0x80000000 + handlers[opcode];
        const mode = opcode === 0x0f || opcode === 0x16 ? 1 : 0;
        next = services.execute(address, opcode, next, mode, state);
        yieldFrame = [0x1d, 0x2a, 0x2b, 0x2c].includes(opcode);
      }
    }
    state.pc = next;
    const wait = services.waitStatus();
    const busy = services.sceneBusy();
    if (wait === 1 || busy || yieldFrame) return "yield";
  }
  throw new Error("scenario instruction budget exceeded at " + state.pc);
}

