// The title screen and the special scenes of scenario command 0x1d, ported from the game's
// own routines (RAM level, original addresses). Generators yield one frame (VSync(0)).
//   0x80044384 special(k)        0x6c cases (jump table 0x800129dc); case 0 is the title
//   0x8001b694 title()           the title menu: three options, a 0x4b0-frame timeout
//   0x80016078 startMenu()       the start menu after the first option (memory-card checks)
//   0x8002bd1c cardCheck(k)      0x80015fa8 cardMessage(k)  0x8002a9f8 / 0x8002a320 yes/no box
//   0x80038658 drawString(x, y, s, step)  SJIS text with c0-c7 / n1 n2 / s8 ss / rr codes
//   0x80037a0c clearTextPage()   0x8003a90c setPalette(k)
//   0x8001544c cursorBox(...)    a glowing box: four darker rims and the colour (0x8003c86c)
//   0x80037784 textBox(...)      fill the text page in rows of 4 (0x80037604)
// Memory-card library calls (0x80062544 _card_info, 0x80062798 _card_load, 0x80063748
// _card_wait) go through ctx.call: native on the oracle, served by the machine in the browser.
// Paths the original takes that are not ported throw with their address.
import { offer, withdraw, box } from "./touch.js";
import { nameEntry } from "./name-entry.js";
import { setVar, waitText, waitFade, dropLayer, dropPicture } from "./helpers.js";
import { fadeOut, fadeIn, fadeLevel } from "./screen/fader.js";
import { addBox } from "./screen/sprites.js";
import { tick, ticks } from "./tick.js";
import { textTask, fillText } from "./text/text.js";
import { drawGlyph } from "./text/glyph.js";
import { josa, lastGlyph } from "./text/josa.js";
import { cdLoadAsync } from "./cd-load.js";
import { titlePicture, animInit, textSlotsReset, systemReset, routeReset } from "./init.js";
import { inputClear, inputTick } from "./input.js";
import { sound } from "./sound-bridge.js";
import { title as translatedTitle } from "./menu/translated.js";
import { specialSwitch } from "./scenario/special-translated.js";

const GP = 0x8007913c, PAD = 0x801eef40, SE = 0x801eef50, CARD_SLOT = 0x800792c3, CARD_CMD = 0x80079524;
const unported = (addr) => { throw new Error(`title: path at 0x${addr.toString(16)} is not ported`); };
const s8 = (v) => (v << 24) >> 24, s16 = (v) => (v << 16) >> 16;
const be16 = (m, p) => { const h = m.read(p, 1) << 8; return h ? h | m.read(p + 1, 1) : 0; };

export function clearTextPage(ctx) { // 0x80037a0c
  const { m } = ctx, rect = ctx.sp - 0x20 + 0x10, page = m.read(0x800792ca, 1);
  m.write(rect + 2, page < 0x10 ? 0 : 0x100, 2);
  m.write(rect + 4, 0xa0, 2); m.write(rect + 6, 0xf0, 2);
  m.write(rect, (page & 0xf) << 6, 2);
  ctx.gs.ClearImage(rect, 0, 0, 0);
}
export const setPalette = (m, k) => m.write(GP + 0x1a0, k + 8, 1); // 0x8003a90c

export function drawString(ctx, x, y, str, step) { // 0x80038658
  const { m } = ctx, sp = ctx.sp - 0x30, sub = { ...ctx, sp }, left = x, STRINGS = 0x8006b030;
  // Korean: the particle after a name follows the name (text/josa.js); `name` is the last glyph of a name just drawn
  let name = m.ko?.josa?.join.has(str >>> 0) ? lastGlyph(m, m.read(STRINGS + 4, 4) >>> 0) : 0;
  str = m.ko?.moved.get(str >>> 0) ?? str; // Korean: a string that did not fit its place
  step &= 0xff;
  const advance = () => { x = step ? x + step : x + 1 + m.read(GP + 0x19e, 1); };
  for (;;) {
    const c = be16(m, str);
    if (!c) break;
    if (c >= 0x6330 && c <= 0x6337) { m.write(GP + 0x1a0, c - 0x6330 + 8, 1); str += 2; continue; }
    if (c === 0x6e31 || c === 0x6e32) { // n1 / n2: insert string 1 / 2
      let s = m.read(STRINGS + 4 * (c - 0x6e30), 4) >>> 0;
      while (be16(m, s)) { ctx.gs.DrawSync(0); const g = be16(m, s); s += 2; drawGlyph(sub, x, y, g); advance(); }
      ctx.gs.DrawSync(0);
      m.write(0x80079610, x, 2); x = m.read(0x80079610, 2);
      m.write(0x80079612, y, 2); y = m.read(0x80079612, 2);
      str += 2; if (m.ko?.josa) name = lastGlyph(m, m.read(STRINGS + 4 * (c - 0x6e30), 4) >>> 0);
      continue;
    }
    if (name && c !== 0x8140) { // Korean: the first glyph after the name
      const fix = josa(m, name, c, be16(m, str + 2)); name = 0;
      if (fix) { str += 2 * fix.skip; for (const g of fix.emit) { ctx.gs.DrawSync(0); drawGlyph(sub, x, y, g); advance(); } continue; }
    }
    if (c === 0x7338) { x += 8; str += 2; continue; }
    if (c === 0x7373) { x += 0x10; str += 2; continue; }
    if (c === 0x7272) { x = left; y += 0x10; str += 2; continue; }
    ctx.gs.DrawSync(0);
    str += 2; drawGlyph(sub, x, y, c); advance();
  }
  ctx.gs.DrawSync(0);
  m.write(0x80079610, x, 2); m.write(0x80079612, y, 2);
}

export function cursorBox(ctx, x, y, w, h, r, g, b) { // 0x8001544c
  const { m } = ctx, sub = { ...ctx, sp: ctx.sp - 0x60 }, t = (m.read(0x80079260, 4) | 0) >> 2;
  const k = m.read(0x800680b0 + (t - Math.trunc(t / 8) * 8), 1), k2 = 2 * k;
  r &= 0xff; g &= 0xff; b &= 0xff;
  const R = 51 * r, G = 51 * g, B = 51 * b;
  const box = (d, e, cr, cg, cb, attr) => addBox(sub, (x + d) & 0xffff, (y + d) & 0xffff, (w - e) & 0xffff, (h - e) & 0xffff, cr, cg, cb, attr, 3);
  box(k - 4, k2 - 8, R >>> 8, G >>> 8, B >>> 8, 0x50000000);
  box(k - 3, k2 - 6, R >>> 7, G >>> 7, B >>> 7, 0x50000000);
  box(k - 2, k2 - 4, (153 * r >> 8) & 0xff, (153 * g >> 8) & 0xff, (153 * b >> 8) & 0xff, 0x50000000);
  box(k - 1, k2 - 2, (R >>> 6) & 0xff, (G >>> 6) & 0xff, (B >>> 6) & 0xff, 0x50000000);
  box(k, k2, r, g, b, 0);
}
const plainBox = (ctx, x, y, w, h, attr) => addBox({ ...ctx, sp: ctx.sp }, x, y, w, h, 0xa0, 0x64, 0x28, attr, 3);

export function textBox(ctx, x, y, w, h, colour) { // 0x80037784
  const sp = ctx.sp - 0x40;
  h = s16(h); if (h < 0) unported(0x800377d0);
  const rows = (h >>> 2) & 0xff; let i = 0;
  for (; i < rows; i++) { ctx.gs.DrawSync(0); fillText(ctx, sp, s16(x), s16(y + 4 * i), s16(w), 4, colour & 0xff); }
  ctx.gs.DrawSync(0);
  fillText(ctx, sp, s16(x), s16(y + 4 * i), s16(w), s16(h - (h >> 2 << 2)), colour & 0xff);
}

// ---- memory card ----
function cardWait(ctx, sp, at) { // _card_wait(0, &cmd, &result) and the error codes the callers test
  const res = sp + 0x10;
  ctx.call(0x80063748, [0, CARD_CMD, res], sp);
  const v = ctx.m.read(res, 4) >>> 0;
  if ((v & 0xf) === 3) unported(at.newCard);
  return v;
}
export function cardInfo(ctx, slot) { // 0x80029a6c / 0x80029ad0 (slot = 0x10 · port)
  const sp = ctx.sp - 0x20;
  ctx.call(0x80062544, [slot], sp);
  ctx.call(0x80063748, [0, CARD_CMD, sp + 0x10], sp);
  if ((ctx.m.read(sp + 0x10, 4) & 0xf) === 3) ctx.m.write(0x80079285, 1, 1); // a new card
  return 1;
}
export function cardLoad(ctx) { // 0x800298e4
  const sp = ctx.sp - 0x20;
  ctx.call(0x80062798, [ctx.m.read(CARD_SLOT, 1) << 4], sp);
  const v = cardWait(ctx, sp, { newCard: 0x80029928 });
  if ((v & 0xf) === 2 || (v & 0xf) === 4) unported(0x80029948);
  return v;
}
export function* cardCheck(ctx, k) { // 0x8002bd1c: the three save files of the card checked
  const { m } = ctx, sp = ctx.sp - 0x50, sub = { ...ctx, sp };
  for (let i = 0; i < 3; i++) for (let j = 0; j < 0x1f00; j++) m.write(0x800abe90 + i * 0x1f00 + j, 0, 1);
  const wait = (at) => { ctx.call(0x80063748, [0, CARD_CMD, at], sp); return m.read(at, 4) >>> 0; };
  const info = (at) => { ctx.call(0x80062798, [m.read(CARD_SLOT, 1) << 4], sp); return wait(at); };
  for (;;) {
    let again = 0;
    for (let f = 0; f < 3; f++) {
      m.write(0x8006aecc + 0x13, f + 0x30, 1); // the file name's digit
      for (;;) {
        let v = info(sp + 0x18);
        if ((v & 0xf) === 3) m.write(0x80079285, 1, 1); // a new card
        if ((v & 0xf) === 2 || (v & 0xf) === 4) do { info(sp + 0x18); info(sp + 0x1c); } while ((m.read(sp + 0x18, 4) & 0xf) !== (m.read(sp + 0x1c, 4) & 0xf));
        v = m.read(sp + 0x18, 4) >>> 0; m.write(sp + 0x20, v, 4);
        if (m.read(0x80079285, 1) === 1) return -1;
        const t = v & 0xf;
        if (t === 2 || t === 4) unported(0x8002be9c); // 0x80029b34: card errors
        if (t === 1) { // no card: the message; "check again" goes on with the next file
          if (yield* cardMessage(sub, (k & 0xff) + 5)) return -1;
          again = 1; break;
        }
        if (t === 0 || t === 3) unported(0x8002befc); // the file read (_card_read 0x80062fa0)
      }
    }
    if (!again) return 0;
  }
}
export function* cardMessage(ctx, k) { // 0x80015fa8
  k &= 0xff;
  if (k >= 7) return 1;
  if (k !== 5) unported([0x80015fe4, 0x80015ff4, 0x80016004, 0x80016018, 0x80016038, 0x80016048, 0x80016050][k]);
  return (yield* noCardBox({ ...ctx, sp: ctx.sp - 0x18 }, 1)) & 0xff;
}
function* noCardBox(ctx, k) { // 0x8002a9f8
  const { m } = ctx, sp = ctx.sp - 0x18, sub = { ...ctx, sp };
  animInit(m); dropLayer(m, 2); clearTextPage(sub); yield* textTask(sub); yield* tick(sub);
  drawString(sub, 0x2c, 0x42, 0x800117f8, 0);
  m.write(0x80079518, yield* yesNo(sub, k), 1);
  return m.read(0x80079518, 1);
}
function keyOn(ctx, sp, se) { // SsUtKeyOn(vab, 0, 0, 0x30, 0, 0x32, 0x32) when the sound is loaded
  const vab = s16(ctx.m.read(se, 2));
  if (vab === -1) return;
  ctx.m.write(sp + 0x10, 0, 4); ctx.m.write(sp + 0x14, 0x32, 4); ctx.m.write(sp + 0x18, 0x32, 4);
  sound(ctx).keyOn(vab, 0, 0, 0x30, 0, 0x32, 0x32, sp);
}
export function* yesNo(ctx, k) { // 0x8002a320: cursor s (0 / 1), O / X
  const { m } = ctx, sp = ctx.sp - 0x50, sub = { ...ctx, sp }, r32 = (a) => m.read(a, 4) >>> 0;
  let s = 0;
  offer(ctx, [box(0, 0x3c, 0x7e, 0xc8, 0x1a), box(1, 0x3c, 0x98, 0xc8, 0x1a)], () => s & 0xff, ["up", "down"]);
  for (;;) {
    if (!(k & 0xff)) unported(0x8002a378);
    if ((r32(PAD) & 0x4000) && (s & 0xff) !== 1) { keyOn(ctx, sp, SE + 6); s++; }
    if ((r32(PAD) & 0x1000) && (s & 0xff)) { s--; keyOn(ctx, sp, SE + 6); }
    if (r32(PAD) & 0x21) {
      if (!(s & 0xff)) { keyOn(ctx, sp, SE); m.write(0x80079285, 1, 1); m.write(0x8007928a, 0, 1); break; }
      if ((s & 0xff) !== 1) unported(0x8002a5e0);
      keyOn(ctx, sp, SE); break;
    }
    if (r32(PAD) & 0x44) { keyOn(ctx, sp, SE + 2); s = 0; m.write(0x80079285, 1, 1); m.write(0x8007928a, 0, 1); break; }
    m.write(sp + 0x10, 0, 4);
    textBox(sub, 0x3c, 0x7c, 0xc8, 0x46, 0);
    const c = s & 0xff;
    drawGlyph(sub, 0x46, c * 26 + 0x84, 0x8484);
    setPalette(m, c ? 1 : 0); drawString(sub, 0x5f, 0x84, 0x80011714, 0);
    setPalette(m, c === 1 ? 0 : 1); drawString(sub, 0x5f, 0x9f, 0x8001172c, 0);
    setPalette(m, 0);
    plainBox(sub, 0x3c, 0x7c, 0xc8, 0x3e, 0x40000000);
    yield* textTask(sub); yield* tick(sub);
  }
  withdraw(ctx);
  clearTextPage(sub); yield* textTask(sub); yield* tick(sub); yield* textTask(sub); yield* tick(sub);
  m.write(0x80079282, s + 1, 1);
  return s & 0xff;
}

// ---- the menus ----
function* fadeAway(sub, k) { fadeOut(sub.m, 0x19, k); yield* waitFade(sub, k); dropLayer(sub.m, k); }

export function* startMenu(ctx) { // 0x80016078 (the path without a memory card)
  const { m } = ctx, sp = ctx.sp - 0x60, sub = { ...ctx, sp }, r8 = (a) => m.read(a, 1), r32 = (a) => m.read(a, 4) >>> 0, w8 = (a, v) => m.write(a, v, 1);
  const ui = (n) => sound(ctx).playUi(n, sp);
  m.write(sp + 0x2c, 1, 4);
  w8(0x80079282, 0); w8(0x8007928a, 0); w8(0x8007951e, 0);
  menu: for (;;) { // 0x800160cc
  clearTextPage(sub);
  w8(0x800792c4, 3);
  cardInfo(sub, r8(CARD_SLOT) ? 0x10 : 0);
  if (r8(0x80079282) !== 2) {
    drawString(sub, 0x32, 0x3c, 0x80010dd0, 0);
    const v = r8(0x800792c4);
    if (v === 1) w8(CARD_SLOT, 0);
    if (v === 2) w8(CARD_SLOT, 1);
    let s = r8(CARD_SLOT);
    m.write(sp + 0x30, 0, 1);
    offer(ctx, [box(0, 0x23, 0x59, 0x75, 0x12), box(1, 0xaa, 0x59, 0x75, 0x12)], () => s & 0xff, ["left", "right"]);
    for (;;) {
      for (const [i, x] of [[0, 0x23], [1, 0xaa]]) {
        if ((s & 0xff) === i) { m.write(sp + 0x10, 0x7f, 4); m.write(sp + 0x14, 0x7f, 4); m.write(sp + 0x18, 0x7f, 4); cursorBox(sub, x, 0x5a, 0x75, 0x10, 0x7f, 0x7f, 0x7f); }
        else plainBox(sub, x, 0x59, 0x75, 0x12, 0);
      }
      setPalette(m, (s & 0xff) ? 1 : 0); drawString(sub, 0x28, 0x5a, 0x80010df4, 0);
      setPalette(m, (s & 0xff) === 1 ? 0 : 1); drawString(sub, 0xaf, 0x5a, 0x80010e08, 0);
      setPalette(m, 0); yield* textTask(sub); yield* tick(sub);
      const pad = r32(PAD);
      if (pad & 0x2000) { if ((s & 0xff) !== 1) { ui(3); s++; } continue; }
      if (pad & 0x8000) { if (s & 0xff) { s--; ui(3); } continue; }
      if (pad & 0xa000) { m.write(GP + 0x18, 0xff, 1); continue; }
      if (pad & 0x44) unported(0x800176dc);
      if (!(pad & 0x21)) continue;
      const c = s & 0xff;
      if (s8(r8(GP + 0x18)) !== c) w8(0x80079285, 1);
      w8(CARD_SLOT, s); withdraw(ctx);
      clearTextPage(sub); yield* textTask(sub); ui(0); yield* ticks(sub, 2);
      cardInfo(sub, c ? 0x10 : 0);
      fadeOut(m, 1, 2); animInit(m); clearTextPage(sub); yield* textTask(sub);
      w8(0x80079285, 1);
      drawString(sub, 0x21, 0x46, 0x80010e1c, 0); drawString(sub, 0x64, 0x64, 0x80010e44, 0); drawString(sub, 0x4c, 0x78, 0x80010e58, 0);
      m.write(GP + 0x18, r8(CARD_SLOT), 1);
      yield* textTask(sub); yield* tick(sub); yield* ticks(sub, 2);
      systemReset(m); routeReset(m, 0); // 0x8003360c (its loop ends after record 0)
      if (r8(0x80079285) !== 1) unported(0x80016480);
      w8(0x80079285, 0); w8(0x80079518, 1);
      cardLoad(sub);
      w8(0x80079285, 0);
      if ((yield* cardCheck(sub, 0)) !== -1) unported(0x80016478);
      const r = r8(0x80079518);
      w8(0x80079285, 1);
      if (r === 0) { // 0x800177d8: back to the card choice unless the card was already taken
        if (r8(0x8007928a) && r8(0x80079285) !== 1) break menu;
        if (r8(sp + 0x30)) break menu;
        w8(0x8007928a, 0); continue menu;
      }
      if (r !== 1) unported(0x80016470);
      m.write(sp + 0x2c, 1, 4); w8(0x8007928a, 1);
      break;
    }
  }
  break;
  }
  animInit(m); fadeOut(m, 1, 2); clearTextPage(sub); inputTick(sub);
  return m.read(sp + 0x2c, 4) | 0;
}

export function* title(ctx) { // 0x8001b694
  const { m } = ctx, sp = ctx.sp - 0x40, sub = { ...ctx, sp }, r32 = (a) => m.read(a, 4) >>> 0;
  const ui = (n) => sound(ctx).playUi(n, sp);
  m.write(0x800792a5, 1, 1); m.write(0x8007929f, 0, 1);
  setVar(m, 0, 0);
  clearTextPage(sub);
  yield* cdLoadAsync(sub, 1, r32(0x80079484), 0x23f3);
  yield* waitText(sub);
  dropLayer(m, 1);
  yield* titlePicture(sub, 0x23f3, 0);
  yield* waitText(sub);
  fadeLevel(m, 1, 0x100);
  let s = 0, t = 1;
  const X = [0x1e, 0x7b, 0xd9];
  const rows = () => offer(ctx, X.map((x, i) => box(i, x, 0xb4, 0x40, 0x12)), () => s & 0xff, ["left", "right"]);
  rows();
  while ((t & 0xffff) < 0x4b0) {
    if ((r32(PAD) & 0x2000) && (s & 0xff) !== 2) { ui(3); s++; t = 0; }
    if ((r32(PAD) & 0x8000) && (s & 0xff)) { s--; ui(3); t = 0; }
    if (r32(PAD) & 0x821) {
      ui(2); clearTextPage(sub); withdraw(ctx);
      if ((s & 0xff) === 1) unported(0x8001b7c8); // continue: the load menu
      if (s & 0xff) unported(0x8001b838); // the movies
      yield* fadeAway(sub, 1); fadeIn(m, 1, 1);
      if (yield* startMenu(sub)) { setVar(m, 0, 1); break; }
      dropLayer(m, 1); yield* titlePicture(sub, 0x23f3, 0); fadeIn(m, 0x19, 1); yield* waitFade(sub, 1);
      t = 1; rows(); continue;
    }
    for (let i = 0; i < 3; i++) {
      if ((s & 0xff) === i) { m.write(sp + 0x10, 0x7f, 4); m.write(sp + 0x14, 0x7f, 4); m.write(sp + 0x18, 0x7f, 4); cursorBox(sub, X[i], 0xb4, 0x40, 0x12, 0x7f, 0x7f, 0x7f); }
      else plainBox(sub, X[i], 0xb4, 0x40, 0x12, 0x40000000);
    }
    setPalette(m, (s & 0xff) ? 1 : 0); drawString(sub, 0x21, 0xb5, 0x800110c8, 0);
    setPalette(m, (s & 0xff) === 1 ? 0 : 1); drawString(sub, 0x86, 0xb5, 0x800110d4, 0);
    setPalette(m, (s & 0xff) === 2 ? 0 : 1); t++; drawString(sub, 0xdc, 0xb5, 0x800110e4, 0);
    setPalette(m, 0); yield* textTask(sub); yield* tick(sub);
  }
  withdraw(ctx);
  yield* textTask(sub); yield* tick(sub); clearTextPage(sub);
  yield* fadeAway(sub, 1);
}

// 0x80044384: the special scenes
export function* special(ctx, k) {
  const { m } = ctx, sp = ctx.sp - 0x28, sub = { ...ctx, sp }, w8 = (a, v) => m.write(a, v, 1);
  k &= 0xffff;
  if (k >= 0x6c) return;
  switch (k) {
    case 0: yield* translatedTitle(sub); return; // 0x8001b694, translated (title() below is the hand port of its card-less path)
    case 3: yield* nameEntry(sub, 0); yield* nameEntry(sub, 1); return; // the hero, then the companion
    case 4: yield* nameEntry(sub, 2); w8(0x80079296, 1); return; // the culprit
    case 7: w8(0x800792a8, 1); return;
    case 28: case 31: w8(0x80079296, 1); return;
    case 102: w8(0x800792a5, 0); w8(0x800792a8, 0); inputClear(m); w8(0x800792a1, 1); return;
    case 103:
      w8(0x8007929f, 1); m.write(0x800792b4, 0, 2); w8(0x800792aa, 1); w8(0x800792a8, 0); inputClear(m); w8(0x800792a1, 1);
      textSlotsReset(m); dropPicture(m, 5); return;
    case 104: w8(0x800792a5, 0); w8(0x800792c6, 1); return;
    case 105: w8(0x800792a5, 1); w8(0x800792c6, 0); return;
    case 106: w8(0x800792a9, 1); return;
    case 107: w8(0x800792a9, 0); return;
    case 1: case 18: case 32: case 33: case 34: case 35: case 36: case 39: case 40: case 41:
      yield* specialSwitch(ctx, k); return; // the selection screens: scenario/special-translated.js
  }
}
