// A sound-only machine for runRealtime: the APU fed with main-CPU port writes recorded
// from the original game, timed in SPC clocks. It stands in for the full 65c816 VM
// until that runs in the browser; both expose the same `time` / `runTo` / `end`.
export const SPC_HZ = 1025280;

export class ReplayMachine {
  // inputs: [[spcClock, port, value], ...] sorted by clock.
  constructor(apu, inputs, { tail = 1 } = {}) {
    this.apu = apu; this.inputs = inputs; this.k = 0;
    this.end = ((inputs.at(-1)?.[0] ?? 0) / SPC_HZ) + tail;
  }
  get time() { return this.apu.cpu.clock / SPC_HZ; }
  runTo(sec) {
    const { apu, inputs } = this, target = Math.floor(sec * SPC_HZ);
    while (apu.cpu.clock < target) {
      while (this.k < inputs.length && inputs[this.k][0] - 1 <= apu.cpu.clock) {
        apu.cpuWrite(inputs[this.k][1], inputs[this.k][2]); this.k++;
      }
      apu.cpu.step();
    }
  }
}
