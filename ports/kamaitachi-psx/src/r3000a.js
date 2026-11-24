const RAM_SIZE = 2 * 1024 * 1024;
const s8 = (v) => (v << 24) >> 24;
const s16 = (v) => (v << 16) >> 16;
const u32 = (v) => v >>> 0;

export class PsxMemory {
  constructor(size = RAM_SIZE) {
    this.bytes = new Uint8Array(size);
    this.view = new DataView(this.bytes.buffer);
    this.io8 = new Map();
    this.io16 = new Map();
    this.io32 = new Map();
  }
  map8(address, device) { this.io8.set(address & 0x1fffffff, device); }
  map16(address, device) { this.io16.set(address & 0x1fffffff, device); }
  map32(address, device) { this.io32.set(address & 0x1fffffff, device); }
  offset(address, width = 1) {
    let physical = address & 0x1fffffff;
    // Retail PS1 RAM is 2 MiB, mirrored four times through 00000000-007fffff.
    if (physical < 0x00800000) physical %= this.bytes.length;
    if (physical + width > this.bytes.length)
      throw new RangeError(`unmapped PS1 address 0x${u32(address).toString(16)}`);
    return physical;
  }
  u8(a) {
    const device = this.io8.get(a & 0x1fffffff);
    return device ? (device.read?.() ?? 0) & 0xff : this.bytes[this.offset(a)];
  }
  u16(a) {
    const device = this.io16.get(a & 0x1fffffff);
    return device ? (device.read?.() ?? 0) & 0xffff : this.view.getUint16(this.offset(a, 2), true);
  }
  u32(a) {
    const device = this.io32.get(a & 0x1fffffff);
    return device ? u32(device.read?.() ?? 0) : this.view.getUint32(this.offset(a, 4), true);
  }
  set8(a, v) {
    const device = this.io8.get(a & 0x1fffffff);
    if (device) { device.write?.(v & 0xff); return; }
    this.bytes[this.offset(a)] = v;
  }
  set16(a, v) {
    const device = this.io16.get(a & 0x1fffffff);
    if (device) { device.write?.(v & 0xffff); return; }
    this.view.setUint16(this.offset(a, 2), v, true);
  }
  set32(a, v) {
    const device = this.io32.get(a & 0x1fffffff);
    if (device) { device.write?.(u32(v)); return; }
    this.view.setUint32(this.offset(a, 4), v, true);
  }
}

export class R3000A {
  constructor({ memory = new PsxMemory(), pc = 0, hooks = new Map(), syscall = null, breakpoint = null, trace = null } = {}) {
    this.memory = memory;
    this.regs = new Uint32Array(32);
    this.cop0 = new Uint32Array(32);
    this.hi = 0;
    this.lo = 0;
    this.pc = u32(pc);
    this.nextPc = u32(pc + 4);
    this.hooks = hooks;
    this.syscall = syscall;
    this.breakpoint = breakpoint;
    this.trace = trace;
    this.instructions = 0;
  }
  exception(code, at = this.pc, { branchDelay = false } = {}) {
    const status = this.cop0[12];
    this.cop0[13] = u32((this.cop0[13] & ~0x8000007c) | ((code & 31) << 2) | (branchDelay ? 0x80000000 : 0));
    this.cop0[14] = u32(branchDelay ? at - 4 : at);
    this.cop0[12] = u32((status & ~0x3f) | ((status << 2) & 0x3f));
    const vector = status & 0x00400000 ? 0xbfc00180 : 0x80000080;
    this.pc = vector;
    this.nextPc = u32(vector + 4);
  }
  interrupt(pending = 0x400) {
    this.cop0[13] = u32(this.cop0[13] | pending);
    const status = this.cop0[12];
    if ((status & 1) && (status & this.cop0[13] & 0xff00)) {
      this.exception(0, this.pc);
      return true;
    }
    return false;
  }
  setHardwareInterrupt(active) {
    if (active) return this.interrupt(0x400);
    this.cop0[13] = u32(this.cop0[13] & ~0x400);
    return false;
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
        case 0x04: this.regs[rd] = u32(this.regs[rt] << (this.regs[rs] & 31)); return;
        case 0x06: this.regs[rd] = this.regs[rt] >>> (this.regs[rs] & 31); return;
        case 0x07: this.regs[rd] = u32(this.regs[rt] >> (this.regs[rs] & 31)); return;
        case 0x08: this.jump(this.regs[rs]); return;
        case 0x09: this.regs[rd || 31] = u32(at + 8); this.jump(this.regs[rs]); return;
        case 0x0c:
          if (!this.syscall) throw new Error(`R3000A syscall at 0x${at.toString(16)}`);
          this.syscall(this, word >>> 6);
          return;
        case 0x0d:
          if (this.breakpoint) this.breakpoint(this, word >>> 6);
          else this.exception(9, at);
          return;
        case 0x10: this.regs[rd] = this.hi; return;
        case 0x11: this.hi = this.regs[rs]; return;
        case 0x12: this.regs[rd] = this.lo; return;
        case 0x13: this.lo = this.regs[rs]; return;
        case 0x18: {
          const value = BigInt(this.regs[rs] | 0) * BigInt(this.regs[rt] | 0);
          this.lo = Number(BigInt.asUintN(32, value));
          this.hi = Number(BigInt.asUintN(32, value >> 32n));
          return;
        }
        case 0x19: {
          const value = BigInt(this.regs[rs]) * BigInt(this.regs[rt]);
          this.lo = Number(BigInt.asUintN(32, value));
          this.hi = Number(BigInt.asUintN(32, value >> 32n));
          return;
        }
        case 0x1a: {
          const left = this.regs[rs] | 0, right = this.regs[rt] | 0;
          if (right === 0) { this.lo = left >= 0 ? 0xffffffff : 1; this.hi = u32(left); }
          else { this.lo = u32(Math.trunc(left / right)); this.hi = u32(left % right); }
          return;
        }
        case 0x1b: {
          const left = this.regs[rs], right = this.regs[rt];
          if (right === 0) { this.lo = 0xffffffff; this.hi = left; }
          else { this.lo = u32(Math.floor(left / right)); this.hi = u32(left % right); }
          return;
        }
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
      case 0x01: {
        const signed = this.regs[rs] | 0;
        const link = rt === 0x10 || rt === 0x11;
        const take = (rt === 0x00 || rt === 0x10) ? signed < 0 : signed >= 0;
        if (![0x00, 0x01, 0x10, 0x11].includes(rt))
          throw new Error(`unimplemented R3000A REGIMM 0x${rt.toString(16)} at 0x${at.toString(16)}`);
        if (link) this.regs[31] = u32(at + 8);
        if (take) this.jump(branch());
        break;
      }
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
      case 0x10: {
        if (rs === 0x00) this.regs[rt] = this.cop0[rd];
        else if (rs === 0x04) this.cop0[rd] = this.regs[rt];
        else if (rs === 0x10 && (word & 0x3f) === 0x10)
          this.cop0[12] = u32((this.cop0[12] & ~0x0f) | ((this.cop0[12] >>> 2) & 0x0f));
        else throw new Error(`unimplemented R3000A COP0 instruction 0x${word.toString(16)} at 0x${at.toString(16)}`);
        break;
      }
      case 0x20: this.regs[rt] = u32(s8(this.memory.u8(this.regs[rs] + s16(imm)))); break;
      case 0x21: this.regs[rt] = u32(s16(this.memory.u16(this.regs[rs] + s16(imm)))); break;
      case 0x22: {
        const address = u32(this.regs[rs] + s16(imm));
        const value = this.memory.u32(address & ~3);
        switch (address & 3) {
          case 0: this.regs[rt] = u32((this.regs[rt] & 0x00ffffff) | (value << 24)); break;
          case 1: this.regs[rt] = u32((this.regs[rt] & 0x0000ffff) | (value << 16)); break;
          case 2: this.regs[rt] = u32((this.regs[rt] & 0x000000ff) | (value << 8)); break;
          case 3: this.regs[rt] = value; break;
        }
        break;
      }
      case 0x23: this.regs[rt] = this.memory.u32(this.regs[rs] + s16(imm)); break;
      case 0x24: this.regs[rt] = this.memory.u8(this.regs[rs] + s16(imm)); break;
      case 0x25: this.regs[rt] = this.memory.u16(this.regs[rs] + s16(imm)); break;
      case 0x26: {
        const address = u32(this.regs[rs] + s16(imm));
        const value = this.memory.u32(address & ~3);
        switch (address & 3) {
          case 0: this.regs[rt] = value; break;
          case 1: this.regs[rt] = u32((this.regs[rt] & 0xff000000) | (value >>> 8)); break;
          case 2: this.regs[rt] = u32((this.regs[rt] & 0xffff0000) | (value >>> 16)); break;
          case 3: this.regs[rt] = u32((this.regs[rt] & 0xffffff00) | (value >>> 24)); break;
        }
        break;
      }
      case 0x28: this.memory.set8(this.regs[rs] + s16(imm), this.regs[rt]); break;
      case 0x29: this.memory.set16(this.regs[rs] + s16(imm), this.regs[rt]); break;
      case 0x2a: {
        const address = u32(this.regs[rs] + s16(imm));
        const aligned = address & ~3, value = this.memory.u32(aligned), source = this.regs[rt];
        switch (address & 3) {
          case 0: this.memory.set32(aligned, (value & 0xffffff00) | (source >>> 24)); break;
          case 1: this.memory.set32(aligned, (value & 0xffff0000) | (source >>> 16)); break;
          case 2: this.memory.set32(aligned, (value & 0xff000000) | (source >>> 8)); break;
          case 3: this.memory.set32(aligned, source); break;
        }
        break;
      }
      case 0x2b: this.memory.set32(this.regs[rs] + s16(imm), this.regs[rt]); break;
      case 0x2e: {
        const address = u32(this.regs[rs] + s16(imm));
        const aligned = address & ~3, value = this.memory.u32(aligned), source = this.regs[rt];
        switch (address & 3) {
          case 0: this.memory.set32(aligned, source); break;
          case 1: this.memory.set32(aligned, u32((value & 0x000000ff) | (source << 8))); break;
          case 2: this.memory.set32(aligned, u32((value & 0x0000ffff) | (source << 16))); break;
          case 3: this.memory.set32(aligned, u32((value & 0x00ffffff) | (source << 24))); break;
        }
        break;
      }
      default: throw new Error(`unimplemented R3000A opcode 0x${op.toString(16)} at 0x${at.toString(16)}`);
    }
  }
}

export function loadPsxExe(bytes, memory = new PsxMemory()) {
  if (bytes.length < 0x800 || new TextDecoder("ascii").decode(bytes.subarray(0, 8)) !== "PS-X EXE")
    throw new Error("not a PS-X EXE");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pc = view.getUint32(0x10, true), globalPointer = view.getUint32(0x14, true);
  const textAddress = view.getUint32(0x18, true);
  const textSize = view.getUint32(0x1c, true), stackAddress = view.getUint32(0x30, true);
  const stackOffset = view.getUint32(0x34, true), stackPointer = u32(stackAddress + stackOffset);
  if (0x800 + textSize > bytes.length) throw new Error("truncated PS-X EXE payload");
  memory.bytes.set(bytes.subarray(0x800, 0x800 + textSize), memory.offset(textAddress, textSize));
  return { memory, pc, globalPointer, textAddress, textSize, stackAddress, stackOffset, stackPointer };
}
