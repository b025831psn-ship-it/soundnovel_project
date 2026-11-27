// PS1 memory as the sound library sees it: 2 MB main RAM (library globals, voice
// records and the loaded VAB head/SEQ live at their original addresses), the SPU
// register block at 0x1f801c00 and DMA channel 4. The library port reads and writes
// through lb/lbu/lh/lhu/lw/sb/sh/sw exactly like the original code does.
import { Spu } from "../spu.js";

const RAM_SIZE = 0x200000;

export class PsxMem {
  constructor(spu = new Spu()) {
    this.ram = new Uint8Array(RAM_SIZE);
    this.dv = new DataView(this.ram.buffer);
    this.spu = spu;
    this.dma = new Uint32Array(0x80 / 4);
    this.io = new Map();
    this.sp = 0x801ffff0 | 0; // stack for structs the library builds on its stack
    this.onSpuWrite = null;
  }
  read(a, w) {
    const p = a & 0x1fffffff;
    if (p < 0x800000) { const o = p & (RAM_SIZE - 1); return w === 4 ? this.dv.getUint32(o, true) : w === 2 ? this.dv.getUint16(o, true) : this.ram[o]; }
    if (p >= 0x1f801c00 && p < 0x1f802000) {
      const o = p - 0x1f801c00;
      if (w === 4) return (this.spu.read16(o) | (this.spu.read16(o + 2) << 16)) >>> 0;
      const v = this.spu.read16(o & ~1); return w === 1 ? (o & 1 ? v >> 8 : v & 0xff) : v;
    }
    if (p >= 0x1f801080 && p < 0x1f801100) return this.dma[(p - 0x1f801080) >> 2];
    return this.io.get(p) ?? 0;
  }
  write(a, v, w) {
    const p = a & 0x1fffffff;
    if (p < 0x800000) { const o = p & (RAM_SIZE - 1); if (w === 4) this.dv.setUint32(o, v >>> 0, true); else if (w === 2) this.dv.setUint16(o, v & 0xffff, true); else this.ram[o] = v & 0xff; return; }
    if (p >= 0x1f801c00 && p < 0x1f802000) {
      const o = p - 0x1f801c00;
      if (w === 4) { this.spuW(o, v & 0xffff); this.spuW(o + 2, v >>> 16); } else this.spuW(o, v & 0xffff);
      return;
    }
    if (p >= 0x1f801080 && p < 0x1f801100) {
      const r = (p - 0x1f801080) >> 2; this.dma[r] = v >>> 0;
      if (r === 18 && (v & 0x01000000)) this.dma4();
      return;
    }
    this.io.set(p, v >>> 0);
  }
  spuW(o, v) { this.onSpuWrite?.(o, v); this.spu.write16(o, v); }
  // DMA4 (SPU) completes at once.
  dma4() {
    const madr = this.dma[16] & 0x1ffffc, bcr = this.dma[17], chcr = this.dma[18];
    const words = (bcr & 0xffff || 0x10000) * ((bcr >>> 16) || 1);
    if (chcr & 1) this.spu.dmaWrite(this.ram.subarray(madr, madr + words * 4));
    else this.ram.set(this.spu.dmaRead(words * 4), madr);
    this.dma[18] = chcr & ~0x01000000;
    const dicr = this.dma[0x74 >> 2]; if (dicr & (1 << 20)) this.dma[0x74 >> 2] = dicr | (1 << 28);
  }
  setBytes(a, bytes) { this.ram.set(bytes, a & (RAM_SIZE - 1)); }
}

// Accessors shared by every library object: `this.m` is a PsxMem (or the oracle CPU,
// which has the same read/write). Signed loads return JS ints like the MIPS registers.
export const Access = {
  lb(a) { return this.m.read(a, 1) << 24 >> 24; },
  lbu(a) { return this.m.read(a, 1); },
  lh(a) { return this.m.read(a, 2) << 16 >> 16; },
  lhu(a) { return this.m.read(a, 2); },
  lw(a) { return this.m.read(a, 4) | 0; },
  sb(a, v) { this.m.write(a, v & 0xff, 1); },
  sh(a, v) { this.m.write(a, v & 0xffff, 2); },
  sw(a, v) { this.m.write(a, v | 0, 4); },
};

export const s8 = (x) => x << 24 >> 24;
export const s16 = (x) => x << 16 >> 16;
export const u16 = (x) => x & 0xffff;
export const u8 = (x) => x & 0xff;
// MIPS div/divu (C semantics; the compiler guards /0 with break, which never fires here).
export const div = (a, b) => (b === 0 ? (a >= 0 ? -1 : 1) : (a === -0x80000000 && b === -1) ? a : Math.trunc(a / b) | 0);
export const rem = (a, b) => (b === 0 ? a : (a % b) | 0);
export const divu = (a, b) => (b === 0 ? -1 : Math.floor((a >>> 0) / (b >>> 0)) | 0);
export const remu = (a, b) => (b === 0 ? a | 0 : ((a >>> 0) % (b >>> 0)) | 0);
export const mul = (a, b) => Math.imul(a, b);
