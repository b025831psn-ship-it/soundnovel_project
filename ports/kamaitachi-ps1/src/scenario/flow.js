// Scenario commands: text, jump, call.
//   0x00 0x8001ca24 text      hand the text at the cursor to the text task
//   0x01 0x8001c98c jump      label (u16): continue there; snapshot for the bookmark
//   0x02 0x8001ca58 call      label (u16): push the resource and return offset (0x8008da38)
import { HANDLERS } from "./interp.js";
import { GP, CURSOR, BASE, RESOURCE, s8, io, operand, textStart, resolveLabel, checkpoint, animStop, unported } from "./lib.js";

const STACK = 0x8008da38;

HANDLERS[0x00] = function* text(ctx) {
  const { m } = ctx;
  textStart(m, m.read(CURSOR, 4) >>> 0);
  m.write(0x800792a1, 1, 1);
};

HANDLERS[0x01] = function* jump(ctx) {
  const { m } = ctx, { r32, w32, p8 } = io(m), sub = { ...ctx, sp: ctx.sp - 0x18 };
  const label = operand(m).u16();
  const p = r32(BASE) + resolveLabel(sub, r32(BASE), label);
  w32(CURSOR, p); w32(0x8007940c, p);
  if (m.read(0x800792a0, 1) !== 1) checkpoint(m);
  p8(0x15c, 1);
};

HANDLERS[0x02] = function* call(ctx) {
  const { m } = ctx, { r16, r32, w16, w32, g8, p8 } = io(m), sub = { ...ctx, sp: ctx.sp - 0x18 };
  const push = (v) => { const n = g8(0); p8(0, n + 1); w32(STACK + 4 * n, v); };
  push(r16(RESOURCE));
  const label = operand(m).u16();
  const off = resolveLabel(sub, r32(BASE), label);
  const base = r32(BASE);
  push(r32(CURSOR) - base);
  w32(CURSOR, base + off);
  const back = s8(g8(3));
  if (back !== -1) {
    if (r16(RESOURCE) !== (back & 0xffff)) {
      if (g8(2) === 1 && s8(g8(0x45c)) === (back & 0xffff)) unported(0x8001cb48);
      else if ((back & 0xffff) === 0x1f) unported(0x8001cb74);
      p8(4, 1); ctx.call(0x80036ea0, [2, r32(0x80079544), back & 0xffff], sub.sp); p8(4, 0); // load resource gp[3]: not ported yet
    }
    w16(0x80079280, 2);
    const v = s8(g8(3));
    p8(3, -1);
    w16(0x8007927e, v);
  }
  p8(0x15c, 1);
};
