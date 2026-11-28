export function drawBitmapGlyph(frame, font, glyph, x, y, palette) {
  const {width, height, pixels} = frame;
  const [ink, shadow] = palette;
  for (const [dx, dy, color] of [[1, 1, shadow], [1, 0, shadow], [0, 1, shadow], [0, 0, ink]]) {
    for (let row = 0; row < 13 && y + row + dy < height; row++) {
      const mask = (font[glyph + 2*row] << 8) | font[glyph + 2*row + 1];
      for (let col = 0; col < 16 && x + col + dx < width; col++) {
        if (mask & (0x8000 >> col)) pixels[(y + row + dy) * width + x + col + dx] = color;
      }
    }
  }
}

// Each KF1 glyph has thirteen big-endian rows. The caller supplies both
// fonts and the two code-range tables from its private SLPS-01863 data.
export class TextDisplay {
  constructor(frame, fonts, ranges, palettes = [[0xbdd7, 0x39c7]]) {
    this.frame = frame;
    this.fonts = fonts;
    this.ranges = ranges;
    this.palettes = palettes;
    this.column = 0;
    this.line = 0;
    this.offset = 0;
    this.background = frame.pixels.slice();
    this.delay = 2;
    this.wait = null;
    this.colorIndex = 0;
    this.optionRows = [];
  }

  // One tick per VSync at normal text speed. A caller handles the wait
  // indicator and supplies confirm/choice input before resuming the stream.
  tick(bytes, confirmed = false) {
    if (this.wait) {
      if (!confirmed) return {type: this.wait};
      this.wait = null;
    }
    if (this.delay > 0) {
      this.delay--;
      return {type: "delay"};
    }
    this.delay = 1;
    return this.advance(bytes);
  }

  drawGlyph(code) {
    const bank = Number(code >= 0x889f);
    const range = bank
      ? this.ranges[1][2 * ((code >>> 8) - 0x88) - Number((code & 255) < 0x7f)]
      : this.ranges[0].findLast(([start]) => start <= code);
    if (!range) throw new RangeError(`Unknown glyph ${code.toString(16)}`);
    const glyph = (range[1] + code - range[0]) * 26;
    const font = this.fonts[bank];
    if (glyph + 26 > font.length) throw new RangeError(`Glyph outside KF1: ${code.toString(16)}`);
    const x = 21 + 15 * this.column;
    const y = 24 + 24 * this.line;
    const palette = this.palettes[this.colorIndex];
    if (!palette) throw new Error(`Missing text palette ${this.colorIndex}`);
    drawBitmapGlyph(this.frame, font, glyph, x, y, palette);
    this.column++;
    if (this.column === 18) {
      this.column = 0;
      this.line++;
    }
  }

  advance(bytes) {
    if (this.offset >= bytes.length) return {type: "end"};
    const high = bytes[this.offset++];
    if (this.offset === bytes.length) throw new RangeError("Incomplete text code");
    const low = bytes[this.offset++];
    if (high === 64) {
      if (low === 114 && this.column !== 0) {
        this.column = 0;
        this.line++;
      }
      if (low === 112) {
        this.frame.pixels.set(this.background);
        this.column = this.line = 0;
      }
      if (low === 103) this.optionRows.push(this.line);
      if (low === 113) this.wait = "choice";
      if (low === 107) this.wait = "confirm";
      if (low === 119 || low === 108) {
        const args = String.fromCharCode(...bytes.subarray(this.offset, this.offset + 5));
        const parsed = (low === 119 ? /^([\da-f]{2})/i : /^([\da-f]{2}),([\da-f]{2})/i).exec(args);
        if (!parsed) throw new RangeError(`Malformed text control at ${this.offset - 2}`);
        this.offset += parsed[0].length;
        if (low === 119) this.delay = parseInt(parsed[1], 16);
        else {
          this.column = parseInt(parsed[1], 16);
          this.line = parseInt(parsed[2], 16);
        }
      }
      if (low >= 48 && low <= 57) this.colorIndex = low - 48;
      if (low >= 97 && low <= 102) this.colorIndex = low - 87;
      return {type: "control", code: String.fromCharCode(low)};
    }
    this.drawGlyph((high << 8) | low);
    return {type: "glyph"};
  }
}
