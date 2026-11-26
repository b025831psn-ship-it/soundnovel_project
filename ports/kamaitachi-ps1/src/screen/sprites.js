// The game's sprite and box layers, ported from the routines the frame flip (0x800353b8)
// calls every frame. State stays in PS1 RAM at the original addresses; `ctx` = { m, sp, gs }
// where gs is the ported libgs/libgpu (src/gpu/libgpu.js) and sp the caller's stack pointer
// (the routines keep their working GsSPRITE in their own stack frame, as the original does).
//
//   0x8003c158  sortSprites()          160 sprites (0x801eef68, 0x48 bytes each) into the OT
//   0x8003bf64  sortSprite(sp, ot, z)  one GsSPRITE, cut into 1-line strips when the sprite has
//                                      a strip table (wavy pictures)
//   0x8003c86c  addBox(...)            queue a filled box (0x801d5910, up to gp[0x1ba])
//   0x8003c988  sortBoxes()            queued boxes into the OT
//   0x8003ce2c  sortOverlays()         8 overlay sprites (0x801d5628), re-added through 0x8001c838
const GP = 0x8007913c;
const SPRITES = 0x801eef68, SPRITE_SIZE = 0x48, SPRITE_COUNT = 160, INDEX = 0x800794c8, CURRENT = 0x80079470;
const OT = 0x80079468, BRIGHT = 0x801f7500, SHAKE = 0x8009da48;
const BOXES = 0x801d5910, BOX_Z = 0x801d66c8, BOX_COUNT = GP + 0x1ba, BOX2_COUNT = GP + 0x1bc, OVERLAYS = 0x801d5628;
const unported = (addr) => { throw new Error(`sprites: path at 0x${addr.toString(16)} is not ported`); };
const s16 = (v) => (v << 16) >> 16;
const div256 = (v) => (v < 0 ? v + 0xff : v) >> 8; // signed divide by 256 as compiled (sra after bias)

function io(m) {
  return {
    r8: (a) => m.read(a, 1), r16: (a) => m.read(a, 2), r32: (a) => m.read(a, 4) >>> 0, s32: (a) => m.read(a, 4) | 0,
    w8: (a, v) => m.write(a, v & 0xff, 1), w16: (a, v) => m.write(a, v & 0xffff, 2), w32: (a, v) => m.write(a, v >>> 0, 4),
  };
}

// 0x8003bf64: frame sp - 0x50, working sprite at +0x10.
export function sortSprite(ctx, src, ot, z) {
  const { m, gs } = ctx, { r8, r16, r32, w8, w16, w32 } = io(m);
  const cur = r32(CURRENT), strips = r32(cur + 0x34), x = r16(src + 4);
  if (!strips) {
    if (s16(r16(cur + 0x1e)) === 0x1000 && s16(r16(cur + 0x20)) === 0x1000) gs.GsSortFastSprite(src, ot, z & 0xffff);
    else unported(0x8003c12c); // GsSortSprite (scaled)
    return;
  }
  const L = ((ctx.sp - 0x50) >>> 0) + 0x10;
  w32(L, r32(src));
  for (const o of [4, 6, 8, 0xa, 0xc]) w16(L + o, r16(src + o));
  w8(L + 0xe, r8(src + 0xe)); w8(L + 0xf, r8(src + 0xf));
  for (const o of [0x10, 0x12, 0x18, 0x1a, 0x1c, 0x1e]) w16(L + o, r16(src + o));
  w32(L + 0x20, r32(src + 0x20));
  w8(L + 0x14, r8(src + 0x14)); w8(L + 0x15, r8(src + 0x15)); w8(L + 0x16, r8(src + 0x16));
  w16(L + 0xa, 1);
  if (!r16(cur + 0xa)) return;
  let p = strips, i = 0;
  do {
    const dx = (m.read(p, 4) | 0) >> 8; p += 4; i++;
    w16(L + 4, x + dx);
    const v = (m.read(p, 4) | 0) >> 8; p += 4;
    w8(L + 0xf, v);
    gs.GsSortFastSprite(L, ot, z & 0xffff);
    w16(L + 6, r16(L + 6) + 1);
  } while ((i & 0xffff) < r16(r32(CURRENT) + 0xa));
}

// 0x8003c158: frame sp - 0x58, working sprite at +0x10.
export function sortSprites(ctx) {
  const { m } = ctx, { r8, r16, r32, s32, w8, w16, w32 } = io(m);
  const L = ((ctx.sp - 0x58) >>> 0) + 0x10, inner = { ...ctx, sp: (ctx.sp - 0x58) >>> 0 };
  for (let i = 0; i < SPRITE_COUNT; i++) {
    w16(INDEX, i);
    const e = SPRITES + i * SPRITE_SIZE; w32(CURRENT, e);
    const attr = r32(e);
    if (attr === 0x80000000 || !r8(e + 0x30) || r8(e + 0x3a) === 1 || r8(e + 0x33) === 0xf) continue;
    w32(L, attr);
    w16(L + 4, r16(e + 4)); w16(L + 6, r16(e + 6) + 8);
    const w = r16(e + 8); w16(L + 8, w);
    w16(L + 0xa, r16(e + 0xa)); w16(L + 0xc, r16(e + 0xc));
    w8(L + 0xe, r8(e + 0xe)); w8(L + 0xf, r8(e + 0xf));
    w16(L + 0x10, r16(e + 0x10)); w16(L + 0x12, r16(e + 0x12));
    if (w >= 0x101) w16(L + 8, 0x100);
    w16(L + 0x18, r16(e + 0x18)); w16(L + 0x1a, r16(e + 0x1a)); w16(L + 0x1c, r16(e + 0x1e)); w16(L + 0x1e, r16(e + 0x20));
    w32(L + 0x20, r32(e + 0x2c));
    const level = r8(e + 0x30), table = BRIGHT + 4 * r8(e + 0x31);
    const master = div256(s32(BRIGHT));
    if (div256(s32(table)) !== 0x80) {
      for (let k = 0; k < 3; k++) {
        const t = Math.imul(div256(s32(BRIGHT + 4 * r8(e + 0x31))), Math.imul(level, r8(e + 0x14 + k)));
        w8(L + 0x14 + k, Math.imul(master, t >> 7) >> 14);
      }
    } else {
      for (let k = 0; k < 3; k++) w8(L + 0x14 + k, Math.imul(master, Math.imul(level, r8(e + 0x14 + k))) >> 14);
    }
    const cur = r32(CURRENT);
    if (r8(cur + 0x3a) === 2) for (let k = 0; k < 3; k++) w8(L + 0x14 + k, r8(L + 0x14 + k) >>> 1);
    const shake = SHAKE + 8 * r8(cur + 0x38);
    w16(L + 4, r16(L + 4) - div256(s32(shake)));
    w16(L + 6, r16(L + 6) + div256(s32(shake + 4)));
    const n = r8(cur + 0x23);
    for (let k = 0; k < n; ) {
      sortSprite(inner, L, r32(OT), r8(r32(CURRENT) + 0x33));
      const c2 = r32(CURRENT), x = r16(L + 4), u = r16(L + 0xc);
      if (r16(c2 + 8) >= 0x101) { // wider than a texture page: the right part from the next page
        w16(L + 4, x + (s16(r16(c2 + 0x1e)) >> 4));
        w16(L + 8, r8(c2 + 8));
        w16(L + 0xc, r32(L) & 0x01000000 ? u + 2 : u + 1);
        sortSprite(inner, L, r32(OT), r8(r32(CURRENT) + 0x33));
        w16(L + 8, 0x100);
      }
      k++;
      w16(L + 4, x); w16(L + 0xc, u);
      w16(L + 6, r16(L + 6) + r16(L + 0xa));
      if (!((k & 0xff) < r8(r32(CURRENT) + 0x23))) break;
    }
  }
  w16(INDEX, 0);
  for (let i = 0; i < SPRITE_COUNT; i++) { // one-frame sprites end
    w16(INDEX, i);
    const e = SPRITES + i * SPRITE_SIZE;
    if (r8(e + 0x39) === 1) w32(e, 0x80000000);
  }
  w16(INDEX, 0);
  for (let i = 0; i < SPRITE_COUNT; i++) { // scale animation step
    const e = SPRITES + i * SPRITE_SIZE;
    if (!s16(r16(e + 0x1c))) { w16(e + 0x1e, r16(e + 0x24)); w16(e + 0x20, r16(e + 0x26)); }
    else { w16(e + 0x1e, r16(e + 0x1e) + r16(e + 0x28)); w16(e + 0x20, r16(e + 0x20) + r16(e + 0x2a)); w16(e + 0x1c, r16(e + 0x1c) - 1); }
    w16(INDEX, i + 1);
  }
}

// 0x8003c86c: queue a filled box (x, y + 8, w, h, r, g, b, attr, z).
export function addBox(ctx, x, y, w, h, r, g, b, attr, z) {
  const { m } = ctx, { r16, w8, w16, w32 } = io(m);
  const e = BOXES + 16 * r16(BOX_COUNT);
  w32(e, attr); w8(e + 0xc, r);
  w16(e + 4, x); w16(e + 6, y + 8); w16(e + 8, w); w16(e + 0xa, h);
  w8(BOXES + 16 * r16(BOX_COUNT) + 0xd, g);
  w8(BOXES + 16 * r16(BOX_COUNT) + 0xe, b);
  const n = r16(BOX_COUNT); w16(BOX_Z + 2 * n, z); w16(BOX_COUNT, n + 1);
}

// 0x8003c988
export function sortBoxes(ctx) {
  const { m, gs } = ctx, { r16, r32, w16 } = io(m);
  gs.DrawSync(0);
  for (let i = 0; i < r16(BOX_COUNT); i++) gs.GsSortBoxFill(BOXES + 16 * i, r32(OT), r16(BOX_Z + 2 * i));
  if (r16(BOX2_COUNT)) unported(0x8003ca10);
  w16(BOX_COUNT, 0);
}

// 0x8003ce2c
export function sortOverlays(ctx) {
  const { m } = ctx;
  for (let i = 0; i < 8; i++) if ((m.read(OVERLAYS + i * SPRITE_SIZE, 4) >>> 0) !== 0x80000000) unported(0x8003ce6c);
}

// --- sprite table management ---
const NEW = 0x800794f4, ALLOC = 0x80079528, PAGES = 0x801fd270, FREE = 0x80000000;

// 0x8003b6fc: reset the sprite at NEW to its defaults (unused, 256x256, colour 0x80, scale 1.0, layer 8).
export function spriteInit(m) {
  const { r32, w8, w16, w32 } = io(m), s = r32(NEW);
  w32(s, FREE); w16(s + 6, 0); w16(s + 4, 0); w16(s + 0xa, 0x100); w16(s + 8, 0x100); w16(s + 0xc, 0);
  w8(s + 0xf, 0); w8(s + 0xe, 0); w8(s + 0x16, 0x80); w8(s + 0x15, 0x80); w8(s + 0x14, 0x80);
  w16(s + 0x12, 0); w16(s + 0x10, 0); w8(s + 0x23, 1); w8(s + 0x22, 1); w16(s + 0x1a, 0); w16(s + 0x18, 0);
  for (const o of [0x26, 0x24, 0x20, 0x1e]) w16(s + o, 0x1000);
  w8(s + 0x30, 0x80); w32(s + 0x2c, 0); w8(s + 0x31, 0); w8(s + 0x32, 0); w8(s + 0x33, 8); w32(s + 0x34, 0);
  w8(s + 0x38, 0); w8(s + 0x39, 0); w8(s + 0x3a, 0);
}

// 0x8003b7ec: every sprite back to its defaults, then 0x8002d388 (not ported yet: ctx.call).
export function spriteClearAll(ctx) {
  const { m } = ctx;
  for (let i = 0; i < SPRITE_COUNT; i++) { m.write(ALLOC, i, 2); m.write(NEW, SPRITES + i * SPRITE_SIZE, 4); spriteInit(m); }
  m.write(ALLOC, SPRITE_COUNT, 2);
  ctx.call(0x8002d388, []);
}

// 0x8003ba54: take the first free sprite from 1 and set it up from texture page `page`
// (page table 0x801fd270: 8 bytes per page) at (x, y) with (u, v, w, h). NEW = the sprite.
export function spriteNew(ctx, page, x, y, u, v, w, h) {
  const { m, gs } = ctx, { r16, r32, w8, w16, w32 } = io(m);
  let i = 1;
  for (;;) { w16(ALLOC, i); i = s16(r16(ALLOC)); if (i >= SPRITE_COUNT || r32(SPRITES + i * SPRITE_SIZE) === FREE) break; i++; }
  w32(NEW, SPRITES + i * SPRITE_SIZE);
  spriteInit(m);
  const pg = s16(page), e = PAGES + pg * 8, s = r32(NEW);
  w32(s, r32(e + 8)); w16(s + 8, w); w16(s + 0xa, h);
  const ty = pg < 0x10 ? 0 : 0x100, tx = s16(pg - Math.trunc(pg / 16) * 16) << 6;
  w8(s + 0xe, u); w8(s + 0xf, v);
  w16(s + 4, r16(s + 4) + x); w16(s + 6, r16(s + 6) + y);
  w16(s + 0xc, gs.GetTPage(r32(s), 0, s16(tx), s16(ty)));
  w16(s + 0x10, r16(e)); w16(s + 0x12, r16(e + 4));
  w32(SPRITES, FREE);
}

// 0x8001c838: spriteNew (y - 4), then attr |= bits, layer, one-frame sprite (0x39 = 1).
export function spriteAdd(ctx, page, x, y, u, v, w, h, bits, layer) {
  const { m } = ctx, { r32, w8, w16, w32 } = io(m);
  spriteNew(ctx, page & 0xff, s16(x), s16(y) - 4, u & 0xffff, v & 0xffff, w & 0xffff, h & 0xffff);
  const s = r32(NEW);
  w8(s + 0x31, 1); w32(s, r32(s) | bits); w8(s + 0x33, layer); w16(s + 0x1e, 0x1000); w8(s + 0x39, 1);
}

// 0x8003bdc0 / 0x8003be10
export function spriteLayer(m, id, layer) {
  if (((id + 1) & 0xffff) < 2) return;
  const e = SPRITES + s16(id) * SPRITE_SIZE;
  if ((m.read(e, 4) >>> 0) !== FREE) m.write(e + 0x33, layer & 0xff, 1);
}
export function spriteOr(m, id, bits) {
  id &= 0xffff; if (!id) return;
  const e = SPRITES + id * SPRITE_SIZE, a = m.read(e, 4) >>> 0;
  if (a !== FREE) m.write(e, (a | bits) >>> 0, 4);
}
