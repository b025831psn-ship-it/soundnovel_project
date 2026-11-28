// Kamaitachi no Yoru 2 (PS2) sound-effect engine.
//
// Rebuilt from the game's own IOP sound driver (IRX/IOPSOUND.IRX, "IopSoundDriver/SQUARE"):
// the original sep.pac sequences are interpreted command by command and the original
// wave####.wd banks are decoded from PS-ADPCM, then mixed like the SPU2 at 48 kHz.
// Pure JS with no DOM dependency so it runs in an AudioWorklet and in Node.
//
// Driver facts (IOPSOUND.IRX, addresses are .text offsets):
// - Hardware timer at 36.864 MHz / 0x25800 = 240 Hz (0xd898). Each interrupt runs one frame.
// - SE tracks: accumulator -= 120, on <= 0 += 300 and advance one tick (0x57ec)
//   = 96 ticks/s = 120 BPM at 48 PPQN.
// - Track stream: [varlen delta] then repeated [cmd][args][varlen delta] (0x51d4, 0x4fe8).
// - One SPU voice per track (track+0x137); a new key-on retriggers that voice.
// - Pitch (0x2d4): 1/256-semitone sum -> SPU pitch with the driver's two tables.
// - Volume/pan (0x3a4): products of master, expression, velocity, volume, region volume,
//   then the driver's 256-entry pan table.
export const SPU_RATE = 48000;
const FRAME = SPU_RATE / 240;           // samples per driver frame

// ---- containers -------------------------------------------------------------------------
export class SepPack {
  constructor(buffer) {
    const v = new DataView(buffer), n = v.getUint16(0, true);
    this.view = v; this.bytes = new Uint8Array(buffer); this.count = n;
    this.off = []; this.size = []; this.ids = [];
    for (let i = 0; i < n; i++) {
      this.off.push(v.getUint16(2 + 2 * i, true) * 2);
      this.size.push(v.getUint16(2 + 2 * n + 2 * i, true));
    }
    const idBase = 2 + 4 * n + 2;
    for (let i = 0; i < n; i++) this.ids.push(v.getUint32(idBase + 4 * i, true));
    this.base = idBase + 4 * n;
  }
  // Binary search like the EE loader (0x1be248).
  index(id) {
    let lo = 0, hi = this.count - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, x = this.ids[mid];
      if (x === id) return mid;
      if (x < id) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
  }
  get(id) {
    const i = this.index(id);
    if (i < 0) return null;
    const o = this.base + this.off[i], v = this.view;
    const voices = this.bytes[o + 8], bank = v.getUint16(o + 9, true), flag = v.getUint16(o + 11, true);
    let q = o + 13 + 2 * voices; const tracks = [];
    for (let k = 0; k < voices; k++) {
      const len = v.getUint16(o + 13 + 2 * k, true);
      tracks.push(this.bytes.subarray(q, q + len)); q += len;
    }
    return {id, bank, flag, tracks};
  }
}

export class WdBank {
  constructor(buffer) {
    const v = new DataView(buffer), b = new Uint8Array(buffer);
    if (b[0] !== 0x57 || b[1] !== 0x44) throw new Error('not a WD bank');
    this.id = v.getUint16(2, true);
    const ninst = v.getUint32(8, true), nreg = v.getUint32(12, true);
    this.instruments = [];
    for (let i = 0; i < ninst; i++) this.instruments.push(v.getUint32(32 + 4 * i, true));
    const first = this.instruments[0];
    this.dataStart = first + nreg * 32;
    this.bytes = b; this.view = v; this.cache = new Map();
  }
  region(o) {
    const v = this.view, b = this.bytes;
    return {
      at: o, flags: v.getUint32(o, true), offset: v.getUint32(o + 4, true), loop: v.getUint32(o + 8, true),
      adsr1: v.getUint16(o + 12, true), adsr2: v.getUint16(o + 14, true),
      tune: v.getInt32(o + 16, true) >> 16, keyHi: v.getInt8(o + 20), velHi: b[o + 21],
      volume: b[o + 22], pan: b[o + 23], fx: v.getInt8(o + 24),
    };
  }
  // Region choice (0xb48): split by key bound, then velocity bound.
  select(program, key, vel) {
    if (program >= this.instruments.length) return null;
    let o = this.instruments[program], r = this.region(o);
    if (!(r.flags & 0x30000)) return r;
    while (!(r.flags & 0x200) && r.keyHi < key) { o += (r.flags & 1) ? 64 : 32; r = this.region(o); }
    const k = r.keyHi;
    while (!(r.flags & 0x200) && r.velHi < vel && r.keyHi === k) { o += (r.flags & 1) ? 64 : 32; r = this.region(o); }
    return r;
  }
  samples(region) {
    const key = region.offset;
    if (!this.cache.has(key)) this.cache.set(key, decodeAdpcm(this.bytes, this.dataStart + region.offset));
    return this.cache.get(key);
  }
}

// ---- PS-ADPCM ---------------------------------------------------------------------------
const FILTER = [[0, 0], [60, 0], [115, -52], [98, -55], [122, -60]];
export function decodeAdpcm(bytes, start) {
  const out = []; let s1 = 0, s2 = 0, loop = -1, looping = false;
  for (let p = start; p + 16 <= bytes.length; p += 16) {
    const shift = bytes[p] & 15, filter = Math.min(4, bytes[p] >> 4), flags = bytes[p + 1];
    if (flags & 4) loop = out.length;
    const [f0, f1] = FILTER[filter];
    for (let i = 0; i < 28; i++) {
      const byte = bytes[p + 2 + (i >> 1)];
      let n = (i & 1 ? byte >> 4 : byte & 15) << 12;
      if (n & 0x8000) n -= 0x10000;
      let s = (n >> shift) + ((s1 * f0 + s2 * f1 + 32) >> 6);
      s = Math.max(-32768, Math.min(32767, s));
      out.push(s); s2 = s1; s1 = s;
    }
    if (flags & 1) { looping = !!(flags & 2); break; }
  }
  return {data: Int16Array.from(out), loop: looping ? Math.max(0, loop) : -1};
}

// ---- SPU envelope (ADSR1/ADSR2 register semantics) --------------------------------------
class Envelope {
  constructor(adsr1, adsr2) { this.adsr1 = adsr1; this.adsr2 = adsr2; this.level = 0; this.phase = 'off'; }
  set(rate, decreasing, exponential) {
    this.rate = rate; this.dec = decreasing; this.exp = exponential; this.counter = 0;
    let step = 7 - (rate & 3); if (decreasing) step = ~step;
    let inc = 0x8000;
    if (rate < 44) step <<= 11 - (rate >> 2);
    else if (rate >= 48) { inc >>= (rate >> 2) - 11; if ((rate & 3) !== 3) inc = Math.max(inc, 1); }
    this.step = step; this.inc = inc;
  }
  keyOn() {
    this.level = 0; this.phase = 'attack';
    this.set((this.adsr1 >> 8) & 0x7f, false, !!(this.adsr1 & 0x8000));
  }
  keyOff() {
    if (this.phase === 'off') return;
    this.phase = 'release';
    this.set((this.adsr2 & 0x1f) << 2, true, !!(this.adsr2 & 0x20));
  }
  tick() {
    if (this.phase === 'off') return 0;
    let step = this.step, inc = this.inc;
    if (this.exp) {
      if (this.dec) step = (step * this.level) >> 15;
      else if (this.level >= 0x6000) {
        if (this.rate < 40) step >>= 2;
        else if (this.rate >= 44) inc >>= 2;
        else { step >>= 1; inc >>= 1; }
      }
    }
    this.counter += inc;
    if (this.counter & 0x8000) {
      this.counter = 0;
      this.level = Math.max(0, Math.min(0x7fff, this.level + step));
    }
    if (this.phase === 'attack' && this.level >= 0x7fff) {
      this.phase = 'decay';
      this.set(((this.adsr1 >> 4) & 15) << 2, true, true);
    } else if (this.phase === 'decay' && this.level <= ((this.adsr1 & 15) + 1) * 0x800) {
      this.phase = 'sustain';
      this.set((this.adsr2 >> 6) & 0x7f, !!(this.adsr2 & 0x4000), !!(this.adsr2 & 0x8000));
    } else if (this.phase === 'release' && this.level <= 0) this.phase = 'off';
    return this.level;
  }
}

// ---- driver tables ----------------------------------------------------------------------
// 0x13774: 2^(n/12) * 0x20000 ; 0x137a4: 2^(f/3072) * 0x10000 (256 fine steps per semitone)
const SEMI = [0x20000, 0x21e71, 0x23eb3, 0x260df, 0x28514, 0x2ab70, 0x2d413, 0x2ff22, 0x32cbf, 0x35d13, 0x39047, 0x3c686];
const FINE = Array.from({length:256}, (_, f) => Math.round(0x10000 * 2 ** (f / 3072)));
// 0x13d54: pan law, index 0..255 with center 128 (L = tab[p], R = tab[255 - p]).
const PAN = buildPan();
function buildPan() {
  // Sampled every 16 from the driver: 0,112,192,240,256,237,218,199,182,133,88,42,0,0,0,0
  const knots = [0, 112, 192, 240, 256, 237, 218, 199, 182, 133, 88, 42, 0, 0, 0, 0, 0];
  return Array.from({length:256}, (_, i) => {
    const a = knots[i >> 4], b = knots[(i >> 4) + 1];
    return Math.round(a + (b - a) * (i & 15) / 16);
  });
}
// Driver 0x2d4. sum = 1/256 semitones from key 0; detune = track+0x130 (cmd 0x58).
export function spuPitch(sum, detune = 0) {
  let n = sum, oct = 0;
  while (n < 0) { n += 0xc00; oct--; }
  const semis = (n >> 8) & 0x7f;
  oct += Math.floor(semis / 12);
  let p = Math.floor(Math.floor(SEMI[semis % 12] / 2 ** (10 - oct)) * FINE[n & 0xff] / 0x10000);
  if (detune > 0) p += (p * (detune + 1)) >> 7;
  else if (detune < 0) p = (p * (detune & 0xff)) >> 8;
  return p;
}
// LFO waveforms (table 0x14760[0..15]); x is a 10-bit phase, result is +-0x10000.
function wave(kind, x) {
  const sine = i => Math.round(65536 * Math.sin(Math.PI * (i & 0x1ff) / 512)) * (i & 0x200 ? -1 : 1);
  const tri = i => { const f = (i & 0xff) << 8; return [f, 0x10000 - f, -f, f - 0x10000][(i >> 8) & 3]; };
  const saw = i => (((i >> 2) & 0xff) << 24 >> 24) << 8;
  const sq = i => i & 0x200 ? -0x10000 : 0x10000;
  switch (kind & 15) {
    case 0: return sine(x); case 1: return tri(x); case 2: return saw(x); case 4: return 0;
    case 8: return sine(x ^ 0x200); case 9: return tri(x ^ 0x200); case 10: return saw(~x);
    case 11: return sq(x ^ 0x200); case 3: return sq(x); default: return 0;
  }
}

function varlen(t, i) {
  let v = 0, b;
  do { b = t[i++]; v = (v << 7) | (b & 0x7f); } while (b & 0x80);
  return [v, i];
}
// Argument layout per command, read from the handler table at .data 0x147a0.
const ARGS = {0x00:'',0x01:'',0x03:'',0x04:'',0x05:'b',0x06:'',0x08:'b',0x10:'',0x11:'bb',0x12:'b',0x13:'b',
  0x18:'',0x19:'bb',0x20:'b',0x22:'b',0x23:'Vb',0x24:'b',0x25:'Vb',0x26:'b',0x27:'Vb',0x28:'V',0x29:'',
  0x2a:'',0x2b:'',0x2c:'Vb',0x2e:'',0x2f:'',0x30:'',0x31:'b',0x34:'b',0x35:'b',0x40:'bbb',0x48:'bbb',
  0x50:'bbb',0x56:'b',0x58:'b',0x59:'b',0x5a:'b',0x5b:'b',0x60:'',0x62:'bb',0x78:'bb',0x79:'b',0x7f:''};
export function parseTrack(t) {
  const out = []; let [tick, i] = varlen(t, 0);
  while (i < t.length) {
    const cmd = t[i++], spec = ARGS[cmd];
    if (spec === undefined) return {events: out, error: 'cmd 0x' + cmd.toString(16)};
    const args = [];
    for (const k of spec) {
      if (i >= t.length) return {events: out, error: 'truncated'};
      if (k === 'b') args.push(t[i++]); else { let v; [v, i] = varlen(t, i); args.push(v); }
    }
    out.push({tick, cmd, args});
    if (cmd === 0 || (cmd === 6 && i >= t.length)) return {events: out, error: null};
    if (i >= t.length) return {events: out, error: 'truncated'};
    let d; [d, i] = varlen(t, i); tick += d;
  }
  return {events: out, error: 'no end'};
}

const s8 = x => x << 24 >> 24;
// Linear slide (driver 0x1b90): value moves to target over n ticks.
class Slide {
  constructor(value) { this.value = value; this.n = 0; this.step = 0; }
  to(target, n) { n = Math.max(1, n); this.step = (target - this.value) / n; this.n = n; }
  tick() { if (this.n > 0) { this.value += this.step; if (--this.n === 0) this.value = Math.round(this.value); } }
}
class Lfo {
  constructor() { this.on = false; }
  set(depth, rate, kind) { this.on = true; this.depth = depth; this.inc = 0x100000 / (rate || 256); this.kind = kind; this.phase = 0; }
  tick() { if (this.on) this.phase += this.inc; }
  get value() { return this.on ? wave(this.kind, (this.phase >> 12) & 0x3ff) : 0; }
}

// ---- one SE instance --------------------------------------------------------------------
class Track {
  constructor(seq, data, bank) {
    this.seq = seq; this.data = data; this.bank = bank;
    let d; [d, this.pos] = varlen(data, 0); this.wait = d; this.acc = 1; this.done = false;
    this.program = 0; this.key = 60; this.vel = 127;
    this.vol = new Slide(0x3fff); this.expr = new Slide(0x3fff); this.pan = new Slide(0x80);
    this.bend = new Slide(0); this.transpose = 0; this.detune = 0;
    this.legato = false; this.started = false; this.porta = 0;
    this.adsr1 = null; this.adsr2 = null;
    this.loops = []; this.vib = new Lfo(); this.trem = new Lfo(); this.panLfo = new Lfo();
    this.voice = null;
  }
  read() { return this.data[this.pos++]; }
  readVar() { let v; [v, this.pos] = varlen(this.data, this.pos); return v; }
  step() {                                     // one sequencer tick
    if (this.done) return;
    this.wait--;
    let guard = 0;
    while (this.wait <= 0 && !this.done && guard++ < 4096) {
      this.exec(this.read());
      if (this.done) break;
      if (this.pos >= this.data.length) { this.end(); break; }
      this.wait += this.readVar();
    }
    for (const s of [this.vol, this.expr, this.pan, this.bend]) s.tick();
    this.vib.tick(); this.trem.tick(); this.panLfo.tick();
  }
  exec(cmd) {
    const b = () => this.read(), sb = () => s8(this.read());
    switch (cmd) {
      case 0x00: this.end(); return;
      case 0x04: this.loops.push({pos: this.pos, count: 0}); return;
      case 0x05: { let n = b() || 256; const l = this.loops.at(-1); if (!l) return;
        if (++l.count === n) { this.loops.pop(); return; } this.pos = l.pos; return; }
      case 0x06: { const l = this.loops.at(-1); if (l) this.pos = l.pos; else this.end(); return; }
      case 0x10: this.noteOn(); return;
      case 0x11: this.key = b(); this.vel = b(); this.noteOn(); return;
      case 0x12: this.key = b(); this.noteOn(); return;
      case 0x13: this.vel = b(); this.noteOn(); return;
      case 0x18: this.noteOff(this.key); return;
      case 0x19: { const k = b(); b(); this.noteOff(k); return; }
      case 0x20: this.program = b(); return;
      case 0x22: this.vol.value = scaled(sb()); this.vol.n = 0; return;
      case 0x23: { const n = this.readVar(); this.vol.to(scaled(sb()), n); return; }
      case 0x24: this.expr.value = scaled(sb()); this.expr.n = 0; return;
      case 0x25: { const n = this.readVar(); this.expr.to(scaled(sb()), n); return; }
      case 0x26: this.pan.value = sb() + 0x40; this.pan.n = 0; return;
      case 0x27: { const n = this.readVar(); this.pan.to(sb() + 0x40, n); return; }
      case 0x28: this.porta = this.readVar(); return;
      case 0x29: this.porta = 0; return;
      case 0x2a: this.legato = true; return;
      case 0x2b: this.legato = false; this.started = false; return;
      case 0x2c: { const n = this.readVar(); this.bend.to(sb() << 8, n); return; }
      case 0x30: this.adsr1 = this.adsr2 = null; return;
      case 0x31: this.adsr(r => [(r[0] & ~0x7f00) | (b() << 8), r[1]]); return;
      case 0x34: this.adsr(r => [r[0], (r[1] & ~0x1fc0) | ((b() & 0x7f) << 6)]); return;
      case 0x35: this.adsr(r => [r[0], (r[1] & ~0x1f) | (b() & 0x1f)]); return;
      case 0x40: this.vib.set(b(), b(), b()); return;
      case 0x48: this.trem.set(b(), b(), b()); return;
      case 0x50: this.panLfo.set(b(), b(), b()); return;
      case 0x56: this.panLfo.kind = b() & 15; return;
      case 0x58: this.detune = s8(b()); return;
      case 0x59: this.detune = s8(this.detune + b()); return;
      case 0x5a: this.transpose = s8(b()) << 8; return;
      case 0x5b: b(); return;
      case 0x62: b(); b(); return;
      case 0x78: b(); b(); return;               // driver parameter slots 0xcc..0xdc
      case 0x79: b(); return;
      default: { const spec = ARGS[cmd]; if (spec === undefined) { this.end(); return; }
        for (const k of spec) k === 'b' ? b() : this.readVar(); }
    }
  }
  adsr(fn) {
    const r = this.regionDefaults();
    [this.adsr1, this.adsr2] = fn([this.adsr1 ?? r[0], this.adsr2 ?? r[1]]);
  }
  regionDefaults() {
    const r = this.bank?.select(this.program, this.key, this.vel);
    return r ? [r.adsr1, r.adsr2] : [0, 0];
  }
  noteOn() {
    const region = this.bank?.select(this.program, this.key, this.vel);
    if (!region) return;
    if (this.legato && this.started && this.voice && this.voice.env.phase !== 'off') {
      // Legato (0x2a): same voice, new pitch; 0x28 sets a portamento time.
      const from = this.voice.key << 8, to = this.key << 8;
      this.voice.key = this.key;
      if (this.porta) { this.bend.value += from - to; this.bend.to(0, this.porta); }
      return;
    }
    if (this.voice) this.voice.kill();
    this.voice = this.seq.engine.voice(this, region);
    this.started = this.legato;
  }
  noteOff(key) {
    if (this.legato) return;                   // 0x1d40: flag 0x80000 ignores key-off
    if (this.voice && this.voice.key === key) this.voice.env.keyOff();
  }
  end() {
    this.done = true; this.legato = false;
    if (this.voice) this.voice.env.keyOff();
  }
}
const scaled = v => (v > 0 ? (v << 7) + 0x7f : v << 7);  // vol/expr cmd: v<<19 (+0x7f000)

class Voice {
  constructor(track, region, samples) {
    this.track = track; this.region = region; this.samples = samples; this.key = track.key;
    this.vel = track.vel; this.pos = 0; this.counter = 0;
    const [d1, d2] = [region.adsr1, region.adsr2];
    this.env = new Envelope(track.adsr1 ?? d1, track.adsr2 ?? d2); this.env.keyOn();
    this.prev = [0, 0, 0];
  }
  kill() { this.env.phase = 'off'; this.env.level = 0; }
  // Recomputed every driver frame.
  update(master, sePan, sePitch) {
    const t = this.track, r = this.region;
    let sum = (this.key << 8) + Math.round(t.bend.value) + t.transpose + sePitch + r.tune;
    let pitch = spuPitch(sum, t.detune);
    if (t.vib.on) {
      const d = t.vib.depth < 0x80 ? (t.vib.depth + 1) * 2 : ((t.vib.depth & 0x7f) + 1) * 24;
      pitch += ((spuPitch(sum + d, t.detune) - pitch) * t.vib.value) >> 16;
    }
    this.pitch = Math.max(0, Math.min(0x3fff, pitch));
    // Volume, driver 0x3a4.
    let v = ((master + 1) * (Math.max(0, t.expr.value) + 1)) >> 9;
    if (this.vel) v = (v * (this.vel + 1)) >> 7;
    v = (v * Math.max(0, t.vol.value)) >> 14;
    if (r.volume & 0x7f) v = (v * ((r.volume & 0x7f) + 1)) >> 7;
    if (t.trem.on) v += (((v * (t.trem.depth + 1)) >> 8) * t.trem.value) >> 16;
    v = Math.max(-0x4000, Math.min(0x3fff, v));
    let p = r.pan & 0x80 ? (r.pan & 0x7f) + 0x40 : Math.round(t.pan.value) * 1;
    p = p * 2 - 0x80;                          // track pan 0x40..0xbf onto table 0x80 +- 0x80
    if (t.panLfo.on) p += ((t.panLfo.depth * t.panLfo.value) >> 16);
    p = Math.max(0, Math.min(255, p + sePan));
    this.volL = ((v * PAN[p]) >> 8) / 0x4000;
    this.volR = ((v * PAN[255 - p]) >> 8) / 0x4000;
  }
  sample() {
    if (this.env.phase === 'off') return null;
    const d = this.samples.data;
    if (this.pos >= d.length) {
      if (this.samples.loop < 0) { this.kill(); return null; }
      this.pos = this.samples.loop + (this.pos - d.length);
    }
    const env = this.env.tick();
    const i = this.pos;
    let s;
    if (GAUSS) {
      // SPU2 gaussian: the four newest decoded samples weighted by the hardware table at
      // phase (counter >> 4), pairwise products >> 14, then >> 1 (as in DuckStation).
      const g = GAUSS, p = this.counter >> 4, at = k => (k >= 0 ? d[k] : 0);
      s = (((at(i - 3) * g[0xff - p] + at(i - 2) * g[0x1ff - p]) >> 14)
        + ((at(i - 1) * g[0x100 + p] + d[i] * g[p]) >> 14)) >> 1;
    } else {
      // Without the table (not shipped in the public repository): 4-point cubic stand-in.
      const f = this.counter / 0x1000;
      const at = k => { k = i + k; if (k >= d.length) k = this.samples.loop < 0 ? d.length - 1 : this.samples.loop + (k - d.length) % Math.max(1, d.length - this.samples.loop); return d[k] || 0; };
      const y0 = i > 0 ? d[i - 1] : 0, y1 = at(0), y2 = at(1), y3 = at(2);
      s = y1 + 0.5 * f * (y2 - y0 + f * (2 * y0 - 5 * y1 + 4 * y2 - y3 + f * (3 * (y1 - y2) + y3 - y0)));
    }
    this.counter += this.pitch;
    this.pos += this.counter >> 12; this.counter &= 0xfff;
    return s * env / 0x8000 / 32768;
  }
}

// ---- engine ------------------------------------------------------------------------------
// The 512-entry SPU interpolation table is a hardware constant kept with the private game
// data (assets/se/gauss.bin, int16 LE). setGaussTable(null) falls back to cubic.
let GAUSS = null;
export function setGaussTable(table) { GAUSS = table && table.length === 512 ? table : null; }
export const TRACK_SLOTS = 24;
export class SeEngine {
  // banks: Map<bankId, WdBank> or a function(bankId) -> WdBank|null
  constructor(sep, banks) {
    this.sep = sep; this.banks = banks; this.playing = []; this.voices = []; this.frame = 0;
  }
  bank(id) { return typeof this.banks === 'function' ? this.banks(id) : this.banks.get(id); }
  // Scene parameters (ScenePack 0x0C): volume 0..100, pan -100..100, pitch in cents.
  play(id, {volume = 100, pan = 0, pitch = 0, fadeFrames = 0} = {}) {
    const rec = this.sep.get(id);
    if (!rec) return null;
    const bank = this.bank(rec.bank);
    // IOP 0x91a0 -> 0x8d54: one track slot per track out of 24 (0x13C each). When too few
    // are free, 0x8ac0 frees every track of the longest-playing instance (track +0xF8 counts
    // ticks) whose priority (record byte 3, slot +0x138) is <= t, for t = 0..priority; an
    // instance with a group mask (byte 4, slot +0x139) is never taken. Same id is not checked,
    // so a replay stacks. If nothing can be freed the request is dropped.
    const priority = rec.flag & 0xff, mask = rec.flag >> 8, need = rec.tracks.length;
    if (mask) for (const s of [...this.playing]) if (s.priority <= priority && (s.mask & mask)) this.release(s);
    for (let t = 0; this.usedTracks() + need > TRACK_SLOTS;) {
      const victim = this.playing.filter(s => !s.mask && s.priority <= t && s.tracks.some(k => !k.done))
        .reduce((a, s) => (!a || s.ticks > a.ticks ? s : a), null);
      if (victim) this.release(victim);
      else if (++t > priority) return null;
    }
    const seq = {id, engine: this, volume: new Slide(fadeFrames ? 0 : volume), pan, pitch, stopping: false,
      priority, mask, ticks: 0};
    if (fadeFrames) seq.volume.to(volume, fadeFrames);
    seq.tracks = rec.tracks.map(t => new Track(seq, t, bank));
    this.playing.push(seq);
    return seq;
  }
  stop(id, fadeFrames = 0) {
    for (const s of this.playing) if (id == null || s.id === id) {
      if (!fadeFrames) this.release(s); else { s.volume.to(0, fadeFrames); s.stopping = true; }
    }
  }
  set(id, key, value, frames = 0) {
    for (const s of this.playing) if (s.id === id) {
      if (key === 'volume') frames ? s.volume.to(value, frames) : (s.volume.value = value, s.volume.n = 0);
      else s[key] = value;
    }
  }
  usedTracks() { return this.playing.reduce((n, s) => n + s.tracks.filter(t => !t.done).length, 0); }
  release(seq) {
    for (const t of seq.tracks) { t.done = true; t.voice?.kill(); }
    this.playing = this.playing.filter(s => s !== seq);
  }
  voice(track, region) {
    const v = new Voice(track, region, track.bank.samples(region));
    this.voices.push(v); return v;
  }
  get active() { return this.playing.length > 0 || this.voices.some(v => v.env.phase !== 'off'); }
  // One 240 Hz driver frame.
  tickFrame() {
    for (const seq of [...this.playing]) {
      seq.volume.tick();
      if (seq.stopping && seq.volume.n === 0) { this.release(seq); continue; }
      seq.ticks++;
      for (const t of seq.tracks) {
        t.acc -= 120;
        while (t.acc <= 0) { t.acc += 300; t.step(); }
      }
      if (seq.tracks.every(t => t.done && (!t.voice || t.voice.env.phase === 'off')))
        this.playing = this.playing.filter(s => s !== seq);
    }
    this.voices = this.voices.filter(v => v.env.phase !== 'off');
    for (const v of this.voices) {
      const seq = v.track.seq;
      // SE path (0x1838): a1 = (slot master s8 + 1) * (slot volume >> 12) >> 7, i.e. up to 127.
      // EE 0x1be2e8 / 0x1be338 / 0x1be3f0 convert the ScenePack values with truncating
      // division: volume*127/100, pan*63/100 (right) or pan*64/100 (left) around 0x40,
      // pitch cents*256/100 (1/256 semitone).
      const master = Math.trunc(127 * Math.max(0, seq.volume.value) / 100);
      const pan = Math.trunc(seq.pan * (seq.pan >= 0 ? 63 : 64) / 100);
      v.update(master, pan, Math.trunc(seq.pitch * 256 / 100));
    }
    this.frame++;
  }
  // Render n stereo samples at 48 kHz into Float32Arrays.
  render(left, right, n = left.length, offset = 0) {
    for (let i = 0; i < n; i++) {
      if (this.phase === undefined || this.phase <= 0) { this.tickFrame(); this.phase = (this.phase ?? 0) + FRAME; }
      this.phase--;
      let l = 0, r = 0;
      for (const v of this.voices) {
        const s = v.sample(); if (s === null) continue;
        l += s * v.volL; r += s * v.volR;
      }
      left[offset + i] = l; right[offset + i] = r;
    }
  }
}
