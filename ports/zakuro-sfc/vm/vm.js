import { CPU } from './cpu.js';
import { ZakuroBus } from './bus.js';
import { vblankBoundary, vblankOrdinal } from './master-clock.js';
import { readTouchState } from './touch-state.js';
import { PPU } from './ppu.js';
import { loadVmState, saveVmState } from './state.js';

// Measured reset release -> first CPU bus cycle offset in the reference trace.
// The CPU core begins at vector fetch, so the VM supplies the preceding S-CPU
// reset sequencer time here.
export const RESET_MASTER_CYCLES = 176;

export class ZakuroVM {
  constructor(options) {
    this.ppu = options.ppu ?? new PPU({ onFrame: options.onFrame });
    this.skipRender = false;
    this.bus = new ZakuroBus({ ...options, ppu: this.ppu });
    this.cpu = new CPU(this.bus);
    this.nmiTriggerMaster = null;
    // A low-to-high NMITIMEN edge during VBlank is recognized after the
    // currently executing instruction and taken before the next opcode fetch.
    this.bus.onNmi = () => { this.nmiTriggerMaster = this.bus.clock.master + 6; };
    // Reset is a new console run, not only a new S-CPU vector fetch. Keep a
    // pristine hardware state so PPU, CPU I/O, DMA/HDMA and the APU return to
    // power-on while battery-backed SRAM and retained WRAM survive.
    this.powerOnState = saveVmState(this);
  }
  reset() {
    const wram = this.bus.wram.slice();
    const sram = this.bus.sram.slice();
    const { sramDirty, sramRevision } = this.bus;
    const skipRender = this.skipRender;
    loadVmState(this, this.powerOnState);
    this.bus.wram.set(wram);
    this.bus.sram.set(sram); this.bus.sramDirty = sramDirty; this.bus.sramRevision = sramRevision;
    this.skipRender = skipRender;
    this.bus.clock.idle(RESET_MASTER_CYCLES);
    this.cpu.reset();
  }
  setJoypad(mask) { this.bus.setJoypad(mask); }
  getTouchState() { return readTouchState(this.bus.wram, this.bus.wramWritten); }
  getFrame() { return this.ppu.getFrame?.() ?? null; }
  exportSram() { return this.bus.exportSram(); }
  importSram(bytes) { this.bus.importSram(bytes); }
  saveState() { return saveVmState(this); }
  loadState(state) { loadVmState(this, state); }
  step() {
    if (this.nmiTriggerMaster != null && this.bus.clock.master >= this.nmiTriggerMaster) {
      this.cpu.nmiPending = true;
      this.nmiTriggerMaster = null;
    }
    const beforeMaster = this.bus.clock.master;
    const accesses = this.bus.accessCount;
    const cpuCycles = this.cpu.step();
    const internalCycles = Math.max(0, cpuCycles - (this.bus.accessCount - accesses));
    const trailingInternalMaster = internalCycles * 6 - this.cpu.positionedInternalMaster;
    if (trailingInternalMaster < 0) throw new Error('positioned IO exceeds instruction internal cycles');
    this.bus.clock.idle(trailingInternalMaster);
    if (this.cpu.interruptMasterAdjustment) {
      this.bus.clock.idle(this.cpu.interruptMasterAdjustment);
      this.cpu.interruptMasterAdjustment = 0;
    }
    const afterMaster = this.bus.clock.master;
    const beforeVblank = vblankOrdinal(beforeMaster);
    const afterVblank = vblankOrdinal(afterMaster);
    if (afterVblank > beforeVblank) {
      this.ppu.presentField?.(afterVblank, afterMaster, !this.skipRender);
      this.bus.setInputField(afterVblank);
      this.bus.nmiFlag = true;
      // Snes9x schedules the VBlank NMI at HC=12 and enters it at the first
      // opcode boundary at or beyond that point.
      if (this.bus.io[0x4200] & 0x80) {
        this.nmiTriggerMaster = vblankBoundary(afterVblank) + 6;
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
