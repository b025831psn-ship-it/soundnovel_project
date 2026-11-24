const u16 = (value) => value & 0xffff;

export class InterruptController {
  constructor({ line = () => {} } = {}) {
    this.status = 0;
    this.mask = 0;
    this.line = line;
  }
  update() { this.line((this.status & this.mask) !== 0); }
  raise(bit) { this.status = u16(this.status | (1 << bit)); this.update(); }
  acknowledge(value) { this.status = u16(this.status & value); this.update(); }
  setMask(value) { this.mask = u16(value); this.update(); }
  statusDevice() {
    return { read: () => this.status, write: (value) => this.acknowledge(value) };
  }
  maskDevice() {
    return { read: () => this.mask, write: (value) => this.setMask(value) };
  }
}

export class RootCounter {
  constructor({ interrupt = () => {} } = {}) {
    this.count = 0;
    this.mode = 0;
    this.target = 0;
    this.interrupt = interrupt;
  }
  setMode(value) {
    this.mode = u16(value) & 0x03ff;
    this.count = 0;
  }
  tick(cycles = 1) {
    for (let index = 0; index < cycles; index++) {
      this.count = u16(this.count + 1);
      if (this.count === this.target) {
        this.mode |= 1 << 10;
        if (this.mode & (1 << 4)) this.interrupt("target");
        if (this.mode & (1 << 3)) this.count = 0;
      }
      if (this.count === 0) {
        this.mode |= 1 << 11;
        if (this.mode & (1 << 5)) this.interrupt("overflow");
      }
    }
  }
  countDevice() { return { read: () => this.count, write: (value) => { this.count = u16(value); } }; }
  modeDevice() {
    return {
      read: () => {
        const value = this.mode;
        this.mode &= ~0x0c00;
        return value;
      },
      write: (value) => this.setMode(value),
    };
  }
  targetDevice() { return { read: () => this.target, write: (value) => { this.target = u16(value); } }; }
}

export class GpuPorts {
  constructor({ status = 0x14802000, command = () => {} } = {}) {
    this.status = status >>> 0;
    this.command = command;
    this.gp0 = [];
    this.gp1 = [];
  }
  gp0Device() {
    return {
      read: () => 0,
      write: (value) => {
        value >>>= 0;
        this.gp0.push(value);
        this.command({ port: "gp0", value });
      },
    };
  }
  gp1Device() {
    return {
      read: () => this.status,
      write: (value) => {
        value >>>= 0;
        this.gp1.push(value);
        const opcode = value >>> 24;
        if (opcode === 0x00) this.status = 0x14802000;
        if (opcode === 0x03) this.status = (this.status & ~(1 << 23)) | ((value & 1) << 23);
        if (opcode === 0x04) this.status = (this.status & ~(3 << 29)) | ((value & 3) << 29);
        this.command({ port: "gp1", value });
      },
    };
  }
}

export class DmaController {
  constructor({ transfer = () => {} } = {}) {
    this.registers = new Uint32Array(0x78 / 4);
    this.transfer = transfer;
  }
  device(address) {
    const index = (address - 0x1f801080) >>> 2;
    return {
      read: () => this.registers[index],
      write: (value) => {
        value >>>= 0;
        this.registers[index] = value;
        const relative = address - 0x1f801080;
        if (relative < 0x70 && relative % 0x10 === 8 && (value & (1 << 24))) {
          const channel = relative >>> 4;
          this.transfer({
            channel,
            madr: this.registers[channel * 4],
            bcr: this.registers[channel * 4 + 1],
            chcr: value,
          });
          this.registers[index] = value & ~(1 << 24);
        }
      },
    };
  }
}

export function installSystemDevices(memory, cpu) {
  const interrupts = new InterruptController({
    line: (active) => cpu.setHardwareInterrupt(active),
  });
  memory.map16(0x1f801070, interrupts.statusDevice());
  memory.map16(0x1f801074, interrupts.maskDevice());
  memory.map32(0x1f801070, interrupts.statusDevice());
  memory.map32(0x1f801074, interrupts.maskDevice());

  const counters = [0, 1, 2].map((index) => {
    const counter = new RootCounter({ interrupt: () => interrupts.raise(4 + index) });
    const base = 0x1f801100 + index * 0x10;
    for (const width of ["map16", "map32"]) {
      memory[width](base, counter.countDevice());
      memory[width](base + 4, counter.modeDevice());
      memory[width](base + 8, counter.targetDevice());
    }
    return counter;
  });
  const gpu = new GpuPorts();
  memory.map32(0x1f801810, gpu.gp0Device());
  memory.map32(0x1f801814, gpu.gp1Device());
  const dma = new DmaController();
  for (let address = 0x1f801080; address <= 0x1f8010f4; address += 4)
    memory.map32(address, dma.device(address));
  return { interrupts, counters, gpu, dma };
}
