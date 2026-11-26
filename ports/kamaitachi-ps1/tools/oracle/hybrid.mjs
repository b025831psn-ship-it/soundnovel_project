// Swap JS library routines (sound/lib) into the oracle one at a time. Ported routines
// replace the original at their address (hooks); routines not yet ported, or excluded,
// run the original code. Comparing the SPU log of a hybrid run with a pure native run
// checks each port against the original, register write for register write.
import { SoundLib, ADDR, NAME_AT } from "../../sound/lib/index.js";

export function attachHybrid(oracle, { only, exclude = [] } = {}) {
  const cpu = oracle.cpu;
  if (!Object.getOwnPropertyDescriptor(cpu, "sp")) Object.defineProperty(cpu, "sp", { get() { return this.r[29]; }, set(v) { this.r[29] = v | 0; } });
  const lib = new SoundLib(cpu);
  const native = (addr) => (...a) => cpu.call(addr, a.map((x) => x | 0));
  const used = [];
  for (const [name, addr] of Object.entries(ADDR)) {
    const ported = typeof SoundLib.prototype[name] === "function";
    const on = ported && (!only || only.includes(name)) && !exclude.includes(name);
    if (!on) { lib[name] = native(addr); continue; }
    used.push(name);
    cpu.hooks.set(addr >>> 0, (c) => {
      const r = c.r, sp = r[29];
      const args = [r[4], r[5], r[6], r[7]];
      for (let i = 4; i < 13; i++) args.push(c.read(sp + 4 * i, 4) | 0);
      const v = lib[name](...args);
      c.r[2] = v | 0; c.ret();
    });
  }
  lib.jalr = (addr, ...args) => { const n = NAME_AT.get(addr >>> 0); return n ? lib[n](...args) : cpu.call(addr, args.map((x) => x | 0)); };
  return { lib, used };
}
