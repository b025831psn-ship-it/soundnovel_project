// 0x8002cf5c, the per-frame wave effect: fills the 240-line offset table at 0x8009d1f8
// (x and v per line, 24.8 fixed point) that sortSprite (sprites.js) uses for sprites with
// a strip table. gp[0x8c]/gp[0xac]: x/v amplitude, gp[0x84]/gp[0xa4]: phase, gp[0x90]/gp[0xb0]:
// period. sin: 0x80044f2c (4096-entry table at 0x80070700, 16-bit angle).
const GP = 0x8007913c, TABLE = 0x8009d1f8, SIN = 0x80070700;

export const sin = (m, a) => m.read(SIN + ((a >>> 6) & 0x3fc), 4) | 0; // 0x80044f2c
export const cos = (m, a) => m.read(SIN + 0x400 + ((a >>> 6) & 0x3fc), 4) | 0; // 0x80044f4c

function step(period) { // 0x10000 / (period >> 8); the original traps on a zero divisor
  const d = period >> 8;
  if (!d) throw new Error("wave: divide by zero (break 7 at 0x8002cf74)");
  return Math.trunc(0x10000 / d) | 0;
}

export function waveTick(ctx) {
  const { m } = ctx, g = (o) => m.read(GP + o, 4) | 0;
  const dx = step(g(0x90)), dv = step(g(0xb0));
  if (!g(0x8c) && !g(0xac)) return;
  let px = 0, pv = 0;
  if (g(0x8c) && g(0x90)) px = Math.imul((dx << 16) >> 16, g(0x84)) >>> 8;
  if (g(0xac) && g(0xb0)) pv = Math.imul((dv << 16) >> 16, g(0xa4)) >>> 8;
  for (let i = 0, p = TABLE; i < 240; i++, p += 8) {
    m.write(p, g(0x8c) ? (Math.imul(sin(m, px & 0xffff), g(0x8c) >> 8) & 0xffff0000) >>> 8 : 0, 4);
    m.write(p + 4, g(0xac) ? (((i << 16) + (Math.imul(sin(m, pv & 0xffff), g(0xac) >> 8) & 0xffff0000)) >>> 8) : (i << 16) >> 8, 4);
    if (g(0x8c) && g(0x90)) px = (px + dx) | 0;
    if (g(0xac) && g(0xb0)) pv = (pv + dv) | 0;
  }
}

// 0x8002d388 waveReset(): the wave parameters (gp 0x84-0xc4) and the 240 line offsets back
// to rest: line i at x 0, y i·256 (the original converts through the soft-float library,
// exact here).
export function waveReset(m) {
  const g32 = (o, v) => m.write(GP + o, v >>> 0, 4), g16 = (o, v) => m.write(GP + o, v & 0xffff, 2);
  for (const o of [0x90, 0x98, 0xb0, 0xb8]) g32(o, 0x6400);
  g32(0x84, 0); g16(0x88, 0); for (const o of [0x8c, 0x94, 0x9c, 0xa0, 0xa4]) g32(o, 0);
  g16(0xa8, 0); for (const o of [0xac, 0xb4, 0xbc, 0xc0]) g32(o, 0);
  g32(0xc4, 0x100);
  for (let i = 0; i < 0xf0; i++) { m.write(TABLE + 8 * i, 0, 4); m.write(TABLE + 8 * i + 4, i * 256, 4); }
}
