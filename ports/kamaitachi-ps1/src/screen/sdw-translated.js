// The silhouette blend 0x8003b398 drawSdw(page, src, dst, mode): the 8-bit TIM images of a
// silhouette file blended into the picture buffer (mode 3 lighter of the two, 2 clear where the
// silhouette is, 1 copy where it is, 0 plain copy) in eight passes with a frame between them,
// and the silhouette's palette made semi-transparent and uploaded when the TIM has one.
// Translated instruction by instruction by tools/translate/gen-sdw.py.
import { call, mult, div } from "../menu/calls.js";

// 0x8003b398, translated instruction by instruction (217 instructions).
export function* x8003b398(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003b398;
  for (;;) switch (pc) {
  case 0x8003b398:
    sp = (sp + -88) | 0;
    m.write(((sp) + 60) >>> 0, s3 >>> 0, 4);
    s3 = a1 | 0;
    m.write(((sp) + 52) >>> 0, s1 >>> 0, 4);
    s1 = a2 | 0;
    m.write(((sp) + 72) >>> 0, s6 >>> 0, 4);
    s6 = a3 | 0;
    m.write(((sp) + 64) >>> 0, s4 >>> 0, 4);
    s4 = s6 & 255;
    a0 = a0 & 255;
    m.write(((sp) + 68) >>> 0, s5 >>> 0, 4);
    s5 = (a0 + 480) | 0;
    m.write(((sp) + 80) >>> 0, fp >>> 0, 4);
    fp = a0 << 9;
    m.write(((sp) + 76) >>> 0, s7 >>> 0, 4);
    s7 = a0 << 3;
    m.write(((sp) + 84) >>> 0, 0, 4);
    m.write(((sp) + 56) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s0 >>> 0, 4);
  case 0x8003b3e4:
    v1 = m.read(((s3) + 0) >>> 0, 4) | 0;
    v0 = (0 + 16) | 0;
    { const c = (v1 | 0) !== (v0 | 0); s3 = (s3 + 4) | 0; if (c) { pc = 0x8003b6c8; continue; } }
  case 0x8003b3f4:
    a0 = s3 | 0;
    a1 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x8004dd58, a0, a1, a2, a3);
  case 0x8003b400:
    v0 = m.read(((sp) + 24) >>> 0, 2);
    v1 = m.read(((sp) + 26) >>> 0, 2);
    [hi, lo] = mult(v0, v1, true);
    s2 = m.read(((sp) + 28) >>> 0, 4) | 0;
    v0 = lo;
    v1 = (v0 >>> 31) | 0;
    v0 = (v0 + v1) | 0;
    v0 = v0 >> 1;
    v0 = v0 << 2;
    v0 = (v0 + 16) | 0;
    s3 = (s3 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80035498, a0, a1, a2, a3);
  case 0x8003b434:
    v0 = (0 + 2) | 0;
    { const c = (s4 | 0) === (v0 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x8003b578; continue; } }
  case 0x8003b440:
    { const c = (s4 | 0) === (v0 | 0); v0 = (s4 | 0) < 2 ? 1 : 0; if (c) { pc = 0x8003b504; continue; } }
  case 0x8003b448:
    { const c = (v0 | 0) === 0; v0 = (0 + 3) | 0; if (c) { pc = 0x8003b460; continue; } }
  case 0x8003b450:
    { const c = (s4 | 0) === 0; a0 = s2 | 0; if (c) { pc = 0x8003b4e0; continue; } }
  case 0x8003b458:
     pc = 0x8003b5e4; continue;
  case 0x8003b460:
    { const c = (s4 | 0) !== (v0 | 0); a0 = 0 | 0; if (c) { pc = 0x8003b5e4; continue; } }
  case 0x8003b468:
    s0 = 0 | 0;
  case 0x8003b46c:
    v0 = m.read(((sp) + 26) >>> 0, 2);
    v1 = m.read(((sp) + 24) >>> 0, 2);
    v0 = v0 << 1;
    [hi, lo] = mult(v1, v0, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0;  if (c) { pc = 0x8003b48c; continue; } }
  case 0x8003b488:
    v0 = (v0 + 7) | 0;
  case 0x8003b48c:
    v0 = v0 >> 3;
    v0 = (a0 >>> 0) < (v0 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003b4c4; continue; } }
  case 0x8003b49c:
    v1 = m.read(((s2) + 0) >>> 0, 1);
    v0 = m.read(((s1) + 0) >>> 0, 1);
    v0 = (v0 >>> 0) < (v1 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; s2 = (s2 + 1) | 0; if (c) { pc = 0x8003b4b8; continue; } }
  case 0x8003b4b4:
    m.write(((s1) + 0) >>> 0, v1 & 0xff, 1);
  case 0x8003b4b8:
    s1 = (s1 + 1) | 0;
    a0 = (a0 + 1) | 0; pc = 0x8003b46c; continue;
  case 0x8003b4c4:
    s0 = (s0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80035498, a0, a1, a2, a3);
  case 0x8003b4cc:
    v0 = (s0 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x8003b46c; continue; } }
  case 0x8003b4d8:
     pc = 0x8003b5e4; continue;
  case 0x8003b4e0:
    a2 = m.read(((sp) + 26) >>> 0, 2);
    v0 = m.read(((sp) + 24) >>> 0, 2);
    a2 = a2 << 1;
    [hi, lo] = mult(v0, a2, true);
    a2 = lo;
    a1 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8003b4fc:
     pc = 0x8003b5e4; continue;
  case 0x8003b504:
    s0 = 0 | 0;
    a0 = 0 | 0;
  case 0x8003b50c:
    v0 = m.read(((sp) + 26) >>> 0, 2);
    v1 = m.read(((sp) + 24) >>> 0, 2);
    v0 = v0 << 1;
    [hi, lo] = mult(v1, v0, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0;  if (c) { pc = 0x8003b52c; continue; } }
  case 0x8003b528:
    v0 = (v0 + 7) | 0;
  case 0x8003b52c:
    v0 = v0 >> 3;
    v0 = (a0 >>> 0) < (v0 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003b55c; continue; } }
  case 0x8003b53c:
    v1 = m.read(((s2) + 0) >>> 0, 1);
    { const c = (v1 | 0) === 0; s2 = (s2 + 1) | 0; if (c) { pc = 0x8003b550; continue; } }
  case 0x8003b54c:
    m.write(((s1) + 0) >>> 0, v1 & 0xff, 1);
  case 0x8003b550:
    s1 = (s1 + 1) | 0;
    a0 = (a0 + 1) | 0; pc = 0x8003b50c; continue;
  case 0x8003b55c:
    s0 = (s0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80035498, a0, a1, a2, a3);
  case 0x8003b564:
    v0 = (s0 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x8003b50c; continue; } }
  case 0x8003b570:
     pc = 0x8003b5e4; continue;
  case 0x8003b578:
    s0 = 0 | 0;
    a0 = 0 | 0;
  case 0x8003b580:
    v0 = m.read(((sp) + 26) >>> 0, 2);
    v1 = m.read(((sp) + 24) >>> 0, 2);
    v0 = v0 << 1;
    [hi, lo] = mult(v1, v0, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0;  if (c) { pc = 0x8003b5a0; continue; } }
  case 0x8003b59c:
    v0 = (v0 + 7) | 0;
  case 0x8003b5a0:
    v0 = v0 >> 3;
    v0 = (a0 >>> 0) < (v0 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003b5d0; continue; } }
  case 0x8003b5b0:
    v1 = m.read(((s2) + 0) >>> 0, 1);
    { const c = (v1 | 0) === 0; s2 = (s2 + 1) | 0; if (c) { pc = 0x8003b5c4; continue; } }
  case 0x8003b5c0:
    m.write(((s1) + 0) >>> 0, 0 & 0xff, 1);
  case 0x8003b5c4:
    s1 = (s1 + 1) | 0;
    a0 = (a0 + 1) | 0; pc = 0x8003b580; continue;
  case 0x8003b5d0:
    s0 = (s0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80035498, a0, a1, a2, a3);
  case 0x8003b5d8:
    v0 = (s0 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x8003b580; continue; } }
  case 0x8003b5e4:
     [v0, v1] = yield* call(ctx, sp, 0x80035498, a0, a1, a2, a3);
  case 0x8003b5ec:
    v0 = (s6 + -2) | 0;
    v0 = v0 & 255;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8003b6b8; continue; } }
  case 0x8003b600:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = (v0 >>> 3) | 0;
    v0 = v0 & 1;
    { const c = (v0 | 0) === 0; a0 = (0 + 1) | 0; if (c) { pc = 0x8003b6b8; continue; } }
  case 0x8003b618:
    v1 = m.read(((sp) + 40) >>> 0, 4) | 0;
    a1 = (0 + -32768) | 0;
    m.write(((v1) + 0) >>> 0, 0 & 0xffff, 2);
    v1 = (v1 + 2) | 0;
  case 0x8003b628:
    v0 = m.read(((v1) + 0) >>> 0, 2);
    a0 = (a0 + 1) | 0;
    v0 = v0 | a1;
    m.write(((v1) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = (a0 >>> 0) < 256 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = (v1 + 2) | 0; if (c) { pc = 0x8003b628; continue; } }
  case 0x8003b644:
    a1 = 0 | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    a2 = s5 | 0;
    a0 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80046d10, a0, a1, a2, a3);
  case 0x8003b658:
    a0 = s0 | 0;
    s0 = 0x800c0000 | 0;
    s0 = (s0 + 18464) | 0;
    s0 = (fp + s0) | 0;
    a1 = s0 | 0;
    a2 = (0 + 512) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8003b674:
    a1 = s0 | 0;
    a0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    a2 = (0 + 128) | 0; [v0, v1] = yield* call(ctx, sp, 0x800448d8, a0, a1, a2, a3);
  case 0x8003b684:
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = (s7 + v0) | 0;
    m.write(((v1) + 0) >>> 0, 0 >>> 0, 4);
    m.write(((v1) + 4) >>> 0, s5 >>> 0, 4);
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = v0 & 1;
    { const c = (v0 | 0) !== 0; v0 = 0x1000000 | 0; if (c) { pc = 0x8003b6b4; continue; } }
  case 0x8003b6ac:
    m.write(((v1) + 8) >>> 0, 0 >>> 0, 4); pc = 0x8003b6b8; continue;
  case 0x8003b6b4:
    m.write(((v1) + 8) >>> 0, v0 >>> 0, 4);
  case 0x8003b6b8:
     [v0, v1] = yield* call(ctx, sp, 0x80035498, a0, a1, a2, a3);
  case 0x8003b6c0:
     pc = 0x8003b3e4; continue;
  case 0x8003b6c8:
    fp = m.read(((sp) + 80) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 76) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 72) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 48) >>> 0, 4) | 0;
    sp = (sp + 88) | 0;
     return v0;
  default: throw new Error(`x8003b398: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}
