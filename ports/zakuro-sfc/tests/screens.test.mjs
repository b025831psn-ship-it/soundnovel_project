import test from 'node:test';
import assert from 'node:assert/strict';
import { PAD } from '../input-queue.js';
import { itemAt, planFor, planForLateTap, screenOf } from '../screens.js';

const wram = (values) => { const w = new Uint8Array(0x20000); for (const [a, v] of Object.entries(values)) w[Number(a)] = v; return w; };

test('screens are named from the waiting routine', () => {
  assert.equal(screenOf(wram({ 0x1ffd: 0xd0 }), null), 'start');
  assert.equal(screenOf(wram({ 0x1ffd: 0xef, 0x1ffa: 0 }), null), 'slots');
  assert.equal(screenOf(wram({ 0x1ffd: 0xf1, 0x1ffa: 0x81 }), null), 'names');
  assert.equal(screenOf(wram({ 0x1ffd: 0xf1, 0x1ffa: 0x9c }), null), 'busy');
  assert.equal(screenOf(wram({ 0x1ffd: 0x94 }), null), 'story');
  assert.equal(screenOf(wram({ 0x1ffd: 0xd0 }), { choice: {} }), 'choice');
});

test('taps away from every item decide nothing', () => {
  const w = wram({});
  assert.equal(itemAt('file', 20, 20, w), null);
  assert.equal(itemAt('erase', 100, 100, w), null);
  assert.equal(itemAt('names', 120, 10, w), null);
  assert.equal(itemAt('slots', 2, 2, w), null);
});

test('items under the finger', () => {
  const w = wram({ 0x6e: 0 });
  assert.deepEqual(itemAt('file', 120, 141, w), { file: 1 });
  assert.deepEqual(itemAt('erase', 220, 165, w), { erase: 1 });
  assert.deepEqual(itemAt('names', 23 + 16 * 3 + 5, 46 + 16 * 4 + 5, w), { row: 4, column: 3 });
  assert.deepEqual(itemAt('names', 230, 170, w), { command: 2 });
  assert.deepEqual(itemAt('names', 18, 40, w), { mode: 0 });
  assert.deepEqual(itemAt('slots', 100, 60, w), { slot: 0 });
  assert.deepEqual(itemAt('slots', 230, 210, w), { slot: 2 });
});

test('a name-board plan walks columns, then rows, then presses A', () => {
  const w = wram({ 0x1ffd: 0xf1, 0x1ffa: 0x81, 0x341: 0, 0x342: 1 });
  const plan = planFor({ row: 2, column: 3 }, 'names', () => w, () => null);
  const presses = [];
  for (let i = 0; i < 10; i++) {
    const step = plan(null); presses.push(step.press);
    if (step.press === PAD.RIGHT) w[0x342]++;
    if (step.press === PAD.DOWN) w[0x341]++;
    if (step.done) break;
  }
  assert.deepEqual(presses, [PAD.RIGHT, PAD.RIGHT, PAD.DOWN, PAD.DOWN, PAD.A]);
});

test('a plan stops when the game leaves the screen', () => {
  const w = wram({ 0x1ffd: 0xf1, 0x1ffa: 0x91, 0x337: 0 });
  const plan = planFor({ file: 2 }, 'file', () => w, () => null);
  assert.equal(plan(null).press, PAD.DOWN);
  w[0x1ffa] = 0x9c; assert.equal(plan(null), undefined);
  w[0x1ffd] = 0xef; w[0x1ffa] = 0; assert.equal(plan(null), null);
});

test('a tap during a blink waits for the screen, then picks the item under it', () => {
  const w = wram({ 0x1ffd: 0xf1, 0x1ffa: 0x3c, 0x337: 0 });
  const plan = planForLateTap(120, 165, () => w, () => null);
  assert.equal(plan(null), undefined);
  w[0x1ffa] = 0x91;
  assert.equal(plan(null).press, PAD.DOWN);
});
