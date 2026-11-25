// Run the VM from initialize_def and follow first choices; print a trace summary.
import { readFileSync } from 'node:fs';
import { decryptSns, parseSns } from '../engine/sns.js';
import { VM } from '../engine/vm.js';
const raw = readFileSync(process.argv[2]); const plain = raw[0x10] === 0x43 ? decryptSns(raw) : raw;
const sns = parseSns(plain); const vm = new VM(sns);
const start = process.argv[3] || 'initialize_def.xml';
vm.script = sns.scripts.find(s => s.name === start); vm.pc = vm.script.codeStart;
const opCount = new Map(); let texts = 0, choices = 0, steps = 0; const trail = [];
while (!vm.halted && steps < +(process.argv[4] || 200000)) {
  steps++; let e;
  try { e = vm.step(); } catch (err) { console.log('ERR', err.message, vm.script.name, vm.pc.toString(16)); break; }
  if (!e) continue;
  if (e.type === 'text') texts++;
  else if (e.type === 'choice') { choices++; trail.push(`${vm.script.name}@${vm.pc.toString(16)} choice ${e.options.map(o => o.label).join('|')}`); vm.choose(0); }
  else if (e.type === 'jump') trail.push(`${vm.script.name} ${e.label}`);
  else if (e.type === 'op') opCount.set(e.op, (opCount.get(e.op) || 0) + 1);
  else if (e.type === 'end') trail.push(`end ${vm.script.name}`);
}
console.log({ steps, texts, choices, at: `${vm.script.name}@${vm.pc.toString(16)}`, halted: vm.halted, flow: vm.flow.length });
console.log(trail.slice(0, 30).join('\n')); console.log('...'); console.log(trail.slice(-10).join('\n'));
console.log('ops', [...opCount].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => k.toString(16) + ':' + v).join(' '));
