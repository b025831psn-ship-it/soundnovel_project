// Ring buffer + linear resampler from the S-DSP rate to the device rate. Used inside the
// AudioWorklet; kept free of browser APIs so it can be tested in Node.
// The input rate follows the SPC clock (1,025,280 Hz / 32 = 32,040 Hz in the reference
// emulator; a nominal 1.024 MHz part gives 32,000 Hz). A small proportional term on the
// buffer fill keeps producer and device clocks from drifting apart.
export const DSP_RATE = 32040;

export class Resampler {
  constructor({ inRate = DSP_RATE, outRate = 48000, capacity = 32768, target = 0.08 } = {}) {
    this.l = new Float32Array(capacity); this.r = new Float32Array(capacity);
    this.cap = capacity; this.read = 0; this.write = 0; this.frac = 0;
    this.base = inRate / outRate; this.targetFill = Math.round(target * inRate);
    this.underruns = 0; this.dropped = 0;
    // Output starts, and restarts after running dry, only once the buffer holds the
    // target amount. Without this the first blocks play as a burst of short gaps.
    this.primed = false;
  }
  get fill() { return (this.write - this.read + this.cap) % this.cap; }
  // `pcm` is interleaved s16 L/R.
  push(pcm) {
    for (let i = 0; i + 1 < pcm.length; i += 2) {
      if (this.fill >= this.cap - 1) { this.read = (this.read + 1) % this.cap; this.dropped++; }
      this.l[this.write] = pcm[i] / 32768; this.r[this.write] = pcm[i + 1] / 32768;
      this.write = (this.write + 1) % this.cap;
    }
  }
  // Fills `L`/`R` (Float32Array) with output samples.
  pull(L, R) {
    if (!this.primed) {
      if (this.fill < this.targetFill) { L.fill(0); R.fill(0); return; }
      this.primed = true;
    }
    const adjust = 1 + Math.max(-0.005, Math.min(0.005, (this.fill - this.targetFill) / (this.targetFill * 40 || 1)));
    const step = this.base * adjust;
    for (let i = 0; i < L.length; i++) {
      if (this.fill < 2) { L.fill(0, i); R.fill(0, i); this.underruns += L.length - i; this.primed = false; return; }
      const a = this.read, b = (a + 1) % this.cap, f = this.frac;
      L[i] = this.l[a] + (this.l[b] - this.l[a]) * f;
      R[i] = this.r[a] + (this.r[b] - this.r[a]) * f;
      this.frac += step;
      while (this.frac >= 1) { this.frac -= 1; this.read = (this.read + 1) % this.cap; }
    }
  }
}
