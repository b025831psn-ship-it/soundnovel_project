// System commands 1D 03 / 1D 04 (08009670 / 0800967E) -> 08011D1C: the name entry screen.
// 1D 03 asks for the hero's name (mode 0) and then the girlfriend's (mode 1); 1D 04 asks for the
// culprit's name (mode 2). The routine is ported line by line; positions go through the same
// 08006C64 transform as all OBJ text (y * 14 / 20), and each `yield` is one frame (08002FB8).

// Offset table at 08826660 (kgk port-data ui/name-table.bin): list 0 is the hero/girlfriend
// characters, list 0B the culprit's, list 0A the kana that start a row group.
const TABLE_BASE = 0x08826660;
const LIST = { names: 0, culprit: 0x0b, heads: 0x0a };
// 0801B7F4 / 0801B804 / 0801B810: 主人公の名前, 恋人の名前, 犯人の名前.
const TITLES = [
  [0x8e, 0xe5, 0x90, 0x6c, 0x8c, 0xf6, 0x82, 0xcc, 0x96, 0xbc, 0x91, 0x4f],
  [0x97, 0xf6, 0x90, 0x6c, 0x82, 0xcc, 0x96, 0xbc, 0x91, 0x4f],
  [0x94, 0xc6, 0x90, 0x6c, 0x82, 0xcc, 0x96, 0xbc, 0x91, 0x4f],
];
const ERASE = [0x8f, 0xc1, 0x82, 0xb7, 0x84, 0x87]; // 0801B81C 消すⒷ
const DONE = [0x8f, 0x49, 0x97, 0xb9, 0x84, 0x7c]; // 0801B824 終了ⓈⓉ
const ARROW_UP = 0x8489; // 0801B82C
const ARROW_DOWN = 0x848a; // 0801B830
const SPACE = 0x8140;
const SKIP = 0x818f; // never selectable
const SKIP_HORIZONTAL = 0x8197; // passed over sideways, refused vertically
const COLUMNS = 15;
const ROWS = 6;
const LENGTH = 6;
// Pictures: 0x2329 for the hero and girlfriend, 0x2328 for the culprit; 0x4C6 comes back after
// the girlfriend's name.
export const NAME_PICTURES = [0x2329, 0x2328, 0x4c6];
// mGBA: the screen stays off (DISPCNT 0) for 73 frames while the picture is decoded and the
// grid is built (1104 -> 1177 for the hero, 1233 -> 1306 for the girlfriend).
const BUILD_FRAMES = 73;
// 080063F4/0800654C(1, 1) and 08003068(10).
const END_WAIT = 10;
// 0801949C: OBJ shape 0 is an 8x8 square in OBJ color 5 (0x03E0).
const CURSOR_COLOR = 5;

export const KEY = { A: 1, B: 2, SELECT: 4, START: 8, RIGHT: 16, LEFT: 32, UP: 64, DOWN: 128 };

function word(bytes, at) {
  return (bytes[at] << 8) | bytes[at + 1];
}

// 08009B68: a list inside the 08826660 container (big-endian u32 offsets, then u16 entries).
export function nameList(table, index) {
  const at = 4 * index;
  return ((table[at] << 24) | (table[at + 1] << 16) | (table[at + 2] << 8) | table[at + 3]) >>> 0;
}

// The 08011E5E loop: two halfwords per cell, a marker (FFF0 group start, FFF1 a row-group kana,
// else 0) and the character.
export function buildGrid(table, mode) {
  let at = nameList(table, mode === 2 ? LIST.culprit : LIST.names);
  const heads = [];
  for (let h = nameList(table, LIST.heads); word(table, h); h += 2) heads.push(word(table, h));
  const next = () => { const value = word(table, at); at += 2; return value; };
  const cells = [];
  let count = 0;
  let char = next();
  while (char !== 0xffff) {
    if (mode !== 2) count++;
    let mark = 0;
    if (heads.includes(char)) mark = 0xfff1;
    else if (char > 0xffef) { mark = char; char = next(); }
    cells.push({ mark, char });
    char = next();
  }
  return { cells, count: mode === 2 ? 0x5a : count };
}

export class NameEntry {
  constructor({ boot, font, table }) {
    this.boot = boot;
    this.font = font;
    this.table = table;
  }

  // 08011D1C(mode). `names` maps the 08008198 slot (1 hero, 2 girlfriend, 0 culprit) to Shift JIS.
  *run(mode) {
    const boot = this.boot;
    const slot = mode === 2 ? 0 : mode + 1;
    const current = boot.names[slot] ?? [];
    const name = Array(LENGTH).fill(SPACE);
    let length = 0;
    if (mode < 2) for (let i = 0; i + 1 < current.length && length < LENGTH; i += 2) name[length++] = (current[i] << 8) | current[i + 1];
    const { cells, count } = buildGrid(this.table, mode);
    const rows = Math.trunc(count / COLUMNS);
    boot.repeat = true; // 0800A114: d-pad auto-repeat after 30 frames, then every 6
    // The screen is off while the picture decodes and the grid is built.
    boot.layer = null;
    boot.blank = true;
    for (let n = 0; n < BUILD_FRAMES; n++) yield;
    boot.showPicture(NAME_PICTURES[mode === 2 ? 1 : 0]);
    boot.setBrightness(1, 0x8000); // 080065A8(1, 0x100)
    boot.blank = false;
    let cursor = 0;
    let top = 0;
    let done = false;
    while (true) {
      boot.layer = this.layer(mode, cells, rows, name, length, cursor, top);
      yield;
      if (done) {
        boot.layer = this.layer(mode, cells, rows, name, length, cursor, top, { underline: false });
        // 08012564: an empty name is refused.
        if (name.every((c) => c === SPACE)) {
          boot.effect(4);
          length = 0;
          done = false;
          continue;
        }
        break;
      }
      let trigger = boot.trigger;
      const pressed = (mask) => (trigger & mask) !== 0;
      const before = cursor;
      if (length < LENGTH) {
        const beforeTop = top;
        for (let guard = 0; guard < 64; guard++) {
          if (pressed(KEY.UP) && cursor > 14) {
            cursor -= 15;
            if (top && cursor < COLUMNS * (top + 1)) top--;
          }
          if (pressed(KEY.DOWN) && cursor < count - 15) {
            cursor += 15;
            if (top + ROWS < rows && cursor >= COLUMNS * (top + 5)) top++;
          }
          if (pressed(KEY.LEFT) && cursor) {
            cursor--;
            if (top && cursor < COLUMNS * (top + 1)) top--;
          }
          if (pressed(KEY.RIGHT) && cursor < count - 1) {
            cursor++;
            if (top + ROWS < rows && cursor >= COLUMNS * (top + 5)) top++;
          }
          const char = cells[cursor]?.char;
          if (char !== SKIP && char !== SKIP_HORIZONTAL) break;
          if (char === SKIP_HORIZONTAL && pressed(KEY.UP | KEY.DOWN)) {
            cursor = before;
            top = beforeTop;
            break;
          }
        }
      }
      if (cursor !== before) boot.effect(3);
      if (pressed(KEY.A)) {
        if (length < LENGTH) {
          boot.effect(0);
          name[length++] = cells[cursor].char;
        } else trigger |= KEY.START; // A on a full name ends the entry
      }
      if (pressed(KEY.B) && length) {
        boot.effect(1);
        name[--length] = SPACE;
      }
      if (pressed(KEY.START)) done = true;
    }
    // 08012614: confirm sound, key repeat off, slot 1 to black at once.
    boot.effect(0);
    boot.repeat = false;
    boot.fadeOut(1, 1);
    if (mode === 1) {
      // 08003878(0x4C6): the welcome picture comes back (the old screen stays while it decodes).
      for (let n = 0; n < 5; n++) yield;
      boot.showPicture(NAME_PICTURES[2]);
      boot.fadeIn(1, 1);
    }
    boot.layer = null; // 08006B8C
    for (let n = 0; n < END_WAIT; n++) yield;
    // Trailing spaces become terminators; 08008198 stores the name.
    let end = LENGTH;
    while (end > 0 && name[end - 1] === SPACE) end--;
    boot.names[slot] = name.slice(0, end).flatMap((c) => [c >> 8, c & 255]);
  }

  // Everything on the OBJ text surface for one frame.
  layer(mode, cells, rows, name, length, cursor, top, { underline = true } = {}) {
    const boot = this.boot;
    const glyphs = [];
    const fills = [];
    boot.text(glyphs, TITLES[mode], 0x54, 6, 2, true);
    boot.text(glyphs, ERASE, 0x14, 0x24, 2, true);
    boot.text(glyphs, DONE, 0xb7, 0x24, 2, true);
    const at = (x, y) => [x, Math.trunc((y * 14) / 20)];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLUMNS; c++) {
      const char = cells[(top + r) * COLUMNS + c]?.char;
      if (char === undefined || char === SKIP || char === SKIP_HORIZONTAL) continue;
      const [x, y] = at(((0x4b + 0x36 * c) * 64) >> 8, 18 * r + 0x52);
      glyphs.push({ x, y, encoded: char, color: 2 });
    }
    if (mode < 2) {
      if (top) glyphs.push({ ...this.point(0x6c, 0x3c), encoded: ARROW_UP, color: 2 });
      if (top + ROWS < rows) glyphs.push({ ...this.point(0x6c, 0xbe), encoded: ARROW_DOWN, color: 2 });
    }
    name.forEach((char, i) => {
      if (char !== SPACE) glyphs.push({ ...this.point(0x4f + 14 * i, 0x23), encoded: char, color: 2 });
    });
    // 08006AA0 in OBJ color 0x0B (white): the underline under the next character.
    if (underline && length < LENGTH) {
      const [x, y] = at(14 * length + 0x4e, 0x36);
      fills.push({ x, y, w: 14, h: Math.trunc((3 * 14) / 20), color: 2 });
    }
    // 020006C4 bit 4: the cursor squares show for 16 frames out of 32 (OAM lands a frame later).
    const sprites = [];
    if (boot.tick & 0x10) {
      if (length < LENGTH) {
        const x = (((cursor % COLUMNS) * 18 + 0x17) * 3 * 64) >> 8;
        const y = Math.trunc((((Math.trunc(cursor / COLUMNS) - top) * 18 + 0x51) * 14) / 20);
        for (const [dx, dy] of [[0, 0], [6, 0], [0, 6], [6, 6]]) sprites.push({ x: x + dx, y: y + dy, behind: false });
      } else {
        for (const dy of [0, 8]) {
          for (let k = 0; k < 5; k++) sprites.push({ x: 0xb5 + 8 * k, y: 0x17 + dy, behind: true });
          sprites.push({ x: 0xd9, y: 0x17 + dy, behind: true });
        }
      }
    }
    return { boxes: [], replace: true, glyphs, fills, sprites: sprites.map((s) => ({ ...s, w: 8, h: 8, color: CURSOR_COLOR })) };
  }

  point(x, y) {
    return { x, y: Math.trunc((y * 14) / 20) };
  }
}
