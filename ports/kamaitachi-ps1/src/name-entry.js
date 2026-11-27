// The name entry 0x800426b0(k): k = 0 the hero, 1 the companion, 2 the culprit (special scene
// 0x1d case 3 runs 0 then 1, case 4 runs 2). A grid of 15 columns from the EXE's table
// 0x8006fba4 (members 0 / 0xb: big-endian SJIS cells, 0xfffx = a mark on the next cell,
// 0xffff end; member 0xa lists cells shown disabled), six rows on screen, scrolled by rows.
// The name (six full-width characters) is kept at sp+0x28 and stored with 0x8003a744.
// Cells 0x818f / 0x8197 are blanks the cursor passes over (0x8197 stops a vertical move).
import { drawString, clearTextPage, textBox } from "./title.js";
import { drawGlyph, swap16 } from "./text/glyph.js";
import { addBox } from "./screen/sprites.js";
import { fadeLevel } from "./screen/fader.js";
import { dropLayer } from "./helpers.js";
import { textTask } from "./text/text.js";
import { tick, ticks } from "./tick.js";
import { titlePicture } from "./init.js";
import { memcpy } from "./screen/weather.js";
import { sound } from "./sound-bridge.js";
import { offer, withdraw } from "./touch.js";

const GP = 0x8007913c, PAD = 0x801eef40, STRINGS = 0x8006b030, TABLE = 0x8006fba4, SPACE = 0x8140;

export function sjisLength(m, p) { // 0x8003a89c: characters (two bytes each) up to the 0
  let n = 0;
  for (let c; (c = m.read(p, 1)); ) { if (c < 0x80) continue; p += 2; n++; } // (an ASCII byte loops forever, as in the original)
  return n & 0xff;
}
export function setName(m, i, src) { // 0x8003a744: copy an SJIS string to string i
  let d = m.read(STRINGS + 4 * (i & 0xffff), 4) >>> 0;
  for (let c; (c = m.read(src, 1)); ) {
    if (c >= 0x80) { m.write(d++, c, 1); src++; m.write(d++, m.read(src++, 1), 1); }
    else { m.write(d++, c, 1); src++; }
  }
  m.write(d, 0, 1);
}
const member = (m, base, i) => (base + (((m.read(base + 4 * i, 1) << 24) | (m.read(base + 4 * i + 1, 1) << 16) | (m.read(base + 4 * i + 2, 1) << 8) | m.read(base + 4 * i + 3, 1)) >>> 0)) >>> 0; // 0x80044e10

export function* nameEntry(ctx, k) {
  const { m } = ctx, sp = ctx.sp - 0x98, sub = { ...ctx, sp };
  const r8 = (a) => m.read(a, 1), r16 = (a) => m.read(a, 2), r32 = (a) => m.read(a, 4) >>> 0;
  const be = (a) => swap16(r16(a)), ui = (n) => sound(ctx).playUi(n, sp);
  k &= 0xff;
  const buf = sp + 0x28;
  memcpy(m, 0x80011fa4, buf, 13);
  const grid = r32(0x80079508);
  let len = 0, done = 0;
  yield* titlePicture(sub, k === 2 ? 0x2328 : 0x2329, 1);
  if (k === 0 || k === 1) { const s = r32(STRINGS + 4 * (k + 1)); len = sjisLength(m, s); memcpy(m, s, buf, len * 2); len &= 0xff; }
  let src, count;
  if (k === 2) { src = member(m, TABLE, 0xb); count = 0x5a; } else { src = member(m, TABLE, 0); count = 0; }
  m.write(GP + 0x60, 1, 1); m.write(GP + 0x62, 0x1e, 2); m.write(GP + 0x64, 0, 4); // 0x80026204: d-pad repeat on
  for (let o = 0; ;) { // the grid: (mark, character) per cell
    let c = be(src); src += 2;
    if (c === 0xffff) break;
    if (k !== 2) count = (count + 1) & 0xffff;
    const off = member(m, TABLE, 0xa);
    let hit = false;
    for (let i = 0; ; i++) { const v = be(off + 2 * i); if (!v) break; if (v === c) { hit = true; break; } }
    if (hit) m.write(grid + 2 * o, 0xfff1, 2);
    else if (c > 0xffef) { m.write(grid + 2 * o, c, 2); c = be(src); src += 2; }
    else m.write(grid + 2 * o, 0, 2);
    m.write(grid + 2 * (o + 1), c, 2); o += 2;
  }
  fadeLevel(m, 2, 0xff);
  const total = count, rows = Math.floor(total / 15) & 0xffff, small = k < 2;
  let top = 0, drawn = 0xffff, cur = 0;
  const cell = (i) => r16(grid + 4 * i + 2);
  // Taps: the visible cells, numbered in the order left / right presses reach them (blank cells
  // are passed over), and the 消す / 終了 labels, which press cross / triangle (keys by index).
  const blank = (c) => c === 0x818f || c === 0x8197;
  const ordinal = (i) => { let n = 0; for (let j = 0; j < i; j++) if (!blank(cell(j))) n++; return n; };
  const publish = () => {
    const list = [];
    for (let r = 0; r < 6; r++) for (let col = 0; col < 15; col++) {
      const i = (top + r) * 15 + col; if (i >= total || blank(cell(i))) continue;
      list.push({ index: ordinal(i), left: col * 18 + 0x17, right: col * 18 + 0x2a, top: r * 18 + 0x59, bottom: r * 18 + 0x6b });
    }
    list.push({ index: 100000, left: 0x14, right: 0x52, top: 0x2e, bottom: 0x46 }, { index: 100001, left: 0xee, right: 0x12c, top: 0x2e, bottom: 0x46 });
    offer(ctx, list, () => ordinal(cur), ["left", "right"], { 100000: "cross", 100001: "triangle" });
  };
  for (;;) {
    if (top !== drawn) {
      drawn = top; clearTextPage(sub);
      drawString(sub, 0x70, 0xf, [0x80011fb4, 0x80011fc4][k] ?? 0x80011fd0, 0x10);
      drawString(sub, 0x1b, 0x29, 0x8007932c, 0x10);
      drawString(sub, 0xf4, 0x29, 0x80079334, 0x10);
      for (let r = 0; r < 6; r++) for (let col = 0; col < 15; col++) {
        const c = r16(grid + 60 * top + 4 * (15 * r + col) + 2);
        if (c !== 0x818f && c !== 0x8197) { drawGlyph(sub, col * 18 + 0x19, r * 18 + 0x52, c); ctx.gs.DrawSync(0); }
      }
      if (small) {
        if (top) drawString(sub, 0x90, 0x40, 0x8007933c, 0x10);
        if (top + 6 < rows) drawString(sub, 0x90, 0xbc, 0x80079340, 0x10);
      }
      publish();
    }
    m.write(sp + 0x10, 0, 4); textBox(sub, 0x64, 0x29, 0x7e, 0x14, 0);
    drawString(sub, 0x6a, 0x29, buf, 0x12);
    if (len !== 6) { m.write(sp + 0x10, 0xb, 4); textBox(sub, len * 18 + 0x66, 0x39, 0x15, 2, 0xb); }
    if (k !== 2) for (let r = 0; r < 6; r++) for (let col = 0; col < 15; col++) {
      const a = r16(grid + 60 * top + 4 * (15 * r + col));
      if (a > 0xffef) {
        const x = col * 18;
        addBox(sub, (x + 0x18) & 0xffff, (r * 18 + 0x52) & 0xffff, 0x11, 0x10, 0x80, 0x80, 0x80, 0, 4);
        addBox(sub, (x + 0x18) & 0xffff, (r * 18 + 0x52) & 0xffff, 0x12, 0x11, 0x40, 0x40, 0x40, 0, 4);
        addBox(sub, (x + 0x17) & 0xffff, (r * 18 + 0x51) & 0xffff, 0x13, 0x12, 0xff, 0xff, 0xff, 0, 4);
      }
    }
    ctx.gs.DrawSync(0);
    const pad = r32(PAD), up = pad & 0x1000, down = pad & 0x4000, left = pad & 0x8000, right = pad & 0x2000, vert = pad & 0x5000;
    let was, wasTop, c;
    for (;;) { // 0x80042cc8: move; past blank cells the move repeats
      was = cur; wasTop = top;
      if (len !== 6) {
        if (up && cur >= 15) { cur -= 15; if (top && cur < (top + 1) * 15) top--; }
        if (down && cur < total - 15) { if (top + 6 < rows) { cur += 15; if (!(cur < (top + 5) * 15)) top++; } else cur += 15; }
        if (left && cur) { cur--; if (top && cur < (top + 1) * 15) top--; }
        if (right && cur < total - 1) { if (top + 6 < rows) { cur++; if (!(cur < (top + 5) * 15)) top++; } else cur++; }
      }
      cur &= 0xffff; top &= 0xffff;
      c = cell(cur);
      if (c !== 0x818f && c !== 0x8197) break;
      if (c === 0x8197 && vert) { cur = was; top = wasTop; c = cell(cur); break; }
    }
    if (was !== cur) ui(3);
    if (r32(PAD) & 0x21) {
      if (len < 6) { ui(0); m.write(buf + 2 * len, swap16(c), 2); len++; }
      else m.write(PAD, r32(PAD) | 0x10, 4);
    }
    if ((r32(PAD) & 0x44) && len) { ui(1); len--; m.write(buf + 2 * len, swap16(SPACE), 2); }
    if (r32(PAD) & 0x10) done = 1;
    const t = (m.read(0x80079260, 4) | 0), h = Math.trunc(t / 2) >>> 0, lv = r8(0x800706dc + (h - Math.floor(h / 36) * 36)) * 4;
    const rb = (lv + 0x20) & 0xff, g = (lv - 0x80) & 0xff;
    if (len !== 6) {
      const col = cur % 15, row = Math.floor(cur / 15), x = col * 18, y = ((row - top) * 18) & 0xffff;
      addBox(sub, (x + 0x18) & 0xffff, (y + 0x52) & 0xffff, 0x11, 0x10, rb, g, rb, 0, 3);
      addBox(sub, (x + 0x18) & 0xffff, (y + 0x52) & 0xffff, 0x12, 0x11, 0x40, 0x40, 0x40, 0, 3);
      addBox(sub, (x + 0x17) & 0xffff, (y + 0x51) & 0xffff, 0x13, 0x12, 0xff, 0xff, 0xff, 0, 3);
    } else {
      addBox(sub, 0xf3, 0x29, 0x36, 0x12, rb, g, rb, 0, 3);
      addBox(sub, 0xf3, 0x29, 0x37, 0x13, 0x40, 0x40, 0x40, 0, 3);
      addBox(sub, 0xf2, 0x28, 0x38, 0x14, 0xff, 0xff, 0xff, 0, 3);
    }
    if (top !== drawn) publish();
    textTask(sub); yield* tick(sub);
    if (done !== 1) continue;
    let blank = true;
    for (let i = 0; i < 6; i++) if (r16(buf + 2 * i) !== swap16(SPACE)) { blank = false; break; }
    if (blank) { ui(4); len = 0; done = 0; continue; }
    break;
  }
  withdraw(ctx);
  ui(0);
  m.write(GP + 0x60, 0, 1); // 0x80026220: repeat off
  dropLayer(m, 2); clearTextPage(sub);
  yield* ticks(sub, 10);
  for (let i = 5, kept = false; i; i--) { // trailing spaces dropped (the first character stays)
    if (kept) continue;
    if (r16(buf + 2 * i) === swap16(SPACE)) m.write(buf + 2 * i, 0, 2); else kept = true;
  }
  setName(m, k === 2 ? 0 : k + 1, buf);
}
