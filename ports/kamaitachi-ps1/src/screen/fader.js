// The game's brightness faders: 11 channels (0 = master), values in 24.8 fixed point that
// sortSprites (sprites.js) multiplies into sprite colours. Ported from:
//   0x8002c5a0 fadeStep()               one step of every channel (also applies direct sets)
//   0x8002c6e4 fadeIn(frames, ch)        from black to the channel's level over `frames`
//   0x8002c80c fadeLater(frames, ch, n)  fadeIn after n frames
//   0x8002c838 fadeTick()               per frame: start the delayed fades that are due
//   0x8002c8e8 fadeTo(frames, ch)        from the current value to the level
//   0x8002ca08 fadeOut(frames, ch)       from the current value to black
//   0x80044ecc fmul(a, b)                (a * b) / 256, rounded toward zero
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
