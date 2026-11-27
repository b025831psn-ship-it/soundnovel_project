import test from 'node:test';
import assert from 'node:assert/strict';
import { planTap, storyChoice, PressQueue } from '../sound/touch.js';

const ram = (set) => { const w = new Uint8Array(0x20000); w[0xd0] = 7; w[0x2482] = 0; for (const [a, v] of set) w[a] = v; return w; };
const io = new Uint8Array(0x4000); io[0x101] = 0x62;
const words = (a, list) => list.flatMap((v, i) => [[a + i * 2, v & 255], [a + i * 2 + 1, v >> 8]]);

test('story choice: tap moves to the option, tap on the chosen option confirms', () => {
  const w = ram([...words(0x426, [36, 82]), [0x15e7, 36]]);
  assert.deepEqual(storyChoice(w), { tops: [36, 82], current: 0 });
  assert.deepEqual(planTap(w, io, 100, 50), ['A']);
  assert.deepEqual(planTap(w, io, 100, 100), ['DOWN']);
  assert.deepEqual(planTap(w, io, 100, 20), []);
  const w3 = ram([...words(0x426, [13, 82, 151]), [0x15e7, 151]]);
  assert.deepEqual(planTap(w3, io, 0, 20), ['UP', 'UP']);
});

test('placeholder values in the option table are not a choice', () => {
  assert.equal(storyChoice(ram([...words(0x426, [3, 4]), [0x15e7, 13]])), null);
  assert.deepEqual(planTap(ram([...words(0x426, [3, 4])]), io, 10, 10), ['A']);
});

test('bookmark shelf and name check use their own cursors', () => {
  const ioB = new Uint8Array(0x4000); ioB[0x101] = 0x02;
  assert.deepEqual(planTap(ram([[0xd0, 0]]), ioB, 100, 140), ['DOWN', 'DOWN']);
  assert.deepEqual(planTap(ram([[0xd0, 1]]), ioB, 100, 90), ['A']);
  assert.deepEqual(planTap(ram([[0x3c3, 3], [0x2482, 0]]), io, 100, 150), ['DOWN']);
  assert.deepEqual(planTap(ram([[0x3c3, 3], [0x2482, 0]]), io, 100, 20), []);
});

test('press queue holds each button for a few frames then releases', () => {
  const q = new PressQueue({ down: 2, up: 2 }); q.push(1, 2);
  assert.deepEqual(Array.from({ length: 9 }, () => q.frame()), [1, 1, 0, 0, 2, 2, 0, 0, 0]);
});
