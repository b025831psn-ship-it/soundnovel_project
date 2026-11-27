// Story text on the game screen, as the cartridge shows it in the opening (checked against mGBA):
// OBJ glyphs with a dark outline and white interior from (8, 11), 14-pixel rows, a new row when
// the next glyph would start at x >= 220 or after a sentence's click wait ('r' then 'p'), and one
// glyph added per frame. A press while the glyphs are still appearing is ignored.
import { ObjTextSurface } from "./obj-text.js";
import { toneColor } from "./screen.js";

// Shift-JIS for the default names {name:1} and {name:2}.
const NAMES = { 1: [0x93, 0xa7], 2: [0x90, 0x5e, 0x97, 0x9d] };
// OBJ colors: 1 outline, 2 white text, 4 the light blue of C4 (measured on mGBA as BGR555 22,22,31).
const COLORS = { 1: [0, 0, 0], 2: [255, 255, 255], 4: [181, 181, 255], 8: [255, 123, 222] };
// Opcode 13 menus (08004200): the chosen label is OBJ color 4 (0x6DFF, drawn here as 8), the
// others white; ▶ (848B) sits 11 pixels left of the label and blinks, shown for 16 of every
// 30 frames, the count restarting when UP or DOWN moves it.
const MENU_CURSOR = 0x848b;
const MENU_CURSOR_OFFSET = 11;
const MENU_BLINK = 30;
const MENU_BLINK_ON = 16;
// Story text colors (08007CC2 / 08007D44): 'c' n picks foreground n and 'C' n foreground n + 8;
// 08006910 maps a foreground to an entry of OBJ palette 15 (080197EF), whose colors start as
// 080193E0 (white, gray, pink, ..., C4's light blue at 6) and go through the 明度・彩度 tone at
// its power-on 5 / 5. Drawn here as colors 16 + entry.
const FOREGROUND = [2, 8, 9, 10, 11, 12, 10, 11, 2, 3, 4, 5, 6, 7, 4, 2];
const TEXT_PALETTE = [0x0000, 0x0000, 0x7fff, 0x4210, 0x61ff, 0x03e0, 0x7e94, 0x3fff,
  0x7fff, 0x7fff, 0x7fff, 0x7fff, 0x001f, 0x2f7b, 0x0360, 0x7c00];
const rgb8 = (c) => [c & 31, (c >> 5) & 31, (c >> 10) & 31].map((v) => (v << 3) | (v >> 2));
// 08006B9C(n): entry FOREGROUND[n] takes 080193E0's color 4 (the pink) until 08006BD0 restores
// the palette. 1D 23 uses it on the two lines written in c6 / c7.
function textColors(highlight) {
  const colors = { ...COLORS };
  TEXT_PALETTE.forEach((raw, entry) => {
    const color = highlight != null && entry === FOREGROUND[highlight] ? TEXT_PALETTE[4] : raw;
    colors[16 + entry] = rgb8(toneColor(color, 5, 5));
  });
  return colors;
}

// 。！？、・」』）…―～ (08007F04)
// The Korean patch's EUC-KR punctuation (．，」』…！？) and spaces, for the large text only.
const KOREAN_HANGING = new Set([0xa3ae, 0xa3ac, 0xa1b9, 0xa1bb, 0xa1a6, 0xa3a1, 0xa3bf, 0xa1a3, 0xa1a2]);
const SPACES = new Set([0x8140, 0xa1a1]);
const NATIVE = { k: 1, scale: 1, pitch: 14 };
const HANGING = new Set([0x8142, 0x8149, 0x8148, 0x8141, 0x8145, 0x8176, 0x8178, 0x816a, 0x8163, 0x815c, 0x8160]);

export class PageText {
  constructor(screen, font, text) {
    this.screen = screen;
    this.font = font;
    this.text = text;
    this.shown = 0;
    this.drawn = -1;
    this.base = null;
    this.layout = [];
    this.source = null;
    this.menu = null;
  }

  showMenu(choices, selected, entries) {
    const moved = this.menu && this.menu.selected !== selected;
    this.menu = { choices, selected, entries, blink: moved || !this.menu ? 0 : this.menu.blink };
    this.drawn = -1;
  }

  hideMenu() {
    if (!this.menu) return;
    this.menu = null;
    this.drawn = -1;
  }

  // Touch: the band of each menu label (14 pixels per row, as menuGlyphs lays them out).
  menuRows() {
    if (!this.menu || !this.layout) return [];
    const last = this.layout[this.layout.length - 1];
    const y = (last ? last.y : -3) + 28;
    return this.menu.choices.map((_, index) => ({ top: y + 14 * index - 2, bottom: y + 14 * index + 12 }));
  }

  // Labels sit on the rows after the story, one blank row between (welcome screen, mGBA).
  menuGlyphs() {
    const glyphs = [];
    const last = this.layout[this.layout.length - 1];
    let y = (last ? last.y : -3) + 28;
    const { choices, selected, entries } = this.menu;
    choices.forEach((chunks, index) => {
      const x0 = entries[index]?.x ?? 62;
      let x = x0;
      const color = index === selected ? 8 : 2;
      if (index === selected && this.menu.blink % MENU_BLINK < MENU_BLINK_ON)
        glyphs.push({ encoded: MENU_CURSOR, x: x0 - MENU_CURSOR_OFFSET, y, color: 2 });
      for (const raw of chunks) for (let pos = 0; pos < raw.length; pos++) {
        const byte = raw[pos];
        if (byte > 0x80) {
          const encoded = (byte << 8) | raw[++pos];
          const index = this.font.find(encoded);
          const width = index < 0 ? 8 : this.font.glyph(index).width;
          glyphs.push({ encoded, x, y, color });
          x += encoded === 0x8141 || encoded === 0x8142 ? 8 : encoded === 0x8140 ? 2 : width;
        } else if ("nsvcC".includes(String.fromCharCode(byte))) pos++;
      }
      y += 14;
    });
    return glyphs;
  }

  // Glyph positions for the page collected so far. `g` scales the cartridge's geometry for the
  // large mobile text (large-text.js); the default is the screen's own (k = 1, scale = 1).
  place(fragments, g = NATIVE) {
    // The page as a list: glyphs (with their color), new lines, and 'L' breaks.
    const items = [];
    let color = 2;
    const glyph = (encoded) => {
      const index = this.font.find(encoded);
      const width = index < 0 ? 8 : this.font.glyph(index).width;
      // 、。 advance 8; the ideographic space advances 2 (mGBA: 「は　　　透」 leaves 6 pixels).
      const advance = (encoded === 0x8141 || encoded === 0x8142 ? 8 : encoded === 0x8140 ? 2 : width) * g.scale;
      items.push({ encoded, color, advance });
    };
    for (const fragment of fragments) {
      if (fragment === "\n") items.push("\n");
      else if (fragment.breakPast !== undefined) items.push(fragment);
      else if (fragment.color !== undefined) color = 16 + FOREGROUND[(fragment.color + 8) & 15];
      else if (fragment.objColor !== undefined) color = 16 + FOREGROUND[fragment.objColor & 7];
      else if (typeof fragment === "string") {
        // TextWindow gives the name, or {name:n} with n the raw argument byte ('1' = 0x31).
        let id = Number(fragment.match(/^\{name:(\d+)\}$/)?.[1] ?? Object.keys(this.text.names).find((k) => this.text.names[k] === fragment));
        if (id >= 0x30) id -= 0x30;
        const bytes = this.text.nameBytes?.[id] ?? NAMES[id] ?? [];
        for (let i = 0; i + 1 < bytes.length; i += 2) glyph((bytes[i] << 8) | bytes[i + 1]);
      } else glyph((fragment[0] << 8) | fragment[1]);
    }

    const glyphs = [];
    const left = 8 * g.k, top = 11 * g.k, limit = g.limit ?? 0xdb;
    let x = left, y = top, hung = false;
    const newline = () => { x = left; y += g.pitch; };
    // The large mobile text (g.words) keeps words whole: a word that would run past the right
    // edge starts the next row, with the punctuation after it, and spaces never start a row.
    const wordWidth = (from) => {
      let width = 0;
      for (let i = from; i < items.length && items[i].encoded !== undefined && !SPACES.has(items[i].encoded); i++)
        width += HANGING.has(items[i].encoded) || KOREAN_HANGING.has(items[i].encoded) ? 0 : items[i].advance;
      return width;
    };
    items.forEach((item, i) => {
      if (item === "\n") return newline();
      if (item.breakPast !== undefined) { if (x > item.breakPast * g.k) newline(); return; }
      const { encoded, advance } = item;
      if (g.words) {
        const space = SPACES.has(encoded);
        const hangs = HANGING.has(encoded) || KOREAN_HANGING.has(encoded);
        const startsWord = !space && !hangs && (i === 0 || items[i - 1].encoded === undefined || SPACES.has(items[i - 1].encoded));
        if (startsWord && x > left && x + wordWidth(i) > g.right) newline();
        else if (hangs ? x + advance > g.right + 6 * g.k : !space && x > limit) newline();
      } else if (x > limit) {
        // 08007F04: past x 0xDB a glyph goes to the next row, but closing punctuation may stay
        // on the row once (02024E1A); a second one in a row wraps.
        if (HANGING.has(encoded) && !hung) hung = true;
        else { hung = false; newline(); }
      } else if (!HANGING.has(encoded)) hung = false;
      glyphs.push({ encoded, x, y, color: item.color });
      x += advance;
    });
    // Where the next glyph would go (the wait marker's place; the next row past the limit).
    glyphs.end = x > limit ? { x: left, y: y + g.pitch } : { x, y };
    return glyphs;
  }

  get typing() {
    return this.shown < this.layout.length;
  }

  // Once per frame, after the VM.
  frame(hidden = false) {
    const fragments = this.text.fragments;
    if (fragments !== this.source || fragments.length !== this.count) {
      if (fragments !== this.source || fragments.length < this.count) this.shown = 0;
      this.source = fragments;
      this.count = fragments.length;
      this.layout = this.place(fragments);
      if (this.shown > this.layout.length) this.shown = this.layout.length;
    }
    if (this.shown < this.layout.length) this.shown++;
    // 080073F4 while the window waits for a press (02024E21 counts the frames): the marker is
    // drawn at the next glyph's place, on the next row past x 0xDB, when the count reaches 16,
    // and erased and drawn again every 16 frames.
    const marking = this.waitMarker && this.shown >= this.layout.length;
    this.waitFrames = marking ? (this.waitFrames ?? -1) + 1 : -1;
    const markerOn = marking && ((this.waitFrames >> 4) & 1) === 1;
    if (markerOn !== Boolean(this.markerShown)) { this.markerShown = markerOn; this.drawn = -1; }
    // 1D 23: the highlighted foreground and the ▶ beside it (text.roulette).
    const roulette = this.text.roulette ?? null;
    const rouletteKey = roulette ? `${roulette.highlight}:${roulette.y}` : "";
    if (rouletteKey !== this.rouletteKey) { this.rouletteKey = rouletteKey; this.drawn = -1; this.colors = textColors(roulette?.highlight); }
    const colors = this.colors ?? (this.colors = textColors(null));
    if (hidden) { this.drawn = -1; this.large?.clear(); return; }
    const screen = this.screen;
    if (this.menu) { this.menu.blink++; this.drawn = -1; }
    // Mobile: the story text goes to the large overlay instead (not while a menu sits under it).
    const large = this.large?.enabled && !this.menu ? this.large : null;
    if (large !== this.largeUsed) { this.largeUsed = large; this.drawn = -1; if (!large) this.large?.clear(); }
    if (!screen.base || (this.drawn === this.shown && this.base === screen.base)) return;
    this.base = screen.base;
    this.drawn = this.shown;
    const surface = new ObjTextSurface();
    if (large) {
      if (this.largeSource !== this.layout) { this.largeSource = this.layout; this.largeLayout = this.place(fragments, large.geometry); }
      large.draw(this.font, this.largeLayout, this.shown, this.markerShown ? this.waitMarker : 0, colors);
    } else {
      for (const glyph of this.layout.slice(0, this.shown)) surface.glyph(this.font, glyph.encoded, glyph.x, glyph.y, glyph.color);
      if (this.markerShown) {
        const { x, y } = this.layout.end ?? { x: 8, y: 11 };
        surface.glyph(this.font, this.waitMarker, x, y, 2);
      }
      // 08006C64(0, y, 848B): y in the 0-228 range (* 14 / 20).
      if (roulette?.y != null) surface.glyph(this.font, 0x848b, 0, Math.trunc((roulette.y * 14) / 20), 2);
    }
    if (this.menu) for (const glyph of this.menuGlyphs()) surface.glyph(this.font, glyph.encoded, glyph.x, glyph.y, glyph.color);
    const data = screen.image.data;
    data.set(screen.base);
    for (let pixel = 0; pixel < surface.pixels.length; pixel++) {
      const color = colors[surface.pixels[pixel]];
      if (!color) continue;
      data.set(color, pixel * 4);
    }
    screen.ctx.putImageData(screen.image, 0, 0);
  }
}
