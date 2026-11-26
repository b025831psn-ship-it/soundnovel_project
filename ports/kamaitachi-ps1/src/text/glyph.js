// Text glyphs, ported from the game's own routines. State stays in PS1 RAM at the original
// addresses (2 MB, read/write through m.read(a, w)/m.write(a, v, w)), so the port can run
// inside the oracle in place of the original and be compared with it word for word.
//
//   0x800380ec  drawGlyph(x, y, sjis)   expand one font glyph and LoadImage it into VRAM
//   0x80037fac  packGlyph(w, h)         copy the expanded glyph into the upload ring slot
//   0x80044be4  bzero(p, n)
//   0x80044dd0  swap16(v)
//
// Font: BIN member 0 (pointer at 0x80079490). It starts with a table of big-endian u16
// offsets; glyph i sits at font + 4*swap16(offset[i]): width & 0x3f, height & 0x3f, then
// 4-bit pixels where 0xf starts a run (colour, count - 4). SJIS codes map to glyph numbers
// through the hash table at 0x8006b754 (0x1000 entries of {u16 sjis, s16 glyph}).
const GP = 0x8007913c;
const G_RING_SLOT = GP + 0x19f, G_GLYPH_W = GP + 0x19e, G_PALETTE = GP + 0x1a0, G_BACK = GP + 0x1a1, G_X = GP + 0x3a8;
const FONT_PTR = 0x80079490, PAGE = 0x800792ca;
const HASH = 0x8006b754, EXPAND = 0x8008ce30, RING = 0x8008dbe0, RING_SLOT_SIZE = 0xc00;

export function bzero(m, p, n) { for (let i = 0; i < n; i++) m.write(p + i, 0, 1); } // 0x80044be4 (n >= 0)
export const swap16 = (v) => ((v & 0xffff) >>> 8 | (v << 8)) & 0xffff; // 0x80044dd0

function lookup(m, code) { // the hash probe of 0x80038120-0x800381b0 (and its copy for 0x8140)
  const v1 = (code + 0x7ec0) | 0;
  let a0 = (((((v1 - ((v1 & 0xff00) >>> 2)) & 0xffff) * 5) & 0xfff)) >>> 0;
  if (m.read(HASH + a0 * 4, 2) !== code) {
    a0 = 0x8140; // not found: the original indexes the table with 0x8140 itself
    for (let i = (((((v1 - ((v1 & 0xff00) >>> 2)) & 0xffff) * 5) & 0xfff) + 1) & 0xffff; i < 0x1000; i = (i + 1) & 0xffff) {
      if (m.read(HASH + i * 4, 2) === code) { a0 = i; break; }
    }
  }
  const glyph = (m.read(HASH + (a0 & 0xffff) * 4 + 2, 2) << 16) >> 16, font = m.read(FONT_PTR, 4);
  return (font + swap16(m.read((font + glyph * 2) | 0, 2)) * 4) >>> 0;
}

// 0x80037fac: rows of `w` expanded bytes from 0x8008ce30 into ring slot gp[0x19f], each row
// padded to an even byte count (odd x: one leading zero byte). Returns the row length.
export function packGlyph(m, w, h) {
  w &= 0xff; h &= 0xff;
  let src = EXPAND, dst = RING + m.read(G_RING_SLOT, 1) * RING_SLOT_SIZE, len = w;
  const odd = m.read(G_X, 1) & 1;
  for (let row = 0; row < h; row++) {
    if (odd) m.write(dst++, 0, 1);
    for (let i = 0; i < w; i++) m.write(dst++, m.read(src++, 1), 1);
    if ((w & 1) !== odd) m.write(dst++, 0, 1);
  }
  if (odd) len += (w & 1) ? 1 : 2; else if (w & 1) len += 1;
  return len & 0xff;
}

// 0x800380ec: ctx = { m, sp, call(addr, args, sp) } (sp: the caller's; LoadImage is called
// through ctx.call from this routine's frame, sp - 0x28, where the RECT lives at +0x10).
export function drawGlyph(ctx, x, y, sjis) {
  const { m } = ctx;
  m.write(G_X, x & 0xff, 1);
  bzero(m, EXPAND, 0x300);
  const code = sjis & 0xffff;
  let p, w, h;
  if (code !== 0x8140) {
    p = lookup(m, code); w = m.read(p, 1) & 0x3f; h = m.read(p + 1, 1) & 0x3f; p += 2;
  } else { // full-width space: fixed 2 x 14, pixel data from the 0x8140 glyph
    p = lookup(m, 0x8140) + 2; w = 2; h = 14;
  }
  const total = h * w, pal = m.read(G_PALETTE, 1) << 4;
  const nib = (i) => { const b = m.read(p + ((i & 0xffff) >>> 1), 1); return i & 1 ? b & 0xf : b >> 4; };
  let out = 0, n = 0;
  while ((out & 0xffff) < total) {
    const v = nib(n++);
    if (v === 0xf) {
      const colour = nib(n++); let count = nib(n++) + 4;
      while (count--) m.write(EXPAND + (out++ & 0xffff), colour + pal, 1);
    } else m.write(EXPAND + (out++ & 0xffff), v + pal, 1);
  }
  m.write(G_GLYPH_W, w, 1);
  const len = packGlyph(m, w, h);
  const fs = (ctx.sp - 0x28) >>> 0, page = m.read(PAGE, 1), rect = fs + 0x10;
  const rw = len >>> 1, rh = h & 0xff;
  m.write(rect, ((page & 0xf) << 6) + Math.trunc(x / 2), 2);
  m.write(rect + 2, (page < 0x10 ? 0 : 0x100) + y, 2);
  m.write(rect + 4, rw, 2); m.write(rect + 6, rh, 2);
  const slot = m.read(G_RING_SLOT, 1), src = RING + slot * RING_SLOT_SIZE;
  const back = m.read(G_BACK, 1);
  if (back) for (let i = 0; i < 2 * rw * rh; i++) if (!(m.read(src + i, 1) & 0xf)) m.write(src + i, back, 1);
  ctx.call(0x80049560, [rect, src], fs); // LoadImage
  m.write(G_RING_SLOT, (m.read(G_RING_SLOT, 1) + 1) & 7, 1);
}
