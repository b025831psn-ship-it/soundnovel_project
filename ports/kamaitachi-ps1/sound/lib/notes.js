// libsnd note path: SEQ note/program/bend handlers, tone search, voice allocation,
// key-on volume and pitch. Port of SLPS_017.94 0x80057ac8, 0x80057f78, 0x80058058,
// 0x8005ab08-0x8005af74, 0x8005b778-0x8005cfa0, 0x8005d938, 0x8005dfc8.
import { s8, s16 } from "./mem.js";
import { NVOICES, RESERVED, SHADOW, DIRTY, KON, KON_HI, KOFF, KOFF_HI, REV, REV_HI, NOISE, NOISE_HI, CUR_VOICE, ENVX_HIST } from "./voice.js";
import { SEQ_TABLE } from "./seqplay.js";

// Key-on scratch (0x801f7090..): what the note path has looked up so far.
export const K = {
  toneCount: 0x801f7090, vab: 0x801f7091, note: 0x801f7092, fine: 0x801f7093, vel: 0x801f7094,
  pan: 0x801f7095, prog: 0x801f7096, progTone: 0x801f7097, progVol: 0x801f709a, progPan: 0x801f709b,
  tone: 0x801f709c, toneVol: 0x801f709d, tonePan: 0x801f709e, prio: 0x801f709f, center: 0x801f70a0,
  shift: 0x801f70a1, min: 0x801f70a2, max: 0x801f70a3, mode: 0x801f70a4, accsub: 0x801f70a6,
  vag: 0x801f70a8, voice: 0x801f70aa, voice8: 0x801f70ac, toneIdx: 0x801f70ae,
};
export const VAB_HDR = 0x801d6ed4, PROG_ATTR = 0x801d67c8, VAG_ATTR = 0x801d6ed8, MONO = 0x801d58f0;
export const VAB_OPEN = 0x801f70b0, PROG_MAX = 0x801d6658;
export const VAB_HDR_TAB = 0x800b1b98, PROG_ATTR_TAB = 0x800a6ff0, VAG_ATTR_TAB = 0x800b1be0;
export const DAMPER = 0x800b1bd8, PITCH_TABLE = 0x800786a0;

const UTIL = 0x21; // accsub of SsUt* voices
// Constant divisions as compiled (magic multiplies): signed truncate / unsigned floor.
const sdiv = (x, d) => Math.trunc(x / d) | 0;
const udiv = (x, d) => Math.floor((x >>> 0) / d) | 0;
const bits = (v) => (v < 16 ? [1 << v, 0] : [0, 1 << (v - 16)]);

export const Notes = {
  // 0x8005dfc8: select vab/program for the lookups below. 0 = ok, -1 = not open / out of range.
  setVabProg(vab, prog) {
    if ((vab & 0xffff) >= 16) return -1;
    const vs = s16(vab);
    if (this.lbu(VAB_OPEN + vs) !== 1) return -1;
    const ps = s16(prog);
    if (!(ps < this.lh(PROG_MAX))) return -1;
    const hdr = this.lw(VAB_HDR_TAB + vs * 4), pa = this.lw(PROG_ATTR_TAB + vs * 4), va = this.lw(VAG_ATTR_TAB + vs * 4);
    this.sb(K.vab, vab); this.sb(K.prog, prog);
    this.sw(VAG_ATTR, va); this.sw(VAB_HDR, hdr); this.sw(PROG_ATTR, pa);
    this.sb(K.progTone, this.lbu(pa + ps * 16 + 8));
    return 0;
  },
  vagAttr(tone) { return (this.lw(VAG_ATTR) + ((this.lb(K.progTone) * 16 + tone) << 5)) | 0; },

  // 0x8005d938: tones of the program whose key range holds the note.
  toneSearch(outTone, outVag) {
    let n = 0;
    for (let i = 0; i < this.lb(K.toneCount); i = s8(i + 1)) {
      const t = (this.lw(VAG_ATTR) + ((this.lb(K.progTone) * 16 + s8(i)) << 5)) | 0;
      const note = this.lb(K.note);
      if (note < this.lbu(t + 6) || this.lbu(t + 7) < note) continue;
      this.sb(outVag + (n & 0xff), this.lbu(t + 0x16));
      this.sb(outTone + (n & 0xff), i);
      n++;
    }
    return n & 0xff;
  },

  // 0x8005ab08: free voice, else the lowest priority (then quietest, then oldest).
  voiceAlloc() {
    let found = 0x63, bestEnv = 0xffff, cands = 0, bestAge = 0, best = 0x63;
    let prio = s8(this.lbu(K.prio));
    const n = this.lb(NVOICES), res = this.lw(RESERVED);
    for (let v = 0; v < n; v++) {
      if (res & (1 << v)) continue;
      const r = this.vrec(v);
      if (this.lb(r + 0x1d) === 0 && this.lhu(r + 6) === 0) { found = v; break; }
      const p = prio & 0xffff, vp = this.lh(r + 0x1a);
      if (vp < p) { prio = this.lhu(r + 0x1a); best = v; bestEnv = this.lhu(r + 6); bestAge = this.lhu(r + 2); cands = 1; continue; }
      if (vp !== p) continue;
      const env = this.lhu(r + 6);
      cands++;
      if (env < (bestEnv & 0xffff)) { bestAge = this.lhu(r + 2); bestEnv = env; best = v; }
      else if (env === (bestEnv & 0xffff) && bestAge < this.lh(r + 2)) { bestAge = this.lhu(r + 2); best = v; }
    }
    if ((found & 0xff) === 0x63) { found = best; if ((cands & 0xff) === 0) found = this.lbu(NVOICES); }
    if ((found & 0xff) < this.lb(NVOICES)) {
      const n2 = this.lb(NVOICES), res2 = this.lw(RESERVED);
      for (let v = 0; v < n2; v++) if (!(res2 & (1 << v))) this.sh(this.vrec(v) + 2, this.lhu(this.vrec(v) + 2) + 1);
      const r = this.vrec(found & 0xff);
      this.sh(r + 2, 0); this.sh(r + 0x2a, 0); this.sh(r + 0x1e, 0);
      this.sh(r + 0x1a, s8(this.lbu(K.prio)));
    }
    return found & 0xff;
  },

  // 0x8005ad98: sample address and ADSR of the chosen tone into the voice's shadow regs.
  voiceSetAddrAdsr() {
    const v = this.lh(K.voice);
    this.sh(K.voice8, v * 8);
    this.sh(K.toneIdx, s8(this.lbu(K.tone)) + this.lb(K.progTone) * 16);
    this.sh(this.vrec(v) + 6, 0x7fff);
    for (let i = 0; i < 16; i++) { const h = ENVX_HIST + i * 4; this.sw(h, this.lw(h) & ~(1 << this.lh(K.voice))); }
    const vag = this.lhu(K.vag), half = sdiv(s16(vag) - 1, 2);
    const addr = this.lhu(this.lw(PROG_ATTR) + half * 16 + ((vag & 1) ? 0xc : 0xe));
    this.sh(SHADOW + this.lh(K.voice8) * 2 + 6, addr);
    const d = DIRTY + this.lh(K.voice); this.sb(d, this.lbu(d) | 8);
    const t = this.vagAttr(this.lb(K.tone));
    this.sh(SHADOW + this.lh(K.voice8) * 2 + 8, this.lhu(t + 0x10));
    this.sh(SHADOW + this.lh(K.voice8) * 2 + 0xa, this.lhu(t + 0x12) + this.lhu(DAMPER));
    const d2 = DIRTY + this.lh(K.voice); this.sb(d2, this.lbu(d2) | 0x30);
  },

  // 0x80057f78: SEQ note event (vel 0 = note off).
  noteHandler(acc, sub, note, vel) {
    const p = this.seqAt(acc, sub), ch = this.lbu(p + 0x17), pan = this.lbu(p + 0x27 + ch);
    const accsub = s16((sub << 8) | acc);
    if ((vel & 0xff) === 0) return this.noteOff(accsub, this.lb(p + 0x26), this.lbu(p + 0x37 + ch), note & 0xff);
    if ((this.lh(p + 0x80) >> ch) & 1) return;
    return this.noteOn(accsub, this.lb(p + 0x26), this.lbu(p + 0x37 + ch), note & 0xff, vel & 0xff, pan);
  },
  // 0x80058058: SEQ program change.
  programHandler(acc, sub, prog) {
    const p = this.seqAt(acc, sub);
    this.sb(p + 0x37 + this.lbu(p + 0x17), prog);
    this.sw(p + 0x90, this.seqReadDelta(acc, sub));
  },
  // 0x80057ac8: SEQ pitch bend (MSB only).
  bendHandler(acc, sub) {
    acc = s16(acc); sub = s16(sub);
    const p = this.seqAt(acc, sub);
    const pc = this.lw(p), b = this.lbu(pc); this.sw(p, pc + 1);
    this.bendAll(s16((sub << 8) | acc), this.lb(p + 0x26), this.lbu(p + 0x37 + this.lbu(p + 0x17)), b);
    this.sw(p + 0x90, this.seqReadDelta(acc, sub));
  },

  // 0x8005b778: key on every tone of the program that covers the note.
  noteOn(accsub, vab, prog, note, vel, pan) {
    vel &= 0xffff; pan &= 0xffff;
    const acc = accsub & 0xff, sub = (s16(accsub) & 0xff00) >> 8;
    const seq = (this.lw(SEQ_TABLE + acc * 4) + sub * 0xb0) | 0;
    if (this.setVabProg(s16(vab), s16(prog)) !== 0) return -1;
    this.sh(K.accsub, accsub); this.sb(K.note, note); this.sb(K.fine, 0);
    if (s16(accsub) === UTIL) this.sb(K.vel, vel);
    else this.sb(K.vel, sdiv(Math.imul(vel, this.lh(seq + 0x60 + this.lbu(seq + 0x17) * 2)), 127));
    this.sb(K.pan, pan);
    const pa = (this.lw(PROG_ATTR) + s16(prog) * 16) | 0;
    this.sb(K.progVol, this.lbu(pa + 1)); this.sb(K.progPan, this.lbu(pa + 4)); this.sb(K.toneCount, this.lbu(pa));
    if (!(this.lb(K.progTone) < this.lhu(this.lw(VAB_HDR) + 0x12))) return -1;
    if (vel === 0) return this.noteOff(s16(accsub), s16(vab), s16(prog), note & 0xffff);
    const sp = (this.m.sp = (this.m.sp - 0x148) | 0);
    const vags = sp + 0x10, tones = sp + 0x90;
    const count = this.toneSearch(tones, vags);
    let mask = 0;
    for (let i = 0; i < (count & 0xff); i++) {
      this.sh(K.vag, this.lbu(vags + i));
      const t = this.lbu(tones + i);
      const va = (this.lw(VAG_ATTR) + (((s8(t) + this.lb(K.progTone) * 16) & 0xffff) << 5)) | 0;
      this.sb(K.tone, t);
      this.sb(K.prio, this.lbu(va)); this.sb(K.toneVol, this.lbu(va + 2)); this.sb(K.tonePan, this.lbu(va + 3));
      this.sb(K.center, this.lbu(va + 4)); this.sb(K.shift, this.lbu(va + 5)); this.sb(K.mode, this.lbu(va + 1));
      this.sb(K.min, this.lbu(va + 6)); this.sb(K.max, this.lbu(va + 7));
      const v = this.voiceAlloc(0) & 0xff;
      this.sh(K.voice, v);
      if (!(v < this.lb(NVOICES))) { mask = -1; continue; }
      const R = () => this.vrec(this.lh(K.voice));
      this.sb(this.vrec(v) + 0x1d, 1);
      this.sh(R() + 2, 0);
      this.sh(R() + 0x10, accsub);
      this.sh(R() + 0x18, s8(this.lbu(K.vab)));
      this.sh(R() + 0x12, s8(this.lbu(K.progTone)));
      this.sh(R() + 0x14, prog);
      if (s16(accsub) !== UTIL) { this.sh(R() + 8, vel); this.sh(R() + 0xc, this.lbu(seq + 0x17)); }
      this.sb(R() + 0xa, pan);
      this.sh(R() + 0x16, s8(this.lbu(K.tone)));
      this.sh(R() + 0xe, note);
      this.sh(R() + 0x1a, s8(this.lbu(K.prio)));
      this.sh(R(), this.lhu(K.vag));
      this.voiceSetAddrAdsr();
      if (this.lh(K.vag) === 0xff) this.noiseKeyOn(this.lbu(K.voice));
      else this.voiceKeyOnVol(count & 0xff, this.pitchOfNote() & 0xffff);
      mask |= 1 << this.lh(K.voice);
    }
    this.m.sp = (sp + 0x148) | 0;
    return mask;
  },

  // 0x8005bcec: key off the voices holding this note.
  noteOff(accsub, vab, prog, note) {
    let n = 0;
    note &= 0xffff; prog = s16(prog); accsub = s16(accsub); vab = s16(vab);
    for (let v = 0; (v & 0xff) < this.lb(NVOICES); v++) {
      if (this.lw(RESERVED) & (1 << v)) continue;
      const r = this.vrec(v);
      if (this.lh(r + 0xe) !== note || this.lh(r + 0x14) !== prog || this.lh(r + 0x10) !== accsub || this.lh(r + 0x18) !== vab) continue;
      if (this.lh(r) === 0xff) this.noiseOff(v & 0xff);
      else { this.sh(CUR_VOICE, v & 0xff); this.voiceKeyOff(0); }
      n++;
    }
    return n;
  },
  // 0x8005c7c8
  noiseOff(v) { const r = this.vrec(v & 0xff); this.sb(r + 0x1d, 0); this.sh(r, 0); this.sh(r + 4, 0); },

  pitchFromTable(x, fineIdx) {
    const oct = sdiv(x, 12), semi = x - oct * 12;
    let p = this.lhu(PITCH_TABLE + ((((s16(semi) << 16) >> 12) + fineIdx) * 2));
    const sh = s16(oct - 5);
    if (sh > 0) p <<= sh; else if (sh < 0) p = (p & 0xffff) >> -sh;
    return p & 0xffff;
  },
  // 0x8005bf88: pitch of K.note on the current tone (no fine tune).
  pitchOfNote() {
    const note = s8(this.lbu(K.note)), center = s8(this.lbu(K.center));
    let sh = this.lb(K.shift); if (sh < 0) sh += 7;
    let f = sh >>> 3; if ((f & 0xffff) >= 0x10) f = 0xf;
    return this.pitchFromTable(s16(note - (center - 0x3c)), f & 0xffff);
  },
  // 0x8005c05c: pitch of note + fine (1/128 semitone steps) on the current tone.
  pitchFine(note, fine) {
    const va = (this.lw(VAG_ATTR) + ((s16(s8(this.lbu(K.tone)) + this.lb(K.progTone) * 16) << 16) >> 11)) | 0;
    let v = (fine & 0xffff) + this.lbu(va + 5); if (v < 0) v += 7;
    let f = v >> 3, carry = 0;
    if (f >= 16) { carry = 1; f -= 16; }
    return this.pitchFromTable(s16(carry + (note + 0x3c - this.lbu(va + 4))), s16(f));
  },

  // Volume of the current key-on (0x8005c8d8 and 0x8005c248 share it). lb: signed loads.
  keyOnLevels(signedPans) {
    const mv = this.lbu(this.lw(VAB_HDR) + 0x18);
    const base = sdiv(Math.imul(this.lb(K.vel), mv * 16383), 16129);
    let vol = udiv(Math.imul(Math.imul(base, this.lb(K.progVol)), this.lb(K.toneVol)), 16129);
    const accsub = this.lhu(K.accsub), as = s16(accsub);
    const seq = (this.lw(SEQ_TABLE + (accsub & 0xff) * 4) + ((as & 0xff00) >> 8) * 0xb0) | 0;
    let L = vol, R = vol;
    if (as !== UTIL) { L = udiv(Math.imul(vol, this.lhu(seq + 0x58)), 127); R = udiv(Math.imul(vol, this.lhu(seq + 0x5a)), 127); }
    const ld = signedPans ? (a) => this.lb(a) : (a) => this.lbu(a);
    for (const a of [K.tonePan, K.progPan, K.pan]) {
      const x = ld(a);
      if ((x >>> 0) < 0x40) R = udiv(Math.imul(R, x), 63); else L = udiv(Math.imul(L, 0x7f - x), 63);
    }
    if (this.lh(MONO) === 1) { if ((L >>> 0) < (R >>> 0)) L = R; else R = L; }
    if (this.lh(K.accsub) !== UTIL) { L = udiv(Math.imul(L, L), 16383); R = udiv(Math.imul(R, R), 16383); }
    return [L, R];
  },
  reverbBits(lo, hi) {
    if (this.lbu(K.mode) & 4) { this.sh(REV, this.lhu(REV) | lo); this.sh(REV_HI, this.lhu(REV_HI) | hi); }
    else { this.sh(REV, this.lhu(REV) & ~lo); this.sh(REV_HI, this.lhu(REV_HI) & ~hi); }
  },
  // 0x8005c8d8: volume, pitch, reverb bit and key-on for K.voice.
  voiceKeyOnVol(count, pitch) {
    const [L, R] = this.keyOnLevels(false);
    const s = SHADOW + (((this.lh(K.voice) * 8) & 0xffff) << 1);
    this.sh(s + 4, pitch); this.sh(s, L); this.sh(s + 2, R);
    const d = DIRTY + this.lh(K.voice); this.sb(d, this.lbu(d) | 7);
    const v = this.lh(K.voice);
    this.sh(this.vrec(v) + 4, pitch);
    const [lo, hi] = bits(v);
    this.reverbBits(lo, hi);
    this.sh(NOISE, this.lhu(NOISE) & ~lo); this.sh(NOISE_HI, this.lhu(NOISE_HI) & ~hi);
    const kon = this.lhu(KON) | lo, konHi = this.lhu(KON_HI) | hi;
    this.sh(KON_HI, konHi); this.sh(KON, kon);
    this.sh(KOFF, this.lhu(KOFF) & ~kon); this.sh(KOFF_HI, this.lhu(KOFF_HI) & ~konHi);
  },
  // 0x8005c248: noise tone: volume, noise clock from the note, key-on.
  noiseKeyOn(voice) {
    const [L, R] = this.keyOnLevels(true);
    this.SpuSetNoiseClock((this.lb(K.note) - this.lb(K.center)) & 0x3f);
    const v = voice & 0xff;
    this.sh(SHADOW + v * 16 + 2, R); this.sh(SHADOW + v * 16, L);
    this.sb(DIRTY + v, this.lbu(DIRTY + v) | 3);
    const [lo, hi] = bits(v);
    this.sh(this.vrec(v) + 4, 0xa);
    for (let i = 0; i < this.lb(NVOICES); i = s16(i + 1)) {
      if (this.lw(RESERVED) & (1 << i)) continue;
      const st = this.vrec(i) + 0x1d; this.sb(st, this.lbu(st) & 1);
    }
    this.sb(this.vrec(v) + 0x1d, 2);
    const kon = this.lhu(KON) | lo, konHi = this.lhu(KON_HI) | hi;
    this.sh(KON, kon); this.sh(KON_HI, konHi);
    this.sh(KOFF, this.lhu(KOFF) & ~kon); this.sh(KOFF_HI, this.lhu(KOFF_HI) & ~konHi);
    this.reverbBits(lo, hi);
    this.sh(NOISE, lo); this.sh(NOISE_HI, hi);
  },

  // 0x8005cfa4: pitch bend for every voice of acc/sub on vab/prog. Returns voices bent.
  bendAll(accsub, vab, prog, bend) {
    this.setVabProg(s16(vab), s16(prog));
    this.sh(K.accsub, accsub);
    let n = 0;
    for (let v = 0; v < this.lb(NVOICES); v = s16(v + 1)) n += s16(this.voiceBend(v, s16(accsub), s16(vab), s16(prog), bend & 0xffff));
    return n;
  },
  // 0x8005cda8
  voiceBend(v, accsub, vab, prog, bend) {
    const r = this.vrec(s16(v));
    if (this.lh(r + 0x10) !== s16(accsub) || this.lh(r + 0x18) !== s16(vab) || this.lh(r + 0x14) !== s16(prog)) return 0;
    const t = (this.lhu(r + 0x16) + this.lb(K.progTone) * 16) & 0xffff;
    let note = this.lhu(r + 0xe), fine;
    const b = s16(bend - 0x40);
    if (b > 0) {
      const d = Math.imul(b, this.lbu(this.lw(VAG_ATTR) + t * 32 + 0xd)), q = sdiv(d, 63);
      note += q; fine = (d - q * 63) * 2;
    } else if (b < 0) {
      const d = Math.imul(b, this.lbu(this.lw(VAG_ATTR) + t * 32 + 0xc)), q = (d < 0 ? d + 0x3f : d) >> 6;
      note = note + q - 1; fine = (d - q * 64) * 2 + 0x7f;
    } else fine = 0;
    this.sb(K.tone, this.lbu(r + 0x16));
    this.sh(K.voice, v);
    const p = this.pitchFine(note & 0xffff, fine & 0xffff);
    this.sh(SHADOW + s16(v) * 16 + 4, p);
    this.sb(DIRTY + s16(v), this.lbu(DIRTY + s16(v)) | 4);
    return 1;
  },
};
