// SFC audio unit: SPC700 + S-DSP sharing 64 KiB ARAM, driven from the main CPU side
// through four ports. `cpuWrite/cpuRead` are the $2140-$2143 view.
import { SPC700 } from './spc700.js';
import { SDSP } from './sdsp.js';

export const SPC_CLOCK_HZ = 1024000;
export const SAMPLE_RATE = 32000;

export class APU {
  constructor({ gauss = null, onDspWrite = null, onPortWrite = null } = {}) {
    this.cpu = new SPC700({ onDspWrite, onPortWrite });
    this.dsp = new SDSP(this.cpu.ram, { gauss });
    this.cpu.dsp = this.dsp;
  }
  // Boots the driver from `[len, dest, payload]` records. `iplClocks` is how long the IPL
  // transfer ran on hardware; the DSP and the timer dividers free-run from power-on, so
  // their phase at the driver's first instruction depends on it. 621,677 clocks is this
  // game's measured boot (reference probe), which makes the output match sample for sample.
  boot(records, { iplClocks = 621677 } = {}) {
    const cb = this.dsp.onSample; this.dsp.onSample = null;
    this.dsp.tick(iplClocks);
    this.dsp.onSample = cb;
    for (const t of this.cpu.timers) t.phase = (iplClocks - 1) % t.period;
    return this.cpu.uploadRecords(records);
  }

  cpuWrite(port, value) { this.cpu.portIn[port & 3] = value & 0xff; }
  cpuRead(port) { return this.cpu.portOut[port & 3]; }
  run(clocks) { this.cpu.run(clocks); }
  // Renders `count` stereo samples into an Int16Array (interleaved L/R).
  render(count) {
    const out = new Int16Array(count * 2); let n = 0;
    const prev = this.dsp.onSample;
    this.dsp.onSample = (l, r) => { if (n < count) { out[n * 2] = l; out[n * 2 + 1] = r; } n++; };
    while (n < count) this.cpu.step();
    this.dsp.onSample = prev;
    return out;
  }
}
