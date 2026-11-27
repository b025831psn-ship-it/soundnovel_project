import { readFileSync } from 'node:fs';
import { decryptSns, parseSns, iterate } from '../../engine/sns.js';
import { decodeControl } from '../../engine/vm.js';
const raw = readFileSync(process.argv[2]); const sns = parseSns(raw[0x10] === 0x43 ? decryptSns(raw) : raw);
const V = +process.argv[3];
for (const s of sns.scripts) { let lab = '';
  for (const x of iterate(s.bytes, s.codeStart)) { if (x.op === 0x56) lab = x.label;
    if (x.op === 0x57 || x.op === 0x58) { const d = decodeControl(x.op, x.arg); if (d.terms.some(t => t.a === V || t.b === V)) console.log('read', lab); }
    if ([0x4f,0x50,0x5c,0x5d].includes(x.op)) { const d = decodeControl(x.op, x.arg); if (d.v === V) console.log('write', lab, x.op.toString(16)); } } }
