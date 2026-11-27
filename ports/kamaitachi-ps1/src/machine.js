// The console around the ported game code, for the browser (and Node): 2 MB of RAM with the
// EXE's data sections (a user-extracted asset, no code), the GPU model with DMA2/DMA6, and
// the library services the game reaches but that are not part of the game: libcd (libcd.js,
// from the user's PAC files), VSync and its callback, the pad report, and no-op stand-ins
// for kernel / memory-card / debug-font set-up. The game itself runs as the ported
// generator init() + mainLoop(): each yield is a VSync(0), i.e. one frame.
//   const mc = new Machine({ exeData, pacs, sound });   // sound: a sound-bridge object, or (m) => one (m = the RAM)
//   mc.frame(buttons)  -> one video frame; mc.display() -> { width, height, rgba }
import { Gpu } from "./gpu/gpu.js";
import { LibGpu } from "./gpu/libgpu.js";
import { LibCd } from "./libcd.js";
import { init } from "./init.js";
import { mainLoop } from "./main-loop.js";
import { vsyncCallback } from "./vsync.js";
import { silentSound } from "./sound-bridge.js";

const RAM = 0x200000, VSYNC_COUNT = 0x800785c0, PAD = 0x801d6660;
// The EXE's data: 0x80010000-0x80013f34 (strings, jump tables) and 0x800677e8-0x80079800
// (tables, the first scenario, libraries' data); 0x80013f34-0x800677e8 is code and is not loaded.
export const EXE_DATA = [[0x80010000, 0x80013f34], [0x800677e8, 0x80079800]];


// Library entry points the ported code still calls through ctx.call, served here.
const NOOP = { 0x80053318: "ResetCallback", 0x80062468: "InitCARD", 0x800624b4: "StartCARD", 0x80064b58: "PadStartCom",
  0x80045438: "ChangeClearPad", 0x80047d18: "debug font", 0x80046f08: "FntLoad", 0x80046fa8: "FntOpen", 0x80046ec8: "SetDumpFnt",
  0x800343b0: "STR movie (skipped)", 0x80059708: "libsnd (sound module)" };

export class Machine {
  constructor({ exeData, pacs, sound = null, onError = null }) {
    this.ram = new Uint8Array(RAM); this.dv = new DataView(this.ram.buffer);
    this.scratch = new Uint8Array(0x400);
    for (const { addr, bytes } of exeData) this.ram.set(bytes, addr & (RAM - 1));
    this.gpu = new Gpu(); this.dma = new Uint32Array(0x80 / 4); this.io = new Map();
    const m = { read: (a, w) => this.read(a, w), write: (a, v, w) => this.write(a, v, w), setBytes: (a, b) => this.ram.set(b, a & (RAM - 1)), vsync: () => this.read(VSYNC_COUNT, 4) };
    this.m = m;
    this.gs = new LibGpu(m);
    this.cd = new LibCd({ m, pacs });
    sound = typeof sound === "function" ? sound(m) : sound ?? silentSound(); this.sound = sound; this.callback = null; this.buttons = 0; this.frames = 0; this.card = 1; this.onError = onError;
    this.touch = { menu: null };
    const ctx = { m, sp: 0x801ffff0 - 0x40, gs: this.gs, cd: this.cd, sound, touch: this.touch, call: (a, args, sp) => this.call(a, args, sp), padState: () => 2 };
    this.ctx = ctx;
    this.game = (function* () { yield* init(ctx); yield* mainLoop({ ...ctx, sp: ctx.sp - 0x18 }); })();
    this.started = false; this.error = null;
  }

  call(addr, args = [], sp = 0) {
    addr >>>= 0;
    if (addr in NOOP) return 0;
    if (addr === 0x800533a8) { // VSyncCallback(fn)
      if ((args[0] >>> 0) !== 0x8002d46c) throw new Error(`VSyncCallback 0x${(args[0] >>> 0).toString(16)}: not ported`);
      this.callback = vsyncCallback; return 0;
    }
    if (addr === 0x80066c38) { this.write(args[0], 0xff, 1); this.write(args[1], 0xff, 1); return 1; } // PadInitDirect
    if (addr === 0x800454b8) { this.write(0x80079660, args[0], 4); return 0; }
    if (addr === 0x8004eb00) return 0; // CdSetDebug
    if (addr === 0x80062544 || addr === 0x80062798) return this.cardStart(addr === 0x80062544 ? 1 : 2, args[0]); // _card_info / _card_load
    if (addr === 0x80063748) { // _card_wait: no memory card (as the oracle reports), the command done
      if (args[1]) this.write(args[1], this.read(0x8008ca80, 4), 4);
      if (args[2]) this.write(args[2], this.card, 4);
      this.write(0x8008ca40, 0, 4); return 1;
    }
    throw new Error(`not ported: 0x${addr.toString(16)} (called from the ported code)`);
  }

  // libcard's request state (0x8008ca38 {busy, 0, 0, channel}) and its event slot (0x800649d8),
  // as the library leaves them; the request itself never reaches a card.
  cardStart(kind, chan) {
    const S = 0x8008ca38;
    if (this.read(S, 4)) return 0; // busy: the library prints a message and refuses
    this.write(S, kind, 4); this.write(S + 4, 0, 4); this.write(S + 8, 0, 4); this.write(S + 0xc, chan, 4);
    const n = (this.read(0x8007907c, 4) | 0) + 1;
    if (n < 4) {
      this.write(0x8007907c, n, 4); this.write(0x8008caf0 + 4 * n, kind === 1 ? 0x800625ac : 0x80062800, 4);
      for (let i = 0, p = 0x8008cabc + 16 * n; i < 4; i++, p -= 4) this.write(p, 0, 4);
    }
    return 1;
  }

  // ---- memory and I/O ----
  read(a, w) {
    a >>>= 0;
    const p = a & 0x1fffffff;
    if (p < 0x800000) { const o = p & (RAM - 1); return w === 4 ? this.dv.getUint32(o, true) : w === 2 ? this.dv.getUint16(o, true) : this.ram[o]; }
    if (p >= 0x1f800000 && p < 0x1f800400) { const o = p - 0x1f800000; return w === 4 ? this.scratch[o] | this.scratch[o + 1] << 8 | this.scratch[o + 2] << 16 | this.scratch[o + 3] << 24 : w === 2 ? this.scratch[o] | this.scratch[o + 1] << 8 : this.scratch[o]; }
    return this.ioRead(p, w) >>> 0;
  }
  write(a, v, w) {
    a >>>= 0;
    const p = a & 0x1fffffff;
    if (p < 0x800000) { const o = p & (RAM - 1); if (w === 4) this.dv.setUint32(o, v >>> 0, true); else if (w === 2) this.dv.setUint16(o, v & 0xffff, true); else this.ram[o] = v & 0xff; return; }
    if (p >= 0x1f800000 && p < 0x1f800400) { const o = p - 0x1f800000; for (let i = 0; i < w; i++) this.scratch[o + i] = (v >>> (8 * i)) & 0xff; return; }
    this.ioWrite(p, v, w);
  }
  ioRead(a) {
    if (a === 0x1f801810) return this.gpu.read();
    if (a === 0x1f801814) return this.gpu.stat;
    if (a >= 0x1f801080 && a < 0x1f801100) return this.dma[(a - 0x1f801080) >> 2];
    if (a === 0x1f801070) return 0xffff;
    return this.io.get(a) ?? 0;
  }
  ioWrite(a, v) {
    if (a === 0x1f801810) return this.gpu.gp0(v);
    if (a === 0x1f801814) return this.gpu.gp1(v);
    if (a >= 0x1f801080 && a < 0x1f801100) {
      const r = (a - 0x1f801080) >> 2; this.dma[r] = v >>> 0;
      if (r === 10 && (v & 0x01000000)) this.dma2();
      if (r === 26 && (v & 0x01000000)) this.dma6();
      return;
    }
    this.io.set(a, v >>> 0);
  }
  dma2() {
    const madr = this.dma[8] & 0x1ffffc, bcr = this.dma[9], chcr = this.dma[10], mode = (chcr >> 9) & 3, rd = (x) => this.dv.getUint32(x & (RAM - 1), true);
    if (mode === 2) {
      for (let p = madr, guard = 0; guard++ < 1 << 20;) {
        const h = rd(p), n = h >>> 24;
        for (let i = 1; i <= n; i++) this.gpu.gp0(rd(p + 4 * i));
        if ((h & 0x800000) || (h & 0xffffff) === 0xffffff) break;
        p = h & 0x1ffffc;
      }
    } else {
      const words = (bcr & 0xffff || 0x10000) * (mode === 1 ? ((bcr >>> 16) || 1) : 1);
      if (chcr & 1) for (let i = 0; i < words; i++) this.gpu.gp0(rd(madr + 4 * i));
      else for (let i = 0; i < words; i++) this.dv.setUint32((madr + 4 * i) & (RAM - 1), this.gpu.read(), true);
    }
    this.dma[10] = chcr & ~0x01000000;
  }
  dma6() {
    const madr = this.dma[24] & 0x1ffffc, n = this.dma[25] & 0xffff || 0x10000;
    for (let i = 0; i < n; i++) { const a = madr - 4 * i; this.dv.setUint32(a & (RAM - 1), i === n - 1 ? 0xffffff : (a - 4) & 0x1fffff, true); }
    this.dma[26] &= ~0x11000000;
  }

  // ---- frames ----
  vblank() {
    this.write(VSYNC_COUNT, this.read(VSYNC_COUNT, 4) + 1, 4); this.frames++;
    if (this.callback) this.callback({ ...this.ctx, sp: 0x8000f000 }); // the interrupt runs on the kernel's stack, not the game's
    const v = ~this.buttons & 0xffff; // libpad report: status 0, digital pad, buttons active low
    this.write(PAD, 0, 1); this.write(PAD + 1, 0x41, 1); this.write(PAD + 2, v & 0xff, 1); this.write(PAD + 3, v >> 8, 1);
  }
  // One video frame: the game runs up to its next VSync(0), then the vertical blank.
  frame(buttons = 0) {
    if (this.error) return false;
    this.buttons = buttons;
    try {
      if (!this.started) { this.started = true; this.game.next(); }
      this.vblank();
      this.game.next(0); // VSync(0) returns 0, as on the oracle
    } catch (e) { this.error = e; this.onError?.(e); return false; }
    return true;
  }
  display() { return this.gpu.display(); }
}
