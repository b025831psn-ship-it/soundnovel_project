// SPC700 CPU and SMP I/O ($F0-$FF) for the SFC audio unit.
// Cycle unit: one SPC700 clock (1.024 MHz). One DSP sample = 32 clocks.
// The 64-byte IPL boot ROM is hardware firmware and is not shipped here; boot through
// `loadIplImage()` (local file) or the high-level `uploadRecords()` loader.

// Base clocks per opcode. Taken branches add 2.
const CYCLES = Uint8Array.from([
  2,8,4,5,3,4,3,6,2,6,5,4,5,4,6,8, 2,8,4,5,4,5,5,6,5,5,6,5,2,2,4,6,
  2,8,4,5,3,4,3,6,2,6,5,4,5,4,5,4, 2,8,4,5,4,5,5,6,5,5,6,5,2,2,3,8,
  2,8,4,5,3,4,3,6,2,6,4,4,5,4,6,6, 2,8,4,5,4,5,5,6,5,5,4,5,2,2,4,3,
  2,8,4,5,3,4,3,6,2,6,4,4,5,4,5,5, 2,8,4,5,4,5,5,6,5,5,5,5,2,2,3,6,
  2,8,4,5,3,4,3,6,2,6,5,4,5,2,4,5, 2,8,4,5,4,5,5,6,5,5,5,5,2,2,12,5,
  3,8,4,5,3,4,3,6,2,6,4,4,5,2,4,4, 2,8,4,5,4,5,5,6,5,5,5,5,2,2,3,4,
  3,8,4,5,4,5,4,7,2,5,6,4,5,2,4,9, 2,8,4,5,5,6,6,7,4,5,5,5,2,2,6,3,
  2,8,4,5,3,4,3,6,2,4,5,3,4,3,4,3, 2,8,4,5,4,5,5,6,3,4,5,4,2,2,4,3,
]);

const N = 0x80, V = 0x40, P = 0x20, B = 0x10, H = 0x08, I = 0x04, Z = 0x02, C = 0x01;

export class Timer {
  constructor(period) { this.period = period; this.phase = 0; this.stage = 0; this.target = 0; this.out = 0; this.enabled = false; }
  tick(clocks) {
    this.phase += clocks;
    while (this.phase >= this.period) {
      this.phase -= this.period;
      if (!this.enabled) continue;
      this.stage = (this.stage + 1) & 0xff;
      if (this.stage === this.target) { this.stage = 0; this.out = (this.out + 1) & 0x0f; }
    }
  }
}

// Default DSP stand-in: a 128-byte register file. The S-DSP module replaces it.
export class DspRegisters {
  constructor() { this.regs = new Uint8Array(128); }
  read(addr) { return this.regs[addr & 0x7f]; }
  write(addr, value) { this.regs[addr] = value; }
}

export class SPC700 {
  constructor({ dsp = new DspRegisters(), onDspWrite = null, onPortWrite = null } = {}) {
    this.ram = new Uint8Array(0x10000);
    this.ipl = null;            // 64 bytes when a local image is loaded
    this.dsp = dsp;
    this.onDspWrite = onDspWrite;   // (clock, reg, value) for trace comparison
    this.onPortWrite = onPortWrite; // (clock, port, value)
    this.timers = [new Timer(128), new Timer(128), new Timer(16)];
    this.portIn = new Uint8Array(4);  // written by the main CPU, read at $F4-$F7
    this.portOut = new Uint8Array(4); // written by the SPC700, read by the main CPU
    this.dspDone = 0; this.curOp = 0; this.dspAccessOffset = 0;
    this.reset();
  }

  reset() {
    this.a = 0; this.x = 0; this.y = 0; this.sp = 0xef; this.psw = 0x02;
    this.control = 0x80; this.dspAddr = 0; this.clock = 0; this.stopped = false;
    for (const t of this.timers) { t.enabled = false; t.stage = 0; t.out = 0; t.target = 0; }
    this.pc = this.ipl ? this.ipl[0x3e] | (this.ipl[0x3f] << 8) : 0xffc0;
  }

  loadIplImage(bytes) {
    if (bytes.length !== 64) throw new Error('IPL image must be 64 bytes');
    this.ipl = Uint8Array.from(bytes);
    this.reset();
  }

  // High-level boot: applies `[len, dest, payload]` records the way the IPL transfer
  // leaves memory, then jumps to the final record's destination. Register state at the
  // jump is an assumption until checked against a probe snapshot.
  uploadRecords(records) {
    let exec = null;
    for (const r of records) {
      if (r.length === 0 || !r.payload || r.payload.length === 0) { exec = r.dest; break; }
      this.ram.set(r.payload, r.dest);
    }
    if (exec === null) throw new Error('upload records have no terminating entry');
    this.control = 0x00; // driver is expected to set CONTROL itself
    this.pc = exec;
    return exec;
  }

  // ---- bus ----
  read(addr) {
    addr &= 0xffff;
    if (addr >= 0xf0 && addr <= 0xff) return this.readIo(addr);
    if (addr >= 0xffc0 && (this.control & 0x80) && this.ipl) return this.ipl[addr - 0xffc0];
    return this.ram[addr];
  }

  write(addr, value) {
    addr &= 0xffff; value &= 0xff;
    if (addr >= 0xf0 && addr <= 0xff) this.writeIo(addr, value);
    this.ram[addr] = value;
  }

  readIo(addr) {
    switch (addr) {
      case 0xf2: return this.dspAddr;
      case 0xf3: this.syncDsp(); return this.dsp.read(this.dspAddr & 0x7f);
      case 0xf4: case 0xf5: case 0xf6: case 0xf7:
        if (this.onPortRead) this.onPortRead(this.clock, this.curOp);
        return this.portIn[addr - 0xf4];
      case 0xfd: case 0xfe: case 0xff: {
        this.syncTimers();
        const t = this.timers[addr - 0xfd]; const v = t.out; t.out = 0; return v;
      }
      case 0xf0: case 0xf1: case 0xfa: case 0xfb: case 0xfc: return 0;
      default: return this.ram[addr]; // $F8/$F9
    }
  }

  writeIo(addr, value) {
    switch (addr) {
      case 0xf1: {
        for (let i = 0; i < 3; i++) {
          const on = (value >> i) & 1; const t = this.timers[i];
          if (on && !t.enabled) { t.stage = 0; t.out = 0; }
          t.enabled = !!on;
        }
        if (value & 0x10) { this.portIn[0] = 0; this.portIn[1] = 0; }
        if (value & 0x20) { this.portIn[2] = 0; this.portIn[3] = 0; }
        this.control = value;
        break;
      }
      case 0xf2: this.dspAddr = value; break;
      case 0xf3:
        if (this.dspAddr < 0x80) {
          this.syncDsp();
          this.dsp.write(this.dspAddr, value);
          if (this.onDspWrite) this.onDspWrite(this.clock, this.dspAddr, value);
        }
        break;
      case 0xf4: case 0xf5: case 0xf6: case 0xf7:
        this.portOut[addr - 0xf4] = value;
        if (this.onPortWrite) this.onPortWrite(this.clock, addr - 0xf4, value);
        break;
      case 0xfa: case 0xfb: case 0xfc: this.timers[addr - 0xfa].target = value; break;
      default: break;
    }
  }

  // ---- helpers ----
  get dp() { return (this.psw & P) ? 0x100 : 0; }
  fetch() { const v = this.read(this.pc); this.pc = (this.pc + 1) & 0xffff; return v; }
  fetch16() { const lo = this.fetch(); return lo | (this.fetch() << 8); }
  dpAddr(off) { return this.dp | (off & 0xff); }
  readDp(off) { return this.read(this.dpAddr(off)); }
  writeDp(off, v) { this.write(this.dpAddr(off), v); }
  readDpWord(off) { return this.readDp(off) | (this.readDp(off + 1) << 8); }
  push(v) { this.write(0x100 | this.sp, v); this.sp = (this.sp - 1) & 0xff; }
  pop() { this.sp = (this.sp + 1) & 0xff; return this.read(0x100 | this.sp); }
  nz(v) { this.psw = (this.psw & ~(N | Z)) | (v & 0x80) | ((v & 0xff) === 0 ? Z : 0); return v & 0xff; }
  nz16(v) { this.psw = (this.psw & ~(N | Z)) | ((v >> 8) & 0x80) | ((v & 0xffff) === 0 ? Z : 0); }
  setFlag(f, on) { this.psw = on ? (this.psw | f) : (this.psw & ~f); }
  get ya() { return (this.y << 8) | this.a; }
  set ya(v) { this.a = v & 0xff; this.y = (v >> 8) & 0xff; }

  adc(a, b) {
    const c = this.psw & C; const r = a + b + c;
    this.setFlag(C, r > 0xff);
    this.setFlag(V, (~(a ^ b) & (a ^ r) & 0x80) !== 0);
    this.setFlag(H, ((a & 0x0f) + (b & 0x0f) + c) > 0x0f);
    return this.nz(r);
  }
  sbc(a, b) { return this.adc(a, b ^ 0xff); }
  cmp(a, b) { const r = a - b; this.setFlag(C, r >= 0); this.nz(r); }
  or(a, b) { return this.nz(a | b); }
  and(a, b) { return this.nz(a & b); }
  eor(a, b) { return this.nz(a ^ b); }
  asl(v) { this.setFlag(C, v & 0x80); return this.nz(v << 1); }
  lsr(v) { this.setFlag(C, v & 1); return this.nz(v >> 1); }
  rol(v) { const c = this.psw & C; this.setFlag(C, v & 0x80); return this.nz((v << 1) | c); }
  ror(v) { const c = this.psw & C; this.setFlag(C, v & 1); return this.nz((v >> 1) | (c << 7)); }
  inc(v) { return this.nz(v + 1); }
  dec(v) { return this.nz(v - 1); }

  // Address modes returning an effective address.
  aDpX() { return this.dpAddr(this.fetch() + this.x); }
  aDpY() { return this.dpAddr(this.fetch() + this.y); }
  aAbs() { return this.fetch16(); }
  aAbsX() { return (this.fetch16() + this.x) & 0xffff; }
  aAbsY() { return (this.fetch16() + this.y) & 0xffff; }
  aIndX() { const p = this.fetch() + this.x; return this.readDp(p) | (this.readDp(p + 1) << 8); }
  aIndY() { const p = this.fetch(); return ((this.readDp(p) | (this.readDp(p + 1) << 8)) + this.y) & 0xffff; }
  aX() { return this.dpAddr(this.x); }

  branch(cond) {
    const rel = this.fetch();
    if (!cond) return 0;
    this.pc = (this.pc + ((rel << 24) >> 24)) & 0xffff;
    return 2;
  }

  // Applies the ALU op selected by the high opcode nibble (OR/AND/EOR/CMP/ADC/SBC rows).
  alu(row, a, b) {
    switch (row) {
      case 0: return this.or(a, b);
      case 1: return this.and(a, b);
      case 2: return this.eor(a, b);
      case 3: this.cmp(a, b); return null;
      case 4: return this.adc(a, b);
      case 5: return this.sbc(a, b);
    }
    throw new Error('bad alu row');
  }

  // Executes one instruction and returns the clocks it took.
  step() {
    if (this.stopped) { this.tick(2); return 2; }
    this.dspDone = 0; this.timerDone = 0;
    const inIpl = this.ipl !== null && this.pc >= 0xffc0 && (this.control & 0x80);
    const op = this.fetch();
    this.curOp = op;
    let extra = this.exec(op);
    // The IPL's final JMP [!abs+X] into the uploaded program takes one clock more than the
    // same opcode in RAM (measured: reset-to-frame-5700 CPU reads and PCM, see apu.js).
    if (inIpl && op === 0x1f) extra += 1;
    const clocks = CYCLES[op] + extra;
    this.tick(clocks);
    return clocks;
  }

  tick(clocks) {
    this.clock += clocks;
    for (const t of this.timers) t.tick(clocks - this.timerDone);
    this.timerDone = 0;
    if (this.dsp.tick) this.dsp.tick(clocks - this.dspDone);
    this.dspDone = 0;
  }

  // Brings the timers up to the point inside the current instruction where a $FD-$FF read
  // sees them: two clocks before the instruction's last (read) cycle. This matched both
  // references: Kamaitachi polls with MOV A,dp (3 clocks, offset 0) and Zakuro with
  // MOV Y,!abs (4 clocks, offset 1; reading at the start drops a pitch-slide step).
  syncTimers() {
    const at = this.timerAccessOffset ?? Math.max(0, CYCLES[this.curOp] - 3);
    if (at > this.timerDone) { for (const t of this.timers) t.tick(at - this.timerDone); this.timerDone = at; }
  }

  // Brings the DSP up to the point inside the current instruction where a $F3 access
  // takes effect, `dspAccessOffset` clocks after the instruction starts. 0 (the start)
  // reproduced the reference PCM sample for sample; later offsets did not.
  syncDsp() {
    if (!this.dsp.tick) return;
    const at = Math.min(CYCLES[this.curOp], Math.max(0, this.dspAccessOffset));
    if (at > this.dspDone) { this.dsp.tick(at - this.dspDone); this.dspDone = at; }
  }

  run(clocks) {
    const end = this.clock + clocks;
    while (this.clock < end) this.step();
  }

  exec(op) {
    const hi = op >> 4, lo = op & 0x0f;

    // ALU block: rows 0..B, columns 4..9 (OR, AND, EOR, CMP, ADC, SBC).
    if (hi < 0x0c && lo >= 4 && lo <= 9) {
      const row = hi >> 1, odd = hi & 1;
      let addr;
      switch (lo) {
        case 4: addr = odd ? this.aDpX() : this.dpAddr(this.fetch()); break;
        case 5: addr = odd ? this.aAbsX() : this.aAbs(); break;
        case 6: addr = odd ? this.aAbsY() : this.aX(); break;
        case 7: addr = odd ? this.aIndY() : this.aIndX(); break;
        case 8: {
          if (!odd) { const r = this.alu(row, this.a, this.fetch()); if (r !== null) this.a = r; return 0; }
          const imm = this.fetch(); const d = this.dpAddr(this.fetch());
          const r = this.alu(row, this.read(d), imm); if (r !== null) this.write(d, r); return 0;
        }
        case 9: {
          let s, d;
          if (!odd) { s = this.dpAddr(this.fetch()); d = this.dpAddr(this.fetch()); }
          else { s = this.dpAddr(this.y); d = this.dpAddr(this.x); }
          const src = this.read(s); const r = this.alu(row, this.read(d), src);
          if (r !== null) this.write(d, r); return 0;
        }
      }
      const r = this.alu(row, this.a, this.read(addr));
      if (r !== null) this.a = r;
      return 0;
    }

    if (lo === 1) { // TCALL n
      const v = 0xffde - hi * 2;
      this.push(this.pc >> 8); this.push(this.pc & 0xff);
      this.pc = this.read(v) | (this.read(v + 1) << 8);
      return 0;
    }
    if (lo === 2) { // SET1 / CLR1 dp.bit
      const bit = 1 << (hi >> 1); const d = this.dpAddr(this.fetch()); const v = this.read(d);
      this.write(d, (hi & 1) ? (v & ~bit) : (v | bit));
      return 0;
    }
    if (lo === 3) { // BBS / BBC dp.bit, rel
      const bit = 1 << (hi >> 1); const v = this.readDp(this.fetch());
      return this.branch((hi & 1) ? !(v & bit) : !!(v & bit));
    }

    switch (op) {
      // ---- column 0 ----
      case 0x00: return 0;
      case 0x10: return this.branch(!(this.psw & N));
      case 0x20: this.psw &= ~P; return 0;
      case 0x30: return this.branch(this.psw & N);
      case 0x40: this.psw |= P; return 0;
      case 0x50: return this.branch(!(this.psw & V));
      case 0x60: this.psw &= ~C; return 0;
      case 0x70: return this.branch(this.psw & V);
      case 0x80: this.psw |= C; return 0;
      case 0x90: return this.branch(!(this.psw & C));
      case 0xa0: this.psw |= I; return 0;
      case 0xb0: return this.branch(this.psw & C);
      case 0xc0: this.psw &= ~I; return 0;
      case 0xd0: return this.branch(!(this.psw & Z));
      case 0xe0: this.psw &= ~(V | H); return 0;
      case 0xf0: return this.branch(this.psw & Z);

      // ---- MOV block (rows C..F, columns 4..9) ----
      case 0xc4: this.write(this.dpAddr(this.fetch()), this.a); return 0;
      case 0xd4: this.write(this.aDpX(), this.a); return 0;
      case 0xe4: this.a = this.nz(this.readDp(this.fetch())); return 0;
      case 0xf4: this.a = this.nz(this.read(this.aDpX())); return 0;
      case 0xc5: this.write(this.aAbs(), this.a); return 0;
      case 0xd5: this.write(this.aAbsX(), this.a); return 0;
      case 0xe5: this.a = this.nz(this.read(this.aAbs())); return 0;
      case 0xf5: this.a = this.nz(this.read(this.aAbsX())); return 0;
      case 0xc6: this.write(this.aX(), this.a); return 0;
      case 0xd6: this.write(this.aAbsY(), this.a); return 0;
      case 0xe6: this.a = this.nz(this.read(this.aX())); return 0;
      case 0xf6: this.a = this.nz(this.read(this.aAbsY())); return 0;
      case 0xc7: this.write(this.aIndX(), this.a); return 0;
      case 0xd7: this.write(this.aIndY(), this.a); return 0;
      case 0xe7: this.a = this.nz(this.read(this.aIndX())); return 0;
      case 0xf7: this.a = this.nz(this.read(this.aIndY())); return 0;
      case 0xc8: this.cmp(this.x, this.fetch()); return 0;
      case 0xd8: this.write(this.dpAddr(this.fetch()), this.x); return 0;
      case 0xe8: this.a = this.nz(this.fetch()); return 0;
      case 0xf8: this.x = this.nz(this.readDp(this.fetch())); return 0;
      case 0xc9: this.write(this.aAbs(), this.x); return 0;
      case 0xd9: this.write(this.aDpY(), this.x); return 0;
      case 0xe9: this.x = this.nz(this.read(this.aAbs())); return 0;
      case 0xf9: this.x = this.nz(this.read(this.aDpY())); return 0;

      // ---- column A ----
      case 0x0a: case 0x2a: case 0x4a: case 0x6a: case 0x8a: case 0xaa: case 0xca: case 0xea: {
        const w = this.fetch16(); const addr = w & 0x1fff; const bit = w >> 13;
        const m = (this.read(addr) >> bit) & 1; const c = this.psw & C;
        switch (op) {
          case 0x0a: this.setFlag(C, c | m); break;
          case 0x2a: this.setFlag(C, c | (m ^ 1)); break;
          case 0x4a: this.setFlag(C, c & m); break;
          case 0x6a: this.setFlag(C, c & (m ^ 1)); break;
          case 0x8a: this.setFlag(C, c ^ m); break;
          case 0xaa: this.setFlag(C, m); break;
          case 0xca: { const v = this.read(addr); this.write(addr, c ? (v | (1 << bit)) : (v & ~(1 << bit))); break; }
          case 0xea: { const v = this.read(addr); this.write(addr, v ^ (1 << bit)); break; }
        }
        return 0;
      }
      case 0x1a: case 0x3a: { // DECW / INCW dp
        const d = this.fetch(); let v = this.readDpWord(d);
        v = (v + (op === 0x3a ? 1 : -1)) & 0xffff;
        this.writeDp(d, v & 0xff); this.writeDp(d + 1, v >> 8); this.nz16(v); return 0;
      }
      case 0x5a: { // CMPW YA, dp
        const v = this.readDpWord(this.fetch()); const r = this.ya - v;
        this.setFlag(C, r >= 0); this.nz16(r & 0xffff); return 0;
      }
      case 0x7a: case 0x9a: { // ADDW / SUBW YA, dp
        let v = this.readDpWord(this.fetch()); const ya = this.ya;
        if (op === 0x9a) { v = (~v) & 0xffff; this.psw |= C; } else this.psw &= ~C;
        const c = this.psw & C; const r = ya + v + c;
        this.setFlag(C, r > 0xffff);
        this.setFlag(V, (~(ya ^ v) & (ya ^ r) & 0x8000) !== 0);
        this.setFlag(H, ((ya & 0x0fff) + (v & 0x0fff) + c) > 0x0fff);
        this.ya = r & 0xffff; this.nz16(r & 0xffff); return 0;
      }
      case 0xba: { const v = this.readDpWord(this.fetch()); this.ya = v; this.nz16(v); return 0; }
      case 0xda: { const d = this.fetch(); this.writeDp(d, this.a); this.writeDp(d + 1, this.y); return 0; }
      case 0xfa: { const s = this.readDp(this.fetch()); this.writeDp(this.fetch(), s); return 0; }

      // ---- column B / C: shifts, inc/dec, Y moves ----
      case 0x0b: case 0x2b: case 0x4b: case 0x6b: case 0x8b: case 0xab:
      case 0x1b: case 0x3b: case 0x5b: case 0x7b: case 0x9b: case 0xbb:
      case 0x0c: case 0x2c: case 0x4c: case 0x6c: case 0x8c: case 0xac: {
        const addr = lo === 0x0c ? this.aAbs() : ((hi & 1) ? this.aDpX() : this.dpAddr(this.fetch()));
        const v = this.read(addr);
        let r;
        switch (hi >> 1) {
          case 0: r = this.asl(v); break; case 1: r = this.rol(v); break;
          case 2: r = this.lsr(v); break; case 3: r = this.ror(v); break;
          case 4: r = this.dec(v); break; case 5: r = this.inc(v); break;
        }
        this.write(addr, r); return 0;
      }
      case 0x1c: this.a = this.asl(this.a); return 0;
      case 0x3c: this.a = this.rol(this.a); return 0;
      case 0x5c: this.a = this.lsr(this.a); return 0;
      case 0x7c: this.a = this.ror(this.a); return 0;
      case 0x9c: this.a = this.dec(this.a); return 0;
      case 0xbc: this.a = this.inc(this.a); return 0;
      case 0xdc: this.y = this.dec(this.y); return 0;
      case 0xfc: this.y = this.inc(this.y); return 0;
      case 0xcb: this.write(this.dpAddr(this.fetch()), this.y); return 0;
      case 0xdb: this.write(this.aDpX(), this.y); return 0;
      case 0xeb: this.y = this.nz(this.readDp(this.fetch())); return 0;
      case 0xfb: this.y = this.nz(this.read(this.aDpX())); return 0;
      case 0xcc: this.write(this.aAbs(), this.y); return 0;
      case 0xec: this.y = this.nz(this.read(this.aAbs())); return 0;

      // ---- column D ----
      case 0x0d: this.push(this.psw); return 0;
      case 0x2d: this.push(this.a); return 0;
      case 0x4d: this.push(this.x); return 0;
      case 0x6d: this.push(this.y); return 0;
      case 0x1d: this.x = this.dec(this.x); return 0;
      case 0x3d: this.x = this.inc(this.x); return 0;
      case 0x5d: this.x = this.nz(this.a); return 0;
      case 0x7d: this.a = this.nz(this.x); return 0;
      case 0x8d: this.y = this.nz(this.fetch()); return 0;
      case 0x9d: this.x = this.nz(this.sp); return 0;
      case 0xad: this.cmp(this.y, this.fetch()); return 0;
      case 0xbd: this.sp = this.x; return 0;
      case 0xcd: this.x = this.nz(this.fetch()); return 0;
      case 0xdd: this.a = this.nz(this.y); return 0;
      case 0xed: this.psw ^= C; return 0;
      case 0xfd: this.y = this.nz(this.a); return 0;

      // ---- column E ----
      case 0x0e: case 0x4e: { // TSET1 / TCLR1 !abs
        const addr = this.aAbs(); const v = this.read(addr);
        this.nz(this.a - v);
        this.write(addr, op === 0x0e ? (v | this.a) : (v & ~this.a)); return 0;
      }
      case 0x1e: this.cmp(this.x, this.read(this.aAbs())); return 0;
      case 0x3e: this.cmp(this.x, this.readDp(this.fetch())); return 0;
      case 0x5e: this.cmp(this.y, this.read(this.aAbs())); return 0;
      case 0x7e: this.cmp(this.y, this.readDp(this.fetch())); return 0;
      case 0x2e: { const v = this.readDp(this.fetch()); return this.branch(this.a !== v); }
      case 0xde: { const v = this.read(this.aDpX()); return this.branch(this.a !== v); }
      case 0x6e: {
        const d = this.dpAddr(this.fetch()); const v = (this.read(d) - 1) & 0xff;
        this.write(d, v); return this.branch(v !== 0);
      }
      case 0xfe: this.y = (this.y - 1) & 0xff; return this.branch(this.y !== 0);
      case 0x8e: this.psw = this.pop(); return 0;
      case 0xae: this.a = this.pop(); return 0;
      case 0xce: this.x = this.pop(); return 0;
      case 0xee: this.y = this.pop(); return 0;
      case 0x9e: { // DIV YA, X
        const ya = this.ya, x = this.x, y = this.y;
        this.setFlag(H, (y & 0x0f) >= (x & 0x0f));
        this.setFlag(V, y >= x);
        if (y < (x << 1)) { this.a = Math.floor(ya / x) & 0xff; this.y = (ya % x) & 0xff; }
        else {
          const r = ya - (x << 9), d = 256 - x;
          this.a = (255 - Math.floor(r / d)) & 0xff; this.y = (x + (r % d)) & 0xff;
        }
        this.nz(this.a); return 0;
      }
      case 0xbe: { // DAS
        if (!(this.psw & C) || this.a > 0x99) { this.a = (this.a - 0x60) & 0xff; this.psw &= ~C; }
        if (!(this.psw & H) || (this.a & 0x0f) > 9) this.a = (this.a - 6) & 0xff;
        this.nz(this.a); return 0;
      }

      // ---- column F ----
      case 0x0f: { // BRK
        this.push(this.pc >> 8); this.push(this.pc & 0xff); this.push(this.psw);
        this.psw = (this.psw | B) & ~I;
        this.pc = this.read(0xffde) | (this.read(0xffdf) << 8); return 0;
      }
      case 0x1f: { const a = this.aAbsX(); this.pc = this.read(a) | (this.read((a + 1) & 0xffff) << 8); return 0; }
      case 0x2f: this.branch(true); return 0; // BRA: 4 clocks already include the jump
      case 0x3f: { const a = this.fetch16(); this.push(this.pc >> 8); this.push(this.pc & 0xff); this.pc = a; return 0; }
      case 0x4f: { const u = this.fetch(); this.push(this.pc >> 8); this.push(this.pc & 0xff); this.pc = 0xff00 | u; return 0; }
      case 0x5f: this.pc = this.fetch16(); return 0;
      case 0x6f: { const l = this.pop(); this.pc = l | (this.pop() << 8); return 0; }
      case 0x7f: { this.psw = this.pop(); const l = this.pop(); this.pc = l | (this.pop() << 8); return 0; }
      case 0x8f: { const imm = this.fetch(); this.write(this.dpAddr(this.fetch()), imm); return 0; }
      case 0x9f: this.a = this.nz((this.a >> 4) | (this.a << 4)); return 0;
      case 0xaf: this.write(this.aX(), this.a); this.x = (this.x + 1) & 0xff; return 0;
      case 0xbf: this.a = this.nz(this.read(this.aX())); this.x = (this.x + 1) & 0xff; return 0;
      case 0xcf: { const r = this.y * this.a; this.ya = r; this.nz(this.y); return 0; }
      case 0xdf: { // DAA
        if ((this.psw & C) || this.a > 0x99) { this.a = (this.a + 0x60) & 0xff; this.psw |= C; }
        if ((this.psw & H) || (this.a & 0x0f) > 9) this.a = (this.a + 6) & 0xff;
        this.nz(this.a); return 0;
      }
      case 0xef: case 0xff: this.pc = (this.pc - 1) & 0xffff; this.stopped = true; return 0; // SLEEP / STOP
    }
    throw new Error(`unhandled SPC700 opcode ${op.toString(16)}`);
  }
}

export const FLAGS = { N, V, P, B, H, I, Z, C };
export { CYCLES };
