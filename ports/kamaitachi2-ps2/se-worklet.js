// AudioWorklet side of the SE engine. Runs the driver-faithful SeEngine at 48 kHz.
import { SepPack, WdBank, SeEngine, setGaussTable } from './se.js';

class SeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.banks = new Map(); this.engine = null;
    this.port.onmessage = ({data}) => {
      if (data.type === 'init') {
        if (data.gauss) setGaussTable(new Int16Array(data.gauss));
        this.engine = new SeEngine(new SepPack(data.sep), this.banks);
      }
      else if (data.type === 'bank') this.banks.set(data.id, new WdBank(data.buffer));
      else if (!this.engine) return;
      else if (data.type === 'play') this.engine.play(data.id, data.params);
      else if (data.type === 'stop') this.engine.stop(data.id, data.fadeFrames);
      else if (data.type === 'set') this.engine.set(data.id, data.key, data.value, data.frames);
    };
  }
  process(_, outputs) {
    const [l, r] = outputs[0];
    if (this.engine && l) this.engine.render(l, r || new Float32Array(l.length), l.length);
    return true;
  }
}
registerProcessor('kamaitachi2-se', SeProcessor);
