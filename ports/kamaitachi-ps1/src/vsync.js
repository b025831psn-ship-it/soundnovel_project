// The game's VSync callback, 0x8002d46c (registered by effectsInit, init.js), run once per
// vertical blank: frame counters, the fader step, the screen-overlay step (0x8003186c), the
// sound driver's interrupt part (through the sound bridge), the weather counters and the
// shake/wave steps.
//   0x8003ae5c clutFill(colour, start, count, slot): entries of CLUT slot (0x800c4820 +
//              0x200·slot, VRAM row 0x1e0 + slot) set to colour, then uploaded
//   0x8003ac44 clutBrighten(slot, add): the slot's colours + add per channel (to 31), uploaded
import { fadeStep } from "./screen/fader.js";
import { spriteFree } from "./helpers.js";
import { sound } from "./sound-bridge.js";
import { x8003186c } from "./screen/overlay-translated.js";
const runToEnd = (g) => { if (!g.next().done) throw new Error("vsync: the overlay step waited for a frame"); };

const GP = 0x8007913c, CLUTS = 0x800c4820, TMP = 0x801fd070, IDS = 0x801f6698;
const unported = (addr) => { throw new Error(`vsync: path at 0x${addr.toString(16)} is not ported`); };
const s16 = (v) => (v << 16) >> 16;
const div256 = (v) => Math.trunc((v | 0) / 256);

function copyWords(m, src, dst, n) { for (let i = 0; i < n; i++) m.write(dst + 4 * i, m.read(src + 4 * i, 4), 4); } // 0x800448d8

export function clutFill(ctx, colour, start, count, slot) { // 0x8003ae5c
  const { m, gs } = ctx, f = ctx.sp - 0x28;
  count &= 0xffff; slot &= 0xff;
  if (!count) return;
  const base = CLUTS + slot * 0x200;
  copyWords(m, base, TMP, 0x80);
  for (let i = 0; i < count; i++) { const k = (start & 0xffff) + (i & 0xffff); if (k < 0x100) m.write(TMP + 2 * k, colour, 2); }
  gs.LoadClut(TMP, 0, slot + 0x1e0, f - 0x28);
  copyWords(m, TMP, base, 0x80);
}

export function clutBrighten(ctx, slot, add) { // 0x8003ac44
  const { m, gs } = ctx, f = ctx.sp - 0x220, buf = f + 0x10;
  slot &= 0xff;
  gs.DrawSync(0);
  const base = CLUTS + slot * 0x200, lim = (v) => (v & 0xff) < 0x20 ? v & 0xff : 0x1f;
  for (let i = 0; i < 0x100; i++) {
    const v = m.read(base + 2 * i, 2);
    const r = lim(add + (v & 0x1f)), g = lim(add + ((v & 0x3e0) >> 5)), b = lim(add + ((v & 0x7c00) >> 10));
    m.write(buf + 2 * i, ((b << 10) + (g << 5) + r - 0x8000) & 0xffff, 2);
  }
  gs.LoadClut(buf, 0, slot + 0x1e0, f - 0x28);
}

// 0x8003186c: the overlay step for gp[0x38e] (1..34); cases 12/21/30 (fade in to the flash
// colour), 20 (flash and brighten) and 31 (fade out) are ported.
export function overlayTick(ctx) {
  const { m } = ctx, sub = { ...ctx, sp: ctx.sp - 0x20 }, g32 = (o) => m.read(GP + o, 4) | 0, p32 = (o, v) => m.write(GP + o, v >>> 0, 4);
  const LEVEL = 0x80079584, STEP = 0x800795fc, r32 = (a) => m.read(a, 4) | 0, w32 = (a, v) => m.write(a, v >>> 0, 4);
  const k = m.read(GP + 0x38e, 1);
  if (!k || k - 1 >= 0x22) return;
  // the cases not ported by hand, and the flash reaching full (0x80031b6c): the translated step whole
  const full = (k === 12 || k === 21 || k === 30) && g32(0x320) >= 0 && !(0x10000 < r32(LEVEL)) && 0x10000 < ((r32(LEVEL) + r32(STEP)) | 0);
  if ([1, 11, 13, 22, 34].includes(k) || full) { runToEnd(x8003186c(ctx)); return; }
  const end = () => { const id = m.read(IDS + 0x10, 2); if (id) { spriteFree(m, s16(id)); m.write(IDS + 0x10, 0, 2); } m.write(GP + 0x38e, 0, 1); };
  const stepDown = () => p32(0x320, g32(0x320) - div256(r32(STEP)));
  if (k === 31) {
    if (g32(0x320) < 0) return end();
    if (g32(0x444) !== 0) { p32(0x444, g32(0x444) - 1); return; }
    if (r32(LEVEL) >= 0) {
      clutFill(sub, 0, 0, 0x100, 0x15);
      clutFill(sub, 0x8000, 0, div256(r32(LEVEL)) & 0xffff, 0x15);
      const v = r32(LEVEL) - r32(STEP); w32(LEVEL, v);
      if (v < 0) w32(LEVEL, 0);
    }
    return stepDown();
  }
  if (k === 12 || k === 21 || k === 30) {
    if (g32(0x320) < 0) { clutFill(sub, 0x8000, 0, 0x100, 0x15); m.write(GP + 0x38e, 0, 1); return; }
    const a = r32(LEVEL);
    if (!(0x10000 < a)) {
      clutFill(sub, 0x8000, 0, div256(a) & 0xffff, 0x15);
      const v = r32(LEVEL) + r32(STEP); w32(LEVEL, v);
    }
    return stepDown();
  }
  if (k === 20) {
    if (g32(0x320) === 0) return end();
    clutFill(sub, 0, 0, 0x100, 0x15);
    const a = g32(0x320);
    if (a < 0x10) { clutFill(sub, 0x8000, 0, (a << 4) & 0xfff0, 0x15); clutBrighten(sub, 8, m.read(GP + 0x320, 1)); }
    else { clutFill(sub, 0x8000, 0, ((0x20 - a) << 4) & 0xfff0, 0x15); clutBrighten(sub, 8, (0x20 - m.read(GP + 0x320, 1)) & 0xff); }
    p32(0x320, g32(0x320) - 1);
    return;
  }
}

export function vsyncCallback(ctx) { // 0x8002d46c
  const { m } = ctx, sp = ctx.sp - 0x18, sub = { ...ctx, sp }, g32 = (o) => m.read(GP + o, 4) | 0, p32 = (o, v) => m.write(GP + o, v >>> 0, 4);
  for (const a of [0x80079260, 0x80079268, 0x8007926c, 0x80079264, 0x80079270]) m.write(a, (m.read(a, 4) + 1) >>> 0, 4);
  if (m.read(0x8007927c, 1)) return;
  fadeStep(m);
  overlayTick(sub);
  sound(sub).vsync(sp);
  const weather = (m.read(GP + 0x1d8, 1) << 24) >> 24, count = () => { const v = m.read(GP + 0x1e2, 2); if (v < 4) m.write(GP + 0x1e2, v + 1, 2); };
  if (weather !== -1 && weather !== 3) count(); // 0x800403d8 (snow)
  if (((m.read(GP + 0x1d8, 1) << 24) >> 24) === 3) count(); // 0x8004106c (rain)
  // two wave phases (the effects' set-up routines start them): phase = (phase + speed) mod period,
  // the period / amplitude pair either stepping toward a target for gp[0x88] frames or set to it
  if (g32(0x8c) && g32(0x90)) p32(0x84, ((g32(0x84) + g32(0xc4)) | 0) % g32(0x90) | 0);
  if (g32(0xac) && g32(0xb0)) p32(0xa4, ((g32(0xa4) + g32(0xc4)) | 0) % g32(0xb0) | 0);
  let n = m.read(GP + 0x88, 2);
  if (n) { m.write(GP + 0x88, n - 1, 2); p32(0x8c, g32(0x8c) + g32(0x9c)); p32(0x90, g32(0x90) + g32(0xa0)); }
  else { p32(0x8c, g32(0x94)); p32(0x90, g32(0x98)); }
  n = m.read(GP + 0xa8, 2);
  if (n) { m.write(GP + 0xa8, n - 1, 2); p32(0xac, g32(0xac) + g32(0xbc)); p32(0xb0, g32(0xb0) + g32(0xc0)); }
  else { p32(0xac, g32(0xb4)); p32(0xb0, g32(0xb8)); }
  const t = m.read(GP + 0x68, 2);
  if (s16(t) !== -1) { // a vibration countdown (0x8002d6cc): at its end the setting comes back and the motors stop
    m.write(GP + 0x68, t - 1, 2);
    if (s16(t - 1) === -1) { m.write(GP + 0x4b0, m.read(0x800792a6, 1), 2); m.write(GP + 0x4c8, 0, 2); m.write(GP + 0x4cc, 0, 2); m.write(GP + 0x68, 0xffff, 2); }
  }
}
