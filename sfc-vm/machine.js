import { SfcBus } from './bus.js';
import { Cpu65816 } from './cpu.js';
import { renderFrame, renderScanline } from './ppu.js';

export const NTSC_MASTER_HZ = 21_477_272.7;

const MACHINE_STATE_VERSION = 1;
const MACHINE_SCALARS = [
  'frame', 'nmiCount', 'end', 'buttons', 'physicalButtons', 'inVblank',
  'pendingNmiAt', 'nextFrame', 'nextNmi', 'frameLength', 'nmiFrameLength',
  'nextRenderLine', 'nextHdma', 'nextHdmaInit', 'rasterLine', 'rasterField',
  'nextIrq', 'pendingIrq', 'pendingNmi', 'nextJoypadComplete',
];
const CPU_SCALARS = [
  'executed', 'a', 'x', 'y', 'd', 'dbr', 's', 'p', 'e', 'pbr', 'pc',
  'masterCycle', 'nextWramRefresh', 'refreshPosition', 'refreshScanline',
  'refreshField', 'busTransactions',
];
const BUS_SCALARS = [
  'apuPhase', 'wramAddress', 'oamAddress', 'cgramAddress', 'vramAddress',
  'vmain', 'vramReadBuffer', 'ppuScrollLatch', 'ppuMode7Latch', 'fixedColor',
  'controller1', 'apuAccessCount', 'pendingDmaMasterCycles', 'hdmaActive',
  'ppuRevision',
];
const copyScalars = (source, names) => Object.fromEntries(names.map((name) => [name, source[name]]));
const restoreScalars = (target, state, names) => {
  for (const name of names) target[name] = state[name];
};

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
    this.physicalButtons = 0;
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
    this.pendingNmi = false;
    this.nextJoypadComplete = Infinity;
    this.renderedLineRevision = new Int32Array(224).fill(-1);

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
    this.cpu.eventScheduler = this;
  }

  get master() { return this.cpu.masterCycle; }
  get time() { return this.master / NTSC_MASTER_HZ; }

  setButtons(mask) { this.buttons = mask & 0xffff; }

  enterNmi() {
    this.nmiCount++;
    const mask = this.buttons ?? this.physicalButtons;
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
    if (this.pendingNmi) { this.pendingNmi = false; this.enterNmi(); }
    else if (this.pendingIrq && this.cpu.irq()) {
      this.pendingIrq = false;
      this.bus.io[0x4211 - 0x2000] &= 0x7f;
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

  nextCpuEvent() {
    const events = [
      ['irq', this.nextIrq], ['hdma-init', this.nextHdmaInit], ['render', this.nextRenderLine],
      ['hdma', this.nextHdma], ['frame', this.nextFrame], ['nmi', this.nextNmi],
      ['nmi-edge', this.pendingNmiAt],
      ['joypad', this.nextJoypadComplete],
    ];
    let selected = events[0];
    for (const event of events.slice(1)) if (event[1] < selected[1]) selected = event;
    return { type: selected[0], master: selected[1] };
  }

  runCpuEvent({ type, master }) {
    if (type === 'irq') {
        this.bus.io[0x4211 - 0x2000] |= 0x80;
        this.pendingIrq = true;
        this.scheduleIrq(master + 1);
        return 0;
    }
    if (type === 'hdma-init') {
        const stall = this.rasterLine === 0 ? this.bus.initHdma(master) : 0;
        this.advanceRasterEvent('init');
        return stall;
    }
    if (type === 'render') {
        if (this.onFrame && this.rasterLine < 224
            && this.renderedLineRevision[this.rasterLine] !== this.bus.ppuRevision) {
          renderScanline(this.bus, this.rasterFramebuffer, this.rasterLine);
          this.renderedLineRevision[this.rasterLine] = this.bus.ppuRevision;
        }
        this.advanceRasterEvent('render');
        return 0;
    }
    if (type === 'hdma') {
        const stall = this.rasterLine <= 224 ? this.bus.runHdmaLine(master) : 0;
        this.advanceRasterEvent('hdma');
        this.finishRasterLine();
        return stall;
    }
    if (type === 'frame') {
      this.frame++;
      this.inVblank = false;
      // libretro polls physical input at the start of retro_run, before the
      // upcoming auto-joypad read.  Expose the last completed NMI here; the
      // sampled value is then consumed by the next vblank auto-read.
      if (this.buttons === null) this.physicalButtons = this.joypad(this.nmiCount, this.frame) ?? 0;
      this.nextFrame += this.frameLength;
      this.frameLength = this.frameLength === 357_368 ? 357_364 : 357_368;
      return 0;
    }
    if (type === 'nmi') {
      this.inVblank = true;
      if (this.onFrame) {
        this.framebuffer = this.rasterFramebuffer.slice();
        this.onFrame(this.frame, this.framebuffer);
      }
      this.bus.latchNmi();
      if (this.bus.io[0x4200 - 0x2000] & 0x80) this.pendingNmi = true;
      if (this.bus.io[0x4200 - 0x2000] & 1) {
        this.bus.io[0x4212 - 0x2000] |= 1;
        this.nextJoypadComplete = master + 4_224;
      }
      this.nextNmi += this.nmiFrameLength;
      this.nmiFrameLength = this.nmiFrameLength === 357_368 ? 357_364 : 357_368;
      return 0;
    }
    if (type === 'joypad') {
      this.bus.latchControllers();
      this.bus.io[0x4212 - 0x2000] &= 0xfe;
      this.nextJoypadComplete = Infinity;
      return 0;
    }
    this.pendingNmiAt = Infinity;
    this.pendingNmi = true;
    return 0;
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

  saveState({ apu = this.bus.masterLink?.apu } = {}) {
    const bus = this.bus, link = bus.masterLink;
    return {
      version: MACHINE_STATE_VERSION,
      machine: copyScalars(this, MACHINE_SCALARS),
      framebuffer: this.framebuffer?.slice() ?? null,
      rasterFramebuffer: this.rasterFramebuffer.slice(),
      renderedLineRevision: this.renderedLineRevision.slice(),
      cpu: copyScalars(this.cpu, CPU_SCALARS),
      bus: {
        ...copyScalars(bus, BUS_SCALARS),
        wram: bus.wram.slice(), sram: bus.sram.slice(), io: bus.io.slice(),
        apuPorts: bus.apuPorts.slice(), apuInputPorts: bus.apuInputPorts.slice(),
        vram: bus.vram.slice(), cgram: bus.cgram.slice(), oam: bus.oam.slice(),
        bgHofs: bus.bgHofs.slice(), bgVofs: bus.bgVofs.slice(), mode7: bus.mode7.slice(),
        hdma: structuredClone(bus.hdma), pendingMath: structuredClone(bus.pendingMath),
        dmaStats: structuredClone(bus.dmaStats), readStats: structuredClone(bus.readStats),
      },
      masterLink: link ? {
        master: link.master, rem: link.rem, target: link.target,
        pending: structuredClone(link.pending),
      } : null,
      apu: apu?.saveState ? apu.saveState() : null,
    };
  }

  loadState(state, { apu = this.bus.masterLink?.apu } = {}) {
    if (!state || state.version !== MACHINE_STATE_VERSION)
      throw new Error(`unsupported SfcMachine state version: ${state?.version}`);
    if (state.apu != null) {
      if (!apu?.loadState) throw new Error('state contains APU data but no compatible APU was supplied');
      apu.loadState(state.apu);
    }
    restoreScalars(this, state.machine, MACHINE_SCALARS);
    this.framebuffer = state.framebuffer?.slice() ?? null;
    this.rasterFramebuffer.set(state.rasterFramebuffer);
    this.renderedLineRevision.set(state.renderedLineRevision);
    restoreScalars(this.cpu, state.cpu, CPU_SCALARS);
    const bus = this.bus, savedBus = state.bus;
    restoreScalars(bus, savedBus, BUS_SCALARS);
    for (const name of ['wram', 'sram', 'io', 'apuPorts', 'apuInputPorts', 'vram',
      'cgram', 'oam', 'bgHofs', 'bgVofs', 'mode7']) bus[name].set(savedBus[name]);
    bus.hdma = structuredClone(savedBus.hdma);
    bus.pendingMath = structuredClone(savedBus.pendingMath);
    bus.dmaStats = structuredClone(savedBus.dmaStats);
    bus.readStats = structuredClone(savedBus.readStats);
    const link = bus.masterLink;
    if (state.masterLink) {
      if (!link) throw new Error('state contains MasterLink data but this machine has no MasterLink');
      link.master = state.masterLink.master; link.rem = state.masterLink.rem;
      link.target = state.masterLink.target; link.pending = structuredClone(state.masterLink.pending);
    }
    return this;
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
