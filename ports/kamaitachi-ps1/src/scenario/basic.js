// Scenario commands: pictures, fades, waits and flags. Most do nothing while skipping
// (0x80079295 = 1) except end the frame; 0x800792a0 = 1 (not seen in play yet) likewise.
//   0x04 0x8001d608 picture(u16)       background id + 1000·0x800792ba, with a fade (0x8002cae0)
//   0x05 0x8001d6d4 picture2(u16)      the same without the fade
//   0x08 0x8001d8a0 fadeOut(u16 t, ch) t/2 frames (0x7f: 1)
//   0x09 0x8001d998 fadeIn(u16 t, ch)  and the full-screen picture sprite on page 0x18
//   0x0a 0x8001dbac drop(u8 k)         sprite slot k+1 of 0x801f6698
//   0x0b 0x8001dc74 0x8002cbc0(u8)
//   0x0c 0x8001dcf0 wait(u16 n)        n frames with the text task (tick.js tickText)
//   0x0d 0x8001dd7c setFlag(u8)        0x801f74b0[min(k, 0x4f)] = 1
//   0x0e 0x8001def8 ifNot(u8 f, label) / 0x0f 0x8001dfb8 if(u8 f, label): jump
//   0x21 0x8001de2c setBit(u8 k)       0x80079414 |= 1 << (k - 1)
import { HANDLERS } from "./interp.js";
import { CURSOR, BASE, io, operand, resolveLabel, unported } from "./lib.js";
import { fadeOut, fadeIn } from "../screen/fader.js";
import { tickText } from "../tick.js";
import { memcpy } from "../screen/weather.js";

const SKIP = 0x80079295, NO_EFFECTS = 0x800792a0, FLAGS = 0x801f74b0, IDS = 0x801f6698, NEW = 0x800794f4;
const halfFrames = (v) => (v & 0xffff) === 0x7f ? 1 : (v & 0xffff) >>> 1;
const skipping = (m) => m.read(SKIP, 1) === 1;
const endFrame = (m) => m.write(0x8007913c + 0x15c, 1, 1);

function picture(ctx, fade) {
  const { m } = ctx, v = operand(m).u16(), sp = ctx.sp - 0x18;
  if (skipping(m)) { endFrame(m); return; }
  if (m.read(NO_EFFECTS, 1) === 1) unported(fade ? 0x8001d674 : 0x8001d73c);
  ctx.call(0x8001cde4, [(v + m.read(0x800792ba, 1) * 1000) & 0xffff, fade ? 0 : 1], sp);
  if (fade) { ctx.call(0x8002cae0, [1, 0xff], sp); m.write(0x8007955a, v & 0xff, 1); }
}
HANDLERS[0x04] = function* (ctx) { picture(ctx, true); };
HANDLERS[0x05] = function* (ctx) { picture(ctx, false); };

HANDLERS[0x08] = function* (ctx) {
  const { m } = ctx, o = operand(m), frames = halfFrames(o.u16()), ch = o.u8();
  if (skipping(m) || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  fadeOut(m, frames, ch);
  endFrame(m);
  if (ch === 1 && m.read(0x800792b1, 1) === 1) { fadeOut(m, frames, 2); ctx.call(0x80040e90, [frames], ctx.sp - 0x20); }
};

// The full-screen picture sprite (page 0x18) if there is none yet.
export function pictureSprite(ctx, sp) {
  const { m } = ctx, { r16, r32, w8, w16, w32 } = io(m);
  if (r16(IDS + 0xa)) return;
  ctx.call(0x8003b87c, [0x18, 0, -4, 0x140, 0xf0], sp);
  w16(IDS + 0xa, r16(0x80079528));
  let s = r32(NEW);
  w8(s + 0x31, 5); w32(s, r32(s) | 0x40000000);
  s = r32(NEW); w8(s + 0x33, 8); w16(s + 0x1e, 0x1000);
  w8(r32(NEW) + 0x38, 5);
  w32(0x801fd270 + 0xc4, 0x1f8); w32(0x801fd270 + 0xc0, 0); w32(0x801fd270 + 0xc8, 0x1000000);
}

HANDLERS[0x09] = function* (ctx) {
  const { m } = ctx, { r16, r32, w8, w16, w32 } = io(m), o = operand(m), frames = halfFrames(o.u16()), ch = o.u8(), sp = ctx.sp - 0x20;
  if (skipping(m) || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  fadeIn(m, frames, ch); fadeIn(m, frames, 5);
  if (!m.read(0x800792b2, 1)) {
    ctx.call(0x8003cbb8, [0x18, r32(0x80079440), 0], sp);
    pictureSprite(ctx, sp);
    ctx.call(0x8001f690, [], sp);
  }
  endFrame(m);
};

HANDLERS[0x0a] = function* (ctx) {
  const { m } = ctx, k = (operand(m).u8() + 1) & 0xff;
  if (skipping(m) || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  if (k >= 0xb) return;
  const id = m.read(IDS + 2 * k, 2);
  if (id) { ctx.call(0x8003bc3c, [(id << 16) >> 16], ctx.sp - 0x20); m.write(IDS + 2 * k, 0, 2); m.write(0x801fec66 + 2 * k, 0xffff, 2); }
  endFrame(m);
};

HANDLERS[0x0b] = function* (ctx) {
  const { m } = ctx, k = operand(m).u8();
  if (skipping(m)) { endFrame(m); return; }
  if (m.read(NO_EFFECTS, 1) === 1) unported(0x8001dccc);
  ctx.call(0x8002cbc0, [k], ctx.sp - 0x18);
};

HANDLERS[0x0c] = function* (ctx) {
  const { m } = ctx, n = operand(m).u16();
  if (skipping(m)) { endFrame(m); return; }
  if (m.read(NO_EFFECTS, 1) === 1) unported(0x8001dd58);
  yield* tickText({ ...ctx, sp: ctx.sp - 0x18 }, n);
};

HANDLERS[0x0d] = function* (ctx) {
  const { m } = ctx, k = operand(m).u8();
  if (!skipping(m)) m.write(FLAGS + (k < 0x50 ? k : 0x4f), 1, 1);
  endFrame(m);
};

HANDLERS[0x21] = function* (ctx) {
  const { m } = ctx, k = operand(m).u8();
  if (skipping(m)) unported(0x8001de5c);
  m.write(0x80079414, m.read(0x80079414, 2) | 1 << ((k - 1) & 31), 2);
  endFrame(m);
};

function branch(ctx, when) {
  const { m } = ctx, o = operand(m), f = o.u8(), label = o.u16();
  if (!skipping(m) && !!m.read(FLAGS + f, 1) === when) {
    const base = m.read(BASE, 4) >>> 0, off = resolveLabel({ ...ctx, sp: ctx.sp - 0x20 }, base, label);
    m.write(CURSOR, (m.read(BASE, 4) >>> 0) + off, 4);
  }
  endFrame(m);
}
HANDLERS[0x0e] = function* (ctx) { branch(ctx, false); };
HANDLERS[0x0f] = function* (ctx) { branch(ctx, true); };

//   0x14 0x8001e7b8 0x8003a6e4(u8 + 8)   0x1c 0x8001f19c 0x800418d0(u8)   0x1d 0x8001f20c 0x80044384(u8)
//   0x15 0x8001e830 return (only while skipping; 0x03 is the normal return)
//   0x17 0x8001efd0 skip the text up to its 0x15 end (Shift-JIS lead bytes take 3)
//   0x1e 0x8001f27c goto(u16 offset) when 0x80079296 is set
//   0x23 0x8001f3e4 palette(u8 a, u8 b): 0x800792ba = (0x1f - a) >> 3, then 0x8002cae0
HANDLERS[0x14] = function* (ctx) {
  const { m } = ctx, k = operand(m).u8();
  if (m.read(NO_EFFECTS, 1) !== 1) {
    if (m.read(0x800792c6, 1) === 1) m.write(0x8007928e, 1, 1);
    ctx.call(0x8003a6e4, [k + 8], ctx.sp - 0x18);
  }
  endFrame(m);
};
function simple(addr) {
  return function* (ctx) {
    const { m } = ctx, k = operand(m).u8();
    if (!skipping(m) && m.read(NO_EFFECTS, 1) !== 1) ctx.call(addr, [k], ctx.sp - 0x18);
    endFrame(m);
  };
}
HANDLERS[0x1c] = simple(0x800418d0);
HANDLERS[0x1d] = simple(0x80044384);

HANDLERS[0x15] = function* (ctx) {
  const { m } = ctx, { r16, r32, w16, w32, g8, p8 } = io(m);
  if (m.read(NO_EFFECTS, 1) === 1) unported(0x8001e858);
  if (!skipping(m)) return;
  const STACK = 0x8008da38;
  p8(0, g8(0) - 1);
  const n = g8(0);
  const off = r16(STACK + 4 * n);
  p8(0, n - 1);
  const res = r16(STACK + 4 * g8(0));
  if (r16(0x8007929c) !== res) {
    const base = r32(BASE);
    if (g8(2) === 1 && ((g8(0x45c) << 24) >> 24) === res) memcpy(m, r32(0x80079544) + 0x28000, base, 0xb000);
    else unported(0x8001e914); // resource 31 from the EXE, or a load
    w16(0x8007929c, res);
  }
  w32(CURSOR, off + r32(BASE));
};

HANDLERS[0x17] = function* (ctx) {
  const { m } = ctx, { r8, r32, w32 } = io(m);
  if (skipping(m)) { endFrame(m); return; }
  for (;;) {
    const p = r32(CURSOR), b = r8(p);
    if (b === 0x15) break;
    if (b >= 0x81) w32(CURSOR, p + 2);
    w32(CURSOR, r32(CURSOR) + 1);
  }
  endFrame(m);
  w32(CURSOR, r32(CURSOR) + 1);
};

HANDLERS[0x1e] = function* (ctx) {
  const { m } = ctx, off = operand(m).u16();
  if (m.read(NO_EFFECTS, 1) === 1) unported(0x8001f2c4);
  if (m.read(0x80079296, 1) === 1) m.write(CURSOR, (m.read(BASE, 4) + off) >>> 0, 4);
  endFrame(m);
};

HANDLERS[0x23] = function* (ctx) {
  const { m } = ctx, o = operand(m), a = o.u8(), b = o.u8();
  if (skipping(m) || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  m.write(0x800792ba, (0x1f - a) >> 3 & 0xff, 1);
  const k = m.read(0x800792ba, 1), level = [0xff, 0xc0, 0x80, 0x40][k];
  if (level === undefined) unported(0x8001f4c0); // the level is left over in a1
  if (!b) ctx.call(0x8002cae0, [0, level], ctx.sp - 0x18);
  else if (b & 1) ctx.call(0x8002cae0, [1, level], ctx.sp - 0x18);
  endFrame(m);
};
