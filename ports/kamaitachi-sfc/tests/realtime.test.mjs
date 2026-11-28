import test from 'node:test';
import assert from 'node:assert/strict';
import { runRealtime } from '../sound/realtime.js';

const fakeMachine = (end) => ({ time: 0, end, calls: [], runTo(t) { this.calls.push(t); this.time = t; } });
const loop = () => { const q = []; return { q, schedule: (f) => q.push(f), tick() { q.shift()(); } }; };

test('follows wall clock and stops at the end', () => {
  const m = fakeMachine(0.05), l = loop(); let ms = 1000, flushes = 0;
  runRealtime(m, { flush: () => flushes++ }, { now: () => ms, schedule: l.schedule });
  l.tick(); assert.equal(m.time, 0);
  ms += 16; l.tick(); assert.ok(Math.abs(m.time - 0.016) < 1e-9);
  ms += 100; l.tick(); assert.equal(m.time, 0.05); assert.equal(l.q.length, 0); assert.equal(flushes, 3);
});

test('a stall is caught up by at most maxStep, then time re-anchors', () => {
  const m = fakeMachine(null), l = loop(); let ms = 0;
  runRealtime(m, { flush() {} }, { now: () => ms, schedule: l.schedule, maxStep: 0.1 });
  l.tick(); ms += 5000; l.tick();
  assert.ok(Math.abs(m.time - 0.1) < 1e-9);
  ms += 20; l.tick(); assert.ok(Math.abs(m.time - 0.12) < 1e-9);
});

test('pause freezes emulated time and resume does not jump', () => {
  const m = fakeMachine(null), l = loop(); let ms = 0;
  const r = runRealtime(m, { flush() {} }, { now: () => ms, schedule: l.schedule });
  l.tick(); ms += 10; l.tick(); r.setPaused(true);
  ms += 3000; l.tick(); assert.ok(Math.abs(m.time - 0.01) < 1e-9);
  r.setPaused(false); l.tick(); ms += 10; l.tick(); assert.ok(Math.abs(m.time - 0.02) < 1e-9);
});
