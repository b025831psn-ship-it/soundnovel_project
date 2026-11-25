import test from 'node:test';
import assert from 'node:assert/strict';
import { ApuTraceComparator, MasterClock, ProgramImage, ZakuroBus, ZakuroVM, accessCycles, createApuLink, inAutoJoypadRead, inVblank, scanlineTiming, vblankBoundary } from '../vm/index.js';
import { LINK_TIMING, POWER_ON } from '../tools/rom.mjs';

function fixtureRom(program) {
  const rom = new Uint8Array(0x8000).fill(0xea);
  rom.set(program, 0); rom[0x7ffc] = 0x00; rom[0x7ffd] = 0x80;
  return rom;
}

test('master clock uses integer SNES bus access costs', () => {
  assert.equal(accessCycles(0x002140), 6);
  assert.equal(accessCycles(0x004016), 12);
  assert.equal(accessCycles(0x7e1234), 8);
  assert.equal(accessCycles(0x808000, true), 6);
  const c = new MasterClock(0, { refresh: false }); c.charge(0x2140); c.idle(12); assert.equal(c.master, 18);
  const refreshed = new MasterClock(530); refreshed.idle(8); assert.equal(refreshed.master, 578);
  const wallClock = new MasterClock(530, { refresh: false }); wallClock.idle(8); assert.equal(wallClock.master, 538);
});

test('PPU fields alternate 357368/357364 master cycles', () => {
  assert.equal(vblankBoundary(0), 306900);
  assert.equal(vblankBoundary(1), 664268);
  assert.equal(vblankBoundary(2), 1021632);
  assert.equal(vblankBoundary(3), 1379000);
  assert.equal(inVblank(306900), true);
  assert.equal(inVblank(357367), true);
  assert.equal(inVblank(357368), false);
  assert.equal(inAutoJoypadRead(306900), true);
  assert.equal(inAutoJoypadRead(306900 + 4091), true);
  assert.equal(inAutoJoypadRead(306900 + 4092), false);
});

test('DRAM refresh follows alternating H positions across the short scanline', () => {
  assert.deepEqual(scanlineTiming(0), { field: 0, line: 0, start: 0, length: 1364, refresh: 538 });
  assert.equal(scanlineTiming(1364).refresh, 534);
  const odd240 = scanlineTiming(357368 + 240 * 1364);
  assert.deepEqual({ line: odd240.line, length: odd240.length, refresh: odd240.refresh }, { line: 240, length: 1360, refresh: 538 });
  assert.equal(scanlineTiming(odd240.start + odd240.length).refresh, 538);
  assert.equal(scanlineTiming(357368 + 357364).refresh, 534);
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

test('power-on WRAM uses the native reference pattern across low-bank mirrors', () => {
  const bus = new ZakuroBus({ rom: fixtureRom([]), masterLink: { read: () => 0, write() {} } });
  assert.equal(bus.readMapped(0x0001ec), 0x55);
  assert.equal(bus.readMapped(0x3001ec), 0x55);
  assert.equal(bus.readMapped(0x7e01ec), 0x55);
});

test('sparse program image replaces the owned ROM buffer', () => {
  const program = new ProgramImage([{ offset: 0, length: 0x8000, data: fixtureRom([0xea]) }]);
  const bus = new ZakuroBus({ program, masterLink: { read: () => 0, write() {} } });
  assert.equal(bus.readMapped(0x008000), 0xea);
  assert.equal(bus.readMapped(0x00fffc), 0x00);
  assert.throws(() => bus.readMapped(0x018000), /unmapped program byte/);
});

test('recorded joypad frames feed auto-joypad registers and serial reads', () => {
  const frames = [0, 0x1000, 0x0080];
  const bus = new ZakuroBus({
    rom: fixtureRom([]), masterLink: { read: () => 0, write() {} }, inputFrames: frames,
    clock: new MasterClock(0, { refresh: false }),
  });
  bus.setInputField(0);
  assert.equal(bus.read(0x4218), 0x00);
  assert.equal(bus.read(0x4219), 0x10);
  bus.write(0x4016, 1); bus.write(0x4016, 0);
  assert.deepEqual(Array.from({ length: 4 }, () => bus.read(0x4016) & 1), [0, 0, 0, 1]);
  bus.setInputField(1);
  assert.equal(bus.read(0x4218), 0x80);
  assert.equal(bus.read(0x4219), 0x00);
});

test('65C816 store opcodes report total cycles without double-counting fetch', () => {
  // LDA #$5a; STA $00; STX $01; STZ $02; STA $2000
  const vm = new ZakuroVM({
    rom: fixtureRom([0xa9, 0x5a, 0x85, 0x00, 0x86, 0x01, 0x64, 0x02, 0x8d, 0x00, 0x20]),
    masterLink: { read: () => 0, write() {} },
  });
  vm.reset();
  assert.equal(vm.cpu.step(), 2);
  assert.equal(vm.cpu.step(), 3);
  assert.equal(vm.cpu.step(), 3);
  assert.equal(vm.cpu.step(), 3);
  assert.equal(vm.cpu.step(), 4);
});

test('NMITIMEN enable edge waits through the following instruction boundary', () => {
  // LDA #$80; STA $4200; LDA #$55; STP. NMI vector -> $9000.
  const rom = fixtureRom([0xa9, 0x80, 0x8d, 0x00, 0x42, 0xa9, 0x55, 0xdb]);
  rom[0x7ffa] = 0x00; rom[0x7ffb] = 0x90;
  const vm = new ZakuroVM({ rom, masterLink: { read: () => 0, write() {} } });
  vm.reset(); vm.bus.nmiFlag = true;
  vm.step(); vm.step();
  assert.equal(vm.cpu.PC, 0x8005);
  vm.step();
  assert.equal(vm.cpu.A & 0xff, 0x55);
  assert.equal(vm.cpu.PC, 0x9000);
  assert.equal(vm.bus.nmiFlag, true);
});

test('$420B DMA halts the CPU for setup, channel, and byte clocks', () => {
  const clock = new MasterClock(0, { refresh: false });
  const bus = new ZakuroBus({ rom: fixtureRom([]), masterLink: { read: () => 0, write() {} }, clock });
  bus.write(0x4305, 3); bus.write(0x4306, 0);
  const before = clock.master; bus.write(0x420b, 1);
  assert.equal(clock.master - before, 6 + 18 + 8 * (1 + 3));
  assert.equal(bus.dmaBytes, 3); assert.equal(bus.dmaTransfers, 1);
});

test('$420B mode-0 DMA writes ROM bytes through the WRAM data port', () => {
  const rom = fixtureRom([]); rom.set([0x11, 0x22, 0x33], 0x100);
  const bus = new ZakuroBus({ rom, masterLink: { read: () => 0, write() {} }, clock: new MasterClock(0, { refresh: false }) });
  bus.write(0x2181, 0x40); bus.write(0x2182, 0x23); bus.write(0x2183, 1);
  bus.write(0x4300, 0); bus.write(0x4301, 0x80);
  bus.write(0x4302, 0x00); bus.write(0x4303, 0x81); bus.write(0x4304, 0);
  bus.write(0x4305, 3); bus.write(0x4306, 0); bus.write(0x420b, 1);
  assert.deepEqual([...bus.wram.subarray(0x12340, 0x12343)], [0x11, 0x22, 0x33]);
  assert.equal(bus.wramAddress, 0x12343);
  assert.equal(bus.io[0x4302] | (bus.io[0x4303] << 8), 0x8103);
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
  const powerOnDsp = new Uint8Array(128); powerOnDsp[0x7d] = 5;
  const { apu, link, bootMode } = createApuLink({ ipl, powerOnDsp });
  assert.equal(bootMode, 'ipl');
  assert.deepEqual(apu.cpu.ipl, ipl);
  assert.equal(apu.cpu.dspAccessOffset, POWER_ON.dspAccessOffset);
  assert.equal(apu.dsp.regs[0x7d], 5);
  assert.deepEqual(apu.cpu.timers.map((timer) => timer.phase), [3, 3, 3]);
  assert.equal(link.readLag, LINK_TIMING.readLag);
  assert.equal(link.readPoint, LINK_TIMING.readPoint);
  assert.equal(link.writeLag, LINK_TIMING.writeLag);
});
