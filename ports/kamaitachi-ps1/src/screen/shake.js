// 0x8003ede0, the screen shake: once per elapsed frame, steps through the shake table at
// gp[0x4ac] ({s16 x, s16 y} entries; 0x8000 = restart, 0x8001 = end) and writes the offsets
// (24.8 fixed point) that sortSprites applies per layer (0x8009da48, 8 bytes per layer).
// The original converts through the soft-float library (int -> double, * 256.0, -> int);
// for these 16-bit inputs that is exactly v * 256. With gp[0x1c4] set it instead flashes
// sprite gp 0x801f669c (0x8003bdc0) on the table's timing.
//   0x80045488 rand(), 0x800354f8 randMod(n)
const GP = 0x8007913c, SHAKE = 0x8009da48, SEED = 0x80079660, FRAME_STEP = 0x80079278, SPRITE_IDS = 0x801f6698;
const g8 = (m, o) => m.read(GP + o, 1), g16 = (m, o) => m.read(GP + o, 2), g32 = (m, o) => m.read(GP + o, 4) >>> 0;
const fix256 = (v) => Math.trunc(((v << 16) >> 16) * 256) | 0;

export function rand(m) { // 0x80045488
  const s = (Math.imul(m.read(SEED, 4) | 0, 0x41c64e6d) + 0x3039) | 0;
  m.write(SEED, s >>> 0, 4);
  return (s >>> 16) & 0x7fff;
}
export function randMod(m, n) { // 0x800354f8
  const r = (rand(m) << 16) >> 16, d = (n << 16) >> 16;
  if (!d) throw new Error("randMod: divide by zero (break 7 at 0x80035528)");
  return ((r % d) << 16) >> 16;
}

export function shakeTick(ctx) {
  const { m } = ctx, w32 = (a, v) => m.write(a, v >>> 0, 4);
  const tables = g32(m, 0x1c0);
  for (let n = (m.read(FRAME_STEP, 2) + 1) & 0xffff; n; n = (n - 1) & 0xffff) {
    if (!g32(m, 0x1c0)) continue;
    const entry = () => g32(m, 0x4ac) + 4 * g16(m, 0x36a);
    if (g8(m, 0x1c4)) { // flash mode
      const e = entry();
      if (m.read(e, 2) === 0x8001) { m.write(GP + 0x1c0, 0, 4); continue; }
      const wait = g16(m, 0x1c6);
      if (wait) { m.write(GP + 0x1c6, wait - 1, 2); continue; }
      m.write(GP + 0x1c6, m.read(e + 2, 2), 2);
      const on = (m.read(e, 2) << 16) >> 16, id = m.read(SPRITE_IDS + 4, 2);
      if (id) ctx.call(0x8003bdc0, [id, on ? 0xc : 0xf]);
      m.write(GP + 0x36a, g16(m, 0x36a) + 1, 2);
      continue;
    }
    if (m.read(entry(), 2) === 0x8000) { // restart, maybe with a random table
      const random = g8(m, 0x2f8);
      m.write(GP + 0x36a, 0, 2);
      if (random) m.write(GP + 0x4ac, m.read(tables + (randMod(m, 0x10) === 5 ? 0 : 4), 4), 4);
    }
    const e = entry();
    let x = m.read(e, 2), y = m.read(e + 2, 2);
    const end = x === 0x8001;
    if (end) { x = 0; y = 0; m.write(GP + 0x1c0, 0, 4); }
    const layers = g8(m, 0x1c8);
    for (let i = 0; i < layers; i++) { const p = SHAKE + 8 * (i + 1); w32(p, end ? 0 : fix256(x)); w32(p + 4, fix256(y)); }
    for (let i = 0; i < 2; i++) { const p = SHAKE + 8 * (i + 5); w32(p, fix256(x)); w32(p + 4, fix256(y)); }
    if (!end) m.write(GP + 0x36a, g16(m, 0x36a) + 1, 2);
  }
}
