// Runs the VM through the complete native trace and reports write-sequence divergences.
// Usage: node tools/vm-full-run.mjs <vm-dir> <rom> <apu-ports.tsv> <ipl.bin> <out.json>
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [vmDir, romPath, tracePath, iplPath, outPath] = process.argv.slice(2);
const { createApuLink, readApuPorts, readInputTrace, ZakuroVM } = await import(pathToFileURL(resolve(vmDir, 'vm/index.js')));
const { readProgramData } = await import(pathToFileURL(resolve(vmDir, 'tools/program-data.mjs')));
const useProgramData = romPath.endsWith('.json') || romPath.endsWith('program');
const [image, reference, ipl, inputFrames, powerOnDsp] = await Promise.all([
  useProgramData ? readProgramData(romPath.endsWith('.json') ? dirname(romPath) : romPath) : readFile(romPath),
  readApuPorts(tracePath), readFile(iplPath),
  readInputTrace(join(dirname(tracePath), 'input.tsv')),
  readFile(join(dirname(tracePath), '..', 'sound', 'boot-dsp.bin')),
]);
const endMaster = reference.at(-1).master + 21_477_272;
const FIELD = 357366;
const got = [];
const programReads = process.env.ZAKURO_PROGRAM_OUT ? new Set() : null;
const { link } = createApuLink({ ipl, powerOnDsp });
const inputFrameOffset = Number(process.env.ZAKURO_INPUT_OFFSET ?? 1);
const vm = new ZakuroVM({ ...(useProgramData ? { program: image, sram: image.sram } : { rom: image }), masterLink: link, inputFrames, inputFrameOffset, onProgramRead: programReads ? offset => programReads.add(offset) : null, trace(access) { got.push(access); } });
vm.reset();
const started = Date.now();
let instructions = 0, error = null, lastReport = 0;
try {
  while (!vm.cpu.stopped && vm.bus.clock.master < endMaster) {
    vm.step(); instructions++;
    if (vm.bus.clock.master - lastReport > 50 * FIELD) {
      lastReport = vm.bus.clock.master;
      console.error(`frame ~${Math.round(lastReport / FIELD)} / ${Math.round(endMaster / FIELD)}, ${got.length} accesses, ${((Date.now() - started) / 1000).toFixed(0)} s`);
    }
  }
} catch (caught) { error = String(caught?.stack ?? caught); }
const pc = `${vm.cpu.PB.toString(16).padStart(2, '0')}:${vm.cpu.PC.toString(16).padStart(4, '0')}`;
const refW = reference.filter(row => row.dir === 'w');
const vmW = got.filter(row => row.dir === 'w');
const key = row => `${row.port}:${row.value.toString(16).padStart(2, '0')}`;
const sections = [], driftByFrame = [];
let i = 0, j = 0, matched = 0, maxDrift = 0;
while (i < refW.length && j < vmW.length) {
  if (key(refW[i]) === key(vmW[j])) {
    const delta = vmW[j].master - refW[i].master;
    maxDrift = Math.max(maxDrift, Math.abs(delta));
    const frame = Math.round(refW[i].master / FIELD), fields = Math.round(delta / FIELD);
    if (!driftByFrame.length || driftByFrame.at(-1).fields !== fields) {
      driftByFrame.push({ refFrame: frame, row: i, fields, master: delta });
    }
    i++; j++; matched++; continue;
  }
  let best = null;
  for (let distance = 0; distance < 400 && !best; distance++) {
    for (let offset = 0; offset <= distance && !best; offset++) {
      for (const [x, y] of [[distance, offset], [offset, distance]]) {
        if (i + x + 8 > refW.length || j + y + 8 > vmW.length) continue;
        if (Array.from({ length: 8 }, (_, k) => key(refW[i + x + k]) === key(vmW[j + y + k])).every(Boolean)) {
          best = [x, y]; break;
        }
      }
    }
  }
  const section = {
    refWrite: i, vmWrite: j, refFrame: Math.round(refW[i].master / FIELD),
    refMaster: refW[i].master, vmMaster: vmW[j].master,
    ref: refW.slice(i, i + 6).map(key), vm: vmW.slice(j, j + 6).map(key),
    refDetail: refW.slice(i, i + 6), vmDetail: vmW.slice(j, j + 9),
  };
  if (!best) { section.resync = null; sections.push(section); break; }
  section.refSkipped = best[0]; section.vmSkipped = best[1]; sections.push(section);
  i += best[0]; j += best[1];
}
const result = {
  instructions, seconds: (Date.now() - started) / 1000, stopped: vm.cpu.stopped, error, pc, inputFrameOffset,
  vmMaster: vm.bus.clock.master, endMaster, refRows: reference.length, vmAccesses: got.length,
  writes: { ref: refW.length, vm: vmW.length, matched, unmatchedRef: refW.length - matched, maxDriftMaster: maxDrift },
  sections: sections.slice(0, 50), sectionCount: sections.length, driftByFrame: driftByFrame.slice(0, 100),
};
if (programReads) {
  const directory = resolve(process.env.ZAKURO_PROGRAM_OUT);
  await mkdir(directory, { recursive: true });
  const offsets = [...programReads].sort((a, b) => a - b);
  const spans = [];
  for (const offset of offsets) {
    const last = spans.at(-1);
    if (last && offset <= last.end + 256) last.end = offset + 1;
    else spans.push({ offset, end: offset + 1 });
  }
  const ranges = [];
  for (const [index, span] of spans.entries()) {
    const data = image.subarray(span.offset, span.end);
    const file = `range-${String(index).padStart(3, '0')}.bin`;
    await writeFile(join(directory, file), data);
    ranges.push({ offset: span.offset, length: data.length, file, sha256: createHash('sha256').update(data).digest('hex') });
  }
  const exponent = image[0x7fd8];
  const sram = exponent ? { size: 1 << (exponent + 10), fill: 0x60 } : null;
  await writeFile(join(directory, 'manifest.json'), `${JSON.stringify({ format: 1, mapping: 'LoROM-linear', sourceSha256: createHash('sha256').update(image).digest('hex'), ...(sram ? { sram } : {}), ranges }, null, 2)}\n`);
  result.programRanges = ranges.length;
  result.programBytes = ranges.reduce((sum, range) => sum + range.length, 0);
}
await writeFile(outPath, JSON.stringify(result, null, 1));
console.log(JSON.stringify({ ...result, sections: result.sections.slice(0, 5), driftByFrame: result.driftByFrame.slice(0, 20) }, null, 1));
