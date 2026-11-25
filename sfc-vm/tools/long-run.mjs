#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SfcMachine } from '../machine.js';

const [romPath, apuModulePath, outputPath, targetArg = '20000', periodArg = '90', wramArg = '55'] = process.argv.slice(2);
if (!romPath || !apuModulePath || !outputPath) throw new Error(
  'usage: long-run.mjs ROM.sfc APU-MODULE output.tsv [frames=20000] [a-period=90] [wram-fill=55]',
);

const FNV_HI = 0x14650fb0, FNV_LO = 0x739d0383;
function fnvUpdate(state, byte) {
  const lo = (state[1] ^ byte) >>> 0;
  const product = lo * 435;
  state[1] = product >>> 0;
  state[0] = (state[0] * 435 + lo * 256 + Math.floor(product / 0x100000000)) >>> 0;
}
function fnv(bytes) {
  const state = [FNV_HI, FNV_LO];
  for (const byte of bytes) fnvUpdate(state, byte);
  return state;
}
const hex = ([hi, lo]) => hi.toString(16).padStart(8, '0') + lo.toString(16).padStart(8, '0');
const xorCount = ([hi, lo], count) => hex([(hi ^ Math.floor(count / 0x100000000)) >>> 0,
  (lo ^ (count >>> 0)) >>> 0]);

const { APU } = await import(pathToFileURL(apuModulePath));
const apu = new APU();
apu.powerOn();
const raw = [FNV_HI, FNV_LO], semantic = [FNV_HI, FNV_LO], lastRead = [null, null, null, null];
let rawCount = 0, semanticCount = 0, machine;
const rows = [];
let lastNmiPc = 0;
const target = Number(targetArg), period = Number(periodArg);

machine = new SfcMachine({
  rom: fs.readFileSync(romPath),
  apu,
  joypad: (frame) => period && frame > 300 && frame % period < 2 ? 0x0080 : 0,
  cpuOptions: { traceLimit: 0 },
  busOptions: {
    eventLimit: 0,
    apuTraceLimit: 0,
    wramInitialValue: Number.parseInt(wramArg, 16),
    onApuAccess: ({ direction, port, value }) => {
      const fields = [direction === 'w' ? 1 : 0, port, value];
      for (const byte of fields) fnvUpdate(raw, byte);
      rawCount++;
      const keep = direction === 'w' || lastRead[port] !== value;
      if (direction === 'r') lastRead[port] = value;
      if (keep) { for (const byte of fields) fnvUpdate(semantic, byte); semanticCount++; }
    },
  },
  onNmi: () => { lastNmiPc = machine.cpu.address(); },
  onFrame: (frame) => {
    rows.push([frame, hex(fnv(machine.bus.wram)), hex(fnv(machine.bus.vram)), hex(fnv(machine.bus.cgram)),
      hex(fnv(machine.bus.oam)), lastNmiPc.toString(16).padStart(6, '0'), xorCount(raw, rawCount),
      xorCount(semantic, semanticCount), rawCount].join('\t'));
    if (rows.length >= 100) {
      fs.appendFileSync(outputPath, `${rows.splice(0).join('\n')}\n`);
    }
  },
});

fs.writeFileSync(outputPath, 'frame\twram\tvram\tcgram\toam\tnmi_pc\tapu_raw\tapu_semantic\tapu_count\n');
let failure = null;
try {
  while (machine.frame < target) machine.step();
} catch (error) {
  failure = { frame: machine.frame, master: machine.master, pc: machine.cpu.address(),
    message: error instanceof Error ? error.message : String(error) };
}
if (rows.length) fs.appendFileSync(outputPath, `${rows.join('\n')}\n`);
console.log(JSON.stringify({ target, frame: machine.frame, master: machine.master, rawCount, semanticCount, failure }, null, 2));
if (failure) process.exitCode = 1;
