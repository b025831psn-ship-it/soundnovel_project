// Small routines shared by the scenario commands, the text task and the screen code.
//   0x8003a67c textSpeedReset()  0x8003a6e4 textSpeed(v): both wait counters of the
//                                current text window (0x800794b0/0x800794b8) = v (8)
//   0x8003bc3c spriteFree(id)    0x8001c8e0 setVar(i, v)      0x80040e90 gp[0x1e0] = v
//   0x8003704c* waitText()       text frames while gp[0x10c] (a text window is busy)
//   0x800371fc resetStream()     0x80033868 anyRoute(): 0x8008cdc0[0] != 0xff
//   0x80019684 markSeen(id, k)   0x801d6110[id] |= 3 << 2k
//   0x8002cbc0* waitFade(k)      frames until fade channel k reaches its target
//   0x8002f3c0 dropOverlay()     sprite 0x801f66a8 freed
// (* generators: they wait frames)
import { tick, tickText } from "./tick.js";
import { memcpy } from "./screen/weather.js";

const BASE = 0x8007948c, RESOURCE = 0x8007929c;
const GP = 0x8007913c, WINDOW = 0x800792a7, SPRITES = 0x801eef68, IDS = 0x801f6698;

export function textSpeed(m, v) { const i = m.read(WINDOW, 1); m.write(0x800794b0 + 2 * i, v, 2); m.write(0x800794b8 + 2 * i, v, 2); }
export const textSpeedReset = (m) => textSpeed(m, 8);
export function spriteFree(m, id) { m.write(SPRITES + ((id << 16) >> 16) * 72, 0x80000000, 4); }
export function setVar(m, i, v) { m.write(0x80079558 + (i & 0xff), v, 1); }
export function setGp1e0(m, v) { m.write(GP + 0x1e0, v, 2); }
export function* waitText(ctx) { while (ctx.m.read(GP + 0x10c, 1)) yield* tickText({ ...ctx, sp: ctx.sp - 0x18 }, 1); }
export function resetStream(m) { // the loop in the original ends after entry 0
  m.write(GP + 0x118, 0xffffffff, 4); m.write(GP + 0x11c, 0xffff, 2); m.write(GP + 0x120, 0, 4);
  m.write(0x801d58f8, 0, 1); m.write(0x801d58f8 + 0xc, 0xffff, 2); m.write(0x801d58f8 + 8, 0xffffffff, 4);
}
export const anyRoute = (m) => (m.read(0x8008cdc0, 1) !== 0xff ? 1 : 0); // the loop in the original checks entry 0 only
export function markSeen(m, id, k) {
  const bits = [3, 0xc, 0x30, 0xc0][k & 0xff];
  if (bits === undefined) return;
  const p = 0x801d6110 + (id & 0xffff);
  m.write(p, m.read(p, 1) | bits, 1);
}
export function* waitFade(ctx, k) {
  const { m } = ctx, a = 0x801f7500 + 4 * (k & 0xff), b = 0x801fdf98 + 4 * (k & 0xff), sub = { ...ctx, sp: ctx.sp - 0x20 };
  while (m.read(a, 4) !== m.read(b, 4)) yield* tick(sub);
  yield* tick(sub);
}
export function dropOverlay(m) { const id = m.read(IDS + 0x10, 2); if (id) { spriteFree(m, id); m.write(IDS + 0x10, 0, 2); } }

// The choice highlight in the text window's palette (slot 0x800792ca of 0x800c4820, also
// in VRAM rows 0x1e0 + slot and 0x1e2 + slot):
//   0x80037b08 choiceColoursReset()  rows 0-7 plain (0x8006b64c), 8-15 from the 8 shades
//   0x80037a7c choiceColour(k)       row k highlighted (0x8006b68c)
const CLUTS = 0x800c4820, CLUT_SLOT = 0x800792ca;
function loadWindowClut(ctx, frame) {
  const p = ctx.m.read(CLUT_SLOT, 1), src = CLUTS + (p << 9), sp = ctx.sp - frame - 0x28;
  ctx.gs.LoadClut(src, 0, p + 0x1e0, sp);
  ctx.gs.LoadClut(src, 0, ctx.m.read(CLUT_SLOT, 1) + 0x1e2, sp);
}
export function choiceColour(ctx, k) {
  const { m } = ctx;
  memcpy(m, 0x8006b68c, CLUTS + (m.read(CLUT_SLOT, 1) << 9) + ((k & 0xff) << 5), 0x20);
  loadWindowClut(ctx, 0x18);
}
export function choiceColoursReset(ctx) {
  const { m } = ctx;
  for (let i = 0; i < 8; i++) memcpy(m, 0x8006b64c, CLUTS + (m.read(CLUT_SLOT, 1) << 9) + (i << 5), 0x20);
  for (let i = 0; i < 8; i++) memcpy(m, 0x8006b64c + (i << 5), CLUTS + (m.read(CLUT_SLOT, 1) << 9) + ((i + 8) << 5), 0x20);
  loadWindowClut(ctx, 0x20);
}

// Filled boxes in the text page (VRAM page 0x800792ca, 8-bit pixels, two per VRAM word):
//   0x80037604 fillRect(x, y, w, h, c)  w·h <= 0x800 pixels, clipped to 320x240, through a
//                                       buffer on the stack and LoadImage
//   0x80037784 fillBox(x, y, w, h, c)   in strips of 4 lines
export function fillRect(ctx, x, y, w, h, c) {
  const { m, gs } = ctx, sp = ctx.sp - 0x820, buf = sp + 0x18, rect = sp + 0x10, s16 = (v) => (v << 16) >> 16;
  let cols = w, rows = h;
  const W = s16(w), H = s16(h), X = s16(x), Y = s16(y);
  if (Math.imul(W, H) > 0x800 || !W || !H || X >= 0x140 || Y >= 0xf0) return;
  if (X + W >= 0x140) cols = 0x140 - x;
  if (Y + H >= 0xf0) rows = 0xf0 - y;
  let k = 0;
  for (let r = 0; r < s16(rows); r++) for (let i = 0; i < s16(cols); i++) m.write(buf + (k++ & 0xffff), c & 0xff, 1);
  const p = m.read(CLUT_SLOT, 1);
  m.write(rect + 4, s16(cols) >> 1, 2); m.write(rect + 6, rows & 0xffff, 2);
  m.write(rect, (((p & 0xf) << 6) + (X >> 1)) & 0xffff, 2); m.write(rect + 2, ((p < 0x10 ? 0 : 0x100) + y) & 0xffff, 2);
  gs.LoadImage(rect, buf);
}
export function fillBox(ctx, x, y, w, h, c) {
  const { gs } = ctx, sub = { ...ctx, sp: ctx.sp - 0x40 }, s16 = (v) => (v << 16) >> 16, H = s16(h);
  const strips = Math.trunc(H / 4) & 0xff;
  let i = 0;
  for (; i < strips; i++) { gs.DrawSync(0); fillRect(sub, s16(x), s16(y + 4 * i), s16(w), 4, c & 0xff); }
  gs.DrawSync(0); fillRect(sub, s16(x), s16(y + 4 * i), s16(w), s16(H - Math.trunc(H / 4) * 4), c & 0xff);
}

// 0x8003a5c4 textClear(): clear the text page and restart the current window's text at
// its left/top margins (0x800794b0/b4 -> 0x800794b8/bc).
export function textClear(ctx) {
  const { m, gs } = ctx, rect = ctx.sp - 0x20 + 0x10, p = m.read(CLUT_SLOT, 1);
  m.write(rect + 2, p < 0x10 ? 0 : 0x100, 2); m.write(rect + 4, 0xa0, 2); m.write(rect + 6, 0xf0, 2); m.write(rect, (m.read(CLUT_SLOT, 1) & 0xf) << 6, 2);
  gs.ClearImage(rect, 0, 0, 0);
  const i = m.read(WINDOW, 1);
  m.write(0x800794b8 + 2 * i, m.read(0x800794b0 + 2 * i, 2), 2);
  m.write(0x800794bc + 2 * i, m.read(0x800794b4 + 2 * i, 2), 2);
}

// 0x800325b0 savePoint(): the history of passed points (count 0x800792b4, at most 0x400):
// offset of 0x8007940c in the resource (0x801f5e98), resource (0x801d67d0), the bits of
// 0x80079414 (0x801fd790). A point passed before cuts the history back to it.
export function savePoint(m) {
  const COUNT = 0x800792b4, here = () => ((m.read(0x8007940c, 2) - m.read(BASE, 2)) & 0xffff);
  for (let i = 0; i < m.read(COUNT, 2); i++)
    if (m.read(0x801f5e98 + 2 * i, 2) === here() && m.read(0x801d67d0 + i, 1) === m.read(RESOURCE, 2)) m.write(COUNT, i, 2);
  const n = m.read(COUNT, 2);
  m.write(0x80079458, m.read(RESOURCE, 2), 2);
  m.write(0x801f5e98 + 2 * n, here(), 2);
  m.write(0x801d67d0 + n, m.read(RESOURCE, 1), 1);
  m.write(0x801fd790 + 2 * n, m.read(0x80079414, 2), 2);
  m.write(COUNT, n + 1, 2);
  if (((n + 1) & 0xffff) >= 0x400) throw new Error("savePoint: path at 0x800326e0 (history full) is not ported");
}

// 0x8001db2c dropLayer(k): free sprite slot k (< 11) of 0x801f6698 and forget its picture
// (0x801fec66 + 2k = -1); ends the frame when k is in range.
export function dropLayer(m, k) {
  k &= 0xff;
  if (k >= 0xb) return;
  const id = m.read(IDS + 2 * k, 2);
  if (id) { spriteFree(m, id); m.write(IDS + 2 * k, 0, 2); m.write(0x801fec66 + 2 * k, 0xffff, 2); }
  m.write(GP + 0x15c, 1, 1);
}

// 0x8001fd1c dropPicture(k): like dropLayer, and the silhouette ring (0x80079450) and the
// 8-bit picture buffer (0x80079440) are cleared.
export function dropPicture(m, k) {
  k &= 0xff;
  const id = m.read(IDS + 2 * k, 2);
  if (id) {
    spriteFree(m, id); m.write(IDS + 2 * k, 0, 2); m.write(0x80079284, 0, 1);
    for (let i = 0; i < 4; i++) m.write(0x80079450 + 2 * i, 0xffff, 2);
    const pic = m.read(0x80079440, 4) >>> 0;
    for (let i = 0; i < 0x12c00; i++) m.write(pic + i, 0, 1);
  }
  m.write(GP + 0x15c, 1, 1);
}
