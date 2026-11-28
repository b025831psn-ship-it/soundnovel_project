import test from 'node:test';
import assert from 'node:assert/strict';
import { APU } from '../sound/apu.js';
import { bootFromSnapshot } from '../sound/snapshot.js';

test('bootFromSnapshot loads ARAM except I/O, sets ports and starts at the entry', () => {
  const aram = new Uint8Array(0x10000);
  for (let i = 0; i < aram.length; i++) aram[i] = (i * 7 + 3) & 0xff;
  aram[0xf4] = 0xea; aram[0xf5] = 0xbb; aram[0xf6] = 0; aram[0xf7] = 0;
  aram[0x0600] = 0x2f; aram[0x0601] = 0xfe; // BRA $0600
  const dsp = new Uint8Array(128).fill(0x11);
  const apu = new APU();
  assert.equal(bootFromSnapshot(apu, { aram, dsp, iplClocks: 1000, timerLead: 3, dspAccessOffset: 5 }), 0x0600);
  assert.equal(apu.cpu.pc, 0x0600);
  assert.equal(apu.cpu.ram[0x00ef], aram[0x00ef]);
  assert.equal(apu.cpu.ram[0x0100], aram[0x0100]);
  assert.equal(apu.cpu.ram[0xffbf], aram[0xffbf]);
  assert.deepEqual([0, 1, 2, 3].map((p) => apu.cpuRead(p)), [0xea, 0xbb, 0, 0]);
  assert.equal(apu.dsp.regs[0x0c], 0x11);
  assert.equal(apu.cpu.dspAccessOffset, 5);
  assert.throws(() => bootFromSnapshot(new APU(), { aram: aram.subarray(1), iplClocks: 0 }));
});
