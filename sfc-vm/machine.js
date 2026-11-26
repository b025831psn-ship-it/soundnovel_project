import { SfcBus } from './bus.js';
import { Cpu65816 } from './cpu.js';
import { renderFrame } from './ppu.js';

export const NTSC_MASTER_HZ = 21_477_272.7;

export class SfcMachine {
  constructor({
    rom,
    apu,
    joypad = () => 0,
    onFrame = null,
    busOptions = {},
    cpuOptions = {},
    onNmi = null,
    onAfterNmi = null,
    onNmiVector = null,
    onInstruction = null,
  }) {
    this.frame = 0;
    this.nmiCount = 0;
    this.end = null;
    this.joypad = joypad;
    this.onFrame = onFrame;
    this.onNmi = onNmi;
    this.onAfterNmi = onAfterNmi;
    this.onNmiVector = onNmiVector;
    this.onInstruction = onInstruction;
    this.buttons = null;
    this.inVblank = false;
    this.pendingNmiAt = Infinity;
    this.nextFrame = 1_368;
    this.nextNmi = 306_912;
    this.frameLength = 357_368;
    this.nmiFrameLength = 357_368;
    this.framebuffer = null;
    this.renderedPpuRevision = -1;

    const externalNmiEnable = busOptions.onNmiEnable;
    this.bus = new SfcBus(rom, {
      ...busOptions,
      apu,
      onNmiEnable: (master) => {
        externalNmiEnable?.(master);
        if (this.inVblank) this.pendingNmiAt = Math.min(this.pendingNmiAt, master + 12);
      },
    });
    const externalInterruptVector = cpuOptions.onInterruptVector;
    this.cpu = new Cpu65816(this.bus, {
      ...cpuOptions,
      onInterruptVector: (vector, master) => {
        externalInterruptVector?.(vector, master);
        if (vector === 0x00fffa || vector === 0x00ffea)
          this.onNmiVector?.(this.nmiCount, this.frame, master);
      },
    });
  }

  get master() { return this.cpu.masterCycle; }
  get time() { return this.master / NTSC_MASTER_HZ; }

  setButtons(mask) { this.buttons = mask & 0xffff; }

  enterNmi() {
    this.nmiCount++;
    const mask = this.buttons ?? this.joypad(this.nmiCount, this.frame) ?? 0;
    this.bus.setController1(mask);
    this.onNmi?.(this.frame, this.master);
    this.cpu.nmi();
    this.onAfterNmi?.(this.nmiCount, this.frame, this.master);
  }

  latchNmi() {
    if (!(this.bus.io[0x4200 - 0x2000] & 0x80)) return;
    this.enterNmi();
  }

  step() {
    if (this.end != null && this.time >= this.end) return null;
    const instructionAddress = this.cpu.address();
    const result = this.cpu.step();
    this.onInstruction?.(instructionAddress, result);

    while (this.master >= this.nextFrame) {
      this.frame++;
      this.inVblank = false;
      if (this.onFrame) {
        if (this.renderedPpuRevision !== this.bus.ppuRevision) {
          this.framebuffer = renderFrame(this.bus);
          this.renderedPpuRevision = this.bus.ppuRevision;
        }
        this.onFrame(this.frame, this.framebuffer);
      }
      this.nextFrame += this.frameLength;
      this.frameLength = this.frameLength === 357_368 ? 357_364 : 357_368;
    }
    while (this.master >= this.nextNmi) {
      this.inVblank = true;
      this.latchNmi();
      this.nextNmi += this.nmiFrameLength;
      this.nmiFrameLength = this.nmiFrameLength === 357_368 ? 357_364 : 357_368;
    }
    if (this.master >= this.pendingNmiAt) {
      this.pendingNmiAt = Infinity;
      this.enterNmi();
    }
    return { instructionAddress, result };
  }

  runToMaster(master) {
    const endMaster = this.end == null ? master : Math.min(master, this.end * NTSC_MASTER_HZ);
    while (this.master < endMaster) this.step();
    return this.master;
  }

  runTo(seconds) {
    return this.runToMaster(seconds * NTSC_MASTER_HZ);
  }
}
