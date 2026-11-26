// libsnd/libspu set-up and tear-down: SsInit, SpuInit, the voice tables, sequence table
// size, tick mode and the tick interrupt, serial (CD/external) input, mono/stereo, and
// sequence open/close. Port of SLPS_017.94 0x80055f28, 0x8005e6a8, 0x8005e6c8, 0x8005e848,
// 0x8005e7b0, 0x80055e38, 0x8005b428, 0x80058ec8, 0x800590e8, 0x800589a8, 0x80058758,
// 0x80058a68, 0x80058ba0, 0x80055d88, 0x800585b8, 0x8005e088, 0x8005e098, 0x8005e0a8,
// 0x80055f58, 0x800580c8, 0x80055ba4, 0x80055a28, 0x80053e7c.
// Calls into libetc/the BIOS (interrupt callbacks, critical sections, events) go through
// this.platform: the oracle runs the original code, the browser build uses sound/lib/platform.js.
import { s8, s16 } from "./mem.js";
import { SPU_REGS, SPU_KEY_SHADOW } from "./spuvoice.js";
import { SEQ_TABLE, SEQ_COUNT, SUB_COUNT, SEQ_OPEN, LOCK, HANDLERS } from "./seqplay.js";
import { NVOICES, SHADOW, DIRTY, CUR_VOICE, KON, KON_HI, KOFF, REV, REV_HI, NOISE, NOISE_HI, NOISE_HOLD } from "./voice.js";
import { VAB_OPEN, PROG_MAX, MONO, DAMPER } from "./notes.js";
import { VSYNC_RATE } from "./controls.js";
import { REV_ATTR, REV_ON, REV_RESERVED, REV_START, REV_MODE, REV_WORK } from "./reverb.js";
import { MALLOC_COUNT, MALLOC_LAST } from "./malloc.js";
import { VAB_COUNT } from "./vab.js";

const TICK_RATE = 0x80078660, TICK_NOINT = 0x80078664, TICK_FN = 0x80078668, TICK_OLD = 0x8007866c;
const TICK_VSYNC = 0x80078670, TICK_DIV = 0x80078671, TICK_KIND = 0x80078672, RCNT_BASE = 0x80078684;
const SPU_EVENT_INIT = 0x80078ca0, XFER_EVENT = 0x80078838;

// Handler tables SsSeqOpen installs (0x8009cc48): note, program, bend, meta, control,
// then the controller and NRPN handlers in table order.
const HANDLER_INIT = [
  [0x00, 0x80057f78], [0x04, 0x80058058], [0x0c, 0x80057da8], [0x08, 0x80057ac8], [0x10, 0x80057b78],
  [0x14, 0x800561f8], [0x1c, 0x800566c8], [0x20, 0x80056798], [0x24, 0x80056868], [0x28, 0x80056958],
  [0x2c, 0x80056a98], [0x30, 0x80056bc8], [0x34, 0x80056d08], [0x38, 0x80056d78], [0x3c, 0x80056a08],
  [0x40, 0x80056de8], [0x18, 0x80056278], [0x44, 0x80056ea8], [0x48, 0x80056f38], [0x4c, 0x80056ff8],
  [0x50, 0x80057088], [0x54, 0x80057118], [0x58, 0x800572c8], [0x5c, 0x80057388], [0x60, 0x80057438],
  [0x64, 0x800574e8], [0x68, 0x80057598], [0x6c, 0x80057658], [0x70, 0x80057708], [0x74, 0x800577b8],
  [0x78, 0x80057898], [0x7c, 0x80057938], [0x80, 0x800579d8], [0x84, 0x80057a08], [0x88, 0x80057a38],
  [0x8c, 0x80057a68], [0x90, 0x80057a98],
];

export const Init = {
  // 0x80055f28 SsInit()
  SsInit() { this.platform.resetCallback(); this.SpuInit(); this.ssInitVoices(); },

  // 0x8005e6a8 SpuInit() / 0x8005e6c8
  SpuInit() { return this.spuInitMode(0); },
  spuInitMode(mode) {
    this.platform.resetCallback();
    this.spuInitHw(mode);
    if (mode === 0) for (let i = 23; i >= 0; i--) this.sh(0x8007889a - (23 - i) * 2, 0xc000);
    this.spuInitEvent();
    this.sw(REV_ON, 0); this.sw(REV_RESERVED, 0);
    this.sw(REV_MODE, 0); this.sh(REV_MODE + 4, 0); this.sh(REV_MODE + 6, 0); this.sw(REV_MODE + 8, 0); this.sw(REV_MODE + 0xc, 0);
    this.sw(REV_START, this.lw(REV_WORK));
    this.spuRegAddr(0xd1, this.lw(REV_START), 0);
    this.sw(MALLOC_COUNT, 0); this.sw(MALLOC_LAST, 0); this.sw(0x80078d18, 0);
    this.sw(0x80078840, 0); this.sw(0x80078ccc, 0); this.sw(0x8007883c, 0);
    this.sw(0x80078868, 0); this.sw(0x80078864, 0); this.sw(0x80078c9c, 0);
  },

  // 0x8005e848 _spu_init(mode): reset the SPU; mode 0 also clears voices and SPU RAM start.
  spuInitHw(mode) {
    const dpcr = this.lw(0x80078cc0);
    this.sw(dpcr, this.lw(dpcr) | 0xb0000);
    const regs = () => this.lw(SPU_REGS);
    this.sw(0x80078ccc, 0); this.sw(0x80078cd0, 0); this.sh(0x80078cc8, 0);
    this.sh(regs() + 0x180, 0); this.sh(regs() + 0x182, 0); this.sh(regs() + 0x1aa, 0);
    this.spuDelay();
    this.sh(regs() + 0x180, 0); this.sh(regs() + 0x182, 0);
    if (this.lhu(regs() + 0x1ae) & 0x7ff) {
      let i = 1;
      for (; i < 0xf01; i++) if (!(this.lhu(regs() + 0x1ae) & 0x7ff)) break;
      if (i >= 0xf01) this.printf(0x80013b74, 0x80013b84);
    }
    this.sw(0x80078cd4, 2); this.sw(0x80078cd8, 3); this.sw(0x80078cdc, 8); this.sw(0x80078ce0, 7);
    const r = regs();
    this.sh(r + 0x1ac, 4); this.sh(r + 0x184, 0); this.sh(r + 0x186, 0);
    this.sh(r + 0x18c, 0xffff); this.sh(r + 0x18e, 0xffff); this.sh(r + 0x198, 0); this.sh(r + 0x19a, 0);
    for (let i = 0; i < 10; i++) this.sh(SPU_KEY_SHADOW + i * 2, 0);
    if (mode === 0) {
      this.sh(0x80078cc8, 0x200);
      for (const o of [0x190, 0x192, 0x194, 0x196, 0x1b0, 0x1b2, 0x1b4, 0x1b6]) this.sh(regs() + o, 0);
      this.spuWriteIO(0x80078cf0, 0x10);
      for (let v = 0, p = regs(); v < 24; v++, p = (p + 16) | 0) {
        this.sh(p, 0); this.sh(p + 2, 0); this.sh(p + 4, 0x3fff); this.sh(p + 6, 0x200); this.sh(p + 8, 0); this.sh(p + 0xa, 0);
      }
      this.sh(regs() + 0x188, 0xffff); this.sh(regs() + 0x18a, 0xff);
      for (let i = 0; i < 4; i++) this.spuDelay();
      this.sh(regs() + 0x18c, 0xffff); this.sh(regs() + 0x18e, 0xff);
      for (let i = 0; i < 4; i++) this.spuDelay();
    }
    this.sw(0x80078ce4, 1);
    this.sh(regs() + 0x1aa, 0xc000);
    this.sw(0x80078ce8, 0); this.sw(0x80078cec, 0);
    return 0;
  },

  // 0x8005e7b0: once, hook the DMA4 interrupt and open the transfer-done event.
  spuInitEvent() {
    if (this.lw(SPU_EVENT_INIT) !== 0) return;
    this.sw(SPU_EVENT_INIT, 1);
    this.platform.enterCriticalSection();
    this.platform.dmaCallback(4, 0x8005ec88);
    const ev = this.platform.openEvent(0xf0000009, 0x20, 0x2000, 0);
    this.sw(XFER_EVENT, ev);
    this.platform.enableEvent(ev);
    this.platform.exitCriticalSection();
  },

  // 0x80055e38: default voice and common registers, libsnd tables, 60 ticks a second.
  ssInitVoices() {
    for (let v = 0; v < 24; v++) for (let i = 0; i < 8; i++) this.sh(0x1f801c00 + v * 16 + i * 2, this.lhu(0x8007862c + i * 2));
    for (let i = 0; i < 16; i++) this.sh(0x1f801d80 + i * 2, this.lhu(0x8007863c + i * 2));
    this.ssVoiceInit(24);
    for (let a = 0; a < 32; a++) for (let i = 15; i >= 0; i--) this.sw(0x801fe0a0 + a * 0x40 + i * 4, 0);
    this.sw(VSYNC_RATE, 0x3c); this.sw(SEQ_OPEN, 0); this.sw(LOCK, 0);
  },

  // 0x8005b428: SPU memory table, voice records and libsnd state for n voices.
  ssVoiceInit(n) {
    this.spuSetBusy(0);
    this.sh(DAMPER, 0);
    this.SpuInitMalloc(0x20, 0x8008c8d8);
    for (let i = 0; i < 0xc0; i++) this.sh(SHADOW + i * 2, 0);
    for (let i = 0; i < 0x18; i++) this.sb(DIRTY + i, 0);
    this.sh(VAB_COUNT, 0);
    for (let i = 0; i < 0x10; i++) this.sb(VAB_OPEN + i, 0);
    const nv = s8(n);
    this.sb(NVOICES, (nv >>> 0) < 0x18 ? nv : 0x18);
    const sp = (this.m.sp = (this.m.sp - 0x70) | 0), attr = sp + 0x10;
    this.sw(sp + 0x14, 0x60093); this.sh(sp + 0x24, 0x1000); this.sw(sp + 0x2c, 0x1000); this.sh(sp + 0x4a, 0x80ff);
    this.sh(sp + 0x18, 0); this.sh(sp + 0x1a, 0); this.sh(sp + 0x4c, 0x4000);
    for (let v = 0; (v & 0xffff) < this.lb(NVOICES); v++) {
      const r = this.vrec(v & 0xffff);
      this.sh(r + 2, 0x18); this.sh(r, 0xff); this.sb(r + 0x1d, 0); this.sh(r + 4, 0); this.sh(r + 6, 0);
      this.sh(r + 0x10, -1); this.sh(r + 0x12, 0); this.sh(r + 0x14, 0); this.sh(r + 0x16, 0xff);
      this.sh(r + 8, 0); this.sh(r + 0xc, 0); this.sb(r + 0xa, 0x40);
      for (const o of [0x1e, 0x20, 0x22, 0x24, 0x2a, 0x2c, 0x2e, 0x30, 0x32, 0x26]) this.sh(r + o, 0);
      this.sw(attr, 1 << (v & 0xffff));
      this.SpuSetVoiceAttr(attr);
      this.sh(CUR_VOICE, v);
      this.voiceKeyOff(1);
    }
    this.m.sp = (sp + 0x70) | 0;
    this.sw(REV_ATTR, 0); this.sh(REV_ATTR + 8, 0x3fff); this.sh(REV_ATTR + 0xa, 0x3fff); this.sw(REV_ATTR + 4, 0);
    for (const a of [KON, KON_HI, KOFF, REV, REV_HI, NOISE, NOISE_HI]) this.sh(a, 0);
    this.sb(NOISE_HOLD, 0); this.sh(MONO, 0); this.sh(PROG_MAX, 0x80);
    this.voiceFlush();
  },

  // 0x80058ec8 SsSetTableSize(table, nseq, nsub)
  SsSetTableSize(table, nseq, nsub) {
    this.sh(SEQ_COUNT, nseq); this.sh(SUB_COUNT, nsub);
    const n = s16(nseq), m = s16(nsub);
    for (let i = 0, k = 0; i < n; i++, k += m) this.sw(SEQ_TABLE + i * 4, (table + k * 0xb0) | 0);
    for (let i = n; i < 0x20; i++) this.sw(SEQ_OPEN, this.lw(SEQ_OPEN) | (1 << i));
    for (let a = 0; a < this.lh(SEQ_COUNT); a++) for (let b = 0; b < this.lh(SUB_COUNT); b++) {
      const p = (this.lw(SEQ_TABLE + a * 4) + b * 0xb0) | 0;
      this.seqClearState(p);
      this.sh(p + 0x5c, 0x7f); this.sh(p + 0x5e, 0x7f);
    }
  },
  seqClearState(p) {
    this.sw(p + 0x98, 0); this.sb(p + 0x22, -1); this.sb(p + 0x23, 0); this.sh(p + 0x48, 0); this.sh(p + 0x4a, 0);
    this.sw(p + 0x9c, 0); this.sw(p + 0xa0, 0); this.sh(p + 0x4c, 0); this.sw(p + 0xac, 0); this.sw(p + 0xa8, 0);
    this.sw(p + 0xa4, 0); this.sh(p + 0x4e, 0); this.sh(p + 0x58, 0x7f); this.sh(p + 0x5a, 0x7f);
  },

  // 0x80053e7c GetVideoMode (libetc): 0 NTSC, 1 PAL.
  GetVideoMode() { return this.lw(0x80078600); },

  // 0x800590e8 SsSetTickMode(mode): ticks per second in VSYNC_RATE; 0x1000 = called by the game.
  SsSetTickMode(mode) {
    const vm = this.GetVideoMode();
    if (mode & 0x1000) { this.sw(TICK_NOINT, 1); this.sw(TICK_RATE, mode & 0xfff); }
    else { this.sw(TICK_NOINT, 0); this.sw(TICK_RATE, mode); }
    const t = this.lw(TICK_RATE);
    if (!(t < 6)) { this.sw(VSYNC_RATE, t); return; }
    const pal = () => this.sw(VSYNC_RATE, vm === 1 ? 50 : 60);
    switch (t) {
      case 0: case 5: if (vm === 0) this.sw(VSYNC_RATE, 60); else pal(); return;
      case 1: this.sw(VSYNC_RATE, 60); this.sw(TICK_RATE, vm !== 0 ? 60 : 5); return;
      case 2: this.sw(VSYNC_RATE, 240); return;
      case 3: this.sw(VSYNC_RATE, 120); return;
      case 4: this.sw(VSYNC_RATE, 50); this.sw(TICK_RATE, vm === 1 ? 5 : 50); return;
      default: this.sw(VSYNC_RATE, 60);
    }
  },

  // 0x800589a8 SsStart() / 0x80058758: start the tick (VSync callback or root counter).
  SsStart() { this.ssStart(0); },
  ssStart(flag) {
    let spec = 0xf2000002 | 0, target = 0x44e8;
    const t = this.lw(TICK_RATE);
    this.sb(TICK_KIND, 6); this.sb(TICK_VSYNC, 0); this.sb(TICK_DIV, 0); this.sw(TICK_OLD, 0);
    if (t === 0) { this.sb(TICK_KIND, 0x7f); return; }
    if (t === 3) target = 0x89d0;
    else if (t === 5) {
      this.sb(TICK_KIND, 0);
      if (flag === 0) this.sb(TICK_VSYNC, 1); else { spec = 0xf2000003 | 0; target = 1; }
    } else if (t !== 2) {
      if (this.lw(TICK_NOINT) !== 0) return;
      const r = this.lw(TICK_RATE);
      if (r < 0x46) { target = Math.trunc(0x204cc0 / r); this.sb(TICK_DIV, this.lbu(TICK_DIV) + 1); }
      else target = Math.trunc(0x409980 / r);
    }
    this.platform.enterCriticalSection();
    if (this.lb(TICK_VSYNC) !== 0) this.platform.vsyncCallbacks(this.lw(TICK_FN));
    else {
      this.rcntStop(spec);
      this.rcntSet(spec, target & 0xffff, 0x1000);
      const kind = this.lb(TICK_KIND);
      if (kind === 0) {
        this.sw(TICK_OLD, this.platform.intCallback(0, 0));
        this.platform.intCallback(this.lb(TICK_KIND), 0x800589c8);
      } else this.platform.intCallback(kind, this.lb(TICK_DIV) !== 0 ? 0x80058a14 : this.lw(TICK_FN));
    }
    this.platform.exitCriticalSection();
  },
  // 0x80058ba0 / 0x80058a68: root counter stop / set (libapi StopRCnt, SetRCnt).
  rcntStop(spec) { const t = spec & 0xffff; if (t >= 3) return 0; this.sh(this.lw(RCNT_BASE) + t * 16, 0); return 1; },
  rcntSet(spec, target, mode) {
    const t = spec & 0xffff;
    if (t >= 3) return 0;
    const base = (this.lw(RCNT_BASE) + t * 16) | 0;
    this.sh(base + 4, 0); this.sh(base + 8, target);
    let m = 0x48;
    if (t < 2) { if (mode & 0x10) m = 0x49; if (!(mode & 1)) m |= 0x100; }
    else if (t === 2 && !(mode & 1)) m = 0x248;
    if (mode & 0x1000) m |= 0x10;
    this.sh(this.lw(RCNT_BASE) + t * 16 + 4, m);
    return 1;
  },

  // 0x80055d88 SsEnd(): undo SsStart.
  SsEnd() {
    if (this.lw(TICK_NOINT) !== 0 || this.lb(TICK_KIND) === 0x7f) return;
    this.sb(TICK_DIV, 0);
    this.platform.enterCriticalSection();
    if (this.lb(TICK_VSYNC) !== 0) { this.platform.vsyncCallbacks(0); this.sb(TICK_VSYNC, 0); }
    else if (this.lb(TICK_KIND) === 0) { this.platform.intCallback(0, this.lw(TICK_OLD)); this.sw(TICK_OLD, 0); }
    else this.platform.intCallback(6, 0);
    this.platform.exitCriticalSection();
    this.sb(TICK_KIND, 0x7f);
  },

  // 0x800585b8 SsSetSerialAttr(serial, attr, on): CD (0) / external (1) mix and reverb.
  SsSetSerialAttr(ch, attr, on) {
    const sp = (this.m.sp = (this.m.sp - 0x40) | 0), a = sp + 0x10;
    const c = s8(ch), k = s8(attr), v = s8(on);
    if ((ch & 0xff) === 0) {
      if (k === 0) { this.sw(a, 0x200); this.sw(sp + 0x28, v); }
      if (k === 1) { this.sw(a, 0x100); this.sw(sp + 0x24, v); }
    }
    if (c === 1) {
      if (k === 0) { this.sw(a, 0x2000); this.sw(sp + 0x34, v); }
      if (k === c) { this.sw(a, 0x1000); this.sw(sp + 0x30, v); }
    }
    this.SpuSetCommonAttr(a);
    this.m.sp = (sp + 0x40) | 0;
  },

  SsSetMono() { this.sh(MONO, 1); }, // 0x8005e088
  SsSetStereo() { this.sh(MONO, 0); }, // 0x8005e098
  // 0x8005e0a8 SsSetReservedVoice(n): how many voices libsnd may use (1..24).
  SsSetReservedVoice(n) {
    if (((n - 1) & 0xff) >= 0x18) return -1;
    this.sb(NVOICES, n); return s8(n);
  },
  call8005e0a8(n) { return this.SsSetReservedVoice(n); },

  // 0x80055f58 SsSeqOpen(seq, vab): first free slot; 0x800580c8 parses the SEQ header.
  SsSeqOpen(seq, vab) {
    const open = this.lw(SEQ_OPEN);
    let acc = 0, found = false;
    if (open !== -1) {
      for (let i = 0; ; ) {
        if (!(open & (1 << i))) { acc = i; found = true; }
        i++;
        if (!(i < 0x20)) { found = false; break; }
        if (found) break;
      }
    }
    if (!found) { this.printf(0x80013ae4); return -1; }
    const a = s16(acc);
    this.sw(SEQ_OPEN, this.lw(SEQ_OPEN) | (1 << a));
    const r = this.seqOpenData(a, s16(vab), seq);
    for (const [o, fn] of HANDLER_INIT) this.sw(HANDLERS + o, fn);
    return s16(r) === -1 ? -1 : a;
  },
  seqOpenData(acc, vab, data) {
    const p = this.lw(SEQ_TABLE + s16(acc) * 4);
    this.sb(p + 0x26, vab); this.sh(p + 0x50, 0);
    for (const o of [0x18, 0x19, 0x1e, 0x1a, 0x1b, 0x1f, 0x17]) this.sb(p + o, 0);
    this.sw(p + 0x84, 0); this.sw(p + 0x88, 0); this.sw(p + 0x8c, 0); this.sh(p + 0x56, 0);
    this.sb(p + 0x21, 0); this.sb(p + 0x20, 1); this.sb(p + 0x14, 0); this.sw(p + 0x90, 0);
    for (const o of [0x1c, 0x1d, 0x15, 0x16]) this.sb(p + o, 0);
    this.sh(p + 0x80, 0); this.sb(p + 0x24, 0); this.sb(p + 0x25, 0);
    for (let i = 0; i < 16; i++) { this.sb(p + 0x37 + i, i); this.sb(p + 0x27 + i, 0x40); this.sh(p + 0x60 + i * 2, 0x7f); }
    this.sh(p + 0x52, 1);
    this.sw(p, data);
    const c = this.lbu(data);
    if (c !== 0x53 && c !== 0x70) { this.printf(0x80013b2c); return 0; }
    this.sw(p, data + 7);
    const ver = this.lbu(data + 7);
    this.sw(p, data + 8);
    if (ver !== 1) { this.printf(0x80013b14); return -1; }
    const r1 = this.lbu(data + 8); this.sw(p, data + 9);
    const r0 = this.lbu(data + 9); this.sw(p, data + 10);
    this.sh(p + 0x50, r0 | (r1 << 8));
    let q = this.lw(p);
    const t0 = this.lbu(q); q = (q + 1) | 0; this.sw(p, q);
    const t1 = this.lbu(q); this.sw(p, q + 1);
    const t2 = this.lbu(q + 1);
    this.sw(p, q + 2);
    const tempo = (t0 << 16) | (t1 << 8) | t2;
    const bpm = Math.trunc(60000000 / tempo), rest = 60000000 % tempo;
    this.sw(p + 0x8c, tempo);
    this.sw(p + 0x8c, (tempo >>> 1) < rest ? bpm + 1 : bpm);
    let w = this.lw(p);
    this.sw(p + 0x94, this.lw(p + 0x8c));
    this.sb(p + 0x24, this.lbu(w)); w = (w + 1) | 0; this.sw(p, w);
    this.sb(p + 0x25, this.lbu(w)); w = (w + 1) | 0; this.sw(p, w);
    const d = this.seqReadDelta(s16(acc), 0);
    const prod = Math.imul(this.lh(p + 0x50), this.lw(p + 0x8c));
    const cur = this.lw(p), rate = this.lw(VSYNC_RATE);
    this.sw(p + 8, cur); this.sw(p + 0x84, d); this.sw(p + 0x90, d); this.sw(p + 0x10, 0); this.sw(p + 0xc, cur); this.sw(p + 4, cur);
    const r60 = Math.imul(rate, 60);
    if ((Math.imul(prod, 10) >>> 0) < (r60 >>> 0)) {
      const v = Math.floor((Math.imul(rate, 600) >>> 0) / (prod >>> 0));
      this.sh(p + 0x52, v); this.sh(p + 0x54, v);
    } else {
      const x = Math.imul(Math.imul(this.lh(p + 0x50), this.lw(p + 0x8c)), 10) >>> 0;
      const quo = Math.floor(x / (r60 >>> 0)), rem = x % (r60 >>> 0);
      this.sh(p + 0x52, -1);
      this.sh(p + 0x54, quo);
      if ((Math.imul(rate, 30) >>> 0) < rem) this.sh(p + 0x54, quo + 1);
    }
    this.sh(p + 0x56, this.lhu(p + 0x54));
    return 0;
  },

  // 0x80055ba4 SsSeqClose(acc) / 0x80055a28
  SsSeqClose(acc) { this.seqClose(s16(acc)); },
  seqClose(acc) {
    const a = s16(acc);
    this.seqSetVolVoices(a, 0, 0, 1);
    this.seqVoicesOff(a);
    this.sw(SEQ_OPEN, this.lw(SEQ_OPEN) & ~(1 << a));
    for (let b = 0; b < this.lh(SUB_COUNT); b++) this.seqClearState((this.lw(SEQ_TABLE + a * 4) + b * 0xb0) | 0);
  },
};
