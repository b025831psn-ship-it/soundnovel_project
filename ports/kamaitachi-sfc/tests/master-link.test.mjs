import test from 'node:test';
import assert from 'node:assert/strict';
import { APU } from '../sound/apu.js';
import { MasterLink, SPC_NUM, SPC_DEN } from '../sound/master-link.js';

test('master clock converts with carried remainder and never runs backwards', () => {
  const apu = new APU();
  apu.cpu.uploadRecords([{ dest: 0x400, payload: Uint8Array.of(0x00, 0x2f, 0xfd) }, { dest: 0x400 }]);
  const link = new MasterLink(apu);
  for (let m = 0; m <= 21477270; m += 1361) link.sync(m);
  const exact = Math.floor(link.master * SPC_NUM / SPC_DEN);
  assert.equal(link.target, exact);
  assert.ok(apu.cpu.clock >= exact && apu.cpu.clock < exact + 8);
  assert.throws(() => link.advanceTo(0));
});

test('port write is visible to the SPC after the link reaches that master time', () => {
  const apu = new APU();
  // MOV A,$F4 ; MOV $F5,A ; BRA back
  apu.cpu.uploadRecords([{ dest: 0x400, payload: Uint8Array.of(0xe4, 0xf4, 0xc4, 0xf5, 0x2f, 0xfa) }, { dest: 0x400 }]);
  const link = new MasterLink(apu);
  link.write(1000, 0, 0x5a);
  assert.equal(link.read(1000 + 2000, 1), 0x5a);
});

test('a CPU read sees an SPC port write only once the write started more than one clock earlier', () => {
  const at = (master) => {
    const apu = new APU();
    // NOP (clock 0-1) ; MOV $F4,#$77 starts at clock 2 ; BRA self
    apu.cpu.uploadRecords([{ dest: 0x400, payload: Uint8Array.of(0x00, 0x8f, 0x77, 0xf4, 0x2f, 0xfe) }, { dest: 0x400 }]);
    apu.cpu.clock = 0;
    return new MasterLink(apu).read(master, 0);
  };
  // T = master * 15664 / 328125; visible iff 2 + 1 < T
  assert.equal(at(62), 0x00); // T = 2.96
  assert.equal(at(63), 0x77); // T = 3.007
});

test('a CPU write reaches SPC instructions that start WRITE_LAG clocks later', () => {
  const apu = new APU();
  // loop: MOV A,$F4 (3) ; MOV $00,A (4) ; BRA loop (4)
  apu.cpu.uploadRecords([{ dest: 0x400, payload: Uint8Array.of(0xe4, 0xf4, 0xc4, 0x00, 0x2f, 0xfa) }, { dest: 0x400 }]);
  apu.cpu.clock = 0;
  const link = new MasterLink(apu, { writeLag: 2.1 });
  const seen = [];
  const op = apu.cpu.step.bind(apu.cpu);
  apu.cpu.step = () => { const s = apu.cpu.clock, r = op(); if (apu.cpu.ram[0] === 0x5a && !seen.length) seen.push(s); return r; };
  link.write(21, 0, 0x5a); // T = 1.0025, due = ceil(3.1025) = 4
  link.sync(2000);
  // MOV A,$F4 runs at 0, 11, 22...; the first start >= 4 is 11, then MOV $00,A at 14
  assert.deepEqual(seen, [14]);
});
