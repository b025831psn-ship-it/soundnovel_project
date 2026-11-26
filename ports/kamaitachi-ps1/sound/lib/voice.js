// libsnd voice layer: voice records, shadow SPU registers and the per-tick flush.
// Port of SLPS_017.94 0x8005af98 (flush), 0x8005c808 (key off), 0x8005d880.
import { s16 } from "./mem.js";

export const NVOICES = 0x801eeee0; // s8 voice count (24)
export const RESERVED = 0x80078620; // voices libsnd leaves alone
export const VREC = 0x8009cce8; // 0x36-byte voice records
export const VREC_SIZE = 0x36;
export const SHADOW = 0x801f70d0; // per voice 16 bytes: volL volR pitch addr>>3 adsr1 adsr2
export const DIRTY = 0x8009ecc8; // per voice: 1 vol, 4 pitch, 8 addr, 0x10 adsr
export const KON = 0x8008cda0, KON_HI = 0x8008cda2, KOFF = 0x801fed9c, KOFF_HI = 0x801fed9e;
export const REV = 0x8008cdbe, REV_HI = 0x8008ce24, NOISE = 0x8008ce26, NOISE_HI = 0x8008ce28;
export const CUR_VOICE = 0x801f70aa;
export const ENVX_HIST = 0x801fed58, ENVX_IDX = 0x801f7428, NOISE_HOLD = 0x801f7318;
export const VIBRATO_FN = 0x801f7250, PORTA_FN = 0x801f7084;

export const Voice = {
  vrec(v) { return VREC + v * VREC_SIZE; },

  // 0x8005c808: key off the voice in CUR_VOICE (queued for the next flush).
  voiceKeyOff() {
    const v = this.lhu(CUR_VOICE);
    let lo, hi;
    if (v < 16) { lo = 1 << v; hi = 0; } else { lo = 0; hi = 1 << (v - 16); }
    const r = this.vrec(v);
    this.sb(r + 0x1d, 0);
    const koff = this.lhu(KOFF), koffHi = this.lhu(KOFF_HI);
    this.sh(r + 4, 0); this.sh(r, 0);
    const kon = this.lhu(KON);
    const nk = koff | lo; this.sh(KOFF, nk); this.sh(KON, kon & ~nk);
    const konHi = this.lhu(KON_HI);
    const nh = koffHi | hi; this.sh(KOFF_HI, nh); this.sh(KON_HI, konHi & ~nh);
  },

  // 0x8005d880: key off every voice playing for acc | sub << 8.
  seqVoicesOff(accsub) {
    accsub = s16(accsub);
    for (let v = 0; v < this.lb(NVOICES); v++) {
      if (this.lw(RESERVED) & (1 << v)) continue;
      if (this.lh(this.vrec(v) + 0x10) !== accsub) continue;
      this.sh(CUR_VOICE, v);
      this.voiceKeyOff(0);
    }
  },

  // 0x8005af98: once per tick, push the shadow registers and key masks to libspu.
  voiceFlush() {
    const idx = (this.lw(ENVX_IDX) + 1) & 0xf;
    this.sw(ENVX_IDX, idx);
    this.sw(ENVX_HIST + idx * 4, 0);
    for (let v = 0; v < this.lb(NVOICES); v++) {
      this.SpuGetVoiceEnvelope(v, this.vrec(v) + 6);
      if (this.lhu(this.vrec(v) + 6) === 0) {
        const h = ENVX_HIST + this.lw(ENVX_IDX) * 4;
        this.sw(h, this.lw(h) | (1 << v));
      }
    }
    if (this.lb(NOISE_HOLD) === 0) {
      let silent = -1;
      for (let i = 0; i < 15; i++) silent &= this.lw(ENVX_HIST + i * 4);
      for (let v = 0; v < this.lb(NVOICES); v++) {
        if (!(silent & (1 << v))) continue;
        const st = this.vrec(v) + 0x1d;
        if (this.lb(st) === 2) {
          const lo = v < 16 ? 1 << v : 0, hi = v < 16 ? 0 : 1 << (v - 16);
          this.SpuSetNoiseVoice(0, ((hi & 0xff) << 16) | s16(lo));
        }
        this.sb(st, 0);
      }
    }
    this.sh(KON, this.lhu(KON) & ~this.lhu(KOFF));
    this.sh(KON_HI, this.lhu(KON_HI) & ~this.lhu(KOFF_HI));
    for (let v = 0; v < 24; v++) {
      if (this.lh(this.vrec(v) + 0x1e) !== 0) this.jalr(this.lw(VIBRATO_FN), v);
      if (this.lh(this.vrec(v) + 0x2a) !== 0) this.jalr(this.lw(PORTA_FN), v);
    }
    const sp = (this.m.sp = (this.m.sp - 0x78) | 0), a = sp + 0x10; // SpuVoiceAttr on the stack
    for (let v = 0; v < 24; v++) {
      const d = DIRTY + v, s = SHADOW + v * 16;
      this.sw(a + 4, 0); this.sw(a, 1 << v);
      if (this.lbu(d) & 1) { this.sw(a + 4, 3); this.sh(a + 8, this.lhu(s)); this.sh(a + 0xa, this.lhu(s + 2)); }
      if (this.lbu(d) & 4) { this.sw(a + 4, this.lw(a + 4) | 0x10); this.sh(a + 0x14, this.lhu(s + 4)); }
      if (this.lbu(d) & 8) { this.sw(a + 4, this.lw(a + 4) | 0x80); this.sw(a + 0x1c, this.lhu(s + 6) << 3); }
      if (this.lbu(d) & 0x10) { this.sw(a + 4, this.lw(a + 4) | 0x60000); this.sh(a + 0x3a, this.lhu(s + 8)); this.sh(a + 0x3c, this.lhu(s + 0xa)); }
      if (this.lw(a + 4) !== 0) this.SpuSetVoiceAttr(a);
      this.sb(d, 0);
    }
    this.m.sp = (sp + 0x78) | 0;
    this.SpuSetKey(0, (this.lbu(KOFF_HI) << 16) | this.lhu(KOFF));
    this.SpuSetKey(1, (this.lbu(KON_HI) << 16) | this.lhu(KON));
    this.SpuSetReverbVoice(8, (this.lbu(REV_HI) << 16) | this.lhu(REV));
    this.SpuSetNoiseVoice(8, (this.lbu(NOISE_HI) << 16) | this.lhu(NOISE));
    for (const r of [KOFF, KOFF_HI, KON, KON_HI, NOISE, NOISE_HI]) this.sh(r, 0);
  },
};
