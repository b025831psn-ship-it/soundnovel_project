#!/usr/bin/env node
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { SfcMachine } from '../machine.js';

const [romPath, apuModulePath, targetArg = '2108', periodArg = '90'] = process.argv.slice(2);
if (!romPath || !apuModulePath) throw new Error(
  'usage: performance.mjs ROM.sfc APU-MODULE [nmis=2108] [a-period=90]',
);
const rom = fs.readFileSync(romPath), target = Number(targetArg), period = Number(periodArg);
const { APU } = await import(pathToFileURL(apuModulePath));

function measure(render) {
  const apu = new APU(); apu.powerOn();
  const machine = new SfcMachine({
    rom, apu,
    joypad: (nmi) => period && nmi > 300 && nmi % period < 2 ? 0x0080 : 0,
    onFrame: render ? () => {} : null,
    cpuOptions: { traceLimit: 0 },
    busOptions: { eventLimit: 0, apuTraceLimit: 0, wramInitialValue: 0x55 },
  });
  const start = performance.now();
  while (machine.nmiCount < target) machine.step();
  return { milliseconds: performance.now() - start, frames: machine.frame, nmis: machine.nmiCount };
}

// Warm the JIT before measuring both paths with identical machine state.
measure(false);
const cpu = measure(false), total = measure(true);
const rendererMs = Math.max(0, total.milliseconds - cpu.milliseconds);
const report = {
  targetNmis: target,
  renderedFrames: total.frames,
  totalMilliseconds: total.milliseconds,
  millisecondsPerFrame: total.milliseconds / total.frames,
  framesPerSecond: total.frames * 1000 / total.milliseconds,
  cpuSchedulerMilliseconds: cpu.milliseconds,
  rendererMilliseconds: rendererMs,
  cpuSchedulerPercent: cpu.milliseconds * 100 / total.milliseconds,
  rendererPercent: rendererMs * 100 / total.milliseconds,
};
console.log(JSON.stringify(report, null, 2));
