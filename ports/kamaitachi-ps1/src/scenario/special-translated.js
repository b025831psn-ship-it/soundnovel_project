// The special scenes 0x80044384 that src/title.js special() does not port by hand (the
// selection screens of the scenario and the scenes they lead to), with the routines they reach.
// Translated instruction by instruction from the original MIPS code by
// tools/translate/gen-special.py (one switch case per basic block; registers are locals,
// memory is the PS1 RAM at the original addresses, calls go through call() in ../menu/calls.js
// with the caller's sp). Generators: each frame the original waits is a yield.
import { call, mult, div } from "../menu/calls.js";

// 0x80044384, translated instruction by instruction (313 instructions).
export function* specialSwitch(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044384;
  for (;;) switch (pc) {
  case 0x80044384:
    sp = (sp + -40) | 0;
    v1 = a0 & 65535;
    v0 = (v1 >>> 0) < 108 ? 1 : 0;
    m.write(((sp) + 32) >>> 0, 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    { const c = (v0 | 0) === 0; m.write(((sp) + 24) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x80044850; continue; } }
  case 0x800443a0:
    v0 = 0x80010000 | 0;
    v0 = (v0 + 10716) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x800443c0:
     [v0, v1] = yield* call(ctx, sp, 0x8001b694, a0, a1, a2, a3);
  case 0x800443c8:
     pc = 0x80044850; continue;
  case 0x800443d0:
    v0 = 0x20000 | 0;
    v0 = v0 | 43008;
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27324) >>> 0, 4) | 0;
    s0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28020) >>> 0, s0 & 0xff, 1);
    a1 = (a1 + v0) | 0;
    m.write(((0x8007913c) + 968) >>> 0, a1 >>> 0, 4);
    a2 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x80044400:
    a0 = (sp + 16) | 0;
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = a1 | 0;
    v0 = (0 + 320) | 0;
    s1 = (0 + 160) | 0;
    m.write(((0x8007913c) + 484) >>> 0, s0 & 0xff, 1);
    s0 = (0 + 256) | 0;
    m.write(((0x8007913c) + 938) >>> 0, 0 & 0xffff, 2);
    m.write(((sp) + 18) >>> 0, 0 & 0xffff, 2);
    m.write(((sp) + 16) >>> 0, v0 & 0xffff, 2);
    m.write(((sp) + 20) >>> 0, s1 & 0xffff, 2);
    m.write(((sp) + 22) >>> 0, s0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x80049438, a0, a1, a2, a3);
  case 0x80044438:
    a0 = (sp + 16) | 0;
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = a1 | 0;
    v0 = (0 + 704) | 0;
    m.write(((sp) + 18) >>> 0, s0 & 0xffff, 2);
    m.write(((sp) + 16) >>> 0, v0 & 0xffff, 2);
    m.write(((sp) + 20) >>> 0, s1 & 0xffff, 2);
    m.write(((sp) + 22) >>> 0, s0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x80049438, a0, a1, a2, a3);
  case 0x80044460:
    at = 0x80080000 | 0;
    m.write(((at) + -28056) >>> 0, 0 >>> 0, 4);
     pc = 0x80044850; continue;
  case 0x80044470:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800426b0, a0, a1, a2, a3);
  case 0x80044478:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800426b0, a0, a1, a2, a3);
  case 0x80044480:
     pc = 0x80044850; continue;
  case 0x80044488:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800426b0, a0, a1, a2, a3);
  case 0x80044490:
    v0 = (0 + 1) | 0; pc = 0x800444d4; continue;
  case 0x80044498:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27992) >>> 0, v0 & 0xff, 1);
     pc = 0x80044850; continue;
  case 0x800444ac:
    v0 = 0x801f0000 | 0;
    v0 = m.read(((v0) + 26268) >>> 0, 2);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80044850; continue; } }
  case 0x800444c0:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800444c8:
     pc = 0x80044850; continue;
  case 0x800444d0:
    v0 = (0 + 1) | 0;
  case 0x800444d4:
    at = 0x80080000 | 0;
    m.write(((at) + -28010) >>> 0, v0 & 0xff, 1);
     pc = 0x80044850; continue;
  case 0x800444e4:
    a0 = (0 + 32) | 0; pc = 0x800444f8; continue;
  case 0x800444ec:
    a0 = (0 + 33) | 0; pc = 0x800444f8; continue;
  case 0x800444f4:
    a0 = (0 + 34) | 0;
  case 0x800444f8:
     [v0, v1] = yield* call(ctx, sp, 0x80043b90, a0, a1, a2, a3);
  case 0x80044500:
    at = 0x80080000 | 0;
    m.write(((at) + -28009) >>> 0, v0 & 0xff, 1);
     pc = 0x80044850; continue;
  case 0x80044510:
     [v0, v1] = yield* call(ctx, sp, 0x8004419c, a0, a1, a2, a3);
  case 0x80044518:
     pc = 0x80044850; continue;
  case 0x80044520:
    v0 = 0x801f0000 | 0;
    v1 = (v0 + 29872) | 0;
    v0 = m.read(((v1) + 1) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80044568; continue; } }
  case 0x80044538:
    v0 = m.read(((v1) + 2) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80044568; continue; } }
  case 0x80044548:
    v0 = m.read(((v1) + 3) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80044568; continue; } }
  case 0x80044558:
    v0 = m.read(((v1) + 4) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80044578; continue; } }
  case 0x80044568:
    v1 = 0x801f0000 | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 29923) >>> 0, v0 & 0xff, 1);
    v0 = 0x801f0000 | 0;
  case 0x80044578:
    v1 = (v0 + 29872) | 0;
    v0 = m.read(((v1) + 18) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004458c:
    v0 = m.read(((v1) + 19) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004459c:
    v0 = m.read(((v1) + 1) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x800445ac:
    v0 = m.read(((v1) + 2) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x800445bc:
    v0 = m.read(((v1) + 3) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x800445cc:
    v0 = m.read(((v1) + 4) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x800445dc:
    v0 = m.read(((v1) + 5) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x800445ec:
    v0 = m.read(((v1) + 6) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x800445fc:
    v0 = m.read(((v1) + 7) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004460c:
    v0 = m.read(((v1) + 8) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004461c:
    v0 = m.read(((v1) + 9) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004462c:
    v0 = m.read(((v1) + 10) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004463c:
    v0 = m.read(((v1) + 11) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004464c:
    v0 = m.read(((v1) + 12) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004465c:
    v0 = m.read(((v1) + 13) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004466c:
    v0 = m.read(((v1) + 14) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004467c:
    v0 = m.read(((v1) + 15) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004468c:
    v0 = m.read(((v1) + 16) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x8004469c:
    v0 = m.read(((v1) + 17) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x800446ac:
    v0 = m.read(((v1) + 20) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x800446d4; continue; } }
  case 0x800446bc:
    v0 = m.read(((v1) + 43) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x800446d0; continue; } }
  case 0x800446cc:
    m.write(((v1) + 52) >>> 0, v0 & 0xff, 1);
  case 0x800446d0:
    v0 = 0x801f0000 | 0;
  case 0x800446d4:
    a1 = (v0 + 29872) | 0;
    v0 = m.read(((a1) + 24) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x800446ec; continue; } }
  case 0x800446e8:
    m.write(((a1) + 53) >>> 0, v0 & 0xff, 1);
  case 0x800446ec:
    a0 = (0 + 1) | 0;
    v1 = a0 | 0;
    a2 = a1 | 0;
  case 0x800446f8:
    v0 = v1 & 255;
    v0 = (v0 + a2) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    v1 = (v1 + 1) | 0;
    a1 = a0 & v0;
    v0 = v1 & 255;
    v0 = (v0 >>> 0) < 44 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = a1 | 0; if (c) { pc = 0x800446f8; continue; } }
  case 0x8004471c:
    v0 = 0x801f0000 | 0;
    a0 = (v0 + 29872) | 0;
    v0 = m.read(((a0) + 46) >>> 0, 1);
    v1 = m.read(((a0) + 47) >>> 0, 1);
    v0 = a1 & v0;
    v1 = v1 & v0;
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80044850; continue; } }
  case 0x80044740:
    m.write(((a0) + 54) >>> 0, v1 & 0xff, 1); pc = 0x80044850; continue;
  case 0x80044748:
     [v0, v1] = yield* call(ctx, sp, 0x80037b08, a0, a1, a2, a3);
  case 0x80044750:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a7c, a0, a1, a2, a3);
  case 0x80044758:
     pc = 0x80044850; continue;
  case 0x80044760:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27990) >>> 0, v0 & 0xff, 1);
     pc = 0x80044850; continue;
  case 0x80044774:
    at = 0x80080000 | 0;
    m.write(((at) + -27990) >>> 0, 0 & 0xff, 1);
     pc = 0x80044850; continue;
  case 0x80044784:
    at = 0x80080000 | 0;
    m.write(((at) + -27995) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27992) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80025600, a0, a1, a2, a3);
  case 0x8004479c:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27999) >>> 0, v0 & 0xff, 1);
     pc = 0x80044850; continue;
  case 0x800447b0:
    s0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28001) >>> 0, s0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27980) >>> 0, 0 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27990) >>> 0, s0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27992) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80025600, a0, a1, a2, a3);
  case 0x800447dc:
    at = 0x80080000 | 0;
    m.write(((at) + -27999) >>> 0, s0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x800390ac, a0, a1, a2, a3);
  case 0x800447ec:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001fd1c, a0, a1, a2, a3);
  case 0x800447f4:
     pc = 0x80044850; continue;
  case 0x800447fc:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27995) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27962) >>> 0, v0 & 0xff, 1);
     pc = 0x80044850; continue;
  case 0x80044818:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27995) >>> 0, v0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27962) >>> 0, 0 & 0xff, 1);
     pc = 0x80044850; continue;
  case 0x80044834:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27991) >>> 0, v0 & 0xff, 1);
     pc = 0x80044850; continue;
  case 0x80044848:
    at = 0x80080000 | 0;
    m.write(((at) + -27991) >>> 0, 0 & 0xff, 1);
  case 0x80044850:
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`specialSwitch: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80025600, translated instruction by instruction (16 instructions).
export function x80025600(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80025600;
  for (;;) switch (pc) {
  case 0x80025600:
    a0 = 0 | 0;
    v0 = 0x801f0000 | 0;
    a1 = (v0 + -4288) | 0;
  case 0x8002560c:
    v0 = a0 << 16;
    v1 = (a0 + 1) | 0;
    a0 = v1 | 0;
    v0 = v0 >> 12;
    v0 = (v0 + a1) | 0;
    v1 = v1 << 16;
    m.write(((v0) + 12) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 8) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 4) >>> 0, 0 >>> 0, 4);
    { const c = (v1 | 0) <= 0; m.write(((v0) + 0) >>> 0, 0 >>> 0, 4); if (c) { pc = 0x8002560c; continue; } }
  case 0x80025638:
     return [v0, v1];
  default: throw new Error(`x80025600: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80037a7c, translated instruction by instruction (35 instructions).
export function* x80037a7c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80037a7c;
  for (;;) switch (pc) {
  case 0x80037a7c:
    sp = (sp + -24) | 0;
    v1 = 0x80070000 | 0;
    v0 = a0 & 255;
    a0 = (v1 + -18804) | 0;
    a2 = (0 + 32) | 0;
    v0 = v0 << 5;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = 0x800c0000 | 0;
    s0 = (s0 + 18464) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27958) >>> 0, 1);
    v0 = (v0 + s0) | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
    a1 = a1 << 9;
    a1 = (a1 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80037abc:
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27958) >>> 0, 1);
    a1 = 0 | 0;
    a0 = a2 << 9;
    a0 = (a0 + s0) | 0;
    a2 = (a2 + 480) | 0; [v0, v1] = yield* call(ctx, sp, 0x80046d10, a0, a1, a2, a3);
  case 0x80037ad8:
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27958) >>> 0, 1);
    a1 = 0 | 0;
    a0 = a2 << 9;
    a0 = (a0 + s0) | 0;
    a2 = (a2 + 482) | 0; [v0, v1] = yield* call(ctx, sp, 0x80046d10, a0, a1, a2, a3);
  case 0x80037af4:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x80037a7c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800390ac, translated instruction by instruction (16 instructions).
export function* x800390ac(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800390ac;
  for (;;) switch (pc) {
  case 0x800390ac:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = 0 | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
  case 0x800390bc:
    a0 = s0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80038f80, a0, a1, a2, a3);
  case 0x800390c4:
    s0 = (s0 + 1) | 0;
    v0 = s0 & 255;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x800390bc; continue; } }
  case 0x800390d8:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x800390ac: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800426b0, translated instruction by instruction (783 instructions).
export function* x800426b0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800426b0;
  for (;;) switch (pc) {
  case 0x800426b0:
    sp = (sp + -152) | 0;
    m.write(((sp) + 140) >>> 0, s7 >>> 0, 4);
    s7 = 0 | 0;
    v0 = 0x80010000 | 0;
    m.write(((sp) + 148) >>> 0, 0, 4);
    m.write(((sp) + 144) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 136) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 132) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 128) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 124) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 120) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 116) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 112) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 56) >>> 0, a0 & 0xff, 1);
    a2 = (v0 + 8100) | 0;
    { const n = ((((a2) + 3) >>> 0) & 3), w = m.read(((((a2) + 3) >>> 0) & ~3) >>> 0, 4) | 0; v1 = (v1 & (0x00ffffff >>> (n * 8))) | (w << (24 - n * 8)); }
    { const n = ((((a2) + 0) >>> 0) & 3), w = m.read(((((a2) + 0) >>> 0) & ~3) >>> 0, 4) >>> 0; v1 = (v1 & (0xffffff00 << ((3 - n) * 8))) | (w >>> (n * 8)); }
    { const n = ((((a2) + 7) >>> 0) & 3), w = m.read(((((a2) + 7) >>> 0) & ~3) >>> 0, 4) | 0; a0 = (a0 & (0x00ffffff >>> (n * 8))) | (w << (24 - n * 8)); }
    { const n = ((((a2) + 4) >>> 0) & 3), w = m.read(((((a2) + 4) >>> 0) & ~3) >>> 0, 4) >>> 0; a0 = (a0 & (0xffffff00 << ((3 - n) * 8))) | (w >>> (n * 8)); }
    { const n = ((((a2) + 11) >>> 0) & 3), w = m.read(((((a2) + 11) >>> 0) & ~3) >>> 0, 4) | 0; a1 = (a1 & (0x00ffffff >>> (n * 8))) | (w << (24 - n * 8)); }
    { const n = ((((a2) + 8) >>> 0) & 3), w = m.read(((((a2) + 8) >>> 0) & ~3) >>> 0, 4) >>> 0; a1 = (a1 & (0xffffff00 << ((3 - n) * 8))) | (w >>> (n * 8)); }
    { const n = ((((sp) + 43) >>> 0) & 3), w = m.read(((((sp) + 43) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 43) >>> 0) & ~3) >>> 0, ((w & (0xffffff00 << (n * 8))) | (v1 >>> (24 - n * 8))) >>> 0, 4); }
    { const n = ((((sp) + 40) >>> 0) & 3), w = m.read(((((sp) + 40) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 40) >>> 0) & ~3) >>> 0, ((w & (0x00ffffff >>> ((3 - n) * 8))) | (v1 << (n * 8))) >>> 0, 4); }
    { const n = ((((sp) + 47) >>> 0) & 3), w = m.read(((((sp) + 47) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 47) >>> 0) & ~3) >>> 0, ((w & (0xffffff00 << (n * 8))) | (a0 >>> (24 - n * 8))) >>> 0, 4); }
    { const n = ((((sp) + 44) >>> 0) & 3), w = m.read(((((sp) + 44) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 44) >>> 0) & ~3) >>> 0, ((w & (0x00ffffff >>> ((3 - n) * 8))) | (a0 << (n * 8))) >>> 0, 4); }
    { const n = ((((sp) + 51) >>> 0) & 3), w = m.read(((((sp) + 51) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 51) >>> 0) & ~3) >>> 0, ((w & (0xffffff00 << (n * 8))) | (a1 >>> (24 - n * 8))) >>> 0, 4); }
    { const n = ((((sp) + 48) >>> 0) & 3), w = m.read(((((sp) + 48) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 48) >>> 0) & ~3) >>> 0, ((w & (0x00ffffff >>> ((3 - n) * 8))) | (a1 << (n * 8))) >>> 0, 4); }
    v1 = (m.read(((a2) + 12) >>> 0, 1) << 24) >> 24;
    m.write(((sp) + 52) >>> 0, v1 & 0xff, 1);
    t4 = 0x80080000 | 0;
    t4 = m.read(((t4) + -27384) >>> 0, 4) | 0;
    v1 = m.read(((sp) + 56) >>> 0, 1);
    v0 = (0 + 2) | 0;
    m.write(((sp) + 64) >>> 0, 0 & 0xff, 1);
    m.write(((sp) + 72) >>> 0, 0 & 0xff, 1);
    m.write(((sp) + 80) >>> 0, t4 >>> 0, 4);
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 9001) | 0; if (c) { pc = 0x80042750; continue; } }
  case 0x8004274c:
    a0 = (0 + 9000) | 0;
  case 0x80042750:
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80042758:
    s1 = m.read(((sp) + 56) >>> 0, 1);
    t5 = (sp + 40) | 0;
    { const c = (s1 | 0) !== 0; m.write(((sp) + 60) >>> 0, t5 >>> 0, 4); if (c) { pc = 0x80042794; continue; } }
  case 0x80042768:
    s0 = 0x80070000 | 0;
    s0 = (s0 + -20432) | 0;
    a0 = m.read(((s0) + 4) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003a89c, a0, a1, a2, a3);
  case 0x8004277c:
    a1 = m.read(((sp) + 60) >>> 0, 4) | 0;
    m.write(((sp) + 64) >>> 0, v0 & 0xff, 1);
    a2 = m.read(((sp) + 64) >>> 0, 1);
    a0 = m.read(((s0) + 4) >>> 0, 4) | 0;
    a2 = a2 << 1; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80042794:
    v0 = (0 + 1) | 0;
    { const c = (s1 | 0) !== (v0 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x800427d0; continue; } }
  case 0x800427a0:
    s0 = 0x80070000 | 0;
    s0 = (s0 + -20432) | 0;
    a0 = m.read(((s0) + 8) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003a89c, a0, a1, a2, a3);
  case 0x800427b4:
    a1 = m.read(((sp) + 60) >>> 0, 4) | 0;
    m.write(((sp) + 64) >>> 0, v0 & 0xff, 1);
    a2 = m.read(((sp) + 64) >>> 0, 1);
    a0 = m.read(((s0) + 8) >>> 0, 4) | 0;
    a2 = a2 << 1; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x800427cc:
    v0 = (0 + 2) | 0;
  case 0x800427d0:
    { const c = (s1 | 0) !== (v0 | 0); a0 = 0x80070000 | 0; if (c) { pc = 0x800427f0; continue; } }
  case 0x800427d8:
    a0 = (a0 + -1116) | 0;
    a1 = (0 + 11) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e10, a0, a1, a2, a3);
  case 0x800427e4:
    s4 = v0 | 0;
    fp = (0 + 90) | 0; pc = 0x80042804; continue;
  case 0x800427f0:
    a0 = (a0 + -1116) | 0;
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e10, a0, a1, a2, a3);
  case 0x800427fc:
    s4 = v0 | 0;
    fp = 0 | 0;
  case 0x80042804:
    s2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80026204, a0, a1, a2, a3);
  case 0x8004280c:
    a0 = m.read(((s4) + 0) >>> 0, 2);
    s4 = (s4 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x80042818:
    s3 = v0 | 0;
    s0 = s3 & 65535;
    t4 = 0 | 65535;
    { const c = (s0 | 0) === (t4 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x80042924; continue; } }
  case 0x8004282c:
    v1 = m.read(((sp) + 56) >>> 0, 1);
    { const c = (v1 | 0) === (v0 | 0); a0 = 0x80070000 | 0; if (c) { pc = 0x80042840; continue; } }
  case 0x8004283c:
    fp = (fp + 1) | 0;
  case 0x80042840:
    a0 = (a0 + -1116) | 0;
    a1 = (0 + 10) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e10, a0, a1, a2, a3);
  case 0x8004284c:
    s6 = v0 | 0;
    s1 = 0 | 0;
    s5 = s0 | 0;
  case 0x80042858:
    v0 = s1 & 65535;
    v0 = v0 << 1;
    s0 = (v0 + s6) | 0;
    a0 = m.read(((s0) + 0) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x80042870:
    v0 = v0 & 65535;
    { const c = (v0 | 0) === 0; v0 = s1 & 65535; if (c) { pc = 0x800428b4; continue; } }
  case 0x8004287c:
    a0 = m.read(((s0) + 0) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x80042888:
    v0 = v0 & 65535;
    { const c = (v0 | 0) !== (s5 | 0); s1 = (s1 + 1) | 0; if (c) { pc = 0x80042858; continue; } }
  case 0x80042894:
    v0 = s2 & 65535;
    v0 = v0 << 1;
    v1 = 0 | 65521;
    t5 = m.read(((sp) + 80) >>> 0, 4) | 0;
    s1 = 0 | 65535;
    v0 = (v0 + t5) | 0;
    m.write(((v0) + 0) >>> 0, v1 & 0xffff, 2);
    v0 = s1 & 65535;
  case 0x800428b4:
    t4 = 0 | 65535;
    { const c = (v0 | 0) === (t4 | 0); v1 = s3 & 65535; if (c) { pc = 0x80042904; continue; } }
  case 0x800428c0:
    v0 = 0 | 65519;
    v0 = (v0 >>> 0) < (v1 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = s2 & 65535; if (c) { pc = 0x800428f4; continue; } }
  case 0x800428d0:
    t5 = m.read(((sp) + 80) >>> 0, 4) | 0;
    v0 = v0 << 1;
    v0 = (v0 + t5) | 0;
    m.write(((v0) + 0) >>> 0, s3 & 0xffff, 2);
    a0 = m.read(((s4) + 0) >>> 0, 2);
    s4 = (s4 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x800428ec:
    s3 = v0 | 0; pc = 0x80042904; continue;
  case 0x800428f4:
    t4 = m.read(((sp) + 80) >>> 0, 4) | 0;
    v0 = v0 << 1;
    v0 = (v0 + t4) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xffff, 2);
  case 0x80042904:
    v1 = (s2 + 1) | 0;
    v0 = v1 & 65535;
    v0 = v0 << 1;
    t5 = m.read(((sp) + 80) >>> 0, 4) | 0;
    s2 = (v1 + 1) | 0;
    v0 = (v0 + t5) | 0;
    m.write(((v0) + 0) >>> 0, s3 & 0xffff, 2); pc = 0x8004280c; continue;
  case 0x80042924:
    a0 = (0 + 2) | 0;
    a1 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cae0, a0, a1, a2, a3);
  case 0x80042930:
    t4 = fp & 65535;
    t5 = 0x88880000 | 0;
    t5 = t5 | 34953;
    [hi, lo] = mult(t4, t5, false);
    m.write(((sp) + 92) >>> 0, t4 >>> 0, 4);
    t4 = 0 | 65535;
    t5 = m.read(((sp) + 56) >>> 0, 1);
    fp = 0 | 0;
    m.write(((sp) + 58) >>> 0, t4 & 0xffff, 2);
    t4 = (t5 >>> 0) < 2 ? 1 : 0;
    m.write(((sp) + 84) >>> 0, t5 >>> 0, 4);
    m.write(((sp) + 88) >>> 0, t4 >>> 0, 4);
    t5 = hi;
    v0 = (t5 >>> 3) | 0;
    v0 = v0 & 65535;
    m.write(((sp) + 96) >>> 0, v0 >>> 0, 4);
  case 0x80042970:
    v0 = m.read(((sp) + 58) >>> 0, 2);
    v1 = fp & 65535;
    { const c = (v1 | 0) === (v0 | 0); a0 = (0 + 100) | 0; if (c) { pc = 0x80042b00; continue; } }
  case 0x80042980:
    m.write(((sp) + 58) >>> 0, fp & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80042988:
    t4 = m.read(((sp) + 84) >>> 0, 4) | 0;
    { const c = (t4 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x800429a8; continue; } }
  case 0x80042998:
    { const c = (t4 | 0) === (v0 | 0); a0 = (0 + 112) | 0; if (c) { pc = 0x800429bc; continue; } }
  case 0x800429a0:
    a1 = (0 + 15) | 0; pc = 0x800429cc; continue;
  case 0x800429a8:
    a0 = (0 + 112) | 0;
    a1 = (0 + 15) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 8116) | 0; pc = 0x800429d4; continue;
  case 0x800429bc:
    a1 = (0 + 15) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 8132) | 0; pc = 0x800429d4; continue;
  case 0x800429cc:
    a2 = 0x80010000 | 0;
    a2 = (a2 + 8144) | 0;
  case 0x800429d4:
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800429dc:
    a0 = (0 + 27) | 0;
    a1 = (0 + 41) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -27860) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800429f4:
    a0 = (0 + 244) | 0;
    a1 = (0 + 41) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -27852) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80042a0c:
    v1 = fp & 65535;
    v0 = v1 << 4;
    v0 = (v0 - v1) | 0;
    v0 = v0 << 2;
    t5 = m.read(((sp) + 80) >>> 0, 4) | 0;
    s5 = 0 | 0;
    s4 = (t5 + v0) | 0;
  case 0x80042a28:
    s2 = 0 | 0;
    v1 = s5 & 65535;
    v0 = v1 << 3;
    v0 = (v0 + v1) | 0;
    s0 = v0 << 1;
    s4 = (s4 + 2) | 0;
  case 0x80042a40:
    s3 = m.read(((s4) + 0) >>> 0, 2);
    t4 = 0 | 33167;
    a2 = s3 & 65535;
    { const c = (a2 | 0) === (t4 | 0); s4 = (s4 + 2) | 0; if (c) { pc = 0x80042a80; continue; } }
  case 0x80042a54:
    v0 = 0 | 33175;
    { const c = (a2 | 0) === (v0 | 0); v0 = s2 & 65535; if (c) { pc = 0x80042a80; continue; } }
  case 0x80042a60:
    a0 = v0 << 3;
    a0 = (a0 + v0) | 0;
    a0 = a0 << 1;
    a0 = (a0 + 25) | 0;
    a1 = (s0 + 82) | 0; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x80042a78:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80042a80:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 15 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s4 = (s4 + 2) | 0; if (c) { pc = 0x80042a40; continue; } }
  case 0x80042a94:
    s5 = (s5 + 1) | 0;
    v0 = s5 & 65535;
    v0 = (v0 >>> 0) < 6 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s4 = (s4 + -2) | 0; if (c) { pc = 0x80042a28; continue; } }
  case 0x80042aa8:
    t5 = m.read(((sp) + 88) >>> 0, 4) | 0;
    { const c = (t5 | 0) === 0; s0 = fp & 65535; if (c) { pc = 0x80042afc; continue; } }
  case 0x80042ab8:
    { const c = (s0 | 0) === 0; a0 = (0 + 144) | 0; if (c) { pc = 0x80042ad4; continue; } }
  case 0x80042ac0:
    a1 = (0 + 64) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -27844) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80042ad4:
    t4 = m.read(((sp) + 96) >>> 0, 4) | 0;
    v0 = (s0 + 6) | 0;
    v0 = (v0 | 0) < (t4 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = (0 + 144) | 0; if (c) { pc = 0x80042afc; continue; } }
  case 0x80042ae8:
    a1 = (0 + 188) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -27840) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80042afc:
    a0 = (0 + 100) | 0;
  case 0x80042b00:
    a1 = (0 + 41) | 0;
    a2 = (0 + 126) | 0;
    a3 = (0 + 20) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80042b14:
    a0 = (0 + 106) | 0;
    a1 = (0 + 41) | 0;
    a2 = (sp + 40) | 0;
    a3 = (0 + 18) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80042b28:
    v1 = m.read(((sp) + 64) >>> 0, 1);
    v0 = (0 + 6) | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = (0 + 11) | 0; if (c) { pc = 0x80042b5c; continue; } }
  case 0x80042b38:
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a0 = v1 << 3;
    a0 = (a0 + v1) | 0;
    a0 = a0 << 1;
    a0 = (a0 + 102) | 0;
    a1 = (0 + 57) | 0;
    a2 = (0 + 21) | 0;
    a3 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80042b5c:
    v0 = fp & 65535;
    v1 = v0 << 4;
    v1 = (v1 - v0) | 0;
    v1 = v1 << 2;
    v0 = (0 + 2) | 0;
    t5 = m.read(((sp) + 80) >>> 0, 4) | 0;
    t4 = m.read(((sp) + 84) >>> 0, 4) | 0;
    { const c = (t4 | 0) === (v0 | 0); s4 = (t5 + v1) | 0; if (c) { pc = 0x80042ca0; continue; } }
  case 0x80042b84:
    s5 = 0 | 0;
    t0 = (0 + 4) | 0;
  case 0x80042b8c:
    s2 = 0 | 0;
    v0 = s5 & 65535;
    v1 = v0 << 3;
    v1 = (v1 + v0) | 0;
    v1 = v1 << 1;
    m.write(((sp) + 100) >>> 0, v1 >>> 0, 4);
    v0 = (v1 + 82) | 0;
    s6 = v0 & 65535;
  case 0x80042bac:
    s3 = m.read(((s4) + 0) >>> 0, 2);
    v0 = 0 | 65519;
    v0 = (v0 >>> 0) < (s3 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; s4 = (s4 + 2) | 0; if (c) { pc = 0x80042c78; continue; } }
  case 0x80042bc0:
    v0 = s2 & 65535;
    s0 = v0 << 3;
    s0 = (s0 + v0) | 0;
    s0 = s0 << 1;
    s1 = (s0 + 23) | 0;
    s0 = (s0 + 24) | 0;
    s0 = s0 & 65535;
    a0 = s0 | 0;
    a1 = s6 | 0;
    a2 = (0 + 17) | 0;
    a3 = (0 + 16) | 0;
    v0 = (0 + 128) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 104) >>> 0, t0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80042c0c:
    a0 = s0 | 0;
    a1 = s6 | 0;
    a2 = (0 + 18) | 0;
    a3 = (0 + 17) | 0;
    t0 = m.read(((sp) + 104) >>> 0, 4) | 0;
    v0 = (0 + 64) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, t0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80042c3c:
    a0 = s1 & 65535;
    a2 = (0 + 19) | 0;
    a3 = (0 + 18) | 0;
    t5 = m.read(((sp) + 100) >>> 0, 4) | 0;
    t0 = m.read(((sp) + 104) >>> 0, 4) | 0;
    v0 = (0 + 255) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    a1 = (t5 + 81) | 0;
    a1 = a1 & 65535;
    m.write(((sp) + 32) >>> 0, t0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80042c74:
    t0 = m.read(((sp) + 104) >>> 0, 4) | 0;
  case 0x80042c78:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 65535;
    v0 = (v0 >>> 0) < 15 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s4 = (s4 + 2) | 0; if (c) { pc = 0x80042bac; continue; } }
  case 0x80042c8c:
    s5 = (s5 + 1) | 0;
    v0 = s5 & 65535;
    v0 = (v0 >>> 0) < 6 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80042b8c; continue; } }
  case 0x80042ca0:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80042ca8:
    v0 = 0x801f0000 | 0;
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    t3 = v0 & 4096;
    t2 = v0 & 16384;
    t1 = v0 & 32768;
    t0 = v0 & 8192;
    a3 = v0 & 20480;
  case 0x80042cc8:
    a1 = s7 | 0;
    v1 = m.read(((sp) + 64) >>> 0, 1);
    v0 = (0 + 6) | 0;
    { const c = (v1 | 0) === (v0 | 0); a2 = fp | 0; if (c) { pc = 0x80042df8; continue; } }
  case 0x80042cdc:
    { const c = (t3 | 0) === 0; v0 = s7 & 65535; if (c) { pc = 0x80042d18; continue; } }
  case 0x80042ce4:
    v0 = (v0 >>> 0) < 15 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = fp & 65535; if (c) { pc = 0x80042d18; continue; } }
  case 0x80042cf0:
    { const c = (v1 | 0) === 0; s7 = (s7 + -15) | 0; if (c) { pc = 0x80042d18; continue; } }
  case 0x80042cf8:
    a0 = s7 & 65535;
    v1 = (v1 + 1) | 0;
    v0 = v1 << 4;
    v0 = (v0 - v1) | 0;
    a0 = (a0 | 0) < (v0 | 0) ? 1 : 0;
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x80042d18; continue; } }
  case 0x80042d14:
    fp = (fp + -1) | 0;
  case 0x80042d18:
    { const c = (t2 | 0) === 0; v0 = s7 & 65535; if (c) { pc = 0x80042d6c; continue; } }
  case 0x80042d20:
    t4 = m.read(((sp) + 92) >>> 0, 4) | 0;
    v1 = (t4 + -15) | 0;
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; v1 = fp & 65535; if (c) { pc = 0x80042d6c; continue; } }
  case 0x80042d38:
    t5 = m.read(((sp) + 96) >>> 0, 4) | 0;
    v0 = (v1 + 6) | 0;
    v0 = (v0 | 0) < (t5 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; s7 = (s7 + 15) | 0; if (c) { pc = 0x80042d6c; continue; } }
  case 0x80042d4c:
    a0 = s7 & 65535;
    v1 = (v1 + 5) | 0;
    v0 = v1 << 4;
    v0 = (v0 - v1) | 0;
    a0 = (a0 | 0) < (v0 | 0) ? 1 : 0;
    { const c = (a0 | 0) !== 0;  if (c) { pc = 0x80042d6c; continue; } }
  case 0x80042d68:
    fp = (fp + 1) | 0;
  case 0x80042d6c:
    { const c = (t1 | 0) === 0; v0 = s7 & 65535; if (c) { pc = 0x80042da4; continue; } }
  case 0x80042d74:
    { const c = (v0 | 0) === 0; v1 = fp & 65535; if (c) { pc = 0x80042da4; continue; } }
  case 0x80042d7c:
    { const c = (v1 | 0) === 0; s7 = (s7 + -1) | 0; if (c) { pc = 0x80042da4; continue; } }
  case 0x80042d84:
    a0 = s7 & 65535;
    v1 = (v1 + 1) | 0;
    v0 = v1 << 4;
    v0 = (v0 - v1) | 0;
    a0 = (a0 | 0) < (v0 | 0) ? 1 : 0;
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x80042da4; continue; } }
  case 0x80042da0:
    fp = (fp + -1) | 0;
  case 0x80042da4:
    { const c = (t0 | 0) === 0; v0 = s7 & 65535; if (c) { pc = 0x80042df8; continue; } }
  case 0x80042dac:
    t4 = m.read(((sp) + 92) >>> 0, 4) | 0;
    v1 = (t4 + -1) | 0;
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; v1 = fp & 65535; if (c) { pc = 0x80042df8; continue; } }
  case 0x80042dc4:
    t5 = m.read(((sp) + 96) >>> 0, 4) | 0;
    v0 = (v1 + 6) | 0;
    v0 = (v0 | 0) < (t5 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; s7 = (s7 + 1) | 0; if (c) { pc = 0x80042df8; continue; } }
  case 0x80042dd8:
    a0 = s7 & 65535;
    v1 = (v1 + 5) | 0;
    v0 = v1 << 4;
    v0 = (v0 - v1) | 0;
    a0 = (a0 | 0) < (v0 | 0) ? 1 : 0;
    { const c = (a0 | 0) !== 0; v0 = s7 & 65535; if (c) { pc = 0x80042dfc; continue; } }
  case 0x80042df4:
    fp = (fp + 1) | 0;
  case 0x80042df8:
    v0 = s7 & 65535;
  case 0x80042dfc:
    t4 = m.read(((sp) + 80) >>> 0, 4) | 0;
    v0 = v0 << 2;
    v0 = (t4 + v0) | 0;
    s0 = m.read(((v0) + 2) >>> 0, 2);
    t5 = 0 | 33167;
    v1 = s0 & 65535;
    { const c = (v1 | 0) === (t5 | 0); v0 = 0 | 33175; if (c) { pc = 0x80042e24; continue; } }
  case 0x80042e1c:
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80042e54; continue; } }
  case 0x80042e24:
    v0 = 0 | 33175;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80042cc8; continue; } }
  case 0x80042e30:
    { const c = (a3 | 0) === 0;  if (c) { pc = 0x80042cc8; continue; } }
  case 0x80042e38:
    s7 = a1 | 0;
    fp = a2 | 0;
    v0 = s7 & 65535;
    t4 = m.read(((sp) + 80) >>> 0, 4) | 0;
    v0 = v0 << 2;
    v0 = (t4 + v0) | 0;
    s0 = m.read(((v0) + 2) >>> 0, 2);
  case 0x80042e54:
    v1 = a1 & 65535;
    v0 = s7 & 65535;
    { const c = (v1 | 0) === (v0 | 0); a0 = 0x801f0000 | 0; if (c) { pc = 0x80042e70; continue; } }
  case 0x80042e64:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80042e6c:
    a0 = 0x801f0000 | 0;
  case 0x80042e70:
    v1 = m.read(((a0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 33;
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80042ed4; continue; } }
  case 0x80042e84:
    s1 = m.read(((sp) + 64) >>> 0, 1);
    v0 = (s1 >>> 0) < 6 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = v1 | 16; if (c) { pc = 0x80042ecc; continue; } }
  case 0x80042e98:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80042ea0:
    a0 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x80042ea8:
    t5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    v1 = s1 << 1;
    v1 = (v1 + t5) | 0;
    m.write(((v1) + 0) >>> 0, v0 & 0xffff, 2);
    t4 = m.read(((sp) + 64) >>> 0, 1);
    t4 = (t4 + 1) | 0;
    m.write(((sp) + 64) >>> 0, t4 & 0xff, 1); pc = 0x80042ed0; continue;
  case 0x80042ecc:
    m.write(((a0) + -4288) >>> 0, v0 >>> 0, 4);
  case 0x80042ed0:
    v0 = 0x801f0000 | 0;
  case 0x80042ed4:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 68;
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80042f2c; continue; } }
  case 0x80042ee8:
    v0 = m.read(((sp) + 64) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80042f2c; continue; } }
  case 0x80042ef8:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80042f00:
    t5 = m.read(((sp) + 64) >>> 0, 1);
    a0 = 0 | 33088;
    t5 = (t5 + -1) | 0;
    m.write(((sp) + 64) >>> 0, t5 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x80042f14:
    v1 = m.read(((sp) + 64) >>> 0, 1);
    t4 = m.read(((sp) + 60) >>> 0, 4) | 0;
    v1 = v1 << 1;
    v1 = (v1 + t4) | 0;
    m.write(((v1) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = 0x801f0000 | 0;
  case 0x80042f2c:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16;
    { const c = (v0 | 0) === 0; t5 = (0 + 1) | 0; if (c) { pc = 0x80042f44; continue; } }
  case 0x80042f40:
    m.write(((sp) + 72) >>> 0, t5 & 0xff, 1);
  case 0x80042f44:
    a0 = 0x38e30000 | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -28064) >>> 0, 4) | 0;
    a0 = a0 | 36409;
    v0 = (v1 >>> 31) | 0;
    v1 = (v1 + v0) | 0;
    v1 = v1 >> 1;
    [hi, lo] = mult(v1, a0, false);
    t4 = hi;
    a0 = (t4 >>> 3) | 0;
    v0 = a0 << 3;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 2;
    v1 = (v1 - v0) | 0;
    v0 = 0x80070000 | 0;
    v0 = (v0 + 1756) | 0;
    v1 = (v1 + v0) | 0;
    v0 = (0 + 6) | 0;
    a0 = m.read(((sp) + 64) >>> 0, 1);
    v1 = m.read(((v1) + 0) >>> 0, 1);
    { const c = (a0 | 0) === (v0 | 0); v0 = v1 << 2; if (c) { pc = 0x80043094; continue; } }
  case 0x80042f9c:
    v1 = (v0 + 32) | 0;
    a0 = s7 & 65535;
    t5 = 0x88880000 | 0;
    t5 = t5 | 34953;
    [hi, lo] = mult(a0, t5, false);
    v0 = (v0 + -128) | 0;
    a2 = (0 + 17) | 0;
    a3 = (0 + 16) | 0;
    v1 = v1 & 255;
    v0 = v0 & 255;
    s2 = (0 + 3) | 0;
    m.write(((sp) + 16) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    t4 = hi;
    v1 = (t4 >>> 3) | 0;
    v0 = v1 << 4;
    v0 = (v0 - v1) | 0;
    a0 = (a0 - v0) | 0;
    a0 = a0 & 65535;
    s1 = a0 << 3;
    s1 = (s1 + a0) | 0;
    s1 = s1 << 1;
    s4 = (s1 + 23) | 0;
    v1 = v1 & 65535;
    v0 = fp & 65535;
    v1 = (v1 - v0) | 0;
    s0 = v1 << 3;
    s0 = (s0 + v1) | 0;
    s0 = s0 << 1;
    s3 = (s0 + 81) | 0;
    s1 = (s1 + 24) | 0;
    s1 = s1 & 65535;
    a0 = s1 | 0;
    s0 = (s0 + 82) | 0;
    s0 = s0 & 65535;
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x8004303c:
    a0 = s1 | 0;
    a1 = s0 | 0;
    a2 = (0 + 18) | 0;
    a3 = (0 + 17) | 0;
    v0 = (0 + 64) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80043068:
    a0 = s4 & 65535;
    a1 = s3 & 65535;
    a2 = (0 + 19) | 0;
    a3 = (0 + 18) | 0;
    v0 = (0 + 255) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4); pc = 0x80043124; continue;
  case 0x80043094:
    v1 = (v0 + 32) | 0;
    v0 = (v0 + -128) | 0;
    a0 = (0 + 243) | 0;
    a1 = (0 + 41) | 0;
    a2 = (0 + 54) | 0;
    a3 = (0 + 18) | 0;
    v1 = v1 & 255;
    v0 = v0 & 255;
    s0 = (0 + 3) | 0;
    m.write(((sp) + 16) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x800430d0:
    a0 = (0 + 243) | 0;
    a1 = (0 + 41) | 0;
    a2 = (0 + 55) | 0;
    a3 = (0 + 19) | 0;
    v0 = (0 + 64) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x800430fc:
    a0 = (0 + 242) | 0;
    a1 = (0 + 40) | 0;
    a2 = (0 + 56) | 0;
    a3 = (0 + 20) | 0;
    v0 = (0 + 255) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4);
  case 0x80043124:
     [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x8004312c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80043134:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8004313c:
    t5 = m.read(((sp) + 72) >>> 0, 1);
    v0 = (0 + 1) | 0;
    { const c = (t5 | 0) !== (v0 | 0);  if (c) { pc = 0x80042970; continue; } }
  case 0x8004314c:
    a0 = 0 | 33088; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x80043154:
    t4 = m.read(((sp) + 60) >>> 0, 4) | 0;
    v1 = m.read(((t4) + 0) >>> 0, 2);
    v0 = v0 & 65535;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80043220; continue; } }
  case 0x8004316c:
    a0 = 0 | 33088; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x80043174:
    t5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    v1 = m.read(((t5) + 2) >>> 0, 2);
    v0 = v0 & 65535;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80043220; continue; } }
  case 0x8004318c:
    a0 = 0 | 33088; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x80043194:
    t4 = m.read(((sp) + 60) >>> 0, 4) | 0;
    v1 = m.read(((t4) + 4) >>> 0, 2);
    v0 = v0 & 65535;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80043220; continue; } }
  case 0x800431ac:
    a0 = 0 | 33088; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x800431b4:
    t5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    v1 = m.read(((t5) + 6) >>> 0, 2);
    v0 = v0 & 65535;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80043220; continue; } }
  case 0x800431cc:
    a0 = 0 | 33088; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x800431d4:
    t4 = m.read(((sp) + 60) >>> 0, 4) | 0;
    v1 = m.read(((t4) + 8) >>> 0, 2);
    v0 = v0 & 65535;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80043220; continue; } }
  case 0x800431ec:
    a0 = 0 | 33088; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x800431f4:
    t5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    v1 = m.read(((t5) + 10) >>> 0, 2);
    v0 = v0 & 65535;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80043220; continue; } }
  case 0x8004320c:
    a0 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80043214:
    m.write(((sp) + 64) >>> 0, 0 & 0xff, 1);
    m.write(((sp) + 72) >>> 0, 0 & 0xff, 1); pc = 0x80042970; continue;
  case 0x80043220:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80043228:
    s1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80026220, a0, a1, a2, a3);
  case 0x80043230:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80043238:
    s2 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80043240:
    a0 = (0 + 10) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x80043248:
    t4 = (sp + 40) | 0;
    m.write(((sp) + 60) >>> 0, t4 >>> 0, 4);
    v0 = s1 & 65535;
  case 0x80043254:
    { const c = (v0 | 0) !== 0; a0 = 0 | 33088; if (c) { pc = 0x80043288; continue; } }
  case 0x8004325c:
    v0 = s2 & 65535;
    t5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    v0 = v0 << 1;
    s0 = (v0 + t5) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044dd0, a0, a1, a2, a3);
  case 0x80043270:
    v1 = m.read(((s0) + 0) >>> 0, 2);
    v0 = v0 & 65535;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80043288; continue; } }
  case 0x80043280:
    m.write(((s0) + 0) >>> 0, 0 & 0xffff, 2); pc = 0x8004328c; continue;
  case 0x80043288:
    s1 = (0 + 1) | 0;
  case 0x8004328c:
    s2 = (s2 + -1) | 0;
    v0 = s2 & 65535;
    { const c = (v0 | 0) !== 0; v0 = s1 & 65535; if (c) { pc = 0x80043254; continue; } }
  case 0x8004329c:
    v1 = m.read(((sp) + 56) >>> 0, 1);
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) === (v0 | 0); a0 = 0 | 0; if (c) { pc = 0x800432b0; continue; } }
  case 0x800432ac:
    a0 = (v1 + 1) | 0;
  case 0x800432b0:
    a1 = (sp + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a744, a0, a1, a2, a3);
  case 0x800432b8:
    fp = m.read(((sp) + 144) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 140) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 136) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 132) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 128) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 124) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 120) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 116) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 112) >>> 0, 4) | 0;
    sp = (sp + 152) | 0;
     return [v0, v1];
  default: throw new Error(`x800426b0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80043b90, translated instruction by instruction (212 instructions).
export function* x80043b90(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80043b90;
  for (;;) switch (pc) {
  case 0x80043b90:
    sp = (sp + -32) | 0;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    s1 = a0 & 65535;
    v0 = (0 + 32) | 0;
    m.write(((sp) + 24) >>> 0, 0, 4);
    { const c = (s1 | 0) !== (v0 | 0); m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x80043cac; continue; } }
  case 0x80043bac:
    a0 = (0 + 5) | 0;
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = a1 | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043bc0:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 1) | 0;
    a3 = a2 | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043bd4:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 2) | 0;
    a3 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043be8:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 7) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043bfc:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043c10:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043c24:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043c38:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 6) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043c4c:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043c60:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043c74:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 10) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043c88:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 11) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043c9c:
    s0 = v0 | 0;
    a0 = 0 | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a820, a0, a1, a2, a3);
  case 0x80043cac:
    v0 = (0 + 33) | 0;
    { const c = (s1 | 0) !== (v0 | 0); v0 = (0 + 34) | 0; if (c) { pc = 0x80043dbc; continue; } }
  case 0x80043cb8:
    a0 = (0 + 4) | 0;
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = a1 | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043ccc:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 1) | 0;
    a3 = a2 | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043ce0:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 2) | 0;
    a3 = (0 + 6) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043cf4:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043d08:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 7) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043d1c:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043d30:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = a2 | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043d44:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043d58:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043d6c:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043d80:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 10) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043d94:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 11) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043da8:
    s0 = v0 | 0;
    a0 = 0 | 0;
    a1 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a820, a0, a1, a2, a3);
  case 0x80043db8:
    v0 = (0 + 34) | 0;
  case 0x80043dbc:
    { const c = (s1 | 0) !== (v0 | 0); v0 = s0 & 65535; if (c) { pc = 0x80043ec8; continue; } }
  case 0x80043dc4:
    a0 = (0 + 5) | 0;
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = a1 | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043dd8:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 1) | 0;
    a3 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043dec:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 1) | 0;
    a3 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043e00:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 1) | 0;
    a3 = (0 + 10) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043e14:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 2) | 0;
    a3 = (0 + 11) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043e28:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 3) | 0;
    a3 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043e3c:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043e50:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 6) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043e64:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = a2 | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043e78:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 7) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043e8c:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043ea0:
    a0 = v0 & 65535;
    a1 = 0 | 0;
    a2 = (0 + 4) | 0;
    a3 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x800432ec, a0, a1, a2, a3);
  case 0x80043eb4:
    s0 = v0 | 0;
    a0 = 0 | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a820, a0, a1, a2, a3);
  case 0x80043ec4:
    v0 = s0 & 65535;
  case 0x80043ec8:
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return [v0, v1];
  default: throw new Error(`x80043b90: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8004419c, translated instruction by instruction (112 instructions).
export function* x8004419c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8004419c;
  for (;;) switch (pc) {
  case 0x8004419c:
    sp = (sp + -40) | 0;
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 30) | 0;
    m.write(((sp) + 32) >>> 0, 0, 4);
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037b08, a0, a1, a2, a3);
  case 0x800441b4:
    a0 = (0 + 6) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a7c, a0, a1, a2, a3);
  case 0x800441bc:
    a0 = 0 | 0;
    a1 = (0 + 61) | 0;
    a2 = 0 | 33931; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x800441cc:
    a0 = (0 + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x800441d4:
    a0 = 0 | 0;
    a1 = (0 + 61) | 0;
    a2 = (0 + 10) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x800441ec:
     [v0, v1] = yield* call(ctx, sp, 0x80037b08, a0, a1, a2, a3);
  case 0x800441f4:
    a0 = (0 + 7) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a7c, a0, a1, a2, a3);
  case 0x800441fc:
    a0 = 0 | 0;
    a1 = (0 + 83) | 0;
    a2 = 0 | 33931; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x8004420c:
    a0 = (0 + 40) | 0;
  case 0x80044210:
     [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x80044218:
    a0 = 0 | 0;
    a1 = (0 + 83) | 0;
    a2 = (0 + 10) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80044230:
    v0 = s1 & 65535;
    v0 = (v0 >>> 0) < 4 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = 0 | 0; if (c) { pc = 0x800442ac; continue; } }
  case 0x80044240:
    s1 = (s1 + -3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037b08, a0, a1, a2, a3);
  case 0x80044248:
    a0 = (0 + 6) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a7c, a0, a1, a2, a3);
  case 0x80044250:
    a0 = 0 | 0;
    a1 = (0 + 61) | 0;
    a2 = 0 | 33931; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x80044260:
    s0 = s1 & 65535;
    a0 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x8004426c:
    a0 = 0 | 0;
    a1 = (0 + 61) | 0;
    a2 = (0 + 10) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80044284:
     [v0, v1] = yield* call(ctx, sp, 0x80037b08, a0, a1, a2, a3);
  case 0x8004428c:
    a0 = (0 + 7) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a7c, a0, a1, a2, a3);
  case 0x80044294:
    a0 = 0 | 0;
    a1 = (0 + 83) | 0;
    a2 = 0 | 33931; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x800442a4:
    a0 = s0 | 0; pc = 0x80044210; continue;
  case 0x800442ac:
    s0 = (s0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037b08, a0, a1, a2, a3);
  case 0x800442b4:
    a0 = (0 + 6) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a7c, a0, a1, a2, a3);
  case 0x800442bc:
    a0 = 0 | 0;
    a1 = (0 + 61) | 0;
    a2 = 0 | 33931; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x800442cc:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x800442d4:
    a0 = 0 | 0;
    a1 = (0 + 61) | 0;
    a2 = (0 + 10) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x800442ec:
     [v0, v1] = yield* call(ctx, sp, 0x80037b08, a0, a1, a2, a3);
  case 0x800442f4:
    a0 = (0 + 7) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a7c, a0, a1, a2, a3);
  case 0x800442fc:
    a0 = 0 | 0;
    a1 = (0 + 83) | 0;
    a2 = 0 | 33931; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x8004430c:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x80044314:
    a0 = 0 | 0;
    a1 = (0 + 83) | 0;
    a2 = (0 + 10) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8004432c:
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x800442ac; continue; } }
  case 0x8004433c:
     [v0, v1] = yield* call(ctx, sp, 0x80037b08, a0, a1, a2, a3);
  case 0x80044344:
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return [v0, v1];
  default: throw new Error(`x8004419c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003a820, translated instruction by instruction (31 instructions).
export function x8003a820(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003a820;
  for (;;) switch (pc) {
  case 0x8003a820:
    a0 = a0 & 65535;
    v0 = 0x80070000 | 0;
    v0 = (v0 + -20432) | 0;
    a0 = a0 << 2;
    a0 = (a0 + v0) | 0;
    a1 = a1 & 65535;
    a1 = a1 << 2;
    a1 = (a1 + v0) | 0;
    a0 = m.read(((a0) + 0) >>> 0, 4) | 0;
    a1 = m.read(((a1) + 0) >>> 0, 4) | 0;
  case 0x8003a848:
    v1 = m.read(((a0) + 0) >>> 0, 1);
    v0 = v1 & 255;
    { const c = (v0 | 0) === 0; v0 = (v0 >>> 0) < 128 ? 1 : 0; if (c) { pc = 0x8003a894; continue; } }
  case 0x8003a85c:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8003a884; continue; } }
  case 0x8003a864:
    a0 = (a0 + 1) | 0;
    m.write(((a1) + 0) >>> 0, v1 & 0xff, 1);
    a1 = (a1 + 1) | 0;
    v0 = m.read(((a0) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    m.write(((a1) + 0) >>> 0, v0 & 0xff, 1);
    a1 = (a1 + 1) | 0; pc = 0x8003a848; continue;
  case 0x8003a884:
    m.write(((a1) + 0) >>> 0, v1 & 0xff, 1);
    a0 = (a0 + 1) | 0;
    a1 = (a1 + 1) | 0; pc = 0x8003a848; continue;
  case 0x8003a894:
    m.write(((a1) + 0) >>> 0, 0 & 0xff, 1); return [v0, v1];
  default: throw new Error(`x8003a820: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003a89c, translated instruction by instruction (13 instructions).
export function x8003a89c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003a89c;
  for (;;) switch (pc) {
  case 0x8003a89c:
    v1 = 0 | 0;
  case 0x8003a8a0:
    v0 = m.read(((a0) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003a8c8; continue; } }
  case 0x8003a8b0:
    v0 = (v0 >>> 0) < 128 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8003a8a0; continue; } }
  case 0x8003a8bc:
    a0 = (a0 + 2) | 0;
    v1 = (v1 + 1) | 0; pc = 0x8003a8a0; continue;
  case 0x8003a8c8:
    v0 = v1 & 255; return [v0, v1];
  default: throw new Error(`x8003a89c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800432ec, translated instruction by instruction (553 instructions).
export function* x800432ec(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800432ec;
  for (;;) switch (pc) {
  case 0x800432ec:
    sp = (sp + -48) | 0;
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    s3 = a0 | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = a1 | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = a2 | 0;
    v1 = a3 & 65535;
    v0 = (v1 >>> 0) < 12 ? 1 : 0;
    m.write(((sp) + 40) >>> 0, 0, 4);
    m.write(((sp) + 36) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    { const c = (v0 | 0) === 0; m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x80043b64; continue; } }
  case 0x80043324:
    v0 = 0x80010000 | 0;
    v0 = (v0 + 10668) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x80043344:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8156) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043358:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800433c8; continue; } }
  case 0x80043364:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8168) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043370:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800433c8; continue; } }
  case 0x80043378:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8180) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043384:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800433c8; continue; } }
  case 0x8004338c:
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27836) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043398:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800433c8; continue; } }
  case 0x800433a0:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8196) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800433ac:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800433c8; continue; } }
  case 0x800433b4:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8212) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800433c0:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x800433c8:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8224) | 0; pc = 0x80043b5c; continue;
  case 0x800433d8:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27828) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800433ec:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043434; continue; } }
  case 0x800433f8:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8236) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043404:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043434; continue; } }
  case 0x8004340c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8248) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043418:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043434; continue; } }
  case 0x80043420:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8260) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004342c:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x80043434:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8276) | 0; pc = 0x80043b5c; continue;
  case 0x80043444:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8288) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043458:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043518; continue; } }
  case 0x80043464:
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27820) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043470:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043518; continue; } }
  case 0x80043478:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8300) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043484:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043518; continue; } }
  case 0x8004348c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8316) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043498:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043518; continue; } }
  case 0x800434a0:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8332) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800434ac:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043518; continue; } }
  case 0x800434b4:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8344) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800434c0:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043518; continue; } }
  case 0x800434c8:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8356) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800434d4:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043518; continue; } }
  case 0x800434dc:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8368) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800434e8:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043518; continue; } }
  case 0x800434f0:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8380) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800434fc:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043518; continue; } }
  case 0x80043504:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8392) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043510:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x80043518:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8404) | 0; pc = 0x80043b5c; continue;
  case 0x80043528:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8416) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004353c:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043598; continue; } }
  case 0x80043548:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8428) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043554:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043598; continue; } }
  case 0x8004355c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8444) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043568:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043598; continue; } }
  case 0x80043570:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8460) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004357c:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043598; continue; } }
  case 0x80043584:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8476) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043590:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x80043598:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8488) | 0; pc = 0x80043b5c; continue;
  case 0x800435a8:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27812) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800435bc:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x800435c8:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8500) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800435d4:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x800435dc:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8512) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800435e8:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x800435f0:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8528) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800435fc:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x80043604:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8540) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043610:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x80043618:
    v0 = 0x80010000 | 0;
    s5 = (v0 + 8556) | 0;
    a1 = s5 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043628:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x80043630:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8568) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004363c:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x80043644:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8584) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043650:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x80043658:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8600) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043664:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x8004366c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8616) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043678:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x80043680:
    a1 = s5 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043688:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800436a4; continue; } }
  case 0x80043690:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8632) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004369c:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x800436a4:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8644) | 0; pc = 0x80043b5c; continue;
  case 0x800436b4:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27804) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800436c8:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043760; continue; } }
  case 0x800436d4:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8656) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800436e0:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043760; continue; } }
  case 0x800436e8:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8672) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800436f4:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043760; continue; } }
  case 0x800436fc:
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27796) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043708:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043760; continue; } }
  case 0x80043710:
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27788) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004371c:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043760; continue; } }
  case 0x80043724:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8684) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043730:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043760; continue; } }
  case 0x80043738:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8700) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043744:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043760; continue; } }
  case 0x8004374c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8716) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043758:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x80043760:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8728) | 0; pc = 0x80043b5c; continue;
  case 0x80043770:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27780) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043784:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x8004381c; continue; } }
  case 0x80043790:
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27772) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004379c:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x8004381c; continue; } }
  case 0x800437a4:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8740) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800437b0:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x8004381c; continue; } }
  case 0x800437b8:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8752) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800437c4:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x8004381c; continue; } }
  case 0x800437cc:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8768) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800437d8:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x8004381c; continue; } }
  case 0x800437e0:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8780) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800437ec:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x8004381c; continue; } }
  case 0x800437f4:
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27764) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043800:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x8004381c; continue; } }
  case 0x80043808:
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27756) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043814:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x8004381c:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8792) | 0; pc = 0x80043b5c; continue;
  case 0x8004382c:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27748) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043840:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800438d8; continue; } }
  case 0x8004384c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8804) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043858:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800438d8; continue; } }
  case 0x80043860:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8816) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004386c:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800438d8; continue; } }
  case 0x80043874:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8832) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043880:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800438d8; continue; } }
  case 0x80043888:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8848) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043894:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800438d8; continue; } }
  case 0x8004389c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8860) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800438a8:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800438d8; continue; } }
  case 0x800438b0:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8876) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800438bc:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800438d8; continue; } }
  case 0x800438c4:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8892) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800438d0:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x800438d8:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8848) | 0; pc = 0x80043b5c; continue;
  case 0x800438e8:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27740) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800438fc:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043958; continue; } }
  case 0x80043908:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8908) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043914:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043958; continue; } }
  case 0x8004391c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8920) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043928:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043958; continue; } }
  case 0x80043930:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8936) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004393c:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043958; continue; } }
  case 0x80043944:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8948) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043950:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x80043958:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8964) | 0; pc = 0x80043b5c; continue;
  case 0x80043968:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27732) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x8004397c:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800439d8; continue; } }
  case 0x80043988:
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27724) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043994:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800439d8; continue; } }
  case 0x8004399c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8976) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800439a8:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800439d8; continue; } }
  case 0x800439b0:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 8988) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800439bc:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x800439d8; continue; } }
  case 0x800439c4:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9004) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800439d0:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x800439d8:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9020) | 0; pc = 0x80043b5c; continue;
  case 0x800439e8:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27716) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x800439fc:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043a58; continue; } }
  case 0x80043a08:
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27708) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043a14:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043a58; continue; } }
  case 0x80043a1c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9036) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043a28:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043a58; continue; } }
  case 0x80043a30:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9048) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043a3c:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043a58; continue; } }
  case 0x80043a44:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9064) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043a50:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x80043a58:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9080) | 0; pc = 0x80043b5c; continue;
  case 0x80043a68:
    s0 = s2 & 65535;
    a0 = s0 | 0;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9092) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043a7c:
    s1 = (0 + 1) | 0;
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043a88:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9104) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043a94:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043a9c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9116) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043aa8:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043ab0:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9128) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043abc:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043ac4:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9144) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043ad0:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043ad8:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9156) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043ae4:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043aec:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9168) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043af8:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043b00:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9180) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043b0c:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043b14:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9192) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043b20:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043b28:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9208) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043b34:
    { const c = (v0 | 0) === (s1 | 0); a0 = s0 | 0; if (c) { pc = 0x80043b50; continue; } }
  case 0x80043b3c:
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9224) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a8d0, a0, a1, a2, a3);
  case 0x80043b48:
    { const c = (v0 | 0) !== (s1 | 0); v0 = s3 & 65535; if (c) { pc = 0x80043b68; continue; } }
  case 0x80043b50:
    a0 = s2 & 65535;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 9240) | 0;
  case 0x80043b5c:
    s3 = s4 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a744, a0, a1, a2, a3);
  case 0x80043b64:
    v0 = s3 & 65535;
  case 0x80043b68:
    s5 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
     return [v0, v1];
  default: throw new Error(`x800432ec: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044dd0, translated instruction by instruction (6 instructions).
export function x80044dd0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044dd0;
  for (;;) switch (pc) {
  case 0x80044dd0:
    v0 = a0 & 65535;
    v0 = (v0 >>> 8) | 0;
    a0 = a0 << 8;
    v0 = v0 | a0;
    v0 = v0 & 65535; return [v0, v1];
  default: throw new Error(`x80044dd0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003a8d0, translated instruction by instruction (15 instructions).
export function* x8003a8d0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003a8d0;
  for (;;) switch (pc) {
  case 0x8003a8d0:
    sp = (sp + -24) | 0;
    v1 = a0 & 65535;
    v0 = 0x80070000 | 0;
    v0 = (v0 + -20432) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    a0 = a1 | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    a1 = m.read(((v1) + 0) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x80044d88, a0, a1, a2, a3);
  case 0x8003a8fc:
    sp = (sp + 24) | 0;
     return [v0, v1];
  default: throw new Error(`x8003a8d0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044d88, translated instruction by instruction (18 instructions).
export function x80044d88(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044d88;
  for (;;) switch (pc) {
  case 0x80044d88:
    v0 = m.read(((a0) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    v1 = m.read(((a1) + 0) >>> 0, 1);
    v0 = v0 & 255;
    { const c = (v0 | 0) !== 0; a1 = (a1 + 1) | 0; if (c) { pc = 0x80044db0; continue; } }
  case 0x80044da0:
    { const c = (v1 | 0) !== 0; v0 = (0 + 1) | 0; if (c) { pc = 0x80044dc4; continue; } }
  case 0x80044da8:
     pc = 0x80044dc8; continue;
  case 0x80044db0:
    v1 = v1 & 255;
    { const c = (v1 | 0) === 0;  if (c) { pc = 0x80044dc4; continue; } }
  case 0x80044dbc:
    { const c = (v0 | 0) === (v1 | 0);  if (c) { pc = 0x80044d88; continue; } }
  case 0x80044dc4:
    v0 = 0 | 0;
  case 0x80044dc8:
     return [v0, v1];
  default: throw new Error(`x80044d88: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

export const SPECIAL_TRANSLATED = {0x80044384: specialSwitch, 0x80025600: x80025600, 0x80037a7c: x80037a7c, 0x800390ac: x800390ac, 0x800426b0: x800426b0, 0x80043b90: x80043b90, 0x8004419c: x8004419c, 0x8003a820: x8003a820, 0x8003a89c: x8003a89c, 0x800432ec: x800432ec, 0x80044dd0: x80044dd0, 0x8003a8d0: x8003a8d0, 0x80044d88: x80044d88 };
