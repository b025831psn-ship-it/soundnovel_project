// A virtual PlayStation memory card: the raw 128 KB image (16 blocks of 64 frames of 128
// bytes), laid out as a real card is, so an image can be exported to or imported from an
// emulator's .mcr / .mcd file.
//   block 0: frame 0 "MC" header, frames 1-15 the directory (one entry per data block),
//            frames 16-35 the broken-frame list, frame 63 a copy of the header
//   blocks 1-15: file data (8 KB each); a file is a chain of directory entries
//            (0x51 first, 0x52 middle, 0x53 last; 0xa0 free, 0xa1-0xa3 deleted)
// Only what the BIOS file calls do (open / create / read / write / erase / format) is modelled.
export const CARD_BYTES = 0x20000;
const FRAME = 128, BLOCK = 0x2000;

const checksum = (b, o) => { let x = 0; for (let i = 0; i < FRAME - 1; i++) x ^= b[o + i]; b[o + FRAME - 1] = x; };

export class MemoryCard {
  constructor(bytes = null) {
    this.bytes = new Uint8Array(CARD_BYTES);
    if (bytes && bytes.length >= CARD_BYTES) this.bytes.set(bytes.subarray(0, CARD_BYTES));
    else this.format();
  }
  formatted() { return this.bytes[0] === 0x4d && this.bytes[1] === 0x43; } // "MC"
  format() { // what the BIOS format writes
    const b = this.bytes; b.fill(0);
    b[0] = 0x4d; b[1] = 0x43; checksum(b, 0);
    for (let i = 1; i < 16; i++) { const o = i * FRAME; b[o] = 0xa0; b[o + 8] = 0xff; b[o + 9] = 0xff; checksum(b, o); }
    for (let i = 16; i < 36; i++) { const o = i * FRAME; b.fill(0, o, o + FRAME); for (let k = 0; k < 4; k++) b[o + k] = 0xff; b[o + 8] = 0xff; b[o + 9] = 0xff; checksum(b, o); }
    b.copyWithin(63 * FRAME, 0, FRAME);
  }
  entry(i) { const o = i * FRAME, b = this.bytes; return { o, state: b[o], next: b[o + 8] | b[o + 9] << 8, name: this.nameAt(o + 0xa) }; }
  nameAt(o) { let s = ""; for (let i = 0; i < 21 && this.bytes[o + i]; i++) s += String.fromCharCode(this.bytes[o + i]); return s; }
  // The blocks of a file, first to last (1-15), or null when there is no such file.
  chain(name) {
    for (let i = 1; i < 16; i++) {
      const e = this.entry(i);
      if (e.state !== 0x51 || e.name !== name) continue;
      const out = [i];
      for (let n = e.next; n !== 0xffff && out.length < 15; n = this.entry(n + 1).next) out.push(n + 1);
      return out;
    }
    return null;
  }
  files() { const out = []; for (let i = 1; i < 16; i++) { const e = this.entry(i); if (e.state === 0x51) out.push(e.name); } return out; }
  free() { const out = []; for (let i = 1; i < 16; i++) if ((this.entry(i).state & 0xf0) === 0xa0) out.push(i); return out; }
  // open(name, create | blocks << 16): 0 made, 6 already there, 7 no room
  create(name, blocks) {
    if (this.chain(name)) return 6;
    const free = this.free(); blocks = Math.max(1, blocks);
    if (free.length < blocks) return 7;
    const b = this.bytes, use = free.slice(0, blocks);
    use.forEach((blk, k) => {
      const o = blk * FRAME; b.fill(0, o, o + FRAME);
      b[o] = k === 0 ? 0x51 : k === blocks - 1 ? 0x53 : 0x52;
      if (blocks === 1) b[o] = 0x51;
      if (k === 0) { const size = blocks * BLOCK; b[o + 4] = size & 0xff; b[o + 5] = size >> 8 & 0xff; b[o + 6] = size >> 16 & 0xff; }
      const next = k + 1 < blocks ? use[k + 1] - 1 : 0xffff; b[o + 8] = next & 0xff; b[o + 9] = next >> 8;
      if (k === 0) for (let i = 0; i < name.length && i < 20; i++) b[o + 0xa + i] = name.charCodeAt(i);
      checksum(b, o);
      b.fill(0, blk * BLOCK, (blk + 1) * BLOCK);
    });
    return 0;
  }
  erase(name) { // the BIOS marks the chain deleted (0xa1-0xa3); the data stays
    const c = this.chain(name); if (!c) return 5;
    for (const blk of c) { const o = blk * FRAME; this.bytes[o] = (this.bytes[o] & 0x0f) | 0xa0; checksum(this.bytes, o); }
    return 0;
  }
  // Bytes [offset, offset + n) of a file, read through its block chain; null when absent.
  read(name, offset, n) {
    const c = this.chain(name); if (!c) return null;
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const p = offset + i, blk = c[Math.floor(p / BLOCK)]; if (blk === undefined) return out.subarray(0, i); out[i] = this.bytes[blk * BLOCK + (p % BLOCK)]; }
    return out;
  }
  write(name, offset, data) {
    const c = this.chain(name); if (!c) return false;
    for (let i = 0; i < data.length; i++) { const p = offset + i, blk = c[Math.floor(p / BLOCK)]; if (blk === undefined) return false; this.bytes[blk * BLOCK + (p % BLOCK)] = data[i]; }
    return true;
  }
}
