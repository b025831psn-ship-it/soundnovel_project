// The queue behind the machine mode's audio output (pcm-worklet.js, or a ScriptProcessorNode
// where there is no AudioWorklet, e.g. a page opened over plain http on the local network):
// Int16Array blocks, stereo interleaved, 44.1 kHz. It starts once START samples are waiting,
// plays silence when it runs dry, and drops the oldest blocks when more than MAX wait
// (the page's clock ran ahead of the audio clock).
const FRAME = 735 * 2, START = 3 * FRAME, MAX = 9 * FRAME;
export class PcmQueue {
  constructor() { this.q = []; this.pos = 0; this.have = 0; this.playing = false; }
  flush() { this.q.length = 0; this.pos = 0; this.have = 0; this.playing = false; }
  push(block) {
    this.q.push(block); this.have += block.length;
    while (this.have > MAX && this.q.length > 1) { this.have -= this.q[0].length - this.pos; this.q.shift(); this.pos = 0; }
  }
  pull(l, r) { // fills what it has; the rest stays as it was (silence)
    if (!this.playing) { if (this.have < START) return; this.playing = true; }
    for (let i = 0; i < l.length; i++) {
      const b = this.q[0];
      if (!b) { this.playing = false; break; }
      l[i] = b[this.pos] / 32768; r[i] = b[this.pos + 1] / 32768;
      this.pos += 2; this.have -= 2;
      if (this.pos >= b.length) { this.q.shift(); this.pos = 0; }
    }
  }
}
