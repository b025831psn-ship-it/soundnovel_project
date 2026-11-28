import assert from 'node:assert/strict';
import test from 'node:test';
import {reportPayload} from '../../../shared/player/report-button.js';
import {startOptions} from '../../../shared/player/start-choice.js';
import {hitChoice} from '../../../shared/player/touch-choices.js';

test('title immediately offers only actions that can run', () => {
  assert.deepEqual(startOptions(false), ['new']);
  assert.deepEqual(startOptions(true), ['continue', 'new']);
});

test('pointer selects the native choice row directly', () => {
  const rows = [{index: 0, x: 18, y: 70, width: 284, height: 22}, {index: 1, x: 18, y: 94, width: 284, height: 22}];
  assert.equal(hitChoice(rows, 160, 100), 1);
  assert.equal(hitChoice(rows, 3, 3), null);
});

test('report payload contains only current context', () => {
  assert.deepEqual(reportPayload(() => ({scene: {resource: 'A10.BIN', pc: 4}, text: 'shown'})), {
    scene: {resource: 'A10.BIN', pc: 4}, text: 'shown',
  });
});
