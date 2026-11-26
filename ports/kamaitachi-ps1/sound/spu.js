// PS1 SPU model at register level (0x1f801c00-0x1f801dff), one tick = one 44.1 kHz
// output sample. Behaviour follows the hardware description in psx-spx
// ("Sound Processing Unit"): 24 ADPCM voices with 4-point gaussian interpolation,
// ADSR and sweep envelopes, pitch modulation, noise, ENDX, and the reverb unit at
// 22.05 kHz with its 39-tap resampling FIR. libspu writes these registers; the port
// of libspu/libsnd sits on top of this file.

import { GAUSS } from "./gauss.js";

const FILTER = [[0, 0], [60, 0], [115, -52], [98, -55], [122, -60]];
const clamp16 = (x) => (x > 32767 ? 32767 : x < -32768 ? -32768 : x);
const s16 = (x) => (x << 16) >> 16;
const RAM = 0x80000;

const PHASE_OFF = 0, PHASE_ATTACK = 1, PHASE_DECAY = 2, PHASE_SUSTAIN = 3, PHASE_RELEASE = 4;

// One envelope step generator (ADSR phases and volume sweep share it).
class Envelope {
  constructor() { this.counter = 0; this.rate = 0; this.decreasing = false; this.exponential = false; this.negative = false; this.max = 0x7f; }
  reset(rate, max, decreasing, exponential, negative = false) {
    this.rate = rate; this.max = max; this.decreasing = decreasing; this.exponential = exponential; this.negative = negative; this.counter = 0;
  }
  // returns the new level
  tick(level) {
    const shift = this.rate >> 2, stepValue = this.rate & 3;
    let step = 7 - stepValue;
    if (this.decreasing !== this.negative) step = ~step;
    step = step << Math.max(0, 11 - shift);
    let inc = 0x8000 >> Math.max(0, shift - 11);
    if (this.exponential && !this.decreasing && level > 0x6000) {
      if (shift < 10) step >>= 2;
      else if (shift >= 11) inc >>= 2;
      else { step >>= 1; inc >>= 1; }
    } else if (this.exponential && this.decreasing) {
      step = Math.trunc((step * level) / 0x8000);
    }
    if (this.rate !== this.max) inc = Math.max(inc, 1);
    this.counter += inc;
    if ((this.counter & 0x8000) === 0) return level;
    this.counter = 0;
    level += step;
    if (!this.decreasing) return clamp16(level);
    if (this.negative) return Math.min(0, Math.max(-0x8000, level));
    return Math.max(0, level);
  }
}

class Volume { // VOLL/VOLR/MVOL: direct or sweep
  constructor() { this.reg = 0; this.level = 0; this.env = new Envelope(); this.sweeping = false; }
  write(v) {
    this.reg = v & 0xffff;
    if ((v & 0x8000) === 0) { this.sweeping = false; this.level = s16(v << 1); return; }
    this.sweeping = true;
    this.env.reset(v & 0x7f, 0x7f, (v & 0x2000) !== 0, (v & 0x4000) !== 0, (v & 0x1000) !== 0);
  }
  tick() { if (this.sweeping) this.level = this.env.tick(this.level); }
}

class Voice {
  constructor() {
    this.volL = new Volume(); this.volR = new Volume();
    this.pitch = 0; this.start = 0; this.adsr1 = 0; this.adsr2 = 0; this.repeat = 0;
    this.addr = 0; this.counter = 0; this.block = new Int16Array(28 + 3); this.hist = [0, 0];
    this.flags = 0; this.phase = PHASE_OFF; this.level = 0; this.env = new Envelope();
    this.out = 0; this.ignoreRepeatWrite = false;
  }
  sustainLevel() { return Math.min(((this.adsr1 & 0xf) + 1) * 0x800, 0x7fff); }
  enterPhase(p) {
    this.phase = p;
    const a1 = this.adsr1, a2 = this.adsr2;
    if (p === PHASE_ATTACK) this.env.reset((a1 >> 8) & 0x7f, 0x7f, false, (a1 & 0x8000) !== 0);
    else if (p === PHASE_DECAY) this.env.reset(((a1 >> 4) & 0xf) << 2, 0x1f << 2, true, true);
    else if (p === PHASE_SUSTAIN) this.env.reset((a2 >> 6) & 0x7f, 0x7f, (a2 & 0x4000) !== 0, (a2 & 0x8000) !== 0);
    else if (p === PHASE_RELEASE) this.env.reset((a2 & 0x1f) << 2, 0x1f << 2, true, (a2 & 0x20) !== 0);
  }
  tickEnvelope() {
    if (this.phase === PHASE_OFF) return;
    this.level = this.env.tick(this.level);
    if (this.phase === PHASE_ATTACK && this.level >= 0x7fff) this.enterPhase(PHASE_DECAY);
    else if (this.phase === PHASE_DECAY && this.level <= this.sustainLevel()) this.enterPhase(PHASE_SUSTAIN);
    else if (this.phase === PHASE_RELEASE && this.level <= 0) { this.level = 0; this.phase = PHASE_OFF; }
  }
}

export class Spu {
  constructor() {
    this.ram = new Uint8Array(RAM);
    this.voices = Array.from({ length: 24 }, () => new Voice());
    this.mainL = new Volume(); this.mainR = new Volume();
    this.revOutL = 0; this.revOutR = 0; // EVOL
    this.kon = 0; this.koff = 0; this.pmon = 0; this.non = 0; this.eon = 0; this.endx = 0;
    this.ctrl = 0; this.transferAddr = 0; this.transferCur = 0; this.transferCtrl = 4; this.irqAddr = 0;
    this.cdVolL = 0; this.cdVolR = 0; this.extVolL = 0; this.extVolR = 0;
    this.rev = new Int16Array(32); this.revBase = 0; this.revCur = 0;
    this.noiseLevel = 1; this.noiseTimer = 0;
    this.revInL = new Int16Array(64); this.revInR = new Int16Array(64); this.revInPos = 0;
    this.revOutHistL = new Int16Array(64); this.revOutHistR = new Int16Array(64); this.revOutPos = 0;
    this.odd = false; this.cdQueue = []; this.regs = new Uint16Array(0x200);
    this.writes = null; // optional log for trace comparison: (addr, value)
  }

  // ---- register file ---------------------------------------------------------
  write16(addr, v) {
    addr &= 0x3fe; v &= 0xffff;
    this.writes?.(0x1f801c00 + addr, v);
    this.regs[addr >> 1] = v;
    if (addr < 0x180) {
      const voice = this.voices[addr >> 4];
      switch (addr & 0xf) {
        case 0x0: voice.volL.write(v); break;
        case 0x2: voice.volR.write(v); break;
        case 0x4: voice.pitch = v; break;
        case 0x6: voice.start = v << 3; break;
        case 0x8: voice.adsr1 = v; break;
        case 0xa: voice.adsr2 = v; break;
        case 0xc: voice.level = s16(v); break;
        case 0xe: voice.repeat = v << 3; voice.ignoreRepeatWrite = true; break;
      }
      return;
    }
    switch (addr) {
      case 0x180: this.mainL.write(v); break;
      case 0x182: this.mainR.write(v); break;
      case 0x184: this.revOutL = s16(v); break;
      case 0x186: this.revOutR = s16(v); break;
      case 0x188: this.keyOn(v, 0); break;
      case 0x18a: this.keyOn(v & 0xff, 16); break;
      case 0x18c: this.keyOff(v, 0); break;
      case 0x18e: this.keyOff(v & 0xff, 16); break;
      case 0x190: this.pmon = (this.pmon & 0xff0000) | (v & 0xfffe); break;
      case 0x192: this.pmon = (this.pmon & 0xffff) | ((v & 0xff) << 16); break;
      case 0x194: this.non = (this.non & 0xff0000) | v; break;
      case 0x196: this.non = (this.non & 0xffff) | ((v & 0xff) << 16); break;
      case 0x198: this.eon = (this.eon & 0xff0000) | v; break;
      case 0x19a: this.eon = (this.eon & 0xffff) | ((v & 0xff) << 16); break;
      case 0x1a2: this.revBase = v << 3; this.revCur = this.revBase; break;
      case 0x1a4: this.irqAddr = v << 3; break;
      case 0x1a6: this.transferAddr = v << 3; this.transferCur = this.transferAddr; break;
      case 0x1a8: this.fifoWrite(v); break;
      case 0x1aa: this.ctrl = v; break;
      case 0x1ac: this.transferCtrl = v; break;
      case 0x1b0: this.cdVolL = s16(v); break;
      case 0x1b2: this.cdVolR = s16(v); break;
      case 0x1b4: this.extVolL = s16(v); break;
      case 0x1b6: this.extVolR = s16(v); break;
      default: if (addr >= 0x1c0) this.rev[(addr - 0x1c0) >> 1] = v;
    }
  }

  read16(addr) {
    addr &= 0x3fe;
    if (addr < 0x180) {
      const voice = this.voices[addr >> 4];
      if ((addr & 0xf) === 0xc) return voice.level & 0xffff;
      if ((addr & 0xf) === 0xe) return voice.repeat >> 3;
      return this.regs[addr >> 1];
    }
    switch (addr) {
      case 0x19c: return this.endx & 0xffff;
      case 0x19e: return (this.endx >> 16) & 0xff;
      case 0x1ae: return this.ctrl & 0x3f; // STATX: mode mirrors ATTR, transfers complete at once
      case 0x1b8: return this.mainL.level & 0xffff;
      case 0x1ba: return this.mainR.level & 0xffff;
      default:
        if (addr >= 0x200 && addr < 0x260) { const v = this.voices[(addr - 0x200) >> 2]; return ((addr & 2) ? v.volR.level : v.volL.level) & 0xffff; }
        return this.regs[addr >> 1];
    }
  }

  fifoWrite(v) { this.ram[this.transferCur] = v & 0xff; this.ram[this.transferCur + 1] = v >> 8; this.transferCur = (this.transferCur + 2) & (RAM - 1); }
  // DMA4 write of a block of bytes at the current transfer address.
  dmaWrite(bytes) { for (let i = 0; i < bytes.length; i++) { this.ram[this.transferCur] = bytes[i]; this.transferCur = (this.transferCur + 1) & (RAM - 1); } }
  dmaRead(n) { const out = new Uint8Array(n); for (let i = 0; i < n; i++) { out[i] = this.ram[this.transferCur]; this.transferCur = (this.transferCur + 1) & (RAM - 1); } return out; }

  keyOn(mask, base) {
    for (let i = 0; i < 16; i++) if (mask & (1 << i)) {
      const n = base + i; if (n >= 24) break;
      const v = this.voices[n];
      v.addr = v.start; v.counter = 0; v.hist = [0, 0]; v.block.fill(0);
      v.level = 0; v.enterPhase(PHASE_ATTACK);
      v.ignoreRepeatWrite = false;
      this.endx &= ~(1 << n);
      this.decodeBlock(v, n);
    }
  }
  keyOff(mask, base) {
    for (let i = 0; i < 16; i++) if (mask & (1 << i)) {
      const n = base + i; if (n >= 24) break;
      const v = this.voices[n];
      if (v.phase !== PHASE_OFF) v.enterPhase(PHASE_RELEASE);
    }
  }

  // Decode the 16-byte block at v.addr into v.block[3..30], keeping the last 3 samples
  // of the previous block in v.block[0..2] for interpolation.
  decodeBlock(v, n) {
    const b = this.ram, a = v.addr & (RAM - 1);
    v.block[0] = v.block[28]; v.block[1] = v.block[29]; v.block[2] = v.block[30];
    const shift = b[a] & 0xf, filter = Math.min(4, (b[a] >> 4) & 7);
    const [f0, f1] = FILTER[filter];
    const sh = shift > 12 ? 9 : shift; // shift 13-15 behave like 9
    let [h0, h1] = v.hist;
    for (let i = 0; i < 28; i++) {
      const byte = b[(a + 2 + (i >> 1)) & (RAM - 1)];
      const nib = (i & 1) ? byte >> 4 : byte & 0xf;
      let s = ((nib << 28) >> 28) << 12 >> sh;
      s += (h0 * f0 + h1 * f1 + 32) >> 6;
      s = clamp16(s);
      h1 = h0; h0 = s;
      v.block[3 + i] = s;
    }
    v.hist = [h0, h1];
    v.flags = b[(a + 1) & (RAM - 1)];
    if ((v.flags & 4) && !v.ignoreRepeatWrite) v.repeat = a;
  }

  // ---- one 44.1 kHz sample ------------------------------------------------------
  tick() {
    let dryL = 0, dryR = 0, revL = 0, revR = 0;
    this.tickNoise();
    for (let n = 0; n < 24; n++) {
      const v = this.voices[n];
      if (v.phase === PHASE_OFF && v.level === 0) { v.out = 0; v.volL.tick(); v.volR.tick(); continue; }
      // sample
      let s;
      if (this.non & (1 << n)) s = s16(this.noiseLevel);
      else {
        const idx = v.counter >> 12, i = (v.counter >> 4) & 0xff, p = v.block;
        s = (GAUSS[0xff - i] * p[idx]) >> 15;
        s += (GAUSS[0x1ff - i] * p[idx + 1]) >> 15;
        s += (GAUSS[0x100 + i] * p[idx + 2]) >> 15;
        s += (GAUSS[i] * p[idx + 3]) >> 15;
      }
      s = (s * v.level) >> 15;
      v.out = s;
      const l = (s * v.volL.level) >> 15, r = (s * v.volR.level) >> 15;
      dryL += l; dryR += r;
      if (this.eon & (1 << n)) { revL += l; revR += r; }
      // pitch
      let step = v.pitch;
      if (n > 0 && (this.pmon & (1 << n))) {
        const factor = this.voices[n - 1].out + 0x8000;
        step = ((s16(step) * factor) >> 15) & 0xffff;
      }
      if (step > 0x3fff) step = 0x4000;
      v.counter += step;
      while (v.counter >= 28 << 12) {
        v.counter -= 28 << 12;
        // finished the block at v.addr: apply its loop flags
        if (v.flags & 1) {
          this.endx |= 1 << n;
          v.addr = v.repeat;
          if (!(v.flags & 2) && !(this.non & (1 << n))) { v.phase = PHASE_OFF; v.level = 0; }
        } else v.addr = (v.addr + 16) & (RAM - 1);
        this.decodeBlock(v, n);
      }
      v.tickEnvelope();
      v.volL.tick(); v.volR.tick();
    }
    // CD/XA input
    let cdL = 0, cdR = 0;
    if (this.cdQueue.length && (this.ctrl & 1)) {
      const [a, b] = this.cdQueue.shift();
      cdL = (a * this.cdVolL) >> 15; cdR = (b * this.cdVolR) >> 15;
      dryL += cdL; dryR += cdR;
      if (this.ctrl & 4) { revL += cdL; revR += cdR; }
    } else if (this.cdQueue.length) this.cdQueue.shift();
    const [ol, or] = this.reverb(clamp16(revL), clamp16(revR));
    this.mainL.tick(); this.mainR.tick();
    if (!(this.ctrl & 0x4000)) return [0, 0]; // muted
    const L = clamp16((clamp16(dryL + ol) * this.mainL.level) >> 15);
    const R = clamp16((clamp16(dryR + or) * this.mainR.level) >> 15);
    return [L, R];
  }

  render(n) {
    const out = new Int16Array(n * 2);
    for (let i = 0; i < n; i++) { const [l, r] = this.tick(); out[2 * i] = l; out[2 * i + 1] = r; }
    return out;
  }

  pushCd(l, r) { this.cdQueue.push([l, r]); }

  tickNoise() {
    const shift = (this.ctrl >> 10) & 0xf, step = ((this.ctrl >> 8) & 3) + 4;
    this.noiseTimer -= step;
    const lv = this.noiseLevel;
    const parity = ((lv >> 15) ^ (lv >> 12) ^ (lv >> 11) ^ (lv >> 10) ^ 1) & 1;
    if (this.noiseTimer < 0) { this.noiseLevel = ((lv << 1) | parity) & 0xffff; this.noiseTimer += 0x20000 >> shift; }
    if (this.noiseTimer < 0) this.noiseTimer += 0x20000 >> shift;
  }

  // ---- reverb (22.05 kHz, resampled with the 39-tap FIR) ------------------------
  rr(off) { // read 16-bit sample at current buffer + off*8 bytes... off already in bytes
    let a = this.revCur + off;
    const size = RAM - this.revBase;
    if (size <= 0) return 0;
    while (a >= RAM) a -= size;
    while (a < this.revBase) a += size;
    return s16(this.ram[a] | (this.ram[a + 1] << 8));
  }
  rw(off, v) {
    if (!(this.ctrl & 0x80)) return; // master reverb disable stops writes
    let a = this.revCur + off;
    const size = RAM - this.revBase;
    if (size <= 0) return;
    while (a >= RAM) a -= size;
    while (a < this.revBase) a += size;
    v = clamp16(v); this.ram[a] = v & 0xff; this.ram[a + 1] = (v >> 8) & 0xff;
  }

  reverb(inL, inR) {
    const p = this.revInPos = (this.revInPos + 1) & 63;
    this.revInL[p] = inL; this.revInR[p] = inR;
    this.odd = !this.odd;
    if (this.odd) {
      const L = fir(this.revInL, p, 15), R = fir(this.revInR, p, 15);
      const [yl, yr] = this.reverbStep(L, R);
      this.pushRevOut(yl, yr);
    } else this.pushRevOut(0, 0);
    const q = this.revOutPos;
    return [(fir(this.revOutHistL, q, 14) * this.revOutL) >> 15, (fir(this.revOutHistR, q, 14) * this.revOutR) >> 15];
  }
  pushRevOut(l, r) { const q = this.revOutPos = (this.revOutPos + 1) & 63; this.revOutHistL[q] = l; this.revOutHistR[q] = r; }

  reverbStep(Lin0, Rin0) {
    const r = this.rev, A = (i) => (r[i] & 0xffff) << 3, V = (i) => s16(r[i]);
    const dAPF1 = A(0), dAPF2 = A(1), vIIR = V(2), vCOMB1 = V(3), vCOMB2 = V(4), vCOMB3 = V(5), vCOMB4 = V(6), vWALL = V(7), vAPF1 = V(8), vAPF2 = V(9);
    const mLSAME = A(10), mRSAME = A(11), mLCOMB1 = A(12), mRCOMB1 = A(13), mLCOMB2 = A(14), mRCOMB2 = A(15), dLSAME = A(16), dRSAME = A(17);
    const mLDIFF = A(18), mRDIFF = A(19), mLCOMB3 = A(20), mRCOMB3 = A(21), mLCOMB4 = A(22), mRCOMB4 = A(23), dLDIFF = A(24), dRDIFF = A(25);
    const mLAPF1 = A(26), mRAPF1 = A(27), mLAPF2 = A(28), mRAPF2 = A(29), vLIN = V(30), vRIN = V(31);
    const m = (a, b) => (a * b) >> 15;
    const Lin = m(vLIN, Lin0), Rin = m(vRIN, Rin0);
    if (this.ctrl & 0x80) {
      this.rw(mLSAME, m(Lin + m(this.rr(dLSAME), vWALL) - this.rr(mLSAME - 2), vIIR) + this.rr(mLSAME - 2));
      this.rw(mRSAME, m(Rin + m(this.rr(dRSAME), vWALL) - this.rr(mRSAME - 2), vIIR) + this.rr(mRSAME - 2));
      this.rw(mLDIFF, m(Lin + m(this.rr(dRDIFF), vWALL) - this.rr(mLDIFF - 2), vIIR) + this.rr(mLDIFF - 2));
      this.rw(mRDIFF, m(Rin + m(this.rr(dLDIFF), vWALL) - this.rr(mRDIFF - 2), vIIR) + this.rr(mRDIFF - 2));
    }
    let Lout = m(vCOMB1, this.rr(mLCOMB1)) + m(vCOMB2, this.rr(mLCOMB2)) + m(vCOMB3, this.rr(mLCOMB3)) + m(vCOMB4, this.rr(mLCOMB4));
    let Rout = m(vCOMB1, this.rr(mRCOMB1)) + m(vCOMB2, this.rr(mRCOMB2)) + m(vCOMB3, this.rr(mRCOMB3)) + m(vCOMB4, this.rr(mRCOMB4));
    Lout = clamp16(Lout); Rout = clamp16(Rout);
    let t = this.rr(mLAPF1 - dAPF1); Lout = clamp16(Lout - m(vAPF1, t)); this.rw(mLAPF1, Lout); Lout = clamp16(m(Lout, vAPF1) + t);
    t = this.rr(mRAPF1 - dAPF1); Rout = clamp16(Rout - m(vAPF1, t)); this.rw(mRAPF1, Rout); Rout = clamp16(m(Rout, vAPF1) + t);
    t = this.rr(mLAPF2 - dAPF2); Lout = clamp16(Lout - m(vAPF2, t)); this.rw(mLAPF2, Lout); Lout = clamp16(m(Lout, vAPF2) + t);
    t = this.rr(mRAPF2 - dAPF2); Rout = clamp16(Rout - m(vAPF2, t)); this.rw(mRAPF2, Rout); Rout = clamp16(m(Rout, vAPF2) + t);
    // advance buffer address
    let next = (this.revCur + 2) & 0x7fffe;
    if (next < this.revBase) next = this.revBase;
    this.revCur = Math.max(this.revBase, next);
    return [Lout, Rout];
  }
}

// 39-tap resampling FIR (psx-spx "Reverb Buffer Resampling")
const FIR = [-1, 0, 2, 0, -10, 0, 35, 0, -103, 0, 266, 0, -616, 0, 1332, 0, -2960, 0, 10246, 16384, 10246, 0, -2960, 0, 1332, 0, -616, 0, 266, 0, -103, 0, 35, 0, -10, 0, 2, 0, -1];
function fir(hist, pos, shift) {
  let acc = 0;
  for (let k = 0; k < 39; k++) acc += FIR[k] * hist[(pos - k) & 63];
  return clamp16(acc >> shift);
}
