export const SCANLINE_MASTER_CYCLES = 1364;
export const FRAME_MASTER_CYCLES = 357368;
export const VBLANK_START_MASTER = 225 * SCANLINE_MASTER_CYCLES;
export function accessCycles(address, fastRom = false) {
  const a = address & 0xffffff, bank = a >>> 16, offset = a & 0xffff;
  if ((bank & 0x40) === 0 && offset < 0x2000) return 8;
  if ((bank & 0x40) === 0 && offset >= 0x2000 && offset < 0x4000) return 6;
  if ((bank & 0x40) === 0 && offset >= 0x4000 && offset < 0x4200) return 12;
  if ((bank & 0x40) === 0 && offset >= 0x4200 && offset < 0x6000) return 6;
  if (bank === 0x7e || bank === 0x7f) return 8;
  if (offset >= 0x8000 && fastRom && (bank & 0x80)) return 6;
  return 8;
}

export class MasterClock {
  constructor(master = 0, { refresh = true } = {}) { this.master = master; this.refresh = refresh; }
  advance(count) {
    let target = this.master + count;
    if (this.refresh) {
      // S-CPU DRAM refresh steals 40 master clocks once per 1364-clock scanline,
      // starting at H=538. A steal can move the endpoint past another boundary.
      for (;;) {
        const next = 538 + (Math.floor((this.master - 538) / 1364) + 1) * 1364;
        if (next > target) break;
        target += 40; this.master = next;
      }
    }
    this.master = target;
    return this.master;
  }
  charge(address, fastRom = false) { return this.advance(accessCycles(address, fastRom)); }
  idle(count) {
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('invalid master-cycle count');
    this.advance(count);
  }
}
