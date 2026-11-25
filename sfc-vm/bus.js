import { loRomOffset, normalizeRom } from './rom.js';
import { MasterLink } from '../ports/kamaitachi-sfc/sound/master-link.js';

export class SfcBus {
  constructor(rom, {
    eventLimit = Infinity, apu = null, masterLink = null,
    apuTraceLimit = Infinity, onApuAccess = null,
  } = {}) {
    this.rom = normalizeRom(rom);
    this.wram = new Uint8Array(128 * 1024);
    // Internal header SRAM size code $03: 2^(3 + 10) = 8 KiB.
    // A fresh cartridge save RAM reads as erased ($FF). The reset path checks
    // and clears all five save blocks; zero-filling here skipped four of those
    // loops and moved the first APUIO transaction ~469k master clocks early.
    this.sram = new Uint8Array(8 * 1024).fill(0xff);
    this.io = new Uint8Array(0x6000);
    // Minimal SPC700 IPL port state. The IPL announces $BBAA and acknowledges
    // each CPU token on port 0; the full SPC700 core will replace this shim.
    this.apuPorts = Uint8Array.from([0xaa, 0xbb, 0x00, 0x00]);
    this.apuInputPorts = new Uint8Array(4);
    this.apuPhase = 'ipl';
    this.vram = new Uint8Array(64 * 1024);
    this.cgram = new Uint8Array(512);
    this.oam = new Uint8Array(544);
    this.vramAddress = this.cgramAddress = this.oamAddress = this.wramAddress = 0;
    this.vmain = 0;
    this.controller1 = 0;
    this.events = [];
    this.eventLimit = eventLimit;
    this.masterLink = masterLink ?? (apu ? new MasterLink(apu) : null);
    this.apuTrace = [];
    this.apuTraceLimit = apuTraceLimit;
    this.onApuAccess = onApuAccess;
    this.apuAccessCount = 0;
    this.dmaStats = {};
    this.pendingDmaMasterCycles = 0;
    this.readStats = {};
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

  recordApuAccess(masterCycle, direction, port, value) {
    const event = { masterCycle, direction, port, value };
    this.lastApuAccess = event;
    if (this.apuTrace.length < this.apuTraceLimit) this.apuTrace.push(event);
    this.apuAccessCount++;
    this.onApuAccess?.(event);
  }

  read8(address, masterCycle = 0) {
    address &= 0xffffff;
    const bank = address >>> 16;
    const word = address & 0xffff;
    if (bank === 0x7e || bank === 0x7f) return this.wram[((bank - 0x7e) << 16) | word];
    if (((bank >= 0x70 && bank <= 0x7d) || bank >= 0xf0) && word < 0x8000)
      return this.sram[word & (this.sram.length - 1)];
    if ((bank & 0x40) === 0 && word < 0x2000) return this.wram[word];
    if ((bank & 0x40) === 0 && word >= 0x2140 && word <= 0x2143) {
      const port = word - 0x2140;
      const value = this.masterLink ? this.masterLink.read(masterCycle, port) : this.apuPorts[port];
      this.recordApuAccess(masterCycle, 'r', port, value);
      return value;
    }
    if ((bank & 0x40) === 0 && word >= 0x2000 && word < 0x8000) {
      const value = this.io[word - 0x2000];
      if (word === 0x4212 || (word >= 0x4218 && word <= 0x421b)) {
        const stat = this.readStats[`0x${word.toString(16)}`] ??= {
          reads: 0, nonzeroReads: 0, last: 0, lastNonzero: 0,
        };
        stat.reads++;
        stat.last = value;
        if (value) {
          stat.nonzeroReads++;
          stat.lastNonzero = value;
        }
      }
      return value;
    }
    const offset = loRomOffset(address, this.rom.length);
    return offset === null ? 0xff : this.rom[offset];
  }

  read16(address) {
    return this.read8(address) | (this.read8((address + 1) & 0xffffff) << 8);
  }

  write8(address, value, masterCycle = 0) {
    address &= 0xffffff;
    value &= 0xff;
    const bank = address >>> 16;
    const word = address & 0xffff;
    this.currentMasterCycle = masterCycle;
    if (bank === 0x7e || bank === 0x7f) this.wram[((bank - 0x7e) << 16) | word] = value;
    else if (((bank >= 0x70 && bank <= 0x7d) || bank >= 0xf0) && word < 0x8000)
      this.sram[word & (this.sram.length - 1)] = value;
    else if ((bank & 0x40) === 0 && word < 0x2000) this.wram[word] = value;
    else if ((bank & 0x40) === 0 && word >= 0x2140 && word <= 0x2143) {
      const port = word - 0x2140;
      if (this.masterLink) {
        this.masterLink.write(masterCycle, port, value);
        this.recordApuAccess(masterCycle, 'w', port, value);
        return;
      }
      this.apuInputPorts[port] = value;
      this.recordApuAccess(masterCycle, 'w', port, value);
      this.recordEvent({ kind: 'apu-write', address: word, value });
      // CPU->APU input and APU->CPU output ports are distinct latches. During
      // IPL upload the SPC echoes the transfer token on port 0. The uploaded
      // driver later acknowledges only commit/toggle writes on that port.
      if (port === 0) this.apuPorts[0] = value;
      // The uploaded winter/Chunsoft driver replaces the IPL handshake with
      // a four-byte identity exchange: CPU "Chun", SPC700 "SOFT".
      if (this.apuPhase === 'ipl' && word === 0x2143 && this.apuInputPorts.every((byte, index) =>
        byte === [0x43, 0x68, 0x75, 0x6e][index])) {
        this.apuPorts.set([0x53, 0x4f, 0x46, 0x54]);
        this.apuPhase = 'driver';
      } else if (this.apuPhase === 'driver' && port === 0 && value === 0)
        this.apuPorts.fill(0);
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
      case 0x420b: this.runDma(value, this.currentMasterCycle ?? 0); break;
    }
  }

  incrementVram() {
    this.vramAddress = (this.vramAddress + [1, 32, 128, 128][this.vmain & 3]) & 0xffff;
  }

  runDma(mask, masterCycle = 0) {
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
      const alignment = 8 - ((masterCycle + this.pendingDmaMasterCycles) & 7);
      this.pendingDmaMasterCycles += alignment + size * 8;
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

  takeDmaMasterCycles() {
    const cycles = this.pendingDmaMasterCycles;
    this.pendingDmaMasterCycles = 0;
    return cycles;
  }
}
