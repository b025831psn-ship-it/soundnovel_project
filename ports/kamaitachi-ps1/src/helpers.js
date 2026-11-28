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
import { spritePage } from "./screen/sprites.js";

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

// 0x80037c1c textWindowReset(): the text page is 5 (0x800792ca); page table entries 5 and
// 7 (0x801fd270) point at it, its full-screen sprite (0x801f66aa) is made again on top,
// the choice colours are reset and window 0 is current.
export function textWindowReset(ctx) {
  const { m } = ctx, sp = ctx.sp - 0x20, sub = { ...ctx, sp }, PAGES = 0x801fd270, NEW = 0x800794f4;
  m.write(CLUT_SLOT, 5, 1);
  const id = m.read(IDS + 0x12, 2);
  if (id) { spriteFree(m, id); m.write(IDS + 0x12, 0, 2); }
  const p = m.read(CLUT_SLOT, 1), a = PAGES + 8 * p, b = PAGES + 8 * (p + 2);
  m.write(a + 8, 0x1000000, 4); m.write(a + 4, p + 0x1e0, 4); m.write(a, 0, 4);
  m.write(b + 8, m.read(a + 8, 4), 4); m.write(b, m.read(a, 4), 4); m.write(b + 4, m.read(a + 4, 4), 4);
  spritePage(sub, m.read(CLUT_SLOT, 1), 0, 0, 0x140, 0xf0);
  m.write(IDS + 0x12, m.read(0x80079528, 2), 2);
  let s = m.read(NEW, 4) >>> 0;
  m.write(s + 6, 4, 2); m.write(s + 0xf, 4, 1);
  m.write((m.read(NEW, 4) >>> 0) + 0x31, 9, 1);
  s = m.read(NEW, 4) >>> 0;
  m.write(s + 0x33, 2, 1); m.write(s, (m.read(s, 4) | 0x50000000) >>> 0, 4);
  m.write((m.read(NEW, 4) >>> 0) + 0x38, 9, 1);
  choiceColoursReset(sub);
  m.write(0x800795e2, 0, 1); m.write(WINDOW, 0, 1);
}

// 0x80032120 snapshot(slot): the state a bookmark keeps. The work copy at 0x8009eeb8 gets the
// five name strings (0x8003a7b0), the flag and history tables (four of them packed 4 to a
// byte by 0x80044b00) and the window colours; slot `slot` of 0x8008cdc0 (100 bytes each) the
// script position, the display state and the sound channels.
// 0x800320c0 copySlot(a, b): slot a copied to slot b.
const SNAP = 0x8009eeb8, SLOTS = 0x8008cdc0, FLAGS = 0x801f74b0;
function copyName(m, dst, i) { // 0x8003a7b0: name i of 0x8006b030, without its terminator
  for (let p = m.read(0x8006b030 + 4 * i, 4) >>> 0, b; (b = m.read(p, 1)); ) {
    m.write(dst++, b, 1); p++;
    if (b >= 0x80) { m.write(dst++, m.read(p, 1), 1); p++; }
  }
}
function pack4(m, src, dst, n) { // 0x80044b00: four 2-bit values to a byte
  for (let i = 0; i < n >> 2; i++, src += 4) m.write(dst + i, (((m.read(src, 1) << 2 | m.read(src + 1, 1)) << 2 | m.read(src + 2, 1)) << 2 | m.read(src + 3, 1)) & 0xff, 1);
}
export function snapshot(m, slot) {
  const r8 = (a) => m.read(a, 1), r16 = (a) => m.read(a, 2), w8 = (a, v) => m.write(a, v & 0xff, 1), w16 = (a, v) => m.write(a, v & 0xffff, 2);
  for (let i = 0; i < 5; i++) copyName(m, SNAP + 0x10 * i, i + 1);
  memcpy(m, 0x8008dab8, SNAP + 0x50, 0x100); memcpy(m, 0x801fc158, SNAP + 0x350, 0x100);
  pack4(m, 0x801f5bc0, SNAP + 0x47a, 0x12c); pack4(m, 0x801f5d38, SNAP + 0x4c5, 0x12c);
  pack4(m, 0x801fa730, SNAP + 0x510, 0x200); pack4(m, 0x801fc258, SNAP + 0x590, 0x200);
  memcpy(m, 0x801d6110, SNAP + 0x610, 0x12c); memcpy(m, 0x801d6528, SNAP + 0x73c, 0x12c);
  memcpy(m, 0x801f5e98, SNAP + 0x868, 0x800); memcpy(m, 0x801d67d0, SNAP + 0x1068, 0x400); memcpy(m, 0x801fd790, SNAP + 0x1468, 0x800);
  w16(SNAP + 0x1c68, r16(0x800792b4)); w8(SNAP + 0x1c6a, r8(0x800792a1));
  [0x800795e4, 0x800795e5, 0x800795e6, 0x8007960c, 0x8007960d, 0x8007960e].forEach((a, i) => w8(SNAP + 0x1c6b + i, r8(a)));
  w16(SNAP + 0x1c72, r16(0x800792b6)); w16(SNAP + 0x1c76, r16(0x800792bc)); w8(SNAP + 0x1c74, r8(0x800792b8));
  for (let i = 0; i < 10; i++) { let v = 0; for (let j = 0; j < 8; j++) v |= r8(FLAGS + 8 * i + j) << (7 - j); w8(SNAP + 0x450 + i, v); }
  const s = SLOTS + 100 * (slot & 0xff);
  m.write(s + 0x44, ((m.read(0x80079578, 4) >>> 0) - (m.read(BASE, 4) >>> 0)) >>> 0, 4);
  w16(s + 0x20, r16(0x80079458)); w16(s + 0x22, r16(0x80079414)); w8(s + 0x42, r8(0x800792b9));
  for (let i = 0; i < 4; i++) w16(s + 2 + 2 * i, r16(0x801f7320 + 2 * i));
  w16(s + 0xa, r16(0x80079618)); w16(s + 0xc, r16(0x8007961a)); w16(s + 0xe, r16(0x8007961c));
  w8(s + 0x25, r8(0x800792ab)); w16(s + 0x1e, r16(0x80079292)); w16(s + 0x10, r16(0x8007961e)); w8(s + 0x5a, r8(0x800792ad)); w8(s + 0x26, r8(0x800792b1));
  for (let i = 0; i < 3; i++) { const a = 0x801f7300 + 8 * i, b = s + 0x28 + 8 * i; w16(b, r16(a)); w8(b + 2, r8(a + 2)); w16(b + 4, r16(a + 4)); w16(b + 6, r16(a + 6)); }
  w8(s + 0x40, r8(0x800792bf)); w8(s + 0x5b, r8(0x800792c1));
  w8(s, r8(0x8007954e)); // overwritten below, as in the original
  for (let i = 0; i < 6; i++) { w16(s + 0x48 + 2 * i, r16(0x801d55f0 + 2 * i)); w8(s + 0x54 + i, r8(0x800794e8 + i)); }
  w8(s + 0x24, r8(0x8007929a)); w8(s, r8(0x80079299));
}
export function copySlot(m, a, b) { memcpy(m, SLOTS + 100 * (a & 0xff), SLOTS + 100 * (b & 0xff), 0x64); }
