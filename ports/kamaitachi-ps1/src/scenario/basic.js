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

HANDLERS[0x09] = function* (ctx) {
  const { m } = ctx, { r16, r32, w8, w16, w32 } = io(m), o = operand(m), frames = halfFrames(o.u16()), ch = o.u8(), sp = ctx.sp - 0x20;
  if (skipping(m) || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  fadeIn(m, frames, ch); fadeIn(m, frames, 5);
  if (!m.read(0x800792b2, 1)) {
    ctx.call(0x8003cbb8, [0x18, r32(0x80079440), 0], sp);
    if (!r16(IDS + 0xa)) {
      ctx.call(0x8003b87c, [0x18, 0, -4, 0x140, 0xf0], sp);
      w16(IDS + 0xa, r16(0x80079528));
      let s = r32(NEW);
      w8(s + 0x31, 5); w32(s, r32(s) | 0x40000000);
      s = r32(NEW); w8(s + 0x33, 8); w16(s + 0x1e, 0x1000);
      w8(r32(NEW) + 0x38, 5);
      w32(0x801fd270 + 0xc4, 0x1f8); w32(0x801fd270 + 0xc0, 0); w32(0x801fd270 + 0xc8, 0x1000000);
    }
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
