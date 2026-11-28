// Compare the instruction boundary that contains each VBlank edge with the
// first NMI-handler instruction in reference and VM CPU traces.
// Usage: node tools/nmi-field-table.mjs native.tsv vm.tsv [firstField] [lastField]
import { readFile } from 'node:fs/promises';
import { vblankBoundary } from '../vm/master-clock.js';

const [nativePath, vmPath, firstArg = '71', lastArg = '316'] = process.argv.slice(2);
if (!nativePath || !vmPath) {
  console.error('usage: node tools/nmi-field-table.mjs native.tsv vm.tsv [firstField] [lastField]');
  process.exit(2);
}

function parse(text) {
  return text.trimEnd().split('\n').slice(1).map((line) => {
    const [instruction, master, pc, opcode] = line.trim().split('\t');
    return { instruction: Number(instruction), master: Number(master), pc, opcode };
  });
}

function rowAt(rows, edge, cursor) {
  while (cursor + 1 < rows.length && rows[cursor + 1].master <= edge) cursor++;
  const edgeRow = rows[cursor];
  let nmi = cursor + 1;
  while (nmi < rows.length && rows[nmi].pc !== '008cd8') nmi++;
  return { cursor, edgeRow, nmiRow: rows[nmi], count: nmi - cursor };
}

const [native, vm] = await Promise.all([readFile(nativePath, 'utf8'), readFile(vmPath, 'utf8')]).then((v) => v.map(parse));
const first = Number(firstArg), last = Number(lastArg);
let ni = 0, vi = 0;
console.log('field\tedge\tnative_edge_pc\tnative_edge_start\tnative_nmi\tnative_count\tvm_edge_pc\tvm_edge_start\tvm_nmi\tvm_count\tnmi_delta');
for (let field = first; field <= last; field++) {
  const edge = vblankBoundary(field);
  while (ni + 1 < native.length && native[ni + 1].master <= edge) ni++;
  while (vi + 1 < vm.length && vm[vi + 1].master <= edge) vi++;
  if (native[ni]?.master > edge || vm[vi]?.master > edge) continue;
  const n = rowAt(native, edge, ni), v = rowAt(vm, edge, vi);
  const nEntry = n.nmiRow?.master ?? '', vEntry = v.nmiRow?.master ?? '';
  const delta = nEntry !== '' && vEntry !== '' ? vEntry - nEntry : '';
  console.log([field, edge, n.edgeRow?.pc ?? '', n.edgeRow?.master ?? '', nEntry, n.nmiRow ? n.count : '',
    v.edgeRow?.pc ?? '', v.edgeRow?.master ?? '', vEntry, v.nmiRow ? v.count : '', delta].join('\t'));
}
