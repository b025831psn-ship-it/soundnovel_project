// Shared SNES PPU compositor, adapted from the project's Kamaitachi SFC VM.
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
  const tileAddress = tileBase + (entry & 0x3ff) * (8 * bpp);
  const value = bus.getDecodedTile ? bus.getDecodedTile(tileAddress, bpp)[py * 8 + px]
    : decodeTilePixel(bus.vram, tileAddress, px, py, bpp);
  if (!value) return null;
  const palette = (entry >>> 10) & 7;
  const mode = io[0x2105 - 0x2000] & 7;
  const paletteBase = bpp === 8 ? 0 : bpp === 4 ? palette * 16
    : (mode === 0 ? bg * 32 : 0) + palette * 4;
  const high = !!(entry & 0x2000);
  let priority = high ? 7 - bg : 3 - bg;
  if (mode === 1) {
    const mode1 = [[6, 9], [5, 8], [1, io[0x2105 - 0x2000] & 8 ? 11 : 3]];
    priority = mode1[bg][high ? 1 : 0];
  }
  return { rgb: color(bus.cgram, paletteBase + value), priority };
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
        const address = tileBase + tile * 32;
        const value = bus.getDecodedTile ? bus.getDecodedTile(address, 4)[(ty & 7) * 8 + (tx & 7)]
          : decodeTilePixel(bus.vram, address, tx & 7, ty & 7, 4);
        if (!value) continue;
        const objectPriority = (attr >>> 4) & 3;
        const priority = (io[0x2105 - 0x2000] & 7) === 1
          ? [2, 4, 7, 10][objectPriority] : 8 + objectPriority;
        const palette = 128 + ((attr >>> 1) & 7) * 16 + value;
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

function windowInside(io, layer, x) {
  const selectAddress = layer < 2 ? 0x2123 : layer < 4 ? 0x2124 : 0x2125;
  const shift = (layer & 1) * 4, select = io[selectAddress - 0x2000] >>> shift;
  const inside1 = x >= io[0x2126 - 0x2000] && x <= io[0x2127 - 0x2000];
  const inside2 = x >= io[0x2128 - 0x2000] && x <= io[0x2129 - 0x2000];
  const enabled1 = select & 2, enabled2 = select & 8;
  const w1 = enabled1 ? (select & 1 ? !inside1 : inside1) : false;
  const w2 = enabled2 ? (select & 4 ? !inside2 : inside2) : false;
  if (!enabled1) return w2; if (!enabled2) return w1;
  const logic = layer < 4 ? (io[0x212a - 0x2000] >>> (layer * 2)) & 3
    : (io[0x212b - 0x2000] >>> ((layer - 4) * 2)) & 3;
  return logic === 0 ? w1 || w2 : logic === 1 ? w1 && w2 : logic === 2 ? w1 !== w2 : w1 === w2;
}

function windowMasked(io, layer, x, maskRegister) {
  return !!(io[maskRegister - 0x2000] & (1 << layer)) && windowInside(io, layer, x);
}

function directColor(value, palette) {
  const r = ((value & 7) << 2) | ((palette & 1) << 1);
  const g = (((value >>> 3) & 7) << 2) | (((palette >>> 1) & 1) << 1);
  const b = (((value >>> 6) & 3) << 3) | (((palette >>> 2) & 1) << 2);
  return [r * 255 / 31, g * 255 / 31, b * 255 / 31];
}

function mode7Pixel(bus, bg, x, y) {
  const io = bus.io, select = io[0x211a - 0x2000];
  if (select & 1) x = 255 - x;
  if (select & 2) y = 255 - y;
  const [a, b, c, d, cx, cy] = bus.mode7;
  const hofs = bus.bgHofs[0], vofs = bus.bgVofs[0];
  const sx = ((a * (x + hofs - cx) + b * (y + vofs - cy)) >> 8) + cx;
  const sy = ((c * (x + hofs - cx) + d * (y + vofs - cy)) >> 8) + cy;
  const outside = sx < 0 || sx >= 1024 || sy < 0 || sy >= 1024;
  const repeat = select >>> 6;
  if (outside && (repeat === 2 || repeat === 3)) {
    if (repeat === 2) return null;
    const value = bus.vram[((sy & 7) << 4) | ((sx & 7) << 1) | 1];
    if (!value) return null;
    return { rgb: color(bus.cgram, value & (bg ? 0x7f : 0xff)), priority: bg && (value & 0x80) ? 7 : 1 };
  }
  const wx = sx & 1023, wy = sy & 1023;
  const tile = bus.vram[(((wy >>> 3) * 128 + (wx >>> 3)) << 1) & 0xffff];
  const value = bus.vram[((tile * 64 + (wy & 7) * 8 + (wx & 7)) << 1 | 1) & 0xffff];
  if (!value) return null;
  if (bg && !(io[0x2133 - 0x2000] & 0x40)) return null;
  return { rgb: color(bus.cgram, value & (bg ? 0x7f : 0xff)), priority: bg && (value & 0x80) ? 7 : 1 };
}

function layerPixel(bus, objects, bg, x, y, bpps, direct) {
  if (bg === 4) {
    const packed = objects?.[y * 256 + x] ?? -1;
    return packed < 0 ? null : { rgb: color(bus.cgram, packed & 0x1ff), priority: packed >>> 9 };
  }
  if ((bus.io[0x2105 - 0x2000] & 7) === 7) return mode7Pixel(bus, bg, x, y);
  const pixel = bgPixel(bus, bg, x, y, bpps[bg]);
  if (pixel && direct && bpps[bg] === 8) {
    // Recover the direct-colour inputs without changing the tile decoder API.
    const screen = bus.io[0x2107 + bg - 0x2000], mapBase = ((screen >>> 2) * 0x800) & 0xffff;
    const sx = (x + bus.bgHofs[bg]) & (((screen & 1 ? 64 : 32) * 8) - 1);
    const sy = (y + bus.bgVofs[bg]) & (((screen & 2 ? 64 : 32) * 8) - 1);
    const mapWidth = screen & 1 ? 64 : 32, tx = sx >>> 3, ty = sy >>> 3;
    const at = mapBase + (tx >>> 5) * 0x800 + (ty >>> 5) * (mapWidth >>> 5) * 0x800 + (((ty & 31) * 32 + (tx & 31)) << 1);
    const entry = bus.vram[at & 0xffff] | (bus.vram[(at + 1) & 0xffff] << 8);
    const base = (bus.io[0x210b - 0x2000] & 15) * 0x2000;
    const px = entry & 0x4000 ? 7 - (sx & 7) : sx & 7;
    const py = entry & 0x8000 ? 7 - (sy & 7) : sy & 7;
    const address = base + (entry & 0x3ff) * 64;
    const value = bus.getDecodedTile ? bus.getDecodedTile(address, 8)[py * 8 + px]
      : decodeTilePixel(bus.vram, address, px, py, 8);
    pixel.rgb = directColor(value, (entry >>> 10) & 7);
  }
  return pixel;
}

function composeScreen(bus, objects, x, y, enable, windowRegister, bpps, direct) {
  let top = { rgb: color(bus.cgram, 0), priority: -1, layer: 5, transparent: true };
  const layers = bpps.length + ((bus.io[0x2105 - 0x2000] & 7) === 7 && (bus.io[0x2133 - 0x2000] & 0x40) ? 1 : 0);
  for (let layer = 0; layer < layers; layer++) if ((enable & (1 << layer)) && !windowMasked(bus.io, layer, x, windowRegister)) {
    const pixel = layerPixel(bus, objects, layer, x, y, bpps, direct);
    if (pixel && pixel.priority > top.priority) top = { ...pixel, layer, transparent: false };
  }
  if ((enable & 0x10) && !windowMasked(bus.io, 4, x, windowRegister)) {
    const pixel = layerPixel(bus, objects, 4, x, y, bpps, direct);
    if (pixel && pixel.priority > top.priority) top = { ...pixel, layer: 4, transparent: false };
  }
  return top;
}

function mode1Pixel(bus, bg, x, y) {
  const io = bus.io, bpp = bg === 2 ? 2 : 4;
  const screen = io[0x107 + bg], mapBase = ((screen >>> 2) * 0x800) & 0xffff;
  const mapWidth = screen & 1 ? 64 : 32, mapHeight = screen & 2 ? 64 : 32;
  const sx = (x + bus.bgHofs[bg]) & (mapWidth * 8 - 1);
  const sy = (y + bus.bgVofs[bg]) & (mapHeight * 8 - 1);
  const tileX = sx >>> 3, tileY = sy >>> 3;
  const quadrant = (tileX >>> 5) + (tileY >>> 5) * (mapWidth >>> 5);
  const at = (mapBase + quadrant * 0x800 + (((tileY & 31) * 32 + (tileX & 31)) << 1)) & 0xffff;
  const entry = bus.vram[at] | (bus.vram[(at + 1) & 0xffff] << 8);
  const baseReg = io[bg < 2 ? 0x10b : 0x10c];
  const tileBase = (((bg & 1 ? baseReg >>> 4 : baseReg) & 15) * 0x2000) & 0xffff;
  const px = entry & 0x4000 ? 7 - (sx & 7) : sx & 7;
  const py = entry & 0x8000 ? 7 - (sy & 7) : sy & 7;
  const value = bus.getTilePixel(tileBase + (entry & 0x3ff) * (8 * bpp), bpp, py * 8 + px);
  if (!value) return -1;
  const palette = (entry >>> 10) & 7;
  const colorIndex = (bg === 2 ? palette * 4 : palette * 16) + value;
  const high = !!(entry & 0x2000);
  const priority = bg === 0 ? (high ? 9 : 6) : bg === 1 ? (high ? 8 : 5)
    : high ? (io[0x105] & 8 ? 11 : 3) : 1;
  return (priority << 9) | colorIndex;
}

function mode1Layer(bus, bg, width, height) {
  const io = bus.io, screen = io[0x107 + bg], base = io[bg < 2 ? 0x10b : 0x10c];
  const key = `${bus.tileEpoch}:${screen}:${base}:${bus.bgHofs[bg]}:${bus.bgVofs[bg]}:${io[0x105]}:${width}:${height}`;
  bus.mode1LayerKeys ??= [];
  bus.mode1Layers ??= [];
  if (bus.mode1LayerKeys[bg] === key) return bus.mode1Layers[bg];
  const layer = new Int32Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++)
    layer[y * width + x] = mode1Pixel(bus, bg, x, y);
  bus.mode1LayerKeys[bg] = key; bus.mode1Layers[bg] = layer;
  return layer;
}

function renderObjectsMode1(bus, width, height) {
  const io = bus.io, obsel = io[0x101], tileBase = (obsel & 7) * 0x4000;
  const cacheKey = `${bus.tileEpoch}:${bus.oamRevision}:${obsel}:${width}:${height}`;
  if (bus.objectLayerKey === cacheKey) return bus.objectLayer;
  const sizeTable = [[8,16],[8,32],[8,64],[16,32],[16,64],[32,64],[16,32],[16,32]];
  const layer = new Int32Array(width * height).fill(-1);
  for (let object = 127; object >= 0; object--) {
    const at = object * 4, high = bus.oam[512 + (object >>> 2)] >>> ((object & 3) * 2);
    let ox = bus.oam[at] | ((high & 1) << 8); if (ox >= 256) ox -= 512;
    const oy = bus.oam[at + 1], size = sizeTable[obsel >>> 5][(high >>> 1) & 1];
    const attr = bus.oam[at + 3], priority = [2, 4, 7, 10][(attr >>> 4) & 3];
    for (let py = 0; py < size; py++) {
      const sy = (oy + py) & 0xff; if (sy >= height) continue;
      for (let px = 0; px < size; px++) {
        const sx = ox + px; if (sx < 0 || sx >= width) continue;
        const tx = attr & 0x40 ? size - 1 - px : px, ty = attr & 0x80 ? size - 1 - py : py;
        const tile = bus.oam[at + 2] | ((attr & 1) << 8) | ((tx >>> 3) + (ty >>> 3) * 16);
        const value = bus.getTilePixel(tileBase + tile * 32, 4, (ty & 7) * 8 + (tx & 7));
        if (value) layer[sy * width + sx] = (priority << 9) | 128 + ((attr >>> 1) & 7) * 16 + value;
      }
    }
  }
  bus.objectLayerKey = cacheKey; bus.objectLayer = layer;
  return layer;
}

function renderMode1Fast(bus, width, height) {
  const io = bus.io, rgba = new Uint8ClampedArray(width * height * 4), output = new Uint32Array(rgba.buffer);
  const brightness = io[0x100] & 15;
  if (io[0x100] & 0x80) { output.fill(0xff000000); return rgba; }
  const main = io[0x12c], sub = io[0x12d], math = io[0x131], cgwsel = io[0x130];
  const objects = main & 0x10 ? renderObjectsMode1(bus, width, height) : null;
  const enabled = main | sub;
  const bg0 = enabled & 1 ? mode1Layer(bus, 0, width, height) : null;
  const bg1 = enabled & 2 ? mode1Layer(bus, 1, width, height) : null;
  const bg2 = enabled & 4 ? mode1Layer(bus, 2, width, height) : null;
  const red = new Uint16Array(256), green = new Uint16Array(256), blue = new Uint16Array(256);
  for (let index = 0; index < 256; index++) {
    const value = bus.cgram[index * 2] | (bus.cgram[index * 2 + 1] << 8);
    red[index] = Math.round((value & 31) * 255 / 31);
    green[index] = Math.round(((value >>> 5) & 31) * 255 / 31);
    blue[index] = Math.round(((value >>> 10) & 31) * 255 / 31);
  }
  const useSub = !!(cgwsel & 2), half = !!(math & 0x40), subtract = !!(math & 0x80);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x;
    let top = -1, layer = 5;
    if (main & 1) { const pixel = bg0[index]; if (pixel > top) { top = pixel; layer = 0; } }
    if (main & 2) { const pixel = bg1[index]; if (pixel > top) { top = pixel; layer = 1; } }
    if (main & 4) { const pixel = bg2[index]; if (pixel > top) { top = pixel; layer = 2; } }
    if (objects && objects[index] > top) { top = objects[index]; layer = 4; }
    const colorIndex = top < 0 ? 0 : top & 0x1ff;
    let r = red[colorIndex], g = green[colorIndex], b = blue[colorIndex];
    if (math & (1 << layer)) {
      let second = 0, transparent = true;
      if (useSub) {
        let below = -1;
        if (sub & 1) below = bg0[index];
        if (sub & 2) { const pixel = bg1[index]; if (pixel > below) below = pixel; }
        if (sub & 4) { const pixel = bg2[index]; if (pixel > below) below = pixel; }
        if (below >= 0) { second = below & 0x1ff; transparent = false; }
      }
      const mix = (first, other) => {
        const value = subtract ? first - other : first + other;
        return Math.max(0, Math.min(255, half && (!useSub || !transparent) ? value / 2 : value));
      };
      r = mix(r, red[second]); g = mix(g, green[second]); b = mix(b, blue[second]);
    }
    r = r * brightness / 15; g = g * brightness / 15; b = b * brightness / 15;
    output[index] = 0xff000000 | (b << 16) | (g << 8) | r;
  }
  return rgba;
}

export function renderFrame(bus, width = 256, height = 224) {
  const io = bus.io, rgba = new Uint8ClampedArray(width * height * 4);
  if ((io[0x2105 - 0x2000] & 7) === 1 && !(io[0x212e - 0x2000] | io[0x212f - 0x2000]))
    return renderMode1Fast(bus, width, height);
  const pixels = new Uint32Array(rgba.buffer);
  const brightness = io[0x2100 - 0x2000] & 15;
  if (io[0x2100 - 0x2000] & 0x80) {
    pixels.fill(0xff000000);
    return rgba;
  }
  const mode = io[0x2105 - 0x2000] & 7, bpps = mode === 7 ? [8] : MODE_BPP[mode] ?? [];
  const main = io[0x212c - 0x2000], sub = io[0x212d - 0x2000];
  const cgwsel = io[0x2130 - 0x2000], math = io[0x2131 - 0x2000], half = !!(math & 0x40), subtract = !!(math & 0x80);
  const fixed = fixedColor(bus);
  const objects = (main | sub) & 0x10 ? renderObjects(bus, width, height) : null;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const top = composeScreen(bus, objects, x, y, main, 0x212e, bpps, !!(cgwsel & 1));
    const below = composeScreen(bus, objects, x, y, sub, 0x212f, bpps, !!(cgwsel & 1));
    let rgb = top.rgb;
    const colorWindow = windowInside(io, 5, x);
    const clipMode = cgwsel >>> 6, preventMode = (cgwsel >>> 4) & 3;
    const clip = clipMode === 3 || (clipMode === 1 && !colorWindow) || (clipMode === 2 && colorWindow);
    const prevent = preventMode === 3 || (preventMode === 1 && !colorWindow) || (preventMode === 2 && colorWindow);
    if (clip) rgb = [0, 0, 0];
    if (!prevent && (math & (1 << top.layer))) {
      const second = cgwsel & 2 ? below.rgb : fixed;
      rgb = rgb.map((value, channel) => {
        const mixed = subtract ? value - second[channel] : value + second[channel];
        const useHalf = half && (!(cgwsel & 2) || !below.transparent);
        return Math.max(0, Math.min(255, useHalf ? mixed / 2 : mixed));
      });
    }
    const red = Math.max(0, Math.min(255, rgb[0] * brightness / 15));
    const green = Math.max(0, Math.min(255, rgb[1] * brightness / 15));
    const blue = Math.max(0, Math.min(255, rgb[2] * brightness / 15));
    pixels[y * width + x] = 0xff000000 | (blue << 16) | (green << 8) | red;
  }
  return rgba;
}

// Libretro's SNES reference frames are little-endian RGB565 (Pillow raw mode
// BGR;16). This conversion lets the VM hash exactly the same byte stream.
export function rgbaToRgb565(rgba) {
  const output = new Uint8Array((rgba.length >>> 2) * 2);
  for (let source = 0, target = 0; source < rgba.length; source += 4, target += 2) {
    const word = ((rgba[source] >>> 3) << 11)
      | ((rgba[source + 1] >>> 2) << 5) | (rgba[source + 2] >>> 3);
    output[target] = word & 0xff; output[target + 1] = word >>> 8;
  }
  return output;
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

