// AudioWorklet that runs the m4a engine at the GBA's VBlank rate and plays its 18157 Hz output
// through the browser's rate the way the GBA DAC holds each sample (zero-order hold).
import { M4A, Memory } from './m4a.js';

// samplesPerVBlank (304) x 59.7275 Hz VBlank = 18157 Hz, so one engine frame per 304 output samples
// at the mixer rate keeps the sequencer on the GBA's frame clock.
class M4APlayer extends AudioWorkletProcessor {
  constructor() {
    super();
    this.engine = null;
    this.frame = null;
    this.pos = 0;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'init') {
        const bytes = new Uint8Array(data.bytes);
        // Warm-up: the first frames of a cold engine run several times slower until the JIT has
        // compiled the sequencer and the mixers, which on a phone ran past the audio deadline and
        // broke up the first sounds. A throwaway engine plays a few songs silently first.
        const warm = new M4A(new Memory(bytes, data.config.base), data.config);
        for (let song = 0; song < Math.min(data.config.songCount, 8); song++) {
          warm.startSong(song);
          for (let frame = 0; frame < 40; frame++) warm.vblank();
        }
        this.engine = new M4A(new Memory(bytes, data.config.base), data.config);
        this.step = data.config.mixRate / sampleRate;
        this.frameLen = data.config.samplesPerVBlank;
      } else if (this.engine) {
        if (data.type === 'start') this.engine.startSong(data.song);
        else if (data.type === 'stop') this.engine.stopSong(data.song);
        else if (data.type === 'stopAll') this.engine.stopAll();
        else if (data.type === 'fade') this.engine.fadeOut(data.player, data.speed);
        else if (data.type === 'immInit') this.engine.immInit(data.player);
        else if (data.type === 'volume') this.engine.volumeControl(data.player, data.bits, data.volume);
        else if (data.type === 'pan') this.engine.panControl(data.player, data.bits, data.pan);
        else if (data.type === 'pitch') this.engine.pitchControl(data.player, data.bits, data.pitch);
        else if (data.type === 'playerStart') { this.engine.playerStart(data.player, data.song); this.seq = data.seq; this.stopped = -1; }
        else if (data.type === 'playerStop') { this.engine.playerStop(data.player); this.seq = data.seq; this.stopped = -1; }
      }
    };
  }

  process(_, outputs) {
    const out = outputs[0];
    if (!this.engine) return true;
    const L = out[0], R = out[1] || out[0];
    for (let i = 0; i < L.length; i++) {
      if (!this.frame || this.pos >= this.frameLen) {
        if (this.frame) this.pos -= this.frameLen;
        this.frame = this.engine.vblank();
        // Stopped bits of every player (MusicPlayerInfo.status bit 31) for the effect scripts.
        let stopped = 0;
        this.engine.players.forEach((p, i) => { if (p.status & 0x80000000) stopped |= 1 << i; });
        if (stopped !== this.stopped) this.port.postMessage({ type: 'stopped', bits: (this.stopped = stopped), seq: this.seq ?? 0 });
      }
      const k = Math.floor(this.pos);
      L[i] = this.frame.l[k];
      R[i] = this.frame.r[k];
      this.pos += this.step;
    }
    return true;
  }
}

registerProcessor('m4a-player', M4APlayer);
