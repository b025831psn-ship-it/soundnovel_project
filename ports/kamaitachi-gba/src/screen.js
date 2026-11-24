export class Screen {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = 240;
    canvas.height = 160;
    this.ctx = canvas.getContext("2d");
    this.image = this.ctx.createImageData(240, 160);
    this.base = null;
    this.brightness = new Int32Array(11);
  }

  setBackground(tiles, palette, variant = 0) {
    this.background = { tiles, palette, variant };
    this.renderBackground();
  }

  setBrightness(slot, current) {
    this.brightness[slot] = current;
    if (slot === 1 || slot === 5) this.renderBackground();
  }

  renderBackground() {
    if (!this.background) return;
    const { tiles, palette, variant } = this.background;
    const factor = [15, 13, 11, 6][variant] ?? 15;
    // 08000AC0 turns slot 1 into the coefficient passed to 08001D6C.
    // The opening uses scale 16 and saturation 5 (03001EE4), so 0x8000
    // becomes coefficient 15. Color zero is deliberately left untouched.
    const coefficient = Math.max(0, (this.brightness[1] >> 11) - 1);
    const adjustment = coefficient ? Math.max(-31, 5 + (coefficient - 15) * 3) : -31;
    const colors = [];
    for (let index = 0; index < 256; index++) {
      let color = palette[2 * index] | (palette[2 * index + 1] << 8);
      if (index < 236 && color & 0x7fff) {
        const scale = (channel) => Math.floor((channel * factor) / 15);
        const channels = [scale(color & 31), scale((color >> 5) & 31), scale((color >> 10) & 31)];
        const maximum = Math.max(...channels);
        color = channels.map((channel) => {
          const distance = Math.floor(((maximum - channel) * 21 + 8) / 16);
          return Math.max(0, Math.min(31, maximum - distance + adjustment));
        }).reduce((packed, channel, shift) => packed | (channel << (5 * shift)), 0);
      }
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
    this.text(font, story, 8, 8, [255, 255, 255]);
    let y = 24;
    for (let index = 0; index < choices.length; index++) {
      if (index === selected) {
        const points = [[1, 2], [1, 10], [7, 6]];
        for (let py = 2; py <= 10; py++)
          for (let px = 1; px <= 7 - Math.abs(6 - py); px++) {
            const at = 4 * ((y + py) * 240 + px);
            this.image.data.set([255, 255, 255, 255], at);
          }
      }
      this.glyph(font, 0x8260 + index, 8, y, [255, 255, 255]);
      const color = index === selected ? [255, 128, 224] : [255, 255, 255];
      y = this.text(font, choices[index] ?? [], 24, y, color);
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
