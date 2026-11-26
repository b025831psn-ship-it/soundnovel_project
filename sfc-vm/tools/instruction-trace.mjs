#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { SfcMachine } from '../machine.js';

const [romPath, apuPath, outputPath, targetArg = '3', joypadPath = ''] = process.argv.slice(2);
if (!romPath || !apuPath || !outputPath) throw new Error('usage: instruction-trace.mjs ROM APU output.bin [nmis=3]');
const { APU } = await import(pathToFileURL(apuPath));
const apu = new APU(); apu.powerOn();
const fd = fs.openSync(outputPath, 'w');
const records = Buffer.allocUnsafe(24 * 4096); let used = 0;
const flush = () => { if (used) fs.writeSync(fd, records, 0, used * 24); used = 0; };
let machine;
const recordedJoypad = new Map();
if (joypadPath) for (const line of fs.readFileSync(joypadPath, 'utf8').trim().split('\n').slice(1)) {
  const [frameText,, addressText, valueText] = line.split('\t');
  const frame = Number(frameText), shift = Number.parseInt(addressText, 16) === 0x4219 ? 8 : 0;
  recordedJoypad.set(frame, (recordedJoypad.get(frame) ?? 0) | (Number.parseInt(valueText, 16) << shift));
}
machine = new SfcMachine({
  rom: fs.readFileSync(romPath), apu,
  joypad: (nmi, frame) => recordedJoypad.get(frame) ?? 0,
  busOptions: { eventLimit: 0, apuTraceLimit: 0, wramInitialValue: 0x55 },
  cpuOptions: { traceLimit: 0 },
  onInstruction: (pc) => {
    const cpu = machine.cpu, at = used++ * 24;
    records.writeUInt32LE(cpu.instructionStartMaster >>> 0, at);
    records.writeUInt32LE(pc >>> 0, at + 4);
    records.writeUInt16LE(cpu.instructionStartA & 0xffff, at + 8);
    records.writeUInt16LE(cpu.instructionStartX & 0xffff, at + 10);
    records.writeUInt16LE(cpu.instructionStartY & 0xffff, at + 12);
    records.writeUInt16LE(cpu.instructionStartS & 0xffff, at + 14);
    records.writeUInt16LE(cpu.instructionStartD & 0xffff, at + 16);
    records[at + 18] = cpu.instructionStartDbr & 0xff;
    records[at + 19] = cpu.instructionStartP & 0xff;
    records[at + 20] = cpu.currentInstruction.opcode;
    records[at + 21] = machine.nmiCount & 0xff;
    records.writeUInt16LE(machine.frame & 0xffff, at + 22);
    if (used === 4096) flush();
  },
});
const cpu = machine.cpu;
while (machine.nmiCount < Number(targetArg)) {
  cpu.instructionStartMaster = cpu.masterCycle;
  cpu.instructionStartA = cpu.a; cpu.instructionStartX = cpu.x; cpu.instructionStartY = cpu.y;
  cpu.instructionStartS = cpu.s; cpu.instructionStartD = cpu.d;
  cpu.instructionStartDbr = cpu.dbr; cpu.instructionStartP = cpu.p;
  machine.step();
}
flush(); fs.closeSync(fd);
console.log(JSON.stringify({ records: fs.statSync(outputPath).size / 24, nmis: machine.nmiCount,
  frame: machine.frame, master: machine.master }));
