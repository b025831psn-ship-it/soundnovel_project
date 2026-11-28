// Main-thread wrapper for ScenePack SE commands (0x0C play, 0x0D stop, 0x0F volume,
// 0x10 pan, 0x11 pitch). Banks (wave####.wd) are fetched on first use.
//   const se = await SePlayer.create(audioContext, id => asset('se/' + id));
//   se.command({op:0x0c, id:537002, volume:60, pan:0, pitch:0, fadeFrames:0});
export class SePlayer {
  static async create(context, url, output = context.destination) {
    if (context.sampleRate !== 48000) console.warn('SePlayer expects an AudioContext at 48000 Hz (SPU2 rate); got', context.sampleRate);
    await context.audioWorklet.addModule(new URL('./se-worklet.js', import.meta.url));
    const node = new AudioWorkletNode(context, 'kamaitachi2-se', {numberOfInputs:0, outputChannelCount:[2]});
    node.connect(output);
    const [sep, gauss] = await Promise.all([fetch(url('sep.pac')).then(r => r.arrayBuffer()),
      fetch(url('gauss.bin')).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null)]);
    const player = new SePlayer(node, url, sep);
    node.port.postMessage({type:'init', sep, gauss}, gauss ? [sep, gauss] : [sep]);
    return player;
  }
  constructor(node, url, sep) {
    this.node = node; this.url = url; this.loaded = new Map();
    this.view = new DataView(sep.slice(0));
  }
  // sep.pac lookup on the main thread, only to know which bank to fetch.
  bankOf(id) {
    const v = this.view, n = v.getUint16(0, true), ids = 2 + 4 * n + 2, base = ids + 4 * n;
    let lo = 0, hi = n - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, x = v.getUint32(ids + 4 * mid, true);
      if (x === id) return v.getUint16(base + 2 * v.getUint16(2 + 2 * mid, true) + 9, true);
      if (x < id) lo = mid + 1; else hi = mid - 1;
    }
    return null;
  }
  bank(id) {
    if (!this.loaded.has(id)) this.loaded.set(id, fetch(this.url(`wave${String(id).padStart(4, '0')}.wd`))
      .then(r => { if (!r.ok) throw new Error(`SE bank ${id}: ${r.status}`); return r.arrayBuffer(); })
      .then(buffer => this.node.port.postMessage({type:'bank', id, buffer}, [buffer])));
    return this.loaded.get(id);
  }
  async play(id, params = {}) {
    const bank = this.bankOf(id);
    if (bank == null) throw new Error(`SE ${id} is not in sep.pac`);
    await this.bank(bank);
    this.node.port.postMessage({type:'play', id, params});
  }
  stop(id, fadeFrames = 0) { this.node.port.postMessage({type:'stop', id, fadeFrames}); }
  set(id, key, value, frames = 0) { this.node.port.postMessage({type:'set', id, key, value, frames}); }
  // ScenePack command objects as produced by spkdump.py.
  command(c) {
    switch (c.op) {
      case 0x0c: return this.play(c.id, {volume:c.volume ?? 100, pan:c.pan ?? 0, pitch:c.pitch ?? 0, fadeFrames:c.fadeFrames ?? 0});
      case 0x0d: return this.stop(c.id, c.fadeFrames ?? 0);
      case 0x0f: return this.set(c.id, 'volume', c.volume, c.fadeFrames ?? 0);
      case 0x10: return this.set(c.id, 'pan', c.pan);
      case 0x11: return this.set(c.id, 'pitch', c.pitch);
    }
  }
}
