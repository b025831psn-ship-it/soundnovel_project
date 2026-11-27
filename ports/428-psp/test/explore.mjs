// Static control-flow explorer for 428 PSP to.sns.
// Follows fall-through, 52/59 goto, 57/58 conditional goto (both edges), 53/54/55 choices,
// and every label name embedded in other ops (ZAP/HINT/THREAD/TIP links). Reports unreachable
// labels, unresolved targets, ops never seen with semantics, and end-of-flow points.
import { readFileSync } from 'node:fs';
import { decryptSns, parseSns, iterate } from '../engine/sns.js';
const raw = readFileSync(process.argv[2]);
const plain = raw[0x10] === 0x43 ? decryptSns(raw) : raw;
const { scripts } = parseSns(plain);
const where = new Map(); const dup = [];
for (const s of scripts) for (const [name, pc] of s.labels) {
  if (where.has(name)) dup.push(name); else where.set(name, { s, pc });
}
const KNOWN = new Set([0x01,0x02,0x1c,0x1d,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x4f,0x50]);
// decode helpers
const cstrs = arg => { const out = []; let cur = ''; for (const b of arg) { if (b >= 0x20 && b < 0x7f) cur += String.fromCharCode(b); else { if (cur.length >= 4) out.push(cur); cur = ''; } } if (cur.length >= 4) out.push(cur); return out; };
const ins = new Map(); // script -> array of instructions
for (const s of scripts) ins.set(s.name, [...iterate(s.bytes, s.codeStart)]);
const idxOf = new Map(); for (const s of scripts) { const m = new Map(); ins.get(s.name).forEach((x, i) => m.set(x.pc, i)); idxOf.set(s.name, m); }
const visited = new Set(); const unresolved = new Map(); const ends = new Map(); const linkOps = new Map();
const queue = [];
const push = (s, pc) => { const k = s.name + ':' + pc; if (!visited.has(k)) { visited.add(k); queue.push([s, pc]); } };
const goLabel = (name, from) => { const t = where.get(name); if (!t) { unresolved.set(name, from); return; } push(t.s, t.pc); };
// entry points: every *_RESTART label and first instruction of each script (scripts are entered from menus)
for (const s of scripts) { push(s, s.codeStart); for (const n of s.labels.keys()) if (/RESTART$/.test(n)) push(s, s.labels.get(n)); }
let steps = 0;
while (queue.length) {
  const [s, pc0] = queue.pop(); const list = ins.get(s.name); let i = idxOf.get(s.name).get(pc0);
  if (i === undefined) { unresolved.set(`${s.name}@${pc0}`, 'mid-instruction'); continue; }
  for (; i < list.length; i++) {
    const x = list[i]; steps++;
    const k = s.name + ':' + x.pc; if (i !== idxOf.get(s.name).get(pc0) && visited.has(k)) break; visited.add(k);
    const from = `${s.name}@${x.pc.toString(16)}`;
    if (x.op === 0x52 || x.op === 0x59) { goLabel(x.label ?? cstrs(x.arg)[0], from); break; }
    if (x.op === 0x57 || x.op === 0x58) { const n = cstrs(x.arg).pop(); goLabel(n, from); continue; }
    if (x.op >= 0x53 && x.op <= 0x55) { for (const n of cstrs(x.arg)) goLabel(n, from); break; }
    if (!KNOWN.has(x.op) && x.arg) { const names = cstrs(x.arg).filter(n => where.has(n) || /^[A-Z]\d\d[A-Z]_\d{4}/.test(n)); if (names.length) { linkOps.set(x.op, (linkOps.get(x.op) || 0) + 1); for (const n of names) goLabel(n, from); } }
  }
}
const allLabels = [...where.keys()];
const unreachedLabels = allLabels.filter(n => { const t = where.get(n); return !visited.has(t.s.name + ':' + t.pc); }).map(n => `${where.get(n).s.name}:${n}`);
console.log(JSON.stringify({ scripts: scripts.length, labels: allLabels.length, duplicateLabels: dup.length, dupSample: dup.slice(0, 5), visitedInstructions: visited.size, steps, ends: ends.size, unresolved: unresolved.size, unresolvedSample: [...unresolved].slice(0, 10), linkOps: Object.fromEntries([...linkOps].map(([k, v]) => [k.toString(16), v])), unreachedLabels: unreachedLabels.length, unreachedSample: unreachedLabels.slice(0, 15) }, null, 1));
