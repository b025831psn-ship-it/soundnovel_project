// System command 1D 00 (08009494 table -> 0800EC3C): the cartridge's start-up screens before the
// scenario takes over. Chunsoft logo, copyright, title and its menu run here as native code, not as
// scenario bytecode, so they are ported routine by routine. Each `yield` is one frame wait
// (08002FB8); fades use the same brightness slots the scenario VM steps every VBlank.
import { ObjTextSurface } from "./obj-text.js";
import { NameEntry, NAME_PICTURES, adoptNameText } from "./name-entry.js";
import { adoptRomString, romString } from "./rom-text.js";
import { DEFAULT_TINT } from "./silhouette.js";
import { Books, pageState, restoreData, restorePosition } from "./save.js";
import { FlowMap, MapSurface, FLOW_COLUMNS, FLOW_ROWS, flowScaleX } from "./flow-map.js";
import { Options, CONTROLS_PICTURE, TONE_PICTURE, CAST_PICTURES } from "./options.js";

// Image ids passed to 08003878. 08000DC4 maps 0x2329-0x2331 to picture id - 0x2328 + 0xE7 and
// 0x238C-0x2422 through the signed byte table at 08019400 (+0xE7).
const LOGO = 0x232a;
const COPYRIGHT = 0x232d;
const TITLE = 0x23f3;
// 0800E328 shows bookmark book n as picture 0x23F0 + n (the chosen book in front of the other two).
const BOOKS = [0x23f0, 0x23f1, 0x23f2];
export function pictureIndex(id, table = null) {
  if (id < 0xfa0) return id % 1000;
  if (id <= 0x2331) return id - 0x2328 + 0xe7;
  const at = id - 0x238c;
  if (!table || at < 0 || at > 0x96) return -1;
  const value = (table[at] << 24) >> 24;
  return value > 0 ? value + 0xe7 : -1;
}

// Where each literal sits on the cartridge (see rom-text.js). A ROM whose strings were rewritten in
// place (the Korean fan patch) replaces them when its ui/system-text.bin is loaded.
function adoptSystemText(blob) {
  const take = (target, address) => adoptRomString(target, blob, address);
  take(MENU[0].label, 0x1ae9c);
  take(MENU[1].label, 0x1ae8c);
  take(UNUSED, 0x199d4);
  [0x1acb4, 0x1aca4, 0x1ac94, 0x1ac88].forEach((at, i) => take(SJIS.bookMenu[i], at));
  [0x1ab70, 0x1ab78, 0x1ab84, 0x1ac88].forEach((at, i) => take(SJIS.gameMenu[i], at));
  [0x1ad84, 0x1ad74, 0x1ad64].forEach((at, i) => take(SJIS.copyTargets[i], at));
  for (const [key, at] of [["saving", 0x198fc], ["saved", 0x19948], ["loading", 0x1acc8], ["erasing", 0x1ad2c],
    ["turns", 0x199c4], ["good", 0x199cc], ["bad", 0x199d0], ["yes", 0x19638], ["no", 0x19640]]) take(SJIS[key], at);
  // The port's 上書きしますか？ is not on the cartridge; a translation shows its 0801ADDA question
  // (after the r r s s s s layout codes).
  const question = romString(blob, 0x1ade0);
  if (question && question[0] !== 0x8f) take(SJIS.overwrite, 0x1ade0);
}

// 0801AEAC/0801AEC4 rectangles (x, y, w, h), 0801AEA5 text x, 0801AEA7 cursor x, 08825F6C labels.
const MENU = [
  { rect: [0x3c, 0x83, 0x34, 0x12], textX: 0x3e, cursorX: 0x3d, label: [0x82, 0xcd, 0x82, 0xb6, 0x82, 0xdf, 0x82, 0xe9] },
  { rect: [0x81, 0x83, 0x33, 0x12], textX: 0x8a, cursorX: 0x81, label: [0x90, 0xe0, 0x81, 0x40, 0x81, 0x40, 0x81, 0x40, 0x81, 0x40, 0x96, 0xbe] },
];
const MENU_TEXT_Y = 0x86;
// 0801AC80 header bar of the bookmark screen and 080199D4 未使用.
const HEADER = [0x00, 0x05, 0xf0, 0x13];
const UNUSED = [0x96, 0xa2, 0x8e, 0x67, 0x97, 0x70];
// Frames the bookmark picture decode takes, and how many label glyphs are on screen in each frame
// after it (mGBA: first entry 589 -> 599 -> 602/603, a change 701 -> 706 -> 709/710).
const BOOK_LAG = { first: 10, change: 5 };
const BOOK_REVEAL = { first: [0, 0, 0, 2], change: [0, 0, 0, 3] };
// The ideographic space between 説 and 明 advances 2 pixels on the cartridge (mGBA frame 500).
const SPACE_ADVANCE = 2;
const CURSOR = { y: 0x84, w: 0x34, h: 0x10 };
// 08001960 breathes the cursor frame outward by 0-3 pixels: 4 frames per step, 8 at the ends.
// It first shows two frames after the menu, partway into the step that grows it by one pixel.
const CURSOR_GROW = [0, 0, 1, 2, 3, 3, 2, 1];
const CURSOR_FIRST_TICK = 7;
const CURSOR_RETURN_TICK = 2;
const CURSOR_HIDDEN = 2;

// Palette bank 15 colors (BGR555) the title menu uses: BG1 box 0x0E, OBJ outline 1, white 2, grey 3.
// BOX is what mGBA shows at the default 明度 and 彩度; BOX_RAW is the color before 08001D74
// (both settings at 5 turn it into 0x15D9).
const BOX = 0x15d9;
const BOX_RAW = 0x1594;
// OBJ palette 15 (mGBA, the 移動 screen): text, gray, pink links, page map colors, box colors.
const OBJ_COLORS = {
  1: 0x0000, 2: 0x7fff, 3: 0x56b5, 4: 0x6dff, 5: 0x03e0, 6: 0x7ed6, 7: 0x3fff, 8: 0x7fff,
  9: 0x7fff, 10: 0x7fff, 11: 0x7fff, 12: 0x001f, 13: 0x2fff, 14: 0x03e0, 15: 0x7c00,
};
// 08001960: the 移動 cursor's corners pulse by this table at (03000BE0 >> 2) & 7 (08019504).
const MAP_PULSE = [0, 1, 2, 3, 3, 2, 1, 0];
// BLDCNT 0x3146 / BLDALPHA 0x070D: BG1 and semi-transparent OBJs blend over BG0 at 13/16 + 7/16.
const EVA = 13;
const EVB = 7;

export const KEY = { A: 1, B: 2, SELECT: 4, START: 8, RIGHT: 16, LEFT: 32, UP: 64, DOWN: 128, R: 256, L: 512 };

// Shift JIS of the few fixed strings the bookmark screens print (0801ACxx, 080198xx, 080199xx).
const SJIS = {
  // 08825F4C: 本を読む, 本の内容を消す, 本の内容を写す, もどるⒷ
  bookMenu: [
    [0x96, 0x7b, 0x82, 0xf0, 0x93, 0xc7, 0x82, 0xde],
    [0x96, 0x7b, 0x82, 0xcc, 0x93, 0xe0, 0x97, 0x65, 0x82, 0xf0, 0x8f, 0xc1, 0x82, 0xb7],
    [0x96, 0x7b, 0x82, 0xcc, 0x93, 0xe0, 0x97, 0x65, 0x82, 0xf0, 0x8e, 0xca, 0x82, 0xb7],
    [0x82, 0xe0, 0x82, 0xc7, 0x82, 0xe9, 0x84, 0x87],
  ],
  // 0800C9xx: 移動, オプション (glyphs 8490 8491 8470 8471 8472), セーブ, もどるⒷ
  gameMenu: [
    [0x88, 0xda, 0x93, 0xae],
    [0x84, 0x90, 0x84, 0x91, 0x84, 0x70, 0x84, 0x71, 0x84, 0x72],
    [0x83, 0x5a, 0x81, 0x5b, 0x83, 0x75],
    [0x82, 0xe0, 0x82, 0xc7, 0x82, 0xe9, 0x84, 0x87],
  ],
  saving: [0x83, 0x5a, 0x81, 0x5b, 0x83, 0x75, 0x92, 0x86, 0x82, 0xc5, 0x82, 0xb7, 0x81, 0x42], // セーブ中です。
  saved: [0x83, 0x5a, 0x81, 0x5b, 0x83, 0x75, 0x82, 0xaa, 0x8f, 0x49, 0x97, 0xb9, 0x82, 0xb5, 0x82, 0xdc, 0x82, 0xb5, 0x82, 0xbd, 0x81, 0x42],
  // 0801ACC8 ゲームデータを読み込み中です。
  loading: [0x83, 0x51, 0x81, 0x5b, 0x83, 0x80, 0x83, 0x66, 0x81, 0x5b, 0x83, 0x5e, 0x82, 0xf0, 0x93, 0xc7, 0x82, 0xdd, 0x8d, 0x9e, 0x82, 0xdd, 0x92, 0x86, 0x82, 0xc5, 0x82, 0xb7, 0x81, 0x42],
  // 0801AD2C ゲームデータを消去しています。
  erasing: [0x83, 0x51, 0x81, 0x5b, 0x83, 0x80, 0x83, 0x66, 0x81, 0x5b, 0x83, 0x5e, 0x82, 0xf0, 0x8f, 0xc1, 0x8b, 0x8e, 0x82, 0xb5, 0x82, 0xc4, 0x82, 0xa2, 0x82, 0xdc, 0x82, 0xb7, 0x81, 0x42],
  // 0801AD84 / 0801AD74 / 0801AD64: 左の本に写す, 中央の本に写す, 右の本に写す
  copyTargets: [
    [0x8d, 0xb6, 0x82, 0xcc, 0x96, 0x7b, 0x82, 0xc9, 0x8e, 0xca, 0x82, 0xb7],
    [0x92, 0x86, 0x89, 0x9b, 0x82, 0xcc, 0x96, 0x7b, 0x82, 0xc9, 0x8e, 0xca, 0x82, 0xb7],
    [0x89, 0x45, 0x82, 0xcc, 0x96, 0x7b, 0x82, 0xc9, 0x8e, 0xca, 0x82, 0xb7],
  ],
  yes: [0x82, 0xcd, 0x82, 0xa2], // 08019638 はい
  no: [0x82, 0xa2, 0x82, 0xa2, 0x82, 0xa6], // 08019640 いいえ
  // 上書きしますか？ (the port's shortening of 0801ADDA 上書きをしてもよろしいですか？)
  overwrite: [0x8f, 0xe3, 0x8f, 0x91, 0x82, 0xab, 0x82, 0xb5, 0x82, 0xdc, 0x82, 0xb7, 0x82, 0xa9, 0x81, 0x48],
  turns: [0x89, 0xf1, 0x96, 0xda], // 080199C4 回目
  good: [0x8a, 0xae], // 080199CC 完
  bad: [0x8f, 0x49], // 080199D0 終
};
// 0801ACC0, 080198F4, 0801AC80: BG1 rectangles of the book menu, the saving note and the header.
const BOOK_MENU_BOX = [60, 35, 120, 65];
// 08019530: the two-item box of the screens after an ending (opcode 44).
const ENDING_BOX = [0x3c, 0x62, 0x78, 0x30];
const SAVE_BOX = [75, 49, 93, 22];
const LOAD_BOX = [0x12, 0x31, 0xcc, 0x16];
// The menu box as mGBA shows it (0800CA02 builds 0xA8, 0x48 wide; 28..93 on screen).
const GAME_MENU_BOX = [0xa8, 28, 0x48, 66];
const MENU_POINTER = 0x8484;
// 0800C97C: the in-game menu shows picture 0xDE (the owl) behind its boxes.
const MENU_PICTURE = 0xde;
// 1D 66 with a book being read: from the exit fade's first step to the book's fade-in (mGBA 1804 -> 1932).
const LOAD_FRAMES = 128;
const LOAD_FADE_FRAMES = 31;

// 080126E0's twelve suspects: the cartridge addresses of their accepted spellings and of the name
// written in their place (strings in ui/system-text.bin).
const SUSPECT_NAMES = [
  [[0x1b834, 0x1b840, 0x1b84c, 0x1b85c, 0x1b86c], 0x1b878], // 美樹本
  [[0x1b884, 0x1b88c, 0x1b898, 0x1b8a4], 0x1b8b4], // 田中
  [[0x1b8c0, 0x1b8cc, 0x1b8d4, 0x1b8e4, 0x1b8f4, 0x1b900, 0x1b90c, 0x1b918, 0x1b924, 0x1b930, 0x1b93c], 0x1b948], // 小林
  [[0x1b954, 0x1b960, 0x1b970, 0x1b980, 0x1b990, 0x1b99c], 0x1b9a8], // 今日子
  [[0x1b9b4, 0x1b9bc, 0x1b9c8, 0x1b9d8, 0x1b9e4, 0x1b9f4, 0x1ba00, 0x1ba10, 0x1ba20, 0x1ba30, 0x1ba40], 0x1ba4c], // 香山
  [[0x1ba58, 0x1ba60, 0x1ba70, 0x1ba7c, 0x1ba84, 0x1ba8c, 0x1ba9c, 0x1baac], 0x1bab8], // 春子
  [[0x1bac4, 0x1bacc, 0x1bad4, 0x1bae4, 0x1baf0, 0x1bafc, 0x1bb04], 0x1bb0c], // 俊夫
  [[0x1bb18, 0x1bb20, 0x1bb2c, 0x1bb3c, 0x1bb48, 0x1bb58, 0x1bb68], 0x1bb3c], // みどり
  [[0x1bb78, 0x1bb80, 0x1bb8c, 0x1bb98], 0x1bba8], // 亜希
  [[0x1bbb4, 0x1bbbc, 0x1bbc4, 0x1bbd4], 0x1bbe4], // 可奈子
  [[0x1bbf4, 0x1bbfc, 0x1bc04, 0x1bc14], 0x1bc24], // 啓子
  [[0x1bc30, 0x1bc3c, 0x1bc48, 0x1bc54, 0x1bc64, 0x1bc70, 0x1bc7c, 0x1bc88, 0x1bc94, 0x1bca4, 0x1bcb4], 0x1bcc4], // OL
];
// 08012CF4(n): the default entry, the (option, suspect) tries in order, and the slot written last.
const CULPRIT_MATCHES = {
  0x20: { fallback: 5, calls: [[0, 0], [1, 1], [2, 4], [3, 7], [4, 2], [4, 3], [4, 5], [4, 6], [4, 8], [4, 9], [4, 10], [4, 11]], slot: 3 },
  0x21: { fallback: 4, calls: [[0, 0], [1, 1], [2, 6], [3, 4], [3, 7], [3, 2], [3, 3], [3, 5], [3, 8], [3, 9], [3, 10], [3, 11]], slot: 4 },
  0x22: { fallback: 5, calls: [[0, 0], [1, 8], [1, 9], [1, 10], [2, 11], [3, 5], [4, 1], [4, 6], [4, 4], [4, 7], [4, 2], [4, 3]], slot: 5 },
};

export class Boot {
  constructor({ vm, screen, assets, font, sound, books }) {
    this.vm = vm;
    this.screen = screen;
    this.assets = assets;
    this.font = font;
    this.sound = sound;
    this.pictures = new Map();
    this.run = null;
    this.trigger = 0;
    this.latched = 0;
    this.layer = null;
    this.deferred = [];
    this.logoShown = false; // 020066C1: set when returning to the title from a game
    this.book = 0; // 02004642: last bookmark chosen
    // Touch and mouse: the screen in front lists what can be picked ({ x, y, w, h, current,
    // select(), key }); a tap moves the cursor there like the d-pad, or presses A on the current item.
    this.hits = [];
    this.injected = 0;
    // Bookmarks: the page-start state the VM reports, the book being read back, and the books.
    this.books = books ?? new Books();
    this.pageStart = null;
    this.loading = null;
    this.continueRequest = null;
    this.titleActive = false;
    this.resumeWaiting = null;
    vm.onPageStart = (bank, offset) => {
      this.pageStart = pageState(vm, bank, offset, { names: this.names });
      this.suspend();
    };
    // 02006649 + 16 * slot: the names the text shows (1 hero 透, 2 girlfriend 真理, 0 culprit).
    this.names = { 0: [], 1: [0x93, 0xa7], 2: [0x90, 0x5e, 0x97, 0x9d] };
    // 020006C4: VBlank count (080066E8), zeroed by the 080031C0 init. mGBA frame f reads f - 3, and
    // this port starts 17 frames after power-on (row 31000), so the count starts at 13 here.
    this.tick = 13;
    this.blank = false; // DISPCNT 0
    this.repeat = false; // 020289C4: d-pad auto-repeat
    this.repeatCount = 0;
    this.repeatKeys = 0;
    this.titlePicture = TITLE;
    this.menuPicture = MENU_PICTURE;
  }

  // The language-specific data of the native screens: menu strings, default names, name lists,
  // the flowchart and the オプション text. Called again with the other language's assets when the
  // player switches language; names still at the old defaults take the new ones.
  async loadText(assets) {
    const previousDefaults = this.defaultNames;
    this.nameTable = await assets.bin("ui/name-table.bin");
    try { this.systemText = await assets.bin("ui/system-text.bin"); } catch { this.systemText = null; }
    if (this.systemText) {
      adoptSystemText(this.systemText);
      adoptNameText(this.systemText);
    }
    // 088206F8 / 088206FC point at the names the game starts with (透 080197EC, 真理 080197E4);
    // kgk ui/default-names.bin holds the two strings, 0-terminated.
    this.defaultNames = { 1: this.names[1], 2: this.names[2] };
    try {
      const bytes = Array.from(await assets.bin("ui/default-names.bin"));
      const end = bytes.indexOf(0);
      if (end > 0) this.defaultNames = { 1: bytes.slice(0, end), 2: bytes.slice(end + 1, bytes.indexOf(0, end + 1)) };
    } catch {}
    const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
    for (const slot of [1, 2]) {
      if (!previousDefaults || same(this.names[slot], previousDefaults[slot])) this.names[slot] = this.defaultNames[slot];
    }
    this.nameEntry = new NameEntry({ boot: this, font: this.font, table: this.nameTable });
    try { this.flow = await assets.bin("ui/flow-map.bin"); } catch { this.flow = null; }
    try {
      const [glyphs, titles] = await Promise.all([assets.bin("ui/map-glyphs.bin"), assets.bin("ui/map-titles.bin")]);
      if (this.flow) this.flowMap = new FlowMap({ flow: this.flow, glyphs, titles });
    } catch { this.flowMap = null; }
    try {
      const [text, tables] = await Promise.all([assets.bin("ui/option-text.bin"), assets.bin("ui/option-tables.bin")]);
      this.options = new Options({ boot: this, text, tables });
    } catch { this.options = null; }
  }

  async load() {
    this.pictureMap = await this.assets.bin("ui/picture-map.bin");
    await this.loadText(this.assets);
    const optionPictures = this.options ? [CONTROLS_PICTURE, TONE_PICTURE, ...CAST_PICTURES] : [];
    const ids = [LOGO, COPYRIGHT, TITLE, ...BOOKS, ...NAME_PICTURES, MENU_PICTURE, ...optionPictures];
    const loaded = await Promise.all(ids.map((id) => {
      const name = String(pictureIndex(id, this.pictureMap)).padStart(3, "0");
      return Promise.all([this.assets.bin(`bg/${name}.bin`), this.assets.bin(`palette/${name}.bin`)]);
    }));
    for (const [i, id] of ids.entries()) {
      const [tiles, palette] = loaded[i];
      // BG palette bank 15 (240-255) holds the menu colors on the title and the bookmark screen.
      if (id === TITLE || BOOKS.includes(id) || id === MENU_PICTURE) {
        palette.fill(0, 480);
        [[253, 0x5b7f], [254, BOX], [255, BOX]].forEach(([index, color]) => {
          palette[2 * index] = color & 255;
          palette[2 * index + 1] = color >> 8;
        });
      }
      this.pictures.set(id, { tiles, palette });
    }
    return this;
  }

  // Host side of opcode 1D. Returns the VM wait while a native screen owns the frame.
  command(command, ram) {
    // 1D 1C (080096FC): set 0200077F so the next opcode 16 takes the preset entry unseen.
    if (command === 0x1c) { ram.choiceSkip = 1; return undefined; }
    this.ram = ram;
    // 1D 67 (08009858): the game proper starts (0200078D = 1, R opens the menu). After 本を読む
    // the scenario carries on from the book's page instead.
    // 1D 66 (08009838) after the welcome's exit fade (19:3DC: 08 28 00 on slots 1 and 5, then
    // 0B waits for both): with a book being read, 0800AEA4 reads it back here. mGBA (save1):
    // the press on では、ごゆっくり… is frame 1800, the screen is black from 1815 and the
    // book's picture comes up from 1932 (LOAD_FRAMES covers the 0B waits and the flash read).
    if (command === 0x66) {
      if (!this.loading) return undefined;
      // Without the original timing only the exit fade (0x28 * 3/4 frames) is waited for.
      this.vm.waitFrames = this.originalLoadTiming === false ? LOAD_FADE_FRAMES : LOAD_FRAMES;
      return { waiting: "delay" };
    }
    if (command === 0x67) {
      ram.inGame = 1;
      if (this.loading) { this.restore(this.loading); this.resume(this.loading); }
      this.loading = null;
      return undefined;
    }
    // 1D 24 (0800973A): the unlocks the endings recorded so far give (020024EC + n = flag n).
    // Any of endings 1-4 opens 0x33 (the shorter second reading); endings 1-20 and 43 open 0x34
    // (the pink bookmark and エンディングリスト); ending 24 opens 0x35; flags 1-43 all set open 0x36.
    if (command === 0x24) {
      const flags = ram.flags;
      const all = (list) => list.every((n) => flags[n]);
      const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
      if (flags[1] || flags[2] || flags[3] || flags[4]) flags[0x33] = 1;
      if (all([...range(1, 0x14), 0x2b])) flags[0x34] = 1;
      if (flags[0x18]) flags[0x35] = 1;
      if (all(range(1, 0x2b))) flags[0x36] = 1;
      return undefined;
    }
    // 1D 6A / 6B (080098C8 / 080098D4): SELECT is armed for page waits (0800750C), or not.
    if (command === 0x6a || command === 0x6b) { ram.selectArmed = command === 0x6a ? 1 : 0; return undefined; }
    // 1D 20 / 21 / 22 (08012CF4): the culprit's name (slot 0) is tried against each suspect in
    // turn; a match writes the suspect's proper name into slot 0 and makes its option the entry
    // opcode 16 takes (02000780). Slot 0 is then copied to slot 3, 4 or 5 (080081D0).
    if (command >= 0x20 && command <= 0x22) {
      const { fallback, calls, slot } = CULPRIT_MATCHES[command];
      let result = fallback;
      for (const [option, suspect] of calls) result = this.matchSuspect(result, option, suspect);
      this.names[slot] = [...(this.names[0] ?? [])];
      ram.choicePreset = result;
      return undefined;
    }
    if (command === 0x03) this.run = this.nameScreens([0, 1]);
    else if (command === 0x04) this.run = this.nameScreens([2]);
    else if (command === 0x00) this.run = this.title();
    else return undefined;
    return { waiting: "boot" };
  }

  // 080126E0(result, 0, option, suspect): slot 0 equal to one of the suspect's spellings (08009B10,
  // whole strings) takes the suspect's proper name (08008198) and returns `option`.
  matchSuspect(result, option, suspect) {
    const [aliases, proper] = SUSPECT_NAMES[suspect];
    const name = this.names[0] ?? [];
    const same = (at) => {
      const bytes = romString(this.systemText, at);
      return bytes && bytes.length === name.length && bytes.every((byte, i) => byte === name[i]);
    };
    if (!aliases.some(same)) return result;
    this.names[0] = romString(this.systemText, proper) ?? name;
    return option;
  }

  // 08009670 (1D 03): hero then girlfriend; 0800967E (1D 04): the culprit, then 0200077F = 1.
  *nameScreens(modes) {
    for (const mode of modes) yield* this.nameEntry.run(mode);
    if (modes[0] === 2) this.ram.choiceSkip = 1;
  }

  // Web only (not on the cartridge): the page the player is on is kept in the suspend slot, so a
  // closed tab or another device carries on from here. The welcome and title pages do not count.
  suspend() {
    if (!this.vm.ram.inGame || !this.pageStart || !this.books.suspend) return;
    this.books.suspend.write({
      title: this.nodeTitle(this.vm.ram.node),
      tone: { ...this.screen.tone },
      state: this.pageStart,
    });
  }

  // Web only, debug mode (src/debug-jump.js): the game goes straight to a page state, from the
  // title or the story alike, the way a book is read back (picture, silhouettes, music, page).
  debugJump(state) {
    if (this.run) {
      try { this.run.return(); } catch { /* the screen's own cleanup */ }
      this.run = null;
    }
    this.layer = null;
    this.loading = null;
    this.continueRequest = null;
    this.resumeWaiting = null;
    this.jumped = false;
    this.restore({ state, tone: null });
    this.resume({ state });
    this.vm.ram.inGame = 1;
    this.vm.waiting = "none";
    this.onMenuClosed?.();
  }

  // Web only: whether the suspend slot has a page to carry on from.
  canContinue() {
    return !!this.books.suspend?.read();
  }

  // Web only: carry on from the suspend slot. Only possible at the title menu: the title ends
  // the way 本を読む does (the welcome plays, then 1D 67 puts the page back). Returns whether it was taken.
  continueSuspended() {
    const data = this.books.suspend?.read();
    if (!data || !this.titleActive || this.continueRequest) return false;
    this.continueRequest = data;
    return true;
  }

  // 0800B79C: whether any book is in use.
  anySave() {
    return this.books.any();
  }

  // R in the story (0800C9xx): open the in-game menu over the page.
  openMenu() {
    if (this.run || !this.vm.ram.inGame) return false;
    this.ram = this.vm.ram;
    this.resumeWaiting = this.vm.waiting;
    this.vm.waiting = "boot";
    this.run = this.gameMenu();
    return true;
  }

  // 0800AEA4: the book's RAM, names, picture and music come back and the picture fades in over
  // 0x0A frames (080063F4 on slots 1..4 where a picture is set, then 5). Slots 2..4 and 8 are
  // not drawn by this port.
  restore(book) {
    const state = book.state;
    if (book.tone) Object.assign(this.screen.tone, book.tone); // 0800B2AE
    restoreData(this.vm, state);
    Object.assign(this.names, state.names ?? {});
    if (state.picture !== null && state.picture !== undefined) this.vm.scene?.load?.(state.picture);
    // The silhouettes of the page (02000728) are put back on the layer.
    const scene = this.vm.scene;
    if (scene?.silhouetteClear) {
      scene.silhouetteClear();
      for (const id of this.vm.ram.silhouettes ?? []) if (id !== 0xffff) scene.silhouetteAdd(id);
      scene.silhouetteShow(0, this.vm.tint());
    }
    if (state.song !== undefined && state.song !== -1 && state.song !== 0xffff) this.vm.sound?.play?.(state.song, 0);
    if (state.picture !== null && state.picture !== undefined) this.fadeIn(0x0a, 1);
    this.fadeIn(0x0a, 5);
  }

  // 1D 67 after 本を読む: the scenario moves to the book's page start, on a clean page.
  resume(book) {
    restorePosition(this.vm, book.state);
    this.vm.text?.resumed?.();
    if (this.vm.text) { this.vm.text.fragments = []; this.vm.text.pageRaw = []; this.vm.text.rest = null; }
  }

  // 02028B8C: the flowchart's scene titles. 0800B8A0 keeps what follows '：' and drops the
  // control pairs (s8, c2, ...).
  nodeTitle(node) {
    const flow = this.flow;
    if (!flow || !node) return [];
    const be = (at) => ((flow[at] << 24) | (flow[at + 1] << 16) | (flow[at + 2] << 8) | flow[at + 3]) >>> 0;
    const list = be(4 + 8 * 2);
    const at = list + be(list + 4 * (node - 1));
    let bytes = [];
    for (let i = at; i < flow.length && flow[i]; ) {
      if (flow[i] >= 0x81) { bytes.push(flow[i], flow[i + 1]); i += 2; }
      else i += 2; // an ASCII control letter and its argument
    }
    for (let i = bytes.length - 2; i >= 0; i -= 2) {
      if (bytes[i] === 0x81 && bytes[i + 1] === 0x46) { bytes = bytes.slice(i + 2); break; }
    }
    return bytes;
  }

  // Full-width digits for the 回目 / 完 / 終 counts (0800722C).
  digits(value) {
    return [...String(value)].flatMap((d) => [0x82, 0x4f + Number(d)]);
  }

  get active() {
    return this.run !== null;
  }

  // Once per frame after vm.vblank(): `trigger` holds the KEYINPUT bits newly pressed this frame
  // (020006E4). The first call comes in the frame the scenario reached 1D 00.
  frame(trigger = 0, held = 0) {
    if (!this.run) return;
    // 08009BF8 with 020289C4 set: a d-pad direction held for 30 more frames repeats, then every 6.
    if (this.repeat) {
      const pad = held & 0xf0;
      if (!pad || pad !== this.repeatKeys) this.repeatCount = 30;
      else if (this.repeatCount <= 0) { trigger |= pad; this.repeatCount = 5; }
      else this.repeatCount--;
      this.repeatKeys = pad;
    }
    // 020006E4 is latched in the VBlank interrupt, so the routine sees a press one frame later.
    trigger |= this.injected;
    this.injected = 0;
    this.heldKeys = held;
    this.trigger = this.latched;
    this.latched = trigger;
    this.hits = [];
    for (const start of this.deferred.splice(0)) start();
    const { done } = this.run.next();
    this.draw();
    if (done) {
      this.run = null;
      if (this.jumped) {
        // 移動 chose a scene: the scenario starts there on a clean screen.
        this.jumped = false;
        this.resumeWaiting = null;
        this.onMenuClosed?.();
      }
      if (this.resumeWaiting) {
        // Back from the in-game menu: the story picture and page come back as they were.
        this.vm.waiting = this.resumeWaiting;
        this.resumeWaiting = null;
        this.onMenuClosed?.();
        return;
      }
      this.vm.waiting = "none";
      for (let count = 0; count < 1024 && this.vm.step(); count++);
    }
  }

  // 080066E8 runs in every VBlank, story or native screen alike.
  vblank() {
    this.tick++;
  }

  // A tap at (x, y) in GBA pixels. Returns false when the screen has nothing to pick (the shell
  // then treats the tap as A, which skips the logo and advances text).
  tap(x, y) {
    if (!this.run || !this.hits.length) return false;
    const hit = this.hits.find((h) => x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h);
    if (!hit) return true;
    if (hit.key) this.injected |= hit.key;
    else if (hit.current) this.injected |= KEY.A;
    else hit.select();
    return true;
  }

  pressed(mask) {
    return (this.trigger & mask) !== 0;
  }

  held(mask) {
    return (this.heldKeys & mask) !== 0;
  }

  // 08003878 -> 08000DC4: decode a picture into BG0. The LZ77 copy costs `lag` frames.
  // `late` keeps the previous picture on screen until the decode finishes (bookmark books).
  *picture(id, lag, late = false) {
    const { tiles, palette } = this.pictures.get(id);
    if (!late) this.screen.setBackground(tiles, palette, 0);
    for (let n = 0; n < lag; n++) yield;
    if (late) this.screen.setBackground(tiles, palette, 0);
  }

  // Frames the cartridge spends decoding or reading flash. The web version skips these pure
  // loading pauses; `?timing=original` keeps them.
  loadLag(frames) {
    return this.originalLoadTiming === false ? 0 : frames;
  }

  showPicture(id) {
    const { tiles, palette } = this.pictures.get(id);
    this.screen.setBackground(tiles, palette, 0);
  }

  // 080065A8(slot, level): the slot's maximum becomes level << 8 (0x100 at most) and the slot
  // stands at half of it at once, so later fades (080063F4) stop there too.
  setLevel(slot, level) {
    this.vm.ram.brightness[slot].maximum = Math.min(level, 0x100) << 8;
    this.setBrightness(slot, Math.min(level, 0x100) << 7);
  }

  // The slot's brightness at once, its maximum kept.
  setBrightness(slot, value) {
    const effect = this.vm.ram.brightness[slot];
    effect.current = effect.target = value;
    effect.duration = 0;
    this.screen.setBrightness(slot, value);
  }

  // 080063F4: fade a brightness slot up to half its maximum. The slot moves by `delta` for
  // `frames` VBlanks and lands on the target one VBlank later (0x333 x 40 = 0x7FF8, then 0x8000).
  // `late` holds the first step back one VBlank, as measured on the title fade-in (mGBA).
  fadeIn(frames, slot, late = false) {
    const effect = this.vm.ram.brightness[slot];
    effect.target = Math.trunc(effect.maximum / 2);
    this.schedule(effect, frames, late);
  }

  schedule(effect, frames, late) {
    const start = () => {
      effect.duration = frames + 1;
      effect.delta = Math.trunc((effect.target - effect.current) / frames);
    };
    effect.duration = 0;
    if (late) this.deferred.push(start);
    else start();
  }

  // 0800654C: fade a slot to black over `frames` unless it is already black.
  fadeOut(frames, slot, late = false) {
    const effect = this.vm.ram.brightness[slot];
    if (effect.current === 0) return;
    effect.target = 0;
    this.schedule(effect, frames, late);
  }

  settled(slot) {
    const effect = this.vm.ram.brightness[slot];
    return effect.current === effect.target;
  }

  // 08006630: wait until the slot reaches its target, then one more frame.
  *waitFade(slot) {
    while (!this.settled(slot)) yield;
    yield;
  }

  // 0800EAC0: the same wait, cut short by A or START. Returns true when skipped.
  *waitFadeOrSkip(slot) {
    while (!this.settled(slot)) {
      yield;
      if (this.pressed(KEY.A | KEY.START)) return true;
    }
    return false;
  }

  // 0800EA98: 93 frames, cut short by A or START.
  *hold() {
    for (let n = 0x5d; n > 0; n--) {
      yield;
      if (this.pressed(KEY.A | KEY.START)) return true;
    }
    return false;
  }

  // 0800EAFC: logo and copyright, skipped as a whole by A or START.
  *logo() {
    if (!this.logoShown) {
      sequence: {
        yield* this.picture(LOGO, 4);
        this.fadeIn(0x28, 1);
        if (yield* this.waitFadeOrSkip(1)) break sequence;
        yield* this.waitFade(1);
        this.sound.play(0x58, 0);
        if (yield* this.hold()) break sequence;
        this.fadeOut(0x50, 1);
        if (yield* this.waitFadeOrSkip(1)) break sequence;
        yield* this.picture(COPYRIGHT, 2);
        this.fadeIn(0x28, 1);
        if (yield* this.waitFadeOrSkip(1)) break sequence;
        yield* this.hold();
      }
      this.fadeOut(0x50, 1);
      yield* this.waitFade(1);
    }
    // Back from the bookmark screen the title decode takes 6 frames instead of 4 (mGBA 706 -> 712).
    // The fade's first step is late only on the first pass (mGBA 460 -> 462, but 712 -> 713).
    const returning = this.logoShown;
    this.logoShown = false;
    yield* this.picture(TITLE, returning ? 6 : 4);
    this.sound.play(0, 0);
    this.fadeIn(0x19, 1, !returning);
    this.fadeIn(0x19, 5, !returning);
    yield* this.waitFade(1);
  }

  // 0800EC3C
  *title() {
    this.titleActive = true;
    try { yield* this.titleScreens(); } finally { this.titleActive = false; }
  }

  *titleScreens() {
    yield* this.logo();
    let returning = false;
    while (true) {
      yield* this.menu(returning);
      this.fadeOut(0x19, 1);
      this.fadeOut(0x19, 5);
      yield* this.waitFade(1);
      if (this.continueRequest) {
        this.loading = this.continueRequest;
        Object.assign(this.names, this.loading.state?.names ?? {});
        this.continueRequest = null;
        break;
      }
      // 0800E4C4 -> 0800E328: bookmark selection. B returns to the title without the logo.
      if (yield* this.bookmarks()) break;
      this.logoShown = true;
      yield* this.logo();
      returning = true;
    }
    // 0800EDE4: the first frame wait, then two frames of clearing (mGBA 488 -> 491), the audio
    // fade with the slot 1/5 tail fade, and one more frame (08006630) before 1D 00 returns at 492.
    for (let n = 0; n < 3; n++) yield;
    this.sound.fade(0x58, 0x19);
    this.fadeOut(0x19, 1);
    this.fadeOut(0x19, 5);
    yield;
    this.ram.vars[0] = 1;
  }

  // 0800EBBC and the loop after it: the title menu.
  // `returning`: back from the bookmark screen the cursor starts at another phase and shows after
  // two frames, and the first frame still lacks the last glyph (mGBA 739 -> 741).
  *menu(returning = false) {
    const items = MENU; // 0800EBBC adds 挑戦状 when a save slot is in use; saves are not ported yet.
    let selected = 0;
    let tick = returning ? CURSOR_RETURN_TICK : CURSOR_FIRST_TICK;
    const visible = tick + CURSOR_HIDDEN;
    let partial = returning;
    while (true) {
      const grow = CURSOR_GROW[(tick >> 2) & 7];
      const x = items[selected].cursorX;
      const cursor = tick++ < visible ? null
        : { x: x - grow, y: CURSOR.y - grow, w: CURSOR.w + 2 * grow, h: CURSOR.h + 2 * grow };
      this.layer = this.menuLayer(items, selected, cursor);
      if (partial) this.layer.glyphs.pop();
      partial = false;
      this.hits = items.map(({ rect: [x, y, w, h] }, index) => ({
        x, y, w, h, current: index === selected,
        select: () => { this.effect(3); selected = index; },
      }));
      yield;
      if (this.continueRequest) return;
      if (this.pressed(KEY.RIGHT) && selected < items.length - 1) { this.effect(3); selected++; }
      if (this.pressed(KEY.LEFT) && selected > 0) { this.effect(3); selected--; }
      if (!this.pressed(KEY.A | KEY.START)) continue;
      this.effect(5);
      this.layer = null;
      yield; // 08006B8C clears the OBJ text surface
      if (selected === 0) return;
      // 0800EDA4: 説明 runs オプション in its title mode over the title picture.
      if (this.options) yield* this.options.run(1);
    }
  }

  menuLayer(items, selected, cursor) {
    const glyphs = [];
    const boxes = [];
    items.forEach((item, index) => {
      const chosen = index === selected;
      if (!chosen) boxes.push(item.rect);
      this.text(glyphs, item.label, item.textX, MENU_TEXT_Y, chosen ? 2 : 3);
    });
    return { boxes, glyphs, cursor };
  }

  // 08006F1C/08006C64 for one Shift JIS string: the routine takes y in a 0-228 range and draws
  // at y * 14 / 20. The ideographic space advances 2 pixels; other glyphs advance their width, or
  // `advance` when it is set. Control pairs: rr starts a new line 0x14 lower, s8 / ss move 6 / 12
  // pixels, c0-c7 set OBJ color 8-15 (this port's color 2-9), n1 / n2 print the hero's and the
  // girlfriend's names (02006649 + 16 * n).
  text(glyphs, bytes, x, y, color, scaleY = false, advance = 0) {
    const left = x;
    for (let i = 0; i + 1 < bytes.length && bytes[i]; i += 2) {
      const encoded = (bytes[i] << 8) | bytes[i + 1];
      const top = scaleY ? Math.trunc((y * 14) / 20) : y;
      if (encoded === 0x7272) { x = left; y += scaleY ? 0x14 : 14; continue; }
      if (encoded === 0x7338) { x += 6; continue; }
      if (encoded === 0x7373) { x += 12; continue; }
      if (bytes[i] === 0x63 && bytes[i + 1] >= 0x30 && bytes[i + 1] <= 0x37) { color = bytes[i + 1] - 0x30 + 2; continue; }
      if (encoded === 0x6e31 || encoded === 0x6e32) {
        const name = this.names[encoded - 0x6e30] ?? [];
        for (let n = 0; n + 1 < name.length && name[n]; n += 2) {
          const code = (name[n] << 8) | name[n + 1];
          const index = this.font.find(code);
          glyphs.push({ x, y: top, encoded: code, color });
          x += advance || (index < 0 ? 8 : this.font.glyph(index).width);
        }
        continue;
      }
      if (encoded === 0x8140) { x += SPACE_ADVANCE; continue; }
      const index = this.font.find(encoded);
      glyphs.push({ x, y: top, encoded, color });
      // 、 and 。 advance 8 pixels (mGBA: 明度、彩度の調整).
      const punctuation = encoded === 0x8141 || encoded === 0x8142;
      x += advance || (punctuation ? 8 : index < 0 ? 8 : this.font.glyph(index).width);
    }
    return glyphs;
  }

  // 0800B7C4 for an unused book: 未使用 on the front book's spine label, then in the header bar.
  bookGlyphs(book) {
    const glyphs = [];
    const five = book * 5;
    const data = this.books.read(book);
    if (data) {
      // 0800B7C4 for a used book: the scene title in the header, the count of saves (回目) and
      // the good and bad endings seen (完, 終) on the front book.
      const at = (n) => Math.trunc(((five * 16 + n) * 3 * 64) / 256);
      this.text(glyphs, data.title ?? [], 7, 0x0c, 2, true);
      const turns = this.digits(data.turns ?? 1);
      this.text(glyphs, turns, at(0x33), five * 2 + 0x96, 2, true);
      this.text(glyphs, SJIS.turns, at(0x33) + 8 * turns.length / 2, five * 2 + 0x96, 2, true);
      this.text(glyphs, SJIS.good, at(0x23), five * 2 + 0xa9, 2, true);
      this.text(glyphs, this.digits(data.good ?? 0), at(0x3b), five * 2 + 0xa9, 2, true);
      this.text(glyphs, SJIS.bad, at(0x53), five * 2 + 0xa9, 2, true);
      this.text(glyphs, this.digits(data.bad ?? 0), at(0x6b), five * 2 + 0xa9, 2, true);
      return glyphs;
    }
    this.text(glyphs, UNUSED, Math.trunc(((five * 16 + 0x37) * 3 * 64) / 256), five * 2 + 0x9b, 2, true);
    this.text(glyphs, UNUSED, 0x65, 0x0c, 2, true);
    return glyphs;
  }

  // 0800E328 with the 0800E4E4 callback (title) or 0800EA10 (セーブ in the game).
  // Returns true when a book was chosen.
  *bookmarks(mode = "title") {
    let book = this.book;
    let shown = -1;
    let first = true;
    // 08003BFC(1) drops the title picture before the loop starts.
    this.screen.background = null;
    while (true) {
      if (book !== shown) {
        // 08006B8C clears the text, 08000DC4 decodes the picture (the LZ77 copy takes frames),
        // then 0800E2A8 writes the labels glyph by glyph as the CPU gets to them.
        this.layer = first ? null : { boxes: [HEADER], glyphs: [] };
        yield* this.picture(BOOKS[book], first ? BOOK_LAG.first : BOOK_LAG.change, true);
        const glyphs = this.bookGlyphs(book);
        const reveal = first ? BOOK_REVEAL.first : BOOK_REVEAL.change;
        for (let n = 0; n < reveal.length; n++) {
          this.layer = { boxes: first ? [] : [HEADER], glyphs: glyphs.slice(0, reveal[n]) };
          yield;
        }
        this.layer = { boxes: [HEADER], glyphs, boxBlack: first ? 2 : 0 };
        if (first) {
          // 080063F4(1, 5) and (1, 1): straight to full brightness.
          this.fadeIn(1, 5);
          this.fadeIn(1, 1);
        }
        shown = book;
      }
      // Touch: the three books stand side by side; their spine labels sit at x = (80n + 55) * 3/4.
      this.hits = [0, 1, 2].map((index) => ({
        x: index === 0 ? 0 : 89 + 60 * (index - 1), y: 0x18, w: index === 0 ? 89 : index === 1 ? 60 : 91, h: 0x88,
        current: index === book,
        select: () => { this.effect(3); book = index; },
      }));
      yield;
      if (this.layer?.boxBlack) this.layer.boxBlack--;
      first = false;
      if (this.pressed(KEY.RIGHT) && book <= 1) { this.effect(3); book++; continue; }
      if (this.pressed(KEY.LEFT) && book > 0) { this.effect(3); book--; continue; }
      if (this.pressed(KEY.B)) {
        this.effect(1);
        this.layer = { boxes: [HEADER], glyphs: [] };
        this.book = book;
        this.fadeOut(1, 1);
        this.fadeOut(1, 5);
        yield* this.waitFade(1);
        this.layer = null;
        this.screen.background = null;
        // 08006B8C, 08001070, the header clear and 08009BF8 before the title reloads (mGBA 703 -> 706).
        for (let n = 0; n < 3; n++) yield;
        return false;
      }
      if (!this.pressed(KEY.A)) continue;
      this.effect(0);
      this.book = book; // 02004642
      if (mode === "ending") {
        // 0800EA11: after an ending the shelf leaves once a book is written.
        const before = JSON.stringify(this.books.read(book));
        // 0800EA10: a used book first asks 08009FA8 with 0801AE34 (この本にはゲームデータがあります。…).
        if (this.books.read(book) && !(yield* this.question(0x1ae34))) { shown = -1; first = false; continue; }
        yield* this.saveTo(book, { asked: true });
        if (JSON.stringify(this.books.read(book)) !== before) {
          this.fadeOut(1, 1);
          this.fadeOut(1, 5);
          yield* this.waitFade(1);
          this.layer = null;
          return true;
        }
        shown = -1;
        first = false;
        continue;
      }
      if (mode === "save") {
        yield* this.saveTo(book);
        shown = -1;
        first = false;
        continue;
      }
      if (this.books.read(book)) {
        const result = yield* this.bookMenu(book);
        if (result !== "read") { shown = -1; continue; }
        this.layer = { boxes: [HEADER], glyphs: [] };
        for (let n = 0; n < 3; n++) yield;
        this.fadeOut(1, 1);
        this.fadeOut(1, 5);
        yield;
        this.layer = null;
        yield* this.waitFade(1);
        for (let n = 0; n < 2; n++) yield;
        return true;
      }
      // 0800E4E4 for an unused book: 08003BFC(1), clear the text, the slot 9 fade and
      // 08003BFC(1) again before the new game starts in it.
      this.layer = { boxes: [HEADER], glyphs: [] };
      for (let n = 0; n < 3; n++) yield;
      this.fadeOut(1, 1);
      this.fadeOut(1, 5);
      yield;
      this.layer = null; // 08009BF8 drops the header bar as the screen goes black (mGBA 885)
      yield* this.waitFade(1);
      // 0800E4AC returns four frames after the exit fade starts (Codex trace 484 -> 488).
      for (let n = 0; n < 2; n++) yield;
      return true;
    }
  }

  // A box with one line of text (08009EB4 / 0800A5E4 style notes).
  noteLayer(base, box, bytes, y = 0x4c) {
    return { ...base, boxes: [...base.boxes, box], glyphs: [...base.glyphs, ...this.text([], bytes, box[0] + 6, y, 2, true)] };
  }

  // Opcode 44 (080053DC): after an ending. Returns the VM wait while the screens run.
  ending(ram) {
    this.ram = ram;
    this.run = this.endingScreens();
    return { waiting: "boot" };
  }

  // 080052D0: lines of text over black and a two-item box (08019530: 0x3C, 0x62, 0x78 x 0x30).
  // The pointer 8484 sits at (0x4B, 0x9A + 0x18 * item), the labels at 0x5A; the item under it is
  // white, the other gray. Up and down move (sound 3), A takes it (sound 0, or 1 for the second).
  // The text and the box are cleared before it returns.
  *endingChoice(lines, labels, selected) {
    const draw = () => {
      const glyphs = [];
      for (const [x, y, at] of lines) this.text(glyphs, romString(this.systemText, at) ?? [], x, y, 2, true);
      labels.forEach((at, i) => this.text(glyphs, romString(this.systemText, at) ?? [], 0x5a, 0x9a + 0x18 * i, i === selected ? 2 : 3, true));
      glyphs.push({ ...this.point(0x4b, 0x9a + 0x18 * selected), encoded: MENU_POINTER, color: 2 });
      this.layer = { boxes: [ENDING_BOX], glyphs, black: true };
      this.hits = labels.map((_, i) => ({
        x: ENDING_BOX[0], y: ENDING_BOX[1] + 4 + 17 * i, w: ENDING_BOX[2], h: 17, current: i === selected,
        select: () => { this.effect(3); selected = i; },
      }));
    };
    while (true) {
      draw();
      yield;
      if (this.pressed(KEY.DOWN) && selected === 0) { this.effect(3); selected = 1; continue; }
      if (this.pressed(KEY.UP) && selected === 1) { this.effect(3); selected = 0; continue; }
      if (this.pressed(KEY.A)) break;
    }
    this.effect(selected === 0 ? 0 : 1);
    this.layer = null;
    return selected;
  }

  *endingScreens() {
    const { vm } = this;
    const ram = vm.ram;
    // 080015DC(1) and 0800350C: the silhouettes go; the story picture and text are cleared.
    this.screen.silhouette = null;
    vm.scene?.silhouetteClear?.();
    ram.silhouettes.fill(0xffff);
    [ram.presentationC5, ram.presentationC6, ram.presentationC7] = DEFAULT_TINT;
    vm.text?.clearPage?.();
    this.screen.background = null;
    // 02004604: endings seen this power-on, counted up to 10.
    if ((ram.endingCount ?? 0) <= 9) ram.endingCount = (ram.endingCount ?? 0) + 1;
    this.fadeIn(1, 1);
    this.fadeIn(1, 5);
    let done = false;
    while (!done) {
      // 0801953x: 『かまいたちの夜』では … ゲームデータをセーブして下さい。 セーブする / セーブしない
      const save = yield* this.endingChoice([[0x38, 0x14, 0x19538], [0x0a, 0x27, 0x19550], [0x30, 0x39, 0x19578],
        [0x4e, 0x4c, 0x19594], [0x38, 0x5f, 0x195a8], [0x1c, 0x72, 0x195c4]], [0x195e8, 0x195f4], 0);
      // 0200251F (flag 0x33): after the third ending, 犯人当てをあきらめて、他の物語を楽しみますか？
      if (!ram.flags[0x33] && ram.endingCount > 2) {
        if ((yield* this.endingChoice([[0x33, 0x2f, 0x19604], [0x2b, 0x42, 0x1961c]], [0x19638, 0x19640], 1)) === 0) ram.flags[0x33] = 1;
      }
      if (save === 1) {
        // 今回プレイした分のゲームデータは保存されませんが、よろしいですか？
        done = (yield* this.endingChoice([[0x43, 0x2f, 0x19648], [0x1a, 0x42, 0x1965c], [0x4a, 0x55, 0x19680]], [0x19638, 0x19640], 1)) === 0;
      }
      // 08018504: the map's links, nodes and tried entries go back to the last opcode 53.
      ram.edges.set(ram.seenEdges);
      ram.visited.set(ram.seenNodes);
      ram.tried.set(ram.seenTried);
      if (save === 0) {
        // 080033A4(0x27): the book keeps bank 27 row 0, which goes on as the script after 44 does;
        // 02004640 = 0, then the bookshelf (0800EA5C -> 0800E328) in its save mode.
        vm.gotoRow(39000);
        ram.flowMask = 0;
        this.pageStart = pageState(vm, vm.bank, vm.offset, { names: this.names });
        done = yield* this.bookmarks("ending");
        this.screen.background = null;
        this.layer = null;
        this.fadeIn(1, 1);
        this.fadeIn(1, 5);
      }
    }
    ram.vars[3] = 0; // 02000609
    // 08004608 = 0x3D..0x3F, the culprit found: あなたの名推理で事件は無事解決！ …
    const solved = ram.node >= 0x3d && ram.node <= 0x3f;
    const lines = solved
      ? [[0x17, 0x25, 0x19694], [0x35, 0x38, 0x196b8], [0x45, 0x4b, 0x196d0], [0x23, 0x5e, 0x196e0], [0x47, 0x71, 0x196fc]]
      : [[0x2f, 0x16, 0x19720], [0x45, 0x29, 0x19738], [0x51, 0x3c, 0x1974c], [0x2d, 0x4f, 0x19758], [0x3e, 0x62, 0x19774], [0x33, 0x75, 0x19788]];
    const quit = yield* this.endingChoice(lines, [0x1970c, 0x19714], 0);
    // 0800654C on slots 1, 2, 5, 8 and 10 frames (08003044).
    this.fadeOut(1, 1);
    this.fadeOut(1, 5);
    for (let n = 0; n < 10; n++) yield;
    if (quit === 1) {
      // 終了する: 02000380 and 02000609 = 1; the script goes back to the title (31002, 3F).
      ram.continueChosen = 1;
      ram.vars[3] = 1;
    }
    // 0800A384: the music stops; 02004640 = 0.
    vm.sound?.stop?.(0);
    vm.syncAudio?.();
    ram.flowMask = 0;
    this.layer = null;
  }

  // 0800EA10 -> 0800B724 -> 0800A5E4: write the page-start state into the book.
  *saveTo(book, { asked = false } = {}) {
    const base = this.layer ?? { boxes: [HEADER], glyphs: [] };
    if (!asked && this.books.read(book) && !(yield* this.confirm(base))) return;
    const old = this.books.read(book);
    this.layer = this.noteLayer(base, SAVE_BOX, SJIS.saving);
    yield;
    const state = this.pageStart ?? pageState(this.vm, this.vm.bank, this.vm.offset, { names: this.names });
    this.books.write(book, {
      title: this.nodeTitle(this.vm.ram.node),
      turns: Math.min(999, (old?.turns ?? 0) + 1),
      good: old?.good ?? 0,
      bad: old?.bad ?? 0,
      tone: { ...this.screen.tone }, // 0800A840 keeps 03001EE4/5 at +0x5E/+0x5F
      state,
    });
    for (let n = 0; n < 30; n++) yield;
    const glyphs = this.bookGlyphs(book);
    this.layer = this.noteLayer({ boxes: [HEADER], glyphs }, SAVE_BOX, SJIS.saved);
    // 08009EB4: the note waits for A (or a tap) before it goes.
    this.hits = [{ x: 0, y: 0, w: 240, h: 160, current: true }];
    while (true) {
      yield;
      this.hits = [{ x: 0, y: 0, w: 240, h: 160, current: true }];
      if (this.pressed(KEY.A | KEY.B)) break;
    }
    this.effect(0);
    this.layer = { boxes: [HEADER], glyphs };
  }

  // 08009FA8(message): a box over the books (mGBA: x 10-234, y 35-98) with the message at
  // (7, 0x38) and はい / いいえ one under the other at x 0x69 (y 0x62, 0x74), the pointer 8484 at
  // x 0x5A, いいえ first. DOWN and UP move (sound 3); A takes it (sound 0 for はい, 1 for いいえ),
  // B is いいえ. True for はい.
  *question(message) {
    const base = this.layer ?? { boxes: [HEADER], glyphs: [] };
    const box = [10, 35, 225, 64];
    const kept = base.glyphs.filter((glyph) => glyph.y < box[1] || glyph.y >= box[1] + box[3]);
    const lines = romString(this.systemText, message) ?? [];
    const labels = [romString(this.systemText, 0x19824) ?? SJIS.yes, romString(this.systemText, 0x1982c) ?? SJIS.no];
    let selected = 1;
    while (true) {
      const glyphs = [...kept];
      this.text(glyphs, lines, 7, 0x38, 2, true);
      labels.forEach((label, i) => this.text(glyphs, label, 0x69, 0x62 + 0x12 * i, i === selected ? 2 : 3, true));
      glyphs.push({ ...this.point(0x5a, 0x62 + 0x12 * selected), encoded: MENU_POINTER, color: 2 });
      this.layer = { ...base, boxes: [...base.boxes, box], glyphs };
      this.hits = labels.map((_, i) => ({
        x: 0x5a, y: Math.trunc(((0x62 + 0x12 * i) * 14) / 20) - 2, w: 0x40, h: 13, current: i === selected,
        select: () => { this.effect(3); selected = i; },
      }));
      yield;
      if (this.pressed(KEY.DOWN) && selected <= 0) { this.effect(3); selected++; }
      if (this.pressed(KEY.UP) && selected > 0) { selected--; this.effect(3); }
      if (this.pressed(KEY.A) && selected === 0) { this.effect(0); this.layer = { ...base, glyphs: kept }; return true; }
      if (this.pressed(KEY.A) || this.pressed(KEY.B)) { this.effect(1); this.layer = { ...base, glyphs: kept }; return false; }
    }
  }

  // 08009FA8: a yes/no question over the books; true for はい.
  *confirm(base) {
    const { yes, no } = SJIS;
    let choice = 1;
    while (true) {
      const glyphs = [...base.glyphs];
      this.text(glyphs, SJIS.overwrite, 0x30, 0x4c, 2, true);
      this.text(glyphs, yes, 0x50, 0x68, choice === 0 ? 2 : 3, true);
      this.text(glyphs, no, 0x88, 0x68, choice === 1 ? 2 : 3, true);
      glyphs.push({ ...this.point(choice === 0 ? 0x44 : 0x7c, 0x68), encoded: MENU_POINTER, color: 2 });
      this.layer = { ...base, boxes: [...base.boxes, [0x24, 0x2e, 0xa8, 0x34]], glyphs };
      this.hits = [
        { x: 0x48, y: 0x46, w: 0x30, h: 0x10, current: choice === 0, select: () => { this.effect(3); choice = 0; } },
        { x: 0x80, y: 0x46, w: 0x30, h: 0x10, current: choice === 1, select: () => { this.effect(3); choice = 1; } },
      ];
      yield;
      if (this.pressed(KEY.LEFT) && choice) { this.effect(3); choice = 0; }
      if (this.pressed(KEY.RIGHT) && !choice) { this.effect(3); choice = 1; }
      if (this.pressed(KEY.B)) { this.effect(1); this.layer = base; return false; }
      if (this.pressed(KEY.A)) { this.effect(choice ? 1 : 0); this.layer = base; return choice === 0; }
    }
  }

  point(x, y) {
    return { x, y: Math.trunc((y * 14) / 20) };
  }

  // 0800E4E4 for a used book: 本を読む / 本の内容を消す / 本の内容を写す / もどる.
  *bookMenu(book) {
    let selected = 0;
    const base = () => ({ boxes: [HEADER], glyphs: this.bookGlyphs(book) });
    while (true) {
      const layer = base();
      layer.boxes.push(BOOK_MENU_BOX);
      SJIS.bookMenu.forEach((label, i) => this.text(layer.glyphs, label, 0x4e, 0x38 + 0x14 * i, 2, true));
      layer.glyphs.push({ ...this.point(0x3e, 0x38 + 0x14 * selected), encoded: MENU_POINTER, color: 2 });
      this.layer = layer;
      this.hits = SJIS.bookMenu.map((_, i) => ({
        x: 0x3c, y: Math.trunc(((0x38 + 0x14 * i) * 14) / 20) - 1, w: 0x78, h: 14, current: i === selected,
        select: () => { this.effect(3); selected = i; },
      }));
      yield;
      if (this.pressed(KEY.DOWN) && selected < 3) { this.effect(3); selected++; continue; }
      if (this.pressed(KEY.UP) && selected > 0) { this.effect(3); selected--; continue; }
      if (this.pressed(KEY.B) || (this.pressed(KEY.A) && selected === 3)) { this.effect(1); this.layer = base(); return "back"; }
      if (!this.pressed(KEY.A)) continue;
      this.effect(0);
      if (selected === 0) {
        // 0800E654: ゲームデータを読み込み中です。 for 60 frames, then the game starts from it.
        const data = this.books.read(book);
        this.layer = this.noteLayer({ boxes: [HEADER], glyphs: [] }, LOAD_BOX, SJIS.loading);
        for (let n = 0; n < 60; n++) yield;
        this.loading = data;
        Object.assign(this.names, data.state?.names ?? {});
        return "read";
      }
      if (selected === 1) {
        // 0800E718: confirm, ゲームデータを消去しています。, the book is unused again.
        if (!(yield* this.confirm(base()))) continue;
        this.layer = this.noteLayer(base(), LOAD_BOX, SJIS.erasing);
        for (let n = 0; n < 30; n++) yield;
        this.books.erase(book);
        return "changed";
      }
      // 0800E7F4: copy into one of the other books (左 / 中央 / 右の本に写す).
      const target = yield* this.pickBook(book);
      if (target < 0) continue;
      if (this.books.read(target) && !(yield* this.confirm(base()))) continue;
      this.books.copy(book, target);
      return "changed";
    }
  }

  // The copy target: the other two books, left to right.
  *pickBook(from) {
    const names = SJIS.copyTargets;
    const targets = [0, 1, 2].filter((b) => b !== from);
    let selected = 0;
    while (true) {
      const layer = { boxes: [HEADER, BOOK_MENU_BOX], glyphs: this.bookGlyphs(from) };
      targets.forEach((b, i) => this.text(layer.glyphs, names[b], 0x4e, 0x38 + 0x14 * i, 2, true));
      layer.glyphs.push({ ...this.point(0x3e, 0x38 + 0x14 * selected), encoded: MENU_POINTER, color: 2 });
      this.layer = layer;
      this.hits = targets.map((_, i) => ({
        x: 0x3c, y: Math.trunc(((0x38 + 0x14 * i) * 14) / 20) - 1, w: 0x78, h: 14, current: i === selected,
        select: () => { this.effect(3); selected = i; },
      }));
      yield;
      if (this.pressed(KEY.DOWN) && selected < targets.length - 1) { this.effect(3); selected++; }
      if (this.pressed(KEY.UP) && selected > 0) { this.effect(3); selected--; }
      if (this.pressed(KEY.B)) { this.effect(1); return -1; }
      if (this.pressed(KEY.A)) { this.effect(0); return targets[selected]; }
    }
  }

  // 0800C9xx: the in-game menu (R).
  // 0800D9A0 with 0 (the menu's background) or 1 (移動): the map state for the page under the
  // cursor, which starts on the current scene.
  openMap() {
    const map = this.flowMap;
    const ram = this.vm.ram;
    const { pages, cursor } = map.survey(ram);
    const surface = new MapSurface();
    const state = { map, ram, pages, cursor: { ...cursor }, surface, page: null, scene: null, title: [] };
    this.drawMap(state);
    return state;
  }

  // The page (when it changed) and the header title of the scene under the cursor.
  drawMap(state) {
    const { map, ram, cursor, surface } = state;
    const page = { column: Math.trunc(cursor.x / 6), row: Math.trunc(cursor.y / 6) };
    if (!state.page || state.page.column !== page.column || state.page.row !== page.row) {
      map.drawPage(surface, ram, page);
      state.page = page;
    }
    state.scene = map.sceneAt(ram, cursor);
    surface.fill(0, 8, 0xf0, 0x17, 0);
    state.title = state.scene ? map.title(state.scene.id) : [];
  }

  mapGlyphs(state) {
    const glyphs = [];
    this.text(glyphs, state.title, 7, 0x0c, 2, true);
    return glyphs;
  }

  // 0800DF4C: the cursor's four corners and the page marker, every frame.
  mapSprites(state) {
    const { cursor, page } = state;
    const x = flowScaleX((cursor.x % 6) * 36 + 12) - 4;
    const y = Math.trunc((((cursor.y % 6) * 28 + 0x2f) * 160) / 240);
    const d = MAP_PULSE[(this.tick >> 2) & 7];
    const cursors = [[x - d, y - d], [x + d, y - d], [x - d, y + 4 + d], [x + d, y + 4 + d]]
      .map(([cx, cy]) => ({ x: cx, y: cy, w: 32, h: 16 }));
    const marker = { x: 0xc8 + 5 * page.column, y: 0x26 + 5 * page.row, w: 4, h: 4, color: 2 };
    return { cursors, sprites: [marker] };
  }

  // 移動 (0800D9A0 with 1). Returns true when a scene was chosen (the scenario now starts there).
  *flowChart() {
    const state = this.openMap();
    const { map, ram, surface } = state;
    map.drawPageMap(surface, state.pages);
    this.repeat = true; // 0800A114
    const show = () => {
      this.layer = { boxes: [HEADER], glyphs: this.mapGlyphs(state), surface: surface.pixels, ...this.mapSprites(state) };
      // Touch: a scene box moves the cursor there (a second tap reads it), a page on the page map
      // shows that page.
      const here = state.page;
      const hits = [];
      for (const entry of map.entries(here.row * FLOW_COLUMNS + here.column)) {
        if (!map.nodeState(ram, entry.id) || map.locked(ram, entry.kind, entry.id)) continue;
        const target = { x: here.column * 6 + entry.x, y: here.row * 6 + entry.y };
        const current = target.x === state.cursor.x && target.y === state.cursor.y;
        hits.push({
          x: flowScaleX(entry.x * 36 + 12), y: Math.trunc(((entry.y * 28 + 0x2f) * 14) / 20), w: 0x16, h: 14, current,
          select: () => { this.effect(3); state.cursor = target; this.drawMap(state); },
        });
      }
      for (let row = 0; row < FLOW_ROWS; row++) {
        for (let column = 0; column < FLOW_COLUMNS; column++) {
          if (!state.pages[row * FLOW_COLUMNS + column]) continue;
          hits.push({
            x: 0xc7 + 5 * column, y: 0x25 + 5 * row, w: 5, h: 5,
            select: () => {
              this.effect(3);
              state.cursor = { x: column * 6 + (state.cursor.x % 6), y: row * 6 + (state.cursor.y % 6) };
              this.drawMap(state);
            },
          });
        }
      }
      this.hits = hits;
    };
    while (true) {
      show();
      yield;
      const before = { ...state.cursor };
      const page = this.held(KEY.R);
      const c = state.cursor;
      let moved = false;
      if (this.pressed(KEY.DOWN)) { if (page ? c.y <= 0x89 : c.y !== 0x8f) { c.y += page ? 6 : 1; moved = true; } }
      if (this.pressed(KEY.UP)) { if (page ? c.y > 5 : c.y !== 0) { c.y -= page ? 6 : 1; moved = true; } }
      if (this.pressed(KEY.RIGHT)) { if (page ? c.x <= 0x23 : c.x !== 0x29) { c.x += page ? 6 : 1; moved = true; } }
      if (this.pressed(KEY.LEFT)) { if (page ? c.x > 5 : c.x !== 0) { c.x -= page ? 6 : 1; moved = true; } }
      // 0800E0C2: never onto a page with nothing on it.
      if (moved && !state.pages[Math.trunc(c.y / 6) * FLOW_COLUMNS + Math.trunc(c.x / 6)]) {
        state.cursor = before;
        moved = false;
      }
      if (moved) { this.effect(3); this.drawMap(state); }
      if (this.pressed(KEY.B)) {
        this.effect(1);
        this.repeat = false;
        return false;
      }
      if (!this.pressed(KEY.A)) continue;
      const scene = state.scene;
      if (!scene || scene.kind > 10) { this.effect(4); continue; }
      yield* this.jumpTo(scene.id);
      this.repeat = false;
      return true;
    }
  }

  // 0800DB54: back to a scene. The flowchart state of the last scene start comes back, then
  // everything is marked as seen in an earlier play (0800CFCC) and the scenario restarts at the
  // scene (08003600: bank 0x27, row node - 1).
  *jumpTo(node) {
    const ram = this.vm.ram;
    ram.edges.set(ram.seenEdges);
    ram.visited.set(ram.seenNodes);
    ram.tried?.set?.(ram.seenTried);
    this.effect(0);
    for (const slot of [1, 5]) this.fadeOut(0x19, slot);
    yield* this.waitFade(1);
    this.sound.stop?.(0); // 0800A1DC / 0800A384
    for (const table of [ram.visited, ram.seenNodes, ram.edges, ram.seenEdges, ram.tried, ram.seenTried])
      if (table) for (let i = 0; i < table.length; i++) table[i] &= 1;
    ram.flowMask = 0; // 0800DBE4: 02004640 = 0
    this.layer = null;
    this.screen.background = null;
    // The scene starts again without silhouettes (02000728 emptied, the layer off).
    this.vm.scene?.silhouetteClear?.();
    ram.silhouettes?.fill(0xffff);
    this.vm.text?.resumed?.();
    if (this.vm.text) { this.vm.text.fragments = []; this.vm.text.pageRaw = []; this.vm.text.rest = null; }
    ram.node = node;
    this.vm.gotoRow(39000 + node - 1);
    this.vm.waiting = "none";
    this.vm.choiceState = null;
    this.vm.collectingChoice = undefined;
    this.jumped = true;
  }

  *gameMenu() {
    const story = this.screen.background;
    this.effect(2);
    this.fadeOut(1, 1);
    this.fadeOut(1, 5);
    yield* this.waitFade(1);
    // 0800C37E: 080015DC(1) takes the silhouette layer down while the menu is open; it is back
    // over the story when the menu closes (mGBA).
    const silhouette = this.screen.silhouette;
    this.screen.silhouette = null;
    this.showPicture(MENU_PICTURE);
    let selected = 0;
    // 0800C97C: the flowchart page of the current scene behind the menu (0800D9A0 with 0), then
    // the menu's area cleared out of it.
    let map = null;
    const background = () => {
      map = this.flowMap ? this.openMap() : null;
      map?.surface.fill(0xa6, 0x28, 0x4a, 0x60, 0);
    };
    background();
    const draw = () => {
      const glyphs = map ? this.mapGlyphs(map) : this.text([], this.nodeTitle(this.vm.ram.node), 7, 0x0c, 2, true);
      // The item under the pointer is white, the others gray (mGBA).
      SJIS.gameMenu.forEach((label, i) => this.text(glyphs, label, 0xb8, 0x30 + 0x14 * i, i === selected ? 2 : 3, true));
      glyphs.push({ ...this.point(0xaa, 0x30 + 0x14 * selected), encoded: MENU_POINTER, color: 2 });
      this.layer = { boxes: [HEADER, GAME_MENU_BOX], glyphs, surface: map?.surface.pixels };
      this.hits = SJIS.gameMenu.map((_, i) => ({
        x: 0xa6, y: Math.trunc(((0x30 + 0x14 * i) * 14) / 20) - 1, w: 0x4a, h: 14, current: i === selected,
        select: () => { this.effect(3); selected = i; },
      }));
    };
    draw();
    this.fadeIn(1, 1);
    this.fadeIn(1, 5);
    while (true) {
      draw();
      yield;
      if (this.pressed(KEY.UP) && selected > 0) { this.effect(3); selected--; continue; }
      if (this.pressed(KEY.DOWN) && selected < 3) { this.effect(3); selected++; continue; }
      if (this.pressed(KEY.B | KEY.R) || (this.pressed(KEY.A) && selected === 3)) { this.effect(1); break; }
      if (!this.pressed(KEY.A)) continue;
      if (selected === 0 && this.flowMap) {
        // 0800CBC6: 移動. B comes back to the menu; a chosen scene leaves the menu at once.
        this.effect(0);
        if (yield* this.flowChart()) return;
        background();
        continue;
      }
      if (selected === 1 && this.options) {
        // 0800CBE8: オプション over the menu picture, then the menu and its map are drawn again.
        this.effect(0);
        this.layer = { boxes: [HEADER], glyphs: this.layer.glyphs };
        yield* this.options.run(0);
        background();
        continue;
      }
      if (selected === 2) {
        this.effect(0);
        this.fadeOut(1, 1);
        this.fadeOut(1, 5);
        yield* this.waitFade(1);
        this.layer = null;
        yield* this.bookmarks("save");
        this.showPicture(MENU_PICTURE);
        background();
        this.fadeIn(1, 1);
        this.fadeIn(1, 5);
      }
    }
    this.fadeOut(1, 1);
    this.fadeOut(1, 5);
    yield* this.waitFade(1);
    this.layer = null;
    this.screen.background = story;
    this.screen.silhouette = silhouette;
    this.fadeIn(1, 1);
    this.fadeIn(1, 5);
    yield;
  }

  // 0800A320: menu sound effects on m4a player 11, songs from 080198E6.
  effect(index) {
    const song = [262, 330, 331, 158, 293, 331][index];
    this.sound.engine?.playerStart?.(11, song);
  }

  clearGlyph(surface, encoded, x, y) {
    const index = this.font.find(encoded);
    if (index < 0) return;
    const glyph = this.font.glyph(index);
    for (let gy = 0; gy < glyph.height; gy++) for (let gx = 0; gx < glyph.width; gx++) {
      const px = x + gx, py = y + gy;
      if (px >= 0 && px < 240 && py >= 0 && py < 160) surface.pixels[py * 240 + px] = 0;
    }
  }

  // BG1 boxes, OBJ text and the cursor over the picture the screen already drew.
  draw() {
    const screen = this.screen;
    const layer = this.layer;
    // A layer marked `black` is drawn over a black screen (opcode 44's screens have no picture).
    if (!screen.background || this.blank) {
      screen.image.data.fill(0);
      for (let i = 3; i < screen.image.data.length; i += 4) screen.image.data[i] = 255;
      if (!layer?.black || this.blank) {
        screen.ctx.putImageData(screen.image, 0, 0);
        return;
      }
    } else screen.renderBackground();
    if (!layer) return;
    const data = screen.image.data;
    // Channels widen to 8 bits (c << 3 | c >> 2) before blending, and the blend keeps all 8 bits
    // (mGBA: box 0x15D9 over 0x1CE7 gives 192, 118, 58).
    const rgb = (c) => [c & 31, (c >> 5) & 31, (c >> 10) & 31].map((v) => (v << 3) | (v >> 2));
    const put = (pixel, channels) => {
      for (let i = 0; i < 3; i++) data[4 * pixel + i] = channels[i];
    };
    const blend = (top, pixel) =>
      top.map((value, i) => Math.min(255, (value * EVA + data[4 * pixel + i] * EVB) >> 4));
    const text = new ObjTextSurface();
    // OBJ order: sprites behind the text surface (priority 1, 終了 highlight), the text, then
    // the priority 0 cursor squares on top.
    const sprite = (s) => {
      for (let py = Math.max(0, s.y); py < Math.min(160, s.y + s.h); py++)
        for (let px = Math.max(0, s.x); px < Math.min(240, s.x + s.w); px++) text.pixels[py * 240 + px] = s.color;
    };
    for (const s of layer.sprites ?? []) if (s.behind) sprite(s);
    if (layer.surface) text.pixels.set(layer.surface);
    for (const { x, y, encoded, color } of layer.glyphs) {
      // The name grid's rows overlap by one line; 08006C64 stores whole 4bpp nibbles, so a later
      // glyph's transparent pixels clear what an earlier one left there (mGBA rows 82 and 107).
      if (layer.replace) this.clearGlyph(text, encoded, x, y);
      text.glyph(this.font, encoded, x, y, color);
    }
    for (const f of layer.fills ?? []) sprite(f);
    for (const s of layer.sprites ?? []) if (!s.behind) sprite(s);
    const box = new Uint8Array(240 * 160);
    for (const [x, y, w, h] of layer.boxes)
      for (let py = y; py < y + h; py++) box.fill(1, py * 240 + x, py * 240 + x + w);
    const cursor = new Uint8Array(240 * 160);
    for (const { x, y, w, h } of [layer.cursor, ...(layer.cursors ?? [])].filter(Boolean)) {
      for (let py = Math.max(0, y); py < Math.min(160, y + h); py++)
        cursor.fill(1, py * 240 + Math.max(0, x), py * 240 + Math.min(240, x + w));
    }
    // The bookmark screen's first lit frame shows the header bar before its palette lands (mGBA 604).
    const boxColor = rgb(layer.boxBlack ? 0 : screen.menuColor?.(BOX_RAW) ?? BOX);
    for (let pixel = 0; pixel < 240 * 160; pixel++) {
      const glyph = text.pixels[pixel];
      if (glyph) put(pixel, rgb(OBJ_COLORS[glyph]));
      else if (cursor[pixel]) put(pixel, blend(rgb(OBJ_COLORS[2]), pixel));
      else if (box[pixel]) put(pixel, blend(boxColor, pixel));
    }
    screen.ctx.putImageData(screen.image, 0, 0);
  }
}
