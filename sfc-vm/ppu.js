function color(cgram, index) {
  const value = cgram[(index * 2) & 0x1ff] | (cgram[(index * 2 + 1) & 0x1ff] << 8);
  return [value & 31, (value >>> 5) & 31, (value >>> 10) & 31];
}

const expand5 = (value) => Math.round(value * 255 / 31);
const applyBrightness = (value, brightness) => Math.round(value * brightness / 15);

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
  const paletteBase = bpp === 8 ? 0 : bpp === 4 ? palette * 16
    : ((io[0x2105 - 0x2000] & 7) === 0 ? bg * 32 : 0) + palette * 4;
  return { rgb: color(bus.cgram, paletteBase + value), priority: ((entry >>> 13) & 1) * 4 + (3 - bg) };
}

function renderObjects(bus, width, y) {
  const io = bus.io, obsel = io[0x2101 - 0x2000];
  const tileBase = (obsel & 7) * 0x4000;
  const sizeTable = [[8,16],[8,32],[8,64],[16,32],[16,64],[32,64],[16,32],[16,32]];
  const layer = new Int32Array(width).fill(-1);
  for (let object = 127; object >= 0; object--) {
    const at = object * 4, high = bus.oam[512 + (object >>> 2)] >>> ((object & 3) * 2);
    let ox = bus.oam[at] | ((high & 1) << 8); if (ox >= 256) ox -= 512;
    const oy = bus.oam[at + 1], large = (high >>> 1) & 1;
    const size = sizeTable[obsel >>> 5][large];
    const attr = bus.oam[at + 3];
    const py = (y - oy) & 0xff;
    if (py >= size) continue;
    for (let px = 0; px < size; px++) { const sx = ox + px; if (sx < 0 || sx >= width) continue;
      const tx = attr & 0x40 ? size - 1 - px : px, ty = attr & 0x80 ? size - 1 - py : py;
      const tile = (bus.oam[at + 2] + (tx >>> 3) + (ty >>> 3) * 16) & 0xff;
      const nameBase = attr & 1 ? ((((obsel >>> 3) & 3) + 1) * 0x2000) : 0;
      const value = decodeTilePixel(bus.vram, (tileBase + nameBase + tile * 32) & 0xffff, tx & 7, ty & 7, 4);
      if (!value) continue;
      const priority = (attr >>> 4) & 3, palette = 128 + ((attr >>> 1) & 7) * 16 + value;
      layer[sx] = (priority << 9) | palette;
    }
  }
  return layer;
}

function fixedColor(bus) {
  const value = bus.fixedColor;
  return [value & 31, (value >>> 5) & 31, (value >>> 10) & 31];
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
  return [r, g, b];
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

function bgPriority(io, bg, high) {
  const mode = io[0x2105 - 0x2000] & 7;
  if (mode === 1) {
    if (bg === 0) return high ? 10 : 7;
    if (bg === 1) return high ? 9 : 6;
    if (bg === 2) return high ? (io[0x2105 - 0x2000] & 8 ? 12 : 4)
      : (io[0x2105 - 0x2000] & 8 ? 4 : 2);
  }
  return high * 4 + (3 - bg);
}

function objectPriority(io, priority) {
  if ((io[0x2105 - 0x2000] & 7) === 1) return [3, 5, 8, 11][priority];
  return 8 + priority;
}

function layerPixel(bus, objects, bg, x, y, bpps, direct) {
  if (bg === 4) {
    const packed = objects?.[x] ?? -1;
    return packed < 0 ? null : { rgb: color(bus.cgram, packed & 0x1ff), priority: objectPriority(bus.io, packed >>> 9) };
  }
  const sourceY = y + 1;
  // Visible SNES line 0 samples the first post-vblank PPU scanline.  The
  // background mosaic/scroll pipeline is therefore one source row ahead of
  // the zero-based framebuffer coordinate.
  if ((bus.io[0x2105 - 0x2000] & 7) === 7) return mode7Pixel(bus, bg, x, sourceY);
  const pixel = bgPixel(bus, bg, x, sourceY, bpps[bg]);
  if (pixel) pixel.priority = bgPriority(bus.io, bg, pixel.priority >= 4 ? 1 : 0);
  if (pixel && direct && bpps[bg] === 8) {
    // Recover the direct-colour inputs without changing the tile decoder API.
    const screen = bus.io[0x2107 + bg - 0x2000], mapBase = ((screen >>> 2) * 0x800) & 0xffff;
    const sx = (x + bus.bgHofs[bg]) & (((screen & 1 ? 64 : 32) * 8) - 1);
    const sy = (sourceY + bus.bgVofs[bg]) & (((screen & 2 ? 64 : 32) * 8) - 1);
    const mapWidth = screen & 1 ? 64 : 32, tx = sx >>> 3, ty = sy >>> 3;
    const at = mapBase + (tx >>> 5) * 0x800 + (ty >>> 5) * (mapWidth >>> 5) * 0x800 + (((ty & 31) * 32 + (tx & 31)) << 1);
    const entry = bus.vram[at & 0xffff] | (bus.vram[(at + 1) & 0xffff] << 8);
    const base = (bus.io[0x210b - 0x2000] & 15) * 0x2000;
    const value = decodeTilePixel(bus.vram, base + (entry & 0x3ff) * 64, entry & 0x4000 ? 7 - (sx & 7) : sx & 7, entry & 0x8000 ? 7 - (sy & 7) : sy & 7, 8);
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

function renderLines(bus, rgba, width, height, firstY, lastY) {
  const io = bus.io;
  const brightness = io[0x2100 - 0x2000] & 15;
  if (io[0x2100 - 0x2000] & 0x80) {
    for (let y = firstY; y < lastY; y++) for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      rgba[index] = rgba[index + 1] = rgba[index + 2] = 0; rgba[index + 3] = 255;
    }
    return rgba;
  }
  const mode = io[0x2105 - 0x2000] & 7, bpps = mode === 7 ? [8] : MODE_BPP[mode] ?? [];
  const main = io[0x212c - 0x2000], sub = io[0x212d - 0x2000];
  const cgwsel = io[0x2130 - 0x2000], math = io[0x2131 - 0x2000], half = !!(math & 0x40), subtract = !!(math & 0x80);
  const fixed = fixedColor(bus);
  for (let y = firstY; y < lastY; y++) {
    const objects = (main | sub) & 0x10 ? renderObjects(bus, width, y) : null;
    for (let x = 0; x < width; x++) {
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
        const useHalf = half && (!(cgwsel & 2) || !below.transparent);
        const rhs = second[channel];
        const mixed = subtract ? value - rhs : value + rhs;
        const quantified = useHalf ? mixed >> 1 : mixed;
        return Math.max(0, Math.min(31, quantified));
      });
    }
    const out = (y * width + x) * 4;
    rgba[out] = expand5(applyBrightness(rgb[0], brightness));
    rgba[out + 1] = expand5(applyBrightness(rgb[1], brightness));
    rgba[out + 2] = expand5(applyBrightness(rgb[2], brightness)); rgba[out + 3] = 255;
  }
  }
  return rgba;
}

export function renderScanline(bus, rgba, y, width = 256, height = 224) {
  if (y < 0 || y >= height) return rgba;
  return renderLines(bus, rgba, width, height, y, y + 1);
}

export function renderFrame(bus, width = 256, height = 224) {
  return renderLines(bus, new Uint8ClampedArray(width * height * 4), width, height, 0, height);
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
      rgba[output] = expand5(rgb[0]); rgba[output + 1] = expand5(rgb[1]); rgba[output + 2] = expand5(rgb[2]);
      rgba[output + 3] = 255;
    }
  }
  return rgba;
}
