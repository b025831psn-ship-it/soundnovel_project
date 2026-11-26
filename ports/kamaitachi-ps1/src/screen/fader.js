// The game's brightness faders: 11 channels (0 = master), values in 24.8 fixed point that
// sortSprites (sprites.js) multiplies into sprite colours. Ported from:
//   0x8002c5a0 fadeStep()               one step of every channel (also applies direct sets)
//   0x8002c6e4 fadeIn(frames, ch)        from black to the channel's level over `frames`
//   0x8002c80c fadeLater(frames, ch, n)  fadeIn after n frames
//   0x8002c838 fadeTick()               per frame: start the delayed fades that are due
//   0x8002c8e8 fadeTo(frames, ch)        from the current value to the level
//   0x8002ca08 fadeOut(frames, ch)       from the current value to black
//   0x80044ecc fmul(a, b)                (a * b) / 256, rounded toward zero
import { loadClutSlot } from "./weather.js";
const CUR = 0x801f7500, TARGET = 0x801fdf98, STEP = 0x801fe070, LEFT = 0x8008cda8, LEVEL = 0x801f5e68;
const SET = 0x801f1cb0, SET_VALUE = 0x801f5d08, LATER = 0x800a7058, LATER_WAIT = 0x800c89a0;
const CHANNELS = 11;

export const fmul = (a, b) => { const v = Math.imul(a, b); return (v < 0 ? v + 0xff : v) >> 8; };
const sdiv = (a, b, at) => { if (!b) throw new Error(`fader: divide by zero (break 7 at 0x${at.toString(16)})`); return Math.trunc(a / b) | 0; };

function rw(m) {
  return { r32: (a) => m.read(a, 4) | 0, w32: (a, v) => m.write(a, v >>> 0, 4), r16: (a) => m.read(a, 2), w16: (a, v) => m.write(a, v & 0xffff, 2) };
}

function setTarget(m, c) { // shared head of fadeIn / fadeTo
  const { r32, w32 } = rw(m);
  let t = r32(LEVEL + 4 * c); t = Math.trunc(t / 2) | 0;
  w32(TARGET + 4 * c, t);
  const master = r32(LEVEL);
  if (master !== 0x10000) w32(TARGET + 4 * c, fmul(t, master));
}

const distance = (a, b) => a === b ? 0 : b < a ? a - b : b - a;

export function fadeStep(m) {
  const { r32, w32, r16, w16 } = rw(m);
  for (let c = 0; c < CHANNELS; c++) {
    if (r32(SET + 4 * c)) { const v = r32(SET_VALUE + 4 * c); w32(TARGET + 4 * c, v); w32(CUR + 4 * c, v); w32(SET + 4 * c, 0); }
    const left = r16(LEFT + 2 * c);
    if (!left) { w32(CUR + 4 * c, r32(TARGET + 4 * c)); continue; }
    w16(LEFT + 2 * c, left - 1);
    const cur = r32(CUR + 4 * c), step = r32(STEP + 4 * c);
    w32(CUR + 4 * c, cur < r32(TARGET + 4 * c) ? cur + step : cur - step);
  }
}

export function fadeIn(m, frames, ch) {
  const { r32, w32, w16 } = rw(m), c = ch & 0xff;
  w32(CUR + 4 * c, 0); w16(LEFT + 2 * c, frames);
  setTarget(m, c);
  w32(STEP + 4 * c, sdiv(distance(r32(CUR + 4 * c), r32(TARGET + 4 * c)), frames & 0xffff, 0x8002c7b0));
  fadeStep(m);
}

export function fadeTo(m, frames, ch) {
  const { r32, w32, w16 } = rw(m), c = ch & 0xff;
  w16(LEFT + 2 * c, frames);
  setTarget(m, c);
  w32(STEP + 4 * c, sdiv(distance(r32(CUR + 4 * c), r32(TARGET + 4 * c)), frames & 0xffff, 0x8002c9b0));
}

export function fadeLater(m, frames, ch, wait) { const c = ch & 0xff; m.write(LATER + 2 * c, frames & 0xffff, 2); m.write(LATER_WAIT + 2 * c, wait & 0xffff, 2); }

export function fadeTick(m) {
  const { r16, w16 } = rw(m);
  for (let c = 0; c < CHANNELS; c++) {
    if (((r16(LATER + 2 * c) << 16) >> 16) === -1) continue;
    const wait = r16(LATER_WAIT + 2 * c);
    if (wait) { w16(LATER_WAIT + 2 * c, wait - 1); continue; }
    fadeIn(m, r16(LATER + 2 * c), c);
    w16(LATER + 2 * c, 0xffff);
  }
}

export function fadeOut(m, frames, ch) {
  const { r32, w32, w16 } = rw(m), c = ch & 0xff, cur = r32(CUR + 4 * c);
  if (cur) {
    w16(LEFT + 2 * c, frames); w32(TARGET + 4 * c, 0);
    w32(STEP + 4 * c, sdiv(cur > 0 ? cur : -cur, frames & 0xffff, 0x8002ca90));
  }
  fadeStep(m);
}

// 0x8002cae0 fadeLevel(k, v): channel k's level = min(v, 0xff) · 256 (the original goes through
// the soft-float library: int -> double, · 256.0, -> int, exact here) and its set value half
// of it, or, while channel 0 is not at full level (0x10000), target · level0 >> 8 (0x80044ecc,
// whose second argument is the level of channel 0 left in a1); then fadeStep.
export function fadeLevel(m, k, v) {
  v &= 0xffff; if (v >= 0x100) v = 0xff; k &= 0xff;
  const level = v * 256;
  m.write(LEVEL + 4 * k, level, 4); m.write(SET_VALUE + 4 * k, level >> 1, 4);
  const l0 = m.read(LEVEL, 4) | 0;
  if (l0 !== 0x10000) m.write(SET_VALUE + 4 * k, fmul(m.read(TARGET + 4 * k, 4) | 0, l0) >>> 0, 4);
  m.write(SET + 4 * k, 1, 4);
  fadeStep(m);
}

// 0x8001f690 windowPalette(): the text window colours. Two base colours (b, g, r bytes at
// 0x800795e4 and 0x8007960c) give entries 1-7 and 9-15 of palette 0x18 (copy 0x800c7820),
// each channel scaled by 179/256, 3/4, 51/64, 217/256, 115/128, 243/256 and 1 (the channel
// sums are added, not masked, as in the original); then the palette goes to VRAM.
const WINDOW_SHADES = [[179, 8], [3, 2], [51, 6], [217, 8], [115, 7], [243, 8], [1, 0]];
const WINDOW_PAL = 0x800c4820 + 0x3000;
export function windowColours(m) {
  const pal = WINDOW_PAL;
  for (const [base, at] of [[0x800795e4, pal + 2], [0x8007960c, pal + 0x12]]) {
    const b = m.read(base, 1), g = m.read(base + 1, 1), r = m.read(base + 2, 1);
    WINDOW_SHADES.forEach(([k, s], i) => m.write(at + 2 * i, (((r * k) >> s << 10) + ((g * k) >> s << 5) + ((b * k) >> s) - 0x8000) & 0xffff, 2));
  }
}
export function windowPalette(ctx) { windowColours(ctx.m); loadClutSlot({ ...ctx, sp: ctx.sp - 0x18 }, WINDOW_PAL, 0x18); }
