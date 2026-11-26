// The per-frame text task, ported from the game's own routines (state in PS1 RAM at the
// original addresses, see glyph.js).
//
//   0x80039288  textTask()                   type out both text windows, page-wait marker
//   0x80037604  fillText(x, y, w, h, colour) fill a rectangle of the 8-bit text page
//
// Each window w (0, 1) has a pointer into scenario text. A frame types characters until the
// window's delay (speed) runs out; speed 0 types everything up to the next wait at once.
// Text bytes: 0x00 end, ' ' skip, '@'/'r' new line, 'L' new line past x 256, 'R' next 'r'
// returns to the left margin, 'p'/'P' wait for a key (P not inside quotes), 'g' wait/new page,
// 'k' wait at 'g' unless quoted, 'o' skip the next p/P, 'w'n delay, 's'n speed, 'c'/'C'n colour,
// 'h'n, 'v'n remember position, 'n'n insert string n; everything else is a 2-byte SJIS glyph.
// choiceMode (0x80079295) is set by the choice opcode 0x8001e3c0 while choices are typed;
// backlog (0x800792a0) is set while 0x80024fd0 (R1) replays earlier pages.
// Calls into code that is not ported yet go through ctx.call(addr, args, sp).
import { setVar, savePoint } from "../helpers.js";
import { backlog } from "../menu.js";
import { checkpoint } from "../scenario/lib.js";
import { drawGlyph } from "./glyph.js";
import { sound } from "../sound-bridge.js";

const GP = 0x8007913c;
export const TEXT = {
  window: GP + 0x19b, kinsoku: GP + 0x19c, returnLeft: GP + 0x19d, glyphW: GP + 0x19e, palette: GP + 0x1a0, attrH: GP + 0x1a2,
  ptr: 0x800794c0, delay: 0x80079590, speed: 0x80079560, x: 0x800794b8, y: 0x800794bc, left: 0x800794b0, top: 0x800794b4,
  wait: 0x8007943a, stop: 0x80079500, blink: 0x800794ce, markType: 0x8007951a, insert: 0x800795d2, insertReturn: 0x800795a0,
  quote: 0x800794f0, quote2: 0x800795d0, skipWait: 0x800794ee, kWait: 0x80079510, pWait: 0x80079554, gWait: 0x800795c8,
  waiting: 0x8007929e, choiceMode: 0x80079295, backlog: 0x800792a0, auto: 0x800792c6, autoCount: 0x800792c8, keyFlag: 0x800792a8,
  keySound: 0x800792a5, menuKey: 0x800792a9, hidden: 0x800795e2, ended: 0x80079298, endPtr: 0x80079578, pagePtr: 0x8007940c,
  backlogG: 0x800792a2, backlogG2: 0x800792a1, autoV: 0x8007928e, marks: 0x801fec90, strings: 0x8006b030, page: 0x800792ca,
  pad: 0x801eef40, sprites: 0x801eef68, spriteIds: 0x801f6698,
};
const T = TEXT;
const KINSOKU = new Set([0x8142, 0x8149, 0x8148, 0x8141, 0x8145, 0x8176, 0x8178, 0x816a, 0x8163, 0x815c, 0x8160]);

// 0x80037604: clip to 320x240, fill a w x h byte buffer on the stack, LoadImage it into the
// text page (8-bit, page from 0x800792ca). sp is the caller's sp (the 5th argument sits at sp+0x10).
export function fillText(ctx, sp, x, y, w, h, colour) {
  const { m } = ctx, fs = (sp - 0x820) >>> 0, s16 = (v) => (v << 16) >> 16;
  const tw = s16(w), th = s16(h);
  if (tw * th > 0x800 || !tw || !th) return;
  const x16 = s16(x), y16 = s16(y);
  if (x16 >= 0x140 || y16 >= 0xf0) return;
  let cols = w, rows = h;
  if (x16 + tw >= 0x140) cols = 0x140 - x;
  if (y16 + th >= 0xf0) rows = 0xf0 - y;
  const buf = fs + 0x18; let k = 0;
  for (let r = 0; r < s16(rows); r++) for (let c = 0; c < s16(cols); c++) m.write(buf + (k++ & 0xffff), colour, 1);
  const page = m.read(T.page, 1), rect = fs + 0x10;
  m.write(rect, ((page & 0xf) << 6) + (s16(x) >> 1), 2);
  m.write(rect + 2, (page < 0x10 ? 0 : 0x100) + y, 2);
  m.write(rect + 4, s16(cols) >> 1, 2); m.write(rect + 6, rows, 2);
  ctx.gs.LoadImage(rect, buf);
}

// 0x80039288
export function textTask(ctx) {
  const { m } = ctx, fs = (ctx.sp - 0x50) >>> 0, sub = { ...ctx, sp: fs };
  const r8 = (a) => m.read(a, 1), r16 = (a) => m.read(a, 2), r32 = (a) => m.read(a, 4) >>> 0;
  const w8 = (a, v) => m.write(a, v, 1), w16 = (a, v) => m.write(a, v, 2), w32 = (a, v) => m.write(a, v, 4);
  const win = () => r8(T.window);
  const glyph = (x, y, code) => drawGlyph(sub, x, y, code);
  const fill = (x, y, w, h, c) => { m.write(fs + 0x10, c, 4); fillText(ctx, fs, x, y, w, h, c); };
  const newLine = (w) => { // the shared "x = margin (or 8), y += 22" of '@', 'r' and 'L'
    if (r8(T.choiceMode) === 1) w16(T.x + 2 * w, r16(T.left + 2 * w)); else { w16(T.left + 2 * w, 8); w16(T.x + 2 * w, 8); }
  };
  const down = (w) => w16(T.y + 2 * w, r16(T.y + 2 * w) + 0x16);
  const next = (w, n = 1) => w32(T.ptr + 4 * w, r32(T.ptr + 4 * w) + n);

  w8(T.window, 0);
  for (;;) {
    let w = win();
    if (!r8(T.stop + w)) {
      if (r8(T.wait + w)) return waitForKey(w);
      w8(T.waiting, 0);
      for (;;) { // type characters
        w = win();
        let s0 = 0;
        const p = r32(T.ptr + 4 * w);
        if (p) {
          if (((r16(T.delay + 2 * w) << 16) >> 16) <= 0) s0 = typeOne(w, p);
          w16(T.delay + 2 * win(), r16(T.delay + 2 * win()) - 1);
        }
        w = win();
        if (!r16(T.speed + 2 * w) && r32(T.ptr + 4 * w) && r8(T.wait + w) !== 1) continue;
        if (!(s0 & 0xffff)) break;
      }
    }
    w8(T.window, win() + 1);
    if (win() >= 2) return;
  }

  function typeOne(w, p) { // one text code; returns s0 (1 = take the next code this frame too)
    const c = r8(p);
    switch (c < 0x78 ? c : -1) {
      case 0x00:
        if (r8(T.auto) === 1) w8(T.autoV, 1);
        if (r8(T.insert + w)) { w8(T.insert + w, 0); w8(T.ended, 1); w32(T.ptr + 4 * win(), r32(T.insertReturn + 4 * win())); }
        else { w32(T.ptr + 4 * w, 0); w8(T.ended, 1); w32(T.endPtr, p + 1); }
        return 0;
      case 0x20: next(w); return 1;
      case 0x52: w8(T.returnLeft, 1); next(w); return 1; // 'R'
      case 0x72: // 'r'
        if (!r8(T.quote2 + w) && !r8(T.quote + w) && !r8(T.skipWait + w)) {
          if (r8(T.returnLeft)) { w8(T.returnLeft, 0); w16(T.x + 2 * w, r16(T.left + 2 * w)); }
          else newLine(w);
          down(win());
        }
        next(win()); return 0;
      case 0x40: newLine(win()); down(win()); next(win()); return 0; // '@'
      case 0x6b: // 'k'
        next(w);
        if (!r8(T.quote + w)) w8(T.kWait + w, 1);
        return 1;
      case 0x70: case 0x50: { // 'p', 'P'
        w32(T.ptr + 4 * w, p + 1);
        if (r8(p + 1) === 0x67) w8(T.markType + w, 1);
        const v = win();
        const pass = c === 0x70 ? r8(T.choiceMode) || r8(T.pWait + v)
          : r8(T.quote + v) || r8(T.quote2 + v) || r8(T.choiceMode) || r8(T.pWait + v);
        if (pass) { w8(T.skipWait + win(), 0); return 1; }
        if (r8(T.skipWait + v)) { w8(T.skipWait + v, 0); if (!r8(T.backlog)) w8(T.gWait + win(), 1); return 0; }
        if (r8(T.backlog)) return 0;
        w8(T.pWait + v, 1); w8(T.wait + win(), 1); w8(T.blink + win(), 0);
        return 0;
      }
      case 0x67: { // 'g'
        if (!r8(T.backlog) && (r8(T.gWait + w) === 1 || r8(T.kWait + w) === 1)) { w8(T.wait + w, 1); w8(T.blink + win(), 0); return 0; }
        next(win());
        if (r8(T.backlog) === 1) { w8(T.backlogG, 1); w8(T.backlogG2, 0); return 0; }
        if (r8(T.choiceMode)) return 1;
        const page = r8(T.page), rect = fs + 0x20;
        w16(rect + 2, page < 0x10 ? 0 : 0x100); w16(rect, (r8(T.page) & 0xf) << 6); w16(rect + 4, 0xa0); w16(rect + 6, 0xf0);
        ctx.gs.ClearImage(rect, 0, 0, 0);
        const v = win();
        w16(T.left + 2 * v, 8); w16(T.x + 2 * v, 8); w16(T.top + 2 * v, 0x11); w16(T.y + 2 * v, 0x11);
        w16(T.speed + 2 * v, 1); w16(T.delay + 2 * v, 1);
        w32(T.pagePtr, r32(T.ptr + 4 * v) + 1);
        checkpoint(m); savePoint(m);
        w8(T.backlogG2, 0);
        return 0;
      }
      case 0x6f: next(w); w8(T.skipWait + w, 1); return 1; // 'o'
      case 0x77: { // 'w'
        w32(T.ptr + 4 * w, p + 1);
        if (r8(T.choiceMode)) return 0;
        const v = r8(p + 1); w32(T.ptr + 4 * w, p + 2);
        if (r8(T.backlog)) return 1;
        w16(T.delay + 2 * w, v); return 0;
      }
      case 0x63: case 0x43: case 0x68: case 0x73: case 0x76: case 0x6e: { // codes with one argument byte
        if (c === 0x76 && r8(T.auto) === 1) w8(T.autoV, 1);
        const v = r8(p + 1); w32(T.ptr + 4 * w, p + 2);
        if (c === 0x6e) { // 'n': insert string v - '0'
          const ins = (v - 0x30) & 0xff; w8(T.insert + w, ins);
          const u = win(); w32(T.insertReturn + 4 * u, r32(T.ptr + 4 * u));
          w32(T.ptr + 4 * u, r32(T.strings + r8(T.insert + u) * 4));
          return 1;
        }
        if (r8(T.backlog)) return 1;
        if (c === 0x63) w8(T.palette, v & 7);
        else if (c === 0x43) w8(T.palette, (v & 7) + 8);
        else if (c === 0x68) w8(T.attrH, v & 7);
        else if (c === 0x73) { if (!r8(T.choiceMode)) w16(T.speed + 2 * w, (v - 0x30) & 0xff); }
        else { const i = v & 7; w16(T.marks + 2 * i, r16(T.x + 2 * w) - 10); w16(T.marks + 0x10 + 2 * i, r16(T.y + 2 * w)); }
        return 1;
      }
      case 0x4c: // 'L'
        if (r16(T.x + 2 * w) >= 0x100) { newLine(w); down(win()); }
        next(win()); return 1;
      default: { // SJIS glyph
        w8(T.pWait + w, 0);
        const v = win(), q = r32(T.ptr + 4 * v), code = r8(q) << 8 | r8(q + 1);
        w32(T.ptr + 4 * v, q + 2);
        if (code === 0x8177) w8(T.quote2 + v, 1);
        if (code === 0x8178) w8(T.quote2 + win(), 0);
        if (code === 0x8175) w8(T.quote + win(), 1);
        if (code === 0x8176) w8(T.quote + win(), 0);
        let u = win();
        if (KINSOKU.has(code)) { // punctuation may hang past the right edge once
          if (r16(T.x + 2 * u) >= 0x120) {
            if (r8(T.kinsoku) === 1) { w16(T.x + 2 * u, r16(T.left + 2 * u)); w8(T.kinsoku, 0); down(u); }
            else w8(T.kinsoku, 1);
          }
        } else {
          if (r16(T.x + 2 * u) >= 0x120) { w16(T.x + 2 * u, r16(T.left + 2 * u)); down(u); }
          w8(T.kinsoku, 0);
        }
        u = win();
        w16(T.delay + 2 * u, r16(T.speed + 2 * u));
        glyph(r16(T.x + 2 * u), r16(T.y + 2 * u), code);
        u = win();
        w16(T.x + 2 * u, r8(T.glyphW) + r16(T.x + 2 * u) + 1);
        return 0;
      }
    }
  }

  function waitForKey(w) { // window w shows the blinking page marker until a key
    w8(T.waiting, 1);
    const x = r16(T.x + 2 * w);
    if (x < 0x120) { w16(fs + 0x18, x); w16(fs + 0x1a, r16(T.y + 2 * w)); }
    else { w16(fs + 0x18, r16(T.left + 2 * w)); w16(fs + 0x1a, r16(T.y + 2 * w) + 0x16); }
    if (r8(T.hidden)) return;
    const mx = r16(fs + 0x18), my = r16(fs + 0x1a), s16 = (v) => (v << 16) >> 16;
    const b = r8(T.blink + win());
    if (!(b & 0xf)) {
      if ((b >> 4) & 1) glyph(mx, my, r8(T.markType + win()) ? 0x8483 : 0x8484);
      else { for (let i = 0; i < 4; i++) { ctx.gs.DrawSync(0); fill(s16(mx), s16(my + 4 * i), 0x60, 4, 0); } ctx.gs.DrawSync(0); fill(s16(mx), s16(my + 16), 0x60, 0, 0); }
    }
    w8(T.blink + win(), r8(T.blink + win()) + 1);
    if (r8(T.auto)) {
      const n = (r16(T.autoCount) + 1) & 0xffff; w16(T.autoCount, n);
      if (n >= 0x5a) { w32(T.pad, 0x21); w16(T.autoCount, 0); } else w32(T.pad, 0);
    }
    if ((r32(T.pad) & 0x180) && r8(T.menuKey) === 1) { setVar(m, 2, 1); w32(T.pad, 0x21); }
    const sprite = (id) => T.sprites + id * 0x48 + 0x3a, ids = [2, 4, 6, 0xa];
    w8(sprite(r16(T.spriteIds + 0x12)), 0);
    if (r32(T.pad + 8) & 2) { w8(sprite(r16(T.spriteIds + 0x12)), 1); w32(T.pad, r32(T.pad) & ~0x22); }
    for (const o of ids) { const id = r16(T.spriteIds + o); if (id) w8(sprite(id), 0); }
    if (r32(T.pad + 8) & 8) {
      for (const o of ids) { const id = r16(T.spriteIds + o); if (id) w8(sprite(id), 2); }
      w32(T.pad, r32(T.pad) & ~0x22);
    }
    if ((r32(T.pad) & 0x21) || r8(T.keyFlag)) { // next page: clear the marker
      if (r8(T.keySound) === 1 && !r8(T.keyFlag)) sound(ctx).playUi(0, fs);
      w8(T.keyFlag, 0); w8(T.wait + win(), 0); w8(T.blink + win(), 0); w8(T.markType + win(), 0);
      w8(T.gWait + win(), 0); w8(T.kWait + win(), 0);
      const cx = r16(fs + 0x18), cy = r16(fs + 0x1a);
      for (let i = 0; i < 4; i++) { ctx.gs.DrawSync(0); fill(s16(cx), s16(cy + 4 * i), 0x30, 4, 0); }
      ctx.gs.DrawSync(0); fill(s16(cx), s16(cy + 16), 0x30, 0, 0);
      w8(T.waiting, 0);
    }
    backlog({ ...ctx, sp: fs });
  }
}
