// Walk every script in a decrypted or encrypted to.sns and report sync + op census.
import { readFileSync } from 'node:fs';
import { decryptSns, parseSns, iterate } from '../engine/sns.js';
const raw = readFileSync(process.argv[2]);
const plain = raw[0x10] === 0x43 ? decryptSns(raw) : raw; // 'C' of the key at 0x10 means encrypted zeros
const { scripts } = parseSns(plain);
const census = new Map(); let texts = 0, bad = 0, labels = 0, jumps = [];
const all = new Set();
for (const s of scripts) for (const k of s.labels.keys()) all.add(k);
for (const s of scripts) {
  let last = null;
  for (const ins of iterate(s.bytes, s.codeStart)) {
    census.set(ins.op, (census.get(ins.op) || 0) + 1);
    if (ins.op === 1) texts++;
    if (ins.op === 0x56) labels++;
    if (ins.op === 0x59 && !all.has(ins.label)) jumps.push(`${s.name}:${ins.label}`);
    last = ins;
  }
  if (s.bytes.length - last.next > 1) { bad++; console.log('desync', s.name, last.next, s.bytes.length); }
}
console.log(JSON.stringify({ scripts: scripts.length, desync: bad, texts, labels, ops: census.size, missingJumpTargets: jumps.length, sample: jumps.slice(0, 5) }));
