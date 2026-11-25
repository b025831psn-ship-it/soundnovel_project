import { CPU } from './cpu.js';
import { ZakuroBus } from './bus.js';
import { vblankOrdinal } from './master-clock.js';

// Measured reset release -> first CPU bus cycle offset in the reference trace.
// The CPU core begins at vector fetch, so the VM supplies the preceding S-CPU
// reset sequencer time here.
export const RESET_MASTER_CYCLES = 176;

export class ZakuroVM {
  constructor(options) {
    this.bus = new ZakuroBus(options);
    this.cpu = new CPU(this.bus);
    this.deferredNmi = false;
    // A low-to-high NMITIMEN edge during VBlank is recognized after the
    // currently executing instruction; the following instruction completes
    // before the CPU takes the NMI at its next boundary.
    this.bus.onNmi = () => { this.deferredNmi = true; };
  }
  reset() { this.bus.clock.idle(RESET_MASTER_CYCLES); this.cpu.reset(); }
  step() {
    if (this.deferredNmi) {
      this.cpu.nmiPending = true;
      this.deferredNmi = false;
    }
    const beforeMaster = this.bus.clock.master;
    const accesses = this.bus.accessCount;
    const cpuCycles = this.cpu.step();
    const internalCycles = Math.max(0, cpuCycles - (this.bus.accessCount - accesses));
    this.bus.clock.idle(internalCycles * 6);
    const afterMaster = this.bus.clock.master;
    const beforeVblank = vblankOrdinal(beforeMaster);
    const afterVblank = vblankOrdinal(afterMaster);
    if (afterVblank > beforeVblank) {
      this.bus.setInputField(afterVblank);
      this.bus.nmiFlag = true;
      if (this.bus.io[0x4200] & 0x80) this.cpu.nmiPending = true;
    }
    return cpuCycles;
  }
  runUntil(predicate, { maxInstructions = 10_000_000 } = {}) {
    for (let i = 0; i < maxInstructions; i++) {
      if (predicate(this)) return i;
      this.step();
    }
    throw new Error(`runUntil exceeded ${maxInstructions} instructions`);
  }
}
