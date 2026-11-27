import test from 'node:test';
import assert from 'node:assert/strict';
import { ApuTraceComparator, MasterClock, PPU, ProgramImage, RESET_MASTER_CYCLES, ZakuroBus, ZakuroVM, accessCycles, createApuLink, inAutoJoypadRead, inVblank, renderFrame, rgbaToRgb565, scanlineTiming, vblankBoundary } from '../vm/index.js';
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

test('$4212 HBlank uses the current short scanline start and Snes9x edges', () => {
  const clock = new MasterClock(0, { refresh: false });
  const bus = new ZakuroBus({ rom: fixtureRom([]), masterLink: { read: () => 0, write() {} }, clock });
  const readAt = master => { clock.master = master - 6; return bus.read(0x4212) & 0x40; };
  const line = 1364;
  assert.equal(readAt(line), 0x40);
  assert.equal(readAt(line + 4), 0);
  assert.equal(readAt(line + 1095), 0);
  assert.equal(readAt(line + 1096), 0x40);
  const shortLine = scanlineTiming(357368 + 240 * 1364);
  assert.equal(readAt(shortLine.start + 2), 0x40);
  assert.equal(readAt(shortLine.start + shortLine.length - 1), 0x40);
});

test('DRAM refresh follows alternating H positions across the short scanline', () => {
  assert.deepEqual(scanlineTiming(0), { field: 0, line: 0, start: 0, length: 1364, refresh: 538 });
  assert.equal(scanlineTiming(1364).refresh, 534);
  const odd240 = scanlineTiming(357368 + 240 * 1364);
  assert.deepEqual({ line: odd240.line, length: odd240.length, refresh: odd240.refresh }, { line: 240, length: 1360, refresh: 534 });
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

test('LoROM SRAM maps banks $70-$7d and powers on with the native fill', () => {
  const rom = fixtureRom([]);
  rom[0x7fd7] = 0x0b;
  rom[0x7fd8] = 0x03;
  const bus = new ZakuroBus({ rom, masterLink: { read: () => 0, write() {} } });
  assert.equal(bus.read(0x700000), 0x60);
  assert.equal(bus.read(0x700001), 0x60);
  bus.write(0x700000, 0x42);
  assert.equal(bus.read(0xf00000), 0x42);
});

test('sparse program image replaces the owned ROM buffer', () => {
  const program = new ProgramImage([{ offset: 0, length: 0x8000, data: fixtureRom([0xea]) }]);
  const bus = new ZakuroBus({ program, masterLink: { read: () => 0, write() {} } });
  assert.equal(bus.readMapped(0x008000), 0xea);
  assert.equal(bus.readMapped(0x00fffc), 0x00);
  assert.throws(() => bus.readMapped(0x018000), /unmapped program byte/);
});

test('program manifest carries explicit SRAM into the ROM-free bus', async () => {
  const bytes = fixtureRom([0xea]);
  const program = await ProgramImage.load({
    sram: { size: 8192, fill: 0x60 }, ranges: [{ offset: 0, length: bytes.length, file: 'range.bin' }],
  }, async () => bytes);
  const bus = new ZakuroBus({ program, sram: program.sram, masterLink: { read: () => 0, write() {} } });
  assert.equal(bus.read(0x700000), 0x60);
  bus.write(0x700000, 0x33);
  assert.equal(bus.read(0xf00000), 0x33);
});

test('SRAM import/export and write hook support browser persistence', () => {
  const writes = [];
  const bus = new ZakuroBus({
    rom: fixtureRom([]), sram: { size: 8192, fill: 0x60 },
    onSramWrite: event => writes.push(event), masterLink: { read: () => 0, write() {} },
  });
  bus.write(0x700000, 0x42);
  assert.deepEqual(writes, [{ offset: 0, value: 0x42, revision: 1 }]);
  assert.equal(bus.consumeSramDirty(), true);
  assert.equal(bus.consumeSramDirty(), false);
  const image = bus.exportSram(); image[1] = 0x33; bus.importSram(image);
  assert.equal(bus.read(0x700001), 0x33);
  assert.equal(bus.consumeSramDirty(), false);
  assert.throws(() => bus.importSram(new Uint8Array(1)), /8192 bytes/);
});

test('touch state exposes choice cursor, targets and screen rectangles', () => {
  const vm = new ZakuroVM({ rom: fixtureRom([]), masterLink: { read: () => 0, write() {} } });
  for (const [address, value] of [[0x7f, 1], [0x81, 1], [0x82, 1], [0x83, 7], [0x84, 0], [0x85, 8], [0x86, 0], [0x348, 2]])
    vm.bus.write(address, value);
  assert.deepEqual(vm.getTouchState(), {
    mode: 'choice',
    choice: { cursor: 1, count: 2, targets: [7, 8], ready: true, rectangles: [
      { index: 0, x: 0, y: 20, width: 256, height: 48 },
      { index: 1, x: 0, y: 68, width: 256, height: 48 },
    ] },
    saveSlot: null,
  });
});

test('touch state ignores power-on fill and incomplete choice targets', () => {
  const vm = new ZakuroVM({ rom: fixtureRom([]), masterLink: { read: () => 0, write() {} } });
  assert.equal(vm.getTouchState().mode, 'text');
  vm.bus.write(0x00007f, 1); vm.bus.write(0x000082, 1);
  vm.bus.write(0x000083, 7); vm.bus.write(0x000084, 0);
  assert.deepEqual(vm.getTouchState().choice, {
    cursor: 0, count: 2, targets: [7, 0], ready: false, rectangles: [],
  });
});

test('PPU receives VRAM/CGRAM writes and presents a 256x224 RGBA field', () => {
  const vm = new ZakuroVM({ rom: fixtureRom([]), masterLink: { read: () => 0, write() {} } });
  vm.ppu.write(0x2115, 0x80); vm.ppu.write(0x2116, 1); vm.ppu.write(0x2117, 0);
  vm.ppu.write(0x2118, 0x12); vm.ppu.write(0x2119, 0x34);
  vm.ppu.write(0x2121, 2); vm.ppu.write(0x2122, 0x56); vm.ppu.write(0x2122, 0x78);
  assert.equal(vm.ppu.vram[2], 0x12); assert.equal(vm.ppu.vram[3], 0x34);
  assert.equal(vm.ppu.cgram[4], 0x56); assert.equal(vm.ppu.cgram[5], 0x78);
  assert.equal(vm.ppu.presentField(1, 357368).length, 256 * 224 * 4);
  assert.equal(vm.ppu.presentField(2, 714732, false), null);
  assert.equal(vm.ppu.field, 2);
});

test('Mode 1 starts at visible line 1 and half-adds in RGB565 precision', () => {
  const ppu = new PPU();
  ppu.io[0x100] = 15; ppu.io[0x105] = 1;
  ppu.io[0x107] = 0; ppu.io[0x108] = 4; ppu.io[0x10b] = 0x21;
  ppu.io[0x12c] = 1; ppu.io[0x12d] = 2; ppu.io[0x130] = 2; ppu.io[0x131] = 0x41;
  ppu.vram[0] = 0x00; ppu.vram[1] = 0x14; // BG1 palette 5, tile 0.
  ppu.vram[0x800] = 0x00; ppu.vram[0x801] = 0x1c; // BG2 palette 7, tile 0.
  // Only source row 1 is non-transparent: BG1 pixel 13 and BG2 pixel 1.
  ppu.vram[0x2002] = 0xff; ppu.vram[0x2012] = 0xff; ppu.vram[0x2013] = 0xff;
  ppu.vram[0x4002] = 0xff;
  ppu.cgram[93 * 2] = 0xb5; ppu.cgram[93 * 2 + 1] = 0x4e;
  ppu.cgram[113 * 2] = 0x23; ppu.cgram[113 * 2 + 1] = 0x40;
  let rgb565 = rgbaToRgb565(renderFrame(ppu));
  assert.equal(rgb565[0] | (rgb565[1] << 8), 0x62d1);
  // Non-half green math happens in 5-bit space, then expands to RGB565.
  ppu.io[0x131] = 0x01;
  ppu.cgram[93 * 2] = 0x00; ppu.cgram[93 * 2 + 1] = 0x01;
  ppu.cgram[113 * 2] = 0x00; ppu.cgram[113 * 2 + 1] = 0x01;
  rgb565 = rgbaToRgb565(renderFrame(ppu));
  assert.equal(rgb565[0] | (rgb565[1] << 8), 0x0420);
  // A transparent subscreen contributes fixed colour, not CGRAM backdrop 0.
  ppu.io[0x12d] = 0; ppu.fixedColor = 0;
  ppu.cgram[0] = 0xff; ppu.cgram[1] = 0x7f;
  ppu.cgram[93 * 2] = 0xa4; ppu.cgram[93 * 2 + 1] = 0x18;
  rgb565 = rgbaToRgb565(renderFrame(ppu));
  assert.equal(rgb565[0] | (rgb565[1] << 8), 0x2146);
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

test('setJoypad overrides input.tsv once on the next auto-joypad sample', () => {
  const vm = new ZakuroVM({
    rom: fixtureRom([]), masterLink: { read: () => 0, write() {} }, inputFrames: [0, 0x1000, 0x0080],
  });
  vm.setJoypad(0x8000);
  vm.bus.setInputField(0);
  assert.equal(vm.bus.joy1, 0x8000);
  vm.bus.setInputField(1);
  assert.equal(vm.bus.joy1, 0x0080);
  assert.throws(() => vm.setJoypad(0x10000), /invalid joypad mask/);
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

test('indexed store positions its IO cycle before the data write', () => {
  let writeMaster = -1;
  const clock = new MasterClock(0, { refresh: false });
  const vm = new ZakuroVM({
    rom: fixtureRom([0x9e, 0x00, 0x21]), clock,
    ppu: { write(offset, value, master) { assert.equal(offset, 0x2100); assert.equal(value, 0); writeMaster = master; } },
    masterLink: { read: () => 0, write() {} },
  });
  vm.reset(); clock.master = 0; vm.cpu.P.E = 0; vm.cpu.P.M = 1; vm.cpu.P.X = 1;
  assert.equal(vm.cpu.step(), 5);
  assert.equal(vm.cpu.positionedInternalMaster, 6);
  assert.equal(writeMaster, 36);
});

test('NMITIMEN enable edge waits until its trigger then enters before fetch', () => {
  // LDA #$80; STA $4200; LDA #$55; STP. NMI vector -> $9000.
  const rom = fixtureRom([0xa9, 0x80, 0x8d, 0x00, 0x42, 0xa9, 0x55, 0xdb]);
  rom[0x7ffa] = 0x00; rom[0x7ffb] = 0x90;
  const vm = new ZakuroVM({ rom, masterLink: { read: () => 0, write() {} } });
  vm.reset(); vm.bus.clock.master = vblankBoundary(0) + 100; vm.bus.nmiFlag = true;
  vm.step(); vm.step();
  assert.equal(vm.cpu.PC, 0x8005);
  vm.step();
  assert.equal(vm.cpu.A & 0xff, 0x55);
  assert.equal(vm.cpu.PC, 0x8007);
  vm.step();
  assert.equal(vm.cpu.PC, 0x9000);
  assert.equal(vm.bus.nmiFlag, true);
});

test('NMITIMEN enable edge ignores a stale RDNMI flag outside VBlank', () => {
  const rom = fixtureRom([0xa9, 0x80, 0x8d, 0x00, 0x42, 0xa9, 0x55, 0xdb]);
  rom[0x7ffa] = 0x00; rom[0x7ffb] = 0x90;
  const vm = new ZakuroVM({ rom, masterLink: { read: () => 0, write() {} } });
  vm.reset(); vm.bus.nmiFlag = true;
  while (!vm.cpu.stopped) vm.step();
  assert.equal(vm.cpu.A & 0xff, 0x55);
  assert.equal(vm.cpu.PC, 0x8008);
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

test('VM state round-trips CPU, bus, PPU, link, SPC and DSP state', () => {
  const ipl = new Uint8Array(64); ipl[62] = 0xc0; ipl[63] = 0xff;
  const { apu, link } = createApuLink({ ipl, powerOnDsp: new Uint8Array(128) });
  const vm = new ZakuroVM({ rom: fixtureRom([0xea, 0xea]), masterLink: link });
  vm.reset(); vm.cpu.A = 0x1234; vm.bus.wram[0x345] = 0x67; vm.bus.sram[0] = 0x89;
  vm.ppu.vram[2] = 0xab; vm.ppu.cgram[3] = 0xcd; vm.ppu.oam[4] = 0xef;
  apu.cpu.ram[0x2222] = 0x5a; apu.cpu.a = 0x44; apu.dsp.regs[0x0c] = 0x33;
  apu.dsp.v[0].env = 0x456; link.pending.push([12.5, 2, 0x99]);
  vm.nmiTriggerMaster = 4567; vm.skipRender = true;
  const state = structuredClone(vm.saveState());
  vm.cpu.A = 0; vm.bus.wram[0x345] = 0; vm.bus.sram[0] = 0;
  vm.ppu.vram[2] = 0; apu.cpu.ram[0x2222] = 0; apu.dsp.v[0].env = 0; link.pending.length = 0;
  vm.loadState(state);
  assert.equal(vm.cpu.A, 0x1234); assert.equal(vm.bus.wram[0x345], 0x67);
  assert.equal(vm.bus.sram[0], 0x89); assert.equal(vm.ppu.vram[2], 0xab);
  assert.equal(apu.cpu.ram[0x2222], 0x5a); assert.equal(apu.cpu.a, 0x44);
  assert.equal(apu.dsp.regs[0x0c], 0x33); assert.equal(apu.dsp.v[0].env, 0x456);
  assert.deepEqual(link.pending, [[12.5, 2, 0x99]]);
  assert.equal(vm.nmiTriggerMaster, 4567); assert.equal(vm.skipRender, true);
  assert.equal(apu.dsp.ram, apu.cpu.ram);
  assert.deepEqual(vm.saveState(), state);
});

test('reset restarts all hardware while retaining WRAM and SRAM', () => {
  const ipl = new Uint8Array(64); ipl[62] = 0xc0; ipl[63] = 0xff;
  const powerOnDsp = new Uint8Array(128); powerOnDsp[0x7d] = 5;
  const { apu, link } = createApuLink({ ipl, powerOnDsp });
  const vm = new ZakuroVM({ rom: fixtureRom([0xea, 0xea]), masterLink: link });
  vm.reset();
  vm.bus.wram[0x2345] = 0x67; vm.bus.wramWritten[0x2345] = 1;
  vm.bus.sram[0] = 0x89; vm.bus.sramDirty = true; vm.bus.sramRevision = 7;
  vm.bus.io[0x4200] = 0x81; vm.bus.fastRom = true; vm.bus.pendingJoypad = 0x1234;
  vm.bus.nmiFlag = true; vm.bus.wramAddress = 0x12345; vm.bus.hdmaMask = 0xff;
  vm.bus.dmaBytes = 10; vm.bus.hdmaEvents.push([123, 0xff]);
  vm.ppu.vram[2] = 0xab; vm.ppu.cgram[3] = 0xcd; vm.ppu.oam[4] = 0xef;
  vm.ppu.io[0x100] = 0x8f; vm.ppu.modesUsed.add(7); vm.ppu.field = 99;
  apu.cpu.ram[0x2222] = 0x5a; apu.cpu.portOut[0] = 0xaa; apu.cpu.clock = 999;
  apu.dsp.regs[0x0c] = 0x33; apu.dsp.v[0].env = 0x456;
  link.pending.push([12.5, 2, 0x99]); vm.nmiTriggerMaster = 4567; vm.skipRender = true;

  vm.reset();

  assert.equal(vm.bus.wram[0x2345], 0x67); assert.equal(vm.bus.wramWritten[0x2345], 0);
  assert.equal(vm.bus.sram[0], 0x89); assert.equal(vm.bus.sramDirty, true);
  assert.equal(vm.bus.sramRevision, 7); assert.equal(vm.skipRender, true);
  assert.equal(vm.bus.clock.master, RESET_MASTER_CYCLES + 16);
  assert.equal(vm.bus.io[0x4200], 0); assert.equal(vm.bus.fastRom, false);
  assert.equal(vm.bus.pendingJoypad, null); assert.equal(vm.bus.nmiFlag, false);
  assert.equal(vm.bus.wramAddress, 0); assert.equal(vm.bus.hdmaMask, 0);
  assert.equal(vm.bus.dmaBytes, 0); assert.deepEqual(vm.bus.hdmaEvents, []);
  assert.equal(vm.ppu.vram[2], 0); assert.equal(vm.ppu.cgram[3], 0); assert.equal(vm.ppu.oam[4], 0);
  assert.equal(vm.ppu.io[0x100], 0); assert.deepEqual(vm.ppu.modesUsed, new Set());
  assert.equal(vm.ppu.field, -1); assert.equal(apu.cpu.ram[0x2222], 0);
  assert.equal(apu.cpu.portOut[0], 0); assert.equal(apu.cpu.clock, 0);
  assert.equal(apu.dsp.regs[0x0c], 0); assert.equal(apu.dsp.regs[0x7d], 5);
  assert.equal(apu.dsp.v[0].env, 0); assert.deepEqual(link.pending, []);
  assert.equal(vm.nmiTriggerMaster, null); assert.equal(vm.cpu.PC, 0x8000);
});
