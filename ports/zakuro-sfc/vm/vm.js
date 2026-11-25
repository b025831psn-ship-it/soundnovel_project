import { CPU } from './cpu.js';
import { ZakuroBus } from './bus.js';
import { vblankBoundary, vblankOrdinal } from './master-clock.js';

// Measured reset release -> first CPU bus cycle offset in the reference trace.
// The CPU core begins at vector fetch, so the VM supplies the preceding S-CPU
// reset sequencer time here.
export const RESET_MASTER_CYCLES = 176;

export class ZakuroVM {
  constructor(options) {
    this.bus = new ZakuroBus(options);
    this.cpu = new CPU(this.bus);
    this.nmiTriggerMaster = null;
    // A low-to-high NMITIMEN edge during VBlank is recognized after the
    // currently executing instruction and taken before the next opcode fetch.
    this.bus.onNmi = () => { this.nmiTriggerMaster = this.bus.clock.master + 6; };
  }
  reset() { this.nmiTriggerMaster = null; this.bus.clock.idle(RESET_MASTER_CYCLES); this.cpu.reset(); }
  step() {
    if (this.nmiTriggerMaster != null && this.bus.clock.master >= this.nmiTriggerMaster) {
      this.cpu.nmiPending = true;
      this.nmiTriggerMaster = null;
    }
    const beforeMaster = this.bus.clock.master;
    const accesses = this.bus.accessCount;
    const cpuCycles = this.cpu.step();
    const internalCycles = Math.max(0, cpuCycles - (this.bus.accessCount - accesses));
    this.bus.clock.idle(internalCycles * 6);
    if (this.cpu.interruptMasterAdjustment) {
      this.bus.clock.idle(this.cpu.interruptMasterAdjustment);
      this.cpu.interruptMasterAdjustment = 0;
    }
    const afterMaster = this.bus.clock.master;
    const beforeVblank = vblankOrdinal(beforeMaster);
    const afterVblank = vblankOrdinal(afterMaster);
    if (afterVblank > beforeVblank) {
      this.bus.setInputField(afterVblank);
      this.bus.nmiFlag = true;
      // Snes9x schedules the VBlank NMI at HC=12 and enters it at the first
      // opcode boundary at or beyond that point.
      if (this.bus.io[0x4200] & 0x80) {
        this.nmiTriggerMaster = vblankBoundary(afterVblank) + 12;
      }
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
