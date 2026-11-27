// Usage: node tools/oracle/fuzz-malloc.mjs <dir> [rounds]
// Random SpuMalloc / SpuMallocWithStartAddr / SpuFree sequences, run on the original
// libspu and on the JS port (sound/lib/malloc.js); the malloc table and results must match.
import { readFileSync } from "node:fs";
import { LibsndOracle } from "./libsnd-oracle.mjs";
import { attachHybrid } from "./hybrid.mjs";

const [dir, roundsArg = "300"] = process.argv.slice(2);
const exe = readFileSync(dir + "/SLPS_017.94");
let seed = 12345; const rnd = (n) => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return (seed >>> 8) % n; };
const TABLE = 0x80100000, N = 17;
let bad = 0;
for (let round = 0; round < +roundsArg; round++) {
  const ops = [];
  const nops = 5 + rnd(30);
  for (let i = 0; i < nops; i++) {
    const k = rnd(3);
    ops.push(k === 0 ? ["m", rnd(4) ? rnd(0x20000) : rnd(0x80000)] : k === 1 ? ["s", 0x1000 + rnd(0x7f000), rnd(0x10000)] : ["f", rnd(16)]);
  }
  const reserved = rnd(3) === 0;
  const runs = [false, true].map((hy) => {
    const o = new LibsndOracle(exe);
    if (hy) attachHybrid(o, { only: ["SpuInitMalloc", "SpuMalloc", "SpuMallocWithStartAddr", "spuMallocSplit", "SpuFree", "spuMallocTidy"] });
    const c = o.cpu;
    c.write(0x80078cd8, 3, 4); c.write(0x80078ce0, 7, 4); // address shift and alignment as SpuInit leaves them
    c.write(0x80078848, reserved ? 1 : 0, 4); c.write(0x8007884c, 0xe000, 4);
    c.call(0x8005f3b8, [N, TABLE]);
    const got = [], addrs = [];
    for (const [k, a, b] of ops) {
      if (k === "m") { const r = c.call(0x8005f418, [a]); got.push(r); if (r !== -1) addrs.push(r); }
      else if (k === "s") { const r = c.call(0x8005fd48, [a, b]); got.push(r); if (r !== -1) addrs.push(r); }
      else { const x = addrs.length ? addrs[a % addrs.length] : a * 0x1000; c.call(0x8005fff8, [x]); got.push("f" + x); }
    }
    return { got: got.join(), ram: c.bytes(TABLE, (N + 2) * 8), glob: c.bytes(0x80078d10, 12) };
  });
  const [a, b] = runs;
  const same = a.got === b.got && a.ram.every((x, i) => x === b.ram[i]) && a.glob.every((x, i) => x === b.glob[i]);
  if (!same) { bad++; if (bad < 4) console.log(JSON.stringify({ round, ops, native: a.got, port: b.got })); }
}
console.log(JSON.stringify({ rounds: +roundsArg, mismatches: bad }));
