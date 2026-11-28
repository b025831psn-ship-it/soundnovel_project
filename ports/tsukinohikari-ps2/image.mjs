/** Decode one compressed indexed image within a CFP or menu PAK. */
export function unpack(data) {
  const long = (data[0] & 0x80) !== 0;
  let cursor = long ? 3 : 2;
  const size = long ? (data[0] & 127) * 65536 + data[1] * 256 + data[2]
                    : data[0] * 256 + data[1];
  const out = new Uint8Array(size);
  let written = 0;
  while (written < size) {
    const flags = data[cursor++];
    for (let bit = 0; bit < 8 && written < size; bit++) {
      const first = data[cursor++];
      if (flags & (1 << bit)) {
        out[written++] = first;
      } else {
        const second = data[cursor++];
        const index = first | ((second & 240) << 4);
        const length = (second & 15) + 3;
        let offset = written - ((written - index - 1 & 4095) + 1);
        if (written + length > size) throw new Error("Invalid copy length");
        for (let i = 0; i < length; i++, offset++) {
          out[written++] = offset < 0 ? 0 : out[offset];
        }
      }
      if (cursor > data.length) throw new Error("Truncated compressed image");
    }
  }
  return out;
}

function word(bytes, offset) {
  return bytes[offset] | bytes[offset+1] << 8;
}

export function parts(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const wide = word(bytes, 0);
  const count = word(bytes, 2);
  if (wide > 1) throw new Error("Unknown archive header");
  const offsets = Array.from({length: count}, (_, i) =>
    wide ? view.getUint32(4+i*4, true) : view.getUint16(4+i*2, true));
  offsets.push(bytes.length);
  return offsets.slice(0,-1).map((start, i) => {
    if (start < 4+count*(wide ? 4 : 2) || offsets[i+1] < start) {
      throw new Error("Invalid resource offset");
    }
    return bytes.subarray(start, offsets[i+1]);
  });
}

export function decodeImage(palette, packed) {
  const bytes = unpack(packed);
  const width = word(bytes, 0), height = word(bytes, 2), depth = word(bytes, 4);
  if (![4,8].includes(depth) || word(palette, 0) !== depth ||
      bytes.length !== 6 + Math.ceil(width*height*depth/8)) {
    throw new Error("Indexed image dimensions or palette mismatch");
  }
  const rgba = new Uint8ClampedArray(width*height*4);
  for (let i = 0; i < width*height; i++) {
    let index = depth === 8 ? bytes[6+i] : bytes[6+(i>>1)] >> (i%2*4) & 15;
    if (depth === 8) index = (index & ~24) | (index & 8) << 1 | (index & 16) >> 1;
    const color = 2 + index*4;
    rgba.set(palette.subarray(color, color+3), i*4);
    rgba[i*4+3] = palette[color+3]*255/128;
  }
  return {width, height, rgba};
}
