// Scenario commands for variables, conditional jumps, saves and resets.
//   0x37 0x80020ec0 skip u16                 0x41 0x800215c8 var[u8] = u8 (vars 0x80079558)
//   0x3c 0x80021278 (u8 a, u8 k): a = 0: 0x8008dab8[k] = 0x80079297 = 0x80033868()
//   0x3e 0x80021350 the save point: with 0x800792a1 set, 0x800325b0 (cursor at 0x8007940c)
//   0x40 0x8002144c if var[u8] = u8 jump label u16 (through the label resolver)
//   0x45 0x80021510 if s16 0x801fec68 = u16 jump offset u16 (in this resource)
//   0x4b 0x80021fe0 gp[3] = u16 / 1000; in auto mode 0x8007928e = 1
//   0x4c 0x80022058 0x8003704c()
//   0x4d 0x80022078 0x800792b2 = u8, the full-screen picture sprite, 0x8001f690
//   0x4e 0x80022198 reset the screen state (sprites, shake, animations, weather)
//   0x53 0x80022448 seen[u16] = 3 (0x801f5bc0), 0x800792bc = id, three state copies
//   0x5f 0x80022534 seen[u16] = 3
import { HANDLERS } from "./interp.js";
import { CURSOR, BASE, io, operand, resolveLabel, animStop } from "./lib.js";
import { pictureSprite } from "./basic.js";
import { spriteClearAll } from "../screen/sprites.js";
import { memcpy } from "../screen/weather.js";

const SKIP = 0x80079295, NO_EFFECTS = 0x800792a0, VARS = 0x80079558, SEEN = 0x801f5bc0;
const endFrame = (m) => m.write(0x8007913c + 0x15c, 1, 1);
const quiet = (m) => m.read(SKIP, 1) === 1 || m.read(NO_EFFECTS, 1) === 1;

HANDLERS[0x37] = function* (ctx) { operand(ctx.m).u16(); endFrame(ctx.m); };

HANDLERS[0x3c] = function* (ctx) {
  const { m } = ctx, o = operand(m), a = o.u8(), k = o.u8();
  if (!quiet(m) && !a) { const v = ctx.call(0x80033868, [], ctx.sp - 0x20) & 0xff; m.write(0x8008dab8 + k, v, 1); m.write(0x80079297, v, 1); }
  endFrame(m);
};

HANDLERS[0x3e] = function* (ctx) {
  const { m } = ctx;
  if (m.read(NO_EFFECTS, 1) === 1) { m.write(0x800792a2, 1, 1); m.write(0x800792a1, 0, 1); return; }
  if (m.read(0x800792a1, 1) !== 1) return;
  m.write(0x8007940c, m.read(CURSOR, 4), 4);
  ctx.call(0x800325b0, [], ctx.sp - 0x18);
  m.write(0x800792a1, 0, 1);
  endFrame(m);
};

HANDLERS[0x40] = function* (ctx) {
  const { m } = ctx, o = operand(m), i = o.u8(), v = o.u8(), label = o.u16();
  if (m.read(VARS + i, 1) === v) {
    const off = resolveLabel({ ...ctx, sp: ctx.sp - 0x20 }, m.read(BASE, 4) >>> 0, label) & 0xffff;
    m.write(CURSOR, ((m.read(BASE, 4) >>> 0) + off) >>> 0, 4);
  }
  endFrame(m);
};

HANDLERS[0x41] = function* (ctx) { const { m } = ctx, o = operand(m), i = o.u8(); m.write(VARS + i, o.u8(), 1); endFrame(m); };

HANDLERS[0x45] = function* (ctx) {
  const { m } = ctx, o = operand(m), a = o.u16(), off = o.u16();
  if (m.read(NO_EFFECTS, 1) !== 1 && ((m.read(0x801fec68, 2) << 16) >> 16) === a) m.write(CURSOR, ((m.read(BASE, 4) >>> 0) + off) >>> 0, 4);
  endFrame(m);
};

HANDLERS[0x4b] = function* (ctx) {
  const { m } = ctx, v = operand(m).u16();
  m.write(0x8007913c + 3, Math.trunc(v / 1000) & 0xff, 1);
  if (m.read(0x800792c6, 1) === 1) m.write(0x8007928e, 1, 1);
};

HANDLERS[0x4c] = function* (ctx) { ctx.call(0x8003704c, [], ctx.sp - 0x18); };

HANDLERS[0x4d] = function* (ctx) {
  const { m } = ctx, k = operand(m).u8(), sp = ctx.sp - 0x20;
  if (quiet(m)) { endFrame(m); return; }
  m.write(0x800792b2, k, 1);
  pictureSprite(ctx, sp);
  ctx.call(0x8001f690, [], sp);
};

HANDLERS[0x4e] = function* (ctx) {
  const { m } = ctx, sp = ctx.sp - 0x18, sub = { ...ctx, sp };
  ctx.call(0x8001bbc4, [], sp);
  for (let i = 0; i < 16; i++) { m.write(0x8009da48 + 8 * i + 4, 0, 4); m.write(0x8009da48 + 8 * i, 0, 4); }
  m.write(0x800795e4, 5, 1); m.write(0x800795e6, 0xf, 1); m.write(0x800795e5, 0, 1);
  ctx.call(0x800418d0, [0], sp);
  spriteClearAll(sub);
  ctx.call(0x80037c1c, [], sp);
  animStop(m);
  ctx.call(0x800371fc, [], sp);
};

HANDLERS[0x53] = function* (ctx) {
  const { m } = ctx, id = operand(m).u16();
  if (quiet(m)) { endFrame(m); return; }
  m.write(SEEN + id, 3, 1); m.write(0x800792bc, id, 2);
  memcpy(m, 0x801fa730, 0x801fc258, 0x200);
  memcpy(m, SEEN, 0x801f5d38, 0x12c);
  memcpy(m, 0x801d6110, 0x801d6528, 0x12c);
};

HANDLERS[0x5f] = function* (ctx) {
  const { m } = ctx, id = operand(m).u16();
  if (quiet(m)) { endFrame(m); return; }
  m.write(SEEN + id, 3, 1);
};
