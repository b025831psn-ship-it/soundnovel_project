// The picture animation player, 0x8003dbe0 (per frame): three channels, each running a
// script of {u8 op, u8 frames} pairs. op >= 0 shows member `op` of the PAC at gp[0x3bc]
// (unpacked by 0x800360b8 into the buffer at 0x800794d8, then put on screen by 0x8003b19c
// at the channel's x/y) and waits `frames`. Negative ops: -1 end, -2 restart, -4 jump by
// frames/2 pairs, -5 end with a hand-off to the text side, -6 (not ported).
// When a channel ends, its kind (0x80079416) decides what follows: 1 / 2 run
// 0x8001db2c dropLayer(2 / 3), 0 dropPicture(5) (0x8001fd1c) unless 0x800792c1 is set.
//   0x80044e50 pacMember(pac, i): address of member i (big-endian offsets after the count)
import { loadPicture } from "./picture.js";
import { windowPalette } from "./fader.js";
import { dropLayer, dropPicture } from "../helpers.js";
import { ike } from "./ike.js";
import { cdLoad } from "../cd-load.js";
import { tickText } from "../tick.js";
import { spritePage } from "./sprites.js";
import { uploadPicture } from "./picture.js";
import { fadeLevel } from "./fader.js";
import { clearPlane } from "./effects.js";

const GP = 0x8007913c, FRAME_STEP = 0x80079278, AUTO = 0x800792c6, AUTO_HOLD = 0x8007928e;
const OFF = 0x80079283, ACTIVE = 0x80079530, OP = 0x8007950c, SCRIPT = 0x801fdfc8, PC = 0x8007949a, WAIT = 0x80079436;
const IDS = 0x801f6698, NEW = 0x800794f4, PLANE = 0x800b1c20;
const KIND = 0x80079416, BUF = 0x800794d8, X = 0x80079494, Y = 0x800794a0, LAYERS = 0x801fe058;
const HANDOFF = 0x800792be, HANDOFF2 = 0x800792bf, NO_NEXT = 0x800792c1, TEXT_ON = 0x80079284, H1 = 0x80079450, H2 = 0x80079618;
const unported = (addr) => { throw new Error(`anim: path at 0x${addr.toString(16)} is not ported`); };
const s8 = (v) => (v << 24) >> 24;
const bswap = (v) => ((v & 0xff) << 24 | (v & 0xff00) << 8 | (v >>> 8) & 0xff00 | v >>> 24) >>> 0;

export function pacMember(m, pac, i) { return (pac + bswap(m.read(pac + 8 * (i & 0xffff) + 4, 4) >>> 0)) >>> 0; }

export function animTick(ctx) {
  const { m } = ctx, r8 = (a) => m.read(a, 1), w8 = (a, v) => m.write(a, v & 0xff, 1), r16 = (a) => m.read(a, 2), r32 = (a) => m.read(a, 4) >>> 0;
  if (r8(OFF) === 1) return;
  const sp = ctx.sp - 0x38, call = (addr, args) => ctx.call(addr, args, sp);
  const pair = (i) => r32(SCRIPT + 4 * i) + 2 * s8(r8(PC + i));
  for (let i = 0; i < 3; i++) {
    if (r8(ACTIVE + i) !== 1) continue;
    if (r8(AUTO) === 1) w8(AUTO_HOLD, 1);
    if (s8(r8(WAIT + i)) > 0) { w8(WAIT + i, r8(WAIT + i) - 1); continue; }
    w8(OP + i, r8(pair(i)));
    if (s8(r8(OP + i)) === -5) {
      for (let j = 0; j < 4; j++) { m.write(H1 + 2 * j, 0xffff, 2); m.write(H2 + 2 * j, 0xffff, 2); }
      w8(TEXT_ON, 1);
      m.write(H1, (s8(r8(HANDOFF)) + 0x320) & 0xffff, 2);
      w8(OP + i, -1); w8(HANDOFF, -1); w8(HANDOFF2, -1); w8(NO_NEXT, 1);
    }
    const op = () => s8(r8(OP + i));
    if (op() === -6) unported(0x8003dd80);
    if (op() === -4) { w8(PC + i, r8(PC + i) + (s8(r8(pair(i) + 1)) >> 1)); w8(OP + i, r8(pair(i))); }
    if (op() === -2) { w8(PC + i, 0); w8(OP + i, r8(r32(SCRIPT + 4 * i))); }
    if (op() === -1) {
      w8(HANDOFF, -1); w8(ACTIVE + i, 0);
      const k = r8(KIND + i);
      if (k === 1) dropLayer(m, 2);
      else if (k === 2) dropLayer(m, 3);
      else if (k === 0 && !r8(NO_NEXT)) dropPicture(m, 5);
      for (let j = 0; j < 3; j++) w8(ACTIVE + j, 0);
      for (let j = 0; j < 3; j++) { const p = LAYERS + 8 * j; m.write(p, 0, 2); w8(p + 2, 0); m.write(p + 4, 0, 2); m.write(p + 6, 0, 2); }
      w8(HANDOFF, -1);
      continue;
    }
    w8(WAIT + i, r8(pair(i) + 1));
    ike(m, pacMember(m, r32(GP + 0x3bc), s8(r8(OP + i))), r32(BUF)); // 0x800360b8
    const k = r8(KIND + i), at = [r32(BUF), r16(X + 2 * i), r16(Y + 2 * i)];
    const sub = { ...ctx, sp };
    if (k === 1) loadPicture(sub, 0xb, ...at);
    else if (k === 2) loadPicture(sub, 0x15, ...at);
    else if (k === 0) { loadPicture(sub, 0x18, ...at); windowPalette(sub); }
    w8(PC + i, r8(PC + i) + 1);
    w8(WAIT + i, r8(WAIT + i) - r8(FRAME_STEP));
  }
}

// 0x8003cfa4 animLoad(k): animation PAC k (PAC 7) loaded into the work buffer 0x80079508 at a
// per-animation offset (gp[0x3bc]; 14, 15 and k >= 0x25 keep the last one).
const ANIM_AT = [0x22000, 0x27800, 0x27800, 0x2a000, 0x25800, 0x2b000, 0x2a000, 0x2b800, 0x24000, 0x2c000, 0x26000, 0x2a000,
  0x26800, 0x27800, null, null, 0x19000, 0x2a800, 0x21800, 0x29000, 0x28000, 0x2b000, 0x2a800, 0x23800, 0x27000, 0x2b000,
  0x2a800, 0x26800, 0x2a000, 0x27800, 0x28000, 0x28800, 0x20800, 0x1d000, 0x2a000, 0x24800, 0x2b800];
export function* animLoad(ctx, k) {
  const { m } = ctx, sub = { ...ctx, sp: ctx.sp - 0x18 };
  k &= 0xff;
  const at = ANIM_AT[k];
  if (at != null) m.write(GP + 0x3bc, ((m.read(0x80079508, 4) >>> 0) + at) >>> 0, 4);
  yield* cdLoad(sub, 7, m.read(GP + 0x3bc, 4) >>> 0, k);
  m.write(HANDOFF, k, 1); m.write(GP + 0x33c, k, 1);
}

// 0x8003d498 animStart(script, slot, x, y): the first frame of the loaded PAC on the slot's
// layer (0 window picture, page 0x18; 1 page 0xb; 2 page 0x15), then the channel started.
export function animStart(ctx, script, slot, x, y) {
  const { m } = ctx, sp = ctx.sp - 0x38, sub = { ...ctx, sp }, w8 = (a, v) => m.write(a, v & 0xff, 1), r32 = (a) => m.read(a, 4) >>> 0;
  const k = slot & 0xff, e = LAYERS + 8 * k;
  w8(e + 2, slot); m.write(e + 4, x, 2); m.write(e + 6, y, 2); m.write(e, (script - m.read(0x8007948c, 2)) & 0xffff, 2);
  ike(m, pacMember(m, r32(GP + 0x3bc), 0), r32(BUF));
  const sprite = (page, id, n, z) => {
    m.write(sp + 0x10, 0xf0, 4); spritePage(sub, page, 0, -4, 0x140, 0xf0);
    m.write(IDS + id, m.read(0x80079528, 2), 2);
    const s = r32(NEW); w8(s + 0x31, n); w8(s + 0x33, z); m.write(s + 0x1e, 0x1000, 2); w8(s + 0x38, n); return s;
  };
  if (k === 1 || k === 2) {
    const n = k + 1, page = k === 1 ? 0xb : 0x15;
    dropLayer(m, n);
    const buf = r32(BUF);
    clearPlane(m); uploadPicture(sub, page, PLANE, 0); // 0x8002f0bc
    loadPicture(sub, page, buf, x & 0xffff, y & 0xffff);
    sprite(page, k === 1 ? 4 : 6, n, k === 1 ? 0xc : 0xd);
    fadeLevel(m, n, 0x100);
  } else if (k === 0) {
    dropPicture(m, 5);
    if (!m.read(IDS + 0xa, 2)) {
      loadPicture(sub, 0x18, r32(BUF), x & 0xffff, y & 0xffff);
      m.write(sp + 0x10, 0xf0, 4); spritePage(sub, 0x18, 0, -4, 0x140, 0xf0);
      m.write(IDS + 0xa, m.read(0x80079528, 2), 2);
      const s = r32(NEW);
      m.write(s, (m.read(s, 4) | 0x40000000) >>> 0, 4);
      w8(s + 0x31, 5); w8(s + 0x33, 8); m.write(s + 0x1e, 0x1000, 2); w8(s + 0x38, 5);
    }
    windowPalette(sub);
    fadeLevel(m, 5, 0x100);
  }
  m.write(X + 2 * k, x, 2); m.write(Y + 2 * k, y, 2); m.write(SCRIPT + 4 * k, script >>> 0, 4);
  w8(PC + k, 0); w8(WAIT + k, 0); w8(KIND + k, slot); w8(ACTIVE + k, 1);
  if (s8(m.read(HANDOFF, 1)) === -1) w8(HANDOFF, m.read(GP + 0x33c, 1));
  w8(NO_NEXT, 0);
}

// 0x8003d9f8 animEnd(k): channel k stopped and its layer dropped; all channels off.
export function animEnd(m, k) {
  k &= 0xff;
  m.write(ACTIVE + k, 0, 1); m.write(PC + k, 0, 1);
  if (k === 0) dropPicture(m, 5); else dropLayer(m, m.read(KIND + k, 1) + 1);
  for (let j = 0; j < 3; j++) m.write(ACTIVE + j, 0, 1);
  for (let j = 0; j < 3; j++) { const p = LAYERS + 8 * j; m.write(p, 0, 2); m.write(p + 2, 0, 1); m.write(p + 4, 0, 2); m.write(p + 6, 0, 2); }
  m.write(HANDOFF, 0xff, 1);
}

// 0x8003dadc animWait(k): text frames until channel k ends (auto mode holds), then all off.
export function* animWait(ctx, k) {
  const { m } = ctx, sub = { ...ctx, sp: ctx.sp - 0x20 };
  k &= 0xff;
  while (m.read(ACTIVE + k, 1)) { if (m.read(AUTO, 1) === 1) m.write(AUTO_HOLD, 1, 1); yield* tickText(sub, 1); }
  for (let j = 0; j < 3; j++) m.write(ACTIVE + j, 0, 1);
  for (let j = 0; j < 3; j++) { const p = LAYERS + 8 * j; m.write(p, 0, 2); m.write(p + 2, 0, 1); m.write(p + 4, 0, 2); m.write(p + 6, 0, 2); }
  m.write(HANDOFF, 0xff, 1);
  if (m.read(AUTO, 1) === 1) m.write(AUTO_HOLD, 1, 1);
}
