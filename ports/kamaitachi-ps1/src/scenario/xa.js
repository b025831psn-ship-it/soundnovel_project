// Scenario command 0x5a (0x80022f64) and the CD-XA player 0x80034ed4: the gold bookmark's
// voice drama. The drive streams the sectors (libcd.js with an XaStream, ../xa.js); the game
// waits for the length in its table, or until START (pad bit 0x800) stops it.
//   0x5a(u8 k): 0x8007955c = 0; xaPlay(k) == 0 (stopped) → 0x8007955c = 1
//   table 0x8006afbc + 44·k: +0 name (char*), +4 channel, +8 minutes, +0xc seconds into the
//   file (150 sectors a second: 8 interleaved channels at double speed), +0x10 length in
//   seconds, +0x14 the CdlFILE CdSearchFile fills.
import { HANDLERS } from "./interp.js";
import { operand } from "./lib.js";
import { tick } from "../tick.js";
import { soundReset } from "../sound-reset.js";
import { inputTick } from "../input.js";
import { sound } from "../sound-bridge.js";
import { libcd } from "../libcd.js";

const SKIP = 0x80079295, NO_EFFECTS = 0x800792a0, STOPPED = 0x8007955c, TABLE = 0x8006afbc, TIMER = 0x80079268;
const STEREO = 0x800792c5, PAD = 0x801eef40;
const endFrame = (m) => m.write(0x8007913c + 0x15c, 1, 1);

HANDLERS[0x5a] = function* (ctx) {
  const { m } = ctx, k = operand(m).u8();
  if (m.read(SKIP, 1) === 1 || m.read(NO_EFFECTS, 1) === 1) { endFrame(m); return; }
  m.write(STOPPED, 0, 1);
  if (!(yield* xaPlay({ ...ctx, sp: ctx.sp - 0x18 }, k))) m.write(STOPPED, 1, 1);
};

export function* xaPlay(ctx, k) { // 0x80034ed4
  const { m } = ctx, sp = ctx.sp - 0x48, sub = { ...ctx, sp }, cd = libcd(sub), snd = sound(sub);
  const r32 = (a) => m.read(a, 4) >>> 0, w8 = (a, v) => m.write(a, v, 1);
  yield* soundReset(sub);
  snd.lib(0x800585b8, [0, 0, 1], sp); // SsSetSerialAttr(CD, mix, on)
  snd.lib(0x80058db8, [0, 0x7f, 0x7f], sp); // SsSetSerialVol(CD, 0x7f, 0x7f)
  cd.xa?.setVolume?.(0x7f, 0x7f);
  const e = TABLE + 44 * (k & 0xff), file = e + 0x14;
  while (!cd.CdSearchFile(file, r32(e))) { /* the original retries until the drive finds it */ }
  const lba = cd.CdPosToInt(file) + 9000 * r32(e + 8) + 150 * r32(e + 0xc);
  cd.CdIntToPos(lba, file);
  w8(sp + 0x20, 1); w8(sp + 0x21, m.read(e + 4, 1)); // CdlFILTER { file 1, channel }
  cd.CdControlB(0x0d, sp + 0x20, sp + 0x18);
  w8(sp + 0x10, 0xc9); // double speed, XA-ADPCM, filter, CD-DA
  cd.CdControlB(0x0e, sp + 0x10, 0);
  cd.CdSync(1, sp + 0x18);
  for (let i = 0; i < 3; i++) yield; // VSync(3)
  cd.CdControlB(0x1b, file, 0); // ReadS
  const frames = r32(e + 0x10) * 60 + 1;
  const att = m.read(STEREO, 1) ? [0x80, 0, 0x80, 0] : [0x80, 0x80, 0x80, 0x80]; // mono: both sides to both
  for (let i = 0; i < 4; i++) w8(sp + 0x28 + i, att[i]);
  cd.CdFlush(sp + 0x28); // CdMix
  m.write(TIMER, 0, 4);
  let done = 1;
  for (;;) {
    if ((m.read(TIMER, 4) | 0) >= frames) { cd.CdControlB(8, 0, 0); break; }
    if (r32(PAD) & 0x800) { cd.CdControlB(8, 0, 0); done = 0; break; }
    yield* tick(sub);
  }
  yield* tick(sub);
  inputTick(sub);
  return done;
}
