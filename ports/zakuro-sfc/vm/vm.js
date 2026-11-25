import { CPU } from './cpu.js';
import { ZakuroBus } from './bus.js';

export class ZakuroVM {
  constructor(options) {
    this.bus = new ZakuroBus(options);
    this.cpu = new CPU(this.bus);
  }
  reset() { this.cpu.reset(); }
  step() {
    const beforeMaster = this.bus.clock.master;
    const accesses = this.bus.accessCount;
    const cpuCycles = this.cpu.step();
    const internalCycles = Math.max(0, cpuCycles - (this.bus.accessCount - accesses));
    this.bus.clock.idle(internalCycles * 6);
    const afterMaster = this.bus.clock.master;
    const frameCycles = 357368, vblankStart = 225 * 1364;
    const beforeVblank = Math.floor((beforeMaster - vblankStart) / frameCycles);
    const afterVblank = Math.floor((afterMaster - vblankStart) / frameCycles);
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
