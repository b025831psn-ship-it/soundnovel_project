// Story text on the game screen, as the cartridge shows it in the opening (checked against mGBA):
// OBJ glyphs with a dark outline and white interior from (8, 11), 14-pixel rows, a new row when
// the next glyph would start at x >= 220 or after a sentence's click wait ('r' then 'p'), and one
// glyph added per frame. A press while the glyphs are still appearing is ignored.
import { ObjTextSurface } from "./obj-text.js";

// Shift-JIS for the default names {name:1} and {name:2}.
const NAMES = { 1: [0x93, 0xa7], 2: [0x90, 0x5e, 0x97, 0x9d] };
const COLORS = { 1: [0, 0, 0], 2: [255, 255, 255] };

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
  }

  // Glyph positions for the page collected so far.
  place(fragments) {
    const glyphs = [];
    let x = 8, y = 11;
    const put = (encoded) => {
      const index = this.font.find(encoded);
      const width = index < 0 ? 8 : this.font.glyph(index).width;
      const advance = encoded === 0x8141 || encoded === 0x8142 ? 8 : width;
      if (x >= 220) { x = 8; y += 14; }
      glyphs.push({ encoded, x, y });
      x += advance;
    };
    for (const fragment of fragments) {
      if (fragment === "\n") { x = 8; y += 14; continue; }
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
    if (!screen.base || (this.drawn === this.shown && this.base === screen.base)) return;
    this.base = screen.base;
    this.drawn = this.shown;
    const surface = new ObjTextSurface();
    for (const glyph of this.layout.slice(0, this.shown)) surface.glyph(this.font, glyph.encoded, glyph.x, glyph.y, 2);
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
