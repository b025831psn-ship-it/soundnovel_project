// libgs GsSortSprite 0x8004c768 (sprites with scale or rotation) and the CPU-side libgte matrix
// helpers it calls, translated instruction by instruction by tools/translate/gen-gs.py. The GTE
// routines it reaches (SetRotMatrix, SetTransMatrix, ReadGeomScreen, RotTransPers4) are ported
// by hand in gte.js and served through call() in ../menu/calls.js. None of them waits for a frame.
import { call, mult, div } from "../menu/calls.js";

// 0x8004c768, translated instruction by instruction (318 instructions).
export function* x8004c768(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8004c768;
  for (;;) switch (pc) {
  case 0x8004c768:
    sp = (sp + -176) | 0;
    m.write(((sp) + 152) >>> 0, s0 >>> 0, 4);
    s0 = a0 | 0;
    m.write(((sp) + 164) >>> 0, s3 >>> 0, 4);
    s3 = a1 | 0;
    m.write(((sp) + 172) >>> 0, 0, 4);
    m.write(((sp) + 168) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 160) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 156) >>> 0, s1 >>> 0, 4);
    s1 = m.read(((s0) + 0) >>> 0, 4) | 0;
    { const c = (s1 | 0) < 0; s4 = a2 | 0; if (c) { pc = 0x8004cc40; continue; } }
  case 0x8004c79c:
    v0 = m.read(((s0) + 8) >>> 0, 2);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8004cc40; continue; } }
  case 0x8004c7ac:
    v0 = m.read(((s0) + 10) >>> 0, 2);
    { const c = (v0 | 0) === 0; a1 = 0 | 0; if (c) { pc = 0x8004cc40; continue; } }
  case 0x8004c7bc:
    v0 = 0x10000000 | 0;
    v0 = v0 | 4096;
    v1 = (s1 >>> 27) | 0;
    a0 = m.read(((s0) + 28) >>> 0, 4) | 0;
    s2 = 0x800a0000 | 0;
    s2 = m.read(((s2) + 28072) >>> 0, 4) | 0;
    { const c = (a0 | 0) !== (v0 | 0); v1 = v1 & 1; if (c) { pc = 0x8004c7f8; continue; } }
  case 0x8004c7dc:
    v0 = m.read(((s0) + 32) >>> 0, 4) | 0;
    { const c = (v0 | 0) !== 0; v0 = v1 | a1; if (c) { pc = 0x8004c7fc; continue; } }
  case 0x8004c7ec:
    v0 = 0xc00000 | 0;
    v0 = s1 & v0;
    a1 = (v0 >>> 0) < 1 ? 1 : 0;
  case 0x8004c7f8:
    v0 = v1 | a1;
  case 0x8004c7fc:
    { const c = (v0 | 0) === 0; a3 = 0xe1000000 | 0; if (c) { pc = 0x8004c90c; continue; } }
  case 0x8004c804:
    a3 = a3 | 512;
    a0 = s2 | 0;
    a1 = s3 | 0;
    a2 = s4 & 65535;
    v0 = (s1 >>> 17) | 0;
    v0 = v0 & 384;
    v0 = v0 | a3;
    a3 = 0x1000000 | 0;
    v1 = m.read(((s0) + 12) >>> 0, 2);
    t0 = (m.read(((s0) + 4) >>> 0, 2) << 16) >> 16;
    t1 = (m.read(((s0) + 6) >>> 0, 2) << 16) >> 16;
    v1 = v1 & 31;
    v1 = v1 | v0;
    v0 = (s1 >>> 23) | 0;
    v0 = v0 & 96;
    v1 = v1 | v0;
    m.write(((a0) + 4) >>> 0, v1 >>> 0, 4);
    v1 = (s1 >>> 5) | 0;
    v0 = 0x2000000 | 0;
    v1 = v1 & v0;
    v0 = s1 << 18;
    v0 = v0 & a3;
    a3 = 0x64000000 | 0;
    v0 = v0 | a3;
    v1 = v1 | v0;
    a3 = m.read(((s0) + 22) >>> 0, 1);
    v0 = m.read(((s0) + 21) >>> 0, 1);
    a3 = a3 << 16;
    v1 = v1 | a3;
    v0 = v0 << 8;
    v1 = v1 | v0;
    v0 = m.read(((s0) + 20) >>> 0, 1);
    a3 = 0x801d0000 | 0;
    a3 = (m.read(((a3) + 26202) >>> 0, 2) << 16) >> 16;
    v1 = v1 | v0;
    t0 = (t0 + a3) | 0;
    v0 = 0x801d0000 | 0;
    v0 = (m.read(((v0) + 26204) >>> 0, 2) << 16) >> 16;
    a3 = (0 + 5) | 0;
    m.write(((a0) + 8) >>> 0, v1 >>> 0, 4);
    v1 = (m.read(((s0) + 24) >>> 0, 2) << 16) >> 16;
    t1 = (t1 + v0) | 0;
    t0 = (t0 - v1) | 0;
    v0 = (m.read(((s0) + 26) >>> 0, 2) << 16) >> 16;
    t0 = t0 & 65535;
    t1 = (t1 - v0) | 0;
    t1 = t1 << 16;
    t0 = t0 | t1;
    m.write(((a0) + 12) >>> 0, t0 >>> 0, 4);
    v1 = m.read(((s0) + 15) >>> 0, 1);
    v0 = m.read(((s0) + 14) >>> 0, 1);
    t0 = (m.read(((s0) + 18) >>> 0, 2) << 16) >> 16;
    v1 = v1 << 8;
    v0 = v0 | v1;
    t0 = t0 << 22;
    v0 = v0 | t0;
    v1 = (m.read(((s0) + 16) >>> 0, 2) << 16) >> 16;
    t0 = 0x3f0000 | 0;
    v1 = v1 << 12;
    v1 = v1 & t0;
    v0 = v0 | v1;
    m.write(((a0) + 16) >>> 0, v0 >>> 0, 4);
    v0 = m.read(((s0) + 10) >>> 0, 2);
    v1 = m.read(((s0) + 8) >>> 0, 2);
    v0 = v0 << 16; pc = 0x8004cc28; continue;
  case 0x8004c90c:
    v0 = m.read(((s0) + 32) >>> 0, 4) | 0;
    { const c = (v0 | 0) !== 0; v0 = 0xb60b0000 | 0; if (c) { pc = 0x8004c96c; continue; } }
  case 0x8004c91c:
    a1 = 0x801f0000 | 0;
    a1 = (a1 + -4328) | 0;
    v0 = m.read(((a1) + 0) >>> 0, 4) | 0;
    v1 = m.read(((a1) + 4) >>> 0, 4) | 0;
    a0 = m.read(((a1) + 8) >>> 0, 4) | 0;
    m.write(((sp) + 40) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, a0 >>> 0, 4);
    v0 = m.read(((a1) + 12) >>> 0, 4) | 0;
    v1 = m.read(((a1) + 16) >>> 0, 4) | 0;
    a0 = m.read(((a1) + 20) >>> 0, 4) | 0;
    m.write(((sp) + 52) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 56) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 60) >>> 0, a0 >>> 0, 4);
    v0 = m.read(((a1) + 24) >>> 0, 4) | 0;
    v1 = m.read(((a1) + 28) >>> 0, 4) | 0;
    m.write(((sp) + 64) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 68) >>> 0, v1 >>> 0, 4);
    v1 = 0x10000000 | 0; pc = 0x8004c9a8; continue;
  case 0x8004c96c:
    m.write(((sp) + 72) >>> 0, 0 & 0xffff, 2);
    m.write(((sp) + 74) >>> 0, 0 & 0xffff, 2);
    v1 = m.read(((s0) + 32) >>> 0, 4) | 0;
    v0 = v0 | 24759;
    [hi, lo] = mult(v1, v0, true);
    a0 = (sp + 72) | 0;
    a1 = (sp + 40) | 0;
    t5 = hi;
    v0 = (t5 + v1) | 0;
    v0 = v0 >> 8;
    v1 = v1 >> 31;
    v0 = (v0 - v1) | 0;
    m.write(((sp) + 76) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x8004e308, a0, a1, a2, a3);
  case 0x8004c9a4:
    v1 = 0x10000000 | 0;
  case 0x8004c9a8:
    v0 = m.read(((s0) + 28) >>> 0, 4) | 0;
    v1 = v1 | 4096;
    { const c = (v0 | 0) === (v1 | 0); a1 = (sp + 80) | 0; if (c) { pc = 0x8004c9d4; continue; } }
  case 0x8004c9b8:
    v0 = (m.read(((s0) + 28) >>> 0, 2) << 16) >> 16;
    a0 = (sp + 40) | 0;
    m.write(((sp) + 80) >>> 0, v0 >>> 0, 4);
    v0 = (m.read(((s0) + 30) >>> 0, 2) << 16) >> 16;
    m.write(((sp) + 88) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 84) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8004e078, a0, a1, a2, a3);
  case 0x8004c9d4:
    v0 = (m.read(((s0) + 4) >>> 0, 2) << 16) >> 16;
    m.write(((sp) + 80) >>> 0, v0 >>> 0, 4);
    v0 = (m.read(((s0) + 6) >>> 0, 2) << 16) >> 16;
    m.write(((sp) + 84) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8004e238, a0, a1, a2, a3);
  case 0x8004c9ec:
    a0 = (sp + 40) | 0;
    a1 = (sp + 80) | 0;
    m.write(((sp) + 88) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8004e048, a0, a1, a2, a3);
  case 0x8004c9fc:
    a0 = (sp + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x8004e1b8, a0, a1, a2, a3);
  case 0x8004ca04:
    a0 = (sp + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x8004e218, a0, a1, a2, a3);
  case 0x8004ca0c:
    v1 = (m.read(((s0) + 24) >>> 0, 2) << 16) >> 16;
    t0 = (m.read(((s0) + 26) >>> 0, 2) << 16) >> 16;
    m.write(((sp) + 100) >>> 0, 0 & 0xffff, 2);
    v1 = (-v1) | 0;
    t0 = (-t0) | 0;
    m.write(((sp) + 96) >>> 0, v1 & 0xffff, 2);
    m.write(((sp) + 98) >>> 0, t0 & 0xffff, 2);
    v0 = m.read(((s0) + 8) >>> 0, 2);
    a0 = (sp + 96) | 0;
    m.write(((sp) + 106) >>> 0, t0 & 0xffff, 2);
    m.write(((sp) + 108) >>> 0, 0 & 0xffff, 2);
    m.write(((sp) + 112) >>> 0, v1 & 0xffff, 2);
    v0 = (v0 + v1) | 0;
    m.write(((sp) + 104) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((s0) + 10) >>> 0, 2);
    a1 = (sp + 104) | 0;
    m.write(((sp) + 116) >>> 0, 0 & 0xffff, 2);
    v0 = (v0 + t0) | 0;
    m.write(((sp) + 114) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((s0) + 8) >>> 0, 2);
    a2 = (sp + 112) | 0;
    v0 = (v0 + v1) | 0;
    m.write(((sp) + 120) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((s0) + 10) >>> 0, 2);
    a3 = (sp + 120) | 0;
    m.write(((sp) + 124) >>> 0, 0 & 0xffff, 2);
    v0 = (v0 + t0) | 0;
    m.write(((sp) + 122) >>> 0, v0 & 0xffff, 2);
    v0 = (sp + 128) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (sp + 132) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (sp + 136) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = (sp + 140) | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (sp + 144) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4);
    v0 = (sp + 148) | 0;
    m.write(((sp) + 36) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8004e288, a0, a1, a2, a3);
  case 0x8004cab0:
    v0 = 0x800000 | 0;
    v0 = s1 & v0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8004cadc; continue; } }
  case 0x8004cac0:
    v1 = m.read(((s0) + 14) >>> 0, 1);
    v0 = m.read(((s0) + 8) >>> 0, 1);
    v0 = (v1 + v0) | 0;
    t1 = (v0 + -1) | 0;
    t4 = v1 | 0; pc = 0x8004caf0; continue;
  case 0x8004cadc:
    t1 = m.read(((s0) + 14) >>> 0, 1);
    v0 = m.read(((s0) + 8) >>> 0, 1);
    v0 = (t1 + v0) | 0;
    t4 = (v0 + -1) | 0;
  case 0x8004caf0:
    v0 = 0x400000 | 0;
    v0 = s1 & v0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8004cb1c; continue; } }
  case 0x8004cb00:
    v1 = m.read(((s0) + 15) >>> 0, 1);
    v0 = m.read(((s0) + 10) >>> 0, 1);
    v0 = (v1 + v0) | 0;
    t2 = (v0 + -1) | 0;
    t3 = v1 | 0; pc = 0x8004cb30; continue;
  case 0x8004cb1c:
    t2 = m.read(((s0) + 15) >>> 0, 1);
    v0 = m.read(((s0) + 10) >>> 0, 1);
    v0 = (t2 + v0) | 0;
    t3 = (v0 + -1) | 0;
  case 0x8004cb30:
    a0 = s2 | 0;
    a1 = s3 | 0;
    v1 = (s1 >>> 5) | 0;
    v0 = 0x2000000 | 0;
    v1 = v1 & v0;
    v0 = s1 << 18;
    a2 = 0x1000000 | 0;
    v0 = v0 & a2;
    a2 = 0x2c000000 | 0;
    v0 = v0 | a2;
    v1 = v1 | v0;
    t1 = t1 & 255;
    t2 = t2 & 255;
    t2 = t2 << 8;
    a2 = m.read(((s0) + 22) >>> 0, 1);
    v0 = m.read(((s0) + 21) >>> 0, 1);
    a2 = a2 << 16;
    v1 = v1 | a2;
    v0 = v0 << 8;
    v1 = v1 | v0;
    v0 = m.read(((s0) + 20) >>> 0, 1);
    a2 = m.read(((sp) + 128) >>> 0, 4) | 0;
    v1 = v1 | v0;
    m.write(((a0) + 8) >>> 0, a2 >>> 0, 4);
    a2 = s4 & 65535;
    m.write(((a0) + 4) >>> 0, v1 >>> 0, 4);
    v1 = t1 | t2;
    t0 = (m.read(((s0) + 18) >>> 0, 2) << 16) >> 16;
    a3 = (m.read(((s0) + 16) >>> 0, 2) << 16) >> 16;
    v0 = m.read(((sp) + 132) >>> 0, 4) | 0;
    t0 = t0 << 22;
    v1 = v1 | t0;
    a3 = a3 << 12;
    m.write(((a0) + 16) >>> 0, v0 >>> 0, 4);
    v0 = 0x3f0000 | 0;
    a3 = a3 & v0;
    v1 = v1 | a3;
    m.write(((a0) + 12) >>> 0, v1 >>> 0, 4);
    t0 = m.read(((s0) + 12) >>> 0, 2);
    v0 = m.read(((sp) + 136) >>> 0, 4) | 0;
    a3 = (0 + 9) | 0;
    m.write(((a0) + 24) >>> 0, v0 >>> 0, 4);
    v0 = t3 & 255;
    v0 = v0 << 8;
    t1 = t1 | v0;
    t0 = t0 & 31;
    v1 = m.read(((sp) + 140) >>> 0, 4) | 0;
    t0 = t0 << 16;
    m.write(((a0) + 28) >>> 0, t1 >>> 0, 4);
    m.write(((a0) + 32) >>> 0, v1 >>> 0, 4);
    v1 = t4 & 255;
    v0 = v1 | v0;
    v1 = v1 | t2;
    v1 = v1 | t0;
    m.write(((a0) + 36) >>> 0, v0 >>> 0, 4);
    v0 = (s1 >>> 1) | 0;
    t0 = 0x1800000 | 0;
    v0 = v0 & t0;
    v1 = v1 | v0;
    v0 = (s1 >>> 7) | 0;
    t0 = 0x600000 | 0;
    v0 = v0 & t0;
  case 0x8004cc28:
    v1 = v1 | v0;
    m.write(((a0) + 20) >>> 0, v1 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8004c6c8, a0, a1, a2, a3);
  case 0x8004cc34:
    s2 = v0 | 0;
    at = 0x800a0000 | 0;
    m.write(((at) + 28072) >>> 0, s2 >>> 0, 4);
  case 0x8004cc40:
    s4 = m.read(((sp) + 168) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 164) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 160) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 156) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 152) >>> 0, 4) | 0;
    sp = (sp + 176) | 0; return v0;
  default: throw new Error(`x8004c768: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8004c6c8, translated instruction by instruction (38 instructions).
export function* x8004c6c8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8004c6c8;
  for (;;) switch (pc) {
  case 0x8004c6c8:
    sp = (sp + -40) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = a0 | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = a1 | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = a3 | 0;
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    v0 = m.read(((s2) + 8) >>> 0, 4) | 0;
    a2 = a2 & 65535;
    s1 = (a2 - v0) | 0;
    { const c = (s1 | 0) >= 0; s3 = s4 | 0; if (c) { pc = 0x8004c710; continue; } }
  case 0x8004c704:
    a0 = 0x80010000 | 0;
    a0 = (a0 + 13380) | 0; [v0, v1] = yield* call(ctx, sp, 0x80045678, a0, a1, a2, a3);
  case 0x8004c710:
    v1 = m.read(((s2) + 4) >>> 0, 4) | 0;
    v0 = s1 << 2;
    v1 = (v1 + v0) | 0;
    v0 = s3 & 255;
    v0 = v0 << 2;
    v0 = (v0 + 4) | 0;
    a0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (s0 + v0) | 0;
    m.write(((s0) + 0) >>> 0, a0 >>> 0, 4);
    m.write(((s0) + 3) >>> 0, s4 & 0xff, 1);
    m.write(((v1) + 0) >>> 0, s0 >>> 0, 4);
    m.write(((v1) + 3) >>> 0, 0 & 0xff, 1);
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0; return v0;
  default: throw new Error(`x8004c6c8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8004e048, translated instruction by instruction (9 instructions).
export function x8004e048(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8004e048;
  for (;;) switch (pc) {
  case 0x8004e048:
    t0 = m.read(((a1) + 0) >>> 0, 4) | 0;
    t1 = m.read(((a1) + 4) >>> 0, 4) | 0;
    t2 = m.read(((a1) + 8) >>> 0, 4) | 0;
    m.write(((a0) + 20) >>> 0, t0 >>> 0, 4);
    m.write(((a0) + 24) >>> 0, t1 >>> 0, 4);
    m.write(((a0) + 28) >>> 0, t2 >>> 0, 4);
    v0 = a0 | 0;
     return v0;
  default: throw new Error(`x8004e048: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8004e078, translated instruction by instruction (78 instructions).
export function x8004e078(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8004e078;
  for (;;) switch (pc) {
  case 0x8004e078:
    t3 = m.read(((a1) + 0) >>> 0, 4) | 0;
    t4 = m.read(((a1) + 4) >>> 0, 4) | 0;
    t5 = m.read(((a1) + 8) >>> 0, 4) | 0;
    t0 = m.read(((a0) + 0) >>> 0, 4) | 0;
    t1 = t0 & 65535;
    t1 = t1 << 16;
    t1 = t1 >> 16;
    [hi, lo] = mult(t1, t3, false);
    t1 = lo;
    t1 = t1 >> 12;
    t1 = t1 & 65535;
    t2 = t0 >> 16;
    [hi, lo] = mult(t2, t4, false);
    t2 = lo;
    t2 = t2 >> 12;
    t2 = t2 << 16;
    t1 = t1 | t2;
    m.write(((a0) + 0) >>> 0, t1 >>> 0, 4);
    t0 = m.read(((a0) + 4) >>> 0, 4) | 0;
    t1 = t0 & 65535;
    t1 = t1 << 16;
    t1 = t1 >> 16;
    [hi, lo] = mult(t1, t5, false);
    t1 = lo;
    t1 = t1 >> 12;
    t1 = t1 & 65535;
    t2 = t0 >> 16;
    [hi, lo] = mult(t2, t3, false);
    t2 = lo;
    t2 = t2 >> 12;
    t2 = t2 << 16;
    t1 = t1 | t2;
    m.write(((a0) + 4) >>> 0, t1 >>> 0, 4);
    t0 = m.read(((a0) + 8) >>> 0, 4) | 0;
    t1 = t0 & 65535;
    t1 = t1 << 16;
    t1 = t1 >> 16;
    [hi, lo] = mult(t1, t4, false);
    t1 = lo;
    t1 = t1 >> 12;
    t1 = t1 & 65535;
    t2 = t0 >> 16;
    [hi, lo] = mult(t2, t5, false);
    t2 = lo;
    t2 = t2 >> 12;
    t2 = t2 << 16;
    t1 = t1 | t2;
    m.write(((a0) + 8) >>> 0, t1 >>> 0, 4);
    t0 = m.read(((a0) + 12) >>> 0, 4) | 0;
    t1 = t0 & 65535;
    t1 = t1 << 16;
    t1 = t1 >> 16;
    [hi, lo] = mult(t1, t3, false);
    t1 = lo;
    t1 = t1 >> 12;
    t1 = t1 & 65535;
    t2 = t0 >> 16;
    [hi, lo] = mult(t2, t4, false);
    t2 = lo;
    t2 = t2 >> 12;
    t2 = t2 << 16;
    t1 = t1 | t2;
    m.write(((a0) + 12) >>> 0, t1 >>> 0, 4);
    t0 = m.read(((a0) + 16) >>> 0, 4) | 0;
    t1 = t0 & 65535;
    t1 = t1 << 16;
    t1 = t1 >> 16;
    [hi, lo] = mult(t1, t5, false);
    t1 = lo;
    t1 = t1 >> 12;
    m.write(((a0) + 16) >>> 0, t1 >>> 0, 4);
    v0 = a0 | 0; return v0;
  default: throw new Error(`x8004e078: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8004e308, translated instruction by instruction (163 instructions).
export function x8004e308(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8004e308;
  for (;;) switch (pc) {
  case 0x8004e308:
    t7 = (m.read(((a0) + 0) >>> 0, 2) << 16) >> 16;
    v0 = a1 | 0;
    { const c = (t7 | 0) >= 0; t9 = t7 & 4095; if (c) { pc = 0x8004e34c; continue; } }
  case 0x8004e318:
    t7 = (-t7) | 0;
    { const c = (t7 | 0) >= 0; t7 = t7 & 4095; if (c) { pc = 0x8004e324; continue; } }
  case 0x8004e324:
    t8 = t7 << 2;
    t9 = 0x80070000 | 0;
    t9 = (t9 + t8) | 0;
    t9 = m.read(((t9) + 12176) >>> 0, 4) | 0;
    t8 = t9 << 16;
    t8 = t8 >> 16;
    t3 = (-t8) | 0;
    t0 = t9 >> 16; pc = 0x8004e36c; continue;
  case 0x8004e34c:
    t8 = t9 << 2;
    t9 = 0x80070000 | 0;
    t9 = (t9 + t8) | 0;
    t9 = m.read(((t9) + 12176) >>> 0, 4) | 0;
    t8 = t9 << 16;
    t3 = t8 >> 16;
    t0 = t9 >> 16;
  case 0x8004e36c:
    t7 = (m.read(((a0) + 2) >>> 0, 2) << 16) >> 16;
    { const c = (t7 | 0) >= 0; t9 = t7 & 4095; if (c) { pc = 0x8004e3b0; continue; } }
  case 0x8004e37c:
    t7 = (-t7) | 0;
    { const c = (t7 | 0) >= 0; t7 = t7 & 4095; if (c) { pc = 0x8004e388; continue; } }
  case 0x8004e388:
    t8 = t7 << 2;
    t9 = 0x80070000 | 0;
    t9 = (t9 + t8) | 0;
    t9 = m.read(((t9) + 12176) >>> 0, 4) | 0;
    t4 = t9 << 16;
    t4 = t4 >> 16;
    t6 = (-t4) | 0;
    t1 = t9 >> 16; pc = 0x8004e3d4; continue;
  case 0x8004e3b0:
    t8 = t9 << 2;
    t9 = 0x80070000 | 0;
    t9 = (t9 + t8) | 0;
    t9 = m.read(((t9) + 12176) >>> 0, 4) | 0;
    t6 = t9 << 16;
    t6 = t6 >> 16;
    t4 = (-t6) | 0;
    t1 = t9 >> 16;
  case 0x8004e3d4:
    [hi, lo] = mult(t1, t3, false);
    t7 = (m.read(((a0) + 4) >>> 0, 2) << 16) >> 16;
    m.write(((a1) + 4) >>> 0, t6 & 0xffff, 2);
    t8 = lo;
    t9 = (-t8) | 0;
    t6 = t9 >> 12;
    [hi, lo] = mult(t1, t0, false);
    m.write(((a1) + 10) >>> 0, t6 & 0xffff, 2);
    { const c = (t7 | 0) >= 0; t9 = t7 & 4095; if (c) { pc = 0x8004e43c; continue; } }
  case 0x8004e3fc:
    t8 = lo;
    t6 = t8 >> 12;
    m.write(((a1) + 16) >>> 0, t6 & 0xffff, 2);
    t7 = (-t7) | 0;
    { const c = (t7 | 0) >= 0; t7 = t7 & 4095; if (c) { pc = 0x8004e414; continue; } }
  case 0x8004e414:
    t8 = t7 << 2;
    t9 = 0x80070000 | 0;
    t9 = (t9 + t8) | 0;
    t9 = m.read(((t9) + 12176) >>> 0, 4) | 0;
    t8 = t9 << 16;
    t8 = t8 >> 16;
    t5 = (-t8) | 0;
    t2 = t9 >> 16; pc = 0x8004e468; continue;
  case 0x8004e43c:
    t7 = lo;
    t6 = t7 >> 12;
    m.write(((a1) + 16) >>> 0, t6 & 0xffff, 2);
    t8 = t9 << 2;
    t9 = 0x80070000 | 0;
    t9 = (t9 + t8) | 0;
    t9 = m.read(((t9) + 12176) >>> 0, 4) | 0;
    t8 = t9 << 16;
    t5 = t8 >> 16;
    t2 = t9 >> 16;
  case 0x8004e468:
    [hi, lo] = mult(t2, t1, false);
    t7 = lo;
    t6 = t7 >> 12;
    m.write(((a1) + 0) >>> 0, t6 & 0xffff, 2);
    [hi, lo] = mult(t5, t1, false);
    t7 = lo;
    t6 = (-t7) | 0;
    t7 = t6 >> 12;
    [hi, lo] = mult(t2, t4, false);
    m.write(((a1) + 2) >>> 0, t7 & 0xffff, 2);
    t7 = lo;
    t8 = t7 >> 12;
    [hi, lo] = mult(t8, t3, false);
    t7 = lo;
    t6 = t7 >> 12;
    [hi, lo] = mult(t5, t0, false);
    t7 = lo;
    t9 = t7 >> 12;
    t7 = (t9 - t6) | 0;
    [hi, lo] = mult(t8, t0, false);
    m.write(((a1) + 6) >>> 0, t7 & 0xffff, 2);
    t6 = lo;
    t7 = t6 >> 12;
    [hi, lo] = mult(t5, t3, false);
    t6 = lo;
    t9 = t6 >> 12;
    t6 = (t9 + t7) | 0;
    [hi, lo] = mult(t5, t4, false);
    m.write(((a1) + 12) >>> 0, t6 & 0xffff, 2);
    t7 = lo;
    t8 = t7 >> 12;
    [hi, lo] = mult(t8, t3, false);
    t7 = lo;
    t6 = t7 >> 12;
    [hi, lo] = mult(t2, t0, false);
    t7 = lo;
    t9 = t7 >> 12;
    t7 = (t9 + t6) | 0;
    [hi, lo] = mult(t8, t0, false);
    m.write(((a1) + 8) >>> 0, t7 & 0xffff, 2);
    t6 = lo;
    t7 = t6 >> 12;
    [hi, lo] = mult(t2, t3, false);
    t6 = lo;
    t9 = t6 >> 12;
    t6 = (t9 - t7) | 0;
    m.write(((a1) + 14) >>> 0, t6 & 0xffff, 2);
     return v0;
  default: throw new Error(`x8004e308: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

export const GS_TRANSLATED = {0x8004c768: x8004c768, 0x8004c6c8: x8004c6c8, 0x8004e048: x8004e048, 0x8004e078: x8004e078, 0x8004e308: x8004e308 };
