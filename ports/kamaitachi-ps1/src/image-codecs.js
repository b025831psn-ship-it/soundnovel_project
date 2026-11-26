const u16 = (b, i) => b[i] | (b[i + 1] << 8);
const u32 = (b, i) => (u16(b, i) | (u16(b, i + 2) << 16)) >>> 0;

export function bgr555(value, transparentZero = false) {
  if (transparentZero && value === 0) return [0, 0, 0, 0];
  const expand = (v) => (v << 3) | (v >> 2);
  return [expand(value & 31), expand((value >> 5) & 31), expand((value >> 10) & 31), 255];
}

export function decodeTim(input, { clutIndex = 0, transparentZero = false, palette = null } = {}) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (u32(b, 0) !== 0x10) throw new Error("not a PlayStation TIM");
  const flags = u32(b, 4), mode = flags & 7, hasClut = (flags & 8) !== 0;
  let p = 8, clut = palette ? Uint16Array.from(palette) : null, clutColors = clut?.length || 0;
  if (hasClut) {
    const size = u32(b, p), width = u16(b, p + 8), height = u16(b, p + 10);
    clutColors = width;
    const count = width * height, colors = new Uint16Array(count);
    for (let i = 0; i < count; i++) colors[i] = u16(b, p + 12 + i * 2);
    clut = colors.subarray(clutIndex * width, (clutIndex + 1) * width);
    p += size;
  }
  const imageSize = u32(b, p), x = u16(b, p + 4), y = u16(b, p + 6);
  const words = u16(b, p + 8), height = u16(b, p + 10), data = b.subarray(p + 12, p + imageSize);
  const width = mode === 0 ? words * 4 : mode === 1 ? words * 2 : mode === 2 ? words : Math.floor(words * 2 / 3);
  if ((mode === 0 || mode === 1) && (!clut || clut.length !== (mode === 0 ? 16 : 256)))
    throw new Error(`TIM ${mode === 0 ? 4 : 8}bpp CLUT is missing`);
  const rgba = new Uint8ClampedArray(width * height * 4);
  const put = (at, color) => rgba.set(bgr555(color, transparentZero), at * 4);
  let source = 0;
  for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
    if (mode === 0) { const packed = data[source + (px >> 1)]; put(py * width + px, clut[(packed >> ((px & 1) * 4)) & 15]);
      if (px === width - 1) source += words * 2; }
    else if (mode === 1) { put(py * width + px, clut[data[source + px]]); if (px === width - 1) source += words * 2; }
    else if (mode === 2) { put(py * width + px, u16(data, source + px * 2)); if (px === width - 1) source += words * 2; }
    else if (mode === 3) { const at = source + px * 3, out = (py * width + px) * 4;
      rgba.set([data[at], data[at + 1], data[at + 2], 255], out); if (px === width - 1) source += words * 2; }
    else throw new Error(`unsupported TIM mode ${mode}`);
  }
  return { x, y, width, height, mode, clutColors, rgba };
}

// Okumura LZSS: N=4096, F=18, THRESHOLD=2, initial cursor N-F (0xfee).
export function decodeLzs(input, expectedSize = null) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  // Retail SDW members are `LZS` followed immediately by the Okumura bit
  // stream.  In particular, bytes 3..7 of resource 0 are df 10 00 00 00:
  // 0xdf is the first flag byte, not an embedded decompressed-size field.
  let p = b[0] === 0x4c && b[1] === 0x5a && b[2] === 0x53 ? 3 : 0;
  const limit = expectedSize ?? Number.MAX_SAFE_INTEGER;
  const ring = new Uint8Array(4096).fill(0x20), output = [];
  let cursor = 0xfee, flags = 0;
  while (p < b.length && output.length < limit) {
    flags >>= 1;
    if ((flags & 0x100) === 0) flags = b[p++] | 0xff00;
    if (flags & 1) {
      if (p >= b.length) break;
      const value = b[p++]; output.push(value); ring[cursor] = value; cursor = (cursor + 1) & 0xfff;
    } else {
      if (p + 1 >= b.length) break;
      const lo = b[p++], hi = b[p++], from = lo | ((hi & 0xf0) << 4), length = (hi & 15) + 3;
      for (let i = 0; i < length && output.length < limit; i++) {
        const value = ring[(from + i) & 0xfff]; output.push(value); ring[cursor] = value; cursor = (cursor + 1) & 0xfff;
      }
    }
  }
  if (expectedSize != null && output.length !== expectedSize)
    throw new Error(`LZS size mismatch: ${output.length} != ${expectedSize}`);
  return Uint8Array.from(output);
}

export function decodeImageMember(bytes, options = {}) {
  if (u32(bytes, 0) === 0x10) return decodeTim(bytes, options);
  if (bytes[0] === 0x4c && bytes[1] === 0x5a && bytes[2] === 0x53)
    return decodeTim(decodeLzs(bytes, options.expectedSize), options);
  if (bytes[2] === 0x69 && bytes[3] === 0x6b && bytes[4] === 0x65 && bytes[5] === 0)
    return options.decodeIke ? decodeTim(options.decodeIke(bytes), options)
      : (() => { throw new Error("ike member requires the verified 0x800356c8 build-time decoder"); })();
  throw new Error("unknown PS1 image member format");
}
