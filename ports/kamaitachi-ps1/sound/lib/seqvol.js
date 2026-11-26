// libsnd sequence volume: crescendo/decrescendo per tick and the volume recompute behind
// SsSeqSetVol, and the tempo ramp. Port of SLPS_017.94 0x800549a8, 0x80054cb8, 0x8005d208,
// 0x8005d78c, 0x800593f8.
import { s16 } from "./mem.js";
import { NVOICES, RESERVED, SHADOW, DIRTY } from "./voice.js";
import { SEQ_TABLE } from "./seqplay.js";
import { K, VAB_HDR, PROG_ATTR, VAG_ATTR, MONO } from "./notes.js";

const sdiv = (x, d) => Math.trunc(x / d) | 0;
const udiv = (x, d) => Math.floor((x >>> 0) / d) | 0;

export const SeqVol = {
  // 0x8005d78c: current sequence volume into *l, *r.
  seqGetVol(accsub, outL, outR) {
    const seq = (this.lw(SEQ_TABLE + (accsub & 0xff) * 4) + ((accsub & 0xff00) >> 8) * 0xb0) | 0;
    this.sh(K.accsub, accsub);
    this.sh(outL, this.lhu(seq + 0x58)); this.sh(outR, this.lhu(seq + 0x5a));
    return this.lh(K.accsub);
  },

  // 0x8005d208: set the sequence volume (clamped to 127) and recompute its voices.
  seqSetVolVoices(accsub, l, r) {
    const seq = (this.lw(SEQ_TABLE + (accsub & 0xff) * 4) + ((accsub & 0xff00) >> 8) * 0xb0) | 0;
    this.sh(seq + 0x58, l); this.sh(seq + 0x5a, r);
    if (this.lhu(seq + 0x58) >= 0x7f) this.sh(seq + 0x58, 0x7f);
    if (this.lhu(seq + 0x5a) >= 0x7f) this.sh(seq + 0x5a, 0x7f);
    for (let i = 0; i < this.lb(NVOICES); i = s16(i + 1)) {
      if (this.lw(RESERVED) & (1 << i)) continue;
      const rv = this.vrec(i);
      if (this.lh(rv + 0x10) !== s16(accsub) || this.lh(rv + 0x18) !== this.lb(seq + 0x26)) continue;
      this.setVabProg(this.lh(rv + 0x18), this.lh(rv + 0x12)); // (sic) the tone base, not the program
      const x = sdiv(Math.imul(this.lh(rv + 8), this.lh(seq + this.lh(rv + 0xc) * 2 + 0x60)), 127);
      const y = sdiv(Math.imul(this.lbu(this.lw(VAB_HDR) + 0x18), Math.imul(x, 16383)), 16129);
      const t = (this.lw(VAG_ATTR) + ((this.lh(rv + 0x12) * 16 + this.lh(rv + 0x16)) << 5)) | 0;
      const z = Math.imul(Math.imul(y, this.lbu(this.lw(PROG_ATTR) + this.lh(rv + 0x14) * 16 + 1)), this.lbu(t + 2));
      const level = udiv(z, 16129);
      let L = udiv(Math.imul(level, this.lhu(seq + 0x58)), 127), R = udiv(Math.imul(level, this.lhu(seq + 0x5a)), 127);
      const tp = this.lbu(t + 3);
      if (tp < 0x40) R = udiv(Math.imul(R, tp), 63); else L = udiv(Math.imul(L, 0x7f - tp), 63);
      for (const x2 of [this.lbu(this.lw(PROG_ATTR) + this.lh(this.vrec(i) + 0x14) * 16 + 4), this.lbu(this.vrec(i) + 0xa)]) {
        if (x2 < 0x40) R = sdiv(Math.imul(R & 0xffff, x2), 63); else L = sdiv(Math.imul(L & 0xffff, 0x7f - x2), 63);
      }
      if (this.lh(MONO) === 1) { if ((L & 0xffff) < (R & 0xffff)) L = R; else R = L; }
      const a = L & 0xffff, b = R & 0xffff;
      this.sh(SHADOW + i * 16, sdiv(Math.imul(a, a), 16383));
      this.sh(SHADOW + i * 16 + 2, sdiv(Math.imul(b, b), 16383));
      this.sb(DIRTY + i, this.lbu(DIRTY + i) | 3);
    }
    return s16(accsub);
  },

  clearSeqFlag(acc, sub, m) { const p = this.seqAt(acc, sub); this.sw(p + 0x98, this.lw(p + 0x98) & ~m); },

  // 0x800549a8: crescendo step (flag 0x10). +0x4a steps left, +0x4c step, +0x48 target, +0x9c/+0xa0 frames.
  seqCrescendo(acc, sub) { this.seqRamp(acc, sub, true); },
  // 0x80054cb8: decrescendo step (flag 0x20).
  seqDecrescendo(acc, sub) { this.seqRamp(acc, sub, false); },

  seqRamp(acc, sub, up) {
    const flag = up ? 0x10 : 0x20;
    const p = this.seqAt(acc, sub), accsub = s16((sub << 8) | acc);
    const finish = () => this.seqGetVol(accsub, p + 0x5c, p + 0x5e);
    const c = (this.lw(p + 0xa0) - 1) | 0;
    this.sw(p + 0xa0, c);
    if (c < 0) { this.clearSeqFlag(acc, sub, flag); return finish(); }
    const step = this.lh(p + 0x4c), stepU = this.lhu(p + 0x4c);
    const sp = (this.m.sp = (this.m.sp - 0x38) | 0), L = sp + 0x10, R = sp + 0x12;
    const leave = () => { this.m.sp = (sp + 0x38) | 0; return finish(); };
    if (step === 0) return leave();
    let skipTail = false;
    if (step > 0) {
      if (c % step !== 0) return leave();
      const n = (this.lhu(p + 0x4a) - 1) & 0xffff; this.sh(p + 0x4a, n);
      if (s16(n) < 0) { this.seqSetVolVoices(accsub, up ? 0x7f : 0, up ? 0x7f : 0, 1); this.clearSeqFlag(acc, sub, flag); }
      else {
        this.seqGetVol(accsub, L, R);
        const l = this.lhu(L), rem = this.lh(p + 0x4a);
        if (up) {
          if (!((l + rem) < l + 1)) this.seqSetVolVoices(accsub, (l + 1) & 0xffff, (this.lhu(R) + 1) & 0xffff, 1);
        } else if (!((l - 1) < (l - rem) && (this.lhu(R) - 1) < (this.lhu(R) - rem))) {
          const r = this.lhu(R);
          if (l === 0 || r === 0) this.clearSeqFlag(acc, sub, flag);
          else this.seqSetVolVoices(accsub, (l - 1) & 0xffff, (r - 1) & 0xffff, 1);
        }
      }
    } else {
      const n = (this.lhu(p + 0x4a) + stepU) & 0xffff; this.sh(p + 0x4a, n);
      if (s16(n) < 0) { this.seqSetVolVoices(accsub, up ? 0x7f : 0, up ? 0x7f : 0, 1); this.clearSeqFlag(acc, sub, flag); }
      else {
        this.seqGetVol(accsub, L, R);
        const st = this.lh(p + 0x4c);
        if (up) {
          if (this.lhu(L) - st >= 0x7f && this.lhu(R) - st >= 0x7f) { this.seqSetVolVoices(accsub, 0x7f, 0x7f, 1); this.clearSeqFlag(acc, sub, flag); }
        } else if (this.lhu(L) + st <= 0 && this.lhu(R) + st <= 0) { this.seqSetVolVoices(accsub, 0, 0, 1); this.clearSeqFlag(acc, sub, flag); }
        const t0 = Math.imul((this.lw(p + 0x9c) - this.lw(p + 0xa0)) | 0, -this.lh(p + 0x4c));
        const su = this.lhu(p + 0x4c);
        if (t0 < this.lh(p + 0x48)) {
          if (up) this.seqSetVolVoices(accsub, (this.lhu(L) - su) & 0xffff, (this.lhu(R) - su) & 0xffff, 1);
          else {
            const l = this.lhu(L), r = this.lhu(R);
            if (l === 0 || r === 0) this.clearSeqFlag(acc, sub, flag);
            else this.seqSetVolVoices(accsub, (l + su) & 0xffff, (r + su) & 0xffff, 1);
          }
        }
      }
    }
    if (!skipTail) {
      if (this.lw(p + 0xa0) === 0 || this.lh(p + 0x4a) <= 0) this.clearSeqFlag(acc, sub, flag);
    }
    return leave();
  },

  // 0x800593f8: tempo ramp step (flags 0x40/0x80). +0x94 tempo, +0xac target, +0x4e step,
  // +0xa8 frames left; +0x54 = ticks per frame from +0x50 resolution and the tick rate.
  seqTempoRamp(acc, sub) {
    const p = this.seqAt(acc, sub);
    const clear = () => { this.clearSeqFlag(acc, sub, 0x40); this.clearSeqFlag(acc, sub, 0x80); };
    const c = (this.lw(p + 0xa8) - 1) | 0;
    this.sw(p + 0xa8, c);
    if (c < 0) return clear();
    const step = this.lh(p + 0x4e), t = this.lw(p + 0x94) >>> 0, target = this.lw(p + 0xac) >>> 0;
    if (step > 0) {
      if (c % step !== 0) return;
      if (target < t) this.sw(p + 0x94, t - 1); else if (t < target) this.sw(p + 0x94, t + 1);
    } else if (target < t) {
      const n = (t + step) >>> 0; this.sw(p + 0x94, n);
      if (n < target) this.sw(p + 0x94, target);
    } else if (t < target) {
      const n = (t - step) >>> 0; this.sw(p + 0x94, n);
      if (target < n) this.sw(p + 0x94, target);
    }
    const ticks = udiv(Math.imul(Math.imul(this.lh(p + 0x50), this.lw(p + 0x94)), 10), Math.imul(this.lw(0x801fc458), 60) >>> 0);
    this.sh(p + 0x54, ticks);
    if (s16(ticks) <= 0) this.sh(p + 0x54, 1);
    if (this.lw(p + 0xa8) === 0 || this.lw(p + 0x94) === this.lw(p + 0xac)) clear();
  },
};
