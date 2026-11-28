// CD-XA audio (PINK.XA: the gold bookmark's voice drama), as the drive plays it for the SPU.
// The game only starts and stops the stream (scenario command 0x5a, scenario/xa.js; libcd's
// Setfilter / Setmode / ReadS / Stop / CdMix in libcd.js); the drive decodes the sectors of the
// chosen file/channel on its own and the SPU mixes them in (CD volume, CdMix attenuation).
//
// Data: the user's PINK.XA reduced to the sectors of one channel, 2304 bytes of sound groups
// each (tools/extract-xa.mjs), so channel c's j-th sector is file sector 8·j + c. All sectors
// are 37.8 kHz stereo 4-bit (subheader coding 0x01).
//   decodeSector(bytes2304, state) -> { left: Int16Array(2016), right: Int16Array(2016) }
//   new XaStream((channel) => ({ sector(j) -> Uint8Array(2304) | null, want?(j) })) — start(fileSector, channel), stop(),
//   setMix([a0..a3]), setVolume(l, r), mix(block) adds one 44.1 kHz frame (Int16 stereo) to block.

const K0 = [0, 60, 115, 98], K1 = [0, 0, -52, -55];
export const XA_FILE_LBA = 97568, XA_FILE_SECTORS = 135632, XA_CHANNELS = 8, XA_BYTES = 2304;
export const XA_RATE = 37800;
export const xaFileName = (channel) => `PINK.XA.ch${channel}`; // the extracted channel file (tools/extract-xa.mjs)

const clamp16 = (v) => (v > 32767 ? 32767 : v < -32768 ? -32768 : v);

// One Form 2 sector's 18 sound groups (128 bytes: 16 header bytes, 112 data bytes = 28 words of
// 8 nibbles). 4-bit stereo: units 0, 2, 4, 6 are the left channel, 1, 3, 5, 7 the right.
export function decodeSector(b, state = { l: [0, 0], r: [0, 0] }) {
  const left = new Int16Array(2016), right = new Int16Array(2016);
  let nl = 0, nr = 0;
  for (let g = 0; g < 18; g++) {
    const o = g * 128;
    for (let u = 0; u < 8; u++) {
      const h = b[o + 4 + u], shift = h & 15, f = (h >> 4) & 3, k0 = K0[f], k1 = K1[f];
      const st = u & 1 ? state.r : state.l, out = u & 1 ? right : left;
      let s1 = st[0], s2 = st[1], n = u & 1 ? nr : nl;
      for (let w = 0; w < 28; w++) {
        const byte = b[o + 16 + w * 4 + (u >> 1)], nib = u & 1 ? byte >> 4 : byte & 15;
        const t = ((nib << 28) >> 28) << 12;
        const s = clamp16((t >> shift) + ((s1 * k0 + s2 * k1 + 32) >> 6));
        out[n++] = s; s2 = s1; s1 = s;
      }
      st[0] = s1; st[1] = s2;
      if (u & 1) nr = n; else nl = n;
    }
  }
  return { left, right };
}

export class XaStream {
  // sourceFor(channel).sector(j): the j-th sector of that channel's file, or null while it is
  // not loaded (then the drive's output is silence for that sector's time, as a slow read is).
  constructor(sourceFor) {
    this.sourceFor = sourceFor; this.source = null; this.playing = false; this.mixAtt = [0x80, 0, 0x80, 0]; this.vol = [0x7f, 0x7f];
    this.pos = 0; this.buf = null; this.at = 0; this.state = { l: [0, 0], r: [0, 0] }; this.phase = 0;
    this.prev = [0, 0]; this.cur = [0, 0];
  }
  start(fileSector, channel) {
    this.channel = channel; this.source = this.sourceFor(channel); this.pos = Math.ceil((fileSector - channel) / XA_CHANNELS); // the next sector of the channel
    this.playing = true; this.buf = null; this.at = 0; this.state = { l: [0, 0], r: [0, 0] }; this.phase = 0;
    this.prev = [0, 0]; this.cur = [0, 0];
    this.source?.want?.(this.pos);
  }
  stop() { this.playing = false; this.buf = null; }
  setMix(att) { this.mixAtt = att.slice(0, 4); }
  setVolume(l, r) { this.vol = [l, r]; }
  next() { // one 37.8 kHz stereo sample
    if (!this.buf || this.at >= 2016) {
      const per = XA_FILE_SECTORS / XA_CHANNELS;
      if (this.pos >= per) { this.playing = false; return [0, 0]; }
      const raw = this.source?.sector(this.pos) ?? null;
      this.source?.want?.(this.pos + 1);
      this.buf = raw ? decodeSector(raw, this.state) : { left: new Int16Array(2016), right: new Int16Array(2016) };
      this.pos++; this.at = 0;
    }
    const i = this.at++;
    return [this.buf.left[i], this.buf.right[i]];
  }
  // One video frame at 44.1 kHz added to `block` (Int16Array, stereo interleaved): 37.8 kHz is
  // 6/7 of 44.1 kHz, so each output sample advances the input by 6/7, interpolated linearly.
  mix(block) {
    if (!this.playing) return;
    const [a0, a1, a2, a3] = this.mixAtt, vl = this.vol[0] / 0x7f, vr = this.vol[1] / 0x7f;
    for (let i = 0; i < block.length; i += 2) {
      this.phase += 6;
      while (this.phase >= 7) { this.phase -= 7; this.prev = this.cur; this.cur = this.next(); if (!this.playing) return; }
      const t = this.phase / 7, l = this.prev[0] + (this.cur[0] - this.prev[0]) * t, r = this.prev[1] + (this.cur[1] - this.prev[1]) * t;
      const outL = (l * a0 + r * a3) / 0x80 * vl, outR = (l * a1 + r * a2) / 0x80 * vr;
      block[i] = clamp16(Math.round(block[i] + outL)); block[i + 1] = clamp16(Math.round(block[i + 1] + outR));
    }
  }
}

// A channel file in memory (Node, tests): bytes = the whole file.
export const memorySource = (bytes) => ({ sector: (j) => ((j + 1) * XA_BYTES <= bytes.length ? bytes.subarray(j * XA_BYTES, (j + 1) * XA_BYTES) : null) });

// The browser: the channel file fetched in chunks with HTTP Range, a little ahead of playback.
export function rangeSource(url, { chunk = 256, ahead = 2 } = {}) {
  const chunks = new Map(), pending = new Set();
  let whole = null; // a server without range requests sends the whole file once
  const load = (c) => {
    if (whole || chunks.has(c) || pending.size) return; // one request at a time
    pending.add(c);
    fetch(url, { headers: { Range: `bytes=${c * chunk * XA_BYTES}-${(c + 1) * chunk * XA_BYTES - 1}` } })
      .then((r) => {
        if (!r.ok) return Promise.reject(new Error(`${url}: HTTP ${r.status}`));
        return r.arrayBuffer().then((b) => (r.status === 200 ? (whole = new Uint8Array(b)) : chunks.set(c, new Uint8Array(b))));
      })
      .catch((e) => console.error("[kamaitachi-ps1 xa]", e))
      .finally(() => pending.delete(c));
  };
  return {
    want(j) { const c = Math.floor(j / chunk); for (let k = 0; k <= ahead; k++) if (!chunks.has(c + k)) { load(c + k); break; } },
    sector(j) {
      if (whole) return (j + 1) * XA_BYTES <= whole.length ? whole.subarray(j * XA_BYTES, (j + 1) * XA_BYTES) : null;
      const c = chunks.get(Math.floor(j / chunk)); if (!c) return null;
      const o = (j % chunk) * XA_BYTES; return o + XA_BYTES <= c.length ? c.subarray(o, o + XA_BYTES) : null;
    },
  };
}
