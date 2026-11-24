export const SOURCE_WIDTH = 240;
export const SOURCE_HEIGHT = 160;
export const OUTPUT_WIDTH = 600;
export const OUTPUT_HEIGHT = 400;

function darker(data, candidates) {
  let chosen = candidates[0];
  let luminance = Infinity;
  for (const pixel of candidates) {
    const at = pixel * 4;
    const next = data[at] + data[at + 1] + data[at + 2];
    if (next < luminance) {
      chosen = pixel;
      luminance = next;
    }
  }
  return chosen;
}

export function upscaleHandheld25x(source, width = SOURCE_WIDTH, height = SOURCE_HEIGHT) {
  if (width % 2 || height % 2) throw new RangeError("handheld-2.5x requires even dimensions");
  if (source.length !== width * height * 4) throw new RangeError("source must be tightly packed RGBA");
  const outputWidth = width * 5 / 2;
  const outputHeight = height * 5 / 2;
  const output = new Uint8ClampedArray(outputWidth * outputHeight * 4);
  for (let y = 0; y < outputHeight; y++) {
    const blockY = Math.floor(y / 5) * 2;
    const dy = y % 5;
    for (let x = 0; x < outputWidth; x++) {
      const blockX = Math.floor(x / 5) * 2;
      const dx = x % 5;
      const a = blockY * width + blockX;
      const b = a + 1;
      const c = a + width;
      const d = c + 1;
      let pixel;
      if (dx === 2 && dy === 2) pixel = darker(source, [a, b, c, d]);
      else if (dx === 2) pixel = darker(source, dy < 2 ? [a, b] : [c, d]);
      else if (dy === 2) pixel = darker(source, dx < 2 ? [a, c] : [b, d]);
      else pixel = dy < 2 ? (dx < 2 ? a : b) : (dx < 2 ? c : d);
      const from = pixel * 4;
      const to = (y * outputWidth + x) * 4;
      output[to] = source[from];
      output[to + 1] = source[from + 1];
      output[to + 2] = source[from + 2];
      output[to + 3] = source[from + 3];
    }
  }
  return { data: output, width: outputWidth, height: outputHeight };
}
