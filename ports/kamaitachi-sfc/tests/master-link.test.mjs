import test from 'node:test';
import assert from 'node:assert/strict';
import { APU } from '../sound/apu.js';
import { MasterLink, SPC_NUM, SPC_DEN } from '../sound/master-link.js';

test('master clock converts with carried remainder and never runs backwards', () => {
  const apu = new APU();
  apu.cpu.uploadRecords([{ dest: 0x400, payload: Uint8Array.of(0x00, 0x2f, 0xfd) }, { dest: 0x400 }]);
  const link = new MasterLink(apu);
  for (let m = 0; m <= 21477270; m += 1361) link.advanceTo(m);
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
