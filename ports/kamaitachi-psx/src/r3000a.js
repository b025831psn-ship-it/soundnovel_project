const RAM_SIZE = 2 * 1024 * 1024;
const s8 = (v) => (v << 24) >> 24;
const s16 = (v) => (v << 16) >> 16;
const u32 = (v) => v >>> 0;

export class PsxMemory {
  constructor(size = RAM_SIZE) {
    this.bytes = new Uint8Array(size);
    this.view = new DataView(this.bytes.buffer);
    this.io32 = new Map();
  }
  map32(address, device) { this.io32.set(address & 0x1fffffff, device); }
  offset(address, width = 1) {
    let physical = address & 0x1fffffff;
    // Retail PS1 RAM is 2 MiB, mirrored four times through 00000000-007fffff.
    if (physical < 0x00800000) physical %= this.bytes.length;
    if (physical + width > this.bytes.length)
      throw new RangeError(`unmapped PS1 address 0x${u32(address).toString(16)}`);
    return physical;
  }
  u8(a) { return this.bytes[this.offset(a)]; }
  u16(a) { return this.view.getUint16(this.offset(a, 2), true); }
  u32(a) {
    const device = this.io32.get(a & 0x1fffffff);
    return device ? u32(device.read?.() ?? 0) : this.view.getUint32(this.offset(a, 4), true);
  }
  set8(a, v) { this.bytes[this.offset(a)] = v; }
  set16(a, v) { this.view.setUint16(this.offset(a, 2), v, true); }
  set32(a, v) {
    const device = this.io32.get(a & 0x1fffffff);
    if (device) { device.write?.(u32(v)); return; }
    this.view.setUint32(this.offset(a, 4), v, true);
  }
}

export class R3000A {
  constructor({ memory = new PsxMemory(), pc = 0, hooks = new Map(), trace = null } = {}) {
    this.memory = memory;
    this.regs = new Uint32Array(32);
    this.hi = 0;
    this.lo = 0;
    this.pc = u32(pc);
    this.nextPc = u32(pc + 4);
    this.hooks = hooks;
    this.trace = trace;
    this.instructions = 0;
  }
  jump(target) { this.nextPc = u32(target); }
  step() {
    const hook = this.hooks.get(this.pc);
    if (hook) {
      const at = this.pc;
      hook(this);
      this.regs[0] = 0;
      this.instructions++;
      this.trace?.({ pc: at, instruction: null, hook: true, nextPc: this.pc });
      return;
    }
    const at = this.pc;
    const instruction = this.memory.u32(at);
    this.pc = this.nextPc;
    this.nextPc = u32(this.nextPc + 4);
    this.execute(instruction, at);
    this.regs[0] = 0;
    this.instructions++;
    this.trace?.({ pc: at, instruction, hook: false, nextPc: this.pc });
  }
  execute(word, at) {
    const op = word >>> 26, rs = (word >>> 21) & 31, rt = (word >>> 16) & 31;
    const rd = (word >>> 11) & 31, shift = (word >>> 6) & 31, imm = word & 0xffff;
    const branch = () => u32(at + 4 + (s16(imm) << 2));
    if (op === 0) {
      switch (word & 63) {
        case 0x00: this.regs[rd] = u32(this.regs[rt] << shift); return;
        case 0x02: this.regs[rd] = this.regs[rt] >>> shift; return;
        case 0x03: this.regs[rd] = u32(this.regs[rt] >> shift); return;
        case 0x08: this.jump(this.regs[rs]); return;
        case 0x09: this.regs[rd || 31] = u32(at + 8); this.jump(this.regs[rs]); return;
        case 0x21: this.regs[rd] = u32(this.regs[rs] + this.regs[rt]); return;
        case 0x23: this.regs[rd] = u32(this.regs[rs] - this.regs[rt]); return;
        case 0x24: this.regs[rd] = this.regs[rs] & this.regs[rt]; return;
        case 0x25: this.regs[rd] = this.regs[rs] | this.regs[rt]; return;
        case 0x26: this.regs[rd] = this.regs[rs] ^ this.regs[rt]; return;
        case 0x2a: this.regs[rd] = (this.regs[rs] | 0) < (this.regs[rt] | 0) ? 1 : 0; return;
        case 0x2b: this.regs[rd] = this.regs[rs] < this.regs[rt] ? 1 : 0; return;
        default: throw new Error(`unimplemented R3000A SPECIAL 0x${(word & 63).toString(16)} at 0x${at.toString(16)}`);
      }
    }
    switch (op) {
      case 0x02: this.jump((this.pc & 0xf0000000) | ((word & 0x03ffffff) << 2)); break;
      case 0x03: this.regs[31] = u32(at + 8); this.jump((this.pc & 0xf0000000) | ((word & 0x03ffffff) << 2)); break;
      case 0x04: if (this.regs[rs] === this.regs[rt]) this.jump(branch()); break;
      case 0x05: if (this.regs[rs] !== this.regs[rt]) this.jump(branch()); break;
      case 0x06: if ((this.regs[rs] | 0) <= 0) this.jump(branch()); break;
      case 0x07: if ((this.regs[rs] | 0) > 0) this.jump(branch()); break;
      case 0x08:
      case 0x09: this.regs[rt] = u32(this.regs[rs] + s16(imm)); break;
      case 0x0a: this.regs[rt] = (this.regs[rs] | 0) < s16(imm) ? 1 : 0; break;
      case 0x0b: this.regs[rt] = this.regs[rs] < u32(s16(imm)) ? 1 : 0; break;
      case 0x0c: this.regs[rt] = this.regs[rs] & imm; break;
      case 0x0d: this.regs[rt] = this.regs[rs] | imm; break;
      case 0x0e: this.regs[rt] = this.regs[rs] ^ imm; break;
      case 0x0f: this.regs[rt] = u32(imm << 16); break;
      case 0x20: this.regs[rt] = u32(s8(this.memory.u8(this.regs[rs] + s16(imm)))); break;
      case 0x21: this.regs[rt] = u32(s16(this.memory.u16(this.regs[rs] + s16(imm)))); break;
      case 0x23: this.regs[rt] = this.memory.u32(this.regs[rs] + s16(imm)); break;
      case 0x24: this.regs[rt] = this.memory.u8(this.regs[rs] + s16(imm)); break;
      case 0x25: this.regs[rt] = this.memory.u16(this.regs[rs] + s16(imm)); break;
      case 0x28: this.memory.set8(this.regs[rs] + s16(imm), this.regs[rt]); break;
      case 0x29: this.memory.set16(this.regs[rs] + s16(imm), this.regs[rt]); break;
      case 0x2b: this.memory.set32(this.regs[rs] + s16(imm), this.regs[rt]); break;
      default: throw new Error(`unimplemented R3000A opcode 0x${op.toString(16)} at 0x${at.toString(16)}`);
    }
  }
}

export function loadPsxExe(bytes, memory = new PsxMemory()) {
  if (bytes.length < 0x800 || new TextDecoder("ascii").decode(bytes.subarray(0, 8)) !== "PS-X EXE")
    throw new Error("not a PS-X EXE");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pc = view.getUint32(0x10, true), textAddress = view.getUint32(0x18, true);
  const textSize = view.getUint32(0x1c, true), stackAddress = view.getUint32(0x30, true);
  if (0x800 + textSize > bytes.length) throw new Error("truncated PS-X EXE payload");
  memory.bytes.set(bytes.subarray(0x800, 0x800 + textSize), memory.offset(textAddress, textSize));
  return { memory, pc, textAddress, textSize, stackAddress };
}
