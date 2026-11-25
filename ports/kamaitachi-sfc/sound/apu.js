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
  // `timerLead` places the timer dividers relative to that point; -1 fits Kamaitachi's
  // probe, +3 fits Zakuro's 599e867 run (whose cycles are bus-access times).
  boot(records, { iplClocks = 621677, timerLead = -1 } = {}) {
    const cb = this.dsp.onSample; this.dsp.onSample = null;
    this.dsp.tick(iplClocks);
    this.dsp.onSample = cb;
    for (const t of this.cpu.timers) t.phase = (((iplClocks + timerLead) % t.period) + t.period) % t.period;
    return this.cpu.uploadRecords(records);
  }

  // Power-on with a local 64-byte IPL image: the CPU's own upload then runs through the
  // ports. Measured on the Snes9x trace with master clock 0 = SPC time 0: the S-DSP runs
  // from 0, the timer dividers from 1 and the SPC700 core from 3 (`coreDelay`, which
  // MasterLink applies). With this, every CPU read from reset to frame 5700 and the PCM
  // capture match, and the driver starts at SPC time 621,677 as `boot()` assumes.
  powerOn(ipl) {
    this.cpu.loadIplImage(ipl);
    const cb = this.dsp.onSample; this.dsp.onSample = null;
    this.dsp.tick(APU.CORE_DELAY);
    this.dsp.onSample = cb;
    for (const t of this.cpu.timers) t.phase = (APU.CORE_DELAY - 1) % t.period;
    this.coreDelay = APU.CORE_DELAY;
  }
  static CORE_DELAY = 3;

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
