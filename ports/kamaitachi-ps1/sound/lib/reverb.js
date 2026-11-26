// libsnd/libspu reverb, and the SPU transfer primitive the work-area clear uses.
// Port of SLPS_017.94 0x8005a5a8 (SsUtSetReverbDepth), 0x8005a638 (SsUtSetReverbType),
// 0x8005a6e8 (SsUtSetReverbFeedback), 0x8005a728/0x8005a748 (SsUtReverbOff/On),
// 0x800603b8 (SpuSetReverb), 0x80060508, 0x80060598 (SpuSetReverbModeParam), 0x80060a78,
// 0x80060ff8 (SpuClearReverbWorkArea), 0x8005f154, 0x8005edec (_spu_t), 0x8005f2d0/0x8005f2f8,
// 0x80061198 (WaitEvent, a BIOS call).
import { s16 } from "./mem.js";
import { SPU_REGS, SPU_ADDR_SHIFT } from "./spuvoice.js";

export const REV_ATTR = 0x8009daa0; // SpuReverbAttr libsnd keeps: mask, mode, depth L/R, delay, feedback
export const REV_ON = 0x80078844, REV_RESERVED = 0x80078848, REV_START = 0x8007884c, REV_MODE = 0x80078854;
export const REV_DEPTH = 0x80078858, REV_DELAY = 0x8007885c, REV_FEEDBACK = 0x80078860;
export const REV_WORK = 0x80078d20; // work-area start per mode (8-byte units)
export const REV_PRESET = 0x80078d70; // 68-byte register preset per mode
export const MALLOC_TABLE = 0x80078d18;
const XFER_ADDR = 0x80078cc8, XFER_DIR = 0x80078d00, XFER_BUF = 0x80078d04, XFER_BLOCKS = 0x80078d08;
const DMA_MADR = 0x80078cb4, DMA_BCR = 0x80078cb8, DMA_CHCR = 0x80078cbc, DMA_DPCR = 0x80078cc4;
const XFER_MODE = 0x80078ccc, XFER_CALLBACK = 0x80078ce8, XFER_EVENT = 0x80078838, ZERO_BUF = 0x8007889c;

const by127 = (x) => Math.trunc(x / 127);

export const Reverb = {
  // 0x8005a5a8 SsUtSetReverbDepth(l, r)
  SsUtSetReverbDepth(l, r) {
    this.sw(REV_ATTR, 6);
    this.sh(REV_ATTR + 8, by127(Math.imul(s16(l), 0x7fff)));
    this.sh(REV_ATTR + 0xa, by127(Math.imul(s16(r), 0x7fff)));
    return this.SpuSetReverbModeParam(REV_ATTR);
  },

  // 0x8005a638 SsUtSetReverbType(type): a negative type sets the mode without clearing.
  SsUtSetReverbType(type) {
    let neg = 0, v = type;
    if (s16(type) < 0) { neg = 1; v = -type; }
    if ((v & 0xffff) >= 10) return -1;
    this.sw(REV_ATTR, 1);
    this.sw(REV_ATTR + 4, s16(neg ? v | 0x100 : v));
    const t = s16(v);
    if (t === 0) this.SpuSetReverb(0);
    this.SpuSetReverbModeParam(REV_ATTR);
    return t;
  },

  // 0x8005a6e8 SsUtSetReverbFeedback(fb)
  SsUtSetReverbFeedback(fb) {
    this.sw(REV_ATTR + 0x10, s16(fb)); this.sw(REV_ATTR, 0x10);
    return this.SpuSetReverbModeParam(REV_ATTR);
  },
  SsUtReverbOff() { return this.SpuSetReverb(0); }, // 0x8005a728
  SsUtReverbOn() { return this.SpuSetReverb(1); }, // 0x8005a748

  // 0x8005f154: store an SPU address (shifted to register units unless raw is 0) at idx.
  spuRegAddr(idx, value, shifted) {
    const regs = this.lw(SPU_REGS);
    this.sh(regs + idx * 2, shifted ? value >>> this.lw(SPU_ADDR_SHIFT) : value);
  },

  // 0x800603b8 SpuSetReverb(on): refuses to switch on while a malloc block overlaps the work area.
  SpuSetReverb(on) {
    const r = this.lw(SPU_REGS) + 0x1aa;
    const off = () => { this.sw(REV_ON, 0); this.sh(r, this.lhu(r) & 0xff7f); };
    if (on === 0) off();
    else if (on === 1) {
      if (this.lw(REV_RESERVED) !== 1 && this.spuReverbOverlap(this.lw(REV_START)) !== 0) off();
      else { this.sw(REV_ON, on); this.sh(r, this.lhu(r) | 0x80); }
    }
    return this.lw(REV_ON);
  },

  // 0x80060508: 1 if any SpuMalloc block lies at or after addr (8-byte units).
  spuReverbOverlap(addr) {
    const a = (addr << this.lw(SPU_ADDR_SHIFT)) >>> 0;
    let e = this.lw(MALLOC_TABLE);
    if (e === 0) return 0;
    for (;; e = (e + 8) | 0) {
      const w = this.lw(e);
      if (w & 0x80000000) continue;
      if (w & 0x40000000) return 0;
      const start = (w & 0x0fffffff) >>> 0;
      if (!(start < a)) return 1;
      if (a < ((start + this.lw(e + 4)) >>> 0)) return 1;
    }
  },

  // 0x80060598 SpuSetReverbModeParam(attr): mask 1 mode (0x100 = also clear the work area),
  // 2/4 depth, 8 delay, 0x10 feedback (delay and feedback only for modes 7 and 8).
  SpuSetReverbModeParam(attr) {
    const sp = (this.m.sp = (this.m.sp - 0x88) | 0), buf = sp + 0x10;
    const done = (v) => { this.m.sp = (sp + 0x88) | 0; return v; };
    let wasOn = 0, modeSet = 0, delaySet = 0, fbSet = 0;
    this.sw(sp + 0x58, 0);
    const mask = this.lw(attr), all = mask === 0;
    this.sw(buf, 0);
    const preset = () => { const src = REV_PRESET + this.lw(REV_MODE) * 68; for (let i = 0; i < 68; i++) this.sb(buf + i, this.lbu(src + i)); };
    if (all || mask & 1) {
      let mode = this.lw(attr + 4);
      if (mode & 0x100) { mode &= ~0x100; this.sw(sp + 0x58, 1); }
      if ((mode >>> 0) >= 10) return done(-1);
      modeSet = 1;
      if (this.spuReverbOverlap(this.lw(REV_WORK + mode * 4)) !== 0) return done(-1);
      this.sw(REV_MODE, mode);
      this.sw(REV_START, this.lw(REV_WORK + this.lw(REV_MODE) * 4));
      preset();
      const m = this.lw(REV_MODE);
      if (m === 7) { this.sw(REV_FEEDBACK, 0x7f); this.sw(REV_DELAY, 0x7f); }
      else if (m === 8) { this.sw(REV_FEEDBACK, 0); this.sw(REV_DELAY, 0x7f); }
      else { this.sw(REV_FEEDBACK, 0); this.sw(REV_DELAY, 0); }
    }
    const echo = () => { const m = this.lw(REV_MODE); return m < 9 && !(m < 7); };
    if ((all || mask & 8) && echo()) {
      delaySet = 1;
      if (!modeSet) { preset(); this.sw(buf, 0x0c011c00); }
      const d = this.lw(attr + 0xc);
      this.sw(REV_DELAY, d);
      const a = by127(d << 13), b = by127(d << 12);
      const h36 = this.lhu(sp + 0x36);
      this.sh(sp + 0x28, a - this.lhu(sp + 0x14));
      this.sh(sp + 0x2a, b - this.lhu(sp + 0x16));
      this.sh(sp + 0x34, h36 + b);
      this.sh(sp + 0x2c, this.lhu(sp + 0x2e) + b);
      this.sh(sp + 0x4a, this.lhu(sp + 0x4e) + b);
      this.sh(sp + 0x48, this.lhu(sp + 0x4c) + b);
    }
    if ((all || mask & 0x10) && echo()) {
      fbSet = 1;
      if (!modeSet) {
        if (!delaySet) { preset(); this.sw(buf, 0x80); } else this.sw(buf, this.lw(buf) | 0x80);
      }
      const f = this.lw(attr + 0x10);
      this.sw(REV_FEEDBACK, f);
      this.sh(sp + 0x22, by127(Math.imul(f, 0x8100)));
    }
    const regs = () => this.lw(SPU_REGS);
    if (modeSet) {
      wasOn = (this.lhu(regs() + 0x1aa) >> 7) & 1;
      if (wasOn) this.sh(regs() + 0x1aa, this.lhu(regs() + 0x1aa) & 0xff7f);
      this.sh(regs() + 0x184, 0); this.sh(regs() + 0x186, 0);
      this.sh(REV_DEPTH, 0); this.sh(REV_DEPTH + 2, 0);
    } else {
      if (all || mask & 2) { this.sh(regs() + 0x184, this.lhu(attr + 8)); this.sh(REV_DEPTH, this.lhu(attr + 8)); }
      if (all || mask & 4) { this.sh(regs() + 0x186, this.lhu(attr + 0xa)); this.sh(REV_DEPTH + 2, this.lhu(attr + 0xa)); }
    }
    if (modeSet || delaySet || fbSet) this.spuSetReverbRegs(buf);
    if (this.lw(sp + 0x58) !== 0) this.SpuClearReverbWorkArea(this.lw(REV_MODE));
    if (modeSet) {
      this.spuRegAddr(0xd1, this.lw(REV_START), 0);
      if (wasOn) this.sh(regs() + 0x1aa, this.lhu(regs() + 0x1aa) | 0x80);
    }
    return done(0);
  },

  // 0x80060a78: reverb registers 0x1c0..0x1fe from a {mask, 32 halfwords} block (mask 0 = all).
  spuSetReverbRegs(p) {
    const mask = this.lw(p), all = mask === 0;
    for (let i = 0; i < 32; i++) if (all || mask & (1 << i)) this.sh(this.lw(SPU_REGS) + 0x1c0 + i * 2, this.lhu(p + 4 + i * 2));
  },

  // 0x80060ff8 SpuClearReverbWorkArea(mode): zero the work area 0x400 bytes at a time.
  SpuClearReverbWorkArea(mode) {
    const sp = (this.m.sp = (this.m.sp - 0x38) | 0);
    const done = (v) => { this.m.sp = (sp + 0x38) | 0; return v; };
    this.sw(sp + 0x10, 0);
    let restoreMode = 0;
    if ((mode >>> 0) >= 10 || this.spuReverbOverlap(this.lw(REV_WORK + mode * 4)) !== 0) return done(-1);
    const sh = this.lw(SPU_ADDR_SHIFT);
    let size, addr;
    if (mode === 0) { size = (0x10 << sh) >>> 0; addr = (0xfff0 << sh) >>> 0; }
    else { const st = this.lw(REV_WORK + mode * 4); size = ((0x10000 - st) << sh) >>> 0; addr = (st << sh) >>> 0; }
    const xm = this.lw(XFER_MODE);
    if (xm === 1) { this.sw(XFER_MODE, 0); restoreMode = 1; }
    if (this.lw(XFER_CALLBACK) !== 0) { this.sw(sp + 0x10, this.lw(XFER_CALLBACK)); this.sw(XFER_CALLBACK, 0); }
    let more;
    do {
      more = 1; let n = 0x400;
      if (size < 0x401) { n = size; more = 0; }
      this.spuTransfer(2, addr);
      this.spuTransfer(1);
      this.spuTransfer(3, ZERO_BUF, n);
      this.spuWaitEvent(this.lw(XFER_EVENT));
      size = (size - 0x400) >>> 0; addr = (addr + 0x400) >>> 0;
    } while (more);
    if (restoreMode) this.sw(XFER_MODE, xm);
    if (this.lw(sp + 0x10) !== 0) this.sw(XFER_CALLBACK, this.lw(sp + 0x10));
    return done(0);
  },

  // 0x80061198: BIOS WaitEvent. DMA completes at once here, so there is nothing to wait for.
  spuWaitEvent() { return 0; },

  // 0x8005edec _spu_t(mode, ...): 2 = set transfer address, 1 = write direction,
  // 0 = read direction, 3 = start DMA4 (buf, bytes). -2 when the SPU does not answer.
  spuTransfer(mode, a1, a2) {
    const regs = this.lw(SPU_REGS);
    const poll = (ok) => { for (let i = 0; i <= 0xf00; i++) if (ok()) return true; return false; }; // ~0xf00 tries
    if (mode === 2) {
      const v = a1 >>> this.lw(SPU_ADDR_SHIFT);
      this.sh(XFER_ADDR, v); this.sh(regs + 0x1a6, v);
      return 0;
    }
    if (mode === 1 || mode === 0) {
      this.sw(XFER_DIR, mode === 1 ? 0 : 1);
      const want = this.lhu(XFER_ADDR);
      if (!poll(() => this.lhu(regs + 0x1a6) === want)) return -2;
      const r = this.lw(SPU_REGS) + 0x1aa;
      this.sh(r, mode === 1 ? (this.lhu(r) & 0xffcf) | 0x20 : this.lhu(r) | 0x30);
      return 0;
    }
    if (mode !== 3) return 0;
    const want = this.lw(XFER_DIR) === 1 ? 0x30 : 0x20;
    if (!poll(() => (this.lhu(regs + 0x1aa) & 0x30) === want)) return -2;
    if (this.lw(XFER_DIR) === 1) this.dmaDpcrRead(); else this.dmaDpcrWrite();
    this.sw(XFER_BUF, a1);
    this.sw(XFER_BLOCKS, ((a2 >>> 6) + ((a2 & 0x3f) !== 0 ? 1 : 0)) | 0);
    this.sw(this.lw(DMA_MADR), this.lw(XFER_BUF));
    this.sw(this.lw(DMA_BCR), (this.lw(XFER_BLOCKS) << 16) | 0x10);
    this.sw(this.lw(DMA_CHCR), this.lw(XFER_DIR) === 1 ? 0x01000200 : 0x01000201);
    return 0;
  },
  // 0x8005f2d0 / 0x8005f2f8: DMA4 priority in DPCR for writes / reads.
  dmaDpcrWrite() { const p = this.lw(DMA_DPCR); this.sw(p, (this.lw(p) & 0xf0ffffff) | 0x20000000); },
  dmaDpcrRead() { const p = this.lw(DMA_DPCR); this.sw(p, (this.lw(p) & 0xf0ffffff) | 0x22000000); },
};
