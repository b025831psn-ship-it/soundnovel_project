import { loRomOffset, normalizeRom } from './rom.js';

export class SfcBus {
  constructor(rom, { eventLimit = Infinity } = {}) {
    this.rom = normalizeRom(rom);
    this.wram = new Uint8Array(128 * 1024);
    // Internal header SRAM size code $03: 2^(3 + 10) = 8 KiB.
    this.sram = new Uint8Array(8 * 1024);
    this.io = new Uint8Array(0x6000);
    // Minimal SPC700 IPL port state. The IPL announces $BBAA and acknowledges
    // each CPU token on port 0; the full SPC700 core will replace this shim.
    this.apuPorts = Uint8Array.from([0xaa, 0xbb, 0x00, 0x00]);
    this.vram = new Uint8Array(64 * 1024);
    this.cgram = new Uint8Array(512);
    this.oam = new Uint8Array(544);
    this.vramAddress = this.cgramAddress = this.oamAddress = this.wramAddress = 0;
    this.vmain = 0;
    this.controller1 = 0;
    this.events = [];
    this.eventLimit = eventLimit;
    this.dmaStats = {};
  }

  recordEvent(event) {
    this.lastEvent = event;
    if (this.events.length < this.eventLimit) this.events.push(event);
  }

  setController1(buttons) { this.controller1 = buttons & 0xffff; }

  latchControllers() {
    if (!(this.io[0x4200 - 0x2000] & 1)) return;
    this.io[0x4218 - 0x2000] = this.controller1 & 0xff;
    this.io[0x4219 - 0x2000] = this.controller1 >>> 8;
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
      this.recordEvent({ kind: 'apu-write', address: word, value });
      // The uploaded winter/Chunsoft driver replaces the IPL handshake with
      // a four-byte identity exchange: CPU "Chun", SPC700 "SOFT".
      if (word === 0x2143 && this.apuPorts.every((byte, index) =>
        byte === [0x43, 0x68, 0x75, 0x6e][index]))
        this.apuPorts.set([0x53, 0x4f, 0x46, 0x54]);
    }
    else if ((bank & 0x40) === 0 && word >= 0x2000 && word < 0x8000) {
      this.io[word - 0x2000] = value;
      this.recordEvent({ kind: 'io-write', address, value });
      this.writeIo(word, value);
    }
  }

  writeIo(address, value) {
    switch (address) {
      case 0x2102: this.oamAddress = (this.oamAddress & 0x100) | value; break;
      case 0x2103: this.oamAddress = ((value & 1) << 8) | (this.oamAddress & 0xff); break;
      case 0x2104:
        this.oam[this.oamAddress % this.oam.length] = value;
        this.oamAddress = (this.oamAddress + 1) % this.oam.length;
        break;
      case 0x2115: this.vmain = value; break;
      case 0x2116: this.vramAddress = (this.vramAddress & 0xff00) | value; break;
      case 0x2117: this.vramAddress = (value << 8) | (this.vramAddress & 0xff); break;
      case 0x2118:
        this.vram[(this.vramAddress << 1) & 0xffff] = value;
        if (!(this.vmain & 0x80)) this.incrementVram();
        break;
      case 0x2119:
        this.vram[((this.vramAddress << 1) + 1) & 0xffff] = value;
        if (this.vmain & 0x80) this.incrementVram();
        break;
      case 0x2121: this.cgramAddress = value << 1; break;
      case 0x2122:
        this.cgram[this.cgramAddress & 0x1ff] = value;
        this.cgramAddress = (this.cgramAddress + 1) & 0x1ff;
        break;
      case 0x2180:
        this.wram[this.wramAddress & 0x1ffff] = value;
        this.wramAddress = (this.wramAddress + 1) & 0x1ffff;
        break;
      case 0x2181: this.wramAddress = (this.wramAddress & 0x1ff00) | value; break;
      case 0x2182: this.wramAddress = (this.wramAddress & 0x100ff) | (value << 8); break;
      case 0x2183: this.wramAddress = (this.wramAddress & 0xffff) | ((value & 1) << 16); break;
      case 0x420b: this.runDma(value); break;
    }
  }

  incrementVram() {
    this.vramAddress = (this.vramAddress + [1, 32, 128, 128][this.vmain & 3]) & 0xffff;
  }

  runDma(mask) {
    const patterns = [[0], [0, 1], [0, 0], [0, 0, 1, 1], [0, 1, 2, 3], [0, 1, 0, 1], [0, 0], [0, 0, 1, 1]];
    for (let channel = 0; channel < 8; channel++) {
      if (!(mask & (1 << channel))) continue;
      const base = 0x4300 + channel * 0x10;
      const reg = (at) => this.io[base + at - 0x2000];
      const setReg = (at, value) => { this.io[base + at - 0x2000] = value & 0xff; };
      const dmap = reg(0), bbad = reg(1);
      let source = reg(2) | (reg(3) << 8) | (reg(4) << 16);
      const sourceStart = source;
      let size = reg(5) | (reg(6) << 8);
      if (size === 0) size = 0x10000;
      const pattern = patterns[dmap & 7];
      let nonzeroBytes = 0;
      for (let index = 0; index < size; index++) {
        const bAddress = 0x2100 + ((bbad + pattern[index % pattern.length]) & 0xff);
        if (dmap & 0x80) this.write8(source, this.read8(bAddress));
        else {
          const byte = this.read8(source);
          nonzeroBytes += byte !== 0;
          this.write8(bAddress, byte);
        }
        if (!(dmap & 0x08)) source = (source + (dmap & 0x10 ? -1 : 1)) & 0xffffff;
      }
      setReg(2, source); setReg(3, source >>> 8); setReg(4, source >>> 16);
      setReg(5, 0); setReg(6, 0);
      const key = `0x${(0x2100 + bbad).toString(16)}`;
      const stat = this.dmaStats[key] ??= { transfers: 0, bytes: 0, nonzeroBytes: 0 };
      stat.transfers++;
      stat.bytes += size;
      stat.nonzeroBytes += nonzeroBytes;
      stat.last = { channel, dmap, source: sourceStart, bytes: size };
      this.recordEvent({
        kind: 'dma', channel, dmap, source: sourceStart, bytes: size,
        nonzeroBytes, destination: 0x2100 + bbad,
      });
    }
  }

  write16(address, value) {
    this.write8(address, value);
    this.write8((address + 1) & 0xffffff, value >>> 8);
  }
}
