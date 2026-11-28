// SLPS-01863, dispatcher 0x8001c36c. PC and branch targets are byte
// offsets from the start of the decompressed scenario resource.
export class ScenarioVM {
  constructor(script, flags, rng, state = {}) {
    this.script = script;
    this.flags = flags;
    this.rng = rng;
    this.choice = null;
    this.state = state;
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

  string(aligned) {
    const end = this.script.indexOf(0, this.pc);
    if (end < 0) throw new RangeError(`Unterminated string at ${this.pc}`);
    const result = this.script.subarray(this.pc, end);
    this.pc = end + 1;
    if (aligned) this.pc += this.pc % 2;
    return result;
  }

  text() {
    const bytes = [];
    let options = 0;
    let inOption = false;
    let hasOptions = false;
    while (this.pc < this.script.length && this.script[this.pc]) {
      const ch = this.read(1);
      const next = this.script[this.pc];
      if (ch === 64 && next === 110) {
        this.pc++;
        const digits = /^[0-9a-f]+/i.exec(new TextDecoder("ascii").decode(
          this.script.subarray(this.pc, this.pc + 8)));
        const name = this.state.names?.[digits ? parseInt(digits[0], 16) : -1];
        if (!name) throw new Error(`Missing name at ${this.pc}`);
        bytes.push(...name);
        this.pc++;
      } else if (ch === 64 && next === 103) {
        inOption = true;
        hasOptions = true;
        this.pc++;
        bytes.push(64, 103, 0x83, 0x9f + options, 0x81, 0x44);
      } else if (inOption && ch === 64 && next === 113) {
        inOption = false;
        options++;
        if (options >= (this.choice?.visible ?? 0)) {
          bytes.push(64, 113);
          this.pc--;
          break;
        }
        this.pc++;
        bytes.push(64, 114);
      } else {
        bytes.push(ch);
      }
    }
    if (this.pc === this.script.length) throw new RangeError("Unterminated scenario text");
    while (this.pc < this.script.length && !this.script[this.pc]) this.pc++;
    return {type: "text", bytes: Uint8Array.from(hasOptions ? this.layoutOptions(bytes) : bytes), options};
  }

  layoutOptions(bytes) {
    const result = [];
    let column = 0;
    const wide = byte => (byte >= 0x81 && byte < 0xa0) || byte >= 0xe0;
    for (let i = 0; i < bytes.length;) {
      const first = bytes[i++];
      const second = bytes[i++];
      result.push(first, second);
      if (first === 64 && second === 103) {
        result.push(...bytes.slice(i, i + 4));
        i += 4;
      } else if (first === 64 && second === 114) {
        column = 0;
        if (bytes[i] !== 64 || bytes[i + 1] !== 103) result.push(0x81, 0x40, 0x81, 0x40);
      } else if (wide(first) && ++column >= 16 && wide(bytes[i])) {
        const next = (bytes[i] << 8) | bytes[i + 1];
        if (!this.state.noLineStart?.has(next)) {
          result.push(0x81, 0x40, 0x81, 0x40);
          column = 0;
        }
      }
    }
    return result;
  }

  transition(mode, duration) {
    const actions = [];
    const fade = (from, to) => actions.push(["fade", from, to, mode & 64 ? 4 : 7, duration * 2]);
    if (mode & 1) actions.push(["textFade", 0, duration * 2], ["wait", "textFade"]);
    if (mode & 2) {
      if (mode & 128) {
        if (mode & 96) fade(255, 0);
        actions.push(["fadeOut", duration]);
      } else {
        actions.push(["fadeIn", 0, duration]);
        if (this.state.fadeInPending) actions.push(["wait", "fadeIn"]);
        if ((mode & 96) || this.state.fadeLevel === 255) {
          if (mode & 96) fade(0, 255);
          else fade(255, 0);
          actions.push(["wait", "fade"]);
        }
      }
    }
    return {type: "transition", actions};
  }

  arithmetic() {
    const target = this.flagIndex();
    const operation = this.read(1);
    const indirect = this.read(1);
    const operand = indirect ? this.flags[this.flagIndex()] : this.read(2);
    const previous = this.flags[target];
    switch (operation) {
      case 0: this.flags[target] = (previous + operand) & 255; break;
      case 1: this.flags[target] = (previous - operand) & 255; break;
      case 2: this.flags[target] = (previous * operand) & 255; break;
      case 3:
        if (!operand) throw new RangeError("Scenario division by zero");
        this.flags[target] = Math.trunc(previous / operand);
        break;
    }
  }

  ending(id) {
    const route = this.flags[0];
    const counts = this.state.routeCounts ??= new Map();
    const total = this.state.totalEndings = Math.min(999, (this.state.totalEndings ?? 0) + 1);
    const count = Math.min(999, (counts.get(route) ?? 0) + 1);
    counts.set(route, count);
    if (route === 1) this.state.routeStatus = 0;
    this.flags[1] = 20;
    this.flags[2] = Math.min(total, 255);
    this.flags[route + 2] = Math.min(count, 255);
    this.flags[12 + (id >> 3)] |= 1 << (id & 7);
    return {type: "ending", id};
  }

  skipToCommand(offset) {
    while (this.pc + 1 < this.script.length) {
      if (this.script[this.pc] === 0x40 && this.script[this.pc + 1] <= 0x10) return;
      this.pc++;
    }
    throw new Error(`Missing next command after ${offset}`);
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
    const marker = this.read(1);
    if (marker !== 0x40) return;
    const opcode = this.read(1);
    switch (opcode) {
      case 0x00:
        return this.skipToCommand(offset);
      case 0x01:
        return this.text();
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
      case 0x06: {
        const index = this.state.selected;
        if (!this.choice || !Number.isInteger(index) || index < 0 || index >= this.choice.targets.length) {
          throw new Error("Missing selection for choice branch");
        }
        this.flags[this.choice.resultFlag] = index + 1;
        this.jump(this.choice.targets[index]);
        return {type: "closeChoice"};
      }
      case 0x07: {
        const name = new TextDecoder().decode(this.string(true));
        const x = this.read(2) - 160;
        const y = this.read(2) - 120;
        const layer = this.read(1);
        const mode = this.read(1);
        if (layer === 3) this.state.background = name;
        return {type: "picture", name, layer, x, y, mode: mode & 127, blend: Boolean(mode & 128)};
      }
      case 0x08: {
        const mode = this.read(1);
        const decoder = new TextDecoder();
        const first = mode & 1 ? decoder.decode(this.string(false)) : null;
        const last = decoder.decode(this.string(true));
        return {type: "movie", name: first ?? last, secondary: first === null ? null : last, alternate: Boolean(mode & 2)};
      }
      case 0x09: {
        const id = this.read(2);
        if (this.state.music === id) return;
        this.state.music = id >= 1 && id <= 19 ? id : null;
        return {type: "music", id: this.state.music};
      }
      case 0x0a: {
        const id = this.read(2);
        const mode = this.read(1);
        return {type: "sound", id, bank: Number(id >= 95), mode, value: this.read(1)};
      }
      case 0x0b:
        return {type: "resetSoundBank", bank: 1};
      case 0x0c: {
        const mode = this.read(1);
        return this.transition(mode, this.read(1));
      }
      case 0x0d:
        return this.arithmetic();
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
      case 0x10:
        return this.ending(this.read(2));
      case 0x11: {
        if (this.state.vibrationDisabled) return;
        const mask = this.read(1);
        const strength = this.read(1);
        const duration = this.read(2);
        const actions = [];
        if (mask & 1) actions.push([0, duration, strength]);
        if (mask & 2) actions.push([16, duration, strength]);
        return {type: "vibration", actions};
      }
      case 0x12:
        this.state.controllerType = this.state.padType;
        return this.skipToCommand(offset);
      case 0x13:
        return {type: "effect", value: this.read(2)};
      case 0x14: {
        const cursor = this.pc;
        const name = new TextDecoder().decode(this.string(false));
        this.pc = cursor;
        return {type: "preparePicture", name};
      }
      default:
        throw new RangeError(`Unsupported scenario opcode 0x${opcode.toString(16).padStart(2, "0")} at ${offset}`);
    }
  }
}
