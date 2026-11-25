// Port of the game's sound module in SLPS_017.94 (~0x80026358-0x80029174).
// Covers the effect-script engine (VCE.PAC, 6 channels on SPU voices 18-23),
// the music controller (MUS.PAC: play, fade, duration, reverb) and UI sound
// banks. Every libsnd/libspu call goes through `ss`, so the same module runs
// on the JS SPU, on a recorder in tests, or against a native trace.
//
// Field names follow the 0x68-byte channel struct at 0x801d6240; offsets in comments.

const NONE16 = 0xffff;
const s16 = (x) => (x << 16) >> 16;
const cdiv = (a, b) => Math.trunc(a / b); // MIPS div (C semantics)

export const VCE_CHANNELS = 6;
export const VCE_FIRST_VOICE = 0x12; // 0x80026d1c: voice = channel + 0x12
const REVERB_WORK = [0, 0x26c0, 0x1f40, 0x4840, 0x6fe0, 0xade0, 0xf6ac]; // jump table 0x800119c0

// Effect-script opcode lengths (operand bytes) for tools; handlers at table 0x8006aac4.
export const VCE_OPS = [
  { name: "jump", len: 2, at: 0x800276ac },
  { name: "wait", len: 2, at: 0x80027724 },
  { name: "yield", len: 0, at: 0x80027774 },
  { name: "noteOn", len: 4, at: 0x8002777c },
  { name: "volume", len: 3, at: 0x80027a20 },
  { name: "pan", len: 3, at: 0x80027bf0 },
  { name: "skip1", len: 1, at: 0x80027cd8 },
  { name: "pitchTo", len: 4, at: 0x80027cf8 },
  { name: "pitchBy", len: 4, at: 0x80027ddc },
  { name: "noteOff", len: 0, at: 0x800279c0 },
  { name: "jumpIfFlag", len: 3, at: 0x80027ec8 },
  { name: "jumpUnlessFlag", len: 3, at: 0x80027f80 },
  { name: "loopStart", len: 2, at: 0x80028038 },
  { name: "loopEnd", len: 0, at: 0x800280a8 },
  { name: "stop", len: 0, at: 0x800280e8 },
  { name: "setDone", len: 0, at: 0x8002810c },
  { name: "clearFlag", len: 0, at: 0x8002812c },
  { name: "volume2", len: 3, at: 0x80027b08 },
  { name: "rumble", len: 2, at: 0x80028148 },
];

function newChannel() {
  return {
    cont: 0, rumble: 0, wait: 0, prog: -1, id: -1, // +0 +1 +2 +4 +6
    volFrames: 0, masterFrames: 0, vol2Frames: 0, pitchWord: 0x3000, // +8 +a +c +e
    pc: 0, loopPc: 0, volStep: 0, masterStep: 0, vol2Step: 0, // +10 +14 +18 +1c +20
    vol: 0x7f00, master: 0x7f00, vol2: 0x7f00, volTarget: 0, masterTarget: 0, vol2Target: 0, // +24..+38
    pitchCur: 0, pitchStep: 0, pitchNow: 0, pitchTarget: 0, pitchFrames: 0, loopCount: 0, // +3c..+4e
    panFrames: 0, panStep: 0, pan: 0x4000, panTarget: 0, spuAddr: 0, spuSize: 0, // +50..+64
    script: null, // the channel's copy of the script (0x801f6720 + ch*0x190)
  };
}

export class SoundModule {
  constructor(ss, tables, opts = {}) {
    this.ss = ss;
    this.tables = tables; // readSoundTables(exe)
    this.loadMember = opts.loadMember; // (pac, id) => Uint8Array; pac 'MUS' | 'VCE'
    this.rumbleOut = opts.rumble || (() => {});
    this.stereo = 1; // 0x800792c5
    this.rumbleOff = 0; // 0x800792c6
    this.padVibration = 0; // 0x800792a6
    this.inited = 0; // gp+0x7b
    this.lock = 0; // 0x8007928d, set while a channel starts or stops
    this.transferring = 0; // gp+0x7d
    this.vabIds = new Array(12).fill(-1); // 0x801eef50: 0-4 UI banks, 5-10 VCE, 11 music
    this.voiceMap = new Array(VCE_CHANNELS).fill(NONE16); // 0x801fd370
    this.stopQueue = new Array(VCE_CHANNELS).fill(NONE16); // 0x801f7338
    this.active = new Uint8Array(VCE_CHANNELS); // 0x80079548
    this.done = new Uint8Array(1000); // 0x801fd388, indexed by effect id % 1000
    this.flags = new Uint8Array(1000); // 0x801fc460, script conditions
    this.ch = Array.from({ length: VCE_CHANNELS }, newChannel);
    this.cur = 0; // gp+0x3e4 channel being ticked
    this.music = { song: -1, acc: -1, sbAddr: 0, headSize: 0, reverbBytes: 0, vol: 0, step: 0, fade: 0, duration: 0, playing: 0, reverbType: 0, reverbDepth: 0 };
    this.trace = opts.trace || null;
  }

  // 0x80028ccc: full sound reset (also the recovery path when SPU memory runs out).
  reset() {
    const ss = this.ss;
    if (this.inited === 1) ss.SsEnd();
    this.inited = 0;
    this.vabIds.fill(-1);
    ss.SsUtReverbOff();
    ss.SsInit();
    ss.SsSetTableSize(16, 1);
    ss.SsSetTickMode(0x1000); // SS_NOTICK: the VSync callback drives SsSeqCalledTbyT
    ss.SsStart();
    ss.SsSetSerialAttr(0, 0, 1);
    this.resetChannels();
    ss.call8005e0a8(0x11);
    if (this.stereo === 0) ss.SsSetMono(); else ss.SsSetStereo();
    this.inited = 1;
    Object.assign(this.music, { song: -1, sbAddr: 0, headSize: 0, reverbBytes: 0, fade: 0, duration: 0, playing: 0, step: 0, vol: 0 });
    this.transferring = 0;
    ss.SsUtReverbOn();
    this.silenceReverb();
    this.loadUiBanks();
  }

  // 0x80026358
  resetChannels() {
    this.voiceMap.fill(NONE16);
    this.stopQueue.fill(NONE16);
    for (let i = 0; i < VCE_CHANNELS; i++) {
      this.active[i] = 0;
      const c = newChannel();
      Object.assign(c, { vol: 0x7f00, vol2: 0x7f00, master: 0x7f00, pan: 0x4000, pc: 0 });
      this.ch[i] = c;
    }
    this.flags.fill(0, 0, 0x100);
    this.done.fill(0, 0, 0x100);
  }

  silenceReverb() { // repeated block in 0x80028228/0x80028334/0x800284b0
    const ss = this.ss;
    ss.SsSetRVol(0, 0);
    ss.SsUtSetReverbDepth(0, 0);
    ss.VSync(5);
    ss.SsUtSetReverbFeedback(0);
    ss.SsUtSetReverbType(0);
    ss.wait80013ff0();
  }

  // 0x80028b10: five UI sound banks, parts (2i, 2i+1) of BIN.PAC member 1.
  loadUiBanks() {
    const banks = this.loadMember?.("UI");
    if (!banks) return;
    for (let i = 0; i < 5; i++) {
      if (this.vabIds[i] !== -1 || !banks[i]) continue;
      const { head, body } = banks[i];
      const addr = this.ss.SpuMallocWithStartAddr(0x1010, (head.fsize + 7) & ~7);
      const id = this.ss.SsVabOpenHeadSticky(head, -1, addr);
      this.vabIds[i] = id;
      if (id !== -1) { this.transferring = 1; this.ss.SsVabTransBody(body, id); this.ss.SsVabTransCompleted(1); this.transferring = 0; }
    }
  }

  // 0x80028c74: UI sound n (cursor, confirm, ...).
  playUi(n) {
    const id = this.vabIds[n];
    if (id === -1) return;
    this.ss.SsUtKeyOn(id, 0, 0, 0x30, 0, 0x32, 0x32);
  }

  // ---- music ----------------------------------------------------------------

  // 0x800284b0(song, fadeFrames)
  playMusic(song, fade = 0) {
    song = s16(song);
    if (song === -1) return;
    const ss = this.ss, m = this.music, t = this.tables.songs[song];
    for (let attempt = 0; attempt < 4; attempt++) {
      ss.VSync(0);
      this.stopMusic(0);
      this.silenceReverb();
      const member = this.loadMember("MUS", song);
      m.song = song;
      const { head, body, seq } = member; // parsed VAB head {fsize}, body bytes, seq bytes
      m.headSize = (head.fsize + 7) & ~7; // gp+0x3c0
      const rt = t.reverbType;
      m.reverbBytes = (rt < 7 ? REVERB_WORK[rt] : 0) * 2; // gp+0x414
      m.sbAddr = 0x80000 - (m.headSize + m.reverbBytes); // gp+0x340: music sits under the reverb area
      const vab = ss.SsVabOpenHeadSticky(head, -1, m.sbAddr);
      this.vabIds[11] = vab;
      if (vab === -1) { this.reset(); continue; }
      this.transferring = 1;
      ss.SsVabTransBody(body, vab);
      while (ss.SsVabTransCompleted(0) !== 1) { ss.VSync(0); }
      this.transferring = 0;
      m.acc = ss.SsSeqOpen(seq, vab);
      if (m.acc === -1) { this.reset(); continue; }
      ss.SsSeqSetVol(m.acc, cdiv(m.vol, 256), cdiv(m.vol, 256));
      ss.SsUtSetReverbDepth(t.reverbDepth, t.reverbDepth);
      m.reverbType = t.reverbType; m.reverbDepth = t.reverbDepth;
      ss.SsUtSetReverbType(t.reverbType);
      ss.SsSetMVol(100, 100);
      ss.SsSetRVol(100, 100);
      ss.SsUtReverbOn();
      ss.SsSeqPlay(m.acc, 1, t.loops);
      const max = t.volume * 90;
      if ((fade & 0xff) === 0) { m.step = 0; m.fade = 0; m.vol = max; }
      else { m.vol = 0; m.fade = fade & 0xff; m.step = cdiv(max, fade & 0xff); }
      m.playing = 1;
      m.duration = t.duration;
      return true;
    }
    return false;
  }

  // 0x80028334(fadeFrames): 0 = stop now.
  stopMusic(fade = 0) {
    const ss = this.ss, m = this.music;
    fade &= 0xff;
    if (fade !== 0) { m.fade = fade; m.step = -cdiv(m.vol, fade); return; }
    if (this.vabIds[11] === -1) return;
    m.vol = 0;
    ss.SsSeqSetDecrescendo(m.acc, 0, 1); // 0x80055d1c
    ss.SsSeqStop(m.acc);
    this.silenceReverb();
    ss.wait80013ff0();
    this.silenceReverb();
    ss.SsSeqClose(m.acc);
    ss.SsVabClose(this.vabIds[11]);
    ss.SpuFree(m.sbAddr);
    m.headSize = 0; m.sbAddr = 0; m.song = -1; m.fade = 0; m.playing = 0;
    this.vabIds[11] = -1;
  }

  // ---- effects --------------------------------------------------------------

  // 0x80026984(id, channel, fadeIn). member = VCE.PAC member already loaded
  // (0x80026d98 copies it into the shared buffer first).
  startEffect(id, chn, fade, member) {
    const ss = this.ss;
    this.lock = 1;
    chn &= 0xff;
    this.active[chn] = 0;
    const c = this.ch[chn];
    const { head, body, script } = member; // head: parsed {fsize}, body bytes, script bytes
    c.script = Uint8Array.from(script.subarray(0, 0x190));
    const size = (head.fsize + 7) & ~7;
    const addr = ss.SpuMallocWithStartAddr(0x1010, size);
    const m = this.music;
    const clash = addr === -1 || (m.sbAddr !== 0 && !((addr + size) >>> 0 < m.sbAddr));
    let vab = -1;
    if (!clash) { vab = ss.SsVabOpenHeadSticky(head, -1, addr); this.vabIds[5 + chn] = vab; }
    if (clash || vab === -1) {
      // out of SPU memory: reset everything and restart the current song
      const song = m.song;
      this.reset();
      if (song !== -1) this.playMusic(song, 0);
      this.lock = 0;
      return false;
    }
    this.transferring = 1;
    ss.SsVabTransBody(body, vab);
    for (let n = 0; n < 0x12d && ss.SsVabTransCompleted(0) !== 1; n++) { ss.VSync(0); }
    this.transferring = 0;
    c.pc = 0; c.scriptLive = 1;
    c.vol = 0x7f00; c.volTarget = 0x7f00;
    c.vol2 = 0x10000; c.vol2Target = 0x10000;
    fade &= 0xffff;
    if (fade === 0) { c.master = 0x10000; c.masterTarget = 0x10000; }
    else { c.masterFrames = fade; c.master = 0; c.masterTarget = 0x10000; c.masterStep = cdiv(0x10000, fade); }
    c.cont = 0; c.pan = 0x4000; c.panTarget = 0x4000; c.volFrames = 0;
    c.spuAddr = addr; c.spuSize = size;
    c.panFrames = 0; c.pitchWord = 0x3000; c.pitchFrames = 0; c.rumble = 0;
    c.wait = 0; c.prog = -1; c.loopCount = 0; c.loopPc = 0;
    c.id = s16(id) - cdiv(s16(id), 1000) * 1000;
    this.done[c.id] = 0;
    this.voiceMap[chn] = chn + VCE_FIRST_VOICE;
    this.active[chn] = 1;
    this.lock = 0;
    return true;
  }

  // 0x8002678c(channel, fadeOut)
  stopEffect(chn, fade = 0) {
    const ss = this.ss;
    this.lock = 1;
    chn &= 0xff;
    const c = this.ch[chn];
    fade &= 0xffff;
    if (fade !== 0) {
      c.masterFrames = fade; c.masterTarget = 0; c.masterStep = -cdiv(c.master, fade);
    } else if (this.vabIds[5 + chn] !== -1) {
      this.active[chn] = 0;
      this.done[c.id] = 1;
      if (c.prog !== -1) {
        ss.SsUtKeyOffV(s16(this.voiceMap[chn]));
        this.voiceMap[chn] = NONE16;
        c.prog = -1; c.id = -1; c.spuSize = 0; c.spuAddr = 0; // original zeroes 0x60 before SpuFree
      }
      ss.SsVabClose(this.vabIds[5 + chn]);
      ss.SpuFree(c.spuAddr);
      this.vabIds[5 + chn] = -1;
      if (c.rumble) this.rumbleStop();
    }
    this.lock = 0;
  }

  setFlag(i, v) { this.flags[i] = v ? 1 : 0; }
  isDone(i) { return this.done[i] === 1; }

  rumbleStop() { this.rumbleOut({ on: false }); }

  // ---- per frame -------------------------------------------------------------

  // VSync callback 0x80028f88
  vsync() {
    if (this.inited !== 1) return;
    if (this.lock === 0) this.tickEffects();
    this.ss.SsSeqCalledTbyT();
    const m = this.music;
    if (m.playing === 1 && ((m.duration + 1) & 0xffff) >= 2) m.duration = (m.duration - 1) & 0xffff;
  }

  // 0x80029008, called once per game frame from the main loops
  frame() {
    if (this.inited !== 1) return;
    const m = this.music;
    if (m.playing === 1) {
      m.fade = (m.fade - 1) & 0xffff;
      let stopped = false;
      if (m.fade < 2 && m.step < 0) { this.stopMusic(0); stopped = true; }
      else {
        this.ss.SsSeqSetVol(m.acc, cdiv(m.vol, 256), cdiv(m.vol, 256));
        const max = this.tables.songs[m.song].volume * 90;
        m.vol += m.step;
        if (!(m.vol < max)) m.vol = max;
      }
      if (!stopped && s16(m.duration) === 0) this.stopMusic(0);
    }
    for (let i = 0; i < VCE_CHANNELS; i++) {
      if (this.stopQueue[i] !== NONE16) { const f = this.stopQueue[i]; this.stopQueue[i] = NONE16; this.stopEffect(i, f); }
    }
  }

  // 0x80027490
  tickEffects() {
    if (this.transferring) return;
    for (let i = 0; i < VCE_CHANNELS; i++) {
      this.cur = i;
      const c = this.ch[i];
      if (this.voiceMap[i] !== NONE16 && c.prog !== -1) {
        if (this.ss.SpuGetKeyStatus(1 << this.voiceMap[i]) !== 1) this.stopQueue[i] = 0;
      }
      if (this.active[i] !== 1 || !c.scriptLive) continue;
      this.ramps(i);
      let guard = 0;
      do {
        c.cont = 0;
        if (c.wait !== 0) { c.wait = (c.wait - 1) & 0xffff; }
        else {
          const at = c.pc;
          const op = c.script[c.pc++];
          if (!(op < VCE_OPS.length)) throw new Error(`VCE op ${op} at script+0x${at.toString(16)} (ch ${i}, id ${c.id}); table 0x8006aac4 has 19`);
          this.trace?.({ ch: i, at, op: VCE_OPS[op].name });
          this.op(op, i, c);
        }
        if (++guard > 4096) throw new Error(`VCE script ch ${i} id ${c.id} did not yield (pc 0x${c.pc.toString(16)})`);
      } while (c.cont !== 0);
    }
    this.updateVolumes();
  }

  u16(c) { const v = c.script[c.pc] | (c.script[c.pc + 1] << 8); c.pc += 2; return v; }

  // left/right as computed in op 3 and 0x800272a4 (before the final scaling)
  mix(c, right) {
    let p = 200;
    if (this.stereo === 1) { const k = c.pan >> 9; p = this.tables.panLaw[right ? 63 - k : k]; }
    const a = (p * (c.vol >> 8)) >> 8;
    const b = (a * (c.vol2 >> 8)) >> 8;
    return Math.imul(b, c.master >> 8);
  }

  op(op, i, c) {
    const ss = this.ss;
    switch (op) {
      case 0: { c.pc = this.u16(c); c.cont = 1; break; } // 0x800276ac
      case 1: { c.wait = this.u16(c); c.cont = 1; break; }
      case 2: break; // ends this frame
      case 3: { // 0x8002777c
        const prog = this.u16(c);
        c.pitchWord = this.u16(c);
        c.pitchCur = c.pitchWord << 8;
        if (c.prog !== -1) ss.SsUtKeyOffV(s16(this.voiceMap[i]));
        const l = s16(this.mix(c, false) >> 8), r = s16(this.mix(c, true) >> 8);
        const v = ss.SsUtKeyOnV(i + VCE_FIRST_VOICE, this.vabIds[5 + i], s16(prog), 0, c.pitchWord >> 8, (c.pitchWord & 0xff) >> 1, l, r);
        this.voiceMap[i] = s16(v); // stored sign-extended; -1 is not the 0xffff "free" mark
        c.prog = s16(prog); c.cont = 1; break;
      }
      case 4: this.rampOp(c, "vol", "volTarget", "volFrames", "volStep", i); break;
      case 5: this.rampOp(c, "pan", "panTarget", "panFrames", "panStep", i); break;
      case 17: this.rampOp(c, "vol2", "vol2Target", "vol2Frames", "vol2Step", i); break;
      case 6: { c.pc += 1; c.cont = 1; break; }
      case 7: case 8: { // 0x80027cf8 / 0x80027ddc
        const a = this.u16(c);
        c.pitchTarget = op === 7 ? a << 8 : c.pitchCur + (s16(a) << 8);
        c.pitchFrames = this.u16(c);
        c.pitchNow = c.pitchCur;
        if (c.pitchFrames === 0) c.pitchFrames = 1;
        c.pitchStep = cdiv(c.pitchTarget - c.pitchCur, c.pitchFrames);
        c.cont = 1; break;
      }
      case 9: { if (c.prog !== -1) ss.SsUtKeyOffV(s16(this.voiceMap[i])); c.prog = -1; c.cont = 1; break; }
      case 10: case 11: { // 0x80027ec8 / 0x80027f80
        const want = c.script[c.pc++];
        const to = this.u16(c);
        const hit = this.flags[c.id] === want;
        if (hit === (op === 10)) c.pc = to;
        c.cont = 1; break;
      }
      case 12: { c.loopCount = this.u16(c) || 1; c.loopPc = c.pc; c.cont = 1; break; }
      case 13: { c.loopCount = (c.loopCount - 1) & 0xffff; if (c.loopCount !== 0) c.pc = c.loopPc; c.cont = 1; break; }
      case 14: { this.stopEffect(i, 0); break; }
      case 15: { this.done[c.id] = 1; break; }
      case 16: { this.flags[c.id] = 0; break; }
      case 18: { // 0x80028148: pad vibration
        const small = c.script[c.pc++], large = c.script[c.pc++];
        if (this.rumbleOff === 0) {
          if (this.padVibration === 0) this.rumbleOut({ on: false });
          else this.rumbleOut({ on: true, small: small & 1, large });
          c.rumble = 1;
        }
        c.cont = 1; break;
      }
    }
  }

  rampOp(c, cur, target, frames, step, i) { // 0x80027a20 / 0x80027bf0 / 0x80027b08
    c[target] = c.script[c.pc++] << 8;
    c[frames] = this.u16(c);
    if (c[frames] === 0) c[frames] = 1;
    if (this.voiceMap[i] !== NONE16) c[step] = cdiv(c[target] - c[cur], c[frames]);
    c.cont = 1;
  }

  // 0x80026f90
  ramps(i) {
    const c = this.ch[i];
    if (c.pitchFrames !== 0) {
      c.pitchFrames--;
      if (c.pitchFrames === 0) c.pitchNow = c.pitchTarget; else c.pitchNow += c.pitchStep;
      const hi = c.pitchNow >> 8;
      const note = cdiv(hi, 256), frac = hi - cdiv(hi, 256) * 256;
      this.ss.SsUtChangePitch(s16(this.voiceMap[i]), this.vabIds[5 + i], c.prog, c.pitchWord >> 8, (c.pitchWord & 0xff) >> 1, s16(note), s16(cdiv(frac, 2)));
      c.pitchCur = c.pitchNow;
    }
    if (c.volFrames !== 0) { c.volFrames--; if (c.volFrames === 0) c.vol = c.volTarget; else c.vol += c.volStep; }
    if (c.masterFrames !== 0) {
      c.masterFrames--;
      if (c.masterFrames === 0) { c.master = c.masterTarget; if (c.masterTarget === 0) this.stopQueue[i] = 0; }
      else c.master += c.masterStep;
    }
    if (c.vol2Frames !== 0) { c.vol2Frames--; if (c.vol2Frames === 0) c.vol2 = c.vol2Target; else c.vol2 += c.vol2Step; }
    if (c.panFrames !== 0) { c.panFrames--; if (c.panFrames === 0) c.pan = c.panTarget; else c.pan += c.panStep; }
  }

  // 0x800272a4
  updateVolumes() {
    for (let i = 0; i < VCE_CHANNELS; i++) {
      const c = this.ch[i];
      if (this.active[i] !== 1 || !c.scriptLive) continue;
      const l = s16(((this.mix(c, false) >> 8) << 23) >>> 16);
      const r = s16(((this.mix(c, true) >> 8) << 23) >>> 16);
      this.ss.SsUtSetVVol(s16(this.voiceMap[i]), l, r);
    }
  }
}
