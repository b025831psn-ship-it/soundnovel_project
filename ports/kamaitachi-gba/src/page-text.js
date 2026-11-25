// Story text on the game screen, as the cartridge shows it in the opening (checked against mGBA):
// OBJ glyphs with a dark outline and white interior from (8, 11), 14-pixel rows, a new row when
// the next glyph would start at x >= 220 or after a sentence's click wait ('r' then 'p'), and one
// glyph added per frame. A press while the glyphs are still appearing is ignored.
import { ObjTextSurface } from "./obj-text.js";

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
const TEXT_COLOR = { 0: 2, 4: 4 };

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

  // Glyph positions for the page collected so far.
  place(fragments) {
    const glyphs = [];
    let x = 8, y = 11, color = 2;
    const put = (encoded) => {
      const index = this.font.find(encoded);
      const width = index < 0 ? 8 : this.font.glyph(index).width;
      // 、。 advance 8; the ideographic space advances 2 (mGBA: 「は　　　透」 leaves 6 pixels).
      const advance = encoded === 0x8141 || encoded === 0x8142 ? 8 : encoded === 0x8140 ? 2 : width;
      if (x >= 220) { x = 8; y += 14; }
      glyphs.push({ encoded, x, y, color });
      x += advance;
    };
    for (const fragment of fragments) {
      if (fragment === "\n") { x = 8; y += 14; continue; }
      if (fragment.color !== undefined) { color = TEXT_COLOR[fragment.color] ?? 2; continue; }
      if (typeof fragment === "string") {
        // TextWindow gives the name, or {name:n} with n the raw argument byte ('1' = 0x31).
        let id = Number(fragment.match(/^\{name:(\d+)\}$/)?.[1] ?? Object.keys(this.text.names).find((k) => this.text.names[k] === fragment));
        if (id >= 0x30) id -= 0x30;
        const bytes = NAMES[id] ?? [];
        for (let i = 0; i + 1 < bytes.length; i += 2) put((bytes[i] << 8) | bytes[i + 1]);
        continue;
      }
      put((fragment[0] << 8) | fragment[1]);
    }
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
    if (hidden) { this.drawn = -1; return; }
    const screen = this.screen;
    if (this.menu) { this.menu.blink++; this.drawn = -1; }
    if (!screen.base || (this.drawn === this.shown && this.base === screen.base)) return;
    this.base = screen.base;
    this.drawn = this.shown;
    const surface = new ObjTextSurface();
    for (const glyph of this.layout.slice(0, this.shown)) surface.glyph(this.font, glyph.encoded, glyph.x, glyph.y, glyph.color);
    if (this.menu) for (const glyph of this.menuGlyphs()) surface.glyph(this.font, glyph.encoded, glyph.x, glyph.y, glyph.color);
    const data = screen.image.data;
    data.set(screen.base);
    for (let pixel = 0; pixel < surface.pixels.length; pixel++) {
      const color = COLORS[surface.pixels[pixel]];
      if (!color) continue;
      data.set(color, pixel * 4);
    }
    screen.ctx.putImageData(screen.image, 0, 0);
  }
}
