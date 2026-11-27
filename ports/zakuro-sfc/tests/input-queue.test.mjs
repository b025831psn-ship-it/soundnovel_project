import test from 'node:test';
import assert from 'node:assert/strict';
import { InputQueue, PAD } from '../input-queue.js';

const run = (queue, state, fields) => Array.from({ length: fields }, () => queue.next(state()));

test('a tap is a short press then a release', () => {
  const q = new InputQueue(); q.tap(PAD.A);
  assert.deepEqual(run(q, () => null, 8), [PAD.A, PAD.A, PAD.A, 0, 0, 0, 0, 0]);
});

test('held keys combine with taps', () => {
  const q = new InputQueue(); q.held = PAD.UP; q.tap(PAD.A);
  assert.equal(q.next(null), PAD.UP | PAD.A);
});

test('choosing moves the game cursor one press at a time, reads it back, then confirms', () => {
  const q = new InputQueue();
  let cursor = 0;
  const state = () => ({ choice: { ready: true, cursor, count: 3 } });
  q.choose(2);
  const masks = [];
  for (let i = 0; i < 40; i++) {
    const m = q.next(state()); masks.push(m);
    if (m === PAD.DOWN && masks.at(-2) !== PAD.DOWN) cursor++; // the game moves once per press
  }
  assert.equal(cursor, 2);
  assert.equal(masks.filter((m, i) => m === PAD.A && masks[i - 1] !== PAD.A).length, 1);
  assert.ok(masks.indexOf(PAD.A) > masks.lastIndexOf(PAD.DOWN));
});

test('choosing waits while the list is still being built', () => {
  const q = new InputQueue(); q.choose(0);
  let ready = false;
  const state = () => ({ choice: ready ? { ready: true, cursor: 0, count: 2 } : { ready: false } });
  assert.deepEqual(run(q, state, 5), [0, 0, 0, 0, 0]);
  ready = true;
  assert.equal(q.next(state()), PAD.A);
});

test('a choice that never becomes ready is dropped', () => {
  const q = new InputQueue(); q.choose(1); q.tap(PAD.B);
  const masks = run(q, () => ({ choice: null }), 130);
  assert.ok(masks.includes(PAD.B));
});
