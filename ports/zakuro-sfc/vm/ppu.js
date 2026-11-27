import { renderFrame } from './ppu-renderer.js';

export class PPU {
  constructor({ onFrame = null } = {}) {
    this.io = new Uint8Array(0x6000);
    this.vram = new Uint8Array(64 * 1024);
    this.cgram = new Uint8Array(512);
    this.oam = new Uint8Array(544);
    this.vramAddress = this.cgramAddress = this.oamAddress = 0;
    this.vmain = 0;
    this.bgHofs = new Uint16Array(4);
    this.bgVofs = new Uint16Array(4);
    this.ppuScrollLatch = 0;
    this.ppuMode7Latch = 0;
    this.mode7 = new Int16Array(6);
    this.fixedColor = 0;
    this.revision = 0;
    this.renderedRevision = -1;
    this.frame = new Uint8ClampedArray(256 * 224 * 4);
    this.field = -1;
    this.onFrame = onFrame;
    this.modesUsed = new Set();
    this.oamRevision = 0;
    this.tileEpoch = 1;
    this.tileValid2 = new Uint32Array(4096); this.tilePixels2 = new Uint8Array(4096 * 64);
    this.tileValid4 = new Uint32Array(4096); this.tilePixels4 = new Uint8Array(4096 * 64);
    this.tileValid8 = new Uint32Array(4096); this.tilePixels8 = new Uint8Array(4096 * 64);
  }

  write(address, value, master = 0) {
    const register = address & 0xffff, v = value & 0xff;
    if (register < 0x2100 || register > 0x213f) return;
    this.io[register - 0x2000] = v; this.revision++;
    switch (register) {
      case 0x2102: this.oamAddress = (this.oamAddress & 0x100) | v; break;
      case 0x2103: this.oamAddress = ((v & 1) << 8) | (this.oamAddress & 0xff); break;
      case 0x2104:
        this.oam[this.oamAddress % this.oam.length] = v;
        this.oamRevision++;
        this.oamAddress = (this.oamAddress + 1) % this.oam.length;
        break;
      case 0x2105: this.modesUsed.add(v & 7); break;
      case 0x210d: case 0x210f: case 0x2111: case 0x2113: {
        const bg = (register - 0x210d) >>> 1;
        this.bgHofs[bg] = ((v << 8) | this.ppuScrollLatch) & 0x3ff;
        this.ppuScrollLatch = v;
        break;
      }
      case 0x210e: case 0x2110: case 0x2112: case 0x2114: {
        const bg = (register - 0x210e) >>> 1;
        this.bgVofs[bg] = ((v << 8) | this.ppuScrollLatch) & 0x3ff;
        this.ppuScrollLatch = v;
        break;
      }
      case 0x2115: this.vmain = v; break;
      case 0x2116: this.vramAddress = (this.vramAddress & 0xff00) | v; break;
      case 0x2117: this.vramAddress = (v << 8) | (this.vramAddress & 0xff); break;
      case 0x2118:
        this.vram[(this.vramAddress << 1) & 0xffff] = v;
        this.invalidateTiles();
        if (!(this.vmain & 0x80)) this.incrementVram();
        break;
      case 0x2119:
        this.vram[((this.vramAddress << 1) + 1) & 0xffff] = v;
        this.invalidateTiles();
        if (this.vmain & 0x80) this.incrementVram();
        break;
      case 0x211b: case 0x211c: case 0x211d: case 0x211e: case 0x211f: case 0x2120: {
        const index = register - 0x211b;
        this.mode7[index] = (v << 8) | this.ppuMode7Latch;
        this.ppuMode7Latch = v;
        break;
      }
      case 0x2121: this.cgramAddress = v << 1; break;
      case 0x2122:
        this.cgram[this.cgramAddress & 0x1ff] = v;
        this.cgramAddress = (this.cgramAddress + 1) & 0x1ff;
        break;
      case 0x2132:
        if (v & 0x20) this.fixedColor = (this.fixedColor & ~0x001f) | (v & 0x1f);
        if (v & 0x40) this.fixedColor = (this.fixedColor & ~0x03e0) | ((v & 0x1f) << 5);
        if (v & 0x80) this.fixedColor = (this.fixedColor & ~0x7c00) | ((v & 0x1f) << 10);
        break;
    }
    this.lastWriteMaster = master;
  }

  read(address) {
    const register = address & 0xffff;
    if (register === 0x2139) {
      const value = this.vram[(this.vramAddress << 1) & 0xffff];
      if (!(this.vmain & 0x80)) this.incrementVram();
      return value;
    }
    if (register === 0x213a) {
      const value = this.vram[((this.vramAddress << 1) + 1) & 0xffff];
      if (this.vmain & 0x80) this.incrementVram();
      return value;
    }
    return this.io[register - 0x2000] ?? 0;
  }

  incrementVram() {
    this.vramAddress = (this.vramAddress + [1, 32, 128, 128][this.vmain & 3]) & 0xffff;
  }

  invalidateTiles() {
    this.tileEpoch = (this.tileEpoch + 1) >>> 0;
    if (!this.tileEpoch) {
      this.tileValid2.fill(0); this.tileValid4.fill(0); this.tileValid8.fill(0);
      this.tileEpoch = 1;
    }
  }

  getTilePixel(tileAddress, bitsPerPixel, index) {
    const address = tileAddress & 0xffff;
    const key = address >>> 4;
    const valid = bitsPerPixel === 2 ? this.tileValid2 : bitsPerPixel === 4 ? this.tileValid4 : this.tileValid8;
    const pixels = bitsPerPixel === 2 ? this.tilePixels2 : bitsPerPixel === 4 ? this.tilePixels4 : this.tilePixels8;
    const base = key << 6;
    if (valid[key] === this.tileEpoch) return pixels[base + index];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      let pixel = 0;
      for (let plane = 0; plane < bitsPerPixel; plane++) {
        const byte = this.vram[(address + (plane >>> 1) * 16 + y * 2 + (plane & 1)) & 0xffff];
        pixel |= ((byte >>> (7 - x)) & 1) << plane;
      }
      pixels[base + y * 8 + x] = pixel;
    }
    valid[key] = this.tileEpoch;
    return pixels[base + index];
  }

  getDecodedTile(tileAddress, bitsPerPixel) {
    this.getTilePixel(tileAddress, bitsPerPixel, 0);
    const key = (tileAddress & 0xffff) >>> 4;
    const pixels = bitsPerPixel === 2 ? this.tilePixels2 : bitsPerPixel === 4 ? this.tilePixels4 : this.tilePixels8;
    return pixels.subarray(key << 6, (key + 1) << 6);
  }

  presentField(field, master, render = true) {
    this.field = field;
    if (!render) return null;
    if (this.renderedRevision !== this.revision) {
      this.frame = renderFrame(this);
      this.renderedRevision = this.revision;
    }
    this.onFrame?.({ field, master, width: 256, height: 224, rgba: this.frame });
    return this.frame;
  }

  getFrame() { return this.frame; }
}
