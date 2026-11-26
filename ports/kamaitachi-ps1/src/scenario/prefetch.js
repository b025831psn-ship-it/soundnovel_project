// The lookahead forms of the scenario commands (opcode + 0x65, run by interp.js lookahead):
// they read the same operands and start loading what the command will need, so that the
// CD is already busy when the script gets there. gp[0x5b] = 1 stops the lookahead.
//   0x80023778 prefetchLabel(label)  the SCE resource of a jump target (label / 1000);
//                                    0x8007927e/0x80079280 = what was last fetched (id, kind)
//   0x65 text  (skipped, 0x8003919c)    0x78 choice (0x13)    0x81 (0x1c)    0x82 (0x1d)
//   0x95 se (0x30)  0x97 seVol (0x32)  0xbb jump (0x56)  0xbc route table (0x57)
import { HANDLERS } from "./interp.js";
import { CURSOR, GP, operand, unported } from "./lib.js";

const LAST_ID = 0x8007927e, LAST_KIND = 0x80079280, RESOURCE = 0x8007929c, BUF = 0x80079544, SDW_BUF = 0x80079484, SE_BUF = 0x80079514;
const stop = (m) => m.write(GP + 0x5b, 1, 1);
const s16 = (v) => (v << 16) >> 16;

export function prefetchLabel(ctx, label) { // 0x80023778
  const { m } = ctx, sp = ctx.sp - 0x18, res = Math.trunc((label & 0xffff) / 1000) & 0xffff;
  if (!(s16(m.read(LAST_ID, 2)) === res && s16(m.read(LAST_KIND, 2)) === 2) && m.read(RESOURCE, 2) !== res) {
    if (m.read(GP + 2, 1) === 1 && ((m.read(GP + 0x45c, 1) << 24) >> 24) === res) unported(0x800237f0); // kept in memory
    if (res === 0x1f) unported(0x8002382c); // the resource in the EXE
    m.write(GP + 4, 1, 1);
    ctx.call(0x80036ea0, [2, m.read(BUF, 4) >>> 0, res], sp);
    m.write(GP + 4, 0, 1);
  }
  m.write(LAST_KIND, 2, 2); m.write(LAST_ID, res, 2);
}

export function textSkip(m, p) { // 0x8003919c: past the text (2-byte characters from 0x80) and its 0
  for (let b; (b = m.read(p, 1)); ) p += b < 0x80 ? 1 : 2;
  m.write(CURSOR, (p + 1) >>> 0, 4);
}
HANDLERS[0x65] = function* (ctx) { textSkip(ctx.m, ctx.m.read(CURSOR, 4) >>> 0); };

HANDLERS[0x78] = function* (ctx) {
  const { m } = ctx, o = operand(m), n = o.u8(); o.skip(1);
  prefetchLabel({ ...ctx, sp: ctx.sp - 0x18 }, o.u16());
  o.skip(2 * Math.min(n, 8));
  stop(m);
};

const STOPS_81 = new Set([0x08, 0x09, 0x0e, 0x0f, 0x1d, 0x38, 0x3a, 0x47, 0x48, 0x49, 0x5a, 0x5c, 0x5d]);
HANDLERS[0x81] = function* (ctx) {
  const { m } = ctx, b = operand(m).u8();
  if (b === 0x4b) { ctx.call(0x80036ea0, [1, m.read(SDW_BUF, 4) >>> 0, 0x23f5], ctx.sp - 0x18); stop(m); }
  else if (STOPS_81.has(b)) stop(m);
};

HANDLERS[0x82] = function* (ctx) {
  const { m } = ctx, b = operand(m).u8();
  if (b === 3 || b === 4) { ctx.call(0x80036ea0, [1, m.read(SDW_BUF, 4) >>> 0, b === 3 ? 0x2329 : 0x2328], ctx.sp - 0x18); stop(m); }
  else if (b < 2 || b === 0x66 || b === 0x67) stop(m);
};

function prefetchSe(ctx, id) { // shared tail of 0x95 and 0x97 (frame 0x28)
  const { m } = ctx, sp = ctx.sp - 0x28;
  if (m.read(GP + 0x5e, 1)) return;
  if (id < 1000) {
    if (!(s16(m.read(LAST_ID, 2)) === id && s16(m.read(LAST_KIND, 2)) === 3)) ctx.call(0x80036ea0, [3, m.read(SE_BUF, 4) >>> 0, id], sp);
    m.write(LAST_KIND, 3, 2); m.write(LAST_ID, id, 2); stop(m); return;
  }
  const bank = Math.trunc((id - 1000) / 1000), n = id % 1000;
  let s2 = n;
  if (m.read(0x8006b04c + 2 * (ctx.call(0x800264f0, [(n + 1000) & 0xffff], sp) | 0), 1) === 1) s2 = n + (bank & 0xff) * 1000;
  const s1 = s2 & 0xffff;
  const kind = m.read(0x8006b1cc + 2 * (ctx.call(0x800264f0, [(s1 + 1000) & 0xffff], sp) | 0), 1) === 1 ? 6 : 5;
  if (!(s16(m.read(LAST_ID, 2)) === s1 && s16(m.read(LAST_KIND, 2)) === kind)) {
    ctx.call(0x80036ea0, [kind, m.read(BUF, 4) >>> 0, s1], sp);
    m.write(LAST_KIND, kind, 2); m.write(LAST_ID, s2, 2);
  }
  stop(m);
}
HANDLERS[0x95] = function* (ctx) { prefetchSe(ctx, operand(ctx.m).u16()); };
HANDLERS[0x97] = function* (ctx) { const o = operand(ctx.m); o.u16(); prefetchSe(ctx, o.u16()); };

HANDLERS[0xbb] = function* (ctx) {
  const { m } = ctx, o = operand(m), label = o.u16(); o.skip(2);
  prefetchLabel({ ...ctx, sp: ctx.sp - 0x18 }, label);
  stop(m);
};

HANDLERS[0xbc] = function* (ctx) {
  const { m } = ctx, o = operand(m), n = o.u8(); o.skip(1);
  const a = o.u16(); o.u16();
  prefetchLabel({ ...ctx, sp: ctx.sp - 0x20 }, a);
  o.skip(4 * Math.min(n, 8));
  stop(m);
};
