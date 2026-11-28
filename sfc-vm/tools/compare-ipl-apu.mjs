#!/usr/bin/env node
import fs from 'node:fs';

const [nativePath, vmPath, outputPath, limitArg = '20006'] = process.argv.slice(2);
if (!nativePath || !vmPath || !outputPath) throw new Error(
  'usage: compare-ipl-apu.mjs native-apu-ports-pc.tsv vm-apu.tsv output.tsv [write-limit]',
);

function writes(path, native) {
  return fs.readFileSync(path, 'utf8').trim().split('\n').slice(1).map((line) => line.split('\t'))
    .filter((row) => row[native ? 5 : 2] === 'w')
    .map((row) => native ? {
      master: Number(row[4]), pc: row[2], opcode: row[3], port: row[6], value: row[7],
    } : {
      master: Number(row[1]), pc: row[5], opcode: row[6], port: row[3], value: row[4],
    });
}

const native = writes(nativePath, true), vm = writes(vmPath, false);
const limit = Math.min(Number(limitArg), native.length, vm.length);
const lines = ['write_row\tnative_master\tnative_pc\tnative_opcode\tvm_master\tvm_pc\tvm_opcode\tdelta_before\tdelta_after'];
let previous = null;
for (let i = 0; i < limit; i++) {
  if (native[i].port !== vm[i].port || native[i].value !== vm[i].value) {
    throw new Error(`write ${i}: native p${native[i].port}=${native[i].value}, VM p${vm[i].port}=${vm[i].value}`);
  }
  const delta = vm[i].master - native[i].master;
  if (previous === null || delta !== previous) lines.push([
    i, native[i].master, native[i].pc, native[i].opcode,
    vm[i].master, vm[i].pc, vm[i].opcode, previous ?? '', delta,
  ].join('\t'));
  previous = delta;
}
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
console.log(JSON.stringify({ comparedWrites: limit, deltaChanges: lines.length - 1, finalDelta: previous }, null, 2));
