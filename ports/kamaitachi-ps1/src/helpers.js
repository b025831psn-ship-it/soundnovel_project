// Small routines shared by the scenario commands, the text task and the screen code.
//   0x8003a67c textSpeedReset()  0x8003a6e4 textSpeed(v): both wait counters of the
//                                current text window (0x800794b0/0x800794b8) = v (8)
//   0x8003bc3c spriteFree(id)    0x8001c8e0 setVar(i, v)      0x80040e90 gp[0x1e0] = v
//   0x8003704c* waitText()       text frames while gp[0x10c] (a text window is busy)
//   0x800371fc resetStream()     0x80033868 anyRoute(): 0x8008cdc0[0] != 0xff
//   0x80019684 markSeen(id, k)   0x801d6110[id] |= 3 << 2k
//   0x8002cbc0* waitFade(k)      frames until fade channel k reaches its target
//   0x8002f3c0 dropOverlay()     sprite 0x801f66a8 freed
// (* generators: they wait frames)
import { tick, tickText } from "./tick.js";

const GP = 0x8007913c, WINDOW = 0x800792a7, SPRITES = 0x801eef68, IDS = 0x801f6698;

export function textSpeed(m, v) { const i = m.read(WINDOW, 1); m.write(0x800794b0 + 2 * i, v, 2); m.write(0x800794b8 + 2 * i, v, 2); }
export const textSpeedReset = (m) => textSpeed(m, 8);
export function spriteFree(m, id) { m.write(SPRITES + ((id << 16) >> 16) * 72, 0x80000000, 4); }
export function setVar(m, i, v) { m.write(0x80079558 + (i & 0xff), v, 1); }
export function setGp1e0(m, v) { m.write(GP + 0x1e0, v, 2); }
export function* waitText(ctx) { while (ctx.m.read(GP + 0x10c, 1)) yield* tickText({ ...ctx, sp: ctx.sp - 0x18 }, 1); }
export function resetStream(m) { // the loop in the original ends after entry 0
  m.write(GP + 0x118, 0xffffffff, 4); m.write(GP + 0x11c, 0xffff, 2); m.write(GP + 0x120, 0, 4);
  m.write(0x801d58f8, 0, 1); m.write(0x801d58f8 + 0xc, 0xffff, 2); m.write(0x801d58f8 + 8, 0xffffffff, 4);
}
export const anyRoute = (m) => (m.read(0x8008cdc0, 1) !== 0xff ? 1 : 0); // the loop in the original checks entry 0 only
export function markSeen(m, id, k) {
  const bits = [3, 0xc, 0x30, 0xc0][k & 0xff];
  if (bits === undefined) return;
  const p = 0x801d6110 + (id & 0xffff);
  m.write(p, m.read(p, 1) | bits, 1);
}
export function* waitFade(ctx, k) {
  const { m } = ctx, a = 0x801f7500 + 4 * (k & 0xff), b = 0x801fdf98 + 4 * (k & 0xff), sub = { ...ctx, sp: ctx.sp - 0x20 };
  while (m.read(a, 4) !== m.read(b, 4)) yield* tick(sub);
  yield* tick(sub);
}
export function dropOverlay(m) { const id = m.read(IDS + 0x10, 2); if (id) { spriteFree(m, id); m.write(IDS + 0x10, 0, 2); } }
