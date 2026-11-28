// PS1 SPU ADPCM ("VAG") block decoder: the format the SPU plays from sound RAM.
// 16-byte blocks: [shift | filter<<4, flags, 14 data bytes = 28 nibble samples].
// Flags bit0 = loop end, bit1 = repeat (jump to loop start), bit2 = loop start.
// Coefficients are the SPU's fixed filter table (/64).
export const FILTERS = [[0, 0], [60, 0], [115, -52], [98, -55], [122, -60]];

// Decodes one block at `offset` into `out` (Int16Array, 28 samples at outOffset).
// `history` is [s1, s2] and is updated in place, as the SPU keeps it per voice.
export function decodeBlock(bytes, offset, out, outOffset, history) {
  const header = bytes[offset];
  const shift = header & 0x0f;
  const filter = Math.min(header >> 4, 4);
  const [f0, f1] = FILTERS[filter];
  let [s1, s2] = history;
  for (let i = 0; i < 28; i++) {
    const byte = bytes[offset + 2 + (i >> 1)];
    let nibble = (i & 1 ? byte >> 4 : byte) & 0x0f;
    if (nibble & 8) nibble -= 16;
    let sample = ((nibble << 12) >> (shift > 12 ? 9 : shift)) + ((s1 * f0 + s2 * f1 + 32) >> 6);
    sample = Math.max(-32768, Math.min(32767, sample));
    out[outOffset + i] = sample;
    s2 = s1; s1 = sample;
  }
  history[0] = s1; history[1] = s2;
  return bytes[offset + 1];
}

// Decodes a whole sample from `offset` until a block with the loop-end flag.
// Returns { pcm, loopStart (sample index or -1), repeats } for offline checks.
export function decodeSample(bytes, offset, maxBlocks = 1 << 16) {
  const blocks = [];
  let loopStart = -1, repeats = false;
  for (let b = 0; b < maxBlocks && offset + 16 <= bytes.length; b++, offset += 16) {
    const flags = bytes[offset + 1];
    blocks.push(offset);
    if (flags & 4 && loopStart < 0) loopStart = b * 28;
    if (flags & 1) { repeats = Boolean(flags & 2); break; }
  }
  const pcm = new Int16Array(blocks.length * 28);
  const history = [0, 0];
  blocks.forEach((at, i) => decodeBlock(bytes, at, pcm, i * 28, history));
  return { pcm, loopStart, repeats, blocks: blocks.length };
}
