// libsnd sequencer: per-tick SEQ playback (SsSeqCalledTbyT and the routines it calls).
// Port of SLPS_017.94 0x80054738-0x80055a24 and 0x80058bd8. Each method keeps the
// original's loads and stores on the 0xb0-byte sequence struct (offsets in LIBSND.md).
import { s16 } from "./mem.js";

export const SEQ_TABLE = 0x801fdfd8; // [acc] -> sub-struct array, 0xb0 bytes each
export const SEQ_COUNT = 0x801fec60; // s16
export const SUB_COUNT = 0x801fec7e; // s16
export const SEQ_OPEN = 0x801f7080; // bit per open acc
export const LOCK = 0x801d6654;
export const HANDLERS = 0x8009cc48; // note, program, pitch bend, meta, control

export const SeqPlay = {
  seqAt(acc, sub) { return (this.lw(SEQ_TABLE + (s16(acc) << 2)) + s16(sub) * 0xb0) | 0; },
  flagsAnd(p, m) { this.sw(p + 0x98, this.lw(p + 0x98) & m); },
  flagsOr(p, m) { this.sw(p + 0x98, this.lw(p + 0x98) | m); },

  // 0x80054738
  SsSeqCalledTbyT() {
    if (this.lw(LOCK) === 1) return;
    this.sw(LOCK, 1);
    this.voiceFlush();
    for (let acc = 0; acc < this.lh(SEQ_COUNT); acc++) {
      if (!(this.lw(SEQ_OPEN) & (1 << acc))) continue;
      for (let sub = 0; sub < this.lh(SUB_COUNT); sub++) {
        const flags = () => this.lw(this.lw(SEQ_TABLE + acc * 4) + sub * 0xb0 + 0x98);
        if (flags() & 1) {
          this.seqPlayTick(acc, sub);
          if (flags() & 0x10) this.seqCrescendo(acc, sub);
          if (flags() & 0x20) this.seqDecrescendo(acc, sub);
          if (flags() & 0x40) this.seqTempoRamp(acc, sub);
          if (flags() & 0x80) this.seqTempoRamp(acc, sub);
        }
        if (flags() & 2) this.seqPause(acc, sub);
        if (flags() & 8) this.seqReplay(acc, sub);
        if (flags() & 4) { this.seqStopVoices(acc, sub); this.sw(this.lw(SEQ_TABLE + acc * 4) + sub * 0xb0 + 0x98, 0); }
      }
    }
    this.sw(LOCK, 0);
  },

  // 0x80055058: pause = all of the sequence's voices off, play state 0.
  seqPause(acc, sub) {
    this.seqVoicesOff(s16((sub << 8) | acc));
    const p = this.seqAt(acc, sub);
    this.sb(p + 0x14, 0);
    this.flagsAnd(p, ~2);
  },
  // 0x800559c8
  seqReplay(acc, sub) {
    const p = this.seqAt(acc, sub);
    this.sb(p + 0x14, 1);
    this.flagsAnd(p, ~8);
  },
  // 0x800550f8
  seqPlayTick(acc, sub) { this.seqTick(s16(acc), s16(sub)); },

  // 0x80055128: advance one tick; read events whenever the delta counter runs out.
  seqTick(acc, sub) {
    const p = this.seqAt(acc, sub);
    const step = this.lh(p + 0x54), d = this.lw(p + 0x90);
    if (d - step > 0) {
      const c = this.lh(p + 0x52);
      if (c > 0) this.sh(p + 0x52, c - 1);
      else if (c === 0) { this.sh(p + 0x52, this.lhu(p + 0x54)); this.sw(p + 0x90, this.lw(p + 0x90) - 1); }
      else this.sw(p + 0x90, d - step);
      return;
    }
    let s0 = d;
    for (;;) {
      do this.seqReadEvent(acc, sub); while (this.lw(p + 0x90) === 0);
      s0 = (s0 + this.lw(p + 0x90)) | 0;
      const t = this.lh(p + 0x54);
      if (s0 >= t) { this.sw(p + 0x90, s0 - t); return; }
    }
  },

  // 0x80055818: variable-length delta, returned and accumulated (x10) in +0x88.
  seqReadDelta(acc, sub) {
    const p = this.seqAt(acc, sub);
    let pc = this.lw(p);
    let a = this.lbu(pc); this.sw(p, ++pc);
    if (a === 0) return 0;
    if (a & 0x80) {
      a &= 0x7f;
      let b;
      do { pc = this.lw(p); b = this.lbu(pc); this.sw(p, pc + 1); a = (a << 7) + (b & 0x7f); } while (b & 0x80);
    }
    const v = (a * 10) | 0;
    this.sw(p + 0x88, this.lw(p + 0x88) + v);
    return v;
  },

  // 0x80055468: one event. Returns 1 at end of track, -1 at the alternate end, else 0.
  seqReadEvent(acc, sub) {
    acc = s16(acc); sub = s16(sub);
    const p = this.seqAt(acc, sub);
    let pc = this.lw(p);
    const st = this.lbu(pc); this.sw(p, ++pc);
    const byte = () => { const q = this.lw(p); const v = this.lbu(q); this.sw(p, q + 1); return v; };
    const H = (i) => this.lw(HANDLERS + i * 4);
    if ((this.lw(p + 0x98) & 0x401) === 0x401) {
      const end = this.lw(p + 0x10);
      if (pc === ((end + 1) | 0)) { this.seqEndOfTrack(acc, sub, this.lbu(end + 1)); return -1; }
    }
    if (st & 0x80) {
      this.sb(p + 0x17, st & 0xf);
      const kind = st & 0xf0;
      switch (kind) {
        case 0x90: {
          this.sb(p + 0x16, kind);
          const note = byte(), vel = byte();
          this.sw(p + 0x90, this.seqReadDelta(acc, sub));
          this.jalr(H(0), acc, sub, note, vel);
          return 0;
        }
        case 0xb0: { this.sb(p + 0x16, kind); const c = byte(); this.jalr(H(4), acc, sub, c); return 0; }
        case 0xc0: { this.sb(p + 0x16, kind); const c = byte(); this.jalr(H(1), acc, sub, c); return 0; }
        case 0xe0: { this.sb(p + 0x16, kind); this.sw(p, this.lw(p) + 1); this.jalr(H(2), acc, sub, kind); return 0; }
        case 0xf0: {
          this.sb(p + 0x16, 0xff);
          const t = byte();
          if (t === 0x2f) { this.seqEndOfTrack(acc, sub, 0x2f); return 1; }
          this.jalr(H(3), acc, sub, t); return 0;
        }
      }
      return 0;
    }
    switch (this.lbu(p + 0x16)) { // running status
      case 0x90: {
        const vel = byte();
        this.sw(p + 0x90, this.seqReadDelta(acc, sub));
        this.jalr(H(0), acc, sub, st, vel);
        return 0;
      }
      case 0xb0: this.jalr(H(4), acc, sub, st); return 0;
      case 0xc0: this.jalr(H(1), acc, sub, st); return 0;
      case 0xe0: this.jalr(H(2), acc, sub); return 0;
      case 0xff:
        if (st === 0x2f) { this.seqEndOfTrack(acc, sub, 0x2f); return 1; }
        this.jalr(H(3), acc, sub, st); return 0;
    }
    return 0;
  },

  // 0x80055224: end of track: loop, or stop (and chain to the next sequence).
  seqEndOfTrack(acc, sub) {
    const p = this.seqAt(acc, sub);
    const done = (this.lbu(p + 0x21) + 1) & 0xff, count = this.lb(p + 0x20);
    this.sb(p + 0x21, done);
    const start = () => this.lw(p + ((this.lw(p + 0x98) & 0x400) ? 0xc : 4));
    if (count === 0) {
      this.sw(p + 0x88, 0); this.sb(p + 0x1c, 0); this.sw(p + 0x90, 0);
      this.sw(p, start());
      return;
    }
    if ((done << 24 >> 24) < count) {
      this.sw(p + 0x88, 0); this.sb(p + 0x1c, 0); this.sw(p + 0x90, 0);
      const s = start(); this.sw(p, s); this.sw(p + 8, s);
      return;
    }
    this.flagsAnd(p, ~1); this.flagsAnd(p, ~8); this.flagsAnd(p, ~2);
    this.flagsOr(p, 0x200); this.flagsOr(p, 4);
    this.sb(p + 0x14, 0);
    this.sw(p + 8, start());
    if (this.lb(p + 0x22) !== -1) {
      const na = this.lb(p + 0x22), ns = this.lb(p + 0x23);
      this.sb(p + 0x14, 0);
      this.seqChain(na, ns);
      this.seqVoicesOff(s16((sub << 8) | acc));
    }
    this.seqVoicesOff(s16((sub << 8) | acc));
    this.sw(p + 0x90, this.lh(p + 0x54));
  },

  // 0x800558c8: start the chained sequence.
  seqChain(acc, sub) {
    const p = this.seqAt(acc, sub);
    this.sb(p + 0x20, 1); this.sb(p + 0x21, 0);
    for (const m of [~0x100, ~8, ~2, ~4, ~0x200]) this.flagsAnd(p, m);
    this.sw(p, this.lw(p + 4));
    this.sb(p + 0x14, 1);
    this.flagsOr(p, 1);
  },

  // 0x80058bd8: stop: flags, voices off, damper off, rewind every field to the open state.
  seqStopVoices(acc, sub) {
    const p = this.seqAt(acc, sub);
    this.flagsAnd(p, ~1); this.flagsAnd(p, ~2); this.flagsAnd(p, ~8); this.flagsAnd(p, ~0x400);
    this.flagsOr(p, 4);
    this.seqVoicesOff(s16((sub << 8) | acc));
    this.damperOff();
    this.sb(p + 0x14, 0); this.sw(p + 0x88, 0);
    for (const o of [0x1c, 0x18, 0x19, 0x1e, 0x1a, 0x1b, 0x1f, 0x17, 0x21, 0x1c, 0x1d, 0x15, 0x16]) this.sb(p + o, 0);
    this.sw(p + 0x90, this.lw(p + 0x84));
    this.sw(p + 0x94, this.lw(p + 0x8c));
    this.sh(p + 0x54, this.lhu(p + 0x56));
    this.sw(p, this.lw(p + 4)); this.sw(p + 8, this.lw(p + 4));
    for (let ch = 0; ch < 16; ch++) { this.sb(p + 0x37 + ch, ch); this.sb(p + 0x27 + ch, 0x40); this.sh(p + 0x60 + ch * 2, 0x7f); }
    this.sh(p + 0x5c, 0x7f); this.sh(p + 0x5e, 0x7f);
  },
  // 0x8005af78
  damperOff() { this.sh(0x800b1bd8, 0); },
};
