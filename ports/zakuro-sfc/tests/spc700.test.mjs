// SPC700 checks with hand-assembled programs (no cartridge or IPL data).
import test from 'node:test';
import assert from 'node:assert/strict';
import { SPC700, FLAGS } from '../sound/spc700.js';

function run(bytes, setup) {
  const cpu = new SPC700();
  cpu.uploadRecords([{ dest: 0x0400, payload: Uint8Array.from([...bytes, 0xff]) }, { dest: 0x0400 }]);
  if (setup) setup(cpu);
  let n = 0;
  while (!cpu.stopped && n++ < 100000) cpu.step();
  return cpu;
}

test('upload records place payloads and jump to the terminating destination', () => {
  const cpu = new SPC700();
  const exec = cpu.uploadRecords([
    { dest: 0x0200, payload: Uint8Array.of(0x5f, 0x97, 0x0b) },
    { dest: 0x0880, payload: Uint8Array.of(1, 2, 3) },
    { dest: 0x0200 },
  ]);
  assert.equal(exec, 0x0200);
  assert.deepEqual([...cpu.ram.subarray(0x200, 0x203)], [0x5f, 0x97, 0x0b]);
  cpu.step();
  assert.equal(cpu.pc, 0x0b97);
});

test('ADC/SBC flags and decimal adjust', () => {
  // MOV A,#$7F; CLRC; ADC A,#$01 -> $80 V N H
  let c = run([0xe8, 0x7f, 0x60, 0x88, 0x01]);
  assert.equal(c.a, 0x80);
  assert.ok(c.psw & FLAGS.V); assert.ok(c.psw & FLAGS.N); assert.ok(c.psw & FLAGS.H); assert.ok(!(c.psw & FLAGS.C));
  // MOV A,#$10; SETC; SBC A,#$20 -> $F0, borrow (C clear)
  c = run([0xe8, 0x10, 0x80, 0xa8, 0x20]);
  assert.equal(c.a, 0xf0); assert.ok(!(c.psw & FLAGS.C));
  // MOV A,#$19; CLRC; ADC A,#$28; DAA -> $47
  c = run([0xe8, 0x19, 0x60, 0x88, 0x28, 0xdf]);
  assert.equal(c.a, 0x47);
});

test('MUL, DIV and 16-bit word ops', () => {
  // MOV Y,#$12; MOV A,#$34; MOV X,#$56; DIV YA,X
  let c = run([0x8d, 0x12, 0xe8, 0x34, 0xcd, 0x56, 0x9e]);
  assert.equal(c.a, 0x36); assert.equal(c.y, 0x10);
  // MOV A,#$40; MOV Y,#$03; MUL YA -> $00C0
  c = run([0xe8, 0x40, 0x8d, 0x03, 0xcf]);
  assert.equal(c.ya, 0x00c0); assert.ok(!(c.psw & FLAGS.N));
  // MOVW YA from $10 ($1234), ADDW YA,$12 ($0FFF) -> $2233, then MOVW $14,YA; INCW $14
  c = run([0xba, 0x10, 0x7a, 0x12, 0xda, 0x14, 0x3a, 0x14], (cpu) => {
    cpu.ram.set([0x34, 0x12, 0xff, 0x0f], 0x10);
  });
  assert.equal(c.ya, 0x2233);
  assert.equal(c.ram[0x14] | (c.ram[0x15] << 8), 0x2234);
  assert.ok(c.psw & FLAGS.H);
});

test('direct page switch, indirect modes and bit operations', () => {
  // SETP; MOV $20,#$AA; CLRP; MOV X,#$02; MOV A,[$30+X] -> pointer at $32 = $0500
  const c = run([0x40, 0x8f, 0xaa, 0x20, 0x20, 0xcd, 0x02, 0xe7, 0x30,
    // SET1 $40.3; MOV1 C,$0041.0 -> C from bit; NOT1 $0041.0
    0x62, 0x40, 0xaa, 0x41, 0x00, 0xea, 0x41, 0x00], (cpu) => {
    cpu.ram.set([0x00, 0x05], 0x32); cpu.ram[0x500] = 0x5a; cpu.ram[0x41] = 1;
  });
  assert.equal(c.ram[0x120], 0xaa);
  assert.equal(c.a, 0x5a);
  assert.equal(c.ram[0x40], 0x08);
  assert.ok(c.psw & FLAGS.C);
  assert.equal(c.ram[0x41], 0);
});

test('loops, calls and taken-branch clocks', () => {
  // MOV Y,#3; loop: INC A; DBNZ Y,loop; CALL $0420; ... at $0420: MOV X,#$77; RET
  const prog = new Array(0x30).fill(0);
  prog.splice(0, 8, 0x8d, 0x03, 0xbc, 0xfe, 0xfd, 0x3f, 0x20, 0x04);
  prog[8] = 0xff;
  prog.splice(0x20, 3, 0xcd, 0x77, 0x6f);
  const cpu = new SPC700();
  cpu.uploadRecords([{ dest: 0x0400, payload: Uint8Array.from(prog) }, { dest: 0x0400 }]);
  const clocks = [];
  while (!cpu.stopped) clocks.push(cpu.step());
  assert.equal(cpu.a, 3); assert.equal(cpu.x, 0x77);
  // MOV Y(2) + 3*(INC 2 + DBNZ) with two taken (6) and one not (4) + CALL 8 + MOV 2 + RET 5
  assert.deepEqual(clocks.slice(0, 7), [2, 2, 6, 2, 6, 2, 4]);
  assert.equal(cpu.clock, clocks.reduce((a, b) => a + b, 0));
});

test('timers count at 8 kHz / 64 kHz and counters clear on read', () => {
  const cpu = new SPC700();
  cpu.uploadRecords([{ dest: 0x0400, payload: Uint8Array.of(0x2f, 0xfe) }, { dest: 0x0400 }]);
  cpu.write(0xfa, 2); cpu.write(0xfc, 4); cpu.write(0xf1, 0x05);
  cpu.run(128 * 6);
  assert.equal(cpu.read(0xfd), 3);
  assert.equal(cpu.read(0xfd), 0);
  assert.equal(cpu.read(0xff), (128 * 6 / 16 / 4) & 15);
});

test('APU ports and DSP register writes are logged with clocks', () => {
  const dsp = []; const ports = [];
  const c = run([0x8f, 0x4c, 0xf2, 0x8f, 0x01, 0xf3, 0xe4, 0xf4, 0xc4, 0xf5],
    (cpu) => { cpu.onDspWrite = (t, r, v) => dsp.push([t, r, v]); cpu.onPortWrite = (t, p, v) => ports.push([t, p, v]); cpu.portIn[0] = 0xcc; });
  assert.deepEqual(dsp, [[5, 0x4c, 0x01]]);
  assert.deepEqual(ports, [[13, 1, 0xcc]]);
  assert.equal(c.dsp.read(0x4c), 1);
  assert.equal(c.portOut[1], 0xcc);
});

test('BRA takes 4 clocks including the jump', () => {
  const cpu = new SPC700();
  cpu.uploadRecords([{ dest: 0x0400, payload: Uint8Array.of(0x2f, 0x00, 0xff) }, { dest: 0x0400 }]);
  assert.equal(cpu.step(), 4);
});

test('timer reads see ticks up to two clocks before the read cycle', () => {
  const readY = (phase) => {
    const cpu = new SPC700();
    cpu.uploadRecords([{ dest: 0x0400, payload: Uint8Array.of(0xec, 0xfd, 0x00) }, { dest: 0x0400 }]);
    const t = cpu.timers[0]; t.enabled = true; t.target = 1; t.phase = phase;
    cpu.step();
    return cpu.y;
  };
  // MOV Y,!$00FD takes 4 clocks and reads on the last; a tick within its first clock counts.
  assert.equal(readY(127), 1);
  assert.equal(readY(126), 0);
});
