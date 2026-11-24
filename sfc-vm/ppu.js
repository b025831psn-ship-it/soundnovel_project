function color(cgram, index) {
  const value = cgram[(index * 2) & 0x1ff] | (cgram[(index * 2 + 1) & 0x1ff] << 8);
  return [
    Math.round((value & 31) * 255 / 31),
    Math.round(((value >>> 5) & 31) * 255 / 31),
    Math.round(((value >>> 10) & 31) * 255 / 31),
  ];
}

export function decodeTilePixel(vram, tileAddress, x, y, bitsPerPixel) {
  let pixel = 0;
  for (let plane = 0; plane < bitsPerPixel; plane++) {
    const pair = plane >>> 1;
    const byte = vram[(tileAddress + pair * 16 + y * 2 + (plane & 1)) & 0xffff];
    pixel |= ((byte >>> (7 - x)) & 1) << plane;
  }
  return pixel;
}

// First compositor milestone: the mode-3 BG1 path used during the verified
// SFC boot. It consumes the live PPU registers and VRAM/CGRAM, not extracted
// or redrawn game assets.
export function renderMode3Bg1(bus, width = 256, height = 224) {
  const io = bus.io;
  if ((io[0x2105 - 0x2000] & 7) !== 3) throw new Error('mode 3 BG1 renderer requires BGMODE=3');
  const rgba = new Uint8ClampedArray(width * height * 4);
  const screen = io[0x2107 - 0x2000];
  const mapBase = ((screen >>> 2) * 0x800) & 0xffff;
  const mapWidth = (screen & 1) ? 64 : 32;
  const mapHeight = (screen & 2) ? 64 : 32;
  const tileBase = ((io[0x210b - 0x2000] & 0x0f) * 0x2000) & 0xffff;
  const backdrop = color(bus.cgram, 0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileX = (x >>> 3) % mapWidth;
      const tileY = (y >>> 3) % mapHeight;
      const quadrant = (tileX >>> 5) + (tileY >>> 5) * (mapWidth >>> 5);
      const entryOffset = mapBase + quadrant * 0x800 + (((tileY & 31) * 32 + (tileX & 31)) * 2);
      const entry = bus.vram[entryOffset & 0xffff] | (bus.vram[(entryOffset + 1) & 0xffff] << 8);
      const localX = entry & 0x4000 ? 7 - (x & 7) : x & 7;
      const localY = entry & 0x8000 ? 7 - (y & 7) : y & 7;
      const paletteIndex = decodeTilePixel(bus.vram, tileBase + (entry & 0x3ff) * 64, localX, localY, 8);
      const rgb = paletteIndex === 0 ? backdrop : color(bus.cgram, paletteIndex);
      const output = (y * width + x) * 4;
      rgba.set(rgb, output);
      rgba[output + 3] = 255;
    }
  }
  return rgba;
}
