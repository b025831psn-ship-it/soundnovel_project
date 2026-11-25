// System command 1D 00 (08009494 table -> 0800EC3C): the cartridge's start-up screens before the
// scenario takes over. Chunsoft logo, copyright, title and its menu run here as native code, not as
// scenario bytecode, so they are ported routine by routine. Each `yield` is one frame wait
// (08002FB8); fades use the same brightness slots the scenario VM steps every VBlank.
import { ObjTextSurface } from "./obj-text.js";

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
const OBJ_COLORS = { 1: 0x0000, 2: 0x7fff, 3: 0x56b5 };
// BLDCNT 0x3146 / BLDALPHA 0x070D: BG1 and semi-transparent OBJs blend over BG0 at 13/16 + 7/16.
const EVA = 13;
const EVB = 7;

export const KEY = { A: 1, B: 2, SELECT: 4, START: 8, RIGHT: 16, LEFT: 32, UP: 64, DOWN: 128 };

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
  }

  async load() {
    this.pictureMap = await this.assets.bin("ui/picture-map.bin");
    for (const id of [LOGO, COPYRIGHT, TITLE, ...BOOKS]) {
      const name = String(pictureIndex(id, this.pictureMap)).padStart(3, "0");
      const [tiles, palette] = await Promise.all([
        this.assets.bin(`bg/${name}.bin`),
        this.assets.bin(`palette/${name}.bin`),
      ]);
      // BG palette bank 15 (240-255) holds the menu colors on the title and the bookmark screen.
      if (id === TITLE || BOOKS.includes(id)) {
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
    if (command !== 0x00) return undefined;
    this.ram = ram;
    this.run = this.title();
    return { waiting: "boot" };
  }

  // 0800B79C asks whether any save slot is in use; saves are not ported yet.
  anySave() {
    return false;
  }

  get active() {
    return this.run !== null;
  }

  // Once per frame after vm.vblank(): `trigger` holds the KEYINPUT bits newly pressed this frame
  // (020006E4). The first call comes in the frame the scenario reached 1D 00.
  frame(trigger = 0) {
    if (!this.run) return;
    // 020006E4 is latched in the VBlank interrupt, so the routine sees a press one frame later.
    this.trigger = this.latched;
    this.latched = trigger;
    for (const start of this.deferred.splice(0)) start();
    const { done } = this.run.next();
    this.draw();
    if (done) {
      this.run = null;
      this.vm.waiting = "none";
      for (let count = 0; count < 1024 && this.vm.step(); count++);
    }
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
    yield; // 08002FB8 after 08003658(0, 1)
    this.sound.fade(0x58, 0x19);
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
    this.text(glyphs, UNUSED, Math.trunc(((five * 16 + 0x37) * 3 * 64) / 256), five * 2 + 0x9b, 2, true);
    this.text(glyphs, UNUSED, 0x65, 0x0c, 2, true);
    return glyphs;
  }

  // 0800E328 with the 0800E4E4 callback. Returns true when a book was chosen.
  *bookmarks() {
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
      // 0800E4E4 for an unused book: 08003BFC(1), clear the text, the slot 9 fade and
      // 08003BFC(1) again before the new game starts in it.
      this.layer = { boxes: [HEADER], glyphs: [] };
      for (let n = 0; n < 3; n++) yield;
      this.fadeOut(1, 1);
      this.fadeOut(1, 5);
      yield;
      this.layer = null; // 08009BF8 drops the header bar as the screen goes black (mGBA 885)
      yield* this.waitFade(1);
      return true;
    }
  }

  // 0800A320: menu sound effects on m4a player 11, songs from 080198E6.
  effect(index) {
    const song = [262, 330, 331, 158, 293, 331][index];
    this.sound.engine?.playerStart?.(11, song);
  }

  // BG1 boxes, OBJ text and the cursor over the picture the screen already drew.
  draw() {
    const screen = this.screen;
    if (!screen.background) {
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
    for (const { x, y, encoded, color } of layer.glyphs) text.glyph(this.font, encoded, x, y, color);
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
