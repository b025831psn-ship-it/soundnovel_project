// libsnd VAB handling: open a VAB head, send its body to SPU RAM, close it; and the
// libspu transfer calls behind it. Port of SLPS_017.94 0x8005e188 (SsVabOpenHeadSticky),
// 0x8005e1e8, 0x8005e5b8 (SsVabTransBody), 0x8005e678 (SsVabTransCompleted), 0x8005e0d8
// (SsVabClose), 0x800614b8 (SpuSetTransferMode), 0x80061458 (SpuSetTransferStartAddr),
// 0x800613f8 (SpuWrite), 0x8005f06c, 0x8005eac8 (I/O-mode write), 0x8005f320 (delay),
// 0x800614e8 (SpuIsTransferCompleted), 0x80061598 (TestEvent), 0x800615a8/0x800615d0.
import { s16 } from "./mem.js";
import { SPU_REGS, SPU_ADDR_SHIFT } from "./spuvoice.js";
import { VAB_OPEN, PROG_MAX, VAB_HDR_TAB, PROG_ATTR_TAB, VAG_ATTR_TAB } from "./notes.js";

export const VAB_COUNT = 0x801fed08, VAB_SPU_ADDR = 0x801fed10, VAB_BODY_SIZE = 0x801fecc8;
const SPU_FREE = 0x80078ce4; // 1 = no transfer in progress
const XFER_ADDR = 0x80078cc8, XFER_MODE = 0x80078ccc, XFER_MODE_REQ = 0x80078840, XFER_CALLBACK = 0x80078ce8, XFER_EVENT = 0x80078838;

export const Vab = {
  // 0x800615a8 / 0x800615d0
  spuSetBusy(busy) { this.sw(SPU_FREE, busy === 1 ? 0 : 1); },
  spuIsBusy() { return this.lw(SPU_FREE) !== 1 ? 1 : 0; },

  // 0x8005e188 SsVabOpenHeadSticky(head, vabId, sbaddr)
  SsVabOpenHeadSticky(head, id, sbaddr) { return s16(this.vabOpenHead(head, s16(id), 1, sbaddr)); },

  // 0x8005e1e8: register a VAB head (id -1 = first free slot); sticky uses sbaddr,
  // otherwise the body gets SpuMalloc'd. The VAG SPU addresses go into the program table.
  vabOpenHead(head, vabId, sticky, sbaddr) {
    if (this.spuIsBusy() === 1) return -1;
    this.spuSetBusy(1);
    const id = s16(vabId);
    let slot = 16;
    if (id < 16) {
      if (id === -1) {
        for (let i = 0; i < 16; i++) if (this.lbu(VAB_OPEN + i) === 0) { this.sb(VAB_OPEN + i, 1); this.sh(VAB_COUNT, this.lhu(VAB_COUNT) + 1); slot = i; break; }
      } else if (this.lbu(VAB_OPEN + id) === 0) { this.sb(VAB_OPEN + id, 1); this.sh(VAB_COUNT, this.lhu(VAB_COUNT) + 1); slot = vabId; }
    } else { this.spuSetBusy(0); return -1; }
    const a2 = s16(slot);
    if (!(a2 < 16)) { this.spuSetBusy(0); return -1; }
    const fail = () => { this.sb(VAB_OPEN + s16(slot), 0); this.spuSetBusy(0); this.sh(VAB_COUNT, this.lhu(VAB_COUNT) - 1); return -1; };
    this.sw(VAB_HDR_TAB + a2 * 4, head);
    const magic = this.lw(head);
    if ((magic >>> 8) !== 0x564142) { this.sb(VAB_OPEN + a2, 0); this.spuSetBusy(0); this.sh(VAB_COUNT, this.lhu(VAB_COUNT) - 1); return -1; }
    this.sh(PROG_MAX, (magic & 0xff) === 0x70 && !(this.lw(head + 4) < 5) ? 0x80 : 0x40);
    const progs = (head + 0x20) | 0, pmax = this.lh(PROG_MAX);
    if (pmax < this.lhu(head + 0x12)) return fail();
    this.sw(PROG_ATTR_TAB + s16(slot) * 4, progs);
    let tones = (progs + pmax * 16) | 0;
    for (let i = 0, n = 0; i < pmax; i++) { const p = progs + i * 16; this.sw(p + 8, n); if (this.lbu(p) !== 0) n++; }
    this.sw(VAG_ATTR_TAB + s16(slot) * 4, tones);
    const sizes = (tones + (this.lhu(head + 0x12) << 9)) | 0, vs = this.lbu(head + 0x16);
    const sp = (this.m.sp = (this.m.sp - 0x430) | 0), tab = sp + 0x10;
    const done = (v) => { this.m.sp = (sp + 0x430) | 0; return v; };
    let total = 0;
    for (let i = 0; i < 256; i++) {
      if (!(vs < i)) { const sz = this.lhu(sizes + i * 2), v = this.lw(head + 4) < 5 ? sz << 2 : sz << 3; this.sw(tab + i * 4, v); total = (total + this.lw(tab + i * 4)) | 0; }
    }
    let addr;
    if (s16(sticky) === 0) { addr = this.SpuMalloc(total); if (addr === -1) return done(fail()); }
    else addr = sbaddr;
    if ((0x80000 >>> 0) < (((addr + total) | 0) >>> 0)) return done(fail());
    this.sw(VAB_SPU_ADDR + s16(slot) * 4, addr);
    let off = 0;
    for (let i = 0; !(vs < i); i++) {
      off = (off + this.lw(tab + i * 4)) | 0;
      this.sh(progs + (i >> 1) * 16 + (i & 1 ? 0xe : 0xc), ((addr + off) | 0) >>> 3);
    }
    this.sw(VAB_BODY_SIZE + s16(slot) * 4, off);
    this.sb(VAB_OPEN + s16(slot), 2);
    return done(s16(slot));
  },

  // 0x8005e5b8 SsVabTransBody(body, vab)
  SsVabTransBody(body, vab) {
    if ((vab & 0xffff) >= 17 || this.lbu(VAB_OPEN + s16(vab)) !== 2) { this.spuSetBusy(0); return -1; }
    const v = s16(vab);
    const addr = this.lw(VAB_SPU_ADDR + v * 4);
    this.SpuSetTransferMode(0);
    this.SpuSetTransferStartAddr(addr);
    this.SpuWrite(body, this.lw(VAB_BODY_SIZE + v * 4));
    this.sb(VAB_OPEN + v, 1);
    return v;
  },

  // 0x8005e678 SsVabTransCompleted(flag)
  SsVabTransCompleted(flag) { return s16(this.SpuIsTransferCompleted(s16(flag))); },

  // 0x8005e0d8 SsVabClose(vab)
  SsVabClose(vab) {
    if ((vab & 0xffff) >= 16) return;
    const v = s16(vab);
    if (this.lbu(VAB_OPEN + v) !== 1) return;
    this.SpuFree(this.lw(VAB_SPU_ADDR + v * 4));
    this.sb(VAB_OPEN + v, 0);
    this.sh(VAB_COUNT, this.lhu(VAB_COUNT) - 1);
  },

  // 0x800614b8 SpuSetTransferMode(mode): 0 DMA, 1 I/O.
  SpuSetTransferMode(m) { this.sw(XFER_MODE_REQ, m); this.sw(XFER_MODE, m === 1 ? 1 : 0); },

  // 0x80061458 SpuSetTransferStartAddr(addr)
  SpuSetTransferStartAddr(addr) {
    if ((((addr - 0x1010) | 0) >>> 0) > 0x7efe8) return 0;
    this.sh(XFER_ADDR, this.spuAddrReg(-1, addr));
    return (this.lhu(XFER_ADDR) << this.lw(SPU_ADDR_SHIFT)) | 0;
  },

  // 0x800613f8 SpuWrite(buf, size)
  SpuWrite(buf, size) {
    if ((size >>> 0) > 0x7eff0) size = 0x7eff0;
    this.spuWriteData(buf, size);
    if (this.lw(XFER_CALLBACK) === 0) this.sw(SPU_FREE, 0);
    return size;
  },

  // 0x8005f06c
  spuWriteData(buf, size) {
    if (this.lw(XFER_MODE) === 0) {
      this.spuTransfer(2, this.lhu(XFER_ADDR) << this.lw(SPU_ADDR_SHIFT));
      this.spuTransfer(1);
      this.spuTransfer(3, buf, size);
    } else this.spuWriteIO(buf, size);
    return size;
  },

  // 0x8005eac8: write through the SPU data port, 64 bytes at a time.
  spuWriteIO(buf, size) {
    const regs = () => this.lw(SPU_REGS);
    const stat0 = this.lhu(regs() + 0x1ae);
    this.sh(regs() + 0x1a6, this.lhu(XFER_ADDR));
    this.spuDelay();
    const keep = stat0 & 0x7ff;
    let left = size >>> 0;
    while (left !== 0) {
      const n = left < 0x41 ? left : 0x40;
      for (let i = 0; i < n; i += 2) { this.sh(regs() + 0x1a8, this.lhu(buf)); buf = (buf + 2) | 0; }
      const r = regs() + 0x1aa;
      this.sh(r, (this.lhu(r) & 0xffcf) | 0x10);
      this.spuDelay();
      if (this.lhu(regs() + 0x1ae) & 0x400) {
        let i = 1;
        for (; i < 0xf01; i++) if (!(this.lhu(regs() + 0x1ae) & 0x400)) break;
        if (i >= 0xf01) this.printf(0x80013b74, 0x80013b94);
      }
      this.spuDelay();
      left = (left - n) >>> 0;
      this.spuDelay();
    }
    const r = regs() + 0x1aa;
    this.sh(r, this.lhu(r) & 0xffcf);
    if ((this.lhu(regs() + 0x1ae) & 0x7ff) !== keep) {
      let i = 1;
      for (; i < 0xf01; i++) if ((this.lhu(regs() + 0x1ae) & 0x7ff) === keep) break;
      if (i >= 0xf01) this.printf(0x80013b74, 0x80013ba8);
    }
  },

  // 0x8005f320: a short busy wait (a counter on the stack).
  spuDelay() {
    const sp = (this.m.sp - 8) | 0;
    let v = 13;
    for (let i = 0; i < 60; i++) v = Math.imul(v, 13);
    this.sw(sp, 60); this.sw(sp + 4, v);
  },
  printf() { return 0; }, // 0x80045678: debug output only

  // 0x800614e8 SpuIsTransferCompleted(flag): 1 = wait until done.
  SpuIsTransferCompleted(flag) {
    if (this.lw(XFER_MODE_REQ) === 1 || this.lw(SPU_FREE) === 1) return 1;
    let t = this.spuTestEvent(this.lw(XFER_EVENT));
    if (flag === 1) {
      while (t === 0) t = this.spuTestEvent(this.lw(XFER_EVENT));
      this.sw(SPU_FREE, 1); return 1;
    }
    if (t !== 1) return t;
    this.sw(SPU_FREE, 1); return 1;
  },
  // 0x80061598: BIOS TestEvent. DMA completes at once, so the event has always fired.
  spuTestEvent() { return 1; },
};
