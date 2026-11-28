// 0x800353b8, the game's frame flip: build this frame's ordering table from the sprite and
// box layers, wait for the GPU and the vertical blank, swap the display buffers and send the
// table. ctx = { m, sp, gs } as in sprites.js. Written as a generator: it yields once at the
// vertical blank (VSync(0)), and the caller resumes it with VSync's return value, so the same
// code runs inside the browser's frame loop and on the verification oracle.
import { sortSprites, sortBoxes, sortOverlays } from "./sprites.js";

const WORK = 0x801d6ee0, WORK_SIZE = 0xc000, OTS = 0x801d5600, OT_SIZE = 20;
const OT = 0x80079468, VSYNC_RESULT = 0x80079274, FLIP_PENDING = 0x80079264;

export function* frameFlip(ctx) {
  const { m, gs } = ctx, inner = { ...ctx, sp: (ctx.sp - 0x20) >>> 0 };
  const buf = gs.GsGetActiveBuff();
  gs.GsSetWorkBase(WORK + buf * WORK_SIZE);
  const ot = OTS + buf * OT_SIZE;
  gs.GsClearOt(0, 0, ot);
  m.write(OT, ot, 4);
  sortSprites(inner); sortBoxes(inner); sortOverlays(inner);
  gs.DrawSync(0);
  m.write(VSYNC_RESULT, (yield 0) | 0, 4); // VSync(0)
  gs.ResetGraph(1);
  gs.GsSwapDispBuff();
  gs.GsSortClear(0, 0, 0, ot);
  gs.GsDrawOt(ot);
  m.write(FLIP_PENDING, 0, 4);
}
