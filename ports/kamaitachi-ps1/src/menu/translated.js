// The in-game menu (0x80018cdc) and the screens it opens: the flow chart (移動, 0x80019c30),
// the options (0x8001866c) and their pages, and the save screen (0x8001824c) with its memory-card
// checks; the title (0x8001b694) with its start menu (0x80016078: card choice, the three books,
// reading / erasing / copying a book); the scenario commands that reach the card (0x1f, 0x3d the
// bookmark restore 0x800329ec, 0x44); the backlog (0x80024fd0). Translated instruction by instruction from the
// original MIPS code by a tool (tools/translate) (one switch case per basic block; registers are locals, memory
// is the PS1 RAM at the original addresses, calls go through call() in calls.js with the
// caller's sp). Generators: each frame the original waits (VSync through 0x80013f34) is a yield.
import { call, mult, div } from "./calls.js";
import { offerLive as offer, withdraw, box } from "../touch.js";

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
    offer(ctx, [...Array.from({ length: 36 }, (_, k) => box(k, 9 + 36 * (k % 6), 43 + 28 * Math.floor(k / 6), 36, 28)), box(100001, 9, 28, 216, 15), box(100002, 9, 211, 216, 20), box(100003, 0, 43, 9, 168), box(100004, 225, 43, 20, 168)], () => (m.read((sp + 0x38) >>> 0, 2) % 6) * 6 + (m.read((sp + 0x30) >>> 0, 2) % 6), ["up", "down"], { 100001: "up", 100002: "down", 100003: "left", 100004: "right" }, { cols: 6, across: ["left", "right"] });
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
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
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
    offer(ctx, [box(0, 0x64, 0x68, 0x78, 0x10), box(1, 0x64, 0x7a, 0x78, 0x10)], () => s1 & 0xff, ["up", "down"]);
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
    if (ctx.touch) ctx.touch.menu = prevTouch;
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

// 0x8001b694, translated instruction by instruction (276 instructions).
export function* title(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001b694;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x8001b694:
    sp = (sp + -64) | 0;
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = 0 | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = 0 | 0;
    a0 = 0 | 0;
    v0 = (0 + 1) | 0;
    m.write(((sp) + 56) >>> 0, 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27995) >>> 0, v0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28001) >>> 0, 0 & 0xff, 1);
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c8e0, a0, a1, a2, a3);
  case 0x8001b6d4:
    s3 = 0x801f0000 | 0; [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8001b6dc:
    a0 = (0 + 1) | 0;
    a2 = (0 + 9203) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    s2 = (0 + 127) | 0; [v0, v1] = yield* call(ctx, sp, 0x80036ea0, a0, a1, a2, a3);
  case 0x8001b6f4:
     [v0, v1] = yield* call(ctx, sp, 0x8003704c, a0, a1, a2, a3);
  case 0x8001b6fc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001b704:
    a0 = (0 + 9203) | 0;
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x8001b710:
     [v0, v1] = yield* call(ctx, sp, 0x8003704c, a0, a1, a2, a3);
  case 0x8001b718:
    a0 = (0 + 1) | 0;
    a1 = (0 + 256) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cae0, a0, a1, a2, a3);
  case 0x8001b724:
    s1 = (s1 + 1) | 0;
    v0 = s1 & 65535;
  case 0x8001b72c:
    v0 = (v0 >>> 0) < 1200 ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001ba90; continue; } }
  case 0x8001b738:
    v0 = m.read(((s3) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 8192;
    { const c = (v0 | 0) === 0; v1 = s0 & 255; if (c) { pc = 0x8001b768; continue; } }
  case 0x8001b74c:
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) === (v0 | 0);  if (c) { pc = 0x8001b768; continue; } }
  case 0x8001b758:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001b760:
    s0 = (s0 + 1) | 0;
    s1 = 0 | 0;
  case 0x8001b768:
    v0 = m.read(((s3) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 32768;
    { const c = (v0 | 0) === 0; v0 = s0 & 255; if (c) { pc = 0x8001b794; continue; } }
  case 0x8001b77c:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8001b794; continue; } }
  case 0x8001b784:
    s0 = (s0 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001b790:
    s1 = 0 | 0;
  case 0x8001b794:
    v0 = m.read(((s3) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 2081;
    { const c = (v0 | 0) === 0; v0 = s0 & 255; if (c) { pc = 0x8001b89c; continue; } }
  case 0x8001b7a8:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001b7b0:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8001b7b8:
    v1 = s0 & 255;
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 2) | 0; if (c) { pc = 0x8001b7ec; continue; } }
  case 0x8001b7c8:
    a1 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c374, a0, a1, a2, a3);
  case 0x8001b7d0:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001866c, a0, a1, a2, a3);
  case 0x8001b7d8:
    a0 = 0 | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c374, a0, a1, a2, a3);
  case 0x8001b7e4:
    s1 = 0 | 0; pc = 0x8001b898; continue;
  case 0x8001b7ec:
    { const c = (v1 | 0) !== 0; a0 = (0 + 25) | 0; if (c) { pc = 0x8001b838; continue; } }
  case 0x8001b7f4:
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001b7fc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x8001b804:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001b80c:
    a0 = (0 + 1) | 0;
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8001b818:
     [v0, v1] = yield* call(ctx, sp, 0x80016078, a0, a1, a2, a3);
  case 0x8001b820:
    { const c = (v0 | 0) === 0; a0 = 0 | 0; if (c) { pc = 0x8001b868; continue; } }
  case 0x8001b828:
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c8e0, a0, a1, a2, a3);
  case 0x8001b830:
     pc = 0x8001ba90; continue;
  case 0x8001b838:
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001b840:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x8001b848:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001b850:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80034180, a0, a1, a2, a3);
  case 0x8001b858:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80034180, a0, a1, a2, a3);
  case 0x8001b860:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80034180, a0, a1, a2, a3);
  case 0x8001b868:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001b870:
    a0 = (0 + 9203) | 0;
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x8001b87c:
    a0 = (0 + 25) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8001b888:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x8001b890:
    s1 = 0 | 0; pc = 0x8001b724; continue;
  case 0x8001b898:
    v0 = s0 & 255;
  case 0x8001b89c:
    { const c = (v0 | 0) !== 0; a0 = (0 + 30) | 0; if (c) { pc = 0x8001b8c8; continue; } }
  case 0x8001b8a4:
    a1 = (0 + 180) | 0;
    a2 = (0 + 64) | 0;
    a3 = (0 + 18) | 0;
    m.write(((sp) + 16) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x8001b8c0:
    v1 = s0 & 255; pc = 0x8001b904; continue;
  case 0x8001b8c8:
    a1 = (0 + 180) | 0;
    a2 = (0 + 64) | 0;
    a3 = (0 + 18) | 0;
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
  case 0x8001b900:
    v1 = s0 & 255;
  case 0x8001b904:
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 123) | 0; if (c) { pc = 0x8001b934; continue; } }
  case 0x8001b910:
    a1 = (0 + 180) | 0;
    a2 = (0 + 64) | 0;
    a3 = (0 + 18) | 0;
    m.write(((sp) + 16) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x8001b92c:
    v1 = s0 & 255; pc = 0x8001b970; continue;
  case 0x8001b934:
    a1 = (0 + 180) | 0;
    a2 = (0 + 64) | 0;
    a3 = (0 + 18) | 0;
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
  case 0x8001b96c:
    v1 = s0 & 255;
  case 0x8001b970:
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a1 = (0 + 180) | 0; if (c) { pc = 0x8001b9a0; continue; } }
  case 0x8001b97c:
    a0 = (0 + 217) | 0;
    a2 = (0 + 64) | 0;
    a3 = (0 + 18) | 0;
    m.write(((sp) + 16) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x8001b998:
    v0 = s0 & 255; pc = 0x8001b9dc; continue;
  case 0x8001b9a0:
    a0 = (0 + 217) | 0;
    a2 = (0 + 64) | 0;
    a3 = (0 + 18) | 0;
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
  case 0x8001b9d8:
    v0 = s0 & 255;
  case 0x8001b9dc:
    { const c = (v0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x8001b9e8; continue; } }
  case 0x8001b9e4:
    a0 = 0 | 0;
  case 0x8001b9e8:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8001b9f0:
    a0 = (0 + 33) | 0;
    a1 = (0 + 181) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4296) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001ba08:
    v1 = s0 & 255;
    v0 = (0 + 1) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x8001ba1c; continue; } }
  case 0x8001ba18:
    a0 = 0 | 0;
  case 0x8001ba1c:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8001ba24:
    a0 = (0 + 134) | 0;
    a1 = (0 + 181) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4308) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001ba3c:
    v1 = s0 & 255;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x8001ba50; continue; } }
  case 0x8001ba4c:
    a0 = 0 | 0;
  case 0x8001ba50:
    s1 = (s1 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8001ba58:
    a0 = (0 + 220) | 0;
    a1 = (0 + 181) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4324) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001ba70:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8001ba78:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8001ba80:
    offer(ctx, [0x1e, 0x7b, 0xd9].map((x, i) => box(i, x, 0xb4, 0x40, 0x12)), () => s0 & 0xff, ["left", "right"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8001ba88:
    v0 = s1 & 65535; pc = 0x8001b72c; continue;
  case 0x8001ba90:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8001ba98:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8001baa0:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8001baa8:
    a0 = (0 + 25) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x8001bab4:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x8001babc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001bac4:
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
    if (ctx.touch) ctx.touch.menu = prevTouch;
     return v0;
  default: throw new Error(`title: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80016078, translated instruction by instruction (1527 instructions).
export function* startMenu(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80016078;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x80016078:
    sp = (sp + -96) | 0;
    m.write(((sp) + 84) >>> 0, s7 >>> 0, 4);
    s7 = 0x80080000 | 0;
    s7 = m.read(((s7) + -27966) >>> 0, 1);
    t0 = (0 + 1) | 0;
    m.write(((sp) + 92) >>> 0, 0, 4);
    m.write(((sp) + 88) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 80) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 76) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 72) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 68) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 64) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 60) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 56) >>> 0, s0 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, t0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -28030) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28022) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27362) >>> 0, 0 & 0xff, 1);
  case 0x800160cc:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800160d4:
    v0 = (0 + 3) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27964) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80029a6c, a0, a1, a2, a3);
  case 0x800160e8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28030) >>> 0, 1);
    s0 = (0 + 2) | 0;
    { const c = (v0 | 0) === (s0 | 0); a0 = (0 + 50) | 0; if (c) { pc = 0x80017710; continue; } }
  case 0x800160fc:
    a1 = (0 + 60) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3536) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80016110:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27964) >>> 0, 1);
    v1 = (0 + 1) | 0;
    { const c = (v0 | 0) !== (v1 | 0);  if (c) { pc = 0x8001612c; continue; } }
  case 0x80016124:
    at = 0x80080000 | 0;
    m.write(((at) + -27965) >>> 0, 0 & 0xff, 1);
  case 0x8001612c:
    { const c = (v0 | 0) !== (s0 | 0); s4 = (0 + 1) | 0; if (c) { pc = 0x8001613c; continue; } }
  case 0x80016134:
    at = 0x80080000 | 0;
    m.write(((at) + -27965) >>> 0, v1 & 0xff, 1);
  case 0x8001613c:
    s6 = (0 + 127) | 0;
    fp = (0 + 3) | 0;
    s1 = 0x80080000 | 0;
    s1 = m.read(((s1) + -27965) >>> 0, 1);
    s5 = (0 + 1) | 0;
    m.write(((sp) + 48) >>> 0, 0 & 0xff, 1);
  case 0x80016154:
    v0 = s1 & 255;
  case 0x80016158:
    { const c = (v0 | 0) !== 0; a0 = (0 + 35) | 0; if (c) { pc = 0x80016184; continue; } }
  case 0x80016160:
    a1 = (0 + 90) | 0;
    a2 = (0 + 117) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x8001617c:
    v0 = s1 & 255; pc = 0x800161b8; continue;
  case 0x80016184:
    a1 = (0 + 89) | 0;
    a2 = (0 + 117) | 0;
    a3 = (0 + 18) | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x800161b4:
    v0 = s1 & 255;
  case 0x800161b8:
    { const c = (v0 | 0) !== (s5 | 0); a1 = (0 + 89) | 0; if (c) { pc = 0x800161e8; continue; } }
  case 0x800161c0:
    a0 = (0 + 170) | 0;
    a1 = (0 + 90) | 0;
    a2 = (0 + 117) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x800161e0:
    v0 = s1 & 255; pc = 0x8001621c; continue;
  case 0x800161e8:
    a0 = (0 + 170) | 0;
    a2 = (0 + 117) | 0;
    a3 = (0 + 18) | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80016218:
    v0 = s1 & 255;
  case 0x8001621c:
    { const c = (v0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x80016228; continue; } }
  case 0x80016224:
    a0 = 0 | 0;
  case 0x80016228:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80016230:
    a0 = (0 + 40) | 0;
    a1 = (0 + 90) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3572) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80016248:
    v0 = s1 & 255;
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80016258; continue; } }
  case 0x80016254:
    a0 = 0 | 0;
  case 0x80016258:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80016260:
    a0 = (0 + 175) | 0;
    a1 = (0 + 90) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3592) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80016278:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80016280:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80016288:
    offer(ctx, [box(0, 0x23, 0x59, 0x75, 0x12), box(1, 0xaa, 0x59, 0x75, 0x12)], () => s1 & 0xff, ["left", "right"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80016290:
    v0 = 0x801f0000 | 0;
    v1 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 8192;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x800162c0; continue; } }
  case 0x800162a8:
    { const c = (v0 | 0) === (s5 | 0);  if (c) { pc = 0x80016154; continue; } }
  case 0x800162b0:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800162b8:
    s1 = (s1 + 1) | 0; pc = 0x80016154; continue;
  case 0x800162c0:
    v0 = v1 & 32768;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x800162e8; continue; } }
  case 0x800162cc:
    { const c = (v0 | 0) === 0; a0 = (0 + 35) | 0; if (c) { pc = 0x80016160; continue; } }
  case 0x800162d4:
    s1 = (s1 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800162e0:
    v0 = s1 & 255; pc = 0x80016158; continue;
  case 0x800162e8:
    v0 = v1 & 40960;
    { const c = (v0 | 0) === 0; v0 = (0 + -1) | 0; if (c) { pc = 0x80016300; continue; } }
  case 0x800162f4:
    m.write(((0x8007913c) + 24) >>> 0, v0 & 0xff, 1);
    v0 = s1 & 255; pc = 0x80016158; continue;
  case 0x80016300:
    v0 = v1 & 68;
    { const c = (v0 | 0) !== 0; v0 = v1 & 33; if (c) { pc = 0x800176dc; continue; } }
  case 0x8001630c:
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80016158; continue; } }
  case 0x80016314:
    v0 = (m.read(((0x8007913c) + 24) >>> 0, 1) << 24) >> 24;
    s0 = s1 & 255;
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x8001632c; continue; } }
  case 0x80016324:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s5 & 0xff, 1);
  case 0x8001632c:
    at = 0x80080000 | 0;
    m.write(((at) + -27965) >>> 0, s1 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8001633c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80016344:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8001634c:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x80016354:
    a0 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80029ad0, a0, a1, a2, a3);
  case 0x8001635c:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80016368:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80016370:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80016378:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80016380:
    a0 = (0 + 33) | 0;
    a1 = (0 + 70) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3612) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s5 & 0xff, 1);
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800163a0:
    a0 = (0 + 100) | 0;
    a1 = a0 | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3652) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800163b8:
    a0 = (0 + 76) | 0;
    a1 = (0 + 120) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3672) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800163d0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    m.write(((0x8007913c) + 24) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800163e8:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800163f0:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80014198, a0, a1, a2, a3);
  case 0x800163f8:
     [v0, v1] = yield* call(ctx, sp, 0x800332b0, a0, a1, a2, a3);
  case 0x80016400:
     [v0, v1] = yield* call(ctx, sp, 0x8003360c, a0, a1, a2, a3);
  case 0x80016408:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) !== (s5 | 0);  if (c) { pc = 0x80016480; continue; } }
  case 0x8001641c:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27368) >>> 0, s5 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x800298e4, a0, a1, a2, a3);
  case 0x80016434:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002bd1c, a0, a1, a2, a3);
  case 0x80016444:
    v1 = (0 + -1) | 0;
    { const c = (v0 | 0) !== (v1 | 0);  if (c) { pc = 0x80016478; continue; } }
  case 0x80016450:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27368) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s5 & 0xff, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x800177d8; continue; } }
  case 0x80016468:
    { const c = (v0 | 0) === (s5 | 0); t0 = (0 + 1) | 0; if (c) { pc = 0x80017700; continue; } }
  case 0x80016470:
    m.write(((sp) + 44) >>> 0, 0 >>> 0, 4); pc = 0x80017710; continue;
  case 0x80016478:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
  case 0x80016480:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80016488:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80016490:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80016498:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28025) >>> 0, 1);
    { const c = (v0 | 0) !== 0; a0 = 0x800c0000 | 0; if (c) { pc = 0x800164e4; continue; } }
  case 0x800164ac:
    a0 = (0 + 9202) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001c7c0, a0, a1, a2, a3);
  case 0x800164b4:
     pc = 0x800164f0; continue;
  case 0x800164bc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800164c4:
    s0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x800164cc:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800164d4:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800164dc:
    m.write(((sp) + 44) >>> 0, 0 >>> 0, 4); pc = 0x800175fc; continue;
  case 0x800164e4:
    a0 = (a0 + 25632) | 0;
    a1 = (0 + 14) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003abec, a0, a1, a2, a3);
  case 0x800164f0:
    at = 0x80080000 | 0;
    m.write(((at) + -28025) >>> 0, s5 & 0xff, 1);
    a0 = (0 + 9201) | 0;
    a1 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001d080, a0, a1, a2, a3);
  case 0x80016504:
    a0 = (0 + 3) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80016510:
    s3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80016518:
    a0 = (0 + 14) | 0;
    v0 = s7 & 255;
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
    t0 = (0 + 4) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, t0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80016560:
    t0 = s7 & 255;
    s2 = (0 + 42) | 0;
    m.write(((sp) + 52) >>> 0, t0 >>> 0, 4);
  case 0x8001656c:
    t0 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s0 = s3 & 65535;
    { const c = (s0 | 0) !== (t0 | 0); a0 = (0 + 3) | 0; if (c) { pc = 0x80016620; continue; } }
  case 0x8001657c:
    s1 = s3 & 255;
    a1 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80016588:
    v0 = v0 & 65535;
    { const c = (v0 | 0) === 0; a0 = (0 + 14) | 0; if (c) { pc = 0x800165d4; continue; } }
  case 0x80016594:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 61) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 18) | 0;
    a3 = 0 | 0;
    v0 = (0 + 52) | 0;
    t0 = (0 + 34) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 4) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, t0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x800165d4:
    a0 = (0 + 3) | 0;
    a1 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x800165e0:
    v0 = v0 & 65535;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 14) | 0; if (c) { pc = 0x800166d4; continue; } }
  case 0x800165f0:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 91) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 18) | 0;
    a3 = 0 | 0;
    t0 = (0 + 34) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 4) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); pc = 0x800166c4; continue;
  case 0x80016620:
    s1 = s3 & 255;
    a1 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x8001662c:
    v0 = v0 & 65535;
    { const c = (v0 | 0) === 0; a0 = (0 + 14) | 0; if (c) { pc = 0x80016678; continue; } }
  case 0x80016638:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 61) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 19) | 0;
    a3 = 0 | 0;
    v0 = (0 + 162) | 0;
    t0 = (0 + 34) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 4) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, t0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x80016678:
    a0 = (0 + 3) | 0;
    a1 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80016684:
    v0 = v0 & 65535;
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 14) | 0; if (c) { pc = 0x800166d4; continue; } }
  case 0x80016694:
    a2 = s0 << 2;
    a2 = (a2 + s0) | 0;
    a1 = a2 << 4;
    a1 = (a1 + 91) | 0;
    a2 = a2 << 1;
    a2 = (a2 + 19) | 0;
    a3 = 0 | 0;
    v0 = (0 + 108) | 0;
    t0 = (0 + 34) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 4) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
  case 0x800166c4:
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 28) >>> 0, 0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, t0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003cd78, a0, a1, a2, a3);
  case 0x800166d4:
    s3 = (s3 + 1) | 0;
    v0 = s3 & 65535;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = 0 | 0; if (c) { pc = 0x8001656c; continue; } }
  case 0x800166e8:
    a1 = (0 + 11) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 19) | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    t0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c8f8, a0, a1, a2, a3);
  case 0x8001671c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80016724:
    offer(ctx, [0, 1, 2].map((i) => box(i, 107 * i, 0x30, 106, 0xb0)), () => s7 & 0xff, ["left", "right"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8001672c:
    v0 = 0x801f0000 | 0;
    v1 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 8192;
    { const c = (v0 | 0) === 0; v0 = s7 & 255; if (c) { pc = 0x80016760; continue; } }
  case 0x80016744:
    t0 = (0 + 2) | 0;
    { const c = (v0 | 0) === (t0 | 0); v0 = 0x801f0000 | 0; if (c) { pc = 0x80017530; continue; } }
  case 0x80016750:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016758:
    s7 = (s7 + 1) | 0; pc = 0x8001752c; continue;
  case 0x80016760:
    v0 = v1 & 32768;
    { const c = (v0 | 0) === 0; v0 = s7 & 255; if (c) { pc = 0x800167a8; continue; } }
  case 0x8001676c:
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80017530; continue; } }
  case 0x80016774:
    s7 = (s7 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016780:
    v0 = 0x801f0000 | 0; pc = 0x80017530; continue;
  case 0x80016788:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016790:
     pc = 0x80017358; continue;
  case 0x80016798:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800167a0:
     pc = 0x80017358; continue;
  case 0x800167a8:
    v0 = v1 & 68;
    { const c = (v0 | 0) !== 0; v0 = v1 & 33; if (c) { pc = 0x800164bc; continue; } }
  case 0x800167b4:
    { const c = (v0 | 0) === 0; v0 = 0x801f0000 | 0; if (c) { pc = 0x80017530; continue; } }
  case 0x800167bc:
    at = 0x80080000 | 0;
    m.write(((at) + -27966) >>> 0, s7 & 0xff, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800167cc:
    s1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x800167d4:
    s2 = s7 & 255;
    v0 = 0x801f0000 | 0;
  case 0x800167dc:
    v1 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 16384;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80016808; continue; } }
  case 0x800167f0:
    { const c = (v0 | 0) === (fp | 0);  if (c) { pc = 0x80017374; continue; } }
  case 0x800167f8:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016800:
    s1 = (s1 + 1) | 0; pc = 0x80017370; continue;
  case 0x80016808:
    v0 = v1 & 4096;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80016830; continue; } }
  case 0x80016814:
    { const c = (v0 | 0) === 0; a0 = (0 + 100) | 0; if (c) { pc = 0x80017380; continue; } }
  case 0x8001681c:
    s1 = (s1 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016828:
    v0 = s1 & 255; pc = 0x80017374; continue;
  case 0x80016830:
    v0 = v1 & 68;
    { const c = (v0 | 0) !== 0; v0 = v1 & 33; if (c) { pc = 0x80016788; continue; } }
  case 0x8001683c:
    { const c = (v0 | 0) !== 0; v0 = s1 & 255; if (c) { pc = 0x80016854; continue; } }
  case 0x80016844:
    a0 = s7 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002bf98, a0, a1, a2, a3);
  case 0x8001684c:
    { const c = (v0 | 0) !== 0; v0 = s1 & 255; if (c) { pc = 0x80017374; continue; } }
  case 0x80016854:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80016aa4; continue; } }
  case 0x8001685c:
    a0 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002bf98, a0, a1, a2, a3);
  case 0x80016864:
    { const c = (v0 | 0) !== (s5 | 0);  if (c) { pc = 0x80016874; continue; } }
  case 0x8001686c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016874:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = (0 + 80) | 0;
    a1 = (0 + 50) | 0;
    a2 = (0 + 160) | 0;
    a3 = (0 + 94) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8001688c:
    s0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80016894:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8001689c:
    a0 = (0 + 25) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800168a8:
    a0 = (0 + 25) | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800168b4:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x800168bc:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800168c4:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800168cc:
    a0 = s0 | 0;
    a1 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x800168d8:
    a0 = (0 + 9) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002cbc0, a0, a1, a2, a3);
  case 0x800168e0:
    a0 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002bf98, a0, a1, a2, a3);
  case 0x800168e8:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8001695c; continue; } }
  case 0x800168f0:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80029a6c, a0, a1, a2, a3);
  case 0x80016900:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x800176c4; continue; } }
  case 0x80016914:
    at = 0x80080000 | 0;
    m.write(((at) + -27368) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8002b4e0, a0, a1, a2, a3);
  case 0x80016924:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27368) >>> 0, 1);
    { const c = (v1 | 0) === (s5 | 0); s0 = v0 | 0; if (c) { pc = 0x800176f0; continue; } }
  case 0x80016938:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) !== (s5 | 0);  if (c) { pc = 0x80016988; continue; } }
  case 0x8001694c:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80016954:
     pc = 0x800160e8; continue;
  case 0x8001695c:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80016964:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80029a6c, a0, a1, a2, a3);
  case 0x80016974:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x800176cc; continue; } }
  case 0x80016988:
    { const c = (s0 | 0) !== (s5 | 0);  if (c) { pc = 0x800177d8; continue; } }
  case 0x80016990:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28021) >>> 0, 1);
    { const c = (v0 | 0) !== (s5 | 0);  if (c) { pc = 0x800169d0; continue; } }
  case 0x800169a4:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800169ac:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8002bfe8, a0, a1, a2, a3);
  case 0x800169bc:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0);  if (c) { pc = 0x800176cc; continue; } }
  case 0x800169d0:
    a0 = s7 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002bf98, a0, a1, a2, a3);
  case 0x800169d8:
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 45) | 0; if (c) { pc = 0x80016a14; continue; } }
  case 0x800169e0:
    a1 = (0 + 70) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3700) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800169f4:
    a0 = (0 + 18) | 0;
    a1 = (0 + 90) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3732) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80016a0c:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x80016a14:
     [v0, v1] = yield* call(ctx, sp, 0x8002bfe8, a0, a1, a2, a3);
  case 0x80016a1c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0);  if (c) { pc = 0x800177d8; continue; } }
  case 0x80016a30:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80016a38:
    at = 0x80080000 | 0;
    m.write(((at) + -28030) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033848, a0, a1, a2, a3);
  case 0x80016a50:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0);  if (c) { pc = 0x800177d8; continue; } }
  case 0x80016a64:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28030) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0);  if (c) { pc = 0x800177d8; continue; } }
  case 0x80016a78:
    { const c = (v0 | 0) === (fp | 0);  if (c) { pc = 0x800176bc; continue; } }
  case 0x80016a80:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28022) >>> 0, s5 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80016a98:
    t0 = (0 + 1) | 0;
    m.write(((sp) + 44) >>> 0, t0 >>> 0, 4); pc = 0x80017710; continue;
  case 0x80016aa4:
    { const c = (v0 | 0) !== (s5 | 0); t0 = (0 + 2) | 0; if (c) { pc = 0x80016dcc; continue; } }
  case 0x80016aac:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016ab4:
    a0 = 0x80010000 | 0;
    a0 = (a0 + 3776) | 0; [v0, v1] = yield* call(ctx, sp, 0x80025c74, a0, a1, a2, a3);
  case 0x80016ac0:
    { const c = (v0 | 0) !== (s5 | 0); s4 = (0 + 1) | 0; if (c) { pc = 0x8001752c; continue; } }
  case 0x80016ac8:
    a0 = 0 | 0;
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80016ae0:
    a0 = (0 + 50) | 0;
    a1 = (0 + 70) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3848) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80016af8:
    a0 = (0 + 18) | 0;
    a1 = (0 + 90) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3732) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80016b10:
    a0 = 0 | 0;
    a1 = (0 + 60) | 0;
    a2 = (0 + 320) | 0;
    a3 = a1 | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    t0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80016b48:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80016b50:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80016b58:
    a0 = 0 | 0;
    a1 = (0 + 60) | 0;
    a2 = (0 + 320) | 0;
    a3 = a1 | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    t0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80016b90:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80016b98:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80016ba0:
    s0 = 0x80080000 | 0;
    s0 = m.read(((s0) + -27964) >>> 0, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8002bfe8, a0, a1, a2, a3);
  case 0x80016bb0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0); a0 = 0 | 0; if (c) { pc = 0x80017774; continue; } }
  case 0x80016bc4:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = 0 | 0; if (c) { pc = 0x80016bec; continue; } }
  case 0x80016bdc:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27964) >>> 0, 1);
    v1 = v0 & 1;
  case 0x80016bec:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    v0 = (v0 >>> 0) < 2 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s0 & 1; if (c) { pc = 0x80016c14; continue; } }
  case 0x80016c04:
    { const c = (v1 | 0) !== (v0 | 0); a0 = 0 | 0; if (c) { pc = 0x80016c1c; continue; } }
  case 0x80016c0c:
    a1 = (0 + 60) | 0; pc = 0x80016c5c; continue;
  case 0x80016c14:
    { const c = (v1 | 0) === 0; a0 = 0 | 0; if (c) { pc = 0x80016c58; continue; } }
  case 0x80016c1c:
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80016c30:
    a0 = (0 + 50) | 0;
    a1 = (0 + 2) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3420) | 0;
    a3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80025898, a0, a1, a2, a3);
  case 0x80016c48:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s5 & 0xff, 1);
     pc = 0x800177d8; continue;
  case 0x80016c58:
    a1 = (0 + 60) | 0;
  case 0x80016c5c:
    a2 = (0 + 320) | 0;
    a3 = a1 | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    t0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80016c8c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80016c94:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27966) >>> 0, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8002a1ac, a0, a1, a2, a3);
  case 0x80016ca4:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80016da0; continue; } }
  case 0x80016cac:
    s3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800332b0, a0, a1, a2, a3);
  case 0x80016cb4:
     [v0, v1] = yield* call(ctx, sp, 0x8003360c, a0, a1, a2, a3);
  case 0x80016cbc:
    v0 = 0x800b0000 | 0;
    a1 = (v0 + -16752) | 0;
    a0 = s3 & 65535;
  case 0x80016cc8:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27966) >>> 0, 1);
    s3 = (s3 + 1) | 0;
    v0 = v1 << 5;
    v0 = (v0 - v1) | 0;
    v0 = v0 << 8;
    v0 = (v0 + a1) | 0;
    v0 = (v0 + a0) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    v0 = s3 & 65535;
    v0 = (v0 >>> 0) < 7936 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = s3 & 65535; if (c) { pc = 0x80016cc8; continue; } }
  case 0x80016cfc:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002baa0, a0, a1, a2, a3);
  case 0x80016d04:
    v1 = (0 + -1) | 0;
    { const c = (v0 | 0) === (v1 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x800176b4; continue; } }
  case 0x80016d10:
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27966) >>> 0, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80016d20:
    a0 = (0 + 1) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27966) >>> 0, 1);
    s1 = v0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80016d34:
    a0 = (0 + 2) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27966) >>> 0, 1);
    s0 = v0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x80016d48:
    a1 = s1 | 0;
    a2 = s0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27966) >>> 0, 1);
    a3 = v0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x800338ac, a0, a1, a2, a3);
  case 0x80016d60:
    a0 = 0 | 0;
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80016d78:
    a0 = s7 & 255; [v0, v1] = yield* call(ctx, sp, 0x80015d74, a0, a1, a2, a3);
  case 0x80016d80:
     [v0, v1] = yield* call(ctx, sp, 0x8003ab98, a0, a1, a2, a3);
  case 0x80016d88:
    a0 = (0 + 75) | 0;
    a1 = (0 + 1) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3880) | 0;
    a3 = a1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80025898, a0, a1, a2, a3);
  case 0x80016da0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0); s4 = (0 + 1) | 0; if (c) { pc = 0x80017680; continue; } }
  case 0x80016db4:
    v0 = 0x801f0000 | 0; pc = 0x80017530; continue;
  case 0x80016dbc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016dc4:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); pc = 0x80017344; continue;
  case 0x80016dcc:
    { const c = (v0 | 0) !== (t0 | 0);  if (c) { pc = 0x80017368; continue; } }
  case 0x80016dd4:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016ddc:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = 0 | 0;
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80016df4:
    s1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80016dfc:
    v0 = 0x801f0000 | 0;
  case 0x80016e00:
    v1 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v1 & 16384;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80016e30; continue; } }
  case 0x80016e14:
    t0 = (0 + 2) | 0;
    { const c = (v0 | 0) === (t0 | 0);  if (c) { pc = 0x800170fc; continue; } }
  case 0x80016e20:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016e28:
    s1 = (s1 + 1) | 0; pc = 0x800170f8; continue;
  case 0x80016e30:
    v0 = v1 & 4096;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80016e58; continue; } }
  case 0x80016e3c:
    { const c = (v0 | 0) === 0; a0 = (0 + 100) | 0; if (c) { pc = 0x80017108; continue; } }
  case 0x80016e44:
    s1 = (s1 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016e50:
    v0 = s1 & 255; pc = 0x800170fc; continue;
  case 0x80016e58:
    v0 = v1 & 68;
    { const c = (v0 | 0) !== 0; v0 = v1 & 33; if (c) { pc = 0x80016dbc; continue; } }
  case 0x80016e64:
    { const c = (v0 | 0) === 0; s0 = s1 & 255; if (c) { pc = 0x800170f8; continue; } }
  case 0x80016e6c:
    t0 = (0 + 2) | 0;
    { const c = (s0 | 0) === (t0 | 0);  if (c) { pc = 0x80016dbc; continue; } }
  case 0x80016e78:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0);  if (c) { pc = 0x800177d8; continue; } }
  case 0x80016e8c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80016e94:
    { const c = (s2 | 0) === (s5 | 0); v0 = (s2 | 0) < 2 ? 1 : 0; if (c) { pc = 0x80016edc; continue; } }
  case 0x80016e9c:
    { const c = (v0 | 0) === 0; t0 = (0 + 2) | 0; if (c) { pc = 0x80016eb4; continue; } }
  case 0x80016ea4:
    { const c = (s2 | 0) === 0;  if (c) { pc = 0x80016ec4; continue; } }
  case 0x80016eac:
     pc = 0x80016f18; continue;
  case 0x80016eb4:
    { const c = (s2 | 0) === (t0 | 0);  if (c) { pc = 0x80016ef4; continue; } }
  case 0x80016ebc:
     pc = 0x80016f18; continue;
  case 0x80016ec4:
    { const c = (s0 | 0) === 0; t0 = (0 + 1) | 0; if (c) { pc = 0x80016f14; continue; } }
  case 0x80016ecc:
    { const c = (s0 | 0) !== (s5 | 0); t0 = (0 + 2) | 0; if (c) { pc = 0x80016f18; continue; } }
  case 0x80016ed4:
    m.write(((sp) + 40) >>> 0, t0 & 0xff, 1); pc = 0x80016f18; continue;
  case 0x80016edc:
    { const c = (s0 | 0) === 0;  if (c) { pc = 0x80016f0c; continue; } }
  case 0x80016ee4:
    { const c = (s0 | 0) !== (s5 | 0); t0 = (0 + 2) | 0; if (c) { pc = 0x80016f18; continue; } }
  case 0x80016eec:
    m.write(((sp) + 40) >>> 0, t0 & 0xff, 1); pc = 0x80016f18; continue;
  case 0x80016ef4:
    { const c = (s0 | 0) === 0;  if (c) { pc = 0x80016f0c; continue; } }
  case 0x80016efc:
    { const c = (s0 | 0) === (s5 | 0); t0 = (0 + 1) | 0; if (c) { pc = 0x80016f14; continue; } }
  case 0x80016f04:
     pc = 0x80016f18; continue;
  case 0x80016f0c:
    m.write(((sp) + 40) >>> 0, 0 & 0xff, 1); pc = 0x80016f18; continue;
  case 0x80016f14:
    m.write(((sp) + 40) >>> 0, t0 & 0xff, 1);
  case 0x80016f18:
    a0 = m.read(((sp) + 40) >>> 0, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8002bf98, a0, a1, a2, a3);
  case 0x80016f24:
    { const c = (v0 | 0) !== (s5 | 0); s0 = (0 + 1) | 0; if (c) { pc = 0x80016f40; continue; } }
  case 0x80016f2c:
    a0 = 0x80010000 | 0;
    a0 = (a0 + 3904) | 0; [v0, v1] = yield* call(ctx, sp, 0x80025c74, a0, a1, a2, a3);
  case 0x80016f38:
    { const c = (v0 | 0) === 0; s0 = (0 + 1) | 0; if (c) { pc = 0x80017340; continue; } }
  case 0x80016f40:
    { const c = (s0 | 0) !== (s5 | 0); v0 = s1 & 255; if (c) { pc = 0x800170fc; continue; } }
  case 0x80016f48:
    a0 = 0 | 0;
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80016f60:
    a0 = (0 + 60) | 0;
    a1 = (0 + 70) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3980) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80016f78:
    a0 = (0 + 18) | 0;
    a1 = (0 + 90) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3732) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80016f90:
    a0 = 0 | 0;
    a1 = (0 + 60) | 0;
    a2 = (0 + 320) | 0;
    a3 = a1 | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    t0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80016fc8:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80016fd0:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80016fd8:
    a0 = 0 | 0;
    a1 = (0 + 60) | 0;
    a2 = (0 + 320) | 0;
    a3 = a1 | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    t0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80017010:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017018:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80017020:
     [v0, v1] = yield* call(ctx, sp, 0x80029a6c, a0, a1, a2, a3);
  case 0x80017028:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0); a1 = (0 + 30) | 0; if (c) { pc = 0x80017740; continue; } }
  case 0x8001703c:
     [v0, v1] = yield* call(ctx, sp, 0x8002bfe8, a0, a1, a2, a3);
  case 0x80017044:
    a0 = 0 | 0;
    a1 = (0 + 60) | 0;
    a2 = (0 + 320) | 0;
    a3 = a1 | 0;
    t0 = (0 + 160) | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    t0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x8001707c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80017084:
    a1 = m.read(((sp) + 40) >>> 0, 1);
    a0 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002aa70, a0, a1, a2, a3);
  case 0x80017090:
    s0 = v0 | 0;
    v0 = (0 + -1) | 0;
    { const c = (s0 | 0) === (v0 | 0);  if (c) { pc = 0x80017680; continue; } }
  case 0x800170a0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s5 | 0); a0 = 0 | 0; if (c) { pc = 0x80017680; continue; } }
  case 0x800170b4:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x800170c8:
    { const c = (s0 | 0) !== 0;  if (c) { pc = 0x80017340; continue; } }
  case 0x800170d0:
    a0 = s2 | 0; [v0, v1] = yield* call(ctx, sp, 0x80015d74, a0, a1, a2, a3);
  case 0x800170d8:
    a0 = (0 + 70) | 0;
    a1 = (0 + 1) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4012) | 0;
    a3 = a1 | 0; [v0, v1] = yield* call(ctx, sp, 0x80025898, a0, a1, a2, a3);
  case 0x800170f0:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); pc = 0x80017344; continue;
  case 0x800170f8:
    v0 = s1 & 255;
  case 0x800170fc:
    { const c = (v0 | 0) !== 0; s0 = s1 & 255; if (c) { pc = 0x80017128; continue; } }
  case 0x80017104:
    a0 = (0 + 100) | 0;
  case 0x80017108:
    a1 = (0 + 60) | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x80017124:
    s0 = s1 & 255;
  case 0x80017128:
    { const c = (s0 | 0) !== (s5 | 0); t0 = (0 + 2) | 0; if (c) { pc = 0x80017154; continue; } }
  case 0x80017130:
    a0 = (0 + 100) | 0;
    a1 = (0 + 80) | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x80017150:
    t0 = (0 + 2) | 0;
  case 0x80017154:
    { const c = (s0 | 0) !== (t0 | 0); a0 = (0 + 100) | 0; if (c) { pc = 0x80017178; continue; } }
  case 0x8001715c:
    a1 = a0 | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x80017178:
    { const c = (s2 | 0) === (s5 | 0); v0 = (s2 | 0) < 2 ? 1 : 0; if (c) { pc = 0x80017200; continue; } }
  case 0x80017180:
    { const c = (v0 | 0) === 0; t0 = (0 + 2) | 0; if (c) { pc = 0x80017198; continue; } }
  case 0x80017188:
    { const c = (s2 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x800171a8; continue; } }
  case 0x80017190:
     pc = 0x800172b8; continue;
  case 0x80017198:
    { const c = (s2 | 0) === (t0 | 0); v0 = s1 & 255; if (c) { pc = 0x80017258; continue; } }
  case 0x800171a0:
     pc = 0x800172bc; continue;
  case 0x800171a8:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x800171b4; continue; } }
  case 0x800171b0:
    a0 = 0 | 0;
  case 0x800171b4:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800171bc:
    a0 = (0 + 105) | 0;
    a1 = (0 + 60) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4036) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800171d4:
    v0 = s1 & 255;
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x800171e4; continue; } }
  case 0x800171e0:
    a0 = 0 | 0;
  case 0x800171e4:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800171ec:
    a0 = (0 + 105) | 0;
    a1 = (0 + 80) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4052) | 0; pc = 0x800172ac; continue;
  case 0x80017200:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x8001720c; continue; } }
  case 0x80017208:
    a0 = 0 | 0;
  case 0x8001720c:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80017214:
    a0 = (0 + 105) | 0;
    a1 = (0 + 60) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4068) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001722c:
    v0 = s1 & 255;
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x8001723c; continue; } }
  case 0x80017238:
    a0 = 0 | 0;
  case 0x8001723c:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80017244:
    a0 = (0 + 105) | 0;
    a1 = (0 + 80) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4052) | 0; pc = 0x800172ac; continue;
  case 0x80017258:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x80017264; continue; } }
  case 0x80017260:
    a0 = 0 | 0;
  case 0x80017264:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8001726c:
    a0 = (0 + 105) | 0;
    a1 = (0 + 60) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4068) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80017284:
    v0 = s1 & 255;
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80017294; continue; } }
  case 0x80017290:
    a0 = 0 | 0;
  case 0x80017294:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8001729c:
    a0 = (0 + 105) | 0;
    a1 = (0 + 80) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4036) | 0;
  case 0x800172ac:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800172b4:
    v0 = s1 & 255;
  case 0x800172b8:
    t0 = (0 + 2) | 0;
  case 0x800172bc:
    { const c = (v0 | 0) !== (t0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x800172c8; continue; } }
  case 0x800172c4:
    a0 = 0 | 0;
  case 0x800172c8:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800172d0:
    a0 = (0 + 105) | 0;
    a1 = (0 + 100) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2264) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800172e8:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800172f0:
    a0 = (0 + 80) | 0;
    a1 = (0 + 50) | 0;
    a2 = (0 + 160) | 0;
    a3 = (0 + 94) | 0;
    t0 = a2 | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    t0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80017328:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017330:
    offer(ctx, Array.from({ length: Math.min((fp & 0xff) + 1, 3) }, (_, i) => box(i, 0x64, 0x3c + 20 * i, 0x78, 0x10)), () => s1 & 0xff, ["up", "down"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80017338:
    v0 = 0x801f0000 | 0; pc = 0x80016e00; continue;
  case 0x80017340:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
  case 0x80017344:
    a0 = 0 | 0;
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80017358:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017360:
    s4 = (0 + 1) | 0; pc = 0x8001752c; continue;
  case 0x80017368:
    { const c = (v0 | 0) === (fp | 0);  if (c) { pc = 0x80016798; continue; } }
  case 0x80017370:
    v0 = s1 & 255;
  case 0x80017374:
    { const c = (v0 | 0) !== 0; s0 = s1 & 255; if (c) { pc = 0x800173a0; continue; } }
  case 0x8001737c:
    a0 = (0 + 100) | 0;
  case 0x80017380:
    a1 = (0 + 60) | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x8001739c:
    s0 = s1 & 255;
  case 0x800173a0:
    { const c = (s0 | 0) !== (s5 | 0); t0 = (0 + 2) | 0; if (c) { pc = 0x800173cc; continue; } }
  case 0x800173a8:
    a0 = (0 + 100) | 0;
    a1 = (0 + 80) | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x800173c8:
    t0 = (0 + 2) | 0;
  case 0x800173cc:
    { const c = (s0 | 0) !== (t0 | 0); a0 = (0 + 100) | 0; if (c) { pc = 0x800173f0; continue; } }
  case 0x800173d4:
    a1 = a0 | 0;
    a2 = (0 + 120) | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x800173f0:
    { const c = (s0 | 0) !== (fp | 0); a1 = (0 + 120) | 0; if (c) { pc = 0x80017414; continue; } }
  case 0x800173f8:
    a0 = (0 + 100) | 0;
    a2 = a1 | 0;
    a3 = (0 + 16) | 0;
    m.write(((sp) + 16) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s6 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8001544c, a0, a1, a2, a3);
  case 0x80017414:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x80017420; continue; } }
  case 0x8001741c:
    a0 = 0 | 0;
  case 0x80017420:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80017428:
    a0 = (0 + 105) | 0;
    a1 = (0 + 60) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4084) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80017440:
    v0 = s1 & 255;
    { const c = (v0 | 0) !== (s5 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80017450; continue; } }
  case 0x8001744c:
    a0 = 0 | 0;
  case 0x80017450:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80017458:
    a0 = (0 + 105) | 0;
    a1 = (0 + 80) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4096) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80017470:
    v0 = s1 & 255;
    t0 = (0 + 2) | 0;
    { const c = (v0 | 0) !== (t0 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x80017484; continue; } }
  case 0x80017480:
    a0 = 0 | 0;
  case 0x80017484:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8001748c:
    a0 = (0 + 105) | 0;
    a1 = (0 + 100) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4112) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800174a4:
    v0 = s1 & 255;
    { const c = (v0 | 0) !== (fp | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x800174b4; continue; } }
  case 0x800174b0:
    a0 = 0 | 0;
  case 0x800174b4:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800174bc:
    a0 = (0 + 105) | 0;
    a1 = (0 + 120) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 2264) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800174d4:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800174dc:
    a0 = (0 + 80) | 0;
    a1 = (0 + 50) | 0;
    a2 = (0 + 160) | 0;
    a3 = (0 + 94) | 0;
    t0 = a2 | 0;
    m.write(((sp) + 16) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, t0 >>> 0, 4);
    t0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, t0 >>> 0, 4);
    t0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, t0 >>> 0, 4);
    m.write(((sp) + 32) >>> 0, fp >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80017514:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8001751c:
    offer(ctx, Array.from({ length: Math.min((fp & 0xff) + 1, 4) }, (_, i) => box(i, 0x64, 0x3c + 20 * i, 0x78, 0x10)), () => s1 & 0xff, ["up", "down"]);
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80017524:
    v0 = 0x801f0000 | 0; pc = 0x800167dc; continue;
  case 0x8001752c:
    v0 = 0x801f0000 | 0;
  case 0x80017530:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 40960;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8001754c; continue; } }
  case 0x80017544:
    { const c = (s4 | 0) !== (s5 | 0);  if (c) { pc = 0x80016510; continue; } }
  case 0x8001754c:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017554:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27965) >>> 0, 1);
    { const c = (v0 | 0) !== 0; a0 = (0 + 10) | 0; if (c) { pc = 0x80017578; continue; } }
  case 0x80017568:
    a1 = (0 + 12) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28328) | 0; pc = 0x80017584; continue;
  case 0x80017578:
    a1 = (0 + 11) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28320) | 0;
  case 0x80017584:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8001758c:
    s3 = 0 | 0;
    s4 = s7 & 255;
    v0 = s3 & 65535;
  case 0x80017598:
    { const c = (s4 | 0) !== (v0 | 0); a0 = 0 | 0; if (c) { pc = 0x800175e0; continue; } }
  case 0x800175a0:
    s0 = s3 & 255;
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x800175ac:
    a0 = (0 + 1) | 0;
    a1 = s0 | 0;
    s2 = v0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x800175bc:
    a0 = (0 + 2) | 0;
    a1 = s0 | 0;
    s1 = v0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80033be8, a0, a1, a2, a3);
  case 0x800175cc:
    a0 = s0 | 0;
    a1 = s2 | 0;
    a2 = s1 | 0;
    a3 = v0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x800338ac, a0, a1, a2, a3);
  case 0x800175e0:
    s3 = (s3 + 1) | 0;
    v0 = s3 & 65535;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s3 & 65535; if (c) { pc = 0x80017598; continue; } }
  case 0x800175f4:
    s4 = 0 | 0; pc = 0x80016510; continue;
  case 0x800175fc:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80017608:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80017610:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80017618:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80017620:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80017628:
    { const c = (s0 | 0) === (s5 | 0);  if (c) { pc = 0x800160cc; continue; } }
  case 0x80017630:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28022) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x80017658; continue; } }
  case 0x80017644:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -28027) >>> 0, 1);
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80017710; continue; } }
  case 0x80017658:
    v0 = m.read(((sp) + 48) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (0 + 1) | 0; if (c) { pc = 0x80017710; continue; } }
  case 0x80017668:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x800298e4, a0, a1, a2, a3);
  case 0x80017678:
     pc = 0x800160cc; continue;
  case 0x80017680:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80017688:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80017694:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8001769c:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800176a4:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x800176ac:
     pc = 0x800160e8; continue;
  case 0x800176b4:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
  case 0x800176bc:
    m.write(((sp) + 44) >>> 0, 0 >>> 0, 4); pc = 0x80017630; continue;
  case 0x800176c4:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800176cc:
     [v0, v1] = yield* call(ctx, sp, 0x8002a89c, a0, a1, a2, a3);
  case 0x800176d4:
     pc = 0x800160e8; continue;
  case 0x800176dc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x800176e4:
    t0 = (0 + 1) | 0;
    m.write(((sp) + 48) >>> 0, t0 & 0xff, 1); pc = 0x800176bc; continue;
  case 0x800176f0:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, 0 & 0xff, 1);
     pc = 0x80017710; continue;
  case 0x80017700:
    m.write(((sp) + 44) >>> 0, t0 >>> 0, 4);
    t0 = m.read(((sp) + 44) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28022) >>> 0, t0 & 0xff, 1);
  case 0x80017710:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80017718:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x80017724:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8001772c:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80017734:
    v0 = m.read(((sp) + 44) >>> 0, 4) | 0;
     pc = 0x80017820; continue;
  case 0x80017740:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = 0 | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80017754:
    a0 = (0 + 50) | 0;
    a1 = (0 + 2) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3476) | 0;
    a3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80025898, a0, a1, a2, a3);
  case 0x8001776c:
     pc = 0x800177ac; continue;
  case 0x80017774:
    a1 = (0 + 30) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 110) | 0;
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80017788:
    a0 = (0 + 50) | 0;
    a1 = (0 + 2) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 3420) | 0;
    a3 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80025898, a0, a1, a2, a3);
  case 0x800177a0:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
  case 0x800177ac:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x800177b4:
    a0 = (0 + 1) | 0;
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002ca08, a0, a1, a2, a3);
  case 0x800177c0:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x800177c8:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800177d0:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x800177d8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28022) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x80017800; continue; } }
  case 0x800177ec:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -28027) >>> 0, 1);
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x80017710; continue; } }
  case 0x80017800:
    v0 = m.read(((sp) + 48) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80017710; continue; } }
  case 0x80017810:
    at = 0x80080000 | 0;
    m.write(((at) + -28022) >>> 0, 0 & 0xff, 1);
     pc = 0x800160cc; continue;
  case 0x80017820:
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
  default: throw new Error(`startMenu: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002a1ac, translated instruction by instruction (93 instructions).
export function* f8002a1ac(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002a1ac;
  for (;;) switch (pc) {
  case 0x8002a1ac:
    sp = (sp + -32) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    v1 = 0x80070000 | 0;
    m.write(((sp) + 28) >>> 0, 0, 4);
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    v0 = (v0 + 48) | 0;
    m.write(((v1) + -20769) >>> 0, v0 & 0xff, 1);
  case 0x8002a1cc:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002a1dc:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002a1f0:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v1 = v0 & 15;
    v0 = (0 + 3) | 0;
    { const c = (v1 | 0) !== (v0 | 0); v0 = (0 + 2) | 0; if (c) { pc = 0x8002a218; continue; } }
  case 0x8002a208:
    v0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
    v0 = (0 + 2) | 0;
  case 0x8002a218:
    { const c = (v1 | 0) === (v0 | 0); v0 = (0 + 4) | 0; if (c) { pc = 0x8002a228; continue; } }
  case 0x8002a220:
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002a288; continue; } }
  case 0x8002a228:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002a238:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002a24c:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002a25c:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 20) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002a270:
    v1 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 20) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002a228; continue; } }
  case 0x8002a288:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v1 = v0 & 15;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) !== (v0 | 0); s0 = (0 + 1) | 0; if (c) { pc = 0x8002a2b4; continue; } }
  case 0x8002a2a0:
    a0 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80029b34, a0, a1, a2, a3);
  case 0x8002a2a8:
    v0 = v0 << 24;
    v0 = v0 >> 24; pc = 0x8002a30c; continue;
  case 0x8002a2b4:
    { const c = (v1 | 0) !== (s0 | 0);  if (c) { pc = 0x8002a2d4; continue; } }
  case 0x8002a2bc:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80015fa8, a0, a1, a2, a3);
  case 0x8002a2c4:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s0 & 0xff, 1);
    v0 = (0 + -1) | 0; pc = 0x8002a30c; continue;
  case 0x8002a2d4:
    { const c = (v1 | 0) !== 0; a1 = 0x80070000 | 0; if (c) { pc = 0x8002a2f8; continue; } }
  case 0x8002a2dc:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a1 = (a1 + -20788) | 0;
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80063a6c, a0, a1, a2, a3);
  case 0x8002a2f0:
     pc = 0x8002a30c; continue;
  case 0x8002a2f8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) !== (s0 | 0); v0 = (0 + -1) | 0; if (c) { pc = 0x8002a1cc; continue; } }
  case 0x8002a30c:
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f8002a1ac: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002aa70, translated instruction by instruction (338 instructions).
export function* f8002aa70(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002aa70;
  for (;;) switch (pc) {
  case 0x8002aa70:
    sp = (sp + -96) | 0;
    m.write(((sp) + 84) >>> 0, s7 >>> 0, 4);
    s7 = a0 | 0;
    m.write(((sp) + 80) >>> 0, s6 >>> 0, 4);
    s6 = a1 | 0;
    m.write(((sp) + 64) >>> 0, s2 >>> 0, 4);
    s2 = (0 + 3) | 0;
    m.write(((sp) + 68) >>> 0, s3 >>> 0, 4);
    s3 = (0 + 2) | 0;
    m.write(((sp) + 60) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 1) | 0;
    m.write(((sp) + 72) >>> 0, s4 >>> 0, 4);
    s4 = (0 + 4) | 0;
    v0 = 0x80070000 | 0;
    m.write(((sp) + 76) >>> 0, s5 >>> 0, 4);
    s5 = 0x80080000 | 0;
    s5 = m.read(((s5) + -27384) >>> 0, 4) | 0;
    a0 = (a0 + 48) | 0;
    m.write(((sp) + 88) >>> 0, 0, 4);
    m.write(((sp) + 56) >>> 0, s0 >>> 0, 4);
    m.write(((v0) + -20769) >>> 0, a0 & 0xff, 1);
  case 0x8002aac4:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002aad4:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002aae8:
    v0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    v0 = v0 & 15;
    { const c = (v0 | 0) !== (s2 | 0);  if (c) { pc = 0x8002ab04; continue; } }
  case 0x8002aafc:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s1 & 0xff, 1);
  case 0x8002ab04:
    { const c = (v0 | 0) === (s3 | 0);  if (c) { pc = 0x8002ab14; continue; } }
  case 0x8002ab0c:
    { const c = (v0 | 0) !== (s4 | 0);  if (c) { pc = 0x8002ab74; continue; } }
  case 0x8002ab14:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002ab24:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002ab38:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002ab48:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 44) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002ab5c:
    v1 = m.read(((sp) + 40) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 44) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002ab14; continue; } }
  case 0x8002ab74:
    v0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s0 = v0 & 15;
    { const c = (s0 | 0) === (s3 | 0); m.write(((sp) + 48) >>> 0, v0 >>> 0, 4); if (c) { pc = 0x8002aecc; continue; } }
  case 0x8002ab88:
    { const c = (s0 | 0) === (s1 | 0);  if (c) { pc = 0x8002aed4; continue; } }
  case 0x8002ab90:
    { const c = (s0 | 0) === (s4 | 0); a0 = (0 + 4) | 0; if (c) { pc = 0x8002aefc; continue; } }
  case 0x8002ab98:
    { const c = (s0 | 0) !== (s2 | 0); a1 = 0x80070000 | 0; if (c) { pc = 0x8002abbc; continue; } }
  case 0x8002aba0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) !== (s1 | 0); v0 = (0 + -1) | 0; if (c) { pc = 0x8002aac4; continue; } }
  case 0x8002abb4:
     pc = 0x8002af88; continue;
  case 0x8002abbc:
    a1 = (a1 + -20788) | 0;
    a2 = s5 | 0;
    a3 = 0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    v0 = (0 + 7936) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062fa0, a0, a1, a2, a3);
  case 0x8002abe0:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 48) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002abf4:
    v1 = m.read(((sp) + 48) >>> 0, 4) | 0;
    { const c = (v1 | 0) === (s3 | 0); a0 = (0 + 2) | 0; if (c) { pc = 0x8002aefc; continue; } }
  case 0x8002ac04:
    { const c = (v1 | 0) === (s4 | 0); a0 = (0 + 4) | 0; if (c) { pc = 0x8002aefc; continue; } }
  case 0x8002ac0c:
    v0 = (0 + 5) | 0;
    { const c = (v1 | 0) !== (v0 | 0); v1 = s6 & 255; if (c) { pc = 0x8002ac20; continue; } }
  case 0x8002ac18:
    v0 = 0 | 0; pc = 0x8002af88; continue;
  case 0x8002ac20:
    { const c = (v1 | 0) === (s1 | 0); v0 = (v1 | 0) < 2 ? 1 : 0; if (c) { pc = 0x8002ac5c; continue; } }
  case 0x8002ac28:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002ac40; continue; } }
  case 0x8002ac30:
    { const c = (v1 | 0) === 0; v1 = 0x80070000 | 0; if (c) { pc = 0x8002ac50; continue; } }
  case 0x8002ac38:
    v0 = (s6 + 48) | 0; pc = 0x8002ac88; continue;
  case 0x8002ac40:
    { const c = (v1 | 0) === (s3 | 0); v1 = 0x80070000 | 0; if (c) { pc = 0x8002ac68; continue; } }
  case 0x8002ac48:
    v0 = (s6 + 48) | 0; pc = 0x8002ac88; continue;
  case 0x8002ac50:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -21232) | 0; pc = 0x8002ac70; continue;
  case 0x8002ac5c:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -21212) | 0; pc = 0x8002ac70; continue;
  case 0x8002ac68:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -21192) | 0;
  case 0x8002ac70:
    a1 = 0x80070000 | 0;
    a1 = (a1 + -21740) | 0;
    a2 = (0 + 17) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002ac80:
    v1 = 0x80070000 | 0;
    v0 = (s6 + 48) | 0;
  case 0x8002ac88:
    m.write(((v1) + -20769) >>> 0, v0 & 0xff, 1);
    s2 = (0 + 2) | 0;
    s1 = (0 + 4) | 0;
    s0 = (0 + 1) | 0;
  case 0x8002ac98:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002aca8:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002acbc:
    v0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    v1 = v0 & 15;
    v0 = (0 + 3) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002acdc; continue; } }
  case 0x8002acd4:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s0 & 0xff, 1);
  case 0x8002acdc:
    { const c = (v1 | 0) === (s2 | 0);  if (c) { pc = 0x8002acec; continue; } }
  case 0x8002ace4:
    { const c = (v1 | 0) !== (s1 | 0);  if (c) { pc = 0x8002ad4c; continue; } }
  case 0x8002acec:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002acfc:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 40) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002ad10:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002ad20:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 44) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002ad34:
    v1 = m.read(((sp) + 40) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 44) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002acec; continue; } }
  case 0x8002ad4c:
    v0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    m.write(((sp) + 48) >>> 0, v0 >>> 0, 4);
    v0 = v0 & 15;
    { const c = (v0 | 0) === (s2 | 0); a0 = (0 + 2) | 0; if (c) { pc = 0x8002aefc; continue; } }
  case 0x8002ad64:
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x8002aeec; continue; } }
  case 0x8002ad6c:
    { const c = (v0 | 0) === (s1 | 0); a0 = (0 + 4) | 0; if (c) { pc = 0x8002aefc; continue; } }
  case 0x8002ad74:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002ac98; continue; } }
  case 0x8002ad7c:
    a0 = 0x80070000 | 0;
    a0 = (a0 + -21172) | 0;
    s0 = 0x80070000 | 0;
    s0 = (s0 + -21616) | 0;
    a1 = s0 | 0;
    a2 = (0 + 384) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002ad98:
    a0 = (s0 + -128) | 0;
    a1 = s5 | 0;
    a2 = (0 + 512) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002ada8:
    v0 = 0x80070000 | 0;
    s0 = (v0 + -20788) | 0;
    a1 = s0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a2 = (0 + 1) | 0;
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80063864, a0, a1, a2, a3);
  case 0x8002adc8:
    m.write(((sp) + 48) >>> 0, v0 >>> 0, 4);
    v0 = v0 & 15;
    v1 = (0 + 7) | 0;
    { const c = (v0 | 0) !== (v1 | 0); a1 = s0 | 0; if (c) { pc = 0x8002af10; continue; } }
  case 0x8002addc:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = 0 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 60) | 0;
    s0 = 0x80010000 | 0;
    s0 = (s0 + 6172) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8002adfc:
    a0 = (0 + 36) | 0;
    a1 = (0 + 70) | 0;
    a2 = s0 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002ae10:
    s1 = 0x801f0000 | 0; [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002ae18:
    s0 = (0 + 60) | 0; [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002ae20:
    v0 = m.read(((s1) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 2293;
    { const c = (v0 | 0) !== 0; a0 = (0 + 30) | 0; if (c) { pc = 0x8002ae8c; continue; } }
  case 0x8002ae34:
    a1 = (0 + 64) | 0;
    a2 = (0 + 260) | 0;
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
  case 0x8002ae6c:
     [v0, v1] = yield* call(ctx, sp, 0x8003aa8c, a0, a1, a2, a3);
  case 0x8002ae74:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002ae7c:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002ae84:
     pc = 0x8002ae20; continue;
  case 0x8002ae8c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8002ae94:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002ae9c:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = 0 | 0;
    a1 = (0 + 64) | 0;
    a2 = (0 + 320) | 0;
    a3 = (0 + 76) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x8002aeb4:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002aebc:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002aec4:
    v0 = (0 + -1) | 0; pc = 0x8002af88; continue;
  case 0x8002aecc:
    a0 = (0 + 2) | 0; pc = 0x8002aefc; continue;
  case 0x8002aed4:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80015fa8, a0, a1, a2, a3);
  case 0x8002aedc:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s0 & 0xff, 1);
    v0 = (0 + -1) | 0; pc = 0x8002af88; continue;
  case 0x8002aeec:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80015fa8, a0, a1, a2, a3);
  case 0x8002aef4:
    v0 = (0 + -1) | 0; pc = 0x8002af88; continue;
  case 0x8002aefc:
     [v0, v1] = yield* call(ctx, sp, 0x80029b34, a0, a1, a2, a3);
  case 0x8002af04:
    v0 = v0 << 24;
    v0 = v0 >> 24; pc = 0x8002af88; continue;
  case 0x8002af10:
    a2 = s5 | 0;
    a3 = 0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    v0 = (0 + 7936) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80063240, a0, a1, a2, a3);
  case 0x8002af30:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 48) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002af44:
    v0 = m.read(((sp) + 48) >>> 0, 4) | 0;
    { const c = (v0 | 0) !== 0; v1 = 0x800b0000 | 0; if (c) { pc = 0x8002af88; continue; } }
  case 0x8002af54:
    v0 = s7 & 255;
    a0 = v0 << 5;
    a0 = (a0 - v0) | 0;
    a0 = a0 << 8;
    v1 = (v1 + -16752) | 0;
    a0 = (a0 + v1) | 0;
    v0 = s6 & 255;
    a1 = v0 << 5;
    a1 = (a1 - v0) | 0;
    a1 = a1 << 8;
    a1 = (a1 + v1) | 0;
    a2 = (0 + 7936) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002af88:
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
  default: throw new Error(`f8002aa70: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002b4e0, translated instruction by instruction (197 instructions).
export function* f8002b4e0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002b4e0;
  for (;;) switch (pc) {
  case 0x8002b4e0:
    sp = (sp + -56) | 0;
    m.write(((sp) + 28) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 1) | 0;
    m.write(((sp) + 44) >>> 0, s5 >>> 0, 4);
    s5 = 0x80070000 | 0;
    m.write(((sp) + 48) >>> 0, s6 >>> 0, 4);
    s6 = (s5 + -20788) | 0;
    m.write(((sp) + 32) >>> 0, s2 >>> 0, 4);
    s2 = (0 + 2) | 0;
    m.write(((sp) + 40) >>> 0, s4 >>> 0, 4);
    s4 = (0 + 4) | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    s0 = s1 | 0;
    m.write(((sp) + 52) >>> 0, 0, 4);
    m.write(((sp) + 36) >>> 0, s3 >>> 0, 4);
    s3 = 0 | 0;
  case 0x8002b520:
    v0 = (0 + 57) | 0;
    m.write(((s6) + 19) >>> 0, v0 & 0xff, 1);
  case 0x8002b528:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002b538:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b54c:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v1 = v0 & 15;
    v0 = (0 + 3) | 0;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002b56c; continue; } }
  case 0x8002b564:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s0 & 0xff, 1);
  case 0x8002b56c:
    { const c = (v1 | 0) === (s2 | 0);  if (c) { pc = 0x8002b57c; continue; } }
  case 0x8002b574:
    { const c = (v1 | 0) !== (s4 | 0);  if (c) { pc = 0x8002b5dc; continue; } }
  case 0x8002b57c:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002b58c:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b5a0:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002b5b0:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 20) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b5c4:
    v1 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 20) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002b57c; continue; } }
  case 0x8002b5dc:
    v0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    v0 = v0 & 15;
    { const c = (v0 | 0) === (s2 | 0);  if (c) { pc = 0x8002b734; continue; } }
  case 0x8002b5f0:
    { const c = (v0 | 0) !== (s0 | 0);  if (c) { pc = 0x8002b620; continue; } }
  case 0x8002b5f8:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80015fa8, a0, a1, a2, a3);
  case 0x8002b600:
     [v0, v1] = yield* call(ctx, sp, 0x8002bfe8, a0, a1, a2, a3);
  case 0x8002b608:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27368) >>> 0, 0 & 0xff, 1);
    v0 = 0 | 0; pc = 0x8002b7c8; continue;
  case 0x8002b620:
    { const c = (v0 | 0) === (s4 | 0);  if (c) { pc = 0x8002b724; continue; } }
  case 0x8002b628:
    { const c = (v0 | 0) !== 0; a1 = (s5 + -20788) | 0; if (c) { pc = 0x8002b528; continue; } }
  case 0x8002b630:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a2 = (0 + 1) | 0;
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80063864, a0, a1, a2, a3);
  case 0x8002b644:
    v0 = v0 & 15;
    v1 = (0 + 7) | 0;
    { const c = (v0 | 0) !== (v1 | 0); v0 = s3 & 65535; if (c) { pc = 0x8002b790; continue; } }
  case 0x8002b654:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x8002b65c:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x8002b664:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x8002b66c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x8002b674:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002b67c:
    a0 = (0 + 98) | 0;
    a1 = (0 + 28) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 5956) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b694:
    a0 = (0 + 58) | 0;
    a1 = (0 + 47) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 5976) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b6ac:
    a0 = (0 + 36) | 0;
    a1 = (0 + 66) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 6008) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b6c4:
    a0 = (0 + 63) | 0;
    a1 = (0 + 85) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 6044) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b6dc:
    a0 = (0 + 62) | 0;
    a1 = (0 + 104) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 6072) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002b6f4:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002a320, a0, a1, a2, a3);
  case 0x8002b6fc:
    a0 = v0 | 0;
    v1 = a0 & 255;
    { const c = (v1 | 0) === (s0 | 0); v0 = (v1 | 0) < 2 ? 1 : 0; if (c) { pc = 0x8002b770; continue; } }
  case 0x8002b70c:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002b744; continue; } }
  case 0x8002b714:
    { const c = (v1 | 0) === 0; v0 = s3 & 65535; if (c) { pc = 0x8002b754; continue; } }
  case 0x8002b71c:
     pc = 0x8002b790; continue;
  case 0x8002b724:
    a0 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80029b34, a0, a1, a2, a3);
  case 0x8002b72c:
    a1 = (s5 + -20788) | 0; pc = 0x8002b630; continue;
  case 0x8002b734:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x80029b34, a0, a1, a2, a3);
  case 0x8002b73c:
    a1 = (s5 + -20788) | 0; pc = 0x8002b630; continue;
  case 0x8002b744:
    { const c = (v1 | 0) === (s2 | 0); v0 = s3 & 65535; if (c) { pc = 0x8002b780; continue; } }
  case 0x8002b74c:
     pc = 0x8002b790; continue;
  case 0x8002b754:
    s1 = 0 | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28021) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s0 & 0xff, 1);
    s3 = s1 | 0; pc = 0x8002b78c; continue;
  case 0x8002b770:
    at = 0x80080000 | 0;
    m.write(((at) + -28021) >>> 0, s0 & 0xff, 1);
    s1 = (0 + 1) | 0; pc = 0x8002b78c; continue;
  case 0x8002b780:
    at = 0x80080000 | 0;
    m.write(((at) + -28021) >>> 0, a0 & 0xff, 1);
    s1 = 0 | 0;
  case 0x8002b78c:
    v0 = s3 & 65535;
  case 0x8002b790:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002b7ac; continue; } }
  case 0x8002b798:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) !== (s0 | 0); s3 = 0 | 0; if (c) { pc = 0x8002b520; continue; } }
  case 0x8002b7ac:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a1 = 0x80070000 | 0;
    a1 = (a1 + -20788) | 0;
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80063a6c, a0, a1, a2, a3);
  case 0x8002b7c4:
    v0 = s1 | 0;
  case 0x8002b7c8:
    s6 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s5 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 40) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 36) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 32) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 56) | 0;
     return v0;
  default: throw new Error(`f8002b4e0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80033848, translated instruction by instruction (8 instructions).
export function* f80033848(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80033848;
  for (;;) switch (pc) {
  case 0x80033848:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    a0 = a0 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002b7f4, a0, a1, a2, a3);
  case 0x80033858:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f80033848: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002b7f4, translated instruction by instruction (171 instructions).
export function* f8002b7f4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002b7f4;
  for (;;) switch (pc) {
  case 0x8002b7f4:
    sp = (sp + -64) | 0;
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    s4 = a0 | 0;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    s3 = (0 + 3) | 0;
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    s2 = (0 + 2) | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = (0 + 4) | 0;
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    s0 = (0 + 1) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    v1 = 0x80070000 | 0;
    m.write(((sp) + 60) >>> 0, 0, 4);
    v0 = (v0 + 48) | 0;
    m.write(((v1) + -20769) >>> 0, v0 & 0xff, 1);
  case 0x8002b838:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002b848:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b85c:
    v0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v0 = v0 & 15;
    { const c = (v0 | 0) !== (s3 | 0);  if (c) { pc = 0x8002b878; continue; } }
  case 0x8002b870:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, s0 & 0xff, 1);
  case 0x8002b878:
    { const c = (v0 | 0) === (s2 | 0);  if (c) { pc = 0x8002b888; continue; } }
  case 0x8002b880:
    { const c = (v0 | 0) !== (s1 | 0);  if (c) { pc = 0x8002b8e8; continue; } }
  case 0x8002b888:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002b898:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 24) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b8ac:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a0 = a0 << 4; [v0, v1] = yield* call(ctx, sp, 0x80062798, a0, a1, a2, a3);
  case 0x8002b8bc:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 28) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b8d0:
    v1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v0 = m.read(((sp) + 28) >>> 0, 4) | 0;
    v1 = v1 & 15;
    v0 = v0 & 15;
    { const c = (v1 | 0) !== (v0 | 0);  if (c) { pc = 0x8002b888; continue; } }
  case 0x8002b8e8:
    v1 = m.read(((sp) + 24) >>> 0, 4) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28027) >>> 0, 1);
    { const c = (v0 | 0) === (s0 | 0); m.write(((sp) + 32) >>> 0, v1 >>> 0, 4); if (c) { pc = 0x8002ba24; continue; } }
  case 0x8002b900:
    v0 = v1 & 15;
    { const c = (v0 | 0) === (s2 | 0); a0 = (0 + 2) | 0; if (c) { pc = 0x8002ba5c; continue; } }
  case 0x8002b90c:
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x8002ba44; continue; } }
  case 0x8002b914:
    { const c = (v0 | 0) === (s1 | 0); a0 = (0 + 4) | 0; if (c) { pc = 0x8002ba5c; continue; } }
  case 0x8002b91c:
    { const c = (v0 | 0) === (s3 | 0); a1 = 0x80070000 | 0; if (c) { pc = 0x8002b838; continue; } }
  case 0x8002b924:
    a1 = (a1 + -20788) | 0;
    v0 = (0 + 7936) | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27965) >>> 0, 1);
    a3 = (0 + 512) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    a0 = a0 << 4;
    a2 = v0 << 5;
    a2 = (a2 - v0) | 0;
    a2 = a2 << 8;
    v0 = 0x800b0000 | 0;
    s0 = (v0 + -16752) | 0;
    a2 = (a2 + s0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80062fa0, a0, a1, a2, a3);
  case 0x8002b964:
    a0 = 0 | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -27356) | 0;
    a2 = (sp + 32) | 0; [v0, v1] = yield* call(ctx, sp, 0x80063748, a0, a1, a2, a3);
  case 0x8002b978:
    v1 = m.read(((sp) + 32) >>> 0, 4) | 0;
    v0 = (0 + 2) | 0;
    { const c = (v1 | 0) === (v0 | 0); a0 = v0 | 0; if (c) { pc = 0x8002ba5c; continue; } }
  case 0x8002b988:
    v0 = (0 + 4) | 0;
    { const c = (v1 | 0) === (v0 | 0); a0 = (0 + 4) | 0; if (c) { pc = 0x8002ba5c; continue; } }
  case 0x8002b994:
    v0 = (0 + 5) | 0;
    { const c = (v1 | 0) === (v0 | 0); a1 = 0x800a0000 | 0; if (c) { pc = 0x8002ba78; continue; } }
  case 0x8002b9a0:
    a1 = (a1 + -4424) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    a2 = (0 + 7288) | 0;
    a0 = v0 << 5;
    a0 = (a0 - v0) | 0;
    a0 = a0 << 8;
    a0 = (a0 + s0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002b9c4:
    a1 = 0x80090000 | 0;
    a1 = (a1 + -12864) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27966) >>> 0, 1);
    a2 = (0 + 100) | 0;
    a0 = v0 << 5;
    a0 = (a0 - v0) | 0;
    a0 = a0 << 8;
    v0 = (s0 + 7288) | 0;
    a0 = (a0 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8002b9f0:
     [v0, v1] = yield* call(ctx, sp, 0x8002c4f8, a0, a1, a2, a3);
  case 0x8002b9f8:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x8002ba70; continue; } }
  case 0x8002ba00:
    a0 = (0 + 4) | 0; [v0, v1] = yield* call(ctx, sp, 0x80015fa8, a0, a1, a2, a3);
  case 0x8002ba08:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27368) >>> 0, 1);
    { const c = (v0 | 0) !== 0; v0 = (0 + 1) | 0; if (c) { pc = 0x8002ba2c; continue; } }
  case 0x8002ba1c:
    at = 0x80080000 | 0;
    m.write(((at) + -28027) >>> 0, v0 & 0xff, 1);
  case 0x8002ba24:
    v0 = (0 + -1) | 0; pc = 0x8002ba7c; continue;
  case 0x8002ba2c:
     [v0, v1] = yield* call(ctx, sp, 0x800332b0, a0, a1, a2, a3);
  case 0x8002ba34:
     [v0, v1] = yield* call(ctx, sp, 0x8003360c, a0, a1, a2, a3);
  case 0x8002ba3c:
    v0 = 0 | 0; pc = 0x8002ba7c; continue;
  case 0x8002ba44:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80015fa8, a0, a1, a2, a3);
  case 0x8002ba4c:
     [v0, v1] = yield* call(ctx, sp, 0x8002bfe8, a0, a1, a2, a3);
  case 0x8002ba54:
    v0 = (0 + -1) | 0; pc = 0x8002ba7c; continue;
  case 0x8002ba5c:
     [v0, v1] = yield* call(ctx, sp, 0x80029b34, a0, a1, a2, a3);
  case 0x8002ba64:
    v0 = v0 << 24;
    v0 = v0 >> 24; pc = 0x8002ba7c; continue;
  case 0x8002ba70:
    a0 = s4 & 255; [v0, v1] = yield* call(ctx, sp, 0x80032974, a0, a1, a2, a3);
  case 0x8002ba78:
    v0 = 0 | 0;
  case 0x8002ba7c:
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 64) | 0;
     return v0;
  default: throw new Error(`f8002b7f4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003360c, translated instruction by instruction (15 instructions).
export function* f8003360c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003360c;
  for (;;) switch (pc) {
  case 0x8003360c:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = 0 | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
  case 0x8003361c:
    a0 = s0 & 255; [v0, v1] = yield* call(ctx, sp, 0x80033420, a0, a1, a2, a3);
  case 0x80033624:
    s0 = (s0 + 1) | 0;
    v0 = s0 & 255;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8003361c; continue; } }
  case 0x80033634:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f8003360c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002c4f8, translated instruction by instruction (14 instructions).
export function f8002c4f8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002c4f8;
  for (;;) switch (pc) {
  case 0x8002c4f8:
    v0 = 0x414d0000 | 0;
    v1 = 0x80090000 | 0;
    a0 = (v1 + -12864) | 0;
    v1 = m.read(((a0) + 92) >>> 0, 4) | 0;
    v0 = v0 | 16715;
    { const c = (v1 | 0) !== (v0 | 0); v0 = 0 | 0; if (c) { pc = 0x8002c528; continue; } }
  case 0x8002c514:
    a0 = m.read(((a0) + 96) >>> 0, 2);
    v1 = (0 + 21577) | 0;
    { const c = (a0 | 0) === (v1 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x8002c528; continue; } }
  case 0x8002c524:
    v0 = 0 | 0;
  case 0x8002c528:
     return v0;
  default: throw new Error(`f8002c4f8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80032974, translated instruction by instruction (30 instructions).
export function* f80032974(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80032974;
  for (;;) switch (pc) {
  case 0x80032974:
    sp = (sp + -32) | 0;
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    s1 = a0 | 0;
    a0 = (0 + 1) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = 0x800a0000 | 0;
    s0 = (s0 + -4424) | 0;
    m.write(((sp) + 24) >>> 0, 0, 4);
    a1 = s0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a744, a0, a1, a2, a3);
  case 0x8003299c:
    a0 = (0 + 2) | 0;
    a1 = (s0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a744, a0, a1, a2, a3);
  case 0x800329a8:
    a0 = (0 + 3) | 0;
    a1 = (s0 + 32) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a744, a0, a1, a2, a3);
  case 0x800329b4:
    a0 = (0 + 4) | 0;
    a1 = (s0 + 48) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a744, a0, a1, a2, a3);
  case 0x800329c0:
    a0 = (0 + 5) | 0;
    a1 = (s0 + 64) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a744, a0, a1, a2, a3);
  case 0x800329cc:
    at = 0x80080000 | 0;
    m.write(((at) + -27121) >>> 0, s1 & 0xff, 1);
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f80032974: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80021320, translated instruction by instruction (12 instructions).
export function* op3d(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80021320;
  for (;;) switch (pc) {
  case 0x80021320:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x800329ec, a0, a1, a2, a3);
  case 0x80021330:
    at = 0x80080000 | 0;
    m.write(((at) + -27995) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27992) >>> 0, 0 & 0xff, 1);
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`op3d: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800329ec, translated instruction by instruction (561 instructions).
export function* restoreBookmark(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800329ec;
  for (;;) switch (pc) {
  case 0x800329ec:
    sp = (sp + -80) | 0;
    v0 = 0x801f0000 | 0;
    a0 = m.read(((v0) + 29956) >>> 0, 4) | 0;
    a1 = (0 + 1) | 0;
    m.write(((sp) + 72) >>> 0, 0, 4);
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    { const c = (a0 | 0) === 0; m.write(((sp) + 40) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x80032a74; continue; } }
  case 0x80032a24:
    v1 = a0 | 0;
    v0 = 0x80090000 | 0;
    m.write(((v0) + -12886) >>> 0, a1 & 0xffff, 2);
    v0 = 0x80200000 | 0;
    { const c = (a0 | 0) > 0; m.write(((v0) + -8292) >>> 0, 0 >>> 0, 4); if (c) { pc = 0x80032a40; continue; } }
  case 0x80032a3c:
    v1 = (-v1) | 0;
  case 0x80032a40:
    [hi, lo] = div(0, v1, true);
    { const c = (a1 | 0) !== 0;  if (c) { pc = 0x80032a50; continue; } }
  case 0x80032a4c:
    throw new Error("break 7 at 0x80032a4c");
  case 0x80032a50:
    at = (0 + -1) | 0;
    { const c = (a1 | 0) !== (at | 0); at = 0x80000000 | 0; if (c) { pc = 0x80032a68; continue; } }
  case 0x80032a5c:
    { const c = (v1 | 0) !== (at | 0);  if (c) { pc = 0x80032a68; continue; } }
  case 0x80032a64:
    throw new Error("break 6 at 0x80032a64");
  case 0x80032a68:
    v1 = lo;
    v0 = 0x80200000 | 0;
    m.write(((v0) + -8076) >>> 0, v1 >>> 0, 4);
  case 0x80032a74:
     [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80032a7c:
    v0 = 0x801f0000 | 0;
    a1 = m.read(((v0) + 29960) >>> 0, 4) | 0;
    { const c = (a1 | 0) === 0; a0 = a1 | 0; if (c) { pc = 0x80032ab4; continue; } }
  case 0x80032a90:
    v0 = 0x80090000 | 0;
    v1 = (0 + 1) | 0;
    m.write(((v0) + -12884) >>> 0, v1 & 0xffff, 2);
    v0 = 0x80200000 | 0;
    { const c = (a1 | 0) > 0; m.write(((v0) + -8288) >>> 0, 0 >>> 0, 4); if (c) { pc = 0x80032aac; continue; } }
  case 0x80032aa8:
    a0 = (-a0) | 0;
  case 0x80032aac:
    v0 = 0x80200000 | 0;
    m.write(((v0) + -8072) >>> 0, a0 >>> 0, 4);
  case 0x80032ab4:
     [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80032abc:
    v0 = 0x801f0000 | 0;
    a1 = m.read(((v0) + 29964) >>> 0, 4) | 0;
    { const c = (a1 | 0) === 0; a0 = a1 | 0; if (c) { pc = 0x80032af4; continue; } }
  case 0x80032ad0:
    v0 = 0x80090000 | 0;
    v1 = (0 + 1) | 0;
    m.write(((v0) + -12882) >>> 0, v1 & 0xffff, 2);
    v0 = 0x80200000 | 0;
    { const c = (a1 | 0) > 0; m.write(((v0) + -8284) >>> 0, 0 >>> 0, 4); if (c) { pc = 0x80032aec; continue; } }
  case 0x80032ae8:
    a0 = (-a0) | 0;
  case 0x80032aec:
    v0 = 0x80200000 | 0;
    m.write(((v0) + -8068) >>> 0, a0 >>> 0, 4);
  case 0x80032af4:
     [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80032afc:
    v0 = 0x801f0000 | 0;
    a1 = m.read(((v0) + 29972) >>> 0, 4) | 0;
    { const c = (a1 | 0) === 0; a0 = a1 | 0; if (c) { pc = 0x80032b34; continue; } }
  case 0x80032b10:
    v0 = 0x80090000 | 0;
    v1 = (0 + 1) | 0;
    m.write(((v0) + -12878) >>> 0, v1 & 0xffff, 2);
    v0 = 0x80200000 | 0;
    { const c = (a1 | 0) > 0; m.write(((v0) + -8276) >>> 0, 0 >>> 0, 4); if (c) { pc = 0x80032b2c; continue; } }
  case 0x80032b28:
    a0 = (-a0) | 0;
  case 0x80032b2c:
    v0 = 0x80200000 | 0;
    m.write(((v0) + -8060) >>> 0, a0 >>> 0, 4);
  case 0x80032b34:
     [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80032b3c:
    v0 = 0x801f0000 | 0;
    a1 = m.read(((v0) + 29984) >>> 0, 4) | 0;
    { const c = (a1 | 0) === 0; a0 = a1 | 0; if (c) { pc = 0x80032b74; continue; } }
  case 0x80032b50:
    v0 = 0x80090000 | 0;
    v1 = (0 + 1) | 0;
    m.write(((v0) + -12872) >>> 0, v1 & 0xffff, 2);
    v0 = 0x80200000 | 0;
    { const c = (a1 | 0) > 0; m.write(((v0) + -8264) >>> 0, 0 >>> 0, 4); if (c) { pc = 0x80032b6c; continue; } }
  case 0x80032b68:
    a0 = (-a0) | 0;
  case 0x80032b6c:
    v0 = 0x80200000 | 0;
    m.write(((v0) + -8048) >>> 0, a0 >>> 0, 4);
  case 0x80032b74:
    s0 = 0x800a0000 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80032b7c:
    s0 = (s0 + -4344) | 0;
    a0 = s0 | 0;
    a1 = 0x80090000 | 0;
    a1 = (a1 + -9544) | 0;
    a2 = (0 + 256) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80032b94:
    a0 = (s0 + 768) | 0;
    a1 = 0x80200000 | 0;
    a1 = (a1 + -16040) | 0;
    a2 = (0 + 256) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80032ba8:
    a0 = (s0 + 1066) | 0;
    a1 = 0x801f0000 | 0;
    a1 = (a1 + 23488) | 0;
    a2 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044b60, a0, a1, a2, a3);
  case 0x80032bbc:
    a0 = (s0 + 1141) | 0;
    a1 = 0x801f0000 | 0;
    a1 = (a1 + 23864) | 0;
    a2 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044b60, a0, a1, a2, a3);
  case 0x80032bd0:
    a0 = (s0 + 1216) | 0;
    a1 = 0x80200000 | 0;
    a1 = (a1 + -22736) | 0;
    a2 = (0 + 512) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044b60, a0, a1, a2, a3);
  case 0x80032be4:
    a0 = (s0 + 1344) | 0;
    a1 = 0x80200000 | 0;
    a1 = (a1 + -15784) | 0;
    a2 = (0 + 512) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044b60, a0, a1, a2, a3);
  case 0x80032bf8:
    a0 = (s0 + 1772) | 0;
    a1 = 0x801d0000 | 0;
    a1 = (a1 + 25896) | 0;
    a2 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80032c0c:
    a0 = (s0 + 1472) | 0;
    a1 = 0x801d0000 | 0;
    a1 = (a1 + 24848) | 0;
    a2 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80032c20:
    a0 = (s0 + 2072) | 0;
    a1 = 0x801f0000 | 0;
    a1 = (a1 + 24216) | 0;
    a2 = (0 + 2048) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80032c34:
    a0 = (s0 + 4120) | 0;
    a1 = 0x801d0000 | 0;
    a1 = (a1 + 26576) | 0;
    a2 = (0 + 1024) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80032c48:
    a0 = (s0 + 5144) | 0;
    a1 = 0x80200000 | 0;
    a1 = (a1 + -10352) | 0;
    a2 = (0 + 2048) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80032c5c:
    a3 = (s0 + 1024) | 0;
    s1 = 0 | 0;
    v0 = 0x801f0000 | 0;
    t0 = (v0 + 29872) | 0;
    t2 = (t0 + 7) | 0;
    s0 = (s0 + -80) | 0;
    v0 = m.read(((s0) + 7272) >>> 0, 2);
    v1 = m.read(((s0) + 7274) >>> 0, 1);
    a0 = m.read(((s0) + 7286) >>> 0, 2);
    a1 = m.read(((s0) + 7282) >>> 0, 2);
    a2 = m.read(((s0) + 7284) >>> 0, 1);
    t1 = t0 | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27980) >>> 0, v0 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27200) >>> 0, v0 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27999) >>> 0, v1 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27136) >>> 0, v1 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27972) >>> 0, a0 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27978) >>> 0, a1 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27976) >>> 0, a2 & 0xff, 1);
  case 0x80032cc4:
    v0 = m.read(((a3) + 0) >>> 0, 1);
    a0 = s1 << 3;
    v0 = (v0 >>> 7) | 0;
    m.write(((t1) + 0) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a3) + 0) >>> 0, 1);
    v1 = (t0 + a0) | 0;
    v0 = (v0 >>> 6) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 1) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a3) + 0) >>> 0, 1);
    v0 = (v0 >>> 5) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 2) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a3) + 0) >>> 0, 1);
    v0 = (v0 >>> 4) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 3) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a3) + 0) >>> 0, 1);
    s1 = (s1 + 1) | 0;
    v0 = (v0 >>> 3) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 4) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a3) + 0) >>> 0, 1);
    a0 = v1 | 0;
    v0 = (v0 >>> 2) | 0;
    v0 = v0 & 1;
    m.write(((v1) + 5) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a3) + 0) >>> 0, 1);
    t1 = (t1 + 8) | 0;
    v0 = (v0 >>> 1) | 0;
    v0 = v0 & 1;
    m.write(((a0) + 6) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((a3) + 0) >>> 0, 1);
    a3 = (a3 + 1) | 0;
    v0 = v0 & 1;
    m.write(((t2) + 0) >>> 0, v0 & 0xff, 1);
    v0 = (s1 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) !== 0; t2 = (t2 + 8) | 0; if (c) { pc = 0x80032cc4; continue; } }
  case 0x80032d68:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27121) >>> 0, 1);
    v0 = v1 << 1;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 3;
    v0 = (v0 + v1) | 0;
    v0 = v0 << 2;
    v1 = 0x80090000 | 0;
    v1 = (v1 + -12864) | 0;
    s3 = (v0 + v1) | 0;
    v1 = m.read(((s3) + 32) >>> 0, 2);
    v0 = (0 + 31) | 0;
    { const c = (v1 | 0) !== (v0 | 0); s1 = 0 | 0; if (c) { pc = 0x80032dec; continue; } }
  case 0x80032da4:
    a0 = (0 + 27) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001bda4, a0, a1, a2, a3);
  case 0x80032dac:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27508) >>> 0, 4) | 0;
    a0 = m.read(((v0) + 0) >>> 0, 2);
    v1 = (0 + 27) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28004) >>> 0, v1 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27560) >>> 0, v1 & 0xffff, 2);
    v0 = (v0 + a0) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27272) >>> 0, v0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27636) >>> 0, v0 >>> 0, 4);
    s1 = 0 | 0; pc = 0x80032e2c; continue;
  case 0x80032dec:
    v0 = m.read(((s3) + 68) >>> 0, 4) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27508) >>> 0, 4) | 0;
    a0 = m.read(((s3) + 32) >>> 0, 2);
    v0 = (v0 + v1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27272) >>> 0, v0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27636) >>> 0, v0 >>> 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x8001bda4, a0, a1, a2, a3);
  case 0x80032e18:
    v0 = m.read(((s3) + 32) >>> 0, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -28004) >>> 0, v0 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27560) >>> 0, v0 & 0xffff, 2);
  case 0x80032e2c:
    v1 = 0x10000 | 0;
    v0 = m.read(((s3) + 34) >>> 0, 2);
    v1 = v1 | 11263;
    at = 0x80080000 | 0;
    m.write(((at) + -27628) >>> 0, v0 & 0xffff, 2);
  case 0x80032e40:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27584) >>> 0, 4) | 0;
    v0 = (v0 + s1) | 0;
    s1 = (s1 + 1) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    v0 = (v1 >>> 0) < (s1 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = (0 + 24) | 0; if (c) { pc = 0x80032e40; continue; } }
  case 0x80032e64:
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27584) >>> 0, 4) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x80032e74:
    v1 = (m.read(((s3) + 30) >>> 0, 2) << 16) >> 16;
    v0 = (0 + -1) | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = 0x80070000 | 0; if (c) { pc = 0x80032eb4; continue; } }
  case 0x80032e84:
    v0 = (v0 + -22586) | 0;
    v1 = v1 << 2;
    v1 = (v1 + v0) | 0;
    v0 = (m.read(((v1) + 0) >>> 0, 2) << 16) >> 16;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80032eb4; continue; } }
  case 0x80032ea0:
    a0 = m.read(((s3) + 30) >>> 0, 2);
    a1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800292b0, a0, a1, a2, a3);
  case 0x80032eac:
    s1 = 0 | 0; pc = 0x80032ec0; continue;
  case 0x80032eb4:
    a0 = (0 + 60) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028334, a0, a1, a2, a3);
  case 0x80032ebc:
    s1 = 0 | 0;
  case 0x80032ec0:
    v0 = 0x801f0000 | 0;
    s7 = (v0 + 29952) | 0;
    v0 = 0x80090000 | 0;
    s6 = (v0 + -12888) | 0;
    v0 = 0x80200000 | 0;
    s5 = (v0 + -8296) | 0;
    v0 = 0x80200000 | 0;
    s4 = (v0 + -8080) | 0;
    s2 = s3 | 0;
    s0 = s1 | 0;
  case 0x80032ee8:
    v1 = (m.read(((s2) + 2) >>> 0, 2) << 16) >> 16;
    v0 = (0 + -1) | 0;
    { const c = (v1 | 0) === (v0 | 0); a3 = (s1 + 1) | 0; if (c) { pc = 0x80032f98; continue; } }
  case 0x80032ef8:
    v1 = a3 & 255;
    a0 = v1 << 2;
    a1 = (a0 + s7) | 0;
    v0 = m.read(((a1) + 0) >>> 0, 4) | 0;
    { const c = (v0 | 0) === 0; a2 = (0 + 1) | 0; if (c) { pc = 0x80032f64; continue; } }
  case 0x80032f14:
    v0 = v1 << 1;
    v0 = (v0 + s6) | 0;
    m.write(((v0) + 0) >>> 0, a2 & 0xffff, 2);
    v0 = (a0 + s5) | 0;
    m.write(((v0) + 0) >>> 0, 0 >>> 0, 4);
    v0 = m.read(((a1) + 0) >>> 0, 4) | 0;
    { const c = (v0 | 0) === 0; a0 = 0 | 0; if (c) { pc = 0x80032f50; continue; } }
  case 0x80032f38:
    v1 = v0 | 0;
    v0 = (a0 | 0) < (v1 | 0) ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = a3 & 255; if (c) { pc = 0x80032f58; continue; } }
  case 0x80032f48:
    v1 = (-v1) | 0; pc = 0x80032f58; continue;
  case 0x80032f50:
    v1 = 0 | 0;
    v0 = a3 & 255;
  case 0x80032f58:
    v0 = v0 << 2;
    v0 = (v0 + s4) | 0;
    m.write(((v0) + 0) >>> 0, v1 >>> 0, 4);
  case 0x80032f64:
     [v0, v1] = yield* call(ctx, sp, 0x8002c5a0, a0, a1, a2, a3);
  case 0x80032f6c:
    a0 = m.read(((s2) + 2) >>> 0, 2);
    a1 = s1 & 255; [v0, v1] = yield* call(ctx, sp, 0x8001cde4, a0, a1, a2, a3);
  case 0x80032f78:
    v0 = 0x801f0000 | 0;
    v0 = (v0 + 29472) | 0;
    v1 = 0x80200000 | 0;
    v1 = (v1 + -5016) | 0;
    v1 = (s0 + v1) | 0;
    v1 = m.read(((v1) + 0) >>> 0, 2);
    v0 = (s0 + v0) | 0;
    m.write(((v0) + 0) >>> 0, v1 & 0xffff, 2);
  case 0x80032f98:
    s2 = (s2 + 2) | 0;
    s1 = (s1 + 1) | 0;
    v0 = (s1 >>> 0) < 4 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = (s0 + 2) | 0; if (c) { pc = 0x80032ee8; continue; } }
  case 0x80032fac:
    v0 = 0x800a0000 | 0;
    v0 = (v0 + -4424) | 0;
    v1 = m.read(((v0) + 7275) >>> 0, 1);
    a0 = m.read(((v0) + 7276) >>> 0, 1);
    a1 = m.read(((v0) + 7277) >>> 0, 1);
    a2 = m.read(((v0) + 7278) >>> 0, 1);
    a3 = m.read(((v0) + 7279) >>> 0, 1);
    v0 = m.read(((v0) + 7280) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27164) >>> 0, v1 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27163) >>> 0, a0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27162) >>> 0, a1 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27124) >>> 0, a2 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27123) >>> 0, a3 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27122) >>> 0, v0 & 0xff, 1);
    s1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8001f690, a0, a1, a2, a3);
  case 0x80033004:
    v0 = m.read(((s3) + 66) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27974) >>> 0, v0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27975) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((s3) + 38) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27983) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((s3) + 36) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28006) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((s3) + 0) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28007) >>> 0, v0 & 0xff, 1);
    v0 = 0x801f0000 | 0;
    a1 = (v0 + 29440) | 0;
    v1 = m.read(((s3) + 91) >>> 0, 1);
    v0 = 0x80200000 | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27967) >>> 0, v1 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27968) >>> 0, v1 & 0xff, 1);
    v1 = m.read(((s3) + 64) >>> 0, 1);
    a0 = (v0 + -8104) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27970) >>> 0, v1 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27969) >>> 0, v1 & 0xff, 1);
    v0 = m.read(((s3) + 65) >>> 0, 1);
    v1 = s3 | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27982) >>> 0, v0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27981) >>> 0, v0 & 0xff, 1);
  case 0x8003308c:
    v0 = m.read(((v1) + 40) >>> 0, 2);
    m.write(((a0) + 0) >>> 0, v0 & 0xffff, 2);
    m.write(((a1) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((v1) + 42) >>> 0, 1);
    m.write(((a0) + 2) >>> 0, v0 & 0xff, 1);
    m.write(((a1) + 2) >>> 0, v0 & 0xff, 1);
    v0 = m.read(((v1) + 44) >>> 0, 2);
    s1 = (s1 + 1) | 0;
    m.write(((a0) + 4) >>> 0, v0 & 0xffff, 2);
    m.write(((a1) + 4) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((v1) + 46) >>> 0, 2);
    v1 = (v1 + 8) | 0;
    m.write(((a0) + 6) >>> 0, v0 & 0xffff, 2);
    m.write(((a1) + 6) >>> 0, v0 & 0xffff, 2);
    a1 = (a1 + 8) | 0;
    v0 = (s1 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (a0 + 8) | 0; if (c) { pc = 0x8003308c; continue; } }
  case 0x800330dc:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x800330e4:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001fd1c, a0, a1, a2, a3);
  case 0x800330ec:
    s1 = 0 | 0;
    s2 = (0 + -1) | 0;
    s0 = s3 | 0;
  case 0x800330f8:
    a0 = (m.read(((s0) + 10) >>> 0, 2) << 16) >> 16;
    { const c = (a0 | 0) === (s2 | 0);  if (c) { pc = 0x80033110; continue; } }
  case 0x80033108:
     [v0, v1] = yield* call(ctx, sp, 0x8001fb38, a0, a1, a2, a3);
  case 0x80033110:
    s1 = (s1 + 1) | 0;
    v0 = (s1 >>> 0) < 4 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = (s0 + 2) | 0; if (c) { pc = 0x800330f8; continue; } }
  case 0x80033120:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x80033128:
    v0 = m.read(((s3) + 37) >>> 0, 1);
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80033140; continue; } }
  case 0x80033138:
    a0 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x80033140:
    v0 = m.read(((s3) + 90) >>> 0, 1);
    { const c = (v0 | 0) === 0; s1 = 0 | 0; if (c) { pc = 0x8003315c; continue; } }
  case 0x80033150:
    a0 = v0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x80033158:
    s1 = 0 | 0;
  case 0x8003315c:
    v0 = 0x80070000 | 0;
    s2 = (v0 + -20403) | 0;
    s0 = s3 | 0;
  case 0x80033168:
    a0 = (m.read(((s0) + 72) >>> 0, 2) << 16) >> 16;
    v1 = (0 + 1) | 0;
    v0 = a0 << 1;
    v0 = (v0 + s2) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 1);
    a1 = m.read(((s0) + 72) >>> 0, 2);
    { const c = (v0 | 0) !== (v1 | 0); v0 = (0 + -1) | 0; if (c) { pc = 0x800331b8; continue; } }
  case 0x80033188:
    { const c = (a0 | 0) === (v0 | 0); v0 = (s3 + s1) | 0; if (c) { pc = 0x800331b8; continue; } }
  case 0x80033190:
    a1 = (a1 + 1000) | 0;
    a1 = a1 << 16;
    a0 = m.read(((v0) + 84) >>> 0, 1);
    a1 = a1 >> 16; [v0, v1] = yield* call(ctx, sp, 0x80026534, a0, a1, a2, a3);
  case 0x800331a4:
    a0 = m.read(((s0) + 72) >>> 0, 2);
    a1 = 0 | 0;
    a0 = (a0 + 1000) | 0;
    a0 = a0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x800292b0, a0, a1, a2, a3);
  case 0x800331b8:
    s1 = (s1 + 1) | 0;
    v0 = (s1 >>> 0) < 6 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = (s0 + 2) | 0; if (c) { pc = 0x80033168; continue; } }
  case 0x800331c8:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x800331d0:
    s1 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003d8dc, a0, a1, a2, a3);
  case 0x800331d8:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x800331e0:
    s2 = (0 + -1) | 0;
    s0 = s3 | 0;
  case 0x800331e8:
    v0 = (m.read(((s0) + 2) >>> 0, 2) << 16) >> 16;
    { const c = (v0 | 0) === (s2 | 0); a0 = (0 + 10) | 0; if (c) { pc = 0x80033204; continue; } }
  case 0x800331f8:
    a1 = (s1 + 1) | 0;
    a1 = a1 & 255; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80033204:
    s1 = (s1 + 1) | 0;
    v0 = (s1 >>> 0) < 4 ? 1 : 0;
    { const c = (v0 | 0) !== 0; s0 = (s0 + 2) | 0; if (c) { pc = 0x800331e8; continue; } }
  case 0x80033214:
    a0 = (0 + 24) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27584) >>> 0, 4) | 0;
    a2 = 0 | 0;
    s1 = a2 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x8003322c:
     [v0, v1] = yield* call(ctx, sp, 0x8001c21c, a0, a1, a2, a3);
  case 0x80033234:
    a0 = (0 + 10) | 0;
    a1 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80033240:
     [v0, v1] = yield* call(ctx, sp, 0x8003a91c, a0, a1, a2, a3);
  case 0x80033248:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x80033250:
    v0 = 0x80080000 | 0;
    a0 = (v0 + -27314) | 0;
  case 0x80033258:
    v0 = (s1 + a0) | 0;
    v1 = (s3 + s1) | 0;
    v1 = m.read(((v1) + 0) >>> 0, 1);
    s1 = (s1 + 1) | 0;
    { const c = (s1 | 0) === 0; m.write(((v0) + 0) >>> 0, v1 & 0xff, 1); if (c) { pc = 0x80033258; continue; } }
  case 0x80033270:
     [v0, v1] = yield* call(ctx, sp, 0x8003276c, a0, a1, a2, a3);
  case 0x80033278:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x80033280:
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
  default: throw new Error(`restoreBookmark: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001f328, translated instruction by instruction (23 instructions).
export function* op1f(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001f328;
  for (;;) switch (pc) {
  case 0x8001f328:
    sp = (sp + -24) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28011) >>> 0, 1);
    v1 = (0 + 1) | 0;
    { const c = (v0 | 0) !== (v1 | 0); m.write(((sp) + 16) >>> 0, 0, 4); if (c) { pc = 0x8001f34c; continue; } }
  case 0x8001f340:
    m.write(((0x8007913c) + 348) >>> 0, v1 & 0xff, 1);
     pc = 0x8001f374; continue;
  case 0x8001f34c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28000) >>> 0, 1);
    { const c = (v0 | 0) !== (v1 | 0);  if (c) { pc = 0x8001f36c; continue; } }
  case 0x8001f360:
    m.write(((0x8007913c) + 348) >>> 0, v0 & 0xff, 1);
     pc = 0x8001f374; continue;
  case 0x8001f36c:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80033848, a0, a1, a2, a3);
  case 0x8001f374:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`op1f: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002188c, translated instruction by instruction (429 instructions).
export function* op44(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002188c;
  for (;;) switch (pc) {
  case 0x8002188c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27272) >>> 0, 4) | 0;
    sp = (sp + -40) | 0;
    m.write(((sp) + 32) >>> 0, 0, 4);
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27636) >>> 0, v0 >>> 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x80019544, a0, a1, a2, a3);
  case 0x800218bc:
    v1 = 0 | 0;
    a0 = 0x10000 | 0;
    a0 = a0 | 11263;
  case 0x800218c8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27584) >>> 0, 4) | 0;
    v0 = (v0 + v1) | 0;
    v1 = (v1 + 1) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    v0 = (a0 >>> 0) < (v1 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x800218c8; continue; } }
  case 0x800218ec:
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27976) >>> 0, 1);
    v0 = (v1 >>> 0) < 10 ? 1 : 0;
    { const c = (v0 | 0) === 0; v0 = (v1 + 1) | 0; if (c) { pc = 0x8002190c; continue; } }
  case 0x80021904:
    at = 0x80080000 | 0;
    m.write(((at) + -27976) >>> 0, v0 & 0xff, 1);
  case 0x8002190c:
    v0 = 0x801f0000 | 0;
    s3 = (v0 + 29872) | 0;
    s1 = (0 + 1) | 0;
    v1 = 0x801f0000 | 0;
    v0 = 0x801f0000 | 0;
    a0 = m.read(((v0) + 26282) >>> 0, 2);
    v1 = (v1 + -4248) | 0;
    v0 = a0 << 3;
    v0 = (v0 + a0) | 0;
    v0 = v0 << 3;
    v0 = (v0 + v1) | 0;
    m.write(((v0) + 58) >>> 0, 0 & 0xff, 1);
    a0 = (0 + 82) | 0;
  case 0x80021940:
    a1 = (0 + 28) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4344) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021954:
    a0 = (0 + 31) | 0;
    a1 = (0 + 47) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4368) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002196c:
    a0 = (0 + 16) | 0;
    a1 = (0 + 66) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4408) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021984:
    a0 = (0 + 75) | 0;
    a1 = (0 + 85) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4452) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002199c:
    a0 = (0 + 38) | 0;
    a1 = (0 + 104) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4480) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800219b4:
    a0 = 0x80010000 | 0;
    a0 = (a0 + 4516) | 0;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 4528) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800216a8, a0, a1, a2, a3);
  case 0x800219cc:
    v1 = m.read(((s3) + 51) >>> 0, 1);
    { const c = (v1 | 0) !== 0; s0 = v0 | 0; if (c) { pc = 0x80021a48; continue; } }
  case 0x800219dc:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27976) >>> 0, 1);
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; a0 = (0 + 74) | 0; if (c) { pc = 0x80021a48; continue; } }
  case 0x800219f4:
    a1 = (0 + 47) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4544) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021a08:
    a0 = (0 + 63) | 0;
    a1 = (0 + 66) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4568) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021a20:
    a0 = 0x80080000 | 0;
    a0 = (a0 + -28288) | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -28280) | 0;
    a2 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800216a8, a0, a1, a2, a3);
  case 0x80021a38:
    v0 = v0 & 255;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80021a48; continue; } }
  case 0x80021a44:
    m.write(((s3) + 51) >>> 0, s1 & 0xff, 1);
  case 0x80021a48:
    s0 = s0 & 255;
    { const c = (s0 | 0) !== (s1 | 0); a0 = (0 + 95) | 0; if (c) { pc = 0x80021ac4; continue; } }
  case 0x80021a54:
    a1 = (0 + 47) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4596) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021a68:
    a0 = (0 + 43) | 0;
    a1 = (0 + 66) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4616) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021a80:
    a0 = (0 + 104) | 0;
    a1 = (0 + 85) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4652) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021a98:
    a0 = 0x80080000 | 0;
    a0 = (a0 + -28288) | 0;
    a1 = 0x80080000 | 0;
    a1 = (a1 + -28280) | 0;
    a2 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x800216a8, a0, a1, a2, a3);
  case 0x80021ab0:
    v0 = v0 & 255;
    { const c = (v0 | 0) !== 0; a0 = (0 + 82) | 0; if (c) { pc = 0x80021940; continue; } }
  case 0x80021abc:
    at = 0x80080000 | 0;
    m.write(((at) + -28022) >>> 0, s1 & 0xff, 1);
  case 0x80021ac4:
    a0 = 0x80200000 | 0;
    a0 = (a0 + -15784) | 0;
    a1 = 0x80200000 | 0;
    a1 = (a1 + -22736) | 0;
    a2 = (0 + 512) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80021adc:
    a0 = 0x801f0000 | 0;
    a0 = (a0 + 23864) | 0;
    a1 = 0x801f0000 | 0;
    a1 = (a1 + 23488) | 0;
    a2 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80021af4:
    a0 = 0x801d0000 | 0;
    a0 = (a0 + 25896) | 0;
    a1 = 0x801d0000 | 0;
    a1 = (a1 + 24848) | 0;
    a2 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80021b0c:
    { const c = (s0 | 0) !== 0;  if (c) { pc = 0x80021c90; continue; } }
  case 0x80021b14:
    a0 = (0 + 102) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044384, a0, a1, a2, a3);
  case 0x80021b1c:
    a0 = (0 + 103) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044384, a0, a1, a2, a3);
  case 0x80021b24:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28004) >>> 0, 2);
    v1 = (0 + 39) | 0;
    { const c = (v0 | 0) === (v1 | 0); s2 = (0 + 39) | 0; if (c) { pc = 0x80021ba8; continue; } }
  case 0x80021b38:
    v0 = m.read(((0x8007913c) + 2) >>> 0, 1);
    s0 = 0x80080000 | 0;
    s0 = m.read(((s0) + -27508) >>> 0, 4) | 0;
    { const c = (v0 | 0) !== (s1 | 0);  if (c) { pc = 0x80021b80; continue; } }
  case 0x80021b4c:
    v0 = (m.read(((0x8007913c) + 1116) >>> 0, 1) << 24) >> 24;
    { const c = (v0 | 0) !== (v1 | 0); v0 = 0x20000 | 0; if (c) { pc = 0x80021b80; continue; } }
  case 0x80021b5c:
    v0 = v0 | 32768;
    a1 = s0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27324) >>> 0, 4) | 0;
    a2 = 0 | 45056;
    a0 = (a0 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80021b78:
     pc = 0x80021ba0; continue;
  case 0x80021b80:
    m.write(((0x8007913c) + 4) >>> 0, s1 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003cf28, a0, a1, a2, a3);
  case 0x80021b8c:
    a0 = (0 + 2) | 0;
    a1 = s0 | 0;
    a2 = (0 + 39) | 0; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x80021b9c:
    m.write(((0x8007913c) + 4) >>> 0, 0 & 0xff, 1);
  case 0x80021ba0:
    at = 0x80080000 | 0;
    m.write(((at) + -28004) >>> 0, s2 & 0xffff, 2);
  case 0x80021ba8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27508) >>> 0, 4) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -28004) >>> 0, 2);
    a0 = m.read(((v0) + 0) >>> 0, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27560) >>> 0, v1 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27628) >>> 0, 0 & 0xffff, 2);
    v0 = (v0 + a0) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27272) >>> 0, v0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27636) >>> 0, v0 >>> 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x800325b0, a0, a1, a2, a3);
  case 0x80021be8:
     [v0, v1] = yield* call(ctx, sp, 0x800325b0, a0, a1, a2, a3);
  case 0x80021bf0:
    v0 = 0x801f0000 | 0;
    s0 = (v0 + 26264) | 0;
    a0 = m.read(((s0) + 2) >>> 0, 2);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80021c20; continue; } }
  case 0x80021c08:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80021c10:
    v1 = 0x80200000 | 0;
    v0 = (0 + -1) | 0;
    m.write(((s0) + 2) >>> 0, 0 & 0xffff, 2);
    m.write(((v1) + -5016) >>> 0, v0 & 0xffff, 2);
  case 0x80021c20:
    a0 = m.read(((s0) + 4) >>> 0, 2);
    m.write(((0x8007913c) + 348) >>> 0, s1 & 0xff, 1);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80021c48; continue; } }
  case 0x80021c30:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80021c38:
    v1 = 0x80200000 | 0;
    v0 = (0 + -1) | 0;
    m.write(((s0) + 4) >>> 0, 0 & 0xffff, 2);
    m.write(((v1) + -5014) >>> 0, v0 & 0xffff, 2);
  case 0x80021c48:
    a0 = m.read(((s0) + 6) >>> 0, 2);
    m.write(((0x8007913c) + 348) >>> 0, s1 & 0xff, 1);
    { const c = (a0 | 0) === 0; a0 = a0 << 16; if (c) { pc = 0x80021c74; continue; } }
  case 0x80021c58:
    a0 = a0 >> 16; [v0, v1] = yield* call(ctx, sp, 0x8003bc3c, a0, a1, a2, a3);
  case 0x80021c60:
    v1 = 0x80200000 | 0;
    v0 = (0 + -1) | 0;
    m.write(((s0) + 6) >>> 0, 0 & 0xffff, 2);
    m.write(((v1) + -5012) >>> 0, v0 & 0xffff, 2);
    m.write(((0x8007913c) + 348) >>> 0, s1 & 0xff, 1);
  case 0x80021c74:
    a0 = (0 + 1) | 0;
    a1 = a0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x80021c80:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80021c88:
     [v0, v1] = yield* call(ctx, sp, 0x8001824c, a0, a1, a2, a3);
  case 0x80021c90:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28022) >>> 0, 1);
    { const c = (v0 | 0) !== (s1 | 0); a0 = (0 + 82) | 0; if (c) { pc = 0x80021940; continue; } }
  case 0x80021ca4:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27972) >>> 0, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27301) >>> 0, 0 & 0xff, 1);
    v0 = (v0 + -61) | 0;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) === 0; a1 = (0 + 47) | 0; if (c) { pc = 0x80021d1c; continue; } }
  case 0x80021cc4:
    a0 = (0 + 40) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4672) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021cd8:
    a0 = (0 + 77) | 0;
    a1 = (0 + 66) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4708) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021cf0:
    a0 = (0 + 16) | 0;
    a1 = (0 + 85) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4732) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021d08:
    a0 = (0 + 100) | 0;
    a1 = (0 + 104) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4776) | 0; pc = 0x80021d58; continue;
  case 0x80021d1c:
    a0 = (0 + 18) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4804) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021d30:
    a0 = (0 + 33) | 0;
    a1 = (0 + 66) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4844) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021d48:
    a0 = (0 + 14) | 0;
    a1 = (0 + 85) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4880) | 0;
  case 0x80021d58:
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80021d60:
    a0 = 0x80080000 | 0;
    a0 = (a0 + -28272) | 0;
    a1 = 0x80010000 | 0;
    a1 = (a1 + 4792) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800216a8, a0, a1, a2, a3);
  case 0x80021d78:
    s0 = v0 | 0;
    a0 = (0 + 10) | 0; [v0, v1] = yield* call(ctx, sp, 0x800140a8, a0, a1, a2, a3);
  case 0x80021d84:
    s0 = s0 & 255;
    v0 = (0 + 1) | 0;
    { const c = (s0 | 0) !== (v0 | 0);  if (c) { pc = 0x80021e64; continue; } }
  case 0x80021d94:
     [v0, v1] = yield* call(ctx, sp, 0x80037250, a0, a1, a2, a3);
  case 0x80021d9c:
     [v0, v1] = yield* call(ctx, sp, 0x8003ab98, a0, a1, a2, a3);
  case 0x80021da4:
     [v0, v1] = yield* call(ctx, sp, 0x8003b7ec, a0, a1, a2, a3);
  case 0x80021dac:
     [v0, v1] = yield* call(ctx, sp, 0x80037c1c, a0, a1, a2, a3);
  case 0x80021db4:
     [v0, v1] = yield* call(ctx, sp, 0x8001c5bc, a0, a1, a2, a3);
  case 0x80021dbc:
     [v0, v1] = yield* call(ctx, sp, 0x800340d4, a0, a1, a2, a3);
  case 0x80021dc4:
     [v0, v1] = yield* call(ctx, sp, 0x80028ccc, a0, a1, a2, a3);
  case 0x80021dcc:
    at = 0x80080000 | 0;
    m.write(((at) + -28064) >>> 0, 0 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -28040) >>> 0, s0 >>> 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x800332b0, a0, a1, a2, a3);
  case 0x80021de4:
     [v0, v1] = yield* call(ctx, sp, 0x8003360c, a0, a1, a2, a3);
  case 0x80021dec:
    a0 = 0x801f0000 | 0;
    a0 = (a0 + 23488) | 0;
    a1 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044bc0, a0, a1, a2, a3);
  case 0x80021dfc:
    a0 = 0x801f0000 | 0;
    a0 = (a0 + 23864) | 0;
    a1 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044bc0, a0, a1, a2, a3);
  case 0x80021e0c:
    a0 = 0x80200000 | 0;
    a0 = (a0 + -22736) | 0;
    a1 = (0 + 512) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044bc0, a0, a1, a2, a3);
  case 0x80021e1c:
    a0 = 0x80200000 | 0;
    a0 = (a0 + -15784) | 0;
    a1 = (0 + 512) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044bc0, a0, a1, a2, a3);
  case 0x80021e2c:
    a0 = 0x801d0000 | 0;
    a0 = (a0 + 24848) | 0;
    a1 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044bc0, a0, a1, a2, a3);
  case 0x80021e3c:
    a0 = 0x801d0000 | 0;
    a0 = (a0 + 25896) | 0;
    a1 = (0 + 300) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044bc0, a0, a1, a2, a3);
  case 0x80021e4c:
    at = 0x80080000 | 0;
    m.write(((at) + -27972) >>> 0, 0 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27301) >>> 0, s0 & 0xff, 1);
     pc = 0x80021e6c; continue;
  case 0x80021e64:
     [v0, v1] = yield* call(ctx, sp, 0x80019544, a0, a1, a2, a3);
  case 0x80021e6c:
     [v0, v1] = yield* call(ctx, sp, 0x8003cee0, a0, a1, a2, a3);
  case 0x80021e74:
     [v0, v1] = yield* call(ctx, sp, 0x80037e94, a0, a1, a2, a3);
  case 0x80021e7c:
     [v0, v1] = yield* call(ctx, sp, 0x80037c1c, a0, a1, a2, a3);
  case 0x80021e84:
     [v0, v1] = yield* call(ctx, sp, 0x80028ccc, a0, a1, a2, a3);
  case 0x80021e8c:
     [v0, v1] = yield* call(ctx, sp, 0x8003a91c, a0, a1, a2, a3);
  case 0x80021e94:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80021e9c:
    a0 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80021ea4:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001db2c, a0, a1, a2, a3);
  case 0x80021eac:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8001fd1c, a0, a1, a2, a3);
  case 0x80021eb4:
     [v0, v1] = yield* call(ctx, sp, 0x80028ccc, a0, a1, a2, a3);
  case 0x80021ebc:
    v1 = 0 | 0;
    a0 = 0x10000 | 0;
    a0 = a0 | 11263;
  case 0x80021ec8:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27584) >>> 0, 4) | 0;
    v0 = (v0 + v1) | 0;
    v1 = (v1 + 1) | 0;
    m.write(((v0) + 0) >>> 0, 0 & 0xff, 1);
    v0 = (a0 >>> 0) < (v1 >>> 0) ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80021ec8; continue; } }
  case 0x80021eec:
    a0 = (0 + 24) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27584) >>> 0, 4) | 0;
    a2 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cbb8, a0, a1, a2, a3);
  case 0x80021f00:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800418d0, a0, a1, a2, a3);
  case 0x80021f08:
    at = 0x80080000 | 0;
    m.write(((at) + -27628) >>> 0, 0 & 0xffff, 2);
     [v0, v1] = yield* call(ctx, sp, 0x8003a91c, a0, a1, a2, a3);
  case 0x80021f18:
    at = 0x80080000 | 0;
    m.write(((at) + -27992) >>> 0, 0 & 0xff, 1);
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return v0;
  default: throw new Error(`op44: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001bda4, translated instruction by instruction (57 instructions).
export function* f8001bda4(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001bda4;
  for (;;) switch (pc) {
  case 0x8001bda4:
    sp = (sp + -32) | 0;
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    s2 = a0 | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28004) >>> 0, 2);
    a0 = s2 & 65535;
    m.write(((sp) + 28) >>> 0, 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    { const c = (v0 | 0) === (a0 | 0); m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x8001be6c; continue; } }
  case 0x8001bdcc:
    v1 = (0 + 1) | 0;
    v0 = m.read(((0x8007913c) + 2) >>> 0, 1);
    s0 = 0x80080000 | 0;
    s0 = m.read(((s0) + -27508) >>> 0, 4) | 0;
    { const c = (v0 | 0) !== (v1 | 0); s1 = s2 & 65535; if (c) { pc = 0x8001be1c; continue; } }
  case 0x8001bde4:
    v0 = (m.read(((0x8007913c) + 1116) >>> 0, 1) << 24) >> 24;
    { const c = (v0 | 0) !== (a0 | 0); v0 = (0 + 31) | 0; if (c) { pc = 0x8001be20; continue; } }
  case 0x8001bdf4:
    v0 = 0x20000 | 0;
    v0 = v0 | 32768;
    a1 = s0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27324) >>> 0, 4) | 0;
    a2 = 0 | 45056;
    a0 = (a0 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8001be14:
     pc = 0x8001be64; continue;
  case 0x8001be1c:
    v0 = (0 + 31) | 0;
  case 0x8001be20:
    { const c = (s1 | 0) !== (v0 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x8001be44; continue; } }
  case 0x8001be28:
    a0 = 0x80060000 | 0;
    a0 = (a0 + 30696) | 0;
    a1 = s0 | 0;
    a2 = (0 + 298) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x8001be3c:
     pc = 0x8001be64; continue;
  case 0x8001be44:
    m.write(((0x8007913c) + 4) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003cf28, a0, a1, a2, a3);
  case 0x8001be50:
    a0 = (0 + 2) | 0;
    a1 = s0 | 0;
    a2 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x8001be60:
    m.write(((0x8007913c) + 4) >>> 0, 0 & 0xff, 1);
  case 0x8001be64:
    at = 0x80080000 | 0;
    m.write(((at) + -28004) >>> 0, s2 & 0xffff, 2);
  case 0x8001be6c:
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f8001bda4: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001c21c, translated instruction by instruction (49 instructions).
export function* f8001c21c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001c21c;
  for (;;) switch (pc) {
  case 0x8001c21c:
    sp = (sp + -32) | 0;
    v0 = 0x801f0000 | 0;
    m.write(((sp) + 24) >>> 0, s0 >>> 0, 4);
    s0 = (v0 + 26264) | 0;
    m.write(((sp) + 28) >>> 0, 0, 4);
    v0 = m.read(((s0) + 10) >>> 0, 2);
    { const c = (v0 | 0) !== 0; v0 = (0 + 240) | 0; if (c) { pc = 0x8001c2c4; continue; } }
  case 0x8001c240:
    a0 = (0 + 24) | 0;
    a1 = 0 | 0;
    a2 = (0 + -4) | 0;
    a3 = (0 + 320) | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003b87c, a0, a1, a2, a3);
  case 0x8001c258:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27352) >>> 0, 2);
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27404) >>> 0, 4) | 0;
    a1 = (0 + 5) | 0;
    m.write(((s0) + 10) >>> 0, v0 & 0xffff, 2);
    v0 = m.read(((a0) + 0) >>> 0, 4) | 0;
    v1 = 0x40000000 | 0;
    m.write(((a0) + 49) >>> 0, a1 & 0xff, 1);
    v0 = v0 | v1;
    m.write(((a0) + 0) >>> 0, v0 >>> 0, 4);
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27404) >>> 0, 4) | 0;
    v0 = (0 + 8) | 0;
    m.write(((a0) + 51) >>> 0, v0 & 0xff, 1);
    v0 = (0 + 4096) | 0;
    m.write(((a0) + 30) >>> 0, v0 & 0xffff, 2);
    v0 = 0x80200000 | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27404) >>> 0, 4) | 0;
    v0 = (v0 + -11664) | 0;
    m.write(((v1) + 56) >>> 0, a1 & 0xff, 1);
    v1 = (0 + 504) | 0;
    m.write(((v0) + 196) >>> 0, v1 >>> 0, 4);
    v1 = 0x1000000 | 0;
    m.write(((v0) + 192) >>> 0, 0 >>> 0, 4);
    m.write(((v0) + 200) >>> 0, v1 >>> 0, 4);
  case 0x8001c2c4:
     [v0, v1] = yield* call(ctx, sp, 0x8001f690, a0, a1, a2, a3);
  case 0x8001c2cc:
    s0 = m.read(((sp) + 24) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f8001c21c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8001fb38, translated instruction by instruction (34 instructions).
export function* f8001fb38(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8001fb38;
  for (;;) switch (pc) {
  case 0x8001fb38:
    sp = (sp + -24) | 0;
    t0 = a0 | 0;
    a0 = (0 + 4) | 0;
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28028) >>> 0, 1);
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a3 = 0x80080000 | 0;
    a3 = (a3 + -27568) | 0;
    m.write(((sp) + 16) >>> 0, 0, 4);
    v1 = (v0 + 1) | 0;
    v0 = v0 << 1;
    v0 = (v0 + a3) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28028) >>> 0, v1 & 0xff, 1);
    v1 = v1 & 3;
    m.write(((v0) + 0) >>> 0, t0 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -28028) >>> 0, v1 & 0xff, 1);
    a2 = t0 & 65535; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x8001fb8c:
    a0 = (0 + 24) | 0;
    a1 = 0x80080000 | 0;
    a1 = m.read(((a1) + -27516) >>> 0, 4) | 0;
    a2 = 0x80080000 | 0;
    a2 = m.read(((a2) + -27584) >>> 0, 4) | 0;
    a3 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003b398, a0, a1, a2, a3);
  case 0x8001fba8:
     [v0, v1] = yield* call(ctx, sp, 0x8001f690, a0, a1, a2, a3);
  case 0x8001fbb0:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f8001fb38: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x800216a8, translated instruction by instruction (121 instructions).
export function* f800216a8(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x800216a8;
  for (;;) switch (pc) {
  case 0x800216a8:
    sp = (sp + -72) | 0;
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    s4 = a0 | 0;
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    s5 = a1 | 0;
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    s1 = a2 | 0;
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    s2 = 0x801f0000 | 0;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    s3 = (0 + 1) | 0;
    m.write(((sp) + 64) >>> 0, 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
  case 0x800216dc:
    v0 = m.read(((s2) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80021704; continue; } }
  case 0x800216f0:
    { const c = (v0 | 0) === (s3 | 0);  if (c) { pc = 0x80021704; continue; } }
  case 0x800216f8:
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80021700:
    s1 = (s1 + 1) | 0;
  case 0x80021704:
    v0 = m.read(((s2) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x8002172c; continue; } }
  case 0x80021718:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x8002172c; continue; } }
  case 0x80021720:
    s1 = (s1 + -1) | 0;
    a0 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8002172c:
    v0 = m.read(((s2) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 33;
    { const c = (v0 | 0) === 0; v0 = s1 & 255; if (c) { pc = 0x80021768; continue; } }
  case 0x80021740:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80021758; continue; } }
  case 0x80021748:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80021750:
     pc = 0x80021850; continue;
  case 0x80021758:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x80021760:
     pc = 0x80021850; continue;
  case 0x80021768:
    m.write(((sp) + 16) >>> 0, 0 >>> 0, 4);
    a0 = (0 + 100) | 0;
    a1 = (0 + 146) | 0;
    a2 = (0 + 30) | 0;
    a3 = (0 + 56) | 0; [v0, v1] = yield* call(ctx, sp, 0x80037784, a0, a1, a2, a3);
  case 0x80021780:
    a0 = (0 + 100) | 0;
    s0 = s1 & 255;
    a1 = s0 << 1;
    a1 = (a1 + s0) | 0;
    a1 = a1 << 3;
    a1 = (a1 + 146) | 0;
    a2 = 0 | 33924; [v0, v1] = yield* call(ctx, sp, 0x800380ec, a0, a1, a2, a3);
  case 0x800217a0:
    { const c = (s0 | 0) !== 0; a0 = (0 + 1) | 0; if (c) { pc = 0x800217ac; continue; } }
  case 0x800217a8:
    a0 = 0 | 0;
  case 0x800217ac:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800217b4:
    a0 = (0 + 120) | 0;
    a1 = (0 + 146) | 0;
    a2 = s4 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800217c8:
    v0 = s1 & 255;
    { const c = (v0 | 0) !== (s3 | 0); a0 = (0 + 1) | 0; if (c) { pc = 0x800217d8; continue; } }
  case 0x800217d4:
    a0 = 0 | 0;
  case 0x800217d8:
     [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800217e0:
    a0 = (0 + 120) | 0;
    a1 = (0 + 170) | 0;
    a2 = s5 | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x800217f4:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x800217fc:
    a0 = (0 + 80) | 0;
    a1 = (0 + 138) | 0;
    a2 = (0 + 160) | 0;
    a3 = (0 + 56) | 0;
    v0 = a2 | 0;
    m.write(((sp) + 16) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 100) | 0;
    m.write(((sp) + 20) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 40) | 0;
    m.write(((sp) + 24) >>> 0, v0 >>> 0, 4);
    v0 = 0x40000000 | 0;
    m.write(((sp) + 28) >>> 0, v0 >>> 0, 4);
    v0 = (0 + 3) | 0;
    m.write(((sp) + 32) >>> 0, v0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x8003c86c, a0, a1, a2, a3);
  case 0x80021838:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80021840:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80021848:
     pc = 0x800216dc; continue;
  case 0x80021850:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80021858:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80021860:
    v0 = s1 & 255;
    s5 = m.read(((sp) + 60) >>> 0, 4) | 0;
    s4 = m.read(((sp) + 56) >>> 0, 4) | 0;
    s3 = m.read(((sp) + 52) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 48) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 44) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 40) >>> 0, 4) | 0;
    sp = (sp + 72) | 0;
     return v0;
  default: throw new Error(`f800216a8: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003d8dc, translated instruction by instruction (71 instructions).
export function* f8003d8dc(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003d8dc;
  for (;;) switch (pc) {
  case 0x8003d8dc:
    sp = (sp + -32) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27967) >>> 0, 1);
    v0 = (0 + 1) | 0;
    m.write(((sp) + 24) >>> 0, 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    { const c = (v1 | 0) === (v0 | 0); m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); if (c) { pc = 0x8003d9e0; continue; } }
  case 0x8003d8fc:
    v1 = 0x80080000 | 0;
    v1 = (m.read(((v1) + -27970) >>> 0, 1) << 24) >> 24;
    v0 = (0 + -1) | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = (0 + 16) | 0; if (c) { pc = 0x8003d9c4; continue; } }
  case 0x8003d910:
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27970) >>> 0, 1);
    s0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003cfa4, a0, a1, a2, a3);
  case 0x8003d920:
     [v0, v1] = yield* call(ctx, sp, 0x8003d820, a0, a1, a2, a3);
  case 0x8003d928:
    v0 = 0x80200000 | 0;
    s1 = (v0 + -8104) | 0;
    v0 = s0 & 255;
  case 0x8003d934:
    v0 = v0 << 3;
    v1 = (v0 + s1) | 0;
    v0 = m.read(((v1) + 0) >>> 0, 2);
    { const c = (v0 | 0) === 0; v0 = (0 + 1) | 0; if (c) { pc = 0x8003d9a4; continue; } }
  case 0x8003d94c:
    v1 = m.read(((v1) + 2) >>> 0, 1);
    { const c = (v1 | 0) === (v0 | 0); v0 = (v1 | 0) < 2 ? 1 : 0; if (c) { pc = 0x8003d98c; continue; } }
  case 0x8003d95c:
    { const c = (v0 | 0) === 0; v0 = (0 + 2) | 0; if (c) { pc = 0x8003d974; continue; } }
  case 0x8003d964:
    { const c = (v1 | 0) === 0; a0 = (0 + 15) | 0; if (c) { pc = 0x8003d984; continue; } }
  case 0x8003d96c:
    s0 = (s0 + 1) | 0; pc = 0x8003d9a8; continue;
  case 0x8003d974:
    { const c = (v1 | 0) === (v0 | 0); a0 = (0 + 15) | 0; if (c) { pc = 0x8003d998; continue; } }
  case 0x8003d97c:
    s0 = (s0 + 1) | 0; pc = 0x8003d9a8; continue;
  case 0x8003d984:
    a1 = (0 + 5) | 0; pc = 0x8003d99c; continue;
  case 0x8003d98c:
    a0 = (0 + 15) | 0;
    a1 = (0 + 2) | 0; pc = 0x8003d99c; continue;
  case 0x8003d998:
    a1 = (0 + 3) | 0;
  case 0x8003d99c:
     [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8003d9a4:
    s0 = (s0 + 1) | 0;
  case 0x8003d9a8:
    v0 = s0 & 255;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v0 = s0 & 255; if (c) { pc = 0x8003d934; continue; } }
  case 0x8003d9b8:
    v1 = 0x80080000 | 0;
    v1 = (m.read(((v1) + -27970) >>> 0, 1) << 24) >> 24;
    v0 = (0 + 16) | 0;
  case 0x8003d9c4:
    { const c = (v1 | 0) !== (v0 | 0); a0 = (0 + 10) | 0; if (c) { pc = 0x8003d9e0; continue; } }
  case 0x8003d9cc:
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8003d9d4:
    a0 = (0 + 10) | 0;
    a1 = (0 + 3) | 0; [v0, v1] = yield* call(ctx, sp, 0x8002c6e4, a0, a1, a2, a3);
  case 0x8003d9e0:
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 32) | 0;
     return v0;
  default: throw new Error(`f8003d8dc: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80044b60, translated instruction by instruction (24 instructions).
export function f80044b60(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80044b60;
  for (;;) switch (pc) {
  case 0x80044b60:
    a2 = a2 >> 2;
    { const c = (a2 | 0) === 0; a3 = a0 | 0; if (c) { pc = 0x80044bb8; continue; } }
  case 0x80044b6c:
    a0 = m.read(((a3) + 0) >>> 0, 1);
    a3 = (a3 + 1) | 0;
    a2 = (a2 + -1) | 0;
    v1 = a0 & 255;
    v0 = (v1 >>> 6) | 0;
    m.write(((a1) + 0) >>> 0, v0 & 0xff, 1);
    a1 = (a1 + 1) | 0;
    v0 = (v1 >>> 4) | 0;
    v0 = v0 & 3;
    m.write(((a1) + 0) >>> 0, v0 & 0xff, 1);
    a1 = (a1 + 1) | 0;
    v1 = (v1 >>> 2) | 0;
    v1 = v1 & 3;
    m.write(((a1) + 0) >>> 0, v1 & 0xff, 1);
    a1 = (a1 + 1) | 0;
    a0 = a0 & 3;
    m.write(((a1) + 0) >>> 0, a0 & 0xff, 1);
    { const c = (a2 | 0) !== 0; a1 = (a1 + 1) | 0; if (c) { pc = 0x80044b6c; continue; } }
  case 0x80044bb8:
     return v0;
  default: throw new Error(`f80044b60: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80024fd0, translated instruction by instruction (284 instructions).
export function* backlog(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80024fd0;
  const prevTouch = ctx.touch ? ctx.touch.menu : null; // the caller's tap rows, back on return
  for (;;) switch (pc) {
  case 0x80024fd0:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27980) >>> 0, 2);
    sp = (sp + -80) | 0;
    m.write(((sp) + 52) >>> 0, s3 >>> 0, 4);
    s3 = 0x80080000 | 0;
    s3 = m.read(((s3) + -28004) >>> 0, 2);
    m.write(((sp) + 64) >>> 0, s6 >>> 0, 4);
    s6 = 0x80080000 | 0;
    s6 = m.read(((s6) + -27628) >>> 0, 2);
    t0 = 0x80080000 | 0;
    t0 = m.read(((t0) + -28002) >>> 0, 1);
    m.write(((sp) + 76) >>> 0, 0, 4);
    m.write(((sp) + 72) >>> 0, fp >>> 0, 4);
    m.write(((sp) + 68) >>> 0, s7 >>> 0, 4);
    m.write(((sp) + 60) >>> 0, s5 >>> 0, 4);
    m.write(((sp) + 56) >>> 0, s4 >>> 0, 4);
    m.write(((sp) + 48) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 44) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 40) >>> 0, s0 >>> 0, 4);
    a0 = (v0 + -2) | 0;
    s1 = a0 | 0;
    v1 = s3 & 65535;
    v0 = (0 + 31) | 0;
    { const c = (v1 | 0) === (v0 | 0); m.write(((sp) + 32) >>> 0, t0 & 0xff, 1); if (c) { pc = 0x8002540c; continue; } }
  case 0x80025034:
    v0 = (0 + 25) | 0;
    { const c = (v1 | 0) === (v0 | 0); v0 = 0x801f0000 | 0; if (c) { pc = 0x8002540c; continue; } }
  case 0x80025040:
    v0 = m.read(((v0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 2048;
    { const c = (v0 | 0) === 0; v0 = a0 << 16; if (c) { pc = 0x8002540c; continue; } }
  case 0x80025054:
    { const c = (v0 | 0) < 0; a0 = 0 | 0; if (c) { pc = 0x8002540c; continue; } }
  case 0x8002505c:
    a1 = (sp + 16) | 0;
    v0 = 0x801f0000 | 0;
    a2 = (v0 + 29512) | 0;
    v1 = a0 & 255;
  case 0x8002506c:
    a0 = (a0 + 1) | 0;
    v1 = v1 << 1;
    v0 = (v1 + a2) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 2);
    v1 = (v1 + a1) | 0;
    m.write(((v1) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = a0 & 255;
    v0 = (v0 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = a0 & 255; if (c) { pc = 0x8002506c; continue; } }
  case 0x80025094:
    v0 = 0x801f0000 | 0;
    t0 = 0x80080000 | 0;
    t0 = m.read(((t0) + -28011) >>> 0, 1);
    a0 = m.read(((v0) + 26282) >>> 0, 2);
    s7 = 0x80080000 | 0;
    s7 = m.read(((s7) + -27445) >>> 0, 1);
    fp = 0x80080000 | 0;
    fp = m.read(((fp) + -27600) >>> 0, 1);
    m.write(((sp) + 33) >>> 0, t0 & 0xff, 1);
    t0 = 0x80080000 | 0;
    t0 = m.read(((t0) + -28010) >>> 0, 1);
    a1 = (0 + 15) | 0;
    m.write(((sp) + 34) >>> 0, t0 & 0xff, 1);
    t0 = 0x80080000 | 0;
    t0 = m.read(((t0) + -28009) >>> 0, 1);
    s0 = (0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27999) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28029) >>> 0, s0 & 0xff, 1);
    m.write(((sp) + 35) >>> 0, t0 & 0xff, 1); [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800250ec:
    v0 = (0 + 27) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27958) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80037d48, a0, a1, a2, a3);
  case 0x80025100:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80025108:
    at = 0x80080000 | 0;
    m.write(((at) + -27993) >>> 0, s0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28000) >>> 0, s0 & 0xff, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003911c, a0, a1, a2, a3);
  case 0x80025120:
    s4 = 0x80080000 | 0;
    s4 = m.read(((s4) + -27272) >>> 0, 4) | 0;
    s5 = 0x80080000 | 0;
    s5 = m.read(((s5) + -27636) >>> 0, 4) | 0;
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80025138:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80025140:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80025148:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28004) >>> 0, 2);
    v0 = (v0 + -34) | 0;
    v0 = (v0 >>> 0) < 3 ? 1 : 0;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x800251a4; continue; } }
  case 0x80025164:
    a0 = (0 + 5) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8002516c:
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80025174:
    a0 = (0 + 40) | 0;
    a1 = (0 + 90) | 0;
    a2 = 0x80010000 | 0;
    a2 = (a2 + 4924) | 0;
    a3 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x8002518c:
     [v0, v1] = yield* call(ctx, sp, 0x80025640, a0, a1, a2, a3);
  case 0x80025194:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x8002519c:
     pc = 0x80025264; continue;
  case 0x800251a4:
    a0 = s1 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80024d08, a0, a1, a2, a3);
  case 0x800251ac:
    s2 = (0 + 1) | 0;
    s0 = 0x801f0000 | 0;
  case 0x800251b4:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x800251bc:
    offer(ctx, [box(100001, 0, 0, 320, 120), box(100002, 0, 120, 320, 120)], () => 0, ["up", "down"], { 100001: "up", 100002: "down" });
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x800251c4:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28000) >>> 0, 1);
    { const c = (v0 | 0) !== (s2 | 0);  if (c) { pc = 0x80025250; continue; } }
  case 0x800251d8:
    v0 = m.read(((s0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 4096;
    { const c = (v0 | 0) === 0; v0 = s1 << 16; if (c) { pc = 0x80025200; continue; } }
  case 0x800251ec:
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x80025200; continue; } }
  case 0x800251f4:
    s1 = (s1 + -1) | 0;
    a0 = s1 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80024d08, a0, a1, a2, a3);
  case 0x80025200:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28000) >>> 0, 1);
    { const c = (v0 | 0) !== (s2 | 0);  if (c) { pc = 0x80025250; continue; } }
  case 0x80025214:
    v0 = m.read(((s0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 16384;
    { const c = (v0 | 0) === 0; v1 = s1 << 16; if (c) { pc = 0x80025250; continue; } }
  case 0x80025228:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27980) >>> 0, 2);
    v1 = v1 >> 16;
    v0 = (v0 + -2) | 0;
    v1 = (v1 | 0) < (v0 | 0) ? 1 : 0;
    { const c = (v1 | 0) === 0;  if (c) { pc = 0x80025264; continue; } }
  case 0x80025244:
    s1 = (s1 + 1) | 0;
    a0 = s1 & 65535; [v0, v1] = yield* call(ctx, sp, 0x80024d08, a0, a1, a2, a3);
  case 0x80025250:
    v0 = m.read(((s0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 68;
    { const c = (v0 | 0) === 0;  if (c) { pc = 0x800251b4; continue; } }
  case 0x80025264:
    at = 0x80080000 | 0;
    m.write(((at) + -28000) >>> 0, 0 & 0xff, 1);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80039184, a0, a1, a2, a3);
  case 0x80025274:
    a0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038f80, a0, a1, a2, a3);
  case 0x8002527c:
    at = 0x80080000 | 0;
    m.write(((at) + -27993) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27628) >>> 0, s6 & 0xffff, 2);
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a90c, a0, a1, a2, a3);
  case 0x80025294:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28004) >>> 0, 2);
    a0 = s3 & 65535;
    { const c = (v0 | 0) === (a0 | 0); v1 = (0 + 1) | 0; if (c) { pc = 0x80025344; continue; } }
  case 0x800252a8:
    v0 = m.read(((0x8007913c) + 2) >>> 0, 1);
    s0 = 0x80080000 | 0;
    s0 = m.read(((s0) + -27508) >>> 0, 4) | 0;
    { const c = (v0 | 0) !== (v1 | 0);  if (c) { pc = 0x800252f0; continue; } }
  case 0x800252bc:
    v0 = (m.read(((0x8007913c) + 1116) >>> 0, 1) << 24) >> 24;
    { const c = (v0 | 0) !== (a0 | 0); v0 = 0x20000 | 0; if (c) { pc = 0x800252f0; continue; } }
  case 0x800252cc:
    v0 = v0 | 32768;
    a1 = s0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27324) >>> 0, 4) | 0;
    a2 = 0 | 45056;
    a0 = (a0 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x800252e8:
     pc = 0x8002533c; continue;
  case 0x800252f0:
    s1 = s3 & 65535;
    v0 = (0 + 31) | 0;
    { const c = (s1 | 0) !== (v0 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x8002531c; continue; } }
  case 0x80025300:
    a0 = 0x80060000 | 0;
    a0 = (a0 + 30696) | 0;
    a1 = s0 | 0;
    a2 = (0 + 298) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80025314:
     pc = 0x8002533c; continue;
  case 0x8002531c:
    m.write(((0x8007913c) + 4) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003cf28, a0, a1, a2, a3);
  case 0x80025328:
    a0 = (0 + 2) | 0;
    a1 = s0 | 0;
    a2 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x80025338:
    m.write(((0x8007913c) + 4) >>> 0, 0 & 0xff, 1);
  case 0x8002533c:
    at = 0x80080000 | 0;
    m.write(((at) + -28004) >>> 0, s3 & 0xffff, 2);
  case 0x80025344:
    a0 = 0 | 0;
    v0 = 0x801f0000 | 0;
    a2 = (v0 + 29512) | 0;
    t0 = m.read(((sp) + 32) >>> 0, 1);
    a1 = (sp + 16) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -28029) >>> 0, 0 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27272) >>> 0, s4 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -27636) >>> 0, s5 >>> 0, 4);
    at = 0x80080000 | 0;
    m.write(((at) + -28002) >>> 0, t0 & 0xff, 1);
    v1 = a0 & 255;
  case 0x8002537c:
    a0 = (a0 + 1) | 0;
    v1 = v1 << 1;
    v0 = (v1 + a1) | 0;
    v0 = m.read(((v0) + 0) >>> 0, 2);
    v1 = (v1 + a2) | 0;
    m.write(((v1) + 0) >>> 0, v0 & 0xffff, 2);
    v0 = a0 & 255;
    v0 = (v0 >>> 0) < 8 ? 1 : 0;
    { const c = (v0 | 0) !== 0; v1 = a0 & 255; if (c) { pc = 0x8002537c; continue; } }
  case 0x800253a4:
    t0 = m.read(((sp) + 33) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28011) >>> 0, t0 & 0xff, 1);
    t0 = m.read(((sp) + 34) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28010) >>> 0, t0 & 0xff, 1);
    t0 = m.read(((sp) + 35) >>> 0, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27445) >>> 0, s7 & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -27600) >>> 0, fp & 0xff, 1);
    at = 0x80080000 | 0;
    m.write(((at) + -28009) >>> 0, t0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x800253e0:
    v0 = 0x801f0000 | 0;
    a0 = m.read(((v0) + 26282) >>> 0, 2);
    a1 = (0 + 2) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003bdc0, a0, a1, a2, a3);
  case 0x800253f0:
    v0 = (0 + 5) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27958) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x80037e94, a0, a1, a2, a3);
  case 0x80025404:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x8002540c:
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
  default: throw new Error(`backlog: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80024d08, translated instruction by instruction (178 instructions).
export function* f80024d08(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80024d08;
  for (;;) switch (pc) {
  case 0x80024d08:
    sp = (sp + -40) | 0;
    m.write(((sp) + 28) >>> 0, s3 >>> 0, 4);
    s3 = a0 | 0;
    m.write(((sp) + 32) >>> 0, 0, 4);
    m.write(((sp) + 24) >>> 0, s2 >>> 0, 4);
    m.write(((sp) + 20) >>> 0, s1 >>> 0, 4);
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4); [v0, v1] = yield* call(ctx, sp, 0x80037a0c, a0, a1, a2, a3);
  case 0x80024d28:
    v0 = s3 & 65535;
    v1 = 0x801d0000 | 0;
    v1 = (v1 + 26576) | 0;
    v0 = (v0 + v1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27998) >>> 0, 0 & 0xff, 1);
    s2 = m.read(((v0) + 0) >>> 0, 1);
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28004) >>> 0, 2);
    a0 = s2 & 65535;
    { const c = (v0 | 0) === (a0 | 0); v1 = (0 + 1) | 0; if (c) { pc = 0x80024df4; continue; } }
  case 0x80024d58:
    v0 = m.read(((0x8007913c) + 2) >>> 0, 1);
    s0 = 0x80080000 | 0;
    s0 = m.read(((s0) + -27508) >>> 0, 4) | 0;
    { const c = (v0 | 0) !== (v1 | 0); s1 = s2 & 65535; if (c) { pc = 0x80024da4; continue; } }
  case 0x80024d6c:
    v0 = (m.read(((0x8007913c) + 1116) >>> 0, 1) << 24) >> 24;
    { const c = (v0 | 0) !== (a0 | 0); v0 = (0 + 31) | 0; if (c) { pc = 0x80024da8; continue; } }
  case 0x80024d7c:
    v0 = 0x20000 | 0;
    v0 = v0 | 32768;
    a1 = s0 | 0;
    a0 = 0x80080000 | 0;
    a0 = m.read(((a0) + -27324) >>> 0, 4) | 0;
    a2 = 0 | 45056;
    a0 = (a0 + v0) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80024d9c:
     pc = 0x80024dec; continue;
  case 0x80024da4:
    v0 = (0 + 31) | 0;
  case 0x80024da8:
    { const c = (s1 | 0) !== (v0 | 0); v0 = (0 + 1) | 0; if (c) { pc = 0x80024dcc; continue; } }
  case 0x80024db0:
    a0 = 0x80060000 | 0;
    a0 = (a0 + 30696) | 0;
    a1 = s0 | 0;
    a2 = (0 + 298) | 0; [v0, v1] = yield* call(ctx, sp, 0x80044904, a0, a1, a2, a3);
  case 0x80024dc4:
     pc = 0x80024dec; continue;
  case 0x80024dcc:
    m.write(((0x8007913c) + 4) >>> 0, v0 & 0xff, 1);
     [v0, v1] = yield* call(ctx, sp, 0x8003cf28, a0, a1, a2, a3);
  case 0x80024dd8:
    a0 = (0 + 2) | 0;
    a1 = s0 | 0;
    a2 = s1 | 0; [v0, v1] = yield* call(ctx, sp, 0x800369f8, a0, a1, a2, a3);
  case 0x80024de8:
    m.write(((0x8007913c) + 4) >>> 0, 0 & 0xff, 1);
  case 0x80024dec:
    at = 0x80080000 | 0;
    m.write(((at) + -28004) >>> 0, s2 & 0xffff, 2);
  case 0x80024df4:
    a0 = s3 & 65535;
    v1 = 0x80200000 | 0;
    v1 = (v1 + -10352) | 0;
    a0 = a0 << 1;
    v1 = (a0 + v1) | 0;
    v0 = 0x801f0000 | 0;
    v0 = (v0 + 24216) | 0;
    a0 = (a0 + v0) | 0;
    a1 = m.read(((v1) + 0) >>> 0, 2);
    v0 = m.read(((a0) + 0) >>> 0, 2);
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27508) >>> 0, 4) | 0;
    v0 = (v0 + v1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27628) >>> 0, a1 & 0xffff, 2);
    at = 0x80080000 | 0;
    m.write(((at) + -27272) >>> 0, v0 >>> 0, 4);
    s0 = (0 + 1) | 0; [v0, v1] = yield* call(ctx, sp, 0x8003a67c, a0, a1, a2, a3);
  case 0x80024e44:
     [v0, v1] = yield* call(ctx, sp, 0x8003a6b0, a0, a1, a2, a3);
  case 0x80024e4c:
    v0 = 0x80070000 | 0;
    s1 = (v0 + -23572) | 0;
  case 0x80024e54:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27998) >>> 0, 1);
    { const c = (v0 | 0) === (s0 | 0);  if (c) { pc = 0x80024f58; continue; } }
  case 0x80024e68:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80024e70:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27996) >>> 0, 1);
    m.write(((0x8007913c) + 348) >>> 0, 0 & 0xff, 1);
    { const c = (v0 | 0) !== (s0 | 0);  if (c) { pc = 0x80024ec4; continue; } }
  case 0x80024e84:
     [v0, v1] = yield* call(ctx, sp, 0x8001e830, a0, a1, a2, a3);
  case 0x80024e8c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27272) >>> 0, 4) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27636) >>> 0, v0 >>> 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x8001cbe0, a0, a1, a2, a3);
  case 0x80024ea4:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27272) >>> 0, 4) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27636) >>> 0, v0 >>> 0, 4);
     [v0, v1] = yield* call(ctx, sp, 0x8001c8f8, a0, a1, a2, a3);
  case 0x80024ebc:
    at = 0x80080000 | 0;
    m.write(((at) + -27996) >>> 0, 0 & 0xff, 1);
  case 0x80024ec4:
     [v0, v1] = yield* call(ctx, sp, 0x8003a560, a0, a1, a2, a3);
  case 0x80024ecc:
    { const c = (v0 | 0) !== (s0 | 0);  if (c) { pc = 0x80024f38; continue; } }
  case 0x80024ed4:
    v0 = m.read(((0x8007913c) + 4) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80024f00; continue; } }
  case 0x80024ee4:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28000) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80024f00; continue; } }
  case 0x80024ef8:
     [v0, v1] = yield* call(ctx, sp, 0x8002374c, a0, a1, a2, a3);
  case 0x80024f00:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27272) >>> 0, 4) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27196) >>> 0, v0 >>> 0, 4);
    v1 = m.read(((v0) + 0) >>> 0, 1);
    v1 = v1 << 2;
    v1 = (v1 + s1) | 0;
    v1 = m.read(((v1) + 0) >>> 0, 4) | 0;
    v0 = (v0 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27272) >>> 0, v0 >>> 0, 4);
    { const f = v1;  [v0, v1] = yield* call(ctx, sp, f >>> 0, a0, a1, a2, a3); }
  case 0x80024f38:
    v0 = m.read(((0x8007913c) + 348) >>> 0, 1);
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80024e70; continue; } }
  case 0x80024f48:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x800492b4, a0, a1, a2, a3);
  case 0x80024f50:
     pc = 0x80024e54; continue;
  case 0x80024f58:
    s0 = s3 & 65535;
    { const c = (s0 | 0) === 0; a0 = (0 + 144) | 0; if (c) { pc = 0x80024f78; continue; } }
  case 0x80024f64:
    a1 = (0 + -3) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28340) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80024f78:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -27980) >>> 0, 2);
    v0 = (v0 + -2) | 0;
    v0 = (s0 | 0) < (v0 | 0) ? 1 : 0;
    { const c = (v0 | 0) === 0; a0 = (0 + 144) | 0; if (c) { pc = 0x80024fa8; continue; } }
  case 0x80024f94:
    a1 = (0 + 210) | 0;
    a2 = 0x80080000 | 0;
    a2 = (a2 + -28336) | 0;
    a3 = (0 + 16) | 0; [v0, v1] = yield* call(ctx, sp, 0x80038658, a0, a1, a2, a3);
  case 0x80024fa8:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x80024fb0:
    s3 = m.read(((sp) + 28) >>> 0, 4) | 0;
    s2 = m.read(((sp) + 24) >>> 0, 4) | 0;
    s1 = m.read(((sp) + 20) >>> 0, 4) | 0;
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 40) | 0;
     return v0;
  default: throw new Error(`f80024d08: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80025640, translated instruction by instruction (26 instructions).
export function* f80025640(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80025640;
  for (;;) switch (pc) {
  case 0x80025640:
    sp = (sp + -24) | 0;
    m.write(((sp) + 16) >>> 0, s0 >>> 0, 4);
    s0 = 0x801f0000 | 0;
    m.write(((sp) + 20) >>> 0, 0, 4);
  case 0x80025650:
    v0 = m.read(((s0) + -4288) >>> 0, 4) | 0;
    v0 = v0 & 101;
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80025684; continue; } }
  case 0x80025664:
     [v0, v1] = yield* call(ctx, sp, 0x8003aa8c, a0, a1, a2, a3);
  case 0x8002566c:
     [v0, v1] = yield* call(ctx, sp, 0x80039288, a0, a1, a2, a3);
  case 0x80025674:
     [v0, v1] = yield* call(ctx, sp, 0x80013f34, a0, a1, a2, a3);
  case 0x8002567c:
     pc = 0x80025650; continue;
  case 0x80025684:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80028c74, a0, a1, a2, a3);
  case 0x8002568c:
     [v0, v1] = yield* call(ctx, sp, 0x80025440, a0, a1, a2, a3);
  case 0x80025694:
    s0 = m.read(((sp) + 16) >>> 0, 4) | 0;
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f80025640: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003911c, translated instruction by instruction (26 instructions).
export function f8003911c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003911c;
  for (;;) switch (pc) {
  case 0x8003911c:
    a0 = a0 & 255;
    v1 = 0x80080000 | 0;
    v1 = (v1 + -27456) | 0;
    v0 = a0 << 2;
    v0 = (v0 + v1) | 0;
    v1 = m.read(((v0) + 0) >>> 0, 4) | 0;
    v0 = 0x80080000 | 0;
    v0 = (v0 + -27392) | 0;
    a0 = (a0 + v0) | 0;
    v0 = (0 + 1) | 0;
    m.write(((a0) + 0) >>> 0, v0 & 0xff, 1);
  case 0x80039148:
    v0 = m.read(((v1) + 0) >>> 0, 1);
    { const c = (v0 | 0) === 0; v0 = (v0 >>> 0) < 128 ? 1 : 0; if (c) { pc = 0x80039170; continue; } }
  case 0x80039158:
    { const c = (v0 | 0) !== 0;  if (c) { pc = 0x80039168; continue; } }
  case 0x80039160:
    v1 = (v1 + 2) | 0; pc = 0x80039148; continue;
  case 0x80039168:
    v1 = (v1 + 1) | 0; pc = 0x80039148; continue;
  case 0x80039170:
    v1 = (v1 + 1) | 0;
    at = 0x80080000 | 0;
    m.write(((at) + -27272) >>> 0, v1 >>> 0, 4);
     return v0;
  default: throw new Error(`f8003911c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x80039184, translated instruction by instruction (6 instructions).
export function f80039184(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x80039184;
  for (;;) switch (pc) {
  case 0x80039184:
    a0 = a0 & 255;
    v0 = 0x80080000 | 0;
    v0 = (v0 + -27392) | 0;
    a0 = (a0 + v0) | 0;
    m.write(((a0) + 0) >>> 0, 0 & 0xff, 1); return v0;
  default: throw new Error(`f80039184: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8002374c, translated instruction by instruction (11 instructions).
export function* f8002374c(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8002374c;
  for (;;) switch (pc) {
  case 0x8002374c:
    v0 = 0x80080000 | 0;
    v0 = m.read(((v0) + -28011) >>> 0, 1);
    sp = (sp + -24) | 0;
    { const c = (v0 | 0) !== 0; m.write(((sp) + 16) >>> 0, 0, 4); if (c) { pc = 0x80023768; continue; } }
  case 0x80023760:
    a0 = 0 | 0; [v0, v1] = yield* call(ctx, sp, 0x80023600, a0, a1, a2, a3);
  case 0x80023768:
    sp = (sp + 24) | 0;
     return v0;
  default: throw new Error(`f8002374c: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

// 0x8003a6b0, translated instruction by instruction (13 instructions).
export function f8003a6b0(ctx, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
  const { m } = ctx; let sp = ctx.sp | 0, at = 0, v0 = 0, v1 = 0, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0;
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0, s6 = 0, s7 = 0, fp = 0, hi = 0, lo = 0, pc = 0x8003a6b0;
  for (;;) switch (pc) {
  case 0x8003a6b0:
    v0 = 0x80080000 | 0;
    v0 = (v0 + -27468) | 0;
    v1 = 0x80080000 | 0;
    v1 = m.read(((v1) + -27993) >>> 0, 1);
    a0 = (0 + 17) | 0;
    v1 = v1 << 1;
    v0 = (v1 + v0) | 0;
    m.write(((v0) + 0) >>> 0, a0 & 0xffff, 2);
    v0 = 0x80080000 | 0;
    v0 = (v0 + -27460) | 0;
    v1 = (v1 + v0) | 0;
    m.write(((v1) + 0) >>> 0, a0 & 0xffff, 2); return v0;
  default: throw new Error(`f8003a6b0: no block at 0x${(pc >>> 0).toString(16)}`);
  }
}

export const TRANSLATED = {0x80018cdc: menu, 0x80019c30: flowChart, 0x8001575c: f8001575c, 0x80019544: f80019544, 0x80019738: f80019738, 0x80035568: f80035568, 0x80037344: f80037344, 0x80044f7c: f80044f7c, 0x8001c6a0: f8001c6a0, 0x8001c8f8: f8001c8f8, 0x800355cc: lzss, 0x800378c4: f800378c4, 0x80044e90: f80044e90, 0x8001c374: f8001c374, 0x80037d48: f80037d48, 0x8003c8f8: addBox2, 0x8001866c: options, 0x800145b0: f800145b0, 0x80025710: f80025710, 0x80014d68: f80014d68, 0x8001511c: f8001511c, 0x8001b51c: f8001b51c, 0x800289ec: f800289ec, 0x8002cc48: f8002cc48, 0x8002cc98: f8002cc98, 0x8003d820: f8003d820, 0x80044868: f80044868, 0x80026088: f80026088, 0x80044e10: pacMemberBE, 0x80044e50: f80044e50, 0x80044ecc: fmul8, 0x80037e50: f80037e50, 0x80037e94: f80037e94, 0x8003bc3c: spriteFree, 0x8003bdc0: spriteLayer, 0x8003a90c: setPalette, 0x80026204: repeatOn, 0x80026220: repeatOff, 0x80044904: memcpy, 0x8001824c: save, 0x80017e14: f80017e14, 0x80017854: f80017854, 0x8001c7c0: f8001c7c0, 0x80025a08: f80025a08, 0x80025c74: f80025c74, 0x8002a89c: f8002a89c, 0x8003aa8c: f8003aa8c, 0x8002bf98: f8002bf98, 0x80033648: f80033648, 0x80015d74: f80015d74, 0x80033be8: f80033be8, 0x8003cd78: f8003cd78, 0x8002afb8: f8002afb8, 0x8002bfe8: f8002bfe8, 0x8002c4c0: f8002c4c0, 0x8002baa0: f8002baa0, 0x800338ac: f800338ac, 0x80038b8c: f80038b8c, 0x80038ce8: f80038ce8, 0x80038f58: f80038f58, 0x80029a6c: f80029a6c, 0x80029ad0: f80029ad0, 0x80015fa8: cardMessage, 0x8002a980: f8002a980, 0x80025898: f80025898, 0x8002c530: f8002c530, 0x8002a9f8: noCardBox, 0x8002a320: yesNo, 0x8002bd1c: cardCheck, 0x800298e4: cardLoad, 0x8001b694: title, 0x80016078: startMenu, 0x8002a1ac: f8002a1ac, 0x8002aa70: f8002aa70, 0x8002b4e0: f8002b4e0, 0x80033848: f80033848, 0x8002b7f4: f8002b7f4, 0x8003360c: f8003360c, 0x8002c4f8: f8002c4f8, 0x80032974: f80032974, 0x80021320: op3d, 0x800329ec: restoreBookmark, 0x8001f328: op1f, 0x8002188c: op44, 0x8001bda4: f8001bda4, 0x8001c21c: f8001c21c, 0x8001fb38: f8001fb38, 0x800216a8: f800216a8, 0x8003d8dc: f8003d8dc, 0x80044b60: f80044b60, 0x80024fd0: backlog, 0x80024d08: f80024d08, 0x80025640: f80025640, 0x8003911c: f8003911c, 0x80039184: f80039184, 0x8002374c: f8002374c, 0x8003a6b0: f8003a6b0 };
