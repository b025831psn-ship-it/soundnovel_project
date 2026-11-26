#!/usr/bin/env node
import fs from 'node:fs';
import { SfcBus } from '../bus.js';
import { Cpu65816 } from '../cpu.js';

const [outputPath, referencePath = ''] = process.argv.slice(2);
if (!outputPath) throw new Error('usage: timing-matrix.mjs output.tsv [reference.tsv]');
const modes = [
  ['E1', true, 0x34], ['M0X0', false, 0x00], ['M0X1', false, 0x10],
  ['M1X0', false, 0x20], ['M1X1', false, 0x30],
];
const profiles = [
  ['rom-slow', 0x00, 0x8000], ['rom-fast', 0x80, 0x8000],
  ['wram-7e', 0x7e, 0x1000], ['io-2100', 0x00, 0x2100],
  ['io-4200', 0x00, 0x4200], ['bank-cross', 0x7e, 0xffff],
];
const rows = ['opcode\tmode\tprofile\tmaster\taccesses'];
const romOffset = (bank, word) => ((bank & 0x7f) << 15) | (word & 0x7fff);
for (let opcode = 0; opcode < 0x100; opcode++) for (const [mode, e, p] of modes)
  for (const [profile, bank, word] of profiles) {
    const rom = new Uint8Array(0x8000);
    const code = romOffset(0, 0x8000);
    rom.set([opcode, word & 0xff, word >>> 8, bank], code);
    rom[romOffset(0, 0xfffc)] = 0x00; rom[romOffset(0, 0xfffd)] = 0x80;
    rom[romOffset(0, 0xffe6)] = 0x00; rom[romOffset(0, 0xffe7)] = 0x80;
    rom[romOffset(0, 0xffea)] = 0x00; rom[romOffset(0, 0xffeb)] = 0x80;
    const bus = new SfcBus(rom);
    bus.io[0x420d - 0x2000] = profile === 'rom-fast' ? 1 : 0;
    const seed = (address, value) => {
      if (address < 0x2000) bus.wram[address] = value;
      else if (address < 0x8000) bus.io[address - 0x2000] = value;
    };
    seed(word, word & 0xff); seed((word + 1) & 0xffff, word >>> 8);
    seed((word + 2) & 0xffff, bank);
    const accesses = [];
    const cpu = new Cpu65816(bus, { traceLimit: 0, onBusAccess: (access) => accesses.push(access) });
    cpu.e = e; cpu.p = p; cpu.d = word; cpu.dbr = bank; cpu.s = word;
    cpu.x = profile === 'bank-cross' ? 1 : 0; cpu.y = cpu.x;
    const start = cpu.masterCycle;
    let error = '';
    try { cpu.step(); } catch (caught) { error = caught instanceof Error ? caught.message : String(caught); }
    const compact = accesses.map(({ master, direction, address, value }) =>
      `${master - start}:${direction}:${address.toString(16).padStart(6, '0')}:${value.toString(16).padStart(2, '0')}`).join(',');
    rows.push(`${opcode.toString(16).padStart(2, '0')}\t${mode}\t${profile}\t${error ? `ERROR:${error}` : cpu.masterCycle - start}\t${compact}`);
  }
fs.writeFileSync(outputPath, `${rows.join('\n')}\n`);

if (referencePath) {
  const reference = fs.readFileSync(referencePath, 'utf8').trim().split('\n').slice(1);
  const actual = rows.slice(1);
  const differences = [];
  for (let i = 0; i < Math.max(reference.length, actual.length); i++)
    if (reference[i] !== actual[i]) differences.push({ row: i + 2, reference: reference[i] ?? null, actual: actual[i] ?? null });
  console.log(JSON.stringify({ referenceRows: reference.length, actualRows: actual.length,
    differenceCount: differences.length, differences }, null, 2));
} else console.log(JSON.stringify({ rows: rows.length - 1, opcodes: 256, modes: modes.length,
  profiles: profiles.length }, null, 2));
