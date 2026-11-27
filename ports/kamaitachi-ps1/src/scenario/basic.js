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
import { cdLoad } from "../cd-load.js";
import { setGp1e0, spriteFree, waitFade, textSpeed, dropLayer } from "../helpers.js";
import { HANDLERS } from "./interp.js";
import { CURSOR, BASE, io, operand, resolveLabel, unported } from "./lib.js";
import { fadeOut, fadeIn, fadeLevel, windowPalette } from "../screen/fader.js";
import { uploadPicture, loadPicture } from "../screen/picture.js";
import { spritePage } from "../screen/sprites.js";
import { tick, tickText, tickStill } from "../tick.js";
import { textTask } from "../text/text.js";
import { memcpy, effect } from "../screen/weather.js";
import { special } from "../title.js";
import { storyMovie, newGame } from "../init.js";
import { sound } from "../sound-bridge.js";
import { animLoad, animStart, animEnd, animWait } from "../screen/anim.js";
import { waitText, snapshot, copySlot } from "../helpers.js";
import { cdLoadAsync } from "../cd-load.js";
import { waitOverlay } from "../screen/effects.js";
import { soundReset } from "../sound-reset.js";

const SKIP = 0x80079295, NO_EFFECTS = 0x800792a0, FLAGS = 0x801f74b0, IDS = 0x801f6698, NEW = 0x800794f4, SDW_BUF = 0x80079484;
const halfFrames = (v) => (v & 0xffff) === 0x7f ? 1 : (v & 0xffff) >>> 1;
const skipping = (m) => m.read(SKIP, 1) === 1;
const endFrame = (m) => m.write(0x8007913c + 0x15c, 1, 1);

// 0x8001cde4 showPicture(id, layer): drops layer + 1 (0x8001db2c), then the BGD
// picture `id` (0x801fec68[layer]) loaded to the SDW buffer and put on page 8 / 0xb / 0x15
// as the layer's full-screen sprite (0x801f6698 + 2 + 2·layer).
const LAYER_PAGE = [[8, 1, 0xe], [0xb, 2, 0xc], [0x15, 3, 0xd]];
export function* showPicture(ctx, id, layer) {
  const { m } = ctx, { r16, r32, w8, w16 } = io(m), sp = ctx.sp - 0x30, sub = { ...ctx, sp };
  if (m.read(SKIP, 1) === 1 || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  dropLayer(m, layer + 1);
  layer &= 0xff;
  w16(0x801fec68 + 2 * layer, id);
  yield* cdLoad({ ...ctx, sp }, 1, r32(SDW_BUF), id & 0xffff);
  const lp = LAYER_PAGE[layer];
  if (lp) {
    const [page, n, z] = lp;
    if (layer === 0) {
      w8(0x80079294, 1);
      for (let i = 0; i < 16; i++) { m.write(0x8009da48 + 8 * i + 4, 0, 4); m.write(0x8009da48 + 8 * i, 0, 4); }
      w8(0x800795e4, 5); w8(0x800795e6, 0xf); w8(0x800795e5, 0);
    } else w8(0x80079294, 0);
    loadPicture(sub, page, r32(SDW_BUF));
    spritePage(sub, page, 0, -4, 0x140, 0xf0);
    w16(IDS + 2 + 2 * layer, r16(0x80079528));
    w8(r32(NEW) + 0x31, n); w8(r32(NEW) + 0x33, z); w16(r32(NEW) + 0x1e, 0x1000); w8(r32(NEW) + 0x38, n);
    if (layer === 0) w8(0x80079294, 0);
  }
  endFrame(m);
}

function* picture(ctx, fade) {
  const { m } = ctx, v = operand(m).u16(), sp = ctx.sp - 0x18;
  if (skipping(m)) { endFrame(m); return; }
  if (m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; } // the backlog
  yield* showPicture({ ...ctx, sp }, (v + m.read(0x800792ba, 1) * 1000) & 0xffff, fade ? 0 : 1);
  if (fade) { fadeLevel(m, 1, 0xff); m.write(0x8007955a, v & 0xff, 1); }
}
HANDLERS[0x04] = function* (ctx) { yield* picture(ctx, true); };
HANDLERS[0x05] = function* (ctx) { yield* picture(ctx, false); };

HANDLERS[0x08] = function* (ctx) {
  const { m } = ctx, o = operand(m), frames = halfFrames(o.u16()), ch = o.u8();
  if (skipping(m) || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  fadeOut(m, frames, ch);
  endFrame(m);
  if (ch === 1 && m.read(0x800792b1, 1) === 1) { fadeOut(m, frames, 2); setGp1e0(m, frames); }
};

// The full-screen picture sprite (page 0x18) if there is none yet.
export function pictureSprite(ctx, sp) {
  const { m } = ctx, { r16, r32, w8, w16, w32 } = io(m);
  if (r16(IDS + 0xa)) return;
  spritePage({ ...ctx, sp }, 0x18, 0, -4, 0x140, 0xf0);
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
    uploadPicture({ ...ctx, sp }, 0x18, r32(0x80079440), 0);
    pictureSprite(ctx, sp);
    windowPalette({ ...ctx, sp });
  }
  endFrame(m);
};

HANDLERS[0x0a] = function* (ctx) {
  const { m } = ctx, k = (operand(m).u8() + 1) & 0xff;
  if (skipping(m) || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  if (k >= 0xb) return;
  const id = m.read(IDS + 2 * k, 2);
  if (id) { spriteFree(m, id); m.write(IDS + 2 * k, 0, 2); m.write(0x801fec66 + 2 * k, 0xffff, 2); }
  endFrame(m);
};

HANDLERS[0x0b] = function* (ctx) {
  const { m } = ctx, k = operand(m).u8();
  if (skipping(m)) { endFrame(m); return; }
  if (m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; } // the backlog
  yield* waitFade({ ...ctx, sp: ctx.sp - 0x18 }, k);
};

HANDLERS[0x0c] = function* (ctx) {
  const { m } = ctx, n = operand(m).u16();
  if (skipping(m)) { endFrame(m); return; }
  if (m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; } // the backlog
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

function* branch(ctx, when) {
  const { m } = ctx, o = operand(m), f = o.u8(), label = o.u16();
  if (!skipping(m) && !!m.read(FLAGS + f, 1) === when) {
    const base = m.read(BASE, 4) >>> 0, off = yield* resolveLabel({ ...ctx, sp: ctx.sp - 0x20 }, base, label);
    m.write(CURSOR, (m.read(BASE, 4) >>> 0) + off, 4);
  }
  endFrame(m);
}
HANDLERS[0x0e] = function* (ctx) { yield* branch(ctx, false); };
HANDLERS[0x0f] = function* (ctx) { yield* branch(ctx, true); };

//   0x14 0x8001e7b8 0x8003a6e4(u8 + 8)   0x1c 0x8001f19c 0x800418d0(u8)   0x1d 0x8001f20c 0x80044384(u8)
//   0x15 0x8001e830 return (only while skipping; 0x03 is the normal return)
//   0x17 0x8001efd0 skip the text up to its 0x15 end (Shift-JIS lead bytes take 3)
//   0x1e 0x8001f27c goto(u16 offset) when 0x80079296 is set
//   0x23 0x8001f3e4 palette(u8 a, u8 b): 0x800792ba = (0x1f - a) >> 3, then 0x8002cae0
HANDLERS[0x14] = function* (ctx) {
  const { m } = ctx, k = operand(m).u8();
  if (m.read(NO_EFFECTS, 1) !== 1) {
    if (m.read(0x800792c6, 1) === 1) m.write(0x8007928e, 1, 1);
    textSpeed(m, k + 8);
  }
  endFrame(m);
};
function simple(fn) {
  return function* (ctx) {
    const { m } = ctx, k = operand(m).u8();
    if (!skipping(m) && m.read(NO_EFFECTS, 1) !== 1) { const r = fn({ ...ctx, sp: ctx.sp - 0x18 }, k); if (r?.next) yield* r; }
    endFrame(m);
  };
}
HANDLERS[0x1c] = simple(effect);
HANDLERS[0x1d] = function* (ctx) { // special scenes (title.js)
  const { m } = ctx, k = operand(m).u8();
  if (!skipping(m) && m.read(NO_EFFECTS, 1) !== 1) yield* special({ ...ctx, sp: ctx.sp - 0x18 }, k);
  endFrame(m);
};

HANDLERS[0x15] = function* (ctx) {
  const { m } = ctx, { r16, r32, w16, w32, g8, p8 } = io(m);
  if (m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; } // the backlog
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
  if (m.read(NO_EFFECTS, 1) === 1) { m.write(0x80079296, 1, 1); m.write(0x80079297, m.read(0x8008dab8 + m.read(0x80079430, 1), 1), 1); } // the backlog: the choice made then
  if (m.read(0x80079296, 1) === 1) m.write(CURSOR, (m.read(BASE, 4) + off) >>> 0, 4);
  endFrame(m);
};

HANDLERS[0x23] = function* (ctx) {
  const { m } = ctx, o = operand(m), a = o.u8(), b = o.u8();
  if (skipping(m) || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  m.write(0x800792ba, (0x1f - a) >> 3 & 0xff, 1);
  const k = m.read(0x800792ba, 1), level = [0xff, 0xc0, 0x80, 0x40][k];
  if (level === undefined) unported(0x8001f4c0); // the level is left over in a1
  if (!b) fadeLevel(m, 0, level);
  else if (b & 1) fadeLevel(m, 1, level);
  endFrame(m);
};

HANDLERS[0x3f] = function* (ctx) { // 0x800213d0 movie(k): skipped while skipping or without effects
  const { m } = ctx, k = operand(m).u8();
  if (skipping(m) || m.read(NO_EFFECTS, 1) === 1) { m.write(0x8007913c + 0x15c, 1, 1); return; }
  yield* storyMovie({ ...ctx, sp: ctx.sp - 0x18 }, k);
};

// Small commands (operands, then a flag or a variable; most end the frame).
const noEffects = (m) => m.read(NO_EFFECTS, 1) === 1;
for (const [op, layer] of [[0x06, 2], [0x07, 3]]) HANDLERS[op] = function* (ctx) { // 0x8001d788 / 0x8001d814
  const { m } = ctx, id = operand(m).u16();
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  yield* showPicture({ ...ctx, sp: ctx.sp - 0x18 }, id, layer);
};
for (const [op, sign] of [[0x10, 1], [0x11, -1]]) HANDLERS[op] = function* (ctx) { // 0x8001e200 / 0x8001e258: var += / -= n
  const { m } = ctx, o = operand(m), i = o.u8(), n = o.u8();
  m.write(0x80079558 + i, (m.read(0x80079558 + i, 1) + sign * n) & 0xff, 1);
  endFrame(m);
};
HANDLERS[0x18] = function* (ctx) { // 0x8001f060 textSpeed(v · 5/4)
  const { m } = ctx, v = operand(m).u16();
  if (!skipping(m)) textSpeed(m, (v + (v >> 2)) & 0xffff);
  endFrame(m);
};
HANDLERS[0x19] = function* (ctx) { // 0x8001f0d8 the second wait counters (0x8003a714)
  const { m } = ctx, v = operand(m).u16();
  if (!skipping(m)) { const i = m.read(0x800792a7, 1); m.write(0x800794b4 + 2 * i, v, 2); m.write(0x800794bc + 2 * i, v, 2); }
  endFrame(m);
};
HANDLERS[0x1a] = function* (ctx) { // 0x8001ddd4 flag k cleared (k up to 0x4f)
  const { m } = ctx, k = operand(m).u8();
  if (!skipping(m)) m.write(FLAGS + Math.min(k, 0x4f), 0, 1);
  endFrame(m);
};
for (const [op, n] of [[0x1b, 1], [0x5c, 2]]) HANDLERS[op] = function* (ctx) { // 0x8001f144 / 0x80023094: no-ops that end the frame only while skipping or without effects
  const { m } = ctx; operand(m).skip(n);
  if (skipping(m) || noEffects(m)) endFrame(m);
};
HANDLERS[0x22] = function* (ctx) { // 0x8001de90 bit k-1 of 0x80079414 cleared
  const { m } = ctx, k = operand(m).u8();
  if (!skipping(m)) m.write(0x80079414, m.read(0x80079414, 2) & ~(1 << ((k - 1) & 31)) & 0xffff, 2);
  endFrame(m);
};
for (const [op, a] of [[0x27, 0x800795e4], [0x26, 0x800795e5], [0x28, 0x800795e6], [0x47, 0x8007960c], [0x46, 0x8007960d], [0x48, 0x8007960e]])
  HANDLERS[op] = function* (ctx) { // 0x8001f4f8.. / 0x8001f5c4..: the text window colours (b, g, r)
    const { m } = ctx, v = operand(m).u8();
    if (!noEffects(m)) m.write(a, v, 1);
    endFrame(m);
  };
HANDLERS[0x2a] = function* (ctx) { // 0x8001fdd0 the picture of slot 0xa dropped, layer state reset
  const { m } = ctx; operand(m).skip(1);
  if (skipping(m)) { endFrame(m); return; }
  if (!noEffects(m)) {
    const id = m.read(IDS + 0xa, 2);
    if (id) {
      spriteFree(m, id); m.write(IDS + 0xa, 0, 2); m.write(0x80079284, 0, 1);
      for (let i = 0; i < 4; i++) m.write(0x80079450 + 2 * i, 0xffff, 2);
      const p = m.read(0x80079440, 4) >>> 0;
      for (let i = 0; i < 0x12c00; i++) m.write(p + i, 0, 1);
    }
  }
  endFrame(m);
};
HANDLERS[0x38] = function* (ctx) { endFrame(ctx.m); }; // 0x80020f08
HANDLERS[0x42] = function* (ctx) { // 0x80020264 gp[1] = k
  const { m } = ctx, k = operand(m).u8();
  if (!skipping(m) && !noEffects(m)) m.write(0x8007913c + 1, k, 1);
  endFrame(m);
};
HANDLERS[0x60] = function* (ctx) { // 0x80023304 0x80079286 = k (does not end the frame)
  const { m } = ctx, k = operand(m).u8();
  if (skipping(m) || noEffects(m)) endFrame(m); else m.write(0x80079286, k, 1);
};

HANDLERS[0x39] = function* (ctx) { // 0x80020f94 animStart(u8 slot, u16 script offset, u16 x, u16 y)
  const { m } = ctx, o = operand(m), slot = o.u8(), script = (m.read(BASE, 4) + o.u16()) >>> 0, x = o.u16(), y = o.u16();
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  animStart({ ...ctx, sp: ctx.sp - 0x20 }, script, slot, x, y);
};
HANDLERS[0x3a] = function* (ctx) { // 0x800210b8 animEnd(k)
  const { m } = ctx, k = operand(m).u8();
  if (!skipping(m) && !noEffects(m)) animEnd(m, k);
  endFrame(m);
};
HANDLERS[0x3b] = function* (ctx) { // 0x80020f18 animLoad(k)
  const { m } = ctx, k = operand(m).u8();
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  yield* animLoad({ ...ctx, sp: ctx.sp - 0x18 }, k);
};
HANDLERS[0x4f] = function* (ctx) { // 0x80022234 animWait(k)
  const { m } = ctx, k = operand(m).u8();
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  yield* animWait({ ...ctx, sp: ctx.sp - 0x18 }, k);
};
HANDLERS[0x50] = function* (ctx) { // 0x800222b0 (u16 unused) ends the frame only while quiet
  const { m } = ctx; operand(m).u16();
  if (skipping(m) || noEffects(m)) endFrame(m);
};
HANDLERS[0x51] = function* (ctx) { // 0x80022328 (u8 pac, u16 id): the text waited for, then the member loaded to the SDW buffer
  const { m } = ctx, o = operand(m), pac = o.u8(), id = o.u16(), sub = { ...ctx, sp: ctx.sp - 0x20 };
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  yield* waitText(sub);
  yield* cdLoadAsync(sub, pac, m.read(SDW_BUF, 4) >>> 0, id);
};
HANDLERS[0x52] = function* (ctx) { // 0x800223ec waitText
  const { m } = ctx;
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  yield* waitText({ ...ctx, sp: ctx.sp - 0x18 });
};

// Conditional jumps: on a bit of 0x80079414 (k-1) or a flag; 0x54 / 0x55 / 0x5d also mark
// entry `id` of 0x801fa730 (= 3) when they jump.
const bitSet = (m, k) => (m.read(0x80079414, 2) >> ((k - 1) & 31)) & 1;
function* jumpTo(ctx, label) {
  const { m } = ctx, base = m.read(BASE, 4) >>> 0, off = yield* resolveLabel(ctx, base, label);
  m.write(CURSOR, ((m.read(BASE, 4) >>> 0) + (off & 0xffff)) >>> 0, 4);
}
for (const [op, when] of [[0x24, 0], [0x25, 1]]) HANDLERS[op] = function* (ctx) { // 0x8001e078 / 0x8001e13c (u8 bit, u16 label)
  const { m } = ctx, o = operand(m), k = o.u8(), label = o.u16();
  if (!skipping(m) && bitSet(m, k) === when) yield* jumpTo({ ...ctx, sp: ctx.sp - 0x20 }, label);
  endFrame(m);
};
for (const [op, when, frame] of [[0x54, 0, 0x28], [0x55, 1, 0x20]]) HANDLERS[op] = function* (ctx) { // 0x800225cc / 0x800226e0 (u8 flag, u16 label, u16 id)
  const { m } = ctx, o = operand(m), f = o.u8(), label = o.u16(), id = o.u16();
  if (!skipping(m) && (m.read(FLAGS + f, 1) ? 1 : 0) === when) { yield* jumpTo({ ...ctx, sp: ctx.sp - frame }, label); m.write(0x801fa730 + id, 3, 1); }
  endFrame(m);
};
HANDLERS[0x5d] = function* (ctx) { // 0x800230ec (u8 bit, u16 label, u16 id): on a clear bit
  const { m } = ctx, o = operand(m), k = o.u8(), label = o.u16(), id = o.u16();
  if (!skipping(m) && !bitSet(m, k)) { m.write(0x801fa730 + id, 3, 1); yield* jumpTo({ ...ctx, sp: ctx.sp - 0x20 }, label); }
  endFrame(m);
};
HANDLERS[0x61] = function* (ctx) { // 0x80023370 0x8007926c = u16 (does not end the frame)
  const { m } = ctx, v = operand(m).u16();
  if (skipping(m) || noEffects(m)) endFrame(m); else m.write(0x8007926c, v, 4);
};
HANDLERS[0x4a] = function* (ctx) { // 0x80021f40 (u8 a, u8 b): 0x80026088(a, b, 300) outside auto mode
  const { m } = ctx, o = operand(m), a = o.u8(), b = o.u8(), g = 0x8007913c;
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  if (m.read(0x800792c6, 1)) return;
  const v = m.read(0x800792a6, 1);
  m.write(g + 0x4b0, v, 2);
  if (!v) { m.write(g + 0x4cc, 0, 2); m.write(g + 0x4c8, 0, 2); m.write(g + 0x68, 0xffff, 2); }
  else { m.write(g + 0x4c8, a & 1, 2); m.write(g + 0x4cc, b, 2); m.write(g + 0x68, 0x12c, 2); }
};
HANDLERS[0x59] = function* (ctx) { // 0x80022f08 waitOverlay
  const { m } = ctx;
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  yield* waitOverlay({ ...ctx, sp: ctx.sp - 0x18 });
};
HANDLERS[0x5b] = function* (ctx) { // 0x80022ff4 the sprite of slot k shown (attr |= 0x50000000)
  const { m } = ctx, k = operand(m).u8();
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  const s = 0x801eef68 + 72 * m.read(IDS + 2 * k, 2);
  m.write(s, (m.read(s, 4) | 0x50000000) >>> 0, 4);
};
HANDLERS[0x62] = function* (ctx) { // 0x80023400 text frames while 0x8007926c < u16
  const { m } = ctx, v = operand(m).u16(), sub = { ...ctx, sp: ctx.sp - 0x18 };
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  while ((m.read(0x8007926c, 4) | 0) < v) yield* tickText(sub, 1);
};
HANDLERS[0x64] = function* (ctx) { // 0x8002357c soundReset
  const { m } = ctx;
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  yield* soundReset({ ...ctx, sp: ctx.sp - 0x18 });
};
HANDLERS[0x43] = function* (ctx) { // 0x80021614 (u16 v): the fall finished (0x8004165c), then with v a key waited for
  const { m } = ctx, v = operand(m).u16(), sub = { ...ctx, sp: ctx.sp - 0x20 }, g = 0x8007913c;
  if (m.read(g + 0x1e4, 1) === 1) while (m.read(g + 0x3aa, 2) < 0xd20) yield* tickText({ ...sub, sp: sub.sp - 0x18 }, 1);
  if (!v) return;
  while (!(m.read(0x801eef40, 4) & 0x8f5)) { yield* textTask(sub); yield* tick(sub); }
};
HANDLERS[0x49] = function* (ctx) { // 0x80021128 the window picture revealed in 8 steps
  const { m } = ctx, sp = ctx.sp - 0x30, sub = { ...ctx, sp };
  if (skipping(m) || noEffects(m)) { endFrame(m); return; }
  for (let i = 0; i < 8; i++) {
    uploadPicture(sub, 0x18, m.read(0x80079440, 4) >>> 0, i + 1);
    if (!m.read(IDS + 0xa, 2)) {
      m.write(sp + 0x10, 0xf0, 4); spritePage(sub, 0x18, 0, -4, 0x140, 0xf0);
      m.write(IDS + 0xa, m.read(0x80079528, 2), 2);
      const s = m.read(NEW, 4) >>> 0;
      m.write(s + 0x31, 5, 1); m.write(s, (m.read(s, 4) | 0x40000000) >>> 0, 4); m.write(s + 0x33, 8, 1); m.write(s + 0x1e, 0x1000, 2); m.write(s + 0x38, 5, 1);
      m.write(0x801fd270 + 0xc4, 0x1f8, 4); m.write(0x801fd270 + 0xc0, 0, 4); m.write(0x801fd270 + 0xc8, 0x01000000, 4);
    }
    windowPalette(sub);
    yield* tickStill(sub); yield* tickStill(sub);
  }
};
HANDLERS[0x12] = function* (ctx) { // 0x8001e2b0 a new game from the script: music and screen faded out over 30 frames
  const { m } = ctx, sp = ctx.sp - 0x18, sub = { ...ctx, sp };
  m.write(0x8007913c + 0x1e4, 0, 1); // 0x800413a0
  yield* cdLoadAsync(sub, 0, m.read(SDW_BUF, 4) >>> 0, 1);
  sound(sub).fadeMusic(0x1e, sp);
  for (const ch of [1, 2, 3, 8, 5, 9]) fadeOut(m, 0x1e, ch);
  yield* waitFade(sub, 9);
  for (const ch of [1, 2, 3, 8, 5, 9]) fadeIn(m, 1, ch);
  m.write(0x8007929f, 0, 1); m.write(0x800792a5, 1, 1); m.write(0x8007928c, 0, 1);
  yield* effect(sub, 0);
  m.write(0x8007940c, m.read(CURSOR, 4) >>> 0, 4);
  yield* newGame(sub);
};
HANDLERS[0x20] = function* (ctx) { // 0x8001f384 the bookmark state taken (slot 0) and copied to slot 0x8007929a
  const { m } = ctx;
  if (!skipping(m) && !noEffects(m)) { snapshot(m, 0); copySlot(m, 0, m.read(0x8007929a, 1)); }
  endFrame(m);
};
