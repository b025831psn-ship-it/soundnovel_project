import test from 'node:test';
import assert from 'node:assert/strict';
import { APU } from '../sound/apu.js';
import { MasterLink } from '../sound/master-link.js';
import { captureState, restoreState } from '../sound/state.js';

// Runs the APU from power-on with a few port writes so the IPL stand-in and the DSP move.
function busy() {
  const apu = new APU(); apu.powerOn();
  const link = new MasterLink(apu);
  link.advanceTo(100_000); link.sync(100_000);
  return { apu, link };
}

const sample = (apu, clocks) => {
  const out = []; apu.dsp.onSample = (l, r) => out.push(l, r);
  apu.run(clocks); apu.dsp.onSample = null;
  return { out, pc: apu.cpu.pc, clock: apu.cpu.clock, ram: Buffer.from(apu.cpu.ram).toString('hex') };
};

test('APU state round trip gives the same samples, PC and ARAM', () => {
  const { apu } = busy();
  apu.cpu.ram[0x400] = 0x55;
  const st = apu.saveState();
  const a = sample(apu, 50_000);
  apu.cpu.ram[0x400] = 0;
  apu.loadState(structuredClone(st));
  assert.equal(apu.cpu.ram[0x400], 0x55);
  const b = sample(apu, 50_000);
  assert.deepEqual(b, a);
});

test('restore keeps callbacks and shared ARAM', () => {
  const { apu } = busy();
  const cb = () => {}; apu.cpu.onPortWrite = cb;
  const st = apu.saveState();
  apu.loadState(st);
  assert.equal(apu.cpu.onPortWrite, cb);
  assert.equal(apu.dsp.ram ?? apu.cpu.ram, apu.cpu.ram);
});

test('MasterLink state includes pending writes and the APU', () => {
  const { link } = busy();
  link.pending.push([link.time + 10, 0, 0xaa]);
  const st = link.saveState();
  const before = link.time;
  link.advanceTo(link.master + 50_000); link.pending.length = 0;
  link.loadState(st);
  assert.equal(link.time, before);
  assert.deepEqual(link.pending.at(-1).slice(1), [0, 0xaa]);
});

test('captureState skips functions and keeps typed arrays as copies', () => {
  const o = { f() {}, a: new Uint8Array([1, 2]), n: { x: 3 } };
  const s = captureState(o);
  assert.equal('f' in s, false);
  o.a[0] = 9; o.n.x = 4;
  restoreState(o, s);
  assert.deepEqual([...o.a], [1, 2]); assert.equal(o.n.x, 3);
});
