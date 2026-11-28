// AudioWorklet that plays the sample blocks the page sends (machine mode: the SPU runs on
// the page, in step with the game). Messages: Int16Array blocks (see pcm-queue.js), or "flush".
import { PcmQueue } from "./pcm-queue.js";
class PcmPlayer extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = new PcmQueue();
    this.port.onmessage = ({ data }) => { if (data === "flush") this.queue.flush(); else this.queue.push(data); };
  }
  process(_, outputs) {
    const out = outputs[0];
    if (out?.length >= 2) this.queue.pull(out[0], out[1]);
    return true;
  }
}
registerProcessor("pcm-player", PcmPlayer);
