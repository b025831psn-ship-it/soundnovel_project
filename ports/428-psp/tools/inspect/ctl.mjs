// print control ops from a label (no text): node ctl.mjs to.sns LABEL [n]
import { readFileSync } from 'node:fs';
import { decryptSns, parseSns, iterate } from '../../engine/sns.js';
import { decodeControl } from '../../engine/vm.js';
const raw = readFileSync(process.argv[2]); const sns = parseSns(raw[0x10] === 0x43 ? decryptSns(raw) : raw);
const L = process.argv[3], N = +(process.argv[4] || 80);
for (const s of sns.scripts) { if (!s.labels.has(L)) continue;
  let k = 0;
  for (const x of iterate(s.bytes, s.labels.get(L))) {
    if (x.op === 1) continue;
    let d = ''; if ([0x4f,0x50,0x52,0x53,0x54,0x55,0x57,0x58,0x59,0x5a,0x5c,0x5d].includes(x.op)) { try { d = JSON.stringify(decodeControl(x.op, x.arg)); } catch (e) { d = 'ERR'; } }
    if (x.op === 0x56) d = x.label;
    if ([0x4f,0x50,0x52,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x5b,0x5c,0x5d,0xac,0xbb,0x85,0x86,0x23].includes(x.op)) console.log(x.op.toString(16), d.slice(0, 260));
    if (++k > N * 20 || x.op === 0xac) break;
  }
  break; }
