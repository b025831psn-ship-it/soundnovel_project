// libsnd/libspu entry points the game calls directly: sequence play/stop/volume, the
// decrescendo setter, master and reverb volume, and SpuSetCommonAttr.
// Port of SLPS_017.94 0x800592c8, 0x80055d1c, 0x80055bf8, 0x80059618, 0x80058418, 0x80058498,
// 0x80058d58, 0x80058678, 0x800586c8, 0x800615e8, 0x80060f48; voice-level SsUt calls
// 0x80059cd8, 0x8005a188, 0x8005a4e8, 0x8005a974, 0x80059848 and SpuGetKeyStatus 0x80061368.
import { s8, s16, div } from "./mem.js";
import { SEQ_TABLE, LOCK } from "./seqplay.js";
import { SPU_REGS, SPU_KEYS_ON } from "./spuvoice.js";
import { NVOICES, SHADOW, DIRTY, CUR_VOICE } from "./voice.js";
import { K, PROG_ATTR, VAG_ATTR } from "./notes.js";

const VOLMODE = [0, 0x8000, 0x9000, 0xa000, 0xb000, 0xc000, 0xd000, 0xe000];

export const Entry = {
  // 0x800592c8 SsSeqSetVol(acc, l, r): recompute only while the flags are exactly "playing".
  SsSeqSetVol(acc, l, r) {
    const p = this.lw(SEQ_TABLE + s16(acc) * 4);
    if (this.lw(p + 0x98) === 1) return this.seqSetVolVoices(s16(acc), l & 0xffff, r & 0xffff, 1);
    this.sh(p + 0x58, l); this.sh(p + 0x5a, r);
  },

  // 0x80055d1c SsSeqSetDecrescendo(acc, vol, frames)
  SsSeqSetDecrescendo(acc, vol, frames) { return this.seqSetDecrescendo(s16(acc), 0, s16(vol), frames); },

  // 0x80055bf8: the amount is limited to the current volume.
  seqSetDecrescendo(acc, sub, vol, frames) {
    const sp = (this.m.sp = (this.m.sp - 0x30) | 0);
    this.seqGetVol(s16((sub << 8) | acc), sp + 0x10, sp + 0x12);
    const v = s16(vol); let amount = vol;
    if (this.lhu(sp + 0x10) < v) amount = this.lhu(sp + 0x10);
    else if (this.lhu(sp + 0x12) < v) amount = this.lhu(sp + 0x12);
    const a = s16(acc), b = s16(sub);
    this.seqRampSetup(a, b, s16(amount), frames);
    const p = this.seqAt(a, b);
    this.sw(p + 0x98, this.lw(p + 0x98) | 0x20);
    this.sw(p + 0x98, this.lw(p + 0x98) & ~0x10);
    this.m.sp = (sp + 0x30) | 0;
  },

  // 0x80059618: amount +0x48/+0x4a, frames +0x9c/+0xa0, step +0x4c (frames per unit, or
  // minus units per frame when the ramp is steeper than one unit a frame).
  seqRampSetup(acc, sub, vol, frames) {
    const p = this.seqAt(acc, sub), f = this.lw(p + 0x98);
    if (f & 4 || f & 0x100) return;
    const v = s16(vol); if (v === 0) return;
    const abs = v < 0 ? -v : v;
    this.sh(p + 0x48, vol); this.sw(p + 0x9c, frames); this.sh(p + 0x4a, vol); this.sw(p + 0xa0, frames);
    if ((frames | 0) < abs) this.sh(p + 0x4c, -Math.trunc(abs / (frames | 0)));
    else this.sh(p + 0x4c, Math.trunc((frames | 0) / abs));
  },

  // 0x80058418 SsSeqPlay(acc, mode, count)
  SsSeqPlay(acc, mode, count) { return this.seqPlay(s16(acc), 0, s8(mode), s16(count)); },

  // 0x80058498: rewind to the data start; mode 1 plays, mode 0 pauses.
  seqPlay(acc, sub, mode, count) {
    const p = this.seqAt(acc, sub);
    const start = this.lw(p + 4);
    this.sw(p, start); this.sw(p + 8, start); this.sw(p + 0xc, start);
    this.sw(p + 0x98, this.lw(p + 0x98) & ~0x200);
    this.sw(p + 0x98, this.lw(p + 0x98) & ~4);
    this.sb(p + 0x20, count);
    const m = s8(mode);
    if (m === 1) {
      this.sw(p + 0x98, this.lw(p + 0x98) | 1);
      this.sb(p + 0x14, m); this.sb(p + 0x21, 0);
      this.seqSetVolVoices(s16((sub << 8) | acc), this.lhu(p + 0x58), this.lhu(p + 0x5a), 1);
    } else if (m === 0) this.sw(p + 0x98, this.lw(p + 0x98) | 2);
  },

  // 0x80058d58 SsSeqStop(acc)
  SsSeqStop(acc) { return this.seqStopVoices(s16(acc), 0); },

  // 0x80058678 SsSetMVol(l, r): 0..127 scaled by 129.
  SsSetMVol(l, r) {
    const sp = (this.m.sp = (this.m.sp - 0x40) | 0);
    this.sw(sp + 0x10, 3); this.sh(sp + 0x14, Math.imul(s16(l), 129)); this.sh(sp + 0x16, Math.imul(s16(r), 129));
    this.SpuSetCommonAttr(sp + 0x10);
    this.m.sp = (sp + 0x40) | 0;
  },

  // 0x800586c8 SsSetRVol(l, r): 0..127 to 0..0x7fff.
  SsSetRVol(l, r) {
    const sp = (this.m.sp = (this.m.sp - 0x30) | 0);
    this.sw(sp + 0x10, 6);
    this.sh(sp + 0x18, Math.trunc(Math.imul(s16(l), 0x7fff) / 127));
    this.sh(sp + 0x1a, Math.trunc(Math.imul(s16(r), 0x7fff) / 127));
    const v = this.SpuSetReverbDepth(sp + 0x10);
    this.m.sp = (sp + 0x30) | 0;
    return v;
  },

  // 0x80060f48: reverb depth from a SpuReverbAttr (mask 2 = left, 4 = right, 0 = both).
  SpuSetReverbDepth(attr) {
    const mask = this.lw(attr), all = mask === 0;
    const regs = this.lw(SPU_REGS);
    if (all || mask & 2) { this.sh(regs + 0x184, this.lhu(attr + 8)); this.sh(0x80078858, this.lhu(attr + 8)); }
    if (all || mask & 4) { this.sh(regs + 0x186, this.lhu(attr + 0xa)); this.sh(0x8007885a, this.lhu(attr + 0xa)); }
    return 0;
  },

  // 0x800615e8 SpuSetCommonAttr(attr)
  SpuSetCommonAttr(attr) {
    const mask = this.lw(attr), all = mask === 0;
    const regs = () => this.lw(SPU_REGS);
    const vol = (mbit, modebit, modeOff, valOff, reg) => {
      if (!(all || mask & mbit)) return;
      let mode = 0;
      if (all || mask & modebit) { const m = this.lh(attr + modeOff) >>> 0; if (m < 8) mode = VOLMODE[m]; }
      let v;
      if (mode === 0) v = this.lhu(attr + valOff);
      else { const sv = this.lh(attr + valOff); v = sv >= 0x80 ? 0x7f : sv < 0 ? 0 : this.lhu(attr + valOff); }
      this.sh(regs() + reg, (v & 0x7fff) | mode);
    };
    vol(1, 4, 8, 4, 0x180);
    vol(2, 8, 0xa, 6, 0x182);
    const put = (bit, off, reg) => { if (all || mask & bit) this.sh(regs() + reg, this.lhu(attr + off)); };
    put(0x40, 0x10, 0x1b0); put(0x80, 0x12, 0x1b2); put(0x400, 0x1c, 0x1b4); put(0x800, 0x1e, 0x1b6);
    const flag = (bit, off, b) => {
      if (!(all || mask & bit)) return;
      const r = regs() + 0x1aa;
      this.sh(r, this.lw(attr + off) !== 0 ? this.lhu(r) | b : this.lhu(r) & ~b);
    };
    flag(0x100, 0x14, 4); flag(0x200, 0x18, 1); flag(0x1000, 0x20, 8); flag(0x2000, 0x24, 2);
  },

  // 0x80061368 SpuGetKeyStatus(mask): first voice in mask; 1 on, 3 on but silent,
  // 2 off and still sounding, 0 off; -1 for an empty mask.
  SpuGetKeyStatus(mask) {
    let v = 0;
    while (v < 24 && !(mask & (1 << v))) v++;
    if (v === 24) return -1;
    const env = this.lhu(this.lw(SPU_REGS) + v * 16 + 0xc);
    if (this.lw(SPU_KEYS_ON) & (1 << v)) return env !== 0 ? 1 : 3;
    return env !== 0 ? 2 : 0;
  },

  // 0x8005a4e8 SsUtKeyOffV(voice)
  SsUtKeyOffV(voice) {
    if (this.lw(LOCK) === 1) return -1;
    this.sw(LOCK, 1);
    if ((voice & 0xffff) >= 24) { this.sw(LOCK, 0); return -1; }
    this.sh(CUR_VOICE, voice);
    this.voiceKeyOff(0, voice);
    this.sw(LOCK, 0);
    return 0;
  },

  // 0x8005a974 SsUtSetVVol(voice, l, r)
  SsUtSetVVol(voice, l, r) {
    if ((voice & 0xffff) >= 24) return -1;
    const v = s16(voice);
    this.sh(SHADOW + v * 16 + 2, r); this.sh(SHADOW + v * 16, l);
    this.sb(DIRTY + v, this.lbu(DIRTY + v) | 3);
    return 0;
  },

  // 0x80059848 SsUtChangePitch(voice, vab, prog, oldNote, oldFine, newNote, newFine)
  SsUtChangePitch(voice, vab, prog, oldNote, oldFine, note, fine) {
    if ((voice & 0xffff) >= 24) return -1;
    const v = s16(voice), rv = this.vrec(v);
    if (this.lh(rv + 0x18) !== s16(vab)) return -1;
    if (this.lh(rv + 0x14) !== s16(prog)) return -1;
    if (this.lh(rv + 0xe) !== s16(oldNote)) return -1;
    this.setVabProg(this.lh(rv + 0x18), this.lh(rv + 0x14));
    this.sh(K.accsub, 0x21); this.sh(K.voice, voice); this.sb(K.tone, this.lbu(rv + 0x16));
    this.sh(SHADOW + v * 16 + 4, this.pitchFine(note & 0xffff, fine & 0xffff));
    this.sb(DIRTY + v, this.lbu(DIRTY + v) | 4);
    return 0;
  },

  // Shared by SsUtKeyOn/KeyOnV: fill the key-on scratch from the program and tone.
  // Returns the tone's VAG number (0 = no tone).
  utKeyOnScratch(prog, tone, note, fine, voll, volr) {
    this.sh(K.accsub, 0x21);
    this.sb(K.note, note); this.sb(K.fine, fine); this.sb(K.tone, tone);
    const l = s16(voll), r = s16(volr);
    if (l === r) { this.sb(K.pan, 0x40); this.sb(K.vel, voll); }
    else if (r < l) { this.sb(K.vel, voll); this.sb(K.pan, div(r << 6, l)); }
    else { this.sb(K.vel, volr); this.sb(K.pan, 0x7f - div(l << 6, r)); }
    const pa = (this.lw(PROG_ATTR) + (s16(prog) << 4)) | 0;
    this.sb(K.progVol, this.lbu(pa + 1)); this.sb(K.progPan, this.lbu(pa + 4)); this.sb(K.toneCount, this.lbu(pa));
    const va = (this.lw(VAG_ATTR) + (s16(this.lb(K.tone) + (this.lb(K.progTone) << 4)) << 5)) | 0;
    this.sb(K.prio, this.lbu(va)); this.sh(K.vag, this.lhu(va + 0x16));
    this.sb(K.toneVol, this.lbu(va + 2)); this.sb(K.tonePan, this.lbu(va + 3));
    this.sb(K.center, this.lbu(va + 4)); this.sb(K.shift, this.lbu(va + 5));
    this.sb(K.mode, this.lbu(va + 1)); this.sb(K.min, this.lbu(va + 6)); this.sb(K.max, this.lbu(va + 7));
    return this.lh(K.vag);
  },

  utKeyOnVoice(v, vab, prog, note, fine) {
    this.sh(K.voice, v);
    const rv = this.vrec(v);
    this.sh(rv + 0x10, 0x21); this.sh(rv + 0x18, vab); this.sh(rv + 0x14, prog);
    this.sh(rv + 0x12, this.lb(K.progTone)); this.sh(rv, this.lhu(K.vag));
    this.sh(rv + 0xe, note); this.sb(rv + 0x1d, 1); this.sh(rv + 2, 0); this.sh(rv + 0x16, this.lb(K.tone));
    this.voiceSetAddrAdsr();
    if (this.lh(K.vag) === 0xff) this.noiseKeyOn(v & 0xff);
    else this.voiceKeyOnVol(1, this.pitchFine(note & 0xffff, fine & 0xffff) & 0xffff);
  },

  // 0x80059cd8 SsUtKeyOn(vab, prog, tone, note, fine, voll, volr): returns the voice or -1.
  SsUtKeyOn(vab, prog, tone, note, fine, voll, volr) {
    if (this.lw(LOCK) === 1) return -1;
    this.sw(LOCK, 1);
    if (this.setVabProg(s16(vab), s16(prog)) !== 0) { this.sw(LOCK, 0); return -1; }
    if (this.utKeyOnScratch(prog, tone, note, fine & 0xffff, voll, volr) === 0) { this.sw(LOCK, 0); return -1; }
    const v = this.voiceAlloc() & 0xff;
    if (v === this.lb(NVOICES)) { this.sw(LOCK, 0); return -1; }
    this.utKeyOnVoice(v, vab, prog, note, fine & 0xffff);
    this.sw(LOCK, 0);
    return v;
  },

  // 0x8005a188 SsUtKeyOnV(voice, vab, prog, tone, note, fine, voll, volr)
  SsUtKeyOnV(voice, vab, prog, tone, note, fine, voll, volr) {
    if (this.lw(LOCK) === 1) return -1;
    this.sw(LOCK, 1);
    const fail = () => { this.sw(LOCK, 0); return -1; };
    if ((voice & 0xffff) >= 24) return fail();
    if (this.setVabProg(s16(vab), s16(prog)) !== 0) return fail();
    if (this.utKeyOnScratch(prog, tone, note & 0xffff, fine & 0xffff, voll, volr) === 0) return fail();
    this.utKeyOnVoice(s16(voice), vab & 0xffff, prog, note & 0xffff, fine & 0xffff);
    this.sw(LOCK, 0);
    return s16(voice);
  },
};
