// Snow and rain, ported from the per-frame weather routine 0x800416a4 and its helpers.
// State stays in PS1 RAM at the original addresses. gp[0x1d8] is the weather mode
// (-1 off, 0 light snow, 1 blizzard, 2 still wind, 3 rain), gp[0x1dc] a frame counter,
// gp[0x1e0] a countdown that ends the weather (dropLayer 3, 0x8001db2c), gp[0x1e2] the number of
// pending particle steps (0x8004106c adds them, up to 4).
//
// Two particle sets of 8 bytes {s16 x, s16 y, u8 step, u8 kind, u8 pattern, u8 ?}:
//   FAR  0x800c8820, 48 flakes plotted as 5 columns into an 8-bit 320x64 buffer
//        (0x800b1c20) that is uploaded to texture page 0x15 and drawn as tiles.
//   NEAR 0x800a6db8, 70 flakes (60 raindrops) drawn as sprites from page 0x1e.
// Each pattern (0..6) is a list of {s16 dx, s16 dy} steps (0x8006fb70) of a given length
// (0x8006fb90); wind (24.8 fixed point) drifts toward a random target every 200 frames.
//   0x80040178 particlesStep  0x80040410 snowTick  0x80040ebc rainStep  0x8004109c rainTick
//   0x8003abec loadClutSlot   0x8002d934 plot      0x8002f0e8 uploadPage 0x8003ccf8 upload
//   0x80044904 memcpy         0x80044be4 bzeroWords
import { randMod } from "./shake.js";
import { spriteAdd, spriteLayer } from "./sprites.js";
import { dropLayer, dropOverlay } from "../helpers.js";
import { animStop } from "../scenario/lib.js";
import { waveReset } from "./wave.js";

const GP = 0x8007913c, SPRITES = 0x801eef68, NEW = 0x800794f4, FRAME_STEP = 0x80079278, IDS = 0x801f6698;
const FAR = 0x800c8820, NEAR = 0x800a6db8, PLANE = 0x800b1c20, CLUTS = 0x800c4820, SNOW_CLUT = 0x800c8420;
const STEPS = 0x8006fb70, LENGTHS = 0x8006fb90, SIZES = 0x8006fb98, WAVE = 0x8009d1f8;
const unported = (addr) => { throw new Error(`weather: path at 0x${addr.toString(16)} is not ported`); };
const s8 = (v) => (v << 24) >> 24, s16 = (v) => (v << 16) >> 16;
const half = (v) => Math.trunc(v / 2) | 0;

function io(m) {
  return {
    r8: (a) => m.read(a, 1), r16: (a) => m.read(a, 2), r32: (a) => m.read(a, 4) >>> 0, s32: (a) => m.read(a, 4) | 0,
    w8: (a, v) => m.write(a, v & 0xff, 1), w16: (a, v) => m.write(a, v & 0xffff, 2), w32: (a, v) => m.write(a, v >>> 0, 4),
    g8: (o) => m.read(GP + o, 1), g16: (o) => m.read(GP + o, 2), g32: (o) => m.read(GP + o, 4) | 0,
    p8: (o, v) => m.write(GP + o, v & 0xff, 1), p16: (o, v) => m.write(GP + o, v & 0xffff, 2), p32: (o, v) => m.write(GP + o, v >>> 0, 4),
  };
}

export function memcpy(m, src, dst, n) { for (let i = 0; i < n; i++) m.write(dst + i, m.read(src + i, 1), 1); } // 0x80044904
export function bzeroWords(m, p, n) { for (let i = 0; i < n; i++) m.write(p + 4 * i, 0, 4); } // 0x80044be4
export function plot(m, y, x, c) { // 0x8002d934
  x = s16(x); y = s16(y);
  if (x >= 0 && y >= 0 && x < 0x140 && y < 0xf0) m.write(PLANE + y * 320 + x, c & 0xff, 1);
}
// 0x8003abec: palette `n` (256 entries) to VRAM (0, 0x1e0 + n) and to the copy at 0x800c4820.
export function loadClutSlot(ctx, src, n) {
  n &= 0xff;
  ctx.gs.LoadClut(src, 0, n + 0x1e0, ctx.sp - 0x20 - 0x28);
  memcpy(ctx.m, src, CLUTS + (n << 9), 0x200);
}
// 0x8002f0e8 -> 0x8003ccf8: the 320x64 8-bit buffer to texture page `page`.
export function uploadPage(ctx, page, src = PLANE) {
  const { gs } = ctx, { w16 } = io(ctx.m), p = page & 0xff, rect = ctx.sp - 0x18 - 0x20 + 0x10;
  w16(rect + 2, p < 0x10 ? 0 : 0x100); w16(rect, (p & 0xf) << 6); w16(rect + 4, 0xa0); w16(rect + 6, 0x40);
  gs.DrawSync(0); gs.LoadImage(rect, src); gs.DrawSync(0);
}

// One step along a particle's pattern; returns the pattern length.
function stepParticle(m, p) {
  const { r8, r16, r32, w16, p16 } = io(m), pat = r8(p + 6);
  p16(0x49c, r8(LENGTHS + pat));
  const e = r32(STEPS + 4 * pat) + 4 * r8(p + 4);
  w16(p, r16(p) + r16(e)); w16(p + 2, r16(p + 2) + r16(e + 2) + 1);
}
function nextPattern(m, p) {
  const { r8, w8, g16 } = io(m);
  if (r8(p + 4) >= g16(0x49c)) { w8(p + 4, 0); w8(p + 6, randMod(m, 7)); }
}

export function particlesStep(m) { // 0x80040178
  const { r8, r16, w8, w16, g8, g32 } = io(m), mode = s8(g8(0x1d8));
  if (mode === -1 || mode === 3) return;
  for (const [base, n, wx, wy, mask] of [[FAR, 48, 0x428, 0x430, 0x7f], [NEAR, 70, 0x3f8, 0x400, 0xff]]) {
    for (let i = 0; i < n; i++) {
      const p = base + 8 * i;
      stepParticle(m, p);
      w8(p + 4, r8(p + 4) + 1);
      w16(p, (r16(p) + (g32(wx) >> 8)) & mask); w16(p + 2, (r16(p + 2) + (g32(wy) >> 8)) & mask);
      nextPattern(m, p);
    }
  }
}

export function rainStep(m) { // 0x80040ebc
  const { r8, r16, w8, w16, g8, g32 } = io(m);
  if (s8(g8(0x1d8)) !== 3) return;
  for (let i = 0; i < 60; i++) {
    const p = NEAR + 8 * i;
    stepParticle(m, p);
    let dx = g32(0x3f8) >> 8, dy = g32(0x400) >> 8;
    if (i >= 30) { dx = half(dx); dy = half(dy); } // the far half falls at half the wind
    w16(p, r16(p) + dx); w16(p + 2, r16(p + 2) + dy);
    w8(p + 4, r8(p + 4) + 1);
    if (s16(r16(p + 2)) >= 0xd2) { w16(p, randMod(m, 0x3c) + 0x9b); w16(p + 2, 0x7c); w8(p + 7, 0x19); }
    nextPattern(m, p);
  }
}

function addFlake(ctx, p, x, layer, type) {
  const { m } = ctx, { r8, r16, r32, w8, p8, g8 } = io(m), kind = r8(p + 5);
  p8(0x4c5, r8(SIZES + kind));
  const size = g8(0x4c5);
  spriteAdd(ctx, 0x1e, x, s16(r16(p + 2)), kind << 4, 0, size, size, 0x50000000, layer);
  w8(r32(NEW) + 0x31, type);
}
function runPending(m, step) {
  const { g16, p16 } = io(m);
  for (let i = 0; (i & 0xffff) < g16(0x1e2); i++) step(m);
  p16(0x1e2, 0);
}
function countdown(ctx) { // shared tail: the weather's remaining time
  const { m } = ctx, { r16, g8, g16, p8, p16 } = io(m);
  if (s16(g16(0x1e0)) === -1) return;
  p16(0x1e0, g16(0x1e0) - r16(FRAME_STEP));
  if (s16(g16(0x1e0)) > 0 || s8(g8(0x1d8)) === -1) return;
  p8(0x1d8, -1);
  dropLayer(ctx.m, 3);
  p16(0x1e0, -1);
}
// Wind: each value moves `step` toward its target, every frame.
function approach(m, step) {
  const { g32, p32 } = io(m);
  for (const [cur, target] of [[0x3f8, 0x44c], [0x400, 0x450], [0x428, 0x46c], [0x430, 0x480]])
    p32(cur, g32(cur) < g32(target) ? g32(cur) + step : g32(cur) - step);
}

export function snowTick(ctx) { // 0x80040410
  const { m } = ctx, { r16, w8, g8, g32, p32 } = io(m);
  let mode = s8(g8(0x1d8));
  if (mode !== -1 && mode !== 3) {
    w8(SPRITES + r16(0x801f669e) * 0x48 + 0x33, 0xd);
    loadClutSlot({ ...ctx, sp: ctx.sp - 0x48 }, SNOW_CLUT, 0x15);
    runPending(m, particlesStep);
    bzeroWords(m, PLANE, 0x1400);
    for (let i = 0; i < 48; i++) {
      const p = FAR + 8 * i;
      for (let j = 0; j < 5; j++) plot(m, half(s16(r16(p + 2))), half(s16(r16(p))) + j * 64, m.read(p + 5, 1) + 0xb);
    }
    uploadPage({ ...ctx, sp: ctx.sp - 0x48 }, 0x15);
    const fctx = { ...ctx, sp: ctx.sp - 0x48 };
    for (let i = 0; i < 70; i++) {
      const p = NEAR + 8 * i;
      addFlake(fctx, p, s16(r16(p)), 0xd, 3);
      if (s16(r16(p)) < 0x5a) addFlake(fctx, p, s16(r16(p) + 0x100), 0xd, 3); // wraps around the 256-wide field
    }
  }
  mode = s8(g8(0x1d8));
  const t = g32(0x1dc) >>> 0, due = t % 200 === 0;
  const r256 = (n) => randMod(m, n) * 256;
  if (mode === 0) {
    if (due) {
      p32(0x44c, r256(4) - 0x100); p32(0x450, 0x100);
      if (!randMod(m, 10)) { p32(0x44c, 0); p32(0x450, r256(2) - 0x300); p32(0x1dc, g32(0x1dc) + 0x78); }
    }
    const k = (g32(0x1dc) >>> 0) % 200;
    if (k === 0x32 || k === 0xaa) { p32(0x46c, g32(0x44c)); p32(0x480, g32(0x450)); }
    approach(m, 0x19);
  } else if (mode === 1) {
    if (due) {
      p32(0x44c, randMod(m, 2) ? r256(2) + 0xb00 : r256(2) - 0x800);
      const v = r256(2) - 0x100;
      p32(0x450, v); p32(0x480, v); p32(0x46c, g32(0x44c));
    }
    approach(m, 0xcc);
  } else if (mode === 2) approach(m, 0xcc);
  p32(0x1dc, g32(0x1dc) + 1);
  countdown(ctx);
}

export function rainTick(ctx) { // 0x8004109c
  const { m } = ctx, { g8 } = io(m);
  if (s8(g8(0x1d8)) === 3) {
    runPending(m, rainStep);
    const fctx = { ...ctx, sp: ctx.sp - 0x38 };
    for (let i = 0; i < 60; i++) { const p = NEAR + 8 * i; addFlake(fctx, p, s16(m.read(p, 2)), 0xc, 1); }
  }
  countdown(ctx);
}

export function weatherTick(ctx) { // 0x800416a4
  const { m } = ctx, { r16, w32, g8, g32, p8 } = io(m);
  if (m.read(0x800795e2, 1) === 2) return;
  const sub = { ...ctx, sp: ctx.sp - 0x28 };
  snowTick(sub);
  rainTick(sub);
  if (g8(0x1c9) === 1) { // reset the wave table to a random horizontal jitter
    for (let i = 0; i < 8; i++) { w32(WAVE + 8 * i, 0); w32(WAVE + 8 * i + 4, 0xf000); }
    for (let i = 8; i < 0xf0; i++) { w32(WAVE + 8 * i, 0); w32(WAVE + 8 * i + 4, randMod(m, 0xf0) * 256); }
  }
  if (g32(0x1cc)) unported(0x8003f718); // 0x8003f708: palette animation
  if (g8(0x1d0)) spriteLayer(m, r16(IDS + 4), g8(0x1d1) ? 0xc : 0xf);
  p8(0x1d1, (g8(0x1d1) + 1) & 1);
  if (g8(0x1d2) === 1) unported(0x800417d4);
  if (g8(0x1d3) === 1) unported(0x8004188c);
  if (g8(0x1e4) === 1) unported(0x80041484); // 0x80041464
}

// 0x80031e8c effectsOff(): the screen effects' flags (gp 0x444, 0x4bc, 0x474, 0x320, 0x38e
// and 0x80079584 / 0x800795fc / 0x800795b4) cleared, the overlay sprite dropped.
export function effectsOff(m) {
  for (const o of [0x444, 0x4bc, 0x474, 0x320]) m.write(GP + o, 0, 4);
  for (const a of [0x80079584, 0x800795fc, 0x800795b4]) m.write(a, 0, 4);
  dropOverlay(m);
  m.write(GP + 0x38e, 0, 1);
}

// 0x800418d0 effect(mode): the scene effects switch; only mode 0 (all off) is ported.
// Mode 0: animations stopped (unless 0x800792c3), the weather ended (gp[0x1d8] != -1),
// effects off, the wave reset, the flash sprite back to layer 0xc, layers 2 and 3 dropped.
export function effect(ctx, mode) {
  const { m } = ctx, g8 = (o) => m.read(GP + o, 1);
  if ((mode & 0xffff) >= 0x100) return;
  if ((mode & 0xffff) !== 0) { ctx.call(0x800418d0, [mode], ctx.sp); return; } // other modes: not ported yet (native on the oracle)
  const keep = m.read(0x800792c3, 1);
  if (!keep) animStop(m);
  m.write(GP + 0x1cc, 0, 4); m.write(GP + 0x390, 0, 1);
  if (s8(g8(0x1d8)) !== -1) { m.write(GP + 0x1d8, 0xff, 1); dropLayer(m, 3); m.write(GP + 0x1e0, 0xffff, 2); }
  effectsOff(m);
  if (g8(0x1c9)) unported(0x800419d4);
  waveReset(m); waveReset(m);
  const shake = m.read(GP + 0x1c0, 4); m.write(GP + 0x1d3, 0, 1);
  if (shake) unported(0x80041a00);
  m.write(GP + 0x1d0, 0, 1);
  spriteLayer(m, m.read(IDS + 4, 2), 0xc);
  if (g8(0x1d2) === 1) unported(0x80041a6c);
  if (!m.read(0x800792c3, 1)) { dropLayer(m, 2); dropLayer(m, 3); }
  m.write(0x800792ae, 0, 1); m.write(0x800792ac, 0, 1);
}
