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

test('a CPU write reaches an SPC port read by its opcode read point', () => {
  // MOV A,!$00F4 (E5) sees a write made at T from s >= T; CMP A,!$00F4 (65) from s >= T + 3.
  const run = (op, writeMaster) => {
    const apu = new APU();
    // NOP x3 (clocks 0, 2, 4) ; op !$00F4 at clock 6 ; BRA self
    apu.cpu.uploadRecords([{ dest: 0x400, payload: Uint8Array.of(0x00, 0x00, 0x00, op, 0xf4, 0x00, 0x2f, 0xfe) }, { dest: 0x400 }]);
    apu.cpu.clock = 0; apu.cpu.a = 0;
    const link = new MasterLink(apu);
    link.write(writeMaster, 0, 0x5a);
    link.sync(2000);
    return op === 0xe5 ? apu.cpu.a === 0x5a : (apu.cpu.psw & 0x02) === 0x02; // CMP 0 vs 5A: Z only if seen as 0
  };
  const m = (t) => Math.ceil(t * 328125 / 15664); // smallest master with T >= t
  assert.equal(run(0xe5, m(6) - 1), true);   // T just under 6: seen at s = 6
  assert.equal(run(0xe5, m(6.01)), false);   // T > 6: not seen
  assert.equal(run(0x65, m(3) - 1), false);  // T < 3: seen, so A=0 != 5A, Z clear
  assert.equal(run(0x65, m(3.01)), true);    // T > 3: still old 0, Z set
});
