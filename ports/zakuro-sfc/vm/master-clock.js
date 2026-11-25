export const SCANLINE_MASTER_CYCLES = 1364;
export const FRAME_MASTER_CYCLES = 357368;
export const VBLANK_START_MASTER = 225 * SCANLINE_MASTER_CYCLES;
export const SHORT_FIELD_MASTER_CYCLES = FRAME_MASTER_CYCLES - 4;
const FIELD_PAIR_MASTER_CYCLES = FRAME_MASTER_CYCLES + SHORT_FIELD_MASTER_CYCLES;

export function vblankBoundary(index) {
  const pair = Math.floor(index / 2);
  return VBLANK_START_MASTER + pair * FIELD_PAIR_MASTER_CYCLES + (index & 1 ? FRAME_MASTER_CYCLES : 0);
}

export function vblankOrdinal(master) {
  if (master < VBLANK_START_MASTER) return -1;
  const pair = Math.floor((master - VBLANK_START_MASTER) / FIELD_PAIR_MASTER_CYCLES);
  return master >= vblankBoundary(pair * 2 + 1) ? pair * 2 + 1 : pair * 2;
}

export function inVblank(master) {
  const index = vblankOrdinal(master);
  if (index < 0) return false;
  const fieldLength = index & 1 ? SHORT_FIELD_MASTER_CYCLES : FRAME_MASTER_CYCLES;
  return master - vblankBoundary(index) >= 0 && master - vblankBoundary(index) < fieldLength - VBLANK_START_MASTER;
}

export function inAutoJoypadRead(master) {
  const index = vblankOrdinal(master);
  return index >= 0 && master - vblankBoundary(index) < 3 * SCANLINE_MASTER_CYCLES;
}
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
  constructor(master = 0, { refresh = false } = {}) { this.master = master; this.refresh = refresh; }
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
