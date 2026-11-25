import { FRAME_MASTER_CYCLES, MasterClock, SCANLINE_MASTER_CYCLES, VBLANK_START_MASTER } from './master-clock.js';

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
    this.ppu = ppu; this.trace = trace; this.onNmi = null; this.wram = new Uint8Array(128 * 1024);
    this.io = new Uint8Array(0x6000); this.fastRom = false; this.accessCount = 0;
    this.nmiFlag = false;
    this.dmaBytes = 0; this.dmaMasterCycles = 0; this.dmaTransfers = 0; this.dmaChannels = 0;
    this.hdmaMask = 0; this.hdmaEvents = [];
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
      const inFrame = master % FRAME_MASTER_CYCLES, inLine = inFrame % SCANLINE_MASTER_CYCLES;
      const vblank = inFrame >= VBLANK_START_MASTER;
      return (vblank ? 0x80 : 0) | (inLine >= 1096 ? 0x40 : 0);
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
      const old = this.io[offset];
      this.io[offset] = v; if (offset === 0x420d) this.fastRom = !!(v & 1);
      if (offset === 0x420b && v) this.runDma(v);
      if (offset === 0x420c) { this.hdmaMask = v; this.hdmaEvents.push([master, v]); }
      // NMITIMEN low->high during VBlank triggers NMI if RDNMI has not been read.
      if (offset === 0x4200 && (v & 0x80) && !(old & 0x80) && this.nmiFlag) this.onNmi?.();
    }
  }

  runDma(mask) {
    let channels = 0, bytes = 0;
    for (let channel = 0; channel < 8; channel++) {
      if (!(mask & (1 << channel))) continue;
      channels++;
      const base = 0x4300 + channel * 0x10;
      const size = this.io[base + 5] | (this.io[base + 6] << 8);
      bytes += size || 0x10000;
      this.io[base + 5] = 0; this.io[base + 6] = 0;
    }
    // One global startup byte-time, one per active channel, then one per byte.
    const masterCycles = 8 * (1 + channels + bytes);
    this.dmaBytes += bytes; this.dmaMasterCycles += masterCycles;
    this.dmaTransfers++; this.dmaChannels += channels;
    this.clock.idle(masterCycles);
  }
}
