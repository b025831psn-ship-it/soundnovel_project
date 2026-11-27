// Touch and click for the SFC VM, as in the GBA player: a tap on an item moves the cursor
// there (as the d-pad would), a tap on the item already chosen confirms it, and a tap
// anywhere else is A. The VM runs the original code, so the player reads the game's own
// work RAM to know which screen is up and where its items are; it then presses the same
// buttons a player would. Addresses found on the Japanese ROM (see README).
//
// planTap(wram, io, x, y) -> button names to press in order, e.g. ['DOWN', 'DOWN'] or ['A'].
// x, y are in screen pixels (256 x 224).

const LINE0 = 13, PITCH = 23; // story text line tops: 13, 36, 59, ...

// In-story choice: $0426 holds the top line (y) of each option as 16-bit words, filled
// while the options are typed and cleared after the choice; $15E7 is the chosen option's
// top while the game waits.
export function storyChoice(w) {
  const tops = [];
  for (let a = 0x426; a < 0x426 + 16; a += 2) {
    const top = w[a] | (w[a + 1] << 8);
    if (top < LINE0 || top > 224 || (top - LINE0) % PITCH) break;
    if (tops.length && top <= tops.at(-1)) break;
    tops.push(top);
  }
  if (tops.length < 2) return null;
  const current = tops.indexOf(w[0x15e7]);
  return current < 0 ? null : { tops, current };
}

// Bookmark shelf after START: three cards stacked down the screen; $00D0 is the card.
const isBookmarks = (w, io) => w[0xd0] <= 2 && io[0x2101 - 0x2000] === 0x02;
const BOOKMARK_ROWS = [[0, 65], [65, 120], [120, 224]];
// Name check before a new game (そのまま始める / 名前を変える): $03C3 = 3, cursor $2482.
const isNameCheck = (w) => w[0x3c3] === 3 && w[0x2482] <= 1;
const NAME_ROWS = [[110, 135], [135, 160]];

const move = (from, to, rows) => to === from ? ['A'] : Array(Math.abs(to - from)).fill(to > from ? 'DOWN' : 'UP');
const rowAt = (rows, y) => rows.findIndex(([top, bottom]) => y >= top && y < bottom);

// Name keyboards. Both the suspect keyboard (犯人) and the new-game keyboard (主人公 and
// her name, after 名前を変える) use the game's cursor $1020 = row * 16 + column with the same
// layout: kana or kanji cells 16x16 from (48, 54), rows 1-9 and columns 2-11; the mode column
// on the left (column 1: 漢字/字 1, ひらがな 3, カタカナ 6, chosen by moving onto it); the command
// column on the right (column 12: スペース 1, なおす 4, 全消 7, 終り 9). In kanji mode the list
// scrolls: the arrows above and below the grid move past its top or bottom row.
// Suspect keyboard ready test as in tools/campaign.mjs; the new-game one is title state $03C3 = 5 (主人公) or 7 (her name).
export const isKeyboard = (w) => (w[0x102b] === 2 && w[0x102c] === 0 && w[0x1028] === 1 && w[0x11644] === 0xc5 && w[0x11645] === 0x06)
  || w[0x3c3] === 5 || w[0x3c3] === 7;
const COMMANDS = [[48, 96, 1], [96, 143, 4], [143, 180, 7], [180, 216, 9]];
const MODES = [[48, 80, 1], [80, 132, 3], [132, 192, 6]];
// -> { target, press, scroll } or null. press: A once the cursor is there; scroll: one more
// UP (-1) or DOWN (+1) to page the kanji list.
export function keyboardTarget(x, y, w = null) {
  const col = w ? w[0x1020] & 15 : 2, inGrid = x >= 44 && x < 212;
  if (inGrid && y >= 54 && y < 198) return { target: (((y - 54) >> 4) + 1) * 16 + Math.max(0, (x - 48) >> 4) + 2, press: true };
  if (inGrid && y >= 44 && y < 54) return { target: 16 + Math.min(11, Math.max(2, col)), press: false, scroll: -1 };
  if (inGrid && y >= 198 && y < 210) return { target: 9 * 16 + Math.min(11, Math.max(2, col)), press: false, scroll: 1 };
  if (x >= 216 && x < 248) { const c = COMMANDS.find(([top, bottom]) => y >= top && y < bottom); if (c) return { target: c[2] * 16 + 12, press: true }; }
  if (x >= 8 && x < 40) { const c = MODES.find(([top, bottom]) => y >= top && y < bottom); if (c) return { target: c[2] * 16 + 1, press: false }; }
  return null;
}
// Next button toward a keyboard cell, read against the live cursor: across first, then down
// (or down first with vertical = true, for when a short row stops the cursor).
export function keyboardStep(w, target, vertical = false) {
  const pos = w[0x1020];
  if (pos === target) return 'A';
  const dx = (target & 15) - (pos & 15), dy = (target >> 4) - (pos >> 4);
  const across = dx > 0 ? 'RIGHT' : 'LEFT', down = dy > 0 ? 'DOWN' : 'UP';
  return vertical ? (dy ? down : across) : (dx ? across : down);
}

// What a tap means on the current screen: { read, target } for an item list (read(w, io) gives
// the game's own cursor index, or null when that screen is not up), 'A', or null to ignore.
export function tapTarget(w, io, x, y) {
  const choice = storyChoice(w);
  if (choice) {
    const { tops } = choice;
    if (y < tops[0] - 4) return null; // the question above the options
    let target = 0;
    while (target + 1 < tops.length && y >= tops[target + 1] - 4) target++;
    return { target, read: (v) => storyChoice(v)?.current ?? null };
  }
  if (isBookmarks(w, io)) {
    const row = rowAt(BOOKMARK_ROWS, y);
    return row < 0 ? null : { target: row, read: (v, o) => (isBookmarks(v, o) ? v[0xd0] : null) };
  }
  if (isNameCheck(w)) {
    const row = rowAt(NAME_ROWS, y);
    return row < 0 ? null : { target: row, read: (v) => (isNameCheck(v) ? v[0x2482] : null) };
  }
  return 'A';
}

// The same as button presses, for a screen that takes every press (tests, scripted play).
export function planTap(w, io, x, y) {
  const t = tapTarget(w, io, x, y);
  if (!t) return [];
  if (t === 'A') return ['A'];
  return move(t.read(w, io), t.target);
}

// Presses buttons one after another, a few frames down and a few up, from the machine's
// frame callback, so each one is seen by the game's own joypad read.
export class PressQueue {
  constructor({ down = 3, up = 3 } = {}) { this.q = []; this.down = down; this.up = up; this.t = 0; this.mask = 0; }
  push(...masks) { this.q.push(...masks); }
  get busy() { return this.t > 0 || this.q.length > 0; }
  // Call once per frame; returns the mask to OR with held buttons.
  frame() {
    if (this.t === 0) { if (!this.q.length) return 0; this.mask = this.q.shift(); }
    const out = this.t < this.down ? this.mask : 0;
    this.t = (this.t + 1) % (this.down + this.up);
    return out;
  }
}
