// Replay comparator check with a hand-written driver (no cartridge data).
import test from 'node:test';
import assert from 'node:assert/strict';
import { replay } from '../tools/replay-trace.mjs';

// Driver: wait for port0 != 0, write it to DSP reg $4C (KON), echo it on port0, loop.
const prog = Uint8Array.of(
  0xe4, 0xf4, 0xf0, 0xfc,       // $0400: MOV A,$F4; BEQ $0400
  0x8f, 0x4c, 0xf2, 0xc4, 0xf3, // MOV $F2,#$4C; MOV $F3,A
  0xc4, 0xf4, 0x2f, 0xfe);      // MOV $F4,A; BRA *
const records = [{ dest: 0x400, payload: prog }, { dest: 0x400 }];

test('replay applies CPU writes and matches DSP writes and port reads', () => {
  const ports = [['0', '0', 'w', '0', '00'], ['1', '21000', 'w', '0', '05'], ['2', '42000', 'r', '0', '05']];
  const r = replay({ records, ports, dsp: [['1010', '4c', '05']], calibrate: false });
  assert.equal(r.firstDiff, -1); assert.equal(r.readMismatch.length, 0); assert.ok(r.maxDrift < 20);
});

test('replay reports the first DSP divergence', () => {
  const ports = [['0', '0', 'w', '0', '00'], ['1', '21000', 'w', '0', '05']];
  const r = replay({ records, ports, dsp: [['1010', '4c', '06']], calibrate: false });
  assert.equal(r.firstDiff, 0);
});
