export function accessCycles(address, fastRom = false) {
  const a = address & 0xffffff, bank = a >>> 16, offset = a & 0xffff;
  if ((bank & 0x40) === 0 && offset < 0x2000) return 8;
  if ((bank & 0x40) === 0 && offset >= 0x2000 && offset < 0x6000) return 6;
  if (bank === 0x7e || bank === 0x7f) return 8;
  if (offset >= 0x8000 && fastRom && (bank & 0x80)) return 6;
  return 8;
}

export class MasterClock {
  constructor(master = 0) { this.master = master; }
  charge(address, fastRom = false) { this.master += accessCycles(address, fastRom); return this.master; }
  idle(count) {
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('invalid master-cycle count');
    this.master += count;
  }
}
