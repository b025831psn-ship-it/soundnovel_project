// System command 1D 00 (08009494 table -> 0800EC3C): the cartridge's start-up screens before the
// scenario takes over. Chunsoft logo, copyright, title and its menu run here as native code, not as
// scenario bytecode, so they are ported routine by routine. Each `yield` is one frame wait
// (08002FB8); fades use the same brightness slots the scenario VM steps every VBlank.
import { ObjTextSurface } from "./obj-text.js";
import { NameEntry, NAME_PICTURES } from "./name-entry.js";
import { Books, pageState, restoreData, restorePosition } from "./save.js";

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
const BOX = 0x15d9;
const OBJ_COLORS = { 1: 0x0000, 2: 0x7fff, 3: 0x56b5, 5: 0x03e0 };
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
  turns: [0x89, 0xf1, 0x96, 0xda], // 080199C4 回目
  good: [0x8a, 0xae], // 080199CC 完
  bad: [0x8f, 0x49], // 080199D0 終
};
// 0801ACC0, 080198F4, 0801AC80: BG1 rectangles of the book menu, the saving note and the header.
const BOOK_MENU_BOX = [60, 35, 120, 65];
const SAVE_BOX = [75, 49, 93, 22];
const LOAD_BOX = [0x12, 0x31, 0xcc, 0x16];
const GAME_MENU_BOX = [0xa6, 0x28, 0x4a, 0x60];
const MENU_POINTER = 0x8484;
// 0800C97C: the in-game menu shows picture 0xDE (the owl) behind its boxes.
const MENU_PICTURE = 0xde;
// 1D 66 with a book being read: from the exit fade's first step to the book's fade-in (mGBA 1804 -> 1932).
const LOAD_FRAMES = 128;

export class Boot {
  constructor({ vm, screen, assets, font, sound }) {
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
    this.books = new Books();
    this.pageStart = null;
    this.loading = null;
    this.resumeWaiting = null;
    vm.onPageStart = (bank, offset) => {
      this.pageStart = pageState(vm, bank, offset, { names: this.names });
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
  }

  async load() {
    this.pictureMap = await this.assets.bin("ui/picture-map.bin");
    this.nameTable = await this.assets.bin("ui/name-table.bin");
    this.nameEntry = new NameEntry({ boot: this, font: this.font, table: this.nameTable });
    try { this.flow = await this.assets.bin("ui/flow-map.bin"); } catch { this.flow = null; }
    for (const id of [LOGO, COPYRIGHT, TITLE, ...BOOKS, ...NAME_PICTURES, MENU_PICTURE]) {
      const name = String(pictureIndex(id, this.pictureMap)).padStart(3, "0");
      const [tiles, palette] = await Promise.all([
        this.assets.bin(`bg/${name}.bin`),
        this.assets.bin(`palette/${name}.bin`),
      ]);
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
      this.vm.waitFrames = LOAD_FRAMES;
      return { waiting: "delay" };
    }
    if (command === 0x67) {
      ram.inGame = 1;
      if (this.loading) { this.restore(this.loading); this.resume(this.loading); }
      this.loading = null;
      return undefined;
    }
    if (command === 0x03) this.run = this.nameScreens([0, 1]);
    else if (command === 0x04) this.run = this.nameScreens([2]);
    else if (command === 0x00) this.run = this.title();
    else return undefined;
    return { waiting: "boot" };
  }

  // 08009670 (1D 03): hero then girlfriend; 0800967E (1D 04): the culprit, then 0200077F = 1.
  *nameScreens(modes) {
    for (const mode of modes) yield* this.nameEntry.run(mode);
    if (modes[0] === 2) this.ram.choiceSkip = 1;
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
    restoreData(this.vm, state);
    Object.assign(this.names, state.names ?? {});
    if (state.picture !== null && state.picture !== undefined) this.vm.scene?.load?.(state.picture);
    if (state.song !== undefined && state.song !== -1 && state.song !== 0xffff) this.vm.sound?.play?.(state.song, 0);
    if (state.picture !== null && state.picture !== undefined) this.fadeIn(0x0a, 1);
    this.fadeIn(0x0a, 5);
  }

  // 1D 67 after 本を読む: the scenario moves to the book's page start, on a clean page.
  resume(book) {
    restorePosition(this.vm, book.state);
    this.vm.text?.resumed?.();
    if (this.vm.text) { this.vm.text.fragments = []; this.vm.text.pageRaw = []; }
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
    this.trigger = this.latched;
    this.latched = trigger;
    this.hits = [];
    for (const start of this.deferred.splice(0)) start();
    const { done } = this.run.next();
    this.draw();
    if (done) {
      this.run = null;
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

  // 08003878 -> 08000DC4: decode a picture into BG0. The LZ77 copy costs `lag` frames.
  // `late` keeps the previous picture on screen until the decode finishes (bookmark books).
  *picture(id, lag, late = false) {
    const { tiles, palette } = this.pictures.get(id);
    if (!late) this.screen.setBackground(tiles, palette, 0);
    for (let n = 0; n < lag; n++) yield;
    if (late) this.screen.setBackground(tiles, palette, 0);
  }

  showPicture(id) {
    const { tiles, palette } = this.pictures.get(id);
    this.screen.setBackground(tiles, palette, 0);
  }

  // 080065A8: set a slot's brightness at once.
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
    yield* this.logo();
    let returning = false;
    while (true) {
      yield* this.menu(returning);
      this.fadeOut(0x19, 1);
      this.fadeOut(0x19, 5);
      yield* this.waitFade(1);
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
      if (this.pressed(KEY.RIGHT) && selected < items.length - 1) { this.effect(3); selected++; }
      if (this.pressed(KEY.LEFT) && selected > 0) { this.effect(3); selected--; }
      if (!this.pressed(KEY.A | KEY.START)) continue;
      this.effect(5);
      this.layer = null;
      yield; // 08006B8C clears the OBJ text surface
      if (selected === 0) return;
      // 説明 (0800C50C) is not ported yet; return to the menu.
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
  // at y * 14 / 20. The ideographic space advances 2 pixels; other glyphs advance their width.
  text(glyphs, bytes, x, y, color, scaleY = false) {
    const top = scaleY ? Math.trunc((y * 14) / 20) : y;
    for (let i = 0; i + 1 < bytes.length && bytes[i]; i += 2) {
      const encoded = (bytes[i] << 8) | bytes[i + 1];
      if (encoded === 0x8140) { x += SPACE_ADVANCE; continue; }
      const index = this.font.find(encoded);
      glyphs.push({ x, y: top, encoded, color });
      x += index < 0 ? 8 : this.font.glyph(index).width;
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

  // 0800EA10 -> 0800B724 -> 0800A5E4: write the page-start state into the book.
  *saveTo(book) {
    const base = this.layer ?? { boxes: [HEADER], glyphs: [] };
    if (this.books.read(book) && !(yield* this.confirm(base))) return;
    const old = this.books.read(book);
    this.layer = this.noteLayer(base, SAVE_BOX, SJIS.saving);
    yield;
    const state = this.pageStart ?? pageState(this.vm, this.vm.bank, this.vm.offset, { names: this.names });
    this.books.write(book, {
      title: this.nodeTitle(this.vm.ram.node),
      turns: Math.min(999, (old?.turns ?? 0) + 1),
      good: old?.good ?? 0,
      bad: old?.bad ?? 0,
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

  // 08009FA8: a yes/no question over the books; true for はい.
  *confirm(base) {
    const yes = [0x82, 0xcd, 0x82, 0xa2]; // はい
    const no = [0x82, 0xa2, 0x82, 0xa2, 0x82, 0xa6]; // いいえ
    let choice = 1;
    while (true) {
      const glyphs = [...base.glyphs];
      this.text(glyphs, [0x8f, 0xe3, 0x8f, 0x91, 0x82, 0xab, 0x82, 0xb5, 0x82, 0xdc, 0x82, 0xb7, 0x82, 0xa9, 0x81, 0x48], 0x30, 0x4c, 2, true); // 上書きしますか？
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
    const names = [
      [0x8d, 0xb6, 0x82, 0xcc, 0x96, 0x7b, 0x82, 0xc9, 0x8e, 0xca, 0x82, 0xb7], // 左の本に写す
      [0x92, 0x86, 0x89, 0x9b, 0x82, 0xcc, 0x96, 0x7b, 0x82, 0xc9, 0x8e, 0xca, 0x82, 0xb7], // 中央の本に写す
      [0x89, 0x45, 0x82, 0xcc, 0x96, 0x7b, 0x82, 0xc9, 0x8e, 0xca, 0x82, 0xb7], // 右の本に写す
    ];
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

  // 0800C9xx: the in-game menu (R). 移動 and オプション are not ported yet.
  *gameMenu() {
    const story = this.screen.background;
    this.effect(2);
    this.fadeOut(1, 1);
    this.fadeOut(1, 5);
    yield* this.waitFade(1);
    this.showPicture(MENU_PICTURE);
    let selected = 0;
    const draw = () => {
      const glyphs = [];
      this.text(glyphs, this.nodeTitle(this.vm.ram.node), 7, 0x0c, 2, true);
      SJIS.gameMenu.forEach((label, i) => this.text(glyphs, label, 0xb8, 0x30 + 0x14 * i, i < 2 ? 3 : 2, true));
      glyphs.push({ ...this.point(0xaa, 0x30 + 0x14 * selected), encoded: MENU_POINTER, color: 2 });
      this.layer = { boxes: [HEADER, GAME_MENU_BOX], glyphs };
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
      if (selected === 2) {
        this.effect(0);
        this.fadeOut(1, 1);
        this.fadeOut(1, 5);
        yield* this.waitFade(1);
        this.layer = null;
        yield* this.bookmarks("save");
        this.showPicture(MENU_PICTURE);
        this.fadeIn(1, 1);
        this.fadeIn(1, 5);
      }
      // 移動 (0800D9A0) and オプション (0800C50C) come later.
    }
    this.fadeOut(1, 1);
    this.fadeOut(1, 5);
    yield* this.waitFade(1);
    this.layer = null;
    this.screen.background = story;
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
    if (!screen.background || this.blank) {
      screen.image.data.fill(0);
      for (let i = 3; i < screen.image.data.length; i += 4) screen.image.data[i] = 255;
      screen.ctx.putImageData(screen.image, 0, 0);
      return;
    }
    screen.renderBackground();
    const layer = this.layer;
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
    if (layer.cursor) {
      const { x, y, w, h } = layer.cursor;
      for (let py = Math.max(0, y); py < Math.min(160, y + h); py++)
        cursor.fill(1, py * 240 + Math.max(0, x), py * 240 + Math.min(240, x + w));
    }
    // The bookmark screen's first lit frame shows the header bar before its palette lands (mGBA 604).
    const boxColor = rgb(layer.boxBlack ? 0 : BOX);
    for (let pixel = 0; pixel < 240 * 160; pixel++) {
      const glyph = text.pixels[pixel];
      if (glyph) put(pixel, rgb(OBJ_COLORS[glyph]));
      else if (cursor[pixel]) put(pixel, blend(rgb(OBJ_COLORS[2]), pixel));
      else if (box[pixel]) put(pixel, blend(boxColor, pixel));
    }
    screen.ctx.putImageData(screen.image, 0, 0);
  }
}
