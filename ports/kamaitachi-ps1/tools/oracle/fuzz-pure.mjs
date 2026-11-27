// Usage: node tools/oracle/fuzz-pure.mjs <dir>
// Calls side-effect-free library routines with many argument sets, natively and in JS.
import { readFileSync } from "node:fs";
import { LibsndOracle } from "./libsnd-oracle.mjs";
import { SoundLib, ADDR } from "../../sound/lib/index.js";

const [dir] = process.argv.slice(2);
const o = new LibsndOracle(readFileSync(dir + "/SLPS_017.94"));
const lib = new SoundLib(o.cpu);
let seed = 1; const rnd = (n) => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return (seed >>> 8) % n; };
const cases = {
  spuNoteToPitch: () => [rnd(128), rnd(128), rnd(128), rnd(128)],
};
let bad = 0;
for (const [name, gen] of Object.entries(cases)) {
  for (let i = 0; i < 20000; i++) {
    const args = gen();
    const a = o.cpu.call(ADDR[name], args) | 0, b = lib[name](...args) | 0;
    if (a !== b) { if (bad++ < 10) console.log(name, args, a, b); }
  }
}
console.log(JSON.stringify({ functions: Object.keys(cases), mismatches: bad }));
