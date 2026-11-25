import { SfcBus } from './bus.js';
import { Cpu65816 } from './cpu.js';
import { renderFrame, renderScanline } from './ppu.js';

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
    this.rasterFramebuffer = new Uint8ClampedArray(256 * 224 * 4);
    this.nextRenderLine = 512;
    this.nextHdma = 1_106;
    this.nextHdmaInit = 20;
    this.rasterLine = 0;
    this.rasterField = 0;
    this.nextIrq = Infinity;
    this.pendingIrq = false;
    this.renderedPpuRevision = -1;

    const externalNmiEnable = busOptions.onNmiEnable;
    const externalIrqConfig = busOptions.onIrqConfig;
    const externalIrqAcknowledge = busOptions.onIrqAcknowledge;
    this.bus = new SfcBus(rom, {
      ...busOptions,
      apu,
      onNmiEnable: (master) => {
        externalNmiEnable?.(master);
        if (this.inVblank) this.pendingNmiAt = Math.min(this.pendingNmiAt, master + 12);
      },
      onIrqConfig: (master) => { externalIrqConfig?.(master); this.scheduleIrq(master); },
      onIrqAcknowledge: () => { externalIrqAcknowledge?.(); this.pendingIrq = false; },
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
    if (this.pendingIrq && this.cpu.irq()) {
      this.pendingIrq = false;
      this.bus.io[0x4211 - 0x2000] &= 0x7f;
    }
    const instructionAddress = this.cpu.address();
    const result = this.cpu.step();
    this.onInstruction?.(instructionAddress, result);
    this.processRasterEvents();

    while (this.master >= this.nextFrame) {
      this.frame++;
      this.inVblank = false;
      if (this.onFrame) {
        this.framebuffer = this.rasterFramebuffer.slice();
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

  lineLength(line = this.rasterLine, field = this.rasterField) {
    return line === 240 && field === 1 ? 1_360 : 1_364;
  }

  advanceRasterEvent(event) {
    const length = this.lineLength();
    if (event === 'render') this.nextRenderLine += length;
    if (event === 'hdma') this.nextHdma += length;
    if (event === 'init') this.nextHdmaInit += length;
  }

  finishRasterLine() {
    this.rasterLine++;
    if (this.rasterLine === 262) { this.rasterLine = 0; this.rasterField ^= 1; }
  }

  processRasterEvents() {
    for (;;) {
      const next = Math.min(this.nextRenderLine, this.nextHdma, this.nextHdmaInit, this.nextIrq);
      if (next > this.master) break;
      if (next === this.nextIrq) {
        this.bus.io[0x4211 - 0x2000] |= 0x80;
        this.pendingIrq = true;
        this.scheduleIrq(next + 1);
      } else if (next === this.nextHdmaInit) {
        if (this.rasterLine === 0) this.cpu.advanceMaster(this.bus.initHdma(next));
        this.advanceRasterEvent('init');
      } else if (next === this.nextRenderLine) {
        if (this.onFrame && this.rasterLine < 224) renderScanline(this.bus, this.rasterFramebuffer, this.rasterLine);
        this.advanceRasterEvent('render');
      } else {
        if (this.rasterLine <= 224) this.cpu.advanceMaster(this.bus.runHdmaLine(next));
        this.advanceRasterEvent('hdma');
        this.finishRasterLine();
      }
    }
  }

  scheduleIrq(afterMaster = this.master) {
    const mode = this.bus.io[0x4200 - 0x2000] & 0x30;
    if (!mode) { this.nextIrq = Infinity; return; }
    const h = this.bus.io[0x4207 - 0x2000] | ((this.bus.io[0x4208 - 0x2000] & 1) << 8);
    const v = this.bus.io[0x4209 - 0x2000] | ((this.bus.io[0x420a - 0x2000] & 1) << 8);
    let line = this.rasterLine, field = this.rasterField, start = this.nextHdma - 1_106;
    for (let count = 0; count <= 262; count++) {
      const lineMatches = !(mode & 0x20) || line === v;
      const offset = mode & 0x10 ? h * 4 + 14 - (h ? 0 : 4) : 10;
      const candidate = start + offset;
      if (lineMatches && candidate >= afterMaster) { this.nextIrq = candidate; return; }
      const length = this.lineLength(line, field);
      start += length; line++;
      if (line === 262) { line = 0; field ^= 1; }
    }
    this.nextIrq = Infinity;
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
