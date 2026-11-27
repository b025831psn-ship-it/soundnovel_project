import test from 'node:test';
import assert from 'node:assert/strict';
import { SfcBus } from '../bus.js';
import { Cpu65816 } from '../cpu.js';
import { decodeTilePixel, renderFrame, renderMode3Bg1, renderScanline } from '../ppu.js';
import { MasterLink, READ_POINT } from '../../ports/kamaitachi-sfc/sound/master-link.js';

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
  const bus = new SfcBus(fixture(), { eventLimit: 16 });
  const cpu = new Cpu65816(bus, { traceLimit: 32 });
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
  const cpu = new Cpu65816(bus, { traceLimit: 64 });
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
  const bus = new SfcBus(fixture(), { eventLimit: 4 });
  assert.equal(bus.read8(0x700000), 0x60, 'fresh SRAM matches the Snes9x probe pattern');
  bus.write16(0x700800, 0x1234);
  assert.equal(bus.read16(0x700800), 0x1234);
  assert.equal(bus.read16(0xf00800), 0x1234, 'high-bank SRAM mirror');
  assert.equal(bus.events.length, 0, 'SRAM writes are not I/O events');
});

test('absolute stores use the data bank register', () => {
  for (const [opcode, value, target] of [
    [0x8d, 0x1234, 'a'], [0x8e, 0x1234, 'x'], [0x8c, 0x1234, 'y'], [0x9c, 0, null],
  ]) {
    const rom = fixture();
    rom.set([opcode, 0xe3, 0xf6]);
    const bus = new SfcBus(rom);
    const cpu = new Cpu65816(bus);
    cpu.e = false; cpu.p &= ~(0x20 | 0x10); cpu.dbr = 0x7e;
    if (target) cpu[target] = value;
    cpu.step();
    assert.equal(bus.read16(0x7ef6e3), value, `opcode $${opcode.toString(16)}`);
    assert.equal(bus.read16(0x00f6e3), 0, 'bank zero is untouched');
  }
});

test('absolute indexed addressing carries into the next data bank', () => {
  const rom = fixture();
  // STA $4e0c,Y with DB=$7e and Y=$fffe targets $7f:4e0a, not $7e:4e0a.
  rom.set([0x99, 0x0c, 0x4e]);
  const bus = new SfcBus(rom);
  bus.wram.fill(0x55);
  const cpu = new Cpu65816(bus);
  cpu.e = false; cpu.p &= ~(0x20 | 0x10); cpu.dbr = 0x7e;
  cpu.a = 0; cpu.y = 0xfffe;
  cpu.step();
  assert.equal(bus.read16(0x7f4e0a), 0);
  assert.equal(bus.read16(0x7e4e0a), 0x5555, 'the pre-carry bank is untouched');
});

test('implements every opcode in all architected width modes', () => {
  const modes = [
    { e: true, p: 0x34 },
    { e: false, p: 0x00 }, { e: false, p: 0x10 },
    { e: false, p: 0x20 }, { e: false, p: 0x30 },
  ];
  for (let opcode = 0; opcode < 0x100; opcode++) for (const mode of modes) {
    const rom = fixture();
    rom.set([opcode, 0x00, 0x00, 0x00]);
    const bus = new SfcBus(rom);
    const cpu = new Cpu65816(bus, { traceLimit: 0 });
    cpu.e = mode.e; cpu.p = mode.p; cpu.s = 0x01f0;
    assert.doesNotThrow(() => cpu.step(),
      `opcode $${opcode.toString(16).padStart(2, '0')} E=${Number(mode.e)} P=$${mode.p.toString(16)}`);
  }
});

test('exposes the SPC700 IPL ready word and echoes transfer tokens', () => {
  const bus = new SfcBus(fixture(), { eventLimit: 4 });
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
  assert.equal(READ_POINT[0xeb], 1, 'IPL MOV Y,dp samples the pending CPU port write');
  assert.equal(READ_POINT[0x7e], -1, 'IPL CMP Y,dp retains the old value at its boundary');
  const calls = [];
  const apu = {
    cpu: { clock: 0, step() { this.clock++; } },
    cpuRead(port) { calls.push(['read', this.cpu.clock, port]); return 0x50 + port; },
    cpuWrite(port, value) { calls.push(['write', this.cpu.clock, port, value]); },
  };
  const link = new MasterLink(apu);
  const bus = new SfcBus(fixture(), { masterLink: link, apuTraceLimit: 4 });
  assert.equal(bus.read8(0x2142, 328125), 0x52);
  bus.write8(0x2141, 0x7f, 656250);
  assert.deepEqual(calls, [['read', 15663, 2]], 'read observes only completed SPC instructions; write is queued');
  link.sync(656400);
  assert.deepEqual(calls, [['read', 15663, 2]], 'sync does not deliver a write before the SPC reads its port');
  apu.cpu.onPortRead(31336, 0);
  assert.deepEqual(calls, [['read', 15663, 2], ['write', 31333, 1, 0x7f]]);
  assert.deepEqual(bus.apuTrace, [
    { masterCycle: 328125, direction: 'r', port: 2, value: 0x52 },
    { masterCycle: 656250, direction: 'w', port: 1, value: 0x7f },
  ]);
});

test('charges memory-speed and internal master cycles per CPU bus transaction', () => {
  const rom = fixture();
  rom.set([0xad, 0x40, 0x21], 0); // LDA $2140
  const bus = new SfcBus(rom, { apuTraceLimit: 1 });
  const cpu = new Cpu65816(bus);
  cpu.step();
  assert.deepEqual(bus.apuTrace[0], {
    masterCycle: 198 + 8 + 8 + 8,
    direction: 'r', port: 0, value: 0xaa,
  });
  assert.equal(cpu.masterCycle, 198 + 8 + 8 + 8 + 6);
});

test('alternates 5A22-v2 WRAM refresh between H=538 and H=534', () => {
  const cpu = new Cpu65816(new SfcBus(fixture()));
  cpu.advanceMaster(340); // 198 -> 538, including the 40-master refresh stall
  assert.equal(cpu.masterCycle, 578);
  assert.equal(cpu.nextWramRefresh, 1898);
  assert.equal(cpu.refreshPosition, 534);
  cpu.advanceMaster(1320); // reaches the H=534 refresh on the following line
  assert.equal(cpu.masterCycle, 1938);
  assert.equal(cpu.nextWramRefresh, 3266);
  assert.equal(cpu.refreshPosition, 538);
});

test('places the 16-bit absolute-index penalty before the data bus read', () => {
  const rom = fixture();
  rom.set([0xbd, 0x40, 0x21], 0); // LDA $2140,X
  const bus = new SfcBus(rom, { apuTraceLimit: 1 });
  const cpu = new Cpu65816(bus);
  cpu.e = false;
  cpu.p = (cpu.p | 0x20) & ~0x10; // 8-bit A, 16-bit index
  cpu.x = 3;
  cpu.step();
  assert.deepEqual(bus.apuTrace[0], {
    masterCycle: 198 + 8 + 8 + 8 + 6,
    direction: 'r', port: 3, value: 0,
  });
  assert.equal(cpu.masterCycle, 198 + 8 + 8 + 8 + 6 + 6);
});

test('does not apply bank-zero I/O pointer timing to a bank-7E indirect destination', () => {
  const rom = fixture();
  rom.set([0x97, 0x02], 0); // STA [$02],Y
  const bus = new SfcBus(rom);
  bus.wram.set([0x00, 0x20, 0x7e], 2);
  const cpu = new Cpu65816(bus);
  cpu.e = false;
  cpu.p &= ~0x20; // 16-bit accumulator
  cpu.a = 0x1234;
  cpu.step();
  assert.equal(cpu.masterCycle - 198, 56);
  assert.equal(bus.wram[0x2000], 0x34);
  assert.equal(bus.wram[0x2001], 0x12);
});

test('preempts a CPU bus cycle with a raster event and includes its stall', () => {
  const cpu = new Cpu65816(new SfcBus(fixture()));
  let pending = true;
  cpu.eventScheduler = {
    nextCpuEvent: () => ({ type: 'test', master: pending ? 202 : Infinity }),
    runCpuEvent: () => { pending = false; return 4; },
  };
  cpu.advanceMaster(8);
  assert.equal(cpu.masterCycle, 210);
});

test('8-bit LSR A does not shift the hidden B accumulator into A', () => {
  const rom = fixture();
  rom.set([0x4a, 0x4a, 0x4a, 0xa8], 0); // LSR A x3; TAY
  const cpu = new Cpu65816(new SfcBus(rom));
  cpu.e = false;
  cpu.p |= 0x20 | 0x10; // 8-bit A and index registers
  cpu.a = 0x014a;
  cpu.run(4);
  assert.equal(cpu.a, 0x0109);
  assert.equal(cpu.y, 0x09);
});

test('M=1 accumulator shifts and rotates preserve B and set N/Z/C from A only', () => {
  const cases = [
    { opcode: 0x0a, name: 'ASL', input: 0xa581, carry: 0, result: 0xa502, flags: 0x01 },
    { opcode: 0x4a, name: 'LSR', input: 0xa581, carry: 0, result: 0xa540, flags: 0x01 },
    { opcode: 0x2a, name: 'ROL', input: 0xa580, carry: 1, result: 0xa501, flags: 0x01 },
    { opcode: 0x6a, name: 'ROR', input: 0xa501, carry: 1, result: 0xa580, flags: 0x81 },
  ];
  for (const entry of cases) {
    const rom = fixture();
    rom[0] = entry.opcode;
    const cpu = new Cpu65816(new SfcBus(rom));
    cpu.e = false;
    cpu.p = 0x20 | 0x10 | entry.carry;
    cpu.a = entry.input;
    cpu.step();
    assert.equal(cpu.a, entry.result, entry.name);
    assert.equal(cpu.p & 0x83, entry.flags, `${entry.name} N/Z/C`);
  }
});

test('M=0 accumulator shifts and rotates use the complete 16-bit C register', () => {
  const cases = [
    [0x0a, 0x8001, 0, 0x0002, 0x01],
    [0x4a, 0x8001, 0, 0x4000, 0x01],
    [0x2a, 0x8001, 1, 0x0003, 0x01],
    [0x6a, 0x0001, 1, 0x8000, 0x81],
  ];
  for (const [opcode, input, carry, result, flags] of cases) {
    const rom = fixture();
    rom[0] = opcode;
    const cpu = new Cpu65816(new SfcBus(rom));
    cpu.e = false;
    cpu.p = 0x10 | carry;
    cpu.a = input;
    cpu.step();
    assert.equal(cpu.a, result, `opcode $${opcode.toString(16)}`);
    assert.equal(cpu.p & 0x83, flags, `opcode $${opcode.toString(16)} N/Z/C`);
  }
});

test('M=1 memory shifts, rotates, TSB and TRB touch one byte only', () => {
  const cases = [
    { bytes: [0x06, 0x20], input: 0x81, carry: 0, result: 0x02, flags: 0x01 },
    { bytes: [0x46, 0x20], input: 0x81, carry: 0, result: 0x40, flags: 0x01 },
    { bytes: [0x26, 0x20], input: 0x80, carry: 1, result: 0x01, flags: 0x01 },
    { bytes: [0x66, 0x20], input: 0x01, carry: 1, result: 0x80, flags: 0x81 },
    { bytes: [0x04, 0x20], input: 0x0f, a: 0xa5f0, result: 0xff, flags: 0x02 },
    { bytes: [0x14, 0x20], input: 0xff, a: 0xa50f, result: 0xf0, flags: 0x00 },
  ];
  for (const entry of cases) {
    const rom = fixture();
    rom.set(entry.bytes, 0);
    const bus = new SfcBus(rom);
    bus.wram.set([entry.input, 0x5a], 0x20);
    const cpu = new Cpu65816(bus);
    cpu.e = false;
    cpu.p = 0x20 | 0x10 | entry.carry;
    cpu.a = entry.a ?? 0xa500;
    cpu.step();
    assert.equal(bus.wram[0x20], entry.result, `opcode $${entry.bytes[0].toString(16)}`);
    assert.equal(bus.wram[0x21], 0x5a, 'adjacent byte');
    assert.equal(cpu.a >>> 8, 0xa5, 'hidden B');
    assert.equal(cpu.p & 0x83, entry.flags, `opcode $${entry.bytes[0].toString(16)} N/Z/C`);
  }
});

test('M=1 INC/DEC, XBA and BIT immediate use the architected byte', () => {
  const cases = [
    { bytes: [0x1a], a: 0xa5ff, result: 0xa500, flags: 0x02 },
    { bytes: [0x3a], a: 0xa500, result: 0xa5ff, flags: 0x80 },
    { bytes: [0xeb], a: 0x0180, result: 0x8001, flags: 0x00 },
    { bytes: [0x89, 0x80], a: 0xa500, result: 0xa500, flags: 0x02 },
  ];
  for (const entry of cases) {
    const rom = fixture();
    rom.set(entry.bytes, 0);
    const cpu = new Cpu65816(new SfcBus(rom));
    cpu.e = false;
    cpu.p = 0x20 | 0x10 | 0x41; // prove BIT # preserves N/V/C
    cpu.a = entry.a;
    cpu.step();
    assert.equal(cpu.a, entry.result, `opcode $${entry.bytes[0].toString(16)}`);
    assert.equal(cpu.p & 0xc3, entry.flags | 0x41, `opcode $${entry.bytes[0].toString(16)} flags`);
  }
});

test('native timing includes direct-page, PHP, TSC and 16-bit indexed penalties', () => {
  const cases = [
    { bytes: [0x85, 0x20], setup: (cpu) => { cpu.d = 0x0101; }, cycles: 30 },
    { bytes: [0x08], cycles: 22 },
    { bytes: [0x28], cycles: 28 },
    { bytes: [0x3b], cycles: 14 },
    { bytes: [0xbb], cycles: 14 },
    { bytes: [0xbd, 0x00, 0x01], setup: (cpu) => { cpu.p &= ~0x10; }, cycles: 38 },
  ];
  for (const entry of cases) {
    const rom = fixture();
    rom.set(entry.bytes, 0);
    const cpu = new Cpu65816(new SfcBus(rom));
    cpu.e = false;
    entry.setup?.(cpu);
    const start = cpu.masterCycle;
    cpu.step();
    assert.equal(cpu.masterCycle - start, entry.cycles, `opcode $${entry.bytes[0].toString(16)}`);
  }
});

test('X=1 clears and keeps the high bytes of X and Y clear', () => {
  const rom = fixture();
  rom.set([0xe2, 0x10, 0xe8, 0x88], 0); // SEP #$10; INX; DEY
  const cpu = new Cpu65816(new SfcBus(rom));
  cpu.e = false;
  cpu.p = 0x20;
  cpu.x = 0x12ff;
  cpu.y = 0x3400;
  cpu.run(3);
  assert.equal(cpu.x, 0x00);
  assert.equal(cpu.y, 0xff);
  assert.equal(cpu.p & 0x82, 0x80, 'DEY sets N and clears Z from the 8-bit result');
});

test('enters the native NMI vector with a restorable interrupt frame', () => {
  const rom = fixture();
  rom[0x7fea] = 0x34;
  rom[0x7feb] = 0x12;
  const bus = new SfcBus(rom);
  const cpu = new Cpu65816(bus);
  cpu.e = false;
  cpu.pbr = 2;
  cpu.pc = 0xc567;
  const stack = cpu.s;
  const master = cpu.masterCycle;
  cpu.nmi();
  assert.equal(cpu.address(), 0x001234);
  assert.equal(cpu.s, stack - 4);
  assert.equal(cpu.masterCycle - master, 62, 'native NMI starts with an 8-master fetch plus one internal cycle');
  cpu.pc = 0x8000;
  rom[0] = 0x40; // RTI
  cpu.step();
  assert.equal(cpu.address(), 0x02c567);
});

test('DMA mode 1 writes source bytes through the VRAM data ports', () => {
  const bus = new SfcBus(fixture(), { eventLimit: 32 });
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
  assert.equal(bus.takeDmaMasterCycles(), 18 + 8 + 4 * 8);
});

test('VMAIN modes 1-3 remap VRAM writes and buffered reads', () => {
  const cases = [
    { mode: 1, mapped: 0x12a1 },
    { mode: 2, mapped: 0x13a0 },
    { mode: 3, mapped: 0x11a4 },
  ];
  for (const { mode, mapped } of cases) {
    const bus = new SfcBus(fixture());
    bus.write8(0x2115, 0x80 | (mode << 2)); // increment after high port
    bus.write8(0x2116, 0x34);
    bus.write8(0x2117, 0x12);
    bus.write8(0x2118, 0x56);
    bus.write8(0x2119, 0x78);
    assert.equal(bus.vram[mapped * 2], 0x56, `mode ${mode} low write`);
    assert.equal(bus.vram[mapped * 2 + 1], 0x78, `mode ${mode} high write`);
    assert.equal(bus.vramAddress, 0x1235, `mode ${mode} increments logical VMADD`);

    bus.vram[mapped * 2] = 0xbc;
    bus.vram[mapped * 2 + 1] = 0x9a;
    bus.write8(0x2116, 0x34);
    bus.write8(0x2117, 0x12); // VMADDH prefetches through the same remap.
    assert.equal(bus.read8(0x2139), 0xbc, `mode ${mode} buffered low read`);
    assert.equal(bus.read8(0x213a), 0x9a, `mode ${mode} buffered high read`);
    assert.equal(bus.vramAddress, 0x1235, `mode ${mode} read increments after high port`);
  }
});

test('publishes multiplication and division results only after their hardware delay', () => {
  const bus = new SfcBus(fixture());
  bus.write8(0x4202, 7, 100);
  bus.write8(0x4203, 9, 112);
  assert.equal(bus.read8(0x4216, 159) | (bus.read8(0x4217, 159) << 8), 0);
  assert.equal(bus.read8(0x4216, 160) | (bus.read8(0x4217, 160) << 8), 63);

  bus.write8(0x4204, 0x34, 200);
  bus.write8(0x4205, 0x12, 212);
  bus.write8(0x4206, 0x10, 224);
  assert.equal(bus.read8(0x4214, 319) | (bus.read8(0x4215, 319) << 8), 0);
  assert.equal(bus.read8(0x4214, 320) | (bus.read8(0x4215, 320) << 8), 0x0123);
  assert.equal(bus.read8(0x4216, 320) | (bus.read8(0x4217, 320) << 8), 4);
});

test('reports an NMI-enable rising edge at its bus transaction', () => {
  const enables = [];
  const bus = new SfcBus(fixture(), { onNmiEnable: (master) => enables.push(master) });
  bus.write8(0x4200, 0x01, 100);
  bus.write8(0x4200, 0x81, 200);
  bus.write8(0x4200, 0x81, 300);
  assert.deepEqual(enables, [200]);
});

test('controller latch publishes the standard auto-joypad result', () => {
  const rom = fixture();
  rom[0x7fea] = 0x00;
  rom[0x7feb] = 0x80;
  const bus = new SfcBus(rom);
  bus.write8(0x4200, 1);
  bus.setController1(0x1080); // Hardware JOY1 bits: Start + A
  bus.latchControllers();
  assert.equal(bus.read16(0x4218), 0x1080);
});

test('NMI latches RDNMI bit 7 until $4210 is read', () => {
  const rom = fixture();
  rom[0x7fea] = 0x00;
  rom[0x7feb] = 0x80;
  const bus = new SfcBus(rom);
  const cpu = new Cpu65816(bus);
  cpu.e = false;
  cpu.nmi();
  assert.equal(bus.read8(0x4210), 0xc2);
  assert.equal(bus.read8(0x4210), 0x42);
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

test('composites the subscreen through CGWSEL and CGADSUB', () => {
  const bus = new SfcBus(new Uint8Array(0x8000));
  bus.io[0x2100 - 0x2000] = 15;
  bus.io[0x2105 - 0x2000] = 0;
  bus.io[0x212c - 0x2000] = 0;
  bus.io[0x212d - 0x2000] = 0;
  bus.io[0x2130 - 0x2000] = 2;
  bus.io[0x2131 - 0x2000] = 0x20 | 0x40;
  // Backdrop participates in math on both screens. Half addition must retain
  // the backdrop instead of incorrectly using the fixed colour register.
  bus.cgram[0] = 0x1f;
  const frame = renderFrame(bus, 1, 1);
  assert.deepEqual([...frame], [255, 0, 0, 255]);
});

test('performs colour math and brightness in five-bit integer space', () => {
  const bus = new SfcBus(new Uint8Array(0x8000));
  bus.io[0x2100 - 0x2000] = 15;
  bus.io[0x2130 - 0x2000] = 0; // fixed colour is the second operand
  bus.io[0x2131 - 0x2000] = 0x20 | 0x40; // backdrop math + half
  bus.cgram[0] = 31;
  bus.write8(0x2132, 0x20 | 31);
  // Half add averages the operands in five-bit space: (31 + 31) >> 1 = 31.
  assert.deepEqual([...renderFrame(bus, 1, 1)], [255, 0, 0, 255]);
  bus.io[0x2131 - 0x2000] = 0x20 | 0x40 | 0x80; // backdrop subtract + half
  bus.write8(0x2132, 0x20 | 1);
  assert.deepEqual([...renderFrame(bus, 1, 1)], [123, 0, 0, 255]);
  bus.io[0x2131 - 0x2000] = 0;
  bus.io[0x2100 - 0x2000] = 7;
  // Brightness is quantized in five-bit space: round(31 * 7 / 15) = 14.
  assert.deepEqual([...renderFrame(bus, 1, 1)], [115, 0, 0, 255]);
});

test('applies both colour-window logic and clip/prevent modes', () => {
  const bus = new SfcBus(new Uint8Array(0x8000));
  bus.io[0x2100 - 0x2000] = 15;
  bus.cgram[0] = 0x1f;
  bus.io[0x2125 - 0x2000] = 0x20; // colour window 1 enabled, not inverted
  bus.io[0x2126 - 0x2000] = 0;
  bus.io[0x2127 - 0x2000] = 0;
  bus.io[0x2130 - 0x2000] = 0x80; // clip inside the colour window
  assert.deepEqual([...renderFrame(bus, 1, 1)], [0, 0, 0, 255]);
});

test('renders mode 7 through the affine matrix and interleaved VRAM', () => {
  const bus = new SfcBus(new Uint8Array(0x8000));
  bus.io[0x2100 - 0x2000] = 15;
  bus.io[0x2105 - 0x2000] = 7;
  bus.io[0x212c - 0x2000] = 1;
  bus.mode7[0] = 0x100;
  bus.mode7[3] = 0x100;
  bus.vram[0] = 0;
  bus.vram[17] = 1; // visible line 0 samples mode-7 source row 1
  bus.cgram[2] = 0xe0;
  bus.cgram[3] = 0x03;
  assert.deepEqual([...renderFrame(bus, 1, 1)], [0, 255, 0, 255]);
});

test('runs an HDMA table at HBlank and charges its bus cycles', () => {
  const bus = new SfcBus(new Uint8Array(0x8000));
  bus.io[0x4300 - 0x2000] = 0;
  bus.io[0x4301 - 0x2000] = 0x22;
  bus.io[0x4302 - 0x2000] = 0x00;
  bus.io[0x4303 - 0x2000] = 0x10;
  bus.io[0x4304 - 0x2000] = 0x7e;
  bus.io[0x420c - 0x2000] = 1;
  bus.wram.set([0x81, 0x1f, 0], 0x1000);
  assert.equal(bus.initHdma(20), 26);
  assert.equal(bus.runHdmaLine(1106), 34);
  assert.equal(bus.cgram[0], 0x1f);
  assert.equal(bus.hdmaActive, 0);
});

test('renders each scanline from the PPU state visible on that line', () => {
  const bus = new SfcBus(new Uint8Array(0x8000));
  bus.io[0x2100 - 0x2000] = 15;
  const rgba = new Uint8ClampedArray(2 * 4);
  bus.cgram[0] = 0x1f;
  renderScanline(bus, rgba, 0, 1, 2);
  bus.cgram[0] = 0xe0; bus.cgram[1] = 0x03;
  renderScanline(bus, rgba, 1, 1, 2);
  assert.deepEqual([...rgba], [255, 0, 0, 255, 0, 255, 0, 255]);
});

test('mode 1 BG3 2bpp palettes start at CGRAM colour zero', () => {
  const bus = new SfcBus(new Uint8Array(0x8000));
  bus.io[0x2100 - 0x2000] = 15;
  bus.io[0x2105 - 0x2000] = 1;
  bus.io[0x2109 - 0x2000] = 4; // BG3 map at VRAM byte $0800
  bus.io[0x212c - 0x2000] = 4;
  bus.vram[2] = 0x80; // tile 0, visible line 0/source row 1 = colour 1
  bus.vram[0x800] = 0;
  bus.vram[0x801] = 0;
  bus.cgram[2] = 0xff;
  bus.cgram[3] = 0x7f; // colour 1 = white
  bus.cgram[130] = 0x1f; // old incorrect BG3 colour 65 = red
  assert.deepEqual([...renderFrame(bus, 1, 1)], [255, 255, 255, 255]);
});

test('OBJ name-select uses the OBSEL gap instead of a fixed tile-256 base', () => {
  const bus = new SfcBus(new Uint8Array(0x8000));
  bus.io[0x2100 - 0x2000] = 15;
  bus.io[0x2101 - 0x2000] = 0x08; // name-select gap = two 8-KiB blocks
  bus.io[0x212c - 0x2000] = 0x10;
  bus.oam.set([0, 0, 0, 1], 0); // object 0 selects the second name table
  bus.vram[0x4000] = 0x80;
  bus.cgram[258] = 0x1f; // OBJ palette 0, colour 1 = red
  assert.deepEqual([...renderFrame(bus, 1, 1)], [255, 0, 0, 255]);
});
