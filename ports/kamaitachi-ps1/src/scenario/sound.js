// Scenario commands for music and sound effects. The control flow is ported here; the
// sound driver calls stay at their original addresses (on the oracle: native; in the
// browser: the sound module bridge).
//   0x80029174 play(id, vol)     0x800292b0 playSe(id, vol)     0x800288dc stop(id)
//   0x80026534 bank(b, id)       0x800264f0 slot(id) -> index into 0x8006b04c (2 bytes each;
//                                1 = the effect is numbered per bank: id + 1000·b)
//   0x8002665c stopSe(id)
//   0x2f 0x80020634 bgm(u16 id)              0x31 0x80020884 bgmVol(u16 v, u16 id), vol v·10
//   0x30 0x800206b4 se(u16 id)               0x32 0x80020948 seVol(u16 v, u16 id): a text
//        command right behind is run first; ids ≥ 1000 are bank·1000 + 1000 + n
//   0x34 0x80020b78 stop(u16 id), one frame and two text frames
//   0x35 0x80020c64 seBank(u8 bank, u16 id)  0xffff = none
import { HANDLERS, runOp } from "./interp.js";
import { io, operand } from "./lib.js";
import { ticks, tickText } from "../tick.js";

const SKIP = 0x80079295, NO_EFFECTS = 0x800792a0, PER_BANK = 0x8006b04c;
const endFrame = (m) => m.write(0x8007913c + 0x15c, 1, 1);
const quiet = (m) => m.read(SKIP, 1) === 1 || m.read(NO_EFFECTS, 1) === 1;
const perBank = (ctx, id, sp) => ctx.m.read(PER_BANK + 2 * (ctx.call(0x800264f0, [id], sp) | 0), 1) === 1;

HANDLERS[0x2f] = function* (ctx) {
  const { m } = ctx, id = operand(m).u16();
  if (!quiet(m)) ctx.call(0x80029174, [id, 0], ctx.sp - 0x18);
  endFrame(m);
};

HANDLERS[0x31] = function* (ctx) {
  const { m } = ctx, o = operand(m), v = o.u16(), id = o.u16();
  if (!quiet(m)) ctx.call(0x80029174, [id, (v * 10) & 0xfe], ctx.sp - 0x20);
  endFrame(m);
};

function* se(ctx, frame, vol, id, text) {
  const { m } = ctx, { r8, r32, w16 } = io(m), sp = ctx.sp - frame;
  if (quiet(m)) { endFrame(m); return; }
  if (r8(r32(0x80079578)) === 0) { m.write(0x80079578, r32(0x80079578) + 1, 4); yield* runOp({ ...ctx, sp }, 0); }
  if (text) yield* tickText({ ...ctx, sp }, 1);
  const v = (vol * 10) & 0xffff;
  if (id < 1000) { ctx.call(0x800292b0, [id, v & 0xff], sp); endFrame(m); return; }
  const bank = Math.trunc((id - 1000) / 1000) & 0xff, base = (id % 1000 + 1000) & 0xffff;
  if (perBank(ctx, base, sp)) {
    ctx.call(0x80026534, [bank, base], sp);
    ctx.call(0x800292b0, [(base + bank * 1000) & 0xffff, v & 0xfe], sp);
  } else {
    ctx.call(0x80026534, [bank, base], sp);
    ctx.call(0x800292b0, [base, v & 0xff], sp);
  }
  w16(0x80079280, 0xffff); w16(0x8007927e, 0xffff);
  endFrame(m);
}
HANDLERS[0x30] = function* (ctx) { yield* se(ctx, 0x28, 0, operand(ctx.m).u16(), false); };
HANDLERS[0x32] = function* (ctx) { const o = operand(ctx.m), v = o.u16(); yield* se(ctx, 0x28, v, o.u16(), true); };

HANDLERS[0x34] = function* (ctx) {
  const { m } = ctx, id = operand(m).u16(), sp = ctx.sp - 0x18;
  if (quiet(m)) { endFrame(m); return; }
  yield* ticks({ ...ctx, sp }, 1);
  if (id < 1000) ctx.call(0x800288dc, [id], sp);
  else ctx.call(0x8002665c, [id % 1000], sp);
  yield* tickText({ ...ctx, sp }, 2);
};

HANDLERS[0x35] = function* (ctx) {
  const { m } = ctx, o = operand(m), bank = o.u8(), id = o.u16(), sp = ctx.sp - 0x28;
  if (!quiet(m) && id !== 0xffff) {
    ctx.call(0x80026534, [bank, id], sp);
    if (perBank(ctx, id, sp)) ctx.call(0x800292b0, [(id + bank * 1000) & 0xffff, 0], sp);
  }
  endFrame(m);
};
