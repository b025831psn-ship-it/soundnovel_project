// Scene effects started by scenario command 0x1c (effect(mode), weather.js), ported from the
// game's own routines (RAM level, original addresses). Generators yield one frame.
//   0x8003e53c melt(k)          the picture's lines drop away over 300 frames (line table 0x8009d1f8)
//   0x80040ab0 weatherStart(k)  snow (k = 0) or the heavier fall (k = 1): particles, page 0x15
//   0x800411e8 rainStart()      rain (gp[0x1d8] = 3), 30 steps ahead
//   0x800305f4 rings()          concentric ellipses drawn into the 8-bit plane, page 0x15
//   0x80030e94 / 0x800312b4 fan(k, variant)  two spinning wedges of 128 triangles, page 0x15
//   0x80031e20 waitOverlay()    frames while the overlay (gp 0x320, 0x38e) is running
// Drawing helpers on the 320x240 8-bit plane at 0x800b1c20:
//   0x8002dd08 ellipse(r, x, y, c)   0x8002ebe4 triangle(x0, y0, x1, y1, x2, y2, c)
//   0x8002e894 edge(x0, y0, x1, y1, c, side) into the span table 0x801fe8a0
// The soft-float steps of the original (int -> double, x 256.0 or x 65536.0, -> int) are exact
// integer products here.
import { tick } from "../tick.js";
import { textTask } from "../text/text.js";
import { dropLayer, spriteFree } from "../helpers.js";
import { fadeIn, fadeLevel } from "./fader.js";
import { randMod } from "./shake.js";
import { waveReset, sin, cos } from "./wave.js";
import { spritePage } from "./sprites.js";
import { loadClutSlot, bzeroWords, particlesStep, rainStep } from "./weather.js";
import { uploadPicture, maybeTick } from "./picture.js";
import { clutFill } from "../vsync.js";
import { loadPage30 } from "../scenario/state.js";

const GP = 0x8007913c, LINES = 0x8009d1f8, PLANE = 0x800b1c20, SPANS = 0x801fe8a0, IDS = 0x801f6698, NEW = 0x800794f4;
const PAGES = 0x801fd270, SPRITES = 0x801eef68, FAR = 0x800c8820, NEAR = 0x800a6db8, SNOW_CLUT = 0x800c8420;
const s16 = (v) => (v << 16) >> 16;
const div = (a, b) => Math.trunc(a / b) | 0;
const shr16 = (v) => (v < 0 ? v + 0xffff : v) >> 16; // (v / 65536) toward zero, as the original's sra after the bias
const shr8 = (v) => (v < 0 ? v + 0xff : v) >> 8;

// 0x8003be4c: sprite `id` (if in use) takes its line offsets from the table at 0x8009d1f8.
function spriteLines(m, id) {
  id &= 0xffff;
  if (!id) return;
  const s = SPRITES + 72 * id;
  if ((m.read(s, 4) >>> 0) !== 0x80000000) m.write(s + 0x34, LINES, 4);
}

export function* melt(ctx, k) { // 0x8003e53c
  const { m } = ctx, sp = ctx.sp - 0x3f8, sub = { ...ctx, sp }, A = sp + 0x10, B = sp + 0x10 + 0x1e0;
  const r16 = (a) => m.read(a, 2), w16 = (a, v) => m.write(a, v & 0xffff, 2), r32 = (a) => m.read(a, 4) >>> 0, w32 = (a, v) => m.write(a, v >>> 0, 4);
  waveReset(m);
  for (const o of [2, 4, 6, 0xa, 0xc]) spriteLines(m, r16(IDS + o));
  for (let i = 0; i < 0xf0; i++) { w16(A + 2 * i, i); w16(B + 2 * i, 0); w32(LINES + 8 * i, 0); }
  let top = 0xef;
  for (let n = 0; n < 0x12c; n++) {
    for (let j = (s16(top) * 2) | 1; (j & 0xffff) < 0x1e1; j += 2) w32(LINES + 4 * (j & 0xffff), 0x80000000);
    if ((top & 0xffff) < 0xf0) {
      for (let i = top; (i & 0xffff) < 0xf0; i++) {
        const a = A + 2 * (i & 0xffff), line = r16(a);
        if (line >= 0xf0) continue;
        w32(LINES + 4 + 8 * line, (i & 0xffff) * 256);
        const b = r16(a + 0x1e0);
        w16(a, line + b);
        if (b) w16(a + 0x1e0, b + 1);
      }
    }
    let fill = (k & 0xff) ? 0 : 0xf000;
    for (let j = (s16(top) * 2) | 1; (j & 0xffff) < 0x1e1; j += 2) {
      const p = LINES + 4 * (j & 0xffff), v = r32(p);
      if (v === 0x80000000) w32(p, fill); else fill = v;
    }
    if (k & 0xff) { yield* textTask(sub); yield* tick(sub); }
    yield* textTask(sub); yield* tick(sub);
    if (s16(top)) { const t = s16(top - 1); w16(B + 2 * t, r16(B + 2 * t) + 1); top = top - 1; }
  }
}

// The particle tables of the weather: {s16 x, s16 y, u8 phase, u8 size, u8 kind, u8 drift}.
function particleLimit(m, p) { // jump tables 0x8001254c / 0x8001256c / 0x8001258c
  const t = m.read(p + 6, 1);
  if (t >= 8) return;
  m.write(GP + 0x49c, [0xc, 0x11, 0xc, 0xc, 0xc, 0xc, 8, 0x13][t], 2);
}
function weatherSpeeds(m, a, b) { for (const o of [0x3f8, 0x44c, 0x428, 0x46c]) m.write(GP + o, a, 4); for (const o of [0x400, 0x450, 0x430, 0x480]) m.write(GP + o, b, 4); }
function weatherSprite(ctx, sp) { // the full-screen sprite of page 0x15 (as 0x8001cde4 does for the layers)
  const { m } = ctx;
  m.write(PAGES + 0xb0, 0x01000000, 4); m.write(PAGES + 0xa8, 0, 4); m.write(PAGES + 0xac, 0x1f5, 4);
  m.write(sp + 0x10, 0xf0, 4);
  spritePage({ ...ctx, sp }, 0x15, 0, -4, 0x140, 0xf0);
}

export function* weatherStart(ctx, k) { // 0x80040ab0
  const { m } = ctx, sp = ctx.sp - 0x38, sub = { ...ctx, sp }, g16 = (o) => s16(m.read(GP + o, 2));
  k &= 0xff;
  if (((m.read(GP + 0x1d8, 1) << 24) >> 24) === k) return;
  dropLayer(m, 3);
  if (k === 0) weatherSpeeds(m, -0x200, 0x100);
  else if (k === 1) weatherSpeeds(m, -0x800, 0);
  for (let i = 0; i < 0x30; i++) {
    const p = FAR + 8 * i;
    particleLimit(m, p);
    m.write(p, randMod(m, 0x80), 2); m.write(p + 2, randMod(m, 0x80), 2);
    m.write(p + 4, randMod(m, g16(0x49c)), 1); m.write(p + 5, randMod(m, 4), 1); m.write(p + 6, randMod(m, 7), 1);
  }
  for (let i = 0; i < 0x46; i++) {
    const p = NEAR + 8 * i;
    particleLimit(m, p);
    m.write(p, randMod(m, 0x100), 2); m.write(p + 2, randMod(m, 0x100), 2);
    m.write(p + 4, randMod(m, g16(0x49c)), 1);
    if (k === 0) m.write(p + 5, s16(randMod(m, 2)) ? 1 : randMod(m, 2) + 2, 1);
    else if (k === 1) m.write(p + 5, s16(randMod(m, 2)) ? 7 : randMod(m, 2) + 8, 1);
    m.write(p + 6, randMod(m, 7), 1);
  }
  bzeroWords(m, PLANE, 0x1400); // 0x8002d9e4
  if (!m.read(0x80079288, 1)) yield* loadPage30(sub, 0x23f6);
  m.write(0x80079288, 1, 1);
  loadClutSlot(sub, SNOW_CLUT, 0x15);
  dropLayer(m, 3);
  m.write(PAGES + 0xf4, 0x1fe, 4); m.write(PAGES + 0xf0, 0, 4); m.write(PAGES + 0xf8, 0x01000000, 4);
  weatherSprite(ctx, sp);
  m.write(IDS + 6, m.read(0x80079528, 2), 2);
  const s = m.read(NEW, 4) >>> 0;
  m.write(s + 0x31, 3, 1); m.write(s + 0x33, 0xd, 1); m.write(s + 0x1e, 0x1000, 2); m.write(s + 0x38, 3, 1);
  m.write(s + 0x23, 4, 1); m.write(s + 8, 0x140, 2); m.write(s + 0xa, 0x40, 2);
  m.write(s, (m.read(s, 4) | 0x50000000) >>> 0, 4);
  fadeIn(m, 0x78, 3);
  m.write(GP + 0x1d8, k, 1); m.write(GP + 0x1e0, 0xffff, 2);
  particlesStep(m);
  m.write(GP + 0x1e2, 0, 2);
}

export function* rainStart(ctx) { // 0x800411e8
  const { m } = ctx, sp = ctx.sp - 0x28, sub = { ...ctx, sp }, g16 = (o) => s16(m.read(GP + o, 2));
  weatherSpeeds(m, -0x100, 0x100);
  for (let i = 0; i < 0x3c; i++) {
    const p = NEAR + 8 * i;
    particleLimit(m, p);
    m.write(p, randMod(m, 0x3c) + 0x9b, 2);
    m.write(p + 2, randMod(m, 0x19) + 0x7c, 2);
    m.write(p + 4, randMod(m, g16(0x49c)), 1);
    m.write(p + 7, randMod(m, 0x19), 1);
    m.write(p + 5, s16(randMod(m, 4)) ? 0 : 1, 1);
    m.write(p + 6, randMod(m, 7), 1);
  }
  if (!m.read(0x80079288, 1)) yield* loadPage30(sub, 0x23f6);
  loadClutSlot(sub, SNOW_CLUT, 0x1e);
  m.write(0x80079288, 1, 1);
  m.write(GP + 0x1d8, 3, 1); m.write(GP + 0x1e0, 0xffff, 2);
  for (let i = 0; i < 0x1e; i++) rainStep(m);
}

// ---- the 8-bit plane ----
function plot(m, x, y, c) { x = s16(x); y = s16(y); if (x >= 0 && y >= 0 && x < 0x140 && y < 0xf0) m.write(PLANE + y * 0x140 + x, c, 1); }
export function clearPlane(m) { // 0x8002d984
  for (let y = 0; y < 0xf0; y++) for (let x = 0; x < 0x140; x++) m.write(PLANE + y * 0x140 + x, 0, 1); }

export function ellipse(m, r, x, y, c) { // 0x8002dd08: midpoint circle, y scaled by gp[0xc8]/256
  if (s16(r) < 0) return;
  const aspect = m.read(GP + 0xc8, 4) | 0;
  let t0 = r, d = r, t2 = 0;
  do {
    const t1 = shr8(Math.imul(aspect, s16(t2))), t3 = shr8(Math.imul(aspect, s16(t0)));
    for (const [dx, dy] of [[t0, t1], [t2, t3]]) for (const e of [0, 1]) {
      plot(m, x + dx + e, y + dy, c); plot(m, x + dx + e, y - dy, c); plot(m, x - dx - e, y + dy, c); plot(m, x - dx - e, y - dy, c);
    }
    d = d - 1 - s16(t2) * 2;
    if (s16(d) < 0) { d += s16(t0) * 2 - 2; t0--; }
    t2++;
  } while (!(s16(t0) < s16(t2)));
}

function edge(m, x0, y0, x1, y1, c, side) { // 0x8002e894
  const dx = s16(x1 - x0), dy = s16(y1 - y0);
  if (!dx && !dy) { plot(m, x0, y0, c); return; }
  const adx = Math.abs(dx), ady = Math.abs(dy);
  let sx, sy, n;
  if (ady < adx) {
    sx = dx >= 0 ? 0x10000 : -0x10000;
    const q = div(dy * 65536, adx); sy = dy < 0 ? q - 1 : q + 1;
    n = adx;
  } else {
    const q = div(dx * 65536, ady); sx = dx < 0 ? q - 1 : q + 1;
    sy = dy >= 0 ? 0x10000 : -0x10000;
    n = ady;
  }
  for (let i = 0; i < (n & 0xffff); i++) {
    const a = SPANS + 4 * (s16(y0) + shr16(Math.imul(i, sy))) + 2 * side;
    if (s16(m.read(a, 2)) === 0x7fff) m.write(a, x0 + shr16(Math.imul(i, sx)), 2);
  }
}
function spans(m, c) { // the fix-up and fill passes of 0x8002ebe4
  for (let y = 0; y < 0xf0; y++) {
    const a = SPANS + 4 * y, l = s16(m.read(a, 2)), r = s16(m.read(a + 2, 2));
    if (l === 0x7fff || r === 0x7fff) continue;
    if (r < l) { m.write(a, r, 2); m.write(a + 2, l, 2); }
    if (s16(m.read(a, 2)) <= 0) m.write(a, 0, 2);
    if (s16(m.read(a + 2, 2)) >= 0x140) m.write(a + 2, 0x13f, 2);
  }
  for (let y = 0; y < 0xf0; y++) {
    const a = SPANS + 4 * y, l = s16(m.read(a, 2)), r = s16(m.read(a + 2, 2));
    if (l === 0x7fff || r === 0x7fff || r < l) continue;
    for (let x = l; !(r < s16(x)); x++) m.write(PLANE + y * 0x140 + s16(x), c, 1);
  }
}
const clearSpans = (m) => { for (let y = 0; y < 0xf0; y++) { m.write(SPANS + 4 * y + 2, 0x7fff, 2); m.write(SPANS + 4 * y, 0x7fff, 2); } };

export function triangle(m, x0, y0, x1, y1, x2, y2, c) { // 0x8002ebe4
  c &= 0xff;
  if (s16(y1) < s16(y0)) [x0, y0, x1, y1] = [x1, y1, x0, y0];
  if (s16(y2) < s16(y1)) [x1, y1, x2, y2] = [x2, y2, x1, y1];
  if (s16(y1) < s16(y0)) [x0, y0, x1, y1] = [x1, y1, x0, y0];
  clearSpans(m);
  edge(m, s16(x0), s16(y0), s16(x1), s16(y1), c, 0);
  edge(m, s16(x0), s16(y0), s16(x2), s16(y2), c, 1);
  spans(m, c);
  clearSpans(m);
  if (s16(y1) === s16(y2)) return;
  edge(m, s16(x0), s16(y0), s16(x2), s16(y2), c, 0);
  edge(m, s16(x1), s16(y1), s16(x2), s16(y2), c, 1);
  spans(m, c);
}

// The overlay sprite of page 0x15 shared by rings / fan: slot 0x801f66a8, fader channel 8 (inlined fadeLevel).
function overlaySprite(ctx, sp, extra) {
  const { m } = ctx, id = m.read(IDS + 0x10, 2);
  if (id) { spriteFree(m, s16(id)); m.write(IDS + 0x10, 0, 2); }
  weatherSprite(ctx, sp);
  m.write(IDS + 0x10, m.read(0x80079528, 2), 2);
  const s = m.read(NEW, 4) >>> 0;
  m.write(s + 0x31, 8, 1); m.write(s + 0x1e, 0x1000, 2); m.write(s + 0x33, 5, 1);
  if (extra) m.write(s + 0x33, 7, 1);
  fadeLevel(m, 8, 0xff);
}

export function* rings(ctx) { // 0x800305f4
  const { m } = ctx, sp = ctx.sp - 0x30, sub = { ...ctx, sp };
  clearPlane(m);
  for (let i = 0; i < 0xd; i++) {
    const base = i * 15;
    for (let j = 0; j < 0xf; j++) ellipse(m, s16(0xc2 - (j + base)), 0xa0, 0x70, (j + base) & 0xff);
    yield* maybeTick(sub);
  }
  uploadPicture(sub, 0x15, PLANE, 0);
  m.write(GP + 0x38e, 0x14, 1); m.write(GP + 0x320, 0x20, 4);
  overlaySprite(ctx, sp, true);
}

export function fan(ctx, k, variant) { // 0x80030e94 (variant 0) / 0x800312b4 (variant 1)
  const { m } = ctx, sp = ctx.sp - 0x48, sub = { ...ctx, sp };
  clearPlane(m);
  const pt = (a, centre, f) => s16(shr16(Math.imul(f(m, ((a << 8) & 0xffff)), 200)) + centre);
  for (let i = 0; i < 0x80; i++) {
    for (const off of [-0x20, 0x60]) {
      const a = i + off, b = a + 1;
      triangle(m, 0xa0, 0x78, pt(a, 0xa0, sin), pt(a, 0x78, cos), pt(b, 0xa0, sin), pt(b, 0x78, cos), i & 0xff);
    }
  }
  uploadPicture(sub, 0x15, PLANE, 0);
  clutFill(sub, variant ? 0 : 0x8000, 0, 0x100, 0x15);
  m.write(GP + 0x38e, variant ? 0x1e : 0x1f, 1);
  m.write(0x80079584, variant ? 0 : 0x8000, 4);
  m.write(0x800795fc, (k & 0xffff) * 256, 4);
  m.write(GP + 0x320, 0x80, 4);
  m.write(GP + 0x444, variant ? 0 : 0x78, 4);
  overlaySprite(ctx, sp, false);
}

export function* waitOverlay(ctx) { // 0x80031e20
  const sub = { ...ctx, sp: ctx.sp - 0x18 }, { m } = ctx;
  while (m.read(GP + 0x320, 4) && m.read(GP + 0x38e, 1)) yield* tick(sub);
}
