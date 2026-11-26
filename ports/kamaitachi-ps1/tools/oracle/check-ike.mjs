// Checks the ike port (src/screen/ike.js) against the original 0x800356c8 on every ike
// resource of BGD.PAC and every ike member of ANM.PAC. Usage: node check-ike.mjs <dir with SLPS_017.94 and the PACs>
// Prints only counts and the first differing offset; no game data is written.
import fs from "node:fs";
import { Mips } from "./mips.js";
import { ike } from "../../src/screen/ike.js";
const dir = process.argv[2];
const exe = fs.readFileSync(`${dir}/SLPS_017.94`);
const c = new Mips(); c.loadExe(exe); c.r[29] = 0x801ff000 | 0; c.r[28] = 0x8007913c | 0;
let skipped = 0;
const SRC = 0x80100000, DST = 0x80140000, N = 0x40000;
const ram = c.ram;
function check(buf, label) {
  if (buf[2] !== 0x69 || buf[3] !== 0x6b || buf[4] !== 0x65) { skipped++; return true; }
  ram.fill(0, SRC & 0x1fffff, (DST & 0x1fffff) + N); ram.set(buf.subarray(0, Math.min(buf.length, 0x40000)), SRC & 0x1fffff);
  const v = c.call(0x800356c8, [SRC | 0, DST | 0]) >>> 0;
  const want = ram.slice(DST & 0x1fffff, (DST & 0x1fffff) + N);
  ram.fill(0, DST & 0x1fffff, (DST & 0x1fffff) + N);
  const m = { read: (a, w) => c.read(a, w), write: (a, v, w) => c.write(a, v, w) };
  const got = ike(m, SRC, DST) >>> 0;
  const have = ram.slice(DST & 0x1fffff, (DST & 0x1fffff) + N);
  let diff = -1; for (let i = 0; i < N; i++) if (want[i] !== have[i]) { diff = i; break; }
  if (diff >= 0 || (v & 0xffff) !== got) { console.log("DIFF", label, "ret", v, got, "at", diff); return false; }
  return true;
}
let ok = 0, bad = 0;
const pac = (name) => { const d = fs.readFileSync(`${dir}/${name}`); const e = []; for (let i = 0; ; i++) { const id = d.readUInt16LE(4 * i), s = d.readUInt16LE(4 * i + 2); if (i && id === 0 && s === 0) break; e.push(s); if (e.length > 5000) break; } return { d, e }; };
const bgd = pac("BGD.PAC");
const lim = Number(process.argv[3] || 1e9);
for (let i = 1; i < bgd.e.length - 1 && i < lim; i++) { const r = bgd.d.subarray(bgd.e[i] * 2048, bgd.e[i + 1] * 2048); if (!r.length) continue; check(r, `BGD ${i}`) ? ok++ : bad++; }
console.log("BGD ok", ok, "bad", bad);
const anm = pac("ANM.PAC"); let ok2 = 0, bad2 = 0;
for (let i = 1; i < anm.e.length - 1 && i < lim; i++) {
  const r = anm.d.subarray(anm.e[i] * 2048, anm.e[i + 1] * 2048); if (r.length < 8) continue;
  const n = r.readUInt32BE(0); if (n > 500) continue;
  for (let k = 0; k < n; k++) { const off = r.readUInt32BE(4 + 8 * k); if (off >= r.length) break; check(r.subarray(off), `ANM ${i}.${k}`) ? ok2++ : bad2++; }
}
console.log("ANM ok", ok2, "bad", bad2, "skipped(not ike)", skipped);
