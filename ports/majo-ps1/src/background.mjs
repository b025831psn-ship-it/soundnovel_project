// Picture resources contain a packed TIM. Offsets in the packed stream
// refer to the circular dictionary, including overlapping copies.
export function unpackPicture(packed) {
  let cursor = 0;
  function byte() {
    if (cursor >= packed.length) throw new RangeError("Truncated picture stream");
    return packed[cursor++];
  }
  const high = byte();
  let length = ((high & 127) << 8) | byte();
  if (high & 128) length = (length << 8) | byte();
  const result = new Uint8Array(length);
  const ring = new Uint8Array(4096);
  let pos = 0;
  function emit(value) {
    ring[pos & 4095] = value;
    result[pos++] = value;
  }
  while (pos < length) {
    const flags = byte();
    for (let bit = 1; bit <= 128 && pos < length; bit *= 2) {
      if (flags & bit) {
        emit(byte());
      } else {
        const low = byte();
        const pair = byte();
        const start = low | ((pair & 240) << 4);
        const count = (pair & 15) + 3;
        for (let n = 0; n < count && pos < length; n++) emit(ring[(start + n) & 4095]);
      }
    }
  }
  return result;
}

export function renderBackground(tim) {
  const view = new DataView(tim.buffer, tim.byteOffset, tim.byteLength);
  if (view.getUint32(0, true) !== 16 || view.getUint32(4, true) !== 9) {
    throw new Error("Expected an indexed 8-bit TIM");
  }
  const image = 8 + view.getUint32(8, true);
  const width = 2 * view.getUint16(image + 8, true);
  const height = view.getUint16(image + 10, true);
  if (image < 532 || image + 12 + width * height > tim.length) {
    throw new RangeError("Invalid TIM palette or image dimensions");
  }
  const palette = new Uint16Array(256);
  for (let i = 0; i < 256; i++) {
    const color = view.getUint16(20 + 2 * i, true);
    palette[i] = ((color & 31) << 11) | ((color & 0x3e0) << 1) | ((color >> 10) & 31);
  }
  const pixels = new Uint16Array(width * height);
  for (let i = 0; i < pixels.length; i++) pixels[i] = palette[tim[image + 12 + i]];
  return {width, height, pixels};
}

export function paintFrame(canvas, {width, height, pixels}) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(width, height);
  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i];
    image.data[4*i] = Math.round((color >>> 11) * 255 / 31);
    image.data[4*i+1] = Math.round(((color >>> 5) & 63) * 255 / 63);
    image.data[4*i+2] = Math.round((color & 31) * 255 / 31);
    image.data[4*i+3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}
