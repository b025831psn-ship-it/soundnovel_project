// Connects the 65c816 VM's $2140-$2143 accesses to the APU on the master clock.
// Kept byte-for-byte compatible with the implementation developed on PR #24.
export const SPC_NUM = 15664, SPC_DEN = 328125;

export class MasterLink {
  constructor(apu, { master = 0 } = {}) {
    this.apu = apu;
    this.master = master;
    this.rem = 0;
    this.target = apu.cpu.clock;
  }

  advanceTo(master) {
    if (master < this.master) throw new Error(`master clock went backwards: ${master} < ${this.master}`);
    const converted = (master - this.master) * SPC_NUM + this.rem;
    this.target += Math.floor(converted / SPC_DEN);
    this.rem = converted % SPC_DEN;
    this.master = master;
    const cpu = this.apu.cpu;
    while (cpu.clock < this.target) cpu.step();
  }

  read(master, port) {
    this.advanceTo(master);
    return this.apu.cpuRead(port);
  }

  write(master, port, value) {
    this.advanceTo(master);
    this.apu.cpuWrite(port, value);
  }
}
