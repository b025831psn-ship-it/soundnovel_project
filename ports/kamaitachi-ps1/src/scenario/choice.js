// 0x16 0x8001e99c the choice loop: the cursor glyph 0x848b blinks beside choice `sel`
// (positions: x at 0x801fec90 + 2i, y at +0x10), up/down move it, circle/cross (0x21)
// take it. The labels and route ids come from 0x13/0x57 (0x801f7348, 0x80093be8).
// In auto mode the choice is taken after 90 frames. Then: result to 0x8008dab8[0x80079430],
// route seen (0x801fa730), 0x80019684, jump to the label, save point (0x800325b0).
// A loaded save (0x80079296 = 1) resumes with the stored choice 0x80079297.
import { textSpeedReset, markSeen, choiceColour, choiceColoursReset, fillBox, textClear, savePoint } from "../helpers.js";
import { HANDLERS } from "./interp.js";
import { CURSOR, BASE, GP, io, resolveLabel } from "./lib.js";
import { drawGlyph } from "../text/glyph.js";
import { textTask } from "../text/text.js";
import { tick } from "../tick.js";
import { menu, backlog } from "../menu.js";
import { sound } from "../sound-bridge.js";
import { offer, withdraw } from "../touch.js";

const PAD = 0x801eef40, SPR = 0x801eef68, IDS = 0x801f6698, POS = 0x801fec90, COUNT = 0x800794cb;
const AUTO = 0x800792c6, AUTO_T = 0x800792c8, SE_ON = 0x800792a5, ABORT = 0x800792a3, NO_EFFECTS = 0x800792a0;
const s16 = (v) => (v << 16) >> 16;

HANDLERS[0x16] = function* (ctx) {
  const { m } = ctx, { r8, r16, r32, w8, w16, w32 } = io(m), sp = ctx.sp - 0x40, sub = { ...ctx, sp };
  const se = () => { if (r8(SE_ON) === 1) sound(ctx).playUi(3, sp); };
  const sprites = (offs, v) => { for (const o of offs) { const id = r16(IDS + o); if (id) w8(SPR + id * 72 + 0x3a, v); } };
  const cursor = (sel) => drawGlyph(sub, s16(r16(POS + 2 * sel)), s16(r16(POS + 0x10 + 2 * sel)), 0x848b);
  let sel = 0, t = 0, aborted = false;
  if (r8(0x80079296)) sel = r8(0x80079297);
  else {
    choiceColoursReset({ ...ctx, sp });
    choiceColour({ ...ctx, sp }, 1);
    cursor(0);
    { // the rows: from each cursor position to the right edge, down to the next row (or one line)
      const n = r8(COUNT) + 1, at = (i) => [s16(r16(POS + 2 * i)), s16(r16(POS + 0x10 + 2 * i))];
      offer(ctx, Array.from({ length: n }, (_, i) => { const [x, y] = at(i), next = i + 1 < n ? at(i + 1)[1] : y + 22;
        return { index: i, left: Math.max(0, x - 4), right: 316, top: y - 3, bottom: Math.max(next, y + 16) - 3 }; }), () => sel & 0xff, ["up", "down"]);
    }
    for (;;) {
      if (r8(AUTO) === 1) {
        w16(AUTO_T, r16(AUTO_T) + 1);
        if (r32(PAD) & 0x21) { w16(AUTO_T, 0x5a); w8(0x800792a4, 1); w32(PAD, 0x21); }
        if (r16(AUTO_T) >= 0x5a) { w32(PAD, 0x21); w16(AUTO_T, 0); } else w32(PAD, 0);
      }
      const s0 = sel & 0xff;
      w8(0x8007929e, 1);
      fillBox(sub, s16(r16(POS + 2 * s0)), s16(r16(POS + 0x10 + 2 * s0)), 10, 16, 0);
      if ((r32(PAD) & 0x1000) && s0) { se(); sel--; }
      if ((r32(PAD) & 0x4000) && (sel & 0xff) !== r8(COUNT)) { se(); sel++; }
      if (r8(AUTO) === 1) w32(PAD + 8, r32(PAD + 8) & ~0x19a);
      w8(SPR + r16(IDS + 0x12) * 72 + 0x3a, 0);
      if (r32(PAD + 8) & 2) { w8(SPR + r16(IDS + 0x12) * 72 + 0x3a, 1); w32(PAD, r32(PAD) & ~0x21); }
      sprites([2, 4, 6, 0xa], 0);
      if (r32(PAD + 8) & 8) { sprites([2, 4, 6, 0xa], 2); w32(PAD, r32(PAD) & ~0x21); }
      if (r32(PAD) & 0x180) { se(); sel = ((sel + 1) & 0xff) % (r8(COUNT) + 1); }
      if (r32(PAD) & 0x5180) { t = 0; choiceColoursReset({ ...ctx, sp }); choiceColour({ ...ctx, sp }, (sel & 0xff) + 1); }
      if (r32(PAD) & 0x21) { if (r8(SE_ON) === 1) sound(ctx).playUi(0, sp); textSpeedReset(m); break; }
      if ((t >>> 0) % 30 < 16) cursor(sel & 0xff);
      yield* textTask(sub);
      yield* menu(sub);
      yield* backlog(sub);
      if (r8(ABORT) === 1) { aborted = true; break; }
      yield* tick(sub);
      t = (t + r32(0x80079278)) >>> 0;
    }
  }
  withdraw(ctx);
  if (!aborted) w8(0x800792a8, 0);
  if (!r8(NO_EFFECTS)) { w8(0x8007929e, 0); w8(0x8008dab8 + r8(0x80079430), sel); }
  const abort = r8(ABORT);
  m.write(GP + 2, 0, 1); m.write(GP + 0x45c, 0xff, 1); w8(0x80079295, 0); w8(0x80079296, 0);
  if (abort) { w8(ABORT, 0); return; }
  textClear(sub);
  const k = sel & 0xff;
  w8(0x801fa730 + r16(0x80093be8 + 2 * k), 3);
  markSeen(m, r16(0x800792bc), k); // 0x80019684: a1 is still the choice (0x8001ef04)
  const off = (yield* resolveLabel(sub, r32(BASE), r16(0x801f7348 + 2 * k))) & 0xffff, p = (r32(BASE) + off) >>> 0;
  w32(CURSOR, p); w32(0x8007940c, p); w16(0x800792b4, r16(0x800792b4) - 1);
  savePoint(m);
};
