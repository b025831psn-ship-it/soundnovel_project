export class ObjTextSurface {
  constructor() {
    this.pixels = new Uint8Array(240 * 160);
  }

  glyph(font, encoded, x, y, foreground) {
    const index = font.find(encoded);
    if (index < 0) return 8;
    const glyph = font.glyph(index);
    for (let gy = 0; gy < glyph.height; gy++) for (let gx = 0; gx < glyph.width; gx++) {
      const value = glyph.pixels[gy * glyph.width + gx];
      // Native glyph masks use 0 for exterior transparency, 1 for the dark
      // outline and 14 for the interior foreground color.
      if (value === 0) continue;
      const px = x + gx, py = y + gy;
      if (px >= 0 && px < 240 && py >= 0 && py < 160)
        this.pixels[py * 240 + px] = value === 1 ? 1 : foreground;
    }
    return glyph.width;
  }

  text(font, chunks, x, y, foreground, maxX = 232, wrapX = x) {
    for (const raw of chunks.flat(Infinity)) for (let pos = 0; pos < raw.length; pos++) {
      const byte = raw[pos];
      if (byte > 0x80) {
        const encoded = (byte << 8) | raw[++pos];
        const index = font.find(encoded);
        const width = index < 0 ? 8 : font.glyph(index).width;
        const advance = encoded === 0x8141 || encoded === 0x8142 ? 8 : width;
        if (x >= maxX - 12) { x = wrapX; y += 14; }
        this.glyph(font, encoded, x, y, foreground);
        x += advance;
        continue;
      }
      const control = String.fromCharCode(byte);
      if ("nsvcC".includes(control)) pos++;
      // r/p terminate or page the scenario text after the visible run. They
      // do not allocate extra rows in the already collected choice buffer.
    }
    return y + 14;
  }

  choices(font, story, choices, selected = 0) {
    // At opcode 16, pageRaw[0] is the retained story line; the later chunks
    // are v/c buffer-selection commands and their A/B prefixes.
    if (story[0]) this.text(font, [story[0]], 8, 11, 2);
    let y = 25;
    this.rows = [];
    for (let index = 0; index < choices.length; index++) {
      const color = index === selected ? 8 : 9;
      this.glyph(font, 0x8260 + index, 10, y, color);
      const top = y;
      y = this.text(font, choices[index] ?? [], 24, y, color, 232, 24);
      this.rows.push({ top, bottom: y }); // touch: the band each choice covers
    }
    return this;
  }

  objCharblock() {
    const output = new Uint8Array(0x8000);
    for (let y = 0; y < 160; y++) for (let x = 0; x < 240; x++) {
      const tile = (y >> 3) * 32 + (x >> 3);
      const at = tile * 32 + (y & 7) * 4 + ((x & 7) >> 1);
      output[at] |= this.pixels[y * 240 + x] << ((x & 1) * 4);
    }
    return output;
  }
}
