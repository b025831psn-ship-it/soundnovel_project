import { MasterClock } from './master-clock.js';

function normalizeRom(bytes) {
  let rom = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if ((rom.length & 0x3ff) === 512) rom = rom.subarray(512);
  if (!rom.length || (rom.length & 0x7fff)) throw new Error(`invalid LoROM length: ${rom.length}`);
  return rom;
}

export class ZakuroBus {
  constructor({ rom, masterLink, clock = new MasterClock(), ppu = null, trace = null } = {}) {
    if (!masterLink) throw new TypeError('masterLink is required');
    this.rom = normalizeRom(rom); this.masterLink = masterLink; this.clock = clock;
    this.ppu = ppu; this.trace = trace; this.wram = new Uint8Array(128 * 1024);
    this.io = new Uint8Array(0x6000); this.fastRom = false; this.accessCount = 0;
    this.nmiFlag = false;
  }
  read(address) {
    const a = address & 0xffffff, master = this.clock.charge(a, this.fastRom); this.accessCount++;
    const bank = a >>> 16, offset = a & 0xffff;
    if (bank === 0x7e || bank === 0x7f) return this.wram[a & 0x1ffff];
    if ((bank & 0x40) === 0 && offset < 0x2000) return this.wram[offset];
    if ((bank & 0x40) === 0 && offset >= 0x2140 && offset <= 0x2143) {
      const port = offset & 3, value = this.masterLink.read(master, port) & 0xff;
      this.trace?.({ master, dir: 'r', port, value }); return value;
    }
    if ((bank & 0x40) === 0 && offset >= 0x2100 && offset <= 0x213f && this.ppu) return this.ppu.read?.(offset, master) ?? 0;
    if ((bank & 0x40) === 0 && offset === 0x4210) {
      const value = this.nmiFlag ? 0x80 : 0; this.nmiFlag = false; return value;
    }
    if ((bank & 0x40) === 0 && offset === 0x4212) {
      const inFrame = master % 357368, inLine = inFrame % 1364;
      return (inFrame >= 225 * 1364 ? 0x80 : 0) | (inLine >= 1096 ? 0x40 : 0);
    }
    if ((bank & 0x40) === 0 && offset >= 0x2000 && offset < 0x6000) return this.io[offset];
    if (offset >= 0x8000) return this.rom[((bank & 0x7f) * 0x8000 + (offset & 0x7fff)) % this.rom.length];
    return 0;
  }
  write(address, value) {
    const a = address & 0xffffff, v = value & 0xff, master = this.clock.charge(a, this.fastRom); this.accessCount++;
    const bank = a >>> 16, offset = a & 0xffff;
    if (bank === 0x7e || bank === 0x7f) { this.wram[a & 0x1ffff] = v; return; }
    if ((bank & 0x40) === 0 && offset < 0x2000) { this.wram[offset] = v; return; }
    if ((bank & 0x40) === 0 && offset >= 0x2140 && offset <= 0x2143) {
      const port = offset & 3; this.masterLink.write(master, port, v);
      this.trace?.({ master, dir: 'w', port, value: v }); return;
    }
    if ((bank & 0x40) === 0 && offset >= 0x2100 && offset <= 0x213f && this.ppu) { this.ppu.write?.(offset, v, master); return; }
    if ((bank & 0x40) === 0 && offset >= 0x2000 && offset < 0x6000) {
      this.io[offset] = v; if (offset === 0x420d) this.fastRom = !!(v & 1);
    }
  }
}
