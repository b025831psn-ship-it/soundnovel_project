// The scene effects switch 0x800418d0 for the modes src/screen/weather.js does not port by hand
// (effect() hands them here), with the effects' set-up and per-frame routines it reaches and
// the soft-float helpers they use (0x80053e98-0x800546c8). Translated instruction by
// instruction from the original MIPS code by tools/translate/gen-effects.py (one switch case per
// basic block; registers are locals, memory is the PS1 RAM at the original addresses, calls go
// through call() in ../menu/calls.js with the caller's sp). Generators: each frame the original
// waits (VSync through 0x80013f34) is a yield.
import { call, mult, div } from "../menu/calls.js";

// 0x8001c7fc, translated instruction by instruction (15 instructions).
export function* x8001c7fc(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001c7fc;
  for (;;) switch (pc) {
  case 0x8001c7fc:
    sp = (sp + -24) | 0;
    a2 = a0 & 65535;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x8001c818:
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a0 = (0 + 30) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003afc8, a0, a1, a2, a3);
  case 0x8001c828:
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x8001c7fc: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001cd20, translated instruction by instruction (49 instructions).
export function* x8001cd20(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001cd20;
  for (;;) switch (pc) {
  case 0x8001cd20:
    sp = (sp + -40) | 0;
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    s1 = a0 | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    s0 = a1 | 0;
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    s2 = a2 | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    m.write(((sp) + 36) >>> 0, 0, 4);
    a0 = s0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8003afc8, a0, a1, a2, a3);
  case 0x8001cd50:
    s0 = s0 << 16;
    a0 = s0 >> 16;
    a1 = 0 | 0;
    v0 = (0 + 240) | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8001cd70:
    v0 = s1 | 0;
    v0 = v0 & 255;
    v1 = 0x801f0000 | 0;
    v1 = (v1 + 26266) | 0;
    v0 = v0 << 1;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27352) >>> 0, 2);
    v0 = (v0 + v1) | 0;
    m.write(((v0) + 0) >>> 0, a0 & 0xffff, 2);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27404) >>> 0, 4) | 0;
    s1 = (s1 + 1) | 0;
    m.write(((v0) + 49) >>> 0, s1 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    m.write(((v1) + 51) >>> 0, s2 & 0xff, 1);
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    m.write(((a0) + 56) >>> 0, s1 & 0xff, 1);
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8001cd20: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001d3d4, translated instruction by instruction (141 instructions).
export function* x8001d3d4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001d3d4;
  for (;;) switch (pc) {
  case 0x8001d3d4:
    sp = (sp + -40) | 0;
    a0 = a0 & 255;
    v0 = (0 + 1) | 0;
    { const c = (a0 | 0) === (v0 | 0); m.write(((sp) + 32) >>> 0, 0, 4); if (c) { pc = 0x8001d4e0; continue; } }
  case 0x8001d3e8:
    v0 = (a0 | 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = (0 + 2) | 0; if (c) { pc = 0x8001d404; continue; } }
  case 0x8001d3f4:
    { const c = (a0 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x8001d414; continue; } }
  case 0x8001d3fc:
     pc = 0x8001d5f4; continue;
  case 0x8001d404:
    { const c = (a0 | 0) === (v0 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x8001d55c; continue; } }
  case 0x8001d40c:
     pc = 0x8001d5f4; continue;
  case 0x8001d414:
    v1 = 0 | 0;
    v0 = 0x800a0000 | 0;
    a0 = (v0 + -9656) | 0;
  case 0x8001d420:
    v0 = v1 & 65535;
    v1 = (v1 + 1) | 0;
    v0 = v0 << 3;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 4) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4);
    v0 = v1 & 65535;
    v0 = (v0 >>> 0) < 16 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a1 = 0 | 0; if (c) { pc = 0x8001d420; continue; } }
  case 0x8001d448:
    a0 = (sp + 24) | 0;
    a2 = a1 | 0;
    a3 = a1 | 0;
    v0 = (0 + 5) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27164) >>> 0, v0 & 0xff, 1);
    v0 = (0 + 15) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27162) >>> 0, v0 & 0xff, 1);
    v0 = (0 + 512) | 0;
    m.write(((sp) + 24) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 160) | 0;
    m.write(((sp) + 28) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 240) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27163) >>> 0, 0 & 0xff, 1);
    m.write(((sp) + 26) >>> 0, 0 & 0xffff, 2);
    m.write(((sp) + 30) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x80049438, a0, a1, a2, a3);
  case 0x8001d494:
    a0 = (0 + 8) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8001d4b0:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27352) >>> 0, 2);
    v0 = 0x801f0000 | 0;
    m.write(((v0) + 26266) >>> 0, v1 & 0xffff, 2);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27404) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0;
    m.write(((v0) + 49) >>> 0, a1 & 0xff, 1);
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 14) | 0; pc = 0x8001d5d8; continue;
  case 0x8001d4e0:
    a0 = (sp + 24) | 0;
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = a1 | 0;
    v0 = (0 + 704) | 0;
    m.write(((sp) + 24) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 160) | 0;
    m.write(((sp) + 28) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 26) >>> 0, 0 & 0xffff, 2);
    m.write(((sp) + 30) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x80049438, a0, a1, a2, a3);
  case 0x8001d510:
    a0 = (0 + 11) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8001d52c:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27352) >>> 0, 2);
    v0 = 0x801f0000 | 0;
    m.write(((v0) + 26268) >>> 0, v1 & 0xffff, 2);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27404) >>> 0, 4) | 0;
    a1 = (0 + 2) | 0;
    m.write(((v0) + 49) >>> 0, a1 & 0xff, 1);
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 12) | 0; pc = 0x8001d5d8; continue;
  case 0x8001d55c:
    a0 = (sp + 24) | 0;
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = a1 | 0;
    v0 = (0 + 256) | 0;
    m.write(((sp) + 26) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 320) | 0;
    m.write(((sp) + 24) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 160) | 0;
    m.write(((sp) + 28) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 30) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x80049438, a0, a1, a2, a3);
  case 0x8001d590:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8001d5ac:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27352) >>> 0, 2);
    v0 = 0x801f0000 | 0;
    m.write(((v0) + 26270) >>> 0, v1 & 0xffff, 2);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27404) >>> 0, 4) | 0;
    a1 = (0 + 3) | 0;
    m.write(((v0) + 49) >>> 0, a1 & 0xff, 1);
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 13) | 0;
  case 0x8001d5d8:
    m.write(((a0) + 51) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((a0) + 30) >>> 0, v0 & 0xffff, 2);
    m.write(((v1) + 56) >>> 0, a1 & 0xff, 1);
    v0 = (0 + 1) | 0;
  case 0x8001d5f4:
    m.write(((0x8007913c) + 348) >>> 0, v0 & 0xff, 1);
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8001d3d4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002665c, translated instruction by instruction (54 instructions).
export function* x8002665c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002665c;
  for (;;) switch (pc) {
  case 0x8002665c:
    sp = (sp + -32) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = 0 | 0;
    a1 = s0 | 0;
    v0 = 0x801d0000 | 0;
    a3 = (v0 + 25152) | 0;
    a2 = a0 & 65535;
    m.write(((sp) + 28) >>> 0, 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    v0 = s0 & 65535;
  case 0x80026688:
    v1 = v0 << 1;
    v1 = (v1 + v0) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    v1 = v1 << 3;
    v1 = (v1 + a3) | 0;
    v0 = (m.read(((v1) + 6) >>> 0, 2) << 16) >> 16;
    { const c = (v0 | 0) !== (a2 | 0);  if (c) { pc = 0x800266b4; continue; } }
  case 0x800266b0:
    a1 = (0 + 1) | 0;
  case 0x800266b4:
    s0 = (s0 + 1) | 0;
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 6 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s0 & 65535; if (c) { pc = 0x80026688; continue; } }
  case 0x800266c8:
    v0 = a1 & 65535;
    { const c = (v0 | 0) === 0; v1 = a0 & 65535; if (c) { pc = 0x80026718; continue; } }
  case 0x800266d4:
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11384) | 0;
    s1 = (v1 + v0) | 0;
    s2 = (0 + 1) | 0;
  case 0x800266e4:
    v0 = m.read(((s1) + 0) >>> 0, 1);
    { const c = (v0 | 0) === (s2 | 0);  if (c) { pc = 0x80026714; continue; } }
  case 0x800266f4:
    s0 = (s0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800266fc:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80026704:
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 601 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x800266e4; continue; } }
  case 0x80026714:
    m.write(((s1) + 0) >>> 0, 0 & 0xff, 1);
  case 0x80026718:
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return [v0, v1];
  default: throw new Error(`x8002665c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002d190, translated instruction by instruction (63 instructions).
export function* x8002d190(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002d190;
  for (;;) switch (pc) {
  case 0x8002d190:
    sp = (sp + -40) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = a2 | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = a3 | 0;
    a0 = a0 & 65535;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((0x8007913c) + 136) >>> 0, s0 & 0xffff, 2);
    s1 = a1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002d1c4:
    s2 = (0 + 0) | 0;
    s3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002d1e0:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002d1ec:
    v1 = m.read(((0x8007913c) + 140) >>> 0, 4) | 0;
    s0 = s0 & 65535;
    v1 = (v0 - v1) | 0;
    [hi, lo] = div(0, v1, true);
    { const c = (s0 | 0) !== 0;  if (c) { pc = 0x8002d208; continue; } }
  case 0x8002d204:
    throw new Error("break 7 at 0x8002d204");
  case 0x8002d208:
    at = (0 + -1) | 0;
    { const c = (s0 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8002d220; continue; } }
  case 0x8002d214:
    { const c = (v1 | 0) !== (at | 0);  if (c) { pc = 0x8002d220; continue; } }
  case 0x8002d21c:
    throw new Error("break 6 at 0x8002d21c");
  case 0x8002d220:
    v1 = lo;
    s1 = s1 & 65535;
    m.write(((0x8007913c) + 160) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 148) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 156) >>> 0, v1 >>> 0, 4);
    a0 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002d23c:
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002d250:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002d25c:
    m.write(((0x8007913c) + 152) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 144) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 196) >>> 0, s4 >>> 0, 4);
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8002d190: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002d28c, translated instruction by instruction (63 instructions).
export function* x8002d28c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002d28c;
  for (;;) switch (pc) {
  case 0x8002d28c:
    sp = (sp + -40) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = a2 | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = a3 | 0;
    a0 = a0 & 65535;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((0x8007913c) + 168) >>> 0, s0 & 0xffff, 2);
    s1 = a1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002d2c0:
    s2 = (0 + 0) | 0;
    s3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002d2dc:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002d2e8:
    v1 = m.read(((0x8007913c) + 172) >>> 0, 4) | 0;
    s0 = s0 & 65535;
    v1 = (v0 - v1) | 0;
    [hi, lo] = div(0, v1, true);
    { const c = (s0 | 0) !== 0;  if (c) { pc = 0x8002d304; continue; } }
  case 0x8002d300:
    throw new Error("break 7 at 0x8002d300");
  case 0x8002d304:
    at = (0 + -1) | 0;
    { const c = (s0 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8002d31c; continue; } }
  case 0x8002d310:
    { const c = (v1 | 0) !== (at | 0);  if (c) { pc = 0x8002d31c; continue; } }
  case 0x8002d318:
    throw new Error("break 6 at 0x8002d318");
  case 0x8002d31c:
    v1 = lo;
    s1 = s1 & 65535;
    m.write(((0x8007913c) + 192) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 180) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 188) >>> 0, v1 >>> 0, 4);
    a0 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002d338:
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002d34c:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002d358:
    m.write(((0x8007913c) + 184) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 176) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 196) >>> 0, s4 >>> 0, 4);
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8002d28c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002d388, translated instruction by instruction (57 instructions).
export function* x8002d388(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002d388;
  for (;;) switch (pc) {
  case 0x8002d388:
    sp = (sp + -40) | 0;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    s1 = 0 | 0;
    v0 = 0x800a0000 | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = (v0 + -11784) | 0;
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    s3 = (s2 + 4) | 0;
    v0 = (0 + 25600) | 0;
    m.write(((0x8007913c) + 144) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 152) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 176) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 184) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 256) | 0;
    m.write(((sp) + 32) >>> 0, 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    m.write(((0x8007913c) + 132) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 136) >>> 0, 0 & 0xffff, 2);
    m.write(((0x8007913c) + 140) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 148) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 156) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 160) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 164) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 168) >>> 0, 0 & 0xffff, 2);
    m.write(((0x8007913c) + 172) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 180) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 188) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 192) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 196) >>> 0, v0 >>> 0, 4);
    a0 = s1 & 65535;
  case 0x8002d400:
    s0 = a0 << 3;
    v0 = (s0 + s2) | 0;
    s0 = (s0 + s3) | 0;
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002d414:
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    s1 = (s1 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002d42c:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002d438:
    m.write(((s0) + 0) >>> 0, v0 >>> 0, 4);
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = s1 & 65535; if (c) { pc = 0x8002d400; continue; } }
  case 0x8002d44c:
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8002d388: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002d8e4, translated instruction by instruction (20 instructions).
export function x8002d8e4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002d8e4;
  for (;;) switch (pc) {
  case 0x8002d8e4:
    a1 = a1 << 16;
    a1 = a1 >> 16;
    { const c = (a1 | 0) < 0; v0 = a0 << 16; if (c) { pc = 0x8002d92c; continue; } }
  case 0x8002d8f4:
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v0 = (a1 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002d92c; continue; } }
  case 0x8002d900:
    { const c = (v0 | 0) === 0; v0 = (a0 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002d92c; continue; } }
  case 0x8002d908:
    { const c = (v0 | 0) === 0; v1 = 0x800b0000 | 0; if (c) { pc = 0x8002d92c; continue; } }
  case 0x8002d910:
    v1 = (v1 + 7200) | 0;
    v0 = a0 << 2;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 6;
    v0 = (v0 + v1) | 0;
    v0 = (v0 + a1) | 0;
    m.write(((v0) + 0) >>> 0, a2 & 0xff, 1);
  case 0x8002d92c:
     return [v0, v1];
  default: throw new Error(`x8002d8e4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002d984, translated instruction by instruction (24 instructions).
export function x8002d984(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002d984;
  for (;;) switch (pc) {
  case 0x8002d984:
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a2 = (v0 + 7200) | 0;
  case 0x8002d990:
    a0 = 0 | 0;
    v1 = a1 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a2) | 0;
    v0 = a0 & 65535;
  case 0x8002d9ac:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x8002d9ac; continue; } }
  case 0x8002d9c8:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002d990; continue; } }
  case 0x8002d9dc:
     return [v0, v1];
  default: throw new Error(`x8002d984: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002d9e4, translated instruction by instruction (10 instructions).
export function* x8002d9e4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002d9e4;
  for (;;) switch (pc) {
  case 0x8002d9e4:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    a0 = 0x800b0000 | 0;
    a0 = (a0 + 7200) | 0;
    a1 = (0 + 5120) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044be4, a0, a1, a2, a3);
  case 0x8002d9fc:
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x8002d9e4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002dd08, translated instruction by instruction (340 instructions).
export function x8002dd08(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002dd08;
  for (;;) switch (pc) {
  case 0x8002dd08:
    t0 = a0 | 0;
    t5 = a0 | 0;
    a0 = a0 << 16;
    { const c = (a0 | 0) < 0; t2 = 0 | 0; if (c) { pc = 0x8002e250; continue; } }
  case 0x8002dd1c:
    v0 = 0x800b0000 | 0;
    t4 = (v0 + 7200) | 0;
    v0 = t2 << 16;
  case 0x8002dd28:
    v1 = m.read(((0x8007913c) + 200) >>> 0, 4) | 0;
    v0 = v0 >> 16;
    [hi, lo] = mult(v1, v0, true);
    a0 = lo;
    { const c = (a0 | 0) >= 0; v0 = t0 << 16; if (c) { pc = 0x8002dd44; continue; } }
  case 0x8002dd40:
    a0 = (a0 + 255) | 0;
  case 0x8002dd44:
    v0 = v0 >> 16;
    [hi, lo] = mult(v1, v0, true);
    v0 = a0 >> 8;
    v1 = lo;
    { const c = (v1 | 0) >= 0; t1 = v0 | 0; if (c) { pc = 0x8002dd60; continue; } }
  case 0x8002dd5c:
    v1 = (v1 + 255) | 0;
  case 0x8002dd60:
    t3 = (v1 >>> 8) | 0;
    v1 = (a2 + v0) | 0;
    v0 = (a1 + t0) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v0 = v1 << 16; if (c) { pc = 0x8002ddac; continue; } }
  case 0x8002dd7c:
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002ddac; continue; } }
  case 0x8002dd88:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002ddac; continue; } }
  case 0x8002dd90:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002ddac; continue; } }
  case 0x8002dd98:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002ddac:
    v0 = (a1 + t0) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 - t1) | 0; if (c) { pc = 0x8002ddf4; continue; } }
  case 0x8002ddc0:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002ddf4; continue; } }
  case 0x8002ddd0:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002ddf4; continue; } }
  case 0x8002ddd8:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002ddf4; continue; } }
  case 0x8002dde0:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002ddf4:
    v0 = (a1 - t0) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 + t1) | 0; if (c) { pc = 0x8002de3c; continue; } }
  case 0x8002de08:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002de3c; continue; } }
  case 0x8002de18:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002de3c; continue; } }
  case 0x8002de20:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002de3c; continue; } }
  case 0x8002de28:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002de3c:
    v0 = (a1 - t0) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 - t1) | 0; if (c) { pc = 0x8002de84; continue; } }
  case 0x8002de50:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002de84; continue; } }
  case 0x8002de60:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002de84; continue; } }
  case 0x8002de68:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002de84; continue; } }
  case 0x8002de70:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002de84:
    v0 = (a1 + t2) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 + t3) | 0; if (c) { pc = 0x8002decc; continue; } }
  case 0x8002de98:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002decc; continue; } }
  case 0x8002dea8:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002decc; continue; } }
  case 0x8002deb0:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002decc; continue; } }
  case 0x8002deb8:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002decc:
    v0 = (a1 + t2) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 - t3) | 0; if (c) { pc = 0x8002df14; continue; } }
  case 0x8002dee0:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002df14; continue; } }
  case 0x8002def0:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002df14; continue; } }
  case 0x8002def8:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002df14; continue; } }
  case 0x8002df00:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002df14:
    v0 = (a1 - t2) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 + t3) | 0; if (c) { pc = 0x8002df5c; continue; } }
  case 0x8002df28:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002df5c; continue; } }
  case 0x8002df38:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002df5c; continue; } }
  case 0x8002df40:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002df5c; continue; } }
  case 0x8002df48:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002df5c:
    v0 = (a1 - t2) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 - t3) | 0; if (c) { pc = 0x8002dfa4; continue; } }
  case 0x8002df70:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002dfa4; continue; } }
  case 0x8002df80:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002dfa4; continue; } }
  case 0x8002df88:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002dfa4; continue; } }
  case 0x8002df90:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002dfa4:
    v0 = (a1 + t0) | 0;
    v0 = (v0 + 1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 + t1) | 0; if (c) { pc = 0x8002dff0; continue; } }
  case 0x8002dfbc:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002dff0; continue; } }
  case 0x8002dfcc:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002dff0; continue; } }
  case 0x8002dfd4:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002dff0; continue; } }
  case 0x8002dfdc:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002dff0:
    v0 = (a1 + t0) | 0;
    v0 = (v0 + 1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 - t1) | 0; if (c) { pc = 0x8002e03c; continue; } }
  case 0x8002e008:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002e03c; continue; } }
  case 0x8002e018:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002e03c; continue; } }
  case 0x8002e020:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002e03c; continue; } }
  case 0x8002e028:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002e03c:
    v0 = (a1 - t0) | 0;
    v0 = (v0 + -1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 + t1) | 0; if (c) { pc = 0x8002e088; continue; } }
  case 0x8002e054:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002e088; continue; } }
  case 0x8002e064:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002e088; continue; } }
  case 0x8002e06c:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002e088; continue; } }
  case 0x8002e074:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002e088:
    v0 = (a1 - t0) | 0;
    v0 = (v0 + -1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 - t1) | 0; if (c) { pc = 0x8002e0d4; continue; } }
  case 0x8002e0a0:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002e0d4; continue; } }
  case 0x8002e0b0:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002e0d4; continue; } }
  case 0x8002e0b8:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002e0d4; continue; } }
  case 0x8002e0c0:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002e0d4:
    v0 = (a1 + t2) | 0;
    v0 = (v0 + 1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 + t3) | 0; if (c) { pc = 0x8002e120; continue; } }
  case 0x8002e0ec:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002e120; continue; } }
  case 0x8002e0fc:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002e120; continue; } }
  case 0x8002e104:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002e120; continue; } }
  case 0x8002e10c:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002e120:
    v0 = (a1 + t2) | 0;
    v0 = (v0 + 1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 - t3) | 0; if (c) { pc = 0x8002e16c; continue; } }
  case 0x8002e138:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002e16c; continue; } }
  case 0x8002e148:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002e16c; continue; } }
  case 0x8002e150:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002e16c; continue; } }
  case 0x8002e158:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002e16c:
    v0 = (a1 - t2) | 0;
    v0 = (v0 + -1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 + t3) | 0; if (c) { pc = 0x8002e1b8; continue; } }
  case 0x8002e184:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002e1b8; continue; } }
  case 0x8002e194:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002e1b8; continue; } }
  case 0x8002e19c:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002e1b8; continue; } }
  case 0x8002e1a4:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002e1b8:
    v0 = (a1 - t2) | 0;
    v0 = (v0 + -1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v1 = (a2 - t3) | 0; if (c) { pc = 0x8002e204; continue; } }
  case 0x8002e1d0:
    v0 = v1 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002e204; continue; } }
  case 0x8002e1e0:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002e204; continue; } }
  case 0x8002e1e8:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002e204; continue; } }
  case 0x8002e1f0:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t4) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1);
  case 0x8002e204:
    v0 = (t5 + -1) | 0;
    v1 = t2 << 16;
    v1 = v1 >> 15;
    v1 = (v0 - v1) | 0;
    v0 = v1 << 16;
    { const c = (v0 | 0) >= 0; t5 = v1 | 0; if (c) { pc = 0x8002e234; continue; } }
  case 0x8002e220:
    v0 = t0 << 16;
    v0 = v0 >> 15;
    v0 = (v0 + -2) | 0;
    t5 = (v1 + v0) | 0;
    t0 = (t0 + -1) | 0;
  case 0x8002e234:
    v1 = (t2 + 1) | 0;
    t2 = v1 | 0;
    v0 = t0 << 16;
    v1 = v1 << 16;
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = t2 << 16; if (c) { pc = 0x8002dd28; continue; } }
  case 0x8002e250:
     return [v0, v1];
  default: throw new Error(`x8002dd08: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002e894, translated instruction by instruction (212 instructions).
export function* x8002e894(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002e894;
  for (;;) switch (pc) {
  case 0x8002e894:
    sp = (sp + -48) | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = a0 | 0;
    m.write(((sp) + 40) >>> 0, s6 >>> 0, 4);
    s6 = a1 | 0;
    v0 = (a3 - a1) | 0;
    a3 = m.read(((sp) + 64) >>> 0, 4) | 0;
    a2 = (a2 - a0) | 0;
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    s3 = a2 | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = v0 | 0;
    m.write(((sp) + 36) >>> 0, s5 >>> 0, 4);
    s5 = m.read(((sp) + 68) >>> 0, 1);
    a2 = a2 << 16;
    m.write(((sp) + 44) >>> 0, 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    { const c = (a2 | 0) !== 0; m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x8002e938; continue; } }
  case 0x8002e8e0:
    v0 = v0 << 16;
    { const c = (v0 | 0) !== 0; v0 = s3 << 16; if (c) { pc = 0x8002e93c; continue; } }
  case 0x8002e8ec:
    v0 = a0 << 16;
    a2 = v0 >> 16;
    { const c = (a2 | 0) < 0; v0 = a1 << 16; if (c) { pc = 0x8002ebb8; continue; } }
  case 0x8002e8fc:
    a0 = v0 >> 16;
    { const c = (a0 | 0) < 0; v0 = (a2 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002ebb8; continue; } }
  case 0x8002e908:
    { const c = (v0 | 0) === 0; v0 = (a0 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002ebb8; continue; } }
  case 0x8002e910:
    { const c = (v0 | 0) === 0; v1 = 0x800b0000 | 0; if (c) { pc = 0x8002ebb8; continue; } }
  case 0x8002e918:
    v1 = (v1 + 7200) | 0;
    v0 = a0 << 2;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 6;
    v0 = (v0 + v1) | 0;
    v0 = (v0 + a2) | 0;
    m.write(((v0) + 0) >>> 0, a3 & 0xff, 1); pc = 0x8002ebb8; continue;
  case 0x8002e938:
    v0 = s3 << 16;
  case 0x8002e93c:
    a0 = v0 >> 16;
    { const c = (a0 | 0) >= 0; s1 = a0 | 0; if (c) { pc = 0x8002e94c; continue; } }
  case 0x8002e948:
    s1 = (-s1) | 0;
  case 0x8002e94c:
    v0 = s2 << 16;
    v1 = v0 >> 16;
    { const c = (v1 | 0) >= 0; s0 = v1 | 0; if (c) { pc = 0x8002e960; continue; } }
  case 0x8002e95c:
    s0 = (-s0) | 0;
  case 0x8002e960:
    v0 = (s0 | 0) < (s1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002ea44; continue; } }
  case 0x8002e96c:
    { const c = (a0 | 0) >= 0; s0 = 0x10000 | 0; if (c) { pc = 0x8002e978; continue; } }
  case 0x8002e974:
    s0 = 0xffff0000 | 0;
  case 0x8002e978:
    { const c = (v1 | 0) >= 0;  if (c) { pc = 0x8002e9dc; continue; } }
  case 0x8002e980:
    a0 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002e988:
    a2 = (0 + 0) | 0;
    a3 = 0x40f00000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002e99c:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002e9a8:
    [hi, lo] = div(0, v0, true);
    { const c = (s1 | 0) !== 0;  if (c) { pc = 0x8002e9b8; continue; } }
  case 0x8002e9b4:
    throw new Error("break 7 at 0x8002e9b4");
  case 0x8002e9b8:
    at = (0 + -1) | 0;
    { const c = (s1 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8002e9d0; continue; } }
  case 0x8002e9c4:
    { const c = (v0 | 0) !== (at | 0);  if (c) { pc = 0x8002e9d0; continue; } }
  case 0x8002e9cc:
    throw new Error("break 6 at 0x8002e9cc");
  case 0x8002e9d0:
    v0 = lo;
    t1 = (v0 + -1) | 0; pc = 0x8002ea38; continue;
  case 0x8002e9dc:
    a0 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002e9e4:
    a2 = (0 + 0) | 0;
    a3 = 0x40f00000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002e9f8:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002ea04:
    [hi, lo] = div(0, v0, true);
    { const c = (s1 | 0) !== 0;  if (c) { pc = 0x8002ea14; continue; } }
  case 0x8002ea10:
    throw new Error("break 7 at 0x8002ea10");
  case 0x8002ea14:
    at = (0 + -1) | 0;
    { const c = (s1 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8002ea2c; continue; } }
  case 0x8002ea20:
    { const c = (v0 | 0) !== (at | 0);  if (c) { pc = 0x8002ea2c; continue; } }
  case 0x8002ea28:
    throw new Error("break 6 at 0x8002ea28");
  case 0x8002ea2c:
    v0 = lo;
    t1 = (v0 + 1) | 0;
  case 0x8002ea38:
    v0 = s3 << 16;
    v0 = v0 >> 16; pc = 0x8002eb18; continue;
  case 0x8002ea44:
    { const c = (a0 | 0) >= 0;  if (c) { pc = 0x8002eaa8; continue; } }
  case 0x8002ea4c:
     [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002ea54:
    a2 = (0 + 0) | 0;
    a3 = 0x40f00000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002ea68:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002ea74:
    [hi, lo] = div(0, v0, true);
    { const c = (s0 | 0) !== 0;  if (c) { pc = 0x8002ea84; continue; } }
  case 0x8002ea80:
    throw new Error("break 7 at 0x8002ea80");
  case 0x8002ea84:
    at = (0 + -1) | 0;
    { const c = (s0 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8002ea9c; continue; } }
  case 0x8002ea90:
    { const c = (v0 | 0) !== (at | 0);  if (c) { pc = 0x8002ea9c; continue; } }
  case 0x8002ea98:
    throw new Error("break 6 at 0x8002ea98");
  case 0x8002ea9c:
    v0 = lo;
    s0 = (v0 + -1) | 0; pc = 0x8002eb04; continue;
  case 0x8002eaa8:
     [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002eab0:
    a2 = (0 + 0) | 0;
    a3 = 0x40f00000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002eac4:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002ead0:
    [hi, lo] = div(0, v0, true);
    { const c = (s0 | 0) !== 0;  if (c) { pc = 0x8002eae0; continue; } }
  case 0x8002eadc:
    throw new Error("break 7 at 0x8002eadc");
  case 0x8002eae0:
    at = (0 + -1) | 0;
    { const c = (s0 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8002eaf8; continue; } }
  case 0x8002eaec:
    { const c = (v0 | 0) !== (at | 0);  if (c) { pc = 0x8002eaf8; continue; } }
  case 0x8002eaf4:
    throw new Error("break 6 at 0x8002eaf4");
  case 0x8002eaf8:
    v0 = lo;
    s0 = (v0 + 1) | 0;
  case 0x8002eb04:
    v0 = s2 << 16;
    v0 = v0 >> 16;
    { const c = (v0 | 0) >= 0; t1 = 0x10000 | 0; if (c) { pc = 0x8002eb18; continue; } }
  case 0x8002eb14:
    t1 = 0xffff0000 | 0;
  case 0x8002eb18:
    { const c = (v0 | 0) >= 0; t0 = v0 | 0; if (c) { pc = 0x8002eb24; continue; } }
  case 0x8002eb20:
    t0 = (-t0) | 0;
  case 0x8002eb24:
    v0 = t0 & 65535;
    { const c = (v0 | 0) === 0; a3 = 0 | 0; if (c) { pc = 0x8002ebb8; continue; } }
  case 0x8002eb30:
    v0 = s6 << 16;
    t4 = v0 >> 16;
    t2 = 0 | 65535;
    v0 = 0x80200000 | 0;
    t5 = (v0 + -5984) | 0;
    t3 = s5 << 1;
    a2 = a3 & 65535;
  case 0x8002eb4c:
    [hi, lo] = mult(a2, t1, true);
    a0 = lo;
    { const c = (a0 | 0) >= 0; v0 = a0 | 0; if (c) { pc = 0x8002eb60; continue; } }
  case 0x8002eb5c:
    v0 = (a0 + t2) | 0;
  case 0x8002eb60:
    v0 = v0 >> 16;
    v0 = (t4 + v0) | 0;
    v0 = v0 << 2;
    v0 = (v0 + t5) | 0;
    a1 = (t3 + v0) | 0;
    v1 = (m.read(((a1) + 0) >>> 0, 2) << 16) >> 16;
    v0 = (0 + 32767) | 0;
    { const c = (v1 | 0) !== (v0 | 0); [hi, lo] = mult(a2, s0, true); if (c) { pc = 0x8002eba0; continue; } }
  case 0x8002eb84:
    v0 = lo;
    { const c = (v0 | 0) >= 0;  if (c) { pc = 0x8002eb94; continue; } }
  case 0x8002eb90:
    v0 = (v0 + t2) | 0;
  case 0x8002eb94:
    v0 = v0 >> 16;
    v0 = (s4 + v0) | 0;
    m.write(((a1) + 0) >>> 0, v0 & 0xffff, 2);
  case 0x8002eba0:
    a3 = (a3 + 1) | 0;
    v0 = a3 & 65535;
    v1 = t0 & 65535;
    v0 = (v0 >>> 0) < (v1 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; a2 = a3 & 65535; if (c) { pc = 0x8002eb4c; continue; } }
  case 0x8002ebb8:
    s6 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return [v0, v1];
  default: throw new Error(`x8002e894: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002ebe4, translated instruction by instruction (310 instructions).
export function* x8002ebe4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002ebe4;
  for (;;) switch (pc) {
  case 0x8002ebe4:
    sp = (sp + -72) | 0;
    m.write(((sp) + 60) >>> 0, s7 >>> 0, 4);
    s7 = a0 | 0;
    m.write(((sp) + 56) >>> 0, s6 >>> 0, 4);
    s6 = a1 | 0;
    m.write(((sp) + 48) >>> 0, s4 >>> 0, 4);
    s4 = a2 | 0;
    m.write(((sp) + 44) >>> 0, s3 >>> 0, 4);
    s3 = a3 | 0;
    v1 = a1 << 16;
    t1 = m.read(((sp) + 88) >>> 0, 4) | 0;
    t0 = m.read(((sp) + 92) >>> 0, 4) | 0;
    v0 = a3 << 16;
    m.write(((sp) + 52) >>> 0, s5 >>> 0, 4);
    s5 = m.read(((sp) + 96) >>> 0, 1);
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    m.write(((sp) + 68) >>> 0, 0, 4);
    m.write(((sp) + 64) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4);
    fp = t0 | 0;
    { const c = (v0 | 0) === 0; m.write(((sp) + 24) >>> 0, t1 & 0xffff, 2); if (c) { pc = 0x8002ec54; continue; } }
  case 0x8002ec44:
    s7 = a2 | 0;
    s4 = a0 | 0;
    s6 = a3 | 0;
    s3 = a1 | 0;
  case 0x8002ec54:
    v1 = s3 << 16;
    v0 = t0 << 16;
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = s4 | 0; if (c) { pc = 0x8002ec7c; continue; } }
  case 0x8002ec68:
    s4 = t1 | 0;
    m.write(((sp) + 24) >>> 0, v0 & 0xffff, 2);
    v0 = s3 | 0;
    s3 = t0 | 0;
    fp = v0 | 0;
  case 0x8002ec7c:
    v1 = s6 << 16;
    v0 = s3 << 16;
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = s7 | 0; if (c) { pc = 0x8002eca4; continue; } }
  case 0x8002ec90:
    s7 = s4 | 0;
    s4 = v0 | 0;
    v0 = s6 | 0;
    s6 = s3 | 0;
    s3 = v0 | 0;
  case 0x8002eca4:
    a3 = 0 | 0;
    v0 = 0x80200000 | 0;
    a1 = (v0 + -5984) | 0;
    a0 = (0 + 32767) | 0;
  case 0x8002ecb4:
    v1 = a3 << 16;
    v0 = (a3 + 1) | 0;
    a3 = v0 | 0;
    v1 = v1 >> 14;
    v1 = (v1 + a1) | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    v0 = (v0 | 0) < 240 ? 1 : 0;
    m.write(((v1) + 2) >>> 0, a0 & 0xffff, 2);
    { const c = (v0 | 0) !== 0; m.write(((v1) + 0) >>> 0, a0 & 0xffff, 2); if (c) { pc = 0x8002ecb4; continue; } }
  case 0x8002ece0:
    s1 = s7 << 16;
    s1 = s1 >> 16;
    a0 = s1 | 0;
    s0 = s6 << 16;
    s0 = s0 >> 16;
    a1 = s0 | 0;
    a2 = s4 << 16;
    a2 = a2 >> 16;
    a3 = s3 << 16;
    a3 = a3 >> 16;
    s2 = s5 & 255;
    m.write(((sp) + 16) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002e894, a0, a1, a2, a3);
  case 0x8002ed18:
    a0 = s1 | 0;
    a1 = s0 | 0;
    a3 = fp << 16;
    a3 = a3 >> 16;
    t5 = m.read(((sp) + 24) >>> 0, 2);
    v0 = (0 + 1) | 0;
    m.write(((sp) + 16) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    a2 = t5 << 16;
    a2 = a2 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8002e894, a0, a1, a2, a3);
  case 0x8002ed44:
    a3 = 0 | 0;
    v0 = 0x80200000 | 0;
    t2 = (v0 + -5984) | 0;
    t0 = (0 + 32767) | 0;
    t1 = (0 + 319) | 0;
    v0 = a3 << 16;
  case 0x8002ed5c:
    v0 = v0 >> 14;
    v1 = (v0 + t2) | 0;
    a1 = (m.read(((v1) + 0) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((v1) + 0) >>> 0, 2);
    { const c = (a1 | 0) === (t0 | 0); v0 = (a3 + 1) | 0; if (c) { pc = 0x8002edc4; continue; } }
  case 0x8002ed74:
    v0 = (m.read(((v1) + 2) >>> 0, 2) << 16) >> 16;
    a0 = m.read(((v1) + 2) >>> 0, 2);
    { const c = (v0 | 0) === (t0 | 0); v0 = (v0 | 0) < (a1 | 0) ? 1 : 0; if (c) { pc = 0x8002edc0; continue; } }
  case 0x8002ed84:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002ed94; continue; } }
  case 0x8002ed8c:
    m.write(((v1) + 0) >>> 0, a0 & 0xffff, 2);
    m.write(((v1) + 2) >>> 0, a2 & 0xffff, 2);
  case 0x8002ed94:
    v0 = (m.read(((v1) + 0) >>> 0, 2) << 16) >> 16;
    { const c = (v0 | 0) > 0;  if (c) { pc = 0x8002eda8; continue; } }
  case 0x8002eda4:
    m.write(((v1) + 0) >>> 0, 0 & 0xffff, 2);
  case 0x8002eda8:
    v0 = (m.read(((v1) + 2) >>> 0, 2) << 16) >> 16;
    v0 = (v0 | 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (a3 + 1) | 0; if (c) { pc = 0x8002edc4; continue; } }
  case 0x8002edbc:
    m.write(((v1) + 2) >>> 0, t1 & 0xffff, 2);
  case 0x8002edc0:
    v0 = (a3 + 1) | 0;
  case 0x8002edc4:
    a3 = v0 | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    v0 = (v0 | 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a3 << 16; if (c) { pc = 0x8002ed5c; continue; } }
  case 0x8002eddc:
    a3 = 0 | 0;
    v0 = 0x80200000 | 0;
    t4 = (v0 + -5984) | 0;
    t2 = (0 + 32767) | 0;
    v0 = 0x800b0000 | 0;
    t3 = (v0 + 7200) | 0;
  case 0x8002edf4:
    t0 = a3 << 16;
    v0 = t0 >> 14;
    v0 = (v0 + t4) | 0;
    a0 = (m.read(((v0) + 0) >>> 0, 2) << 16) >> 16;
    v1 = m.read(((v0) + 0) >>> 0, 2);
    { const c = (a0 | 0) === (t2 | 0);  if (c) { pc = 0x8002ee78; continue; } }
  case 0x8002ee10:
    v0 = (m.read(((v0) + 2) >>> 0, 2) << 16) >> 16;
    { const c = (v0 | 0) === (t2 | 0); v0 = (v0 | 0) < (a0 | 0) ? 1 : 0; if (c) { pc = 0x8002ee78; continue; } }
  case 0x8002ee20:
    { const c = (v0 | 0) !== 0; a2 = v1 | 0; if (c) { pc = 0x8002ee78; continue; } }
  case 0x8002ee28:
    v0 = 0x80200000 | 0;
    t1 = (v0 + -5984) | 0;
    a1 = a2 << 16;
  case 0x8002ee34:
    v1 = (a2 + 1) | 0;
    a2 = v1 | 0;
    v0 = t0 >> 16;
    a0 = v0 << 2;
    v0 = (a0 + v0) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t3) | 0;
    a1 = a1 >> 16;
    v0 = (v0 + a1) | 0;
    a0 = (a0 + t1) | 0;
    v1 = v1 << 16;
    m.write(((v0) + 0) >>> 0, s5 & 0xff, 1);
    v0 = (m.read(((a0) + 2) >>> 0, 2) << 16) >> 16;
    v1 = v1 >> 16;
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; a1 = a2 << 16; if (c) { pc = 0x8002ee34; continue; } }
  case 0x8002ee78:
    v0 = (a3 + 1) | 0;
    a3 = v0 | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    v0 = (v0 | 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = 0x80200000 | 0; if (c) { pc = 0x8002edf4; continue; } }
  case 0x8002ee94:
    a3 = 0 | 0;
    a1 = (v0 + -5984) | 0;
    a0 = (0 + 32767) | 0;
  case 0x8002eea0:
    v1 = a3 << 16;
    v0 = (a3 + 1) | 0;
    a3 = v0 | 0;
    v1 = v1 >> 14;
    v1 = (v1 + a1) | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    v0 = (v0 | 0) < 240 ? 1 : 0;
    m.write(((v1) + 2) >>> 0, a0 & 0xffff, 2);
    { const c = (v0 | 0) !== 0; m.write(((v1) + 0) >>> 0, a0 & 0xffff, 2); if (c) { pc = 0x8002eea0; continue; } }
  case 0x8002eecc:
    v0 = s3 << 16;
    s3 = v0 >> 16;
    v0 = fp << 16;
    s2 = v0 >> 16;
    { const c = (s3 | 0) === (s2 | 0); a0 = s7 << 16; if (c) { pc = 0x8002f088; continue; } }
  case 0x8002eee4:
    a0 = a0 >> 16;
    a1 = s6 << 16;
    a1 = a1 >> 16;
    a3 = s2 | 0;
    t5 = m.read(((sp) + 24) >>> 0, 2);
    s1 = s5 & 255;
    m.write(((sp) + 16) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0 >>> 0, 4);
    s0 = t5 << 16;
    s0 = s0 >> 16;
    a2 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002e894, a0, a1, a2, a3);
  case 0x8002ef14:
    a0 = s4 << 16;
    a0 = a0 >> 16;
    a1 = s3 | 0;
    a2 = s0 | 0;
    a3 = s2 | 0;
    v0 = (0 + 1) | 0;
    m.write(((sp) + 16) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002e894, a0, a1, a2, a3);
  case 0x8002ef38:
    a3 = 0 | 0;
    v0 = 0x80200000 | 0;
    t2 = (v0 + -5984) | 0;
    t0 = (0 + 32767) | 0;
    t1 = (0 + 319) | 0;
    v0 = a3 << 16;
  case 0x8002ef50:
    v0 = v0 >> 14;
    v1 = (v0 + t2) | 0;
    a1 = (m.read(((v1) + 0) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((v1) + 0) >>> 0, 2);
    { const c = (a1 | 0) === (t0 | 0); v0 = (a3 + 1) | 0; if (c) { pc = 0x8002efb8; continue; } }
  case 0x8002ef68:
    v0 = (m.read(((v1) + 2) >>> 0, 2) << 16) >> 16;
    a0 = m.read(((v1) + 2) >>> 0, 2);
    { const c = (v0 | 0) === (t0 | 0); v0 = (v0 | 0) < (a1 | 0) ? 1 : 0; if (c) { pc = 0x8002efb4; continue; } }
  case 0x8002ef78:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002ef88; continue; } }
  case 0x8002ef80:
    m.write(((v1) + 0) >>> 0, a0 & 0xffff, 2);
    m.write(((v1) + 2) >>> 0, a2 & 0xffff, 2);
  case 0x8002ef88:
    v0 = (m.read(((v1) + 0) >>> 0, 2) << 16) >> 16;
    { const c = (v0 | 0) > 0;  if (c) { pc = 0x8002ef9c; continue; } }
  case 0x8002ef98:
    m.write(((v1) + 0) >>> 0, 0 & 0xffff, 2);
  case 0x8002ef9c:
    v0 = (m.read(((v1) + 2) >>> 0, 2) << 16) >> 16;
    v0 = (v0 | 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (a3 + 1) | 0; if (c) { pc = 0x8002efb8; continue; } }
  case 0x8002efb0:
    m.write(((v1) + 2) >>> 0, t1 & 0xffff, 2);
  case 0x8002efb4:
    v0 = (a3 + 1) | 0;
  case 0x8002efb8:
    a3 = v0 | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    v0 = (v0 | 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a3 << 16; if (c) { pc = 0x8002ef50; continue; } }
  case 0x8002efd0:
    a3 = 0 | 0;
    v0 = 0x80200000 | 0;
    t4 = (v0 + -5984) | 0;
    t2 = (0 + 32767) | 0;
    v0 = 0x800b0000 | 0;
    t3 = (v0 + 7200) | 0;
    t0 = a3 << 16;
  case 0x8002efec:
    v0 = t0 >> 14;
    v0 = (v0 + t4) | 0;
    a0 = (m.read(((v0) + 0) >>> 0, 2) << 16) >> 16;
    v1 = m.read(((v0) + 0) >>> 0, 2);
    { const c = (a0 | 0) === (t2 | 0);  if (c) { pc = 0x8002f06c; continue; } }
  case 0x8002f004:
    v0 = (m.read(((v0) + 2) >>> 0, 2) << 16) >> 16;
    { const c = (v0 | 0) === (t2 | 0); v0 = (v0 | 0) < (a0 | 0) ? 1 : 0; if (c) { pc = 0x8002f06c; continue; } }
  case 0x8002f014:
    { const c = (v0 | 0) !== 0; a2 = v1 | 0; if (c) { pc = 0x8002f06c; continue; } }
  case 0x8002f01c:
    v0 = 0x80200000 | 0;
    t1 = (v0 + -5984) | 0;
    a1 = a2 << 16;
  case 0x8002f028:
    v1 = (a2 + 1) | 0;
    a2 = v1 | 0;
    v0 = t0 >> 16;
    a0 = v0 << 2;
    v0 = (a0 + v0) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t3) | 0;
    a1 = a1 >> 16;
    v0 = (v0 + a1) | 0;
    a0 = (a0 + t1) | 0;
    v1 = v1 << 16;
    m.write(((v0) + 0) >>> 0, s5 & 0xff, 1);
    v0 = (m.read(((a0) + 2) >>> 0, 2) << 16) >> 16;
    v1 = v1 >> 16;
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; a1 = a2 << 16; if (c) { pc = 0x8002f028; continue; } }
  case 0x8002f06c:
    v0 = (a3 + 1) | 0;
    a3 = v0 | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    v0 = (v0 | 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; t0 = a3 << 16; if (c) { pc = 0x8002efec; continue; } }
  case 0x8002f088:
    fp = m.read(((sp) + 64) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 72) | 0;
     return [v0, v1];
  default: throw new Error(`x8002ebe4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002f3c0, translated instruction by instruction (17 instructions).
export function* x8002f3c0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002f3c0;
  for (;;) switch (pc) {
  case 0x8002f3c0:
    sp = (sp + -24) | 0;
    v0 = 0x801f0000 | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = (v0 + 26264) | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
    a0 = m.read(((s0) + 16) >>> 0, 2);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x8002f3f0; continue; } }
  case 0x8002f3e4:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x8002f3ec:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x8002f3f0:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x8002f3c0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002f4cc, translated instruction by instruction (262 instructions).
export function* x8002f4cc(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002f4cc;
  for (;;) switch (pc) {
  case 0x8002f4cc:
    sp = (sp + -40) | 0;
    a2 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a3 = (v0 + 7200) | 0;
    m.write(((sp) + 36) >>> 0, 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4);
  case 0x8002f4e4:
    a1 = 0 | 0;
    v1 = a2 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a3) | 0;
    v0 = a1 & 65535;
  case 0x8002f500:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a1 & 65535; if (c) { pc = 0x8002f500; continue; } }
  case 0x8002f51c:
    a2 = (a2 + 1) | 0;
    v0 = a2 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 255; if (c) { pc = 0x8002f4e4; continue; } }
  case 0x8002f530:
    { const c = (v0 | 0) !== 0; v0 = 0 | 40960; if (c) { pc = 0x8002f6bc; continue; } }
  case 0x8002f538:
    v0 = (0 + 30720) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 256) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    v0 = (0 + 120) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x8002f578; continue; } }
  case 0x8002f56c:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x8002f574:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x8002f578:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8002f5b0:
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    t3 = (v0 + 7200) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    t4 = (0 + 239) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1);
  case 0x8002f5f8:
    a2 = 0 | 0;
    v0 = a1 << 16;
    a3 = v0 >> 16;
    t2 = (a3 | 0) < 240 ? 1 : 0;
    v0 = a3 << 2;
    v0 = (v0 + a3) | 0;
    v0 = v0 << 6;
    t1 = (v0 + t3) | 0;
    v0 = (t4 - a1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    v0 = a0 << 2;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 6;
    t0 = (v0 + t3) | 0;
    v0 = a2 << 16;
  case 0x8002f638:
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0;  if (c) { pc = 0x8002f668; continue; } }
  case 0x8002f644:
    { const c = (a3 | 0) < 0; v0 = (v1 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002f660; continue; } }
  case 0x8002f64c:
    { const c = (v0 | 0) === 0; v0 = a2 << 16; if (c) { pc = 0x8002f664; continue; } }
  case 0x8002f654:
    { const c = (t2 | 0) === 0; v0 = (t1 + v1) | 0; if (c) { pc = 0x8002f660; continue; } }
  case 0x8002f65c:
    m.write(((v0) + 0) >>> 0, a1 & 0xff, 1);
  case 0x8002f660:
    v0 = a2 << 16;
  case 0x8002f664:
    v1 = v0 >> 16;
  case 0x8002f668:
    { const c = (v1 | 0) < 0;  if (c) { pc = 0x8002f68c; continue; } }
  case 0x8002f670:
    { const c = (a0 | 0) < 0; v0 = (v1 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002f68c; continue; } }
  case 0x8002f678:
    { const c = (v0 | 0) === 0; v0 = (a0 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002f68c; continue; } }
  case 0x8002f680:
    { const c = (v0 | 0) === 0; v0 = (t0 + v1) | 0; if (c) { pc = 0x8002f68c; continue; } }
  case 0x8002f688:
    m.write(((v0) + 0) >>> 0, a1 & 0xff, 1);
  case 0x8002f68c:
    a2 = (a2 + 1) | 0;
    v0 = a2 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a2 << 16; if (c) { pc = 0x8002f638; continue; } }
  case 0x8002f6a0:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 120 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 32768; if (c) { pc = 0x8002f5f8; continue; } }
  case 0x8002f6b4:
    a1 = 0 | 0; pc = 0x8002f830; continue;
  case 0x8002f6bc:
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 512) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    v0 = (0 + 160) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x8002f6f8; continue; } }
  case 0x8002f6ec:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x8002f6f4:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x8002f6f8:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8002f730:
    a2 = 0 | 0;
    v0 = 0x800b0000 | 0;
    t1 = (v0 + 7200) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    t2 = (0 + 319) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1);
  case 0x8002f778:
    a1 = 0 | 0;
    v0 = a2 << 16;
    a3 = v0 >> 16;
    t0 = (a3 | 0) < 320 ? 1 : 0;
    v0 = (t2 - a2) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
  case 0x8002f794:
    { const c = (a3 | 0) < 0; v0 = a1 << 16; if (c) { pc = 0x8002f7cc; continue; } }
  case 0x8002f79c:
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0;  if (c) { pc = 0x8002f7cc; continue; } }
  case 0x8002f7a8:
    { const c = (t0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002f7cc; continue; } }
  case 0x8002f7b0:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002f7cc; continue; } }
  case 0x8002f7b8:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t1) | 0;
    v0 = (v0 + a3) | 0;
    m.write(((v0) + 0) >>> 0, a2 & 0xff, 1);
  case 0x8002f7cc:
    { const c = (a0 | 0) < 0; v0 = a1 << 16; if (c) { pc = 0x8002f804; continue; } }
  case 0x8002f7d4:
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002f804; continue; } }
  case 0x8002f7e0:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002f804; continue; } }
  case 0x8002f7e8:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002f804; continue; } }
  case 0x8002f7f0:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t1) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a2 & 0xff, 1);
  case 0x8002f804:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002f794; continue; } }
  case 0x8002f818:
    a2 = (a2 + 1) | 0;
    v0 = a2 & 65535;
    v0 = (v0 >>> 0) < 160 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 32768; if (c) { pc = 0x8002f778; continue; } }
  case 0x8002f82c:
    a1 = 0 | 0;
  case 0x8002f830:
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x8002f83c:
    a0 = (0 + 21) | 0;
    a1 = 0x800b0000 | 0;
    a1 = (a1 + 7200) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8002f850:
    v0 = (0 + 13) | 0;
    m.write(((0x8007913c) + 910) >>> 0, v0 & 0xff, 1);
    a0 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002f860:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002f874:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002f880:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x8002f8c0; continue; } }
  case 0x8002f8b0:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x8002f8bc:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x8002f8c0:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x8002f8d0:
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8002f4cc: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002f8e4, translated instruction by instruction (260 instructions).
export function* x8002f8e4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002f8e4;
  for (;;) switch (pc) {
  case 0x8002f8e4:
    sp = (sp + -40) | 0;
    a2 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a3 = (v0 + 7200) | 0;
    m.write(((sp) + 36) >>> 0, 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4);
  case 0x8002f8fc:
    a1 = 0 | 0;
    v1 = a2 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a3) | 0;
    v0 = a1 & 65535;
  case 0x8002f918:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a1 & 65535; if (c) { pc = 0x8002f918; continue; } }
  case 0x8002f934:
    a2 = (a2 + 1) | 0;
    v0 = a2 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 255; if (c) { pc = 0x8002f8fc; continue; } }
  case 0x8002f948:
    { const c = (v0 | 0) !== 0; v0 = (0 + 512) | 0; if (c) { pc = 0x8002fad0; continue; } }
  case 0x8002f950:
    v0 = (0 + 256) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, 0 >>> 0, 4);
    a0 = m.read(((s0) + 16) >>> 0, 2);
    v0 = (0 + 120) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x8002f98c; continue; } }
  case 0x8002f980:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x8002f988:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x8002f98c:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8002f9c4:
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    t3 = (v0 + 7200) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    t4 = (0 + 239) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1);
    a2 = 0 | 0;
  case 0x8002fa10:
    v0 = a1 << 16;
    a3 = v0 >> 16;
    t2 = (a3 | 0) < 240 ? 1 : 0;
    v0 = a3 << 2;
    v0 = (v0 + a3) | 0;
    v0 = v0 << 6;
    t1 = (v0 + t3) | 0;
    v0 = (t4 - a1) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    v0 = a0 << 2;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 6;
    t0 = (v0 + t3) | 0;
    v0 = a2 << 16;
  case 0x8002fa4c:
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0;  if (c) { pc = 0x8002fa7c; continue; } }
  case 0x8002fa58:
    { const c = (a3 | 0) < 0; v0 = (v1 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002fa74; continue; } }
  case 0x8002fa60:
    { const c = (v0 | 0) === 0; v0 = a2 << 16; if (c) { pc = 0x8002fa78; continue; } }
  case 0x8002fa68:
    { const c = (t2 | 0) === 0; v0 = (t1 + v1) | 0; if (c) { pc = 0x8002fa74; continue; } }
  case 0x8002fa70:
    m.write(((v0) + 0) >>> 0, a1 & 0xff, 1);
  case 0x8002fa74:
    v0 = a2 << 16;
  case 0x8002fa78:
    v1 = v0 >> 16;
  case 0x8002fa7c:
    { const c = (v1 | 0) < 0;  if (c) { pc = 0x8002faa0; continue; } }
  case 0x8002fa84:
    { const c = (a0 | 0) < 0; v0 = (v1 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002faa0; continue; } }
  case 0x8002fa8c:
    { const c = (v0 | 0) === 0; v0 = (a0 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002faa0; continue; } }
  case 0x8002fa94:
    { const c = (v0 | 0) === 0; v0 = (t0 + v1) | 0; if (c) { pc = 0x8002faa0; continue; } }
  case 0x8002fa9c:
    m.write(((v0) + 0) >>> 0, a1 & 0xff, 1);
  case 0x8002faa0:
    a2 = (a2 + 1) | 0;
    v0 = a2 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a2 << 16; if (c) { pc = 0x8002fa4c; continue; } }
  case 0x8002fab4:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 120 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a2 = 0 | 0; if (c) { pc = 0x8002fa10; continue; } }
  case 0x8002fac8:
    a0 = (0 + 21) | 0; pc = 0x8002fc3c; continue;
  case 0x8002fad0:
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, 0 >>> 0, 4);
    a0 = m.read(((s0) + 16) >>> 0, 2);
    v0 = (0 + 160) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x8002fb08; continue; } }
  case 0x8002fafc:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x8002fb04:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x8002fb08:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8002fb40:
    a2 = 0 | 0;
    v0 = 0x800b0000 | 0;
    t1 = (v0 + 7200) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    t2 = (0 + 319) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1);
  case 0x8002fb88:
    a1 = 0 | 0;
    v0 = a2 << 16;
    a3 = v0 >> 16;
    t0 = (a3 | 0) < 320 ? 1 : 0;
    v0 = (t2 - a2) | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
  case 0x8002fba4:
    { const c = (a3 | 0) < 0; v0 = a1 << 16; if (c) { pc = 0x8002fbdc; continue; } }
  case 0x8002fbac:
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0;  if (c) { pc = 0x8002fbdc; continue; } }
  case 0x8002fbb8:
    { const c = (t0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002fbdc; continue; } }
  case 0x8002fbc0:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002fbdc; continue; } }
  case 0x8002fbc8:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t1) | 0;
    v0 = (v0 + a3) | 0;
    m.write(((v0) + 0) >>> 0, a2 & 0xff, 1);
  case 0x8002fbdc:
    { const c = (a0 | 0) < 0; v0 = a1 << 16; if (c) { pc = 0x8002fc14; continue; } }
  case 0x8002fbe4:
    v1 = v0 >> 16;
    { const c = (v1 | 0) < 0; v0 = (a0 | 0) < 320 ? 1 : 0; if (c) { pc = 0x8002fc14; continue; } }
  case 0x8002fbf0:
    { const c = (v0 | 0) === 0; v0 = (v1 | 0) < 240 ? 1 : 0; if (c) { pc = 0x8002fc14; continue; } }
  case 0x8002fbf8:
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8002fc14; continue; } }
  case 0x8002fc00:
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + t1) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, a2 & 0xff, 1);
  case 0x8002fc14:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002fba4; continue; } }
  case 0x8002fc28:
    a2 = (a2 + 1) | 0;
    v0 = a2 & 65535;
    v0 = (v0 >>> 0) < 160 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 21) | 0; if (c) { pc = 0x8002fb88; continue; } }
  case 0x8002fc3c:
    a1 = 0x800b0000 | 0;
    a1 = (a1 + 7200) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8002fc4c:
    a0 = 0 | 0;
    a1 = a0 | 0;
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x8002fc60:
    v0 = (0 + 12) | 0;
    m.write(((0x8007913c) + 910) >>> 0, v0 & 0xff, 1);
    a0 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002fc70:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002fc84:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002fc90:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x8002fcd0; continue; } }
  case 0x8002fcc0:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x8002fccc:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x8002fcd0:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x8002fce0:
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8002f8e4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002fcf4, translated instruction by instruction (147 instructions).
export function* x8002fcf4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002fcf4;
  for (;;) switch (pc) {
  case 0x8002fcf4:
    sp = (sp + -48) | 0;
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    s2 = a0 | 0;
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a2 = (v0 + 7200) | 0;
    m.write(((sp) + 40) >>> 0, 0, 4);
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    a0 = 0 | 0;
  case 0x8002fd20:
    v1 = a1 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a2) | 0;
    v0 = a0 & 65535;
  case 0x8002fd38:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x8002fd38; continue; } }
  case 0x8002fd54:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x8002fd20; continue; } }
  case 0x8002fd68:
    s0 = 0 | 0;
    s1 = (0 + 194) | 0;
  case 0x8002fd70:
    a0 = (s1 - s0) | 0;
    a0 = a0 << 16;
    a0 = a0 >> 16;
    a1 = (0 + 160) | 0;
    a2 = (0 + 112) | 0;
    a3 = s0 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002dd08, a0, a1, a2, a3);
  case 0x8002fd8c:
    s0 = (s0 + 1) | 0;
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 195 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 21) | 0; if (c) { pc = 0x8002fd70; continue; } }
  case 0x8002fda0:
    a1 = 0x800b0000 | 0;
    a1 = (a1 + 7200) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8002fdb0:
    a0 = 0 | 32768;
    a1 = 0 | 0;
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x8002fdc4:
    v0 = (0 + 22) | 0;
    m.write(((0x8007913c) + 910) >>> 0, v0 & 0xff, 1);
    v0 = 0 | 49920;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, v0 >>> 0, 4);
    a0 = s2 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002fde0:
    s2 = (0 + 0) | 0;
    s3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002fdfc:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002fe08:
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    v0 = (0 + 195) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x8002fe38; continue; } }
  case 0x8002fe2c:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x8002fe34:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x8002fe38:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8002fe70:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    a0 = (0 + 255) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a1 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8002feb0:
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8002fec4:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8002fed0:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x8002ff10; continue; } }
  case 0x8002ff00:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x8002ff0c:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x8002ff10:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x8002ff20:
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return [v0, v1];
  default: throw new Error(`x8002fcf4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002ff40, translated instruction by instruction (146 instructions).
export function* x8002ff40(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002ff40;
  for (;;) switch (pc) {
  case 0x8002ff40:
    sp = (sp + -48) | 0;
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    s2 = a0 | 0;
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a2 = (v0 + 7200) | 0;
    m.write(((sp) + 40) >>> 0, 0, 4);
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    a0 = 0 | 0;
  case 0x8002ff6c:
    v1 = a1 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a2) | 0;
    v0 = a0 & 65535;
  case 0x8002ff84:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x8002ff84; continue; } }
  case 0x8002ffa0:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x8002ff6c; continue; } }
  case 0x8002ffb4:
    s0 = 0 | 0;
    s1 = (0 + 194) | 0;
  case 0x8002ffbc:
    a0 = (s1 - s0) | 0;
    a0 = a0 << 16;
    a0 = a0 >> 16;
    a1 = (0 + 160) | 0;
    a2 = (0 + 112) | 0;
    a3 = s0 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002dd08, a0, a1, a2, a3);
  case 0x8002ffd8:
    s0 = (s0 + 1) | 0;
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 195 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 21) | 0; if (c) { pc = 0x8002ffbc; continue; } }
  case 0x8002ffec:
    a1 = 0x800b0000 | 0;
    a1 = (a1 + 7200) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8002fffc:
    a0 = 0 | 0;
    a1 = a0 | 0;
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80030010:
    v0 = (0 + 21) | 0;
    m.write(((0x8007913c) + 910) >>> 0, v0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, 0 >>> 0, 4);
    a0 = s2 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x80030028:
    s2 = (0 + 0) | 0;
    s3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x80030044:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x80030050:
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    v0 = (0 + 195) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80030080; continue; } }
  case 0x80030074:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x8003007c:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x80030080:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x800300b8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    a0 = (0 + 255) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a1 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x800300f8:
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8003010c:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x80030118:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x80030158; continue; } }
  case 0x80030148:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x80030154:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x80030158:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80030168:
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return [v0, v1];
  default: throw new Error(`x8002ff40: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80030188, translated instruction by instruction (190 instructions).
export function* x80030188(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80030188;
  for (;;) switch (pc) {
  case 0x80030188:
    sp = (sp + -48) | 0;
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    s1 = a0 | 0;
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a2 = (v0 + 7200) | 0;
    m.write(((sp) + 44) >>> 0, 0, 4);
    m.write(((sp) + 40) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    a0 = 0 | 0;
  case 0x800301b8:
    v1 = a1 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a2) | 0;
    v0 = a0 & 65535;
  case 0x800301d0:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x800301d0; continue; } }
  case 0x800301ec:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x800301b8; continue; } }
  case 0x80030200:
    s2 = 0 | 0;
    s0 = (0 + 194) | 0;
    a0 = (s0 - s2) | 0;
  case 0x8003020c:
    a0 = a0 << 16;
    a0 = a0 >> 16;
    a1 = (0 + 160) | 0;
    a2 = (0 + 112) | 0;
    a3 = s2 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002dd08, a0, a1, a2, a3);
  case 0x80030224:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 195 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (s0 - s2) | 0; if (c) { pc = 0x8003020c; continue; } }
  case 0x80030238:
    a0 = (0 + 21) | 0;
    a1 = 0x800b0000 | 0;
    a1 = (a1 + 7200) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8003024c:
    a0 = 0 | 65535;
    a1 = 0 | 0;
    a2 = (0 + 5) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80030260:
    v1 = s1 & 255;
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0); s3 = (0 + 31) | 0; if (c) { pc = 0x800302e4; continue; } }
  case 0x80030270:
    s2 = 0 | 0;
    s4 = (0 + -32768) | 0;
  case 0x80030278:
    s0 = s3 << 10;
    v0 = s3 << 5;
    s0 = (s0 + v0) | 0;
    s0 = (s3 + s0) | 0;
    s0 = (s0 + s4) | 0;
    s0 = s0 & 65535;
    a0 = s0 | 0;
    s1 = s2 & 65535;
    s1 = s1 << 1;
    a1 = (s1 + 5) | 0;
    a1 = a1 & 65535;
    a2 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003af7c, a0, a1, a2, a3);
  case 0x800302ac:
    a0 = s0 | 0;
    s1 = (s1 + 6) | 0;
    a1 = s1 & 65534;
    a2 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003af7c, a0, a1, a2, a3);
  case 0x800302c0:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 32 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s3 = (s3 + -1) | 0; if (c) { pc = 0x80030278; continue; } }
  case 0x800302d4:
    a0 = 0 | 32768;
    a1 = (0 + 69) | 0;
    a2 = (0 + 187) | 0; pc = 0x80030334; continue;
  case 0x800302e4:
    s2 = 0 | 0;
    s0 = (0 + -32768) | 0;
  case 0x800302ec:
    a0 = s3 << 10;
    v0 = s3 << 5;
    a0 = (a0 + v0) | 0;
    a0 = (s3 + a0) | 0;
    a0 = (a0 + s0) | 0;
    a0 = a0 & 65535;
    a1 = (s2 + 5) | 0;
    a1 = a1 & 65535;
    a2 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003af7c, a0, a1, a2, a3);
  case 0x80030314:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 32 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s3 = (s3 + -1) | 0; if (c) { pc = 0x800302ec; continue; } }
  case 0x80030328:
    a0 = 0 | 32768;
    a1 = (0 + 37) | 0;
    a2 = (0 + 219) | 0;
  case 0x80030334:
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x8003033c:
    v0 = (0 + 32) | 0;
    m.write(((0x8007913c) + 910) >>> 0, v0 & 0xff, 1);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80030368; continue; } }
  case 0x8003035c:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80030364:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x80030368:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x800303a0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27404) >>> 0, 4) | 0;
    a0 = (0 + 255) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    v1 = m.read(((a1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((a1) + 49) >>> 0, v0 & 0xff, 1);
    v0 = 0x60000000 | 0;
    v1 = v1 | v0;
    m.write(((a1) + 0) >>> 0, v1 >>> 0, 4);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x800303ec:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x80030400:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8003040c:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x8003044c; continue; } }
  case 0x8003043c:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x80030448:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x8003044c:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x8003045c:
    s4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return [v0, v1];
  default: throw new Error(`x80030188: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800305f4, translated instruction by instruction (141 instructions).
export function* x800305f4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800305f4;
  for (;;) switch (pc) {
  case 0x800305f4:
    sp = (sp + -48) | 0;
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a2 = (v0 + 7200) | 0;
    m.write(((sp) + 40) >>> 0, 0, 4);
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    a0 = 0 | 0;
  case 0x8003061c:
    v1 = a1 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a2) | 0;
    v0 = a0 & 65535;
  case 0x80030634:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x80030634; continue; } }
  case 0x80030650:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x8003061c; continue; } }
  case 0x80030664:
    s2 = 0 | 0;
    s3 = (0 + 194) | 0;
    s0 = 0 | 0;
  case 0x80030670:
    v1 = s2 & 65535;
    v0 = v1 << 4;
    s1 = (v0 - v1) | 0;
    a0 = (s0 + s1) | 0;
  case 0x80030680:
    a0 = (s3 - a0) | 0;
    a0 = a0 << 16;
    a0 = a0 >> 16;
    a1 = (0 + 160) | 0;
    a2 = (0 + 112) | 0;
    a3 = (s0 + s1) | 0;
    a3 = a3 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002dd08, a0, a1, a2, a3);
  case 0x800306a0:
    s0 = (s0 + 1) | 0;
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 15 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (s0 + s1) | 0; if (c) { pc = 0x80030680; continue; } }
  case 0x800306b4:
    s2 = (s2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80035498, a0, a1, a2, a3);
  case 0x800306bc:
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 13 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = 0 | 0; if (c) { pc = 0x80030670; continue; } }
  case 0x800306cc:
    a0 = (0 + 21) | 0;
    a1 = 0x800b0000 | 0;
    a1 = (a1 + 7200) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x800306e0:
    v0 = (0 + 20) | 0;
    m.write(((0x8007913c) + 910) >>> 0, v0 & 0xff, 1);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    v0 = (0 + 32) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80030710; continue; } }
  case 0x80030704:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x8003070c:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x80030710:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x80030748:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    a0 = (0 + 255) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a1 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 7) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x80030798:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x800307ac:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x800307b8:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x800307f8; continue; } }
  case 0x800307e8:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x800307f4:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x800307f8:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80030808:
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return [v0, v1];
  default: throw new Error(`x800305f4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80030e94, translated instruction by instruction (264 instructions).
export function* x80030e94(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80030e94;
  for (;;) switch (pc) {
  case 0x80030e94:
    sp = (sp + -72) | 0;
    m.write(((sp) + 60) >>> 0, s7 >>> 0, 4);
    s7 = a0 | 0;
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a2 = (v0 + 7200) | 0;
    m.write(((sp) + 64) >>> 0, 0, 4);
    m.write(((sp) + 56) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4);
    a0 = 0 | 0;
  case 0x80030ed0:
    v1 = a1 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a2) | 0;
    v0 = a0 & 65535;
  case 0x80030ee8:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x80030ee8; continue; } }
  case 0x80030f04:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x80030ed0; continue; } }
  case 0x80030f18:
    s2 = 0 | 0;
    s1 = (0 + 200) | 0;
    s4 = 0 | 65535;
    v0 = 0 | 65504;
  case 0x80030f28:
    v0 = (s2 + v0) | 0;
    v0 = v0 << 8;
    s0 = v0 & 65535;
    a0 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044f2c, a0, a1, a2, a3);
  case 0x80030f3c:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = s0 | 0; if (c) { pc = 0x80030f50; continue; } }
  case 0x80030f4c:
    v0 = (v0 + s4) | 0;
  case 0x80030f50:
    v0 = v0 >> 16;
    v0 = (v0 + 160) | 0;
    v0 = v0 << 16;
    s5 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f4c, a0, a1, a2, a3);
  case 0x80030f64:
    [hi, lo] = mult(v0, s1, true);
    v1 = lo;
    { const c = (v1 | 0) >= 0; v0 = 0 | 65505; if (c) { pc = 0x80030f78; continue; } }
  case 0x80030f74:
    v1 = (v1 + s4) | 0;
  case 0x80030f78:
    v0 = (s2 + v0) | 0;
    v0 = v0 << 8;
    s0 = v0 & 65535;
    a0 = s0 | 0;
    v0 = v1 >> 16;
    v0 = (v0 + 120) | 0;
    v0 = v0 << 16;
    s3 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f2c, a0, a1, a2, a3);
  case 0x80030f9c:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = s0 | 0; if (c) { pc = 0x80030fb0; continue; } }
  case 0x80030fac:
    v0 = (v0 + s4) | 0;
  case 0x80030fb0:
    v0 = v0 >> 16;
    v0 = (v0 + 160) | 0;
    v0 = v0 << 16;
    s0 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f4c, a0, a1, a2, a3);
  case 0x80030fc4:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0;  if (c) { pc = 0x80030fd8; continue; } }
  case 0x80030fd4:
    v0 = (v0 + s4) | 0;
  case 0x80030fd8:
    a0 = (0 + 160) | 0;
    a1 = (0 + 120) | 0;
    a2 = s5 | 0;
    a3 = s3 | 0;
    v0 = v0 >> 16;
    v0 = (v0 + 120) | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    s6 = s2 & 255;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002ebe4, a0, a1, a2, a3);
  case 0x8003100c:
    v0 = (s2 + 96) | 0;
    v0 = v0 << 8;
    s0 = v0 & 65535;
    a0 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044f2c, a0, a1, a2, a3);
  case 0x80031020:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = s0 | 0; if (c) { pc = 0x80031034; continue; } }
  case 0x80031030:
    v0 = (v0 + s4) | 0;
  case 0x80031034:
    v0 = v0 >> 16;
    v0 = (v0 + 160) | 0;
    v0 = v0 << 16;
    s5 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f4c, a0, a1, a2, a3);
  case 0x80031048:
    [hi, lo] = mult(v0, s1, true);
    v1 = lo;
    { const c = (v1 | 0) >= 0; v0 = (s2 + 97) | 0; if (c) { pc = 0x8003105c; continue; } }
  case 0x80031058:
    v1 = (v1 + s4) | 0;
  case 0x8003105c:
    v0 = v0 << 8;
    s0 = v0 & 65535;
    a0 = s0 | 0;
    v0 = v1 >> 16;
    v0 = (v0 + 120) | 0;
    v0 = v0 << 16;
    s3 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f2c, a0, a1, a2, a3);
  case 0x8003107c:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = s0 | 0; if (c) { pc = 0x80031090; continue; } }
  case 0x8003108c:
    v0 = (v0 + s4) | 0;
  case 0x80031090:
    v0 = v0 >> 16;
    v0 = (v0 + 160) | 0;
    v0 = v0 << 16;
    s0 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f4c, a0, a1, a2, a3);
  case 0x800310a4:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = (0 + 160) | 0; if (c) { pc = 0x800310b8; continue; } }
  case 0x800310b4:
    v0 = (v0 + s4) | 0;
  case 0x800310b8:
    a1 = (0 + 120) | 0;
    a2 = s5 | 0;
    a3 = s3 | 0;
    v0 = v0 >> 16;
    v0 = (v0 + 120) | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002ebe4, a0, a1, a2, a3);
  case 0x800310e4:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 128 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = 0 | 65504; if (c) { pc = 0x80030f28; continue; } }
  case 0x800310f8:
    a0 = (0 + 21) | 0;
    a1 = 0x800b0000 | 0;
    a1 = (a1 + 7200) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8003110c:
    a0 = 0 | 32768;
    a1 = 0 | 0;
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031120:
    v0 = (0 + 31) | 0;
    m.write(((0x8007913c) + 910) >>> 0, v0 & 0xff, 1);
    v0 = 0 | 32768;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, v0 >>> 0, 4);
    a0 = s7 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8003113c:
    s2 = (0 + 0) | 0;
    s3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x80031158:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x80031164:
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 128) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    v0 = (0 + 120) | 0;
    m.write(((0x8007913c) + 1092) >>> 0, v0 >>> 0, 4);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x8003119c; continue; } }
  case 0x80031190:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80031198:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x8003119c:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x800311d4:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    a0 = (0 + 255) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a1 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x80031214:
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x80031228:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x80031234:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x80031274; continue; } }
  case 0x80031264:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x80031270:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x80031274:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80031284:
    s7 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 72) | 0;
     return [v0, v1];
  default: throw new Error(`x80030e94: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800312b4, translated instruction by instruction (262 instructions).
export function* x800312b4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800312b4;
  for (;;) switch (pc) {
  case 0x800312b4:
    sp = (sp + -72) | 0;
    m.write(((sp) + 60) >>> 0, s7 >>> 0, 4);
    s7 = a0 | 0;
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a2 = (v0 + 7200) | 0;
    m.write(((sp) + 64) >>> 0, 0, 4);
    m.write(((sp) + 56) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4);
    a0 = 0 | 0;
  case 0x800312f0:
    v1 = a1 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a2) | 0;
    v0 = a0 & 65535;
  case 0x80031308:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x80031308; continue; } }
  case 0x80031324:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x800312f0; continue; } }
  case 0x80031338:
    s2 = 0 | 0;
    s1 = (0 + 200) | 0;
    s4 = 0 | 65535;
    v0 = 0 | 65504;
  case 0x80031348:
    v0 = (s2 + v0) | 0;
    v0 = v0 << 8;
    s0 = v0 & 65535;
    a0 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044f2c, a0, a1, a2, a3);
  case 0x8003135c:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = s0 | 0; if (c) { pc = 0x80031370; continue; } }
  case 0x8003136c:
    v0 = (v0 + s4) | 0;
  case 0x80031370:
    v0 = v0 >> 16;
    v0 = (v0 + 160) | 0;
    v0 = v0 << 16;
    s5 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f4c, a0, a1, a2, a3);
  case 0x80031384:
    [hi, lo] = mult(v0, s1, true);
    v1 = lo;
    { const c = (v1 | 0) >= 0; v0 = 0 | 65505; if (c) { pc = 0x80031398; continue; } }
  case 0x80031394:
    v1 = (v1 + s4) | 0;
  case 0x80031398:
    v0 = (s2 + v0) | 0;
    v0 = v0 << 8;
    s0 = v0 & 65535;
    a0 = s0 | 0;
    v0 = v1 >> 16;
    v0 = (v0 + 120) | 0;
    v0 = v0 << 16;
    s3 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f2c, a0, a1, a2, a3);
  case 0x800313bc:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = s0 | 0; if (c) { pc = 0x800313d0; continue; } }
  case 0x800313cc:
    v0 = (v0 + s4) | 0;
  case 0x800313d0:
    v0 = v0 >> 16;
    v0 = (v0 + 160) | 0;
    v0 = v0 << 16;
    s0 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f4c, a0, a1, a2, a3);
  case 0x800313e4:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0;  if (c) { pc = 0x800313f8; continue; } }
  case 0x800313f4:
    v0 = (v0 + s4) | 0;
  case 0x800313f8:
    a0 = (0 + 160) | 0;
    a1 = (0 + 120) | 0;
    a2 = s5 | 0;
    a3 = s3 | 0;
    v0 = v0 >> 16;
    v0 = (v0 + 120) | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    s6 = s2 & 255;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002ebe4, a0, a1, a2, a3);
  case 0x8003142c:
    v0 = (s2 + 96) | 0;
    v0 = v0 << 8;
    s0 = v0 & 65535;
    a0 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044f2c, a0, a1, a2, a3);
  case 0x80031440:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = s0 | 0; if (c) { pc = 0x80031454; continue; } }
  case 0x80031450:
    v0 = (v0 + s4) | 0;
  case 0x80031454:
    v0 = v0 >> 16;
    v0 = (v0 + 160) | 0;
    v0 = v0 << 16;
    s5 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f4c, a0, a1, a2, a3);
  case 0x80031468:
    [hi, lo] = mult(v0, s1, true);
    v1 = lo;
    { const c = (v1 | 0) >= 0; v0 = (s2 + 97) | 0; if (c) { pc = 0x8003147c; continue; } }
  case 0x80031478:
    v1 = (v1 + s4) | 0;
  case 0x8003147c:
    v0 = v0 << 8;
    s0 = v0 & 65535;
    a0 = s0 | 0;
    v0 = v1 >> 16;
    v0 = (v0 + 120) | 0;
    v0 = v0 << 16;
    s3 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f2c, a0, a1, a2, a3);
  case 0x8003149c:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = s0 | 0; if (c) { pc = 0x800314b0; continue; } }
  case 0x800314ac:
    v0 = (v0 + s4) | 0;
  case 0x800314b0:
    v0 = v0 >> 16;
    v0 = (v0 + 160) | 0;
    v0 = v0 << 16;
    s0 = v0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044f4c, a0, a1, a2, a3);
  case 0x800314c4:
    [hi, lo] = mult(v0, s1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0; a0 = (0 + 160) | 0; if (c) { pc = 0x800314d8; continue; } }
  case 0x800314d4:
    v0 = (v0 + s4) | 0;
  case 0x800314d8:
    a1 = (0 + 120) | 0;
    a2 = s5 | 0;
    a3 = s3 | 0;
    v0 = v0 >> 16;
    v0 = (v0 + 120) | 0;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002ebe4, a0, a1, a2, a3);
  case 0x80031504:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 128 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = 0 | 65504; if (c) { pc = 0x80031348; continue; } }
  case 0x80031518:
    a0 = (0 + 21) | 0;
    a1 = 0x800b0000 | 0;
    a1 = (a1 + 7200) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8003152c:
    a0 = 0 | 0;
    a1 = a0 | 0;
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031540:
    v0 = (0 + 30) | 0;
    m.write(((0x8007913c) + 910) >>> 0, v0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, 0 >>> 0, 4);
    a0 = s7 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x80031558:
    s2 = (0 + 0) | 0;
    s3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x80031574:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x80031580:
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    v0 = (0 + 128) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1092) >>> 0, 0 >>> 0, 4);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x800315b4; continue; } }
  case 0x800315a8:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x800315b0:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x800315b4:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x800315ec:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    a0 = (0 + 255) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a1 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8003162c:
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = s2 | 0;
    a3 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x80031640:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8003164c:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x8003168c; continue; } }
  case 0x8003167c:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x80031688:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x8003168c:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x8003169c:
    s7 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 72) | 0;
     return [v0, v1];
  default: throw new Error(`x800312b4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800316cc, translated instruction by instruction (104 instructions).
export function* x800316cc(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800316cc;
  for (;;) switch (pc) {
  case 0x800316cc:
    sp = (sp + -48) | 0;
    a0 = (0 + 1) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a2 = (0 + 9200) | 0;
    m.write(((sp) + 40) >>> 0, 0, 4);
    m.write(((sp) + 36) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x800316f0:
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a0 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003afc8, a0, a1, a2, a3);
  case 0x80031700:
    v0 = 0x801f0000 | 0;
    s1 = (v0 + 26264) | 0;
    a0 = m.read(((s1) + 16) >>> 0, 2);
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x80031728; continue; } }
  case 0x80031718:
    a0 = a0 << 16;
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80031724:
    m.write(((s1) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x80031728:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x80031760:
    a0 = 0 | 0;
    a1 = a0 | 0;
    a2 = (0 + 256) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    m.write(((s1) + 16) >>> 0, v0 & 0xffff, 2);
    t0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1);
    v0 = a2 | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 32) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x800317c8:
    v0 = (0 + 34) | 0;
    m.write(((0x8007913c) + 910) >>> 0, v0 & 0xff, 1);
    a0 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x800317d8:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x800317ec:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x800317f8:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x80031838; continue; } }
  case 0x80031828:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x80031834:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x80031838:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80031848:
    a0 = m.read(((s1) + 16) >>> 0, 2);
    a1 = (0 + 12) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x80031854:
    s1 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return [v0, v1];
  default: throw new Error(`x800316cc: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80031e20, translated instruction by instruction (18 instructions).
export function* x80031e20(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80031e20;
  for (;;) switch (pc) {
  case 0x80031e20:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
  case 0x80031e28:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80031e58; continue; } }
  case 0x80031e38:
    v0 = m.read(((0x8007913c) + 910) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80031e58; continue; } }
  case 0x80031e48:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80031e50:
     pc = 0x80031e28; continue;
  case 0x80031e58:
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x80031e20: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80031e8c, translated instruction by instruction (28 instructions).
export function* x80031e8c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80031e8c;
  for (;;) switch (pc) {
  case 0x80031e8c:
    sp = (sp + -24) | 0;
    v0 = 0x801f0000 | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = (v0 + 26264) | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
    a0 = m.read(((s0) + 16) >>> 0, 2);
    m.write(((0x8007913c) + 1092) >>> 0, 0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 1212) >>> 0, 0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27140) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 1140) >>> 0, 0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27212) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 800) >>> 0, 0 >>> 0, 4);
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x80031ee4; continue; } }
  case 0x80031ed4:
    a0 = a0 << 16;
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80031ee0:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x80031ee4:
    m.write(((0x8007913c) + 910) >>> 0, 0 & 0xff, 1);
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x80031e8c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80031efc, translated instruction by instruction (113 instructions).
export function* x80031efc(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80031efc;
  for (;;) switch (pc) {
  case 0x80031efc:
    sp = (sp + -32) | 0;
    a1 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a2 = (v0 + 7200) | 0;
    m.write(((sp) + 28) >>> 0, 0, 4);
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    a0 = 0 | 0;
  case 0x80031f18:
    v1 = a1 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v1 = (v0 + a2) | 0;
    v0 = a0 & 65535;
  case 0x80031f30:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 320 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x80031f30; continue; } }
  case 0x80031f4c:
    a1 = (a1 + 1) | 0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x80031f18; continue; } }
  case 0x80031f60:
    s0 = 0x800b0000 | 0;
    s0 = (s0 + 7200) | 0;
    a0 = s0 | 0;
    a1 = (0 + 255) | 0;
    a2 = 0x10000 | 0;
    a2 = a2 | 11264; [v0, v1] = yield* call(ctx, sp, 0x80044cd4, a0, a1, a2, a3);
  case 0x80031f7c:
    a0 = (0 + 21) | 0;
    a1 = s0 | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x80031f8c:
    a0 = 0 | 32768;
    a1 = 0 | 0;
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031fa0:
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80031fc4; continue; } }
  case 0x80031fb8:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80031fc0:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x80031fc4:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = 0x1000000 | 0;
    m.write(((v0) + 176) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x80031ffc:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    a0 = (0 + 255) | 0;
    m.write(((s0) + 16) >>> 0, v0 & 0xffff, 2);
    a1 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((v1) + 49) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((v1) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 5) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8003203c:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x80032050:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8003205c:
    a0 = 0x801f0000 | 0;
    v1 = (a0 + 24168) | 0;
    v0 = 0 | 65280;
    m.write(((v1) + 32) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 23816) | 0;
    v0 = (0 + 32640) | 0;
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
    a1 = m.read(((a0) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x80200000 | 0; if (c) { pc = 0x8003209c; continue; } }
  case 0x8003208c:
    a0 = m.read(((v0) + -8264) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x80032098:
    m.write(((s0) + 32) >>> 0, v0 >>> 0, 4);
  case 0x8003209c:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 7376) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x800320ac:
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return [v0, v1];
  default: throw new Error(`x80031efc: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80035498, translated instruction by instruction (11 instructions).
export function* x80035498(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80035498;
  for (;;) switch (pc) {
  case 0x80035498:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28060) >>> 0, 4) | 0;
    sp = (sp + -24) | 0;
    { const c = (v0 | 0) === 0; m.write(((sp) + 16) >>> 0, 0, 4); if (c) { pc = 0x800354b4; continue; } }
  case 0x800354ac:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800354b4:
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x80035498: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800354f8, translated instruction by instruction (28 instructions).
export function* x800354f8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800354f8;
  for (;;) switch (pc) {
  case 0x800354f8:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0, 4);
    s0 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80045488, a0, a1, a2, a3);
  case 0x8003550c:
    v1 = v0 << 16;
    v1 = v1 >> 16;
    s0 = s0 << 16;
    s0 = s0 >> 16;
    [hi, lo] = div(0, v1, true);
    { const c = (s0 | 0) !== 0;  if (c) { pc = 0x8003552c; continue; } }
  case 0x80035528:
    throw new Error("break 7 at 0x80035528");
  case 0x8003552c:
    at = (0 + -1) | 0;
    { const c = (s0 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x80035544; continue; } }
  case 0x80035538:
    { const c = (v1 | 0) !== (at | 0);  if (c) { pc = 0x80035544; continue; } }
  case 0x80035540:
    throw new Error("break 6 at 0x80035540");
  case 0x80035544:
    v0 = hi;
    v0 = v0 << 16;
    v0 = v0 >> 16;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x800354f8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003ac44, translated instruction by instruction (67 instructions).
export function* x8003ac44(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003ac44;
  for (;;) switch (pc) {
  case 0x8003ac44:
    sp = (sp + -544) | 0;
    m.write(((sp) + 532) >>> 0, s1 >>> 0, 4);
    s1 = a0 | 0;
    m.write(((sp) + 528) >>> 0, s0 >>> 0, 4);
    s0 = a1 | 0;
    m.write(((sp) + 536) >>> 0, 0, 4);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x8003ac64:
    t0 = 0 | 0;
    v1 = s1 & 255;
    v0 = 0x800c0000 | 0;
    v0 = (v0 + 18464) | 0;
    v1 = v1 << 9;
    t1 = (v1 + v0) | 0;
    v0 = t0 & 65535;
  case 0x8003ac80:
    a0 = v0 << 1;
    v1 = (a0 + t1) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 1);
    v1 = m.read(((v1) + 0) >>> 0, 2);
    v0 = v0 & 31;
    a2 = (s0 + v0) | 0;
    v0 = v1 & 992;
    v0 = (v0 >>> 5) | 0;
    a1 = (s0 + v0) | 0;
    v1 = v1 & 31744;
    v1 = (v1 >>> 10) | 0;
    v0 = a2 & 255;
    v0 = (v0 >>> 0) < 32 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = (s0 + v1) | 0; if (c) { pc = 0x8003acc0; continue; } }
  case 0x8003acbc:
    a2 = (0 + 31) | 0;
  case 0x8003acc0:
    v0 = a1 & 255;
    v0 = (v0 >>> 0) < 32 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 & 255; if (c) { pc = 0x8003acd4; continue; } }
  case 0x8003acd0:
    a1 = (0 + 31) | 0;
  case 0x8003acd4:
    v0 = (v0 >>> 0) < 32 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a3 = (sp + 16) | 0; if (c) { pc = 0x8003ace4; continue; } }
  case 0x8003ace0:
    v1 = (0 + 31) | 0;
  case 0x8003ace4:
    a0 = (a0 + a3) | 0;
    v1 = v1 & 255;
    v1 = v1 << 10;
    v0 = a1 & 255;
    v0 = v0 << 5;
    v1 = (v1 + v0) | 0;
    v0 = a2 & 255;
    v0 = (v0 + v1) | 0;
    v1 = (0 + -32768) | 0;
    v0 = (v0 + v1) | 0;
    m.write(((a0) + 0) >>> 0, v0 & 0xffff, 2);
    t0 = (t0 + 1) | 0;
    v0 = t0 & 65535;
    v0 = (v0 >>> 0) < 256 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = t0 & 65535; if (c) { pc = 0x8003ac80; continue; } }
  case 0x8003ad24:
    a0 = a3 | 0;
    a2 = s1 & 255;
    a1 = 0 | 0;
    a2 = (a2 + 480) | 0; [v0, v1] = yield* call(ctx, sp, 0x80046d10, a0, a1, a2, a3);
  case 0x8003ad38:
    s1 = m.read(((sp) + 532) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 528) >>> 0, 4) | 0;
    sp = (sp + 544) | 0;
     return [v0, v1];
  default: throw new Error(`x8003ac44: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003ae5c, translated instruction by instruction (62 instructions).
export function* x8003ae5c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003ae5c;
  for (;;) switch (pc) {
  case 0x8003ae5c:
    sp = (sp + -40) | 0;
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    s3 = a0 | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = a1 | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = a3 | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = a2 & 65535;
    m.write(((sp) + 36) >>> 0, 0, 4);
    { const c = (s0 | 0) === 0; m.write(((sp) + 20) >>> 0, s1 >>> 0, 4); if (c) { pc = 0x8003af30; continue; } }
  case 0x8003ae8c:
    v0 = s4 & 255;
    v0 = v0 << 9;
    a0 = 0x800c0000 | 0;
    a0 = (a0 + 18464) | 0;
    a0 = (v0 + a0) | 0;
    v0 = 0x80200000 | 0;
    s1 = (v0 + -12176) | 0;
    a1 = s1 | 0;
    a2 = (0 + 128) | 0; [v0, v1] = yield* call(ctx, sp, 0x800448d8, a0, a1, a2, a3);
  case 0x8003aeb4:
    { const c = (s0 | 0) === 0; a0 = 0 | 0; if (c) { pc = 0x8003aef8; continue; } }
  case 0x8003aebc:
    a1 = s2 & 65535;
    a3 = s1 | 0;
    a2 = s0 | 0;
    v0 = a0 & 65535;
  case 0x8003aecc:
    v1 = (a1 + v0) | 0;
    v0 = (v1 | 0) < 256 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = v1 << 1; if (c) { pc = 0x8003aee4; continue; } }
  case 0x8003aedc:
    v0 = (v0 + a3) | 0;
    m.write(((v0) + 0) >>> 0, s3 & 0xffff, 2);
  case 0x8003aee4:
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < (a2 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x8003aecc; continue; } }
  case 0x8003aef8:
    s0 = 0x80200000 | 0;
    s0 = (s0 + -12176) | 0;
    a0 = s0 | 0;
    a1 = 0 | 0;
    s1 = s4 & 255;
    a2 = (s1 + 480) | 0; [v0, v1] = yield* call(ctx, sp, 0x80046d10, a0, a1, a2, a3);
  case 0x8003af14:
    a0 = s0 | 0;
    s1 = s1 << 9;
    a1 = 0x800c0000 | 0;
    a1 = (a1 + 18464) | 0;
    a1 = (s1 + a1) | 0;
    a2 = (0 + 128) | 0; [v0, v1] = yield* call(ctx, sp, 0x800448d8, a0, a1, a2, a3);
  case 0x8003af30:
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8003ae5c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003af7c, translated instruction by instruction (19 instructions).
export function* x8003af7c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003af7c;
  for (;;) switch (pc) {
  case 0x8003af7c:
    sp = (sp + -24) | 0;
    a2 = a2 & 255;
    v0 = 0x800c0000 | 0;
    v0 = (v0 + 18464) | 0;
    v1 = a2 << 9;
    v1 = (v1 + v0) | 0;
    a1 = a1 & 65535;
    a1 = a1 << 1;
    a1 = (a1 + v1) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    m.write(((a1) + 0) >>> 0, a0 & 0xffff, 2);
    a0 = v1 | 0;
    a1 = 0 | 0;
    a2 = (a2 + 480) | 0; [v0, v1] = yield* call(ctx, sp, 0x80046d10, a0, a1, a2, a3);
  case 0x8003afb8:
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x8003af7c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003bc68, translated instruction by instruction (16 instructions).
export function x8003bc68(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003bc68;
  for (;;) switch (pc) {
  case 0x8003bc68:
    a0 = a0 & 65535;
    { const c = (a0 | 0) === 0; v1 = 0x801f0000 | 0; if (c) { pc = 0x8003bca0; continue; } }
  case 0x8003bc74:
    v1 = (v1 + -4248) | 0;
    v0 = a0 << 3;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 3;
    a0 = (v0 + v1) | 0;
    v1 = m.read(((a0) + 0) >>> 0, 4) | 0;
    v0 = 0x80000000 | 0;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x8003bca0; continue; } }
  case 0x8003bc98:
    m.write(((a0) + 4) >>> 0, a1 & 0xffff, 2);
    m.write(((a0) + 6) >>> 0, a2 & 0xffff, 2);
  case 0x8003bca0:
     return [v0, v1];
  default: throw new Error(`x8003bc68: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003bca8, translated instruction by instruction (19 instructions).
export function x8003bca8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003bca8;
  for (;;) switch (pc) {
  case 0x8003bca8:
    a0 = a0 & 65535;
    { const c = (a0 | 0) === 0; v1 = 0x801f0000 | 0; if (c) { pc = 0x8003bcec; continue; } }
  case 0x8003bcb4:
    v1 = (v1 + -4248) | 0;
    v0 = a0 << 3;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 3;
    a0 = (v0 + v1) | 0;
    v1 = m.read(((a0) + 0) >>> 0, 4) | 0;
    v0 = 0x80000000 | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = a1 << 4; if (c) { pc = 0x8003bcec; continue; } }
  case 0x8003bcd8:
    m.write(((a0) + 30) >>> 0, v0 & 0xffff, 2);
    m.write(((a0) + 36) >>> 0, v0 & 0xffff, 2);
    v0 = a2 << 4;
    m.write(((a0) + 32) >>> 0, v0 & 0xffff, 2);
    m.write(((a0) + 38) >>> 0, v0 & 0xffff, 2);
  case 0x8003bcec:
     return [v0, v1];
  default: throw new Error(`x8003bca8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003be4c, translated instruction by instruction (16 instructions).
export function x8003be4c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003be4c;
  for (;;) switch (pc) {
  case 0x8003be4c:
    a0 = a0 & 65535;
    { const c = (a0 | 0) === 0; v1 = 0x801f0000 | 0; if (c) { pc = 0x8003be84; continue; } }
  case 0x8003be58:
    v1 = (v1 + -4248) | 0;
    v0 = a0 << 3;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 3;
    a0 = (v0 + v1) | 0;
    v1 = m.read(((a0) + 0) >>> 0, 4) | 0;
    v0 = 0x80000000 | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = 0x800a0000 | 0; if (c) { pc = 0x8003be84; continue; } }
  case 0x8003be7c:
    v0 = (v0 + -11784) | 0;
    m.write(((a0) + 52) >>> 0, v0 >>> 0, 4);
  case 0x8003be84:
     return [v0, v1];
  default: throw new Error(`x8003be4c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003cb1c, translated instruction by instruction (39 instructions).
export function* x8003cb1c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003cb1c;
  for (;;) switch (pc) {
  case 0x8003cb1c:
    sp = (sp + -32) | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    s0 = a1 | 0;
    v1 = a0 | 0;
    v0 = v1 & 255;
    t0 = m.read(((sp) + 48) >>> 0, 2);
    a1 = m.read(((sp) + 52) >>> 0, 2);
    a2 = m.read(((sp) + 56) >>> 0, 2);
    v0 = (v0 >>> 0) < 16 ? 1 : 0;
    { const c = (v0 | 0) !== 0; m.write(((sp) + 28) >>> 0, 0, 4); if (c) { pc = 0x8003cb54; continue; } }
  case 0x8003cb48:
    v0 = (0 + 256) | 0;
    m.write(((sp) + 18) >>> 0, v0 & 0xffff, 2); pc = 0x8003cb58; continue;
  case 0x8003cb54:
    m.write(((sp) + 18) >>> 0, 0 & 0xffff, 2);
  case 0x8003cb58:
    a0 = 0 | 0;
    v1 = v1 & 15;
    v1 = v1 << 6;
    v0 = a3 & 65535;
    v0 = (v0 >>> 1) | 0;
    v1 = (v1 + v0) | 0;
    m.write(((sp) + 16) >>> 0, v1 & 0xffff, 2);
    v1 = m.read(((sp) + 18) >>> 0, 2);
    v0 = (a1 >>> 1) | 0;
    m.write(((sp) + 20) >>> 0, v0 & 0xffff, 2);
    m.write(((sp) + 22) >>> 0, a2 & 0xffff, 2);
    v1 = (v1 + t0) | 0;
    m.write(((sp) + 18) >>> 0, v1 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x8003cb90:
    a0 = (sp + 16) | 0;
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80049560, a0, a1, a2, a3);
  case 0x8003cb9c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x8003cba4:
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return [v0, v1];
  default: throw new Error(`x8003cb1c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003e154, translated instruction by instruction (143 instructions).
export function* x8003e154(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003e154;
  for (;;) switch (pc) {
  case 0x8003e154:
    sp = (sp + -56) | 0;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    s1 = a0 & 65535;
    a0 = s1 | 0;
    m.write(((sp) + 52) >>> 0, 0, 4);
    m.write(((sp) + 48) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8003e18c:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8003e1a0:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8003e1ac:
    s2 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d388, a0, a1, a2, a3);
  case 0x8003e1b4:
    s0 = 0x801f0000 | 0;
    s0 = (s0 + 26264) | 0;
    a0 = m.read(((s0) + 2) >>> 0, 2);
    s6 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e1c8:
    a0 = m.read(((s0) + 4) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e1d4:
    a0 = m.read(((s0) + 6) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e1e0:
    a0 = m.read(((s0) + 10) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e1ec:
    a0 = m.read(((s0) + 12) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e1f8:
    { const c = (s1 | 0) === 0; v0 = 0x800a0000 | 0; if (c) { pc = 0x8003e30c; continue; } }
  case 0x8003e200:
    s5 = s1 | 0;
    fp = (v0 + -11784) | 0;
    s7 = (fp + 4) | 0;
    s1 = 0 | 0;
  case 0x8003e210:
    [hi, lo] = div(0, s2, true);
    { const c = (s5 | 0) !== 0;  if (c) { pc = 0x8003e220; continue; } }
  case 0x8003e21c:
    throw new Error("break 7 at 0x8003e21c");
  case 0x8003e220:
    at = (0 + -1) | 0;
    { const c = (s5 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8003e238; continue; } }
  case 0x8003e22c:
    { const c = (s2 | 0) !== (at | 0);  if (c) { pc = 0x8003e238; continue; } }
  case 0x8003e234:
    throw new Error("break 6 at 0x8003e234");
  case 0x8003e238:
    s4 = lo;
    v0 = s1 & 65535;
  case 0x8003e240:
    s1 = (s1 + 1) | 0;
    v0 = v0 << 3;
    v1 = (v0 + fp) | 0;
    v0 = (v0 + s7) | 0;
    m.write(((v1) + 0) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4);
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s1 & 65535; if (c) { pc = 0x8003e240; continue; } }
  case 0x8003e268:
    s1 = 0 | 0;
    v0 = (0 + 256) | 0;
    v0 = (v0 - s4) | 0;
    v1 = v0 << 3;
    s3 = (v1 - v0) | 0;
    a0 = s1 & 65535;
  case 0x8003e280:
    [hi, lo] = mult(a0, s4, true);
    s0 = lo;
    { const c = (s0 | 0) >= 0; v0 = s3 << 4; if (c) { pc = 0x8003e294; continue; } }
  case 0x8003e290:
    s0 = (s0 + 255) | 0;
  case 0x8003e294:
    { const c = (v0 | 0) >= 0; v1 = s0 >> 8; if (c) { pc = 0x8003e2a0; continue; } }
  case 0x8003e29c:
    v0 = (v0 + 255) | 0;
  case 0x8003e2a0:
    s0 = v0 >> 8;
    s0 = (v1 + s0) | 0;
    s0 = s0 << 3;
    s0 = (s0 + s7) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8003e2b4:
    a0 = v0 | 0;
    a1 = v1 | 0;
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    s1 = (s1 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8003e2cc:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8003e2d8:
    m.write(((s0) + 0) >>> 0, v0 >>> 0, 4);
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = s1 & 65535; if (c) { pc = 0x8003e280; continue; } }
  case 0x8003e2ec:
    s2 = (s2 + -256) | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003e2f4:
    s6 = (s6 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003e2fc:
    v0 = s6 & 65535;
    v0 = (v0 >>> 0) < (s5 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; s1 = 0 | 0; if (c) { pc = 0x8003e210; continue; } }
  case 0x8003e30c:
    s1 = 0 | 0;
    v0 = 0x800a0000 | 0;
    a0 = (v0 + -11784) | 0;
    a1 = (a0 + 4) | 0;
  case 0x8003e31c:
    v1 = s1 & 65535;
    s1 = (s1 + 1) | 0;
    v1 = v1 << 3;
    v0 = (v1 + a0) | 0;
    v1 = (v1 + a1) | 0;
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4);
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; m.write(((v1) + 0) >>> 0, 0 >>> 0, 4); if (c) { pc = 0x8003e31c; continue; } }
  case 0x8003e344:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003e34c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003e354:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8003e35c:
    fp = m.read(((sp) + 48) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 56) | 0;
     return [v0, v1];
  default: throw new Error(`x8003e154: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003e390, translated instruction by instruction (107 instructions).
export function* x8003e390(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003e390;
  for (;;) switch (pc) {
  case 0x8003e390:
    sp = (sp + -48) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = a0 | 0;
    m.write(((sp) + 44) >>> 0, 0, 4);
    m.write(((sp) + 40) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002d388, a0, a1, a2, a3);
  case 0x8003e3bc:
    v0 = 0x801f0000 | 0;
    s4 = 0 | 0;
    a0 = m.read(((v0) + 26274) >>> 0, 2);
    s2 = s0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e3d0:
    v0 = 0x800a0000 | 0;
    s6 = (v0 + -11780) | 0;
  case 0x8003e3d8:
    s1 = 0 | 0;
    v1 = 0 | 61440;
    v0 = s1 & 65535;
  case 0x8003e3e4:
    v0 = v0 << 3;
    v0 = (v0 + s6) | 0;
    m.write(((v0) + 0) >>> 0, v1 >>> 0, 4);
    s1 = (s1 + 1) | 0;
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s1 & 65535; if (c) { pc = 0x8003e3e4; continue; } }
  case 0x8003e404:
    s1 = 0 | 0;
    v1 = s4 & 65535;
    s5 = (s2 - v1) | 0;
    v0 = v1 << 4;
    v0 = (v0 - v1) | 0;
    s3 = v0 << 4;
    a0 = s1 & 65535;
  case 0x8003e420:
    [hi, lo] = mult(s5, a0, true);
    v0 = lo;
    [hi, lo] = div(0, v0, true);
    { const c = (s2 | 0) !== 0;  if (c) { pc = 0x8003e440; continue; } }
  case 0x8003e43c:
    throw new Error("break 7 at 0x8003e43c");
  case 0x8003e440:
    at = (0 + -1) | 0;
    { const c = (s2 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8003e458; continue; } }
  case 0x8003e44c:
    { const c = (v0 | 0) !== (at | 0);  if (c) { pc = 0x8003e458; continue; } }
  case 0x8003e454:
    throw new Error("break 6 at 0x8003e454");
  case 0x8003e458:
    s0 = lo;
    [hi, lo] = div(0, s3, true);
    { const c = (s2 | 0) !== 0;  if (c) { pc = 0x8003e474; continue; } }
  case 0x8003e470:
    throw new Error("break 7 at 0x8003e470");
  case 0x8003e474:
    at = (0 + -1) | 0;
    { const c = (s2 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8003e48c; continue; } }
  case 0x8003e480:
    { const c = (s3 | 0) !== (at | 0);  if (c) { pc = 0x8003e48c; continue; } }
  case 0x8003e488:
    throw new Error("break 6 at 0x8003e488");
  case 0x8003e48c:
    v1 = lo;
    s1 = (s1 + 1) | 0;
    s0 = (s0 + v1) | 0;
    s0 = s0 << 3;
    s0 = (s0 + s6) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8003e4a4:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8003e4b8:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8003e4c4:
    m.write(((s0) + 0) >>> 0, v0 >>> 0, 4);
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = s1 & 65535; if (c) { pc = 0x8003e420; continue; } }
  case 0x8003e4d8:
    s4 = (s4 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003e4e0:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003e4e8:
    v0 = s4 & 65535;
    v0 = (s2 >>> 0) < (v0 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003e3d8; continue; } }
  case 0x8003e4f8:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003e500:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003e508:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8003e510:
    s6 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return [v0, v1];
  default: throw new Error(`x8003e390: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003e53c, translated instruction by instruction (163 instructions).
export function* x8003e53c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003e53c;
  for (;;) switch (pc) {
  case 0x8003e53c:
    sp = (sp + -1016) | 0;
    m.write(((sp) + 1000) >>> 0, s6 >>> 0, 4);
    s6 = a0 | 0;
    m.write(((sp) + 1012) >>> 0, 0, 4);
    m.write(((sp) + 1008) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 1004) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 996) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 992) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 988) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 984) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 980) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 976) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002d388, a0, a1, a2, a3);
  case 0x8003e570:
    s0 = 0x801f0000 | 0;
    s0 = (s0 + 26264) | 0;
    a0 = m.read(((s0) + 2) >>> 0, 2);
    s3 = (0 + 239) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e584:
    a0 = m.read(((s0) + 4) >>> 0, 2);
    s2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e590:
    a0 = m.read(((s0) + 6) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e59c:
    a0 = m.read(((s0) + 10) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e5a8:
    a0 = m.read(((s0) + 12) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e5b4:
    a0 = (sp + 16) | 0;
    v0 = 0x800a0000 | 0;
    a1 = (v0 + -11784) | 0;
  case 0x8003e5c0:
    v1 = s2 & 65535;
    v0 = v1 << 1;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, s2 & 0xffff, 2);
    s2 = (s2 + 1) | 0;
    v1 = v1 << 3;
    v1 = (v1 + a1) | 0;
    m.write(((v0) + 480) >>> 0, 0 & 0xffff, 2);
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; m.write(((v1) + 0) >>> 0, 0 >>> 0, 4); if (c) { pc = 0x8003e5c0; continue; } }
  case 0x8003e5f0:
    s5 = 0 | 0;
    v0 = 0x800a0000 | 0;
    fp = (v0 + -11784) | 0;
    s7 = 0x80000000 | 0;
    v0 = s3 << 16;
  case 0x8003e604:
    v0 = v0 >> 15;
    s2 = v0 | 1; pc = 0x8003e61c; continue;
  case 0x8003e610:
    v0 = (v0 + fp) | 0;
    m.write(((v0) + 0) >>> 0, s7 >>> 0, 4);
    s2 = (s2 + 2) | 0;
  case 0x8003e61c:
    v1 = s2 & 65535;
    v0 = (v1 >>> 0) < 481 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 << 2; if (c) { pc = 0x8003e610; continue; } }
  case 0x8003e62c:
    v0 = s3 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) === 0; s2 = s3 | 0; if (c) { pc = 0x8003e6d4; continue; } }
  case 0x8003e63c:
    v0 = 0x800a0000 | 0;
    s4 = (v0 + -11780) | 0;
    a0 = s2 & 65535;
  case 0x8003e648:
    v1 = a0 << 1;
    v0 = (sp + 16) | 0;
    s1 = (v1 + v0) | 0;
    v0 = m.read(((s1) + 0) >>> 0, 2);
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003e6c0; continue; } }
  case 0x8003e668:
    s0 = m.read(((s1) + 0) >>> 0, 2);
    s0 = s0 << 3;
    s0 = (s0 + s4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8003e67c:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8003e690:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8003e69c:
    m.write(((s0) + 0) >>> 0, v0 >>> 0, 4);
    v1 = m.read(((s1) + 480) >>> 0, 2);
    v0 = m.read(((s1) + 0) >>> 0, 2);
    a0 = v1 | 0;
    v0 = (v0 + v1) | 0;
    { const c = (a0 | 0) === 0; m.write(((s1) + 0) >>> 0, v0 & 0xffff, 2); if (c) { pc = 0x8003e6c0; continue; } }
  case 0x8003e6b8:
    v0 = (a0 + 1) | 0;
    m.write(((s1) + 480) >>> 0, v0 & 0xffff, 2);
  case 0x8003e6c0:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = s2 & 65535; if (c) { pc = 0x8003e648; continue; } }
  case 0x8003e6d4:
    v0 = s6 & 255;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x8003e6e4; continue; } }
  case 0x8003e6e0:
    a0 = 0 | 61440;
  case 0x8003e6e4:
    v0 = s3 << 16;
    v0 = v0 >> 15;
    s2 = v0 | 1; pc = 0x8003e718; continue;
  case 0x8003e6f4:
    v0 = (v0 + fp) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 4) | 0;
    { const c = (v1 | 0) !== (s7 | 0);  if (c) { pc = 0x8003e710; continue; } }
  case 0x8003e708:
    m.write(((v0) + 0) >>> 0, a0 >>> 0, 4); pc = 0x8003e714; continue;
  case 0x8003e710:
    a0 = v1 | 0;
  case 0x8003e714:
    s2 = (s2 + 2) | 0;
  case 0x8003e718:
    v1 = s2 & 65535;
    v0 = (v1 >>> 0) < 481 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 << 2; if (c) { pc = 0x8003e6f4; continue; } }
  case 0x8003e728:
    v0 = s6 & 255;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003e744; continue; } }
  case 0x8003e734:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003e73c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003e744:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003e74c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003e754:
    v0 = s3 << 16;
    { const c = (v0 | 0) === 0; a0 = (s3 + -1) | 0; if (c) { pc = 0x8003e780; continue; } }
  case 0x8003e760:
    v1 = a0 << 16;
    v1 = v1 >> 15;
    v0 = (sp + 16) | 0;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 480) >>> 0, 2);
    s3 = a0 | 0;
    v0 = (v0 + 1) | 0;
    m.write(((v1) + 480) >>> 0, v0 & 0xffff, 2);
  case 0x8003e780:
    s5 = (s5 + 1) | 0;
    v0 = s5 & 65535;
    v0 = (v0 >>> 0) < 300 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s3 << 16; if (c) { pc = 0x8003e604; continue; } }
  case 0x8003e794:
    fp = m.read(((sp) + 1008) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 1004) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 1000) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 996) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 992) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 988) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 984) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 980) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 976) >>> 0, 4) | 0;
    sp = (sp + 1016) | 0;
     return [v0, v1];
  default: throw new Error(`x8003e53c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003e7c8, translated instruction by instruction (133 instructions).
export function* x8003e7c8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003e7c8;
  for (;;) switch (pc) {
  case 0x8003e7c8:
    sp = (sp + -1008) | 0;
    m.write(((sp) + 1004) >>> 0, 0, 4);
    m.write(((sp) + 1000) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 996) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 992) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 988) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 984) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 980) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 976) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002d388, a0, a1, a2, a3);
  case 0x8003e7f0:
    s0 = 0x801f0000 | 0;
    s0 = (s0 + 26264) | 0;
    a0 = m.read(((s0) + 2) >>> 0, 2);
    s3 = (0 + 239) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e804:
    a0 = m.read(((s0) + 4) >>> 0, 2);
    s2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e810:
    a0 = m.read(((s0) + 6) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e81c:
    a0 = m.read(((s0) + 10) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e828:
    a0 = m.read(((s0) + 12) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003e834:
    a0 = (sp + 16) | 0;
    v0 = 0x800a0000 | 0;
    a1 = (v0 + -11784) | 0;
  case 0x8003e840:
    v1 = s2 & 65535;
    v0 = v1 << 1;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, s2 & 0xffff, 2);
    s2 = (s2 + 1) | 0;
    v1 = v1 << 3;
    v1 = (v1 + a1) | 0;
    m.write(((v0) + 480) >>> 0, 0 & 0xffff, 2);
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; m.write(((v1) + 0) >>> 0, 0 >>> 0, 4); if (c) { pc = 0x8003e840; continue; } }
  case 0x8003e870:
    s4 = 0 | 0;
    v0 = 0x800a0000 | 0;
    s6 = (v0 + -11784) | 0;
    v0 = s3 & 65535;
  case 0x8003e880:
    v0 = v0 << 1;
    s2 = v0 | 1;
    v1 = s2 & 65535;
    v0 = (v1 >>> 0) < 481 ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = 0 | 61440; if (c) { pc = 0x8003e8b8; continue; } }
  case 0x8003e898:
    v0 = v1 << 2;
  case 0x8003e89c:
    v0 = (v0 + s6) | 0;
    m.write(((v0) + 0) >>> 0, a0 >>> 0, 4);
    s2 = (s2 + 2) | 0;
    v1 = s2 & 65535;
    v0 = (v1 >>> 0) < 481 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 << 2; if (c) { pc = 0x8003e89c; continue; } }
  case 0x8003e8b8:
    v0 = s3 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) === 0; s2 = s3 | 0; if (c) { pc = 0x8003e960; continue; } }
  case 0x8003e8c8:
    v0 = 0x800a0000 | 0;
    s5 = (v0 + -11780) | 0;
    a0 = s2 & 65535;
  case 0x8003e8d4:
    v1 = a0 << 1;
    v0 = (sp + 16) | 0;
    s1 = (v1 + v0) | 0;
    v0 = m.read(((s1) + 0) >>> 0, 2);
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003e94c; continue; } }
  case 0x8003e8f4:
    s0 = m.read(((s1) + 0) >>> 0, 2);
    s0 = s0 << 3;
    s0 = (s0 + s5) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8003e908:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8003e91c:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8003e928:
    m.write(((s0) + 0) >>> 0, v0 >>> 0, 4);
    v1 = m.read(((s1) + 480) >>> 0, 2);
    v0 = m.read(((s1) + 0) >>> 0, 2);
    a0 = v1 | 0;
    v0 = (v0 + v1) | 0;
    { const c = (a0 | 0) === 0; m.write(((s1) + 0) >>> 0, v0 & 0xffff, 2); if (c) { pc = 0x8003e94c; continue; } }
  case 0x8003e944:
    v0 = (a0 + 1) | 0;
    m.write(((s1) + 480) >>> 0, v0 & 0xffff, 2);
  case 0x8003e94c:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = s2 & 65535; if (c) { pc = 0x8003e8d4; continue; } }
  case 0x8003e960:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003e968:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003e970:
    v0 = s3 & 65535;
    { const c = (v0 | 0) === 0; v0 = (sp + 16) | 0; if (c) { pc = 0x8003e99c; continue; } }
  case 0x8003e97c:
    s3 = (s3 + -1) | 0;
    v1 = s3 & 65535;
    v1 = v1 << 1;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 480) >>> 0, 2);
    v0 = (v0 + 1) | 0;
    m.write(((v1) + 480) >>> 0, v0 & 0xffff, 2);
  case 0x8003e99c:
    s4 = (s4 + 1) | 0;
    v0 = s4 & 65535;
    v0 = (v0 >>> 0) < 300 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s3 & 65535; if (c) { pc = 0x8003e880; continue; } }
  case 0x8003e9b0:
    s6 = m.read(((sp) + 1000) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 996) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 992) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 988) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 984) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 980) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 976) >>> 0, 4) | 0;
    sp = (sp + 1008) | 0;
     return [v0, v1];
  default: throw new Error(`x8003e7c8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003ebb4, translated instruction by instruction (84 instructions).
export function* x8003ebb4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003ebb4;
  for (;;) switch (pc) {
  case 0x8003ebb4:
    sp = (sp + -40) | 0;
    a0 = (0 + 1) | 0;
    m.write(((sp) + 36) >>> 0, 0, 4);
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8003ebd8:
    a0 = (0 + 9207) | 0;
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x8003ebe4:
    a0 = (0 + 10) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8003ebf0:
    v0 = 0x801f0000 | 0;
    a0 = m.read(((v0) + 26266) >>> 0, 2);
    s2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8003ec00:
    v0 = 0x800a0000 | 0;
    s4 = (v0 + -11780) | 0;
  case 0x8003ec08:
    s1 = 0 | 0;
    v1 = 0 | 61440;
    v0 = s1 & 65535;
  case 0x8003ec14:
    v0 = v0 << 3;
    v0 = (v0 + s4) | 0;
    m.write(((v0) + 0) >>> 0, v1 >>> 0, 4);
    s1 = (s1 + 1) | 0;
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s1 & 65535; if (c) { pc = 0x8003ec14; continue; } }
  case 0x8003ec34:
    s1 = 0 | 0;
    s3 = s2 & 65535;
    a0 = s1 & 65535;
  case 0x8003ec40:
    [hi, lo] = mult(s3, a0, true);
    v0 = lo;
    v1 = 0x88880000 | 0;
    v1 = v1 | 34953;
    [hi, lo] = mult(v0, v1, true);
    s1 = (s1 + 1) | 0;
    t0 = hi;
    s0 = (t0 + v0) | 0;
    s0 = s0 >> 4;
    v0 = v0 >> 31;
    s0 = (s0 - v0) | 0;
    s0 = s0 << 3;
    s0 = (s0 + s4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054058, a0, a1, a2, a3);
  case 0x8003ec78:
    a2 = (0 + 0) | 0;
    a3 = 0x40700000 | 0;
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80054218, a0, a1, a2, a3);
  case 0x8003ec8c:
    a0 = v0 | 0;
    a1 = v1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053e98, a0, a1, a2, a3);
  case 0x8003ec98:
    m.write(((s0) + 0) >>> 0, v0 >>> 0, 4);
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = s1 & 65535; if (c) { pc = 0x8003ec40; continue; } }
  case 0x8003ecac:
    s2 = (s2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003ecb4:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003ecbc:
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 31 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8003ec08; continue; } }
  case 0x8003eccc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003e53c, a0, a1, a2, a3);
  case 0x8003ecd4:
    a0 = (0 + 300) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8003ece0:
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8003ebb4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003f3cc, translated instruction by instruction (93 instructions).
export function* x8003f3cc(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003f3cc;
  for (;;) switch (pc) {
  case 0x8003f3cc:
    sp = (sp + -56) | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = (0 + 256) | 0;
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    s3 = s4 | 0;
    m.write(((sp) + 40) >>> 0, s6 >>> 0, 4);
    s6 = 0 | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = s6 | 0;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    s1 = s2 | 0;
    v0 = 0x801f0000 | 0;
    m.write(((sp) + 36) >>> 0, s5 >>> 0, 4);
    s5 = (v0 + 26264) | 0;
    m.write(((sp) + 44) >>> 0, s7 >>> 0, 4);
    s7 = s2 | 0;
    m.write(((sp) + 48) >>> 0, 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    a1 = s4 | 0;
  case 0x8003f418:
    a2 = s3 | 0;
    s0 = s2 >> 8;
    s2 = (s2 + 2560) | 0;
    a0 = m.read(((s5) + 2) >>> 0, 2);
    s1 = (s1 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x8003f430:
    a1 = s4 | 0;
    a2 = s3 | 0;
    a0 = m.read(((s5) + 10) >>> 0, 2);
    s3 = (s3 + -21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x8003f444:
    a1 = s7 | 0;
    a0 = m.read(((s5) + 2) >>> 0, 2);
    a2 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bc68, a0, a1, a2, a3);
  case 0x8003f454:
    a1 = s7 | 0;
    a0 = m.read(((s5) + 10) >>> 0, 2);
    a2 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bc68, a0, a1, a2, a3);
  case 0x8003f464:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003f46c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003f474:
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 12 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a1 = s4 | 0; if (c) { pc = 0x8003f418; continue; } }
  case 0x8003f484:
    s1 = 0 | 0;
    v0 = 0x801f0000 | 0;
    s5 = (v0 + 26264) | 0;
    s2 = s2 >> 8;
  case 0x8003f494:
    a2 = s3 | 0;
    s0 = s6 >> 8;
    s6 = (s6 + 2560) | 0;
    a0 = m.read(((s5) + 2) >>> 0, 2);
    s1 = (s1 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x8003f4ac:
    a1 = s4 | 0;
    a2 = s3 | 0;
    a0 = m.read(((s5) + 10) >>> 0, 2);
    s4 = (s4 + -16) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x8003f4c0:
    a1 = s0 | 0;
    a0 = m.read(((s5) + 2) >>> 0, 2);
    a2 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bc68, a0, a1, a2, a3);
  case 0x8003f4d0:
    a1 = s0 | 0;
    a0 = m.read(((s5) + 10) >>> 0, 2);
    a2 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bc68, a0, a1, a2, a3);
  case 0x8003f4e0:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003f4e8:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003f4f0:
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 16 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a1 = s4 | 0; if (c) { pc = 0x8003f494; continue; } }
  case 0x8003f500:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8003f508:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8003f510:
    s7 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 56) | 0;
     return [v0, v1];
  default: throw new Error(`x8003f3cc: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003f884, translated instruction by instruction (157 instructions).
export function* x8003f884(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003f884;
  for (;;) switch (pc) {
  case 0x8003f884:
    sp = (sp + -48) | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = 0 | 0;
    v0 = 0x80070000 | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = (v0 + -1680) | 0;
    m.write(((sp) + 36) >>> 0, s5 >>> 0, 4);
    s5 = (s4 + -8) | 0;
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    s3 = (0 + 120) | 0;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 160) | 0;
    v0 = 0x800a0000 | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = (v0 + -13312) | 0;
    m.write(((sp) + 40) >>> 0, 0, 4);
  case 0x8003f8c4:
    v0 = m.read(((s0) + 4) >>> 0, 1);
    v1 = m.read(((s0) + 0) >>> 0, 2);
    v0 = v0 & 7;
    v0 = v0 << 2;
    a0 = (v0 + s4) | 0;
    a0 = m.read(((a0) + 0) >>> 0, 2);
    v0 = (v0 + s5) | 0;
    v1 = (v1 + a0) | 0;
    m.write(((s0) + 0) >>> 0, v1 & 0xffff, 2);
    v1 = m.read(((s0) + 2) >>> 0, 2);
    a0 = m.read(((v0) + 0) >>> 0, 2);
    v0 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    v1 = (v1 + a0) | 0;
    v0 = (v0 | 0) < 161 ? 1 : 0;
    m.write(((s0) + 2) >>> 0, v1 & 0xffff, 2);
    v1 = m.read(((s0) + 0) >>> 0, 2);
    { const c = (v0 | 0) !== 0; v0 = (v1 + -320) | 0; if (c) { pc = 0x8003f910; continue; } }
  case 0x8003f90c:
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2);
  case 0x8003f910:
    v0 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    v1 = m.read(((s0) + 2) >>> 0, 2);
    v0 = (v0 | 0) < 121 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (v1 + -240) | 0; if (c) { pc = 0x8003f928; continue; } }
  case 0x8003f924:
    m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2);
  case 0x8003f928:
    v0 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    v1 = m.read(((s0) + 0) >>> 0, 2);
    v0 = (v0 | 0) < -160 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = (v1 + 320) | 0; if (c) { pc = 0x8003f940; continue; } }
  case 0x8003f93c:
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2);
  case 0x8003f940:
    v0 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    v1 = m.read(((s0) + 2) >>> 0, 2);
    v0 = (v0 | 0) < -120 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = (v1 + 240) | 0; if (c) { pc = 0x8003f958; continue; } }
  case 0x8003f954:
    m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2);
  case 0x8003f958:
    a0 = (0 + 256) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x8003f960:
    v0 = v0 << 16;
    v1 = v0 >> 16;
    v0 = v1 & 1;
    { const c = (v0 | 0) === 0; v0 = v1 & 2; if (c) { pc = 0x8003f998; continue; } }
  case 0x8003f974:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003f988; continue; } }
  case 0x8003f97c:
    v0 = m.read(((s0) + 4) >>> 0, 1);
    v0 = (v0 + -1) | 0; pc = 0x8003f994; continue;
  case 0x8003f988:
    v0 = m.read(((s0) + 4) >>> 0, 1);
    v0 = (v0 + 1) | 0;
  case 0x8003f994:
    m.write(((s0) + 4) >>> 0, v0 & 0xff, 1);
  case 0x8003f998:
    v0 = m.read(((s0) + 5) >>> 0, 1);
    v0 = (v0 + 1) | 0;
    m.write(((s0) + 5) >>> 0, v0 & 0xff, 1);
    a1 = m.read(((s0) + 5) >>> 0, 1);
    v0 = 0x92490000 | 0;
    v0 = v0 | 9363;
    v1 = (a1 >>> 1) | 0;
    [hi, lo] = mult(v1, v0, false);
    a0 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    a0 = (s3 - a0) | 0;
    a3 = hi;
    v1 = (a3 >>> 2) | 0;
    v0 = v1 << 3;
    v0 = (v0 - v1) | 0;
    v0 = v0 << 1;
    a1 = (a1 - v0) | 0;
    m.write(((s0) + 5) >>> 0, a1 & 0xff, 1);
    a1 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((s0) + 5) >>> 0, 1);
    a1 = (s1 - a1) | 0;
    a2 = (a2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d8e4, a0, a1, a2, a3);
  case 0x8003f9f8:
    a0 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    a1 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((s0) + 5) >>> 0, 1);
    a0 = (s3 - a0) | 0;
    a1 = (a1 + 160) | 0;
    a2 = (a2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d8e4, a0, a1, a2, a3);
  case 0x8003fa14:
    a0 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    a1 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((s0) + 5) >>> 0, 1);
    a0 = (a0 + 120) | 0;
    a1 = (s1 - a1) | 0;
    a2 = (a2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d8e4, a0, a1, a2, a3);
  case 0x8003fa30:
    a0 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    a1 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((s0) + 5) >>> 0, 1);
    a0 = (a0 + 120) | 0;
    a1 = (a1 + 160) | 0;
    a2 = (a2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d8e4, a0, a1, a2, a3);
  case 0x8003fa4c:
    a0 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    a1 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((s0) + 5) >>> 0, 1);
    a0 = (s3 - a0) | 0;
    a1 = (s1 - a1) | 0;
    a2 = (a2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d8e4, a0, a1, a2, a3);
  case 0x8003fa68:
    a0 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    a1 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((s0) + 5) >>> 0, 1);
    a0 = (s3 - a0) | 0;
    a1 = (a1 + 160) | 0;
    a2 = (a2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d8e4, a0, a1, a2, a3);
  case 0x8003fa84:
    s2 = (s2 + 1) | 0;
    a0 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    a1 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((s0) + 5) >>> 0, 1);
    a0 = (a0 + 120) | 0;
    a1 = (s1 - a1) | 0;
    a2 = (a2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d8e4, a0, a1, a2, a3);
  case 0x8003faa4:
    a0 = (m.read(((s0) + 0) >>> 0, 2) << 16) >> 16;
    a1 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    a2 = m.read(((s0) + 5) >>> 0, 1);
    s0 = (s0 + 6) | 0;
    a0 = (a0 + 120) | 0;
    a1 = (a1 + 160) | 0;
    a2 = (a2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d8e4, a0, a1, a2, a3);
  case 0x8003fac4:
    v0 = (s2 | 0) < 12 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8003f8c4; continue; } }
  case 0x8003fad0:
    s5 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return [v0, v1];
  default: throw new Error(`x8003f884: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003fe70, translated instruction by instruction (179 instructions).
export function* x8003fe70(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003fe70;
  for (;;) switch (pc) {
  case 0x8003fe70:
    sp = (sp + -64) | 0;
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4);
    s0 = a0 | 0;
    v0 = 0x20000 | 0;
    v0 = v0 | 32768;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27324) >>> 0, 4) | 0;
    a1 = (0 + 4096) | 0;
    m.write(((sp) + 56) >>> 0, 0, 4);
    m.write(((sp) + 52) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s1 >>> 0, 4);
    a0 = (a0 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044bc0, a0, a1, a2, a3);
  case 0x8003feb0:
    s0 = s0 & 255;
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x8003fecc; continue; } }
  case 0x8003febc:
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a2 = (0 + 9205) | 0; pc = 0x8003fed8; continue;
  case 0x8003fecc:
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a2 = (0 + 9209) | 0;
  case 0x8003fed8:
    s4 = (0 + 4096) | 0; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x8003fee0:
    a0 = (0 + 11) | 0;
    a3 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27584) >>> 0, 4) | 0;
    s3 = a3 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003b398, a0, a1, a2, a3);
  case 0x8003ff00:
    s1 = 0x80080000 | 0;
    s1 = m.read(((s1) + -27324) >>> 0, 4) | 0;
    s2 = 0 | 0;
  case 0x8003ff0c:
    m.write(((s1) + 0) >>> 0, s2 & 0xffff, 2);
    s1 = (s1 + 2) | 0;
    m.write(((s1) + 0) >>> 0, s3 & 0xffff, 2);
    s2 = (s2 + 1) | 0;
    v0 = (s2 >>> 0) < 64 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s1 = (s1 + 2) | 0; if (c) { pc = 0x8003ff0c; continue; } }
  case 0x8003ff28:
    s3 = (s3 + 1) | 0;
    v0 = (s3 >>> 0) < 64 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s2 = 0 | 0; if (c) { pc = 0x8003ff0c; continue; } }
  case 0x8003ff38:
    s3 = 0 | 0;
    v0 = s4 << 16;
    s5 = v0 >> 16;
  case 0x8003ff44:
    s1 = 0x80080000 | 0;
    s1 = m.read(((s1) + -27324) >>> 0, 4) | 0;
    { const c = (s4 | 0) === 0; s2 = 0 | 0; if (c) { pc = 0x8003ffb0; continue; } }
  case 0x8003ff54:
    a0 = s5 | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x8003ff5c:
    a0 = s5 | 0;
    s0 = v0 << 16;
    s0 = s0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x8003ff6c:
    s0 = s0 << 2;
    s0 = (s0 + s1) | 0;
    v0 = v0 << 16;
    v0 = v0 >> 14;
    v0 = (v0 + s1) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 2);
    a0 = m.read(((s0) + 0) >>> 0, 2);
    m.write(((s0) + 0) >>> 0, v1 & 0xffff, 2);
    m.write(((v0) + 0) >>> 0, a0 & 0xffff, 2);
    a0 = m.read(((s0) + 2) >>> 0, 2);
    v1 = m.read(((v0) + 2) >>> 0, 2);
    s2 = (s2 + 1) | 0;
    m.write(((s0) + 2) >>> 0, v1 & 0xffff, 2);
    m.write(((v0) + 2) >>> 0, a0 & 0xffff, 2);
    v0 = (s2 >>> 0) < (s4 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8003ff54; continue; } }
  case 0x8003ffb0:
    s3 = (s3 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003ffb8:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8003ffc0:
    v0 = (s3 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x8003ff44; continue; } }
  case 0x8003ffcc:
    a1 = (0 + 11) | 0;
    a2 = (0 + 12) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001cd20, a0, a1, a2, a3);
  case 0x8003ffd8:
    a0 = (0 + 2) | 0;
    a1 = (0 + 256) | 0;
    s4 = 0 | 0;
    s2 = s4 | 0;
    s5 = 0 | 51430;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 230) | 0;
    m.write(((a2) + 4) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 160) | 0;
    m.write(((a2) + 6) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 64) | 0;
    m.write(((a2) + 8) >>> 0, v0 & 0xffff, 2);
    m.write(((a2) + 10) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a2) + 0) >>> 0, 4) | 0;
    v1 = 0x50000000 | 0;
    v0 = v0 | v1;
    m.write(((a2) + 0) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002cae0, a0, a1, a2, a3);
  case 0x80040024:
    v0 = 0x20000 | 0;
    s1 = 0x80080000 | 0;
    s1 = m.read(((s1) + -27324) >>> 0, 4) | 0;
    v0 = v0 | 32768;
    s0 = (s1 + v0) | 0;
  case 0x80040038:
    s3 = 0 | 0;
    v0 = (s4 >>> 0) < 4096 ? 1 : 0;
  case 0x80040040:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80040098; continue; } }
  case 0x80040048:
    a1 = m.read(((s1) + 0) >>> 0, 2);
    s1 = (s1 + 2) | 0;
    v1 = m.read(((s1) + 0) >>> 0, 2);
    s1 = (s1 + 2) | 0;
    s4 = (s4 + 1) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27584) >>> 0, 4) | 0;
    a1 = a1 & 65535;
    v1 = v1 & 65535;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 6;
    v0 = (v0 + a1) | 0;
    v0 = (v0 + a0) | 0;
    v0 = (v0 + s5) | 0;
    v1 = v1 << 6;
    a1 = (s0 + a1) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    v1 = (v1 + a1) | 0;
    m.write(((v1) + 0) >>> 0, v0 & 0xff, 1);
  case 0x80040098:
    s3 = (s3 + 1) | 0;
    v0 = (s3 >>> 0) < 37 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (s4 >>> 0) < 4096 ? 1 : 0; if (c) { pc = 0x80040040; continue; } }
  case 0x800400a8:
    a0 = (0 + 11) | 0;
    a1 = s0 | 0;
    a2 = 0 | 0;
    a3 = a2 | 0;
    v0 = (0 + 64) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cb1c, a0, a1, a2, a3);
  case 0x800400cc:
    s2 = (s2 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800400d4:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800400dc:
    v0 = (s2 >>> 0) < 120 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = 0x10000 | 0; if (c) { pc = 0x80040038; continue; } }
  case 0x800400e8:
    s2 = 0 | 0;
    v1 = v1 | 11263;
  case 0x800400f0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27584) >>> 0, 4) | 0;
    v0 = (v0 + s2) | 0;
    s2 = (s2 + 1) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    v0 = (v1 >>> 0) < (s2 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x800400f0; continue; } }
  case 0x80040114:
    s5 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
     return [v0, v1];
  default: throw new Error(`x8003fe70: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80040178, translated instruction by instruction (152 instructions).
export function* x80040178(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80040178;
  for (;;) switch (pc) {
  case 0x80040178:
    sp = (sp + -40) | 0;
    v1 = (m.read(((0x8007913c) + 472) >>> 0, 1) << 24) >> 24;
    v0 = (0 + -1) | 0;
    m.write(((sp) + 36) >>> 0, 0, 4);
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    { const c = (v1 | 0) === (v0 | 0); m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x800403b4; continue; } }
  case 0x800401a0:
    v0 = (0 + 3) | 0;
    { const c = (v1 | 0) === (v0 | 0); s1 = 0 | 0; if (c) { pc = 0x800403b4; continue; } }
  case 0x800401ac:
    v0 = 0x800d0000 | 0;
    s4 = (v0 + -30688) | 0;
    v0 = 0x80070000 | 0;
    s3 = (v0 + -1136) | 0;
    v0 = 0x80070000 | 0;
    s2 = (v0 + -1168) | 0;
    v0 = s1 & 65535;
  case 0x800401c8:
    v0 = v0 << 3;
    s0 = (v0 + s4) | 0;
    v0 = m.read(((s0) + 6) >>> 0, 1);
    v0 = (v0 + s3) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    m.write(((0x8007913c) + 1180) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((s0) + 6) >>> 0, 1);
    v1 = m.read(((s0) + 4) >>> 0, 1);
    v0 = v0 << 2;
    v0 = (v0 + s2) | 0;
    v1 = v1 << 2;
    a1 = m.read(((v0) + 0) >>> 0, 4) | 0;
    v0 = m.read(((s0) + 0) >>> 0, 2);
    v1 = (v1 + a1) | 0;
    a0 = m.read(((v1) + 0) >>> 0, 2);
    v1 = m.read(((s0) + 4) >>> 0, 1);
    v0 = (v0 + a0) | 0;
    v1 = v1 << 2;
    a0 = m.read(((s0) + 2) >>> 0, 2);
    v1 = (v1 + a1) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2);
    a2 = m.read(((v1) + 2) >>> 0, 2);
    v1 = m.read(((0x8007913c) + 1064) >>> 0, 4) | 0;
    v0 = m.read(((s0) + 4) >>> 0, 1);
    a1 = m.read(((0x8007913c) + 1072) >>> 0, 4) | 0;
    v0 = (v0 + 1) | 0;
    a0 = (a0 + a2) | 0;
    a0 = (a0 + 1) | 0;
    v1 = v1 >> 8;
    m.write(((s0) + 4) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((s0) + 0) >>> 0, 2);
    a1 = a1 >> 8;
    m.write(((s0) + 2) >>> 0, a0 & 0xffff, 2);
    v0 = (v0 + v1) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = a0 | 0;
    v1 = m.read(((s0) + 0) >>> 0, 2);
    a0 = m.read(((0x8007913c) + 1180) >>> 0, 2);
    v0 = (v0 + a1) | 0;
    m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2);
    v1 = v1 & 127;
    m.write(((s0) + 0) >>> 0, v1 & 0xffff, 2);
    v1 = m.read(((s0) + 4) >>> 0, 1);
    v0 = v0 & 127;
    v1 = (v1 >>> 0) < (a0 >>> 0) ? 1 : 0;
    { const c = (v1 | 0) !== 0; m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2); if (c) { pc = 0x8004029c; continue; } }
  case 0x8004028c:
    a0 = (0 + 7) | 0;
    m.write(((s0) + 4) >>> 0, 0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040298:
    m.write(((s0) + 6) >>> 0, v0 & 0xff, 1);
  case 0x8004029c:
    s1 = (s1 + 1) | 0;
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 48 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s1 & 65535; if (c) { pc = 0x800401c8; continue; } }
  case 0x800402b0:
    s1 = 0 | 0;
    v0 = 0x800a0000 | 0;
    s4 = (v0 + 28088) | 0;
    v0 = 0x80070000 | 0;
    s3 = (v0 + -1136) | 0;
    v0 = 0x80070000 | 0;
    s2 = (v0 + -1168) | 0;
    v0 = s1 & 65535;
  case 0x800402d0:
    v0 = v0 << 3;
    s0 = (v0 + s4) | 0;
    v0 = m.read(((s0) + 6) >>> 0, 1);
    v0 = (v0 + s3) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    m.write(((0x8007913c) + 1180) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((s0) + 6) >>> 0, 1);
    v1 = m.read(((s0) + 4) >>> 0, 1);
    v0 = v0 << 2;
    v0 = (v0 + s2) | 0;
    v1 = v1 << 2;
    a1 = m.read(((v0) + 0) >>> 0, 4) | 0;
    v0 = m.read(((s0) + 0) >>> 0, 2);
    v1 = (v1 + a1) | 0;
    a0 = m.read(((v1) + 0) >>> 0, 2);
    v1 = m.read(((s0) + 4) >>> 0, 1);
    v0 = (v0 + a0) | 0;
    v1 = v1 << 2;
    a0 = m.read(((s0) + 2) >>> 0, 2);
    v1 = (v1 + a1) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2);
    a2 = m.read(((v1) + 2) >>> 0, 2);
    v1 = m.read(((0x8007913c) + 1016) >>> 0, 4) | 0;
    v0 = m.read(((s0) + 4) >>> 0, 1);
    a1 = m.read(((0x8007913c) + 1024) >>> 0, 4) | 0;
    v0 = (v0 + 1) | 0;
    a0 = (a0 + a2) | 0;
    a0 = (a0 + 1) | 0;
    v1 = v1 >> 8;
    m.write(((s0) + 4) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((s0) + 0) >>> 0, 2);
    a1 = a1 >> 8;
    m.write(((s0) + 2) >>> 0, a0 & 0xffff, 2);
    v0 = (v0 + v1) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = a0 | 0;
    a0 = m.read(((s0) + 0) >>> 0, 1);
    v0 = (v0 + a1) | 0;
    m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((s0) + 4) >>> 0, 1);
    v1 = m.read(((0x8007913c) + 1180) >>> 0, 2);
    a1 = m.read(((s0) + 2) >>> 0, 1);
    v0 = (v0 >>> 0) < (v1 >>> 0) ? 1 : 0;
    m.write(((s0) + 0) >>> 0, a0 & 0xffff, 2);
    { const c = (v0 | 0) !== 0; m.write(((s0) + 2) >>> 0, a1 & 0xffff, 2); if (c) { pc = 0x800403a0; continue; } }
  case 0x80040390:
    a0 = (0 + 7) | 0;
    m.write(((s0) + 4) >>> 0, 0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x8004039c:
    m.write(((s0) + 6) >>> 0, v0 & 0xff, 1);
  case 0x800403a0:
    s1 = (s1 + 1) | 0;
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 70 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s1 & 65535; if (c) { pc = 0x800402d0; continue; } }
  case 0x800403b4:
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x80040178: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80040ab0, translated instruction by instruction (248 instructions).
export function* x80040ab0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80040ab0;
  for (;;) switch (pc) {
  case 0x80040ab0:
    v0 = (m.read(((0x8007913c) + 472) >>> 0, 1) << 24) >> 24;
    sp = (sp + -56) | 0;
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    s3 = a0 | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    s0 = s3 & 255;
    m.write(((sp) + 48) >>> 0, 0, 4);
    m.write(((sp) + 44) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    { const c = (v0 | 0) === (s0 | 0); m.write(((sp) + 28) >>> 0, s1 >>> 0, 4); if (c) { pc = 0x80040e68; continue; } }
  case 0x80040ae0:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80040ae8:
    { const c = (s0 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x80040b00; continue; } }
  case 0x80040af0:
    { const c = (s0 | 0) === (v0 | 0); s1 = 0 | 0; if (c) { pc = 0x80040b30; continue; } }
  case 0x80040af8:
    v0 = 0x800d0000 | 0; pc = 0x80040b58; continue;
  case 0x80040b00:
    v0 = (0 + -512) | 0;
    m.write(((0x8007913c) + 1016) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1100) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1064) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1132) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 256) | 0;
    m.write(((0x8007913c) + 1024) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1104) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1072) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1152) >>> 0, v0 >>> 0, 4);
    s1 = 0 | 0; pc = 0x80040b54; continue;
  case 0x80040b30:
    v0 = (0 + -2048) | 0;
    m.write(((0x8007913c) + 1016) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1100) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1064) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1132) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1024) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 1104) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 1072) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 1152) >>> 0, 0 >>> 0, 4);
  case 0x80040b54:
    v0 = 0x800d0000 | 0;
  case 0x80040b58:
    s5 = (v0 + -30688) | 0;
    v0 = 0x80010000 | 0;
    s4 = (v0 + 9548) | 0;
    s2 = (0 + 12) | 0;
    v0 = s1 & 65535;
  case 0x80040b6c:
    v0 = v0 << 3;
    s0 = (v0 + s5) | 0;
    v1 = m.read(((s0) + 6) >>> 0, 1);
    v0 = (v1 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x80040bc0; continue; } }
  case 0x80040b88:
    v0 = (v0 + s4) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x80040b9c:
    v0 = (0 + 17) | 0; pc = 0x80040bbc; continue;
  case 0x80040ba4:
    m.write(((0x8007913c) + 1180) >>> 0, s2 & 0xffff, 2);
     pc = 0x80040bc0; continue;
  case 0x80040bb0:
    v0 = (0 + 8) | 0; pc = 0x80040bbc; continue;
  case 0x80040bb8:
    v0 = (0 + 19) | 0;
  case 0x80040bbc:
    m.write(((0x8007913c) + 1180) >>> 0, v0 & 0xffff, 2);
  case 0x80040bc0:
    a0 = (0 + 128) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040bc8:
    a0 = (0 + 128) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040bd4:
    a0 = (m.read(((0x8007913c) + 1180) >>> 0, 2) << 16) >> 16;
    s1 = (s1 + 1) | 0;
    m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040be4:
    a0 = (0 + 4) | 0;
    m.write(((s0) + 4) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040bf0:
    a0 = (0 + 7) | 0;
    m.write(((s0) + 5) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040bfc:
    m.write(((s0) + 6) >>> 0, v0 & 0xff, 1);
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 48 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s1 & 65535; if (c) { pc = 0x80040b6c; continue; } }
  case 0x80040c10:
    s1 = 0 | 0;
    v0 = 0x800a0000 | 0;
    s5 = (v0 + 28088) | 0;
    v0 = 0x80010000 | 0;
    s4 = (v0 + 9580) | 0;
    s2 = (0 + 12) | 0;
    v0 = s1 & 65535;
  case 0x80040c2c:
    v0 = v0 << 3;
    s0 = (v0 + s5) | 0;
    v1 = m.read(((s0) + 6) >>> 0, 1);
    v0 = (v1 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x80040c80; continue; } }
  case 0x80040c48:
    v0 = (v0 + s4) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x80040c5c:
    v0 = (0 + 17) | 0; pc = 0x80040c7c; continue;
  case 0x80040c64:
    m.write(((0x8007913c) + 1180) >>> 0, s2 & 0xffff, 2);
     pc = 0x80040c80; continue;
  case 0x80040c70:
    v0 = (0 + 8) | 0; pc = 0x80040c7c; continue;
  case 0x80040c78:
    v0 = (0 + 19) | 0;
  case 0x80040c7c:
    m.write(((0x8007913c) + 1180) >>> 0, v0 & 0xffff, 2);
  case 0x80040c80:
    a0 = (0 + 256) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040c88:
    a0 = (0 + 256) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040c94:
    a0 = (m.read(((0x8007913c) + 1180) >>> 0, 2) << 16) >> 16;
    m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040ca0:
    v1 = s3 & 255;
    { const c = (v1 | 0) === 0; m.write(((s0) + 4) >>> 0, v0 & 0xff, 1); if (c) { pc = 0x80040cc0; continue; } }
  case 0x80040cac:
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x80040cec; continue; } }
  case 0x80040cb8:
     pc = 0x80040d18; continue;
  case 0x80040cc0:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040cc8:
    v0 = v0 << 16;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80040ce4; continue; } }
  case 0x80040cd4:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040cdc:
    v0 = (v0 + 2) | 0; pc = 0x80040d14; continue;
  case 0x80040ce4:
    v0 = (0 + 1) | 0; pc = 0x80040d14; continue;
  case 0x80040cec:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040cf4:
    v0 = v0 << 16;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80040d10; continue; } }
  case 0x80040d00:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040d08:
    v0 = (v0 + 8) | 0; pc = 0x80040d14; continue;
  case 0x80040d10:
    v0 = (0 + 7) | 0;
  case 0x80040d14:
    m.write(((s0) + 5) >>> 0, v0 & 0xff, 1);
  case 0x80040d18:
    a0 = (0 + 7) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040d20:
    m.write(((s0) + 6) >>> 0, v0 & 0xff, 1);
    s1 = (s1 + 1) | 0;
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 70 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s1 & 65535; if (c) { pc = 0x80040c2c; continue; } }
  case 0x80040d38:
     [v0, v1] = yield* call(ctx, sp, 0x8002d9e4, a0, a1, a2, a3);
  case 0x80040d40:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28024) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80040d5c; continue; } }
  case 0x80040d54:
    a0 = (0 + 9206) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c7fc, a0, a1, a2, a3);
  case 0x80040d5c:
    a0 = 0x800d0000 | 0;
    a0 = (a0 + -31712) | 0;
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28024) >>> 0, v0 & 0xff, 1);
    a1 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003abec, a0, a1, a2, a3);
  case 0x80040d78:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80040d80:
    a0 = (0 + 21) | 0;
    a1 = 0 | 0;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -11664) | 0;
    v1 = (0 + 510) | 0;
    a2 = 0x1000000 | 0;
    m.write(((v0) + 244) >>> 0, v1 >>> 0, 4);
    v1 = (0 + 501) | 0;
    m.write(((v0) + 240) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 248) >>> 0, a2 >>> 0, 4);
    m.write(((v0) + 168) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 172) >>> 0, v1 >>> 0, 4);
    m.write(((v0) + 176) >>> 0, a2 >>> 0, 4);
    v0 = (0 + 240) | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x80040dc8:
    a0 = (0 + 120) | 0;
    a1 = (0 + 3) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27352) >>> 0, 2);
    v0 = 0x801f0000 | 0;
    m.write(((v0) + 26270) >>> 0, v1 & 0xffff, 2);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27404) >>> 0, 4) | 0;
    a3 = a1 | 0;
    m.write(((v0) + 49) >>> 0, a3 & 0xff, 1);
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 13) | 0;
    m.write(((a2) + 51) >>> 0, v0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4096) | 0;
    m.write(((a2) + 30) >>> 0, v0 & 0xffff, 2);
    m.write(((v1) + 56) >>> 0, a3 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 4) | 0;
    m.write(((v1) + 35) >>> 0, v0 & 0xff, 1);
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 320) | 0;
    m.write(((a2) + 8) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 64) | 0;
    m.write(((a2) + 10) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a2) + 0) >>> 0, 4) | 0;
    v1 = 0x50000000 | 0;
    v0 = v0 | v1;
    m.write(((a2) + 0) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80040e50:
    v0 = (0 + -1) | 0;
    m.write(((0x8007913c) + 472) >>> 0, s3 & 0xff, 1);
    m.write(((0x8007913c) + 480) >>> 0, v0 & 0xffff, 2);
     [v0, v1] = yield* call(ctx, sp, 0x80040178, a0, a1, a2, a3);
  case 0x80040e64:
    m.write(((0x8007913c) + 482) >>> 0, 0 & 0xffff, 2);
  case 0x80040e68:
    s5 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 56) | 0;
     return [v0, v1];
  default: throw new Error(`x80040ab0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80040ebc, translated instruction by instruction (108 instructions).
export function* x80040ebc(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80040ebc;
  for (;;) switch (pc) {
  case 0x80040ebc:
    sp = (sp + -40) | 0;
    v1 = (m.read(((0x8007913c) + 472) >>> 0, 1) << 24) >> 24;
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    { const c = (v1 | 0) !== (v0 | 0); m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x8004104c; continue; } }
  case 0x80040ee0:
    s1 = 0 | 0;
    v0 = 0x800a0000 | 0;
    s3 = (v0 + 28088) | 0;
    v0 = 0x80070000 | 0;
    s2 = (v0 + -1168) | 0;
    a2 = s1 & 65535;
  case 0x80040ef8:
    v0 = a2 << 3;
    s0 = (v0 + s3) | 0;
    v0 = 0x80070000 | 0;
    v1 = m.read(((s0) + 6) >>> 0, 1);
    v0 = (v0 + -1136) | 0;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 1);
    m.write(((0x8007913c) + 1180) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((s0) + 6) >>> 0, 1);
    v1 = m.read(((s0) + 4) >>> 0, 1);
    v0 = v0 << 2;
    v0 = (v0 + s2) | 0;
    v1 = v1 << 2;
    a1 = m.read(((v0) + 0) >>> 0, 4) | 0;
    v0 = m.read(((s0) + 0) >>> 0, 2);
    v1 = (v1 + a1) | 0;
    a0 = m.read(((v1) + 0) >>> 0, 2);
    v1 = m.read(((s0) + 4) >>> 0, 1);
    v0 = (v0 + a0) | 0;
    v1 = v1 << 2;
    v1 = (v1 + a1) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((s0) + 2) >>> 0, 2);
    v1 = m.read(((v1) + 2) >>> 0, 2);
    a2 = (a2 >>> 0) < 30 ? 1 : 0;
    v0 = (v0 + v1) | 0;
    v0 = (v0 + 1) | 0;
    { const c = (a2 | 0) === 0; m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2); if (c) { pc = 0x80040f9c; continue; } }
  case 0x80040f70:
    v0 = m.read(((0x8007913c) + 1016) >>> 0, 4) | 0;
    v1 = m.read(((s0) + 0) >>> 0, 2);
    v0 = v0 >> 8;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((0x8007913c) + 1024) >>> 0, 4) | 0;
    m.write(((s0) + 0) >>> 0, v1 & 0xffff, 2);
    v1 = m.read(((s0) + 2) >>> 0, 2);
    v0 = v0 >> 8;
    v1 = (v1 + v0) | 0;
    m.write(((s0) + 2) >>> 0, v1 & 0xffff, 2); pc = 0x80040fdc; continue;
  case 0x80040f9c:
    v0 = m.read(((0x8007913c) + 1016) >>> 0, 4) | 0;
    a0 = m.read(((0x8007913c) + 1024) >>> 0, 4) | 0;
    v1 = v0 >> 8;
    v0 = (v0 >>> 31) | 0;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((s0) + 0) >>> 0, 2);
    v1 = v1 >> 1;
    v0 = (v0 + v1) | 0;
    v1 = a0 >> 8;
    a0 = (a0 >>> 31) | 0;
    v1 = (v1 + a0) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((s0) + 2) >>> 0, 2);
    v1 = v1 >> 1;
    v0 = (v0 + v1) | 0;
    m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2);
  case 0x80040fdc:
    v0 = m.read(((s0) + 4) >>> 0, 1);
    v1 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    v0 = (v0 + 1) | 0;
    v1 = (v1 | 0) < 210 ? 1 : 0;
    { const c = (v1 | 0) !== 0; m.write(((s0) + 4) >>> 0, v0 & 0xff, 1); if (c) { pc = 0x80041014; continue; } }
  case 0x80040ff4:
    a0 = (0 + 60) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80040ffc:
    v0 = (v0 + 155) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 124) | 0;
    m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 25) | 0;
    m.write(((s0) + 7) >>> 0, v0 & 0xff, 1);
  case 0x80041014:
    v0 = m.read(((s0) + 4) >>> 0, 1);
    v1 = m.read(((0x8007913c) + 1180) >>> 0, 2);
    v0 = (v0 >>> 0) < (v1 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 7) | 0; if (c) { pc = 0x80041038; continue; } }
  case 0x8004102c:
    m.write(((s0) + 4) >>> 0, 0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x80041034:
    m.write(((s0) + 6) >>> 0, v0 & 0xff, 1);
  case 0x80041038:
    s1 = (s1 + 1) | 0;
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 60 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a2 = s1 & 65535; if (c) { pc = 0x80040ef8; continue; } }
  case 0x8004104c:
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x80040ebc: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800411e8, translated instruction by instruction (110 instructions).
export function* x800411e8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800411e8;
  for (;;) switch (pc) {
  case 0x800411e8:
    sp = (sp + -40) | 0;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    s1 = 0 | 0;
    v0 = 0x800a0000 | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = (v0 + 28088) | 0;
    v0 = 0x80010000 | 0;
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    s3 = (v0 + 9612) | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = (0 + 12) | 0;
    v0 = (0 + -256) | 0;
    m.write(((0x8007913c) + 1016) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1100) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1064) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1132) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 256) | 0;
    m.write(((sp) + 36) >>> 0, 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    m.write(((0x8007913c) + 1024) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1104) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1072) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1152) >>> 0, v0 >>> 0, 4);
    v0 = s1 & 65535;
  case 0x80041248:
    v0 = v0 << 3;
    s0 = (v0 + s4) | 0;
    v1 = m.read(((s0) + 6) >>> 0, 1);
    v0 = (v1 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = v1 << 2; if (c) { pc = 0x8004129c; continue; } }
  case 0x80041264:
    v0 = (v0 + s3) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x80041278:
    v0 = (0 + 17) | 0; pc = 0x80041298; continue;
  case 0x80041280:
    m.write(((0x8007913c) + 1180) >>> 0, s2 & 0xffff, 2);
     pc = 0x8004129c; continue;
  case 0x8004128c:
    v0 = (0 + 8) | 0; pc = 0x80041298; continue;
  case 0x80041294:
    v0 = (0 + 19) | 0;
  case 0x80041298:
    m.write(((0x8007913c) + 1180) >>> 0, v0 & 0xffff, 2);
  case 0x8004129c:
    a0 = (0 + 60) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x800412a4:
    a0 = (0 + 25) | 0;
    v0 = (v0 + 155) | 0;
    m.write(((s0) + 0) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x800412b4:
    a0 = (m.read(((0x8007913c) + 1180) >>> 0, 2) << 16) >> 16;
    v0 = (v0 + 124) | 0;
    m.write(((s0) + 2) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x800412c4:
    a0 = (0 + 25) | 0;
    m.write(((s0) + 4) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x800412d0:
    a0 = (0 + 4) | 0;
    m.write(((s0) + 7) >>> 0, v0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x800412dc:
    v0 = v0 << 16;
    { const c = (v0 | 0) !== 0; v0 = (0 + 1) | 0; if (c) { pc = 0x800412f0; continue; } }
  case 0x800412e8:
    m.write(((s0) + 5) >>> 0, v0 & 0xff, 1); pc = 0x800412f4; continue;
  case 0x800412f0:
    m.write(((s0) + 5) >>> 0, 0 & 0xff, 1);
  case 0x800412f4:
    a0 = (0 + 7) | 0; [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x800412fc:
    m.write(((s0) + 6) >>> 0, v0 & 0xff, 1);
    s1 = (s1 + 1) | 0;
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 60 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s1 & 65535; if (c) { pc = 0x80041248; continue; } }
  case 0x80041314:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28024) >>> 0, 1);
    { const c = (v0 | 0) !== 0; a0 = 0x800d0000 | 0; if (c) { pc = 0x80041338; continue; } }
  case 0x80041328:
    a0 = (0 + 9206) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c7fc, a0, a1, a2, a3);
  case 0x80041330:
    s1 = 0 | 0; pc = 0x80041348; continue;
  case 0x80041338:
    a0 = (a0 + -31712) | 0;
    a1 = (0 + 30) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003abec, a0, a1, a2, a3);
  case 0x80041344:
    s1 = 0 | 0;
  case 0x80041348:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28024) >>> 0, v0 & 0xff, 1);
    v0 = (0 + 3) | 0;
    m.write(((0x8007913c) + 472) >>> 0, v0 & 0xff, 1);
    v0 = (0 + -1) | 0;
    m.write(((0x8007913c) + 480) >>> 0, v0 & 0xffff, 2);
  case 0x80041364:
    s1 = (s1 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80040ebc, a0, a1, a2, a3);
  case 0x8004136c:
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 30 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80041364; continue; } }
  case 0x8004137c:
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x800411e8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800418d0, translated instruction by instruction (816 instructions).
export function* effectSwitch(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800418d0;
  for (;;) switch (pc) {
  case 0x800418d0:
    sp = (sp + -32) | 0;
    a2 = a0 | 0;
    v1 = a2 & 65535;
    v0 = (v1 >>> 0) < 256 ? 1 : 0;
    m.write(((sp) + 24) >>> 0, 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    { const c = (v0 | 0) === 0; m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x80042578; continue; } }
  case 0x800418f0:
    v0 = 0x80010000 | 0;
    v0 = (v0 + 9644) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x80041910:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28029) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v1 = 0 | 0; if (c) { pc = 0x80041994; continue; } }
  case 0x80041924:
    a0 = 0x80080000 | 0;
    a0 = (a0 + -27344) | 0;
    v0 = v1 & 255;
  case 0x80041930:
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    v1 = (v1 + 1) | 0;
    v0 = v1 & 255;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 & 255; if (c) { pc = 0x80041930; continue; } }
  case 0x8004194c:
    v1 = 0 | 0;
    v0 = 0x80200000 | 0;
    a0 = (v0 + -8104) | 0;
    v0 = v1 & 255;
  case 0x8004195c:
    v1 = (v1 + 1) | 0;
    v0 = v0 << 3;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xffff, 2);
    m.write(((v0) + 2) >>> 0, 0 & 0xff, 1);
    m.write(((v0) + 4) >>> 0, 0 & 0xffff, 2);
    m.write(((v0) + 6) >>> 0, 0 & 0xffff, 2);
    v0 = v1 & 255;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 & 255; if (c) { pc = 0x8004195c; continue; } }
  case 0x80041988:
    v0 = (0 + -1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27970) >>> 0, v0 & 0xff, 1);
  case 0x80041994:
    v0 = (m.read(((0x8007913c) + 472) >>> 0, 1) << 24) >> 24;
    s0 = (0 + -1) | 0;
    m.write(((0x8007913c) + 460) >>> 0, 0 >>> 0, 4);
    m.write(((0x8007913c) + 912) >>> 0, 0 & 0xff, 1);
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x800419bc; continue; } }
  case 0x800419ac:
    m.write(((0x8007913c) + 472) >>> 0, s0 & 0xff, 1);
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800419b8:
    m.write(((0x8007913c) + 480) >>> 0, s0 & 0xffff, 2);
  case 0x800419bc:
     [v0, v1] = yield* call(ctx, sp, 0x80031e8c, a0, a1, a2, a3);
  case 0x800419c4:
    v0 = m.read(((0x8007913c) + 457) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x800419e0; continue; } }
  case 0x800419d4:
    m.write(((0x8007913c) + 457) >>> 0, 0 & 0xff, 1);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800419e0:
     [v0, v1] = yield* call(ctx, sp, 0x8002d388, a0, a1, a2, a3);
  case 0x800419e8:
     [v0, v1] = yield* call(ctx, sp, 0x8002d388, a0, a1, a2, a3);
  case 0x800419f0:
    v0 = m.read(((0x8007913c) + 448) >>> 0, 4) | 0;
    m.write(((0x8007913c) + 467) >>> 0, 0 & 0xff, 1);
    { const c = (v0 | 0) === 0; v1 = 0 | 0; if (c) { pc = 0x80041a48; continue; } }
  case 0x80041a00:
    m.write(((0x8007913c) + 448) >>> 0, 0 >>> 0, 4);
    v0 = 0x800a0000 | 0;
    a0 = (v0 + -9656) | 0;
    v0 = v1 & 255;
  case 0x80041a10:
    v1 = (v1 + 1) | 0;
    v0 = (v0 + 1) | 0;
    v0 = v0 << 3;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 4) >>> 0, 0 >>> 0, 4);
    v0 = v1 & 255;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 & 255; if (c) { pc = 0x80041a10; continue; } }
  case 0x80041a38:
    v0 = 0x800a0000 | 0;
    v0 = (v0 + -9656) | 0;
    m.write(((v0) + 40) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 44) >>> 0, 0 >>> 0, 4);
  case 0x80041a48:
    v0 = 0x801f0000 | 0;
    a0 = m.read(((v0) + 26268) >>> 0, 2);
    m.write(((0x8007913c) + 464) >>> 0, 0 & 0xff, 1);
    a1 = (0 + 12) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x80041a5c:
    v1 = m.read(((0x8007913c) + 466) >>> 0, 1);
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80041a80; continue; } }
  case 0x80041a6c:
    m.write(((0x8007913c) + 466) >>> 0, 0 & 0xff, 1);
    a0 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80041a78:
     [v0, v1] = yield* call(ctx, sp, 0x8002d984, a0, a1, a2, a3);
  case 0x80041a80:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28029) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80041aa4; continue; } }
  case 0x80041a94:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80041a9c:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80041aa4:
    at = 0x80080000 | 0;
    m.write(((at) + -27986) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, 0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x80041abc:
    a0 = (0 + 50) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003e154, a0, a1, a2, a3);
  case 0x80041ac4:
     pc = 0x80042578; continue;
  case 0x80041acc:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003e53c, a0, a1, a2, a3);
  case 0x80041ad4:
     pc = 0x80042578; continue;
  case 0x80041adc:
     [v0, v1] = yield* call(ctx, sp, 0x8003e7c8, a0, a1, a2, a3);
  case 0x80041ae4:
     pc = 0x80042578; continue;
  case 0x80041aec:
    at = 0x80080000 | 0;
    m.write(((at) + -27986) >>> 0, a2 & 0xff, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80040ab0, a0, a1, a2, a3);
  case 0x80041afc:
     pc = 0x80042578; continue;
  case 0x80041b04:
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, a2 & 0xff, 1);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80030188, a0, a1, a2, a3);
  case 0x80041b14:
     pc = 0x80042578; continue;
  case 0x80041b1c:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ff40, a0, a1, a2, a3);
  case 0x80041b24:
     pc = 0x80041fac; continue;
  case 0x80041b2c:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002fcf4, a0, a1, a2, a3);
  case 0x80041b34:
     pc = 0x80041f88; continue;
  case 0x80041b3c:
     [v0, v1] = yield* call(ctx, sp, 0x8003ebb4, a0, a1, a2, a3);
  case 0x80041b44:
     [v0, v1] = yield* call(ctx, sp, 0x80031e20, a0, a1, a2, a3);
  case 0x80041b4c:
     pc = 0x80042578; continue;
  case 0x80041b54:
    a0 = (0 + 9100) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, a2 & 0xff, 1);
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001cde4, a0, a1, a2, a3);
  case 0x80041b68:
    a0 = (0 + 1) | 0;
    a1 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cae0, a0, a1, a2, a3);
  case 0x80041b74:
    v0 = 0x801f0000 | 0;
    a0 = m.read(((v0) + 26266) >>> 0, 2);
    v0 = (0 + 1) | 0;
    m.write(((0x8007913c) + 457) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x80041b8c:
     pc = 0x80042578; continue;
  case 0x80041b94:
     [v0, v1] = yield* call(ctx, sp, 0x800305f4, a0, a1, a2, a3);
  case 0x80041b9c:
     pc = 0x80042578; continue;
  case 0x80041ba4:
    a0 = (0 + 120) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80041bb0:
    a0 = (0 + 120) | 0;
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80041bbc:
    a0 = (0 + 120) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80041bc8:
    a0 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x80041bd0:
     [v0, v1] = yield* call(ctx, sp, 0x8002f3c0, a0, a1, a2, a3);
  case 0x80041bd8:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80041be0:
    a0 = (0 + 1) | 0;
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80041bec:
    a0 = (0 + 1) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80041bf8:
    a0 = (0 + 1) | 0; pc = 0x80042334; continue;
  case 0x80041c00:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80030e94, a0, a1, a2, a3);
  case 0x80041c08:
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, 0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x80041c18:
    s0 = 0 | 0;
    s1 = (0 + 2) | 0;
  case 0x80041c20:
    a1 = s0 & 65535;
    [hi, lo] = div(0, a1, true);
    { const c = (s1 | 0) !== 0;  if (c) { pc = 0x80041c34; continue; } }
  case 0x80041c30:
    throw new Error("break 7 at 0x80041c30");
  case 0x80041c34:
    at = (0 + -1) | 0;
    { const c = (s1 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x80041c4c; continue; } }
  case 0x80041c40:
    { const c = (a1 | 0) !== (at | 0);  if (c) { pc = 0x80041c4c; continue; } }
  case 0x80041c48:
    throw new Error("break 6 at 0x80041c48");
  case 0x80041c4c:
    a1 = lo;
    a0 = (0 + 8) | 0;
    s0 = (s0 + 1) | 0;
    a1 = a1 & 255; [v0, v1] = yield* call(ctx, sp, 0x8003ac44, a0, a1, a2, a3);
  case 0x80041c60:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80041c68:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80041c70:
    v0 = s0 & 65535;
    v0 = (v0 | 0) < 64 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80041c20; continue; } }
  case 0x80041c80:
    a0 = (0 + 180) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x80041c88:
    s0 = (0 + 64) | 0;
    s1 = (0 + 2) | 0;
    a1 = s0 & 65535;
  case 0x80041c94:
    [hi, lo] = div(0, a1, true);
    { const c = (s1 | 0) !== 0;  if (c) { pc = 0x80041ca4; continue; } }
  case 0x80041ca0:
    throw new Error("break 7 at 0x80041ca0");
  case 0x80041ca4:
    at = (0 + -1) | 0;
    { const c = (s1 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x80041cbc; continue; } }
  case 0x80041cb0:
    { const c = (a1 | 0) !== (at | 0);  if (c) { pc = 0x80041cbc; continue; } }
  case 0x80041cb8:
    throw new Error("break 6 at 0x80041cb8");
  case 0x80041cbc:
    a1 = lo;
    a0 = (0 + 8) | 0;
    s0 = (s0 + -1) | 0;
    a1 = a1 & 255; [v0, v1] = yield* call(ctx, sp, 0x8003ac44, a0, a1, a2, a3);
  case 0x80041cd0:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80041cd8:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80041ce0:
    v0 = s0 & 65535;
    { const c = (v0 | 0) !== 0; a1 = s0 & 65535; if (c) { pc = 0x80041c94; continue; } }
  case 0x80041cec:
    a0 = (0 + 8) | 0;
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ac44, a0, a1, a2, a3);
  case 0x80041cf8:
    a0 = 0x800c0000 | 0;
    a0 = (a0 + 22560) | 0;
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003abec, a0, a1, a2, a3);
  case 0x80041d08:
     pc = 0x80042578; continue;
  case 0x80041d10:
    s0 = (0 + 4) | 0;
    s1 = (0 + 16) | 0;
    a0 = (0 + 8) | 0;
  case 0x80041d1c:
    a1 = s0 & 65535;
    a1 = a1 << 2;
    a1 = (s1 - a1) | 0;
    a1 = a1 & 252; [v0, v1] = yield* call(ctx, sp, 0x8003ac44, a0, a1, a2, a3);
  case 0x80041d30:
    s0 = (s0 + -1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80041d38:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80041d40:
    v0 = s0 & 65535;
    { const c = (v0 | 0) !== 0; a0 = (0 + 8) | 0; if (c) { pc = 0x80041d1c; continue; } }
  case 0x80041d4c:
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ac44, a0, a1, a2, a3);
  case 0x80041d54:
     pc = 0x80042578; continue;
  case 0x80041d5c:
    a0 = 0 | 0; pc = 0x80041f80; continue;
  case 0x80041d64:
    a0 = 0 | 0; pc = 0x80041fa4; continue;
  case 0x80041d6c:
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, a2 & 0xff, 1);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80041d7c:
    a0 = (0 + 9204) | 0;
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80041d88:
    a0 = (0 + 60) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80041d94:
    a0 = (0 + 60) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80041da0:
    s0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d984, a0, a1, a2, a3);
  case 0x80041da8:
    a0 = (0 + 7) | 0;
    a1 = (0 + 1) | 0;
    v0 = 0x800a0000 | 0;
    v1 = (v0 + -13312) | 0;
  case 0x80041db8:
    m.write(((v1) + 0) >>> 0, a0 & 0xffff, 2);
    m.write(((v1) + 2) >>> 0, a0 & 0xffff, 2);
    m.write(((v1) + 4) >>> 0, a1 & 0xff, 1);
    s0 = (s0 + 1) | 0;
    v0 = (s0 | 0) < 12 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = (v1 + 6) | 0; if (c) { pc = 0x80041db8; continue; } }
  case 0x80041dd4:
    s0 = 0 | 0;
  case 0x80041dd8:
    s0 = (s0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003f884, a0, a1, a2, a3);
  case 0x80041de0:
    v0 = (s0 | 0) < 2000 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (0 + 1) | 0; if (c) { pc = 0x80041dd8; continue; } }
  case 0x80041dec:
    m.write(((0x8007913c) + 466) >>> 0, v0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x80041df8:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800312b4, a0, a1, a2, a3);
  case 0x80041e00:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80041e08:
     pc = 0x80041fac; continue;
  case 0x80041e10:
    v0 = (0 + 2) | 0;
    v1 = 0x80070000 | 0;
    m.write(((0x8007913c) + 456) >>> 0, v0 & 0xff, 1);
    v0 = (v1 + -1752) | 0;
    v1 = m.read(((v1) + -1752) >>> 0, 4) | 0;
    m.write(((0x8007913c) + 448) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, a2 & 0xff, 1);
    m.write(((0x8007913c) + 452) >>> 0, 0 & 0xff, 1);
    m.write(((0x8007913c) + 760) >>> 0, v0 & 0xff, 1);
     pc = 0x80042304; continue;
  case 0x80041e44:
    a0 = (0 + 120) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80041e50:
    a0 = (0 + 120) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80041e5c:
    a0 = (0 + 120) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80041e68:
    a0 = (0 + 120) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80041e74:
    a0 = (0 + 120) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80041e80:
    a0 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x80041e88:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80041e90:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80041e98:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80041ea0:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001fd1c, a0, a1, a2, a3);
  case 0x80041ea8:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80041eb0:
    a0 = (0 + 1) | 0;
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80041ebc:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80041ec8:
    a0 = (0 + 1) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80041ed4:
    a0 = (0 + 1) | 0;
    a1 = (0 + 5) | 0; pc = 0x80042554; continue;
  case 0x80041ee0:
    at = 0x80080000 | 0;
    m.write(((at) + -27983) >>> 0, 0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x80041ef0:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27983) >>> 0, v0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x80041f04:
    s0 = 0x801f0000 | 0;
    s0 = (s0 + 26264) | 0;
    a0 = m.read(((s0) + 2) >>> 0, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, a2 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x80041f20:
    a0 = m.read(((s0) + 10) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x80041f2c:
    a0 = (0 + 13) | 0;
    a1 = (0 + 50) | 0;
    a2 = (0 + 420) | 0;
    a3 = (0 + 51) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d190, a0, a1, a2, a3);
  case 0x80041f40:
    a0 = (0 + 5) | 0;
    a1 = (0 + 100) | 0;
    a2 = (0 + 420) | 0;
    a3 = (0 + 51) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002d28c, a0, a1, a2, a3);
  case 0x80041f54:
    v0 = (0 + 1) | 0;
    m.write(((0x8007913c) + 467) >>> 0, v0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x80041f64:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, a2 & 0xff, 1);
    m.write(((0x8007913c) + 464) >>> 0, v0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x80041f7c:
    a0 = (0 + 1) | 0;
  case 0x80041f80:
     [v0, v1] = yield* call(ctx, sp, 0x8002f4cc, a0, a1, a2, a3);
  case 0x80041f88:
     [v0, v1] = yield* call(ctx, sp, 0x80031e20, a0, a1, a2, a3);
  case 0x80041f90:
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, 0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x80041fa0:
    a0 = (0 + 1) | 0;
  case 0x80041fa4:
     [v0, v1] = yield* call(ctx, sp, 0x8002f8e4, a0, a1, a2, a3);
  case 0x80041fac:
     [v0, v1] = yield* call(ctx, sp, 0x80031e20, a0, a1, a2, a3);
  case 0x80041fb4:
    v0 = (0 + 97) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, v0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x80041fc8:
     [v0, v1] = yield* call(ctx, sp, 0x8003f3cc, a0, a1, a2, a3);
  case 0x80041fd0:
     pc = 0x80042578; continue;
  case 0x80041fd8:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d3d4, a0, a1, a2, a3);
  case 0x80041fe0:
    a0 = (0 + 1) | 0;
    a1 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cae0, a0, a1, a2, a3);
  case 0x80041fec:
    a0 = (0 + 5) | 0;
    a1 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cae0, a0, a1, a2, a3);
  case 0x80041ff8:
    v0 = (0 + 1) | 0;
    m.write(((0x8007913c) + 804) >>> 0, v0 & 0xff, 1);
    v0 = 0x80070000 | 0;
    v0 = (v0 + -1708) | 0; pc = 0x80042194; continue;
  case 0x8004200c:
    v0 = m.read(((0x8007913c) + 448) >>> 0, 4) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, a2 & 0xff, 1);
    { const c = (v0 | 0) === 0; v1 = 0 | 0; if (c) { pc = 0x80042578; continue; } }
  case 0x80042020:
    m.write(((0x8007913c) + 448) >>> 0, 0 >>> 0, 4);
    v0 = 0x800a0000 | 0;
    a0 = (v0 + -9656) | 0;
    v0 = v1 & 255;
  case 0x80042030:
    v1 = (v1 + 1) | 0;
    v0 = (v0 + 1) | 0;
    v0 = v0 << 3;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 4) >>> 0, 0 >>> 0, 4);
    v0 = v1 & 255;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 & 255; if (c) { pc = 0x80042030; continue; } }
  case 0x80042058:
    v0 = 0x800a0000 | 0;
    v0 = (v0 + -9656) | 0;
    m.write(((v0) + 40) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 44) >>> 0, 0 >>> 0, 4); pc = 0x80042578; continue;
  case 0x8004206c:
    v0 = (0 + 2) | 0;
    m.write(((0x8007913c) + 456) >>> 0, v0 & 0xff, 1);
    v0 = 0x80070000 | 0;
    v1 = m.read(((v0) + -1756) >>> 0, 4) | 0;
    v0 = (v0 + -1756) | 0; pc = 0x800422f8; continue;
  case 0x80042084:
    v0 = (0 + 2) | 0;
    v1 = 0x80070000 | 0;
    m.write(((0x8007913c) + 456) >>> 0, v0 & 0xff, 1);
    v0 = (v1 + -1744) | 0;
    v1 = m.read(((v1) + -1744) >>> 0, 4) | 0;
    m.write(((0x8007913c) + 448) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 1) | 0;
    m.write(((0x8007913c) + 452) >>> 0, 0 & 0xff, 1);
    m.write(((0x8007913c) + 760) >>> 0, 0 & 0xff, 1);
    m.write(((0x8007913c) + 452) >>> 0, v0 & 0xff, 1);
    m.write(((0x8007913c) + 454) >>> 0, 0 & 0xffff, 2);
     pc = 0x80042304; continue;
  case 0x800420b8:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80030188, a0, a1, a2, a3);
  case 0x800420c0:
     pc = 0x80042578; continue;
  case 0x800420c8:
    at = 0x80080000 | 0;
    m.write(((at) + -27986) >>> 0, a2 & 0xff, 1);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80040ab0, a0, a1, a2, a3);
  case 0x800420d8:
     pc = 0x80042578; continue;
  case 0x800420e0:
    v0 = (m.read(((0x8007913c) + 472) >>> 0, 1) << 24) >> 24;
    s0 = (0 + -1) | 0;
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x80042578; continue; } }
  case 0x800420f0:
    m.write(((0x8007913c) + 472) >>> 0, s0 & 0xff, 1);
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800420fc:
    m.write(((0x8007913c) + 480) >>> 0, s0 & 0xffff, 2);
     pc = 0x80042578; continue;
  case 0x80042108:
     [v0, v1] = yield* call(ctx, sp, 0x800316cc, a0, a1, a2, a3);
  case 0x80042110:
     [v0, v1] = yield* call(ctx, sp, 0x80031e20, a0, a1, a2, a3);
  case 0x80042118:
    a0 = (0 + 10) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x80042120:
    a0 = (0 + 60) | 0;
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8004212c:
    a0 = (0 + 60) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042138:
    a0 = (0 + 60) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042144:
    a0 = (0 + 60) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042150:
    a0 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x80042158:
     [v0, v1] = yield* call(ctx, sp, 0x8002f3c0, a0, a1, a2, a3);
  case 0x80042160:
     pc = 0x80042578; continue;
  case 0x80042168:
    v0 = (0 + 2) | 0;
    m.write(((0x8007913c) + 456) >>> 0, v0 & 0xff, 1);
    v0 = 0x80070000 | 0;
    v1 = m.read(((v0) + -1760) >>> 0, 4) | 0;
    v0 = (v0 + -1760) | 0; pc = 0x800422f0; continue;
  case 0x80042180:
    v0 = 0x80070000 | 0;
    v0 = (v0 + -1740) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, a2 & 0xff, 1);
    m.write(((0x8007913c) + 804) >>> 0, 0 & 0xff, 1);
  case 0x80042194:
    m.write(((0x8007913c) + 460) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 912) >>> 0, 0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x800421a4:
    a0 = (0 + 120) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800421b0:
    a0 = (0 + 120) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800421bc:
    a0 = (0 + 120) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800421c8:
    a0 = (0 + 120) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800421d4:
    a0 = (0 + 120) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800421e0:
    a0 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x800421e8:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800421f0:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800421f8:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80042200:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001fd1c, a0, a1, a2, a3);
  case 0x80042208:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80042210:
    a0 = (0 + 1) | 0;
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8004221c:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80042228:
    a0 = (0 + 1) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80042234:
    a0 = (0 + 1) | 0;
    a1 = (0 + 5) | 0; pc = 0x80042554; continue;
  case 0x80042240:
    at = 0x80080000 | 0;
    m.write(((at) + -27986) >>> 0, a2 & 0xff, 1);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80040ab0, a0, a1, a2, a3);
  case 0x80042250:
    v0 = (0 + -2048) | 0;
    m.write(((0x8007913c) + 1132) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1100) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 256) | 0; pc = 0x800422a4; continue;
  case 0x80042264:
    at = 0x80080000 | 0;
    m.write(((at) + -27986) >>> 0, a2 & 0xff, 1);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80040ab0, a0, a1, a2, a3);
  case 0x80042274:
    v0 = (0 + 512) | 0;
    m.write(((0x8007913c) + 1132) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1100) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 256) | 0; pc = 0x800422a4; continue;
  case 0x80042288:
    at = 0x80080000 | 0;
    m.write(((at) + -27986) >>> 0, a2 & 0xff, 1);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80040ab0, a0, a1, a2, a3);
  case 0x80042298:
    v0 = (0 + 512) | 0;
    m.write(((0x8007913c) + 1132) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1100) >>> 0, v0 >>> 0, 4);
  case 0x800422a4:
    m.write(((0x8007913c) + 1152) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 1104) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 2) | 0;
    m.write(((0x8007913c) + 472) >>> 0, v0 & 0xff, 1);
     pc = 0x80042578; continue;
  case 0x800422bc:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003fe70, a0, a1, a2, a3);
  case 0x800422c4:
     pc = 0x80042578; continue;
  case 0x800422cc:
    a0 = (0 + 50) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003e390, a0, a1, a2, a3);
  case 0x800422d4:
     pc = 0x80042578; continue;
  case 0x800422dc:
    v0 = (0 + 1) | 0;
    m.write(((0x8007913c) + 456) >>> 0, v0 & 0xff, 1);
    v0 = 0x80070000 | 0;
    v1 = m.read(((v0) + -1764) >>> 0, 4) | 0;
    v0 = (v0 + -1764) | 0;
  case 0x800422f0:
    at = 0x80080000 | 0;
    m.write(((at) + -27988) >>> 0, a2 & 0xff, 1);
  case 0x800422f8:
    m.write(((0x8007913c) + 452) >>> 0, 0 & 0xff, 1);
    m.write(((0x8007913c) + 448) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 760) >>> 0, 0 & 0xff, 1);
  case 0x80042304:
    m.write(((0x8007913c) + 874) >>> 0, 0 & 0xffff, 2);
    m.write(((0x8007913c) + 1196) >>> 0, v1 >>> 0, 4);
     pc = 0x80042578; continue;
  case 0x80042314:
    a0 = (0 + 120) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042320:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x80042328:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80042330:
    a0 = (0 + 1) | 0;
  case 0x80042334:
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8004233c:
     pc = 0x80042578; continue;
  case 0x80042344:
    v0 = 0x80070000 | 0;
    a0 = m.read(((v0) + -20424) >>> 0, 4) | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27868) | 0; [v0, v1] = yield* call(ctx, sp, 0x80045578, a0, a1, a2, a3);
  case 0x80042358:
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x80042370; continue; } }
  case 0x80042360:
    a1 = (0 + 1084) | 0; [v0, v1] = yield* call(ctx, sp, 0x80026534, a0, a1, a2, a3);
  case 0x80042368:
    a0 = (0 + 1084) | 0; pc = 0x8004237c; continue;
  case 0x80042370:
    a1 = (0 + 1153) | 0; [v0, v1] = yield* call(ctx, sp, 0x80026534, a0, a1, a2, a3);
  case 0x80042378:
    a0 = (0 + 1153) | 0;
  case 0x8004237c:
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800292b0, a0, a1, a2, a3);
  case 0x80042384:
     pc = 0x80042578; continue;
  case 0x8004238c:
    v0 = 0x80070000 | 0;
    a0 = m.read(((v0) + -20424) >>> 0, 4) | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27868) | 0; [v0, v1] = yield* call(ctx, sp, 0x80045578, a0, a1, a2, a3);
  case 0x800423a0:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x800423b8; continue; } }
  case 0x800423a8:
    a0 = (0 + 84) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002665c, a0, a1, a2, a3);
  case 0x800423b0:
     pc = 0x80042578; continue;
  case 0x800423b8:
    a0 = (0 + 153) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002665c, a0, a1, a2, a3);
  case 0x800423c0:
     pc = 0x80042578; continue;
  case 0x800423c8:
    at = 0x80080000 | 0;
    m.write(((at) + -27986) >>> 0, a2 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x800411e8, a0, a1, a2, a3);
  case 0x800423d8:
     pc = 0x80042578; continue;
  case 0x800423e0:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003fe70, a0, a1, a2, a3);
  case 0x800423e8:
     pc = 0x80042578; continue;
  case 0x800423f0:
    a0 = (0 + 120) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800423fc:
    a0 = (0 + 120) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042408:
    a0 = (0 + 120) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042414:
    a0 = (0 + 120) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042420:
    a0 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x80042428:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80042430:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80042438:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001fd1c, a0, a1, a2, a3);
  case 0x80042440:
    s0 = (0 + -1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80042448:
    v0 = (m.read(((0x8007913c) + 472) >>> 0, 1) << 24) >> 24;
    { const c = (v0 | 0) === (s0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x8004246c; continue; } }
  case 0x80042458:
    m.write(((0x8007913c) + 472) >>> 0, s0 & 0xff, 1);
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80042464:
    m.write(((0x8007913c) + 480) >>> 0, s0 & 0xffff, 2);
    a0 = (0 + 1) | 0;
  case 0x8004246c:
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80042474:
    a0 = (0 + 1) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80042480:
    a0 = (0 + 1) | 0;
    a1 = (0 + 5) | 0; pc = 0x80042554; continue;
  case 0x8004248c:
    a0 = (0 + 120) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042498:
    a0 = (0 + 120) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800424a4:
    a0 = (0 + 120) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800424b0:
    a0 = (0 + 120) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800424bc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x800424c4:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800424cc:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800424d4:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800424dc:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001fd1c, a0, a1, a2, a3);
  case 0x800424e4:
    a0 = (0 + 1) | 0;
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x800424f0:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x800424fc:
    a0 = (0 + 1) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80042508:
    a0 = (0 + 1) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80042514:
     pc = 0x80042578; continue;
  case 0x8004251c:
    a0 = (0 + 120) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042528:
    a0 = (0 + 1) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80042534:
    a0 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x8004253c:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80042544:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8004254c:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0;
  case 0x80042554:
     [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8004255c:
    a0 = (0 + 1) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80042568:
     pc = 0x80042578; continue;
  case 0x80042570:
     [v0, v1] = yield* call(ctx, sp, 0x80031efc, a0, a1, a2, a3);
  case 0x80042578:
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return [v0, v1];
  default: throw new Error(`effectSwitch: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800448d8, translated instruction by instruction (11 instructions).
export function x800448d8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800448d8;
  for (;;) switch (pc) {
  case 0x800448d8:
    { const c = (a2 | 0) === 0; v1 = (a2 + -1) | 0; if (c) { pc = 0x800448fc; continue; } }
  case 0x800448e0:
    a2 = (0 + -1) | 0;
  case 0x800448e4:
    v0 = m.read(((a0) + 0) >>> 0, 4) | 0;
    a0 = (a0 + 4) | 0;
    v1 = (v1 + -1) | 0;
    m.write(((a1) + 0) >>> 0, v0 >>> 0, 4);
    { const c = (v1 | 0) !== (a2 | 0); a1 = (a1 + 4) | 0; if (c) { pc = 0x800448e4; continue; } }
  case 0x800448fc:
     return [v0, v1];
  default: throw new Error(`x800448d8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044be4, translated instruction by instruction (60 instructions).
export function x80044be4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044be4;
  for (;;) switch (pc) {
  case 0x80044be4:
    { const c = (a1 | 0) >= 0; v1 = a1 | 0; if (c) { pc = 0x80044bf0; continue; } }
  case 0x80044bec:
    v1 = (a1 + 31) | 0;
  case 0x80044bf0:
    v1 = v1 >> 5;
    v0 = v1 << 5;
    a2 = (a1 - v0) | 0;
    { const c = (v1 | 0) === 0; a1 = (v1 + -1) | 0; if (c) { pc = 0x80044c9c; continue; } }
  case 0x80044c04:
    v1 = (0 + -1) | 0;
    v0 = (a0 + 124) | 0;
  case 0x80044c0c:
    m.write(((a0) + 0) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -120) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -116) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -112) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -108) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -104) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -100) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -96) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -92) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -88) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -84) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -80) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -76) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -72) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -68) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -64) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -60) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -56) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -52) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -48) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -44) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -40) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -36) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -32) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -28) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -24) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -20) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -16) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -12) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -8) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + -4) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4);
    v0 = (v0 + 128) | 0;
    a1 = (a1 + -1) | 0;
    { const c = (a1 | 0) !== (v1 | 0); a0 = (a0 + 128) | 0; if (c) { pc = 0x80044c0c; continue; } }
  case 0x80044c9c:
    v0 = (a2 + -1) | 0;
    a2 = v0 | 0;
    v0 = v0 & 65535;
    v1 = 0 | 65535;
    { const c = (v0 | 0) === (v1 | 0);  if (c) { pc = 0x80044ccc; continue; } }
  case 0x80044cb4:
    m.write(((a0) + 0) >>> 0, 0 >>> 0, 4);
    v0 = (a2 + -1) | 0;
    a2 = v0 | 0;
    v0 = v0 & 65535;
    { const c = (v0 | 0) !== (v1 | 0); a0 = (a0 + 4) | 0; if (c) { pc = 0x80044cb4; continue; } }
  case 0x80044ccc:
     return [v0, v1];
  default: throw new Error(`x80044be4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044cd4, translated instruction by instruction (9 instructions).
export function x80044cd4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044cd4;
  for (;;) switch (pc) {
  case 0x80044cd4:
    { const c = (a2 | 0) === 0; v0 = (a2 + -1) | 0; if (c) { pc = 0x80044cf0; continue; } }
  case 0x80044cdc:
    v1 = (0 + -1) | 0;
  case 0x80044ce0:
    m.write(((a0) + 0) >>> 0, a1 & 0xff, 1);
    v0 = (v0 + -1) | 0;
    { const c = (v0 | 0) !== (v1 | 0); a0 = (a0 + 1) | 0; if (c) { pc = 0x80044ce0; continue; } }
  case 0x80044cf0:
     return [v0, v1];
  default: throw new Error(`x80044cd4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044f2c, translated instruction by instruction (8 instructions).
export function x80044f2c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044f2c;
  for (;;) switch (pc) {
  case 0x80044f2c:
    a0 = (a0 >>> 6) | 0;
    v0 = 0x80070000 | 0;
    v0 = (v0 + 1792) | 0;
    a0 = a0 & 1020;
    a0 = (a0 + v0) | 0;
    v0 = m.read(((a0) + 0) >>> 0, 4) | 0;
     return [v0, v1];
  default: throw new Error(`x80044f2c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044f4c, translated instruction by instruction (8 instructions).
export function x80044f4c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044f4c;
  for (;;) switch (pc) {
  case 0x80044f4c:
    a0 = (a0 >>> 6) | 0;
    v0 = 0x80070000 | 0;
    v0 = (v0 + 2816) | 0;
    a0 = a0 & 1020;
    a0 = (a0 + v0) | 0;
    v0 = m.read(((a0) + 0) >>> 0, 4) | 0;
     return [v0, v1];
  default: throw new Error(`x80044f4c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80045488, translated instruction by instruction (12 instructions).
export function x80045488(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80045488;
  for (;;) switch (pc) {
  case 0x80045488:
    v1 = 0x41c60000 | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27040) >>> 0, 4) | 0;
    v1 = v1 | 20077;
    [hi, lo] = mult(v0, v1, true);
    a0 = lo;
    v0 = (a0 + 12345) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27040) >>> 0, v0 >>> 0, 4);
    v0 = (v0 >>> 16) | 0;
    v0 = v0 & 32767; return [v0, v1];
  default: throw new Error(`x80045488: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80045578, translated instruction by instruction (25 instructions).
export function x80045578(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80045578;
  for (;;) switch (pc) {
  case 0x80045578:
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x80045588; continue; } }
  case 0x80045580:
    { const c = (a1 | 0) !== 0;  if (c) { pc = 0x800455b0; continue; } }
  case 0x80045588:
    { const c = (a0 | 0) === (a1 | 0); v0 = 0 | 0; if (c) { pc = 0x800455d4; continue; } }
  case 0x80045590:
    { const c = (a0 | 0) === 0; v0 = (0 + -1) | 0; if (c) { pc = 0x800455d4; continue; } }
  case 0x80045598:
    v0 = (0 + 1) | 0; pc = 0x800455d4; continue;
  case 0x800455a0:
    v0 = 0 | 0; pc = 0x800455d4; continue;
  case 0x800455a8:
    { const c = (a2 | 0) === 0; a0 = (a0 + 1) | 0; if (c) { pc = 0x800455a0; continue; } }
  case 0x800455b0:
    v1 = (m.read(((a1) + 0) >>> 0, 1) << 24) >> 24;
    v0 = (m.read(((a0) + 0) >>> 0, 1) << 24) >> 24;
    a2 = m.read(((a0) + 0) >>> 0, 1);
    { const c = (v0 | 0) === (v1 | 0); a1 = (a1 + 1) | 0; if (c) { pc = 0x800455a8; continue; } }
  case 0x800455c4:
    v1 = (m.read(((a0) + 0) >>> 0, 1) << 24) >> 24;
    v0 = (m.read(((a1) + -1) >>> 0, 1) << 24) >> 24;
    v0 = (v1 - v0) | 0;
  case 0x800455d4:
     return [v0, v1];
  default: throw new Error(`x80045578: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80053e98, translated instruction by instruction (63 instructions).
export function* x80053e98(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80053e98;
  for (;;) switch (pc) {
  case 0x80053e98:
    sp = (sp + -56) | 0;
    v0 = 0x7fff0000 | 0;
    v0 = v0 | 65535;
    m.write(((sp) + 36) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4);
    s0 = a0 | 0;
    s1 = a1 | 0;
    v0 = s1 & v0;
    m.write(((sp) + 48) >>> 0, 0, 4);
    m.write(((sp) + 44) >>> 0, s3 >>> 0, 4);
    { const c = (v0 | 0) !== 0; m.write(((sp) + 40) >>> 0, s2 >>> 0, 4); if (c) { pc = 0x80053ed8; continue; } }
  case 0x80053ec8:
    { const c = (s0 | 0) !== 0; v0 = 0x80000000 | 0; if (c) { pc = 0x80053ed8; continue; } }
  case 0x80053ed0:
    v0 = s1 & v0; pc = 0x80053f78; continue;
  case 0x80053ed8:
    v0 = s1 >> 20;
    s2 = v0 & 2047;
    s3 = (s2 + -1053) | 0;
    { const c = (s3 | 0) <= 0; a0 = (0 + 34) | 0; if (c) { pc = 0x80053f08; continue; } }
  case 0x80053eec:
    a1 = (0 + 17) | 0; [v0, v1] = yield* call(ctx, sp, 0x800546c8, a0, a1, a2, a3);
  case 0x80053ef4:
    v0 = 0x7fff0000 | 0;
    { const c = (s1 | 0) >= 0; v0 = v0 | 65535; if (c) { pc = 0x80053f78; continue; } }
  case 0x80053f00:
    v0 = 0x80000000 | 0; pc = 0x80053f78; continue;
  case 0x80053f08:
    v0 = 0xf0000 | 0;
    v0 = v0 | 65535;
    a0 = (sp + 24) | 0;
    v0 = s1 & v0;
    v1 = 0x100000 | 0;
    v0 = v0 | v1;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 10) | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80053f98, a0, a1, a2, a3);
  case 0x80053f40:
    v0 = (s2 + -1022) | 0;
    v0 = (v0 >>> 0) < 32 ? 1 : 0;
    v1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80053f64; continue; } }
  case 0x80053f54:
    { const c = (v1 | 0) === 0; v0 = (-s3) | 0; if (c) { pc = 0x80053f64; continue; } }
  case 0x80053f5c:
    v1 = v1 >> (v0 & 31); pc = 0x80053f6c; continue;
  case 0x80053f64:
    v0 = 0 | 0; pc = 0x80053f78; continue;
  case 0x80053f6c:
    { const c = (s1 | 0) >= 0; v0 = v1 | 0; if (c) { pc = 0x80053f78; continue; } }
  case 0x80053f74:
    v0 = (-v0) | 0;
  case 0x80053f78:
    s3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 56) | 0; return [v0, v1];
  default: throw new Error(`x80053e98: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80053f98, translated instruction by instruction (47 instructions).
export function x80053f98(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80053f98;
  for (;;) switch (pc) {
  case 0x80053f98:
    m.write(((sp) + 8) >>> 0, a2 >>> 0, 4);
    a2 = m.read(((sp) + 16) >>> 0, 4) | 0;
    t0 = a0 | 0;
    { const c = (a1 | 0) !== 0; m.write(((sp) + 12) >>> 0, a3 >>> 0, 4); if (c) { pc = 0x80053ff8; continue; } }
  case 0x80053fac:
    { const c = (a2 | 0) <= 0; a0 = 0 | 0; if (c) { pc = 0x8005403c; continue; } }
  case 0x80053fb4:
    a3 = 0x80000000 | 0;
  case 0x80053fb8:
    v0 = m.read(((sp) + 12) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 8) >>> 0, 4) | 0;
    v1 = v0 << 1;
    v0 = a1 & a3;
    { const c = (v0 | 0) === 0; m.write(((sp) + 12) >>> 0, v1 >>> 0, 4); if (c) { pc = 0x80053fd8; continue; } }
  case 0x80053fd0:
    v0 = v1 | 1;
    m.write(((sp) + 12) >>> 0, v0 >>> 0, 4);
  case 0x80053fd8:
    v0 = a1 << 1;
    m.write(((sp) + 8) >>> 0, v0 >>> 0, 4);
    a0 = (a0 + 1) | 0;
    v0 = (a0 | 0) < (a2 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8005403c; continue; } }
  case 0x80053ff0:
     pc = 0x80053fb8; continue;
  case 0x80053ff8:
    { const c = (a2 | 0) <= 0; a0 = 0 | 0; if (c) { pc = 0x8005403c; continue; } }
  case 0x80054000:
    a3 = 0x80000000 | 0;
  case 0x80054004:
    v0 = m.read(((sp) + 8) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 12) >>> 0, 4) | 0;
    v1 = (v0 >>> 1) | 0;
    v0 = a1 & 1;
    { const c = (v0 | 0) === 0; m.write(((sp) + 8) >>> 0, v1 >>> 0, 4); if (c) { pc = 0x80054024; continue; } }
  case 0x8005401c:
    v0 = v1 | a3;
    m.write(((sp) + 8) >>> 0, v0 >>> 0, 4);
  case 0x80054024:
    v0 = a1 >> 1;
    m.write(((sp) + 12) >>> 0, v0 >>> 0, 4);
    a0 = (a0 + 1) | 0;
    v0 = (a0 | 0) < (a2 | 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80054004; continue; } }
  case 0x8005403c:
    v0 = m.read(((sp) + 8) >>> 0, 4) | 0;
    v1 = m.read(((sp) + 12) >>> 0, 4) | 0;
    m.write(((t0) + 0) >>> 0, v0 >>> 0, 4);
    m.write(((t0) + 4) >>> 0, v1 >>> 0, 4);
    v0 = t0 | 0; return [v0, v1];
  default: throw new Error(`x80053f98: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80054058, translated instruction by instruction (64 instructions).
export function* x80054058(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80054058;
  for (;;) switch (pc) {
  case 0x80054058:
    sp = (sp + -56) | 0;
    m.write(((sp) + 44) >>> 0, s3 >>> 0, 4);
    s3 = 0 | 0;
    m.write(((sp) + 40) >>> 0, s2 >>> 0, 4);
    s2 = (0 + 1053) | 0;
    m.write(((sp) + 48) >>> 0, 0, 4);
    m.write(((sp) + 36) >>> 0, s1 >>> 0, 4);
    { const c = (a0 | 0) !== 0; m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x80054088; continue; } }
  case 0x8005407c:
    s0 = 0 | 0;
    s1 = 0 | 0; pc = 0x80054134; continue;
  case 0x80054088:
    { const c = (a0 | 0) >= 0; v0 = 0xff0000 | 0; if (c) { pc = 0x80054098; continue; } }
  case 0x80054090:
    s3 = 0x80000000 | 0;
    a0 = (-a0) | 0;
  case 0x80054098:
    v0 = v0 | 65535;
    v0 = (v0 | 0) < (a0 | 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = 0x3fff0000 | 0; if (c) { pc = 0x800540c4; continue; } }
  case 0x800540a8:
    v1 = 0xff0000 | 0;
    v1 = v1 | 65535;
  case 0x800540b0:
    a0 = a0 << 4;
    v0 = (v1 | 0) < (a0 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; s2 = (s2 + -4) | 0; if (c) { pc = 0x800540b0; continue; } }
  case 0x800540c0:
    v0 = 0x3fff0000 | 0;
  case 0x800540c4:
    v0 = v0 | 65535;
    v0 = (v0 | 0) < (a0 | 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (0 + 10) | 0; if (c) { pc = 0x800540f0; continue; } }
  case 0x800540d4:
    v1 = 0x3fff0000 | 0;
    v1 = v1 | 65535;
  case 0x800540dc:
    a0 = a0 << 1;
    v0 = (v1 | 0) < (a0 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; s2 = (s2 + -1) | 0; if (c) { pc = 0x800540dc; continue; } }
  case 0x800540ec:
    v0 = (0 + 10) | 0;
  case 0x800540f0:
    m.write(((sp) + 28) >>> 0, a0 >>> 0, 4);
    a0 = (sp + 24) | 0;
    m.write(((sp) + 24) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054158, a0, a1, a2, a3);
  case 0x80054110:
    v0 = 0xffef0000 | 0;
    v1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    v0 = v0 | 65535;
    v1 = v1 & v0;
    s1 = v1 | s3;
    v0 = s2 << 20;
    s1 = s1 | v0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    m.write(((sp) + 28) >>> 0, v1 >>> 0, 4);
  case 0x80054134:
    v0 = s0 | 0;
    v1 = s1 | 0;
    s3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 56) | 0; return [v0, v1];
  default: throw new Error(`x80054058: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80054158, translated instruction by instruction (47 instructions).
export function x80054158(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80054158;
  for (;;) switch (pc) {
  case 0x80054158:
    m.write(((sp) + 8) >>> 0, a2 >>> 0, 4);
    a2 = m.read(((sp) + 16) >>> 0, 4) | 0;
    t0 = a0 | 0;
    { const c = (a1 | 0) !== 0; m.write(((sp) + 12) >>> 0, a3 >>> 0, 4); if (c) { pc = 0x800541b8; continue; } }
  case 0x8005416c:
    { const c = (a2 | 0) <= 0; a0 = 0 | 0; if (c) { pc = 0x800541fc; continue; } }
  case 0x80054174:
    a3 = 0x80000000 | 0;
  case 0x80054178:
    v0 = m.read(((sp) + 12) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 8) >>> 0, 4) | 0;
    v1 = v0 << 1;
    v0 = a1 & a3;
    { const c = (v0 | 0) === 0; m.write(((sp) + 12) >>> 0, v1 >>> 0, 4); if (c) { pc = 0x80054198; continue; } }
  case 0x80054190:
    v0 = v1 | 1;
    m.write(((sp) + 12) >>> 0, v0 >>> 0, 4);
  case 0x80054198:
    v0 = a1 << 1;
    m.write(((sp) + 8) >>> 0, v0 >>> 0, 4);
    a0 = (a0 + 1) | 0;
    v0 = (a0 | 0) < (a2 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x800541fc; continue; } }
  case 0x800541b0:
     pc = 0x80054178; continue;
  case 0x800541b8:
    { const c = (a2 | 0) <= 0; a0 = 0 | 0; if (c) { pc = 0x800541fc; continue; } }
  case 0x800541c0:
    a3 = 0x80000000 | 0;
  case 0x800541c4:
    v0 = m.read(((sp) + 8) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 12) >>> 0, 4) | 0;
    v1 = (v0 >>> 1) | 0;
    v0 = a1 & 1;
    { const c = (v0 | 0) === 0; m.write(((sp) + 8) >>> 0, v1 >>> 0, 4); if (c) { pc = 0x800541e4; continue; } }
  case 0x800541dc:
    v0 = v1 | a3;
    m.write(((sp) + 8) >>> 0, v0 >>> 0, 4);
  case 0x800541e4:
    v0 = (a1 >>> 1) | 0;
    m.write(((sp) + 12) >>> 0, v0 >>> 0, 4);
    a0 = (a0 + 1) | 0;
    v0 = (a0 | 0) < (a2 | 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x800541c4; continue; } }
  case 0x800541fc:
    v0 = m.read(((sp) + 8) >>> 0, 4) | 0;
    v1 = m.read(((sp) + 12) >>> 0, 4) | 0;
    m.write(((t0) + 0) >>> 0, v0 >>> 0, 4);
    m.write(((t0) + 4) >>> 0, v1 >>> 0, 4);
    v0 = t0 | 0; return [v0, v1];
  default: throw new Error(`x80054158: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80054218, translated instruction by instruction (197 instructions).
export function* x80054218(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80054218;
  for (;;) switch (pc) {
  case 0x80054218:
    sp = (sp + -128) | 0;
    t2 = 0x7fff0000 | 0;
    t2 = t2 | 65535;
    t0 = a0 | 0;
    t1 = a1 | 0;
    v0 = 0x80000000 | 0;
    v1 = t1 & v0;
    v0 = a3 & v0;
    m.write(((sp) + 120) >>> 0, fp >>> 0, 4);
    fp = v1 ^ v0;
    v0 = t1 & t2;
    m.write(((sp) + 124) >>> 0, 0, 4);
    m.write(((sp) + 116) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 112) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 108) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 104) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 100) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 96) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 92) >>> 0, s1 >>> 0, 4);
    { const c = (v0 | 0) !== 0; m.write(((sp) + 88) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x80054274; continue; } }
  case 0x8005426c:
    { const c = (t0 | 0) === 0;  if (c) { pc = 0x80054288; continue; } }
  case 0x80054274:
    v0 = a3 & t2;
    { const c = (v0 | 0) !== 0; v1 = t1 >> 20; if (c) { pc = 0x80054294; continue; } }
  case 0x80054280:
    { const c = (a2 | 0) !== 0; v1 = v1 & 2047; if (c) { pc = 0x80054298; continue; } }
  case 0x80054288:
    m.write(((sp) + 76) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 72) >>> 0, 0 >>> 0, 4); pc = 0x800544f4; continue;
  case 0x80054294:
    v1 = v1 & 2047;
  case 0x80054298:
    v0 = a3 >> 20;
    v0 = v0 & 2047;
    v1 = (v1 + v0) | 0;
    s7 = (v1 + -1022) | 0;
    m.write(((sp) + 80) >>> 0, v1 >>> 0, 4);
    v1 = 0xf0000 | 0;
    v1 = v1 | 65535;
    s4 = (sp + 56) | 0;
    a0 = s4 | 0;
    v0 = t1 & v1;
    a1 = 0x100000 | 0;
    v0 = v0 | a1;
    v1 = a3 & v1;
    v1 = v1 | a1;
    s3 = (0 + 21) | 0;
    m.write(((sp) + 44) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, a2 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    a2 = m.read(((sp) + 40) >>> 0, 4) | 0;
    a3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054158, a0, a1, a2, a3);
  case 0x800542f8:
    s6 = m.read(((sp) + 56) >>> 0, 4) | 0;
    a0 = s4 | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    a2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    a3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054158, a0, a1, a2, a3);
  case 0x80054314:
    v0 = 0x1f0000 | 0;
    v0 = v0 | 65535;
    a0 = (sp + 24) | 0;
    a1 = s6 | 0;
    s2 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 48) >>> 0, 4) | 0;
    a2 = s2 | 0;
    s0 = s0 & v0;
    s1 = s1 & v0; [v0, v1] = yield* call(ctx, sp, 0x8005452c, a0, a1, a2, a3);
  case 0x80054340:
    s5 = (sp + 64) | 0;
    a0 = s5 | 0;
    a1 = s0 | 0;
    a2 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x8005452c, a0, a1, a2, a3);
  case 0x80054354:
    a0 = s4 | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    a2 = m.read(((sp) + 64) >>> 0, 4) | 0;
    a3 = m.read(((sp) + 68) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054158, a0, a1, a2, a3);
  case 0x8005436c:
    v0 = m.read(((sp) + 60) >>> 0, 4) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a3 = m.read(((sp) + 56) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a2 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a0 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054618, a0, a1, a2, a3);
  case 0x8005438c:
    a0 = s5 | 0;
    a1 = s1 | 0;
    a2 = s6 | 0; [v0, v1] = yield* call(ctx, sp, 0x8005452c, a0, a1, a2, a3);
  case 0x8005439c:
    a0 = s4 | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    a2 = m.read(((sp) + 64) >>> 0, 4) | 0;
    a3 = m.read(((sp) + 68) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054158, a0, a1, a2, a3);
  case 0x800543b4:
    v0 = m.read(((sp) + 60) >>> 0, 4) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a3 = m.read(((sp) + 56) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a2 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a0 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054618, a0, a1, a2, a3);
  case 0x800543d4:
    v0 = m.read(((sp) + 28) >>> 0, 4) | 0;
    { const c = (v0 | 0) >= 0; s0 = 0x80000000 | 0; if (c) { pc = 0x80054424; continue; } }
  case 0x800543e4:
    v0 = (0 + 1024) | 0;
    m.write(((sp) + 36) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a3 = m.read(((sp) + 32) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a2 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a0 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054618, a0, a1, a2, a3);
  case 0x80054408:
    a0 = (sp + 24) | 0;
    v0 = (0 + 11) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0; pc = 0x80054490; continue;
  case 0x80054424:
    v0 = (0 + 512) | 0;
    m.write(((sp) + 36) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a3 = m.read(((sp) + 32) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a2 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a0 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054618, a0, a1, a2, a3);
  case 0x80054448:
    v0 = m.read(((sp) + 28) >>> 0, 4) | 0;
    v0 = v0 & s0;
    { const c = (v0 | 0) === 0; a0 = (sp + 24) | 0; if (c) { pc = 0x80054474; continue; } }
  case 0x8005445c:
    v0 = (0 + 11) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0; pc = 0x80054490; continue;
  case 0x80054474:
    a1 = (0 + 1) | 0;
    v0 = (0 + 10) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    t3 = m.read(((sp) + 80) >>> 0, 4) | 0;
    a3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s7 = (t3 + -1023) | 0;
  case 0x80054490:
     [v0, v1] = yield* call(ctx, sp, 0x80054158, a0, a1, a2, a3);
  case 0x80054498:
    v1 = 0xffef0000 | 0;
    v0 = m.read(((sp) + 28) >>> 0, 4) | 0;
    v1 = v1 | 65535;
    v1 = v0 & v1;
    v0 = (s7 | 0) < 2047 ? 1 : 0;
    { const c = (v0 | 0) !== 0; m.write(((sp) + 28) >>> 0, v1 >>> 0, 4); if (c) { pc = 0x800544d8; continue; } }
  case 0x800544b4:
    a0 = (0 + 34) | 0;
    a1 = (0 + 13) | 0; [v0, v1] = yield* call(ctx, sp, 0x800546c8, a0, a1, a2, a3);
  case 0x800544c0:
    { const c = (fp | 0) === 0; v0 = 0x7ff00000 | 0; if (c) { pc = 0x800544cc; continue; } }
  case 0x800544c8:
    v0 = 0xfff00000 | 0;
  case 0x800544cc:
    m.write(((sp) + 76) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 72) >>> 0, 0 >>> 0, 4); pc = 0x800544f4; continue;
  case 0x800544d8:
    v0 = s7 << 20;
    v0 = fp | v0;
    v0 = v0 | v1;
    m.write(((sp) + 76) >>> 0, v0 >>> 0, 4);
    t3 = m.read(((sp) + 24) >>> 0, 4) | 0;
    m.write(((sp) + 72) >>> 0, t3 >>> 0, 4);
  case 0x800544f4:
    v0 = m.read(((sp) + 72) >>> 0, 4) | 0;
    v1 = m.read(((sp) + 76) >>> 0, 4) | 0;
    fp = m.read(((sp) + 120) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 116) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 112) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 108) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 104) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 100) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 96) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 92) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 88) >>> 0, 4) | 0;
    sp = (sp + 128) | 0; return [v0, v1];
  default: throw new Error(`x80054218: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8005452c, translated instruction by instruction (59 instructions).
export function* x8005452c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8005452c;
  for (;;) switch (pc) {
  case 0x8005452c:
    sp = (sp + -64) | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = a1 | 0;
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = a2 | 0;
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    s2 = s1 & 65535;
    v0 = s0 & 65535;
    [hi, lo] = mult(s2, v0, true);
    v1 = lo;
    s1 = (s1 >>> 16) | 0;
    [hi, lo] = mult(s1, v0, true);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    s3 = a0 | 0;
    a0 = (sp + 24) | 0;
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v1 >>> 0, 4);
    v0 = lo;
    v1 = (v0 >>> 16) | 0;
    v0 = v0 << 16;
    m.write(((sp) + 36) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, v1 >>> 0, 4);
    a3 = m.read(((sp) + 32) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a2 = m.read(((sp) + 28) >>> 0, 4) | 0;
    m.write(((sp) + 56) >>> 0, 0, 4);
    s0 = (s0 >>> 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054618, a0, a1, a2, a3);
  case 0x800545a4:
    [hi, lo] = mult(s2, s0, true);
    v0 = lo;
    v1 = (v0 >>> 16) | 0;
    v0 = v0 << 16;
    m.write(((sp) + 36) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, v1 >>> 0, 4);
    a3 = m.read(((sp) + 32) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a2 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a0 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80054618, a0, a1, a2, a3);
  case 0x800545d4:
    [hi, lo] = mult(s1, s0, true);
    v0 = m.read(((sp) + 28) >>> 0, 4) | 0;
    v1 = lo;
    v0 = (v0 + v1) | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    m.write(((s3) + 0) >>> 0, v0 >>> 0, 4);
    m.write(((s3) + 4) >>> 0, v1 >>> 0, 4);
    v0 = s3 | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 64) | 0; return [v0, v1];
  default: throw new Error(`x8005452c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80054618, translated instruction by instruction (43 instructions).
export function x80054618(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80054618;
  for (;;) switch (pc) {
  case 0x80054618:
    sp = (sp + -16) | 0;
    t1 = a0 | 0;
    t0 = (a1 >>> 16) | 0;
    m.write(((sp) + 20) >>> 0, a1 >>> 0, 4);
    a1 = a1 & 65535;
    v1 = (a3 >>> 16) | 0;
    m.write(((sp) + 28) >>> 0, a3 >>> 0, 4);
    a3 = a3 & 65535;
    a0 = (a1 + a3) | 0;
    m.write(((sp) + 0) >>> 0, a1 >>> 0, 4);
    a1 = 0x10000 | 0;
    v0 = a0 & a1;
    m.write(((sp) + 24) >>> 0, a2 >>> 0, 4);
    m.write(((sp) + 4) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 12) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 8) >>> 0, a3 >>> 0, 4);
    { const c = (v0 | 0) === 0; m.write(((sp) + 0) >>> 0, a0 >>> 0, 4); if (c) { pc = 0x80054668; continue; } }
  case 0x80054660:
    v0 = (t0 + 1) | 0;
    m.write(((sp) + 4) >>> 0, v0 >>> 0, 4);
  case 0x80054668:
    v0 = m.read(((sp) + 4) >>> 0, 4) | 0;
    a3 = (v0 + v1) | 0;
    v0 = a3 & a1;
    { const c = (v0 | 0) === 0; m.write(((sp) + 4) >>> 0, a3 >>> 0, 4); if (c) { pc = 0x80054688; continue; } }
  case 0x80054680:
    a2 = (a2 + 1) | 0;
    m.write(((sp) + 24) >>> 0, a2 >>> 0, 4);
  case 0x80054688:
    v0 = a3 << 16;
    a0 = a0 & 65535;
    v1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 32) >>> 0, 4) | 0;
    v0 = v0 | a0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v1 = (v1 + a1) | 0;
    m.write(((sp) + 24) >>> 0, v1 >>> 0, 4);
    v0 = m.read(((sp) + 20) >>> 0, 4) | 0;
    v1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    m.write(((t1) + 0) >>> 0, v0 >>> 0, 4);
    m.write(((t1) + 4) >>> 0, v1 >>> 0, 4);
    v0 = t1 | 0;
    sp = (sp + 16) | 0; return [v0, v1];
  default: throw new Error(`x80054618: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800546c8, translated instruction by instruction (25 instructions).
export function* x800546c8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800546c8;
  for (;;) switch (pc) {
  case 0x800546c8:
    sp = (sp + -24) | 0;
    v0 = (0 + 33) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -31208) >>> 0, a0 >>> 0, 4);
    at = 0x80080000 | 0;
    { const c = (a0 | 0) === (v0 | 0); m.write(((at) + -31204) >>> 0, a1 >>> 0, 4); if (c) { pc = 0x800546fc; continue; } }
  case 0x800546e8:
    v0 = (0 + 34) | 0;
    { const c = (a0 | 0) === (v0 | 0); a0 = 0xf4000000 | 0; if (c) { pc = 0x8005470c; continue; } }
  case 0x800546f4:
     pc = 0x8005471c; continue;
  case 0x800546fc:
    a0 = 0xf4000000 | 0;
    a0 = a0 | 2;
    a1 = (0 + 769) | 0; pc = 0x80054714; continue;
  case 0x8005470c:
    a0 = a0 | 2;
    a1 = (0 + 770) | 0;
  case 0x80054714:
     [v0, v1] = yield* call(ctx, sp, 0x8004ea28, a0, a1, a2, a3);
  case 0x8005471c:
    v0 = 0 | 0;
    sp = (sp + 24) | 0; return [v0, v1];
  default: throw new Error(`x800546c8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

export const EFFECTS_TRANSLATED = {0x8001c7fc: x8001c7fc, 0x8001cd20: x8001cd20, 0x8001d3d4: x8001d3d4, 0x8002665c: x8002665c, 0x8002d190: x8002d190, 0x8002d28c: x8002d28c, 0x8002d388: x8002d388, 0x8002d8e4: x8002d8e4, 0x8002d984: x8002d984, 0x8002d9e4: x8002d9e4, 0x8002dd08: x8002dd08, 0x8002e894: x8002e894, 0x8002ebe4: x8002ebe4, 0x8002f3c0: x8002f3c0, 0x8002f4cc: x8002f4cc, 0x8002f8e4: x8002f8e4, 0x8002fcf4: x8002fcf4, 0x8002ff40: x8002ff40, 0x80030188: x80030188, 0x800305f4: x800305f4, 0x80030e94: x80030e94, 0x800312b4: x800312b4, 0x800316cc: x800316cc, 0x80031e20: x80031e20, 0x80031e8c: x80031e8c, 0x80031efc: x80031efc, 0x80035498: x80035498, 0x800354f8: x800354f8, 0x8003ac44: x8003ac44, 0x8003ae5c: x8003ae5c, 0x8003af7c: x8003af7c, 0x8003bc68: x8003bc68, 0x8003bca8: x8003bca8, 0x8003be4c: x8003be4c, 0x8003cb1c: x8003cb1c, 0x8003e154: x8003e154, 0x8003e390: x8003e390, 0x8003e53c: x8003e53c, 0x8003e7c8: x8003e7c8, 0x8003ebb4: x8003ebb4, 0x8003f3cc: x8003f3cc, 0x8003f884: x8003f884, 0x8003fe70: x8003fe70, 0x80040178: x80040178, 0x80040ab0: x80040ab0, 0x80040ebc: x80040ebc, 0x800411e8: x800411e8, 0x800418d0: effectSwitch, 0x800448d8: x800448d8, 0x80044be4: x80044be4, 0x80044cd4: x80044cd4, 0x80044f2c: x80044f2c, 0x80044f4c: x80044f4c, 0x80045488: x80045488, 0x80045578: x80045578, 0x80053e98: x80053e98, 0x80053f98: x80053f98, 0x80054058: x80054058, 0x80054158: x80054158, 0x80054218: x80054218, 0x8005452c: x8005452c, 0x80054618: x80054618, 0x800546c8: x800546c8 };
