import { MasterClock, inAutoJoypadRead, inVblank, scanlineTiming } from './master-clock.js';

function normalizeRom(bytes) {
  let rom = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if ((rom.length & 0x3ff) === 512) rom = rom.subarray(512);
  if (!rom.length || (rom.length & 0x7fff)) throw new Error(`invalid LoROM length: ${rom.length}`);
  return rom;
}

export class ZakuroBus {
  constructor({ rom = null, program = null, sram = null, masterLink, clock = new MasterClock(), ppu = null, trace = null, wramFill = 0x55, inputFrames = null, inputFrameOffset = 1, onProgramRead = null, onSramWrite = null } = {}) {
    if (!masterLink) throw new TypeError('masterLink is required');
    if (!rom && !program) throw new TypeError('rom or program is required');
    this.rom = rom ? normalizeRom(rom) : null; this.program = program;
    this.onProgramRead = onProgramRead; this.masterLink = masterLink; this.clock = clock;
    this.ppu = ppu; this.trace = trace; this.onNmi = null; this.onDma = null; this.wram = new Uint8Array(128 * 1024);
    // The native reference core powers WRAM on with the Snes9x 0x55 pattern.
    // Zakuro reads untouched $01EC during its first enabled NMI, so this is
    // observable state rather than an interchangeable debugging default.
    this.wram.fill(wramFill & 0xff);
    this.wramWritten = new Uint8Array(128 * 1024);
    const sramExponent = this.rom?.[0x7fd8] ?? 0;
    const headerSram = sramExponent ? {
      size: 1 << (sramExponent + 10), fill: 0x60,
      high: (this.rom[0x7fd7] > 11 || sramExponent > 5) ? 0x7fff : 0xffff,
    } : null;
    const sramConfig = sram ?? program?.sram ?? headerSram;
    const sramSize = sramConfig?.size ?? 0;
    if (!Number.isInteger(sramSize) || sramSize < 0 || (sramSize && (sramSize & (sramSize - 1)))) {
      throw new RangeError('SRAM size must be zero or a power of two');
    }
    const sramFill = sramConfig?.fill ?? 0x60;
    if (!Number.isInteger(sramFill) || sramFill < 0 || sramFill > 0xff) throw new RangeError('invalid SRAM fill');
    this.sram = new Uint8Array(sramSize); this.sram.fill(sramFill);
    this.sramMask = sramSize - 1;
    this.sramHigh = sramConfig?.high ?? (sramSize > 0x10000 ? 0x7fff : 0xffff);
    this.sramRevision = 0; this.sramDirty = false; this.onSramWrite = onSramWrite;
    this.io = new Uint8Array(0x6000); this.fastRom = false; this.accessCount = 0;
    this.nmiFlag = false;
    this.inputFrames = inputFrames; this.pendingJoypad = null;
    this.inputFrameOffset = inputFrameOffset;
    this.joy1 = 0; this.joyStrobe = 0; this.joySerialBit = 0;
    this.wramAddress = 0;
    this.dmaBytes = 0; this.dmaMasterCycles = 0; this.dmaTransfers = 0; this.dmaChannels = 0;
    this.hdmaMask = 0; this.hdmaEvents = [];
  }
  read(address) {
    const a = address & 0xffffff, master = this.clock.charge(a, this.fastRom); this.accessCount++;
    const bank = a >>> 16, offset = a & 0xffff;
    if (bank === 0x7e || bank === 0x7f) return this.wram[a & 0x1ffff];
    if (this.isLoRomSram(bank, offset)) return this.sram[this.loRomSramAddress(a)];
    if ((bank & 0x40) === 0 && offset < 0x2000) return this.wram[offset];
    if ((bank & 0x40) === 0 && offset >= 0x2140 && offset <= 0x2143) {
      const port = offset & 3, value = this.masterLink.read(master, port) & 0xff;
      this.trace?.({ master, dir: 'r', port, value }); return value;
    }
    if ((bank & 0x40) === 0 && offset === 0x2180) {
      const value = this.wram[this.wramAddress];
      this.wramAddress = (this.wramAddress + 1) & 0x1ffff;
      return value;
    }
    if ((bank & 0x40) === 0 && offset >= 0x2100 && offset <= 0x213f && this.ppu) return this.ppu.read?.(offset, master) ?? 0;
    if ((bank & 0x40) === 0 && offset === 0x4210) {
      const value = this.nmiFlag ? 0x80 : 0; this.nmiFlag = false; return value;
    }
    if ((bank & 0x40) === 0 && offset === 0x4212) {
      const timing = scanlineTiming(master);
      const inLine = master - timing.start;
      return (inVblank(master) ? 0x80 : 0) | (inLine < 4 || inLine >= 1096 ? 0x40 : 0)
        | (inAutoJoypadRead(master) ? 0x01 : 0);
    }
    if ((bank & 0x40) === 0 && offset === 0x4016) return this.readJoy1();
    if ((bank & 0x40) === 0 && offset === 0x4017) return 0;
    if ((bank & 0x40) === 0 && offset >= 0x2000 && offset < 0x6000) return this.io[offset];
    if (offset >= 0x8000) return this.readProgram(bank, offset);
    return 0;
  }
  write(address, value) {
    const a = address & 0xffffff, v = value & 0xff, master = this.clock.charge(a, this.fastRom); this.accessCount++;
    const bank = a >>> 16, offset = a & 0xffff;
    if (bank === 0x7e || bank === 0x7f) { const index = a & 0x1ffff; this.wram[index] = v; this.wramWritten[index] = 1; return; }
    if (this.isLoRomSram(bank, offset)) {
      const sramOffset = this.loRomSramAddress(a);
      if (this.sram[sramOffset] !== v) {
        this.sram[sramOffset] = v; this.sramDirty = true; this.sramRevision++;
        this.onSramWrite?.({ offset: sramOffset, value: v, revision: this.sramRevision });
      }
      return;
    }
    if ((bank & 0x40) === 0 && offset < 0x2000) { this.wram[offset] = v; this.wramWritten[offset] = 1; return; }
    if ((bank & 0x40) === 0 && offset >= 0x2140 && offset <= 0x2143) {
      const port = offset & 3; this.masterLink.write(master, port, v);
      this.trace?.({ master, dir: 'w', port, value: v }); return;
    }
    if ((bank & 0x40) === 0 && offset >= 0x2180 && offset <= 0x2183) {
      this.writeWramPort(offset, v); return;
    }
    if ((bank & 0x40) === 0 && offset >= 0x2100 && offset <= 0x213f && this.ppu) { this.ppu.write?.(offset, v, master); return; }
    if ((bank & 0x40) === 0 && offset === 0x4016) {
      this.joyStrobe = v & 1;
      if (this.joyStrobe) this.joySerialBit = 0;
      return;
    }
    if ((bank & 0x40) === 0 && offset >= 0x2000 && offset < 0x6000) {
      const old = this.io[offset];
      this.io[offset] = v; if (offset === 0x420d) this.fastRom = !!(v & 1);
      if (offset === 0x420b && v) this.runDma(v);
      if (offset === 0x420c) { this.hdmaMask = v; this.hdmaEvents.push([master, v]); }
      // NMITIMEN low->high during VBlank triggers NMI if RDNMI has not been read.
      if (offset === 0x4200 && (v & 0x80) && !(old & 0x80) && this.nmiFlag && inVblank(master)) this.onNmi?.();
    }
  }

  setInputField(field) {
    // Native frame F ends at VBlank ordinal F-1 after the initial reset frame.
    this.joy1 = this.pendingJoypad ?? this.inputFrames?.[field + this.inputFrameOffset] ?? 0;
    this.pendingJoypad = null;
    this.io[0x4218] = this.joy1 & 0xff;
    this.io[0x4219] = this.joy1 >>> 8;
    this.joySerialBit = 0;
  }

  isLoRomSram(bank, offset) {
    if (!this.sram.length) return false;
    const sramBank = (bank >= 0x70 && bank <= 0x7d) || bank >= 0xf0;
    return sramBank && offset <= this.sramHigh;
  }

  loRomSramAddress(address) {
    return ((((address & 0xff0000) >>> 1) | (address & 0x7fff)) & this.sramMask);
  }

  exportSram() { return this.sram.slice(); }

  importSram(bytes) {
    const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (data.length !== this.sram.length) throw new RangeError(`SRAM image must be ${this.sram.length} bytes`);
    this.sram.set(data); this.sramDirty = false; this.sramRevision++;
  }

  consumeSramDirty() {
    const dirty = this.sramDirty; this.sramDirty = false; return dirty;
  }

  setJoypad(mask) {
    if (!Number.isInteger(mask) || mask < 0 || mask > 0xffff) throw new RangeError('invalid joypad mask');
    this.pendingJoypad = mask;
  }

  readJoy1() {
    const bit = this.joySerialBit < 16 ? (this.joy1 >>> (15 - this.joySerialBit)) & 1 : 1;
    if (!this.joyStrobe && this.joySerialBit < 16) this.joySerialBit++;
    return bit;
  }

  writeWramPort(offset, value) {
    if (offset === 0x2180) {
      this.wram[this.wramAddress] = value;
      this.wramWritten[this.wramAddress] = 1;
      this.wramAddress = (this.wramAddress + 1) & 0x1ffff;
    } else if (offset === 0x2181) {
      this.wramAddress = (this.wramAddress & 0x1ff00) | value;
    } else if (offset === 0x2182) {
      this.wramAddress = (this.wramAddress & 0x100ff) | (value << 8);
    } else {
      this.wramAddress = (this.wramAddress & 0x0ffff) | ((value & 1) << 16);
    }
  }

  readMapped(address) {
    const a = address & 0xffffff, bank = a >>> 16, offset = a & 0xffff;
    if (bank === 0x7e || bank === 0x7f) return this.wram[a & 0x1ffff];
    if ((bank & 0x40) === 0 && offset < 0x2000) return this.wram[offset];
    if (offset >= 0x8000) return this.readProgram(bank, offset);
    return 0;
  }

  readProgram(bank, offset) {
    const linear = (bank & 0x7f) * 0x8000 + (offset & 0x7fff);
    const mapped = this.rom ? linear % this.rom.length : linear;
    this.onProgramRead?.(mapped);
    return this.rom ? this.rom[mapped] : this.program.read(mapped);
  }

  writeMapped(address, value) {
    const a = address & 0xffffff, bank = a >>> 16, offset = a & 0xffff;
    if (bank === 0x7e || bank === 0x7f) { const index = a & 0x1ffff; this.wram[index] = value; this.wramWritten[index] = 1; }
    else if ((bank & 0x40) === 0 && offset < 0x2000) { this.wram[offset] = value; this.wramWritten[offset] = 1; }
  }

  writeBbus(offset, value) {
    if (offset >= 0x2180 && offset <= 0x2183) this.writeWramPort(offset, value);
    else this.ppu?.write?.(offset, value, this.clock.master);
  }

  readBbus(offset) {
    if (offset === 0x2180) {
      const value = this.wram[this.wramAddress];
      this.wramAddress = (this.wramAddress + 1) & 0x1ffff;
      return value;
    }
    return this.ppu?.read?.(offset, this.clock.master) ?? 0;
  }

  runDma(mask) {
    const startMaster = this.clock.master;
    let channels = 0, bytes = 0;
    for (let channel = 0; channel < 8; channel++) {
      if (!(mask & (1 << channel))) continue;
      channels++;
      const base = 0x4300 + channel * 0x10;
      const size = this.io[base + 5] | (this.io[base + 6] << 8);
      const count = size || 0x10000;
      bytes += count;
      const dmap = this.io[base];
      const mode = dmap & 7;
      const bOffsets = [[0], [0, 1], [0, 0], [0, 0, 1, 1], [0, 1, 2, 3], [0, 1, 0, 1], [0, 0], [0, 0, 1, 1]][mode];
      const bAddress = 0x2100 | this.io[base + 1];
      let aAddress = this.io[base + 2] | (this.io[base + 3] << 8);
      const aBank = this.io[base + 4];
      const step = dmap & 8 ? 0 : (dmap & 0x10 ? -1 : 1);
      for (let index = 0; index < count; index++) {
        const b = bAddress + bOffsets[index % bOffsets.length];
        if (dmap & 0x80) {
          this.writeMapped((aBank << 16) | aAddress, this.readBbus(b));
        } else {
          this.writeBbus(b, this.readMapped((aBank << 16) | aAddress));
        }
        aAddress = (aAddress + step) & 0xffff;
      }
      this.io[base + 2] = aAddress & 0xff;
      this.io[base + 3] = aAddress >>> 8;
      this.io[base + 5] = 0; this.io[base + 6] = 0;
    }
    // S-CPU DMA startup is 18 master cycles, followed by 8 per active channel
    // and 8 per transferred byte (Snes9x DMACPUSync/DMACPUSync2 model).
    const masterCycles = 18 + 8 * (channels + bytes);
    this.dmaBytes += bytes; this.dmaMasterCycles += masterCycles;
    this.dmaTransfers++; this.dmaChannels += channels;
    this.clock.idle(masterCycles);
    this.onDma?.({ startMaster, endMaster: this.clock.master, mask, channels, bytes });
  }
}
