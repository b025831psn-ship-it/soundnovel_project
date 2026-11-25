const C = 0x01;
const Z = 0x02;
const I = 0x04;
const D = 0x08;
const V = 0x40;
const N = 0x80;
const X = 0x10;
const M = 0x20;

const IMPLIED_INTERNAL = new Set([
  0x0a, 0x18, 0x1a, 0x1b, 0x2a, 0x38, 0x3a, 0x3b, 0x4a, 0x58, 0x5b,
  0x6a, 0x78, 0x7b, 0x88, 0x8a, 0x98, 0x9a, 0x9b, 0xa8, 0xaa,
  0xba, 0xc2, 0xc8, 0xca, 0xe2, 0xe8, 0xea, 0xeb, 0xfb,
]);
const PUSH_OPS = new Set([0x08, 0x48, 0x4b, 0x5a, 0x8b, 0x0b, 0xda]);
const PULL_OPS = new Set([0x28, 0x68, 0x7a, 0xab, 0x2b, 0xfa]);
const BRANCH_OPS = new Set([0x10, 0x30, 0x50, 0x70, 0x80, 0x90, 0xb0, 0xd0, 0xf0]);
const INDEXED_DP_OPS = new Set([
  0x15, 0x35, 0x55, 0x75, 0x95, 0xb5, 0xd5, 0xf5,
  0x16, 0x36, 0x56, 0x76, 0x96, 0xb6, 0xd6, 0xf6,
  0x74,
  0x03, 0x23, 0x43, 0x63, 0x83, 0xa3, 0xc3, 0xe3,
]);
const DIRECT_PAGE_OPS = new Set([
  0x01, 0x04, 0x05, 0x06, 0x07, 0x11, 0x12, 0x14, 0x15, 0x16, 0x17,
  0x21, 0x24, 0x25, 0x26, 0x27, 0x31, 0x32, 0x34, 0x35, 0x36, 0x37,
  0x41, 0x45, 0x46, 0x47, 0x51, 0x52, 0x55, 0x56, 0x57,
  0x61, 0x64, 0x65, 0x66, 0x67, 0x71, 0x72, 0x74, 0x75, 0x76, 0x77,
  0x81, 0x84, 0x85, 0x86, 0x87, 0x91, 0x92, 0x94, 0x95, 0x96, 0x97,
  0xa1, 0xa4, 0xa5, 0xa6, 0xa7, 0xb1, 0xb2, 0xb4, 0xb5, 0xb6, 0xb7,
  0xc1, 0xc4, 0xc5, 0xc6, 0xc7, 0xd1, 0xd2, 0xd4, 0xd5, 0xd6, 0xd7,
  0xe1, 0xe4, 0xe5, 0xe6, 0xe7, 0xf1, 0xf2, 0xf5, 0xf6, 0xf7,
]);
// Absolute indexed stores pay a dummy cycle. Long indexed ($9F) already has
// the extra address byte as its fifth CPU cycle and has no additional penalty.
const INDEXED_STORE_OPS = new Set([0x99, 0x9d, 0x9e]);
const ABSOLUTE_X_READ_OPS = new Set([0x1d, 0x3d, 0x5d, 0x7d, 0xbc, 0xbd, 0xdd, 0xfd]);
const ABSOLUTE_Y_READ_OPS = new Set([0x19, 0x39, 0x59, 0x79, 0xb9, 0xbb, 0xd9, 0xf9]);
const RMW_OPS = new Set([
  0x04, 0x06, 0x0c, 0x14, 0x16, 0x1c, 0x26, 0x2e, 0x46, 0x66,
  0xc6, 0xce, 0xd6, 0xe6, 0xee, 0xf6,
]);

const hex = (n, width) => n.toString(16).toUpperCase().padStart(width, '0');

export class Cpu65816 {
  constructor(bus, { traceLimit = Infinity } = {}) {
    this.rawBus = bus;
    const cpu = this;
    this.bus = new Proxy(bus, {
      get(target, property) {
        if (property === 'read8') return (address) => cpu.read8(address);
        if (property === 'read16') return (address) => cpu.read16(address);
        if (property === 'write8') return (address, value) => cpu.write8(address, value);
        if (property === 'write16') return (address, value) => cpu.write16(address, value);
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    this.trace = [];
    this.traceLimit = traceLimit;
    this.executed = 0;
    this.reset();
  }

  reset() {
    this.a = this.x = this.y = this.d = this.dbr = 0;
    this.s = 0x01ff;
    this.p = 0x34;
    this.e = true;
    this.pbr = 0;
    // Snes9x starts at 182 master clocks just after the hardware reset-vector jump.
    this.masterCycle = 182;
    this.nextWramRefresh = 538;
    this.busTransactions = 0;
    this.pc = this.rawBus.read16(0x00fffc);
  }

  memorySpeed(address) {
    address &= 0xffffff;
    if (address & 0x408000) {
      if (address & 0x800000)
        return this.rawBus.io?.[0x420d - 0x2000] & 1 ? 6 : 8;
      return 8;
    }
    if ((address + 0x6000) & 0x4000) return 8;
    if ((address - 0x4000) & 0x7e00) return 6;
    return 12;
  }

  read8(address) {
    address &= 0xffffff;
    const value = this.rawBus.read8(address, this.masterCycle);
    this.advanceMaster(this.memorySpeed(address));
    this.busTransactions++;
    return value;
  }

  read16(address) {
    const low = this.read8(address);
    return low | (this.read8((address + 1) & 0xffffff) << 8);
  }

  write8(address, value) {
    address &= 0xffffff;
    this.rawBus.write8(address, value, this.masterCycle);
    this.advanceMaster(this.rawBus.takeDmaMasterCycles?.() ?? 0);
    this.advanceMaster(this.memorySpeed(address));
    this.busTransactions++;
  }

  write16(address, value) {
    this.write8(address, value);
    this.write8((address + 1) & 0xffffff, value >>> 8);
  }

  advanceMaster(cycles) {
    let target = this.masterCycle + cycles;
    while (this.nextWramRefresh <= target) {
      target += 40;
      this.nextWramRefresh += 1364;
    }
    this.masterCycle = target;
  }

  internalCycle(count = 1) { this.advanceMaster(count * 6); }

  finishInstructionTiming(opcode, at, startTransactions) {
    if (IMPLIED_INTERNAL.has(opcode)) this.internalCycle();

    if (PUSH_OPS.has(opcode)) this.internalCycle();
    if (PULL_OPS.has(opcode)) this.internalCycle(2);
    if (opcode === 0x20 || opcode === 0x22) this.internalCycle();
    if (opcode === 0x7c || opcode === 0xfc) this.internalCycle();
    if (opcode === 0x60) this.internalCycle(3);
    if (opcode === 0x6b) this.internalCycle(2);
    if (opcode === 0x40) this.internalCycle(2);

    if (BRANCH_OPS.has(opcode)) {
      const fallthrough = (at & 0xff0000) | ((at + 2) & 0xffff);
      if (this.address() !== fallthrough) this.internalCycle();
    }
    if (opcode === 0x82) this.internalCycle();
    if (opcode === 0xeb) this.internalCycle();

    if (INDEXED_DP_OPS.has(opcode)) this.internalCycle();
    if (DIRECT_PAGE_OPS.has(opcode) && (this.d & 0xff)) this.internalCycle();

    if (INDEXED_STORE_OPS.has(opcode)) this.internalCycle();
    if (opcode === 0xb1 && !this.x8()) this.internalCycle();
    if (ABSOLUTE_X_READ_OPS.has(opcode) || ABSOLUTE_Y_READ_OPS.has(opcode)) {
      const low = this.rawBus.read8((at + 1) & 0xffffff);
      const high = this.rawBus.read8((at + 2) & 0xffffff);
      const base = low | (high << 8);
      const index = ABSOLUTE_X_READ_OPS.has(opcode) ? this.x : this.y;
      if (!this.x8() || (base & 0xff) + (index & 0xff) > 0xff) this.internalCycle();
    }
    if (RMW_OPS.has(opcode)) this.internalCycle();

    this.lastInstructionTransactions = this.busTransactions - startTransactions;
  }

  interrupt(vector) {
    if (!this.e) this.push8(this.pbr);
    this.push8(this.pc >>> 8);
    this.push8(this.pc);
    this.push8(this.p);
    this.p |= I;
    this.p &= ~D;
    this.pbr = 0;
    this.pc = this.bus.read16(vector);
  }

  nmi() {
    this.bus.latchControllers?.();
    this.bus.latchNmi?.();
    this.interrupt(this.e ? 0x00fffa : 0x00ffea);
    this.internalCycle(2);
  }

  address() { return (this.pbr << 16) | this.pc; }
  fetch8() { const v = this.bus.read8(this.address()); this.pc = (this.pc + 1) & 0xffff; return v; }
  fetch16() { const lo = this.fetch8(); return lo | (this.fetch8() << 8); }
  fetch24() { const lo = this.fetch16(); return lo | (this.fetch8() << 16); }
  a8() { return this.e || !!(this.p & M); }
  x8() { return this.e || !!(this.p & X); }
  setNZ(value, eightBit) {
    const mask = eightBit ? 0xff : 0xffff;
    const sign = eightBit ? 0x80 : 0x8000;
    value &= mask;
    this.p = value === 0 ? this.p | Z : this.p & ~Z;
    this.p = value & sign ? this.p | N : this.p & ~N;
    return value;
  }
  push8(v) { this.bus.write8(this.s, v); this.s = this.e ? 0x0100 | ((this.s - 1) & 0xff) : (this.s - 1) & 0xffff; }
  pull8() { this.s = this.e ? 0x0100 | ((this.s + 1) & 0xff) : (this.s + 1) & 0xffff; return this.bus.read8(this.s); }
  pull16() { const lo = this.pull8(); return lo | (this.pull8() << 8); }

  step() {
    const at = this.address();
    const startTransactions = this.busTransactions;
    const op = this.fetch8();
    let name;
    switch (op) {
      case 0x00: {
        name = 'BRK';
        this.fetch8(); // signature byte; dispatcher reads it from the return PC
        if (!this.e) this.push8(this.pbr);
        this.push8(this.pc >>> 8);
        this.push8(this.pc);
        this.push8(this.p);
        this.p |= I;
        this.p &= ~D;
        this.pbr = 0;
        this.pc = this.bus.read16(this.e ? 0x00fffe : 0x00ffe6);
        break;
      }
      case 0x02: {
        name = 'COP';
        this.fetch8();
        if (!this.e) this.push8(this.pbr);
        this.push8(this.pc >>> 8);
        this.push8(this.pc);
        this.push8(this.p);
        this.p |= I;
        this.p &= ~D;
        this.pbr = 0;
        this.pc = this.bus.read16(this.e ? 0x00fff4 : 0x00ffe4);
        break;
      }
      case 0x18: name = 'CLC'; this.p &= ~C; break;
      case 0x38: name = 'SEC'; this.p |= C; break;
      case 0x78: name = 'SEI'; this.p |= I; break;
      case 0x58: name = 'CLI'; this.p &= ~I; break;
      case 0xea: name = 'NOP'; break;
      case 0xfb: {
        name = 'XCE';
        const carry = !!(this.p & C);
        this.p = (this.p & ~C) | (this.e ? C : 0);
        this.e = carry;
        if (this.e) { this.p |= M | X; this.s = 0x0100 | (this.s & 0xff); }
        break;
      }
      case 0xeb:
        name = 'XBA';
        this.a = ((this.a & 0xff) << 8) | (this.a >>> 8);
        this.setNZ(this.a & 0xff, true);
        break;
      case 0xa9: {
        name = 'LDA #';
        const v = this.a8() ? this.fetch8() : this.fetch16();
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(v, true) : this.setNZ(v, false);
        break;
      }
      case 0x8d: { name = 'STA abs'; const a = this.fetch16(); this.a8() ? this.bus.write8(a, this.a) : this.bus.write16(a, this.a); break; }
      case 0x9d: {
        name = 'STA abs,X';
        const address = (this.fetch16() + this.x) & 0xffff;
        this.a8()
          ? this.bus.write8((this.dbr << 16) | address, this.a)
          : this.bus.write16((this.dbr << 16) | address, this.a);
        break;
      }
      case 0x99: {
        name = 'STA abs,Y';
        const address = (this.fetch16() + this.y) & 0xffff;
        this.a8()
          ? this.bus.write8((this.dbr << 16) | address, this.a)
          : this.bus.write16((this.dbr << 16) | address, this.a);
        break;
      }
      case 0x8f: {
        name = 'STA long';
        const address = this.fetch24();
        this.a8() ? this.bus.write8(address, this.a) : this.bus.write16(address, this.a);
        break;
      }
      case 0x9f: {
        name = 'STA long,X';
        const address = (this.fetch24() + this.x) & 0xffffff;
        this.a8() ? this.bus.write8(address, this.a) : this.bus.write16(address, this.a);
        break;
      }
      case 0x97: {
        name = 'STA [dp],Y';
        const pointer = (this.d + this.fetch8()) & 0xffff;
        const base = this.bus.read16(pointer) | (this.bus.read8((pointer + 2) & 0xffff) << 16);
        const address = (base + this.y) & 0xffffff;
        this.a8() ? this.bus.write8(address, this.a) : this.bus.write16(address, this.a);
        break;
      }
      case 0x85: {
        name = 'STA dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        this.a8() ? this.bus.write8(address, this.a) : this.bus.write16(address, this.a);
        break;
      }
      case 0x83: {
        name = 'STA sr,S';
        const address = (this.s + this.fetch8()) & 0xffff;
        this.a8() ? this.bus.write8(address, this.a) : this.bus.write16(address, this.a);
        break;
      }
      case 0x81: {
        name = 'STA (dp,X)';
        const pointer = (this.d + this.fetch8() + this.x) & 0xffff;
        const address = (this.dbr << 16) | this.bus.read16(pointer);
        this.a8() ? this.bus.write8(address, this.a) : this.bus.write16(address, this.a);
        break;
      }
      case 0x86: {
        name = 'STX dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        this.x8() ? this.bus.write8(address, this.x) : this.bus.write16(address, this.x);
        break;
      }
      case 0x96: {
        name = 'STX dp,Y';
        const address = (this.d + this.fetch8() + this.y) & 0xffff;
        this.x8() ? this.bus.write8(address, this.x) : this.bus.write16(address, this.x);
        break;
      }
      case 0x84: {
        name = 'STY dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        this.x8() ? this.bus.write8(address, this.y) : this.bus.write16(address, this.y);
        break;
      }
      case 0x94: {
        name = 'STY dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        this.x8() ? this.bus.write8(address, this.y) : this.bus.write16(address, this.y);
        break;
      }
      case 0x95: {
        name = 'STA dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        this.a8() ? this.bus.write8(address, this.a) : this.bus.write16(address, this.a);
        break;
      }
      case 0x74: {
        name = 'STZ dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        this.a8() ? this.bus.write8(address, 0) : this.bus.write16(address, 0);
        break;
      }
      case 0x64: {
        name = 'STZ dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        this.a8() ? this.bus.write8(address, 0) : this.bus.write16(address, 0);
        break;
      }
      case 0xe6: {
        name = 'INC dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.a8()
          ? this.setNZ(this.bus.read8(address) + 1, true)
          : this.setNZ(this.bus.read16(address) + 1, false);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0xc6: {
        name = 'DEC dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.a8()
          ? this.setNZ(this.bus.read8(address) - 1, true)
          : this.setNZ(this.bus.read16(address) - 1, false);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0xd6: {
        name = 'DEC dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const value = this.a8()
          ? this.setNZ(this.bus.read8(address) - 1, true)
          : this.setNZ(this.bus.read16(address) - 1, false);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0xee: {
        name = 'INC abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.a8()
          ? this.setNZ(this.bus.read8(address) + 1, true)
          : this.setNZ(this.bus.read16(address) + 1, false);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0xf6: {
        name = 'INC dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const value = this.a8()
          ? this.setNZ(this.bus.read8(address) + 1, true)
          : this.setNZ(this.bus.read16(address) + 1, false);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0xce: {
        name = 'DEC abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.a8()
          ? this.setNZ(this.bus.read8(address) - 1, true)
          : this.setNZ(this.bus.read16(address) - 1, false);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x8e: { name = 'STX abs'; const a = this.fetch16(); this.x8() ? this.bus.write8(a, this.x) : this.bus.write16(a, this.x); break; }
      case 0x8c: { name = 'STY abs'; const a = this.fetch16(); this.x8() ? this.bus.write8(a, this.y) : this.bus.write16(a, this.y); break; }
      case 0x9c: { name = 'STZ abs'; const a = this.fetch16(); this.a8() ? this.bus.write8(a, 0) : this.bus.write16(a, 0); break; }
      case 0x9e: {
        name = 'STZ abs,X';
        const address = (this.fetch16() + this.x) & 0xffff;
        this.a8()
          ? this.bus.write8((this.dbr << 16) | address, 0)
          : this.bus.write16((this.dbr << 16) | address, 0);
        break;
      }
      case 0xc2: name = 'REP'; this.p &= ~this.fetch8(); break;
      case 0xe2: name = 'SEP'; this.p |= this.fetch8(); if (this.p & X) { this.x &= 0xff; this.y &= 0xff; } break;
      case 0x1b: name = 'TCS'; this.s = this.a; break;
      case 0x3b: name = 'TSC'; this.a = this.setNZ(this.s, false); break;
      case 0xaa: name = 'TAX'; this.x = this.setNZ(this.a, this.x8()); break;
      case 0xa8: name = 'TAY'; this.y = this.setNZ(this.a, this.x8()); break;
      case 0x98: {
        name = 'TYA';
        const value = this.setNZ(this.y, this.a8());
        this.a = this.a8() ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x8a: {
        name = 'TXA';
        const value = this.setNZ(this.x, this.a8());
        this.a = this.a8() ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x9b: name = 'TXY'; this.y = this.setNZ(this.x, this.x8()); break;
      case 0xbb: name = 'TYX'; this.x = this.setNZ(this.y, this.x8()); break;
      case 0x5b: name = 'TCD'; this.d = this.a; break;
      case 0x7b: name = 'TDC'; this.a = this.setNZ(this.d, false); break;
      case 0xf4: { name = 'PEA'; const v = this.fetch16(); this.push8(v >>> 8); this.push8(v); break; }
      case 0x62: {
        name = 'PER';
        const displacement = (this.fetch16() << 16) >> 16;
        const value = (this.pc + displacement) & 0xffff;
        this.push8(value >>> 8);
        this.push8(value);
        break;
      }
      case 0x48:
        name = 'PHA';
        if (!this.a8()) this.push8(this.a >>> 8);
        this.push8(this.a);
        break;
      case 0x08: name = 'PHP'; this.push8(this.p); break;
      case 0x28:
        name = 'PLP';
        this.p = this.pull8();
        if (this.e) this.p |= M | X;
        if (this.x8()) { this.x &= 0xff; this.y &= 0xff; }
        break;
      case 0xda:
        name = 'PHX';
        if (!this.x8()) this.push8(this.x >>> 8);
        this.push8(this.x);
        break;
      case 0x5a:
        name = 'PHY';
        if (!this.x8()) this.push8(this.y >>> 8);
        this.push8(this.y);
        break;
      case 0x0b: name = 'PHD'; this.push8(this.d >>> 8); this.push8(this.d); break;
      case 0x8b: name = 'PHB'; this.push8(this.dbr); break;
      case 0x4b: name = 'PHK'; this.push8(this.pbr); break;
      case 0xab: name = 'PLB'; this.dbr = this.pull8(); break;
      case 0x2b: name = 'PLD'; this.d = this.setNZ(this.pull16(), false); break;
      case 0x7a: name = 'PLY'; this.y = this.setNZ(this.x8() ? this.pull8() : this.pull16(), this.x8()); break;
      case 0xfa: name = 'PLX'; this.x = this.setNZ(this.x8() ? this.pull8() : this.pull16(), this.x8()); break;
      case 0x68: {
        name = 'PLA';
        const value = this.a8() ? this.pull8() : this.pull16();
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0x40:
        name = 'RTI';
        this.p = this.pull8();
        this.pc = this.pull16();
        if (!this.e) this.pbr = this.pull8();
        if (this.e) this.p |= M | X;
        if (this.x8()) { this.x &= 0xff; this.y &= 0xff; }
        break;
      case 0xa2: name = 'LDX #'; this.x = this.setNZ(this.x8() ? this.fetch8() : this.fetch16(), this.x8()); break;
      case 0xa0: name = 'LDY #'; this.y = this.setNZ(this.x8() ? this.fetch8() : this.fetch16(), this.x8()); break;
      case 0xa6: {
        name = 'LDX dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        this.x = this.setNZ(this.x8() ? this.bus.read8(address) : this.bus.read16(address), this.x8());
        break;
      }
      case 0xa4: {
        name = 'LDY dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.x8() ? this.bus.read8(address) : this.bus.read16(address);
        this.y = this.setNZ(value, this.x8());
        break;
      }
      case 0xac: {
        name = 'LDY abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.x8() ? this.bus.read8(address) : this.bus.read16(address);
        this.y = this.setNZ(value, this.x8());
        break;
      }
      case 0xae: {
        name = 'LDX abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.x8() ? this.bus.read8(address) : this.bus.read16(address);
        this.x = this.setNZ(value, this.x8());
        break;
      }
      case 0xb6: {
        name = 'LDX dp,Y';
        const address = (this.d + this.fetch8() + this.y) & 0xffff;
        const value = this.x8() ? this.bus.read8(address) : this.bus.read16(address);
        this.x = this.setNZ(value, this.x8());
        break;
      }
      case 0xb4: {
        name = 'LDY dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const value = this.x8() ? this.bus.read8(address) : this.bus.read16(address);
        this.y = this.setNZ(value, this.x8());
        break;
      }
      case 0xa5: {
        name = 'LDA dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xa3: {
        name = 'LDA sr,S';
        const address = (this.s + this.fetch8()) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xb3: {
        name = 'LDA (sr,S),Y';
        const pointer = (this.s + this.fetch8()) & 0xffff;
        const address = (this.dbr << 16) | ((this.bus.read16(pointer) + this.y) & 0xffff);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xb5: {
        name = 'LDA dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xa7: {
        name = 'LDA [dp]';
        const pointer = (this.d + this.fetch8()) & 0xffff;
        const address = this.bus.read16(pointer) | (this.bus.read8((pointer + 2) & 0xffff) << 16);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xb7: {
        name = 'LDA [dp],Y';
        const pointer = (this.d + this.fetch8()) & 0xffff;
        const base = this.bus.read16(pointer) | (this.bus.read8((pointer + 2) & 0xffff) << 16);
        const address = (base + this.y) & 0xffffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xb2: {
        name = 'LDA (dp)';
        const pointer = (this.d + this.fetch8()) & 0xffff;
        const address = (this.dbr << 16) | this.bus.read16(pointer);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xb1: {
        name = 'LDA (dp),Y';
        const pointer = (this.d + this.fetch8()) & 0xffff;
        const address = (this.dbr << 16) | ((this.bus.read16(pointer) + this.y) & 0xffff);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0x35: {
        name = 'AND dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a & value, true)
          : this.setNZ(this.a & value, false);
        break;
      }
      case 0x23: {
        name = 'AND sr,S';
        const address = (this.s + this.fetch8()) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a & value, true)
          : this.setNZ(this.a & value, false);
        break;
      }
      case 0x25: {
        name = 'AND dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a & value, true)
          : this.setNZ(this.a & value, false);
        break;
      }
      case 0x2d: {
        name = 'AND abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a & value, true)
          : this.setNZ(this.a & value, false);
        break;
      }
      case 0x3d: {
        name = 'AND abs,X';
        const address = (this.dbr << 16) | ((this.fetch16() + this.x) & 0xffff);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a & value, true)
          : this.setNZ(this.a & value, false);
        break;
      }
      case 0x29: {
        name = 'AND #';
        const value = this.a8() ? this.fetch8() : this.fetch16();
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a & value, true)
          : this.setNZ(this.a & value, false);
        break;
      }
      case 0x09: {
        name = 'ORA #';
        const value = this.a8() ? this.fetch8() : this.fetch16();
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a | value, true)
          : this.setNZ(this.a | value, false);
        break;
      }
      case 0x0d: {
        name = 'ORA abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a | value, true)
          : this.setNZ(this.a | value, false);
        break;
      }
      case 0x1d: {
        name = 'ORA abs,X';
        const address = (this.dbr << 16) | ((this.fetch16() + this.x) & 0xffff);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a | value, true)
          : this.setNZ(this.a | value, false);
        break;
      }
      case 0x19: {
        name = 'ORA abs,Y';
        const address = (this.dbr << 16) | ((this.fetch16() + this.y) & 0xffff);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a | value, true)
          : this.setNZ(this.a | value, false);
        break;
      }
      case 0x0f: {
        name = 'ORA long';
        const address = this.fetch24();
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a | value, true)
          : this.setNZ(this.a | value, false);
        break;
      }
      case 0x03: {
        name = 'ORA sr,S';
        const address = (this.s + this.fetch8()) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a | value, true)
          : this.setNZ(this.a | value, false);
        break;
      }
      case 0x01: {
        name = 'ORA (dp,X)';
        const pointer = (this.d + this.fetch8() + this.x) & 0xffff;
        const address = (this.dbr << 16) | this.bus.read16(pointer);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a | value, true)
          : this.setNZ(this.a | value, false);
        break;
      }
      case 0x05: {
        name = 'ORA dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a | value, true)
          : this.setNZ(this.a | value, false);
        break;
      }
      case 0x15: {
        name = 'ORA dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a | value, true)
          : this.setNZ(this.a | value, false);
        break;
      }
      case 0x49: {
        name = 'EOR #';
        const value = this.a8() ? this.fetch8() : this.fetch16();
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a ^ value, true)
          : this.setNZ(this.a ^ value, false);
        break;
      }
      case 0x89: {
        name = 'BIT #';
        const value = this.a8() ? this.fetch8() : this.fetch16();
        const mask = this.a8() ? 0xff : 0xffff;
        this.p = (this.a & value & mask) === 0 ? this.p | Z : this.p & ~Z;
        break;
      }
      case 0x2c: {
        name = 'BIT abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.a8() ? 0xff : 0xffff;
        const sign = this.a8() ? 0x80 : 0x8000;
        const overflow = this.a8() ? 0x40 : 0x4000;
        this.p = (this.a & value & mask) === 0 ? this.p | Z : this.p & ~Z;
        this.p = value & sign ? this.p | N : this.p & ~N;
        this.p = value & overflow ? this.p | V : this.p & ~V;
        break;
      }
      case 0x24: {
        name = 'BIT dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.a8() ? 0xff : 0xffff;
        const sign = this.a8() ? 0x80 : 0x8000;
        const overflow = this.a8() ? 0x40 : 0x4000;
        this.p = (this.a & value & mask) === 0 ? this.p | Z : this.p & ~Z;
        this.p = value & sign ? this.p | N : this.p & ~N;
        this.p = value & overflow ? this.p | V : this.p & ~V;
        break;
      }
      case 0x55: {
        name = 'EOR dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a ^ value, true)
          : this.setNZ(this.a ^ value, false);
        break;
      }
      case 0x5d: {
        name = 'EOR abs,X';
        const address = (this.dbr << 16) | ((this.fetch16() + this.x) & 0xffff);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a ^ value, true)
          : this.setNZ(this.a ^ value, false);
        break;
      }
      case 0x4d: {
        name = 'EOR abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ(this.a ^ value, true)
          : this.setNZ(this.a ^ value, false);
        break;
      }
      case 0xbd: {
        name = 'LDA abs,X';
        const address = (this.fetch16() + this.x) & 0xffff;
        const value = this.a8()
          ? this.bus.read8((this.dbr << 16) | address)
          : this.bus.read16((this.dbr << 16) | address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xb9: {
        name = 'LDA abs,Y';
        const address = (this.fetch16() + this.y) & 0xffff;
        const value = this.a8()
          ? this.bus.read8((this.dbr << 16) | address)
          : this.bus.read16((this.dbr << 16) | address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xad: {
        name = 'LDA abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xaf: {
        name = 'LDA long';
        const address = this.fetch24();
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xbf: {
        name = 'LDA long,X';
        const address = (this.fetch24() + this.x) & 0xffffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8() ? (this.a & 0xff00) | this.setNZ(value, true) : this.setNZ(value, false);
        break;
      }
      case 0xbc: {
        name = 'LDY abs,X';
        const address = (this.fetch16() + this.x) & 0xffff;
        const value = this.x8()
          ? this.bus.read8((this.dbr << 16) | address)
          : this.bus.read16((this.dbr << 16) | address);
        this.y = this.setNZ(value, this.x8());
        break;
      }
      case 0xbe: {
        name = 'LDX abs,Y';
        const address = (this.fetch16() + this.y) & 0xffff;
        const value = this.x8()
          ? this.bus.read8((this.dbr << 16) | address)
          : this.bus.read16((this.dbr << 16) | address);
        this.x = this.setNZ(value, this.x8());
        break;
      }
      case 0x4f: {
        name = 'EOR long';
        const address = this.fetch24();
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.a = this.a8()
          ? (this.a & 0xff00) | this.setNZ((this.a ^ value) & 0xff, true)
          : this.setNZ(this.a ^ value, false);
        break;
      }
      case 0xdd: {
        name = 'CMP abs,X';
        const address = (this.fetch16() + this.x) & 0xffff;
        const value = this.a8()
          ? this.bus.read8((this.dbr << 16) | address)
          : this.bus.read16((this.dbr << 16) | address);
        const mask = this.a8() ? 0xff : 0xffff;
        const left = this.a & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.a8());
        break;
      }
      case 0xcd: {
        name = 'CMP abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.a8() ? 0xff : 0xffff;
        const left = this.a & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.a8());
        break;
      }
      case 0xc5: {
        name = 'CMP dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.a8() ? 0xff : 0xffff;
        const left = this.a & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.a8());
        break;
      }
      case 0xd2: {
        name = 'CMP (dp)';
        const pointer = (this.d + this.fetch8()) & 0xffff;
        const address = (this.dbr << 16) | this.bus.read16(pointer);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.a8() ? 0xff : 0xffff;
        const left = this.a & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.a8());
        break;
      }
      case 0xc1: {
        name = 'CMP (dp,X)';
        const pointer = (this.d + this.fetch8() + this.x) & 0xffff;
        const address = (this.dbr << 16) | this.bus.read16(pointer);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.a8() ? 0xff : 0xffff;
        const left = this.a & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.a8());
        break;
      }
      case 0xd5: {
        name = 'CMP dp,X';
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.a8() ? 0xff : 0xffff;
        const left = this.a & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.a8());
        break;
      }
      case 0xdf: {
        name = 'CMP long,X';
        const address = (this.fetch24() + this.x) & 0xffffff;
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.a8() ? 0xff : 0xffff;
        const left = this.a & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.a8());
        break;
      }
      case 0xd9: {
        name = 'CMP abs,Y';
        const address = (this.dbr << 16) | ((this.fetch16() + this.y) & 0xffff);
        const value = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.a8() ? 0xff : 0xffff;
        const left = this.a & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.a8());
        break;
      }
      case 0xc9: {
        name = 'CMP #';
        const value = this.a8() ? this.fetch8() : this.fetch16();
        const mask = this.a8() ? 0xff : 0xffff;
        const left = this.a & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.a8());
        break;
      }
      case 0xc0: {
        name = 'CPY #';
        const value = this.x8() ? this.fetch8() : this.fetch16();
        const mask = this.x8() ? 0xff : 0xffff;
        const left = this.y & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.x8());
        break;
      }
      case 0xcc: {
        name = 'CPY abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.x8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.x8() ? 0xff : 0xffff;
        const left = this.y & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.x8());
        break;
      }
      case 0xc4: {
        name = 'CPY dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.x8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.x8() ? 0xff : 0xffff;
        const left = this.y & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.x8());
        break;
      }
      case 0xe0: {
        name = 'CPX #';
        const value = this.x8() ? this.fetch8() : this.fetch16();
        const mask = this.x8() ? 0xff : 0xffff;
        const left = this.x & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.x8());
        break;
      }
      case 0xe4: {
        name = 'CPX dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const value = this.x8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.x8() ? 0xff : 0xffff;
        const left = this.x & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.x8());
        break;
      }
      case 0xec: {
        name = 'CPX abs';
        const address = (this.dbr << 16) | this.fetch16();
        const value = this.x8() ? this.bus.read8(address) : this.bus.read16(address);
        const mask = this.x8() ? 0xff : 0xffff;
        const left = this.x & mask;
        this.p = left >= value ? this.p | C : this.p & ~C;
        this.setNZ((left - value) & mask, this.x8());
        break;
      }
      case 0xd0: {
        name = 'BNE';
        const displacement = (this.fetch8() << 24) >> 24;
        if (!(this.p & Z)) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0xf0: {
        name = 'BEQ';
        const displacement = (this.fetch8() << 24) >> 24;
        if (this.p & Z) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x82: {
        name = 'BRL';
        const displacement = (this.fetch16() << 16) >> 16;
        this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x80: {
        name = 'BRA';
        const displacement = (this.fetch8() << 24) >> 24;
        this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x5c: {
        name = 'JML';
        const target = this.fetch24();
        this.pbr = target >>> 16;
        this.pc = target & 0xffff;
        break;
      }
      case 0x4c: name = 'JMP'; this.pc = this.fetch16(); break;
      case 0x6c: {
        name = 'JMP (abs)';
        const pointer = this.fetch16();
        this.pc = this.bus.read16(pointer);
        break;
      }
      case 0x7c: {
        name = 'JMP (abs,X)';
        const pointer = (this.fetch16() + this.x) & 0xffff;
        this.pc = this.bus.read16((this.pbr << 16) | pointer);
        break;
      }
      case 0x22: {
        name = 'JSL';
        const target = this.fetch24();
        const returnAddress = (this.pc - 1) & 0xffff;
        this.push8(this.pbr);
        this.push8(returnAddress >>> 8);
        this.push8(returnAddress);
        this.pbr = target >>> 16;
        this.pc = target & 0xffff;
        break;
      }
      case 0x20: {
        name = 'JSR';
        const target = this.fetch16();
        const returnAddress = (this.pc - 1) & 0xffff;
        this.push8(returnAddress >>> 8);
        this.push8(returnAddress);
        this.pc = target;
        break;
      }
      case 0xfc: {
        name = 'JSR (abs,X)';
        const pointer = (this.fetch16() + this.x) & 0xffff;
        const target = this.bus.read16((this.pbr << 16) | pointer);
        const returnAddress = (this.pc - 1) & 0xffff;
        this.push8(returnAddress >>> 8);
        this.push8(returnAddress);
        this.pc = target;
        break;
      }
      case 0x6b:
        name = 'RTL';
        this.pc = (this.pull16() + 1) & 0xffff;
        this.pbr = this.pull8();
        break;
      case 0x60: name = 'RTS'; this.pc = (this.pull16() + 1) & 0xffff; break;
      case 0x10: {
        name = 'BPL';
        const displacement = (this.fetch8() << 24) >> 24;
        if (!(this.p & N)) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x30: {
        name = 'BMI';
        const displacement = (this.fetch8() << 24) >> 24;
        if (this.p & N) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0xb0: {
        name = 'BCS';
        const displacement = (this.fetch8() << 24) >> 24;
        if (this.p & C) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x90: {
        name = 'BCC';
        const displacement = (this.fetch8() << 24) >> 24;
        if (!(this.p & C)) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x70: {
        name = 'BVS';
        const displacement = (this.fetch8() << 24) >> 24;
        if (this.p & V) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x50: {
        name = 'BVC';
        const displacement = (this.fetch8() << 24) >> 24;
        if (!(this.p & V)) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x69: {
        name = 'ADC #';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const left = this.a & mask;
        const right = eight ? this.fetch8() : this.fetch16();
        const result = left + right + (this.p & C ? 1 : 0);
        this.p = result > mask ? this.p | C : this.p & ~C;
        this.p = (~(left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x65: {
        name = 'ADC dp';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.d + this.fetch8()) & 0xffff;
        const left = this.a & mask;
        const right = eight ? this.bus.read8(address) : this.bus.read16(address);
        const result = left + right + (this.p & C ? 1 : 0);
        this.p = result > mask ? this.p | C : this.p & ~C;
        this.p = (~(left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x75: {
        name = 'ADC dp,X';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const left = this.a & mask;
        const right = eight ? this.bus.read8(address) : this.bus.read16(address);
        const result = left + right + (this.p & C ? 1 : 0);
        this.p = result > mask ? this.p | C : this.p & ~C;
        this.p = (~(left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x63: {
        name = 'ADC sr,S';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.s + this.fetch8()) & 0xffff;
        const left = this.a & mask;
        const right = eight ? this.bus.read8(address) : this.bus.read16(address);
        const result = left + right + (this.p & C ? 1 : 0);
        this.p = result > mask ? this.p | C : this.p & ~C;
        this.p = (~(left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x7f: {
        name = 'ADC long,X';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.fetch24() + this.x) & 0xffffff;
        const left = this.a & mask;
        const right = eight ? this.bus.read8(address) : this.bus.read16(address);
        const result = left + right + (this.p & C ? 1 : 0);
        this.p = result > mask ? this.p | C : this.p & ~C;
        this.p = (~(left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0xe9: {
        name = 'SBC #';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const left = this.a & mask;
        const right = eight ? this.fetch8() : this.fetch16();
        const result = left - right - (this.p & C ? 0 : 1);
        this.p = result >= 0 ? this.p | C : this.p & ~C;
        this.p = ((left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0xf5: {
        name = 'SBC dp,X';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const left = this.a & mask;
        const right = eight ? this.bus.read8(address) : this.bus.read16(address);
        const result = left - right - (this.p & C ? 0 : 1);
        this.p = result >= 0 ? this.p | C : this.p & ~C;
        this.p = ((left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0xe5: {
        name = 'SBC dp';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.d + this.fetch8()) & 0xffff;
        const left = this.a & mask;
        const right = eight ? this.bus.read8(address) : this.bus.read16(address);
        const result = left - right - (this.p & C ? 0 : 1);
        this.p = result >= 0 ? this.p | C : this.p & ~C;
        this.p = ((left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0xe7: {
        name = 'SBC [dp]';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const pointer = (this.d + this.fetch8()) & 0xffff;
        const address = this.bus.read16(pointer)
          | (this.bus.read8((pointer + 2) & 0xffff) << 16);
        const left = this.a & mask;
        const right = eight ? this.bus.read8(address) : this.bus.read16(address);
        const result = left - right - (this.p & C ? 0 : 1);
        this.p = result >= 0 ? this.p | C : this.p & ~C;
        this.p = ((left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0xff: {
        name = 'SBC long,X';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.fetch24() + this.x) & 0xffffff;
        const left = this.a & mask;
        const right = eight ? this.bus.read8(address) : this.bus.read16(address);
        const result = left - right - (this.p & C ? 0 : 1);
        this.p = result >= 0 ? this.p | C : this.p & ~C;
        this.p = ((left ^ right) & (left ^ result) & sign) ? this.p | V : this.p & ~V;
        const value = this.setNZ(result, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x0a: {
        name = 'ASL A';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        this.p = this.a & sign ? this.p | C : this.p & ~C;
        const value = this.setNZ((this.a << 1) & mask, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x16: {
        name = 'ASL dp,X';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.d + this.fetch8() + this.x) & 0xffff;
        const memory = eight ? this.bus.read8(address) : this.bus.read16(address);
        this.p = memory & sign ? this.p | C : this.p & ~C;
        const value = this.setNZ((memory << 1) & mask, eight);
        eight ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x06: {
        name = 'ASL dp';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.d + this.fetch8()) & 0xffff;
        const memory = eight ? this.bus.read8(address) : this.bus.read16(address);
        this.p = memory & sign ? this.p | C : this.p & ~C;
        const value = this.setNZ((memory << 1) & mask, eight);
        eight ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x2a: {
        name = 'ROL A';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const carry = this.p & C ? 1 : 0;
        this.p = this.a & sign ? this.p | C : this.p & ~C;
        const value = this.setNZ(((this.a << 1) | carry) & mask, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x2e: {
        name = 'ROL abs';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.dbr << 16) | this.fetch16();
        const memory = eight ? this.bus.read8(address) : this.bus.read16(address);
        const carry = this.p & C ? 1 : 0;
        this.p = memory & sign ? this.p | C : this.p & ~C;
        const value = this.setNZ(((memory << 1) | carry) & mask, eight);
        eight ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x26: {
        name = 'ROL dp';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.d + this.fetch8()) & 0xffff;
        const memory = eight ? this.bus.read8(address) : this.bus.read16(address);
        const carry = this.p & C ? 1 : 0;
        this.p = memory & sign ? this.p | C : this.p & ~C;
        const value = this.setNZ(((memory << 1) | carry) & mask, eight);
        eight ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x4a: {
        name = 'LSR A';
        const eight = this.a8();
        const operand = this.a & (eight ? 0xff : 0xffff);
        this.p = operand & 1 ? this.p | C : this.p & ~C;
        // In 8-bit accumulator mode B is not part of the shift. Shifting the
        // full 16-bit C register leaked B's bit 8 into A's bit 7 and changed
        // the scheduler index derived at $00:81D7-$00:81DC.
        const value = this.setNZ(operand >>> 1, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x46: {
        name = 'LSR dp';
        const eight = this.a8();
        const address = (this.d + this.fetch8()) & 0xffff;
        const memory = eight ? this.bus.read8(address) : this.bus.read16(address);
        this.p = memory & 1 ? this.p | C : this.p & ~C;
        const value = this.setNZ(memory >>> 1, eight);
        eight ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x66: {
        name = 'ROR dp';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const address = (this.d + this.fetch8()) & 0xffff;
        const memory = eight ? this.bus.read8(address) : this.bus.read16(address);
        const value = this.setNZ(((this.p & C ? sign : 0) | (memory >>> 1)) & mask, eight);
        this.p = memory & 1 ? this.p | C : this.p & ~C;
        eight ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x6a: {
        name = 'ROR A';
        const eight = this.a8();
        const mask = eight ? 0xff : 0xffff;
        const sign = eight ? 0x80 : 0x8000;
        const operand = this.a & mask;
        const value = this.setNZ((this.p & C ? sign : 0) | (operand >>> 1), eight);
        this.p = operand & 1 ? this.p | C : this.p & ~C;
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x3a: {
        name = 'DEC A';
        const eight = this.a8();
        const value = this.setNZ(this.a - 1, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x1a: {
        name = 'INC A';
        const eight = this.a8();
        const value = this.setNZ(this.a + 1, eight);
        this.a = eight ? (this.a & 0xff00) | value : value;
        break;
      }
      case 0x14: {
        name = 'TRB dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const mask = this.a8() ? 0xff : 0xffff;
        const memory = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.p = (this.a & memory & mask) === 0 ? this.p | Z : this.p & ~Z;
        const value = memory & (~this.a & mask);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x1c: {
        name = 'TRB abs';
        const address = (this.dbr << 16) | this.fetch16();
        const mask = this.a8() ? 0xff : 0xffff;
        const memory = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.p = (this.a & memory & mask) === 0 ? this.p | Z : this.p & ~Z;
        const value = memory & (~this.a & mask);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x0c: {
        name = 'TSB abs';
        const address = (this.dbr << 16) | this.fetch16();
        const mask = this.a8() ? 0xff : 0xffff;
        const memory = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.p = (this.a & memory & mask) === 0 ? this.p | Z : this.p & ~Z;
        const value = memory | (this.a & mask);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0x04: {
        name = 'TSB dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        const mask = this.a8() ? 0xff : 0xffff;
        const memory = this.a8() ? this.bus.read8(address) : this.bus.read16(address);
        this.p = (this.a & memory & mask) === 0 ? this.p | Z : this.p & ~Z;
        const value = memory | (this.a & mask);
        this.a8() ? this.bus.write8(address, value) : this.bus.write16(address, value);
        break;
      }
      case 0xca: name = 'DEX'; this.x = this.setNZ(this.x - 1, this.x8()); break;
      case 0xc8: name = 'INY'; this.y = this.setNZ(this.y + 1, this.x8()); break;
      case 0xe8: name = 'INX'; this.x = this.setNZ(this.x + 1, this.x8()); break;
      case 0x88: name = 'DEY'; this.y = this.setNZ(this.y - 1, this.x8()); break;
      default: throw new Error(`unimplemented opcode $${hex(op, 2)} at $${hex(at, 6)}`);
    }
    this.finishInstructionTiming(op, at, startTransactions);
    const entry = { address: at, opcode: op, name, a: this.a, x: this.x, y: this.y, s: this.s, d: this.d, dbr: this.dbr, p: this.p, e: this.e, masterCycle: this.masterCycle };
    this.lastTrace = entry;
    this.executed++;
    if (this.trace.length < this.traceLimit) this.trace.push(entry);
    return entry;
  }

  run(count) { for (let i = 0; i < count; i++) this.step(); return this.trace; }
}
