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

export function installSystemDevices(memory, cpu) {
  const interrupts = new InterruptController({
    line: (active) => cpu.setHardwareInterrupt(active),
  });
  memory.map16(0x1f801070, interrupts.statusDevice());
  memory.map16(0x1f801074, interrupts.maskDevice());

  const counters = [0, 1, 2].map((index) => {
    const counter = new RootCounter({ interrupt: () => interrupts.raise(4 + index) });
    const base = 0x1f801100 + index * 0x10;
    memory.map16(base, counter.countDevice());
    memory.map16(base + 4, counter.modeDevice());
    memory.map16(base + 8, counter.targetDevice());
    return counter;
  });
  return { interrupts, counters };
}
