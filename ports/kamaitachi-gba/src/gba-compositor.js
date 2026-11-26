const BG_SIZE = [[256, 256], [512, 256], [256, 512], [512, 512]];
const OBJ_SIZE = [
  [[8, 8], [16, 16], [32, 32], [64, 64]],
  [[16, 8], [32, 8], [32, 16], [64, 32]],
  [[8, 16], [8, 32], [16, 32], [32, 64]],
];

const u16 = (bytes, at) => bytes[at] | (bytes[at + 1] << 8);
const rgb = (color) => [color & 31, (color >> 5) & 31, (color >> 10) & 31];

function textBgPixel(vram, palette, control, scrollX, scrollY, x, y, index) {
  const [width, height] = BG_SIZE[control >> 14];
  x = (x + scrollX) & (width - 1);
  y = (y + scrollY) & (height - 1);
  const blockX = x >> 8, blockY = y >> 8;
  const blocksWide = width >> 8;
  const screenBlock = ((control >> 8) & 31) + blockY * blocksWide + blockX;
  const map = screenBlock * 0x800 + (((y & 255) >> 3) * 32 + ((x & 255) >> 3)) * 2;
  const entry = u16(vram, map);
  let px = x & 7, py = y & 7;
  if (entry & 0x400) px = 7 - px;
  if (entry & 0x800) py = 7 - py;
  const tile = entry & 0x3ff;
  const character = ((control >> 2) & 3) * 0x4000;
  let color;
  if (control & 0x80) color = vram[character + tile * 64 + py * 8 + px];
  else {
    const packed = vram[character + tile * 32 + py * 4 + (px >> 1)];
    color = ((packed >> ((px & 1) * 4)) & 15) + ((entry >> 12) * 16);
  }
  if ((color & (control & 0x80 ? 255 : 15)) === 0) return null;
  return { color: u16(palette, color * 2), priority: control & 3, kind: index, order: index };
}

function objPixel(vram, palette, oam, dispcnt, x, y) {
  let best = null;
  for (let index = 0; index < 128; index++) {
    const at = index * 8, a0 = u16(oam, at), a1 = u16(oam, at + 2), a2 = u16(oam, at + 4);
    const affine = !!(a0 & 0x100);
    if (!affine && (a0 & 0x200)) continue;
    const mode = (a0 >> 10) & 3;
    if (mode === 2 || affine) continue; // OBJ windows/affine are not used by this checkpoint.
    const shape = a0 >> 14;
    if (shape === 3) continue;
    const [width, height] = OBJ_SIZE[shape][a1 >> 14];
    let sx = a1 & 0x1ff, sy = a0 & 255;
    if (sx >= 256) sx -= 512;
    if (sy >= 160) sy -= 256;
    let px = x - sx, py = y - sy;
    if (px < 0 || py < 0 || px >= width || py >= height) continue;
    if (a1 & 0x1000) px = width - 1 - px;
    if (a1 & 0x2000) py = height - 1 - py;
    const eight = !!(a0 & 0x2000);
    const tileX = px >> 3, tileY = py >> 3;
    const unit = eight ? 2 : 1;
    const row = dispcnt & 0x40 ? (width >> 3) * unit : 32;
    const tile = ((a2 & 0x3ff) + tileY * row + tileX * unit) & 0x3ff;
    const address = 0x10000 + tile * 32 + (py & 7) * (eight ? 8 : 4) + ((px & 7) >> (eight ? 0 : 1));
    const packed = vram[address];
    const color = eight ? packed : (packed >> ((px & 1) * 4)) & 15;
    if (!color) continue;
    const paletteIndex = eight ? 256 + color : 256 + (a2 >> 12) * 16 + color;
    const candidate = { color: u16(palette, paletteIndex * 2), priority: (a2 >> 10) & 3,
      kind: 4, order: index, semi: mode === 1 };
    if (!best || candidate.priority < best.priority ||
        (candidate.priority === best.priority && index < best.order)) best = candidate;
  }
  return best;
}

function above(a, b) {
  if (a.priority !== b.priority) return a.priority - b.priority;
  if (a.kind === 4 && b.kind !== 4) return -1;
  if (b.kind === 4 && a.kind !== 4) return 1;
  return a.kind - b.kind;
}

function blend(top, bottom, bldcnt, bldalpha, bldy) {
  const effect = (bldcnt >> 6) & 3;
  const first = top.kind === 4 ? 4 : top.kind;
  const second = bottom.kind === 4 ? 4 : bottom.kind;
  const firstTarget = !!(bldcnt & (1 << first));
  const secondTarget = !!(bldcnt & (1 << (8 + second)));
  const a = Math.min(16, bldalpha & 31), b = Math.min(16, (bldalpha >> 8) & 31);
  const y = Math.min(16, bldy & 31), tc = rgb(top.color), bc = rgb(bottom.color);
  if ((top.semi || (effect === 1 && firstTarget)) && secondTarget)
    return tc.map((channel, i) => Math.min(31, (channel * a + bc[i] * b) >> 4));
  if (firstTarget && effect === 2) return tc.map((channel) => channel + (((31 - channel) * y) >> 4));
  if (firstTarget && effect === 3) return tc.map((channel) => channel - ((channel * y) >> 4));
  return tc;
}

export function composeGbaFrame({ vram, palette, oam = new Uint8Array(1024), dispcnt,
  bgcnt = [0, 0, 0, 0], bghofs = [0, 0, 0, 0], bgvofs = [0, 0, 0, 0],
  bldcnt = 0, bldalpha = 0, bldy = 0 }) {
  const output = new Uint8Array(240 * 160 * 3);
  for (let y = 0; y < 160; y++) for (let x = 0; x < 240; x++) {
    const layers = [];
    for (let bg = 0; bg < 4; bg++) if (dispcnt & (0x100 << bg)) {
      const pixel = textBgPixel(vram, palette, bgcnt[bg], bghofs[bg], bgvofs[bg], x, y, bg);
      if (pixel) layers.push(pixel);
    }
    if (dispcnt & 0x1000) {
      const pixel = objPixel(vram, palette, oam, dispcnt, x, y);
      if (pixel) layers.push(pixel);
    }
    layers.push({ color: u16(palette, 0), priority: 4, kind: 5, order: 0 });
    layers.sort(above);
    const color = layers.length === 1 ? rgb(layers[0].color) :
      blend(layers[0], layers[1], bldcnt, bldalpha, bldy);
    const at = 3 * (y * 240 + x);
    for (let channel = 0; channel < 3; channel++) output[at + channel] =
      (color[channel] << 3) | (color[channel] >> 2);
  }
  return output;
}
