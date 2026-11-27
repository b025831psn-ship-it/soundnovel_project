// The screen-overlay step 0x8003186c (run by the VSync callback) for the cases src/vsync.js
// overlayTick() does not port by hand, translated instruction by instruction by
// tools/translate/gen-overlay.py. It never waits for a frame.
import { call, mult, div } from "../menu/calls.js";

// 0x8003186c, translated instruction by instruction (365 instructions).
export function* x8003186c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003186c;
  for (;;) switch (pc) {
  case 0x8003186c:
    v0 = m.read(((0x8007913c) + 910) >>> 0, 1);
    sp = (sp + -32) | 0;
    m.write(((sp) + 28) >>> 0, 0, 4);
    { const c = (v0 | 0) === 0; m.write(((sp) + 24) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x80031e0c; continue; } }
  case 0x80031880:
    v1 = (v0 + -1) | 0;
    v0 = (v1 >>> 0) < 34 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = 0x80010000 | 0; if (c) { pc = 0x80031e0c; continue; } }
  case 0x80031890:
    v0 = (v0 + 6976) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x800318ac:
    a3 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    { const c = (a3 | 0) === 0;  if (c) { pc = 0x80031944; continue; } }
  case 0x800318bc:
    a1 = m.read(((0x8007913c) + 1092) >>> 0, 4) | 0;
    { const c = (a1 | 0) >= 0; v1 = a1 | 0; if (c) { pc = 0x800318d0; continue; } }
  case 0x800318cc:
    v1 = (a1 + 255) | 0;
  case 0x800318d0:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27260) >>> 0, 4) | 0;
    v0 = v1 >> 8;
    m.write(((sp) + 16) >>> 0, v0 & 0xffff, 2);
    { const c = (a0 | 0) >= 0; v1 = a0 | 0; if (c) { pc = 0x800318ec; continue; } }
  case 0x800318e8:
    v1 = (a0 + 255) | 0;
  case 0x800318ec:
    a2 = v1 >> 8;
    m.write(((sp) + 18) >>> 0, a2 & 0xffff, 2);
    v1 = v0 << 1;
    v0 = (0 + 320) | 0;
    v0 = (v0 - v1) | 0;
    m.write(((sp) + 20) >>> 0, v0 & 0xffff, 2);
    v1 = a2 << 1;
    v0 = (0 + 240) | 0;
    v0 = (v0 - v1) | 0;
    m.write(((sp) + 22) >>> 0, v0 & 0xffff, 2);
    v0 = (a3 + -1) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
    v0 = m.read(((0x8007913c) + 1212) >>> 0, 4) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27140) >>> 0, 4) | 0;
    v0 = (a1 + v0) | 0;
    v1 = (a0 + v1) | 0;
    m.write(((0x8007913c) + 1092) >>> 0, v0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, v1 >>> 0, 4);
     pc = 0x800319a0; continue;
  case 0x80031944:
    v0 = m.read(((0x8007913c) + 1140) >>> 0, 4) | 0;
    { const c = (v0 | 0) >= 0; v1 = v0 | 0; if (c) { pc = 0x80031958; continue; } }
  case 0x80031954:
    v1 = (v0 + 255) | 0;
  case 0x80031958:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27212) >>> 0, 4) | 0;
    a1 = v1 >> 8;
    m.write(((sp) + 16) >>> 0, a1 & 0xffff, 2);
    { const c = (a0 | 0) >= 0; v1 = a0 | 0; if (c) { pc = 0x80031974; continue; } }
  case 0x80031970:
    v1 = (a0 + 255) | 0;
  case 0x80031974:
    a2 = v1 >> 8;
    m.write(((sp) + 18) >>> 0, a2 & 0xffff, 2);
    v1 = a1 << 1;
    v0 = (0 + 320) | 0;
    v0 = (v0 - v1) | 0;
    m.write(((sp) + 20) >>> 0, v0 & 0xffff, 2);
    v1 = a2 << 1;
    v0 = (0 + 240) | 0;
    v0 = (v0 - v1) | 0;
    m.write(((sp) + 22) >>> 0, v0 & 0xffff, 2);
    m.write(((0x8007913c) + 910) >>> 0, 0 & 0xff, 1);
  case 0x800319a0:
    a0 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x8004d4d8, a0, a1, a2, a3);
  case 0x800319a8:
     [v0, v1] = yield* call(ctx, sp, 0x8004d458, a0, a1, a2, a3);
  case 0x800319b0:
     pc = 0x80031e0c; continue;
  case 0x800319b8:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    { const c = (v0 | 0) < 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80031de4; continue; } }
  case 0x800319c8:
    v0 = m.read(((0x8007913c) + 1092) >>> 0, 4) | 0;
    { const c = (v0 | 0) !== 0; v0 = (v0 + -1) | 0; if (c) { pc = 0x80031a60; continue; } }
  case 0x800319d8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27260) >>> 0, 4) | 0;
    { const c = (v0 | 0) < 0; a0 = 0 | 0; if (c) { pc = 0x80031b74; continue; } }
  case 0x800319ec:
    a1 = a0 | 0;
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x800319fc:
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27260) >>> 0, 4) | 0;
    { const c = (a2 | 0) >= 0; a0 = 0 | 32768; if (c) { pc = 0x80031a14; continue; } }
  case 0x80031a10:
    a2 = (a2 + 255) | 0;
  case 0x80031a14:
    a1 = 0 | 0;
    a2 = a2 >> 8;
    a2 = a2 & 65535;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031a28:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27260) >>> 0, 4) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27140) >>> 0, 4) | 0;
    v0 = (v0 - v1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, v0 >>> 0, 4);
    { const c = (v0 | 0) >= 0;  if (c) { pc = 0x80031b74; continue; } }
  case 0x80031a50:
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, 0 >>> 0, 4);
     pc = 0x80031b74; continue;
  case 0x80031a60:
    m.write(((0x8007913c) + 1092) >>> 0, v0 >>> 0, 4);
     pc = 0x80031e0c; continue;
  case 0x80031a6c:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    { const c = (v0 | 0) < 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80031de4; continue; } }
  case 0x80031a7c:
     pc = 0x800319d8; continue;
  case 0x80031a84:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    { const c = (v0 | 0) < 0; a2 = (0 + 256) | 0; if (c) { pc = 0x80031e08; continue; } }
  case 0x80031a94:
    a0 = 0 | 0;
    a1 = a0 | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031aa4:
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27260) >>> 0, 4) | 0;
    { const c = (a2 | 0) >= 0; a0 = (0 + 31) | 0; if (c) { pc = 0x80031abc; continue; } }
  case 0x80031ab8:
    a2 = (a2 + 255) | 0;
  case 0x80031abc:
    a1 = 0 | 0;
    a2 = a2 >> 8;
    a2 = a2 & 65535;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031ad0:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27140) >>> 0, 4) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27260) >>> 0, 4) | 0;
    v0 = (v0 + v1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, v0 >>> 0, 4);
     pc = 0x80031b7c; continue;
  case 0x80031af8:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    { const c = (v0 | 0) < 0; s0 = 0x10000 | 0; if (c) { pc = 0x80031ba4; continue; } }
  case 0x80031b08:
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27260) >>> 0, 4) | 0;
    v0 = (s0 | 0) < (a2 | 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80031b74; continue; } }
  case 0x80031b20:
    { const c = (a2 | 0) >= 0; a0 = 0 | 32768; if (c) { pc = 0x80031b2c; continue; } }
  case 0x80031b28:
    a2 = (a2 + 255) | 0;
  case 0x80031b2c:
    a1 = 0 | 0;
    a2 = a2 >> 8;
    a2 = a2 & 65535;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031b40:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27260) >>> 0, 4) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27140) >>> 0, 4) | 0;
    v0 = (v0 + v1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, v0 >>> 0, 4);
    v0 = (s0 | 0) < (v0 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80031b74; continue; } }
  case 0x80031b6c:
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, s0 >>> 0, 4);
  case 0x80031b74:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27140) >>> 0, 4) | 0;
  case 0x80031b7c:
    { const c = (v1 | 0) >= 0;  if (c) { pc = 0x80031b8c; continue; } }
  case 0x80031b88:
    v1 = (v1 + 255) | 0;
  case 0x80031b8c:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    v1 = v1 >> 8;
    v0 = (v0 - v1) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
     pc = 0x80031e0c; continue;
  case 0x80031ba4:
    a0 = 0 | 32768;
    a1 = 0 | 0;
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031bb8:
     pc = 0x80031e08; continue;
  case 0x80031bc0:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    { const c = (v0 | 0) === 0; s0 = 0x801f0000 | 0; if (c) { pc = 0x80031ca4; continue; } }
  case 0x80031bd0:
    s0 = (s0 + 26264) | 0;
    a0 = m.read(((s0) + 2) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1092) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27260) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031bec:
    a0 = m.read(((s0) + 4) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1092) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27260) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031c04:
    a0 = m.read(((s0) + 6) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1092) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27260) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031c1c:
    a0 = m.read(((s0) + 8) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1092) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27260) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031c34:
    a0 = m.read(((s0) + 10) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1092) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27260) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031c4c:
    a0 = m.read(((s0) + 12) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1092) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27260) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031c64:
    v0 = m.read(((0x8007913c) + 1092) >>> 0, 4) | 0;
    v1 = m.read(((0x8007913c) + 1212) >>> 0, 4) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27140) >>> 0, 4) | 0;
    v0 = (v0 + v1) | 0;
    m.write(((0x8007913c) + 1092) >>> 0, v0 >>> 0, 4);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27260) >>> 0, 4) | 0;
    v1 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    v0 = (v0 + a0) | 0;
    v1 = (v1 + -1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27260) >>> 0, v0 >>> 0, 4);
    m.write(((0x8007913c) + 800) >>> 0, v1 >>> 0, 4);
     pc = 0x80031e0c; continue;
  case 0x80031ca4:
    s0 = (s0 + 26264) | 0;
    a0 = m.read(((s0) + 2) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1140) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27212) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031cc0:
    a0 = m.read(((s0) + 4) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1140) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27212) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031cd8:
    a0 = m.read(((s0) + 6) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1140) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27212) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031cf0:
    a0 = m.read(((s0) + 8) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1140) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27212) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031d08:
    a0 = m.read(((s0) + 10) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1140) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27212) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031d20:
    a0 = m.read(((s0) + 12) >>> 0, 2);
    a1 = m.read(((0x8007913c) + 1140) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27212) >>> 0, 4) | 0;
     [v0, v1] = yield* call(ctx, sp, 0x8003bca8, a0, a1, a2, a3);
  case 0x80031d38:
     pc = 0x80031e08; continue;
  case 0x80031d40:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    { const c = (v0 | 0) === 0; a0 = 0 | 0; if (c) { pc = 0x80031de0; continue; } }
  case 0x80031d50:
    a1 = a0 | 0;
    a2 = (0 + 256) | 0;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031d60:
    a2 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    v0 = (a2 | 0) < 16 ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = 0 | 32768; if (c) { pc = 0x80031d94; continue; } }
  case 0x80031d74:
    a1 = 0 | 0;
    a2 = a2 << 4;
    a2 = a2 & 65520;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031d88:
    a1 = m.read(((0x8007913c) + 800) >>> 0, 1);
    a0 = (0 + 8) | 0; pc = 0x80031dc0; continue;
  case 0x80031d94:
    a1 = 0 | 0;
    s0 = (0 + 32) | 0;
    a2 = (s0 - a2) | 0;
    a2 = a2 << 4;
    a2 = a2 & 65520;
    a3 = (0 + 21) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003ae5c, a0, a1, a2, a3);
  case 0x80031db0:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 1);
    a0 = (0 + 8) | 0;
    s0 = (s0 - v0) | 0;
    a1 = s0 & 255;
  case 0x80031dc0:
     [v0, v1] = yield* call(ctx, sp, 0x8003ac44, a0, a1, a2, a3);
  case 0x80031dc8:
    v0 = m.read(((0x8007913c) + 800) >>> 0, 4) | 0;
    v0 = (v0 + -1) | 0;
    m.write(((0x8007913c) + 800) >>> 0, v0 >>> 0, 4);
     pc = 0x80031e0c; continue;
  case 0x80031de0:
    v0 = 0x801f0000 | 0;
  case 0x80031de4:
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 16) >>> 0, 2);
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x80031e08; continue; } }
  case 0x80031df8:
    a0 = a0 << 16;
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80031e04:
    m.write(((s0) + 16) >>> 0, 0 & 0xffff, 2);
  case 0x80031e08:
    m.write(((0x8007913c) + 910) >>> 0, 0 & 0xff, 1);
  case 0x80031e0c:
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return [v0, v1];
  default: throw new Error(`x8003186c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

export const OVERLAY_TRANSLATED = {0x8003186c: x8003186c };
