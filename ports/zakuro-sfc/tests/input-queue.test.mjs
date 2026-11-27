import test from 'node:test';
import assert from 'node:assert/strict';
import { InputQueue, MENU_PRESS, PAD } from '../input-queue.js';

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

test('a seek presses what the plan asks, reads it back after each press, and stops when done', () => {
  const q = new InputQueue();
  let cursor = 0;
  q.seek(() => (cursor === 2 ? { press: PAD.A, done: true } : { press: PAD.DOWN }));
  const masks = [];
  for (let i = 0; i < 60; i++) {
    const m = q.next(null); masks.push(m);
    if (m === PAD.DOWN && masks.at(-2) !== PAD.DOWN) cursor++;
  }
  assert.equal(cursor, 2);
  assert.equal(masks.filter((m) => m === PAD.DOWN).length, 2 * MENU_PRESS);
  assert.equal(masks.filter((m) => m === PAD.A).length, MENU_PRESS);
});

test('a seek waits while the screen changes and drops a plan that never settles', () => {
  const q = new InputQueue(); q.seek(() => undefined); q.tap(PAD.B);
  const masks = run(q, () => null, 200);
  assert.ok(masks.slice(0, 180).every((m) => m === 0));
  assert.ok(masks.includes(PAD.B));
});
