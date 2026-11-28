// The scenario interpreter, ported at RAM level. The script cursor is 0x80079578; each
// command is one opcode byte (handlers at 0x8006a3ec, 202 entries) and its operands.
//   0x8001c110 step()       runs commands until one ends the frame (gp[0x15c] = 0); before
//                           each, while the text side is idle (0x8003a560), the lookahead
//   0x80023600 lookahead()  scans up to 12 commands ahead through the handlers from 0x65 on
//                           (the "prefetch" forms), stopping at one that sets gp[0x5b];
//                           the cursor is restored afterwards.
// Handlers not ported yet run through ctx.call at their original address (on the oracle:
// natively). Ported handlers are generators (they may wait frames through tick.js).
// The trivial handlers (skip operands / set a gp flag) were classified from the code by
// pattern and are listed in TRIVIAL as [kind, ...]: skip n | set gpOffset value |
// skipset n gpOffset value | nop.
import { call } from "../menu/calls.js";
const GP = 0x8007913c, CURSOR = 0x80079578, START = 0x800795c4, TABLE = 0x8006a3ec, BLOCK = 0x800792a4;
const unported = (addr) => { throw new Error(`scenario: path at 0x${addr.toString(16)} is not ported`); };

export const TRIVIAL = {
  0x33: ["set", 348, 1], 0x68: ["set", 91, 1], 0x69: ["skip", 2], 0x6a: ["skip", 2], 0x6b: ["skip", 2], 0x6c: ["skip", 2],
  0x6d: ["skip", 3], 0x6e: ["skip", 3], 0x6f: ["skip", 1], 0x70: ["skip", 1], 0x71: ["skip", 2], 0x72: ["skip", 1],
  0x73: ["skipset", 3, 91, 1], 0x74: ["skipset", 3, 91, 1], 0x75: ["skip", 2], 0x76: ["skip", 2], 0x77: ["set", 91, 1], 0x79: ["skip", 1],
  0x7a: ["nop"], 0x7b: ["set", 91, 1], 0x7c: ["set", 91, 1], 0x7d: ["skip", 2], 0x7e: ["skip", 2], 0x7f: ["skip", 1],
  0x80: ["skip", 1], 0x83: ["skip", 2], 0x84: ["nop"], 0x85: ["nop"], 0x86: ["skip", 1], 0x87: ["skip", 1],
  0x88: ["skip", 2], 0x89: ["skipset", 3, 91, 1], 0x8a: ["skipset", 3, 91, 1], 0x8b: ["skip", 1], 0x8c: ["skip", 1], 0x8d: ["skip", 1],
  0x8e: ["skip", 3], 0x8f: ["skip", 1], 0x90: ["skip", 3], 0x91: ["nop"], 0x92: ["skip", 3], 0x93: ["skip", 2],
  0x94: ["skip", 2], 0x96: ["skip", 4], 0x98: ["nop"], 0x99: ["skip", 2], 0x9a: ["skip", 3], 0x9b: ["skip", 3],
  0x9c: ["skip", 2], 0x9d: ["nop"], 0x9e: ["skip", 7], 0x9f: ["skip", 1], 0xa0: ["skip", 1], 0xa1: ["skip", 2],
  0xa2: ["set", 91, 1], 0xa3: ["nop"], 0xa4: ["skipset", 1, 91, 1], 0xa5: ["skipset", 4, 91, 1], 0xa6: ["skip", 2], 0xa7: ["skip", 1],
  0xa8: ["skip", 2], 0xa9: ["set", 91, 1], 0xaa: ["skipset", 4, 91, 1], 0xab: ["skip", 1], 0xac: ["skip", 1], 0xad: ["skip", 1],
  0xae: ["nop"], 0xaf: ["skip", 4], 0xb0: ["skip", 2], 0xb1: ["nop"], 0xb2: ["skip", 1], 0xb3: ["nop"],
  0xb4: ["skip", 1], 0xb5: ["skip", 2], 0xb6: ["skipset", 3, 91, 1], 0xb7: ["set", 91, 1], 0xb8: ["skip", 2], 0xb9: ["skipset", 5, 91, 1],
  0xba: ["skipset", 5, 91, 1], 0xbd: ["skip", 2], 0xbe: ["nop"], 0xbf: ["skipset", 1, 91, 1], 0xc0: ["skip", 1], 0xc1: ["skip", 2],
  0xc2: ["skipset", 5, 91, 1], 0xc3: ["skipset", 5, 91, 1], 0xc4: ["skip", 2], 0xc5: ["skip", 1], 0xc6: ["skip", 2], 0xc7: ["skip", 2],
  0xc8: ["nop"], 0xc9: ["nop"], 0x66: ["skipset", 2, 91, 1],
};

export const HANDLERS = {}; // op -> function*(ctx), filled by the handler modules
export const OP_COUNT = new Uint32Array(256); // commands run per opcode (coverage)

function trivial(m, t) {
  const [kind, a, b, c] = t;
  if (kind === "skip") m.write(CURSOR, (m.read(CURSOR, 4) + a) >>> 0, 4);
  else if (kind === "set") m.write(GP + a, b, 1);
  else if (kind === "skipset") { m.write(GP + b, c, 1); m.write(CURSOR, (m.read(CURSOR, 4) + a) >>> 0, 4); }
}

export function* runOp(ctx, op) {
  OP_COUNT[op]++;
  const t = TRIVIAL[op];
  if (t) { trivial(ctx.m, t); return; }
  const h = HANDLERS[op];
  if (h) { yield* h(ctx); return; }
  ctx.call(ctx.m.read(TABLE + 4 * op, 4) >>> 0, [], ctx.sp);
}

export function textIdle(m) { // 0x8003a560
  let idle = 1;
  for (let i = 0; i < 2; i++) if (m.read(0x800794c0 + 4 * i, 4) && !m.read(0x80079500 + i, 1)) idle = 0;
  return idle;
}

export function* lookahead(ctx, mode) { // 0x80023600
  const { m } = ctx, sub = { ...ctx, sp: ctx.sp - 0x20 };
  m.write(GP + 0x5e, mode, 1); m.write(GP + 0x5c, 0, 2); m.write(GP + 0x5b, 0, 1);
  m.write(GP + 0x300, m.read(CURSOR, 4), 4);
  for (let i = 0; ; i++) {
    const cur = m.read(CURSOR, 4) >>> 0;
    if (m.read(cur, 1) >= 0x6a) unported(0x80023658); // text bytes in the lookahead window
    const op = m.read(cur, 1);
    m.write(CURSOR, cur + 1, 4);
    yield* runOp(sub, op + 0x65);
    if (m.read(GP + 0x5b, 1) || (i & 0xffff) >= 0xb) break;
  }
  m.write(CURSOR, m.read(GP + 0x300, 4), 4);
}

export function* step(ctx) { // 0x8001c110
  const { m } = ctx, sub = { ...ctx, sp: ctx.sp - 0x20 };
  do {
    m.write(GP + 0x15c, 0, 1);
    if (m.read(BLOCK, 1) === 1) { // 0x8001c140: auto mode cancelled by a button: commands 0x15 and 0x03, then 0x8001c8f8
      yield* HANDLERS[0x15]({ ...sub, sp: sub.sp - 0x18 }); m.write(0x8007940c, m.read(CURSOR, 4), 4);
      yield* HANDLERS[0x03]({ ...sub, sp: sub.sp - 0x18 }); m.write(0x8007940c, m.read(CURSOR, 4), 4);
      yield* call(sub, sub.sp, 0x8001c8f8, 0, 0, 0, 0);
      m.write(BLOCK, 0, 1);
    }
    if (textIdle(m) !== 1) continue;
    if (!m.read(GP + 4, 1) && !m.read(0x800792a0, 1) && !m.read(0x80079295, 1)) yield* lookahead({ ...sub, sp: sub.sp - 0x18 }, 0); // 0x8002374c
    const cur = m.read(CURSOR, 4) >>> 0;
    m.write(START, cur, 4);
    m.write(CURSOR, cur + 1, 4);
    yield* runOp(sub, m.read(cur, 1));
  } while (m.read(GP + 0x15c, 1));
}
