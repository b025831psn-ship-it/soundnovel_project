// Mobile only (태우, 2026-11-25): the story text drawn larger, with wider rows, on top of the game
// screen. The cartridge's glyphs and rules are kept (PageText.place with scaled geometry); a page
// that no longer fits scrolls up so its newest rows stay on screen. PC keeps the original screen.
//
// The overlay is a canvas K times the GBA screen, laid over #screen with the same CSS box, and each
// glyph pixel is a SCALE x SCALE block of it (SCALE / K = 1.25 times the original size).
const K = 4;
const SCALE = 5;
const WIDTH = 240 * K;
const HEIGHT = 160 * K;
const ROW = 16 * SCALE; // 14-pixel rows on the cartridge; these leave a wider gap between lines
const GLYPH = 12 * SCALE;
const BOTTOM = HEIGHT - 6 * K;

export function wantsLargeText(search = globalThis.location?.search ?? "") {
  const forced = new URLSearchParams(search).get("bigtext");
  if (forced !== null) return forced !== "0";
  return Boolean(globalThis.matchMedia?.("(pointer: coarse) and (hover: none)").matches);
}

export class LargeText {
  constructor(screenCanvas) {
    this.screenCanvas = screenCanvas;
    this.enabled = true;
    this.geometry = { k: K, scale: SCALE, pitch: ROW, limit: WIDTH - 8 * K - GLYPH, right: WIDTH - 8 * K, words: true };
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "absolute", pointerEvents: "none", imageRendering: "pixelated", zIndex: "1" });
    screenCanvas.insertAdjacentElement("afterend", canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.image = this.ctx.createImageData(WIDTH, HEIGHT);
    this.pixels = new Uint32Array(this.image.data.buffer);
    this.empty = true;
    this.place();
  }

  // Follow the screen's CSS box (it moves with the layout, rotation and fullscreen).
  place() {
    const screen = this.screenCanvas;
    const parent = this.canvas.offsetParent ?? screen.parentElement;
    const a = screen.getBoundingClientRect();
    const b = parent.getBoundingClientRect();
    const box = `${a.left - b.left - parent.clientLeft}|${a.top - b.top - parent.clientTop}|${a.width}|${a.height}`;
    if (box === this.box) return;
    this.box = box;
    const [left, top, width, height] = box.split("|");
    Object.assign(this.canvas.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
  }

  clear() {
    if (this.empty) return;
    this.pixels.fill(0);
    this.ctx.putImageData(this.image, 0, 0);
    this.empty = true;
  }

  // layout: glyphs from PageText.place(fragments, this.geometry); shown: how many have appeared.
  draw(font, layout, shown, marker, colors) {
    this.place();
    const glyphs = layout.slice(0, shown);
    const end = shown >= layout.length ? layout.end : null;
    // Scroll so the newest row (and the marker) stays above the bottom edge, whole rows at a time.
    const lastY = Math.max(glyphs.at(-1)?.y ?? 0, marker && end ? end.y : 0);
    const scroll = lastY + GLYPH > BOTTOM ? Math.ceil((lastY + GLYPH - BOTTOM) / ROW) * ROW : 0;
    this.pixels.fill(0);
    const rgba = (c) => { const [r, g, b] = colors[c]; return (255 << 24 | b << 16 | g << 8 | r) >>> 0; };
    const outline = rgba(1);
    const put = (encoded, x, y, color) => {
      const index = font.find(encoded);
      if (index < 0) return;
      const glyph = font.glyph(index);
      const fill = rgba(color);
      for (let gy = 0; gy < glyph.height; gy++) for (let gx = 0; gx < glyph.width; gx++) {
        const value = glyph.pixels[gy * glyph.width + gx];
        if (!value) continue;
        const word = value === 1 ? outline : fill;
        const px = x + gx * SCALE, py = y + gy * SCALE;
        for (let dy = 0; dy < SCALE; dy++) {
          const row = py + dy;
          if (row < 0 || row >= HEIGHT) continue;
          const at = row * WIDTH;
          for (let dx = 0; dx < SCALE; dx++) if (px + dx >= 0 && px + dx < WIDTH) this.pixels[at + px + dx] = word;
        }
      }
    };
    for (const glyph of glyphs) put(glyph.encoded, glyph.x, glyph.y - scroll, glyph.color);
    if (marker && end) put(marker, end.x, end.y - scroll, 2);
    this.ctx.putImageData(this.image, 0, 0);
    this.empty = false;
  }
}
