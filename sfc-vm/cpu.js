const C = 0x01;
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
  a8() { return this.e || !!(this.p & M); }
  x8() { return this.e || !!(this.p & X); }
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
      case 0x9c: { name = 'STZ abs'; const a = this.fetch16(); this.a8() ? this.bus.write8(a, 0) : this.bus.write16(a, 0); break; }
      case 0xc2: name = 'REP'; this.p &= ~this.fetch8(); break;
      case 0xe2: name = 'SEP'; this.p |= this.fetch8(); if (this.p & X) { this.x &= 0xff; this.y &= 0xff; } break;
      case 0x1b: name = 'TCS'; this.s = this.a; break;
      case 0x5b: name = 'TCD'; this.d = this.a; break;
      case 0xf4: { name = 'PEA'; const v = this.fetch16(); this.push8(v >>> 8); this.push8(v); break; }
      case 0xab: name = 'PLB'; this.dbr = this.pull8(); break;
      case 0xa2: name = 'LDX #'; this.x = this.x8() ? this.fetch8() : this.fetch16(); break;
      case 0xa0: name = 'LDY #'; this.y = this.x8() ? this.fetch8() : this.fetch16(); break;
      default: throw new Error(`unimplemented opcode $${hex(op, 2)} at $${hex(at, 6)}`);
    }
    const entry = { address: at, opcode: op, name, a: this.a, x: this.x, y: this.y, s: this.s, d: this.d, dbr: this.dbr, p: this.p, e: this.e };
    this.trace.push(entry);
    return entry;
  }

  run(count) { for (let i = 0; i < count; i++) this.step(); return this.trace; }
}
