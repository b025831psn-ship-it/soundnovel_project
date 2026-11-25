// Connects the 65c816 VM's $2140-$2143 accesses to the APU on the master clock.
// Contract (kamaitachi-sfc-kor docs/apu-vm-contract.md): VM time is the integer SNES
// master clock from reset; master -> SPC uses 15664/328125 with the remainder carried.
//
// Port timing, measured on the Snes9x trace (kamaitachi-sfc-kor 76b42db, every value
// change from reset to frame 5700) with T = the exact SPC time of a CPU access and s = the
// start clock of an SPC700 instruction:
// - a CPU read at T sees an SPC port write from the instruction at s iff s + 1 < T
//   (34,886 changes; last miss T - s = 0.99997, first hit 1.00003);
// - an SPC instruction at s sees a CPU write at T once s >= T + WRITE_LAG. This side is
//   not a single constant in the trace: the same 4-clock port reads miss at s - T = 2.02
//   and 2.22 after `$00:E778 STA $2140` but hit at 2.22 after another store, so the
//   logged CPU time is not always the bus write cycle. 2.1 is the value that replays the
//   CPU log furthest (to frame 59) until the log gives each access's opcode.
export const SPC_NUM = 15664, SPC_DEN = 328125;
export const READ_LAG = 1, WRITE_LAG = 2.1;

export class MasterLink {
  constructor(apu, { master = 0, readLag = READ_LAG, writeLag = WRITE_LAG } = {}) {
    this.apu = apu; this.master = master; this.rem = 0; this.target = apu.cpu.clock;
    this.readLag = readLag; this.writeLag = writeLag; this.pending = [];
  }
  advanceTo(master) {
    if (master < this.master) throw new Error(`master clock went backwards: ${master} < ${this.master}`);
    const x = (master - this.master) * SPC_NUM + this.rem;
    this.target += Math.floor(x / SPC_DEN); this.rem = x % SPC_DEN; this.master = master;
  }
  // Runs every SPC instruction that starts before `end` (integer SPC clock), applying CPU
  // writes that have become visible.
  runBefore(end) {
    const cpu = this.apu.cpu, q = this.pending;
    for (;;) {
      while (q.length && q[0][0] <= cpu.clock) { const [, p, v] = q.shift(); this.apu.cpuWrite(p, v); }
      if (cpu.clock >= end) break;
      cpu.step();
    }
  }
  read(master, port) {
    this.advanceTo(master);
    // every instruction with s + readLag < T has run
    this.runBefore(Math.ceil(this.target + this.rem / SPC_DEN - this.readLag));
    return this.apu.cpuRead(port);
  }
  write(master, port, value) {
    this.advanceTo(master);
    // instructions with s >= T + writeLag see the write
    const due = Math.ceil(this.target + this.rem / SPC_DEN + this.writeLag);
    this.runBefore(Math.min(due, this.target));
    this.pending.push([due, port, value]);
  }
  // Runs the APU up to the VM's current time (for audio output between port accesses).
  sync(master) { this.advanceTo(master); this.runBefore(this.target); }
}
