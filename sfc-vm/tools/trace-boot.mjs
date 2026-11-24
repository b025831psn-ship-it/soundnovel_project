#!/usr/bin/env node
import fs from 'node:fs';
import { SfcBus } from '../bus.js';
import { Cpu65816 } from '../cpu.js';

const romPath = process.argv[2];
const limit = Number(process.argv[3] ?? 2_000_000);
if (!romPath) throw new Error('usage: node sfc-vm/tools/trace-boot.mjs ROM.sfc [instruction-limit]');

const bus = new SfcBus(fs.readFileSync(romPath));
const cpu = new Cpu65816(bus, { traceLimit: 0 });
let waitVisits = 0;
let frames = 0;

try {
  for (let index = 0; index < limit; index++) {
    cpu.step();
    // $00:825D is the native idle branch used while the main thread waits
    // for VBlank. Enter NMI only after observing the branch twice.
    if (cpu.address() === 0x00825d) {
      if (++waitVisits === 2) {
        cpu.nmi();
        frames++;
        waitVisits = 0;
      }
    } else waitVisits = 0;
  }
  console.log(JSON.stringify({ status: 'limit', executed: cpu.executed, frames, address: cpu.address() }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ status: 'stopped', reason: error.message, executed: cpu.executed, frames, last: cpu.lastTrace }, null, 2));
}
