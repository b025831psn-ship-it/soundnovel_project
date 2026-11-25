import { ObjTextSurface } from "./obj-text.js";

// 08001D74 for one BGR555 color: each channel moves toward the brightest by (16 + 彩度) / 16 of its
// distance, then all shift by `adjustment`, clamped to 0..31.
export function toneColor(color, saturation, adjustment, factor = 15) {
  const scale = (channel) => Math.floor((channel * factor) / 15);
  const channels = [scale(color & 31), scale((color >> 5) & 31), scale((color >> 10) & 31)];
  const maximum = Math.max(...channels);
  return channels.map((channel) => {
    const distance = Math.floor(((maximum - channel) * (16 + saturation) + 8) / 16);
    return Math.max(0, Math.min(31, maximum - distance + adjustment));
  }).reduce((packed, channel, shift) => packed | (channel << (5 * shift)), 0);
}

export class Screen {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = 240;
    canvas.height = 160;
    this.ctx = canvas.getContext("2d");
    this.image = this.ctx.createImageData(240, 160);
    this.base = null;
    this.brightness = new Int32Array(11);
    // 03001EE4 / 03001EE5: the 明度 and 彩度 settings of オプション (5 each at power-on).
    this.tone = { brightness: 5, saturation: 5 };
  }

  setBackground(tiles, palette, variant = 0) {
    this.background = { tiles, palette, variant };
    this.renderBackground();
  }

  // A menu color of BG palette bank 15 under the current 明度 and 彩度, faded by slot 5
  // (mGBA: the header bar's 0x15D9 becomes 0x1E1B at 明度 2 and 0x09FF at 明度 6, 彩度 10, and
  // 0x0113 two frames before the end of a fade-in).
  menuColor(raw) {
    const coefficient = Math.max(0, (this.brightness[5] >> 11) - 1);
    if (!coefficient) return 0;
    return toneColor(raw, this.tone.saturation, Math.max(-31, this.tone.brightness + (coefficient - 15) * 3));
  }

  setBrightness(slot, current) {
    this.brightness[slot] = current;
    if (slot === 1 || slot === 5) this.renderBackground();
  }

  renderBackground() {
    if (!this.background) return;
    const { tiles, palette, variant } = this.background;
    const factor = [15, 13, 11, 6][variant] ?? 15;
    // 08000AC0 turns slot 1 into the coefficient passed to 08001D74 (0x8000 is 15). Each channel
    // moves toward the brightest by (16 + 彩度) / 16 of its distance, then everything shifts by
    // 明度 + 3 per coefficient step below 15. Color zero is deliberately left untouched.
    const { brightness, saturation } = this.tone;
    const coefficient = Math.max(0, (this.brightness[1] >> 11) - 1);
    const adjustment = coefficient ? Math.max(-31, brightness + (coefficient - 15) * 3) : -31;
    const colors = [];
    for (let index = 0; index < 256; index++) {
      let color = palette[2 * index] | (palette[2 * index + 1] << 8);
      if (index < 236 && color & 0x7fff) color = toneColor(color, saturation, adjustment, factor);
      colors.push([color & 31, (color >> 5) & 31, (color >> 10) & 31]);
    }
    for (let y = 0; y < 160; y++) {
      for (let x = 0; x < 240; x++) {
        const tile = ((y >> 3) * 30 + (x >> 3)) * 64;
        const pixel = tile + (y & 7) * 8 + (x & 7);
        const color = colors[tiles[pixel]];
        const output = 4 * (y * 240 + x);
        const rgb8 = (channel) => (channel << 3) | (channel >> 2);
        this.image.data[output] = rgb8(color[0]);
        this.image.data[output + 1] = rgb8(color[1]);
        this.image.data[output + 2] = rgb8(color[2]);
        this.image.data[output + 3] = 255;
      }
    }
    this.ctx.putImageData(this.image, 0, 0);
    this.base = new Uint8ClampedArray(this.image.data);
    if (this.choiceOverlay) {
      const { font, story, choices, selected } = this.choiceOverlay;
      this.showChoices(font, story, choices, selected);
    }
  }

  glyph(font, encoded, x, y, color) {
    const index = font.find(encoded);
    if (index < 0) return 8;
    const glyph = font.glyph(index);
    for (let gy = 0; gy < glyph.height; gy++) {
      for (let gx = 0; gx < glyph.width; gx++) {
        const value = glyph.pixels[gy * glyph.width + gx];
        if (value === 14) continue;
        const px = x + gx, py = y + gy;
        if (px < 0 || px >= 240 || py < 0 || py >= 160) continue;
        const at = 4 * (py * 240 + px);
        const rgb = value === 0 ? [0, 0, 0] : color;
        this.image.data[at] = rgb[0];
        this.image.data[at + 1] = rgb[1];
        this.image.data[at + 2] = rgb[2];
        this.image.data[at + 3] = 255;
      }
    }
    return glyph.width;
  }

  text(font, chunks, x, y, color, maxX = 232) {
    const startX = x;
    for (const raw of chunks.flat(Infinity)) {
      for (let pos = 0; pos < raw.length; pos++) {
        const byte = raw[pos];
        if (byte > 0x80) {
          const encoded = (byte << 8) | raw[++pos];
          const index = font.find(encoded);
          const width = index < 0 ? 8 : font.glyph(index).width;
          if (x + width > maxX) { x = startX; y += 16; }
          x += this.glyph(font, encoded, x, y, color);
          continue;
        }
        const control = String.fromCharCode(byte);
        if ("nsvcC".includes(control)) pos++;
        if (control === "r" || control === "p") { x = startX; y += 16; }
      }
    }
    return y + 16;
  }

  showChoices(font, story, choices, selected = 0) {
    this.choiceOverlay = { font, story, choices, selected };
    if (this.base) this.image.data.set(this.base);
    const surface = new ObjTextSurface().choices(font, story, choices, selected);
    this.choiceRows = surface.rows;
    const colors = { 1: [0, 0, 0], 2: [255, 255, 255], 8: [255, 123, 222], 9: [255, 255, 255] };
    for (let pixel = 0; pixel < surface.pixels.length; pixel++) {
      const color = colors[surface.pixels[pixel]];
      if (!color) continue;
      const at = pixel * 4;
      this.image.data[at] = color[0];
      this.image.data[at + 1] = color[1];
      this.image.data[at + 2] = color[2];
      this.image.data[at + 3] = 255;
    }
    this.ctx.putImageData(this.image, 0, 0);
  }

  clearChoices() {
    this.choiceOverlay = null;
    if (this.base) {
      this.image.data.set(this.base);
      this.ctx.putImageData(this.image, 0, 0);
    }
  }
}
