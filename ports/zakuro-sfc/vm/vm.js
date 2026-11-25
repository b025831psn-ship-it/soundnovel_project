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
    this.bus.onNmi = () => { this.cpu.nmiPending = true; };
  }
  reset() { this.bus.clock.idle(RESET_MASTER_CYCLES); this.cpu.reset(); }
  step() {
    const beforeMaster = this.bus.clock.master;
    const accesses = this.bus.accessCount;
    const cpuCycles = this.cpu.step();
    const internalCycles = Math.max(0, cpuCycles - (this.bus.accessCount - accesses));
    this.bus.clock.idle(internalCycles * 6);
    const afterMaster = this.bus.clock.master;
    const beforeVblank = vblankOrdinal(beforeMaster);
    const afterVblank = vblankOrdinal(afterMaster);
    if (afterVblank > beforeVblank) {
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
