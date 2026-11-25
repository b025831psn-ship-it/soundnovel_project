// S-DSP checks with a hand-made BRR sample (no cartridge or chip-table data).
import test from 'node:test';
import assert from 'node:assert/strict';
import { SDSP, DSP_REGS as R } from '../sound/sdsp.js';
import { APU } from '../sound/apu.js';

function setup({ loop = true, gain = 0x7f, adsr = null } = {}) {
  const ram = new Uint8Array(0x10000);
  // DIR at $0200, source 0 -> start $1000, loop $1000
  ram.set([0x00, 0x10, 0x00, 0x10], 0x200);
  // one block: shift 12, filter 0, all nibbles +7; end flag, optional loop flag
  ram[0x1000] = 0xc0 | (loop ? 3 : 1); ram.fill(0x77, 0x1001, 0x1009);
  const d = new SDSP(ram);
  d.write(R.DIR, 0x02); d.write(R.FLG, 0x20); d.write(R.MVOLL, 0x7f); d.write(R.MVOLR, 0x7f);
  d.write(0x00, 0x7f); d.write(0x01, 0x40); d.write(0x02, 0x00); d.write(0x03, 0x10); // pitch $1000
  d.write(0x04, 0x00);
  if (adsr) { d.write(0x05, adsr[0]); d.write(0x06, adsr[1]); } else d.write(0x07, gain);
  const out = []; d.onSample = (l, r) => out.push([l, r]);
  return { d, out, ram };
}

test('BRR block decodes with shift and range clamp', () => {
  const { d } = setup();
  d.write(R.KON, 0x01);
  for (let i = 0; i < 12; i++) d.sample();
  const v = d.voices[0];
  assert.ok([...v.buf].some((s) => s === 28672), 'shift 12 nibble 7 -> 14336*2');
});

test('key-on, direct gain and stereo volume produce output', () => {
  const { d, out } = setup();
  d.write(R.KON, 0x01);
  for (let i = 0; i < 64; i++) d.sample();
  const [l, r] = out.at(-1);
  assert.ok(l > 0 && r > 0 && l > r, `expected louder left, got ${l},${r}`);
  assert.equal(d.read(0x08), 0x7f0 >> 4); // ENVX
  assert.equal(d.read(R.ENDX) & 1, 1);    // block end passed
});

test('non-looping end forces release and silence', () => {
  const { d, out } = setup({ loop: false });
  d.write(R.KON, 0x01);
  for (let i = 0; i < 64; i++) d.sample();
  assert.equal(d.voices[0].env, 0);
  assert.deepEqual(out.at(-1), [0, 0]);
});

test('ADSR attack rises to the top and switches to decay', () => {
  const { d } = setup({ adsr: [0x8f, 0xe0] }); // fastest attack, sustain level 7
  d.write(R.KON, 0x01);
  const modes = [];
  for (let i = 0; i < 20; i++) { d.sample(); modes.push(d.voices[0].mode); }
  assert.ok(modes.includes(2) || modes.includes(3));
  assert.ok(d.voices[0].env >= 0x700);
});

test('KOFF releases by 8 per sample', () => {
  const { d } = setup();
  d.write(R.KON, 0x01);
  for (let i = 0; i < 16; i++) d.sample();
  d.write(R.KOFF, 0x01);
  d.sample(); d.sample();
  const e0 = d.voices[0].env; d.sample();
  assert.equal(e0 - d.voices[0].env, 8);
});

test('APU renders 32 kHz samples from SPC700 clocks', () => {
  const apu = new APU();
  apu.cpu.uploadRecords([{ dest: 0x0400, payload: Uint8Array.of(0x2f, 0xfe) }, { dest: 0x0400 }]);
  const before = apu.cpu.clock;
  const pcm = apu.render(100);
  assert.equal(pcm.length, 200);
  assert.ok(apu.cpu.clock - before >= 3200 - 4 && apu.cpu.clock - before <= 3200 + 32);
  apu.cpuWrite(0, 0xaa); assert.equal(apu.cpu.read(0xf4), 0xaa);
});

test('envelope rate 0 never fires, including when the counter wraps', () => {
  const dsp = new SDSP(new Uint8Array(0x10000));
  for (let c = 0; c < 0x7800; c++) { dsp.counter = c; assert.equal(dsp.readCounter(0), true); }
});
