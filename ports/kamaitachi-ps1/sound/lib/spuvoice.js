// libspu voice side: SpuSetVoiceAttr, SpuSetKey, the voice bit setters and envelope read.
// Port of SLPS_017.94 0x80061968, 0x80061ff4, 0x8005f198, 0x800611a8, 0x800600a8, 0x800622b8.
export const SPU_REGS = 0x80078cb0; // pointer to 0x1f801c00
export const SPU_DEFER = 0x80078c9c; // bit 0: write bit registers to the shadow below instead
export const SPU_BITS_SHADOW = 0x801d5728;
export const SPU_KEY_SHADOW = 0x801d58b0;
export const SPU_DIRTY = 0x80078868;
export const SPU_KEYS_ON = 0x8007883c; // voices keyed on (cleared by key off)
export const SPU_KEYS_DEFER = 0x80078864;
export const SPU_SAMPLE_NOTE = 0x8007886c; // u16 per voice
export const SPU_ALIGN_ON = 0x80078cd4, SPU_ALIGN = 0x80078cdc, SPU_ALIGN_MASK = 0x80078ce0, SPU_ADDR_SHIFT = 0x80078cd8;

export const SpuVoice = {
  reg(i) { return (this.lw(SPU_REGS) + i * 2) | 0; },

  // 0x800622b8
  SpuGetVoiceEnvelope(v, out) { this.sh(out, this.lhu(this.lw(SPU_REGS) + v * 16 + 0xc)); },

  // 0x8005f198: SPU address -> register units; idx -2 returns the aligned address,
  // -1 returns the register value, else it is stored at register idx.
  spuAddrReg(idx, addr) {
    if (this.lw(SPU_ALIGN_ON) !== 0) {
      const al = this.lw(SPU_ALIGN);
      if ((addr >>> 0) % (al >>> 0) !== 0) addr = ((addr + al) & ~this.lw(SPU_ALIGN_MASK)) | 0;
    }
    const r = (addr >>> this.lw(SPU_ADDR_SHIFT)) | 0;
    if (idx === -2) return addr;
    if (idx === -1) return r & 0xffff;
    this.sh(this.reg(idx), r);
    return addr;
  },

  // 0x800600a8: set (1), clear (0) or replace (8) voice bits in a lo/hi register pair.
  spuVoiceBits(op, bits, lo, hi) {
    const defer = this.lw(SPU_DEFER) & 1;
    const base = defer ? SPU_BITS_SHADOW : this.lw(SPU_REGS);
    let cur = this.lhu(base + hi * 2);
    cur = this.lhu(base + lo * 2) | ((cur & 0xff) << 16);
    const mark = () => this.sw(SPU_DIRTY, this.lw(SPU_DIRTY) | (1 << ((lo - 0xc6) >> 1)));
    const b = defer ? SPU_BITS_SHADOW : this.lw(SPU_REGS);
    if (op === 1) {
      this.sh(b + lo * 2, this.lhu(b + lo * 2) | bits);
      this.sh(b + hi * 2, this.lhu(b + hi * 2) | ((bits >>> 16) & 0xff));
      if (defer) mark();
      cur |= bits & 0xffffff;
    } else if (op === 0) {
      this.sh(b + lo * 2, this.lhu(b + lo * 2) & ~bits);
      this.sh(b + hi * 2, this.lhu(b + hi * 2) & ~((bits >>> 16) & 0xff));
      if (defer) mark();
      cur &= ~(bits & 0xffffff);
    } else if (op === 8) {
      this.sh(b + lo * 2, bits);
      this.sh(b + hi * 2, (bits >>> 16) & 0xff);
      if (defer) mark();
      cur = bits & 0xffffff;
    }
    return cur & 0xffffff;
  },
  // 0x80060078
  SpuSetNoiseVoice(op, bits) { return this.spuVoiceBits(op, bits, 0xca, 0xcb); },
  // 0x80060fc8
  SpuSetReverbVoice(op, bits) { return this.spuVoiceBits(op, bits, 0xcc, 0xcd); },

  // 0x80060368
  SpuSetNoiseClock(c) {
    const n = c < 0 ? 0 : c < 0x40 ? c : 0x3f;
    const r = this.lw(SPU_REGS);
    this.sh(r + 0x1aa, (this.lhu(r + 0x1aa) & 0xc0ff) | ((n & 0x3f) << 8));
    return n;
  },

  // 0x800611a8: key on (1) / key off (0).
  SpuSetKey(on, bits) {
    bits &= 0xffffff;
    const hi = bits >>> 16, k = SPU_KEY_SHADOW;
    const defer = () => this.lw(SPU_DEFER) & 1;
    if (on === 1) {
      if (defer()) {
        this.sh(k, bits); this.sh(k + 2, hi);
        this.sw(SPU_DIRTY, this.lw(SPU_DIRTY) | 1);
        this.sw(SPU_KEYS_DEFER, this.lw(SPU_KEYS_DEFER) | bits);
        if (this.lhu(k + 4) & bits) this.sh(k + 4, this.lhu(k + 4) & ~bits);
        if (this.lhu(k + 6) & hi) this.sh(k + 6, this.lhu(k + 6) & ~hi);
        return;
      }
      const on0 = this.lw(SPU_KEYS_ON), r = this.lw(SPU_REGS);
      this.sh(r + 0x188, bits); this.sh(r + 0x18a, hi);
      this.sw(SPU_KEYS_ON, on0 | bits);
    } else if (on === 0) {
      if (defer()) {
        this.sh(k + 4, bits); this.sh(k + 6, hi);
        this.sw(SPU_DIRTY, this.lw(SPU_DIRTY) | 1);
        this.sw(SPU_KEYS_DEFER, this.lw(SPU_KEYS_DEFER) & ~bits);
        if (this.lhu(k) & bits) this.sh(k, this.lhu(k) & ~bits);
        if (this.lhu(k + 2) & hi) this.sh(k + 2, this.lhu(k + 2) & ~hi);
        return;
      }
      const r = this.lw(SPU_REGS);
      this.sh(r + 0x18c, bits); this.sh(r + 0x18e, hi);
      this.sw(SPU_KEYS_ON, this.lw(SPU_KEYS_ON) & ~bits);
    }
  },

  // 0x80061ff4: pitch register for a note against the sample's base note (128 fine steps).
  spuNoteToPitch(baseNote, baseFine, note, fine) {
    const from = ((baseNote & 0xffff) << 7) + (baseFine & 0xffff);
    const d = (((note & 0xffff) << 7) + (fine & 0xffff) - from) | 0;
    const a = Math.abs(d);
    let oct = Math.trunc(a / 1536), r = a - oct * 1536, p;
    if (d >= 0) p = 0x1000 << oct;
    else { if (r !== 0) { oct++; r = 0x600 - r; } p = 0x1000 >> oct; }
    p &= 0xffff;
    let k = 0x103b, lo = p << 12, hi = Math.imul(p, 0x103b);
    const steps = Math.abs(r) >>> 5, frac = Math.abs(r) & 0x1f;
    for (let i = 0; i < steps; i++) { lo = Math.imul(p, k); k = (Math.imul(k, 4155) >>> 12) | 0; hi = Math.imul(p, k); }
    const v = ((lo + Math.imul(((hi - lo) >>> 5) | 0, frac)) >>> 12);
    return (v < 0x4000 ? v : 0x3fff) & 0xffff;
  },

  // 0x80061968: SpuSetVoiceAttr(attr*). mask 0 = every field.
  SpuSetVoiceAttr(a) {
    const mask = this.lw(a + 4), all = mask === 0;
    const has = (m) => all || (mask & m);
    const VOLMODE = [0x8000, 0x9000, 0xa000, 0xb000, 0xc000, 0xd000, 0xe000];
    for (let v = 0; v < 24; v++) {
      if (!(this.lw(a) & (1 << v))) continue;
      const R = (o) => (this.lw(SPU_REGS) + v * 16 + o) | 0;
      if (has(0x10)) this.sh(R(4), this.lhu(a + 0x14));
      if (has(0x40)) this.sh(SPU_SAMPLE_NOTE + v * 2, this.lhu(a + 0x18));
      if (has(0x20)) {
        const sn = this.lhu(SPU_SAMPLE_NOTE + v * 2), n = this.lhu(a + 0x16);
        const p = this.spuNoteToPitch(sn >>> 8, sn & 0xff, n >>> 8, n & 0xff);
        this.sh(R(4), p);
      }
      for (const [m, mm, off, modeOff, reg] of [[1, 4, 8, 0xc, 0], [2, 8, 0xa, 0xe, 2]]) {
        if (!has(m)) continue;
        let vol = this.lhu(a + off) & 0x7fff, mode = 0;
        if (has(mm)) { const i = ((this.lhu(a + modeOff) - 1) << 16) >> 16; if ((i >>> 0) < 7) mode = VOLMODE[i]; }
        if (mode !== 0) { const s = this.lh(a + off); if (s >= 0x80) vol = 0x7f; else if (s < 0) vol = 0; }
        this.sh(R(reg), vol | mode);
      }
      if (has(0x80)) this.spuAddrReg(v * 8 + 3, this.lw(a + 0x1c));
      if (has(0x10000)) this.spuAddrReg(v * 8 + 7, this.lw(a + 0x20));
      if (has(0x20000)) this.sh(R(8), this.lhu(a + 0x3a));
      if (has(0x40000)) this.sh(R(0xa), this.lhu(a + 0x3c));
      if (has(0x800)) {
        let ar = this.lhu(a + 0x30); if (ar >= 0x80) ar = 0x7f;
        let x = 0; if (has(0x100) && this.lw(a + 0x24) === 5) x = 0x80;
        this.sh(R(8), (this.lhu(R(8)) & 0xff) | ((ar | x) << 8));
      }
      if (has(0x1000)) {
        let dr = this.lhu(a + 0x32); if (dr >= 0x10) dr = 0xf;
        this.sh(R(8), (this.lhu(R(8)) & 0xff0f) | (dr << 4));
      }
      if (has(0x2000)) {
        let sr = this.lhu(a + 0x34); if (sr >= 0x80) sr = 0x7f;
        let x = 0x100;
        if (has(0x200)) { const md = this.lw(a + 0x28); x = md === 5 ? 0x200 : md === 1 ? 0 : md === 7 ? 0x300 : 0x100; }
        this.sh(R(0xa), (this.lhu(R(0xa)) & 0x3f) | ((sr | x) << 6));
      }
      if (has(0x4000)) {
        let rr = this.lhu(a + 0x36); if (rr >= 0x20) rr = 0x1f;
        let x = 0; if (has(0x400) && this.lw(a + 0x2c) === 7) x = 0x20;
        this.sh(R(0xa), (this.lhu(R(0xa)) & 0xffc0) | (rr | x));
      }
      if (has(0x8000)) {
        let sl = this.lhu(a + 0x38); if (sl >= 0x10) sl = 0xf;
        this.sh(R(8), (this.lhu(R(8)) & 0xfff0) | sl);
      }
    }
    // The original ends with a short busy-wait on its stack (no other effect).
  },
};
