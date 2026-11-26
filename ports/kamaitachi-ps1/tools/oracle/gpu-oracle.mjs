// Verification oracle for the screen code: runs the game's own routines (from the user's
// local EXE) on the R3000A interpreter with the GPU (src/gpu/gpu.js) and DMA2/DMA6 wired
// in. Every GP0/GP1 word is logged, so a JS port can be compared with the original
// command for command, and VRAM afterwards.
import { Mips, hex } from "./mips.js";
import { Gpu } from "../../src/gpu/gpu.js";

export class GpuOracle {
  constructor(exe, { gpu = new Gpu() } = {}) {
    this.cpu = new Mips();
    this.cpu.loadExe(exe);
    this.cpu.r[29] = 0x801ffff0 | 0; this.cpu.r[28] = 0x8007913c | 0;
    this.gpu = gpu; this.log = [];
    this.dma = new Uint32Array(0x80 / 4); this.ioMem = new Map(); this.ticks = 0;
    this.cpu.io = { read: (a, w) => this.ioRead(a, w), write: (a, v, w) => this.ioWrite(a, v, w) };
    for (const v of [0xa0, 0xb0, 0xc0]) this.cpu.hooks.set(v, (c) => { c.r[2] = v === 0xb0 && c.r[9] === 0x08 ? 0xf1000004 | 0 : v === 0xb0 && (c.r[9] === 0x0b || c.r[9] === 0x0c) ? 1 : 0; c.ret(); });
  }
  call(addr, args = []) { return this.cpu.call(addr, args.map((x) => x | 0)); }
  gp0(v) { this.log.push(["gp0", v >>> 0]); this.gpu.gp0(v); }
  gp1(v) { this.log.push(["gp1", v >>> 0]); this.gpu.gp1(v); }
  ioRead(a, w) {
    if (a === 0x1f801810) return this.gpu.read();
    if (a === 0x1f801814) return this.gpu.stat;
    if (a >= 0x1f801080 && a < 0x1f801100) return this.dma[(a - 0x1f801080) >> 2];
    if (a >= 0x1f801100 && a < 0x1f801130) { // root counters: keep moving so polling loops end
      if ((a & 0xf) === 0) return (this.cpu.steps >>> 6) & 0xffff; // advances with executed instructions
      return this.ioMem.get(a) ?? 0;
    }
    if (a === 0x1f801070) return 0xffff; // I_STAT: every interrupt pending (VSync waits end at once)
    return this.ioMem.get(a) ?? 0;
  }
  ioWrite(a, v, w) {
    if (a === 0x1f801810) return this.gp0(v);
    if (a === 0x1f801814) return this.gp1(v);
    if (a >= 0x1f801080 && a < 0x1f801100) {
      const r = (a - 0x1f801080) >> 2; this.dma[r] = v >>> 0;
      if (r === 2 * 4 + 2 && (v & 0x01000000)) this.dma2();
      if (r === 6 * 4 + 2 && (v & 0x01000000)) this.dma6();
      return;
    }
    this.ioMem.set(a, v >>> 0);
  }
  dma2() {
    const madr = this.dma[8] & 0x1ffffc, bcr = this.dma[9], chcr = this.dma[10], mode = (chcr >> 9) & 3;
    const rd = (x) => this.cpu.read(0x80000000 | x, 4);
    if (mode === 2) { // linked list
      let p = madr, guard = 0;
      while (guard++ < 1 << 20) {
        const h = rd(p), n = h >>> 24;
        for (let i = 1; i <= n; i++) this.gp0(rd(p + 4 * i));
        if ((h & 0x800000) || (h & 0xffffff) === 0xffffff) break;
        p = h & 0x1ffffc;
      }
    } else {
      const words = (bcr & 0xffff || 0x10000) * (mode === 1 ? ((bcr >>> 16) || 1) : 1);
      if (chcr & 1) for (let i = 0; i < words; i++) this.gp0(rd(madr + 4 * i));
      else for (let i = 0; i < words; i++) this.cpu.write(0x80000000 | (madr + 4 * i), this.gpu.read(), 4);
    }
    this.dma[10] = chcr & ~0x01000000;
  }
  dma6() { // ordering-table clear: entries point backwards, the first one ends the list
    const madr = this.dma[24] & 0x1ffffc, n = this.dma[25] & 0xffff || 0x10000;
    for (let i = 0; i < n; i++) { const a = madr - 4 * i; this.cpu.write(0x80000000 | a, i === n - 1 ? 0xffffff : (a - 4) & 0x1fffff, 4); }
    this.dma[26] &= ~0x11000000;
  }
}
export { hex };
