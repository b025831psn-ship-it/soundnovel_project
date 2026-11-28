// Usage: node tools/oracle/fuzz-init.mjs <dir> [rounds]
// Random set-up sequences (SsInit, SsSetTableSize, SsSetTickMode, SsStart/SsEnd, serial
// attributes, mono/stereo, reverb type and delay, reserved voices, SsSeqOpen/SsSeqClose on generated SEQ headers),
// run on the original code and with sound/lib/init.js swapped in. SPU writes, other I/O
// writes, results and RAM must match. Covers paths the game itself never takes.
import { readFileSync } from "node:fs";
import { LibsndOracle } from "./libsnd-oracle.mjs";
import { attachHybrid } from "./hybrid.mjs";

const [dir, roundsArg = "200"] = process.argv.slice(2);
const exe = readFileSync(dir + "/SLPS_017.94");
let seed = 777; const rnd = (n) => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return (seed >>> 8) % n; };
const pick = (a) => a[rnd(a.length)];
const SEQS = 0x80140000;
const seqHeader = () => {
  const b = new Uint8Array(32);
  b.set([pick([0x70, 0x53, 0x41]), 0x51, 0x45, 0x53, 0, 0, 0, pick([1, 1, 1, 2])]);
  const res = pick([48, 96, 120, 480, 1 + rnd(0x7fff)]), tempo = pick([500000, 600000, 250000, 1 + rnd(0xffffff)]);
  b.set([res >> 8, res & 0xff, tempo >> 16, (tempo >> 8) & 0xff, tempo & 0xff, 4, 2, rnd(0x80), 0x90, 0x40, 0x7f, 0], 8);
  return b;
};
const INIT = ["SsInit", "SpuInit", "spuInitMode", "spuInitHw", "spuInitEvent", "ssInitVoices", "ssVoiceInit", "SsSetTableSize",
  "GetVideoMode", "SsSetTickMode", "SsStart", "ssStart", "rcntStop", "rcntSet", "SsEnd", "SsSetSerialAttr", "SsSetMono",
  "SsSetStereo", "SsSetReservedVoice", "SsSeqOpen", "seqOpenData", "SsSeqClose", "seqClose", "SsUtSetReverbDelay"];
let bad = 0;
const firstDiff = (x, y) => { const A = JSON.parse(x), B = JSON.parse(y); for (let i = 0; i < Math.max(A.length, B.length); i++) if (JSON.stringify(A[i]) !== JSON.stringify(B[i])) return [i, A[i], B[i]]; return null; };
for (let round = 0; round < +roundsArg; round++) {
  const vm = rnd(4) === 0 ? 1 : 0, nseq = 1 + rnd(4), nsub = 1 + rnd(4);
  const ops = [];
  for (let i = 0, n = 4 + rnd(16); i < n; i++) {
    const k = rnd(9);
    if (k === 0) ops.push(["tick", pick([0, 1, 2, 3, 4, 5, 6, 30, 69, 70, 120, 240, -1]) | (rnd(3) === 0 ? 0x1000 : 0)]);
    else if (k === 1) ops.push(["start"]);
    else if (k === 2) ops.push(["end"]);
    else if (k === 3) ops.push(["serial", rnd(2), rnd(2), pick([0, 1, 0x7f, 0xff])]); // other values leave the attr mask as stack garbage in the original
    else if (k === 4) ops.push([pick(["mono", "stereo"])]);
    else if (k === 5) ops.push(["voices", pick([0, 1, 12, 24, 25, 0x111, 0xff])]);
    else if (k === 6) ops.push(["open", rnd(8), rnd(4)]);
    else if (k === 7) ops.push(["close", rnd(nseq)]);
    else ops.push(["rev", pick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), rnd(0x80)]);
  }
  const headers = Array.from({ length: 8 }, seqHeader);
  const runs = [false, true].map((hy) => {
    const o = new LibsndOracle(exe);
    const io = [];
    const w = o.ioWrite.bind(o); o.ioWrite = (a, v, s) => { if (a < 0x1f801c00 || a >= 0x1f802000) io.push([a, v, s]); return w(a, v, s); };
    if (hy) attachHybrid(o, { only: INIT });
    const c = o.cpu;
    c.write(0x80078600, vm, 4);
    headers.forEach((h, i) => c.setBytes(SEQS + i * 32, h));
    const got = [];
    const call = (a, args = [], keep = false) => { const r = c.call(a, args); if (keep) got.push(r); }; // void routines leave junk in v0
    call(0x80055f28);
    call(0x80058ec8, [0x801fc568, nseq, nsub]);
    for (const [k, a, b, d] of ops) {
      if (k === "tick") call(0x800590e8, [a]);
      else if (k === "start") call(0x800589a8);
      else if (k === "end") call(0x80055d88);
      else if (k === "serial") call(0x800585b8, [a, b, d]);
      else if (k === "mono") call(0x8005e088);
      else if (k === "stereo") call(0x8005e098);
      else if (k === "voices") call(0x8005e0a8, [a], true);
      else if (k === "open") call(0x80055f58, [SEQS + a * 32, b], true);
      else if (k === "close") call(0x80055ba4, [a]);
      else { call(0x8005a638, [a]); call(0x8005a568, [b]); }
    }
    return { got: got.join(), log: JSON.stringify(o.log), io: JSON.stringify(io), ram: c.ram.subarray(0x78000, 0x1fef00) };
  });
  const [a, b] = runs;
  let ramDiff = -1;
  for (let i = 0; i < a.ram.length; i++) if (a.ram[i] !== b.ram[i]) { ramDiff = 0x80078000 + i; break; }
  const same = a.got === b.got && a.log === b.log && a.io === b.io && ramDiff < 0;
  if (!same) {
    bad++;
    if (bad < 4) console.log(JSON.stringify({ round, vm, nseq, nsub, ops, got: [a.got, b.got], log: a.log === b.log, firstLog: firstDiff(a.log, b.log), io: a.io === b.io, ramDiff: ramDiff < 0 ? null : "0x" + ramDiff.toString(16) }));
  }
}
console.log(JSON.stringify({ rounds: +roundsArg, mismatches: bad }));
