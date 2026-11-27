import { loRomOffset, normalizeRom } from './rom.js';
import { MasterLink } from '../ports/kamaitachi-sfc/sound/master-link.js';

export class SfcBus {
  constructor(rom, {
    eventLimit = 0, apu = null, masterLink = null,
    apuTraceLimit = 0, onApuAccess = null, onNmiEnable = null,
    onIrqConfig = null, onIrqAcknowledge = null,
    wramInitialValue = 0,
  } = {}) {
    this.rom = normalizeRom(rom);
    this.wram = new Uint8Array(128 * 1024).fill(wramInitialValue & 0xff);
    // Internal header SRAM size code $03: 2^(3 + 10) = 8 KiB.
    // Match the Snes9x reference probe's fresh-SRAM pattern.  The game XORs
    // three save blocks into scheduler countdown $03D7; using $FF here made
    // that counter wrap at frame 98 instead of following the native schedule.
    this.sram = new Uint8Array(8 * 1024).fill(0x60);
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
    this.vramReadBuffer = 0;
    this.bgHofs = new Uint16Array(4);
    this.bgVofs = new Uint16Array(4);
    this.ppuScrollLatch = 0;
    this.ppuMode7Latch = 0;
    this.mode7 = new Int16Array(6);
    this.fixedColor = 0;
    this.controller1 = 0;
    this.events = [];
    this.eventLimit = eventLimit;
    this.masterLink = masterLink ?? (apu ? new MasterLink(apu) : null);
    this.apuTrace = [];
    this.apuTraceLimit = apuTraceLimit;
    this.onApuAccess = onApuAccess;
    this.onNmiEnable = onNmiEnable;
    this.onIrqConfig = onIrqConfig;
    this.onIrqAcknowledge = onIrqAcknowledge;
    this.apuAccessCount = 0;
    this.dmaStats = {};
    this.pendingDmaMasterCycles = 0;
    this.hdmaActive = 0;
    this.hdma = Array.from({ length: 8 }, () => ({ table: 0, indirect: 0, lines: 0, repeat: false, transfer: false }));
    this.pendingMath = null;
    this.readStats = {};
    this.ppuRevision = 0;
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

  latchNmi() { this.io[0x4210 - 0x2000] |= 0x80; }

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
      this.finishMath(masterCycle);
      if (word === 0x2139 || word === 0x213a) return this.readVramPort(word === 0x213a);
      const value = word === 0x4210
        ? (this.io[word - 0x2000] & 0x80) | 0x42
        : this.io[word - 0x2000];
      if (word === 0x4210) this.io[word - 0x2000] &= 0x7f;
      if (word === 0x4211) { this.io[word - 0x2000] &= 0x7f; this.onIrqAcknowledge?.(); }
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
        // This is a CPU-bus trace. Record the store before advancing/delivering
        // anything on the SPC side; APU consumption may happen later at an
        // opcode-specific port-read point.
        this.recordApuAccess(masterCycle, 'w', port, value);
        this.masterLink.write(masterCycle, port, value);
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
      const previous = this.io[word - 0x2000];
      this.io[word - 0x2000] = value;
      if (word >= 0x2100 && word <= 0x2133) this.ppuRevision++;
      this.recordEvent({ kind: 'io-write', address, value });
      if (word === 0x4200 && !(previous & 0x80) && (value & 0x80))
        this.onNmiEnable?.(masterCycle);
      if (word === 0x4200 || (word >= 0x4207 && word <= 0x420a)) this.onIrqConfig?.(masterCycle);
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
      case 0x210d: case 0x210f: case 0x2111: case 0x2113: {
        const bg = (address - 0x210d) >>> 1;
        this.bgHofs[bg] = ((value << 8) | this.ppuScrollLatch) & 0x3ff;
        this.ppuScrollLatch = value;
        break;
      }
      case 0x210e: case 0x2110: case 0x2112: case 0x2114: {
        const bg = (address - 0x210e) >>> 1;
        this.bgVofs[bg] = ((value << 8) | this.ppuScrollLatch) & 0x3ff;
        this.ppuScrollLatch = value;
        break;
      }
      case 0x2115: this.vmain = value; break;
      case 0x211b: case 0x211c: case 0x211d: case 0x211e:
      case 0x211f: case 0x2120: {
        const register = address - 0x211b;
        this.mode7[register] = (value << 8) | this.ppuMode7Latch;
        this.ppuMode7Latch = value;
        break;
      }
      case 0x2116: this.vramAddress = (this.vramAddress & 0xff00) | value; break;
      case 0x2117:
        this.vramAddress = (value << 8) | (this.vramAddress & 0xff);
        this.prefetchVram();
        break;
      case 0x2118:
        this.vram[(this.vramWordAddress() << 1) & 0xffff] = value;
        if (!(this.vmain & 0x80)) this.incrementVram();
        break;
      case 0x2119:
        this.vram[((this.vramWordAddress() << 1) + 1) & 0xffff] = value;
        if (this.vmain & 0x80) this.incrementVram();
        break;
      case 0x2121: this.cgramAddress = value << 1; break;
      case 0x2122:
        this.cgram[this.cgramAddress & 0x1ff] = value;
        this.cgramAddress = (this.cgramAddress + 1) & 0x1ff;
        break;
      case 0x2132:
        if (value & 0x20) this.fixedColor = (this.fixedColor & ~0x001f) | (value & 0x1f);
        if (value & 0x40) this.fixedColor = (this.fixedColor & ~0x03e0) | ((value & 0x1f) << 5);
        if (value & 0x80) this.fixedColor = (this.fixedColor & ~0x7c00) | ((value & 0x1f) << 10);
        break;
      case 0x2180:
        this.wram[this.wramAddress & 0x1ffff] = value;
        this.wramAddress = (this.wramAddress + 1) & 0x1ffff;
        break;
      case 0x2181: this.wramAddress = (this.wramAddress & 0x1ff00) | value; break;
      case 0x2182: this.wramAddress = (this.wramAddress & 0x100ff) | (value << 8); break;
      case 0x2183: this.wramAddress = (this.wramAddress & 0xffff) | ((value & 1) << 16); break;
      case 0x420b: this.runDma(value, this.currentMasterCycle ?? 0); break;
      case 0x4203: {
        const product = this.io[0x4202 - 0x2000] * value;
        this.pendingMath = { ready: (this.currentMasterCycle ?? 0) + 48, product };
        break;
      }
      case 0x4206: {
        const dividend = this.io[0x4204 - 0x2000] | (this.io[0x4205 - 0x2000] << 8);
        this.pendingMath = { ready: (this.currentMasterCycle ?? 0) + 96,
          quotient: value ? Math.floor(dividend / value) : 0xffff,
          remainder: value ? dividend % value : dividend };
        break;
      }
    }
  }

  finishMath(masterCycle) {
    if (!this.pendingMath || masterCycle < this.pendingMath.ready) return;
    if (this.pendingMath.product !== undefined) {
      this.io[0x4216 - 0x2000] = this.pendingMath.product & 0xff;
      this.io[0x4217 - 0x2000] = this.pendingMath.product >>> 8;
    } else {
      const { quotient, remainder } = this.pendingMath;
      this.io[0x4214 - 0x2000] = quotient & 0xff;
      this.io[0x4215 - 0x2000] = quotient >>> 8;
      this.io[0x4216 - 0x2000] = remainder & 0xff;
      this.io[0x4217 - 0x2000] = remainder >>> 8;
    }
    this.pendingMath = null;
  }

  incrementVram() {
    this.vramAddress = (this.vramAddress + [1, 32, 128, 128][this.vmain & 3]) & 0xffff;
  }

  vramWordAddress() {
    const address = this.vramAddress, mode = (this.vmain >>> 2) & 3;
    if (mode === 1)
      return (address & 0xff00) | ((address & 0x001f) << 3) | ((address >>> 5) & 7);
    if (mode === 2)
      return (address & 0xfe00) | ((address & 0x003f) << 3) | ((address >>> 6) & 7);
    if (mode === 3)
      return (address & 0xfc00) | ((address & 0x007f) << 3) | ((address >>> 7) & 7);
    return address;
  }

  prefetchVram() {
    const byteAddress = (this.vramWordAddress() << 1) & 0xffff;
    this.vramReadBuffer = this.vram[byteAddress] | (this.vram[(byteAddress + 1) & 0xffff] << 8);
  }

  readVramPort(high) {
    const value = high ? this.vramReadBuffer >>> 8 : this.vramReadBuffer & 0xff;
    if (!!(this.vmain & 0x80) === high) {
      this.incrementVram();
      this.prefetchVram();
    }
    return value;
  }

  runDma(mask, masterCycle = 0) {
    const patterns = [[0], [0, 1], [0, 0], [0, 0, 1, 1], [0, 1, 2, 3], [0, 1, 0, 1], [0, 0], [0, 0, 1, 1]];
    // Snes9x models the console's CPU/DMA synchronization as a fixed 18
    // master clocks, followed by 8 clocks of setup for each selected channel.
    // The previous bus-alignment approximation undercounted every short DMA.
    if (mask) this.pendingDmaMasterCycles += 18;
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
      this.pendingDmaMasterCycles += 8 + size * 8;
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

  readHdmaByte(address) {
    return this.read8(address & 0xffffff, this.currentMasterCycle ?? 0);
  }

  loadHdmaLine(channel) {
    const base = 0x4300 + channel * 0x10, state = this.hdma[channel];
    const bank = this.io[base + 4 - 0x2000];
    const descriptor = this.readHdmaByte((bank << 16) | state.table++);
    let cycles = 8;
    if (!descriptor) { this.hdmaActive &= ~(1 << channel); state.transfer = false; return cycles; }
    state.lines = descriptor === 0x80 ? 128 : descriptor & 0x7f;
    state.repeat = !(descriptor & 0x80);
    state.transfer = true;
    if (this.io[base - 0x2000] & 0x40) {
      state.indirect = this.readHdmaByte((bank << 16) | state.table)
        | (this.readHdmaByte((bank << 16) | ((state.table + 1) & 0xffff)) << 8);
      state.table = (state.table + 2) & 0xffff;
      cycles += 16;
    }
    this.io[base + 8 - 0x2000] = state.table & 0xff;
    this.io[base + 9 - 0x2000] = state.table >>> 8;
    this.io[base + 0x0a - 0x2000] = descriptor;
    return cycles;
  }

  initHdma(masterCycle = 0) {
    this.currentMasterCycle = masterCycle;
    this.hdmaActive = this.io[0x420c - 0x2000];
    let cycles = this.hdmaActive ? 18 : 0;
    for (let channel = 0; channel < 8; channel++) if (this.hdmaActive & (1 << channel)) {
      const base = 0x4300 + channel * 0x10, state = this.hdma[channel];
      state.table = this.io[base + 2 - 0x2000] | (this.io[base + 3 - 0x2000] << 8);
      cycles += this.loadHdmaLine(channel);
    }
    return cycles;
  }

  runHdmaLine(masterCycle = 0) {
    this.currentMasterCycle = masterCycle;
    if (!this.hdmaActive) return 0;
    const patterns = [[0], [0, 1], [0, 0], [0, 0, 1, 1], [0, 1, 2, 3], [0, 1, 0, 1], [0, 0], [0, 0, 1, 1]];
    let cycles = 18;
    for (let channel = 0; channel < 8; channel++) if (this.hdmaActive & (1 << channel)) {
      const base = 0x4300 + channel * 0x10, dmap = this.io[base - 0x2000];
      const state = this.hdma[channel], pattern = patterns[dmap & 7];
      if (state.transfer) {
        const bank = dmap & 0x40 ? this.io[base + 7 - 0x2000] : this.io[base + 4 - 0x2000];
        let source = dmap & 0x40 ? state.indirect : state.table;
        for (let index = 0; index < pattern.length; index++) {
          const address = (bank << 16) | source;
          const ppu = 0x2100 + ((this.io[base + 1 - 0x2000] + pattern[index]) & 0xff);
          if (dmap & 0x80) this.write8(address, this.read8(ppu, masterCycle), masterCycle);
          else this.write8(ppu, this.readHdmaByte(address), masterCycle);
          source = (source + 1) & 0xffff;
          cycles += 8;
        }
        if (dmap & 0x40) state.indirect = source; else state.table = source;
      }
      state.transfer = !state.repeat;
      state.lines--;
      if (!state.lines) cycles += this.loadHdmaLine(channel);
      else cycles += 8;
      this.io[base + 8 - 0x2000] = state.table & 0xff;
      this.io[base + 9 - 0x2000] = state.table >>> 8;
      this.io[base + 0x0a - 0x2000] = (state.repeat ? 0 : 0x80) | (state.lines & 0x7f);
    }
    return cycles;
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
