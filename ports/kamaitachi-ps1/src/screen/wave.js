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
