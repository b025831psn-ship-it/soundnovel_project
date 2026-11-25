// Sparse LoROM image used by the ROM-free browser build. Ranges use linear
// headerless ROM offsets and may be supplied as Uint8Array data or by a loader.
export class ProgramImage {
  constructor(ranges, { sram = null } = {}) {
    const size = 4 * 1024 * 1024;
    this.bytes = new Uint8Array(size);
    this.mapped = new Uint8Array(size);
    for (const range of ranges) {
      if (range.offset < 0 || range.offset + range.length > size || range.data.length !== range.length) {
        throw new RangeError(`invalid program range at 0x${range.offset.toString(16)}`);
      }
      this.bytes.set(range.data, range.offset);
      this.mapped.fill(1, range.offset, range.offset + range.length);
    }
    this.sram = sram;
  }

  static async load(manifest, loadRange) {
    const ranges = [];
    for (const range of manifest.ranges) {
      const data = await loadRange(range);
      if (data.length !== range.length) throw new Error(`bad program range ${range.file}`);
      ranges.push({ ...range, data });
    }
    return new ProgramImage(ranges, { sram: manifest.sram ?? null });
  }

  read(offset) {
    if (offset < 0 || offset >= this.bytes.length || !this.mapped[offset]) {
      throw new RangeError(`unmapped program byte 0x${offset.toString(16)}`);
    }
    return this.bytes[offset];
  }
}
