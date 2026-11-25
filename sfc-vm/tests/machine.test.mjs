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

  assert.equal(machine.frame, 1);
  assert.equal(nmis.length, 1);
  assert.equal(machine.nmiCount, 1);
  assert.deepEqual(joypads, [[1, 1]]);
  assert.equal(machine.bus.read8(0x4218), 0x34);
  assert.equal(machine.bus.read8(0x4219), 0x12);

  machine.setButtons(0xabcd);
  assert.equal(frames[0][0], 1);
  assert.ok(frames[0][1] instanceof Uint8ClampedArray);
  assert.equal(frames[0][1].length, 256 * 224 * 4);
  machine.runToMaster(665_000);
  assert.equal(machine.bus.read8(0x4218), 0xcd);
  assert.equal(machine.bus.read8(0x4219), 0xab);
});

test('delivers an NMI enable edge twelve masters into vblank', () => {
  let nmis = 0;
  const machine = new SfcMachine({
    rom: loopingRom(), apu: null, onNmi: () => nmis++,
  });
  machine.runToMaster(307_000);
  assert.equal(nmis, 0);
  const enabledAt = machine.master;
  machine.bus.write8(0x4200, 0x80, enabledAt);
  machine.runToMaster(enabledAt + 100);
  assert.equal(nmis, 1);
});
