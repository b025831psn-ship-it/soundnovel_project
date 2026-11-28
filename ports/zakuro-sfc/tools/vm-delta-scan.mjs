// Runs the VM (codex/27-zakuro-65c816-vm checkout) to a given APUIO row and prints the per-row
// master-clock delta against the reference: where it first leaves 0 and every change after.
// Usage: node tools/vm-delta-scan.mjs <VM ports/zakuro-sfc> <rom> <apu-ports.tsv> <ipl.bin> [stopRow]
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const [vmDir, romPath, tracePath, iplPath, stopRow = '66440'] = process.argv.slice(2);
const { createApuLink, readApuPorts, readInputTrace, ZakuroVM } = await import(pathToFileURL(resolve(vmDir, 'vm/index.js')));
const [rom, ref, ipl, inputFrames, powerOnDsp] = await Promise.all([readFile(romPath), readApuPorts(tracePath), readFile(iplPath),
  readInputTrace(join(dirname(tracePath), 'input.tsv')), readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin'))]);
const { link } = createApuLink({ ipl, powerOnDsp });
const got = [];
const pcs = [];
const vm = new ZakuroVM({ rom, masterLink: link, inputFrames, trace(a) { got.push({ ...a, pc: (vm.cpu.PB << 16) | vm.cpu.PC }); } });
vm.reset();
while (got.length < Number(stopRow) && !vm.cpu.stopped) vm.step();
let last = 0;
for (let i = 0; i < got.length; i++) {
  const r = ref[i], g = got[i], d = g.master - r.master, same = r.dir === g.dir && r.port === g.port && r.value === g.value;
  if (d !== last || !same) {
    console.log(`#${i + 1} frame ${Math.round(r.master / 357366)} ref ${r.dir}${r.port}=${r.value.toString(16)} @${r.master}  vm ${g.dir}${g.port}=${g.value.toString(16)} @${g.master}  delta ${d}  pc ${g.pc.toString(16)}${same ? '' : '  VALUE DIFF'}`);
    last = d;
    if (!same) break;
  }
}
