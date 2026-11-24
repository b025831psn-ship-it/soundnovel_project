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
        this.engine = new M4A(new Memory(new Uint8Array(data.bytes), data.config.base), data.config);
        this.step = data.config.mixRate / sampleRate;
        this.frameLen = data.config.samplesPerVBlank;
      } else if (this.engine) {
        if (data.type === 'start') this.engine.startSong(data.song);
        else if (data.type === 'stop') this.engine.stopSong(data.song);
        else if (data.type === 'stopAll') this.engine.stopAll();
        else if (data.type === 'fade') this.engine.fadeOut(data.player, data.speed);
        else if (data.type === 'immInit') this.engine.immInit(data.player);
        else if (data.type === 'volume') this.engine.volumeControl(data.player, data.bits, data.volume);
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
