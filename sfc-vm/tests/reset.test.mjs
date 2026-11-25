import test from 'node:test';
import assert from 'node:assert/strict';
import { SfcBus } from '../bus.js';
import { Cpu65816 } from '../cpu.js';
import { decodeTilePixel, renderMode3Bg1 } from '../ppu.js';
import { MasterLink } from '../../ports/kamaitachi-sfc/sound/master-link.js';

// Real reset sequence bytes from the verified ROM. Keeping only this short
// sequence makes the test redistributable without embedding game assets.
const RESET = Uint8Array.from([
  0x18, 0xfb, 0xa9, 0x8f, 0x8d, 0x00, 0x21, 0x9c, 0x00, 0x42,
  0x9c, 0x0c, 0x42, 0xc2, 0x30, 0xa9, 0xa8, 0x0c, 0x1b, 0xa9,
  0x00, 0x00, 0x5b, 0xf4, 0x00, 0x01, 0xab, 0xab, 0xe2, 0x10,
  0xa2, 0x06, 0xa0, 0x00,
]);

const RESET_LOOP = Uint8Array.from([
  0xbd, 0xe1, 0x03, 0xdd, 0x9e, 0x82, 0xd0, 0x05,
  0xca, 0xca, 0x10, 0xf4, 0xc8,
]);

function fixture() {
  const rom = new Uint8Array(0x8000);
  rom.set(RESET);
  rom[0x7ffc] = 0x00;
  rom[0x7ffd] = 0x80;
  return rom;
}

test('executes the verified reset preamble and records hardware writes', () => {
  const bus = new SfcBus(fixture());
  const cpu = new Cpu65816(bus);
  cpu.run(16);
  assert.equal(cpu.e, false);
  assert.equal(cpu.s, 0x0ca8);
  assert.equal(cpu.d, 0);
  assert.equal(cpu.dbr, 1);
  assert.equal(cpu.x, 6);
  assert.equal(cpu.y, 0);
  assert.deepEqual(bus.events.slice(0, 3), [
    { kind: 'io-write', address: 0x2100, value: 0x8f },
    { kind: 'io-write', address: 0x4200, value: 0 },
    { kind: 'io-write', address: 0x420c, value: 0 },
  ]);
  assert.deepEqual(cpu.trace.slice(0, 4).map((e) => e.name), ['CLC', 'XCE', 'LDA #', 'STA abs']);
});

test('executes the reset table comparison loop with native-width flags', () => {
  const rom = fixture();
  rom.set(RESET_LOOP, RESET.length);
  // DBR is $01. Match all four words so BNE falls through and DEX/BPL loops.
  rom.set([1, 0, 2, 0, 3, 0, 4, 0], 0x29e);
  const bus = new SfcBus(rom);
  bus.wram.set([1, 0, 2, 0, 3, 0, 4, 0], 0x3e1);
  const cpu = new Cpu65816(bus);
  cpu.run(17 + 4 * 6 + 1);
  assert.equal(cpu.pc, 0x802f);
  assert.equal(cpu.x, 0xfe);
  assert.equal(cpu.y, 1);
  assert.ok(cpu.trace.at(-2).p & 0x80, 'final DEX keeps BPL from taking the loop');
  assert.deepEqual(cpu.trace.slice(-5).map((entry) => entry.name), [
    'BNE', 'DEX', 'DEX', 'BPL', 'INY',
  ]);
});

test('maps the cartridge SRAM window used by the reset checksum', () => {
  const bus = new SfcBus(fixture());
  assert.equal(bus.read8(0x700000), 0xff, 'fresh SRAM is erased');
  bus.write16(0x700800, 0x1234);
  assert.equal(bus.read16(0x700800), 0x1234);
  assert.equal(bus.read16(0xf00800), 0x1234, 'high-bank SRAM mirror');
  assert.equal(bus.events.length, 0, 'SRAM writes are not I/O events');
});

test('exposes the SPC700 IPL ready word and echoes transfer tokens', () => {
  const bus = new SfcBus(fixture());
  assert.equal(bus.read16(0x2140), 0xbbaa);
  bus.write8(0x2140, 0xcc);
  assert.equal(bus.read8(0x2140), 0xcc);
  assert.deepEqual(bus.events.at(-1), { kind: 'apu-write', address: 0x2140, value: 0xcc });
});

test('answers the uploaded sound driver identity handshake', () => {
  const bus = new SfcBus(fixture());
  for (const [port, value] of [0x43, 0x68, 0x75, 0x6e].entries())
    bus.write8(0x2140 + port, value);
  assert.deepEqual([...bus.apuPorts], [0x53, 0x4f, 0x46, 0x54]);
  bus.write8(0x2141, 0xaa);
  assert.equal(bus.read8(0x2141), 0x4f, 'CPU input does not overwrite the SPC output latch');
  bus.write8(0x2140, 0);
  assert.deepEqual([...bus.apuPorts], [0, 0, 0, 0]);
});

test('timestamps APUIO at the bus transaction and routes it through MasterLink', () => {
  const calls = [];
  const apu = {
    cpu: { clock: 0, step() { this.clock++; } },
    cpuRead(port) { calls.push(['read', this.cpu.clock, port]); return 0x50 + port; },
    cpuWrite(port, value) { calls.push(['write', this.cpu.clock, port, value]); },
  };
  const link = new MasterLink(apu);
  const bus = new SfcBus(fixture(), { masterLink: link });
  assert.equal(bus.read8(0x2142, 328125), 0x52);
  bus.write8(0x2141, 0x7f, 656250);
  assert.deepEqual(calls, [['read', 15664, 2], ['write', 31328, 1, 0x7f]]);
  assert.deepEqual(bus.apuTrace, [
    { masterCycle: 328125, direction: 'r', port: 2, value: 0x52 },
    { masterCycle: 656250, direction: 'w', port: 1, value: 0x7f },
  ]);
});

test('charges memory-speed and internal master cycles per CPU bus transaction', () => {
  const rom = fixture();
  rom.set([0xad, 0x40, 0x21], 0); // LDA $2140
  const bus = new SfcBus(rom);
  const cpu = new Cpu65816(bus);
  cpu.step();
  assert.deepEqual(bus.apuTrace[0], {
    masterCycle: 182 + 8 + 8 + 8,
    direction: 'r', port: 0, value: 0xaa,
  });
  assert.equal(cpu.masterCycle, 182 + 8 + 8 + 8 + 6);
});

test('enters the native NMI vector with a restorable interrupt frame', () => {
  const rom = fixture();
  rom[0x7fea] = 0x34;
  rom[0x7feb] = 0x12;
  const bus = new SfcBus(rom);
  const cpu = new Cpu65816(bus);
  cpu.e = false;
  cpu.pbr = 2;
  cpu.pc = 0x4567;
  const stack = cpu.s;
  cpu.nmi();
  assert.equal(cpu.address(), 0x001234);
  assert.equal(cpu.s, stack - 4);
  cpu.pc = 0x8000;
  rom[0] = 0x40; // RTI
  cpu.step();
  assert.equal(cpu.address(), 0x024567);
});

test('DMA mode 1 writes source bytes through the VRAM data ports', () => {
  const bus = new SfcBus(fixture());
  bus.wram.set([0x11, 0x22, 0x33, 0x44], 0x100);
  bus.write8(0x2115, 0x80);
  bus.write16(0x2116, 0);
  bus.write8(0x4300, 1);
  bus.write8(0x4301, 0x18);
  bus.write16(0x4302, 0x0100);
  bus.write8(0x4304, 0x7e);
  bus.write16(0x4305, 4);
  bus.write8(0x420b, 1);
  assert.deepEqual([...bus.vram.slice(0, 4)], [0x11, 0x22, 0x33, 0x44]);
  assert.deepEqual(bus.events.at(-1), {
    kind: 'dma', channel: 0, dmap: 1, source: 0x7e0100, bytes: 4,
    nonzeroBytes: 4, destination: 0x2118,
  });
  assert.deepEqual(bus.dmaStats['0x2118'], {
    transfers: 1, bytes: 4, nonzeroBytes: 4,
    last: { channel: 0, dmap: 1, source: 0x7e0100, bytes: 4 },
  });
});

test('NMI latches the standard auto-joypad result', () => {
  const rom = fixture();
  rom[0x7fea] = 0x00;
  rom[0x7feb] = 0x80;
  const bus = new SfcBus(rom);
  const cpu = new Cpu65816(bus);
  cpu.e = false;
  bus.write8(0x4200, 1);
  bus.setController1(0x1080); // Hardware JOY1 bits: Start + A
  cpu.nmi();
  assert.equal(bus.read16(0x4218), 0x1080);
});

test('decodes and composites mode 3 BG1 from PPU memory', () => {
  const bus = new SfcBus(fixture());
  bus.io[0x2105 - 0x2000] = 3;
  bus.io[0x210b - 0x2000] = 1;
  bus.vram[0] = 1;
  bus.vram[0x2000 + 64 + 7 * 2] = 0x80;
  bus.cgram[2] = 0x1f;
  assert.equal(decodeTilePixel(bus.vram, 0x2040, 0, 7, 8), 1);
  const frame = renderMode3Bg1(bus, 8, 8);
  assert.deepEqual([...frame.slice((7 * 8) * 4, (7 * 8) * 4 + 4)], [255, 0, 0, 255]);
});
