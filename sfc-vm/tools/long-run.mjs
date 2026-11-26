#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SfcMachine } from '../machine.js';

const [romPath, apuModulePath, outputPath, targetArg = '20000', periodArg = '90', wramArg = '55', joypadPath = '', renderArg = '1', pixelDumpPath = '', registerDumpPath = ''] = process.argv.slice(2);
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
const blankFramebuffer = new Uint8ClampedArray(256 * 224 * 4);
for (let index = 3; index < blankFramebuffer.length; index += 4) blankFramebuffer[index] = 255;
let framebufferHash = hex(fnv(blankFramebuffer));
let lastFramebuffer = null;
const target = Number(targetArg), period = Number(periodArg);
const renderFrames = renderArg !== '0';
const pixelFd = pixelDumpPath ? fs.openSync(pixelDumpPath, 'w') : null;
const registerRows = [];
if (registerDumpPath) fs.writeFileSync(registerDumpPath,
  'nmi\t2100\t2105\t212c\t212d\t212e\t212f\t2130\t2131\t2132\t2133\t420c\thdma_43x0_43x4\tbg_hofs_vofs\n');
const recordedJoypad = new Map();
if (joypadPath) for (const line of fs.readFileSync(joypadPath, 'utf8').trim().split('\n').slice(1)) {
  const [frameText,, addressText, valueText] = line.split('\t');
  const frame = Number(frameText), shift = Number.parseInt(addressText, 16) === 0x4219 ? 8 : 0;
  recordedJoypad.set(frame, (recordedJoypad.get(frame) ?? 0) | (Number.parseInt(valueText, 16) << shift));
}

machine = new SfcMachine({
  rom: fs.readFileSync(romPath),
  apu,
  joypad: (nmi, frame) => joypadPath ? (recordedJoypad.get(frame) ?? 0)
    : period && nmi > 300 && nmi % period < 2 ? 0x0080 : 0,
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
  onNmiVector: (nmi, frame) => {
    if (pixelFd !== null) fs.writeSync(pixelFd, machine.framebuffer ?? blankFramebuffer);
    rows.push([nmi, frame, hex(fnv(machine.bus.wram)), hex(fnv(machine.bus.vram)), hex(fnv(machine.bus.cgram)),
      hex(fnv(machine.bus.oam)), lastNmiPc.toString(16).padStart(6, '0'), xorCount(raw, rawCount),
      xorCount(semantic, semanticCount), rawCount, framebufferHash].join('\t'));
    if (registerDumpPath) {
      const addresses = [0x2100, 0x2105, 0x212c, 0x212d, 0x212e, 0x212f, 0x2130, 0x2131, 0x2132, 0x2133, 0x420c];
      const values = addresses.map((address) => machine.bus.io[address - 0x2000].toString(16).padStart(2, '0'));
      const hdma = [];
      for (let channel = 0; channel < 8; channel++) for (let reg = 0; reg < 5; reg++)
        hdma.push(machine.bus.io[0x4300 + channel * 0x10 + reg - 0x2000].toString(16).padStart(2, '0'));
      const scroll = [];
      for (let bg = 0; bg < 4; bg++) scroll.push(machine.bus.bgHofs[bg], machine.bus.bgVofs[bg]);
      registerRows.push(`${nmi}\t${values.join('\t')}\t${hdma.join(' ')}\t${scroll.map((value) => value.toString(16).padStart(4, '0')).join(' ')}`);
      if (registerRows.length >= 100) fs.appendFileSync(registerDumpPath, `${registerRows.splice(0).join('\n')}\n`);
    }
    if (rows.length >= 100) {
      fs.appendFileSync(outputPath, `${rows.splice(0).join('\n')}\n`);
    }
  },
  onFrame: renderFrames ? (frame, framebuffer) => {
    if (framebuffer !== lastFramebuffer) { framebufferHash = hex(fnv(framebuffer)); lastFramebuffer = framebuffer; }
  } : null,
});

fs.writeFileSync(outputPath, 'nmi\tframe\twram\tvram\tcgram\toam\tnmi_pc\tapu_raw\tapu_semantic\tapu_count\tframebuffer\n');
let failure = null;
try {
  while (machine.nmiCount < target) machine.step();
} catch (error) {
  failure = { frame: machine.frame, master: machine.master, pc: machine.cpu.address(),
    message: error instanceof Error ? error.message : String(error) };
}
if (rows.length) fs.appendFileSync(outputPath, `${rows.join('\n')}\n`);
if (registerRows.length) fs.appendFileSync(registerDumpPath, `${registerRows.join('\n')}\n`);
if (pixelFd !== null) fs.closeSync(pixelFd);
console.log(JSON.stringify({ target, frame: machine.frame, master: machine.master, rawCount, semanticCount, failure }, null, 2));
if (failure) process.exitCode = 1;
