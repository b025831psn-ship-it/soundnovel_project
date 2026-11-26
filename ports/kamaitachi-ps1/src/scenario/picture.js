// Scenario commands for silhouettes and the screen.
//   0x29 0x8001fbc0 silhouette(u8 hi, u16 lo)  SDW member hi·256+lo: load (PAC 4) to
//                   0x80079484, draw into the picture buffer (0x8003b398 mode 3), remember
//                   it in the 4-entry ring 0x80079450 (index 0x80079284)
//   0x2b 0x8001febc 0x8002cae0(u8, min(u16, 0xff))
//   0x2c 0x8001ff68 clear the screen now (screen/clear.js)
//   0x2e 0x800203d0 reveal(u8 a, u8 b)  after a silhouette change: upload the picture at once
//                   (a = 0 or b = 0x7f) or in 8 steps 2 frames apart (0x8003cbb8 step 1..8)
//   0x2d 0x800202b8 unsilhouette(u8 hi, u16 lo): draw mode 2, forget it
import { fadeLevel, windowPalette } from "../screen/fader.js";
import { uploadPicture } from "../screen/picture.js";
import { HANDLERS } from "./interp.js";
import { io, operand, unported } from "./lib.js";
import { clearScreen } from "../screen/clear.js";
import { pictureSprite } from "./basic.js";
import { ticks } from "../tick.js";

const SKIP = 0x80079295, NO_EFFECTS = 0x800792a0, SDW_BUF = 0x80079484, PICTURE = 0x80079440, RING = 0x80079450, RING_AT = 0x80079284;
const endFrame = (m) => m.write(0x8007913c + 0x15c, 1, 1);
const quiet = (m) => m.read(SKIP, 1) === 1 || m.read(NO_EFFECTS, 1) === 1;

HANDLERS[0x29] = function* (ctx) {
  const { m } = ctx, { r8, r16, r32, w8, w16 } = io(m), o = operand(m), hi = o.u8(), lo = o.u16(), sp = ctx.sp - 0x18;
  if (quiet(m)) { endFrame(m); return; }
  const id = (lo + hi * 256) & 0xffff;
  if (m.read(0x8007913c + 1, 1)) unported(0x8001fc60); // a clear is pending
  const k = r8(RING_AT);
  w8(RING_AT, (k + 1) & 3); w16(RING + 2 * k, id);
  ctx.call(0x800369f8, [4, r32(SDW_BUF), id], sp);
  ctx.call(0x8003b398, [0x18, r32(SDW_BUF), r32(PICTURE), 3], sp);
  windowPalette({ ...ctx, sp }); windowPalette({ ...ctx, sp });
};

HANDLERS[0x2b] = function* (ctx) {
  const { m } = ctx, o = operand(m), v = o.u16(), k = o.u8();
  if (!quiet(m)) fadeLevel(m, k, v < 0x100 ? v : 0xff);
  endFrame(m);
};

HANDLERS[0x2c] = function* (ctx) {
  const { m } = ctx;
  if (!quiet(m)) clearScreen({ ...ctx, sp: ctx.sp - 0x18 });
  endFrame(m);
};

HANDLERS[0x2d] = function* (ctx) {
  const { m } = ctx, { r16, r32, w8, w16 } = io(m), o = operand(m), hi = o.u8(), lo = o.u16(), sp = ctx.sp - 0x20;
  if (quiet(m)) { endFrame(m); return; }
  const id = (lo + hi * 256) & 0xffff;
  ctx.call(0x800369f8, [4, r32(SDW_BUF), id], sp);
  ctx.call(0x8003b398, [0x18, r32(SDW_BUF), r32(PICTURE), 2], sp);
  w8(0x800792b2, 1);
  for (let j = 0; j < 4; j++) if (((r16(RING + 2 * j) << 16) >> 16) === id) w16(RING + 2 * j, 0xffff);
};

HANDLERS[0x2e] = function* (ctx) {
  const { m } = ctx, o = operand(m), a = o.u8(), b = o.u8(), sp = ctx.sp - 0x30;
  if (m.read(SKIP, 1) === 1) { endFrame(m); return; }
  if (m.read(NO_EFFECTS, 1) === 1) unported(0x80020448);
  windowPalette({ ...ctx, sp });
  if (!m.read(0x800792b2, 1)) return;
  const pic = m.read(PICTURE, 4) >>> 0;
  if (!a || b === 0x7f) { uploadPicture({ ...ctx, sp }, 0x18, pic, 0); pictureSprite(ctx, sp); windowPalette({ ...ctx, sp }); return; }
  for (let i = 0; i < 8; i++) {
    uploadPicture({ ...ctx, sp }, 0x18, m.read(PICTURE, 4) >>> 0, i + 1);
    pictureSprite(ctx, sp);
    windowPalette({ ...ctx, sp });
    yield* ticks({ ...ctx, sp }, 2);
  }
};
