// The game's main loop, 0x80014314 from its loop head 0x8001443c: each frame it lets auto
// mode be cancelled by a button (0x821 = circle/cross/start... held while auto mode is on),
// runs the text task once per elapsed frame, one step of the scenario interpreter
// (scenario/interp.js), then the per-frame update and the frame step.
// ctx.sp is the main routine's own frame.
import { body, frameStep } from "./tick.js";
import { textTask } from "./text/text.js";
import { step } from "./scenario/interp.js";
import { menu } from "./menu.js";
import "./scenario/flow.js";
import "./scenario/basic.js";
import "./scenario/picture.js";
import "./scenario/sound.js";
import "./scenario/xa.js";
import "./scenario/state.js";
import "./scenario/prefetch.js";
import "./scenario/choice.js";
import "./scenario/card-ops.js";

const AUTO = 0x800792c6, PAD_HELD = 0x801eef40, BLOCK = 0x800792a4, FRAME_STEP = 0x80079278;

export function* mainLoop(ctx) {
  const { m } = ctx;
  for (;;) {
    if (m.read(AUTO, 1) === 1) { if (m.read(PAD_HELD, 4) & 0x821) m.write(BLOCK, 1, 1); }
    else if (m.read(0x8007929e, 1) && !m.read(0x800792a0, 1)) { yield* menu(ctx); m.write(0x800792a3, 0, 1); }
    const n = m.read(FRAME_STEP, 4) | 0;
    for (let i = 0; (i & 0xffff) < n; i++) yield* textTask(ctx);
    yield* step(ctx);
    yield* body(ctx);
    frameStep(m);
  }
}
