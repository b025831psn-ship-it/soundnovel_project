import test from 'node:test';
import assert from 'node:assert/strict';
import { SfcMachine, NTSC_MASTER_HZ } from '../machine.js';

function loopingRom() {
  const rom = new Uint8Array(0x8000);
  rom.set([0xea, 0x80, 0xfd]); // NOP; BRA $8000
  rom[0x7fea] = 0x00;
  rom[0x7feb] = 0x80;
  rom[0x7ffc] = 0x00;
  rom[0x7ffd] = 0x80;
  return rom;
}

test('runs to a master/time target at an instruction boundary', () => {
  const machine = new SfcMachine({ rom: loopingRom(), apu: null });
  const master = machine.runToMaster(10_000);
  assert.ok(master >= 10_000);
  assert.equal(machine.master, master);
  assert.equal(machine.time, master / NTSC_MASTER_HZ);

  const later = machine.runTo(machine.time + 0.001);
  assert.ok(later > master);

  machine.end = machine.time + 0.001;
  machine.runTo(machine.time + 1);
  assert.ok(machine.time >= machine.end);
  assert.ok(machine.time - machine.end < 0.00001, 'stops at the next instruction boundary');
});

test('owns frame, NMI and joypad scheduling', () => {
  const frames = [];
  const nmis = [];
  const joypads = [];
  const machine = new SfcMachine({
    rom: loopingRom(),
    apu: null,
    joypad: (nmi, frame) => { joypads.push([nmi, frame]); return 0x1234; },
    onFrame: (frame, framebuffer) => frames.push([frame, framebuffer]),
    onNmi: (frame, master) => nmis.push([frame, master]),
  });
  machine.bus.write8(0x4200, 0x81, machine.master);
  machine.runToMaster(307_000);
  assert.equal(machine.bus.read8(0x4212) & 1, 1, 'auto-read is busy after vblank starts');
  assert.equal(machine.bus.read16(0x4218), 0, 'result is not published before auto-read completes');
  machine.runToMaster(312_000);

  assert.equal(machine.frame, 1);
  assert.equal(nmis.length, 1);
  assert.equal(machine.nmiCount, 1);
  assert.deepEqual(joypads, [[0, 1]], 'physical poll precedes the first NMI');
  assert.equal(machine.bus.read8(0x4218), 0x34);
  assert.equal(machine.bus.read8(0x4219), 0x12);

  machine.setButtons(0xabcd);
  assert.equal(frames[0][0], 1);
  assert.ok(frames[0][1] instanceof Uint8ClampedArray);
  assert.equal(frames[0][1].length, 256 * 224 * 4);
  machine.runToMaster(670_000);
  assert.equal(machine.bus.read8(0x4218), 0xcd);
  assert.equal(machine.bus.read8(0x4219), 0xab);
});

test('delivers an NMI enable edge twelve masters into vblank', () => {
  let nmis = 0;
  const machine = new SfcMachine({
    rom: loopingRom(), apu: null, onNmi: () => nmis++,
  });
  machine.runToMaster(312_000);
  assert.equal(nmis, 0);
  const enabledAt = machine.master;
  machine.bus.write8(0x4200, 0x80, enabledAt);
  machine.runToMaster(enabledAt + 100);
  assert.equal(nmis, 1);
});

test('keeps debug histories disabled for an hour-equivalent 3600-frame run', () => {
  const machine = new SfcMachine({ rom: loopingRom(), apu: null });
  for (let frame = 0; frame < 3600; frame++) {
    machine.bus.write8(0x2100, frame, machine.master);
    machine.bus.read8(0x2140, machine.master);
    machine.cpu.masterCycle = machine.nextFrame;
    machine.step();
  }
  assert.equal(machine.frame, 3600);
  assert.equal(machine.bus.events.length, 0);
  assert.equal(machine.bus.apuTrace.length, 0);
  assert.equal(machine.cpu.trace.length, 0);
});

test('saveState restores a deterministic 1000-frame continuation', () => {
  const apu = {
    value: 7,
    cpu: { clock: 0, step() { this.clock++; } }, coreDelay: 0,
    cpuRead: () => 0, cpuWrite: () => {},
    saveState() { return { value: this.value, clock: this.cpu.clock }; },
    loadState(state) { this.value = state.value; this.cpu.clock = state.clock; },
  };
  const machine = new SfcMachine({ rom: loopingRom(), apu, onFrame: () => {} });
  machine.bus.write8(0x4200, 0x81, machine.master);
  while (machine.frame < 3) machine.step();
  const start = machine.saveState();
  const run = () => {
    const target = machine.frame + 1000;
    while (machine.frame < target) machine.step();
    return machine.saveState();
  };
  const first = run();
  machine.loadState(start);
  const second = run();
  for (const name of ['wram', 'vram', 'cgram', 'oam', 'io'])
    assert.deepEqual(second.bus[name], first.bus[name], name);
  assert.deepEqual(second.framebuffer, first.framebuffer);
  assert.deepEqual(second.machine, first.machine);
  assert.deepEqual(second.cpu, first.cpu);
  assert.deepEqual(second.masterLink, first.masterLink);
  assert.deepEqual(second.apu, first.apu);
});
