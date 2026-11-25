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
// The ideographic space between 説 and 明 advances 2 pixels on the cartridge (mGBA frame 500).
const SPACE_ADVANCE = 2;
const CURSOR = { y: 0x84, w: 0x34, h: 0x10 };
// 08001960 breathes the cursor frame outward by 0-3 pixels: 4 frames per step, 8 at the ends.
// It first shows two frames after the menu, partway into the step that grows it by one pixel.
const CURSOR_GROW = [0, 0, 1, 2, 3, 3, 2, 1];
const CURSOR_FIRST_TICK = 7;
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
  }

  async load() {
    this.pictureMap = await this.assets.bin("ui/picture-map.bin");
    for (const id of [LOGO, COPYRIGHT, TITLE]) {
      const name = String(pictureIndex(id, this.pictureMap)).padStart(3, "0");
      const [tiles, palette] = await Promise.all([
        this.assets.bin(`bg/${name}.bin`),
        this.assets.bin(`palette/${name}.bin`),
      ]);
      // BG palette bank 15 (240-255) holds the menu colors on the title, overriding the picture's.
      if (id === TITLE) {
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
  *picture(id, lag) {
    const { tiles, palette } = this.pictures.get(id);
    this.screen.setBackground(tiles, palette, 0);
    for (let n = 0; n < lag; n++) yield;
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
    this.logoShown = false;
    yield* this.picture(TITLE, 4);
    this.sound.play(0, 0);
    this.fadeIn(0x19, 1, true);
    this.fadeIn(0x19, 5, true);
    yield* this.waitFade(1);
  }

  // 0800EC3C
  *title() {
    yield* this.logo();
    const items = MENU; // 0800EBBC adds 挑戦状 when a save slot is in use; saves are not ported yet.
    let selected = 0;
    let shown = -1;
    let tick = CURSOR_FIRST_TICK;
    this.layer = { items, selected, cursor: null };
    while (true) {
      if (selected !== shown) {
        this.layer.selected = selected;
        shown = selected;
      }
      const grow = CURSOR_GROW[(tick >> 2) & 7];
      const x = items[selected].cursorX;
      this.layer.cursor = tick++ < CURSOR_FIRST_TICK + CURSOR_HIDDEN ? null
        : { x: x - grow, y: CURSOR.y - grow, w: CURSOR.w + 2 * grow, h: CURSOR.h + 2 * grow };
      yield;
      if (this.pressed(KEY.RIGHT) && selected < items.length - 1) { this.effect(3); selected++; }
      if (this.pressed(KEY.LEFT) && selected > 0) { this.effect(3); selected--; }
      if (!this.pressed(KEY.A | KEY.START)) continue;
      this.effect(5);
      this.layer = null;
      yield; // 08006B8C clears the OBJ text surface
      if (selected === 0) break;
      // 説明 (0800C50C) is not ported yet; return to the menu.
      shown = -1;
      this.layer = { items, selected, cursor: null };
    }
    this.fadeOut(0x19, 1);
    this.fadeOut(0x19, 5);
    yield* this.waitFade(1);
    // 0800E4C4 (save slot selection) is not ported yet: start a new game as an empty slot does.
    this.sound.fade(0x58, 0x19);
    this.ram.vars[0] = 1;
  }

  // 0800A320: menu sound effects on m4a player 11, songs from 080198E6.
  effect(index) {
    const song = [262, 330, 331, 158, 293, 331][index];
    this.sound.engine?.playerStart?.(11, song);
  }

  // BG1 boxes, OBJ text and the cursor over the picture the screen already drew.
  draw() {
    const screen = this.screen;
    if (!screen.background) return;
    screen.renderBackground();
    const layer = this.layer;
    if (!layer) return;
    const data = screen.image.data;
    const rgb = (c) => [c & 31, (c >> 5) & 31, (c >> 10) & 31];
    const put = (pixel, channels) => {
      for (let i = 0; i < 3; i++) data[4 * pixel + i] = (channels[i] << 3) | (channels[i] >> 2);
    };
    const below = (pixel) => [0, 1, 2].map((i) => data[4 * pixel + i] >> 3);
    const blend = (top, pixel) => {
      const under = below(pixel);
      return top.map((value, i) => Math.min(31, (value * EVA + under[i] * EVB) >> 4));
    };
    const text = new ObjTextSurface();
    const box = new Uint8Array(240 * 160);
    layer.items.forEach((item, index) => {
      const chosen = index === layer.selected;
      if (!chosen) {
        const [x, y, w, h] = item.rect;
        for (let py = y; py < y + h; py++) box.fill(1, py * 240 + x, py * 240 + x + w);
      }
      let x = item.textX;
      for (let i = 0; i + 1 < item.label.length; i += 2) {
        const encoded = (item.label[i] << 8) | item.label[i + 1];
        if (encoded === 0x8140) { x += SPACE_ADVANCE; continue; }
        x += text.glyph(this.font, encoded, x, MENU_TEXT_Y, chosen ? 2 : 3);
      }
    });
    const cursor = new Uint8Array(240 * 160);
    if (layer.cursor) {
      const { x, y, w, h } = layer.cursor;
      for (let py = Math.max(0, y); py < Math.min(160, y + h); py++)
        cursor.fill(1, py * 240 + Math.max(0, x), py * 240 + Math.min(240, x + w));
    }
    for (let pixel = 0; pixel < 240 * 160; pixel++) {
      const glyph = text.pixels[pixel];
      if (glyph) put(pixel, rgb(OBJ_COLORS[glyph]));
      else if (cursor[pixel]) put(pixel, blend(rgb(OBJ_COLORS[2]), pixel));
      else if (box[pixel]) put(pixel, blend(rgb(BOX), pixel));
    }
    screen.ctx.putImageData(screen.image, 0, 0);
  }
}
