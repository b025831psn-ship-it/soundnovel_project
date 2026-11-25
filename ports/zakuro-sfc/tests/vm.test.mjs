import test from 'node:test';
import assert from 'node:assert/strict';
import { ApuTraceComparator, MasterClock, ZakuroVM, accessCycles, createApuLink } from '../vm/index.js';
import { LINK_TIMING, POWER_ON } from '../tools/rom.mjs';

function fixtureRom(program) {
  const rom = new Uint8Array(0x8000).fill(0xea);
  rom.set(program, 0); rom[0x7ffc] = 0x00; rom[0x7ffd] = 0x80;
  return rom;
}

test('master clock uses integer SNES bus access costs', () => {
  assert.equal(accessCycles(0x002140), 6);
  assert.equal(accessCycles(0x7e1234), 8);
  assert.equal(accessCycles(0x808000, true), 6);
  const c = new MasterClock(); c.charge(0x2140); c.idle(12); assert.equal(c.master, 18);
});

test('65C816 reset executes LoROM and routes $2140 through MasterLink', () => {
  // LDA #$5a; STA $2140; STP
  const calls = [];
  const masterLink = {
    read() { return 0; },
    write(master, port, value) { calls.push({ master, port, value }); },
  };
  const vm = new ZakuroVM({ rom: fixtureRom([0xa9, 0x5a, 0x8d, 0x40, 0x21, 0xdb]), masterLink });
  vm.reset();
  assert.equal(vm.cpu.PC, 0x8000);
  while (!vm.cpu.stopped) vm.step();
  assert.equal(calls.length, 1);
  assert.deepEqual({ port: calls[0].port, value: calls[0].value }, { port: 0, value: 0x5a });
  assert.ok(Number.isSafeInteger(calls[0].master));
});

test('APUIO comparator checks order/value and reports maximum master delta', () => {
  const c = new ApuTraceComparator([
    { master: 100, dir: 'w', port: 0, value: 0xaa },
    { master: 200, dir: 'r', port: 1, value: 0xbb },
  ]);
  assert.equal(c.observe({ master: 103, dir: 'w', port: 0, value: 0xaa }), 3);
  assert.equal(c.observe({ master: 195, dir: 'r', port: 1, value: 0xbb }), -5);
  assert.deepEqual(c.finish(), { rows: 2, maxMasterDelta: 5 });
});

test('VM APU link injects private IPL and applies LINK_TIMING and POWER_ON', () => {
  const ipl = new Uint8Array(64); ipl[62] = 0xc0; ipl[63] = 0xff;
  const { apu, link, bootMode } = createApuLink({ rom: fixtureRom([]), ipl });
  assert.equal(bootMode, 'ipl');
  assert.deepEqual(apu.cpu.ipl, ipl);
  assert.equal(apu.cpu.dspAccessOffset, POWER_ON.dspAccessOffset);
  assert.deepEqual(apu.cpu.timers.map((timer) => timer.phase), [3, 3, 3]);
  assert.equal(link.readLag, LINK_TIMING.readLag);
  assert.equal(link.readPoint, LINK_TIMING.readPoint);
  assert.equal(link.writeLag, LINK_TIMING.writeLag);
});
