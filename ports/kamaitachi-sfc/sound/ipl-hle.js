// High-level stand-in for the SPC700's 64-byte boot ROM, so the web build needs no chip
// firmware. It follows the documented IPL transfer protocol step by step, with the clock
// cost and port-read opcode of each step, so the main CPU sees every echo at the same
// time as on hardware. Register and memory effects match what the protocol leaves behind.
//
// Protocol (main CPU side, $2140-$2143): the SPC clears $01-$EF, shows $AA/$BB on ports
// 0/1 and waits for $CC on port 0. Each block then starts with a destination address on
// ports 2/3 and a kick on port 0 (port 1 non-zero = data, zero = jump there). Data bytes
// arrive on port 1 with a running index on port 0, which the SPC echoes back.
//
// Verified against a real-IPL run with tools/replay-link.mjs: same port writes, same
// driver entry clock, every CPU read from reset to frame 5700 equal.

const N = 0x80, Z = 0x02;

// Each step: [opcode whose timing and port-read point it uses, clocks, action].
// An action returns the next label, or undefined to fall through to the next step.
export class IplHle {
  constructor() { this.label = 'reset'; this.i = 0; this.done = false; }

  // Runs one step on `cpu` and returns the clocks it took.
  step(cpu) {
    const steps = IplHle.PROGRAM[this.label];
    const [op, clocks, act] = steps[this.i];
    cpu.curOp = op;
    const r = act(cpu, this);
    let extra = 0;
    if (r === undefined) { this.i++; if (this.i >= steps.length) { this.label = IplHle.NEXT[this.label]; this.i = 0; } }
    else if (typeof r === 'number') extra = r; // taken branch, label already set
    return clocks + extra;
  }
  go(label) { this.label = label; this.i = 0; return 2; } // a taken branch costs 2 more
}

const bne = (label) => (cpu, h) => (cpu.psw & Z) ? undefined : h.go(label);
const bpl = (label) => (cpu, h) => (cpu.psw & N) ? undefined : h.go(label);

IplHle.PROGRAM = {
  reset: [
    [0xcd, 2, (c) => { c.x = c.nz(0xef); }],
    [0xbd, 2, (c) => { c.sp = c.x; }],
    [0xe8, 2, (c) => { c.a = c.nz(0x00); }],
  ],
  clear: [
    [0xc6, 4, (c) => { c.write(c.dp | c.x, c.a); }],
    [0x1d, 2, (c) => { c.x = c.dec(c.x); }],
    [0xd0, 2, bne('clear')],
  ],
  ready: [
    [0x8f, 5, (c) => { c.writeDp(0xf4, 0xaa); }],
    [0x8f, 5, (c) => { c.writeDp(0xf5, 0xbb); }],
  ],
  waitCC: [
    [0x78, 5, (c) => { c.cmp(c.readDp(0xf4), 0xcc); }],
    [0xd0, 2, bne('waitCC')],
    [0x2f, 2, (c, h) => h.go('block')],
  ],
  waitZero: [
    [0xeb, 3, (c) => { c.y = c.nz(c.readDp(0xf4)); }],
    [0xd0, 2, bne('waitZero')],
  ],
  byte: [
    [0x7e, 3, (c) => { c.cmp(c.y, c.readDp(0xf4)); }],
    [0xd0, 2, bne('check')],
    [0xe4, 3, (c) => { c.a = c.nz(c.readDp(0xf5)); }],
    [0xcb, 4, (c) => { c.writeDp(0xf4, c.y); }],
    [0xd7, 7, (c) => { const p = c.readDp(0x00) | (c.readDp(0x01) << 8); c.write((p + c.y) & 0xffff, c.a); }],
    [0xfc, 2, (c) => { c.y = c.inc(c.y); }],
    [0xd0, 2, bne('byte')],
    [0xab, 4, (c) => { c.writeDp(0x01, c.inc(c.readDp(0x01))); }],
  ],
  check: [
    [0x10, 2, bpl('byte')],
    [0x7e, 3, (c) => { c.cmp(c.y, c.readDp(0xf4)); }],
    [0x10, 2, bpl('byte')],
  ],
  block: [
    [0xba, 5, (c) => { const v = c.readDpWord(0xf6); c.ya = v; c.nz16(v); }],
    [0xda, 5, (c) => { c.writeDp(0x00, c.a); c.writeDp(0x01, c.y); }],
    [0xba, 5, (c) => { const v = c.readDpWord(0xf4); c.ya = v; c.nz16(v); }],
    [0xc4, 4, (c) => { c.writeDp(0xf4, c.a); }],
    [0xdd, 2, (c) => { c.a = c.nz(c.y); }],
    [0x5d, 2, (c) => { c.x = c.nz(c.a); }],
    [0xd0, 2, bne('waitZero')],
    // JMP [!$0000+X]: 6 clocks plus the one the boot ROM's jump measures longer.
    [0x1f, 7, (c, h) => { c.pc = c.read(c.x) | (c.read((c.x + 1) & 0xffff) << 8); h.done = true; return 0; }],
  ],
};
IplHle.NEXT = { reset: 'clear', clear: 'ready', ready: 'waitCC', waitZero: 'byte', byte: 'check', check: 'block' };
