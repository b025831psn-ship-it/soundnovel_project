// The silhouette layer (BG1 over the picture): people drawn as tinted shapes that blend into the
// scene. Opcode 29 adds a silhouette picture to the layer's buffer (08001444, up to four at once in
// 02000728), 2E or the fade-in of 09 shows the buffer (08001354), 2C removes them all (0800350C).
//
// 08001084 unpacks silhouette `id` (1000 and up are the same pictures) from the offset tables at
// 08D1E238 (4bpp 240x160 tiles) and 08F2AD98 (16 colors); ids 0x34F-0x39D sit 0x35 lower.
// 08001444 merges it into 020117C8 nibble by nibble: a nonzero pixel replaces the one below.

export function lz10(data, pos) {
  if (data[pos] !== 0x10) throw new Error(`not LZ10 at ${pos}`);
  const size = data[pos + 1] | (data[pos + 2] << 8) | (data[pos + 3] << 16);
  const out = new Uint8Array(size);
  let at = 0;
  pos += 4;
  while (at < size) {
    const flags = data[pos++];
    for (let bit = 7; bit >= 0 && at < size; bit--) {
      if (flags & (1 << bit)) {
        const token = (data[pos] << 8) | data[pos + 1];
        pos += 2;
        const distance = (token & 0xfff) + 1;
        for (let count = (token >> 12) + 3; count > 0 && at < size; count--, at++) out[at] = out[at - distance];
      } else out[at++] = data[pos++];
    }
  }
  return out;
}

// 08001684: ids in the table at 0881F894 are not pictures but animated effects (0200002C = 1,
// drawn by 080085D4). They are not ported yet and leave the layer as it is.
const EFFECT_IDS = new Set([0x3e, 0x7a, 0x135, 0x16e, 0x170, 0x1b8, 0x1d2, 0x231, 0x255, 0x261,
  0x273, 0x2d0, 0x2d5, 0x2e5, 0x321, 0x324, 0x327, 0x32a, 0x32c, 0x32d]);

export const LAYER_BYTES = 0x4b00;
// 080034D0: the tint (020066C5..C7) after power-on and every 2C.
export const DEFAULT_TINT = [5, 0, 15];

export class Silhouettes {
  constructor(pixels, palettes) {
    this.pixels = pixels;
    this.palettes = palettes;
  }

  static async load(assets) {
    const [pixels, palettes] = await Promise.all([
      assets.bin("silhouette/pixels.bin"),
      assets.bin("silhouette/palettes.bin"),
    ]);
    return new Silhouettes(pixels, palettes);
  }

  static index(id) {
    if (id > 999) id -= 1000;
    if (id <= 0x34e) return id;
    if (id <= 0x39d) return id - 0x35;
    return -1;
  }

  // The 4bpp tiles and the 16 raw colors of silhouette `id`, or null.
  picture(id) {
    if (EFFECT_IDS.has(id)) return null;
    const index = Silhouettes.index(id);
    if (index < 0) return null;
    const word = (bytes, at) => bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24);
    const pixelAt = word(this.pixels, 4 * index);
    const paletteAt = word(this.palettes, 4 * index);
    if (pixelAt >= this.pixels.length || this.pixels[pixelAt] !== 0x10) return null;
    const tiles = lz10(this.pixels, pixelAt);
    const raw = paletteAt < this.palettes.length && this.palettes[paletteAt] === 0x10 ? lz10(this.palettes, paletteAt) : new Uint8Array(32);
    const colors = Array.from({ length: 16 }, (_, i) => raw[2 * i] | (raw[2 * i + 1] << 8));
    return { tiles, colors };
  }
}

// 08001444's merge: each nonzero nibble of `tiles` replaces the nibble in `buffer`.
export function mergeSilhouette(buffer, tiles) {
  for (let i = 0; i < LAYER_BYTES && i < tiles.length; i++) {
    const value = tiles[i];
    if (!value) continue;
    let mask = 0;
    if (value & 0xf0) mask |= 0xf0;
    if (value & 0x0f) mask |= 0x0f;
    buffer[i] = (buffer[i] & ~mask) | value;
  }
}

// 080014DC's erase: each nonzero nibble of `tiles` clears the nibble in `buffer`.
export function removeSilhouette(buffer, tiles) {
  for (let i = 0; i < LAYER_BYTES && i < tiles.length; i++) {
    const value = tiles[i];
    if (!value) continue;
    let mask = 0;
    if (value & 0xf0) mask |= 0xf0;
    if (value & 0x0f) mask |= 0x0f;
    buffer[i] &= ~mask;
  }
}

// 08001138 on the layer's palette (080011B0(-1)): each channel times (tint + 1) / 32, a zero tint
// byte giving zero. `tint` is 020066C5..C7: red, green, blue (opcodes 27, 26, 28).
export function tintColor(color, tint) {
  const factor = (value) => (value ? value + 1 : 0);
  const [red, green, blue] = tint.map(factor);
  return (((((color >> 10) & 31) * blue) >> 5) << 10)
    | (((((color >> 5) & 31) * green) >> 5) << 5)
    | (((color & 31) * red) >> 5);
}
