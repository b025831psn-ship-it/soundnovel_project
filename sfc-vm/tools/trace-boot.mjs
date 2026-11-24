#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import { SfcBus } from '../bus.js';
import { Cpu65816 } from '../cpu.js';

const romPath = process.argv[2];
const limit = Number(process.argv[3] ?? 2_000_000);
const snapshotFrames = new Set((process.argv[4] ?? '').split(',').filter(Boolean).map(Number));
const snapshotPrefix = process.argv[5];
const inputSchedule = new Map((process.argv[6] ?? '').split(',').filter(Boolean).map((entry) => {
  const [frame, mask] = entry.split(':');
  return [Number(frame), Number(mask)];
}));
if (!romPath) throw new Error(
  'usage: node sfc-vm/tools/trace-boot.mjs ROM.sfc [instruction-limit] [snapshot-frame-list snapshot-prefix]',
);
if (snapshotFrames.size && !snapshotPrefix) throw new Error('snapshot-prefix is required with snapshot frames');

const bus = new SfcBus(fs.readFileSync(romPath), { eventLimit: 0 });
const cpu = new Cpu65816(bus, { traceLimit: 0 });
let waitVisits = 0;
let frames = 0;
let peakVramNonzero = 0;
let peakVramFrame = 0;
const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const summary = (status, extra = {}) => ({
  status, executed: cpu.executed, frames, address: cpu.address(),
  ppu: {
    inidisp: bus.io[0x2100 - 0x2000],
    vramSha256: digest(bus.vram), cgramSha256: digest(bus.cgram), oamSha256: digest(bus.oam),
    vramNonzero: bus.vram.reduce((count, value) => count + (value !== 0), 0),
    peakVramNonzero, peakVramFrame,
    cgramNonzero: bus.cgram.reduce((count, value) => count + (value !== 0), 0),
    oamNonzero: bus.oam.reduce((count, value) => count + (value !== 0), 0),
    dma: bus.dmaStats,
  },
  ...extra,
});

try {
  for (let index = 0; index < limit; index++) {
    cpu.step();
    // $00:825D is the native idle branch used while the main thread waits
    // for VBlank. Enter NMI only after observing the branch twice.
    if (cpu.address() === 0x00825d) {
      if (++waitVisits === 2) {
        bus.setController1(inputSchedule.get(frames + 1) ?? 0);
        cpu.nmi();
        frames++;
        const vramNonzero = bus.vram.reduce((count, value) => count + (value !== 0), 0);
        if (vramNonzero > peakVramNonzero) {
          peakVramNonzero = vramNonzero;
          peakVramFrame = frames;
        }
        if (snapshotFrames.has(frames)) {
          const prefix = `${snapshotPrefix}.${frames}`;
          fs.writeFileSync(`${prefix}.vram.bin`, bus.vram);
          fs.writeFileSync(`${prefix}.cgram.bin`, bus.cgram);
          fs.writeFileSync(`${prefix}.oam.bin`, bus.oam);
          fs.writeFileSync(`${prefix}.io.bin`, bus.io);
          fs.writeFileSync(`${prefix}.json`, JSON.stringify({
            frame: frames, executed: cpu.executed, address: cpu.address(), controller1: bus.controller1,
          }, null, 2));
        }
        waitVisits = 0;
      }
    } else waitVisits = 0;
  }
  console.log(JSON.stringify(summary('limit'), null, 2));
} catch (error) {
  console.log(JSON.stringify(summary('stopped', { reason: error.message, last: cpu.lastTrace }), null, 2));
}
