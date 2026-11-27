import test from 'node:test';
import assert from 'node:assert/strict';
import { APU } from '../sound/apu.js';

// Drives the documented IPL transfer protocol from the main CPU side.
function upload(apu, dest, bytes, exec) {
  const until = (f) => { for (let n = 0; n < 1e6 && !f(); n++) apu.cpu.step(); assert.ok(f()); };
  until(() => apu.cpuRead(0) === 0xaa && apu.cpuRead(1) === 0xbb);
  apu.cpuWrite(2, dest & 0xff); apu.cpuWrite(3, dest >> 8); apu.cpuWrite(1, 1); apu.cpuWrite(0, 0xcc);
  until(() => apu.cpuRead(0) === 0xcc);
  bytes.forEach((b, i) => { apu.cpuWrite(1, b); apu.cpuWrite(0, i); until(() => apu.cpuRead(0) === i); });
  const kick = (bytes.length + 2) & 0xff;
  apu.cpuWrite(2, exec & 0xff); apu.cpuWrite(3, exec >> 8); apu.cpuWrite(1, 0); apu.cpuWrite(0, kick);
  until(() => apu.cpu.hle.done);
  return kick;
}

test('IPL stand-in clears zero page, takes a block and jumps to it', () => {
  const apu = new APU(); apu.powerOn();
  apu.cpu.ram.fill(0x55, 0x00, 0xf0);
  const kick = upload(apu, 0x0400, [0x00, 0x2f, 0xfe], 0x0400); // NOP ; BRA self
  assert.equal(apu.cpu.pc, 0x0400);
  assert.deepEqual([...apu.cpu.ram.slice(0x400, 0x403)], [0x00, 0x2f, 0xfe]);
  assert.equal(apu.cpuRead(0), kick);
  assert.equal(apu.cpu.ram[0xef], 0); assert.equal(apu.cpu.ram[0x10], 0);
});

test('IPL stand-in shows AA/BB after the zero-page clear (2,394 + 10 clocks)', () => {
  const apu = new APU(); apu.powerOn();
  const seen = [];
  apu.cpu.onPortWrite = (t, p, v) => seen.push([t, p, v]);
  while (seen.length < 2) apu.cpu.step();
  assert.deepEqual(seen, [[2394, 0, 0xaa], [2399, 1, 0xbb]]);
});
