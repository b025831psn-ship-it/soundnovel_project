import test from 'node:test';
import assert from 'node:assert/strict';
import { SfcBus } from '../bus.js';
import { Cpu65816 } from '../cpu.js';

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
