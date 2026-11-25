// S-DSP at clock granularity: each sample is 32 phases, one per SPC700 clock, and every
// voice and echo step runs at its hardware phase. Register writes land between phases, so
// a write is seen by exactly the steps that read that register after it.
// The 512-entry gaussian table is chip data and is passed in, not shipped here.

const RATES = Int32Array.from([0x7800, 2048, 1536, 1280, 1024, 768, 640, 512, 384, 320, 256, 192, 160, 128, 96, 80,
  64, 48, 40, 32, 24, 20, 16, 12, 10, 8, 6, 5, 4, 3, 2, 1]);
const OFFSETS = Int32Array.from([1, 0, 1040, 536, 0, 1040, 536, 0, 1040, 536, 0, 1040, 536, 0, 1040, 536,
  0, 1040, 536, 0, 1040, 536, 0, 1040, 536, 0, 1040, 536, 0, 1040, 0, 0]);
const COUNTER_RANGE = 0x7800;

const RELEASE = 0, ATTACK = 1, DECAY = 2, SUSTAIN = 3;
const clamp16 = (v) => (v > 32767 ? 32767 : v < -32768 ? -32768 : v);
const s16 = (v) => (v << 16) >> 16;
const s8 = (v) => (v << 24) >> 24;

const R = { MVOLL: 0x0c, MVOLR: 0x1c, EVOLL: 0x2c, EVOLR: 0x3c, KON: 0x4c, KOFF: 0x5c, FLG: 0x6c, ENDX: 0x7c,
  EFB: 0x0d, PMON: 0x2d, NON: 0x3d, EON: 0x4d, DIR: 0x5d, ESA: 0x6d, EDL: 0x7d };

class Voice {
  constructor(i) {
    this.i = i; this.bit = 1 << i; this.base = i << 4;
    this.buf = new Int32Array(24); this.bufPos = 0; // 12 samples, second copy for wrap-around
    this.brrAddr = 0; this.brrOffset = 1; this.interp = 0;
    this.env = 0; this.hidden = 0; this.mode = RELEASE; this.konDelay = 0; this.envxOut = 0;
  }
}

export class SDSP {
  constructor(aram, { gauss = null, phase = 0 } = {}) {
    this.ram = aram;
    this.regs = new Uint8Array(128);
    this.gauss = gauss ? Int16Array.from(gauss) : null;
    if (this.gauss && this.gauss.length !== 512) throw new Error('gaussian table must have 512 entries');
    this.v = Array.from({ length: 8 }, (_, i) => new Voice(i));
    this.phase = phase & 31;
    this.counter = 0; this.everyOther = 1; this.kon = 0; this.newKon = 0; this.tKoff = 0;
    this.noise = 0x4000;
    // per-sample latches
    this.tDir = 0; this.tDirAddr = 0; this.tSrcn = 0; this.tPitch = 0; this.tAdsr0 = 0;
    this.tBrrNext = 0; this.tBrrByte = 0; this.tBrrHeader = 0; this.tOutput = 0; this.tLooped = 0;
    this.tPmon = 0; this.tNon = 0; this.tEon = 0; this.tEsa = 0; this.tEchoEnabled = 0;
    this.endxBuf = 0; this.outxBuf = 0; this.envxBuf = 0;
    this.mainOut = [0, 0]; this.echoOut = [0, 0]; this.echoIn = [0, 0];
    this.echoOffset = 0; this.echoLength = 0; this.echoPtr = 0;
    this.hist = [new Int32Array(16), new Int32Array(16)]; this.histPos = 0;
    this.regs[R.FLG] = 0xe0;
    this.onSample = null; // (left, right)
  }

  read(addr) { return this.regs[addr & 0x7f]; }

  write(addr, value) {
    this.regs[addr] = value;
    switch (addr & 0x0f) {
      case 0x08: this.envxBuf = value; break;
      case 0x09: this.outxBuf = value; break;
      case 0x0c:
        if (addr === R.KON) this.newKon = value;
        if (addr === R.ENDX) { this.endxBuf = 0; this.regs[R.ENDX] = 0; }
        break;
    }
  }

  tick(clocks) { for (let i = 0; i < clocks; i++) this.step(); }
  sample() { this.tick(32); }
  get voices() { return this.v; }

  readCounter(rate) { return ((this.counter + OFFSETS[rate]) % RATES[rate]) !== 0; }

  envelope(v) {
    let env = v.env;
    if (v.mode === RELEASE) { env -= 8; if (env < 0) env = 0; v.env = env; return; }
    let data = this.regs[v.base | 6]; let rate;
    if (this.tAdsr0 & 0x80) {
      if (v.mode >= DECAY) {
        env--; env -= env >> 8; rate = data & 0x1f;
        if (v.mode === DECAY) rate = ((this.tAdsr0 >> 3) & 0x0e) + 0x10;
      } else { rate = (this.tAdsr0 & 0x0f) * 2 + 1; env += rate < 31 ? 0x20 : 0x400; }
    } else {
      data = this.regs[v.base | 7]; const mode = data >> 5;
      if (mode < 4) { env = data * 0x10; rate = 31; } else {
        rate = data & 0x1f;
        if (mode === 4) env -= 0x20;
        else if (mode < 6) { env--; env -= env >> 8; }
        else { env += 0x20; if (mode > 6 && (v.hidden >>> 0) >= 0x600) env += 0x8 - 0x20; }
      }
    }
    if ((env >> 8) === (data >> 5) && v.mode === DECAY) v.mode = SUSTAIN;
    v.hidden = env;
    if (env < 0 || env > 0x7ff) { env = env < 0 ? 0 : 0x7ff; if (v.mode === ATTACK) v.mode = DECAY; }
    if (!this.readCounter(rate)) v.env = env;
  }

  decodeBrr(v) {
    let nybbles = (this.tBrrByte << 8) | this.ram[(v.brrAddr + v.brrOffset + 1) & 0xffff];
    const header = this.tBrrHeader, shift = header >> 4, filter = header & 0x0c;
    let pos = v.bufPos;
    v.bufPos += 4; if (v.bufPos >= 12) v.bufPos = 0;
    for (let k = 0; k < 4; k++, pos++, nybbles <<= 4) {
      let s = s16(nybbles) >> 12;
      s = (s << shift) >> 1;
      if (shift >= 0x0d) s = (s >> 25) << 11;
      const p1 = v.buf[pos + 11], p2 = v.buf[pos + 10] >> 1;
      if (filter >= 8) {
        s += p1; s -= p2;
        if (filter === 8) { s += p2 >> 4; s += (p1 * -3) >> 6; }
        else { s += (p1 * -13) >> 7; s += (p2 * 3) >> 4; }
      } else if (filter) { s += p1 >> 1; s += (-p1) >> 5; }
      s = s16(clamp16(s) * 2);
      v.buf[pos + 12] = s; v.buf[pos] = s;
    }
  }

  interpolate(v) {
    const off = (v.interp >> 4) & 0xff;
    const p = (v.interp >> 12) + v.bufPos; const b = v.buf; const g = this.gauss;
    let out;
    if (g) {
      out = (g[255 - off] * b[p]) >> 11;
      out += (g[511 - off] * b[p + 1]) >> 11;
      out += (g[256 + off] * b[p + 2]) >> 11;
      out = s16(out);
      out += (g[off] * b[p + 3]) >> 11;
    } else { // linear stand-in for tests without the chip table
      out = (b[p + 1] * (256 - off) + b[p + 2] * off) >> 8;
    }
    return clamp16(out) & ~1;
  }

  // ---- voice steps ----
  V1(v) { this.tDirAddr = (this.tDir * 0x100 + this.tSrcn * 4) & 0xffff; this.tSrcn = this.regs[v.base | 4]; }
  V2(v) {
    let e = this.tDirAddr; if (!v.konDelay) e += 2;
    this.tBrrNext = this.ram[e & 0xffff] | (this.ram[(e + 1) & 0xffff] << 8);
    this.tAdsr0 = this.regs[v.base | 5];
    this.tPitch = this.regs[v.base | 2];
  }
  V3a(v) { this.tPitch += (this.regs[v.base | 3] & 0x3f) << 8; }
  V3b(v) {
    this.tBrrByte = this.ram[(v.brrAddr + v.brrOffset) & 0xffff];
    this.tBrrHeader = this.ram[v.brrAddr];
  }
  V3c(v) {
    if (this.tPmon & v.bit) this.tPitch += ((this.tOutput >> 5) * this.tPitch) >> 10;
    if (v.konDelay) {
      if (v.konDelay === 5) { v.brrAddr = this.tBrrNext; v.brrOffset = 1; v.bufPos = 0; this.tBrrHeader = 0; }
      v.env = 0; v.hidden = 0;
      v.interp = 0;
      if (--v.konDelay & 3) v.interp = 0x4000;
      this.tPitch = 0;
    }
    let output = this.interpolate(v);
    if (this.tNon & v.bit) output = s16(this.noise * 2);
    this.tOutput = ((output * v.env) >> 11) & ~1;
    v.envxOut = (v.env >> 4) & 0xff;
    if ((this.regs[R.FLG] & 0x80) || (this.tBrrHeader & 3) === 1) { v.mode = RELEASE; v.env = 0; }
    if (this.everyOther) {
      if (this.tKoff & v.bit) v.mode = RELEASE;
      if (this.kon & v.bit) { v.konDelay = 5; v.mode = ATTACK; }
    }
    if (!v.konDelay) this.envelope(v);
  }
  V3(v) { this.V3a(v); this.V3b(v); this.V3c(v); }
  output(v, ch) {
    const amp = (this.tOutput * s8(this.regs[v.base | ch])) >> 7;
    this.mainOut[ch] = clamp16(this.mainOut[ch] + amp);
    if (this.tEon & v.bit) this.echoOut[ch] = clamp16(this.echoOut[ch] + amp);
  }
  V4(v) {
    this.tLooped = 0;
    if (v.interp >= 0x4000) {
      this.decodeBrr(v);
      if ((v.brrOffset += 2) >= 9) {
        v.brrAddr = (v.brrAddr + 9) & 0xffff;
        if (this.tBrrHeader & 1) { v.brrAddr = this.tBrrNext; this.tLooped = v.bit; }
        v.brrOffset = 1;
      }
    }
    v.interp = (v.interp & 0x3fff) + this.tPitch;
    if (v.interp > 0x7fff) v.interp = 0x7fff;
    this.output(v, 0);
  }
  V5(v) {
    this.output(v, 1);
    let endx = this.regs[R.ENDX] | this.tLooped;
    if (v.konDelay === 5) endx &= ~v.bit;
    this.endxBuf = endx & 0xff;
  }
  V6() { this.outxBuf = (this.tOutput >> 8) & 0xff; }
  V7(v) { this.regs[R.ENDX] = this.endxBuf; this.envxBuf = v.envxOut; }
  V8(v) { this.regs[v.base | 9] = this.outxBuf; }
  V9(v) { this.regs[v.base | 8] = this.envxBuf; }
  V7_V4_V1(i) { this.V7(this.v[i]); this.V4(this.v[(i + 1) & 7]); this.V1(this.v[(i + 3) & 7]); }
  V8_V5_V2(i) { this.V8(this.v[i]); this.V5(this.v[(i + 1) & 7]); this.V2(this.v[(i + 2) & 7]); }
  V9_V6_V3(i) { this.V9(this.v[i]); this.V6(this.v[(i + 1) & 7]); this.V3(this.v[(i + 2) & 7]); }

  // ---- echo ----
  fir(i, ch) { return (this.hist[ch][this.histPos + i + 1] * s8(this.regs[(i << 4) | 0x0f])) >> 6; }
  echoRead(ch) {
    const a = (this.echoPtr + ch * 2) & 0xffff;
    const s = s16(this.ram[a] | (this.ram[(a + 1) & 0xffff] << 8));
    this.hist[ch][this.histPos] = s >> 1; this.hist[ch][this.histPos + 8] = s >> 1;
  }
  echoOutput(ch) {
    const out = s16((this.mainOut[ch] * s8(this.regs[R.MVOLL + ch * 0x10])) >> 7)
      + s16((this.echoIn[ch] * s8(this.regs[R.EVOLL + ch * 0x10])) >> 7);
    return clamp16(out);
  }
  echoWrite(ch) {
    if (!(this.tEchoEnabled & 0x20)) {
      const a = (this.echoPtr + ch * 2) & 0xffff, v = this.echoOut[ch];
      this.ram[a] = v & 0xff; this.ram[(a + 1) & 0xffff] = (v >> 8) & 0xff;
    }
    this.echoOut[ch] = 0;
  }
  echo22() {
    if (++this.histPos >= 8) this.histPos = 0;
    this.echoPtr = (this.tEsa * 0x100 + this.echoOffset) & 0xffff;
    this.echoRead(0);
    this.echoIn[0] = this.fir(0, 0); this.echoIn[1] = this.fir(0, 1);
  }
  echo23() {
    this.echoIn[0] += this.fir(1, 0) + this.fir(2, 0); this.echoIn[1] += this.fir(1, 1) + this.fir(2, 1);
    this.echoRead(1);
  }
  echo24() {
    this.echoIn[0] += this.fir(3, 0) + this.fir(4, 0) + this.fir(5, 0);
    this.echoIn[1] += this.fir(3, 1) + this.fir(4, 1) + this.fir(5, 1);
  }
  echo25() {
    let l = s16(this.echoIn[0] + this.fir(6, 0)), r = s16(this.echoIn[1] + this.fir(6, 1));
    l += s16(this.fir(7, 0)); r += s16(this.fir(7, 1));
    this.echoIn[0] = clamp16(l) & ~1; this.echoIn[1] = clamp16(r) & ~1;
  }
  echo26() {
    this.mainOut[0] = this.echoOutput(0);
    const efb = s8(this.regs[R.EFB]);
    const l = clamp16(this.echoOut[0] + s16((this.echoIn[0] * efb) >> 7));
    const r = clamp16(this.echoOut[1] + s16((this.echoIn[1] * efb) >> 7));
    this.echoOut[0] = l & ~1; this.echoOut[1] = r & ~1;
  }
  echo27() {
    let l = this.mainOut[0], r = this.echoOutput(1);
    this.mainOut[0] = 0; this.mainOut[1] = 0;
    if (this.regs[R.FLG] & 0x40) { l = 0; r = 0; }
    if (this.onSample) this.onSample(l, r);
  }
  echo28() { this.tEchoEnabled = this.regs[R.FLG]; }
  echo29() {
    this.tEsa = this.regs[R.ESA];
    if (!this.echoOffset) this.echoLength = (this.regs[R.EDL] & 0x0f) * 0x800;
    this.echoOffset += 4;
    if (this.echoOffset >= this.echoLength) this.echoOffset = 0;
    this.echoWrite(0);
    this.tEchoEnabled = this.regs[R.FLG];
  }
  echo30() { this.echoWrite(1); }

  // ---- misc ----
  misc27() { this.tPmon = this.regs[R.PMON] & 0xfe; }
  misc28() { this.tNon = this.regs[R.NON]; this.tEon = this.regs[R.EON]; this.tDir = this.regs[R.DIR]; }
  misc29() { if ((this.everyOther ^= 1)) this.newKon &= ~this.kon; }
  misc30() {
    if (this.everyOther) { this.kon = this.newKon; this.tKoff = this.regs[R.KOFF]; }
    if (--this.counter < 0) this.counter = COUNTER_RANGE - 1;
    if (!this.readCounter(this.regs[R.FLG] & 0x1f)) {
      const fb = (this.noise << 13) ^ (this.noise << 14);
      this.noise = (fb & 0x4000) ^ (this.noise >> 1);
    }
  }

  step() {
    const v = this.v;
    switch (this.phase) {
      case 0: this.V5(v[0]); this.V2(v[1]); break;
      case 1: this.V6(v[0]); this.V3(v[1]); break;
      case 2: this.V7_V4_V1(0); break;
      case 3: this.V8_V5_V2(0); break;
      case 4: this.V9_V6_V3(0); break;
      case 5: this.V7_V4_V1(1); break;
      case 6: this.V8_V5_V2(1); break;
      case 7: this.V9_V6_V3(1); break;
      case 8: this.V7_V4_V1(2); break;
      case 9: this.V8_V5_V2(2); break;
      case 10: this.V9_V6_V3(2); break;
      case 11: this.V7_V4_V1(3); break;
      case 12: this.V8_V5_V2(3); break;
      case 13: this.V9_V6_V3(3); break;
      case 14: this.V7_V4_V1(4); break;
      case 15: this.V8_V5_V2(4); break;
      case 16: this.V9_V6_V3(4); break;
      case 17: this.V1(v[0]); this.V7(v[5]); this.V4(v[6]); break;
      case 18: this.V8_V5_V2(5); break;
      case 19: this.V9_V6_V3(5); break;
      case 20: this.V1(v[1]); this.V7(v[6]); this.V4(v[7]); break;
      case 21: this.V8(v[6]); this.V5(v[7]); this.V2(v[0]); break;
      case 22: this.V3a(v[0]); this.V9(v[6]); this.V6(v[7]); this.echo22(); break;
      case 23: this.V7(v[7]); this.echo23(); break;
      case 24: this.V8(v[7]); this.echo24(); break;
      case 25: this.V3b(v[0]); this.V9(v[7]); this.echo25(); break;
      case 26: this.echo26(); break;
      case 27: this.misc27(); this.echo27(); break;
      case 28: this.misc28(); this.echo28(); break;
      case 29: this.misc29(); this.echo29(); break;
      case 30: this.misc30(); this.V3c(v[0]); this.echo30(); break;
      case 31: this.V4(v[0]); this.V1(v[2]); break;
    }
    this.phase = (this.phase + 1) & 31;
  }
}

export { R as DSP_REGS };
