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
import { anyRoute, waitText, resetStream, choiceColoursReset } from "../helpers.js";
import { HANDLERS } from "./interp.js";
import { CURSOR, BASE, io, operand, resolveLabel, animStop, checkpoint } from "./lib.js";
import { pictureSprite } from "./basic.js";
import { windowPalette } from "../screen/fader.js";
import { spriteClearAll } from "../screen/sprites.js";
import { memcpy } from "../screen/weather.js";

const SKIP = 0x80079295, NO_EFFECTS = 0x800792a0, VARS = 0x80079558, SEEN = 0x801f5bc0;
const endFrame = (m) => m.write(0x8007913c + 0x15c, 1, 1);
const quiet = (m) => m.read(SKIP, 1) === 1 || m.read(NO_EFFECTS, 1) === 1;

HANDLERS[0x37] = function* (ctx) { operand(ctx.m).u16(); endFrame(ctx.m); };

HANDLERS[0x3c] = function* (ctx) {
  const { m } = ctx, o = operand(m), a = o.u8(), k = o.u8();
  if (!quiet(m) && !a) { const v = anyRoute(m); m.write(0x8008dab8 + k, v, 1); m.write(0x80079297, v, 1); }
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

HANDLERS[0x4c] = function* (ctx) { yield* waitText({ ...ctx, sp: ctx.sp - 0x18 }); };

HANDLERS[0x4d] = function* (ctx) {
  const { m } = ctx, k = operand(m).u8(), sp = ctx.sp - 0x20;
  if (quiet(m)) { endFrame(m); return; }
  m.write(0x800792b2, k, 1);
  pictureSprite(ctx, sp);
  windowPalette({ ...ctx, sp });
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
  resetStream(m);
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

// 0x56 0x800227e8 jump(label u16, k u16) with a checkpoint; seen2[k] = 3 (0x801fa730)
HANDLERS[0x56] = function* (ctx) {
  const { m } = ctx, o = operand(m), label = o.u16(), k = o.u16();
  const off = resolveLabel({ ...ctx, sp: ctx.sp - 0x20 }, m.read(BASE, 4) >>> 0, label) & 0xffff;
  const p = ((m.read(BASE, 4) >>> 0) + off) >>> 0;
  m.write(CURSOR, p, 4); m.write(0x8007940c, p, 4);
  if (m.read(NO_EFFECTS, 1) !== 1) { m.write(0x801fa730 + k, 3, 1); checkpoint(m); }
  endFrame(m);
};

// 0x57 0x800228c8 the route table of a branch: (n u8, u8, then n + 1 pairs of u16) to
// 0x801f7348 / 0x80093be8; skipping starts and the current resource is kept in memory.
HANDLERS[0x57] = function* (ctx) {
  const { m } = ctx, o = operand(m), n = o.u8();
  m.write(0x800794cb, n, 1); m.write(0x80079430, o.u8(), 1);
  const pairs = [];
  for (let k = 0; k <= 8; k++) if (k === 0 || n >= k) pairs.push([o.u16(), o.u16()]);
  pairs.forEach(([a, b], k) => { m.write(0x801f7348 + 2 * k, a, 2); m.write(0x80093be8 + 2 * k, b, 2); });
  m.write(SKIP, 1, 1);
  if (m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  choiceColoursReset({ ...ctx, sp: ctx.sp - 0x48 });
  memcpy(m, m.read(BASE, 4) >>> 0, ((m.read(0x80079544, 4) >>> 0) + 0x28000) >>> 0, 0xb000);
  m.write(0x8007913c + 2, 1, 1); m.write(0x8007913c + 0x45c, m.read(0x8007929c, 1), 1);
};

HANDLERS[0x58] = function* (ctx) {
  const { m } = ctx, id = operand(m).u16();
  if (quiet(m)) { endFrame(m); return; }
  m.write(0x801fa730 + id, 3, 1);
};

// 0x63 0x80023520 0x80059708(0)
HANDLERS[0x63] = function* (ctx) {
  const { m } = ctx;
  if (quiet(m)) { endFrame(m); return; }
  ctx.call(0x80059708, [0], ctx.sp - 0x18);
};

// 0x13 0x8001e3c0 the label table of a choice: (n u8, u8, then n + 1 labels u16) to
// 0x801f7348, the second table (0x80093be8) cleared; skipping starts as in 0x57.
HANDLERS[0x13] = function* (ctx) {
  const { m } = ctx, o = operand(m), n = o.u8();
  m.write(0x800794cb, n, 1); m.write(0x80079430, o.u8(), 1);
  const labels = [];
  for (let k = 0; k <= 8; k++) if (k === 0 || n >= k) labels.push(o.u16());
  labels.forEach((a, k) => m.write(0x801f7348 + 2 * k, a, 2));
  m.write(SKIP, 1, 1);
  choiceColoursReset({ ...ctx, sp: ctx.sp - 0x30 });
  if (m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  memcpy(m, m.read(BASE, 4) >>> 0, ((m.read(0x80079544, 4) >>> 0) + 0x28000) >>> 0, 0xb000);
  m.write(0x8007913c + 2, 1, 1); m.write(0x8007913c + 0x45c, m.read(0x8007929c, 1), 1);
  for (let i = 0; i < 0x10; i++) m.write(0x80093be8 + i, 0, 1); // 0x80044bc0
};

// 0x5e 0x800231f8 if bit (u8 b - 1) of 0x80079414 (0x21 setBit) jump label u16, seen2[u16] = 3
HANDLERS[0x5e] = function* (ctx) {
  const { m } = ctx, o = operand(m), b = o.u8(), label = o.u16(), k = o.u16();
  if (m.read(SKIP, 1) !== 1 && (m.read(0x80079414, 2) >>> ((b - 1) & 31)) & 1) {
    m.write(0x801fa730 + k, 3, 1);
    const off = resolveLabel({ ...ctx, sp: ctx.sp - 0x20 }, m.read(BASE, 4) >>> 0, label) & 0xffff;
    m.write(CURSOR, ((m.read(BASE, 4) >>> 0) + off) >>> 0, 4);
  }
  endFrame(m);
};
