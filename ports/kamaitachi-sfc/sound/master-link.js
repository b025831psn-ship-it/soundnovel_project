// Connects the 65c816 VM's $2140-$2143 accesses to the APU on the master clock.
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
    this.runBefore(Math.ceil(this.target + this.rem / SPC_DEN - this.readLag));
    return this.apu.cpuRead(port);
  }
  write(master, port, value) {
    this.advanceTo(master);
    const due = Math.ceil(this.target + this.rem / SPC_DEN + this.writeLag);
    this.runBefore(Math.min(due, this.target));
    this.pending.push([due, port, value]);
  }
  sync(master) { this.advanceTo(master); this.runBefore(this.target); }
}
