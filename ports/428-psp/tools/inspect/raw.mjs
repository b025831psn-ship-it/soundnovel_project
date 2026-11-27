import { readFileSync } from 'node:fs';
import { decryptSns, parseSns, iterate } from '../../engine/sns.js';
const raw = readFileSync(process.argv[2]); const sns = parseSns(raw[0x10] === 0x43 ? decryptSns(raw) : raw);
const L = process.argv[3], before = +(process.argv[4]||10), after = +(process.argv[5]||10);
for (const s of sns.scripts) { if (!s.labels.has(L)) continue; const all=[...iterate(s.bytes, s.codeStart)]; const p=s.labels.get(L); const i=all.findIndex(x=>x.pc>=p);
 for (const x of all.slice(Math.max(0,i-before), i+after)) console.log(x.pc.toString(16), x.op.toString(16), x.op===1?'(text)':x.op===0x56?x.label:Buffer.from(x.arg||[]).toString('hex').slice(0,80)); }
