import { loRomOffset, normalizeRom } from './rom.js';

export class SfcBus {
  constructor(rom) {
    this.rom = normalizeRom(rom);
    this.wram = new Uint8Array(128 * 1024);
    // Internal header SRAM size code $03: 2^(3 + 10) = 8 KiB.
    this.sram = new Uint8Array(8 * 1024);
    this.io = new Uint8Array(0x6000);
    this.events = [];
  }

  read8(address) {
    address &= 0xffffff;
    const bank = address >>> 16;
    const word = address & 0xffff;
    if (bank === 0x7e || bank === 0x7f) return this.wram[((bank - 0x7e) << 16) | word];
    if (((bank >= 0x70 && bank <= 0x7d) || bank >= 0xf0) && word < 0x8000)
      return this.sram[word & (this.sram.length - 1)];
    if ((bank & 0x40) === 0 && word < 0x2000) return this.wram[word];
    if ((bank & 0x40) === 0 && word >= 0x2000 && word < 0x8000) return this.io[word - 0x2000];
    const offset = loRomOffset(address, this.rom.length);
    return offset === null ? 0xff : this.rom[offset];
  }

  read16(address) {
    return this.read8(address) | (this.read8((address + 1) & 0xffffff) << 8);
  }

  write8(address, value) {
    address &= 0xffffff;
    value &= 0xff;
    const bank = address >>> 16;
    const word = address & 0xffff;
    if (bank === 0x7e || bank === 0x7f) this.wram[((bank - 0x7e) << 16) | word] = value;
    else if (((bank >= 0x70 && bank <= 0x7d) || bank >= 0xf0) && word < 0x8000)
      this.sram[word & (this.sram.length - 1)] = value;
    else if ((bank & 0x40) === 0 && word < 0x2000) this.wram[word] = value;
    else if ((bank & 0x40) === 0 && word >= 0x2000 && word < 0x8000) {
      this.io[word - 0x2000] = value;
      this.events.push({ kind: 'io-write', address, value });
    }
  }

  write16(address, value) {
    this.write8(address, value);
    this.write8((address + 1) & 0xffffff, value >>> 8);
  }
}
