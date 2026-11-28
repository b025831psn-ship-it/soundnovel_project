// AudioWorklet: plays S-DSP samples posted from the thread that runs the APU.
import { Resampler } from './resampler.js';

class SfcAudioOut extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = options.processorOptions ?? {};
    this.rs = new Resampler({ inRate: o.inRate, outRate: sampleRate, target: o.target });
    this.muted = false; this.paused = false; this.reportAt = 0;
    const onmessage = ({ data }) => {
      if (data.type === 'pcm') this.rs.push(data.pcm);
      else if (data.type === 'mute') this.muted = data.on;
      else if (data.type === 'pause') this.paused = data.on;
      else if (data.type === 'connect') data.port.onmessage = onmessage; // a producer in a Worker
    };
    this.port.onmessage = onmessage;
  }
  process(_, outputs) {
    const L = outputs[0][0], R = outputs[0][1] ?? outputs[0][0];
    // The game starts before the first tap, with the context suspended (browser rule): what piled up
    // meanwhile is dropped down to the normal lead, so the sound is in step from the first tap on.
    if (!this.live) {
      this.live = true;
      const rs = this.rs; if (rs.fill > rs.targetFill) rs.read = (rs.write - rs.targetFill + rs.cap) % rs.cap;
    }
    if (this.paused) { L.fill(0); R.fill(0); return true; }
    this.rs.pull(L, R);
    if (this.muted) { L.fill(0); R.fill(0); }
    if (currentTime >= this.reportAt) {
      this.reportAt = currentTime + 0.5;
      this.port.postMessage({ type: 'stats', fill: this.rs.fill, underruns: this.rs.underruns, dropped: this.rs.dropped });
    }
    return true;
  }
}
registerProcessor('sfc-audio-out', SfcAudioOut);
