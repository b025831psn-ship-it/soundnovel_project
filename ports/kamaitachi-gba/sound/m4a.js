// MP2K (m4a) sound engine, ported to JS for the Kamaitachi no Yoru Advance (AKZJ) web port.
//
// The game links Nintendo's standard m4a library: m4aSoundInit at 080143E6 calls m4aSoundMode with
// 0096F500 (8-bit DAC, 18157 Hz, master volume 15, 5 DirectSound channels). This module replays the
// cartridge's own sound data (port-data/sound/m4a.bin, ROM bytes copied unchanged, pointers still
// bus addresses) the way the library does: once per VBlank the sequencer (MPlayMain) advances every
// music player, then the software mixer (SoundMainRAM) writes `samplesPerVBlank` signed 8-bit stereo
// samples. PSG voices go to a small model of the GBA's four tone generators (CgbSound).
//
// It has no DOM dependency: `vblank()` returns one frame of samples, and output.js plays them.

const ENV_ATTACK = 3, ENV_DECAY = 2, ENV_SUSTAIN = 1;
const SF_START = 0x80, SF_STOP = 0x40, SF_LOOP = 0x10, SF_ECHO = 0x04, SF_ENV = 0x03, SF_ON = 0xc7;
const FLG_VOLSET = 0x03, FLG_PITSET = 0x0c, FLG_START = 0x40, FLG_EXIST = 0x80;

export class Memory {
  // `bytes` is the cartridge slice starting at bus address `base`.
  constructor(bytes, base) {
    this.b = bytes;
    this.base = base;
    this.dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  has(a) { return a >= this.base && a < this.base + this.b.length; }
  u8(a) { return this.b[a - this.base]; }
  s8(a) { return (this.b[a - this.base] << 24) >> 24; }
  u16(a) { return this.dv.getUint16(a - this.base, true); }
  u32(a) { return this.dv.getUint32(a - this.base, true); }
}

// 12-byte ToneData: type, key, length, pan_sweep, wav/subgroup pointer, attack, decay, sustain, release
function readTone(mem, a) {
  return {
    type: mem.u8(a), key: mem.u8(a + 1), length: mem.u8(a + 2), panSweep: mem.u8(a + 3),
    wav: mem.u32(a + 4), attack: mem.u8(a + 8), decay: mem.u8(a + 9), sustain: mem.u8(a + 10), release: mem.u8(a + 11),
    keySplit: mem.u32(a + 8),
  };
}

function umul3232H32(a, b) {
  return Number((BigInt(a >>> 0) * BigInt(b >>> 0)) >> 32n);
}

function newTrack() {
  return {
    flags: 0, wait: 0, patternLevel: 0, repN: 0, gateTime: 0, key: 0, velocity: 127, runningStatus: 0,
    keyM: 0, pitM: 0, keyShift: 0, keyShiftX: 0, tune: 0, pitX: 0, bend: 0, bendRange: 2,
    volMR: 0, volML: 0, vol: 0, volX: 64, pan: 0, panX: 0,
    modM: 0, mod: 0, modT: 0, lfoSpeed: 22, lfoSpeedC: 0, lfoDelay: 0, lfoDelayC: 0,
    priority: 0, echoVolume: 0, echoLength: 0, chans: new Set(), tone: null, cmdPtr: 0, patternStack: [],
  };
}

class Player {
  constructor(index, maxTracks) {
    this.index = index;
    this.maxTracks = maxTracks;
    this.tracks = Array.from({ length: maxTracks }, newTrack);
    this.status = 0x80000000; // stopped
    this.song = -1;
    this.priority = 0;
    this.tempoD = 150; this.tempoU = 0x100; this.tempoI = 150; this.tempoC = 0;
    this.fadeOI = 0; this.fadeOC = 0; this.fadeOV = 0;
    this.voicegroup = 0;
    this.clock = 0;
  }
  get active() { return !(this.status & 0x80000000) && this.tracks.some((t) => t.flags & FLG_EXIST); }
}

export class M4A {
  // config: port-data/sound/m4a.json
  constructor(mem, config) {
    this.mem = mem;
    this.cfg = config;
    this.mixRate = config.mixRate;
    this.samples = config.samplesPerVBlank;
    this.masterVolume = config.masterVolume;
    this.reverb = config.reverb;
    this.divFreq = Math.floor((Math.floor(16777216 / this.mixRate) + 1) / 2);
    this.clockTable = Array.from({ length: 49 }, (_, i) => mem.u8(config.clockTable + i));
    this.channels = Array.from({ length: config.maxChannels }, () => ({ status: 0 }));
    this.cgb = Array.from({ length: 4 }, (_, i) => ({ status: 0, kind: i + 1, phase: 0, lfsr: 0x7fff }));
    this.players = [];
    for (let i = 0; i < config.playerCount; i++) {
      const rec = config.players + 12 * i;
      this.players.push(new Player(i, mem.u8(rec + 8)));
    }
    // Two frame buffers, as the library keeps for DMA; reverb reads the previous frames from them.
    this.buf = [0, 1].map(() => ({ r: new Int8Array(this.samples), l: new Int8Array(this.samples) }));
    this.frame = 0;
  }

  // m4aSongNumStart: the song table names the player; a lower-priority request does not interrupt.
  startSong(n) {
    const rec = this.cfg.songTable + 8 * n;
    const header = this.mem.u32(rec);
    const player = this.players[this.mem.u16(rec + 4)];
    if (!player) return false;
    const priority = this.mem.u8(header + 2);
    if (player.active && player.song !== n && priority < player.priority) return false;
    this.mplayStart(player, header, n);
    return true;
  }

  // m4aSongNumStop: stops the player only if it is playing that song.
  stopSong(n) {
    if (!this.mem.has(this.cfg.songTable + 8 * n + 6)) return; // the game may name an unused number
    const player = this.players[this.mem.u16(this.cfg.songTable + 8 * n + 4)];
    if (player && player.song === n) this.mplayStop(player);
  }

  stopAll() { for (const p of this.players) this.mplayStop(p); }

  // m4aMPlayFadeOut: volume drops by 4/64 every `speed` frames, then the player stops.
  fadeOut(playerIndex, speed) {
    const p = this.players[playerIndex];
    if (!p || !p.active) return;
    p.fadeOI = speed; p.fadeOC = speed; p.fadeOV = 64 << 2;
  }

  // m4aMPlayImmInit: applies the track start reset now instead of on the next MPlayMain, so a
  // volume set right after a song start is kept (the game calls it from 0800A1E8).
  immInit(playerIndex) {
    const p = this.players[playerIndex];
    if (!p) return;
    for (const t of p.tracks) if ((t.flags & FLG_EXIST) && (t.flags & FLG_START)) this.trackStartReset(t);
  }

  // m4aMPlayVolumeControl: tracks named in `bits` take volume >> 2 as volX (a u8).
  volumeControl(playerIndex, bits, volume) {
    const p = this.players[playerIndex];
    if (!p) return;
    p.tracks.forEach((t, i) => {
      if (!(bits & (1 << i)) || !(t.flags & FLG_EXIST)) return;
      t.volX = (volume >> 2) & 0xff;
      t.flags |= FLG_VOLSET;
    });
  }

  // m4aMPlayPanpotControl: panX = pan (s8), volume recomputed.
  panControl(playerIndex, bits, pan) {
    this.players[playerIndex]?.tracks.forEach((t, i) => {
      if (!(bits & (1 << i)) || !(t.flags & FLG_EXIST)) return;
      t.panX = (pan << 24) >> 24;
      t.flags |= FLG_VOLSET;
    });
  }

  // m4aMPlayPitchControl: keyShiftX = pitch >> 8, pitX = pitch & 0xff, pitch recomputed.
  pitchControl(playerIndex, bits, pitch) {
    this.players[playerIndex]?.tracks.forEach((t, i) => {
      if (!(bits & (1 << i)) || !(t.flags & FLG_EXIST)) return;
      t.keyShiftX = ((pitch << 16) >> 16) >> 8;
      t.pitX = pitch & 0xff;
      t.flags |= FLG_PITSET;
    });
  }

  // MPlayStart on a player the caller names (the game's effect scripts use players 1-10 this way,
  // 080023B0), with the song table's header for `song`. Same priority rule as startSong.
  playerStart(playerIndex, song) {
    const p = this.players[playerIndex];
    if (!p || !this.mem.has(this.cfg.songTable + 8 * song)) return false;
    const header = this.mem.u32(this.cfg.songTable + 8 * song);
    if (p.active && p.song !== song && this.mem.u8(header + 2) < p.priority) return false;
    this.mplayStart(p, header, song);
    return true;
  }

  // m4aMPlayStop
  playerStop(playerIndex) {
    const p = this.players[playerIndex];
    if (p) this.mplayStop(p);
  }

  // MusicPlayerInfo.status bit 31: set once the player is stopped or every track has ended.
  playerStopped(playerIndex) {
    const p = this.players[playerIndex];
    return !p || (p.status & 0x80000000) !== 0;
  }

  // The reset MPlayMain gives a track whose START flag is set: the first 0x40 bytes of
  // MusicPlayerTrack are cleared (cmdPtr and the pattern stack lie beyond them), then
  // flags = EXIST, bendRange 2, volX 64, lfoSpeed 22, tone.type 1.
  trackStartReset(t) {
    const keep = { cmdPtr: t.cmdPtr, patternStack: t.patternStack };
    Object.assign(t, newTrack(), keep, { flags: FLG_EXIST, velocity: 0 });
  }

  mplayStart(p, header, n) {
    const mem = this.mem;
    const count = Math.min(mem.u8(header), p.maxTracks);
    this.mplayStop(p);
    p.status = 0;
    p.song = n;
    p.priority = mem.u8(header + 2);
    p.voicegroup = mem.u32(header + 4);
    p.tempoD = 150; p.tempoU = 0x100; p.tempoI = 150; p.tempoC = 0;
    p.fadeOI = 0;
    p.clock = 0;
    for (let i = 0; i < p.maxTracks; i++) {
      const t = newTrack();
      p.tracks[i] = t;
      if (i < count) {
        t.flags = FLG_EXIST | FLG_START;
        t.cmdPtr = mem.u32(header + 8 + 4 * i);
      }
    }
    const reverb = mem.u8(header + 3);
    if (reverb & 0x80) this.reverb = reverb & 0x7f;
  }

  mplayStop(p) {
    for (const t of p.tracks) this.trackStop(t);
    p.status |= 0x80000000;
  }

  trackStop(t) {
    if (!(t.flags & FLG_EXIST)) return;
    for (const c of t.chans) {
      if (c.status & SF_ON) c.status |= SF_STOP;
      c.track = null;
    }
    t.chans.clear();
    t.flags = 0;
  }

  // ---- sequencer (MPlayMain) ----------------------------------------------------------------

  mplayMain(p) {
    if (p.status & 0x80000000) return;
    if (p.fadeOI) this.fadeOutBody(p);
    p.tempoC += p.tempoI;
    while (p.tempoC >= 150) {
      let alive = 0;
      for (const t of p.tracks) {
        if (!(t.flags & FLG_EXIST)) continue;
        alive++;
        for (const c of [...t.chans]) {
          if (!(c.status & SF_ON)) { this.clearChain(c); continue; }
          if (c.gateTime && --c.gateTime === 0) c.status |= SF_STOP;
        }
        if (t.flags & FLG_START) this.trackStartReset(t);
        while (t.wait === 0 && (t.flags & FLG_EXIST)) this.trackCommand(p, t);
        if (!(t.flags & FLG_EXIST)) continue;
        t.wait--;
        if (t.lfoSpeed && t.mod) {
          if (t.lfoDelayC) t.lfoDelayC--;
          else {
            t.lfoSpeedC = (t.lfoSpeedC + t.lfoSpeed) & 0xff;
            const s = (t.lfoSpeedC << 24) >> 24;
            const tri = (t.lfoSpeedC - 0x40) & 0x80 ? s : 0x80 - t.lfoSpeedC;
            const m = (t.mod * tri) >> 6;
            if (m !== t.modM) { t.modM = m; t.flags |= t.modT === 0 ? FLG_PITSET : FLG_VOLSET; }
          }
        }
      }
      p.clock++;
      p.tempoC -= 150;
      if (!alive) { p.status |= 0x80000000; break; }
    }
    for (const t of p.tracks) {
      if (!(t.flags & FLG_EXIST) || !(t.flags & (FLG_VOLSET | FLG_PITSET))) continue;
      this.trkVolPitSet(t);
      for (const c of t.chans) this.chnUpdate(c, t);
    }
  }

  fadeOutBody(p) {
    if (--p.fadeOC > 0) return;
    p.fadeOC = p.fadeOI;
    p.fadeOV -= 4 << 2;
    if (p.fadeOV <= 0) { p.fadeOI = 0; this.mplayStop(p); return; }
    for (const t of p.tracks) {
      if (!(t.flags & FLG_EXIST)) continue;
      t.volX = p.fadeOV >> 2;
      t.flags |= FLG_VOLSET;
    }
  }

  readArg(t) { const v = this.mem.u8(t.cmdPtr); t.cmdPtr++; return v; }

  trackCommand(p, t) {
    const mem = this.mem;
    let cmd = mem.u8(t.cmdPtr);
    if (cmd < 0x80) cmd = t.runningStatus;
    else { t.cmdPtr++; if (cmd >= 0xbd) t.runningStatus = cmd; }
    if (cmd >= 0xcf) { this.plyNote(p, t, cmd); return; }
    if (cmd <= 0xb0) { t.wait = this.clockTable[cmd - 0x80]; return; }
    switch (cmd) {
      case 0xb1: this.trackStop(t); break; // FINE
      case 0xb2: t.cmdPtr = mem.u32(t.cmdPtr); break; // GOTO
      case 0xb3: // PATT
        if (t.patternLevel < 3) { t.patternStack[t.patternLevel++] = t.cmdPtr + 4; t.cmdPtr = mem.u32(t.cmdPtr); } else t.cmdPtr += 4;
        break;
      case 0xb4: // PEND
        if (t.patternLevel) t.cmdPtr = t.patternStack[--t.patternLevel];
        break;
      case 0xb5: { // REPT count, address
        const n = this.readArg(t);
        if (n === 0) { t.cmdPtr = mem.u32(t.cmdPtr); break; }
        if (++t.repN < n) t.cmdPtr = mem.u32(t.cmdPtr);
        else { t.repN = 0; t.cmdPtr += 4; }
        break;
      }
      case 0xb9: t.cmdPtr += 3; break; // MEMACC (not used by this game's tracks)
      case 0xba: t.priority = this.readArg(t); break;
      case 0xbb: p.tempoD = this.readArg(t) * 2; p.tempoI = (p.tempoD * p.tempoU) >> 8; break;
      case 0xbc: t.keyShift = (this.readArg(t) << 24) >> 24; t.flags |= FLG_PITSET; break;
      case 0xbd: { // VOICE
        const v = this.readArg(t);
        t.tone = readTone(mem, p.voicegroup + 12 * v);
        break;
      }
      case 0xbe: t.vol = this.readArg(t); t.flags |= FLG_VOLSET; break;
      case 0xbf: t.pan = this.readArg(t) - 0x40; t.flags |= FLG_VOLSET; break;
      case 0xc0: t.bend = this.readArg(t) - 0x40; t.flags |= FLG_PITSET; break;
      case 0xc1: t.bendRange = this.readArg(t); t.flags |= FLG_PITSET; break;
      case 0xc2: t.lfoSpeed = this.readArg(t); t.lfoDelayC = t.lfoDelay; if (!t.lfoSpeed) this.clearModM(t); break;
      case 0xc3: t.lfoDelay = this.readArg(t); t.lfoDelayC = t.lfoDelay; break;
      case 0xc4: t.mod = this.readArg(t); if (!t.mod) this.clearModM(t); break;
      case 0xc5: t.modT = this.readArg(t); this.clearModM(t); break;
      case 0xc8: t.tune = this.readArg(t) - 0x40; t.flags |= FLG_PITSET; break;
      case 0xcd: { // XCMD
        const x = this.readArg(t);
        if (x === 0x08) t.echoVolume = this.readArg(t);
        else if (x === 0x09) t.echoLength = this.readArg(t);
        else t.cmdPtr++;
        break;
      }
      case 0xce: { // EOT: release the tied note with this key
        let key = t.key;
        if (mem.u8(t.cmdPtr) < 0x80) { key = this.readArg(t); t.key = key; }
        for (const c of t.chans) {
          if ((c.status & SF_ON) && !(c.status & SF_STOP) && c.midiKey === key && c.gateTime === 0) c.status |= SF_STOP;
        }
        break;
      }
      default: this.trackStop(t); // an op this driver would not reach in the game's data
    }
  }

  clearModM(t) {
    t.lfoSpeedC = 0;
    t.modM = 0;
    t.flags |= t.modT === 0 ? FLG_PITSET : FLG_VOLSET;
  }

  // TrkVolPitSet (m4a.c)
  trkVolPitSet(t) {
    if (t.flags & FLG_VOLSET) {
      let x = (t.vol * t.volX) >>> 5;
      if (t.modT === 1) x = (x * (t.modM + 128)) >>> 7;
      let y = 2 * t.pan + t.panX;
      if (t.modT === 2) y += t.modM;
      y = Math.max(-128, Math.min(127, y));
      t.volMR = ((y + 128) * x) >>> 8;
      t.volML = ((127 - y) * x) >>> 8;
    }
    if (t.flags & FLG_PITSET) {
      const bend = t.bend * t.bendRange;
      let x = (t.tune + bend) * 4 + (t.keyShift << 8) + (t.keyShiftX << 8) + t.pitX;
      if (t.modT === 0) x += 16 * t.modM;
      t.keyM = x >> 8;
      t.pitM = x & 0xff;
    }
    t.flags &= ~(FLG_PITSET | FLG_VOLSET);
  }

  // ply_note: N01-N96 and TIE, with optional key, velocity and extra gate bytes
  plyNote(p, t, cmd) {
    const mem = this.mem;
    t.gateTime = cmd === 0xcf ? 0 : this.clockTable[cmd - 0xcf];
    if (mem.u8(t.cmdPtr) < 0x80) {
      t.key = this.readArg(t);
      if (mem.u8(t.cmdPtr) < 0x80) {
        t.velocity = this.readArg(t);
        if (mem.u8(t.cmdPtr) < 0x80) t.gateTime += this.readArg(t);
      }
    }
    if (!t.tone) return;
    let tone = t.tone;
    let key = t.key;
    let rhythmPan = 0;
    if (tone.type & 0xc0) {
      if (tone.type & 0x40) tone = readTone(mem, tone.wav + 12 * mem.u8(tone.keySplit + key)); // key split
      else { // drum kit: one voice per key, played at its own key
        tone = readTone(mem, tone.wav + 12 * key);
        if (tone.panSweep & 0x80) rhythmPan = ((tone.panSweep - 0xc0) * 2) << 24 >> 24;
        key = tone.key;
      }
      if (tone.type & 0xc0) return;
    }
    let priority = p.priority + t.priority;
    if (priority > 0xff) priority = 0xff;
    const cgbType = tone.type & 7;
    let c;
    if (cgbType) {
      c = this.cgb[cgbType - 1];
      if ((c.status & SF_ON) && !(c.status & SF_STOP) && c.priority > priority) return;
    } else {
      c = this.allocChannel(priority, t);
      if (!c) return;
    }
    this.clearChain(c);
    if (this.trkVolPitPending(t)) this.trkVolPitSet(t);
    Object.assign(c, {
      track: t, player: p, priority, key: tone.type & 8 ? tone.key : key, midiKey: key, rhythmPan,
      type: tone.type, wav: tone.wav, length: tone.length, panSweep: tone.panSweep,
      attack: tone.attack, decay: tone.decay, sustain: tone.sustain, release: tone.release,
      echoVolume: t.echoVolume, echoLength: t.echoLength, gateTime: t.gateTime, velocity: t.velocity,
      status: SF_START,
    });
    t.chans.add(c);
    this.chnUpdate(c, t);
  }

  trkVolPitPending(t) { return (t.flags & (FLG_VOLSET | FLG_PITSET)) !== 0; }

  // DirectSound channel choice: a free one, else the quietest releasing one, else a lower priority one.
  allocChannel(priority, t) {
    let best = null, bestRel = false;
    for (const c of this.channels) {
      if (!(c.status & SF_ON)) return c;
      if (c.status & SF_STOP) {
        if (!bestRel || c.priority < best.priority) { best = c; bestRel = true; }
      } else if (!bestRel && (c.priority < priority || (c.priority === priority && best === null))) {
        if (!best || c.priority < best.priority) best = c;
      }
    }
    return best;
  }

  clearChain(c) {
    if (c.track) c.track.chans.delete(c);
    c.track = null;
  }

  // ChnVolSetAsm and the pitch update for one channel of a track
  chnUpdate(c, t) {
    const rp = c.rhythmPan;
    const r = ((c.velocity * (128 + rp)) * t.volMR) >> 14;
    const l = ((c.velocity * (127 - rp)) * t.volML) >> 14;
    c.rightVolume = Math.min(255, r);
    c.leftVolume = Math.min(255, l);
    const key = c.midiKey + t.keyM;
    if (c.type & 7) c.frequency = this.cgbFreq(c.type & 7, key, t.pitM);
    else if (c.type & 8) c.frequency = 18000;
    else c.frequency = this.midiKeyToFreq(c.wav, key, t.pitM);
  }

  midiKeyToFreq(wav, key, fine) {
    const mem = this.mem, cfg = this.cfg;
    let f = (fine & 0xff) << 24 >>> 0;
    if (key > 178) { key = 178; f = 0xff000000; }
    if (key < 0) key = 0;
    const s1 = mem.u8(cfg.scaleTable + key), s2 = mem.u8(cfg.scaleTable + key + 1);
    const v1 = mem.u32(cfg.freqTable + 4 * (s1 & 15)) >>> (s1 >> 4);
    const v2 = mem.u32(cfg.freqTable + 4 * (s2 & 15)) >>> (s2 >> 4);
    return umul3232H32(mem.u32(wav + 4), (v1 + umul3232H32((v2 - v1) >>> 0, f)) >>> 0);
  }

  // MidiKeyToCgbFreq (m4a.c): the 11-bit period register for channels 1-3, the NR43 value for noise.
  cgbFreq(kind, key, fine) {
    const mem = this.mem, cfg = this.cfg;
    if (kind === 4) return mem.u8(cfg.noiseTable + (key <= 20 ? 0 : Math.min(59, key - 21)));
    if (key <= 35) { fine = 0; key = 0; } else { key -= 36; if (key > 130) { key = 130; fine = 255; } }
    const at = (k) => { const v = mem.u8(cfg.cgbScaleTable + k); return (mem.u16(cfg.cgbFreqTable + 2 * (v & 15)) << 16 >> 16) >> (v >> 4); };
    const v1 = at(key), v2 = at(key + 1);
    return v1 + ((fine * (v2 - v1)) >> 8) + 2048;
  }

  // ---- mixer (SoundMainRAM) -----------------------------------------------------------------

  vblank() {
    for (const p of this.players) this.mplayMain(p);
    const n = this.samples;
    const cur = this.buf[this.frame & 1], prev = this.buf[(this.frame + 1) & 1];
    if (this.reverb) {
      for (let i = 0; i < n; i++) {
        const v = ((cur.r[i] + cur.l[i] + prev.r[i] + prev.l[i]) * this.reverb) >> 9;
        cur.r[i] = v; cur.l[i] = v;
      }
    } else { cur.r.fill(0); cur.l.fill(0); }
    for (const c of this.channels) this.mixChannel(c, cur, n);
    const out = { r: new Float32Array(n), l: new Float32Array(n) };
    for (let i = 0; i < n; i++) { out.r[i] = cur.r[i] / 128; out.l[i] = cur.l[i] / 128; }
    for (const c of this.cgb) this.mixCgb(c, out, n);
    this.frame++;
    return out;
  }

  envelope(c) {
    if (c.status & SF_START) {
      if (c.status & SF_STOP) { c.status = 0; return false; }
      const mem = this.mem;
      c.status = ENV_ATTACK;
      c.pos = c.wav + 16;
      c.count = mem.u32(c.wav + 12);
      c.loopStart = mem.u32(c.wav + 8);
      c.fw = 0;
      c.env = 0;
      if (mem.u16(c.wav + 2) & 0xc000) c.status |= SF_LOOP;
      return this.attack(c);
    }
    if (c.status & SF_ECHO) {
      if (--c.echoLength <= 0) { c.status = 0; return false; }
      return true;
    }
    if (c.status & SF_STOP) {
      c.env = (c.env * c.release) >> 8;
      if (c.env <= c.echoVolume) {
        if (c.echoVolume === 0) { c.status = 0; return false; }
        c.env = c.echoVolume;
        c.status |= SF_ECHO;
      }
      return true;
    }
    const stage = c.status & SF_ENV;
    if (stage === ENV_DECAY) {
      c.env = (c.env * c.decay) >> 8;
      if (c.env <= c.sustain) {
        c.env = c.sustain;
        if (c.env === 0) { c.status |= SF_STOP; return this.envelope(c); }
        c.status = (c.status & ~SF_ENV) | ENV_SUSTAIN;
      }
      return true;
    }
    if (stage === ENV_ATTACK) return this.attack(c);
    return true;
  }

  attack(c) {
    c.env += c.attack;
    if (c.env >= 0xff) { c.env = 0xff; c.status = (c.status & ~SF_ENV) | ENV_DECAY; }
    return true;
  }

  mixChannel(c, buf, n) {
    if (!(c.status & SF_ON)) return;
    if (!this.envelope(c)) { this.clearChain(c); return; }
    const scaled = ((this.masterVolume + 1) * c.env) >> 4;
    const vr = (scaled * c.rightVolume) >> 8, vl = (scaled * c.leftVolume) >> 8;
    const mem = this.mem, end = c.wav + 16 + c.count;
    const fixed = (c.type & 8) !== 0;
    const step = fixed ? 1 << 23 : Math.floor(c.frequency * this.divFreq);
    for (let i = 0; i < n; i++) {
      if (c.pos >= end) {
        if (c.status & SF_LOOP) c.pos = c.wav + 16 + c.loopStart + (c.pos - end);
        else { c.status = 0; this.clearChain(c); return; }
      }
      let s = mem.s8(c.pos);
      if (!fixed) {
        const nextPos = c.pos + 1 < end ? c.pos + 1 : (c.status & SF_LOOP ? c.wav + 16 + c.loopStart : c.pos);
        s += ((mem.s8(nextPos) - s) * c.fw) >> 23;
      }
      buf.r[i] = buf.r[i] + ((s * vr) >> 8);
      buf.l[i] = buf.l[i] + ((s * vl) >> 8);
      c.fw += step;
      c.pos += c.fw >>> 23;
      c.fw &= 0x7fffff;
    }
  }

  // PSG voices (CgbSound): the GBA's own tone generators. Volume is a 0-15 envelope that m4a steps
  // once per frame toward goals from CgbModVol; pitch is the period register from cgbFreq.
  mixCgb(c, out, n) {
    if (!(c.status & SF_ON)) return;
    const kind = c.type & 7;
    const goal = Math.min(15, (c.rightVolume + c.leftVolume) >> 4);
    const sustainGoal = (goal * c.sustain + 15) >> 4;
    if (c.status & SF_START) {
      c.status = ENV_ATTACK; c.phase = 0; c.lfsr = 0x7fff; c.timer = 0;
      c.level = c.attack ? 0 : goal;
      c.frames = c.length || 0;
    }
    c.timer++;
    if (c.status & SF_STOP) {
      if (!c.release) c.level = 0;
      else if (c.timer >= c.release) { c.timer = 0; c.level--; }
      if (c.level <= 0) { c.status = 0; this.clearChain(c); return; }
    } else if ((c.status & SF_ENV) === ENV_ATTACK) {
      if (c.level >= goal) { c.level = goal; c.status = (c.status & ~SF_ENV) | ENV_DECAY; c.timer = 0; }
      else if (c.timer >= c.attack) { c.timer = 0; c.level++; }
    } else if ((c.status & SF_ENV) === ENV_DECAY) {
      if (!c.decay || c.level <= sustainGoal) { c.level = sustainGoal; c.status = (c.status & ~SF_ENV) | ENV_SUSTAIN; }
      else if (c.timer >= c.decay) { c.timer = 0; c.level--; }
      if (c.level <= 0) { c.status |= SF_STOP; }
    }
    if (c.frames && --c.frames === 0) c.status |= SF_STOP;
    // CgbModVol pan: a side at less than half of the other is silenced
    const onR = !((c.leftVolume >> 1) > c.rightVolume), onL = !((c.rightVolume >> 1) > c.leftVolume);
    const amp = (c.level / 15) * 0.25;
    const x = 2048 - (c.frequency & 2047 || 2047);
    let hz;
    if (kind === 4) {
      const r = c.frequency & 7, sh = c.frequency >> 4;
      hz = 524288 / (r || 0.5) / Math.pow(2, sh + 1);
    } else hz = (kind === 3 ? 65536 : 131072) / x;
    const dt = hz / this.mixRate;
    for (let i = 0; i < n; i++) {
      let v;
      if (kind === 3) {
        const idx = Math.floor(c.phase * 32) & 31;
        const byte = this.mem.has(c.wav) ? this.mem.u8(c.wav + (idx >> 1)) : 0x88;
        v = (((idx & 1) ? byte & 15 : byte >> 4) - 7.5) / 7.5;
        c.phase = (c.phase + dt) % 1;
      } else if (kind === 4) {
        c.phase += dt;
        const short = (c.frequency & 8) !== 0;
        while (c.phase >= 1) {
          c.phase -= 1;
          const bit = (c.lfsr ^ (c.lfsr >> 1)) & 1;
          c.lfsr = (c.lfsr >> 1) | (bit << 14);
          if (short) c.lfsr = (c.lfsr & ~0x40) | (bit << 6);
        }
        v = c.lfsr & 1 ? -1 : 1;
      } else {
        const duty = [0.125, 0.25, 0.5, 0.75][c.wav & 3];
        v = c.phase < duty ? 1 : -1;
        c.phase = (c.phase + dt) % 1;
      }
      if (onR) out.r[i] += v * amp;
      if (onL) out.l[i] += v * amp;
    }
  }
}
