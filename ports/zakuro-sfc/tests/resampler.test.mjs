import test from 'node:test';
import assert from 'node:assert/strict';
import { Resampler } from '../sound/resampler.js';

test('resampler holds rate ratio and keeps DC level', () => {
  const rs = new Resampler({ inRate: 32040, outRate: 48000, target: 0.05 });
  const pcm = new Int16Array(32040 * 2).fill(16384);
  rs.push(pcm);
  const L = new Float32Array(48000 / 2), R = new Float32Array(48000 / 2);
  const before = rs.read; rs.pull(L, R);
  const consumed = rs.read - before;
  assert.ok(Math.abs(consumed - 16020) < 16020 * 0.006, `consumed ${consumed}`);
  assert.ok(L.every((x) => Math.abs(x - 0.5) < 1e-6));
});

test('underrun outputs silence and counts only after audio has started', () => {
  const rs = new Resampler();
  const L = new Float32Array(128), R = new Float32Array(128);
  rs.pull(L, R);
  assert.equal(rs.underruns, 0); assert.ok(L.every((x) => x === 0));
  rs.push(new Int16Array(2 * 4)); rs.pull(L, R);
  assert.ok(rs.underruns > 120); assert.ok(L.slice(8).every((x) => x === 0));
});

test('fill above target speeds consumption slightly', () => {
  const a = new Resampler({ target: 0.05 }), b = new Resampler({ target: 0.05 });
  a.push(new Int16Array(2 * 1602)); b.push(new Int16Array(2 * 8000));
  const L = new Float32Array(256), R = new Float32Array(256);
  const ra = a.read; a.pull(L, R); const rb = b.read; b.pull(L, R);
  assert.ok(b.read - rb >= a.read - ra);
});
