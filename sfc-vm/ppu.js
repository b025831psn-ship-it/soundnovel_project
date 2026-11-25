function color(cgram, index) {
  const value = cgram[(index * 2) & 0x1ff] | (cgram[(index * 2 + 1) & 0x1ff] << 8);
  return [
    Math.round((value & 31) * 255 / 31),
    Math.round(((value >>> 5) & 31) * 255 / 31),
    Math.round(((value >>> 10) & 31) * 255 / 31),
  ];
}

const MODE_BPP = [[2, 2, 2, 2], [4, 4, 2], [4, 4], [8, 4], [8, 2], [4, 2], [4]];

function bgPixel(bus, bg, x, y, bpp) {
  const io = bus.io, screen = io[0x2107 + bg - 0x2000];
  const mapBase = ((screen >>> 2) * 0x800) & 0xffff;
  const mapWidth = screen & 1 ? 64 : 32, mapHeight = screen & 2 ? 64 : 32;
  const sx = (x + bus.bgHofs[bg]) & (mapWidth * 8 - 1);
  const sy = (y + bus.bgVofs[bg]) & (mapHeight * 8 - 1);
  const tileX = sx >>> 3, tileY = sy >>> 3;
  const quadrant = (tileX >>> 5) + (tileY >>> 5) * (mapWidth >>> 5);
  const entryAt = mapBase + quadrant * 0x800 + (((tileY & 31) * 32 + (tileX & 31)) << 1);
  const entry = bus.vram[entryAt & 0xffff] | (bus.vram[(entryAt + 1) & 0xffff] << 8);
  const baseReg = io[(bg < 2 ? 0x210b : 0x210c) - 0x2000];
  const nibble = bg & 1 ? baseReg >>> 4 : baseReg;
  const tileBase = (nibble & 0x0f) * 0x2000;
  const px = entry & 0x4000 ? 7 - (sx & 7) : sx & 7;
  const py = entry & 0x8000 ? 7 - (sy & 7) : sy & 7;
  const value = decodeTilePixel(bus.vram, tileBase + (entry & 0x3ff) * (8 * bpp), px, py, bpp);
  if (!value) return null;
  const palette = (entry >>> 10) & 7;
  const paletteBase = bpp === 8 ? 0 : bpp === 4 ? palette * 16 : bg * 32 + palette * 4;
  return { rgb: color(bus.cgram, paletteBase + value), priority: ((entry >>> 13) & 1) * 4 + (3 - bg) };
}

function renderObjects(bus, width, height) {
  const io = bus.io, obsel = io[0x2101 - 0x2000];
  const tileBase = (obsel & 7) * 0x4000;
  const sizeTable = [[8,16],[8,32],[8,64],[16,32],[16,64],[32,64],[16,32],[16,32]];
  const layer = new Int32Array(width * height).fill(-1);
  for (let object = 127; object >= 0; object--) {
    const at = object * 4, high = bus.oam[512 + (object >>> 2)] >>> ((object & 3) * 2);
    let ox = bus.oam[at] | ((high & 1) << 8); if (ox >= 256) ox -= 512;
    const oy = bus.oam[at + 1], large = (high >>> 1) & 1;
    const size = sizeTable[obsel >>> 5][large];
    const attr = bus.oam[at + 3];
    for (let py = 0; py < size; py++) { const sy = (oy + py) & 0xff; if (sy >= height) continue;
      for (let px = 0; px < size; px++) { const sx = ox + px; if (sx < 0 || sx >= width) continue;
        const tx = attr & 0x40 ? size - 1 - px : px, ty = attr & 0x80 ? size - 1 - py : py;
        const tile = bus.oam[at + 2] | ((attr & 1) << 8) | ((tx >>> 3) + (ty >>> 3) * 16);
        const value = decodeTilePixel(bus.vram, tileBase + tile * 32, tx & 7, ty & 7, 4);
        if (!value) continue;
        const priority = 8 + ((attr >>> 4) & 3), palette = 128 + ((attr >>> 1) & 7) * 16 + value;
        layer[sy * width + sx] = (priority << 9) | palette;
      }
    }
  }
  return layer;
}

function fixedColor(bus) {
  const value = bus.fixedColor;
  return [(value & 31) * 255 / 31, ((value >>> 5) & 31) * 255 / 31, ((value >>> 10) & 31) * 255 / 31];
}

function windowMasked(io, layer, x) {
  if (!(io[0x212e - 0x2000] & (1 << layer))) return false;
  const selectAddress = layer < 2 ? 0x2123 : layer < 4 ? 0x2124 : 0x2125;
  const shift = (layer & 1) * 4, select = io[selectAddress - 0x2000] >>> shift;
  const inside1 = x >= io[0x2126 - 0x2000] && x <= io[0x2127 - 0x2000];
  const inside2 = x >= io[0x2128 - 0x2000] && x <= io[0x2129 - 0x2000];
  const enabled1 = select & 2, enabled2 = select & 8;
  const w1 = enabled1 ? (inside1 !== !(select & 1)) : false;
  const w2 = enabled2 ? (inside2 !== !(select & 4)) : false;
  if (!enabled1) return w2; if (!enabled2) return w1;
  const logic = layer < 4 ? (io[0x212a - 0x2000] >>> (layer * 2)) & 3
    : (io[0x212b - 0x2000] >>> ((layer - 4) * 2)) & 3;
  return logic === 0 ? w1 || w2 : logic === 1 ? w1 && w2 : logic === 2 ? w1 !== w2 : w1 === w2;
}

export function renderFrame(bus, width = 256, height = 224) {
  const io = bus.io, rgba = new Uint8ClampedArray(width * height * 4);
  const brightness = io[0x2100 - 0x2000] & 15;
  if (io[0x2100 - 0x2000] & 0x80) {
    for (let index = 3; index < rgba.length; index += 4) rgba[index] = 255;
    return rgba;
  }
  const mode = io[0x2105 - 0x2000] & 7, bpps = MODE_BPP[mode] ?? [];
  const main = io[0x212c - 0x2000], math = io[0x2131 - 0x2000], half = !!(math & 0x40), subtract = !!(math & 0x80);
  const fixed = fixedColor(bus);
  const objects = main & 0x10 ? renderObjects(bus, width, height) : null;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let top = { rgb: color(bus.cgram, 0), priority: -1, layer: 5 };
    for (let bg = 0; bg < bpps.length; bg++) if ((main & (1 << bg)) && !windowMasked(io, bg, x)) {
      const pixel = bgPixel(bus, bg, x, y, bpps[bg]);
      if (pixel && pixel.priority > top.priority) top = { ...pixel, layer: bg };
    }
    if (objects && !windowMasked(io, 4, x)) { const packed = objects[y * width + x];
      if (packed >= 0) { const priority = packed >>> 9; if (priority > top.priority) top = { rgb: color(bus.cgram, packed & 0x1ff), priority, layer: 4 }; }
    }
    let rgb = top.rgb;
    if (math & (1 << top.layer)) rgb = rgb.map((value, channel) => {
      const mixed = subtract ? value - fixed[channel] : value + fixed[channel];
      return Math.max(0, Math.min(255, half ? mixed / 2 : mixed));
    });
    const out = (y * width + x) * 4;
    rgba[out] = rgb[0] * brightness / 15; rgba[out + 1] = rgb[1] * brightness / 15;
    rgba[out + 2] = rgb[2] * brightness / 15; rgba[out + 3] = 255;
  }
  return rgba;
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
