// libsnd SEQ controllers: control-change dispatch and handlers (CC 0/6/7/10/11/64/91/98-101/121),
// RPN/NRPN data entry, tempo meta event, tone attribute get/set and channel volume recalculation.
// Port of SLPS_017.94 0x800561f8-0x80057a98, 0x80057b78, 0x80057da8, 0x80059988, 0x80059a98,
// 0x8005a768, 0x8005af88, 0x8005d088, 0x8005da08.
import { s16 } from "./mem.js";
import { NVOICES, RESERVED, SHADOW, DIRTY } from "./voice.js";
import { SEQ_TABLE } from "./seqplay.js";
import { K, VAB_HDR, PROG_ATTR, VAG_ATTR, MONO, VAB_OPEN, DAMPER } from "./notes.js";

export const CC_TABLE = 0x8009cc5c; // [0] bank, [1] data entry, [2] vol, [3] pan, [4] expression, [5] damper,
// [6] NRPN LSB, [7] NRPN MSB, [8] RPN LSB, [9] RPN MSB, [10] reverb depth, [11] reset
export const NRPN_TABLE = 0x8009cc8c; // 20 tone/reverb attribute setters
export const VSYNC_RATE = 0x801fc458;
export const LOOP_FN_TABLE = 0x801fe0a0; // [acc*16 + sub] callback at NRPN 40

const sdiv = (x, d) => Math.trunc(x / d) | 0;
const udiv = (x, d) => Math.floor((x >>> 0) / d) | 0;

export const Controls = {
  ccDelta(acc, sub) { const p = this.seqAt(acc, sub); this.sw(p + 0x90, this.seqReadDelta(s16(acc), s16(sub))); },

  // 0x80057b78: control change (value byte follows).
  controlHandler(acc, sub, cc) {
    acc = s16(acc); sub = s16(sub); cc &= 0xff;
    const p = this.seqAt(acc, sub);
    const pc = this.lw(p), v = this.lbu(pc); this.sw(p, pc + 1);
    const T = (i) => this.lw(CC_TABLE + i * 4);
    const idx = { 6: 1, 7: 2, 10: 3, 11: 4, 64: 5, 98: 6, 99: 7, 100: 8, 101: 9, 91: 10 }[cc];
    if (cc === 0) { this.sb(p + 0x26, v); this.sw(p + 0x90, this.seqReadDelta(acc, sub)); return; }
    if (idx !== undefined) { this.jalr(T(idx), acc, sub, v); return; }
    if (cc === 121) { this.jalr(T(11), acc, sub, cc); return; }
    this.sw(p + 0x90, this.seqReadDelta(acc, sub));
  },

  // 0x800561f8: bank (vab) from the next byte.
  ccBank(acc, sub) {
    const p = this.seqAt(s16(acc), s16(sub));
    const pc = this.lw(p), v = this.lbu(pc); this.sw(p, pc + 1);
    this.sb(p + 0x26, v);
    this.sw(p + 0x90, this.seqReadDelta(s16(acc), s16(sub)));
  },

  // 0x80056278: data entry: loop count, RPN 0 (bend range), NRPN tone/reverb attributes.
  ccDataEntry(acc, sub, data) {
    const a = s16(acc), b = s16(sub);
    const p = this.seqAt(a, b), ch = this.lbu(p + 0x17);
    const sp = (this.m.sp = (this.m.sp - 0xa0) | 0);
    const prog = sp + 0x38, va = sp + 0x48;
    this.SsUtGetProgAtr(this.lb(p + 0x26), this.lbu(p + ch + 0x37), prog);
    const done = () => { this.m.sp = (sp + 0xa0) | 0; };
    if (this.lbu(p + 0x1c) === 1 && this.lbu(p + 0x15) === 0) {
      this.sb(p + 0x1d, data); this.sb(p + 0x1c, 0); this.sb(p + 0x15, 1);
      this.sw(p + 0x90, this.seqReadDelta(a, b)); return done();
    }
    if (this.lbu(p + 0x1e) === 2) {
      if (this.lbu(p + 0x19) === 0 && this.lbu(prog) !== 0) {
        for (let i = 0; i < this.lbu(prog); i++) {
          this.SsUtGetVagAtr(this.lb(p + 0x26), this.lbu(p + ch + 0x37), i, va);
          const lsb = this.lbu(p + 0x18);
          if (lsb === 0) { this.sb(va + 0xd, data & 0x7f); this.sb(va + 0xc, data & 0x7f); }
          else if (lsb === 1) this.sb(va + 5, this.lbu(va + 5)); // the original computes a fine tune but stores the old value
          else if (lsb === 2) this.sb(va + 4, this.lbu(va + 4)); // same for coarse tune
          this.SsUtSetVagAtr(this.lb(p + 0x26), this.lbu(p + ch + 0x37), i, va);
        }
      }
      this.sw(p + 0x90, this.seqReadDelta(a, b));
      this.sb(p + 0x1e, 0); return done();
    }
    if (this.lbu(p + 0x1f) === 2) {
      const words = []; for (let o = 0; o < 0x20; o += 4) words.push(this.lw(va + o)); // VagAtr passed by value
      if (this.lbu(p + 0x1b) === 0x10) {
        for (let i = 0; i < this.lbu(prog); i++) {
          const lsb = this.lbu(p + 0x1a);
          this.jalr(this.lw(NRPN_TABLE + lsb * 4), this.lb(p + 0x26), this.lbu(p + ch + 0x37), i, ...words, lsb, data & 0xff);
        }
      } else {
        const lsb = this.lbu(p + 0x1a);
        this.jalr(this.lw(NRPN_TABLE + lsb * 4), this.lb(p + 0x26), this.lbu(p + ch + 0x37), this.lbu(p + 0x1b), ...words, lsb, data & 0xff);
      }
      this.sw(p + 0x90, this.seqReadDelta(a, b));
      this.sb(p + 0x1f, 0); return done();
    }
    this.sw(p + 0x90, this.seqReadDelta(a, b));
    return done();
  },

  // 0x800566c8: CC 7 channel volume.
  ccVolume(acc, sub, v) {
    const a = s16(acc), b = s16(sub), p = this.seqAt(a, b), ch = this.lbu(p + 0x17);
    this.chanVolRecalc(s16((sub << 8) | acc), this.lb(p + 0x26), this.lbu(p + ch + 0x37), v & 0xff, this.lbu(p + ch + 0x27));
    this.sh(p + ch * 2 + 0x60, v & 0xff);
    this.sw(p + 0x90, this.seqReadDelta(a, b));
  },
  // 0x80056798: CC 10 pan.
  ccPan(acc, sub, v) {
    const a = s16(acc), b = s16(sub), p = this.seqAt(a, b), ch = this.lbu(p + 0x17);
    this.chanVolRecalc(s16((sub << 8) | acc), this.lb(p + 0x26), this.lbu(p + ch + 0x37), this.lhu(p + ch * 2 + 0x60), v & 0xff);
    this.sb(p + ch + 0x27, v);
    this.sw(p + 0x90, this.seqReadDelta(a, b));
  },
  // 0x80056868: CC 11 expression = program volume.
  ccExpression(acc, sub, v) {
    const a = s16(acc), b = s16(sub), p = this.seqAt(a, b), ch = this.lbu(p + 0x17);
    this.setProgVol(this.lb(p + 0x26), this.lbu(p + ch + 0x37), v & 0xff);
    this.chanVolRecalc(s16((sub << 8) | acc), this.lb(p + 0x26), this.lbu(p + ch + 0x37), this.lhu(p + ch * 2 + 0x60), this.lbu(p + ch + 0x27));
    this.sw(p + 0x90, this.seqReadDelta(a, b));
  },
  // 0x80056958: CC 64 damper.
  ccDamper(acc, sub, v) {
    if ((v & 0xff) < 0x40) this.damperOff(); else this.damperOn();
    this.ccDelta(acc, sub);
  },
  // 0x80056a08: CC 91 reverb depth.
  ccReverbDepth(acc, sub, v) { this.SsUtSetReverbDepth(v & 0xff, v & 0xff); this.ccDelta(acc, sub); },
  // 0x80056a98: CC 98 NRPN LSB (also the loop count right after a loop start).
  ccNrpnLsb(acc, sub, v) {
    const a = s16(acc), b = s16(sub), p = this.seqAt(a, b);
    if (this.lbu(p + 0x1c) === 1 && this.lbu(p + 0x15) === 0) {
      this.sb(p + 0x1d, v); this.sb(p + 0x1c, 0); this.sb(p + 0x15, 1);
    } else {
      const m = this.lbu(p + 0x1b);
      if (m !== 0x1e && m !== 0x14) { this.sb(p + 0x1a, v); this.sb(p + 0x1c, 0); this.sb(p + 0x1f, this.lbu(p + 0x1f) + 1); }
    }
    if (this.lbu(p + 0x1b) === 0x28) {
      const fn = this.lw(LOOP_FN_TABLE + a * 64 + b * 4);
      if (fn) this.jalr(fn, a, b, v & 0xff);
    }
    this.sw(p + 0x90, this.seqReadDelta(a, b));
  },
  // 0x80056bc8: CC 99 NRPN MSB: 20 = loop start, 30 = loop end.
  ccNrpnMsb(acc, sub, v) {
    const a = s16(acc), b = s16(sub), p = this.seqAt(a, b);
    if ((v & 0xff) === 0x14) {
      this.sb(p + 0x1b, v); this.sb(p + 0x1c, 1);
      const d = this.seqReadDelta(a, b);
      this.sw(p + 0x90, d); this.sw(p + 8, this.lw(p));
      return;
    }
    if ((v & 0xff) === 0x1e) {
      const c = this.lbu(p + 0x1d);
      this.sb(p + 0x1b, v);
      if (c === 0) { this.sb(p + 0x15, 0); this.sw(p + 0x90, this.seqReadDelta(a, b)); return; }
      if (c < 0x7f) {
        this.sb(p + 0x1d, c - 1);
        const d = this.seqReadDelta(a, b);
        this.sw(p + 0x90, d);
        if (this.lbu(p + 0x1d) !== 0) this.sw(p, this.lw(p + 8)); else this.sb(p + 0x15, 0);
        return;
      }
      this.seqReadDelta(a, b);
      this.sw(p + 0x90, 0); this.sw(p, this.lw(p + 8));
      return;
    }
    this.sb(p + 0x1b, v);
    this.sb(p + 0x1f, this.lbu(p + 0x1f) + 1);
    this.sw(p + 0x90, this.seqReadDelta(a, b));
  },
  // 0x80056d08 / 0x80056d78: CC 100 / 101 RPN.
  ccRpnLsb(acc, sub, v) { const p = this.seqAt(s16(acc), s16(sub)); this.sb(p + 0x18, v); this.sb(p + 0x1e, this.lbu(p + 0x1e) + 1); this.ccDelta(acc, sub); },
  ccRpnMsb(acc, sub, v) { const p = this.seqAt(s16(acc), s16(sub)); this.sb(p + 0x19, v); this.sb(p + 0x1e, this.lbu(p + 0x1e) + 1); this.ccDelta(acc, sub); },
  // 0x80056de8: CC 121 reset controllers.
  ccReset(acc, sub) {
    const p = this.seqAt(s16(acc), s16(sub));
    this.SsUtReverbOff(); this.damperOff();
    const ch = this.lbu(p + 0x17);
    this.sb(p + ch + 0x37, ch);
    this.sb(p + 0x18, 0); this.sb(p + 0x19, 0);
    this.sh(p + this.lbu(p + 0x17) * 2 + 0x60, 0x7f);
    this.sb(p + this.lbu(p + 0x17) + 0x27, 0x40);
    this.ccDelta(acc, sub);
  },
  // 0x8005af88
  damperOn() { this.sh(DAMPER, 2); },

  // 0x80057da8: meta event (tempo; three data bytes are read for any type).
  metaHandler(acc, sub) {
    const p = this.seqAt(acc, sub);
    let pc = this.lw(p);
    const b0 = this.lbu(pc); this.sw(p, ++pc);
    const b1 = this.lbu(pc); this.sw(p, pc + 1);
    const b2 = this.lbu(pc + 1);
    const bpm = sdiv(60000000, (b0 << 16) | (b1 << 8) | b2);
    const t1 = Math.imul(this.lh(p + 0x50), bpm), rate = this.lw(VSYNC_RATE);
    this.sw(p, pc + 2);
    this.sw(p + 0x94, bpm);
    const r60 = rate * 60;
    if ((Math.imul(t1, 10) >>> 0) < (r60 >>> 0)) {
      const v = Math.floor(((rate * 600) >>> 0) / (t1 >>> 0)) | 0;
      this.sh(p + 0x52, v); this.sh(p + 0x54, v);
    } else {
      const x = Math.imul(Math.imul(this.lh(p + 0x50), this.lw(p + 0x94)), 10) >>> 0;
      const q = Math.floor(x / (r60 >>> 0)) | 0, r = x % (r60 >>> 0);
      this.sh(p + 0x52, -1);
      this.sh(p + 0x54, q);
      if (((rate * 30) >>> 0) < r) this.sh(p + 0x54, q + 1);
    }
    this.sw(p + 0x90, this.seqReadDelta(s16(acc), s16(sub)));
  },

  // 0x80059988: SsUtGetProgAtr(vab, prog, out)
  SsUtGetProgAtr(vab, prog, out) {
    if (this.lbu(VAB_OPEN + s16(vab)) !== 1) return -1;
    this.setVabProg(s16(vab), s16(prog));
    const pa = (this.lw(PROG_ATTR) + s16(prog) * 16) | 0;
    for (let i = 0; i < 5; i++) this.sb(out + i, this.lbu(this.lw(PROG_ATTR) + s16(prog) * 16 + i));
    this.sh(out + 6, this.lhu(pa + 6));
    return 0;
  },
  vagAttrAt(tone) { return (this.lw(VAG_ATTR) + ((s16(tone + this.lb(K.progTone) * 16) << 16) >> 11)) | 0; },
  // 0x80059a98: SsUtGetVagAtr(vab, prog, tone, out) (bytes 0xe/0xf are not copied)
  SsUtGetVagAtr(vab, prog, tone, out) {
    if (this.lbu(VAB_OPEN + s16(vab)) !== 1) return -1;
    this.setVabProg(s16(vab), s16(prog));
    const t = this.vagAttrAt(tone);
    for (const o of [0, 1, 2, 3, 4, 5, 7, 6, 8, 9, 0xa, 0xb, 0xc, 0xd]) this.sb(out + o, this.lbu(t + o));
    for (const o of [0x10, 0x12, 0x14, 0x16]) this.sh(out + o, this.lhu(t + o));
    return 0;
  },
  // 0x8005a768: SsUtSetVagAtr(vab, prog, tone, in)
  SsUtSetVagAtr(vab, prog, tone, src) {
    if (this.lbu(VAB_OPEN + s16(vab)) !== 1) return -1;
    this.setVabProg(s16(vab), s16(prog));
    const t = this.vagAttrAt(tone);
    for (const o of [0, 1, 2, 3, 4, 5, 7, 6, 8, 9, 0xa, 0xb, 0xc, 0xd]) this.sb(t + o, this.lbu(src + o));
    for (const o of [0x10, 0x12, 0x14, 0x16]) this.sh(t + o, this.lhu(src + o));
    return 0;
  },
  // 0x8005d088: program volume
  setProgVol(vab, prog, vol) {
    const ps = s16(prog);
    if (this.setVabProg(s16(vab), ps) !== 0) return -1;
    this.sb(this.lw(PROG_ATTR) + ps * 16 + 1, vol);
    return this.lbu(this.lw(PROG_ATTR) + ps * 16 + 1);
  },

  // 0x8005da08: recompute the volume of every voice of acc/sub on vab/prog.
  chanVolRecalc(accsub, vab, prog, vol, pan) {
    const as = s16(accsub), seq = (this.lw(SEQ_TABLE + (accsub & 0xff) * 4) + ((as & 0xff00) >> 8) * 0xb0) | 0;
    vab = s16(vab); prog = s16(prog); pan &= 0xffff;
    this.setVabProg(vab, prog);
    this.sh(K.accsub, accsub);
    if (pan === 0) pan = 1;
    if ((vol & 0xffff) === 0) vol = 1;
    const v16 = vol & 0xffff;
    let n = 0;
    for (let i = 0; i < this.lb(NVOICES); i = s16(i + 1)) {
      if (this.lw(RESERVED) & (1 << i)) continue;
      const r = this.vrec(i);
      if (this.lh(r + 0x10) !== as || this.lh(r + 0x14) !== prog || this.lh(r + 0x18) !== vab) continue;
      const cva = seq + this.lbu(seq + 0x17) * 2 + 0x60, c = this.lh(cva);
      if (c !== v16 && c === 0) this.sh(cva, 1);
      const x = sdiv(Math.imul(this.lh(r + 8), v16), 127);
      const mv = this.lbu(this.lw(VAB_HDR) + 0x18);
      const y = sdiv(Math.imul(x, mv * 16383), 16129);
      const t = (this.lw(VAG_ATTR) + ((this.lh(r + 0x12) * 16 + this.lh(r + 0x16)) << 5)) | 0;
      const z = Math.imul(Math.imul(y, this.lbu(this.lw(PROG_ATTR) + prog * 16 + 1)), this.lbu(t + 2));
      const level = udiv(z, 16129);
      let L = udiv(Math.imul(level, this.lhu(seq + 0x58)), 127), R = udiv(Math.imul(level, this.lhu(seq + 0x5a)), 127);
      for (const x2 of [this.lbu(t + 3), this.lbu(this.lw(PROG_ATTR) + this.lh(r + 0x14) * 16 + 4), pan & 0xff]) {
        if (x2 < 0x40) R = udiv(Math.imul(R, x2), 63); else L = udiv(Math.imul(L, 0x7f - x2), 63);
      }
      if (this.lh(MONO) === 1) { if ((L >>> 0) < (R >>> 0)) L = R; else R = L; }
      L = udiv(Math.imul(L, L), 16383); R = udiv(Math.imul(R, R), 16383);
      this.sh(SHADOW + i * 16, L); this.sh(SHADOW + i * 16 + 2, R);
      this.sb(DIRTY + i, this.lbu(DIRTY + i) | 3);
      n++;
    }
    return n;
  },

  // NRPN attribute setters (table 0x8009cc8c). Arguments: vab, prog, tone, the caller's VagAtr
  // passed by value (8 words), NRPN LSB, data. Each re-reads the tone attributes itself.
  nrpnTone(vab, prog, tone, data, edit, adsr) {
    const sp = (this.m.sp = (this.m.sp - 0x40) | 0), va = sp + 0x4c, tmp = sp + 0x10; // va = the by-value argument area
    this.SsUtGetVagAtr(s16(vab), s16(prog), s16(tone), va);
    if (adsr === "decode") this.adsrDecode(this.lhu(va + 0x10), this.lhu(va + 0x12), tmp);
    edit(va, tmp);
    if (adsr) this.adsrEncode(tmp, va + 0x10, va + 0x12);
    this.SsUtSetVagAtr(s16(vab), s16(prog), s16(tone), va);
    this.m.sp = (sp + 0x40) | 0;
  },
  nrpnPrio(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va) => this.sb(va, d)); }, // 0x80056ea8
  nrpnMode(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { // 0x80056f38
    this.nrpnTone(vab, prog, tone, d, (va) => this.sb(va + 1, d));
    if ((d & 0xff) === 0) this.SsUtReverbOff(); else if ((d & 0xff) === 4) this.SsUtReverbOn();
  },
  nrpnMin(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va) => this.sb(va + 6, d)); }, // 0x80056ff8
  nrpnMax(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va) => this.sb(va + 7, d)); }, // 0x80057088
  nrpnAr(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va, t) => { this.sh(t + 0xa, 0); this.sh(t, d & 0xff); }, "decode"); }, // 0x80057118
  nrpnArExp(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va, t) => { this.sh(t + 0xa, 1); this.sh(t, d & 0xff); }, "decode"); }, // 0x800572c8
  nrpnDr(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va, t) => this.sh(t + 2, d & 0xff), "decode"); }, // 0x80057388
  nrpnSl(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va, t) => this.sh(t + 4, d & 0xff), "decode"); }, // 0x80057438
  nrpnSr(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va, t) => { this.sh(t + 0xc, 0); this.sh(t + 6, d & 0xff); }, "decode"); }, // 0x800574e8
  nrpnSrExp(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va, t) => { this.sh(t + 0xc, 1); this.sh(t + 6, d & 0xff); }, "decode"); }, // 0x80057598
  nrpnRr(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va, t) => { this.sh(t + 0xe, 0); this.sh(t + 8, d & 0xff); }, "decode"); }, // 0x80057658
  // 0x80057708, 0x800577b8, 0x80057898, 0x80057938 encode the ADSR from a local they never
  // decode (whatever is on the stack), as in the original. The game's music does not use them.
  nrpnRrExp(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va, t) => { this.sh(t + 0xe, 1); this.sh(t + 8, d & 0xff); }, "stale"); },
  nrpnSrDir(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) {
    this.nrpnTone(vab, prog, tone, d, (va, t) => {
      if (((d - 1) & 0xff) < 0x3f) this.sh(t + 0x10, 0); else if (((d - 0x40) & 0xff) < 0x40) this.sh(t + 0x10, 1);
    }, "stale");
  },
  nrpnPbMin(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va) => this.sb(va + 9, d), "stale"); },
  nrpnPbMax(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.nrpnTone(vab, prog, tone, d, (va) => this.sb(va + 0xa, d), "stale"); },
  nrpnReverbType(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.SsUtSetReverbType(d & 0xff); }, // 0x800579d8
  nrpnReverbDepth(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.SsUtSetReverbDepth(d & 0xff, d & 0xff); }, // 0x80057a08
  nrpnReverbFeedback(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.SsUtSetReverbFeedback(d & 0xff); }, // 0x80057a38
  nrpnReverbDelay(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.SsUtSetReverbDelay(d & 0xff); }, // 0x80057a68
  nrpnReverbDelay2(vab, prog, tone, w0, w1, w2, w3, w4, w5, w6, w7, lsb, d) { this.SsUtSetReverbDelay(d & 0xff); }, // 0x80057a98

  // 0x800571c8: ADSR registers -> fields {ar, dr, sl, sr, rr, arExp, srExp, rrExp, srDir}
  adsrDecode(a1, a2, out) {
    this.sh(out + 0xa, a1 & 0x8000); this.sh(out + 0xc, a2 & 0x8000); this.sh(out + 0x10, a2 & 0x4000); this.sh(out + 0xe, a2 & 0x20);
    this.sh(out, (a1 >>> 8) & 0x7f); this.sh(out + 2, ((a1 & 0xffff) >>> 4) & 0xf); this.sh(out + 4, a1 & 0xf);
    this.sh(out + 6, (a2 >>> 6) & 0x7f); this.sh(out + 8, a2 & 0x1f);
  },
  // 0x80057224: fields -> ADSR registers
  adsrEncode(f, o1, o2) {
    let hi = this.lh(f + 0xc) !== 0 ? 0x8000 : 0;
    const arExp = this.lh(f + 0xa) !== 0 ? 0x8000 : 0;
    if (this.lh(f + 0x10) !== 0) hi |= 0x4000;
    if (this.lh(f + 0xe) !== 0) hi |= 0x20;
    const r1 = arExp | ((this.lhu(f) << 8) & 0x7f00) | ((this.lhu(f + 2) << 4) & 0xf0) | (this.lhu(f + 4) & 0xf);
    const r2 = hi | ((this.lhu(f + 6) << 6) & 0x1fc0) | (this.lhu(f + 8) & 0x1f);
    this.sh(o1, r1); this.sh(o2, r2);
  },
};
