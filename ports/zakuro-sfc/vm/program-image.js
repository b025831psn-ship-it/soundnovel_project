// Sparse LoROM image used by the ROM-free browser build. Ranges use linear
// headerless ROM offsets and may be supplied as Uint8Array data or by a loader.
export class ProgramImage {
  constructor(ranges) {
    this.ranges = ranges.map(range => ({ ...range, end: range.offset + range.length }));
  }

  static async load(manifest, loadRange) {
    const ranges = [];
    for (const range of manifest.ranges) {
      const data = await loadRange(range);
      if (data.length !== range.length) throw new Error(`bad program range ${range.file}`);
      ranges.push({ ...range, data });
    }
    return new ProgramImage(ranges);
  }

  read(offset) {
    const range = this.ranges.find(item => offset >= item.offset && offset < item.end);
    if (!range) throw new RangeError(`unmapped program byte 0x${offset.toString(16)}`);
    return range.data[offset - range.offset];
  }
}
