// Pictures to VRAM, ported from the game's picture routines. State stays in PS1 RAM.
//   0x8003afc8 loadPicture(page, src)        the same at the page origin
//   0x8003b19c loadPicture(page, src, x, y)  TIMs at src to texture page `page` (+x/2, +y),
//              palette to VRAM row 0x1e0 + page and to the copies at 0x800c4820 (+0x200·page),
//              page table entry 0x801fd270 + 8·page {0, clut row, attr (8-bit: 0x01000000)}
//   0x800448d8 copyWords(src, dst, n)
// The palette's first entry is transparent unless 0x80079294 is 1; the others get the
// semi-transparency bit (0x8000) so that black stays opaque.
import { x8003b398 } from "./sdw-translated.js";
import { memcpy } from "./weather.js";
import { tick } from "../tick.js";

const CLUTS = 0x800c4820, PAGES = 0x801fd270, KEEP_FIRST = 0x80079294;

export function copyWords(m, src, dst, n) { for (let i = 0; i < n; i++) m.write(dst + 4 * i, m.read(src + 4 * i, 4) >>> 0, 4); }

export function loadPicture(ctx, page, src, x = null, y = 0) {
  const { m, gs } = ctx, r16 = (a) => m.read(a, 2), w16 = (a, v) => m.write(a, v & 0xffff, 2), r32 = (a) => m.read(a, 4) >>> 0;
  const at = x !== null, sp = (ctx.sp - (at ? 0x68 : 0x60)) >>> 0, rect = sp + 0x10, tim = sp + 0x18;
  page |= 0; x &= 0xffff;
  if (at) w16(sp + 0x38, y);
  for (;;) {
    const id = r32(src); src = (src + 4) >>> 0;
    if (id !== 0x10) break;
    gs.GsGetTimInfo(src, tim);
    for (let k = 0; k < 8; k += 2) w16(rect + k, r16(tim + 4 + k));
    w16(rect + 2, page < 0x10 ? 0 : 0x100);
    w16(rect, ((page - Math.trunc(page / 16) * 16) << 6) + (x >>> 1));
    if (at) w16(rect + 2, r16(rect + 2) + r16(sp + 0x38));
    gs.LoadImage(rect, r32(tim + 0xc));
    const clut = r32(tim + 0x18);
    w16(clut, m.read(KEEP_FIRST, 1) === 1 ? r16(clut) | 0x8000 : 0);
    for (let i = 1; i < 0x100; i++) w16(clut + 2 * i, r16(clut + 2 * i) | 0x8000);
    gs.LoadClut(clut, 0, (page & 0xff) + 0x1e0, sp - 0x28);
    memcpy(m, clut, CLUTS + ((page & 0xff) << 9), 0x200);
    copyWords(m, r32(tim + 0x18), CLUTS + (page << 9), 0x80);
    const e = PAGES + 8 * page;
    m.write(e, 0, 4); m.write(e + 4, page + 0x1e0, 4); m.write(e + 8, r32(tim) & 1 ? 0x1000000 : 0, 4);
  }
  gs.DrawSync(0);
}

// 0x8003cbb8 uploadPicture(page, src, rows): the 320x240 8-bit picture to VRAM page `page`
// at once (rows = 0), or only `rows` lines of every 8 (the reveal of 0x2e).
export function uploadPicture(ctx, page, src, rows) {
  const { gs, m } = ctx, rect = ctx.sp - 0x38 + 0x10, p = page & 0xff, y0 = p < 0x10 ? 0 : 0x100;
  const w16 = (a, v) => m.write(a, v & 0xffff, 2);
  rows &= 0xffff;
  if (!rows) {
    w16(rect + 4, 0xa0); w16(rect + 6, 0xf0); w16(rect + 2, y0); w16(rect, (p & 0xf) << 6);
    gs.DrawSync(0); gs.LoadImage(rect, src >>> 0); gs.DrawSync(0);
    return;
  }
  for (let y = 0; y < 0xf0; y += 8) {
    w16(rect + 2, y0); w16(rect + 4, 0xa0); w16(rect, (p & 0xf) << 6); w16(rect + 6, rows); w16(rect + 2, y0 + y);
    gs.DrawSync(0); gs.LoadImage(rect, (src + y * 320) >>> 0); gs.DrawSync(0);
  }
}

// 0x80035498 maybeTick(): a frame when 0x80079264 is set (loading with the screen running).
export function* maybeTick(ctx) { if (ctx.m.read(0x80079264, 4)) yield* tick({ ...ctx, sp: ctx.sp - 0x18 }); }

// 0x8003b398 drawSdw(page, src, dst, mode): translated (sdw-translated.js).
export function* drawSdw(ctx, page, src, dst, mode) { yield* x8003b398(ctx, page, src, dst, mode); }
