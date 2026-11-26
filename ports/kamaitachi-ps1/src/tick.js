// The game's per-frame update, ported from the tick routines the main loop and the scenario
// handlers call once per displayed frame. Each is a generator: the frame flip (frame.js)
// yields where the original waits for VSync. ctx = { m, sp, gs, call, padState }.
//   0x80013f34 tick()          everything, then the frame step
//   0x80013ff0 tickQuiet()     no scenario clear, sound or frame step (used while loading)
//   0x80014050 tickStill()     also no picture animation
//   0x800140a8 tickText(n)     n frames of textTask + tick
//   0x80014198 ticks(n)        n frames of tick
// The frame step 0x80079278 (frames per update, 1..2) follows the VSync count of the last
// flip (0x80079274, in hblanks: 260 per frame). Sound's per-frame routine 0x80029008 goes
// through ctx.call (the sound module in the browser).
import { fadeTick } from "./screen/fader.js";
import { inputTick } from "./input.js";
import { clearTick } from "./screen/clear.js";
import { animTick } from "./screen/anim.js";
import { weatherTick } from "./screen/weather.js";
import { waveTick } from "./screen/wave.js";
import { cdTick } from "./cd.js";
import { shakeTick } from "./screen/shake.js";
import { frameFlip } from "./screen/frame.js";
import { textTask } from "./text/text.js";

const VSYNC_RESULT = 0x80079274, FRAME_STEP = 0x80079278;

export function frameStep(m) {
  const v = Math.trunc((m.read(VSYNC_RESULT, 4) | 0) / 260) + 1;
  m.write(FRAME_STEP, (v >= 3 ? 2 : v) >>> 0, 4);
}

export function* body(ctx, { clear = true, sound = true, anim = true, shakeFirst = false } = {}) {
  const { m } = ctx;
  fadeTick(m);
  inputTick(ctx);
  if (clear) clearTick(ctx);
  if (sound) ctx.call(0x80029008, [], ctx.sp);
  if (anim) animTick(ctx);
  weatherTick(ctx);
  if (shakeFirst) shakeTick(ctx);
  waveTick(ctx);
  cdTick(ctx);
  if (!shakeFirst) shakeTick(ctx);
  yield* frameFlip(ctx);
}
export const frame = (ctx, size) => ({ ...ctx, sp: ctx.sp - size });

export function* tick(ctx) { yield* body(frame(ctx, 0x18)); frameStep(ctx.m); }
export function* tickQuiet(ctx) { yield* body(frame(ctx, 0x18), { clear: false, sound: false, shakeFirst: true }); }
export function* tickStill(ctx) { yield* body(frame(ctx, 0x18), { clear: false, sound: false, anim: false, shakeFirst: true }); }
export function* tickText(ctx, n) {
  const f = frame(ctx, 0x18);
  for (; (n << 16) >> 16; n--) { textTask(f); yield* body(f); frameStep(ctx.m); }
}
export function* ticks(ctx, n) {
  const f = frame(ctx, 0x20);
  for (; (n << 16) >> 16; n--) { yield* body(f); frameStep(ctx.m); }
}
