// The picture decompressor 0x800356c8 ("ike" members of BGD/ANM PACs): an LZ77 variant with
// 16-bit little-endian flag words read low bit first (the next word is fetched as soon as the
// last bit of the current one is used). Header: size u16le at +0xb, flags from +0xd.
//   1            literal byte
//   0 0 byte ... 2-byte copy; offset byte-256, or with a 1 bit three more inverted bits
//                (-0x100, -0x400/-0x200/-0x100). byte 0xff + 0 bit: end (0) or no-op (1).
//   0 1 byte ... long copy: offset byte-256 minus a unary-prefixed inverted bit field,
//                length 3..8 unary, 9..16 in 3 bits, or 17 + byte.
// Returns the decoded size from the header (as the original does).
export function ike(m, src, dst) {
  const r8 = (a) => m.read(a, 1);
  const size = r8(src + 0xb) | r8(src + 0xc) << 8;
  let p = src + 0xd, o = dst, mask = 1, flags = r8(p) | r8(p + 1) << 8;
  p += 2;
  const bit = () => {
    const b = flags & mask;
    mask <<= 1;
    if (mask > 0xffff) { flags = r8(p) | r8(p + 1) << 8; p += 2; mask = 1; }
    return b ? 1 : 0;
  };
  const copy = (off, n) => { for (let i = 0; i < n; i++, o++) m.write(o, r8(o + off), 1); };
  for (;;) {
    if (bit()) { m.write(o++, r8(p++), 1); continue; }
    if (!bit()) {
      let off = r8(p++) - 0x100;
      if (!bit()) {
        if (off === -1) { if (!bit()) return size; continue; }
      } else {
        off -= 0x100;
        if (!bit()) off -= 0x400;
        if (!bit()) off -= 0x200;
        if (!bit()) off -= 0x100;
      }
      copy(off, 2);
      continue;
    }
    let off = r8(p++) - 0x100, hi = bit() ? 0 : 0x100;
    if (!bit()) {
      off -= 0x200;
      if (!bit()) {
        hi <<= 1; if (!bit()) hi += 0x100;
        off -= 0x200;
        if (!bit()) {
          hi <<= 1; if (!bit()) hi += 0x100;
          off -= 0x400;
          if (!bit()) { off -= 0x800; hi <<= 1; if (!bit()) hi += 0x100; }
        }
      }
    }
    off -= hi;
    let n;
    if (bit()) n = 3;
    else if (bit()) n = 4;
    else if (bit()) n = 5;
    else if (bit()) n = 6;
    else if (bit()) n = bit() ? 8 : 7;
    else if (bit()) n = r8(p++) + 0x11;
    else { n = bit() ? 0xd : 9; if (bit()) n += 2; if (bit()) n += 1; }
    copy(off, n);
  }
}
