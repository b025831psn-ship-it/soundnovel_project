const C = 0x01;
const Z = 0x02;
const N = 0x80;
const X = 0x10;
const M = 0x20;

const hex = (n, width) => n.toString(16).toUpperCase().padStart(width, '0');

export class Cpu65816 {
  constructor(bus) {
    this.bus = bus;
    this.trace = [];
    this.reset();
  }

  reset() {
    this.a = this.x = this.y = this.d = this.dbr = 0;
    this.s = 0x01ff;
    this.p = 0x34;
    this.e = true;
    this.pbr = 0;
    this.pc = this.bus.read16(0x00fffc);
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

  step() {
    const at = this.address();
    const op = this.fetch8();
    let name;
    switch (op) {
      case 0x18: name = 'CLC'; this.p &= ~C; break;
      case 0xfb: {
        name = 'XCE';
        const carry = !!(this.p & C);
        this.p = (this.p & ~C) | (this.e ? C : 0);
        this.e = carry;
        if (this.e) { this.p |= M | X; this.s = 0x0100 | (this.s & 0xff); }
        break;
      }
      case 0xa9: {
        name = 'LDA #';
        const v = this.a8() ? this.fetch8() : this.fetch16();
        this.a = this.a8() ? (this.a & 0xff00) | v : v;
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
      case 0x85: {
        name = 'STA dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        this.a8() ? this.bus.write8(address, this.a) : this.bus.write16(address, this.a);
        break;
      }
      case 0x86: {
        name = 'STX dp';
        const address = (this.d + this.fetch8()) & 0xffff;
        this.x8() ? this.bus.write8(address, this.x) : this.bus.write16(address, this.x);
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
      case 0x8e: { name = 'STX abs'; const a = this.fetch16(); this.x8() ? this.bus.write8(a, this.x) : this.bus.write16(a, this.x); break; }
      case 0x8c: { name = 'STY abs'; const a = this.fetch16(); this.x8() ? this.bus.write8(a, this.y) : this.bus.write16(a, this.y); break; }
      case 0x9c: { name = 'STZ abs'; const a = this.fetch16(); this.a8() ? this.bus.write8(a, 0) : this.bus.write16(a, 0); break; }
      case 0xc2: name = 'REP'; this.p &= ~this.fetch8(); break;
      case 0xe2: name = 'SEP'; this.p |= this.fetch8(); if (this.p & X) { this.x &= 0xff; this.y &= 0xff; } break;
      case 0x1b: name = 'TCS'; this.s = this.a; break;
      case 0x5b: name = 'TCD'; this.d = this.a; break;
      case 0xf4: { name = 'PEA'; const v = this.fetch16(); this.push8(v >>> 8); this.push8(v); break; }
      case 0xab: name = 'PLB'; this.dbr = this.pull8(); break;
      case 0xa2: name = 'LDX #'; this.x = this.x8() ? this.fetch8() : this.fetch16(); break;
      case 0xa0: name = 'LDY #'; this.y = this.x8() ? this.fetch8() : this.fetch16(); break;
      case 0xbd: {
        name = 'LDA abs,X';
        const address = (this.fetch16() + this.x) & 0xffff;
        const value = this.a8()
          ? this.bus.read8((this.dbr << 16) | address)
          : this.bus.read16((this.dbr << 16) | address);
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
      case 0xd0: {
        name = 'BNE';
        const displacement = (this.fetch8() << 24) >> 24;
        if (!(this.p & Z)) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x82: {
        name = 'BRL';
        const displacement = (this.fetch16() << 16) >> 16;
        this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0x10: {
        name = 'BPL';
        const displacement = (this.fetch8() << 24) >> 24;
        if (!(this.p & N)) this.pc = (this.pc + displacement) & 0xffff;
        break;
      }
      case 0xca: name = 'DEX'; this.x = this.setNZ(this.x - 1, this.x8()); break;
      case 0xc8: name = 'INY'; this.y = this.setNZ(this.y + 1, this.x8()); break;
      default: throw new Error(`unimplemented opcode $${hex(op, 2)} at $${hex(at, 6)}`);
    }
    const entry = { address: at, opcode: op, name, a: this.a, x: this.x, y: this.y, s: this.s, d: this.d, dbr: this.dbr, p: this.p, e: this.e };
    this.trace.push(entry);
    return entry;
  }

  run(count) { for (let i = 0; i < count; i++) this.step(); return this.trace; }
}
