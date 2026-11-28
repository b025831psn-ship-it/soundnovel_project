// Minimal R3000A interpreter used only as a verification oracle: it runs the game's own
// library routines (from a locally supplied EXE) so the JS ports can be compared against them.
// Branch delay slots are modelled; load delay slots are not (compiled code does not rely on them).
const RAM_SIZE = 0x200000;

export class Mips {
  constructor() {
    this.ram = new Uint8Array(RAM_SIZE);
    this.dv = new DataView(this.ram.buffer);
    this.scratch = new Uint8Array(0x400);
    this.sdv = new DataView(this.scratch.buffer);
    this.r = new Int32Array(32);
    this.hi = 0; this.lo = 0; this.pc = 0; this.next = 4;
    this.cop0 = new Int32Array(32);
    this.io = { read: (a, w) => { throw new Error(`io read ${hex(a)}`); }, write: (a, v, w) => { throw new Error(`io write ${hex(a)}`); } };
    this.hooks = new Map(); // pc -> fn(cpu) ; returning true = handled (cpu.ret())
    this.steps = 0;
  }
  loadExe(exe) {
    const dv = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
    const base = dv.getUint32(0x18, true), size = dv.getUint32(0x1c, true);
    this.ram.set(exe.subarray(0x800, 0x800 + size), base & 0x1fffff);
    return { pc: dv.getUint32(0x10, true), base, size, sp: dv.getUint32(0x30, true) };
  }
  // ---- memory
  map(a) { a >>>= 0; const seg = a >>> 29; if (seg === 4 || seg === 0 || seg === 5) return a & 0x1fffffff; return a & 0x1fffffff; }
  read(a, w) {
    const p = this.map(a);
    if (p < 0x800000) { const o = p & (RAM_SIZE - 1); return w === 4 ? this.dv.getUint32(o, true) : w === 2 ? this.dv.getUint16(o, true) : this.ram[o]; }
    if (p >= 0x1f800000 && p < 0x1f800400) { const o = p & 0x3ff; return w === 4 ? this.sdv.getUint32(o, true) : w === 2 ? this.sdv.getUint16(o, true) : this.scratch[o]; }
    if (p >= 0x1fc00000) return 0;
    return this.io.read(p, w) >>> 0;
  }
  write(a, v, w) {
    if (this.cop0[12] & 0x10000) return; // cache isolated
    const p = this.map(a);
    if (p < 0x800000) { const o = p & (RAM_SIZE - 1); if (w === 4) this.dv.setUint32(o, v >>> 0, true); else if (w === 2) this.dv.setUint16(o, v & 0xffff, true); else this.ram[o] = v; return; }
    if (p >= 0x1f800000 && p < 0x1f800400) { const o = p & 0x3ff; if (w === 4) this.sdv.setUint32(o, v >>> 0, true); else if (w === 2) this.sdv.setUint16(o, v & 0xffff, true); else this.scratch[o] = v; return; }
    if (p >= 0xfffe0000 || p >= 0x1ffe0000) return; // cache control
    this.io.write(p, v >>> 0, w);
  }
  u8(a) { return this.read(a, 1); } u16(a) { return this.read(a, 2); } u32(a) { return this.read(a, 4); }
  s16(a) { return this.read(a, 2) << 16 >> 16; }
  setBytes(a, bytes) { this.ram.set(bytes, this.map(a) & (RAM_SIZE - 1)); }
  bytes(a, n) { const o = this.map(a) & (RAM_SIZE - 1); return this.ram.slice(o, o + n); }
  // ---- calls
  ret() { this.pc = this.r[31] >>> 0; this.next = (this.pc + 4) >>> 0; }
  // Call fn(args...) and run until it returns. Extra args go to the stack (sp+0x10...).
  call(fn, args = [], limit = 50_000_000) {
    const saved = this.r.slice(); const savedPc = this.pc, savedNext = this.next;
    const MAGIC = 0x8000fff0;
    this.r[29] = (this.r[29] - 0x40) & ~7;
    for (let i = 0; i < args.length; i++) { if (i < 4) this.r[4 + i] = args[i]; else this.write(this.r[29] + 4 * i, args[i], 4); }
    this.r[31] = MAGIC; this.pc = fn >>> 0; this.next = (this.pc + 4) >>> 0;
    const end = this.steps + limit;
    while (this.pc !== MAGIC) {
      if (this.steps++ > end) throw new Error(`call ${hex(fn)} did not return (pc ${hex(this.pc)})`);
      this.step();
    }
    const v0 = this.r[2];
    this.r.set(saved); this.r[2] = v0; this.pc = savedPc; this.next = savedNext;
    return v0;
  }
  step() {
    const pc = this.pc;
    const h = this.hooks.get(pc);
    if (h && h(this) !== false) { return; }
    const ins = this.read(pc, 4);
    this.pc = this.next; this.next = (this.next + 4) >>> 0;
    this.exec(ins, pc);
    this.r[0] = 0;
  }
  branch(pc, off) { this.next = (pc + 4 + (off << 2)) >>> 0; }
  exec(i, pc) {
    const r = this.r, op = i >>> 26, rs = (i >>> 21) & 31, rt = (i >>> 16) & 31;
    const imm = i << 16 >> 16, uimm = i & 0xffff;
    switch (op) {
      case 0: {
        const rd = (i >>> 11) & 31, sa = (i >>> 6) & 31, f = i & 63;
        switch (f) {
          case 0: r[rd] = r[rt] << sa; return;
          case 2: r[rd] = r[rt] >>> sa; return;
          case 3: r[rd] = r[rt] >> sa; return;
          case 4: r[rd] = r[rt] << (r[rs] & 31); return;
          case 6: r[rd] = r[rt] >>> (r[rs] & 31); return;
          case 7: r[rd] = r[rt] >> (r[rs] & 31); return;
          case 8: this.next = r[rs] >>> 0; return;
          case 9: { const t = r[rs] >>> 0; r[rd] = pc + 8; this.next = t; return; }
          case 12: return this.syscall();
          case 13: throw new Error(`break at ${hex(pc)}`);
          case 16: r[rd] = this.hi; return;
          case 17: this.hi = r[rs]; return;
          case 18: r[rd] = this.lo; return;
          case 19: this.lo = r[rs]; return;
          case 24: { const p = BigInt(r[rs]) * BigInt(r[rt]); this.lo = Number(BigInt.asIntN(32, p)); this.hi = Number(BigInt.asIntN(32, p >> 32n)); return; }
          case 25: { const p = BigInt(r[rs] >>> 0) * BigInt(r[rt] >>> 0); this.lo = Number(BigInt.asIntN(32, p)); this.hi = Number(BigInt.asIntN(32, p >> 32n)); return; }
          case 26: { const n = r[rs], d = r[rt];
            if (d === 0) { this.hi = n; this.lo = n >= 0 ? -1 : 1; }
            else if (n === -0x80000000 && d === -1) { this.hi = 0; this.lo = n; }
            else { this.lo = (n / d) | 0; this.hi = n % d; } return; }
          case 27: { const n = r[rs] >>> 0, d = r[rt] >>> 0;
            if (d === 0) { this.hi = n | 0; this.lo = -1; } else { this.lo = Math.floor(n / d) | 0; this.hi = (n % d) | 0; } return; }
          case 32: case 33: r[rd] = (r[rs] + r[rt]) | 0; return;
          case 34: case 35: r[rd] = (r[rs] - r[rt]) | 0; return;
          case 36: r[rd] = r[rs] & r[rt]; return;
          case 37: r[rd] = r[rs] | r[rt]; return;
          case 38: r[rd] = r[rs] ^ r[rt]; return;
          case 39: r[rd] = ~(r[rs] | r[rt]); return;
          case 42: r[rd] = r[rs] < r[rt] ? 1 : 0; return;
          case 43: r[rd] = (r[rs] >>> 0) < (r[rt] >>> 0) ? 1 : 0; return;
        }
        break;
      }
      case 1: {
        const link = (rt & 0x1e) === 0x10, ge = rt & 1;
        const take = ge ? r[rs] >= 0 : r[rs] < 0;
        if (link) r[31] = pc + 8;
        if (take) this.branch(pc, imm); return;
      }
      case 2: this.next = ((pc + 4) & 0xf0000000 | (i & 0x3ffffff) << 2) >>> 0; return;
      case 3: r[31] = pc + 8; this.next = ((pc + 4) & 0xf0000000 | (i & 0x3ffffff) << 2) >>> 0; return;
      case 4: if (r[rs] === r[rt]) this.branch(pc, imm); return;
      case 5: if (r[rs] !== r[rt]) this.branch(pc, imm); return;
      case 6: if (r[rs] <= 0) this.branch(pc, imm); return;
      case 7: if (r[rs] > 0) this.branch(pc, imm); return;
      case 8: case 9: r[rt] = (r[rs] + imm) | 0; return;
      case 10: r[rt] = r[rs] < imm ? 1 : 0; return;
      case 11: r[rt] = (r[rs] >>> 0) < (imm >>> 0) ? 1 : 0; return;
      case 12: r[rt] = r[rs] & uimm; return;
      case 13: r[rt] = r[rs] | uimm; return;
      case 14: r[rt] = r[rs] ^ uimm; return;
      case 15: r[rt] = uimm << 16; return;
      case 16: { const f = rs; const rd = (i >>> 11) & 31;
        if (f === 0) { r[rt] = this.cop0[rd]; return; }
        if (f === 4) { this.cop0[rd] = r[rt]; return; }
        if (f === 16 && (i & 63) === 16) { const sr = this.cop0[12]; this.cop0[12] = (sr & ~0xf) | ((sr >> 2) & 0xf); return; } // rfe
        return; }
      case 18: return; // GTE: not used by the sound code
      case 32: r[rt] = this.read(r[rs] + imm, 1) << 24 >> 24; return;
      case 33: r[rt] = this.read(r[rs] + imm, 2) << 16 >> 16; return;
      case 34: { const a = (r[rs] + imm) >>> 0, n = a & 3, w = this.read(a & ~3, 4); r[rt] = (r[rt] & (0x00ffffff >>> (n * 8))) | (w << (24 - n * 8)); return; }
      case 35: r[rt] = this.read(r[rs] + imm, 4); return;
      case 36: r[rt] = this.read(r[rs] + imm, 1); return;
      case 37: r[rt] = this.read(r[rs] + imm, 2); return;
      case 38: { const a = (r[rs] + imm) >>> 0, n = a & 3, w = this.read(a & ~3, 4); r[rt] = (r[rt] & (0xffffff00 << ((3 - n) * 8))) | (w >>> (n * 8)); return; }
      case 40: this.write(r[rs] + imm, r[rt] & 0xff, 1); return;
      case 41: this.write(r[rs] + imm, r[rt] & 0xffff, 2); return;
      case 42: { const a = (r[rs] + imm) >>> 0, n = a & 3, w = this.read(a & ~3, 4); this.write(a & ~3, (w & (0xffffff00 << (n * 8))) | (r[rt] >>> (24 - n * 8)), 4); return; }
      case 43: this.write(r[rs] + imm, r[rt], 4); return;
      case 46: { const a = (r[rs] + imm) >>> 0, n = a & 3, w = this.read(a & ~3, 4); this.write(a & ~3, (w & (0x00ffffff >>> ((3 - n) * 8))) | (r[rt] << (n * 8)), 4); return; }
      case 50: case 58: return; // lwc2/swc2
    }
    throw new Error(`unimplemented ${hex(i)} at ${hex(pc)}`);
  }
  syscall() { // EnterCriticalSection(1) / ExitCriticalSection(2): interrupts are not modelled
    const a0 = this.r[4]; this.r[2] = a0 === 1 ? 1 : 0;
  }
}
export const hex = (v) => "0x" + (v >>> 0).toString(16);
