import assert from 'node:assert/strict';
import { KOREAN_NO_START, NO_END, wordWidth } from '../text-layout.js';

assert.equal(wordWidth(Array.from('긴 어절'), 0, 0, () => 10), 10);
assert.equal(wordWidth(Array.from('두글자 끝'), 0, 0, () => 10), 30);
for (const mark of ['.', ',', '!', '?', '」', '』', '…', ')'])
  assert(KOREAN_NO_START.has(mark), `${mark} must not begin a Korean line`);
for (const mark of ['「', '(', '[']) assert(NO_END.has(mark), `${mark} must not end a line`);
console.log('Korean word wrapping and kinsoku tables OK');
