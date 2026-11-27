// The per-frame scene effects 0x800416a4 for the cases src/screen/weather.js weatherTick() does
// not port by hand (the palette animation, the layer scroll, the picture flips), with the
// routines they reach. Translated instruction by instruction from the original MIPS code by
// tools/translate/gen-weather.py (one switch case per basic block; registers are locals, memory
// is the PS1 RAM at the original addresses, calls go through call() in ../menu/calls.js).
// None of them waits for a frame: weatherTick runs them to the end at once.
import { call, mult, div } from "../menu/calls.js";

// 0x800416a4, translated instruction by instruction (139 instructions).
export function* x800416a4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800416a4;
  for (;;) switch (pc) {
  case 0x800416a4:
    sp = (sp + -40) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27166) >>> 0, 1);
    v0 = (0 + 2) | 0;
    m.write(((sp) + 32) >>> 0, 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    { const c = (v1 | 0) === (v0 | 0); m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x800418b0; continue; } }
  case 0x800416cc:
     [v0, v1] = yield* call(ctx, sp, 0x80040410, a0, a1, a2, a3);
  case 0x800416d4:
     [v0, v1] = yield* call(ctx, sp, 0x8004109c, a0, a1, a2, a3);
  case 0x800416dc:
    v1 = m.read(((0x8007913c) + 457) >>> 0, 1);
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0); v0 = 0x800a0000 | 0; if (c) { pc = 0x80041770; continue; } }
  case 0x800416ec:
    s1 = 0 | 0;
    a0 = (v0 + -11784) | 0;
    a2 = (a0 + 4) | 0;
    a1 = 0 | 61440;
  case 0x800416fc:
    v1 = s1 & 65535;
    s1 = (s1 + 1) | 0;
    v1 = v1 << 3;
    v0 = (v1 + a0) | 0;
    v1 = (v1 + a2) | 0;
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4);
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) !== 0; m.write(((v1) + 0) >>> 0, a1 >>> 0, 4); if (c) { pc = 0x800416fc; continue; } }
  case 0x80041724:
    s1 = (0 + 8) | 0;
    v0 = 0x800a0000 | 0;
    s2 = (v0 + -11784) | 0;
    s3 = (s2 + 4) | 0;
    a0 = (0 + 240) | 0;
  case 0x80041738:
    s0 = s1 & 65535;
    s0 = s0 << 3;
    v0 = (s0 + s2) | 0;
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x8004174c:
    s1 = (s1 + 1) | 0;
    s0 = (s0 + s3) | 0;
    v0 = v0 << 16;
    v0 = v0 >> 8;
    m.write(((s0) + 0) >>> 0, v0 >>> 0, 4);
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 240 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 240) | 0; if (c) { pc = 0x80041738; continue; } }
  case 0x80041770:
     [v0, v1] = yield* call(ctx, sp, 0x8003f708, a0, a1, a2, a3);
  case 0x80041778:
    v0 = m.read(((0x8007913c) + 464) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x800417b4; continue; } }
  case 0x80041788:
    v0 = m.read(((0x8007913c) + 465) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800417a4; continue; } }
  case 0x80041798:
    a0 = m.read(((v0) + 26268) >>> 0, 2);
    a1 = (0 + 15) | 0; pc = 0x800417ac; continue;
  case 0x800417a4:
    a0 = m.read(((v0) + 26268) >>> 0, 2);
    a1 = (0 + 12) | 0;
  case 0x800417ac:
     [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800417b4:
    v0 = m.read(((0x8007913c) + 465) >>> 0, 1);
    v1 = m.read(((0x8007913c) + 466) >>> 0, 1);
    v0 = (v0 + 1) | 0;
    v0 = v0 & 1;
    m.write(((0x8007913c) + 465) >>> 0, v0 & 0xff, 1);
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8004187c; continue; } }
  case 0x800417d4:
     [v0, v1] = yield* call(ctx, sp, 0x8003f884, a0, a1, a2, a3);
  case 0x800417dc:
    a0 = m.read(((0x8007913c) + 468) >>> 0, 4) | 0;
    v0 = 0x92490000 | 0;
    v0 = v0 | 9363;
    v1 = (a0 >>> 3) | 0;
    [hi, lo] = mult(v1, v0, false);
    a3 = (0 + 1) | 0;
    a1 = 0x801f0000 | 0;
    v0 = 0x80070000 | 0;
    v1 = (a1 + -4376) | 0;
    a2 = (v1 + 2) | 0;
    v0 = m.read(((v0) + -1648) >>> 0, 2);
    a0 = (a0 >>> 2) | 0;
    m.write(((a1) + -4376) >>> 0, v0 & 0xffff, 2);
    t0 = hi;
    v1 = (t0 >>> 2) | 0;
    v0 = v1 << 3;
    v0 = (v0 - v1) | 0;
    v0 = v0 << 1;
    v1 = (a0 - v0) | 0;
    v0 = 0x80070000 | 0;
    v0 = (v0 + -1646) | 0;
    v1 = v1 << 1;
    v1 = (v1 + v0) | 0;
  case 0x80041838:
    v0 = m.read(((v1) + 0) >>> 0, 2);
    v1 = (v1 + 2) | 0;
    a3 = (a3 + 1) | 0;
    m.write(((a2) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = (a3 | 0) < 16 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a2 = (a2 + 2) | 0; if (c) { pc = 0x80041838; continue; } }
  case 0x80041854:
    a0 = 0x801f0000 | 0;
    a0 = (a0 + -4376) | 0;
    v0 = m.read(((0x8007913c) + 468) >>> 0, 4) | 0;
    v0 = (v0 + 1) | 0;
    m.write(((0x8007913c) + 468) >>> 0, v0 >>> 0, 4);
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003abec, a0, a1, a2, a3);
  case 0x80041874:
    a0 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002f0bc, a0, a1, a2, a3);
  case 0x8004187c:
    v1 = m.read(((0x8007913c) + 467) >>> 0, 1);
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0); s0 = 0x801f0000 | 0; if (c) { pc = 0x800418a8; continue; } }
  case 0x8004188c:
    s0 = (s0 + 26264) | 0;
    a0 = m.read(((s0) + 2) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x8004189c:
    a0 = m.read(((s0) + 10) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003be4c, a0, a1, a2, a3);
  case 0x800418a8:
     [v0, v1] = yield* call(ctx, sp, 0x80041464, a0, a1, a2, a3);
  case 0x800418b0:
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return v0;
  default: throw new Error(`x800416a4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002f0bc, translated instruction by instruction (11 instructions).
export function* x8002f0bc(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002f0bc;
  for (;;) switch (pc) {
  case 0x8002f0bc:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    a1 = 0x800b0000 | 0;
    a0 = a0 & 255;
    a1 = (a1 + 7200) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8002f0d8:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`x8002f0bc: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003f708, translated instruction by instruction (56 instructions).
export function* x8003f708(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003f708;
  for (;;) switch (pc) {
  case 0x8003f708:
    a0 = m.read(((0x8007913c) + 460) >>> 0, 4) | 0;
    sp = (sp + -24) | 0;
    { const c = (a0 | 0) === 0; m.write(((sp) + 16) >>> 0, 0, 4); if (c) { pc = 0x8003f7d8; continue; } }
  case 0x8003f718:
    v0 = m.read(((0x8007913c) + 912) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (v0 + -1) | 0; if (c) { pc = 0x8003f7d4; continue; } }
  case 0x8003f728:
    v0 = m.read(((0x8007913c) + 992) >>> 0, 2);
    v0 = v0 << 1;
    v0 = (v0 + a0) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 1);
    v0 = (0 + 255) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8003f74c; continue; } }
  case 0x8003f748:
    m.write(((0x8007913c) + 992) >>> 0, 0 & 0xffff, 2);
  case 0x8003f74c:
    v0 = m.read(((0x8007913c) + 992) >>> 0, 2);
    v0 = v0 << 1;
    a0 = (v0 + a0) | 0;
    v1 = m.read(((a0) + 0) >>> 0, 1);
    v0 = (0 + 254) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8003f77c; continue; } }
  case 0x8003f76c:
    a0 = m.read(((a0) + 1) >>> 0, 1);
     [v0, v1] = yield* call(ctx, sp, 0x800354f8, a0, a1, a2, a3);
  case 0x8003f778:
    m.write(((0x8007913c) + 992) >>> 0, v0 & 0xffff, 2);
  case 0x8003f77c:
    v0 = m.read(((0x8007913c) + 992) >>> 0, 2);
    v1 = m.read(((0x8007913c) + 460) >>> 0, 4) | 0;
    v0 = v0 << 1;
    v0 = (v0 + v1) | 0;
    v1 = m.read(((0x8007913c) + 804) >>> 0, 1);
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v1 | 0) !== 0; a0 = (0 + 8) | 0; if (c) { pc = 0x8003f7ac; continue; } }
  case 0x8003f79c:
    a1 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ac44, a0, a1, a2, a3);
  case 0x8003f7a4:
     pc = 0x8003f7b8; continue;
  case 0x8003f7ac:
    a1 = v0 | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ad50, a0, a1, a2, a3);
  case 0x8003f7b8:
    v1 = m.read(((0x8007913c) + 992) >>> 0, 2);
    a0 = m.read(((0x8007913c) + 460) >>> 0, 4) | 0;
    v0 = v1 << 1;
    v0 = (v0 + a0) | 0;
    v0 = m.read(((v0) + 1) >>> 0, 1);
    v1 = (v1 + 1) | 0;
    m.write(((0x8007913c) + 992) >>> 0, v1 & 0xffff, 2);
  case 0x8003f7d4:
    m.write(((0x8007913c) + 912) >>> 0, v0 & 0xff, 1);
  case 0x8003f7d8:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`x8003f708: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80041464, translated instruction by instruction (126 instructions).
export function* x80041464(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80041464;
  for (;;) switch (pc) {
  case 0x80041464:
    sp = (sp + -48) | 0;
    v1 = m.read(((0x8007913c) + 484) >>> 0, 1);
    v0 = (0 + 1) | 0;
    m.write(((sp) + 44) >>> 0, 0, 4);
    m.write(((sp) + 40) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s1 >>> 0, 4);
    { const c = (v1 | 0) !== (v0 | 0); m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x80041640; continue; } }
  case 0x80041484:
    a0 = 0 | 0;
    a1 = (0 + 15) | 0;
    s1 = (0 + 256) | 0;
    v0 = 0x801f0000 | 0;
    v0 = (v0 + -4248) | 0;
    v1 = 0x801f0000 | 0;
    v1 = m.read(((v1) + 26282) >>> 0, 2);
    s2 = v0 | 0;
    v0 = v1 << 3;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 3;
    v0 = (v0 + s2) | 0;
    m.write(((v0) + 58) >>> 0, 0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x8001c374, a0, a1, a2, a3);
  case 0x800414bc:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -28056) >>> 0, 4) | 0;
    v0 = (a0 | 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (a0 + -3) | 0; if (c) { pc = 0x80041640; continue; } }
  case 0x800414d4:
    v1 = m.read(((0x8007913c) + 938) >>> 0, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -28056) >>> 0, v0 >>> 0, 4);
    v1 = (v1 >>> 0) < 3360 ? 1 : 0;
    { const c = (v1 | 0) === 0;  if (c) { pc = 0x800414bc; continue; } }
  case 0x800414ec:
    a1 = m.read(((0x8007913c) + 938) >>> 0, 2);
    v0 = a1 & 127;
    { const c = (v0 | 0) !== 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80041590; continue; } }
  case 0x80041500:
    a1 = (a1 >>> 7) | 0;
    v0 = (a1 >>> 0) < 26 ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = (sp + 24) | 0; if (c) { pc = 0x80041564; continue; } }
  case 0x80041510:
    a0 = m.read(((0x8007913c) + 968) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044e50, a0, a1, a2, a3);
  case 0x8004151c:
    v1 = 0x10000 | 0;
    v1 = v1 | 16384;
    s0 = m.read(((0x8007913c) + 968) >>> 0, 4) | 0;
    a0 = v0 | 0;
    s0 = (s0 + v1) | 0;
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800360b8, a0, a1, a2, a3);
  case 0x80041538:
    a0 = (0 + 27) | 0;
    a1 = s0 | 0;
    a2 = (0 + 40) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003b19c, a0, a1, a2, a3);
  case 0x8004154c:
    a0 = 0x800c0000 | 0;
    a0 = (a0 + 32288) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003abec, a0, a1, a2, a3);
  case 0x8004155c:
    v0 = 0x801f0000 | 0; pc = 0x80041590; continue;
  case 0x80041564:
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = a1 | 0;
    v0 = (0 + 704) | 0;
    m.write(((sp) + 24) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 160) | 0;
    m.write(((sp) + 26) >>> 0, s1 & 0xffff, 2);
    m.write(((sp) + 28) >>> 0, v0 & 0xffff, 2);
    m.write(((sp) + 30) >>> 0, s1 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x80049438, a0, a1, a2, a3);
  case 0x8004158c:
    v0 = 0x801f0000 | 0;
  case 0x80041590:
    v1 = m.read(((v0) + 26282) >>> 0, 2);
    v0 = v1 << 3;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 3;
    v1 = m.read(((0x8007913c) + 938) >>> 0, 1);
    v0 = (v0 + s2) | 0;
    m.write(((v0) + 15) >>> 0, v1 & 0xff, 1);
    v1 = m.read(((0x8007913c) + 938) >>> 0, 2);
    v0 = (0 + 704) | 0;
    m.write(((sp) + 16) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 320) | 0;
    m.write(((sp) + 24) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 160) | 0;
    m.write(((sp) + 20) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 1) | 0;
    m.write(((sp) + 18) >>> 0, s1 & 0xffff, 2);
    m.write(((sp) + 26) >>> 0, 0 & 0xffff, 2);
    m.write(((sp) + 22) >>> 0, v0 & 0xffff, 2);
    a1 = (v1 + -1) | 0;
    a2 = a1 | 0;
    v0 = v1 & 127;
    v0 = (v0 + 256) | 0;
    { const c = (a1 | 0) >= 0; m.write(((sp) + 18) >>> 0, v0 & 0xffff, 2); if (c) { pc = 0x800415f8; continue; } }
  case 0x800415f4:
    a2 = (v1 + 254) | 0;
  case 0x800415f8:
    a0 = 0 | 0;
    v0 = a2 >> 8;
    v0 = v0 << 8;
    v0 = (a1 - v0) | 0;
    m.write(((sp) + 26) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80041610:
    a1 = (m.read(((sp) + 24) >>> 0, 2) << 16) >> 16;
    a2 = (m.read(((sp) + 26) >>> 0, 2) << 16) >> 16;
    a0 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80049620, a0, a1, a2, a3);
  case 0x80041620:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80041628:
    v0 = m.read(((0x8007913c) + 938) >>> 0, 2);
    v0 = (v0 + 1) | 0;
    m.write(((0x8007913c) + 938) >>> 0, v0 & 0xffff, 2);
     pc = 0x800414bc; continue;
  case 0x80041640:
    s2 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return v0;
  default: throw new Error(`x80041464: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003ad50, translated instruction by instruction (67 instructions).
export function* x8003ad50(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003ad50;
  for (;;) switch (pc) {
  case 0x8003ad50:
    sp = (sp + -552) | 0;
    m.write(((sp) + 536) >>> 0, s2 >>> 0, 4);
    s2 = a1 | 0;
    m.write(((sp) + 540) >>> 0, s3 >>> 0, 4);
    s3 = a0 & 255;
    m.write(((sp) + 528) >>> 0, s0 >>> 0, 4);
    s0 = s3 << 9;
    v0 = 0x800c0000 | 0;
    v0 = (v0 + 18464) | 0;
    s0 = (s0 + v0) | 0;
    a0 = s0 | 0;
    a1 = (sp + 16) | 0;
    m.write(((sp) + 532) >>> 0, s1 >>> 0, 4);
    s1 = a2 | 0;
    m.write(((sp) + 544) >>> 0, 0, 4);
    a2 = (0 + 512) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8003ad94:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x8003ad9c:
    s1 = s1 & 255;
    a1 = s1 << 1;
    s0 = (a1 + s0) | 0;
    v0 = m.read(((s0) + 0) >>> 0, 1);
    v1 = m.read(((s0) + 0) >>> 0, 2);
    v0 = v0 & 31;
    a3 = (v0 + s2) | 0;
    v0 = v1 & 992;
    v0 = (v0 >>> 5) | 0;
    a2 = (v0 + s2) | 0;
    v1 = v1 & 31744;
    v1 = (v1 >>> 10) | 0;
    v0 = a3 & 255;
    v0 = (v0 >>> 0) < 32 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = (v1 + s2) | 0; if (c) { pc = 0x8003ade0; continue; } }
  case 0x8003addc:
    a3 = (0 + 31) | 0;
  case 0x8003ade0:
    v0 = a2 & 255;
    v0 = (v0 >>> 0) < 32 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 & 255; if (c) { pc = 0x8003adf4; continue; } }
  case 0x8003adf0:
    a2 = (0 + 31) | 0;
  case 0x8003adf4:
    v0 = (v0 >>> 0) < 32 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (sp + 16) | 0; if (c) { pc = 0x8003ae04; continue; } }
  case 0x8003ae00:
    v1 = (0 + 31) | 0;
  case 0x8003ae04:
    a1 = (a1 + a0) | 0;
    v1 = v1 & 255;
    v1 = v1 << 10;
    v0 = a2 & 255;
    v0 = v0 << 5;
    v1 = (v1 + v0) | 0;
    v0 = a3 & 255;
    v0 = (v0 + v1) | 0;
    v1 = (0 + -32768) | 0;
    v0 = (v0 + v1) | 0;
    m.write(((a1) + 0) >>> 0, v0 & 0xffff, 2);
    a1 = 0 | 0;
    a2 = (s3 + 480) | 0; [v0, v1] = yield* call(ctx, sp, 0x80046d10, a0, a1, a2, a3);
  case 0x8003ae3c:
    s3 = m.read(((sp) + 540) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 536) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 532) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 528) >>> 0, 4) | 0;
    sp = (sp + 552) | 0;
     return v0;
  default: throw new Error(`x8003ad50: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

export const WEATHER_TRANSLATED = {0x800416a4: x800416a4, 0x8002f0bc: x8002f0bc, 0x8003f708: x8003f708, 0x80041464: x80041464, 0x8003ad50: x8003ad50 };
