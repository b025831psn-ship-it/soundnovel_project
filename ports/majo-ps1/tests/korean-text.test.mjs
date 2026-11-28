import assert from 'node:assert/strict';
import test from 'node:test';
import {finalConsonant, formatKoreanText, tokenizeKoreanText} from '../src/korean-text.mjs';

test('all approved name particle pairs select by final consonant', () => {
  const source = '[n]1은(는) [n]1이(가) [n]1을(를) [n]1과(와) [n]1(으)로 [n]1(이)라고 [n]1(이)라는 [n]1(이)랑 [n]1(이)야 [n]1이었다(였다)!?';
  assert.equal(formatKoreanText(source, {1: '봄'}),
    '봄은 봄이 봄을 봄과 봄으로 봄이라고 봄이라는 봄이랑 봄이야 봄이었다!?');
  assert.equal(formatKoreanText(source, {1: '요리코'}),
    '요리코는 요리코가 요리코를 요리코와 요리코로 요리코라고 요리코라는 요리코랑 요리코야 요리코였다!?');
  assert.equal(formatKoreanText('[n]0(으)로', {0: '서울'}), '서울로');
  assert.equal(finalConsonant('서울'), 8);
});

test('translation controls and per-character waits stay ordered', () => {
  assert.deepEqual(tokenizeKoreanText('가[w10]나[r][k]', {}), [
    {type: 'glyph', value: '가'}, {type: 'control', value: 'w10'},
    {type: 'glyph', value: '나'}, {type: 'control', value: 'r'}, {type: 'control', value: 'k'},
  ]);
});
