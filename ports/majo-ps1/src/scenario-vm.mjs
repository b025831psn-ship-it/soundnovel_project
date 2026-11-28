// SLPS-01863, dispatcher 0x8001c36c. PC and branch targets are byte
// offsets from the start of the decompressed scenario resource.
export class ScenarioVM {
  constructor(script, flags, rng) {
    this.script = script;
    this.flags = flags;
    this.rng = rng;
    this.choice = null;
    this.pc = 0;
  }

  read(width) {
    if (this.pc + width > this.script.length) {
      throw new RangeError(`Truncated operand at ${this.pc}`);
    }
    let value = 0;
    for (let i = 0; i < width; i++) value = value * 256 + this.script[this.pc++];
    return value;
  }

  flagIndex() {
    const index = this.read(2);
    if (index >= this.flags.length) throw new RangeError(`Flag index ${index}`);
    return index;
  }

  jump(target) {
    if (target >= this.script.length) throw new RangeError(`Jump target ${target}`);
    this.pc = target;
  }

  branch(lessThan) {
    const value = this.flags[this.flagIndex()];
    const targets = [];
    for (;;) {
      const test = this.read(1);
      const target = this.read(3);
      if (test === 255) {
        if (target !== 0xffffff) return this.jump(target);
        if (!this.rng) throw new Error("Random branch requires the game RNG state");
        this.rng.calls = (this.rng.calls + 1) & 0xffff;
        this.rng.seed = (Math.imul(this.rng.seed, 0x41c64e6d) + 12345) >>> 0;
        const roll = (this.rng.seed >>> 16) & 0x7fff;
        return this.jump(targets.length ? targets[roll % targets.length] : target);
      }
      if (lessThan ? value < test : value === test) return this.jump(target);
      targets.push(target);
    }
  }

  step() {
    const offset = this.pc;
    if (this.read(1) !== 0x40) throw new Error(`Expected command at ${offset}`);
    const opcode = this.read(1);
    switch (opcode) {
      case 0x00:
        while (this.pc + 1 < this.script.length) {
          if (this.script[this.pc] === 0x40 && this.script[this.pc + 1] <= 0x10) return;
          this.pc++;
        }
        throw new Error(`Missing next command after ${offset}`);
      case 0x02:
        return this.jump(this.read(4));
      case 0x03:
      case 0x04:
        return this.branch(opcode === 0x04);
      case 0x05: {
        const conditionFlag = this.flagIndex();
        const resultFlag = this.flagIndex();
        const initialCount = this.read(1);
        const count = this.read(1);
        const targets = Array.from({length: count}, () => this.read(4));
        const visible = this.flags[conditionFlag] ? count : initialCount;
        this.choice = {resultFlag, visible, targets};
        return;
      }
      case 0x0e: {
        const mask = this.read(1);
        const shift = this.read(1);
        this.flags[this.flagIndex()] |= mask << shift;
        return;
      }
      case 0x0f: {
        const value = this.read(2);
        this.flags[this.flagIndex()] = value & 255;
        return;
      }
      default:
        throw new Error(`Unsupported scenario opcode 0x${opcode.toString(16)} at ${offset}`);
    }
  }
}
