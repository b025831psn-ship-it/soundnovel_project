// オプション (0800C50C) and the screens it opens: 登場人物紹介 (0800BD84), ゲームの説明 and the
// title's 挑戦状 (0800C008), 操作説明 (0800CEA8) and 明度、彩度の調整 (0800CCDC). The title's 説明
// runs the same routine in mode 1 (three items, a dimmed title picture). Each `yield` is one frame
// (0800760C + 08002FB8). Strings and tables are read at their cartridge addresses from kgk
// port-data ui/option-text.bin (ROM 0x199DC..) and ui/option-tables.bin (ROM 0x8252EC..).

export const OPTION_TEXT_BASE = 0x080199dc;
export const OPTION_TABLE_BASE = 0x088252ec;

const KEY = { A: 1, B: 2, RIGHT: 16, LEFT: 32, UP: 64, DOWN: 128 };

// 0801AC80: the header bar every screen keeps.
const HEADER = [0x00, 0x05, 0xf0, 0x13];
// 0800C538: the オプション box (one row more with エンディングリスト, half a row less from the title).
const OPTION_BOX = [0x2d, 0x23, 0x96, 0x54];
const ITEM_X = 0x45;
const ITEM_Y = 0x3f;
const ROW = 0x14;
const POINTER_X = 0x34;
const POINTER = 0x8484;
// 0801AA8C: the box of ゲームの説明 and 挑戦状; 0801A294: the 登場人物紹介 box.
const HELP_BOX = [0x06, 0x2a, 0xe6, 0x68];
const CAST_BOX = [0x34, 0x28, 0x8e, 0x4e];
// Pictures (08000DC4 ids): 操作説明, the 明度・彩度 test picture, the screens' backdrops.
export const CONTROLS_PICTURE = 0x232e;
export const TONE_PICTURE = 0x232c;
export const CAST_PICTURES = Array.from({ length: 13 }, (_, i) => 0x2416 + i);
// 0801AA87: pages of ゲームの説明 (0) and 挑戦状 (1).
const HELP_PAGES = [6, 5];
// Frames the cartridge spends decoding each picture (08000DC4) beyond this port's, from the button
// press to the picture (mGBA). Only `?timing=original` waits them out; see Boot.loadLag.
const DECODE = { controls: 8, tone: 6, back: 12, profile: 15, castBack: 10 };
// 03001EE4 / 03001EE5 limits (0800CDDA..): 明度 5..11, 彩度 5..15, both start at 5 (08000330).
export const TONE_DEFAULT = { brightness: 5, saturation: 5 };
const TONE_LIMITS = { brightness: [5, 11], saturation: [5, 15] };

const ADDRESS = {
  optionTitle: 0x0801ab58, // オプション
  explainTitle: 0x0801ab64, // 説　　　明
  items: 0x08825b34, // 登場人物紹介, ゲームの説明, 操作説明, 明度、彩度の調整, エンディングリスト, もどるⒷ
  helpTitles: [0x0801aa94, 0x0801aaa4], // ゲームの説明, 挑戦状
  helpPages: [0x0882533c, 0x08825354],
  back: 0x0801a2d8, // もどるⒷ
  up: 0x0801aaac, // ▲
  down: 0x0801aab0, // ▼
  castTitle: 0x0801a29c, // 登場人物紹介
  castItems: [0x0801a2ac, 0x0801a2b0, 0x0801a2b4, 0x0801a2c8], // n1, n2, シュプールの従業員, その他の宿泊客
  castPictures: 0x088252ec,
  castText: 0x08825308,
  listTitle: 0x0801aab4, // エンディングリスト
  listBack: 0x0801aac8, // もどるⒷ
  listUnseen: 0x0801aad4, // ＊ ＊ ＊
  listStrings: 0x08825368,
  listRows: 0x08825ad2,
  brightness: 0x0801ab8c, // 明度
  saturation: 0x0801aba0, // 彩度
};
// 0800BF8A: which profiles each 登場人物紹介 entry shows, in order.
const CAST_GROUPS = [[0], [1], [2, 3, 4, 5], [6, 7, 8, 9, 10, 11, 12]];

export class Options {
  constructor({ boot, text, tables }) {
    this.boot = boot;
    this.textBytes = text;
    this.tables = tables;
  }

  string(address) {
    const at = address - OPTION_TEXT_BASE;
    const bytes = [];
    for (let i = at; i < this.textBytes.length && this.textBytes[i]; i++) bytes.push(this.textBytes[i]);
    return bytes;
  }

  pointer(table, index) {
    const at = table - OPTION_TABLE_BASE + 4 * index;
    const t = this.tables;
    return (t[at] | (t[at + 1] << 8) | (t[at + 2] << 16) | (t[at + 3] << 24)) >>> 0;
  }

  half(table, index) {
    const at = table - OPTION_TABLE_BASE + 2 * index;
    return this.tables[at] | (this.tables[at + 1] << 8);
  }

  // 08006F1C at (x, y) in its 0-228 y range, in OBJ color `color` (08008228(n) is color n + 2).
  print(glyphs, address, x, y, color = 2, advance = 0) {
    return this.boot.text(glyphs, this.string(address), x, y, color, true, advance);
  }

  // A tap on a row of a menu: the row under the pointer reads it, another row moves there.
  rowHits(box, count, selected, move) {
    return Array.from({ length: count }, (_, i) => ({
      x: box[0], y: Math.trunc(((ITEM_Y + ROW * i) * 14) / 20) - 1, w: box[2], h: 14, current: i === selected,
      select: () => move(i),
    }));
  }

  // 0800C50C. `mode` 0 from the game's menu, 1 from the title's 説明.
  *run(mode) {
    const boot = this.boot;
    const title = mode === 1;
    if (title) {
      boot.setLevel(1, 0xc8);
      yield* boot.waitFade(1);
    }
    let count = 4;
    const box = [...OPTION_BOX];
    // 0800C56A: エンディングリスト joins once 020024EC+0x34 is set (in the game only).
    if (!title && boot.vm.ram.flags?.[0x34]) { count = 5; box[3] += ROW; }
    if (title) { count = 3; box[3] -= 10; }
    let selected = 0;
    let boxShown = true;
    const draw = () => {
      const glyphs = [];
      this.print(glyphs, title ? ADDRESS.explainTitle : ADDRESS.optionTitle, title ? 0x61 : 0x5a, 0x0c, 2);
      for (let i = 0; i < count; i++) this.print(glyphs, this.pointer(ADDRESS.items, i), ITEM_X, ITEM_Y + ROW * i, i === selected ? 2 : 3);
      this.print(glyphs, this.pointer(ADDRESS.items, 5), ITEM_X, ITEM_Y + ROW * count, selected === count ? 2 : 3);
      glyphs.push({ ...boot.point(POINTER_X, ITEM_Y + ROW * selected), encoded: POINTER, color: 2 });
      boot.layer = { boxes: boxShown ? [HEADER, box] : [HEADER], glyphs };
      boot.hits = this.rowHits(box, count + 1, selected, (i) => { boot.effect(3); selected = i; });
    };
    while (true) {
      draw();
      yield;
      if (boot.pressed(KEY.UP) && selected > 0) { boot.effect(3); selected--; continue; }
      if (boot.pressed(KEY.DOWN) && selected < count) { boot.effect(3); selected++; continue; }
      if (boot.pressed(KEY.B)) { boot.effect(1); break; }
      if (!boot.pressed(KEY.A)) continue;
      if (selected === count) { boot.effect(1); break; }
      boxShown = false;
      boot.layer = { boxes: [HEADER], glyphs: boot.layer.glyphs };
      boot.effect(0);
      if (selected === 0) { yield* this.cast(mode); this.backdrop(mode); }
      else if (selected === 1) yield* this.help(0);
      else if (selected === 2) { yield* this.controls(mode); yield* this.backdrop(mode, DECODE.back); }
      else if (selected === 3) { yield* this.tone(mode); yield* this.backdrop(mode, DECODE.back); }
      else if (selected === 4) yield* this.endingList();
      boxShown = true;
    }
    // 0800C93E
    boot.layer = title ? null : { boxes: [HEADER], glyphs: [] };
    if (title) boot.setLevel(1, 0x100);
  }

  // 0800C4D8: the screen's own picture comes back (0xDE in the game, the title picture), the
  // previous one staying up while it decodes.
  *backdrop(mode, decode = 0) {
    const boot = this.boot;
    yield* boot.picture(mode === 1 ? boot.titlePicture : boot.menuPicture, boot.loadLag(decode), true);
  }

  // 0800C008: pages turned with up and down, B to leave. `kind` 0 ゲームの説明, 1 挑戦状.
  *help(kind) {
    const boot = this.boot;
    const pages = HELP_PAGES[kind];
    let page = 0;
    boot.repeat = true; // 0800A114
    const draw = () => {
      const glyphs = [];
      this.print(glyphs, ADDRESS.helpTitles[kind], 0x28, 0x0c, 2);
      this.print(glyphs, ADDRESS.back, 0xb4, 0x0c, 2);
      this.print(glyphs, this.pointer(ADDRESS.helpPages[kind], page), 0x0a, 0x42, 2);
      if (page > 0) this.print(glyphs, ADDRESS.up, 0x6c, 0x2c, 2, 0x10);
      if (page < pages - 1) this.print(glyphs, ADDRESS.down, 0x6c, 0xce, 2, 0x10);
      boot.layer = { boxes: [HEADER, HELP_BOX], glyphs };
      // Touch: もどるⒷ leaves, the upper half of the page turns back, the lower half forward.
      boot.hits = [
        { x: 0xa8, y: 0x05, w: 0x48, h: 0x13, key: KEY.B },
        { x: HELP_BOX[0], y: HELP_BOX[1], w: HELP_BOX[2], h: HELP_BOX[3] >> 1, key: KEY.UP },
        { x: HELP_BOX[0], y: HELP_BOX[1] + (HELP_BOX[3] >> 1), w: HELP_BOX[2], h: HELP_BOX[3] - (HELP_BOX[3] >> 1), key: KEY.DOWN },
      ];
    };
    while (true) {
      if (boot.pressed(KEY.DOWN) && page < pages - 1) { boot.effect(3); page++; }
      if (boot.pressed(KEY.UP) && page > 0) { page--; boot.effect(3); }
      if (boot.pressed(KEY.B)) break;
      draw();
      yield;
    }
    boot.effect(1);
    boot.repeat = false; // 0800A134
    boot.layer = { boxes: [HEADER], glyphs: [] };
  }

  // 0800C14C: エンディングリスト. Seven rows a page, seven pages (UP and DOWN turn them, B leaves).
  // Row n (08825AD2: title index, flag) prints its label 第n話： with the last character made a
  // space at x 6, then the title at x 0x34 when the flag (020024EC + flag) is set, or the row of
  // ＊ (0801AAD4) when not; a row with flag 0 stays empty. Titles copy with ＄ made ＃ and the
  // character after … dropped (08825368 holds label 2n and title 2t + 1).
  *endingList() {
    const boot = this.boot;
    const flags = boot.vm.ram.flags;
    let page = 0;
    boot.repeat = true; // 0800A114
    const draw = () => {
      const glyphs = [];
      this.print(glyphs, ADDRESS.listTitle, 0x28, 0x0c, 2);
      this.print(glyphs, ADDRESS.listBack, 0xb4, 0x0c, 2);
      for (let r = 0; r < 7; r++) {
        const row = 7 * page + r;
        const at = ADDRESS.listRows - OPTION_TABLE_BASE + 2 * row;
        const titleIndex = this.tables[at];
        const flag = this.tables[at + 1];
        if (!flag) continue;
        const y = 20 * r + 0x40;
        const label = this.relative(ADDRESS.listStrings, 2 * row);
        if (label.length >= 2) label[label.length - 1] = 0x40;
        boot.text(glyphs, label, 6, y, 2, true);
        if (!flags?.[flag]) { this.print(glyphs, ADDRESS.listUnseen, 0x34, y, 2); continue; }
        const source = this.relative(ADDRESS.listStrings, 2 * titleIndex + 1);
        const title = [];
        for (let i = 0; i + 1 < source.length; ) {
          title.push(source[i], source[i + 1]);
          if (source[i] === 0x81 && source[i + 1] === 0x90) title[title.length - 1] = 0x94;
          i += source[i] === 0x81 && source[i + 1] === 0x63 ? 4 : 2;
        }
        boot.text(glyphs, title, 0x34, y, 2, true);
      }
      if (page > 0) this.print(glyphs, ADDRESS.up, 0x6c, 0x28, 2, 0x10);
      if (page <= 5) this.print(glyphs, ADDRESS.down, 0x6c, 0xce, 2, 0x10);
      boot.layer = { boxes: [HEADER, HELP_BOX], glyphs };
      boot.hits = [
        { x: 0xa8, y: 0x05, w: 0x48, h: 0x13, key: KEY.B },
        { x: HELP_BOX[0], y: HELP_BOX[1], w: HELP_BOX[2], h: HELP_BOX[3] >> 1, key: KEY.UP },
        { x: HELP_BOX[0], y: HELP_BOX[1] + (HELP_BOX[3] >> 1), w: HELP_BOX[2], h: HELP_BOX[3] - (HELP_BOX[3] >> 1), key: KEY.DOWN },
      ];
    };
    while (true) {
      if (boot.pressed(KEY.DOWN) && page <= 5) { boot.effect(3); page++; }
      if (boot.pressed(KEY.UP) && page > 0) { page--; boot.effect(3); }
      if (boot.pressed(KEY.B)) break;
      draw();
      yield;
    }
    boot.effect(1);
    boot.repeat = false; // 0800A134
    boot.layer = { boxes: [HEADER], glyphs: [] };
  }

  // 08009B68: a string at table + the big-endian offset in entry `index`.
  relative(table, index) {
    const at = table - OPTION_TABLE_BASE + 4 * index;
    const t = this.tables;
    const start = at - 4 * index + ((t[at] << 24) | (t[at + 1] << 16) | (t[at + 2] << 8) | t[at + 3]);
    const bytes = [];
    for (let i = start; i < t.length && t[i]; i++) bytes.push(t[i]);
    return bytes;
  }

  // 0800CEA8: the controls picture at full brightness until A or B.
  *controls(mode) {
    const boot = this.boot;
    const glyphs = [];
    this.print(glyphs, this.pointer(ADDRESS.items, 2), 0x5a, 0x0c, 2);
    boot.layer = { boxes: [HEADER], glyphs };
    boot.setLevel(1, 0x100);
    yield* boot.picture(CONTROLS_PICTURE, boot.loadLag(DECODE.controls), true);
    yield* this.waitAB();
    if (mode === 1) boot.setLevel(1, 0xc8);
    boot.layer = { boxes: [HEADER], glyphs: [] };
  }

  // 08009D58: frames until A or B, then the decide sound.
  *waitAB() {
    const boot = this.boot;
    do {
      boot.hits = [{ x: 0, y: 0, w: 240, h: 160, current: true }];
      yield;
    } while (!boot.pressed(KEY.A | KEY.B));
    boot.effect(0);
  }

  // 0800CCDC: 明度 (up and down) and 彩度 (left and right) over a test picture. The values are the
  // palette transform's (08001D74) and stay in effect everywhere; bookmarks keep them.
  *tone(mode) {
    const boot = this.boot;
    const tone = boot.screen.tone;
    boot.setLevel(1, 0x100);
    boot.layer = { boxes: [HEADER], glyphs: [] };
    yield* boot.picture(TONE_PICTURE, boot.loadLag(DECODE.tone), true);
    boot.repeat = true;
    const draw = () => {
      const glyphs = [];
      this.print(glyphs, ADDRESS.brightness, 0x0a, 0x0c, 2);
      this.number(glyphs, 0x32, 0x0c, tone.brightness - 5);
      this.print(glyphs, ADDRESS.saturation, 0x6e, 0x0c, 2);
      this.number(glyphs, 0x96, 0x0c, tone.saturation - 5);
      boot.layer = { boxes: [HEADER], glyphs };
      // Touch: the arrows of the cross on the picture (明るく, 暗く, 淡く, 濃く) and the rest as A.
      const cx = 0x44, cy = 0x6a;
      boot.hits = [
        { x: cx - 12, y: cy - 34, w: 24, h: 24, key: KEY.UP },
        { x: cx - 12, y: cy + 10, w: 24, h: 24, key: KEY.DOWN },
        { x: cx - 40, y: cy - 12, w: 30, h: 24, key: KEY.LEFT },
        { x: cx + 10, y: cy - 12, w: 30, h: 24, key: KEY.RIGHT },
        { x: 0, y: 0, w: 240, h: 160, current: true },
      ];
    };
    const step = (key, field, delta) => {
      const [low, high] = TONE_LIMITS[field];
      const value = tone[field] + delta;
      if (!boot.pressed(key) || value < low || value > high) return false;
      boot.effect(3);
      tone[field] = value;
      boot.screen.renderBackground();
      return true;
    };
    while (true) {
      draw();
      yield;
      // 0800CDDA: one change a frame, checked in this order.
      step(KEY.LEFT, "saturation", -1) || step(KEY.RIGHT, "saturation", 1)
        || step(KEY.DOWN, "brightness", -1) || step(KEY.UP, "brightness", 1);
      if (boot.pressed(KEY.A | KEY.B)) break;
    }
    boot.effect(0);
    boot.repeat = false;
    boot.layer = { boxes: [HEADER], glyphs: [] };
    if (mode === 1) boot.setLevel(1, 0xc8);
  }

  // 080070DC: a full-width number; one digit sits 7 pixels in, 10-19 2 pixels in.
  number(glyphs, x, y, value) {
    const digits = this.boot.digits(value);
    const inset = value < 10 ? 7 : value < 20 ? 2 : 0;
    this.boot.text(glyphs, digits, x + inset, y, 2, true);
  }

  // 0800BD84: the cast list; each entry shows its profiles one by one over their pictures.
  *cast(mode) {
    const boot = this.boot;
    const title = mode === 1;
    let selected = 0;
    while (true) {
      const glyphs = [];
      this.print(glyphs, ADDRESS.castTitle, 0x52, 0x0c, 2);
      glyphs.push({ ...boot.point(0x39, 0x3c + ROW * selected), encoded: POINTER, color: 2 });
      ADDRESS.castItems.forEach((address, i) => this.print(glyphs, address, 0x4c, ITEM_Y + ROW * i, i === selected ? 2 : 3));
      this.print(glyphs, ADDRESS.back, 0x4c, ITEM_Y + ROW * 4, selected === 4 ? 2 : 3);
      boot.layer = { boxes: [HEADER, CAST_BOX], glyphs };
      boot.hits = this.rowHits(CAST_BOX, 5, selected, (i) => { boot.effect(3); selected = i; });
      yield;
      if (boot.pressed(KEY.DOWN) && selected <= 3) { boot.effect(3); selected++; }
      if (boot.pressed(KEY.UP) && selected > 0) { selected--; boot.effect(3); }
      if (boot.pressed(KEY.B)) { boot.effect(1); break; }
      if (!boot.pressed(KEY.A)) continue;
      if (selected === 4) { boot.effect(1); break; }
      boot.effect(0);
      boot.layer = null;
      boot.fadeOut(1, 1);
      boot.fadeOut(1, 5);
      yield* boot.waitFade(1);
      if (title) boot.setLevel(1, 0x100);
      for (const index of CAST_GROUPS[selected]) yield* this.profile(index);
      if (title) boot.setLevel(1, 0xc8);
      // 0800BDB6: the screen's picture comes back and fades in under the list.
      boot.layer = null;
      yield* this.backdrop(mode, DECODE.castBack);
      boot.layer = { boxes: [HEADER, CAST_BOX], glyphs: [] };
      boot.fadeIn(0x0a, 1);
      boot.fadeIn(0x0a, 5);
      yield* boot.waitFade(1);
    }
    boot.layer = { boxes: [HEADER], glyphs: [] };
  }

  // 0800BCE8: one profile, its picture fading in before the text shows.
  *profile(index) {
    const boot = this.boot;
    boot.layer = null;
    yield* boot.picture(this.half(ADDRESS.castPictures, index), boot.loadLag(DECODE.profile));
    boot.fadeIn(0x0a, 1);
    boot.fadeIn(0x0a, 5);
    yield;
    const glyphs = [];
    this.print(glyphs, this.pointer(ADDRESS.castText, index), 0x4b, 0x14, 2);
    yield* boot.waitFade(1);
    boot.layer = { boxes: [], glyphs };
    yield* this.waitAB();
    boot.fadeOut(1, 1);
    boot.fadeOut(1, 5);
    yield* boot.waitFade(1);
    boot.layer = null;
  }
}
