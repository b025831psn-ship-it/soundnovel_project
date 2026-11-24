// S-DSP: 8 BRR voices, ADSR/GAIN envelopes, gaussian interpolation, noise, pitch
// modulation, echo with 8-tap FIR. One stereo sample per 32 SPC700 clocks (32 kHz).
// Runs at sample granularity: register reads/writes take effect on the next sample,
// not at the per-voice clock phase inside a sample.
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

// Global register addresses.
const R = { MVOLL: 0x0c, MVOLR: 0x1c, EVOLL: 0x2c, EVOLR: 0x3c, KON: 0x4c, KOFF: 0x5c, FLG: 0x6c, ENDX: 0x7c,
  EFB: 0x0d, PMON: 0x2d, NON: 0x3d, EON: 0x4d, DIR: 0x5d, ESA: 0x6d, EDL: 0x7d };

class Voice {
  constructor(i) {
    this.i = i; this.bit = 1 << i; this.base = i << 4;
    this.buf = new Int32Array(12); this.bufPos = 0; // ring of decoded samples
    this.brrAddr = 0; this.brrOffset = 1; this.interp = 0;
    this.env = 0; this.hidden = 0; this.mode = RELEASE; this.konDelay = 0; this.out = 0;
  }
}

export class SDSP {
  constructor(aram, { gauss = null } = {}) {
    this.ram = aram;
    this.regs = new Uint8Array(128);
    this.gauss = gauss ? Int16Array.from(gauss) : null;
    if (this.gauss && this.gauss.length !== 512) throw new Error('gaussian table must have 512 entries');
    this.voices = Array.from({ length: 8 }, (_, i) => new Voice(i));
    this.phase = 0; this.counter = 0; this.everyOther = 0; this.kon = 0; this.newKon = 0; this.koff = 0;
    this.noise = 0x4000; this.echoPos = 0; this.echoLen = 4; this.echoBase = 0;
    this.hist = [new Int32Array(8), new Int32Array(8)];
    this.regs[R.FLG] = 0xe0;
    this.onSample = null; // (left, right)
  }

  read(addr) { return this.regs[addr & 0x7f]; }

  write(addr, value) {
    this.regs[addr] = value;
    if (addr === R.KON) this.newKon = value;
    else if (addr === R.ENDX) this.regs[R.ENDX] = 0;
  }

  tick(clocks) {
    this.phase += clocks;
    while (this.phase >= 32) { this.phase -= 32; this.sample(); }
  }

  readCounter(rate) { return ((this.counter + OFFSETS[rate]) % RATES[rate]) !== 0; }

  envelope(v) {
    let env = v.env;
    if (v.mode === RELEASE) { env -= 8; if (env < 0) env = 0; v.env = env; return; }
    const adsr0 = this.regs[v.base | 5];
    let data = this.regs[v.base | 6]; let rate;
    if (adsr0 & 0x80) {
      if (v.mode >= DECAY) {
        env--; env -= env >> 8; rate = data & 0x1f;
        if (v.mode === DECAY) rate = ((adsr0 >> 3) & 0x0e) + 0x10;
      } else { rate = (adsr0 & 0x0f) * 2 + 1; env += rate < 31 ? 0x20 : 0x400; }
    } else {
      data = this.regs[v.base | 7]; const mode = data >> 5;
      if (mode < 4) { env = data * 0x10; rate = 31; } else {
        rate = data & 0x1f;
        if (mode === 4) env -= 0x20;
        else if (mode < 6) { env--; env -= env >> 8; }
        else { env += 0x20; if (mode > 6 && v.hidden >= 0x600) env += 0x8 - 0x20; }
      }
    }
    if ((env >> 8) === (data >> 5) && v.mode === DECAY) v.mode = SUSTAIN;
    v.hidden = env;
    if (env < 0 || env > 0x7ff) { env = env < 0 ? 0 : 0x7ff; if (v.mode === ATTACK) v.mode = DECAY; }
    if (!this.readCounter(rate)) v.env = env;
  }

  // Decodes the next 4 samples of the current BRR block into the voice ring.
  decodeBrr(v) {
    const header = this.ram[v.brrAddr];
    const shift = header >> 4, filter = header & 0x0c;
    for (let k = 0; k < 2; k++) {
      const byte = this.ram[(v.brrAddr + v.brrOffset + k) & 0xffff];
      for (const nib of [byte >> 4, byte & 0x0f]) {
        let s = (nib << 28) >> 28;
        s = (s << shift) >> 1;
        if (shift >= 0x0d) s = (s >> 25) << 11;
        const p1 = v.buf[(v.bufPos + 11) % 12];
        const p2 = v.buf[(v.bufPos + 10) % 12] >> 1;
        if (filter >= 8) {
          s += p1; s -= p2;
          if (filter === 8) { s += p2 >> 4; s += (p1 * -3) >> 6; }
          else { s += (p1 * -13) >> 7; s += (p2 * 3) >> 4; }
        } else if (filter) { s += p1 >> 1; s += (-p1) >> 5; }
        s = s16(clamp16(s) * 2);
        v.buf[v.bufPos] = s; v.bufPos = (v.bufPos + 1) % 12;
      }
    }
    v.brrOffset += 2;
    if (v.brrOffset >= 9) {
      v.brrOffset = 1;
      if (header & 1) {
        this.regs[R.ENDX] |= v.bit;
        const dir = (this.regs[R.DIR] << 8) + this.regs[v.base | 4] * 4;
        v.brrAddr = this.ram[(dir + 2) & 0xffff] | (this.ram[(dir + 3) & 0xffff] << 8);
        if (!(header & 2)) { v.mode = RELEASE; v.env = 0; }
      } else v.brrAddr = (v.brrAddr + 9) & 0xffff;
    }
  }

  interpolate(v) {
    const off = (v.interp >> 4) & 0xff;
    const g = this.gauss; const pos = v.bufPos + (v.interp >> 12);
    const at = (k) => v.buf[(pos + k) % 12];
    let out;
    if (g) {
      out = (g[255 - off] * at(0)) >> 11;
      out += (g[511 - off] * at(1)) >> 11;
      out += (g[256 + off] * at(2)) >> 11;
      out = s16(out);
      out += (g[off] * at(3)) >> 11;
    } else { // linear stand-in for tests without the chip table
      out = (at(1) * (256 - off) + at(2) * off) >> 8;
    }
    return clamp16(out) & ~1;
  }

  sample() {
    const regs = this.regs;
    if (--this.counter < 0) this.counter = COUNTER_RANGE - 1;
    if ((this.everyOther ^= 1)) {
      this.newKon &= ~this.kon; this.kon = this.newKon; this.koff = regs[R.KOFF];
    }
    const flg = regs[R.FLG];
    if (!this.readCounter(flg & 0x1f)) {
      const fb = (this.noise << 13) ^ (this.noise << 14);
      this.noise = (fb & 0x4000) ^ (this.noise >> 1);
    }

    let mainL = 0, mainR = 0, echoL = 0, echoR = 0, prevOut = 0;
    const pmon = regs[R.PMON], non = regs[R.NON], eon = regs[R.EON];
    for (const v of this.voices) {
      let pitch = (regs[v.base | 2] | (regs[v.base | 3] << 8)) & 0x3fff;
      if ((pmon & v.bit) && v.i > 0) pitch += ((prevOut >> 5) * pitch) >> 10;

      if (this.kon & v.bit && v.konDelay === 0) {
        v.konDelay = 5; v.mode = ATTACK; regs[R.ENDX] &= ~v.bit;
      }
      if (v.konDelay) {
        if (v.konDelay === 5) {
          const dir = (regs[R.DIR] << 8) + regs[v.base | 4] * 4;
          v.brrAddr = this.ram[dir & 0xffff] | (this.ram[(dir + 1) & 0xffff] << 8);
          v.brrOffset = 1; v.bufPos = 0; v.buf.fill(0);
        }
        v.env = 0; v.hidden = 0;
        v.interp = (--v.konDelay & 3) ? 0x4000 : 0;
        pitch = 0;
      }

      let out = (non & v.bit) ? s16(this.noise * 2) : this.interpolate(v);
      out = ((out * v.env) >> 11) & ~1;
      v.out = out; prevOut = out;
      regs[v.base | 8] = v.env >> 4;
      regs[v.base | 9] = (out >> 8) & 0xff;

      if ((this.koff & v.bit) || (flg & 0x80)) v.mode = RELEASE;
      if (flg & 0x80) v.env = 0;
      if (!v.konDelay) this.envelope(v);

      const l = (out * s8(regs[v.base | 0])) >> 7;
      const r = (out * s8(regs[v.base | 1])) >> 7;
      mainL = clamp16(mainL + l); mainR = clamp16(mainR + r);
      if (eon & v.bit) { echoL = clamp16(echoL + l); echoR = clamp16(echoR + r); }

      const step = v.interp + pitch;
      v.interp = step > 0x7fff ? 0x7fff : step;
      if (v.interp >= 0x4000) { this.decodeBrr(v); v.interp -= 0x4000; }
    }

    // Echo: read history, FIR, feedback write.
    if (this.echoPos === 0) {
      this.echoBase = regs[R.ESA] << 8;
      this.echoLen = (regs[R.EDL] & 0x0f) ? (regs[R.EDL] & 0x0f) * 0x800 : 4;
    }
    const ea = (this.echoBase + this.echoPos) & 0xffff;
    const rd = (a) => s16(this.ram[a & 0xffff] | (this.ram[(a + 1) & 0xffff] << 8));
    const inEcho = [0, 0];
    for (let ch = 0; ch < 2; ch++) {
      const h = this.hist[ch];
      h.copyWithin(0, 1); h[7] = rd(ea + ch * 2) >> 1;
      let sum = 0;
      for (let t = 0; t < 7; t++) sum += (h[t] * s8(regs[(t << 4) | 0x0f])) >> 6;
      sum = s16(sum);
      sum += (h[7] * s8(regs[0x7f])) >> 6;
      inEcho[ch] = clamp16(sum) & ~1;
    }
    let outL = clamp16(((mainL * s8(regs[R.MVOLL])) >> 7) + ((inEcho[0] * s8(regs[R.EVOLL])) >> 7));
    let outR = clamp16(((mainR * s8(regs[R.MVOLR])) >> 7) + ((inEcho[1] * s8(regs[R.EVOLR])) >> 7));
    if (!(flg & 0x20)) {
      const efb = s8(regs[R.EFB]);
      const wl = clamp16(echoL + s16((inEcho[0] * efb) >> 7)) & ~1;
      const wr = clamp16(echoR + s16((inEcho[1] * efb) >> 7)) & ~1;
      this.ram[ea & 0xffff] = wl & 0xff; this.ram[(ea + 1) & 0xffff] = (wl >> 8) & 0xff;
      this.ram[(ea + 2) & 0xffff] = wr & 0xff; this.ram[(ea + 3) & 0xffff] = (wr >> 8) & 0xff;
    }
    this.echoPos += 4; if (this.echoPos >= this.echoLen) this.echoPos = 0;
    if (flg & 0x40) { outL = 0; outR = 0; }
    if (this.onSample) this.onSample(outL, outR);
  }
}

export { R as DSP_REGS };
