import assert from 'node:assert/strict';
import { formatKoreanText, hasKoreanFinalConsonant } from '../player.js';
import { normalizeStory } from '../story.js';

assert.equal(hasKoreanFinalConsonant('민준'), true);
assert.equal(hasKoreanFinalConsonant('마리'), false);

const names = { 0: '민준', 1: '마리' };
assert.equal(
  formatKoreanText('[n]0은(는) [n]0이(가) [n]0을(를) [n]0과(와) [n]0(이)라고 했다.', names),
  '민준은 민준이 민준을 민준과 민준이라고 했다.',
);
assert.equal(
  formatKoreanText('[n]1은(는) [n]1이(가) [n]1을(를) [n]1과(와) [n]1(이)라고 했다.', names),
  '마리는 마리가 마리를 마리와 마리라고 했다.',
);
assert.equal(formatKoreanText('[n]1에게 [n]9은(는)', names), '마리에게 [n]9은(는)');

const story = normalizeStory({
  schemaVersion: 1,
  gameId: 'particle-test',
  entry: 'text',
  names,
  nodes: { text: { pages: ['[n]1이(가) 왔다.'] } },
});
assert.deepEqual(story.names, ['민준', '마리']);
assert.deepEqual(story.nameTokens, names);

console.log('조사 선택 테스트 통과');
