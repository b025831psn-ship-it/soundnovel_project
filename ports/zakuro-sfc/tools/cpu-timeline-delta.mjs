// Align two CPU instruction traces by PC/opcode sequences and report changes
// in VM master time relative to the Snes9x pre-fetch boundary. Snes9x records
// after charging the opcode fetch; these ROM fetches cost eight master clocks.
// Usage: node tools/cpu-timeline-delta.mjs native.tsv vm.tsv [window]
import { readFile } from 'node:fs/promises';
const [nativePath, vmPath, windowArg = '10'] = process.argv.slice(2);
const window = Number(windowArg);
function parse(text) {
  return text.trimEnd().split('\n').slice(1).map((line) => {
    const [instruction, master, pc, opcode] = line.trim().split('\t');
    return { instruction: Number(instruction), master: Number(master), pc, opcode };
  });
}
const [native, vm] = await Promise.all([readFile(nativePath, 'utf8'), readFile(vmPath, 'utf8')]).then((v) => v.map(parse));
const key = (rows, i) => rows.slice(i, i + window).map((r) => `${r.pc}:${r.opcode}`).join(',');
const vmKeys = new Map();
for (let i = 0; i + window <= vm.length; i++) {
  const k = key(vm, i);
  if (!vmKeys.has(k)) vmKeys.set(k, i); else vmKeys.set(k, -1);
}
let lastDelta = null;
console.log('native_instruction\tnative_master\tvm_instruction\tvm_master\tpc\tdelta');
for (let i = 0; i + window <= native.length; i++) {
  const j = vmKeys.get(key(native, i));
  if (j == null || j < 0) continue;
  const delta = vm[j].master - (native[i].master - 8);
  if (delta !== lastDelta) {
    console.log([native[i].instruction, native[i].master - 8, vm[j].instruction, vm[j].master, native[i].pc, delta].join('\t'));
    lastDelta = delta;
  }
}
