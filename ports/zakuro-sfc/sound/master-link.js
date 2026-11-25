// Connects the 65c816 VM's $2140-$2143 accesses to the APU on the master clock.
// Contract (kamaitachi-sfc-kor docs/apu-vm-contract.md): VM time is the integer SNES
// master clock from reset (the start of the bus access); master -> SPC uses
// 15664/328125 with the remainder carried.
//
// Port timing, measured on the Snes9x trace (kamaitachi-sfc-kor 76b42db/cb6c30c, every
// value change from reset to frame 5700). T is the exact SPC time of the CPU bus access,
// s the start clock of an SPC700 instruction:
// - a CPU read sees an SPC port write from the instruction at s iff s + 1 < T
//   (34,886 changes; last miss T - s = 0.99997, first hit 1.00003);
// - an SPC port read at s sees a CPU write iff s + READ_POINT[opcode] >= T. The driver
//   polls with MOV A,!$F4 (E5: miss at s - T = -0.159, hit at +0.003) and
//   CMP A,!$F4 (65: miss at +2.975, hit at +3.095). Other opcodes use 0.
export const SPC_NUM = 15664, SPC_DEN = 328125;
export const READ_LAG = 1;
export const READ_POINT = new Int8Array(256);
READ_POINT[0x65] = -3;

export class MasterLink {
  constructor(apu, { master = 0, readLag = READ_LAG, readPoint = READ_POINT, writeHold = 3, writeLag = null } = {}) {
    this.apu = apu; this.master = master; this.rem = 0; this.target = apu.cpu.clock;
    this.readLag = readLag; this.readPoint = readPoint; this.writeHold = writeHold; this.writeLag = writeLag; this.pending = [];
    apu.cpu.onPortRead = (s, op) => this.deliver(s + this.readPoint[op]);
  }
  get time() { return this.target + this.rem / SPC_DEN; }
  advanceTo(master) {
    if (master < this.master) throw new Error(`master clock went backwards: ${master} < ${this.master}`);
    const x = (master - this.master) * SPC_NUM + this.rem;
    this.target += Math.floor(x / SPC_DEN); this.rem = x % SPC_DEN; this.master = master;
  }
  // Applies CPU writes made at or before SPC time `at`, in order.
  deliver(at) {
    const q = this.pending;
    while (q.length && q[0][0] <= at) { const [, p, v] = q.shift(); this.apu.cpuWrite(p, v); }
  }
  // Runs every SPC instruction that starts before `end` (integer SPC clock).
  runBefore(end) {
    const cpu = this.apu.cpu;
    while (cpu.clock < end) cpu.step();
  }
  // Runs instructions while s + lag(next opcode) < T. `writeLag[op]` (0 = use readLag) is
  // how long after its start an instruction's port write becomes visible to the CPU.
  runWhileBefore(T) {
    const cpu = this.apu.cpu;
    for (;;) {
      const lag = this.writeLag[cpu.read(cpu.pc)] || this.readLag;
      if (!(cpu.clock + lag < T)) break;
      cpu.step();
    }
  }
  read(master, port) {
    this.advanceTo(master);
    if (this.writeLag) this.runWhileBefore(this.time); // per-opcode lag of the next instruction
    else this.runBefore(Math.ceil(this.time - this.readLag)); // every s with s + readLag < T
    return this.apu.cpuRead(port);
  }
  write(master, port, value) {
    this.advanceTo(master);
    // SPC instructions starting after T - writeHold may still read the old value
    // (CMP A,!$F4 above); writeHold must cover the largest readPoint.
    this.runBefore(Math.ceil(this.time) - this.writeHold);
    this.pending.push([this.time, port, value]);
  }
  // Runs the APU up to the VM's current time (for audio output between port accesses).
  // It stops `writeHold` clocks short and leaves pending writes queued: an access the VM
  // makes right after this point must still find the APU as read() and write() expect
  // (instructions near T not yet run, the old latch value for reads with s + point < T).
  sync(master) { this.advanceTo(master); this.runBefore(Math.ceil(this.time) - this.writeHold); }
}
