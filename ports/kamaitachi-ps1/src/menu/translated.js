// The in-game menu (0x80018cdc) and the screens it opens: the flow chart (移動, 0x80019c30),
// the options (0x8001866c) and their pages, and the save screen (0x8001824c) with its memory-card
// checks, translated instruction by instruction from the
// original MIPS code by a tool (tools/translate) (one switch case per basic block; registers are locals, memory
// is the PS1 RAM at the original addresses, calls go through call() in calls.js with the
// caller's sp). Generators: each frame the original waits (VSync through 0x80013f34) is a yield.
import { call, mult, div } from "./calls.js";
import { offer, withdraw, box } from "../touch.js";

// 0x80018cdc, translated instruction by instruction (434 instructions).
export function* menu(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80018cdc;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x80018cdc:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28001) >>> 0, 1);
    sp = (sp + -80) | 0;
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    s4 = 0 | 0;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 76) >>> 0, 0, 4);
    m.write(((sp) + 72) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -28023) >>> 0, 0 & 0xff, 1);
    { const c = (v0 | 0) === 0; s3 = (0 + 1) | 0; if (c) { pc = 0x80019370; continue; } }
  case 0x80018d24:
    v1 = (0 + 1) | 0;
    v0 = 0x801f0000 | 0;
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27166) >>> 0, v1 & 0xff, 1);
    v0 = v0 & 16;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80019368; continue; } }
  case 0x80018d44:
    s7 = (0 + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80018d4c:
    s6 = 0x40000000 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037e94, a0, a1, a2, a3);
  case 0x80018d54:
    a0 = (0 + 2) | 0;
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c374, a0, a1, a2, a3);
  case 0x80018d60:
    a1 = (0 + 15) | 0;
    s5 = (0 + 3) | 0;
    v0 = 0x801f0000 | 0;
    a0 = m.read(((v0) + 26282) >>> 0, 2);
    fp = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x80018d78:
    v0 = (0 + 27) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27958) >>> 0, v0 & 0xff, 1);
    s2 = s7 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037d48, a0, a1, a2, a3);
  case 0x80018d8c:
    s1 = s6 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80018d94:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    s0 = s5 | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80018dc8:
    a0 = (0 + 6) | 0;
    a1 = (0 + 39) | 0;
    a2 = (0 + 222) | 0;
    a3 = (0 + 176) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80018df0:
    a0 = (0 + 232) | 0;
    a1 = s2 | 0;
    a2 = (0 + 80) | 0;
    a3 = (0 + 70) | 0;
    v0 = (0 + 233) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 196) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 166) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80018e24:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80019c30, a0, a1, a2, a3);
  case 0x80018e2c:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018e34:
    v0 = 0x801f0000 | 0;
  case 0x80018e38:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; v0 = s4 & 255; if (c) { pc = 0x80018e64; continue; } }
  case 0x80018e4c:
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80018e68; continue; } }
  case 0x80018e54:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018e5c:
    s3 = (0 + 1) | 0;
    s4 = (s4 + -1) | 0;
  case 0x80018e64:
    v0 = 0x801f0000 | 0;
  case 0x80018e68:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; v0 = s4 & 255; if (c) { pc = 0x80018e98; continue; } }
  case 0x80018e7c:
    t0 = (0 + 3) | 0;
    { const c = (v0 | 0) === (t0 | 0); v0 = 0x801f0000 | 0; if (c) { pc = 0x80018e9c; continue; } }
  case 0x80018e88:
    a0 = t0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018e90:
    s3 = (0 + 1) | 0;
    s4 = (s4 + 1) | 0;
  case 0x80018e98:
    v0 = 0x801f0000 | 0;
  case 0x80018e9c:
    v1 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 68;
    { const c = (v0 | 0) !== 0; v0 = v1 & 33; if (c) { pc = 0x800191b0; continue; } }
  case 0x80018eb0:
    { const c = (v0 | 0) === 0; s0 = s4 & 255; if (c) { pc = 0x800191c0; continue; } }
  case 0x80018eb8:
    { const c = (s0 | 0) !== 0;  if (c) { pc = 0x80018fe0; continue; } }
  case 0x80018ec0:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018ec8:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80018ed0:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80018f00:
    a0 = (0 + 6) | 0;
    a1 = (0 + 39) | 0;
    a2 = (0 + 222) | 0;
    a3 = (0 + 176) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80018f28:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80019c30, a0, a1, a2, a3);
  case 0x80018f30:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80019318; continue; } }
  case 0x80018f38:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80019c30, a0, a1, a2, a3);
  case 0x80018f40:
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80018f48:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80018f78:
    a0 = (0 + 6) | 0;
    a1 = (0 + 39) | 0;
    a2 = (0 + 222) | 0;
    a3 = (0 + 176) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80018fa0:
    a0 = (0 + 232) | 0;
    a1 = (0 + 40) | 0;
    a2 = (0 + 80) | 0;
    t0 = (0 + 60) | 0;
    a3 = (t0 + 10) | 0;
    v0 = (0 + 233) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 196) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 166) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80018fd8:
    v0 = 0x801f0000 | 0; pc = 0x80018e38; continue;
  case 0x80018fe0:
    { const c = (s0 | 0) !== (fp | 0);  if (c) { pc = 0x800190a0; continue; } }
  case 0x80018fe8:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018ff0:
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80018ff8:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001866c, a0, a1, a2, a3);
  case 0x80019000:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80019030:
    a0 = (0 + 6) | 0;
    a1 = (0 + 39) | 0;
    a2 = (0 + 222) | 0;
    a3 = (0 + 176) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80019058:
    a0 = (0 + 232) | 0;
    a1 = (0 + 40) | 0;
    a2 = (0 + 80) | 0;
    t0 = (0 + 60) | 0;
    a3 = (t0 + 10) | 0;
    v0 = (0 + 233) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 196) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 166) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80019090:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80019c30, a0, a1, a2, a3);
  case 0x80019098:
    v0 = 0x801f0000 | 0; pc = 0x80018e38; continue;
  case 0x800190a0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27990) >>> 0, 1);
    { const c = (v0 | 0) !== (fp | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x800191a8; continue; } }
  case 0x800190b4:
    { const c = (s0 | 0) !== (v0 | 0);  if (c) { pc = 0x80019198; continue; } }
  case 0x800190bc:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800190c4:
    at = 0x80080000 | 0;
    m.write(((at) + -27166) >>> 0, s0 & 0xff, 1);
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x800190d4:
    at = 0x80080000 | 0;
    m.write(((at) + -28023) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8001824c, a0, a1, a2, a3);
  case 0x800190e4:
    a0 = (0 + 2) | 0;
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c374, a0, a1, a2, a3);
  case 0x800190f0:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80019120:
    a0 = (0 + 6) | 0;
    a1 = (0 + 39) | 0;
    a2 = (0 + 222) | 0;
    a3 = (0 + 176) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80019148:
    a0 = (0 + 232) | 0;
    a1 = (0 + 40) | 0;
    a2 = (0 + 80) | 0;
    t0 = (0 + 60) | 0;
    a3 = (t0 + 10) | 0;
    v0 = (0 + 233) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 196) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 166) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s5 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80019180:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80019c30, a0, a1, a2, a3);
  case 0x80019188:
    at = 0x80080000 | 0;
    m.write(((at) + -27166) >>> 0, fp & 0xff, 1);
    v0 = 0x801f0000 | 0; pc = 0x80018e38; continue;
  case 0x80019198:
    { const c = (s0 | 0) === (s5 | 0);  if (c) { pc = 0x800191b0; continue; } }
  case 0x800191a0:
     pc = 0x800191c0; continue;
  case 0x800191a8:
    { const c = (s0 | 0) !== (v0 | 0);  if (c) { pc = 0x800191c0; continue; } }
  case 0x800191b0:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800191b8:
     pc = 0x80019318; continue;
  case 0x800191c0:
    { const c = (s3 | 0) !== (fp | 0); a0 = (0 + 234) | 0; if (c) { pc = 0x800192f8; continue; } }
  case 0x800191c8:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a1 = (0 + 41) | 0;
    a2 = (0 + 16) | 0;
    t0 = (0 + 4) | 0;
    a3 = t0 << 4;
    a3 = (a3 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x800191e4:
    a0 = (0 + 234) | 0;
    s0 = s4 & 255;
    a1 = s0 << 4;
    a1 = (a1 + s0) | 0;
    a1 = (a1 + 41) | 0;
    a2 = 0 | 33924; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x80019200:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x8001920c; continue; } }
  case 0x80019208:
    a0 = 0 | 0;
  case 0x8001920c:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80019214:
    a0 = (0 + 250) | 0;
    a1 = (0 + 41) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28312) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001922c:
    v0 = s4 & 255;
    { const c = (v0 | 0) !== (fp | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x8001923c; continue; } }
  case 0x80019238:
    a0 = 0 | 0;
  case 0x8001923c:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80019244:
    a0 = (0 + 250) | 0;
    a1 = (0 + 58) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28304) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001925c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27990) >>> 0, 1);
    { const c = (v0 | 0) !== (fp | 0); v1 = s4 & 255; if (c) { pc = 0x800192c4; continue; } }
  case 0x80019270:
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80019280; continue; } }
  case 0x8001927c:
    a0 = 0 | 0;
  case 0x80019280:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80019288:
    a0 = (0 + 250) | 0;
    a1 = (0 + 75) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28300) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800192a0:
    v0 = s4 & 255;
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x800192b0; continue; } }
  case 0x800192ac:
    a0 = 0 | 0;
  case 0x800192b0:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800192b8:
    a0 = (0 + 250) | 0;
    a1 = (0 + 92) | 0; pc = 0x800192e4; continue;
  case 0x800192c4:
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x800192d4; continue; } }
  case 0x800192d0:
    a0 = 0 | 0;
  case 0x800192d4:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800192dc:
    a0 = (0 + 250) | 0;
    a1 = (0 + 75) | 0;
  case 0x800192e4:
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2264) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800192f4:
    s3 = 0 | 0;
  case 0x800192f8:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80019300:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80019308:
    offer(ctx, Array.from({ length: m.read(0x800792aa, 1) === 1 ? 4 : 3 }, (_, i) => box(i, 0xe8, 0x29 + 17 * i, 0x50, 17)), () => s4 & 0xff, ["up", "down"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80019310:
    v0 = 0x801f0000 | 0; pc = 0x80018e38; continue;
  case 0x80019318:
    if (ctx.touch) ctx.touch.menu = prevTouch;
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80019320:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80019328:
    v0 = 0x801f0000 | 0;
    a0 = m.read(((v0) + 26282) >>> 0, 2);
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x80019338:
    v0 = (0 + 5) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27958) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80037e94, a0, a1, a2, a3);
  case 0x8001934c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80019354:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8001935c:
    a0 = 0 | 0;
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c374, a0, a1, a2, a3);
  case 0x80019368:
    at = 0x80080000 | 0;
    m.write(((at) + -27166) >>> 0, 0 & 0xff, 1);
  case 0x80019370:
    fp = m.read(((sp) + 72) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 80) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`menu: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80019c30, translated instruction by instruction (1492 instructions).
export function* flowChart(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80019c30;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x80019c30:
    sp = (sp + -184) | 0;
    m.write(((sp) + 148) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 1) | 0;
    t7 = (0 + 1) | 0;
    m.write(((sp) + 164) >>> 0, s5 >>> 0, 4);
    s5 = (0 + -1) | 0;
    m.write(((sp) + 168) >>> 0, s6 >>> 0, 4);
    s6 = s5 | 0;
    m.write(((sp) + 152) >>> 0, s2 >>> 0, 4);
    s2 = 0 | 0;
    v0 = 0x801f0000 | 0;
    a1 = (v0 + 29272) | 0;
    m.write(((sp) + 180) >>> 0, 0, 4);
    m.write(((sp) + 176) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 172) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 160) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 156) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 144) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, a0 & 0xff, 1);
    m.write(((sp) + 116) >>> 0, t7 >>> 0, 4);
  case 0x80019c80:
    s0 = 0 | 0;
    a0 = s2 & 255;
  case 0x80019c88:
    v0 = s0 & 255;
    v1 = v0 << 1;
    v1 = (v1 + v0) | 0;
    v1 = v1 << 3;
    v1 = (v1 + a1) | 0;
    v1 = (v1 + a0) | 0;
    s0 = (s0 + 1) | 0;
    v0 = s0 & 255;
    v0 = (v0 >>> 0) < 7 ? 1 : 0;
    { const c = (v0 | 0) !== 0; m.write(((v1) + 0) >>> 0, 0 & 0xff, 1); if (c) { pc = 0x80019c88; continue; } }
  case 0x80019cb4:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 255;
    v0 = (v0 >>> 0) < 24 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80019c80; continue; } }
  case 0x80019cc8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27384) >>> 0, 4) | 0;
    v1 = (v0 + 5120) | 0;
    m.write(((0x8007913c) + 1008) >>> 0, v0 >>> 0, 4);
    v0 = (v0 + 10240) | 0;
    m.write(((0x8007913c) + 1168) >>> 0, v1 >>> 0, 4);
    m.write(((0x8007913c) + 808) >>> 0, v0 >>> 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80019cf0:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -32581) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a2 = (0 + 9007) | 0; [v0, v1] = yield* call(ctx, sp, 0x800355cc, a0, a1, a2, a3);
  case 0x80019d08:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27516) >>> 0, 4) | 0;
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e50, a0, a1, a2, a3);
  case 0x80019d18:
    a1 = 0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27516) >>> 0, 4) | 0;
    s0 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e90, a0, a1, a2, a3);
  case 0x80019d2c:
    a0 = s0 | 0;
    a1 = m.read(((0x8007913c) + 1008) >>> 0, 4) | 0;
    a2 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80019d3c:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27516) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e50, a0, a1, a2, a3);
  case 0x80019d4c:
    a1 = (0 + 1) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27516) >>> 0, 4) | 0;
    s0 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e90, a0, a1, a2, a3);
  case 0x80019d60:
    a0 = s0 | 0;
    a1 = m.read(((0x8007913c) + 1168) >>> 0, 4) | 0;
    a2 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80019d70:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27516) >>> 0, 4) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e50, a0, a1, a2, a3);
  case 0x80019d80:
    a1 = (0 + 2) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27516) >>> 0, 4) | 0;
    s0 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e90, a0, a1, a2, a3);
  case 0x80019d94:
    a0 = s0 | 0;
    a1 = m.read(((0x8007913c) + 808) >>> 0, 4) | 0;
    a2 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80019da4:
    t7 = m.read(((0x8007913c) + 1008) >>> 0, 4) | 0;
    v1 = m.read(((sp) + 40) >>> 0, 1);
    m.write(((sp) + 96) >>> 0, t7 >>> 0, 4);
    t7 = m.read(((0x8007913c) + 1168) >>> 0, 4) | 0;
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0); m.write(((sp) + 100) >>> 0, t7 >>> 0, 4); if (c) { pc = 0x80019df4; continue; } }
  case 0x80019dc0:
    a0 = (0 + 248) | 0;
    a1 = (0 + 39) | 0;
    a2 = (0 + 64) | 0;
    a3 = (0 + 176) | 0;
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80019df4:
    s2 = 0 | 0;
    t0 = 0x80080000 | 0;
    t0 = m.read(((t0) + -27972) >>> 0, 2);
    s0 = 0 | 0;
  case 0x80019e04:
    a2 = s2 & 255;
    v0 = a2 << 3;
    a3 = (v0 - a2) | 0;
    v0 = s0 & 255;
  case 0x80019e14:
    v0 = (a3 + v0) | 0;
    t7 = m.read(((sp) + 96) >>> 0, 4) | 0;
    v0 = v0 << 1;
    v0 = (v0 + t7) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 2);
    { const c = (v1 | 0) === 0;  if (c) { pc = 0x80019ebc; continue; } }
  case 0x80019e34:
    v0 = m.read(((0x8007913c) + 1008) >>> 0, 4) | 0;
    s4 = (v0 + v1) | 0;
    a0 = (s4 + 1) | 0;
  case 0x80019e44:
    v1 = m.read(((s4) + 0) >>> 0, 1);
    { const c = (v1 | 0) !== 0;  if (c) { pc = 0x80019e64; continue; } }
  case 0x80019e54:
    v0 = m.read(((a0) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80019ebc; continue; } }
  case 0x80019e64:
    v0 = m.read(((a0) + 0) >>> 0, 1);
    v1 = (v1 >>> 6) | 0;
    v0 = v0 << 2;
    v1 = v1 | v0;
    { const c = (t0 | 0) === (v1 | 0); a0 = (a0 + 3) | 0; if (c) { pc = 0x80019e84; continue; } }
  case 0x80019e7c:
    s4 = (s4 + 3) | 0; pc = 0x80019e44; continue;
  case 0x80019e84:
    v1 = s0 & 255;
    v0 = v1 << 1;
    v0 = (v0 + v1) | 0;
    a0 = m.read(((s4) + 2) >>> 0, 1);
    v0 = v0 << 1;
    a1 = (a0 >>> 4) | 0;
    a1 = (a1 + v0) | 0;
    a0 = a0 & 15;
    v0 = a2 << 1;
    v0 = (v0 + a2) | 0;
    v0 = v0 << 1;
    a0 = (a0 + v0) | 0;
    m.write(((sp) + 48) >>> 0, a1 & 0xffff, 2);
    m.write(((sp) + 56) >>> 0, a0 & 0xffff, 2);
  case 0x80019ebc:
    s0 = (s0 + 1) | 0;
    v0 = s0 & 255;
    v0 = (v0 >>> 0) < 7 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s0 & 255; if (c) { pc = 0x80019e14; continue; } }
  case 0x80019ed0:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 255;
    v0 = (v0 >>> 0) < 24 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = 0 | 0; if (c) { pc = 0x80019e04; continue; } }
  case 0x80019ee4:
    v0 = m.read(((sp) + 48) >>> 0, 2);
    v1 = 0xaaaa0000 | 0;
    v1 = v1 | 43691;
    [hi, lo] = mult(v0, v1, false);
    t0 = hi;
    v0 = m.read(((sp) + 56) >>> 0, 2);
    a0 = 0 | 0;
    [hi, lo] = mult(v0, v1, false);
    a1 = (0 + 39) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 201) | 0;
    v0 = (t0 >>> 2) | 0;
    v0 = v0 & 65535;
    t0 = 0x801f0000 | 0;
    t0 = (t0 + 29272) | 0;
    v1 = v0 << 1;
    v1 = (v1 + v0) | 0;
    v1 = v1 << 3;
    v1 = (v1 + t0) | 0;
    t1 = hi;
    v0 = (t1 >>> 2) | 0;
    v0 = v0 & 65535;
    v1 = (v1 + v0) | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 0) >>> 0, v0 & 0xff, 1);
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80019f50:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80019f58:
    s3 = 0x80080000 | 0;
    s3 = m.read(((s3) + -27972) >>> 0, 2);
     [v0, v1] = yield* call(ctx, sp, 0x80026204, a0, a1, a2, a3);
  case 0x80019f68:
    v0 = m.read(((sp) + 40) >>> 0, 1);
    t7 = (0 + 1) | 0;
  case 0x80019f70:
    { const c = (v0 | 0) !== (t7 | 0); s0 = (0 + -1) | 0; if (c) { pc = 0x8001a308; continue; } }
  case 0x80019f78:
    v0 = 0x801f0000 | 0;
    t7 = m.read(((sp) + 48) >>> 0, 2);
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    m.write(((sp) + 72) >>> 0, t7 & 0xffff, 2);
    t7 = m.read(((sp) + 56) >>> 0, 2);
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; m.write(((sp) + 74) >>> 0, t7 & 0xffff, 2); if (c) { pc = 0x8001a000; continue; } }
  case 0x80019f98:
    t7 = 0x801f0000 | 0;
    t7 = (t7 + -4288) | 0;
    v0 = m.read(((t7) + 8) >>> 0, 4) | 0;
    v0 = v0 & 10;
    { const c = (v0 | 0) === 0; v0 = (0 + 143) | 0; if (c) { pc = 0x80019fdc; continue; } }
  case 0x80019fb4:
    v0 = m.read(((sp) + 56) >>> 0, 2);
    v0 = (v0 >>> 0) < 138 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001a004; continue; } }
  case 0x80019fc8:
    s0 = (0 + 3) | 0;
    t7 = m.read(((sp) + 56) >>> 0, 2);
    s1 = (0 + 1) | 0;
    t7 = (t7 + 6) | 0; pc = 0x80019ffc; continue;
  case 0x80019fdc:
    v1 = m.read(((sp) + 56) >>> 0, 2);
    { const c = (v1 | 0) === (v0 | 0); v0 = 0x801f0000 | 0; if (c) { pc = 0x8001a004; continue; } }
  case 0x80019fec:
    s0 = (0 + 3) | 0;
    t7 = m.read(((sp) + 56) >>> 0, 2);
    s1 = (0 + 1) | 0;
    t7 = (t7 + 1) | 0;
  case 0x80019ffc:
    m.write(((sp) + 56) >>> 0, t7 & 0xffff, 2);
  case 0x8001a000:
    v0 = 0x801f0000 | 0;
  case 0x8001a004:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; t7 = 0x801f0000 | 0; if (c) { pc = 0x8001a07c; continue; } }
  case 0x8001a018:
    t7 = (t7 + -4288) | 0;
    v0 = m.read(((t7) + 8) >>> 0, 4) | 0;
    v0 = v0 & 10;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001a058; continue; } }
  case 0x8001a030:
    v0 = m.read(((sp) + 56) >>> 0, 2);
    v0 = (v0 >>> 0) < 6 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001a080; continue; } }
  case 0x8001a044:
    s0 = (0 + 3) | 0;
    t7 = m.read(((sp) + 56) >>> 0, 2);
    s1 = (0 + 1) | 0;
    t7 = (t7 + -6) | 0; pc = 0x8001a078; continue;
  case 0x8001a058:
    v0 = m.read(((sp) + 56) >>> 0, 2);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001a080; continue; } }
  case 0x8001a068:
    s0 = (0 + 3) | 0;
    t7 = m.read(((sp) + 56) >>> 0, 2);
    s1 = (0 + 1) | 0;
    t7 = (t7 + -1) | 0;
  case 0x8001a078:
    m.write(((sp) + 56) >>> 0, t7 & 0xffff, 2);
  case 0x8001a07c:
    v0 = 0x801f0000 | 0;
  case 0x8001a080:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 8192;
    { const c = (v0 | 0) === 0; t7 = 0x801f0000 | 0; if (c) { pc = 0x8001a0f8; continue; } }
  case 0x8001a094:
    t7 = (t7 + -4288) | 0;
    v0 = m.read(((t7) + 8) >>> 0, 4) | 0;
    v0 = v0 & 10;
    { const c = (v0 | 0) === 0; v0 = (0 + 41) | 0; if (c) { pc = 0x8001a0d4; continue; } }
  case 0x8001a0ac:
    v0 = m.read(((sp) + 48) >>> 0, 2);
    v0 = (v0 >>> 0) < 36 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001a0fc; continue; } }
  case 0x8001a0c0:
    s0 = (0 + 3) | 0;
    t7 = m.read(((sp) + 48) >>> 0, 2);
    s1 = (0 + 1) | 0;
    t7 = (t7 + 6) | 0; pc = 0x8001a0f4; continue;
  case 0x8001a0d4:
    v1 = m.read(((sp) + 48) >>> 0, 2);
    { const c = (v1 | 0) === (v0 | 0); v0 = 0x801f0000 | 0; if (c) { pc = 0x8001a0fc; continue; } }
  case 0x8001a0e4:
    s0 = (0 + 3) | 0;
    t7 = m.read(((sp) + 48) >>> 0, 2);
    s1 = (0 + 1) | 0;
    t7 = (t7 + 1) | 0;
  case 0x8001a0f4:
    m.write(((sp) + 48) >>> 0, t7 & 0xffff, 2);
  case 0x8001a0f8:
    v0 = 0x801f0000 | 0;
  case 0x8001a0fc:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 32768;
    { const c = (v0 | 0) === 0; t7 = 0x801f0000 | 0; if (c) { pc = 0x8001a174; continue; } }
  case 0x8001a110:
    t7 = (t7 + -4288) | 0;
    v0 = m.read(((t7) + 8) >>> 0, 4) | 0;
    v0 = v0 & 10;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001a150; continue; } }
  case 0x8001a128:
    v0 = m.read(((sp) + 48) >>> 0, 2);
    v0 = (v0 >>> 0) < 6 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001a178; continue; } }
  case 0x8001a13c:
    s0 = (0 + 3) | 0;
    t7 = m.read(((sp) + 48) >>> 0, 2);
    s1 = (0 + 1) | 0;
    t7 = (t7 + -6) | 0; pc = 0x8001a170; continue;
  case 0x8001a150:
    v0 = m.read(((sp) + 48) >>> 0, 2);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001a178; continue; } }
  case 0x8001a160:
    s0 = (0 + 3) | 0;
    t7 = m.read(((sp) + 48) >>> 0, 2);
    s1 = (0 + 1) | 0;
    t7 = (t7 + -1) | 0;
  case 0x8001a170:
    m.write(((sp) + 48) >>> 0, t7 & 0xffff, 2);
  case 0x8001a174:
    v0 = 0x801f0000 | 0;
  case 0x8001a178:
    v1 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 68;
    { const c = (v0 | 0) === 0; v0 = v1 & 33; if (c) { pc = 0x8001a19c; continue; } }
  case 0x8001a18c:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001a194:
     pc = 0x8001b328; continue;
  case 0x8001a19c:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001a308; continue; } }
  case 0x8001a1a4:
    v0 = m.read(((sp) + 112) >>> 0, 1);
    v0 = (v0 >>> 0) < 11 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = s3 & 65535; if (c) { pc = 0x8001a300; continue; } }
  case 0x8001a1b8:
    { const c = (v0 | 0) === 0; t7 = 0x80200000 | 0; if (c) { pc = 0x8001a300; continue; } }
  case 0x8001a1c0:
    a0 = (t7 + -15784) | 0;
    a1 = 0x80200000 | 0;
    a1 = (a1 + -22736) | 0;
    a2 = (0 + 512) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8001a1d4:
    t7 = 0x801f0000 | 0;
    a0 = (t7 + 23864) | 0;
    a1 = 0x801f0000 | 0;
    a1 = (a1 + 23488) | 0;
    a2 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8001a1ec:
    a0 = 0x801d0000 | 0;
    a0 = (a0 + 25896) | 0;
    a1 = 0x801d0000 | 0;
    a1 = (a1 + 24848) | 0;
    a2 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8001a204:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001a20c:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8001a214:
    a0 = (0 + 25) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001a220:
    a0 = (0 + 25) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001a22c:
    a0 = (0 + 25) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001a238:
    a0 = (0 + 25) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001a244:
    a0 = (0 + 25) | 0;
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001a250:
    a0 = (0 + 25) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001a25c:
    a0 = (0 + 25) | 0;
    a1 = (0 + 10) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001a268:
    a0 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x8001a270:
     [v0, v1] = yield* call(ctx, sp, 0x80037e50, a0, a1, a2, a3);
  case 0x8001a278:
     [v0, v1] = yield* call(ctx, sp, 0x80037e94, a0, a1, a2, a3);
  case 0x8001a280:
     [v0, v1] = yield* call(ctx, sp, 0x80028228, a0, a1, a2, a3);
  case 0x8001a288:
    a0 = (0 + 1) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8001a294:
     [v0, v1] = yield* call(ctx, sp, 0x80037c1c, a0, a1, a2, a3);
  case 0x8001a29c:
     [v0, v1] = yield* call(ctx, sp, 0x8001c8f8, a0, a1, a2, a3);
  case 0x8001a2a4:
     [v0, v1] = yield* call(ctx, sp, 0x80019544, a0, a1, a2, a3);
  case 0x8001a2ac:
     [v0, v1] = yield* call(ctx, sp, 0x80028ccc, a0, a1, a2, a3);
  case 0x8001a2b4:
    a0 = 0 | 0;
    a1 = a0 | 0;
    a2 = 0 | 65535; [v0, v1] = yield* call(ctx, sp, 0x80026088, a0, a1, a2, a3);
  case 0x8001a2c4:
    a0 = (s3 + -1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27628) >>> 0, 0 & 0xffff, 2);
    a0 = a0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8001c6a0, a0, a1, a2, a3);
  case 0x8001a2d8:
    at = 0x80080000 | 0;
    m.write(((at) + -27972) >>> 0, s3 & 0xffff, 2);
    a0 = (0 + 103) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044384, a0, a1, a2, a3);
  case 0x8001a2e8:
    t7 = (0 + 1) | 0;
    m.write(((sp) + 116) >>> 0, 0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27997) >>> 0, t7 & 0xff, 1);
     pc = 0x8001b328; continue;
  case 0x8001a300:
    a0 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001a308:
    v0 = m.read(((sp) + 48) >>> 0, 2);
    t7 = 0xaaaa0000 | 0;
    t7 = t7 | 43691;
    [hi, lo] = mult(v0, t7, false);
    v1 = hi;
    v0 = m.read(((sp) + 56) >>> 0, 2);
    [hi, lo] = mult(v0, t7, false);
    v1 = (v1 >>> 2) | 0;
    t7 = (0 + 1) | 0;
    m.write(((sp) + 80) >>> 0, v1 & 0xffff, 2);
    t0 = hi;
    t0 = (t0 >>> 2) | 0;
    { const c = (s1 | 0) !== (t7 | 0); m.write(((sp) + 88) >>> 0, t0 & 0xffff, 2); if (c) { pc = 0x8001b23c; continue; } }
  case 0x8001a344:
    v0 = m.read(((sp) + 40) >>> 0, 1);
    { const c = (v0 | 0) !== (t7 | 0); v0 = s0 << 24; if (c) { pc = 0x8001a3e4; continue; } }
  case 0x8001a354:
    v1 = 0x801f0000 | 0;
    a0 = m.read(((sp) + 80) >>> 0, 2);
    v1 = (v1 + 29272) | 0;
    v0 = a0 << 1;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 3;
    v0 = (v0 + v1) | 0;
    v1 = m.read(((sp) + 88) >>> 0, 2);
    v0 = (v0 + v1) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = s0 << 24; if (c) { pc = 0x8001a3e4; continue; } }
  case 0x8001a38c:
    t7 = m.read(((sp) + 72) >>> 0, 2);
    m.write(((sp) + 48) >>> 0, t7 & 0xffff, 2);
    v0 = m.read(((sp) + 48) >>> 0, 2);
    t7 = 0xaaaa0000 | 0;
    t7 = t7 | 43691;
    [hi, lo] = mult(v0, t7, false);
    t7 = m.read(((sp) + 74) >>> 0, 2);
    m.write(((sp) + 56) >>> 0, t7 & 0xffff, 2);
    v1 = hi;
    v0 = m.read(((sp) + 56) >>> 0, 2);
    t7 = 0xaaaa0000 | 0;
    t7 = t7 | 43691;
    [hi, lo] = mult(v0, t7, false);
    s0 = (0 + -1) | 0;
    v1 = (v1 >>> 2) | 0;
    m.write(((sp) + 80) >>> 0, v1 & 0xffff, 2);
    t0 = hi;
    t0 = (t0 >>> 2) | 0;
    m.write(((sp) + 88) >>> 0, t0 & 0xffff, 2);
    v0 = s0 << 24;
  case 0x8001a3e4:
    v0 = v0 >> 24;
    v1 = (0 + -1) | 0;
    { const c = (v0 | 0) === (v1 | 0); v0 = s5 << 24; if (c) { pc = 0x8001a400; continue; } }
  case 0x8001a3f4:
    a0 = s0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001a3fc:
    v0 = s5 << 24;
  case 0x8001a400:
    s0 = m.read(((sp) + 80) >>> 0, 2);
    v0 = v0 >> 24;
    { const c = (v0 | 0) !== (s0 | 0); a0 = (0 + 6) | 0; if (c) { pc = 0x8001a424; continue; } }
  case 0x8001a410:
    v0 = s6 << 24;
    v1 = m.read(((sp) + 88) >>> 0, 2);
    v0 = v0 >> 24;
    { const c = (v0 | 0) === (v1 | 0);  if (c) { pc = 0x8001afc0; continue; } }
  case 0x8001a424:
    a1 = (0 + 39) | 0;
    a2 = (0 + 238) | 0;
    a3 = (0 + 192) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8001a438:
    m.write(((sp) + 64) >>> 0, 0 & 0xffff, 2);
    m.write(((sp) + 120) >>> 0, s0 >>> 0, 4);
  case 0x8001a440:
    v1 = m.read(((sp) + 88) >>> 0, 2);
    t7 = m.read(((sp) + 120) >>> 0, 4) | 0;
    v0 = v1 << 3;
    v0 = (v0 - v1) | 0;
    v0 = (v0 + t7) | 0;
    t7 = m.read(((sp) + 100) >>> 0, 4) | 0;
    v0 = v0 << 1;
    v0 = (v0 + t7) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 2);
    { const c = (v1 | 0) === 0;  if (c) { pc = 0x8001a820; continue; } }
  case 0x8001a470:
    v0 = m.read(((0x8007913c) + 1168) >>> 0, 4) | 0;
    fp = m.read(((sp) + 64) >>> 0, 2);
    s3 = (v0 + v1) | 0;
  case 0x8001a47c:
    v0 = m.read(((s3) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8001a49c; continue; } }
  case 0x8001a48c:
    v0 = m.read(((s3) + 1) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001a820; continue; } }
  case 0x8001a49c:
    m.write(((sp) + 104) >>> 0, 0 & 0xff, 1);
  case 0x8001a4a0:
    v0 = m.read(((s3) + 1) >>> 0, 1);
    v1 = m.read(((s3) + 0) >>> 0, 1);
    v0 = v0 << 8;
    v0 = (v1 + v0) | 0;
    { const c = (fp | 0) !== 0; a3 = v0 | 0; if (c) { pc = 0x8001a4e0; continue; } }
  case 0x8001a4b8:
    v0 = v0 & 32767;
    t7 = 0x80200000 | 0;
    t7 = (t7 + -15784) | 0;
    v0 = (v0 + t7) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    t7 = (0 + 1) | 0;
    { const c = (v0 | 0) !== (t7 | 0); v0 = a3 & 32768; if (c) { pc = 0x8001a50c; continue; } }
  case 0x8001a4d8:
    t7 = (0 + 4) | 0; pc = 0x8001a504; continue;
  case 0x8001a4e0:
    v0 = v0 & 32767;
    t7 = 0x80200000 | 0;
    t7 = (t7 + -15784) | 0;
    v0 = (v0 + t7) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    t7 = (0 + 3) | 0;
    { const c = (v0 | 0) !== (t7 | 0); v0 = a3 & 32768; if (c) { pc = 0x8001a50c; continue; } }
  case 0x8001a500:
    t7 = (0 + 170) | 0;
  case 0x8001a504:
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
    v0 = a3 & 32768;
  case 0x8001a50c:
    { const c = (v0 | 0) === 0; s3 = (s3 + 2) | 0; if (c) { pc = 0x8001a4a0; continue; } }
  case 0x8001a514:
    a0 = m.read(((s3) + 0) >>> 0, 1);
    v0 = a0 & 255;
    s1 = (v0 >>> 5) | 0;
    v0 = (v0 >>> 2) | 0;
    s4 = v0 & 7;
    v1 = s1 << 3;
    v1 = v1 | s1;
    v1 = v1 << 2;
    v1 = (v1 + -9) | 0;
    s2 = v1 | 0;
    v0 = s4 << 3;
    v0 = (v0 - s4) | 0;
    v0 = v0 << 2;
    v1 = (v1 | 0) < 22 ? 1 : 0;
    { const c = (v1 | 0) === 0; s7 = (v0 + 42) | 0; if (c) { pc = 0x8001a55c; continue; } }
  case 0x8001a558:
    s2 = (0 + 6) | 0;
  case 0x8001a55c:
    v0 = s2 << 16;
    v0 = v0 >> 16;
    v0 = (v0 | 0) < 213 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s6 = a0 & 3; if (c) { pc = 0x8001a574; continue; } }
  case 0x8001a570:
    s2 = (0 + 226) | 0;
  case 0x8001a574:
    v1 = m.read(((sp) + 104) >>> 0, 1);
    { const c = (v1 | 0) === 0; s3 = (s3 + 1) | 0; if (c) { pc = 0x8001a604; continue; } }
  case 0x8001a584:
    v0 = (0 + 4) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8001a5a0; continue; } }
  case 0x8001a590:
    { const c = (fp | 0) === 0; s0 = s6 & 255; if (c) { pc = 0x8001a5a8; continue; } }
  case 0x8001a598:
     pc = 0x8001a604; continue;
  case 0x8001a5a0:
    { const c = (fp | 0) === 0; s0 = s6 & 255; if (c) { pc = 0x8001a604; continue; } }
  case 0x8001a5a8:
    t7 = (0 + 1) | 0;
    { const c = (s0 | 0) !== (t7 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x8001a5dc; continue; } }
  case 0x8001a5b4:
    a0 = s2 << 16;
    a0 = a0 >> 16;
    a3 = s7 << 16;
    a3 = a3 >> 16;
    a1 = (a3 + -3) | 0;
    v0 = m.read(((sp) + 104) >>> 0, 1);
    a2 = (a0 + 2) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001a5d8:
    v0 = (0 + 2) | 0;
  case 0x8001a5dc:
    { const c = (s0 | 0) !== (v0 | 0); a0 = s2 << 16; if (c) { pc = 0x8001a604; continue; } }
  case 0x8001a5e4:
    a0 = a0 >> 16;
    a1 = s7 << 16;
    a1 = a1 >> 16;
    a2 = (a0 + 2) | 0;
    v0 = m.read(((sp) + 104) >>> 0, 1);
    a3 = (a1 + 5) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001a604:
    s5 = m.read(((sp) + 104) >>> 0, 1);
  case 0x8001a608:
    a0 = m.read(((s3) + 0) >>> 0, 1);
    v0 = (0 + 255) | 0;
    v1 = a0 & 255;
    { const c = (v1 | 0) === (v0 | 0); t1 = (v1 >>> 5) | 0; if (c) { pc = 0x8001a818; continue; } }
  case 0x8001a61c:
    v0 = (v1 >>> 2) | 0;
    t0 = v0 & 7;
    v1 = s1 & 255;
    v0 = v1 << 3;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 2;
    s2 = (v0 + -9) | 0;
    v1 = s4 & 255;
    v0 = v1 << 3;
    v0 = (v0 - v1) | 0;
    v0 = v0 << 2;
    s7 = (v0 + 42) | 0;
    v0 = t1 << 3;
    v0 = v0 | t1;
    v0 = v0 << 2;
    s1 = (v0 + -9) | 0;
    v0 = t0 << 3;
    v0 = (v0 - t0) | 0;
    v0 = v0 << 2;
    s4 = (v0 + 42) | 0;
    t2 = s6 | 0;
    { const c = (s5 | 0) === 0; s6 = a0 & 3; if (c) { pc = 0x8001a72c; continue; } }
  case 0x8001a678:
    v0 = (0 + 4) | 0;
    { const c = (s5 | 0) !== (v0 | 0);  if (c) { pc = 0x8001a694; continue; } }
  case 0x8001a684:
    { const c = (fp | 0) === 0; v0 = s2 << 16; if (c) { pc = 0x8001a69c; continue; } }
  case 0x8001a68c:
    v0 = v0 >> 16; pc = 0x8001a734; continue;
  case 0x8001a694:
    { const c = (fp | 0) === 0; v0 = s2 << 16; if (c) { pc = 0x8001a730; continue; } }
  case 0x8001a69c:
    s0 = s6 & 255;
    t7 = (0 + 1) | 0;
    { const c = (s0 | 0) !== (t7 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x8001a6ec; continue; } }
  case 0x8001a6ac:
    a0 = s1 << 16;
    a0 = a0 >> 16;
    a3 = s4 << 16;
    a3 = a3 >> 16;
    a1 = (a3 + -3) | 0;
    a2 = (a0 + 2) | 0;
    a3 = (a3 + 2) | 0;
    m.write(((sp) + 16) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 128) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 132) >>> 0, t1 >>> 0, 4);
    m.write(((sp) + 136) >>> 0, t2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001a6dc:
    t2 = m.read(((sp) + 136) >>> 0, 4) | 0;
    t1 = m.read(((sp) + 132) >>> 0, 4) | 0;
    t0 = m.read(((sp) + 128) >>> 0, 4) | 0;
    v0 = (0 + 2) | 0;
  case 0x8001a6ec:
    { const c = (s0 | 0) !== (v0 | 0); v0 = s2 << 16; if (c) { pc = 0x8001a730; continue; } }
  case 0x8001a6f4:
    a0 = s1 << 16;
    a0 = a0 >> 16;
    a1 = s4 << 16;
    a1 = a1 >> 16;
    a2 = (a0 + 2) | 0;
    a3 = (a1 + 7) | 0;
    m.write(((sp) + 16) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 128) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 132) >>> 0, t1 >>> 0, 4);
    m.write(((sp) + 136) >>> 0, t2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001a720:
    t2 = m.read(((sp) + 136) >>> 0, 4) | 0;
    t1 = m.read(((sp) + 132) >>> 0, 4) | 0;
    t0 = m.read(((sp) + 128) >>> 0, 4) | 0;
  case 0x8001a72c:
    v0 = s2 << 16;
  case 0x8001a730:
    v0 = v0 >> 16;
  case 0x8001a734:
    v0 = (v0 | 0) < 22 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = s1 << 16; if (c) { pc = 0x8001a744; continue; } }
  case 0x8001a740:
    s2 = (0 + 6) | 0;
  case 0x8001a744:
    v0 = v0 >> 16;
    v0 = (v0 | 0) < 24 ? 1 : 0;
    { const c = (v0 | 0) === 0; v1 = s2 << 16; if (c) { pc = 0x8001a758; continue; } }
  case 0x8001a754:
    s1 = (0 + 6) | 0;
  case 0x8001a758:
    v0 = s1 << 16;
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = s2 | 0; if (c) { pc = 0x8001a770; continue; } }
  case 0x8001a768:
    s2 = s1 | 0;
    s1 = v0 | 0;
  case 0x8001a770:
    v1 = s7 << 16;
    v0 = s4 << 16;
    v0 = (v0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = s7 | 0; if (c) { pc = 0x8001a78c; continue; } }
  case 0x8001a784:
    s7 = s4 | 0;
    s4 = v0 | 0;
  case 0x8001a78c:
    v0 = t2 & 255;
    { const c = (v0 | 0) !== (s6 | 0); v0 = (s6 + -1) | 0; if (c) { pc = 0x8001a7a4; continue; } }
  case 0x8001a798:
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8001a808; continue; } }
  case 0x8001a7a4:
    { const c = (s5 | 0) === 0; v0 = (0 + 4) | 0; if (c) { pc = 0x8001a808; continue; } }
  case 0x8001a7ac:
    { const c = (s5 | 0) !== (v0 | 0);  if (c) { pc = 0x8001a7c4; continue; } }
  case 0x8001a7b4:
    { const c = (fp | 0) === 0; a0 = s2 << 16; if (c) { pc = 0x8001a7cc; continue; } }
  case 0x8001a7bc:
    s1 = t1 | 0; pc = 0x8001a80c; continue;
  case 0x8001a7c4:
    { const c = (fp | 0) === 0; a0 = s2 << 16; if (c) { pc = 0x8001a808; continue; } }
  case 0x8001a7cc:
    a0 = a0 >> 16;
    a1 = s7 << 16;
    a1 = a1 >> 16;
    a2 = s1 << 16;
    a2 = a2 >> 16;
    a2 = (a2 + 2) | 0;
    a3 = s4 << 16;
    a3 = a3 >> 16;
    a3 = (a3 + 2) | 0;
    m.write(((sp) + 16) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 128) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 132) >>> 0, t1 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001a800:
    t1 = m.read(((sp) + 132) >>> 0, 4) | 0;
    t0 = m.read(((sp) + 128) >>> 0, 4) | 0;
  case 0x8001a808:
    s1 = t1 | 0;
  case 0x8001a80c:
    s4 = t0 | 0;
    s3 = (s3 + 1) | 0; pc = 0x8001a608; continue;
  case 0x8001a818:
    s3 = (s3 + 1) | 0; pc = 0x8001a47c; continue;
  case 0x8001a820:
    t7 = m.read(((sp) + 64) >>> 0, 2);
    t7 = (t7 + 1) | 0;
    m.write(((sp) + 64) >>> 0, t7 & 0xffff, 2);
    v0 = m.read(((sp) + 64) >>> 0, 2);
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8001a440; continue; } }
  case 0x8001a844:
    a0 = m.read(((sp) + 80) >>> 0, 2);
    v1 = m.read(((sp) + 88) >>> 0, 2);
    t7 = m.read(((sp) + 100) >>> 0, 4) | 0;
    v0 = v1 << 3;
    v0 = (v0 - v1) | 0;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 1;
    v0 = (v0 + t7) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 2);
    { const c = (v1 | 0) === 0;  if (c) { pc = 0x8001aa18; continue; } }
  case 0x8001a874:
    v0 = m.read(((0x8007913c) + 1168) >>> 0, 4) | 0;
    s3 = (v0 + v1) | 0;
  case 0x8001a880:
    v0 = m.read(((s3) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8001a8a0; continue; } }
  case 0x8001a890:
    v0 = m.read(((s3) + 1) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001aa14; continue; } }
  case 0x8001a8a0:
    m.write(((sp) + 104) >>> 0, 0 & 0xff, 1);
  case 0x8001a8a4:
    t7 = 0x80200000 | 0;
    t7 = (t7 + -15784) | 0;
    v0 = m.read(((s3) + 1) >>> 0, 1);
    v1 = m.read(((s3) + 0) >>> 0, 1);
    v0 = v0 << 8;
    v1 = (v1 + v0) | 0;
    v0 = v1 & 32767;
    v0 = (v0 + t7) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    t7 = (0 + 1) | 0;
    { const c = (v0 | 0) !== (t7 | 0); t7 = (0 + 3) | 0; if (c) { pc = 0x8001a8e0; continue; } }
  case 0x8001a8d4:
    t7 = (0 + 4) | 0;
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
    t7 = (0 + 3) | 0;
  case 0x8001a8e0:
    { const c = (v0 | 0) !== (t7 | 0); v0 = v1 & 32768; if (c) { pc = 0x8001a8f0; continue; } }
  case 0x8001a8e8:
    t7 = (0 + 170) | 0;
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001a8f0:
    { const c = (v0 | 0) === 0; s3 = (s3 + 2) | 0; if (c) { pc = 0x8001a8a4; continue; } }
  case 0x8001a8f8:
    v1 = m.read(((s3) + 0) >>> 0, 1);
    s3 = (s3 + 1) | 0;
    s4 = m.read(((sp) + 104) >>> 0, 1);
    s6 = v1 & 3;
    v1 = v1 & 255;
    a0 = (v1 >>> 2) | 0;
    v1 = (v1 >>> 5) | 0;
    v0 = v1 << 3;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 2;
    s0 = (v0 + -9) | 0;
    a0 = a0 & 7;
    v0 = a0 << 3;
    v0 = (v0 - a0) | 0;
    v0 = v0 << 2;
    { const c = (s4 | 0) === 0; v0 = (v0 + 42) | 0; if (c) { pc = 0x8001a984; continue; } }
  case 0x8001a93c:
    t7 = (0 + 3) | 0;
    { const c = (s6 | 0) !== (t7 | 0); a0 = (s0 + -2) | 0; if (c) { pc = 0x8001a984; continue; } }
  case 0x8001a948:
    s1 = v0 << 16;
    s1 = s1 >> 16;
    s2 = (s1 + 1) | 0;
    a1 = s2 | 0;
    a2 = (s0 + 4) | 0;
    a3 = (s1 + 2) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001a968:
    a0 = (s0 + -4) | 0;
    a1 = (s1 + -1) | 0;
    a2 = (s0 + 6) | 0;
    a3 = s2 | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001a980:
    s4 = m.read(((sp) + 104) >>> 0, 1);
  case 0x8001a984:
    a0 = m.read(((s3) + 0) >>> 0, 1);
    v0 = (0 + 255) | 0;
    v1 = a0 & 255;
    { const c = (v1 | 0) === (v0 | 0); s6 = a0 & 3; if (c) { pc = 0x8001aa0c; continue; } }
  case 0x8001a998:
    a0 = (v1 >>> 2) | 0;
    v1 = (v1 >>> 5) | 0;
    v0 = v1 << 3;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 2;
    s0 = (v0 + -9) | 0;
    a0 = a0 & 7;
    v0 = a0 << 3;
    v0 = (v0 - a0) | 0;
    v0 = v0 << 2;
    { const c = (s4 | 0) === 0; s1 = (v0 + 42) | 0; if (c) { pc = 0x8001aa04; continue; } }
  case 0x8001a9c8:
    t7 = (0 + 3) | 0;
    { const c = (s6 | 0) !== (t7 | 0); a0 = (s0 + -2) | 0; if (c) { pc = 0x8001aa04; continue; } }
  case 0x8001a9d4:
    s2 = (s1 + 1) | 0;
    a1 = s2 | 0;
    a2 = (s0 + 4) | 0;
    a3 = (s1 + 2) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001a9ec:
    a0 = (s0 + -4) | 0;
    a1 = (s1 + -1) | 0;
    a2 = (s0 + 6) | 0;
    a3 = s2 | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001aa04:
    s3 = (s3 + 1) | 0; pc = 0x8001a984; continue;
  case 0x8001aa0c:
    s3 = (s3 + 1) | 0; pc = 0x8001a880; continue;
  case 0x8001aa14:
    a0 = m.read(((sp) + 80) >>> 0, 2);
  case 0x8001aa18:
    v1 = m.read(((sp) + 88) >>> 0, 2);
    t7 = m.read(((sp) + 96) >>> 0, 4) | 0;
    v0 = v1 << 3;
    v0 = (v0 - v1) | 0;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 1;
    v0 = (v0 + t7) | 0;
    a0 = m.read(((v0) + 0) >>> 0, 2);
    { const c = (a0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001ad1c; continue; } }
  case 0x8001aa44:
    v1 = m.read(((0x8007913c) + 1008) >>> 0, 4) | 0;
    fp = (v0 + 29872) | 0;
    s4 = (v1 + a0) | 0;
    s7 = (s4 + 1) | 0;
  case 0x8001aa54:
    v1 = m.read(((s4) + 0) >>> 0, 1);
    a0 = v1 & 255;
    { const c = (a0 | 0) !== 0; a2 = v1 & 63; if (c) { pc = 0x8001aa78; continue; } }
  case 0x8001aa68:
    v0 = m.read(((s7) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001ad1c; continue; } }
  case 0x8001aa78:
    s6 = a2 | 0;
    a0 = (a0 >>> 6) | 0;
    t7 = 0x801f0000 | 0;
    t7 = (t7 + 23864) | 0;
    v1 = m.read(((s7) + 1) >>> 0, 1);
    v0 = m.read(((s7) + 0) >>> 0, 1);
    s0 = (v1 >>> 4) | 0;
    v0 = v0 << 2;
    a0 = a0 | v0;
    a3 = a0 | 0;
    a1 = a3 & 65535;
    v0 = (a1 + t7) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0; s2 = v1 & 15; if (c) { pc = 0x8001ad10; continue; } }
  case 0x8001aab8:
    v1 = s6 & 255;
    { const c = (v1 | 0) !== 0; v0 = (a2 + -2) | 0; if (c) { pc = 0x8001aacc; continue; } }
  case 0x8001aac4:
    t7 = (0 + 222) | 0;
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001aacc:
    v0 = (v0 >>> 0) < 4 ? 1 : 0;
    { const c = (v0 | 0) === 0; t7 = (0 + 172) | 0; if (c) { pc = 0x8001aadc; continue; } }
  case 0x8001aad8:
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001aadc:
    t7 = (0 + 6) | 0;
    { const c = (v1 | 0) !== (t7 | 0); v0 = (a2 + -7) | 0; if (c) { pc = 0x8001aaf0; continue; } }
  case 0x8001aae8:
    t7 = (0 + 190) | 0;
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001aaf0:
    v0 = (v0 >>> 0) < 4 ? 1 : 0;
    { const c = (v0 | 0) === 0; t7 = (0 + 172) | 0; if (c) { pc = 0x8001ab00; continue; } }
  case 0x8001aafc:
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001ab00:
    t0 = 0 | 0;
    v0 = (a0 + -2) | 0;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a2 = (0 + 52) | 0; if (c) { pc = 0x8001ab38; continue; } }
  case 0x8001ab14:
    t7 = (0 + 6) | 0;
    { const c = (a1 | 0) === (t7 | 0); v0 = (0 + 17) | 0; if (c) { pc = 0x8001ab38; continue; } }
  case 0x8001ab20:
    { const c = (a1 | 0) === (v0 | 0); v0 = (0 + 21) | 0; if (c) { pc = 0x8001ab38; continue; } }
  case 0x8001ab28:
    { const c = (a1 | 0) === (v0 | 0); v0 = (0 + 25) | 0; if (c) { pc = 0x8001ab38; continue; } }
  case 0x8001ab30:
    { const c = (a1 | 0) !== (v0 | 0); v1 = a3 & 65535; if (c) { pc = 0x8001ab40; continue; } }
  case 0x8001ab38:
    a2 = (0 + 51) | 0;
    v1 = a3 & 65535;
  case 0x8001ab40:
    v0 = (0 + 205) | 0;
    { const c = (v1 | 0) !== (v0 | 0); v0 = (s6 + -7) | 0; if (c) { pc = 0x8001ab50; continue; } }
  case 0x8001ab4c:
    a2 = (0 + 53) | 0;
  case 0x8001ab50:
    v0 = (v0 >>> 0) < 4 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = (s6 >>> 0) < 7 ? 1 : 0; if (c) { pc = 0x8001abd8; continue; } }
  case 0x8001ab5c:
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 8 ? 1 : 0; if (c) { pc = 0x8001ab7c; continue; } }
  case 0x8001ab64:
    v0 = (a2 + fp) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 8 ? 1 : 0; if (c) { pc = 0x8001ab7c; continue; } }
  case 0x8001ab78:
    t0 = (0 + 1) | 0;
  case 0x8001ab7c:
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 9 ? 1 : 0; if (c) { pc = 0x8001ab9c; continue; } }
  case 0x8001ab84:
    v0 = (a2 + fp) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 9 ? 1 : 0; if (c) { pc = 0x8001ab9c; continue; } }
  case 0x8001ab98:
    t0 = (0 + 1) | 0;
  case 0x8001ab9c:
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 10 ? 1 : 0; if (c) { pc = 0x8001abbc; continue; } }
  case 0x8001aba4:
    v0 = (a2 + fp) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 10 ? 1 : 0; if (c) { pc = 0x8001abbc; continue; } }
  case 0x8001abb8:
    t0 = (0 + 1) | 0;
  case 0x8001abbc:
    { const c = (v0 | 0) !== 0; v0 = (a2 + fp) | 0; if (c) { pc = 0x8001abd8; continue; } }
  case 0x8001abc4:
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8001abd8; continue; } }
  case 0x8001abd4:
    t0 = (0 + 1) | 0;
  case 0x8001abd8:
    s6 = s6 & 255;
    v0 = (s6 >>> 0) < 11 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = t0 & 255; if (c) { pc = 0x8001abf0; continue; } }
  case 0x8001abe8:
    t7 = (0 + 252) | 0;
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001abf0:
    { const c = (v1 | 0) !== 0; v0 = a3 & 65535; if (c) { pc = 0x8001aca4; continue; } }
  case 0x8001abf8:
    s5 = a3 & 65535;
    t7 = 0x801f0000 | 0;
    t7 = (t7 + 23864) | 0;
    v0 = (s5 + t7) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    t7 = (0 + 1) | 0;
    { const c = (v0 | 0) !== (t7 | 0); v0 = s0 & 255; if (c) { pc = 0x8001ac28; continue; } }
  case 0x8001ac18:
    t7 = m.read(((sp) + 104) >>> 0, 1);
    t7 = (t7 + -6) | 0;
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001ac28:
    s1 = v0 << 3;
    s1 = (s1 + v0) | 0;
    s1 = s1 << 2;
    s1 = (s1 + 12) | 0;
    a0 = s1 | 0;
    v0 = s2 & 255;
    s0 = v0 << 3;
    s0 = (s0 - v0) | 0;
    s0 = s0 << 2;
    s3 = (s0 + 47) | 0;
    a1 = s3 | 0;
    a2 = (0 + 30) | 0;
    s2 = m.read(((sp) + 104) >>> 0, 1);
    a3 = (0 + 10) | 0;
    m.write(((sp) + 16) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8001ac68:
    a0 = s1 | 0;
    a1 = (s0 + 57) | 0;
    a2 = (0 + 30) | 0;
    a3 = (0 + 10) | 0;
    t7 = (0 + 3) | 0;
    m.write(((sp) + 16) >>> 0, t7 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8001ac84:
    a0 = s1 | 0;
    a1 = s3 & 65535;
    a2 = s6 | 0;
    a3 = s5 | 0;
    m.write(((sp) + 16) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80019738, a0, a1, a2, a3);
  case 0x8001ac9c:
    s7 = (s7 + 3) | 0; pc = 0x8001ad14; continue;
  case 0x8001aca4:
    t7 = 0x801f0000 | 0;
    t7 = (t7 + 23864) | 0;
    v0 = (v0 + t7) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 1);
    t7 = (0 + 3) | 0;
    v0 = v1 ^ 1;
    v0 = (v0 >>> 0) < 1 ? 1 : 0;
    v0 = v0 << 2;
    { const c = (v1 | 0) !== (t7 | 0); m.write(((sp) + 104) >>> 0, v0 & 0xff, 1); if (c) { pc = 0x8001acd4; continue; } }
  case 0x8001accc:
    t7 = (0 + 170) | 0;
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001acd4:
    a2 = (0 + 2) | 0;
    v0 = m.read(((sp) + 104) >>> 0, 1);
    a3 = (0 + 20) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = s0 & 255;
    a0 = v0 << 3;
    a0 = (a0 + v0) | 0;
    a0 = a0 << 2;
    a0 = (a0 + 27) | 0;
    v0 = s2 & 255;
    a1 = v0 << 3;
    a1 = (a1 - v0) | 0;
    a1 = a1 << 2;
    a1 = (a1 + 47) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8001ad10:
    s7 = (s7 + 3) | 0;
  case 0x8001ad14:
    s4 = (s4 + 3) | 0; pc = 0x8001aa54; continue;
  case 0x8001ad1c:
    a0 = (0 + 228) | 0;
    a1 = (0 + 39) | 0;
    a2 = (0 + 244) | 0;
    a3 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001ad34:
    a0 = (0 + 6) | 0;
    a1 = (0 + 215) | 0;
    a2 = (0 + 222) | 0;
    a3 = (0 + 2) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8001ad4c:
    v0 = m.read(((sp) + 40) >>> 0, 1);
    t7 = (0 + 1) | 0;
    { const c = (v0 | 0) !== (t7 | 0); a0 = (0 + 228) | 0; if (c) { pc = 0x8001afc0; continue; } }
  case 0x8001ad5c:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a1 = (0 + 39) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 240) | 0; [v0, v1] = yield* call(ctx, sp, 0x800378c4, a0, a1, a2, a3);
  case 0x8001ad70:
    s2 = 0 | 0;
    s5 = (0 + 238) | 0;
  case 0x8001ad78:
    s0 = 0 | 0;
    s1 = s2 & 255;
    t0 = 0 | 0;
  case 0x8001ad84:
    v1 = s0 & 255;
    v0 = s1 << 3;
    v0 = (v0 - s1) | 0;
    v0 = (v0 + v1) | 0;
    t7 = m.read(((sp) + 96) >>> 0, 4) | 0;
    v0 = v0 << 1;
    m.write(((sp) + 104) >>> 0, 0 & 0xff, 1);
    v1 = (v0 + t7) | 0;
    t7 = m.read(((sp) + 100) >>> 0, 4) | 0;
    a0 = m.read(((v1) + 0) >>> 0, 2);
    v1 = m.read(((0x8007913c) + 1008) >>> 0, 4) | 0;
    v0 = (v0 + t7) | 0;
    s4 = (v1 + a0) | 0;
    a1 = (s4 + 1) | 0;
    a2 = m.read(((v0) + 0) >>> 0, 2);
  case 0x8001adc0:
    a0 = m.read(((s4) + 0) >>> 0, 1);
    { const c = (a0 | 0) !== 0; v0 = (a0 >>> 6) | 0; if (c) { pc = 0x8001ade0; continue; } }
  case 0x8001add0:
    v0 = m.read(((a1) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = (a0 >>> 6) | 0; if (c) { pc = 0x8001ae30; continue; } }
  case 0x8001ade0:
    t7 = 0x801f0000 | 0;
    v1 = m.read(((a1) + 0) >>> 0, 1);
    t7 = (t7 + 23864) | 0;
    v1 = v1 << 2;
    v0 = v0 | v1;
    v0 = (v0 + t7) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0; t7 = (0 + 3) | 0; if (c) { pc = 0x8001ae24; continue; } }
  case 0x8001ae08:
    { const c = (v0 | 0) === (t7 | 0); t7 = (0 + 238) | 0; if (c) { pc = 0x8001ae20; continue; } }
  case 0x8001ae10:
    v0 = m.read(((sp) + 104) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0); t7 = (0 + 229) | 0; if (c) { pc = 0x8001ae24; continue; } }
  case 0x8001ae20:
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001ae24:
    a1 = (a1 + 3) | 0;
    s4 = (s4 + 3) | 0; pc = 0x8001adc0; continue;
  case 0x8001ae30:
    v1 = a2 & 65535;
    { const c = (v1 | 0) === 0;  if (c) { pc = 0x8001aee8; continue; } }
  case 0x8001ae3c:
    v0 = m.read(((0x8007913c) + 1168) >>> 0, 4) | 0;
    s3 = (v0 + v1) | 0;
  case 0x8001ae48:
    v0 = m.read(((s3) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0; t7 = 0x80200000 | 0; if (c) { pc = 0x8001ae6c; continue; } }
  case 0x8001ae58:
    v0 = m.read(((s3) + 1) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001aee8; continue; } }
  case 0x8001ae68:
    t7 = 0x80200000 | 0;
  case 0x8001ae6c:
    t7 = (t7 + -15784) | 0;
    v0 = m.read(((s3) + 1) >>> 0, 1);
    v1 = m.read(((s3) + 0) >>> 0, 1);
    v0 = v0 << 8;
    v1 = (v1 + v0) | 0;
    v0 = v1 & 32767;
    v0 = (v0 + t7) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0; a3 = v1 | 0; if (c) { pc = 0x8001aeb8; continue; } }
  case 0x8001ae98:
    t7 = (0 + 3) | 0;
    { const c = (v0 | 0) !== (t7 | 0);  if (c) { pc = 0x8001aeac; continue; } }
  case 0x8001aea4:
    t0 = (0 + 238) | 0; pc = 0x8001aeb8; continue;
  case 0x8001aeac:
    { const c = (t0 | 0) === (s5 | 0); v0 = a3 & 32768; if (c) { pc = 0x8001aebc; continue; } }
  case 0x8001aeb4:
    t0 = (0 + 229) | 0;
  case 0x8001aeb8:
    v0 = a3 & 32768;
  case 0x8001aebc:
    { const c = (v0 | 0) === 0; s3 = (s3 + 2) | 0; if (c) { pc = 0x8001ae68; continue; } }
  case 0x8001aec4:
    v1 = (0 + 255) | 0;
  case 0x8001aec8:
    v0 = m.read(((s3) + 0) >>> 0, 1);
    { const c = (v0 | 0) === (v1 | 0);  if (c) { pc = 0x8001aee0; continue; } }
  case 0x8001aed8:
    s3 = (s3 + 1) | 0; pc = 0x8001aec8; continue;
  case 0x8001aee0:
    s3 = (s3 + 1) | 0; pc = 0x8001ae48; continue;
  case 0x8001aee8:
    v0 = m.read(((sp) + 104) >>> 0, 1);
    v0 = (t0 >>> 0) < (v0 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8001af00; continue; } }
  case 0x8001aefc:
    m.write(((sp) + 104) >>> 0, t0 & 0xff, 1);
  case 0x8001af00:
    v1 = m.read(((sp) + 80) >>> 0, 2);
    v0 = s0 & 255;
    { const c = (v1 | 0) !== (v0 | 0); v0 = s2 & 255; if (c) { pc = 0x8001af24; continue; } }
  case 0x8001af10:
    v1 = m.read(((sp) + 88) >>> 0, 2);
    { const c = (v1 | 0) !== (v0 | 0); t7 = (0 + 14) | 0; if (c) { pc = 0x8001af24; continue; } }
  case 0x8001af20:
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001af24:
    v0 = m.read(((sp) + 104) >>> 0, 1);
    { const c = (v0 | 0) === 0; a0 = s0 & 255; if (c) { pc = 0x8001af5c; continue; } }
  case 0x8001af34:
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a0 = a0 << 3;
    a0 = (a0 + 252) | 0;
    a1 = s1 << 1;
    a1 = (a1 + s1) | 0;
    a1 = a1 << 1;
    a1 = (a1 + 67) | 0;
    a2 = (0 + 7) | 0;
    a3 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8001af5c:
    a0 = s0 & 255;
    v1 = 0x801f0000 | 0;
    v1 = (v1 + 29272) | 0;
    v0 = a0 << 1;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 3;
    v0 = (v0 + v1) | 0;
    v0 = (v0 + s1) | 0;
    t7 = m.read(((sp) + 104) >>> 0, 1);
    s0 = (s0 + 1) | 0;
    m.write(((v0) + 0) >>> 0, t7 & 0xff, 1);
    v0 = s0 & 255;
    v0 = (v0 >>> 0) < 7 ? 1 : 0;
    { const c = (v0 | 0) !== 0; t0 = 0 | 0; if (c) { pc = 0x8001ad84; continue; } }
  case 0x8001af98:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 255;
    v0 = (v0 >>> 0) < 24 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 248) | 0; if (c) { pc = 0x8001ad78; continue; } }
  case 0x8001afac:
    a1 = (0 + 41) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28292) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001afc0:
    a0 = m.read(((sp) + 80) >>> 0, 2);
    v1 = m.read(((sp) + 88) >>> 0, 2);
    t7 = m.read(((sp) + 96) >>> 0, 4) | 0;
    v0 = v1 << 3;
    v0 = (v0 - v1) | 0;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 1;
    v0 = (v0 + t7) | 0;
    a0 = m.read(((v0) + 0) >>> 0, 2);
    { const c = (a0 | 0) === 0; s3 = 0 | 0; if (c) { pc = 0x8001b1f0; continue; } }
  case 0x8001aff0:
    t6 = m.read(((sp) + 48) >>> 0, 2);
    t7 = 0xaaaa0000 | 0;
    t7 = t7 | 43691;
    [hi, lo] = mult(t6, t7, false);
    a1 = hi;
    t5 = m.read(((sp) + 56) >>> 0, 2);
    [hi, lo] = mult(t5, t7, false);
    v0 = 0x801f0000 | 0;
    v1 = m.read(((0x8007913c) + 1008) >>> 0, 4) | 0;
    t4 = (v0 + 29872) | 0;
    s4 = (v1 + a0) | 0;
    t1 = (s4 + 1) | 0;
    t3 = (a1 >>> 2) | 0;
    t0 = hi;
    t2 = (t0 >>> 2) | 0;
  case 0x8001b030:
    v1 = m.read(((s4) + 0) >>> 0, 1);
    a0 = v1 & 255;
    { const c = (a0 | 0) !== 0; s6 = v1 & 63; if (c) { pc = 0x8001b054; continue; } }
  case 0x8001b044:
    v0 = m.read(((t1) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001b1f0; continue; } }
  case 0x8001b054:
    a0 = (a0 >>> 6) | 0;
    t7 = 0x801f0000 | 0;
    t7 = (t7 + 23864) | 0;
    v1 = m.read(((t1) + 1) >>> 0, 1);
    v0 = m.read(((t1) + 0) >>> 0, 1);
    s0 = (v1 >>> 4) | 0;
    v0 = v0 << 2;
    a0 = a0 | v0;
    a3 = a0 | 0;
    a1 = a3 & 65535;
    v0 = (a1 + t7) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0; s2 = v1 & 15; if (c) { pc = 0x8001b1e4; continue; } }
  case 0x8001b090:
    t0 = 0 | 0;
    v0 = (a0 + -2) | 0;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a2 = (0 + 52) | 0; if (c) { pc = 0x8001b0c8; continue; } }
  case 0x8001b0a4:
    v0 = (0 + 6) | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = (0 + 17) | 0; if (c) { pc = 0x8001b0c8; continue; } }
  case 0x8001b0b0:
    { const c = (a1 | 0) === (v0 | 0); v0 = (0 + 21) | 0; if (c) { pc = 0x8001b0c8; continue; } }
  case 0x8001b0b8:
    { const c = (a1 | 0) === (v0 | 0); v0 = (0 + 25) | 0; if (c) { pc = 0x8001b0c8; continue; } }
  case 0x8001b0c0:
    { const c = (a1 | 0) !== (v0 | 0); v1 = a3 & 65535; if (c) { pc = 0x8001b0d0; continue; } }
  case 0x8001b0c8:
    a2 = (0 + 51) | 0;
    v1 = a3 & 65535;
  case 0x8001b0d0:
    v0 = (0 + 205) | 0;
    { const c = (v1 | 0) !== (v0 | 0); v0 = (s6 + -7) | 0; if (c) { pc = 0x8001b0e0; continue; } }
  case 0x8001b0dc:
    a2 = (0 + 53) | 0;
  case 0x8001b0e0:
    v0 = (v0 >>> 0) < 4 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = (s6 >>> 0) < 7 ? 1 : 0; if (c) { pc = 0x8001b16c; continue; } }
  case 0x8001b0ec:
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 8 ? 1 : 0; if (c) { pc = 0x8001b10c; continue; } }
  case 0x8001b0f4:
    v0 = (a2 + t4) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 8 ? 1 : 0; if (c) { pc = 0x8001b10c; continue; } }
  case 0x8001b108:
    t0 = (0 + 1) | 0;
  case 0x8001b10c:
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 9 ? 1 : 0; if (c) { pc = 0x8001b12c; continue; } }
  case 0x8001b114:
    v0 = (a2 + t4) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 9 ? 1 : 0; if (c) { pc = 0x8001b12c; continue; } }
  case 0x8001b128:
    t0 = (0 + 1) | 0;
  case 0x8001b12c:
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 10 ? 1 : 0; if (c) { pc = 0x8001b14c; continue; } }
  case 0x8001b134:
    v0 = (a2 + t4) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (s6 >>> 0) < 10 ? 1 : 0; if (c) { pc = 0x8001b14c; continue; } }
  case 0x8001b148:
    t0 = (0 + 1) | 0;
  case 0x8001b14c:
    { const c = (v0 | 0) !== 0; v0 = t0 & 255; if (c) { pc = 0x8001b170; continue; } }
  case 0x8001b154:
    v0 = (a2 + t4) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = t0 & 255; if (c) { pc = 0x8001b170; continue; } }
  case 0x8001b168:
    t0 = (0 + 1) | 0;
  case 0x8001b16c:
    v0 = t0 & 255;
  case 0x8001b170:
    { const c = (v0 | 0) !== 0; v0 = a3 & 65535; if (c) { pc = 0x8001b1e4; continue; } }
  case 0x8001b178:
    t7 = 0x801f0000 | 0;
    t7 = (t7 + 23864) | 0;
    v0 = (v0 + t7) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    t7 = (0 + 1) | 0;
    { const c = (v0 | 0) !== (t7 | 0); v0 = t3 << 1; if (c) { pc = 0x8001b1a4; continue; } }
  case 0x8001b194:
    t7 = m.read(((sp) + 104) >>> 0, 1);
    t7 = (t7 + -6) | 0;
    m.write(((sp) + 104) >>> 0, t7 & 0xff, 1);
  case 0x8001b1a4:
    v0 = (v0 + t3) | 0;
    v0 = v0 << 1;
    v0 = (t6 - v0) | 0;
    v0 = v0 & 65535;
    v1 = s0 & 255;
    { const c = (v0 | 0) !== (v1 | 0); v0 = t2 << 1; if (c) { pc = 0x8001b1e4; continue; } }
  case 0x8001b1c0:
    v0 = (v0 + t2) | 0;
    v0 = v0 << 1;
    v0 = (t5 - v0) | 0;
    v0 = v0 & 65535;
    v1 = s2 & 255;
    { const c = (v0 | 0) !== (v1 | 0);  if (c) { pc = 0x8001b1e4; continue; } }
  case 0x8001b1dc:
    s3 = a3 | 0;
    m.write(((sp) + 112) >>> 0, s6 & 0xff, 1);
  case 0x8001b1e4:
    t1 = (t1 + 3) | 0;
    s4 = (s4 + 3) | 0; pc = 0x8001b030; continue;
  case 0x8001b1f0:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8001b208:
    v0 = s3 & 65535;
    { const c = (v0 | 0) === 0; a1 = (s3 + -1) | 0; if (c) { pc = 0x8001b234; continue; } }
  case 0x8001b214:
    a0 = m.read(((0x8007913c) + 808) >>> 0, 4) | 0;
    a1 = a1 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80044e10, a0, a1, a2, a3);
  case 0x8001b220:
    a0 = (0 + 16) | 0;
    a1 = (0 + 13) | 0;
    a2 = v0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001b234:
    s1 = 0 | 0;
    t7 = (0 + 1) | 0;
  case 0x8001b23c:
    s5 = m.read(((sp) + 80) >>> 0, 1);
    v0 = m.read(((sp) + 40) >>> 0, 1);
    s6 = m.read(((sp) + 88) >>> 0, 1);
    { const c = (v0 | 0) !== (t7 | 0); v0 = s3 & 65535; if (c) { pc = 0x8001b308; continue; } }
  case 0x8001b250:
    { const c = (v0 | 0) === 0; a0 = 0 | 0; if (c) { pc = 0x8001b26c; continue; } }
  case 0x8001b258:
    a2 = m.read(((sp) + 48) >>> 0, 2);
    t7 = 0xaaaa0000 | 0;
    t7 = t7 | 43691;
    [hi, lo] = mult(a2, t7, false); pc = 0x8001b280; continue;
  case 0x8001b26c:
    a2 = m.read(((sp) + 48) >>> 0, 2);
    t7 = 0xaaaa0000 | 0;
    t7 = t7 | 43691;
    [hi, lo] = mult(a2, t7, false);
    a0 = (0 + 1) | 0;
  case 0x8001b280:
    a3 = (0 + 30) | 0;
    t0 = m.read(((sp) + 56) >>> 0, 2);
    v0 = (0 + 20) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 200) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v1 = hi;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    [hi, lo] = mult(t0, t7, false);
    v1 = (v1 >>> 2) | 0;
    v0 = v1 << 1;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 1;
    a2 = (a2 - v0) | 0;
    a2 = a2 & 65535;
    a1 = a2 << 3;
    a1 = (a1 + a2) | 0;
    a1 = a1 << 2;
    a1 = (a1 + 12) | 0;
    a1 = a1 & 65532;
    t1 = hi;
    v1 = (t1 >>> 2) | 0;
    v0 = v1 << 1;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 1;
    t0 = (t0 - v0) | 0;
    t0 = t0 & 65535;
    a2 = t0 << 3;
    a2 = (a2 - t0) | 0;
    a2 = a2 << 2;
    a2 = (a2 + 47) | 0;
    a2 = a2 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8001575c, a0, a1, a2, a3);
  case 0x8001b308:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8001b310:
    offer(ctx, [box(100000, 0, 0, 320, 240)], () => 0, ["up", "down"], { 100000: "select" });
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8001b318:
    v0 = m.read(((sp) + 40) >>> 0, 1);
    { const c = (v0 | 0) !== 0; t7 = (0 + 1) | 0; if (c) { pc = 0x80019f70; continue; } }
  case 0x8001b328:
     [v0, v1] = yield* call(ctx, sp, 0x80026220, a0, a1, a2, a3);
  case 0x8001b330:
    v1 = m.read(((sp) + 40) >>> 0, 1);
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8001b348; continue; } }
  case 0x8001b340:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8001b348:
    v0 = m.read(((sp) + 116) >>> 0, 4) | 0;
    fp = m.read(((sp) + 176) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 172) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 168) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 164) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 160) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 156) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 152) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 148) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 144) >>> 0, 4) | 0;
    sp = (sp + 184) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`flowChart: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001575c, translated instruction by instruction (390 instructions).
export function* f8001575c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001575c;
  for (;;) switch (pc) {
  case 0x8001575c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28064) >>> 0, 4) | 0;
    sp = (sp + -128) | 0;
    m.write(((sp) + 40) >>> 0, a1 >>> 0, 4);
    a0 = m.read(((sp) + 40) >>> 0, 2);
    m.write(((sp) + 112) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, a2 >>> 0, 4);
    s6 = m.read(((sp) + 44) >>> 0, 2);
    t3 = m.read(((sp) + 144) >>> 0, 4) | 0;
    m.write(((sp) + 48) >>> 0, a3 >>> 0, 4);
    a2 = m.read(((sp) + 48) >>> 0, 2);
    a1 = m.read(((sp) + 148) >>> 0, 1);
    a3 = m.read(((sp) + 152) >>> 0, 1);
    t0 = m.read(((sp) + 156) >>> 0, 1);
    m.write(((sp) + 124) >>> 0, 0, 4);
    m.write(((sp) + 120) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 116) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 108) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 104) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 100) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 96) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 92) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 88) >>> 0, s0 >>> 0, 4);
    v0 = v0 >> 2;
    m.write(((sp) + 52) >>> 0, t3 >>> 0, 4);
    s5 = m.read(((sp) + 52) >>> 0, 2);
    { const c = (v0 | 0) >= 0; v1 = v0 | 0; if (c) { pc = 0x800157d0; continue; } }
  case 0x800157cc:
    v1 = (v0 + 7) | 0;
  case 0x800157d0:
    s7 = (0 + 204) | 0;
    a1 = a1 & 255;
    [hi, lo] = mult(a1, s7, true);
    t1 = lo;
    a3 = a3 & 255;
    [hi, lo] = mult(a3, s7, true);
    a0 = a0 & 65535;
    s6 = s6 & 65535;
    m.write(((sp) + 56) >>> 0, a1 >>> 0, 4);
    a1 = s6 | 0;
    a2 = a2 & 65535;
    s5 = s5 & 65535;
    v1 = v1 >> 3;
    v1 = v1 << 3;
    v1 = (v0 - v1) | 0;
    t0 = t0 & 255;
    v0 = 0x80070000 | 0;
    t2 = lo;
    v0 = (v0 + -32592) | 0;
    v1 = (v1 + v0) | 0;
    [hi, lo] = mult(t0, s7, true);
    m.write(((sp) + 60) >>> 0, a3 >>> 0, 4);
    m.write(((sp) + 64) >>> 0, t0 >>> 0, 4);
    s0 = m.read(((v1) + 0) >>> 0, 1);
    fp = 0x50000000 | 0;
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    a3 = s5 | 0;
    v0 = (t1 >>> 8) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (t2 >>> 8) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    t0 = lo;
    v0 = (t0 >>> 8) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015864:
    s0 = s0 & 65535;
    v1 = (s0 + 1) | 0;
    v0 = v1 << 1;
    v0 = (v0 + v1) | 0;
    v1 = v0 << 4;
    t3 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s7 = (v0 + v1) | 0;
    [hi, lo] = mult(t3, s7, true);
    v1 = lo;
    t3 = m.read(((sp) + 60) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    t4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    a3 = (0 + 1) | 0;
    m.write(((sp) + 68) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    s4 = (t4 + -1) | 0;
    s4 = s4 & 65535;
    a0 = s4 | 0;
    t3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    t4 = m.read(((sp) + 48) >>> 0, 4) | 0;
    v0 = (t3 + -1) | 0;
    t0 = lo;
    t3 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s0 = (t4 + 2) | 0;
    [hi, lo] = mult(t3, s7, true);
    s0 = s0 & 65535;
    a2 = s0 | 0;
    s3 = v1 >> 8;
    s3 = s3 & 255;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    v0 = v0 & 65535;
    a1 = v0 | 0;
    m.write(((sp) + 72) >>> 0, v0 >>> 0, 4);
    s2 = t0 >> 8;
    s2 = s2 & 255;
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    v0 = lo;
    s1 = v0 >> 8;
    s1 = s1 & 255;
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015910:
    a0 = s4 | 0;
    a2 = s0 | 0;
    t4 = m.read(((sp) + 44) >>> 0, 4) | 0;
    t3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    t4 = (t4 + t3) | 0;
    m.write(((sp) + 76) >>> 0, t4 >>> 0, 4);
    a1 = m.read(((sp) + 76) >>> 0, 2);
    a3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015948:
    a0 = s4 | 0;
    a1 = s6 | 0;
    a2 = (0 + 1) | 0;
    a3 = s5 | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015970:
    a1 = s6 | 0;
    a2 = (0 + 1) | 0;
    t4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    t3 = m.read(((sp) + 48) >>> 0, 4) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    t4 = (t4 + t3) | 0;
    m.write(((sp) + 80) >>> 0, t4 >>> 0, 4);
    a0 = m.read(((sp) + 80) >>> 0, 2);
    a3 = s5 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x800159a8:
    t4 = m.read(((sp) + 68) >>> 0, 4) | 0;
    { const c = (t4 | 0) === 0; s7 = (s7 + -51) | 0; if (c) { pc = 0x80015d40; continue; } }
  case 0x800159b8:
    t3 = m.read(((sp) + 56) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    v1 = lo;
    t3 = m.read(((sp) + 60) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    t4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    a3 = (0 + 1) | 0;
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    s4 = (t4 + -2) | 0;
    s4 = s4 & 65535;
    t3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    a0 = s4 | 0;
    v0 = (t3 + -2) | 0;
    t0 = lo;
    t3 = m.read(((sp) + 64) >>> 0, 4) | 0;
    t4 = m.read(((sp) + 48) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    s0 = (t4 + 4) | 0;
    s0 = s0 & 65535;
    a2 = s0 | 0;
    s3 = v1 >> 8;
    s3 = s3 & 255;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    s6 = v0 & 65535;
    a1 = s6 | 0;
    s2 = t0 >> 8;
    s2 = s2 & 255;
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    v0 = lo;
    s1 = v0 >> 8;
    s1 = s1 & 255;
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015a48:
    a0 = s4 | 0;
    a2 = s0 | 0;
    t4 = m.read(((sp) + 76) >>> 0, 4) | 0;
    a3 = (0 + 1) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    a1 = (t4 + 1) | 0;
    a1 = a1 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015a78:
    a0 = s4 | 0;
    a1 = m.read(((sp) + 72) >>> 0, 4) | 0;
    t3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    a2 = (0 + 1) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    s0 = (t3 + 2) | 0;
    s0 = s0 & 65535;
    a3 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015aac:
    a2 = (0 + 1) | 0;
    t4 = m.read(((sp) + 80) >>> 0, 4) | 0;
    a1 = m.read(((sp) + 72) >>> 0, 4) | 0;
    a3 = s0 | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    a0 = (t4 + 1) | 0;
    a0 = a0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015adc:
    t3 = m.read(((sp) + 68) >>> 0, 4) | 0;
    v0 = (0 + 1) | 0;
    { const c = (t3 | 0) === (v0 | 0); s7 = (s7 + -51) | 0; if (c) { pc = 0x80015d40; continue; } }
  case 0x80015aec:
    t3 = m.read(((sp) + 56) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    v1 = lo;
    t3 = m.read(((sp) + 60) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    t4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    a3 = (0 + 1) | 0;
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    s4 = (t4 + -3) | 0;
    s4 = s4 & 65535;
    t3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    a0 = s4 | 0;
    v0 = (t3 + -3) | 0;
    t0 = lo;
    t3 = m.read(((sp) + 64) >>> 0, 4) | 0;
    t4 = m.read(((sp) + 48) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    s0 = (t4 + 6) | 0;
    s0 = s0 & 65535;
    a2 = s0 | 0;
    s3 = v1 >> 8;
    s3 = s3 & 255;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    s5 = v0 & 65535;
    a1 = s5 | 0;
    s2 = t0 >> 8;
    s2 = s2 & 255;
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    v0 = lo;
    s1 = v0 >> 8;
    s1 = s1 & 255;
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015b7c:
    a0 = s4 | 0;
    a2 = s0 | 0;
    t4 = m.read(((sp) + 76) >>> 0, 4) | 0;
    a3 = (0 + 1) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    a1 = (t4 + 2) | 0;
    a1 = a1 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015bac:
    a0 = s4 | 0;
    a1 = s6 | 0;
    t3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    a2 = (0 + 1) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    s0 = (t3 + 4) | 0;
    s0 = s0 & 65535;
    a3 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015be0:
    a1 = s6 | 0;
    a2 = (0 + 1) | 0;
    t4 = m.read(((sp) + 80) >>> 0, 4) | 0;
    a3 = s0 | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    a0 = (t4 + 2) | 0;
    a0 = a0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015c10:
    t3 = m.read(((sp) + 68) >>> 0, 4) | 0;
    v0 = (0 + 2) | 0;
    { const c = (t3 | 0) === (v0 | 0); s7 = (s7 + -51) | 0; if (c) { pc = 0x80015d40; continue; } }
  case 0x80015c20:
    t3 = m.read(((sp) + 56) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    v0 = lo;
    t3 = m.read(((sp) + 60) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    t4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    a3 = (0 + 1) | 0;
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    s4 = (t4 + -4) | 0;
    t3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s4 = s4 & 65535;
    a1 = (t3 + -4) | 0;
    v1 = lo;
    t3 = m.read(((sp) + 64) >>> 0, 4) | 0;
    t4 = m.read(((sp) + 48) >>> 0, 4) | 0;
    [hi, lo] = mult(t3, s7, true);
    a0 = s4 | 0;
    s0 = (t4 + 8) | 0;
    s0 = s0 & 65535;
    a2 = s0 | 0;
    s3 = v0 >> 8;
    s3 = s3 & 255;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    a1 = a1 & 65535;
    s2 = v1 >> 8;
    s2 = s2 & 255;
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    t0 = lo;
    s1 = t0 >> 8;
    s1 = s1 & 255;
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015cac:
    a0 = s4 | 0;
    a2 = s0 | 0;
    t4 = m.read(((sp) + 76) >>> 0, 4) | 0;
    a3 = (0 + 1) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    a1 = (t4 + 3) | 0;
    a1 = a1 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015cdc:
    a0 = s4 | 0;
    a1 = s5 | 0;
    t3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    a2 = (0 + 1) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    s0 = (t3 + 6) | 0;
    s0 = s0 & 65535;
    a3 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015d10:
    a1 = s5 | 0;
    a2 = (0 + 1) | 0;
    t4 = m.read(((sp) + 80) >>> 0, 4) | 0;
    a3 = s0 | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 32) >>> 0, 0 >>> 0, 4);
    a0 = (t4 + 3) | 0;
    a0 = a0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80015d40:
    fp = m.read(((sp) + 120) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 116) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 112) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 108) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 104) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 100) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 96) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 92) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 88) >>> 0, 4) | 0;
    sp = (sp + 128) | 0;
     return v0;
  default: throw new Error(`f8001575c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80019544, translated instruction by instruction (80 instructions).
export function f80019544(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80019544;
  for (;;) switch (pc) {
  case 0x80019544:
    a0 = 0 | 0;
    v0 = 0x801f0000 | 0;
    a1 = (v0 + 23488) | 0;
    v1 = a0 & 65535;
  case 0x80019554:
    v1 = (v1 + a1) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 0) >>> 0, v0 & 0xff, 1);
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 300 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = a0 & 65535; if (c) { pc = 0x80019554; continue; } }
  case 0x80019578:
    a0 = 0 | 0;
    v0 = 0x801f0000 | 0;
    a1 = (v0 + 23864) | 0;
    v1 = a0 & 65535;
  case 0x80019588:
    v1 = (v1 + a1) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 0) >>> 0, v0 & 0xff, 1);
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 300 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = a0 & 65535; if (c) { pc = 0x80019588; continue; } }
  case 0x800195ac:
    a0 = 0 | 0;
    v0 = 0x80200000 | 0;
    a1 = (v0 + -22736) | 0;
    v1 = a0 & 65535;
  case 0x800195bc:
    v1 = (v1 + a1) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 0) >>> 0, v0 & 0xff, 1);
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 512 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = a0 & 65535; if (c) { pc = 0x800195bc; continue; } }
  case 0x800195e0:
    a0 = 0 | 0;
    v0 = 0x80200000 | 0;
    a1 = (v0 + -15784) | 0;
    v1 = a0 & 65535;
  case 0x800195f0:
    v1 = (v1 + a1) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 0) >>> 0, v0 & 0xff, 1);
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 512 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = a0 & 65535; if (c) { pc = 0x800195f0; continue; } }
  case 0x80019614:
    a0 = 0 | 0;
    v0 = 0x801d0000 | 0;
    a1 = (v0 + 24848) | 0;
    v1 = a0 & 65535;
  case 0x80019624:
    v1 = (v1 + a1) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    v0 = v0 & 85;
    m.write(((v1) + 0) >>> 0, v0 & 0xff, 1);
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 300 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = a0 & 65535; if (c) { pc = 0x80019624; continue; } }
  case 0x80019648:
    a0 = 0 | 0;
    v0 = 0x801d0000 | 0;
    a1 = (v0 + 25896) | 0;
  case 0x80019654:
    v1 = a0 & 65535;
    v1 = (v1 + a1) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    v0 = v0 & 85;
    m.write(((v1) + 0) >>> 0, v0 & 0xff, 1);
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 300 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80019654; continue; } }
  case 0x8001967c:
     return v0;
  default: throw new Error(`f80019544: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80019738, translated instruction by instruction (244 instructions).
export function* f80019738(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80019738;
  for (;;) switch (pc) {
  case 0x80019738:
    sp = (sp + -80) | 0;
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = a2 | 0;
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    s5 = s0 | 0;
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    s6 = a0 | 0;
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    s7 = a1 | 0;
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    s4 = a3 | 0;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    s3 = s4 & 65535;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = m.read(((sp) + 96) >>> 0, 1);
    v0 = (s3 >>> 0) < 301 ? 1 : 0;
    m.write(((sp) + 76) >>> 0, 0, 4);
    m.write(((sp) + 72) >>> 0, fp >>> 0, 4);
    { const c = (v0 | 0) !== 0; m.write(((sp) + 48) >>> 0, s2 >>> 0, 4); if (c) { pc = 0x800197a4; continue; } }
  case 0x80019788:
    a0 = (0 + 5) | 0;
    a1 = (0 + 20) | 0;
    a2 = s3 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044f7c, a0, a1, a2, a3);
  case 0x80019798:
    a0 = 0x80010000 | 0;
    a0 = (a0 + 4276) | 0; [v0, v1] = yield* call(ctx, sp, 0x80035568, a0, a1, a2, a3);
  case 0x800197a4:
    v0 = 0x801d0000 | 0;
    v0 = (v0 + 24848) | 0;
    v0 = (s3 + v0) | 0;
    a0 = m.read(((v0) + 0) >>> 0, 1);
    a1 = (0 + 3) | 0;
    v1 = a0 & 3;
    v0 = v1 ^ 1;
    v0 = (0 >>> 0) < (v0 >>> 0) ? 1 : 0;
    { const c = (v1 | 0) !== (a1 | 0); m.write(((sp) + 16) >>> 0, v0 & 0xff, 1); if (c) { pc = 0x800197d4; continue; } }
  case 0x800197cc:
    t0 = (0 + 2) | 0;
    m.write(((sp) + 16) >>> 0, t0 & 0xff, 1);
  case 0x800197d4:
    a0 = a0 & 255;
    v1 = (a0 >>> 2) | 0;
    v1 = v1 & 3;
    v0 = v1 ^ 1;
    v0 = (0 >>> 0) < (v0 >>> 0) ? 1 : 0;
    { const c = (v1 | 0) !== (a1 | 0); m.write(((sp) + 24) >>> 0, v0 & 0xff, 1); if (c) { pc = 0x800197f8; continue; } }
  case 0x800197f0:
    t0 = (0 + 2) | 0;
    m.write(((sp) + 24) >>> 0, t0 & 0xff, 1);
  case 0x800197f8:
    v1 = (a0 >>> 4) | 0;
    v1 = v1 & 3;
    v0 = v1 ^ 1;
    v0 = (0 >>> 0) < (v0 >>> 0) ? 1 : 0;
    { const c = (v1 | 0) !== (a1 | 0); m.write(((sp) + 32) >>> 0, v0 & 0xff, 1); if (c) { pc = 0x80019818; continue; } }
  case 0x80019810:
    t0 = (0 + 2) | 0;
    m.write(((sp) + 32) >>> 0, t0 & 0xff, 1);
  case 0x80019818:
    v1 = (a0 >>> 6) | 0;
    v0 = v1 ^ 1;
    v0 = (0 >>> 0) < (v0 >>> 0) ? 1 : 0;
    { const c = (v1 | 0) !== (a1 | 0); fp = v0 | 0; if (c) { pc = 0x80019830; continue; } }
  case 0x8001982c:
    fp = (0 + 2) | 0;
  case 0x80019830:
    v0 = (0 + 5) | 0;
    { const c = (s3 | 0) !== (v0 | 0); v1 = s4 & 65535; if (c) { pc = 0x80019858; continue; } }
  case 0x8001983c:
    v0 = 0x801f0000 | 0;
    v0 = m.read(((v0) + 29917) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (0 + 22) | 0; if (c) { pc = 0x8001985c; continue; } }
  case 0x80019850:
    s5 = (s0 + -1) | 0;
    v1 = s4 & 65535;
  case 0x80019858:
    v0 = (0 + 22) | 0;
  case 0x8001985c:
    { const c = (v1 | 0) !== (v0 | 0); v0 = 0x51eb0000 | 0; if (c) { pc = 0x8001987c; continue; } }
  case 0x80019864:
    v0 = 0x801f0000 | 0;
    v0 = m.read(((v0) + 29916) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = 0x51eb0000 | 0; if (c) { pc = 0x8001987c; continue; } }
  case 0x80019878:
    s5 = (s5 + -1) | 0;
  case 0x8001987c:
    v0 = v0 | 34079;
    s0 = s4 & 65535;
    [hi, lo] = mult(s0, v0, false);
    t1 = hi;
    v0 = 0xcccc0000 | 0;
    v0 = v0 | 52429;
    [hi, lo] = mult(s0, v0, false);
    v1 = hi;
    a0 = (t1 >>> 5) | 0;
    a0 = a0 & 65535;
    [hi, lo] = mult(a0, v0, false);
    at = 0x80080000 | 0;
    m.write(((at) + -27939) >>> 0, s1 & 0xff, 1);
    t1 = hi;
    v1 = (v1 >>> 3) | 0;
    a1 = v1 & 65535;
    [hi, lo] = mult(a1, v0, false);
    s2 = (s6 + 6) | 0;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 1;
    s1 = (s0 - v0) | 0;
    v1 = (t1 >>> 3) | 0;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 1;
    a2 = (a0 - v0) | 0;
    a3 = hi;
    v1 = (a3 >>> 3) | 0;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 1;
    s4 = (a1 - v0) | 0;
    v0 = (s0 >>> 0) < 100 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s3 = (s7 + 1) | 0; if (c) { pc = 0x80019920; continue; } }
  case 0x8001990c:
    a0 = s2 & 65535;
    a1 = s3 & 65535;
    a2 = a2 & 65535;
    a2 = (a2 + 48) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019920:
    v0 = (s0 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a1 = s3 & 65535; if (c) { pc = 0x80019940; continue; } }
  case 0x8001992c:
    a0 = s2 & 65535;
    a0 = (a0 + 6) | 0;
    a2 = s4 & 65535;
    a2 = (a2 + 48) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019940:
    a0 = s2 & 65535;
    a0 = (a0 + 12) | 0;
    a1 = s3 & 65535;
    a2 = s1 & 65535;
    a2 = (a2 + 48) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019958:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80019960:
    v0 = (0 + 3) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27939) >>> 0, v0 & 0xff, 1);
    s0 = s5 & 255;
    v0 = (s0 >>> 0) < 11 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = 0x80010000 | 0; if (c) { pc = 0x80019a30; continue; } }
  case 0x8001997c:
    v0 = (v0 + 5016) | 0;
    v1 = s0 << 2;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x80019998:
    a0 = fp | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800199a0:
    a0 = s6 & 65535;
    a0 = (a0 + 24) | 0;
    a1 = s7 & 65535;
    a1 = (a1 + 11) | 0;
    a2 = (0 + 68) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x800199b8:
    t0 = m.read(((sp) + 32) >>> 0, 1);
    a0 = t0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800199c4:
    a0 = s6 & 65535;
    a0 = (a0 + 16) | 0;
    a1 = s7 & 65535;
    a1 = (a1 + 11) | 0;
    a2 = (0 + 67) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x800199dc:
    t0 = m.read(((sp) + 24) >>> 0, 1);
    a0 = t0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800199e8:
    s1 = s6 & 65535;
    a0 = (s1 + 8) | 0;
    s0 = s7 & 65535;
    s0 = (s0 + 11) | 0;
    a1 = s0 | 0;
    a2 = (0 + 66) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019a04:
    t0 = m.read(((sp) + 16) >>> 0, 1);
    a0 = t0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80019a10:
    a0 = s1 | 0;
    a1 = s0 | 0;
    a2 = (0 + 65) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019a20:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80019a28:
     pc = 0x80019ac4; continue;
  case 0x80019a30:
    s2 = s6 & 65535;
    a0 = s2 | 0;
    s1 = s7 & 65535;
    s1 = (s1 + 11) | 0;
    a1 = s1 | 0;
    a2 = (0 + 69) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019a4c:
    a0 = (s2 + 6) | 0;
    a1 = s1 | 0;
    a2 = (0 + 78) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019a5c:
    a0 = (s2 + 12) | 0;
    a1 = s1 | 0;
    a2 = (0 + 68) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019a6c:
    v0 = 0x66660000 | 0;
    v0 = v0 | 26215;
    s0 = (s0 + -10) | 0;
    [hi, lo] = mult(s0, v0, true);
    a0 = (s2 + 18) | 0;
    a1 = s1 | 0;
    v0 = s0 >> 31;
    t0 = hi;
    a2 = t0 >> 2;
    a2 = (a2 - v0) | 0;
    v0 = a2 << 2;
    v0 = (v0 + a2) | 0;
    v0 = v0 << 1;
    s0 = (s0 - v0) | 0;
    a2 = a2 & 65535;
    a2 = (a2 + 48) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019ab0:
    a0 = (s2 + 24) | 0;
    a1 = s1 | 0;
    s0 = s0 & 65535;
    a2 = (s0 + 48) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037344, a0, a1, a2, a3);
  case 0x80019ac4:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80019acc:
    at = 0x80080000 | 0;
    m.write(((at) + -27939) >>> 0, 0 & 0xff, 1);
    fp = m.read(((sp) + 72) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 80) | 0;
     return v0;
  default: throw new Error(`f80019738: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80035568, translated instruction by instruction (23 instructions).
export function* f80035568(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80035568;
  for (;;) switch (pc) {
  case 0x80035568:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = a0 | 0;
    a0 = (0 + 5) | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80035584:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8003558c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80035594:
    a0 = (0 + 5) | 0;
    a1 = a0 | 0;
    a2 = s0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800355a8:
     pc = 0x80035584; continue;
  case 0x800355b0:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f80035568: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80037344, translated instruction by instruction (176 instructions).
export function* f80037344(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80037344;
  for (;;) switch (pc) {
  case 0x80037344:
    sp = (sp + -40) | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    s0 = a0 | 0;
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    s1 = a1 | 0;
    a2 = a2 & 65535;
    v1 = (a2 + -48) | 0;
    v0 = (v1 >>> 0) < 31 ? 1 : 0;
    { const c = (v0 | 0) === 0; m.write(((sp) + 32) >>> 0, 0, 4); if (c) { pc = 0x8003746c; continue; } }
  case 0x8003736c:
    v0 = 0x80010000 | 0;
    v0 = (v0 + 7452) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x8003738c:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19636) | 0; pc = 0x80037448; continue;
  case 0x80037398:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19588) | 0; pc = 0x80037448; continue;
  case 0x800373a4:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19540) | 0; pc = 0x80037448; continue;
  case 0x800373b0:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19492) | 0; pc = 0x80037448; continue;
  case 0x800373bc:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19444) | 0; pc = 0x80037448; continue;
  case 0x800373c8:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19396) | 0; pc = 0x80037448; continue;
  case 0x800373d4:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19348) | 0; pc = 0x80037448; continue;
  case 0x800373e0:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19300) | 0; pc = 0x80037448; continue;
  case 0x800373ec:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19252) | 0; pc = 0x80037448; continue;
  case 0x800373f8:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19204) | 0; pc = 0x80037448; continue;
  case 0x80037404:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19156) | 0; pc = 0x80037448; continue;
  case 0x80037410:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19108) | 0; pc = 0x80037448; continue;
  case 0x8003741c:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19060) | 0; pc = 0x80037448; continue;
  case 0x80037428:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -19012) | 0; pc = 0x80037448; continue;
  case 0x80037434:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -18964) | 0; pc = 0x80037448; continue;
  case 0x80037440:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -18916) | 0;
  case 0x80037448:
    v1 = m.read(((0x8007913c) + 415) >>> 0, 1);
    a2 = (0 + 48) | 0;
    a1 = 0x80090000 | 0;
    a1 = (a1 + -9248) | 0;
    v0 = v1 << 1;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 10;
    a1 = (v0 + a1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8003746c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27958) >>> 0, 1);
    v0 = (v0 >>> 0) < 16 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (0 + 256) | 0; if (c) { pc = 0x8003748c; continue; } }
  case 0x80037484:
    m.write(((sp) + 18) >>> 0, v0 & 0xffff, 2); pc = 0x80037490; continue;
  case 0x8003748c:
    m.write(((sp) + 18) >>> 0, 0 & 0xffff, 2);
  case 0x80037490:
    a2 = 0 | 0;
    v0 = (0 + 3) | 0;
    m.write(((sp) + 20) >>> 0, v0 & 0xffff, 2);
    v0 = (0 + 8) | 0;
    m.write(((sp) + 22) >>> 0, v0 & 0xffff, 2);
    v0 = 0x80090000 | 0;
    v1 = m.read(((0x8007913c) + 415) >>> 0, 1);
    v0 = (v0 + -9248) | 0;
    a0 = v1 << 1;
    a0 = (a0 + v1) | 0;
    a0 = a0 << 10;
    a1 = (a0 + v0) | 0;
    v0 = (s0 >>> 31) | 0;
    v0 = (s0 + v0) | 0;
    v0 = v0 >> 1;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27958) >>> 0, 1);
    a0 = m.read(((sp) + 18) >>> 0, 2);
    v1 = v1 & 15;
    v1 = v1 << 6;
    v1 = (v1 + v0) | 0;
    a0 = (a0 + s1) | 0;
    m.write(((sp) + 16) >>> 0, v1 & 0xffff, 2);
    m.write(((sp) + 18) >>> 0, a0 & 0xffff, 2);
  case 0x800374f0:
    v1 = m.read(((a1) + 0) >>> 0, 1);
    { const c = (v1 | 0) === 0;  if (c) { pc = 0x80037514; continue; } }
  case 0x80037500:
    v0 = m.read(((0x8007913c) + 416) >>> 0, 1);
    v0 = v0 << 4;
    v0 = (v1 + v0) | 0;
    m.write(((a1) + 0) >>> 0, v0 & 0xff, 1);
  case 0x80037514:
    v1 = (m.read(((sp) + 20) >>> 0, 2) << 16) >> 16;
    v0 = (m.read(((sp) + 22) >>> 0, 2) << 16) >> 16;
    [hi, lo] = mult(v1, v0, true);
    a2 = (a2 + 1) | 0;
    a3 = lo;
    a0 = a3 << 1;
    v0 = (a2 | 0) < (a0 | 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; a1 = (a1 + 1) | 0; if (c) { pc = 0x800374f0; continue; } }
  case 0x8003753c:
    v0 = m.read(((0x8007913c) + 417) >>> 0, 1);
    { const c = (v0 | 0) === 0; a2 = 0 | 0; if (c) { pc = 0x800375b4; continue; } }
  case 0x8003754c:
    v0 = m.read(((0x8007913c) + 415) >>> 0, 1);
    v1 = v0 << 1;
    v1 = (v1 + v0) | 0;
    v1 = v1 << 10;
    v0 = 0x80090000 | 0;
    v0 = (v0 + -9248) | 0;
    { const c = (a0 | 0) <= 0; a1 = (v1 + v0) | 0; if (c) { pc = 0x800375b4; continue; } }
  case 0x80037570:
    v0 = m.read(((a1) + 0) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8003758c; continue; } }
  case 0x80037580:
    v0 = m.read(((0x8007913c) + 417) >>> 0, 1);
    m.write(((a1) + 0) >>> 0, v0 & 0xff, 1);
  case 0x8003758c:
    v1 = (m.read(((sp) + 20) >>> 0, 2) << 16) >> 16;
    v0 = (m.read(((sp) + 22) >>> 0, 2) << 16) >> 16;
    [hi, lo] = mult(v1, v0, true);
    a2 = (a2 + 1) | 0;
    a3 = lo;
    v0 = a3 << 1;
    v0 = (a2 | 0) < (v0 | 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; a1 = (a1 + 1) | 0; if (c) { pc = 0x80037570; continue; } }
  case 0x800375b4:
    a0 = (sp + 16) | 0;
    a1 = 0x80090000 | 0;
    v1 = m.read(((0x8007913c) + 415) >>> 0, 1);
    a1 = (a1 + -9248) | 0;
    v0 = v1 << 1;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 10;
    a1 = (v0 + a1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80049560, a0, a1, a2, a3);
  case 0x800375d8:
    v0 = m.read(((0x8007913c) + 415) >>> 0, 1);
    v0 = (v0 + 1) | 0;
    v0 = v0 & 7;
    m.write(((0x8007913c) + 415) >>> 0, v0 & 0xff, 1);
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return v0;
  default: throw new Error(`f80037344: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044f7c, translated instruction by instruction (116 instructions).
export function* f80044f7c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044f7c;
  for (;;) switch (pc) {
  case 0x80044f7c:
    sp = (sp + -56) | 0;
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    s3 = a0 | 0;
    m.write(((sp) + 40) >>> 0, s4 >>> 0, 4);
    s4 = a1 | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    s0 = a2 | 0;
    a2 = (0 + 60) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 48) >>> 0, 0, 4);
    m.write(((sp) + 44) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80044fb8:
    v0 = 0x10620000 | 0;
    v0 = v0 | 19923;
    s0 = s0 & 65535;
    [hi, lo] = mult(s0, v0, false);
    t0 = hi;
    v0 = 0xd1b70000 | 0;
    v0 = v0 | 5977;
    [hi, lo] = mult(s0, v0, false);
    a0 = 0xcccc0000 | 0;
    a0 = a0 | 52429;
    v1 = hi;
    a2 = (t0 >>> 6) | 0;
    a2 = a2 & 65535;
    [hi, lo] = mult(a2, a0, false);
    t2 = hi;
    v0 = 0x51eb0000 | 0;
    v0 = v0 | 34079;
    [hi, lo] = mult(s0, v0, false);
    t0 = hi;
    [hi, lo] = mult(s0, a0, false);
    v0 = hi;
    a1 = (t0 >>> 5) | 0;
    a1 = a1 & 65535;
    [hi, lo] = mult(a1, a0, false);
    t0 = (v1 >>> 13) | 0;
    t0 = t0 & 65535;
    v1 = (v0 >>> 3) | 0;
    a3 = v1 & 65535;
    v0 = v1 << 2;
    t1 = hi;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 1;
    [hi, lo] = mult(a3, a0, false);
    s0 = (s0 - v0) | 0;
    v1 = (t2 >>> 3) | 0;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 1;
    s1 = (a2 - v0) | 0;
    v1 = (t1 >>> 3) | 0;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 1;
    s2 = (a1 - v0) | 0;
    t4 = hi;
    v1 = (t4 >>> 3) | 0;
    v0 = v1 << 2;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 1;
    s5 = (a3 - v0) | 0;
    v0 = (t0 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = s3 | 0; if (c) { pc = 0x800450a4; continue; } }
  case 0x80045094:
    a1 = s4 | 0;
    a2 = 0 | 33359;
    a2 = (t0 + a2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x800450a4:
    v1 = s1 & 65535;
    v0 = (v1 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = (s3 + 10) | 0; if (c) { pc = 0x800450c4; continue; } }
  case 0x800450b4:
    a1 = s4 | 0;
    a2 = 0 | 33359;
    a2 = (v1 + a2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x800450c4:
    v1 = s2 & 65535;
    v0 = (v1 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = (s3 + 20) | 0; if (c) { pc = 0x800450e4; continue; } }
  case 0x800450d4:
    a1 = s4 | 0;
    a2 = 0 | 33359;
    a2 = (v1 + a2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x800450e4:
    a3 = s5 & 65535;
    v0 = (a3 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = (s3 + 30) | 0; if (c) { pc = 0x80045104; continue; } }
  case 0x800450f4:
    a1 = s4 | 0;
    a2 = 0 | 33359;
    a2 = (a3 + a2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x80045104:
    s0 = s0 & 65535;
    v0 = (s0 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = (s3 + 40) | 0; if (c) { pc = 0x80045124; continue; } }
  case 0x80045114:
    a1 = s4 | 0;
    a2 = 0 | 33359;
    a2 = (s0 + a2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x80045124:
    s5 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 56) | 0;
     return v0;
  default: throw new Error(`f80044f7c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001c6a0, translated instruction by instruction (72 instructions).
export function* f8001c6a0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001c6a0;
  for (;;) switch (pc) {
  case 0x8001c6a0:
    sp = (sp + -32) | 0;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    s1 = a0 | 0;
    m.write(((sp) + 24) >>> 0, 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003704c, a0, a1, a2, a3);
  case 0x8001c6b8:
     [v0, v1] = yield* call(ctx, sp, 0x8001c478, a0, a1, a2, a3);
  case 0x8001c6c0:
    v1 = 0 | 0;
    a0 = 0x80080000 | 0;
    a0 = (a0 + -27304) | 0;
    v0 = v1 & 65535;
  case 0x8001c6d0:
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    v1 = (v1 + 1) | 0;
    v0 = v1 & 65535;
    v0 = (v0 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = v1 & 65535; if (c) { pc = 0x8001c6d0; continue; } }
  case 0x8001c6ec:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28004) >>> 0, 2);
    a0 = (0 + 39) | 0;
    { const c = (v0 | 0) === (a0 | 0); v1 = (0 + 1) | 0; if (c) { pc = 0x8001c778; continue; } }
  case 0x8001c700:
    v0 = m.read(((0x8007913c) + 2) >>> 0, 1);
    s0 = 0x80080000 | 0;
    s0 = m.read(((s0) + -27508) >>> 0, 4) | 0;
    { const c = (v0 | 0) !== (v1 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x8001c74c; continue; } }
  case 0x8001c714:
    v0 = (m.read(((0x8007913c) + 1116) >>> 0, 1) << 24) >> 24;
    { const c = (v0 | 0) !== (a0 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x8001c74c; continue; } }
  case 0x8001c724:
    v0 = 0x20000 | 0;
    v0 = v0 | 32768;
    a1 = s0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27324) >>> 0, 4) | 0;
    a2 = 0 | 45056;
    a0 = (a0 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8001c744:
    v0 = (0 + 39) | 0; pc = 0x8001c770; continue;
  case 0x8001c74c:
    m.write(((0x8007913c) + 4) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003cf28, a0, a1, a2, a3);
  case 0x8001c758:
    a0 = (0 + 2) | 0;
    a1 = s0 | 0;
    a2 = (0 + 39) | 0; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x8001c768:
    m.write(((0x8007913c) + 4) >>> 0, 0 & 0xff, 1);
    v0 = (0 + 39) | 0;
  case 0x8001c770:
    at = 0x80080000 | 0;
    m.write(((at) + -28004) >>> 0, v0 & 0xffff, 2);
  case 0x8001c778:
    v0 = s1 & 65535;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27508) >>> 0, 4) | 0;
    v0 = v0 << 1;
    v0 = (v0 + v1) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 2);
    v1 = (v1 + v0) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27272) >>> 0, v1 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27636) >>> 0, v1 >>> 0, 4);
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f8001c6a0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001c8f8, translated instruction by instruction (37 instructions).
export function* f8001c8f8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001c8f8;
  for (;;) switch (pc) {
  case 0x8001c8f8:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x8003a91c, a0, a1, a2, a3);
  case 0x8001c908:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001c910:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001c918:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001c920:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001fd1c, a0, a1, a2, a3);
  case 0x8001c928:
     [v0, v1] = yield* call(ctx, sp, 0x80028ccc, a0, a1, a2, a3);
  case 0x8001c930:
    v1 = 0 | 0;
    a0 = 0x10000 | 0;
    a0 = a0 | 11263;
  case 0x8001c93c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27584) >>> 0, 4) | 0;
    v0 = (v0 + v1) | 0;
    v1 = (v1 + 1) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    v0 = (a0 >>> 0) < (v1 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001c93c; continue; } }
  case 0x8001c960:
    a0 = (0 + 24) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27584) >>> 0, 4) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8001c974:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x8001c97c:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f8001c8f8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800355cc, translated instruction by instruction (63 instructions).
export function lzss(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800355cc;
  for (;;) switch (pc) {
  case 0x800355cc:
    v1 = (0 + 32) | 0;
    t4 = 0x80080000 | 0;
    t4 = m.read(((t4) + -27384) >>> 0, 4) | 0;
    t1 = (0 + 4077) | 0;
    v0 = (t4 + 4077) | 0;
  case 0x800355e0:
    m.write(((v0) + 0) >>> 0, v1 & 0xff, 1);
    t1 = (t1 + -1) | 0;
    { const c = (t1 | 0) >= 0; v0 = (v0 + -1) | 0; if (c) { pc = 0x800355e0; continue; } }
  case 0x800355f0:
    t0 = (0 + 4078) | 0; pc = 0x800356b0; continue;
  case 0x800355f8:
    t3 = v1 | 65280;
    v0 = t3 & 1;
  case 0x80035600:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80035634; continue; } }
  case 0x80035608:
    v1 = m.read(((a0) + 0) >>> 0, 1);
    a2 = (a2 + -1) | 0;
    { const c = (a2 | 0) < 0; a0 = (a0 + 1) | 0; if (c) { pc = 0x800356c0; continue; } }
  case 0x80035618:
    v0 = (t4 + t0) | 0;
    m.write(((v0) + 0) >>> 0, v1 & 0xff, 1);
    m.write(((a1) + 0) >>> 0, v1 & 0xff, 1);
    a1 = (a1 + 1) | 0;
    t0 = (t0 + 1) | 0;
    t0 = t0 & 4095; pc = 0x800356a0; continue;
  case 0x80035634:
    t1 = m.read(((a0) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    t2 = m.read(((a0) + 0) >>> 0, 1);
    a2 = (a2 + -2) | 0;
    { const c = (a2 | 0) < 0; a0 = (a0 + 1) | 0; if (c) { pc = 0x800356c0; continue; } }
  case 0x8003564c:
    v0 = t2 & 240;
    v0 = v0 << 4;
    t1 = t1 | v0;
    v0 = t2 & 15;
    t2 = (v0 + 2) | 0;
    v0 = (t2 | 0) < 0 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a3 = 0 | 0; if (c) { pc = 0x800356a0; continue; } }
  case 0x8003566c:
    v0 = (t4 + t0) | 0;
    t0 = (t0 + 1) | 0;
    t0 = t0 & 4095;
    v1 = (t1 + a3) | 0;
    v1 = v1 & 4095;
    v1 = (t4 + v1) | 0;
    v1 = m.read(((v1) + 0) >>> 0, 1);
    a3 = (a3 + 1) | 0;
    m.write(((v0) + 0) >>> 0, v1 & 0xff, 1);
    m.write(((a1) + 0) >>> 0, v1 & 0xff, 1);
    v0 = (t2 | 0) < (a3 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; a1 = (a1 + 1) | 0; if (c) { pc = 0x8003566c; continue; } }
  case 0x800356a0:
    t3 = (t3 >>> 1) | 0;
    v0 = t3 & 256;
    { const c = (v0 | 0) !== 0; v0 = t3 & 1; if (c) { pc = 0x80035600; continue; } }
  case 0x800356b0:
    v1 = m.read(((a0) + 0) >>> 0, 1);
    a2 = (a2 + -1) | 0;
    { const c = (a2 | 0) >= 0; a0 = (a0 + 1) | 0; if (c) { pc = 0x800355f8; continue; } }
  case 0x800356c0:
     return v0;
  default: throw new Error(`lzss: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800378c4, translated instruction by instruction (82 instructions).
export function* f800378c4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800378c4;
  for (;;) switch (pc) {
  case 0x800378c4:
    sp = (sp + -64) | 0;
    a3 = (a3 - a1) | 0;
    v0 = a3 << 16;
    v0 = v0 >> 16;
    m.write(((sp) + 52) >>> 0, s7 >>> 0, 4);
    s7 = a0 | 0;
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    s2 = a1 | 0;
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    s3 = m.read(((sp) + 80) >>> 0, 1);
    a2 = (a2 - a0) | 0;
    m.write(((sp) + 56) >>> 0, fp >>> 0, 4);
    fp = a2 | 0;
    m.write(((sp) + 48) >>> 0, s6 >>> 0, 4);
    s6 = a3 | 0;
    m.write(((sp) + 60) >>> 0, 0, 4);
    m.write(((sp) + 44) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    { const c = (v0 | 0) >= 0; m.write(((sp) + 24) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x8003791c; continue; } }
  case 0x80037918:
    v0 = (v0 + 3) | 0;
  case 0x8003791c:
    s1 = (v0 >>> 2) | 0;
    v0 = s1 & 255;
    { const c = (v0 | 0) === 0; s0 = 0 | 0; if (c) { pc = 0x8003797c; continue; } }
  case 0x8003792c:
    s5 = a0 << 16;
    s4 = a2 << 16;
  case 0x80037934:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x8003793c:
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    a0 = s5 >> 16;
    a1 = s0 & 255;
    a1 = a1 << 2;
    a1 = (s2 + a1) | 0;
    a1 = a1 << 16;
    a1 = a1 >> 16;
    a2 = s4 >> 16;
    a3 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037604, a0, a1, a2, a3);
  case 0x80037964:
    s0 = (s0 + 1) | 0;
    v0 = s0 & 255;
    v1 = s1 & 255;
    v0 = (v0 >>> 0) < (v1 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80037934; continue; } }
  case 0x8003797c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80037984:
    v0 = s6 << 16;
    v1 = v0 >> 16;
    a3 = v1 | 0;
    v0 = s7 << 16;
    a0 = v0 >> 16;
    v0 = s0 & 255;
    v0 = v0 << 2;
    v0 = (s2 + v0) | 0;
    v0 = v0 << 16;
    a1 = v0 >> 16;
    v0 = fp << 16;
    { const c = (v1 | 0) >= 0; a2 = v0 >> 16; if (c) { pc = 0x800379bc; continue; } }
  case 0x800379b8:
    a3 = (v1 + 3) | 0;
  case 0x800379bc:
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    a3 = a3 >> 2;
    a3 = a3 << 2;
    a3 = (v1 - a3) | 0;
    a3 = a3 << 16;
    a3 = a3 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80037604, a0, a1, a2, a3);
  case 0x800379d8:
    fp = m.read(((sp) + 56) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
     return v0;
  default: throw new Error(`f800378c4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044e90, translated instruction by instruction (15 instructions).
export function f80044e90(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044e90;
  for (;;) switch (pc) {
  case 0x80044e90:
    a1 = a1 & 65535;
    a1 = a1 << 3;
    a0 = (a0 + a1) | 0;
    v0 = m.read(((a0) + 8) >>> 0, 4) | 0;
    a0 = v0 << 24;
    v1 = v0 & 65280;
    v1 = v1 << 8;
    a0 = a0 | v1;
    v1 = (v0 >>> 8) | 0;
    v1 = v1 & 65280;
    a0 = a0 | v1;
    v0 = (v0 >>> 24) | 0;
    v0 = a0 | v0; return v0;
  default: throw new Error(`f80044e90: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001c374, translated instruction by instruction (65 instructions).
export function f8001c374(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001c374;
  for (;;) switch (pc) {
  case 0x8001c374:
    a2 = a0 | 0;
    a3 = a1 | 0;
    a1 = a1 & 1;
    { const c = (a1 | 0) === 0; t0 = a2 | 0; if (c) { pc = 0x8001c3bc; continue; } }
  case 0x8001c388:
    v0 = 0x801f0000 | 0;
    v1 = (v0 + 26264) | 0;
    v0 = m.read(((v1) + 2) >>> 0, 2);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001c3bc; continue; } }
  case 0x8001c3a0:
    a0 = m.read(((v1) + 2) >>> 0, 2);
    v0 = (v0 + -4248) | 0;
    v1 = a0 << 3;
    v1 = (v1 + a0) | 0;
    v1 = v1 << 3;
    v1 = (v1 + v0) | 0;
    m.write(((v1) + 58) >>> 0, a2 & 0xff, 1);
  case 0x8001c3bc:
    v0 = a3 & 2;
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001c3f8; continue; } }
  case 0x8001c3c8:
    v1 = (v0 + 26264) | 0;
    v0 = m.read(((v1) + 4) >>> 0, 2);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001c3f8; continue; } }
  case 0x8001c3dc:
    a0 = m.read(((v1) + 4) >>> 0, 2);
    v0 = (v0 + -4248) | 0;
    v1 = a0 << 3;
    v1 = (v1 + a0) | 0;
    v1 = v1 << 3;
    v1 = (v1 + v0) | 0;
    m.write(((v1) + 58) >>> 0, t0 & 0xff, 1);
  case 0x8001c3f8:
    v0 = a3 & 4;
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001c434; continue; } }
  case 0x8001c404:
    v1 = (v0 + 26264) | 0;
    v0 = m.read(((v1) + 6) >>> 0, 2);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001c434; continue; } }
  case 0x8001c418:
    a0 = m.read(((v1) + 6) >>> 0, 2);
    v0 = (v0 + -4248) | 0;
    v1 = a0 << 3;
    v1 = (v1 + a0) | 0;
    v1 = v1 << 3;
    v1 = (v1 + v0) | 0;
    m.write(((v1) + 58) >>> 0, t0 & 0xff, 1);
  case 0x8001c434:
    v0 = a3 & 8;
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001c470; continue; } }
  case 0x8001c440:
    v1 = (v0 + 26264) | 0;
    v0 = m.read(((v1) + 10) >>> 0, 2);
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001c470; continue; } }
  case 0x8001c454:
    a0 = m.read(((v1) + 10) >>> 0, 2);
    v0 = (v0 + -4248) | 0;
    v1 = a0 << 3;
    v1 = (v1 + a0) | 0;
    v1 = v1 << 3;
    v1 = (v1 + v0) | 0;
    m.write(((v1) + 58) >>> 0, t0 & 0xff, 1);
  case 0x8001c470:
     return v0;
  default: throw new Error(`f8001c374: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80037d48, translated instruction by instruction (66 instructions).
export function* f80037d48(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80037d48;
  for (;;) switch (pc) {
  case 0x80037d48:
    sp = (sp + -32) | 0;
    v0 = 0x801f0000 | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    s0 = (v0 + 26264) | 0;
    m.write(((sp) + 28) >>> 0, 0, 4);
    a0 = m.read(((s0) + 20) >>> 0, 2);
    v0 = (0 + 27) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27958) >>> 0, v0 & 0xff, 1);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80037d80; continue; } }
  case 0x80037d74:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80037d7c:
    m.write(((s0) + 20) >>> 0, 0 & 0xffff, 2);
  case 0x80037d80:
    a0 = 0x80200000 | 0;
    a0 = (a0 + -11664) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27958) >>> 0, 1);
    v0 = 0x1000000 | 0;
    a2 = v1 << 3;
    a2 = (a2 + a0) | 0;
    m.write(((a2) + 8) >>> 0, v0 >>> 0, 4);
    v0 = (v1 + 480) | 0;
    v1 = (v1 + 2) | 0;
    v1 = v1 << 3;
    v1 = (v1 + a0) | 0;
    m.write(((a2) + 4) >>> 0, v0 >>> 0, 4);
    v0 = m.read(((a2) + 8) >>> 0, 4) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27958) >>> 0, 1);
    a1 = 0 | 0;
    m.write(((a2) + 0) >>> 0, 0 >>> 0, 4);
    m.write(((v1) + 8) >>> 0, v0 >>> 0, 4);
    v0 = m.read(((a2) + 0) >>> 0, 4) | 0;
    a3 = (0 + 320) | 0;
    m.write(((v1) + 0) >>> 0, v0 >>> 0, 4);
    v0 = m.read(((a2) + 4) >>> 0, 4) | 0;
    a2 = a1 | 0;
    m.write(((v1) + 4) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 240) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x80037df0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    m.write(((s0) + 20) >>> 0, v0 & 0xffff, 2);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27404) >>> 0, 4) | 0;
    a0 = (0 + 10) | 0;
    m.write(((v0) + 49) >>> 0, a0 & 0xff, 1);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 1) | 0;
    m.write(((v1) + 51) >>> 0, v0 & 0xff, 1);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27404) >>> 0, 4) | 0;
    m.write(((v0) + 56) >>> 0, a0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x80037b08, a0, a1, a2, a3);
  case 0x80037e30:
    a0 = (0 + 10) | 0;
    a1 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cae0, a0, a1, a2, a3);
  case 0x80037e3c:
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f80037d48: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003c8f8, translated instruction by instruction (36 instructions).
export function addBox2(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003c8f8;
  for (;;) switch (pc) {
  case 0x8003c8f8:
    t0 = 0x801f0000 | 0;
    t0 = (t0 + 23424) | 0;
    v0 = m.read(((0x8007913c) + 444) >>> 0, 2);
    t1 = m.read(((sp) + 16) >>> 0, 4) | 0;
    t2 = m.read(((sp) + 20) >>> 0, 4) | 0;
    t3 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    t4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    v0 = v0 << 4;
    v0 = (v0 + t0) | 0;
    m.write(((v0) + 0) >>> 0, v1 >>> 0, 4);
    m.write(((v0) + 12) >>> 0, t1 & 0xff, 1);
    v1 = m.read(((0x8007913c) + 444) >>> 0, 2);
    a1 = (a1 + 8) | 0;
    m.write(((v0) + 4) >>> 0, a0 & 0xffff, 2);
    m.write(((v0) + 6) >>> 0, a1 & 0xffff, 2);
    m.write(((v0) + 8) >>> 0, a2 & 0xffff, 2);
    m.write(((v0) + 10) >>> 0, a3 & 0xffff, 2);
    v1 = v1 << 4;
    v1 = (v1 + t0) | 0;
    m.write(((v1) + 13) >>> 0, t2 & 0xff, 1);
    v0 = m.read(((0x8007913c) + 444) >>> 0, 2);
    v0 = v0 << 4;
    v0 = (v0 + t0) | 0;
    m.write(((v0) + 14) >>> 0, t3 & 0xff, 1);
    v1 = m.read(((0x8007913c) + 444) >>> 0, 2);
    a0 = 0x80080000 | 0;
    a0 = (a0 + -27280) | 0;
    v0 = v1 << 1;
    v0 = (v0 + a0) | 0;
    v1 = (v1 + 1) | 0;
    m.write(((v0) + 0) >>> 0, t4 & 0xffff, 2);
    m.write(((0x8007913c) + 444) >>> 0, v1 & 0xffff, 2);
     return v0;
  default: throw new Error(`addBox2: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001866c, translated instruction by instruction (412 instructions).
export function* options(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001866c;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x8001866c:
    sp = (sp + -80) | 0;
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    s7 = a0 | 0;
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    s4 = 0 | 0;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    v0 = 0x801f0000 | 0;
    v1 = m.read(((v0) + 29924) >>> 0, 1);
    v0 = (0 + 5) | 0;
    m.write(((sp) + 76) >>> 0, 0, 4);
    m.write(((sp) + 72) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    m.write(((0x8007913c) + 23) >>> 0, v0 & 0xff, 1);
    { const c = (v1 | 0) === 0; s3 = (0 + 1) | 0; if (c) { pc = 0x800186c8; continue; } }
  case 0x800186b8:
    v0 = s7 & 255;
    { const c = (v0 | 0) !== 0; v0 = (0 + 6) | 0; if (c) { pc = 0x800186c8; continue; } }
  case 0x800186c4:
    m.write(((0x8007913c) + 23) >>> 0, v0 & 0xff, 1);
  case 0x800186c8:
    s5 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x800186d0:
    s6 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800186d8:
    fp = (0 + 160) | 0;
    v0 = 0x801f0000 | 0;
  case 0x800186e0:
    v1 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 4096;
    { const c = (v0 | 0) === 0; v0 = s4 & 255; if (c) { pc = 0x80018710; continue; } }
  case 0x800186f4:
    { const c = (v0 | 0) === 0; a0 = 0 | 0; if (c) { pc = 0x80018884; continue; } }
  case 0x800186fc:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018704:
    s3 = (0 + 1) | 0;
    s4 = (s4 + -1) | 0; pc = 0x80018880; continue;
  case 0x80018710:
    v0 = v1 & 16384;
    { const c = (v0 | 0) === 0; v0 = s4 & 255; if (c) { pc = 0x80018740; continue; } }
  case 0x8001871c:
    v1 = m.read(((0x8007913c) + 23) >>> 0, 1);
    { const c = (v0 | 0) === (v1 | 0); a0 = 0 | 0; if (c) { pc = 0x80018884; continue; } }
  case 0x8001872c:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018734:
    s3 = (0 + 1) | 0;
    s4 = (s4 + 1) | 0; pc = 0x80018880; continue;
  case 0x80018740:
    v0 = v1 & 68;
    { const c = (v0 | 0) !== 0; v0 = v1 & 33; if (c) { pc = 0x80018870; continue; } }
  case 0x8001874c:
    { const c = (v0 | 0) === 0; s0 = s4 & 255; if (c) { pc = 0x80018880; continue; } }
  case 0x80018754:
    { const c = (s0 | 0) !== 0;  if (c) { pc = 0x80018774; continue; } }
  case 0x8001875c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018764:
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800145b0, a0, a1, a2, a3);
  case 0x8001876c:
    at = 0x80080000 | 0;
    m.write(((at) + -28023) >>> 0, 0 & 0xff, 1);
  case 0x80018774:
    { const c = (s0 | 0) !== (s5 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x80018798; continue; } }
  case 0x8001877c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018784:
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014d68, a0, a1, a2, a3);
  case 0x8001878c:
    at = 0x80080000 | 0;
    m.write(((at) + -28023) >>> 0, 0 & 0xff, 1);
    v0 = (0 + 2) | 0;
  case 0x80018798:
    { const c = (s0 | 0) !== (v0 | 0);  if (c) { pc = 0x800187b8; continue; } }
  case 0x800187a0:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800187a8:
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001b51c, a0, a1, a2, a3);
  case 0x800187b0:
    at = 0x80080000 | 0;
    m.write(((at) + -28023) >>> 0, 0 & 0xff, 1);
  case 0x800187b8:
    { const c = (s0 | 0) !== (s6 | 0); v0 = (0 + 4) | 0; if (c) { pc = 0x800187f4; continue; } }
  case 0x800187c0:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800187c8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27963) >>> 0, 1);
    v0 = v0 ^ 1;
    at = 0x80080000 | 0;
    m.write(((at) + -27963) >>> 0, v0 & 0xff, 1);
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27963) >>> 0, 1);
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800289ec, a0, a1, a2, a3);
  case 0x800187f0:
    v0 = (0 + 4) | 0;
  case 0x800187f4:
    { const c = (s0 | 0) !== (v0 | 0);  if (c) { pc = 0x80018830; continue; } }
  case 0x800187fc:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018804:
    a0 = 0 | 0;
    a1 = a0 | 0;
    a2 = 0 | 65535;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27994) >>> 0, 1);
    v0 = v0 ^ 1;
    at = 0x80080000 | 0;
    m.write(((at) + -27994) >>> 0, v0 & 0xff, 1);
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80026088, a0, a1, a2, a3);
  case 0x80018830:
    s1 = m.read(((0x8007913c) + 23) >>> 0, 1);
    v0 = (0 + 6) | 0;
    { const c = (s1 | 0) !== (v0 | 0); v0 = (0 + 5) | 0; if (c) { pc = 0x80018868; continue; } }
  case 0x80018840:
    { const c = (s0 | 0) !== (v0 | 0);  if (c) { pc = 0x80018858; continue; } }
  case 0x80018848:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018850:
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001511c, a0, a1, a2, a3);
  case 0x80018858:
    { const c = (s0 | 0) !== (s1 | 0); a0 = 0 | 0; if (c) { pc = 0x80018884; continue; } }
  case 0x80018860:
     pc = 0x80018870; continue;
  case 0x80018868:
    { const c = (s0 | 0) !== (v0 | 0); a0 = 0 | 0; if (c) { pc = 0x80018884; continue; } }
  case 0x80018870:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018878:
     pc = 0x80018c98; continue;
  case 0x80018880:
    a0 = 0 | 0;
  case 0x80018884:
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    s2 = (0 + 100) | 0;
    s1 = (0 + 40) | 0;
    s0 = 0x40000000 | 0;
    m.write(((sp) + 16) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x800188b4:
    a0 = (0 + 70) | 0;
    a1 = (0 + 60) | 0;
    v0 = m.read(((0x8007913c) + 23) >>> 0, 1);
    a2 = (0 + 180) | 0;
    m.write(((sp) + 16) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s6 >>> 0, 4);
    a3 = v0 << 2;
    a3 = (a3 + v0) | 0;
    a3 = a3 << 2;
    a3 = (a3 + 26) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x800188ec:
    { const c = (s3 | 0) !== (s5 | 0); v0 = s7 & 255; if (c) { pc = 0x80018c78; continue; } }
  case 0x800188f4:
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 120) | 0; if (c) { pc = 0x80018910; continue; } }
  case 0x800188fc:
    a0 = (0 + 130) | 0;
    a1 = (0 + 12) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4188) | 0; pc = 0x8001891c; continue;
  case 0x80018910:
    a1 = (0 + 12) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4200) | 0;
  case 0x8001891c:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018924:
    a0 = (0 + 76) | 0;
    a1 = (0 + 63) | 0;
    v0 = m.read(((0x8007913c) + 23) >>> 0, 1);
    a2 = (0 + 180) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a3 = v0 << 2;
    a3 = (a3 + v0) | 0;
    a3 = a3 << 2;
    a3 = (a3 + 26) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8001894c:
    a0 = (0 + 76) | 0;
    s0 = s4 & 255;
    a1 = s0 << 2;
    a1 = (a1 + s0) | 0;
    a1 = a1 << 2;
    a1 = (a1 + 63) | 0;
    a2 = 0 | 33924; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x8001896c:
    v1 = m.read(((0x8007913c) + 23) >>> 0, 1);
    v0 = (0 + 6) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80018b0c; continue; } }
  case 0x8001897c:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x80018988; continue; } }
  case 0x80018984:
    a0 = 0 | 0;
  case 0x80018988:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018990:
    a0 = (0 + 92) | 0;
    a1 = (0 + 63) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2212) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800189a8:
    v0 = s4 & 255;
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x800189b8; continue; } }
  case 0x800189b4:
    a0 = 0 | 0;
  case 0x800189b8:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800189c0:
    a0 = (0 + 92) | 0;
    a1 = (0 + 83) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2276) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800189d8:
    v1 = s4 & 255;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x800189ec; continue; } }
  case 0x800189e8:
    a0 = 0 | 0;
  case 0x800189ec:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800189f4:
    a0 = (0 + 92) | 0;
    a1 = (0 + 103) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4212) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018a0c:
    v0 = s4 & 255;
    { const c = (v0 | 0) !== (s6 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80018a1c; continue; } }
  case 0x80018a18:
    a0 = 0 | 0;
  case 0x80018a1c:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018a24:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27963) >>> 0, 1);
    { const c = (v0 | 0) !== (s5 | 0); a1 = (0 + 123) | 0; if (c) { pc = 0x80018a48; continue; } }
  case 0x80018a38:
    a0 = (0 + 92) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4176) | 0; pc = 0x80018a54; continue;
  case 0x80018a48:
    a0 = (0 + 92) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4164) | 0;
  case 0x80018a54:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018a5c:
    v1 = s4 & 255;
    v0 = (0 + 4) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80018a70; continue; } }
  case 0x80018a6c:
    a0 = 0 | 0;
  case 0x80018a70:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018a78:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27994) >>> 0, 1);
    { const c = (v0 | 0) !== (s5 | 0); a1 = (0 + 143) | 0; if (c) { pc = 0x80018a9c; continue; } }
  case 0x80018a8c:
    a0 = (0 + 92) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4236) | 0; pc = 0x80018aa8; continue;
  case 0x80018a9c:
    a0 = (0 + 92) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4256) | 0;
  case 0x80018aa8:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018ab0:
    v1 = s4 & 255;
    v0 = (0 + 5) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80018ac4; continue; } }
  case 0x80018ac0:
    a0 = 0 | 0;
  case 0x80018ac4:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018acc:
    a0 = (0 + 92) | 0;
    a1 = (0 + 163) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3372) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018ae4:
    v1 = s4 & 255;
    v0 = (0 + 6) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80018af8; continue; } }
  case 0x80018af4:
    a0 = 0 | 0;
  case 0x80018af8:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018b00:
    a0 = (0 + 92) | 0;
    a1 = (0 + 183) | 0; pc = 0x80018c64; continue;
  case 0x80018b0c:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x80018b18; continue; } }
  case 0x80018b14:
    a0 = 0 | 0;
  case 0x80018b18:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018b20:
    a0 = (0 + 92) | 0;
    a1 = (0 + 63) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2212) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018b38:
    v0 = s4 & 255;
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80018b48; continue; } }
  case 0x80018b44:
    a0 = 0 | 0;
  case 0x80018b48:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018b50:
    a0 = (0 + 92) | 0;
    a1 = (0 + 83) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2276) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018b68:
    v1 = s4 & 255;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80018b7c; continue; } }
  case 0x80018b78:
    a0 = 0 | 0;
  case 0x80018b7c:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018b84:
    a0 = (0 + 92) | 0;
    a1 = (0 + 103) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4212) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018b9c:
    v0 = s4 & 255;
    { const c = (v0 | 0) !== (s6 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80018bac; continue; } }
  case 0x80018ba8:
    a0 = 0 | 0;
  case 0x80018bac:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018bb4:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27963) >>> 0, 1);
    { const c = (v0 | 0) !== (s5 | 0); a1 = (0 + 123) | 0; if (c) { pc = 0x80018bd8; continue; } }
  case 0x80018bc8:
    a0 = (0 + 92) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4176) | 0; pc = 0x80018be4; continue;
  case 0x80018bd8:
    a0 = (0 + 92) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4164) | 0;
  case 0x80018be4:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018bec:
    v1 = s4 & 255;
    v0 = (0 + 4) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80018c00; continue; } }
  case 0x80018bfc:
    a0 = 0 | 0;
  case 0x80018c00:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018c08:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27994) >>> 0, 1);
    { const c = (v0 | 0) !== (s5 | 0); a1 = (0 + 143) | 0; if (c) { pc = 0x80018c2c; continue; } }
  case 0x80018c1c:
    a0 = (0 + 92) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4236) | 0; pc = 0x80018c38; continue;
  case 0x80018c2c:
    a0 = (0 + 92) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4256) | 0;
  case 0x80018c38:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018c40:
    v1 = s4 & 255;
    v0 = (0 + 5) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80018c54; continue; } }
  case 0x80018c50:
    a0 = 0 | 0;
  case 0x80018c54:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018c5c:
    a0 = (0 + 92) | 0;
    a1 = (0 + 163) | 0;
  case 0x80018c64:
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2264) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018c74:
    s3 = 0 | 0;
  case 0x80018c78:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80018c80:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80018c88:
    offer(ctx, Array.from({ length: m.read(0x8007913c + 0x17, 1) + 1 }, (_, i) => box(i, 0x4c, 0x3f + 20 * i, 0xb4, 20)), () => s4 & 0xff, ["up", "down"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80018c90:
    v0 = 0x801f0000 | 0; pc = 0x800186e0; continue;
  case 0x80018c98:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80018ca0:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80018ca8:
    fp = m.read(((sp) + 72) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 80) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`options: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800145b0, translated instruction by instruction (494 instructions).
export function* f800145b0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800145b0;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x800145b0:
    sp = (sp + -96) | 0;
    m.write(((sp) + 72) >>> 0, s4 >>> 0, 4);
    s4 = 0 | 0;
    m.write(((sp) + 92) >>> 0, 0, 4);
    m.write(((sp) + 88) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 84) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 80) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 76) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 68) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 64) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 60) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 56) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002cc48, a0, a1, a2, a3);
  case 0x800145e4:
    v0 = 0x80200000 | 0;
    fp = 0x80080000 | 0;
    fp = m.read(((fp) + -27988) >>> 0, 1);
    t0 = 0x80080000 | 0;
    t0 = m.read(((t0) + -27986) >>> 0, 1);
    v0 = m.read(((v0) + -5014) >>> 0, 2);
    s5 = (0 + 1) | 0;
    m.write(((sp) + 40) >>> 0, t0 & 0xffff, 2);
    m.write(((sp) + 48) >>> 0, v0 & 0xffff, 2); [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x8001460c:
    s6 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014614:
    v0 = 0x801f0000 | 0;
    s7 = (v0 + 26264) | 0;
    v0 = 0x801f0000 | 0;
  case 0x80014620:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; v1 = s4 & 255; if (c) { pc = 0x8001464c; continue; } }
  case 0x80014634:
    v0 = (0 + 4) | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = 0x801f0000 | 0; if (c) { pc = 0x80014650; continue; } }
  case 0x80014640:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80014648:
    s4 = (s4 + 1) | 0;
  case 0x8001464c:
    v0 = 0x801f0000 | 0;
  case 0x80014650:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; v0 = s4 & 255; if (c) { pc = 0x80014678; continue; } }
  case 0x80014664:
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x8001467c; continue; } }
  case 0x8001466c:
    s4 = (s4 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80014678:
    v0 = 0x801f0000 | 0;
  case 0x8001467c:
    v1 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 68;
    { const c = (v0 | 0) !== 0; v0 = v1 & 20480; if (c) { pc = 0x800146b0; continue; } }
  case 0x80014690:
    { const c = (v0 | 0) === 0; v0 = v1 & 33; if (c) { pc = 0x8001469c; continue; } }
  case 0x80014698:
    s5 = (0 + 1) | 0;
  case 0x8001469c:
    { const c = (v0 | 0) === 0; s0 = s4 & 255; if (c) { pc = 0x80014b54; continue; } }
  case 0x800146a4:
    v0 = (0 + 4) | 0;
    { const c = (s0 | 0) !== (v0 | 0); s5 = (0 + 1) | 0; if (c) { pc = 0x800146c0; continue; } }
  case 0x800146b0:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800146b8:
     pc = 0x80014d24; continue;
  case 0x800146c0:
    at = 0x80080000 | 0;
    m.write(((at) + -28029) >>> 0, s5 & 0xff, 1);
    a0 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x800146d0:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800146d8:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800146e0:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x800146e8:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800146f0:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800146f8:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014700:
    a0 = (0 + 1) | 0;
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001470c:
    a0 = m.read(((s7) + 10) >>> 0, 2);
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x80014718:
    a0 = m.read(((s7) + 16) >>> 0, 2);
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x80014724:
    v0 = (0 + 1) | 0;
    { const c = (s0 | 0) === (v0 | 0); v0 = (s0 | 0) < 2 ? 1 : 0; if (c) { pc = 0x8001478c; continue; } }
  case 0x80014730:
    { const c = (v0 | 0) === 0; v0 = (0 + 2) | 0; if (c) { pc = 0x80014748; continue; } }
  case 0x80014738:
    { const c = (s0 | 0) === 0;  if (c) { pc = 0x80014760; continue; } }
  case 0x80014740:
     pc = 0x80014a9c; continue;
  case 0x80014748:
    { const c = (s0 | 0) === (v0 | 0); a0 = (0 + 9243) | 0; if (c) { pc = 0x800147c4; continue; } }
  case 0x80014750:
    { const c = (s0 | 0) === (s6 | 0);  if (c) { pc = 0x800148b8; continue; } }
  case 0x80014758:
     pc = 0x80014a9c; continue;
  case 0x80014760:
    a0 = (0 + 9250) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x8001476c:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80014778:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 0) | 0; pc = 0x80014a84; continue;
  case 0x8001478c:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80014798:
    a0 = (0 + 9245) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x800147a4:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x800147b0:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 144) | 0; pc = 0x80014a84; continue;
  case 0x800147c4:
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x800147cc:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x800147d8:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 368) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800147f0:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x800147f8:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014800:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001480c:
    a0 = (0 + 9244) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80014818:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80014824:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 592) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001483c:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x80014844:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8001484c:
    a0 = (0 + 9249) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80014858:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80014864:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 752) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001487c:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x80014884:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8001488c:
    a0 = (0 + 9246) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80014898:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x800148a4:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 920) | 0; pc = 0x80014a84; continue;
  case 0x800148b8:
    a0 = (0 + 9242) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x800148c4:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x800148d0:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 1072) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800148e8:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x800148f0:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800148f8:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80014904:
    a0 = (0 + 9239) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80014910:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8001491c:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 1228) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014934:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x8001493c:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014944:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80014950:
    a0 = (0 + 9238) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x8001495c:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80014968:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 1368) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014980:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x80014988:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014990:
    a0 = (0 + 9240) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x8001499c:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x800149a8:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 1536) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800149c0:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x800149c8:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800149d0:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800149dc:
    a0 = (0 + 9241) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x800149e8:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x800149f4:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 1692) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014a0c:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x80014a14:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014a1c:
    a0 = (0 + 9248) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80014a28:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80014a34:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 1848) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014a4c:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x80014a54:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014a5c:
    a0 = (0 + 9247) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80014a68:
    a0 = (0 + 10) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80014a74:
    a0 = (0 + 100) | 0;
    a1 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2028) | 0;
  case 0x80014a84:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014a8c:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x80014a94:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014a9c:
    a0 = m.read(((s7) + 10) >>> 0, 2);
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x80014aa8:
    a0 = m.read(((s7) + 16) >>> 0, 2);
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x80014ab4:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80014abc:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014ac4:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80014acc:
    t0 = m.read(((sp) + 48) >>> 0, 2);
    v0 = t0 << 16;
    a0 = v0 >> 16;
    v0 = (0 + -1) | 0;
    { const c = (a0 | 0) === (v0 | 0);  if (c) { pc = 0x80014af0; continue; } }
  case 0x80014ae8:
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80014af0:
    a0 = fp << 16;
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80044868, a0, a1, a2, a3);
  case 0x80014afc:
    fp = v0 | 0;
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x80014b18; continue; } }
  case 0x80014b10:
     [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x80014b18:
    t0 = m.read(((sp) + 40) >>> 0, 2);
    a0 = t0 | 0;
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x80014b34; continue; } }
  case 0x80014b2c:
     [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x80014b34:
    at = 0x80080000 | 0;
    m.write(((at) + -28029) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003d820, a0, a1, a2, a3);
  case 0x80014b44:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cc98, a0, a1, a2, a3);
  case 0x80014b4c:
    v0 = 0x801f0000 | 0; pc = 0x80014620; continue;
  case 0x80014b54:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    s3 = (0 + 160) | 0;
    s2 = (0 + 100) | 0;
    s1 = (0 + 40) | 0;
    s0 = 0x40000000 | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80014b8c:
    a0 = (0 + 70) | 0;
    a1 = (0 + 60) | 0;
    a2 = (0 + 180) | 0;
    a3 = (0 + 126) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80014bb4:
    v0 = (0 + 1) | 0;
    { const c = (s5 | 0) !== (v0 | 0); a0 = (0 + 76) | 0; if (c) { pc = 0x80014d0c; continue; } }
  case 0x80014bc0:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a1 = (0 + 60) | 0;
    a2 = (0 + 16) | 0;
    a3 = (0 + 180) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80014bd4:
    a0 = (0 + 110) | 0;
    a1 = (0 + 12) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2212) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014bec:
    a0 = (0 + 76) | 0;
    s0 = s4 & 255;
    a1 = s0 << 2;
    a1 = (a1 + s0) | 0;
    a1 = a1 << 2;
    a1 = (a1 + 60) | 0;
    a2 = 0 | 33924; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x80014c0c:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x80014c18; continue; } }
  case 0x80014c14:
    a0 = 0 | 0;
  case 0x80014c18:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80014c20:
    a0 = (0 + 92) | 0;
    a1 = (0 + 63) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28348) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014c38:
    v1 = s4 & 255;
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80014c4c; continue; } }
  case 0x80014c48:
    a0 = 0 | 0;
  case 0x80014c4c:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80014c54:
    a0 = (0 + 92) | 0;
    a1 = (0 + 83) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28344) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014c6c:
    v1 = s4 & 255;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80014c80; continue; } }
  case 0x80014c7c:
    a0 = 0 | 0;
  case 0x80014c80:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80014c88:
    a0 = (0 + 92) | 0;
    a1 = (0 + 103) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2228) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014ca0:
    v0 = s4 & 255;
    { const c = (v0 | 0) !== (s6 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80014cb0; continue; } }
  case 0x80014cac:
    a0 = 0 | 0;
  case 0x80014cb0:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80014cb8:
    a0 = (0 + 92) | 0;
    a1 = (0 + 123) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2248) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014cd0:
    v1 = s4 & 255;
    v0 = (0 + 4) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80014ce4; continue; } }
  case 0x80014ce0:
    a0 = 0 | 0;
  case 0x80014ce4:
    s5 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80014cec:
    a0 = (0 + 92) | 0;
    a1 = (0 + 143) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2264) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014d04:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80014d0c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80014d14:
    offer(ctx, Array.from({ length: 5 }, (_, i) => box(i, 0x4c, 0x3c + 20 * i, 0xb4, 20)), () => s4 & 0xff, ["up", "down"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80014d1c:
    v0 = 0x801f0000 | 0; pc = 0x80014620; continue;
  case 0x80014d24:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014d2c:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80014d34:
    fp = m.read(((sp) + 88) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 84) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 80) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 76) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 72) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 56) >>> 0, 4) | 0;
    sp = (sp + 96) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`f800145b0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80025710, translated instruction by instruction (24 instructions).
export function* f80025710(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80025710;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x80025710:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = 0x801f0000 | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
  case 0x80025720:
    v0 = m.read(((s0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 101;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002574c; continue; } }
  case 0x80025734:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002573c:
    withdraw(ctx);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80025744:
     pc = 0x80025720; continue;
  case 0x8002574c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80025754:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x8002575c:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`f80025710: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80014d68, translated instruction by instruction (237 instructions).
export function* f80014d68(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80014d68;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x80014d68:
    sp = (sp + -72) | 0;
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    s5 = 0 | 0;
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    s6 = (0 + 1) | 0;
    m.write(((sp) + 68) >>> 0, 0, 4);
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014d98:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    s4 = (0 + 160) | 0;
    s3 = (0 + 100) | 0;
    s2 = (0 + 40) | 0;
    s1 = 0x40000000 | 0;
    s0 = (0 + 3) | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80014dd4:
    a0 = (0 + 125) | 0;
    a1 = (0 + 36) | 0;
    a2 = (0 + 70) | 0;
    a3 = (0 + 20) | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80014dfc:
    a0 = (0 + 6) | 0;
    a1 = (0 + 70) | 0;
    a2 = (0 + 308) | 0;
    a3 = (0 + 136) | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80014e24:
    s2 = 0x801f0000 | 0;
    s1 = s0 | 0;
  case 0x80014e2c:
    v0 = m.read(((s2) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; v0 = s5 & 255; if (c) { pc = 0x80014e54; continue; } }
  case 0x80014e40:
    { const c = (v0 | 0) === (s1 | 0);  if (c) { pc = 0x80014e54; continue; } }
  case 0x80014e48:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80014e50:
    s5 = (s5 + 1) | 0;
  case 0x80014e54:
    v0 = m.read(((s2) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; v0 = s5 & 255; if (c) { pc = 0x80014e7c; continue; } }
  case 0x80014e68:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80014e7c; continue; } }
  case 0x80014e70:
    s5 = (s5 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80014e7c:
    v1 = m.read(((s2) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 68;
    { const c = (v0 | 0) === 0; v0 = v1 & 20480; if (c) { pc = 0x80014ea0; continue; } }
  case 0x80014e90:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80014e98:
     pc = 0x800150d0; continue;
  case 0x80014ea0:
    { const c = (v0 | 0) === 0; s0 = s6 & 255; if (c) { pc = 0x80014eb0; continue; } }
  case 0x80014ea8:
    s6 = (0 + 1) | 0;
    s0 = s6 & 255;
  case 0x80014eb0:
    v0 = (0 + 1) | 0;
    { const c = (s0 | 0) !== (v0 | 0);  if (c) { pc = 0x800150b8; continue; } }
  case 0x80014ebc:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80014ec4:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80014ecc:
    a0 = (0 + 112) | 0;
    a1 = (0 + 12) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2276) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014ee4:
    a0 = (0 + 133) | 0;
    a1 = (0 + 38) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2264) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014efc:
    v1 = s5 & 255;
    { const c = (v1 | 0) === (s0 | 0); v0 = (v1 | 0) < 2 ? 1 : 0; if (c) { pc = 0x80014f98; continue; } }
  case 0x80014f08:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80014f20; continue; } }
  case 0x80014f10:
    { const c = (v1 | 0) === 0; s0 = s5 & 255; if (c) { pc = 0x80014f3c; continue; } }
  case 0x80014f18:
     pc = 0x8001507c; continue;
  case 0x80014f20:
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) === (v0 | 0); a0 = (0 + 12) | 0; if (c) { pc = 0x80014ff4; continue; } }
  case 0x80014f2c:
    { const c = (v1 | 0) === (s1 | 0); s0 = s5 & 255; if (c) { pc = 0x80015034; continue; } }
  case 0x80014f34:
     pc = 0x8001507c; continue;
  case 0x80014f3c:
    a0 = (0 + 12) | 0;
    a1 = (0 + 73) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2292) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014f54:
    a0 = (0 + 12) | 0;
    a1 = (0 + 105) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2348) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014f6c:
    a0 = (0 + 12) | 0;
    a1 = (0 + 137) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2428) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014f84:
    a0 = (0 + 12) | 0;
    a1 = (0 + 153) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2460) | 0; pc = 0x80015070; continue;
  case 0x80014f98:
    a0 = (0 + 12) | 0;
    a1 = (0 + 73) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2532) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014fb0:
    a0 = (0 + 12) | 0;
    a1 = (0 + 105) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2584) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014fc8:
    a0 = (0 + 12) | 0;
    a1 = (0 + 137) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2668) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80014fe0:
    a0 = (0 + 12) | 0;
    a1 = (0 + 169) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2736) | 0; pc = 0x80015070; continue;
  case 0x80014ff4:
    a1 = (0 + 73) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2792) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80015008:
    a0 = (0 + 12) | 0;
    a1 = (0 + 105) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2872) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80015020:
    a0 = (0 + 12) | 0;
    a1 = (0 + 169) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3020) | 0; pc = 0x80015070; continue;
  case 0x80015034:
    a1 = (0 + 73) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3096) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80015048:
    a0 = (0 + 12) | 0;
    a1 = (0 + 121) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3204) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80015060:
    a0 = (0 + 12) | 0;
    a1 = (0 + 169) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3292) | 0;
  case 0x80015070:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80015078:
    s0 = s5 & 255;
  case 0x8001507c:
    { const c = (s0 | 0) === 0; a0 = (0 + 144) | 0; if (c) { pc = 0x80015098; continue; } }
  case 0x80015084:
    a1 = (0 + 54) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28340) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80015098:
    { const c = (s0 | 0) === (s1 | 0); a0 = (0 + 144) | 0; if (c) { pc = 0x800150b4; continue; } }
  case 0x800150a0:
    a1 = (0 + 203) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28336) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800150b4:
    s6 = 0 | 0;
  case 0x800150b8:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800150c0:
    offer(ctx, [box(100000, 0x90, 0xd0, 0x18, 0x12), box(100001, 0x90, 0x40, 0x18, 0x10), box(100002, 0x7c, 0x2c, 0x42, 0x13)], () => 0, ["up", "down"], { 100000: "down", 100001: "up", 100002: "cross" });
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800150c8:
     pc = 0x80014e2c; continue;
  case 0x800150d0:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800150d8:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800150e0:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800150e8:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x800150f0:
    s6 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 72) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`f80014d68: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001511c, translated instruction by instruction (204 instructions).
export function* f8001511c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001511c;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x8001511c:
    sp = (sp + -80) | 0;
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    s5 = 0 | 0;
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    s6 = (0 + 1) | 0;
    m.write(((sp) + 76) >>> 0, 0, 4);
    m.write(((sp) + 72) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80015154:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    s4 = (0 + 160) | 0;
    s3 = (0 + 100) | 0;
    s2 = (0 + 40) | 0;
    s1 = 0x40000000 | 0;
    s0 = (0 + 3) | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80015190:
    a0 = (0 + 125) | 0;
    a1 = (0 + 36) | 0;
    a2 = (0 + 70) | 0;
    a3 = (0 + 20) | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x800151b8:
    a0 = (0 + 6) | 0;
    a1 = (0 + 70) | 0;
    a2 = (0 + 308) | 0;
    a3 = (0 + 136) | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x800151e0:
    a0 = 0x80060000 | 0;
    a0 = (a0 + 30996) | 0;
    a2 = (0 + 1898) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    s7 = 0x801f0000 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x800151fc:
    v0 = 0x80070000 | 0;
    fp = (v0 + -32640) | 0;
  case 0x80015204:
    v0 = m.read(((s7) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; v1 = s5 & 255; if (c) { pc = 0x80015230; continue; } }
  case 0x80015218:
    v0 = (0 + 39) | 0;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x80015230; continue; } }
  case 0x80015224:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001522c:
    s5 = (s5 + 1) | 0;
  case 0x80015230:
    v0 = m.read(((s7) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; v0 = s5 & 255; if (c) { pc = 0x80015258; continue; } }
  case 0x80015244:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80015258; continue; } }
  case 0x8001524c:
    s5 = (s5 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80015258:
    v1 = m.read(((s7) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 68;
    { const c = (v0 | 0) === 0; v0 = v1 & 20480; if (c) { pc = 0x8001527c; continue; } }
  case 0x8001526c:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80015274:
     pc = 0x800153f8; continue;
  case 0x8001527c:
    { const c = (v0 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x80015288; continue; } }
  case 0x80015284:
    s6 = (0 + 1) | 0;
  case 0x80015288:
    { const c = (s6 | 0) !== (v0 | 0);  if (c) { pc = 0x800153e0; continue; } }
  case 0x80015290:
    s3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80015298:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800152a0:
    a0 = (0 + 97) | 0;
    a1 = (0 + 12) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3372) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800152b8:
    a0 = (0 + 133) | 0;
    a1 = (0 + 38) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2264) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800152d0:
    s4 = s5 & 255;
    v0 = 0x801f0000 | 0;
    s6 = (v0 + 29872) | 0;
    s0 = s3 & 255;
  case 0x800152e0:
    v0 = (s0 >>> 0) < (s4 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (s4 + 7) | 0; if (c) { pc = 0x80015388; continue; } }
  case 0x800152ec:
    v0 = (s0 | 0) < (v0 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; s2 = s0 << 1; if (c) { pc = 0x80015388; continue; } }
  case 0x800152f8:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27516) >>> 0, 4) | 0;
    a1 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044e10, a0, a1, a2, a3);
  case 0x80015308:
    a0 = (0 + 12) | 0;
    a1 = (s0 - s4) | 0;
    v1 = a1 << 2;
    v1 = (v1 + a1) | 0;
    v1 = v1 << 2;
    v1 = (v1 - a1) | 0;
    s1 = (v1 + 73) | 0;
    a1 = s1 | 0;
    a2 = v0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80015334:
    v0 = (s0 + fp) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    v0 = (v0 + s6) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0; a0 = (0 + 77) | 0; if (c) { pc = 0x80015374; continue; } }
  case 0x80015354:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27516) >>> 0, 4) | 0;
    a1 = s2 | 1; [v0, v1] = yield* call(ctx, sp, 0x80044e10, a0, a1, a2, a3);
  case 0x80015364:
    a0 = (0 + 77) | 0;
    a1 = s1 | 0;
    a2 = v0 | 0; pc = 0x80015380; continue;
  case 0x80015374:
    a1 = s1 | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3392) | 0;
  case 0x80015380:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80015388:
    s3 = (s3 + 1) | 0;
    v0 = s3 & 255;
    v0 = (v0 >>> 0) < 46 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = s3 & 255; if (c) { pc = 0x800152e0; continue; } }
  case 0x8001539c:
    s0 = s5 & 255;
    { const c = (s0 | 0) === 0; a0 = (0 + 144) | 0; if (c) { pc = 0x800153bc; continue; } }
  case 0x800153a8:
    a1 = (0 + 54) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28340) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800153bc:
    v0 = (0 + 39) | 0;
    { const c = (s0 | 0) === (v0 | 0); a0 = (0 + 144) | 0; if (c) { pc = 0x800153dc; continue; } }
  case 0x800153c8:
    a1 = (0 + 203) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28336) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800153dc:
    s6 = 0 | 0;
  case 0x800153e0:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800153e8:
    withdraw(ctx);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800153f0:
     pc = 0x80015204; continue;
  case 0x800153f8:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80015400:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80015408:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80015410:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80015418:
    fp = m.read(((sp) + 72) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 80) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`f8001511c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001b51c, translated instruction by instruction (94 instructions).
export function* f8001b51c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001b51c;
  for (;;) switch (pc) {
  case 0x8001b51c:
    sp = (sp + -40) | 0;
    m.write(((sp) + 32) >>> 0, 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002cc48, a0, a1, a2, a3);
  case 0x8001b538:
    a0 = (0 + 1) | 0;
    s2 = 0x80080000 | 0;
    s2 = m.read(((s2) + -27988) >>> 0, 1);
    s3 = 0x80080000 | 0;
    s3 = m.read(((s3) + -27986) >>> 0, 1);
    v0 = a0 | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28029) >>> 0, v0 & 0xff, 1);
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001b560:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001b56c:
    a0 = (0 + 1) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001b578:
    v0 = 0x801f0000 | 0;
    s1 = (v0 + 26264) | 0;
    a0 = m.read(((s1) + 10) >>> 0, 2);
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x8001b58c:
    a0 = m.read(((s1) + 16) >>> 0, 2);
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x8001b598:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x8001b5a0:
    v0 = 0x80200000 | 0;
    s0 = m.read(((v0) + -5014) >>> 0, 2);
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001b5b0:
    s0 = s0 << 16; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8001b5b8:
    a0 = (0 + 9006) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x8001b5c4:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8001b5d0:
     [v0, v1] = yield* call(ctx, sp, 0x80025710, a0, a1, a2, a3);
  case 0x8001b5d8:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001b5e0:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001b5ec:
    v0 = (0 + -1) | 0;
    a0 = s0 >> 16;
    { const c = (a0 | 0) === (v0 | 0);  if (c) { pc = 0x8001b610; continue; } }
  case 0x8001b5fc:
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x8001b604:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8001b610:
    a0 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x80044868, a0, a1, a2, a3);
  case 0x8001b618:
    v0 = v0 << 16;
    a0 = v0 >> 16;
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x8001b630; continue; } }
  case 0x8001b628:
     [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x8001b630:
    a0 = s3 | 0;
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x8001b644; continue; } }
  case 0x8001b63c:
     [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x8001b644:
    at = 0x80080000 | 0;
    m.write(((at) + -28029) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003d820, a0, a1, a2, a3);
  case 0x8001b654:
    a0 = m.read(((s1) + 10) >>> 0, 2);
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x8001b660:
    a0 = m.read(((s1) + 16) >>> 0, 2);
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x8001b66c:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cc98, a0, a1, a2, a3);
  case 0x8001b674:
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return v0;
  default: throw new Error(`f8001b51c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800289ec, translated instruction by instruction (16 instructions).
export function* f800289ec(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800289ec;
  for (;;) switch (pc) {
  case 0x800289ec:
    sp = (sp + -24) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27963) >>> 0, a0 & 0xff, 1);
    a0 = a0 & 255;
    { const c = (a0 | 0) !== 0; m.write(((sp) + 16) >>> 0, 0, 4); if (c) { pc = 0x80028a14; continue; } }
  case 0x80028a04:
     [v0, v1] = yield* call(ctx, sp, 0x8005e088, a0, a1, a2, a3);
  case 0x80028a0c:
     pc = 0x80028a1c; continue;
  case 0x80028a14:
     [v0, v1] = yield* call(ctx, sp, 0x8005e098, a0, a1, a2, a3);
  case 0x80028a1c:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f800289ec: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002cc48, translated instruction by instruction (20 instructions).
export function f8002cc48(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002cc48;
  for (;;) switch (pc) {
  case 0x8002cc48:
    a0 = (0 + 1) | 0;
    v0 = 0x80200000 | 0;
    a2 = (v0 + -22216) | 0;
    v0 = 0x801f0000 | 0;
    a1 = (v0 + 24168) | 0;
  case 0x8002cc5c:
    v0 = a0 & 255;
    a0 = (a0 + 1) | 0;
    v1 = v0 << 1;
    v0 = v0 << 2;
    v0 = (v0 + a1) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 4) | 0;
    v1 = (v1 + a2) | 0;
    v0 = v0 >> 8;
    m.write(((v1) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = a0 & 255;
    v0 = (v0 >>> 0) < 9 ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002cc5c; continue; } }
  case 0x8002cc90:
     return v0;
  default: throw new Error(`f8002cc48: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002cc98, translated instruction by instruction (93 instructions).
export function* f8002cc98(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002cc98;
  for (;;) switch (pc) {
  case 0x8002cc98:
    sp = (sp + -56) | 0;
    m.write(((sp) + 36) >>> 0, s5 >>> 0, 4);
    s5 = a0 | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = (0 + 1) | 0;
    v0 = 0x80200000 | 0;
    m.write(((sp) + 48) >>> 0, fp >>> 0, 4);
    fp = (v0 + -22216) | 0;
    v0 = 0x80090000 | 0;
    m.write(((sp) + 44) >>> 0, s7 >>> 0, 4);
    s7 = (v0 + -12888) | 0;
    v0 = 0x80200000 | 0;
    m.write(((sp) + 40) >>> 0, s6 >>> 0, 4);
    s6 = (v0 + -8296) | 0;
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    s4 = 0x801f0000 | 0;
    m.write(((sp) + 52) >>> 0, 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    a0 = s2 & 255;
  case 0x8002ccec:
    v1 = a0 << 1;
    v0 = (v1 + fp) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 2);
    { const c = (v0 | 0) === 0; s3 = s5 & 255; if (c) { pc = 0x8002cdc4; continue; } }
  case 0x8002cd04:
    v0 = (v1 + s7) | 0;
    s1 = a0 << 2;
    m.write(((v0) + 0) >>> 0, s3 & 0xffff, 2);
    v0 = (s4 + 24168) | 0;
    v0 = (s1 + v0) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 4) | 0;
    s0 = (s1 + s6) | 0;
    v0 = (v1 >>> 31) | 0;
    v1 = (v1 + v0) | 0;
    a0 = v1 >> 1;
    m.write(((s0) + 0) >>> 0, a0 >>> 0, 4);
    a1 = m.read(((s4) + 24168) >>> 0, 4) | 0;
    v0 = 0x10000 | 0;
    { const c = (a1 | 0) === (v0 | 0); v0 = 0x801f0000 | 0; if (c) { pc = 0x8002cd50; continue; } }
  case 0x8002cd40:
     [v0, v1] = yield* call(ctx, sp, 0x80044ecc, a0, a1, a2, a3);
  case 0x8002cd48:
    m.write(((s0) + 0) >>> 0, v0 >>> 0, 4);
    v0 = 0x801f0000 | 0;
  case 0x8002cd50:
    v0 = (v0 + 29952) | 0;
    v0 = (s1 + v0) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 4) | 0;
    a0 = m.read(((s0) + 0) >>> 0, 4) | 0;
    { const c = (v1 | 0) === (a0 | 0); v0 = (a0 | 0) < (v1 | 0) ? 1 : 0; if (c) { pc = 0x8002cd7c; continue; } }
  case 0x8002cd6c:
    { const c = (v0 | 0) !== 0; v0 = (v1 - a0) | 0; if (c) { pc = 0x8002cd80; continue; } }
  case 0x8002cd74:
    v0 = (a0 - v1) | 0; pc = 0x8002cd80; continue;
  case 0x8002cd7c:
    v0 = 0 | 0;
  case 0x8002cd80:
    [hi, lo] = div(0, v0, true);
    { const c = (s3 | 0) !== 0;  if (c) { pc = 0x8002cd90; continue; } }
  case 0x8002cd8c:
    throw new Error("break 7 at 0x8002cd8c");
  case 0x8002cd90:
    at = (0 + -1) | 0;
    { const c = (s3 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x8002cda8; continue; } }
  case 0x8002cd9c:
    { const c = (v0 | 0) !== (at | 0);  if (c) { pc = 0x8002cda8; continue; } }
  case 0x8002cda4:
    throw new Error("break 6 at 0x8002cda4");
  case 0x8002cda8:
    a0 = lo;
    v1 = s2 & 255;
    v0 = 0x80200000 | 0;
    v0 = (v0 + -8080) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    m.write(((v1) + 0) >>> 0, a0 >>> 0, 4);
  case 0x8002cdc4:
    s2 = (s2 + 1) | 0;
    v0 = s2 & 255;
    v0 = (v0 >>> 0) < 9 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = s2 & 255; if (c) { pc = 0x8002ccec; continue; } }
  case 0x8002cdd8:
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
     return v0;
  default: throw new Error(`f8002cc98: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003d820, translated instruction by instruction (47 instructions).
export function* f8003d820(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003d820;
  for (;;) switch (pc) {
  case 0x8003d820:
    sp = (sp + -32) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = 0 | 0;
    v1 = 0x80080000 | 0;
    v1 = (v1 + -27344) | 0;
    m.write(((sp) + 24) >>> 0, 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    v0 = s0 & 255;
  case 0x8003d840:
    v0 = (v0 + v1) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    s0 = (s0 + 1) | 0;
    v0 = s0 & 255;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s0 & 255; if (c) { pc = 0x8003d840; continue; } }
  case 0x8003d85c:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27967) >>> 0, 1);
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) === (v0 | 0); s0 = 0 | 0; if (c) { pc = 0x8003d8c4; continue; } }
  case 0x8003d870:
    v0 = 0x80200000 | 0;
    s1 = (v0 + -8104) | 0;
    v0 = s0 & 255;
  case 0x8003d87c:
    v0 = v0 << 3;
    v1 = (v0 + s1) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 2);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003d8b0; continue; } }
  case 0x8003d894:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27508) >>> 0, 4) | 0;
    a1 = m.read(((v1) + 2) >>> 0, 1);
    a2 = m.read(((v1) + 4) >>> 0, 2);
    a3 = m.read(((v1) + 6) >>> 0, 2);
    a0 = (a0 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003d498, a0, a1, a2, a3);
  case 0x8003d8b0:
    s0 = (s0 + 1) | 0;
    v0 = s0 & 255;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s0 & 255; if (c) { pc = 0x8003d87c; continue; } }
  case 0x8003d8c4:
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f8003d820: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044868, translated instruction by instruction (17 instructions).
export function f80044868(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044868;
  for (;;) switch (pc) {
  case 0x80044868:
    v0 = a0 & 255;
    v1 = (v0 + -12) | 0;
    v0 = (v1 >>> 0) < 86 ? 1 : 0;
    { const c = (v0 | 0) === 0; v1 = v1 << 2; if (c) { pc = 0x800448a4; continue; } }
  case 0x8004487c:
    v0 = 0x80010000 | 0;
    v0 = (v0 + 11148) | 0;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x80044898:
    a0 = (0 + 97) | 0; pc = 0x800448a4; continue;
  case 0x800448a0:
    a0 = 0 | 0;
  case 0x800448a4:
    v0 = a0 & 255; return v0;
  default: throw new Error(`f80044868: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80026088, translated instruction by instruction (18 instructions).
export function f80026088(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80026088;
  for (;;) switch (pc) {
  case 0x80026088:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27994) >>> 0, 1);
    m.write(((0x8007913c) + 1200) >>> 0, v0 & 0xffff, 2);
    { const c = (v0 | 0) !== 0; v0 = a0 & 1; if (c) { pc = 0x800260b8; continue; } }
  case 0x800260a0:
    v0 = (0 + -1) | 0;
    m.write(((0x8007913c) + 1228) >>> 0, 0 & 0xffff, 2);
    m.write(((0x8007913c) + 1224) >>> 0, 0 & 0xffff, 2);
    m.write(((0x8007913c) + 104) >>> 0, v0 & 0xffff, 2);
     pc = 0x800260c8; continue;
  case 0x800260b8:
    m.write(((0x8007913c) + 1224) >>> 0, v0 & 0xffff, 2);
    v0 = a1 & 255;
    m.write(((0x8007913c) + 1228) >>> 0, v0 & 0xffff, 2);
    m.write(((0x8007913c) + 104) >>> 0, a2 & 0xffff, 2);
  case 0x800260c8:
     return v0;
  default: throw new Error(`f80026088: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044e10, translated instruction by instruction (16 instructions).
export function pacMemberBE(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044e10;
  for (;;) switch (pc) {
  case 0x80044e10:
    a1 = a1 & 65535;
    a1 = a1 << 2;
    a1 = (a0 + a1) | 0;
    a1 = m.read(((a1) + 0) >>> 0, 4) | 0;
    v0 = a1 << 24;
    v1 = a1 & 65280;
    v1 = v1 << 8;
    v0 = v0 | v1;
    v1 = (a1 >>> 8) | 0;
    v1 = v1 & 65280;
    v0 = v0 | v1;
    a1 = (a1 >>> 24) | 0;
    v0 = v0 | a1;
    v0 = (v0 + a0) | 0; return v0;
  default: throw new Error(`pacMemberBE: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044e50, translated instruction by instruction (16 instructions).
export function f80044e50(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044e50;
  for (;;) switch (pc) {
  case 0x80044e50:
    a1 = a1 & 65535;
    a1 = a1 << 3;
    a1 = (a0 + a1) | 0;
    a1 = m.read(((a1) + 4) >>> 0, 4) | 0;
    v0 = a1 << 24;
    v1 = a1 & 65280;
    v1 = v1 << 8;
    v0 = v0 | v1;
    v1 = (a1 >>> 8) | 0;
    v1 = v1 & 65280;
    v0 = v0 | v1;
    a1 = (a1 >>> 24) | 0;
    v0 = v0 | a1;
    v0 = (v0 + a0) | 0; return v0;
  default: throw new Error(`f80044e50: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044ecc, translated instruction by instruction (7 instructions).
export function fmul8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044ecc;
  for (;;) switch (pc) {
  case 0x80044ecc:
    [hi, lo] = mult(a0, a1, true);
    v0 = lo;
    { const c = (v0 | 0) >= 0;  if (c) { pc = 0x80044ee0; continue; } }
  case 0x80044edc:
    v0 = (v0 + 255) | 0;
  case 0x80044ee0:
    v0 = v0 >> 8; return v0;
  default: throw new Error(`fmul8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80037e50, translated instruction by instruction (17 instructions).
export function* f80037e50(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80037e50;
  for (;;) switch (pc) {
  case 0x80037e50:
    sp = (sp + -24) | 0;
    v0 = 0x801f0000 | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = (v0 + 26264) | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
    a0 = m.read(((s0) + 18) >>> 0, 2);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80037e80; continue; } }
  case 0x80037e74:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80037e7c:
    m.write(((s0) + 18) >>> 0, 0 & 0xffff, 2);
  case 0x80037e80:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f80037e50: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80037e94, translated instruction by instruction (17 instructions).
export function* f80037e94(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80037e94;
  for (;;) switch (pc) {
  case 0x80037e94:
    sp = (sp + -24) | 0;
    v0 = 0x801f0000 | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = (v0 + 26264) | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
    a0 = m.read(((s0) + 20) >>> 0, 2);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80037ec4; continue; } }
  case 0x80037eb8:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80037ec0:
    m.write(((s0) + 20) >>> 0, 0 & 0xffff, 2);
  case 0x80037ec4:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f80037e94: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003bc3c, translated instruction by instruction (11 instructions).
export function spriteFree(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003bc3c;
  for (;;) switch (pc) {
  case 0x8003bc3c:
    v1 = 0x801f0000 | 0;
    v1 = (v1 + -4248) | 0;
    a0 = a0 << 16;
    a0 = a0 >> 16;
    v0 = a0 << 3;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 3;
    v0 = (v0 + v1) | 0;
    v1 = 0x80000000 | 0;
    m.write(((v0) + 0) >>> 0, v1 >>> 0, 4); return v0;
  default: throw new Error(`spriteFree: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003bdc0, translated instruction by instruction (20 instructions).
export function spriteLayer(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003bdc0;
  for (;;) switch (pc) {
  case 0x8003bdc0:
    v1 = a0 | 0;
    v0 = (v1 + 1) | 0;
    v0 = v0 & 65535;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0x801f0000 | 0; if (c) { pc = 0x8003be08; continue; } }
  case 0x8003bdd8:
    a0 = (a0 + -4248) | 0;
    v1 = v1 << 16;
    v1 = v1 >> 16;
    v0 = v1 << 3;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 3;
    a0 = (v0 + a0) | 0;
    v1 = m.read(((a0) + 0) >>> 0, 4) | 0;
    v0 = 0x80000000 | 0;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x8003be08; continue; } }
  case 0x8003be04:
    m.write(((a0) + 51) >>> 0, a1 & 0xff, 1);
  case 0x8003be08:
     return v0;
  default: throw new Error(`spriteLayer: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003a90c, translated instruction by instruction (4 instructions).
export function setPalette(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003a90c;
  for (;;) switch (pc) {
  case 0x8003a90c:
    a0 = (a0 + 8) | 0;
    m.write(((0x8007913c) + 416) >>> 0, a0 & 0xff, 1);
     return v0;
  default: throw new Error(`setPalette: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80026204, translated instruction by instruction (7 instructions).
export function repeatOn(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80026204;
  for (;;) switch (pc) {
  case 0x80026204:
    v0 = (0 + 1) | 0;
    m.write(((0x8007913c) + 96) >>> 0, v0 & 0xff, 1);
    v0 = (0 + 30) | 0;
    m.write(((0x8007913c) + 98) >>> 0, v0 & 0xffff, 2);
    m.write(((0x8007913c) + 100) >>> 0, 0 >>> 0, 4);
     return v0;
  default: throw new Error(`repeatOn: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80026220, translated instruction by instruction (3 instructions).
export function repeatOff(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80026220;
  for (;;) switch (pc) {
  case 0x80026220:
    m.write(((0x8007913c) + 96) >>> 0, 0 & 0xff, 1);
     return v0;
  default: throw new Error(`repeatOff: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044904, translated instruction by instruction (127 instructions).
export function memcpy(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044904;
  for (;;) switch (pc) {
  case 0x80044904:
    { const c = (a2 | 0) >= 0; v0 = a2 | 0; if (c) { pc = 0x80044910; continue; } }
  case 0x8004490c:
    v0 = (a2 + 63) | 0;
  case 0x80044910:
    t1 = v0 >> 6;
    a3 = t1 | 0;
    v1 = a3 | 0;
    v0 = a3 << 6;
    t1 = (a2 - v0) | 0;
    a2 = a0 | 0;
    t0 = a1 | 0;
    { const c = (v1 | 0) === 0; a3 = (a3 + -1) | 0; if (c) { pc = 0x80044ac4; continue; } }
  case 0x80044934:
    a0 = (a0 + 62) | 0;
    a1 = (a1 + 62) | 0;
  case 0x8004493c:
    v0 = m.read(((a2) + 0) >>> 0, 2);
    m.write(((t0) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -60) >>> 0, 2);
    m.write(((a1) + -60) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -58) >>> 0, 2);
    m.write(((a1) + -58) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -56) >>> 0, 2);
    m.write(((a1) + -56) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -54) >>> 0, 2);
    m.write(((a1) + -54) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -52) >>> 0, 2);
    m.write(((a1) + -52) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -50) >>> 0, 2);
    m.write(((a1) + -50) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -48) >>> 0, 2);
    m.write(((a1) + -48) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -46) >>> 0, 2);
    m.write(((a1) + -46) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -44) >>> 0, 2);
    m.write(((a1) + -44) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -42) >>> 0, 2);
    m.write(((a1) + -42) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -40) >>> 0, 2);
    m.write(((a1) + -40) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -38) >>> 0, 2);
    m.write(((a1) + -38) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -36) >>> 0, 2);
    m.write(((a1) + -36) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -34) >>> 0, 2);
    m.write(((a1) + -34) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -32) >>> 0, 2);
    m.write(((a1) + -32) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -30) >>> 0, 2);
    m.write(((a1) + -30) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -28) >>> 0, 2);
    m.write(((a1) + -28) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -26) >>> 0, 2);
    m.write(((a1) + -26) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -24) >>> 0, 2);
    m.write(((a1) + -24) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -22) >>> 0, 2);
    m.write(((a1) + -22) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -20) >>> 0, 2);
    m.write(((a1) + -20) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -18) >>> 0, 2);
    m.write(((a1) + -18) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -16) >>> 0, 2);
    m.write(((a1) + -16) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -14) >>> 0, 2);
    m.write(((a1) + -14) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -12) >>> 0, 2);
    m.write(((a1) + -12) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -10) >>> 0, 2);
    m.write(((a1) + -10) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -8) >>> 0, 2);
    a2 = (a2 + 64) | 0;
    m.write(((a1) + -8) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -6) >>> 0, 2);
    v1 = a3 | 0;
    m.write(((a1) + -6) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -4) >>> 0, 2);
    a3 = (a3 + -1) | 0;
    m.write(((a1) + -4) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + -2) >>> 0, 2);
    t0 = (t0 + 64) | 0;
    m.write(((a1) + -2) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + 0) >>> 0, 2);
    a0 = (a0 + 64) | 0;
    m.write(((a1) + 0) >>> 0, v0 & 0xffff, 2);
    { const c = (v1 | 0) !== 0; a1 = (a1 + 64) | 0; if (c) { pc = 0x8004493c; continue; } }
  case 0x80044ac4:
    { const c = (t1 | 0) === 0;  if (c) { pc = 0x80044af8; continue; } }
  case 0x80044acc:
    a1 = a2 | 0;
    a0 = t0 | 0;
    { const c = (t1 | 0) === 0; v1 = (t1 + -1) | 0; if (c) { pc = 0x80044af8; continue; } }
  case 0x80044adc:
    a2 = (0 + -1) | 0;
  case 0x80044ae0:
    v0 = m.read(((a1) + 0) >>> 0, 1);
    a1 = (a1 + 1) | 0;
    v1 = (v1 + -1) | 0;
    m.write(((a0) + 0) >>> 0, v0 & 0xff, 1);
    { const c = (v1 | 0) !== (a2 | 0); a0 = (a0 + 1) | 0; if (c) { pc = 0x80044ae0; continue; } }
  case 0x80044af8:
     return v0;
  default: throw new Error(`memcpy: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001824c, translated instruction by instruction (115 instructions).
export function* save(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001824c;
  for (;;) switch (pc) {
  case 0x8001824c:
    sp = (sp + -40) | 0;
    m.write(((sp) + 36) >>> 0, 0, 4);
    m.write(((sp) + 32) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8002cc48, a0, a1, a2, a3);
  case 0x8001826c:
    a0 = (0 + 25) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80018278:
    a0 = (0 + 25) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80018284:
    a0 = (0 + 25) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80018290:
    a0 = (0 + 25) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001829c:
    a0 = (0 + 25) | 0;
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800182a8:
    v0 = 0x801f0000 | 0;
    s2 = (v0 + 26264) | 0;
    a0 = m.read(((s2) + 2) >>> 0, 2);
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800182bc:
    a0 = m.read(((s2) + 4) >>> 0, 2);
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800182c8:
    a0 = m.read(((s2) + 6) >>> 0, 2);
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800182d4:
    a0 = m.read(((s2) + 10) >>> 0, 2);
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800182e0:
    a0 = m.read(((s2) + 16) >>> 0, 2);
    a1 = (0 + 15) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800182ec:
    v0 = 0x80200000 | 0;
    v1 = (v0 + -5016) | 0;
    s1 = 0x80080000 | 0;
    s1 = m.read(((s1) + -27988) >>> 0, 1);
    s4 = 0x80080000 | 0;
    s4 = m.read(((s4) + -27986) >>> 0, 1);
    s0 = m.read(((v0) + -5016) >>> 0, 2);
    s3 = m.read(((v1) + 2) >>> 0, 2);
    a0 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x80018314:
    a0 = (0 + 1) | 0;
    v0 = a0 | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28029) >>> 0, v0 & 0xff, 1);
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8001832c:
    s0 = s0 << 16; [v0, v1] = yield* call(ctx, sp, 0x80017e14, a0, a1, a2, a3);
  case 0x80018334:
    a0 = (0 + 1) | 0;
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80018340:
    a0 = s0 >> 16;
    s0 = (0 + -1) | 0;
    { const c = (a0 | 0) === (s0 | 0); v0 = s3 << 16; if (c) { pc = 0x8001835c; continue; } }
  case 0x80018350:
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80018358:
    v0 = s3 << 16;
  case 0x8001835c:
    a0 = v0 >> 16;
    { const c = (a0 | 0) === (s0 | 0);  if (c) { pc = 0x80018370; continue; } }
  case 0x80018368:
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80018370:
    a0 = s1 & 255; [v0, v1] = yield* call(ctx, sp, 0x80044868, a0, a1, a2, a3);
  case 0x80018378:
    a0 = v0 & 255;
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x8001838c; continue; } }
  case 0x80018384:
     [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x8001838c:
    a0 = s4 & 255;
    { const c = (a0 | 0) === 0;  if (c) { pc = 0x800183a0; continue; } }
  case 0x80018398:
     [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x800183a0:
    a0 = m.read(((s2) + 2) >>> 0, 2);
    a1 = (0 + 14) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800183ac:
    a0 = m.read(((s2) + 4) >>> 0, 2);
    a1 = (0 + 12) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800183b8:
    a0 = m.read(((s2) + 6) >>> 0, 2);
    a1 = (0 + 13) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800183c4:
    a0 = m.read(((s2) + 10) >>> 0, 2);
    a1 = (0 + 8) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800183d0:
    a0 = m.read(((s2) + 16) >>> 0, 2);
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800183dc:
    at = 0x80080000 | 0;
    m.write(((at) + -28029) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003d820, a0, a1, a2, a3);
  case 0x800183ec:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cc98, a0, a1, a2, a3);
  case 0x800183f4:
    s4 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return v0;
  default: throw new Error(`save: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80017e14, translated instruction by instruction (270 instructions).
export function* f80017e14(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80017e14;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x80017e14:
    sp = (sp + -64) | 0;
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    s2 = 0 | 0;
    v0 = (0 + 1) | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 1) | 0;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    s3 = (0 + 127) | 0;
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 60) >>> 0, 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -28022) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27362) >>> 0, v0 & 0xff, 1);
    s4 = 0x801f0000 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017e58:
    v0 = (0 + 3) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27964) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80029a6c, a0, a1, a2, a3);
  case 0x80017e6c:
    a0 = (0 + 50) | 0;
  case 0x80017e70:
    a1 = (0 + 60) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3536) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80017e84:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27964) >>> 0, 1);
    { const c = (v1 | 0) !== (s1 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x80017ea0; continue; } }
  case 0x80017e98:
    at = 0x80080000 | 0;
    m.write(((at) + -27965) >>> 0, 0 & 0xff, 1);
  case 0x80017ea0:
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80017eb0; continue; } }
  case 0x80017ea8:
    at = 0x80080000 | 0;
    m.write(((at) + -27965) >>> 0, s1 & 0xff, 1);
  case 0x80017eb0:
    s0 = 0x80080000 | 0;
    s0 = m.read(((s0) + -27965) >>> 0, 1);
    v0 = s0 & 255;
  case 0x80017ec0:
    { const c = (v0 | 0) !== 0; a0 = (0 + 35) | 0; if (c) { pc = 0x80017eec; continue; } }
  case 0x80017ec8:
    a1 = (0 + 90) | 0;
    a2 = (0 + 117) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s3 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x80017ee4:
    v0 = s0 & 255; pc = 0x80017f24; continue;
  case 0x80017eec:
    a1 = (0 + 89) | 0;
    a2 = (0 + 117) | 0;
    a3 = (0 + 18) | 0;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80017f20:
    v0 = s0 & 255;
  case 0x80017f24:
    { const c = (v0 | 0) !== (s1 | 0); a1 = (0 + 89) | 0; if (c) { pc = 0x80017f54; continue; } }
  case 0x80017f2c:
    a0 = (0 + 170) | 0;
    a1 = (0 + 90) | 0;
    a2 = (0 + 117) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s3 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x80017f4c:
    v0 = s0 & 255; pc = 0x80017f8c; continue;
  case 0x80017f54:
    a0 = (0 + 170) | 0;
    a2 = (0 + 117) | 0;
    a3 = (0 + 18) | 0;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80017f88:
    v0 = s0 & 255;
  case 0x80017f8c:
    { const c = (v0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x80017f98; continue; } }
  case 0x80017f94:
    a0 = 0 | 0;
  case 0x80017f98:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80017fa0:
    a0 = (0 + 40) | 0;
    a1 = (0 + 90) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3572) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80017fb8:
    v0 = s0 & 255;
    { const c = (v0 | 0) !== (s1 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80017fc8; continue; } }
  case 0x80017fc4:
    a0 = 0 | 0;
  case 0x80017fc8:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80017fd0:
    a0 = (0 + 175) | 0;
    a1 = (0 + 90) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3592) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80017fe8:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80017ff0:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017ff8:
    offer(ctx, [box(0, 0x23, 0x59, 0x75, 0x12), box(1, 0xaa, 0x59, 0x75, 0x12)], () => s0 & 0xff, ["left", "right"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80018000:
    v0 = m.read(((s4) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 8192;
    { const c = (v0 | 0) === 0; v0 = s0 & 255; if (c) { pc = 0x80018028; continue; } }
  case 0x80018014:
    { const c = (v0 | 0) === (s1 | 0);  if (c) { pc = 0x80018028; continue; } }
  case 0x8001801c:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018024:
    s0 = (s0 + 1) | 0;
  case 0x80018028:
    v0 = m.read(((s4) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 32768;
    { const c = (v0 | 0) === 0; v0 = s0 & 255; if (c) { pc = 0x80018050; continue; } }
  case 0x8001803c:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80018050; continue; } }
  case 0x80018044:
    s0 = (s0 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018050:
    v1 = m.read(((s4) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 40960;
    { const c = (v0 | 0) === 0; v0 = (0 + -1) | 0; if (c) { pc = 0x80018068; continue; } }
  case 0x80018064:
    m.write(((0x8007913c) + 41) >>> 0, v0 & 0xff, 1);
  case 0x80018068:
    v0 = v1 & 68;
    { const c = (v0 | 0) === 0; v0 = v1 & 33; if (c) { pc = 0x80018084; continue; } }
  case 0x80018074:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001807c:
    s2 = (0 + 1) | 0; pc = 0x800181fc; continue;
  case 0x80018084:
    { const c = (v0 | 0) === 0; v0 = s0 & 255; if (c) { pc = 0x80017ec0; continue; } }
  case 0x8001808c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80018094:
    at = 0x80080000 | 0;
    m.write(((at) + -27965) >>> 0, s0 & 0xff, 1);
    s0 = s0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800180a4:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800180ac:
    a0 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80029ad0, a0, a1, a2, a3);
  case 0x800180b4:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800180c0:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x800180c8:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800180d0:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800180d8:
    v0 = (m.read(((0x8007913c) + 41) >>> 0, 1) << 24) >> 24;
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x800180f0; continue; } }
  case 0x800180e8:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s1 & 0xff, 1);
  case 0x800180f0:
    a0 = (0 + 33) | 0;
    a1 = (0 + 70) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3612) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s1 & 0xff, 1);
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018110:
    a0 = (0 + 100) | 0;
    a1 = a0 | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3652) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018128:
    a0 = (0 + 76) | 0;
    a1 = (0 + 120) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3672) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80018140:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80018148:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80018150:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x80018158:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) !== (s1 | 0);  if (c) { pc = 0x800181e0; continue; } }
  case 0x8001816c:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27368) >>> 0, s1 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x800298e4, a0, a1, a2, a3);
  case 0x80018184:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002bd1c, a0, a1, a2, a3);
  case 0x80018194:
    v1 = v0 | 0;
    v0 = (0 + -1) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x800181d0; continue; } }
  case 0x800181a4:
    m.write(((0x8007913c) + 41) >>> 0, v1 & 0xff, 1);
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800181b0:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800181b8:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800181c0:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800181c8:
     pc = 0x800181fc; continue;
  case 0x800181d0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    m.write(((0x8007913c) + 41) >>> 0, v0 & 0xff, 1);
  case 0x800181e0:
     [v0, v1] = yield* call(ctx, sp, 0x80017854, a0, a1, a2, a3);
  case 0x800181e8:
    s2 = v0 | 0;
    { const c = (s2 | 0) !== 0;  if (c) { pc = 0x800181fc; continue; } }
  case 0x800181f4:
     [v0, v1] = yield* call(ctx, sp, 0x8002bfe8, a0, a1, a2, a3);
  case 0x800181fc:
    { const c = (s2 | 0) !== (s1 | 0); a0 = (0 + 50) | 0; if (c) { pc = 0x80017e70; continue; } }
  case 0x80018204:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8001820c:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80018218:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80018220:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80018228:
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`f80017e14: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80017854, translated instruction by instruction (368 instructions).
export function* f80017854(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80017854;
  for (;;) switch (pc) {
  case 0x80017854:
    sp = (sp + -80) | 0;
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    s4 = 0x80080000 | 0;
    s4 = m.read(((s4) + -27966) >>> 0, 1);
    m.write(((sp) + 72) >>> 0, fp >>> 0, 4);
    fp = 0 | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 1) | 0;
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    s6 = (0 + 1) | 0;
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    s7 = (0 + 4) | 0;
    m.write(((sp) + 76) >>> 0, 0, 4);
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
  case 0x80017898:
    s5 = (0 + 42) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800178a0:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x800178a8:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800178b0:
    a0 = (0 + 9202) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c7c0, a0, a1, a2, a3);
  case 0x800178b8:
    at = 0x80080000 | 0;
    m.write(((at) + -28025) >>> 0, s6 & 0xff, 1);
    a0 = (0 + 9201) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x800178cc:
    a0 = (0 + 2) | 0;
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cae0, a0, a1, a2, a3);
  case 0x800178d8:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x800178e0:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x8001791c:
    t0 = 0x801f0000 | 0;
    v0 = m.read(((t0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 8192;
    { const c = (v0 | 0) === 0; v1 = s4 & 255; if (c) { pc = 0x80017950; continue; } }
  case 0x80017934:
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x80017950; continue; } }
  case 0x80017940:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80017948:
    s4 = (s4 + 1) | 0;
    t0 = 0x801f0000 | 0;
  case 0x80017950:
    v0 = m.read(((t0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 32768;
    { const c = (v0 | 0) === 0; v0 = s4 & 255; if (c) { pc = 0x80017978; continue; } }
  case 0x80017964:
    { const c = (v0 | 0) === 0; t0 = 0x801f0000 | 0; if (c) { pc = 0x8001797c; continue; } }
  case 0x8001796c:
    s4 = (s4 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80017978:
    t0 = 0x801f0000 | 0;
  case 0x8001797c:
    v0 = m.read(((t0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 40960;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80017998; continue; } }
  case 0x80017990:
    { const c = (s1 | 0) !== (s6 | 0); a0 = (0 + 14) | 0; if (c) { pc = 0x80017a44; continue; } }
  case 0x80017998:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800179a0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    { const c = (v0 | 0) !== 0; a0 = (0 + 10) | 0; if (c) { pc = 0x800179c4; continue; } }
  case 0x800179b4:
    a1 = (0 + 12) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28328) | 0; pc = 0x800179d0; continue;
  case 0x800179c4:
    a1 = (0 + 11) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28320) | 0;
  case 0x800179d0:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800179d8:
    s3 = 0 | 0;
    s2 = s4 & 255;
    v0 = s3 & 255;
  case 0x800179e4:
    { const c = (s2 | 0) !== (v0 | 0); a0 = 0 | 0; if (c) { pc = 0x80017a28; continue; } }
  case 0x800179ec:
    a1 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x800179f4:
    a0 = (0 + 1) | 0;
    a1 = s2 | 0;
    s1 = v0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80017a04:
    a0 = (0 + 2) | 0;
    a1 = s2 | 0;
    s0 = v0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80017a14:
    a0 = s2 | 0;
    a1 = s1 | 0;
    a2 = s0 | 0;
    a3 = v0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x800338ac, a0, a1, a2, a3);
  case 0x80017a28:
    s3 = (s3 + 1) | 0;
    v0 = s3 & 255;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s3 & 255; if (c) { pc = 0x800179e4; continue; } }
  case 0x80017a3c:
    s1 = 0 | 0;
    a0 = (0 + 14) | 0;
  case 0x80017a44:
    v0 = s4 & 255;
    a2 = v0 << 2;
    a2 = (a2 + v0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 23) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 52) | 0;
    a3 = (0 + 36) | 0;
    v0 = (0 + 120) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 144) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s7 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80017a84:
    s3 = 0 | 0;
    s0 = s3 & 255;
  case 0x80017a8c:
    v0 = s4 & 255;
    { const c = (s0 | 0) !== (v0 | 0); a0 = (0 + 3) | 0; if (c) { pc = 0x80017b2c; continue; } }
  case 0x80017a98:
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80017aa0:
    v0 = v0 & 65535;
    { const c = (v0 | 0) === 0; a0 = (0 + 14) | 0; if (c) { pc = 0x80017ae8; continue; } }
  case 0x80017aac:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 61) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 18) | 0;
    a3 = 0 | 0;
    v0 = (0 + 52) | 0;
    t0 = (0 + 34) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s7 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80017ae8:
    a0 = (0 + 3) | 0;
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80017af4:
    v0 = v0 & 65535;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 14) | 0; if (c) { pc = 0x80017bd4; continue; } }
  case 0x80017b04:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 91) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 18) | 0;
    a3 = 0 | 0;
    t0 = (0 + 34) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); pc = 0x80017bc0; continue;
  case 0x80017b2c:
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80017b34:
    v0 = v0 & 65535;
    { const c = (v0 | 0) === 0; a0 = (0 + 14) | 0; if (c) { pc = 0x80017b7c; continue; } }
  case 0x80017b40:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 61) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 19) | 0;
    a3 = 0 | 0;
    v0 = (0 + 162) | 0;
    t0 = (0 + 34) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s7 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80017b7c:
    a0 = (0 + 3) | 0;
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80017b88:
    v0 = v0 & 65535;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 14) | 0; if (c) { pc = 0x80017bd4; continue; } }
  case 0x80017b98:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 91) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 19) | 0;
    a3 = 0 | 0;
    v0 = (0 + 108) | 0;
    t0 = (0 + 34) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
  case 0x80017bc0:
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s7 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80017bd4:
    s3 = (s3 + 1) | 0;
    v0 = s3 & 255;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = s3 & 255; if (c) { pc = 0x80017a8c; continue; } }
  case 0x80017be8:
    a0 = (0 + 2) | 0;
    a1 = (0 + 255) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cae0, a0, a1, a2, a3);
  case 0x80017bf4:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017bfc:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80017c04:
    t0 = 0x801f0000 | 0;
    v1 = m.read(((t0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 68;
    { const c = (v0 | 0) === 0; v0 = v1 & 33; if (c) { pc = 0x80017c44; continue; } }
  case 0x80017c1c:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80017c24:
    s0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80017c2c:
    fp = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017c34:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017c3c:
    a0 = (0 + 1) | 0; pc = 0x80017db0; continue;
  case 0x80017c44:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x800178d8; continue; } }
  case 0x80017c4c:
    at = 0x80080000 | 0;
    m.write(((at) + -27966) >>> 0, s4 & 0xff, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80017c5c:
    s0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80029a6c, a0, a1, a2, a3);
  case 0x80017c64:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) !== (s6 | 0);  if (c) { pc = 0x80017ca0; continue; } }
  case 0x80017c78:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80017c80:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017c88:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017c90:
     [v0, v1] = yield* call(ctx, sp, 0x8002a89c, a0, a1, a2, a3);
  case 0x80017c98:
     pc = 0x80017da4; continue;
  case 0x80017ca0:
    a0 = s4 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002bf98, a0, a1, a2, a3);
  case 0x80017ca8:
    { const c = (v0 | 0) !== (s6 | 0); a0 = 0x80010000 | 0; if (c) { pc = 0x80017cc4; continue; } }
  case 0x80017cb0:
    a0 = (a0 + 3904) | 0; [v0, v1] = yield* call(ctx, sp, 0x80025c74, a0, a1, a2, a3);
  case 0x80017cb8:
    v0 = v0 ^ 1;
    v0 = (v0 >>> 0) < 1 ? 1 : 0;
    s0 = v0 | 0;
  case 0x80017cc4:
     [v0, v1] = yield* call(ctx, sp, 0x80029a6c, a0, a1, a2, a3);
  case 0x80017ccc:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) !== (s6 | 0);  if (c) { pc = 0x80017d08; continue; } }
  case 0x80017ce0:
    s0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80017ce8:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017cf0:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017cf8:
     [v0, v1] = yield* call(ctx, sp, 0x8002a89c, a0, a1, a2, a3);
  case 0x80017d00:
     pc = 0x80017da4; continue;
  case 0x80017d08:
    { const c = (s0 | 0) !== (s6 | 0); a0 = (0 + 100) | 0; if (c) { pc = 0x800178d8; continue; } }
  case 0x80017d10:
    a1 = (0 + 1) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4128) | 0;
    a3 = a1 | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27636) >>> 0, 4) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27272) >>> 0, v0 >>> 0, 4);
    s1 = a1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80025a08, a0, a1, a2, a3);
  case 0x80017d38:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017d40:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80017d48:
    at = 0x80080000 | 0;
    m.write(((at) + -28030) >>> 0, 0 & 0xff, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033648, a0, a1, a2, a3);
  case 0x80017d58:
    v1 = (0 + -1) | 0;
    { const c = (v0 | 0) === (v1 | 0);  if (c) { pc = 0x80017d8c; continue; } }
  case 0x80017d64:
    at = 0x80080000 | 0;
    m.write(((at) + -28022) >>> 0, s6 & 0xff, 1);
    s0 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80017d74:
    fp = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017d7c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017d84:
     pc = 0x80017da4; continue;
  case 0x80017d8c:
    s0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80017d94:
    fp = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017d9c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017da4:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80017dac:
    a0 = (0 + 1) | 0;
  case 0x80017db0:
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80017db8:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80017dc0:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017dc8:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017dd0:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80017dd8:
    { const c = (s0 | 0) !== (s6 | 0); v0 = fp | 0; if (c) { pc = 0x80017898; continue; } }
  case 0x80017de0:
    fp = m.read(((sp) + 72) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 80) | 0;
     return v0;
  default: throw new Error(`f80017854: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001c7c0, translated instruction by instruction (15 instructions).
export function* f8001c7c0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001c7c0;
  for (;;) switch (pc) {
  case 0x8001c7c0:
    sp = (sp + -24) | 0;
    a2 = a0 & 65535;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x8001c7dc:
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a0 = (0 + 14) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003afc8, a0, a1, a2, a3);
  case 0x8001c7ec:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f8001c7c0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80025a08, translated instruction by instruction (81 instructions).
export function* f80025a08(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80025a08;
  for (;;) switch (pc) {
  case 0x80025a08:
    sp = (sp + -64) | 0;
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    s2 = a2 | 0;
    v0 = (a1 + -1) | 0;
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = a0 | 0;
    a0 = 0 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 320) | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = a3 | 0;
    v0 = v0 & 65535;
    v0 = v0 << 4;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    s3 = (v0 + 28) | 0;
    a3 = s3 | 0;
    m.write(((sp) + 56) >>> 0, 0, 4);
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80025a54:
    s0 = s0 & 65535;
    a0 = (s0 + 6) | 0;
    a1 = (0 + 70) | 0;
    a2 = s2 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80025a6c:
    s1 = s1 & 255;
    s2 = (0 + 1) | 0;
    { const c = (s1 | 0) !== (s2 | 0); a0 = s0 | 0; if (c) { pc = 0x80025ac0; continue; } }
  case 0x80025a7c:
    a1 = (0 + 64) | 0;
    v0 = s0 << 1;
    a2 = (0 + 320) | 0;
    a2 = (a2 - v0) | 0;
    a2 = a2 & 65534;
    a3 = s3 & 65532;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80025ac0:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80025ac8:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80025ad0:
    { const c = (s1 | 0) !== (s2 | 0); a0 = s0 | 0; if (c) { pc = 0x80025b1c; continue; } }
  case 0x80025ad8:
    a1 = (0 + 64) | 0;
    v0 = a0 << 1;
    a2 = (0 + 320) | 0;
    a2 = (a2 - v0) | 0;
    a2 = a2 & 65534;
    a3 = s3 & 65532;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80025b1c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80025b24:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80025b2c:
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
     return v0;
  default: throw new Error(`f80025a08: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80025c74, translated instruction by instruction (158 instructions).
export function* f80025c74(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80025c74;
  for (;;) switch (pc) {
  case 0x80025c74:
    sp = (sp + -64) | 0;
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = a0 | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 1) | 0;
    a0 = (0 + 10) | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 300) | 0;
    a3 = (0 + 80) | 0;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 60) >>> 0, 0, 4);
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80025cd4:
    s4 = 0x801f0000 | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80025cdc:
    s3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80025ce4:
    a0 = 0 | 0;
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80025cfc:
    a0 = (0 + 14) | 0;
    a1 = (0 + 68) | 0;
    a2 = s0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80025d10:
    s2 = (0 + 127) | 0;
  case 0x80025d14:
    v0 = m.read(((s4) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80025d3c; continue; } }
  case 0x80025d28:
    { const c = (v0 | 0) === (s3 | 0);  if (c) { pc = 0x80025d3c; continue; } }
  case 0x80025d30:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80025d38:
    s1 = (s1 + 1) | 0;
  case 0x80025d3c:
    v0 = m.read(((s4) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80025d64; continue; } }
  case 0x80025d50:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80025d64; continue; } }
  case 0x80025d58:
    s1 = (s1 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80025d64:
    v1 = m.read(((s4) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 33;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80025d90; continue; } }
  case 0x80025d78:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80025d9c; continue; } }
  case 0x80025d80:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80025d88:
    s0 = (0 + 1) | 0; pc = 0x80025eac; continue;
  case 0x80025d90:
    v0 = v1 & 68;
    { const c = (v0 | 0) === 0; s0 = s1 & 255; if (c) { pc = 0x80025dac; continue; } }
  case 0x80025d9c:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80025da4:
    s0 = 0 | 0; pc = 0x80025eac; continue;
  case 0x80025dac:
    { const c = (s0 | 0) !== 0; a0 = (0 + 100) | 0; if (c) { pc = 0x80025dd0; continue; } }
  case 0x80025db4:
    a1 = (0 + 104) | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x80025dd0:
    { const c = (s0 | 0) !== (s3 | 0); a1 = (0 + 122) | 0; if (c) { pc = 0x80025df4; continue; } }
  case 0x80025dd8:
    a0 = (0 + 100) | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x80025df4:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x80025e00; continue; } }
  case 0x80025dfc:
    a0 = 0 | 0;
  case 0x80025e00:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80025e08:
    a0 = (0 + 140) | 0;
    a1 = (0 + 104) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28248) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80025e20:
    v0 = s1 & 255;
    { const c = (v0 | 0) !== (s3 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80025e30; continue; } }
  case 0x80025e2c:
    a0 = 0 | 0;
  case 0x80025e30:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80025e38:
    a0 = (0 + 140) | 0;
    a1 = (0 + 122) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28240) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80025e50:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80025e58:
    a0 = (0 + 10) | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 300) | 0;
    a3 = (0 + 80) | 0;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80025e94:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80025e9c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80025ea4:
     pc = 0x80025d14; continue;
  case 0x80025eac:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = 0 | 0;
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80025ec4:
    v0 = s0 | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
     return v0;
  default: throw new Error(`f80025c74: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002a89c, translated instruction by instruction (57 instructions).
export function* f8002a89c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002a89c;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x8002a89c:
    sp = (sp + -48) | 0;
    m.write(((sp) + 44) >>> 0, 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x8002a8ac:
    s0 = 0x80010000 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8002a8b4:
    s0 = (s0 + 6104) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8002a8bc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8002a8c4:
    a0 = 0 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 28) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8002a8dc:
    a0 = (0 + 39) | 0;
    a1 = (0 + 70) | 0;
    a2 = s0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002a8f0:
    s0 = 0x801f0000 | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002a8f8:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002a900:
    v0 = m.read(((s0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 2293;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002a934; continue; } }
  case 0x8002a914:
     [v0, v1] = yield* call(ctx, sp, 0x8003aa8c, a0, a1, a2, a3);
  case 0x8002a91c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002a924:
    withdraw(ctx);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002a92c:
     pc = 0x8002a900; continue;
  case 0x8002a934:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8002a93c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002a944:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = 0 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 44) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8002a95c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002a964:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002a96c:
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 48) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`f8002a89c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003aa8c, translated instruction by instruction (67 instructions).
export function* f8003aa8c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003aa8c;
  for (;;) switch (pc) {
  case 0x8003aa8c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28064) >>> 0, 4) | 0;
    sp = (sp + -56) | 0;
    m.write(((sp) + 48) >>> 0, 0, 4);
    m.write(((sp) + 44) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    v0 = v0 >> 4;
    v0 = v0 & 1;
    { const c = (v0 | 0) === 0; m.write(((sp) + 24) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x8003aae0; continue; } }
  case 0x8003aac0:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27120) >>> 0, 2);
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27118) >>> 0, 2);
    a2 = 0 | 33923; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x8003aad8:
     pc = 0x8003ab70; continue;
  case 0x8003aae0:
    s0 = 0 | 0;
    s5 = (0 + 4) | 0;
    s4 = 0x80080000 | 0;
    s4 = m.read(((s4) + -27120) >>> 0, 2);
    s2 = 0x80080000 | 0;
    s2 = m.read(((s2) + -27118) >>> 0, 2);
    s3 = s4 << 16;
  case 0x8003aafc:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x8003ab04:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = s3 >> 16;
    a1 = s0 & 255;
    a1 = a1 << 2;
    a1 = (s2 + a1) | 0;
    a1 = a1 << 16;
    a1 = a1 >> 16;
    a2 = (0 + 96) | 0;
    a3 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037604, a0, a1, a2, a3);
  case 0x8003ab2c:
    s0 = (s0 + 1) | 0;
    s1 = s0 & 255;
    v0 = (s1 >>> 0) < (s5 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8003aafc; continue; } }
  case 0x8003ab40:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x8003ab48:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = s4 << 16;
    a0 = a0 >> 16;
    a1 = s1 << 2;
    a1 = (s2 + a1) | 0;
    a1 = a1 << 16;
    a1 = a1 >> 16;
    a2 = (0 + 96) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037604, a0, a1, a2, a3);
  case 0x8003ab70:
    s5 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 56) | 0;
     return v0;
  default: throw new Error(`f8003aa8c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002bf98, translated instruction by instruction (20 instructions).
export function f8002bf98(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002bf98;
  for (;;) switch (pc) {
  case 0x8002bf98:
    a2 = 0 | 0;
    a1 = 0 | 0;
    a0 = a0 & 255;
    v1 = 0x800b0000 | 0;
    v1 = (v1 + -16752) | 0;
    v0 = a0 << 5;
    v0 = (v0 - a0) | 0;
    v0 = v0 << 8;
    v1 = (v0 + v1) | 0;
  case 0x8002bfbc:
    v0 = a1 & 65535;
    v0 = (v1 + v0) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    a1 = (a1 + 1) | 0;
    a2 = a2 | v0;
    v0 = a1 & 65535;
    v0 = (v0 >>> 0) < 7936 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a2 & 255; if (c) { pc = 0x8002bfbc; continue; } }
  case 0x8002bfe0:
    v0 = (0 >>> 0) < (v0 >>> 0) ? 1 : 0; return v0;
  default: throw new Error(`f8002bf98: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80033648, translated instruction by instruction (128 instructions).
export function* f80033648(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80033648;
  for (;;) switch (pc) {
  case 0x80033648:
    sp = (sp + -64) | 0;
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = 0x80080000 | 0;
    s0 = m.read(((s0) + -27978) >>> 0, 2);
    v0 = (0 + 999) | 0;
    m.write(((sp) + 56) >>> 0, 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27978) >>> 0, s0 & 0xffff, 2);
    { const c = (s0 | 0) === (v0 | 0); v0 = (s0 + 1) | 0; if (c) { pc = 0x80033684; continue; } }
  case 0x8003367c:
    at = 0x80080000 | 0;
    m.write(((at) + -27978) >>> 0, v0 & 0xffff, 2);
  case 0x80033684:
    a0 = a0 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002afb8, a0, a1, a2, a3);
  case 0x8003368c:
    s2 = v0 | 0;
    s1 = (0 + -1) | 0;
    { const c = (s2 | 0) === (s1 | 0); v0 = s2 << 16; if (c) { pc = 0x8003381c; continue; } }
  case 0x8003369c:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002baa0, a0, a1, a2, a3);
  case 0x800336a4:
    v0 = v0 << 16;
    v0 = v0 >> 16;
    { const c = (v0 | 0) === (s1 | 0); a0 = 0 | 0; if (c) { pc = 0x800337fc; continue; } }
  case 0x800336b4:
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27966) >>> 0, 1);
    s3 = 0x801f0000 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x800336c4:
    a0 = (0 + 1) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27966) >>> 0, 1);
    s1 = v0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x800336d8:
    a0 = (0 + 2) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27966) >>> 0, 1);
    s0 = v0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x800336ec:
    a1 = s1 | 0;
    a2 = s0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27966) >>> 0, 1);
    a3 = v0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x800338ac, a0, a1, a2, a3);
  case 0x80033704:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27966) >>> 0, 1);
    s1 = (0 + 28) | 0; [v0, v1] = yield* call(ctx, sp, 0x80015d74, a0, a1, a2, a3);
  case 0x80033714:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x8003371c:
    a0 = 0 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 320) | 0;
    a3 = s1 | 0;
    s0 = 0x80010000 | 0;
    s0 = (s0 + 6348) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8003373c:
    a0 = (0 + 70) | 0;
    a1 = a0 | 0;
    a2 = s0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80033750:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80033758:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80033760:
    v0 = m.read(((s3) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 2293;
    { const c = (v0 | 0) !== 0; a0 = (0 + 64) | 0; if (c) { pc = 0x800337bc; continue; } }
  case 0x80033774:
    a1 = a0 | 0;
    a2 = (0 + 192) | 0;
    a3 = s1 & 65535;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x800337ac:
     [v0, v1] = yield* call(ctx, sp, 0x8003aa8c, a0, a1, a2, a3);
  case 0x800337b4:
     pc = 0x80033750; continue;
  case 0x800337bc:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800337c4:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800337cc:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = 0 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 44) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x800337e4:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800337ec:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800337f4:
     pc = 0x8003380c; continue;
  case 0x800337fc:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
    s2 = (0 + -1) | 0;
  case 0x8003380c:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x80033814:
    v0 = s2 << 16; pc = 0x80033824; continue;
  case 0x8003381c:
    at = 0x80080000 | 0;
    m.write(((at) + -27978) >>> 0, s0 & 0xffff, 2);
  case 0x80033824:
    v0 = v0 >> 16;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
     return v0;
  default: throw new Error(`f80033648: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80015d74, translated instruction by instruction (141 instructions).
export function* f80015d74(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80015d74;
  for (;;) switch (pc) {
  case 0x80015d74:
    sp = (sp + -72) | 0;
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    s5 = a0 | 0;
    m.write(((sp) + 64) >>> 0, 0, 4);
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80015d9c:
    a0 = 0 | 0;
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x80015dd8:
    a0 = (0 + 14) | 0;
    v0 = s5 & 255;
    a2 = v0 << 2;
    a2 = (a2 + v0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 23) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 52) | 0;
    a3 = (0 + 36) | 0;
    v0 = (0 + 120) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 144) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 4) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80015e20:
    s1 = 0 | 0;
    s4 = (0 + 34) | 0;
    s3 = (0 + 42) | 0;
    s2 = (0 + 4) | 0;
    s0 = s1 & 255;
  case 0x80015e34:
    v0 = s5 & 255;
    { const c = (s0 | 0) !== (v0 | 0); a0 = (0 + 3) | 0; if (c) { pc = 0x80015ecc; continue; } }
  case 0x80015e40:
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80015e48:
    v0 = v0 & 65535;
    { const c = (v0 | 0) === 0; a0 = (0 + 14) | 0; if (c) { pc = 0x80015e8c; continue; } }
  case 0x80015e54:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 61) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 18) | 0;
    a3 = 0 | 0;
    v0 = (0 + 52) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80015e8c:
    a0 = (0 + 3) | 0;
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80015e98:
    v0 = v0 & 65535;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 14) | 0; if (c) { pc = 0x80015f6c; continue; } }
  case 0x80015ea8:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 91) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 18) | 0;
    a3 = 0 | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); pc = 0x80015f58; continue;
  case 0x80015ecc:
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80015ed4:
    v0 = v0 & 65535;
    { const c = (v0 | 0) === 0; a0 = (0 + 14) | 0; if (c) { pc = 0x80015f18; continue; } }
  case 0x80015ee0:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 61) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 19) | 0;
    a3 = 0 | 0;
    v0 = (0 + 162) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80015f18:
    a0 = (0 + 3) | 0;
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80015f24:
    v0 = v0 & 65535;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 14) | 0; if (c) { pc = 0x80015f6c; continue; } }
  case 0x80015f34:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 91) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 19) | 0;
    a3 = 0 | 0;
    v0 = (0 + 108) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
  case 0x80015f58:
    m.write(((sp) + 20) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80015f6c:
    s1 = (s1 + 1) | 0;
    v0 = s1 & 255;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = s1 & 255; if (c) { pc = 0x80015e34; continue; } }
  case 0x80015f80:
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 72) | 0;
     return v0;
  default: throw new Error(`f80015d74: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80033be8, translated instruction by instruction (315 instructions).
export function f80033be8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80033be8;
  for (;;) switch (pc) {
  case 0x80033be8:
    sp = (sp + -80) | 0;
    a1 = a1 & 255;
    v1 = a1 << 5;
    v1 = (v1 - a1) | 0;
    v1 = v1 << 8;
    v0 = 0x800b0000 | 0;
    v0 = (v0 + -16752) | 0;
    t0 = (v1 + v0) | 0;
    a2 = (t0 + 1104) | 0;
    a1 = 0 | 0;
    a3 = a1 | 0;
  case 0x80033c14:
    v1 = a3 & 65535;
    v1 = v1 << 3;
    v0 = m.read(((a2) + 0) >>> 0, 1);
    v1 = (v1 + sp) | 0;
    v0 = (v0 >>> 7) | 0;
    m.write(((v1) + 0) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a2) + 0) >>> 0, 1);
    v0 = (v0 >>> 6) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 1) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a2) + 0) >>> 0, 1);
    v0 = (v0 >>> 5) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 2) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a2) + 0) >>> 0, 1);
    v0 = (v0 >>> 4) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 3) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a2) + 0) >>> 0, 1);
    v0 = (v0 >>> 3) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 4) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a2) + 0) >>> 0, 1);
    v0 = (v0 >>> 2) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 5) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a2) + 0) >>> 0, 1);
    a3 = (a3 + 1) | 0;
    v0 = (v0 >>> 1) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 6) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a2) + 0) >>> 0, 1);
    v0 = v0 & 1;
    m.write(((v1) + 7) >>> 0, v0 & 0xff, 1);
    v0 = a3 & 65535;
    v0 = (v0 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a2 = (a2 + 1) | 0; if (c) { pc = 0x80033c14; continue; } }
  case 0x80033cc4:
    a0 = a0 & 255;
    v0 = (0 + 1) | 0;
    { const c = (a0 | 0) === (v0 | 0); v0 = (a0 | 0) < 2 ? 1 : 0; if (c) { pc = 0x80033dd8; continue; } }
  case 0x80033cd4:
    { const c = (v0 | 0) === 0; v0 = (0 + 2) | 0; if (c) { pc = 0x80033cec; continue; } }
  case 0x80033cdc:
    { const c = (a0 | 0) === 0; v0 = a1 & 65535; if (c) { pc = 0x80033d04; continue; } }
  case 0x80033ce4:
     pc = 0x800340c8; continue;
  case 0x80033cec:
    { const c = (a0 | 0) === (v0 | 0); v0 = (0 + 3) | 0; if (c) { pc = 0x80034098; continue; } }
  case 0x80033cf4:
    { const c = (a0 | 0) === (v0 | 0); v0 = a1 & 65535; if (c) { pc = 0x800340a4; continue; } }
  case 0x80033cfc:
     pc = 0x800340c8; continue;
  case 0x80033d04:
    v0 = m.read(((sp) + 1) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033d18; continue; } }
  case 0x80033d14:
    a1 = (a1 + 1) | 0;
  case 0x80033d18:
    v0 = m.read(((sp) + 2) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033d2c; continue; } }
  case 0x80033d28:
    a1 = (a1 + 1) | 0;
  case 0x80033d2c:
    v0 = m.read(((sp) + 3) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033d40; continue; } }
  case 0x80033d3c:
    a1 = (a1 + 1) | 0;
  case 0x80033d40:
    v0 = m.read(((sp) + 14) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033d54; continue; } }
  case 0x80033d50:
    a1 = (a1 + 1) | 0;
  case 0x80033d54:
    v0 = m.read(((sp) + 18) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033d68; continue; } }
  case 0x80033d64:
    a1 = (a1 + 1) | 0;
  case 0x80033d68:
    v0 = m.read(((sp) + 19) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033d7c; continue; } }
  case 0x80033d78:
    a1 = (a1 + 1) | 0;
  case 0x80033d7c:
    v0 = m.read(((sp) + 21) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033d90; continue; } }
  case 0x80033d8c:
    a1 = (a1 + 1) | 0;
  case 0x80033d90:
    v0 = m.read(((sp) + 22) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033da4; continue; } }
  case 0x80033da0:
    a1 = (a1 + 1) | 0;
  case 0x80033da4:
    v0 = m.read(((sp) + 25) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033db8; continue; } }
  case 0x80033db4:
    a1 = (a1 + 1) | 0;
  case 0x80033db8:
    v0 = m.read(((sp) + 46) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033dcc; continue; } }
  case 0x80033dc8:
    a1 = (a1 + 1) | 0;
  case 0x80033dcc:
    v0 = m.read(((sp) + 48) >>> 0, 1);
     pc = 0x80034084; continue;
  case 0x80033dd8:
    v0 = m.read(((sp) + 4) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033dec; continue; } }
  case 0x80033de8:
    a1 = (a1 + 1) | 0;
  case 0x80033dec:
    v0 = m.read(((sp) + 5) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033e00; continue; } }
  case 0x80033dfc:
    a1 = (a1 + 1) | 0;
  case 0x80033e00:
    v0 = m.read(((sp) + 6) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033e14; continue; } }
  case 0x80033e10:
    a1 = (a1 + 1) | 0;
  case 0x80033e14:
    v0 = m.read(((sp) + 7) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033e28; continue; } }
  case 0x80033e24:
    a1 = (a1 + 1) | 0;
  case 0x80033e28:
    v0 = m.read(((sp) + 8) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033e3c; continue; } }
  case 0x80033e38:
    a1 = (a1 + 1) | 0;
  case 0x80033e3c:
    v0 = m.read(((sp) + 9) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033e50; continue; } }
  case 0x80033e4c:
    a1 = (a1 + 1) | 0;
  case 0x80033e50:
    v0 = m.read(((sp) + 10) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033e64; continue; } }
  case 0x80033e60:
    a1 = (a1 + 1) | 0;
  case 0x80033e64:
    v0 = m.read(((sp) + 11) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033e78; continue; } }
  case 0x80033e74:
    a1 = (a1 + 1) | 0;
  case 0x80033e78:
    v0 = m.read(((sp) + 12) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033e8c; continue; } }
  case 0x80033e88:
    a1 = (a1 + 1) | 0;
  case 0x80033e8c:
    v0 = m.read(((sp) + 13) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033ea0; continue; } }
  case 0x80033e9c:
    a1 = (a1 + 1) | 0;
  case 0x80033ea0:
    v0 = m.read(((sp) + 15) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033eb4; continue; } }
  case 0x80033eb0:
    a1 = (a1 + 1) | 0;
  case 0x80033eb4:
    v0 = m.read(((sp) + 16) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033ec8; continue; } }
  case 0x80033ec4:
    a1 = (a1 + 1) | 0;
  case 0x80033ec8:
    v0 = m.read(((sp) + 17) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033edc; continue; } }
  case 0x80033ed8:
    a1 = (a1 + 1) | 0;
  case 0x80033edc:
    v0 = m.read(((sp) + 20) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033ef0; continue; } }
  case 0x80033eec:
    a1 = (a1 + 1) | 0;
  case 0x80033ef0:
    v0 = m.read(((sp) + 23) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033f04; continue; } }
  case 0x80033f00:
    a1 = (a1 + 1) | 0;
  case 0x80033f04:
    v0 = m.read(((sp) + 24) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033f18; continue; } }
  case 0x80033f14:
    a1 = (a1 + 1) | 0;
  case 0x80033f18:
    v0 = m.read(((sp) + 26) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033f2c; continue; } }
  case 0x80033f28:
    a1 = (a1 + 1) | 0;
  case 0x80033f2c:
    v0 = m.read(((sp) + 27) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033f40; continue; } }
  case 0x80033f3c:
    a1 = (a1 + 1) | 0;
  case 0x80033f40:
    v0 = m.read(((sp) + 28) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033f54; continue; } }
  case 0x80033f50:
    a1 = (a1 + 1) | 0;
  case 0x80033f54:
    v0 = m.read(((sp) + 29) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033f68; continue; } }
  case 0x80033f64:
    a1 = (a1 + 1) | 0;
  case 0x80033f68:
    v0 = m.read(((sp) + 30) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033f7c; continue; } }
  case 0x80033f78:
    a1 = (a1 + 1) | 0;
  case 0x80033f7c:
    v0 = m.read(((sp) + 31) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033f90; continue; } }
  case 0x80033f8c:
    a1 = (a1 + 1) | 0;
  case 0x80033f90:
    v0 = m.read(((sp) + 32) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033fa4; continue; } }
  case 0x80033fa0:
    a1 = (a1 + 1) | 0;
  case 0x80033fa4:
    v0 = m.read(((sp) + 33) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033fb8; continue; } }
  case 0x80033fb4:
    a1 = (a1 + 1) | 0;
  case 0x80033fb8:
    v0 = m.read(((sp) + 34) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033fcc; continue; } }
  case 0x80033fc8:
    a1 = (a1 + 1) | 0;
  case 0x80033fcc:
    v0 = m.read(((sp) + 35) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033fe0; continue; } }
  case 0x80033fdc:
    a1 = (a1 + 1) | 0;
  case 0x80033fe0:
    v0 = m.read(((sp) + 36) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033ff4; continue; } }
  case 0x80033ff0:
    a1 = (a1 + 1) | 0;
  case 0x80033ff4:
    v0 = m.read(((sp) + 37) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80034008; continue; } }
  case 0x80034004:
    a1 = (a1 + 1) | 0;
  case 0x80034008:
    v0 = m.read(((sp) + 38) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003401c; continue; } }
  case 0x80034018:
    a1 = (a1 + 1) | 0;
  case 0x8003401c:
    v0 = m.read(((sp) + 39) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80034030; continue; } }
  case 0x8003402c:
    a1 = (a1 + 1) | 0;
  case 0x80034030:
    v0 = m.read(((sp) + 40) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80034044; continue; } }
  case 0x80034040:
    a1 = (a1 + 1) | 0;
  case 0x80034044:
    v0 = m.read(((sp) + 41) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80034058; continue; } }
  case 0x80034054:
    a1 = (a1 + 1) | 0;
  case 0x80034058:
    v0 = m.read(((sp) + 42) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003406c; continue; } }
  case 0x80034068:
    a1 = (a1 + 1) | 0;
  case 0x8003406c:
    v0 = m.read(((sp) + 43) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80034080; continue; } }
  case 0x8003407c:
    a1 = (a1 + 1) | 0;
  case 0x80034080:
    v0 = m.read(((sp) + 47) >>> 0, 1);
  case 0x80034084:
    { const c = (v0 | 0) === 0; v0 = a1 & 65535; if (c) { pc = 0x800340c8; continue; } }
  case 0x80034090:
    a1 = (a1 + 1) | 0; pc = 0x800340c4; continue;
  case 0x80034098:
    a1 = m.read(((t0) + 7282) >>> 0, 2);
    v0 = a1 & 65535; pc = 0x800340c8; continue;
  case 0x800340a4:
    v0 = m.read(((sp) + 52) >>> 0, 1);
    v1 = (0 >>> 0) < (v0 >>> 0) ? 1 : 0;
    v0 = m.read(((sp) + 54) >>> 0, 1);
    { const c = (v0 | 0) === 0; a1 = v1 | 0; if (c) { pc = 0x800340c4; continue; } }
  case 0x800340c0:
    a1 = (v1 + 1) | 0;
  case 0x800340c4:
    v0 = a1 & 65535;
  case 0x800340c8:
    sp = (sp + 80) | 0;
     return v0;
  default: throw new Error(`f80033be8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003cd78, translated instruction by instruction (45 instructions).
export function f8003cd78(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003cd78;
  for (;;) switch (pc) {
  case 0x8003cd78:
    t2 = a1 | 0;
    a1 = (0 + -1) | 0;
    v0 = m.read(((0x8007913c) + 440) >>> 0, 1);
    t4 = m.read(((sp) + 20) >>> 0, 4) | 0;
    t5 = m.read(((sp) + 24) >>> 0, 4) | 0;
    t1 = m.read(((sp) + 16) >>> 0, 2);
    t3 = m.read(((sp) + 32) >>> 0, 2);
    v0 = (v0 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) === 0; t0 = a0 | 0; if (c) { pc = 0x8003ce20; continue; } }
  case 0x8003cda0:
    a0 = 0x801d0000 | 0;
    v1 = m.read(((0x8007913c) + 440) >>> 0, 1);
    a0 = (a0 + 22056) | 0;
    v0 = v1 << 3;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 3;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 14) >>> 0, a3 & 0xff, 1);
    a1 = m.read(((0x8007913c) + 440) >>> 0, 1);
    v1 = t0 & 255;
    m.write(((v0) + 12) >>> 0, v1 & 0xffff, 2);
    m.write(((v0) + 4) >>> 0, t2 & 0xffff, 2);
    m.write(((v0) + 6) >>> 0, a2 & 0xffff, 2);
    v0 = a1 << 3;
    v0 = (v0 + a1) | 0;
    v0 = v0 << 3;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 15) >>> 0, t1 & 0xff, 1);
    v1 = m.read(((0x8007913c) + 440) >>> 0, 1);
    v0 = v1 << 3;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 3;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 51) >>> 0, t3 & 0xff, 1);
    m.write(((v0) + 8) >>> 0, t4 & 0xffff, 2);
    m.write(((v0) + 10) >>> 0, t5 & 0xffff, 2);
    v1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    a1 = m.read(((0x8007913c) + 440) >>> 0, 1);
    m.write(((v0) + 0) >>> 0, v1 >>> 0, 4);
    v0 = (a1 + 1) | 0;
    m.write(((0x8007913c) + 440) >>> 0, v0 & 0xff, 1);
  case 0x8003ce20:
    v0 = a1 << 16;
    v0 = v0 >> 16; return v0;
  default: throw new Error(`f8003cd78: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002afb8, translated instruction by instruction (330 instructions).
export function* f8002afb8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002afb8;
  for (;;) switch (pc) {
  case 0x8002afb8:
    sp = (sp + -96) | 0;
    m.write(((sp) + 84) >>> 0, s7 >>> 0, 4);
    s7 = a0 | 0;
    m.write(((sp) + 80) >>> 0, s6 >>> 0, 4);
    s6 = 0 | 0;
    m.write(((sp) + 68) >>> 0, s3 >>> 0, 4);
    s3 = 0x80070000 | 0;
    m.write(((sp) + 76) >>> 0, s5 >>> 0, 4);
    s5 = (s3 + -20788) | 0;
    m.write(((sp) + 64) >>> 0, s2 >>> 0, 4);
    s2 = (0 + 2) | 0;
    m.write(((sp) + 60) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 4) | 0;
    m.write(((sp) + 56) >>> 0, s0 >>> 0, 4);
    s0 = (0 + 1) | 0;
    m.write(((sp) + 72) >>> 0, s4 >>> 0, 4);
    s4 = s6 | 0;
    m.write(((sp) + 88) >>> 0, 0, 4);
  case 0x8002b000:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    v0 = (v0 + 48) | 0;
    m.write(((s5) + 19) >>> 0, v0 & 0xff, 1);
  case 0x8002b014:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002b024:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b038:
    v0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    v1 = v0 & 15;
    v0 = (0 + 3) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002b058; continue; } }
  case 0x8002b050:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s0 & 0xff, 1);
  case 0x8002b058:
    { const c = (v1 | 0) === (s2 | 0);  if (c) { pc = 0x8002b068; continue; } }
  case 0x8002b060:
    { const c = (v1 | 0) !== (s1 | 0);  if (c) { pc = 0x8002b0c8; continue; } }
  case 0x8002b068:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002b078:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b08c:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002b09c:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 44) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b0b0:
    v1 = m.read(((sp) + 40) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 44) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002b068; continue; } }
  case 0x8002b0c8:
    v0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    m.write(((sp) + 48) >>> 0, v0 >>> 0, 4);
    v0 = v0 & 15;
    { const c = (v0 | 0) === (s2 | 0); a0 = (0 + 2) | 0; if (c) { pc = 0x8002b330; continue; } }
  case 0x8002b0e0:
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x8002b318; continue; } }
  case 0x8002b0e8:
    { const c = (v0 | 0) === (s1 | 0); a0 = (0 + 4) | 0; if (c) { pc = 0x8002b330; continue; } }
  case 0x8002b0f0:
    { const c = (v0 | 0) === 0; a1 = (s3 + -20788) | 0; if (c) { pc = 0x8002b114; continue; } }
  case 0x8002b0f8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) !== (s0 | 0); v0 = (0 + -1) | 0; if (c) { pc = 0x8002b014; continue; } }
  case 0x8002b10c:
     pc = 0x8002b4b0; continue;
  case 0x8002b114:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a2 = (0 + 1) | 0;
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80063864, a0, a1, a2, a3);
  case 0x8002b128:
    m.write(((sp) + 48) >>> 0, v0 >>> 0, 4);
    v0 = v0 & 15;
    v1 = (0 + 7) | 0;
    { const c = (v0 | 0) !== (v1 | 0);  if (c) { pc = 0x8002b1ec; continue; } }
  case 0x8002b13c:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8002b144:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8002b14c:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8002b154:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002b15c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002b164:
    a0 = (0 + 98) | 0;
    a1 = (0 + 28) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 5956) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b17c:
    a0 = (0 + 58) | 0;
    a1 = (0 + 47) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 5976) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b194:
    a0 = (0 + 36) | 0;
    a1 = (0 + 66) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 6008) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b1ac:
    a0 = (0 + 63) | 0;
    a1 = (0 + 85) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 6044) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b1c4:
    a0 = (0 + 62) | 0;
    a1 = (0 + 104) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 6072) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b1dc:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002a320, a0, a1, a2, a3);
  case 0x8002b1e4:
     pc = 0x8002b344; continue;
  case 0x8002b1ec:
    { const c = (s4 | 0) !== 0; a1 = (0 + 64) | 0; if (c) { pc = 0x8002b000; continue; } }
  case 0x8002b1f4:
    a0 = 0 | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 28) | 0;
    s0 = 0x80010000 | 0;
    s0 = (s0 + 6244) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8002b210:
    a0 = (0 + 106) | 0;
    a1 = (0 + 70) | 0;
    a2 = s0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b224:
    a0 = (0 + 100) | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 28) | 0;
    s4 = (0 + 160) | 0;
    s3 = a0 | 0;
    s2 = (0 + 40) | 0;
    s1 = 0x40000000 | 0;
    s0 = (0 + 3) | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x8002b260:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002b268:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002b270:
    a0 = s3 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 28) | 0;
    m.write(((sp) + 16) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x8002b298:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002b2a0:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002b2a8:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -21172) | 0;
    v0 = 0x80070000 | 0;
    s0 = (v0 + -21616) | 0;
    a1 = s0 | 0;
    a2 = (0 + 384) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002b2c4:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27966) >>> 0, 1);
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = (v1 | 0) < 2 ? 1 : 0; if (c) { pc = 0x8002b30c; continue; } }
  case 0x8002b2d8:
    { const c = (v0 | 0) === 0; v0 = (0 + 2) | 0; if (c) { pc = 0x8002b2f0; continue; } }
  case 0x8002b2e0:
    { const c = (v1 | 0) === 0;  if (c) { pc = 0x8002b300; continue; } }
  case 0x8002b2e8:
     pc = 0x8002b368; continue;
  case 0x8002b2f0:
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x8002b354; continue; } }
  case 0x8002b2f8:
     pc = 0x8002b368; continue;
  case 0x8002b300:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -21232) | 0; pc = 0x8002b35c; continue;
  case 0x8002b30c:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -21212) | 0; pc = 0x8002b35c; continue;
  case 0x8002b318:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80015fa8, a0, a1, a2, a3);
  case 0x8002b320:
     [v0, v1] = yield* call(ctx, sp, 0x8002bfe8, a0, a1, a2, a3);
  case 0x8002b328:
     pc = 0x8002b344; continue;
  case 0x8002b330:
     [v0, v1] = yield* call(ctx, sp, 0x80029b34, a0, a1, a2, a3);
  case 0x8002b338:
    v0 = v0 << 24;
    v0 = v0 >> 24; pc = 0x8002b4b0; continue;
  case 0x8002b344:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s0 & 0xff, 1);
    v0 = (0 + -1) | 0; pc = 0x8002b4b0; continue;
  case 0x8002b354:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -21192) | 0;
  case 0x8002b35c:
    a1 = (s0 + -124) | 0;
    a2 = (0 + 17) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002b368:
    s0 = 0x800b0000 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c4c0, a0, a1, a2, a3);
  case 0x8002b370:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -21744) | 0;
    a2 = (0 + 512) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    s0 = (s0 + -16752) | 0;
    a1 = v0 << 5;
    a1 = (a1 - v0) | 0;
    a1 = a1 << 8;
    a1 = (a1 + s0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002b39c:
    a0 = s7 & 255; [v0, v1] = yield* call(ctx, sp, 0x80032120, a0, a1, a2, a3);
  case 0x8002b3a4:
    a0 = 0x800a0000 | 0;
    a0 = (a0 + -4424) | 0;
    a2 = (0 + 7288) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    s1 = (s0 + 512) | 0;
    a1 = v0 << 5;
    a1 = (a1 - v0) | 0;
    a1 = a1 << 8;
    a1 = (a1 + s1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002b3d0:
    a0 = 0x80090000 | 0;
    a0 = (a0 + -12864) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    a2 = (0 + 100) | 0;
    a1 = v0 << 5;
    a1 = (a1 - v0) | 0;
    a1 = a1 << 8;
    a1 = (a1 + s1) | 0;
    a1 = (a1 + 7288) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002b3fc:
    a1 = 0x80070000 | 0;
    a1 = (a1 + -20788) | 0;
    a3 = 0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    v0 = (0 + 7936) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    a0 = a0 << 4;
    a2 = v0 << 5;
    a2 = (a2 - v0) | 0;
    a2 = a2 << 8;
    a2 = (a2 + s0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063240, a0, a1, a2, a3);
  case 0x8002b438:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 48) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b44c:
    v0 = m.read(((sp) + 48) >>> 0, 4) | 0;
    { const c = (v0 | 0) === 0; v0 = s6 | 0; if (c) { pc = 0x8002b4b0; continue; } }
  case 0x8002b45c:
    s6 = (0 + -1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8002b464:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8002b46c:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8002b474:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002b47c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002b484:
    a0 = (0 + 63) | 0;
    a1 = (0 + 66) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 6104) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b49c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002a320, a0, a1, a2, a3);
  case 0x8002b4a4:
    at = 0x80080000 | 0;
    m.write(((at) + -27368) >>> 0, v0 & 0xff, 1);
    v0 = s6 | 0;
  case 0x8002b4b0:
    s7 = m.read(((sp) + 84) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 80) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 76) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 72) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 56) >>> 0, 4) | 0;
    sp = (sp + 96) | 0;
     return v0;
  default: throw new Error(`f8002afb8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002bfe8, translated instruction by instruction (124 instructions).
export function* f8002bfe8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002bfe8;
  for (;;) switch (pc) {
  case 0x8002bfe8:
    sp = (sp + -32) | 0;
    m.write(((sp) + 24) >>> 0, 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x80062504, a0, a1, a2, a3);
  case 0x8002bff8:
     [v0, v1] = yield* call(ctx, sp, 0x800624b4, a0, a1, a2, a3);
  case 0x8002c000:
    at = 0x80080000 | 0;
    m.write(((at) + -27964) >>> 0, 0 & 0xff, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80062544, a0, a1, a2, a3);
  case 0x8002c010:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002c024:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v1 = v0 & 15;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = (0 + 4) | 0; if (c) { pc = 0x8002c044; continue; } }
  case 0x8002c03c:
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002c094; continue; } }
  case 0x8002c044:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80062544, a0, a1, a2, a3);
  case 0x8002c04c:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002c060:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80062544, a0, a1, a2, a3);
  case 0x8002c068:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 20) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002c07c:
    v1 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 20) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002c044; continue; } }
  case 0x8002c094:
    v1 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = (0 + 1) | 0;
    v1 = v1 & 15;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x8002c0c0; continue; } }
  case 0x8002c0a8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27964) >>> 0, 1);
    v0 = v0 | 1;
    at = 0x80080000 | 0;
    m.write(((at) + -27964) >>> 0, v0 & 0xff, 1);
  case 0x8002c0c0:
    a0 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80062544, a0, a1, a2, a3);
  case 0x8002c0c8:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002c0dc:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v1 = v0 & 15;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = (0 + 4) | 0; if (c) { pc = 0x8002c0fc; continue; } }
  case 0x8002c0f4:
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002c14c; continue; } }
  case 0x8002c0fc:
    a0 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80062544, a0, a1, a2, a3);
  case 0x8002c104:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002c118:
    a0 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80062544, a0, a1, a2, a3);
  case 0x8002c120:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 20) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002c134:
    v1 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 20) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002c0fc; continue; } }
  case 0x8002c14c:
    v1 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = (0 + 1) | 0;
    v1 = v1 & 15;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x8002c178; continue; } }
  case 0x8002c160:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27964) >>> 0, 1);
    v0 = v0 | 2;
    at = 0x80080000 | 0;
    m.write(((at) + -27964) >>> 0, v0 & 0xff, 1);
  case 0x8002c178:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    { const c = (v0 | 0) !== 0; a0 = (0 + 16) | 0; if (c) { pc = 0x8002c190; continue; } }
  case 0x8002c18c:
    a0 = 0 | 0;
  case 0x8002c190:
     [v0, v1] = yield* call(ctx, sp, 0x80062544, a0, a1, a2, a3);
  case 0x8002c198:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002c1ac:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v1 = (0 + 3) | 0;
    v0 = v0 & 15;
    { const c = (v0 | 0) !== (v1 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x8002c1c8; continue; } }
  case 0x8002c1c0:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
  case 0x8002c1c8:
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f8002bfe8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002c4c0, translated instruction by instruction (14 instructions).
export function f8002c4c0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002c4c0;
  for (;;) switch (pc) {
  case 0x8002c4c0:
    v0 = 0x80090000 | 0;
    v0 = (v0 + -12864) | 0;
    v1 = (0 + 75) | 0;
    a0 = (0 + 65) | 0;
    m.write(((v0) + 92) >>> 0, v1 & 0xff, 1);
    v1 = (0 + 77) | 0;
    m.write(((v0) + 94) >>> 0, v1 & 0xff, 1);
    v1 = (0 + 73) | 0;
    m.write(((v0) + 96) >>> 0, v1 & 0xff, 1);
    v1 = (0 + 84) | 0;
    m.write(((v0) + 93) >>> 0, a0 & 0xff, 1);
    m.write(((v0) + 95) >>> 0, a0 & 0xff, 1);
    m.write(((v0) + 97) >>> 0, v1 & 0xff, 1); return v0;
  default: throw new Error(`f8002c4c0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002baa0, translated instruction by instruction (159 instructions).
export function* f8002baa0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002baa0;
  for (;;) switch (pc) {
  case 0x8002baa0:
    sp = (sp + -80) | 0;
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    s5 = a0 | 0;
    a0 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a1 = (v0 + -16752) | 0;
    m.write(((sp) + 72) >>> 0, 0, 4);
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = 0 | 0;
  case 0x8002badc:
    v1 = a0 & 65535;
    v0 = v1 << 5;
    v0 = (v0 - v1) | 0;
    v0 = v0 << 8;
    v1 = (v0 + a1) | 0;
    v0 = s0 & 65535;
  case 0x8002baf4:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    s0 = (s0 + 1) | 0;
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 7936 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s0 & 65535; if (c) { pc = 0x8002baf4; continue; } }
  case 0x8002bb10:
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = 0 | 0; if (c) { pc = 0x8002badc; continue; } }
  case 0x8002bb24:
    s6 = 0x80070000 | 0;
    s7 = (s6 + -20788) | 0;
    s4 = (0 + 3) | 0;
    s3 = (0 + 1) | 0;
    s1 = 0 | 0;
  case 0x8002bb38:
    s0 = s1 | 0;
    v0 = (s0 + 48) | 0;
  case 0x8002bb40:
    m.write(((s7) + 19) >>> 0, v0 & 0xff, 1);
    s2 = s0 & 65535;
  case 0x8002bb48:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002bb58:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002bb6c:
    v0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v1 = v0 & 15;
    { const c = (v1 | 0) !== (s4 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x8002bb88; continue; } }
  case 0x8002bb80:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s3 & 0xff, 1);
  case 0x8002bb88:
    { const c = (v1 | 0) === (v0 | 0); v0 = (0 + 4) | 0; if (c) { pc = 0x8002bb98; continue; } }
  case 0x8002bb90:
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002bbf8; continue; } }
  case 0x8002bb98:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002bba8:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002bbbc:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002bbcc:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 28) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002bbe0:
    v1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 28) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002bb98; continue; } }
  case 0x8002bbf8:
    v1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s3 | 0); m.write(((sp) + 32) >>> 0, v1 >>> 0, 4); if (c) { pc = 0x8002bc68; continue; } }
  case 0x8002bc10:
    v1 = v1 & 15;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002bc44; continue; } }
  case 0x8002bc20:
    a0 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80029b34, a0, a1, a2, a3);
  case 0x8002bc28:
    v0 = v0 << 24;
    v0 = v0 >> 24;
    v1 = (0 + -1) | 0;
    { const c = (v0 | 0) === (v1 | 0); s1 = (0 + 1) | 0; if (c) { pc = 0x8002bc68; continue; } }
  case 0x8002bc3c:
    s0 = (s0 + 1) | 0; pc = 0x8002bccc; continue;
  case 0x8002bc44:
    v0 = (0 + 4) | 0;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x8002bc20; continue; } }
  case 0x8002bc50:
    { const c = (v1 | 0) !== (s3 | 0);  if (c) { pc = 0x8002bc70; continue; } }
  case 0x8002bc58:
    a0 = s5 & 255; [v0, v1] = yield* call(ctx, sp, 0x80015fa8, a0, a1, a2, a3);
  case 0x8002bc60:
    { const c = (v0 | 0) === 0; s1 = (0 + 1) | 0; if (c) { pc = 0x8002bcc8; continue; } }
  case 0x8002bc68:
    v0 = (0 + -1) | 0; pc = 0x8002bcec; continue;
  case 0x8002bc70:
    { const c = (v1 | 0) === 0; a1 = (s6 + -20788) | 0; if (c) { pc = 0x8002bc80; continue; } }
  case 0x8002bc78:
    { const c = (v1 | 0) !== (s4 | 0);  if (c) { pc = 0x8002bb48; continue; } }
  case 0x8002bc80:
    v0 = s2 << 5;
    v0 = (v0 - s2) | 0;
    v0 = v0 << 8;
    a2 = 0x800b0000 | 0;
    a2 = (a2 + -16752) | 0;
    a2 = (v0 + a2) | 0;
    v0 = (0 + 7808) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a3 = (0 + 512) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062fa0, a0, a1, a2, a3);
  case 0x8002bcb4:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 32) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002bcc8:
    s0 = (s0 + 1) | 0;
  case 0x8002bccc:
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (s0 + 48) | 0; if (c) { pc = 0x8002bb40; continue; } }
  case 0x8002bcdc:
    v0 = s1 & 65535;
    { const c = (v0 | 0) !== 0; s1 = 0 | 0; if (c) { pc = 0x8002bb38; continue; } }
  case 0x8002bce8:
    v0 = 0 | 0;
  case 0x8002bcec:
    s7 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 80) | 0;
     return v0;
  default: throw new Error(`f8002baa0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800338ac, translated instruction by instruction (207 instructions).
export function* f800338ac(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800338ac;
  for (;;) switch (pc) {
  case 0x800338ac:
    sp = (sp + -64) | 0;
    m.write(((sp) + 40) >>> 0, s4 >>> 0, 4);
    s4 = a0 | 0;
    m.write(((sp) + 48) >>> 0, s6 >>> 0, 4);
    s6 = a1 | 0;
    m.write(((sp) + 52) >>> 0, s7 >>> 0, 4);
    s7 = a2 | 0;
    m.write(((sp) + 44) >>> 0, s5 >>> 0, 4);
    s5 = a3 | 0;
    a1 = 0 | 0;
    a0 = 0 | 0;
    v0 = s4 & 255;
    v1 = v0 << 5;
    v1 = (v1 - v0) | 0;
    v1 = v1 << 8;
    v0 = 0x800b0000 | 0;
    v0 = (v0 + -16752) | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    s0 = (v1 + v0) | 0;
    v1 = s0 | 0;
    m.write(((sp) + 56) >>> 0, 0, 4);
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    v0 = a0 & 65535;
  case 0x80033910:
    v0 = (v1 + v0) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    a0 = (a0 + 1) | 0;
    a1 = a1 | v0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 7936 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a0 & 65535; if (c) { pc = 0x80033910; continue; } }
  case 0x80033930:
    v0 = a1 & 255;
    { const c = (v0 | 0) === 0; a0 = 0 | 0; if (c) { pc = 0x80033b10; continue; } }
  case 0x8003393c:
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 20) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80033950:
    a0 = 0 | 0;
    a1 = (0 + 146) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 94) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80033968:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    { const c = (v0 | 0) !== 0; a0 = (0 + 10) | 0; if (c) { pc = 0x8003398c; continue; } }
  case 0x8003397c:
    a1 = (0 + 12) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28152) | 0; pc = 0x80033998; continue;
  case 0x8003398c:
    a1 = (0 + 12) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28144) | 0;
  case 0x80033998:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800339a0:
    a0 = (0 + 90) | 0;
    a1 = (0 + 12) | 0;
    a2 = s0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800339b4:
    a1 = (0 + 12) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 6372) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27120) >>> 0, 2);
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800339d0:
    a1 = (0 + 12) | 0;
    a2 = (s0 + 16) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27120) >>> 0, 2);
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800339e8:
    v0 = s4 & 255;
    s0 = v0 << 2;
    s0 = (s0 + v0) | 0;
    s2 = s0 << 4;
    s3 = (s2 + 51) | 0;
    a0 = s3 | 0;
    s0 = s0 << 1;
    s1 = (s0 + 146) | 0;
    a1 = s1 | 0;
    a2 = s5 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80038f58, a0, a1, a2, a3);
  case 0x80033a14:
    a1 = s1 | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28136) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27120) >>> 0, 2);
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80033a30:
    a0 = (s2 + 35) | 0;
    s0 = (s0 + 163) | 0;
    a1 = s0 | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28128) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80033a4c:
    a2 = s6 & 255;
    v0 = (a2 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = (s2 + 59) | 0; if (c) { pc = 0x80033a6c; continue; } }
  case 0x80033a5c:
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038b8c, a0, a1, a2, a3);
  case 0x80033a64:
    s2 = s7 & 255; pc = 0x80033a7c; continue;
  case 0x80033a6c:
    a0 = s3 | 0;
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038ce8, a0, a1, a2, a3);
  case 0x80033a78:
    s2 = s7 & 255;
  case 0x80033a7c:
    v0 = (s2 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = s4 & 255; if (c) { pc = 0x80033acc; continue; } }
  case 0x80033a88:
    s0 = v0 << 2;
    s0 = (s0 + v0) | 0;
    s1 = s0 << 4;
    a0 = (s1 + 83) | 0;
    s0 = s0 << 1;
    s0 = (s0 + 163) | 0;
    a1 = s0 | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28124) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80033ab4:
    a0 = (s1 + 107) | 0;
    a1 = s0 | 0;
    a2 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038b8c, a0, a1, a2, a3);
  case 0x80033ac4:
     pc = 0x80033bb8; continue;
  case 0x80033acc:
    s0 = v0 << 2;
    s0 = (s0 + v0) | 0;
    s1 = s0 << 4;
    a0 = (s1 + 83) | 0;
    s0 = s0 << 1;
    s0 = (s0 + 163) | 0;
    a1 = s0 | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28124) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80033af8:
    a0 = (s1 + 99) | 0;
    a1 = s0 | 0;
    a2 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038ce8, a0, a1, a2, a3);
  case 0x80033b08:
     pc = 0x80033bb8; continue;
  case 0x80033b10:
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 20) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80033b24:
    a0 = 0 | 0;
    a1 = (0 + 146) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 94) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80033b3c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    { const c = (v0 | 0) !== 0; a0 = (0 + 10) | 0; if (c) { pc = 0x80033b60; continue; } }
  case 0x80033b50:
    a1 = (0 + 12) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28152) | 0; pc = 0x80033b6c; continue;
  case 0x80033b60:
    a1 = (0 + 12) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28144) | 0;
  case 0x80033b6c:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80033b74:
    v0 = s4 & 255;
    a1 = v0 << 2;
    a1 = (a1 + v0) | 0;
    a0 = a1 << 4;
    a0 = (a0 + 55) | 0;
    a1 = a1 << 1;
    a1 = (a1 + 151) | 0;
    s0 = 0x80080000 | 0;
    s0 = (s0 + -28120) | 0;
    a2 = s0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80033ba4:
    a0 = (0 + 90) | 0;
    a1 = (0 + 12) | 0;
    a2 = s0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80033bb8:
    s7 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
     return v0;
  default: throw new Error(`f800338ac: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80038b8c, translated instruction by instruction (87 instructions).
export function* f80038b8c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80038b8c;
  for (;;) switch (pc) {
  case 0x80038b8c:
    sp = (sp + -64) | 0;
    m.write(((sp) + 52) >>> 0, s5 >>> 0, 4);
    s5 = a2 | 0;
    v1 = s5 & 255;
    v0 = 0xcccc0000 | 0;
    v0 = v0 | 52429;
    m.write(((sp) + 40) >>> 0, s2 >>> 0, 4);
    s2 = a0 | 0;
    [hi, lo] = mult(v1, v0, false);
    m.write(((sp) + 44) >>> 0, s3 >>> 0, 4);
    s3 = a1 | 0;
    v0 = 0x80080000 | 0;
    m.write(((sp) + 60) >>> 0, 0, 4);
    m.write(((sp) + 56) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 36) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, s0 >>> 0, 4);
    t0 = (v0 + -27936) | 0;
    a1 = (m.read(((t0) + 0) >>> 0, 1) << 24) >> 24;
    a2 = (m.read(((t0) + 1) >>> 0, 1) << 24) >> 24;
    a3 = (m.read(((t0) + 2) >>> 0, 1) << 24) >> 24;
    m.write(((sp) + 24) >>> 0, a1 & 0xff, 1);
    m.write(((sp) + 25) >>> 0, a2 & 0xff, 1);
    m.write(((sp) + 26) >>> 0, a3 & 0xff, 1);
    s1 = 0 | 0;
    s4 = a0 << 16;
    s6 = (0 + 4) | 0;
    t0 = hi;
    a0 = (t0 >>> 3) | 0;
    v0 = a0 << 2;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 1;
    v1 = (v1 - v0) | 0;
    v1 = v1 & 255;
    v1 = v1 << 8;
    v1 = (v1 + 20354) | 0;
    m.write(((sp) + 24) >>> 0, v1 & 0xffff, 2);
  case 0x80038c20:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80038c28:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = s4 >> 16;
    a1 = s1 & 255;
    a1 = a1 << 2;
    a1 = (s3 + a1) | 0;
    a1 = a1 << 16;
    a1 = a1 >> 16;
    a2 = (0 + 16) | 0;
    a3 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037604, a0, a1, a2, a3);
  case 0x80038c50:
    s1 = (s1 + 1) | 0;
    s0 = s1 & 255;
    v0 = (s0 >>> 0) < (s6 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80038c20; continue; } }
  case 0x80038c64:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80038c6c:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = s2 << 16;
    a0 = a0 >> 16;
    a1 = s0 << 2;
    a1 = (s3 + a1) | 0;
    a1 = a1 << 16;
    a1 = a1 >> 16;
    a2 = (0 + 16) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037604, a0, a1, a2, a3);
  case 0x80038c94:
    v1 = s5 & 255;
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = s2 & 65535; if (c) { pc = 0x80038cac; continue; } }
  case 0x80038ca4:
    s2 = (s2 + 2) | 0;
    a0 = s2 & 65535;
  case 0x80038cac:
    a1 = s3 & 65535;
    a2 = (sp + 24) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80038cbc:
    s6 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 32) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
     return v0;
  default: throw new Error(`f80038b8c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80038ce8, translated instruction by instruction (156 instructions).
export function* f80038ce8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80038ce8;
  for (;;) switch (pc) {
  case 0x80038ce8:
    sp = (sp + -88) | 0;
    v0 = 0x51eb0000 | 0;
    v0 = v0 | 34079;
    a2 = a2 & 65535;
    m.write(((sp) + 60) >>> 0, s3 >>> 0, 4);
    s3 = a0 | 0;
    m.write(((sp) + 56) >>> 0, s2 >>> 0, 4);
    s2 = a1 | 0;
    [hi, lo] = mult(a2, v0, false);
    v0 = 0x80080000 | 0;
    m.write(((sp) + 80) >>> 0, 0, 4);
    m.write(((sp) + 76) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 72) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 68) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 64) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s0 >>> 0, 4);
    t0 = (v0 + -27936) | 0;
    v1 = (m.read(((t0) + 0) >>> 0, 1) << 24) >> 24;
    a1 = (m.read(((t0) + 1) >>> 0, 1) << 24) >> 24;
    a3 = (m.read(((t0) + 2) >>> 0, 1) << 24) >> 24;
    m.write(((sp) + 24) >>> 0, v1 & 0xff, 1);
    m.write(((sp) + 25) >>> 0, a1 & 0xff, 1);
    m.write(((sp) + 26) >>> 0, a3 & 0xff, 1);
    v0 = 0x80080000 | 0;
    t0 = (v0 + -27932) | 0;
    { const n = ((((t0) + 3) >>> 0) & 3), w = m.read(((((t0) + 3) >>> 0) & ~3) >>> 0, 4) | 0; v1 = (v1 & (0x00ffffff >>> (n * 8))) | (w << (24 - n * 8)); }
    { const n = ((((t0) + 0) >>> 0) & 3), w = m.read(((((t0) + 0) >>> 0) & ~3) >>> 0, 4) >>> 0; v1 = (v1 & (0xffffff00 << ((3 - n) * 8))) | (w >>> (n * 8)); }
    a1 = (m.read(((t0) + 4) >>> 0, 1) << 24) >> 24;
    { const n = ((((sp) + 35) >>> 0) & 3), w = m.read(((((sp) + 35) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 35) >>> 0) & ~3) >>> 0, ((w & (0xffffff00 << (n * 8))) | (v1 >>> (24 - n * 8))) >>> 0, 4); }
    { const n = ((((sp) + 32) >>> 0) & 3), w = m.read(((((sp) + 32) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 32) >>> 0) & ~3) >>> 0, ((w & (0x00ffffff >>> ((3 - n) * 8))) | (v1 << (n * 8))) >>> 0, 4); }
    m.write(((sp) + 36) >>> 0, a1 & 0xff, 1);
    v0 = 0x80080000 | 0;
    t0 = (v0 + -27924) | 0;
    { const n = ((((t0) + 3) >>> 0) & 3), w = m.read(((((t0) + 3) >>> 0) & ~3) >>> 0, 4) | 0; v1 = (v1 & (0x00ffffff >>> (n * 8))) | (w << (24 - n * 8)); }
    { const n = ((((t0) + 0) >>> 0) & 3), w = m.read(((((t0) + 0) >>> 0) & ~3) >>> 0, 4) >>> 0; v1 = (v1 & (0xffffff00 << ((3 - n) * 8))) | (w >>> (n * 8)); }
    a1 = (m.read(((t0) + 4) >>> 0, 1) << 24) >> 24;
    a3 = (m.read(((t0) + 5) >>> 0, 1) << 24) >> 24;
    { const n = ((((sp) + 43) >>> 0) & 3), w = m.read(((((sp) + 43) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 43) >>> 0) & ~3) >>> 0, ((w & (0xffffff00 << (n * 8))) | (v1 >>> (24 - n * 8))) >>> 0, 4); }
    { const n = ((((sp) + 40) >>> 0) & 3), w = m.read(((((sp) + 40) >>> 0) & ~3) >>> 0, 4); m.write(((((sp) + 40) >>> 0) & ~3) >>> 0, ((w & (0x00ffffff >>> ((3 - n) * 8))) | (v1 << (n * 8))) >>> 0, 4); }
    m.write(((sp) + 44) >>> 0, a1 & 0xff, 1);
    m.write(((sp) + 45) >>> 0, a3 & 0xff, 1);
    v1 = (m.read(((t0) + 6) >>> 0, 1) << 24) >> 24;
    m.write(((sp) + 46) >>> 0, v1 & 0xff, 1);
    t1 = hi;
    a3 = 0xcccc0000 | 0;
    a3 = a3 | 52429;
    s1 = 0 | 0;
    [hi, lo] = mult(a2, a3, false);
    s6 = a0 << 16;
    s7 = (0 + 7) | 0;
    a1 = (t1 >>> 5) | 0;
    v1 = a1 << 1;
    v1 = (v1 + a1) | 0;
    v1 = v1 << 3;
    v1 = (v1 + a1) | 0;
    v1 = v1 << 2;
    v1 = (a2 - v1) | 0;
    v1 = v1 & 65535;
    s5 = a1 | 0;
    t2 = hi;
    a0 = (t2 >>> 3) | 0;
    v0 = a0 << 2;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 1;
    [hi, lo] = mult(v1, a3, false);
    a2 = (a2 - v0) | 0;
    a2 = a2 & 65535;
    a2 = a2 << 8;
    a2 = (a2 + 20354) | 0;
    v0 = s5 & 255;
    v0 = v0 << 8;
    v0 = (v0 + 20354) | 0;
    m.write(((sp) + 24) >>> 0, a2 & 0xffff, 2);
    m.write(((sp) + 34) >>> 0, a2 & 0xffff, 2);
    m.write(((sp) + 44) >>> 0, a2 & 0xffff, 2);
    m.write(((sp) + 40) >>> 0, v0 & 0xffff, 2);
    v1 = hi;
    s4 = (v1 >>> 3) | 0;
    v0 = s4 & 255;
    v0 = v0 << 8;
    v0 = (v0 + 20354) | 0;
    m.write(((sp) + 32) >>> 0, v0 & 0xffff, 2);
    m.write(((sp) + 42) >>> 0, v0 & 0xffff, 2);
  case 0x80038e3c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80038e44:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = s6 >> 16;
    a1 = s1 & 255;
    a1 = a1 << 2;
    a1 = (s2 + a1) | 0;
    a1 = a1 << 16;
    a1 = a1 >> 16;
    a2 = (0 + 48) | 0;
    a3 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037604, a0, a1, a2, a3);
  case 0x80038e6c:
    s1 = (s1 + 1) | 0;
    s0 = s1 & 255;
    v0 = (s0 >>> 0) < (s7 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80038e3c; continue; } }
  case 0x80038e80:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80038e88:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = s3 << 16;
    a0 = a0 >> 16;
    a1 = s0 << 2;
    a1 = (s2 + a1) | 0;
    a1 = a1 << 16;
    a1 = a1 >> 16;
    a2 = (0 + 48) | 0;
    a3 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037604, a0, a1, a2, a3);
  case 0x80038eb0:
    v0 = s5 & 255;
    { const c = (v0 | 0) === 0; a0 = s3 & 65535; if (c) { pc = 0x80038ec8; continue; } }
  case 0x80038ebc:
    a1 = s2 & 65535;
    a2 = (sp + 40) | 0; pc = 0x80038f20; continue;
  case 0x80038ec8:
    v1 = s4 & 255;
    v0 = (v1 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = 0x80010000 | 0; if (c) { pc = 0x80038f28; continue; } }
  case 0x80038ed8:
    v0 = (v0 + 7580) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x80038ef4:
    a0 = s3 & 65535;
    a0 = (a0 + 7) | 0;
    a1 = s2 & 65535;
    a2 = (sp + 24) | 0; pc = 0x80038f20; continue;
  case 0x80038f08:
    a0 = s3 & 65535;
    a0 = (a0 + 2) | 0; pc = 0x80038f18; continue;
  case 0x80038f14:
    a0 = s3 & 65535;
  case 0x80038f18:
    a1 = s2 & 65535;
    a2 = (sp + 32) | 0;
  case 0x80038f20:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80038f28:
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
  default: throw new Error(`f80038ce8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80038f58, translated instruction by instruction (10 instructions).
export function* f80038f58(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80038f58;
  for (;;) switch (pc) {
  case 0x80038f58:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    a0 = a0 & 65535;
    a1 = a1 & 65535;
    a2 = a2 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80038ce8, a0, a1, a2, a3);
  case 0x80038f70:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f80038f58: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80029a6c, translated instruction by instruction (25 instructions).
export function* f80029a6c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80029a6c;
  for (;;) switch (pc) {
  case 0x80029a6c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    sp = (sp + -32) | 0;
    m.write(((sp) + 24) >>> 0, 0, 4);
    { const c = (v0 | 0) !== 0; a0 = (0 + 16) | 0; if (c) { pc = 0x80029a88; continue; } }
  case 0x80029a84:
    a0 = 0 | 0;
  case 0x80029a88:
     [v0, v1] = yield* call(ctx, sp, 0x80062544, a0, a1, a2, a3);
  case 0x80029a90:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x80029aa4:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v1 = (0 + 3) | 0;
    v0 = v0 & 15;
    { const c = (v0 | 0) !== (v1 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x80029ac0; continue; } }
  case 0x80029ab8:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
  case 0x80029ac0:
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f80029a6c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80029ad0, translated instruction by instruction (25 instructions).
export function* f80029ad0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80029ad0;
  for (;;) switch (pc) {
  case 0x80029ad0:
    sp = (sp + -32) | 0;
    a0 = a0 & 255;
    { const c = (a0 | 0) !== 0; m.write(((sp) + 24) >>> 0, 0, 4); if (c) { pc = 0x80029ae8; continue; } }
  case 0x80029ae0:
    a0 = 0 | 0; pc = 0x80029aec; continue;
  case 0x80029ae8:
    a0 = (0 + 16) | 0;
  case 0x80029aec:
     [v0, v1] = yield* call(ctx, sp, 0x80062544, a0, a1, a2, a3);
  case 0x80029af4:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x80029b08:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v1 = (0 + 3) | 0;
    v0 = v0 & 15;
    { const c = (v0 | 0) !== (v1 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x80029b24; continue; } }
  case 0x80029b1c:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
  case 0x80029b24:
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f80029ad0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80015fa8, translated instruction by instruction (52 instructions).
export function* cardMessage(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80015fa8;
  for (;;) switch (pc) {
  case 0x80015fa8:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = (0 + 1) | 0;
    v1 = a0 & 255;
    v0 = (v1 >>> 0) < 7 ? 1 : 0;
    { const c = (v0 | 0) === 0; m.write(((sp) + 20) >>> 0, 0, 4); if (c) { pc = 0x80016060; continue; } }
  case 0x80015fc4:
    v0 = 0x80010000 | 0;
    v0 = (v0 + 4984) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 4) | 0;
    { const t = v0;  pc = t >>> 0; continue; }
  case 0x80015fe4:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002a980, a0, a1, a2, a3);
  case 0x80015fec:
    s0 = v0 | 0; pc = 0x80016060; continue;
  case 0x80015ff4:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002a980, a0, a1, a2, a3);
  case 0x80015ffc:
    s0 = v0 | 0; pc = 0x80016060; continue;
  case 0x80016004:
    a0 = (0 + 50) | 0;
    a1 = (0 + 2) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3420) | 0; pc = 0x80016028; continue;
  case 0x80016018:
    a0 = (0 + 50) | 0;
    a1 = (0 + 2) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3476) | 0;
  case 0x80016028:
    a3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80025898, a0, a1, a2, a3);
  case 0x80016030:
    v0 = s0 & 255; pc = 0x80016064; continue;
  case 0x80016038:
     [v0, v1] = yield* call(ctx, sp, 0x8002c530, a0, a1, a2, a3);
  case 0x80016040:
    v0 = s0 & 255; pc = 0x80016064; continue;
  case 0x80016048:
    a0 = (0 + 1) | 0; pc = 0x80016054; continue;
  case 0x80016050:
    a0 = 0 | 0;
  case 0x80016054:
     [v0, v1] = yield* call(ctx, sp, 0x8002a9f8, a0, a1, a2, a3);
  case 0x8001605c:
    s0 = v0 | 0;
  case 0x80016060:
    v0 = s0 & 255;
  case 0x80016064:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`cardMessage: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002a980, translated instruction by instruction (30 instructions).
export function* f8002a980(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002a980;
  for (;;) switch (pc) {
  case 0x8002a980:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0, 4);
    s0 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8002a994:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8002a99c:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8002a9a4:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002a9ac:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002a9b4:
    a0 = (0 + 63) | 0;
    a2 = 0x80010000 | 0;
    a1 = (0 + 66) | 0;
    a2 = (a2 + 6104) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002a9cc:
    a0 = s0 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002a320, a0, a1, a2, a3);
  case 0x8002a9d4:
    at = 0x80080000 | 0;
    m.write(((at) + -27368) >>> 0, v0 & 0xff, 1);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27368) >>> 0, 1);
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f8002a980: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80025898, translated instruction by instruction (92 instructions).
export function* f80025898(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80025898;
  for (;;) switch (pc) {
  case 0x80025898:
    sp = (sp + -64) | 0;
    v0 = a1 | 0;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    s3 = a2 | 0;
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = (v0 + -1) | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = a0 | 0;
    a0 = 0 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 320) | 0;
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    s2 = a3 | 0;
    s0 = s0 & 65535;
    s0 = s0 << 4;
    s0 = (s0 + 28) | 0;
    a3 = s0 | 0;
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    s4 = v0 | 0;
    m.write(((sp) + 60) >>> 0, 0, 4);
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x800258f0:
    s1 = s1 & 65535;
    a0 = (s1 + 6) | 0;
    a1 = (0 + 70) | 0;
    a2 = s3 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80025908:
    s2 = s2 & 255; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80025910:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80025918:
    v1 = s1 << 1;
    v0 = (0 + 320) | 0;
    s3 = (v0 - v1) | 0;
    v0 = 0x801f0000 | 0;
  case 0x80025928:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 2293;
    { const c = (v0 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x8002594c; continue; } }
  case 0x8002593c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80025944:
     pc = 0x800259ac; continue;
  case 0x8002594c:
    { const c = (s2 | 0) !== (v0 | 0); a0 = s1 | 0; if (c) { pc = 0x8002598c; continue; } }
  case 0x80025954:
    a1 = (0 + 64) | 0;
    a2 = s3 & 65535;
    a3 = s0 & 65535;
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x8002598c:
     [v0, v1] = yield* call(ctx, sp, 0x8003aa8c, a0, a1, a2, a3);
  case 0x80025994:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002599c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800259a4:
    v0 = 0x801f0000 | 0; pc = 0x80025928; continue;
  case 0x800259ac:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800259b4:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = 0 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 320) | 0;
    a3 = s4 & 65535;
    a3 = a3 << 4;
    a3 = (a3 + 28) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x800259d4:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800259dc:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800259e4:
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
     return v0;
  default: throw new Error(`f80025898: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002c530, translated instruction by instruction (28 instructions).
export function* f8002c530(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002c530;
  for (;;) switch (pc) {
  case 0x8002c530:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8002c540:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8002c548:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8002c550:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002c558:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002c560:
    a0 = (0 + 68) | 0;
    a2 = 0x80010000 | 0;
    a1 = (0 + 66) | 0;
    a2 = (a2 + 6260) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002c578:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002a320, a0, a1, a2, a3);
  case 0x8002c580:
    at = 0x80080000 | 0;
    m.write(((at) + -27368) >>> 0, v0 & 0xff, 1);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27368) >>> 0, 1);
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f8002c530: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002a9f8, translated instruction by instruction (30 instructions).
export function* noCardBox(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002a9f8;
  for (;;) switch (pc) {
  case 0x8002a9f8:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, 0, 4);
    s0 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8002aa0c:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8002aa14:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8002aa1c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002aa24:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002aa2c:
    a0 = (0 + 44) | 0;
    a2 = 0x80010000 | 0;
    a1 = (0 + 66) | 0;
    a2 = (a2 + 6136) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002aa44:
    a0 = s0 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002a320, a0, a1, a2, a3);
  case 0x8002aa4c:
    at = 0x80080000 | 0;
    m.write(((at) + -27368) >>> 0, v0 & 0xff, 1);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27368) >>> 0, 1);
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`noCardBox: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002a320, translated instruction by instruction (300 instructions).
export function* yesNo(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002a320;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x8002a320:
    sp = (sp + -80) | 0;
    m.write(((sp) + 72) >>> 0, fp >>> 0, 4);
    fp = a0 | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = 0 | 0;
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    s5 = 0x801f0000 | 0;
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    s7 = 0x801f0000 | 0;
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    s4 = (s7 + -4272) | 0;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    s3 = (0 + -1) | 0;
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    s2 = (0 + 50) | 0;
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    s6 = (0 + 1) | 0;
    m.write(((sp) + 76) >>> 0, 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    v0 = fp & 255;
  case 0x8002a370:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002a4dc; continue; } }
  case 0x8002a378:
    v0 = m.read(((s5) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x8002a3c0; continue; } }
  case 0x8002a38c:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002a3c0; continue; } }
  case 0x8002a394:
    a0 = (m.read(((s4) + 6) >>> 0, 2) << 16) >> 16;
    { const c = (a0 | 0) === (s3 | 0); a1 = 0 | 0; if (c) { pc = 0x8002a3bc; continue; } }
  case 0x8002a3a4:
    a2 = a1 | 0;
    a3 = (0 + 48) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80059cd8, a0, a1, a2, a3);
  case 0x8002a3bc:
    s1 = (s1 + 1) | 0;
  case 0x8002a3c0:
    v0 = m.read(((s5) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x8002a408; continue; } }
  case 0x8002a3d4:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002a408; continue; } }
  case 0x8002a3dc:
    a0 = (m.read(((s4) + 6) >>> 0, 2) << 16) >> 16;
    { const c = (a0 | 0) === (s3 | 0); s1 = (s1 + -1) | 0; if (c) { pc = 0x8002a408; continue; } }
  case 0x8002a3ec:
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = (0 + 48) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80059cd8, a0, a1, a2, a3);
  case 0x8002a408:
    v1 = m.read(((s5) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 33;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x8002a454; continue; } }
  case 0x8002a41c:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002a5e8; continue; } }
  case 0x8002a424:
    a0 = (m.read(((s7) + -4272) >>> 0, 2) << 16) >> 16;
    { const c = (a0 | 0) === (s3 | 0); a1 = 0 | 0; if (c) { pc = 0x8002a658; continue; } }
  case 0x8002a434:
    a2 = a1 | 0;
    a3 = (0 + 48) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80059cd8, a0, a1, a2, a3);
  case 0x8002a44c:
     pc = 0x8002a658; continue;
  case 0x8002a454:
    v0 = v1 & 68;
    { const c = (v0 | 0) !== 0; a0 = (0 + 60) | 0; if (c) { pc = 0x8002a62c; continue; } }
  case 0x8002a460:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a1 = (0 + 138) | 0;
    a2 = (0 + 200) | 0;
    a3 = (0 + 56) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8002a474:
    a0 = (0 + 70) | 0;
    s0 = s1 & 255;
    a1 = s0 << 1;
    a1 = (a1 + s0) | 0;
    a1 = a1 << 3;
    a1 = (a1 + 146) | 0;
    a2 = 0 | 33924; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x8002a494:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x8002a4a0; continue; } }
  case 0x8002a49c:
    a0 = 0 | 0;
  case 0x8002a4a0:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8002a4a8:
    a0 = (0 + 95) | 0;
    a1 = (0 + 146) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 5908) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002a4c0:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8002a4c8:
    a0 = (0 + 60) | 0;
    a1 = (0 + 138) | 0;
    a2 = (0 + 200) | 0;
    a3 = (0 + 32) | 0; pc = 0x8002a720; continue;
  case 0x8002a4dc:
    v0 = m.read(((s5) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x8002a524; continue; } }
  case 0x8002a4f0:
    { const c = (v0 | 0) === (s6 | 0);  if (c) { pc = 0x8002a524; continue; } }
  case 0x8002a4f8:
    a0 = (m.read(((s4) + 6) >>> 0, 2) << 16) >> 16;
    { const c = (a0 | 0) === (s3 | 0); a1 = 0 | 0; if (c) { pc = 0x8002a520; continue; } }
  case 0x8002a508:
    a2 = a1 | 0;
    a3 = (0 + 48) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80059cd8, a0, a1, a2, a3);
  case 0x8002a520:
    s1 = (s1 + 1) | 0;
  case 0x8002a524:
    v0 = m.read(((s5) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x8002a56c; continue; } }
  case 0x8002a538:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002a56c; continue; } }
  case 0x8002a540:
    a0 = (m.read(((s4) + 6) >>> 0, 2) << 16) >> 16;
    { const c = (a0 | 0) === (s3 | 0); s1 = (s1 + -1) | 0; if (c) { pc = 0x8002a56c; continue; } }
  case 0x8002a550:
    a1 = 0 | 0;
    a2 = a1 | 0;
    a3 = (0 + 48) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80059cd8, a0, a1, a2, a3);
  case 0x8002a56c:
    v0 = m.read(((s5) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 33;
    { const c = (v0 | 0) === 0; v1 = s1 & 255; if (c) { pc = 0x8002a618; continue; } }
  case 0x8002a580:
    { const c = (v1 | 0) !== 0;  if (c) { pc = 0x8002a5cc; continue; } }
  case 0x8002a588:
    a0 = (m.read(((s7) + -4272) >>> 0, 2) << 16) >> 16;
    { const c = (a0 | 0) === (s3 | 0); a1 = 0 | 0; if (c) { pc = 0x8002a5b0; continue; } }
  case 0x8002a598:
    a2 = a1 | 0;
    a3 = (0 + 48) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80059cd8, a0, a1, a2, a3);
  case 0x8002a5b0:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28022) >>> 0, 0 & 0xff, 1);
     pc = 0x8002a764; continue;
  case 0x8002a5cc:
    { const c = (v1 | 0) !== (s6 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x8002a5e0; continue; } }
  case 0x8002a5d4:
    a0 = (m.read(((s7) + -4272) >>> 0, 2) << 16) >> 16;
     pc = 0x8002a5ec; continue;
  case 0x8002a5e0:
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002a618; continue; } }
  case 0x8002a5e8:
    a0 = (m.read(((s4) + 2) >>> 0, 2) << 16) >> 16;
  case 0x8002a5ec:
    { const c = (a0 | 0) === (s3 | 0); a1 = 0 | 0; if (c) { pc = 0x8002a764; continue; } }
  case 0x8002a5f8:
    a2 = a1 | 0;
    a3 = (0 + 48) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80059cd8, a0, a1, a2, a3);
  case 0x8002a610:
     pc = 0x8002a764; continue;
  case 0x8002a618:
    v0 = m.read(((s5) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 68;
    { const c = (v0 | 0) === 0; a0 = (0 + 60) | 0; if (c) { pc = 0x8002a670; continue; } }
  case 0x8002a62c:
    a0 = (m.read(((s4) + 2) >>> 0, 2) << 16) >> 16;
    { const c = (a0 | 0) === (s3 | 0); a1 = 0 | 0; if (c) { pc = 0x8002a654; continue; } }
  case 0x8002a63c:
    a2 = a1 | 0;
    a3 = (0 + 48) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80059cd8, a0, a1, a2, a3);
  case 0x8002a654:
    s1 = 0 | 0;
  case 0x8002a658:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s6 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28022) >>> 0, 0 & 0xff, 1);
     pc = 0x8002a764; continue;
  case 0x8002a670:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a1 = (0 + 124) | 0;
    a2 = (0 + 200) | 0;
    a3 = (0 + 70) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8002a684:
    a0 = (0 + 70) | 0;
    s0 = s1 & 255;
    a1 = s0 << 1;
    a1 = (a1 + s0) | 0;
    a1 = a1 << 2;
    a1 = (a1 + s0) | 0;
    a1 = a1 << 1;
    a1 = (a1 + 132) | 0;
    a2 = 0 | 33924; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x8002a6ac:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x8002a6b8; continue; } }
  case 0x8002a6b4:
    a0 = 0 | 0;
  case 0x8002a6b8:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8002a6c0:
    a0 = (0 + 95) | 0;
    a1 = (0 + 132) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 5908) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002a6d8:
    v0 = s1 & 255;
    { const c = (v0 | 0) !== (s6 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x8002a6e8; continue; } }
  case 0x8002a6e4:
    a0 = 0 | 0;
  case 0x8002a6e8:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8002a6f0:
    a0 = (0 + 95) | 0;
    a1 = (0 + 159) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 5932) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002a708:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8002a710:
    a0 = (0 + 60) | 0;
    a1 = (0 + 124) | 0;
    a2 = (0 + 200) | 0;
    a3 = (0 + 62) | 0;
  case 0x8002a720:
    v0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x8002a74c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002a754:
    offer(ctx, (fp & 0xff) ? [box(0, 0x3c, 0x7e, 0xc8, 0x1a), box(1, 0x3c, 0x98, 0xc8, 0x1a)] : [box(0, 0x3c, 0x8a, 0xc8, 0x38)], () => s1 & 0xff, ["up", "down"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002a75c:
    v0 = fp & 255; pc = 0x8002a370; continue;
  case 0x8002a764:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8002a76c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002a774:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002a77c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002a784:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002a78c:
    v0 = (s1 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28030) >>> 0, v0 & 0xff, 1);
    v0 = s1 & 255;
    fp = m.read(((sp) + 72) >>> 0, 4) | 0;
    s7 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 80) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`yesNo: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002bd1c, translated instruction by instruction (159 instructions).
export function* cardCheck(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002bd1c;
  for (;;) switch (pc) {
  case 0x8002bd1c:
    sp = (sp + -80) | 0;
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    s5 = a0 | 0;
    a0 = 0 | 0;
    v0 = 0x800b0000 | 0;
    a1 = (v0 + -16752) | 0;
    m.write(((sp) + 72) >>> 0, 0, 4);
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = 0 | 0;
  case 0x8002bd58:
    v1 = a0 & 65535;
    v0 = v1 << 5;
    v0 = (v0 - v1) | 0;
    v0 = v0 << 8;
    v1 = (v0 + a1) | 0;
    v0 = s0 & 65535;
  case 0x8002bd70:
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    s0 = (s0 + 1) | 0;
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 7936 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s0 & 65535; if (c) { pc = 0x8002bd70; continue; } }
  case 0x8002bd8c:
    a0 = (a0 + 1) | 0;
    v0 = a0 & 65535;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = 0 | 0; if (c) { pc = 0x8002bd58; continue; } }
  case 0x8002bda0:
    s6 = 0x80070000 | 0;
    s7 = (s6 + -20788) | 0;
    s4 = (0 + 3) | 0;
    s3 = (0 + 1) | 0;
    s1 = 0 | 0;
  case 0x8002bdb4:
    s0 = s1 | 0;
    v0 = (s0 + 48) | 0;
  case 0x8002bdbc:
    m.write(((s7) + 19) >>> 0, v0 & 0xff, 1);
    s2 = s0 & 65535;
  case 0x8002bdc4:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002bdd4:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002bde8:
    v0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v1 = v0 & 15;
    { const c = (v1 | 0) !== (s4 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x8002be04; continue; } }
  case 0x8002bdfc:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s3 & 0xff, 1);
  case 0x8002be04:
    { const c = (v1 | 0) === (v0 | 0); v0 = (0 + 4) | 0; if (c) { pc = 0x8002be14; continue; } }
  case 0x8002be0c:
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002be74; continue; } }
  case 0x8002be14:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002be24:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002be38:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002be48:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 28) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002be5c:
    v1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 28) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002be14; continue; } }
  case 0x8002be74:
    v1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s3 | 0); m.write(((sp) + 32) >>> 0, v1 >>> 0, 4); if (c) { pc = 0x8002bee4; continue; } }
  case 0x8002be8c:
    v1 = v1 & 15;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002bec0; continue; } }
  case 0x8002be9c:
    a0 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80029b34, a0, a1, a2, a3);
  case 0x8002bea4:
    v0 = v0 << 24;
    v0 = v0 >> 24;
    v1 = (0 + -1) | 0;
    { const c = (v0 | 0) === (v1 | 0); s1 = (0 + 1) | 0; if (c) { pc = 0x8002bee4; continue; } }
  case 0x8002beb8:
    s0 = (s0 + 1) | 0; pc = 0x8002bf48; continue;
  case 0x8002bec0:
    v0 = (0 + 4) | 0;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x8002be9c; continue; } }
  case 0x8002becc:
    { const c = (v1 | 0) !== (s3 | 0); a0 = s5 & 255; if (c) { pc = 0x8002beec; continue; } }
  case 0x8002bed4:
    a0 = (a0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x80015fa8, a0, a1, a2, a3);
  case 0x8002bedc:
    { const c = (v0 | 0) === 0; s1 = (0 + 1) | 0; if (c) { pc = 0x8002bf44; continue; } }
  case 0x8002bee4:
    v0 = (0 + -1) | 0; pc = 0x8002bf68; continue;
  case 0x8002beec:
    { const c = (v1 | 0) === 0; a1 = (s6 + -20788) | 0; if (c) { pc = 0x8002befc; continue; } }
  case 0x8002bef4:
    { const c = (v1 | 0) !== (s4 | 0);  if (c) { pc = 0x8002bdc4; continue; } }
  case 0x8002befc:
    v0 = s2 << 5;
    v0 = (v0 - s2) | 0;
    v0 = v0 << 8;
    a2 = 0x800b0000 | 0;
    a2 = (a2 + -16752) | 0;
    a2 = (v0 + a2) | 0;
    v0 = (0 + 7808) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a3 = (0 + 512) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062fa0, a0, a1, a2, a3);
  case 0x8002bf30:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 32) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002bf44:
    s0 = (s0 + 1) | 0;
  case 0x8002bf48:
    v0 = s0 & 65535;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = (s0 + 48) | 0; if (c) { pc = 0x8002bdbc; continue; } }
  case 0x8002bf58:
    v0 = s1 & 65535;
    { const c = (v0 | 0) !== 0; s1 = 0 | 0; if (c) { pc = 0x8002bdb4; continue; } }
  case 0x8002bf64:
    v0 = 0 | 0;
  case 0x8002bf68:
    s7 = m.read(((sp) + 68) >>> 0, 4) | 0;
    s6 = m.read(((sp) + 64) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 80) | 0;
     return v0;
  default: throw new Error(`cardCheck: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800298e4, translated instruction by instruction (54 instructions).
export function* cardLoad(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800298e4;
  for (;;) switch (pc) {
  case 0x800298e4:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    sp = (sp + -32) | 0;
    m.write(((sp) + 24) >>> 0, 0, 4);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x800298fc:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x80029910:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v1 = v0 & 15;
    v0 = (0 + 3) | 0;
    { const c = (v1 | 0) !== (v0 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x80029938; continue; } }
  case 0x80029928:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
    v0 = (0 + 2) | 0;
  case 0x80029938:
    { const c = (v1 | 0) === (v0 | 0); v0 = (0 + 4) | 0; if (c) { pc = 0x80029948; continue; } }
  case 0x80029940:
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x800299a8; continue; } }
  case 0x80029948:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x80029958:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002996c:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002997c:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 20) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x80029990:
    v1 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 20) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80029948; continue; } }
  case 0x800299a8:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`cardLoad: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

export const TRANSLATED = {0x80018cdc: menu, 0x80019c30: flowChart, 0x8001575c: f8001575c, 0x80019544: f80019544, 0x80019738: f80019738, 0x80035568: f80035568, 0x80037344: f80037344, 0x80044f7c: f80044f7c, 0x8001c6a0: f8001c6a0, 0x8001c8f8: f8001c8f8, 0x800355cc: lzss, 0x800378c4: f800378c4, 0x80044e90: f80044e90, 0x8001c374: f8001c374, 0x80037d48: f80037d48, 0x8003c8f8: addBox2, 0x8001866c: options, 0x800145b0: f800145b0, 0x80025710: f80025710, 0x80014d68: f80014d68, 0x8001511c: f8001511c, 0x8001b51c: f8001b51c, 0x800289ec: f800289ec, 0x8002cc48: f8002cc48, 0x8002cc98: f8002cc98, 0x8003d820: f8003d820, 0x80044868: f80044868, 0x80026088: f80026088, 0x80044e10: pacMemberBE, 0x80044e50: f80044e50, 0x80044ecc: fmul8, 0x80037e50: f80037e50, 0x80037e94: f80037e94, 0x8003bc3c: spriteFree, 0x8003bdc0: spriteLayer, 0x8003a90c: setPalette, 0x80026204: repeatOn, 0x80026220: repeatOff, 0x80044904: memcpy, 0x8001824c: save, 0x80017e14: f80017e14, 0x80017854: f80017854, 0x8001c7c0: f8001c7c0, 0x80025a08: f80025a08, 0x80025c74: f80025c74, 0x8002a89c: f8002a89c, 0x8003aa8c: f8003aa8c, 0x8002bf98: f8002bf98, 0x80033648: f80033648, 0x80015d74: f80015d74, 0x80033be8: f80033be8, 0x8003cd78: f8003cd78, 0x8002afb8: f8002afb8, 0x8002bfe8: f8002bfe8, 0x8002c4c0: f8002c4c0, 0x8002baa0: f8002baa0, 0x800338ac: f800338ac, 0x80038b8c: f80038b8c, 0x80038ce8: f80038ce8, 0x80038f58: f80038f58, 0x80029a6c: f80029a6c, 0x80029ad0: f80029ad0, 0x80015fa8: cardMessage, 0x8002a980: f8002a980, 0x80025898: f80025898, 0x8002c530: f8002c530, 0x8002a9f8: noCardBox, 0x8002a320: yesNo, 0x8002bd1c: cardCheck, 0x800298e4: cardLoad };
