import { loRomOffset, normalizeRom } from './rom.js';

export class SfcBus {
  constructor(rom) {
    this.rom = normalizeRom(rom);
    this.wram = new Uint8Array(128 * 1024);
    // Internal header SRAM size code $03: 2^(3 + 10) = 8 KiB.
    this.sram = new Uint8Array(8 * 1024);
    this.io = new Uint8Array(0x6000);
    // Minimal SPC700 IPL port state. The IPL announces $BBAA and acknowledges
    // each CPU token on port 0; the full SPC700 core will replace this shim.
    this.apuPorts = Uint8Array.from([0xaa, 0xbb, 0x00, 0x00]);
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
    if ((bank & 0x40) === 0 && word >= 0x2140 && word <= 0x2143)
      return this.apuPorts[word - 0x2140];
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
    else if ((bank & 0x40) === 0 && word >= 0x2140 && word <= 0x2143) {
      this.apuPorts[word - 0x2140] = value;
      this.events.push({ kind: 'apu-write', address: word, value });
      // The uploaded winter/Chunsoft driver replaces the IPL handshake with
      // a four-byte identity exchange: CPU "Chun", SPC700 "SOFT".
      if (word === 0x2143 && this.apuPorts.every((byte, index) =>
        byte === [0x43, 0x68, 0x75, 0x6e][index]))
        this.apuPorts.set([0x53, 0x4f, 0x46, 0x54]);
    }
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
