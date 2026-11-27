// Scenario commands for music and sound effects. The control flow is ported here; the
// sound driver goes through sound(ctx) (../sound-bridge.js: native on the oracle, the sound
// module in the browser).
//   0x800292b0 play(id, fade)    0x80029174 stop(id, fade)    0x80026534 setVariant(b, id)
//   0x800264f0 soundIndex(id) -> index into 0x8006b04c (2 bytes each; 1 = the effect is
//              numbered per bank: id + 1000·b)
//   0x800288dc waitMusic(song)   0x8002665c waitEffect(n): wait (up to 600 frames) for the end
//   0x2f 0x80020634 bgm(u16 id)              0x31 0x80020884 bgmVol(u16 v, u16 id), vol v·10
//   0x30 0x800206b4 se(u16 id)               0x32 0x80020948 seVol(u16 v, u16 id): a text
//        command right behind is run first; ids ≥ 1000 are bank·1000 + 1000 + n
//   0x34 0x80020b78 stop(u16 id), one frame and two text frames
//   0x35 0x80020c64 seBank(u8 bank, u16 id)  0xffff = none
import { HANDLERS, runOp } from "./interp.js";
import { io, operand } from "./lib.js";
import { tick, ticks, tickText } from "../tick.js";
import { textTask } from "../text/text.js";
import { sound, soundIndex } from "../sound-bridge.js";

const SKIP = 0x80079295, NO_EFFECTS = 0x800792a0, PER_BANK = 0x8006b04c;
const endFrame = (m) => m.write(0x8007913c + 0x15c, 1, 1);
const quiet = (m) => m.read(SKIP, 1) === 1 || m.read(NO_EFFECTS, 1) === 1;
const perBank = (ctx, id) => ctx.m.read(PER_BANK + 2 * soundIndex(id), 1) === 1;
const s16 = (v) => (v << 16) >> 16;

HANDLERS[0x2f] = function* (ctx) {
  const { m } = ctx, id = operand(m).u16();
  if (!quiet(m)) sound(ctx).stop(id, 0, ctx.sp - 0x18);
  endFrame(m);
};

HANDLERS[0x31] = function* (ctx) {
  const { m } = ctx, o = operand(m), v = o.u16(), id = o.u16();
  if (!quiet(m)) sound(ctx).stop(id, (v * 10) & 0xfe, ctx.sp - 0x20);
  endFrame(m);
};

function* se(ctx, frame, vol, id, text) {
  const { m } = ctx, { r8, r32, w16 } = io(m), sp = ctx.sp - frame, snd = sound(ctx);
  if (quiet(m)) { endFrame(m); return; }
  if (r8(r32(0x80079578)) === 0) { m.write(0x80079578, r32(0x80079578) + 1, 4); yield* runOp({ ...ctx, sp }, 0); }
  if (text) yield* tickText({ ...ctx, sp }, 1);
  const v = (vol * 10) & 0xffff;
  if (id < 1000) { snd.play(id, v & 0xff, sp); endFrame(m); return; }
  const bank = Math.trunc((id - 1000) / 1000) & 0xff, base = (id % 1000 + 1000) & 0xffff;
  if (perBank(ctx, base)) {
    snd.setVariant(bank, base, sp);
    snd.play((base + bank * 1000) & 0xffff, v & 0xfe, sp);
  } else {
    snd.setVariant(bank, base, sp);
    snd.play(base, v & 0xff, sp);
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
  if (id < 1000) yield* waitMusic({ ...ctx, sp }, id);
  else yield* waitEffect({ ...ctx, sp }, id % 1000);
  yield* tickText({ ...ctx, sp }, 2);
};

HANDLERS[0x35] = function* (ctx) {
  const { m } = ctx, o = operand(m), bank = o.u8(), id = o.u16(), sp = ctx.sp - 0x28, snd = sound(ctx);
  if (!quiet(m) && id !== 0xffff) {
    snd.setVariant(bank, id, sp);
    if (perBank(ctx, id)) snd.play((id + bank * 1000) & 0xffff, 0, sp);
  }
  endFrame(m);
};

// 0x800288dc(song): while the song plays (and it has an end, 0x8006a7c4 != -1), run frames.
// After 600 frames the original prints a message and waits for a button (not ported).
export function* waitMusic(ctx, id) {
  const { m } = ctx, sp = ctx.sp - 0x28, sub = { ...ctx, sp }, end = 0x8006a7c4 + 4 * (id & 0xffff);
  for (let n = 0; ;) {
    if (sound(ctx).song() === -1) return;
    yield* textTask(sub); n++;
    yield* tick(sub);
    if ((n & 0xffff) >= 0x259) throw new Error("waitMusic: timeout path at 0x80028944 is not ported");
    if (s16(m.read(end, 2)) === -1) return;
  }
}

// 0x8002665c(n): if effect n is on a channel, run frames until its done flag (at most
// 0x259 - 6 frames: the counter carries on from the channel scan), then clear the flag.
export function* waitEffect(ctx, n) {
  const sp = ctx.sp - 0x20, sub = { ...ctx, sp }, snd = sound(ctx);
  n &= 0xffff;
  if (!snd.effectPlaying(n)) return;
  for (let k = 6; !snd.done(n);) {
    yield* textTask(sub); k++;
    yield* tick(sub);
    if ((k & 0xffff) >= 0x259) break;
  }
  snd.clearDone(n);
}

// 0x36 0x80020d78 bankSe(u8 bank, u16 id): the variant set, then the effect played (as
// bank·1000 + id when it is numbered per bank); 0xffff = none. Ends the frame only while quiet.
HANDLERS[0x36] = function* (ctx) {
  const { m } = ctx, o = operand(m), bank = o.u8(), id = o.u16(), sp = ctx.sp - 0x28, snd = sound(ctx);
  if (quiet(m)) { endFrame(m); return; }
  if (id === 0xffff) return;
  if (!perBank(ctx, id)) { snd.setVariant(bank, id, sp); snd.play(id, 0, sp); return; }
  snd.setVariant(bank, id, sp);
  if (perBank(ctx, id)) snd.play((id + 1000 * bank) & 0xffff, 0, sp);
};
