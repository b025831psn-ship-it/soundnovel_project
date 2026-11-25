// Runs Codex's VM over the whole reference run without stopping at the first mismatch.
// Records every APUIO access and the VM's state at the end, then compares the CPU-side
// write sequence (deterministic game actions) against the reference with resync, and
// reports timing drift per matched write. Usage:
//   node tools/vm-full-run.mjs <VM checkout: ports/zakuro-sfc of codex/27-zakuro-65c816-vm> <rom> <apu-ports.tsv> <ipl.bin> <out.json>
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [vmDir, romPath, tracePath, iplPath, outPath] = process.argv.slice(2);
const { createApuLink, readApuPorts, ZakuroVM } = await import(path.resolve(vmDir, 'vm/index.js'));
const [rom, reference, ipl] = await Promise.all([readFile(romPath), readApuPorts(tracePath), readFile(iplPath)]);
const endMaster = reference.at(-1).master + 21_477_272;
const FIELD = 357366;

const got = [];
const { link } = createApuLink({ rom, ipl });
const vm = new ZakuroVM({ rom, masterLink: link, trace(a) { got.push(a); } });
vm.reset();
const started = Date.now();
let instructions = 0, error = null, lastReport = 0;
const pcHist = new Map(); // PCs seen in the last window, for stuck-loop detection
try {
  while (!vm.cpu.stopped && vm.bus.clock.master < endMaster) {
    vm.step(); instructions++;
    if (vm.bus.clock.master - lastReport > 50 * FIELD) {
      lastReport = vm.bus.clock.master;
      console.error(`frame ~${Math.round(lastReport / FIELD)} / ${Math.round(endMaster / FIELD)}, ${got.length} accesses, ${((Date.now() - started) / 1000).toFixed(0)} s`);
    }
  }
} catch (e) { error = String(e?.stack ?? e); }
const pc = `${vm.cpu.PB.toString(16).padStart(2, '0')}:${vm.cpu.PC.toString(16).padStart(4, '0')}`;

// Write-sequence comparison with resync (writes are what the game decides; reads depend on APU timing).
const refW = reference.filter((r) => r.dir === 'w'), vmW = got.filter((r) => r.dir === 'w');
const key = (r) => `${r.port}:${r.value}`;
const sections = []; let i = 0, j = 0, matched = 0, maxDrift = 0;
const driftByFrame = [];
while (i < refW.length && j < vmW.length) {
  if (key(refW[i]) === key(vmW[j])) {
    const d = vmW[j].master - refW[i].master; maxDrift = Math.max(maxDrift, Math.abs(d));
    const f = Math.round(refW[i].master / FIELD);
    if (!driftByFrame.length || driftByFrame.at(-1).fields !== Math.round(d / FIELD)) driftByFrame.push({ refFrame: f, row: i, fields: Math.round(d / FIELD), master: d });
    i++; j++; matched++; continue;
  }
  // resync: find the nearest point where the next 8 writes agree again
  let best = null;
  for (let a = 0; a < 400 && !best; a++) for (let b = 0; b <= a && !best; b++) for (const [x, y] of [[a, b], [b, a]]) {
    if (i + x + 8 > refW.length || j + y + 8 > vmW.length) continue;
    let ok = true; for (let k = 0; k < 8 && ok; k++) ok = key(refW[i + x + k]) === key(vmW[j + y + k]);
    if (ok) { best = [x, y]; break; }
  }
  const s = { refWrite: i, vmWrite: j, refFrame: Math.round(refW[i].master / FIELD), refMaster: refW[i].master, vmMaster: vmW[j].master,
    ref: refW.slice(i, i + 6).map(key), vm: vmW.slice(j, j + 6).map(key) };
  if (!best) { s.resync = null; sections.push(s); break; }
  s.refSkipped = best[0]; s.vmSkipped = best[1]; sections.push(s);
  i += best[0]; j += best[1];
}
const result = {
  instructions, seconds: (Date.now() - started) / 1000, stopped: vm.cpu.stopped, error, pc,
  vmMaster: vm.bus.clock.master, endMaster, refRows: reference.length, vmAccesses: got.length,
  writes: { ref: refW.length, vm: vmW.length, matched, unmatchedRef: refW.length - matched, maxDriftMaster: maxDrift },
  sections: sections.slice(0, 50), sectionCount: sections.length, driftByFrame: driftByFrame.slice(0, 100),
};
await writeFile(outPath, JSON.stringify(result, null, 1));
console.log(JSON.stringify({ ...result, sections: result.sections.slice(0, 5), driftByFrame: result.driftByFrame.slice(0, 20) }, null, 1));
