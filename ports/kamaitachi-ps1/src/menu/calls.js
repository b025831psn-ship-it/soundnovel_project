// The routines the translated menu code (translated.js) calls, by their original address:
// the translated ones themselves, and the game's routines already ported elsewhere, each called
// with the caller's sp and with its stack arguments read where the original leaves them
// (sp + 0x10 onwards). call() returns [v0, v1]; generators (frame waits) are run with yield*.
import { TRANSLATED } from "./translated.js";
import { tick, tickQuiet, ticks, tickText } from "../tick.js";
import { newGame, titlePicture, animInit, textInit, storyMovie, systemReset, routeReset, textStrings, firstScenario, bufferAliases, bufferInit, bzero } from "../init.js";
import { setVar, savePoint, dropLayer, dropPicture, waitFade, waitText, choiceColoursReset, textWindowReset, snapshot } from "../helpers.js";
import { inputTick } from "../input.js";
import { sound } from "../sound-bridge.js";
import { soundReset } from "../sound-reset.js";
import { fadeIn, fadeOut, fadeLevel, fadeStep, windowPalette } from "../screen/fader.js";
import { cdLoad, cdLoadAsync } from "../cd-load.js";
import { fillText, textTask } from "../text/text.js";
import { drawGlyph } from "../text/glyph.js";
import { textBox, clearTextPage, drawString, special, cursorBox } from "../title.js";
import { spritePage, addBox, spriteClearAll } from "../screen/sprites.js";
import { uploadPicture, loadPicture, drawSdw } from "../screen/picture.js";
import { animStart, animLoad } from "../screen/anim.js";
import { animStop, checkpoint } from "../scenario/lib.js";
import { showPicture } from "../scenario/basic.js";
import { effect, loadClutSlot } from "../screen/weather.js";
import { setName } from "../name-entry.js";

const arg = (ctx, k) => ctx.m.read((ctx.sp + 0x10 + 4 * k) >>> 0, 4) | 0; // stack argument k (5th = 0)
const unported = (addr) => { throw new Error(`menu: path at 0x${addr.toString(16)} is not ported`); };

const PORTED = {
  0x80013f34: (c) => tick(c),
  0x80013ff0: (c) => tickQuiet(c),
  0x800140a8: (c, a0) => tickText(c, a0),
  0x8001c8e0: (c, a0, a1) => setVar(c.m, a0, a1),
  0x800332b0: (c) => systemReset(c.m),
  0x80033420: (c, a0) => routeReset(c.m, a0),
  0x80034180: (c, a0) => storyMovie(c, a0),
  0x80036ea0: (c, a0, a1, a2) => cdLoadAsync(c, a0, a1 >>> 0, a2),
  0x8003ab98: (c) => textStrings(c.m),
  0x8003abec: (c, a0, a1) => loadClutSlot(c, a0 >>> 0, a1),
  0x8003a744: (c, a0, a1) => setName(c.m, a0, a1 >>> 0),
  0x8001c5bc: (c) => firstScenario(c),
  0x8001cde4: (c, a0, a1) => showPicture(c, a0, a1),
  0x8001f690: (c) => windowPalette(c),
  0x8002c5a0: (c) => fadeStep(c.m),
  0x800325b0: (c) => savePoint(c.m),
  0x8003276c: (c) => checkpoint(c.m),
  0x800340d4: (c) => bufferAliases(c.m),
  0x80037250: (c) => bufferInit(c.m),
  0x8003b7ec: (c) => spriteClearAll(c),
  0x80044bc0: (c, a0, a1) => bzero(c.m, a0 >>> 0, a1),
  0x80026534: (c, a0, a1) => sound(c).setVariant(a0, a1, c.sp),
  0x80028334: (c, a0) => sound(c).fadeMusic(a0, c.sp),
  0x800292b0: (c, a0, a1) => sound(c).play(a0, a1, c.sp),
  0x8003b398: (c, a0, a1, a2, a3) => drawSdw(c, a0, a1 >>> 0, a2 >>> 0, a3),
  0x8003cfa4: (c, a0) => animLoad(c, a0),
  0x80014198: (c, a0) => ticks(c, a0),
  0x8001544c: (c, a0, a1, a2, a3) => cursorBox(c, a0, a1, a2, a3, arg(c, 0), arg(c, 1), arg(c, 2)),
  0x80029b34: () => unported(0x80029b34), // memory-card errors (the machine's card never reports one)
  0x80032120: (c, a0) => snapshot(c.m, a0),
  0x8003afc8: (c, a0, a1) => loadPicture(c, a0, a1),
  0x8001c478: (c) => newGame(c),
  0x8001d080: (c, a0, a1) => titlePicture(c, a0, a1),
  0x8001db2c: (c, a0) => dropLayer(c.m, a0),
  0x8001fd1c: (c, a0) => dropPicture(c.m, a0),
  0x80025440: (c) => inputTick(c),
  0x80028228: (c) => sound(c).closeMusic(c.sp),
  0x80028c74: (c, a0) => sound(c).playUi(a0, c.sp),
  0x80028ccc: (c) => soundReset(c),
  0x8002c6e4: (c, a0, a1) => fadeIn(c.m, a0, a1),
  0x8002ca08: (c, a0, a1) => fadeOut(c.m, a0, a1),
  0x8002cae0: (c, a0, a1) => fadeLevel(c.m, a0, a1),
  0x8002cbc0: (c, a0) => waitFade(c, a0),
  0x800369f8: (c, a0, a1, a2) => cdLoad(c, a0, a1, a2),
  0x8003704c: (c) => waitText(c),
  0x80037604: (c, a0, a1, a2, a3) => fillText(c, c.sp, a0, a1, a2, a3, arg(c, 0)),
  0x80037784: (c, a0, a1, a2, a3) => textBox(c, a0, a1, a2, a3, arg(c, 0)),
  0x80037a0c: (c) => clearTextPage(c),
  0x80037b08: (c) => choiceColoursReset(c),
  0x80037c1c: (c) => textWindowReset(c),
  0x800380ec: (c, a0, a1, a2) => drawGlyph(c, a0, a1, a2),
  0x80038658: (c, a0, a1, a2, a3) => drawString(c, a0, a1, a2 >>> 0, a3),
  0x80039288: (c) => textTask(c),
  0x8003a91c: (c) => textInit(c),
  0x8003b87c: (c, a0, a1, a2, a3) => spritePage(c, a0, a1, a2, a3, arg(c, 0)),
  0x8003c86c: (c, a0, a1, a2, a3) => addBox(c, a0, a1, a2, a3, arg(c, 0), arg(c, 1), arg(c, 2), arg(c, 3) >>> 0, arg(c, 4)),
  0x8003cbb8: (c, a0, a1, a2) => uploadPicture(c, a0, a1, a2),
  0x8003cee0: (c) => animInit(c.m),
  0x8003cf28: (c) => animStop(c.m),
  0x8003d498: (c, a0, a1, a2, a3) => animStart(c, a0, a1, a2, a3, arg(c, 0)),
  0x800418d0: (c, a0) => effect(c, a0),
  0x80044384: (c, a0) => special(c, a0),
  0x800492b4: (c, a0) => c.gs.DrawSync(a0),
  0x80049560: (c, a0, a1) => c.gs.LoadImage(a0 >>> 0, a1 >>> 0),
  // memory-card library (libcard / BIOS): native on the oracle, served by the machine
  ...Object.fromEntries([0x800624b4, 0x80062504, 0x80062544, 0x80062798, 0x80062fa0, 0x80063240, 0x80063748, 0x80063864, 0x80063a6c, 0x80063c28]
    .map((a) => [a, (c, a0, a1, a2, a3) => c.call(a, [a0, a1, a2, a3, arg(c, 0)], c.sp)])),
  0x80059cd8: (c, a0, a1, a2, a3) => sound(c).keyOn(a0, a1, a2, a3, arg(c, 0), arg(c, 1), arg(c, 2), c.sp), // SsUtKeyOn
  0x8005e088: (c) => sound(c).lib(0x8005e088, [], c.sp),
  0x8005e098: (c) => sound(c).lib(0x8005e098, [], c.sp),
};

export function* call(ctx, sp, addr, a0, a1, a2, a3) {
  const f = TRANSLATED[addr] ?? PORTED[addr];
  if (!f) unported(addr);
  let r = f({ ...ctx, sp }, a0 | 0, a1 | 0, a2 | 0, a3 | 0);
  if (r && typeof r.next === "function") r = yield* r;
  return Array.isArray(r) ? r : [typeof r === "number" ? r | 0 : 0, 0];
}

// MIPS mult / multu / div / divu: [hi, lo] as int32.
export function mult(a, b, signed) {
  const p = signed ? BigInt(a | 0) * BigInt(b | 0) : BigInt(a >>> 0) * BigInt(b >>> 0);
  return [Number(BigInt.asIntN(32, p >> 32n)), Number(BigInt.asIntN(32, p))];
}
export function div(a, b, signed) {
  if (signed) { a |= 0; b |= 0; if (b === 0) return [a, a >= 0 ? -1 : 1]; if (a === -0x80000000 && b === -1) return [0, a]; return [(a % b) | 0, (a / b) | 0]; }
  a >>>= 0; b >>>= 0; if (b === 0) return [a | 0, -1]; return [(a % b) | 0, Math.floor(a / b) | 0];
}
