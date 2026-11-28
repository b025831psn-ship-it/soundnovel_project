import assert from 'node:assert/strict';
import { KOREAN_NO_START, NO_END, originalStoryBox, wordWidth } from '../text-layout.js';

assert.equal(wordWidth(Array.from('긴 어절'), 0, 0, () => 10), 10);
assert.equal(wordWidth(Array.from('두글자 끝'), 0, 0, () => 10), 30);
for (const mark of ['.', ',', '!', '?', '」', '』', '…', ')'])
  assert(KOREAN_NO_START.has(mark), `${mark} must not begin a Korean line`);
for (const mark of ['「', '(', '[']) assert(NO_END.has(mark), `${mark} must not end a line`);
const defaults = {marginLeft:32, marginRight:32, lineSpacing:7};
assert.deepEqual(originalStoryBox('my02_0035', defaults), {marginLeft:18, marginRight:18, lineSpacing:1});
assert.deepEqual(originalStoryBox('_my32', defaults), {marginLeft:18, marginRight:18, lineSpacing:1});
assert.deepEqual(originalStoryBox('my01_0079', defaults), {marginLeft:32, marginRight:32, lineSpacing:1});
for (const label of ['my02_0035','my02_0040','my02_0150','my02_0217','my02_0240',
  'my02_0250','my02_0260','my02_0270','_my22','my02_0450','my03_0010','_my32','my03_0440']) {
  const box = originalStoryBox(label, defaults);
  assert.equal(box.marginLeft, 18, `${label} original left margin`);
  assert.equal(box.marginRight, 18, `${label} original right margin`);
  assert.equal(box.lineSpacing, 1, `${label} original line spacing`);
}
const player = await import('node:fs').then(fs => fs.readFileSync(new URL('../player.js', import.meta.url), 'utf8'));
assert.match(player, /lineSpacing:7, fontType:0, fontSize:33/);
assert.match(player, /marginLeft:32, marginRight:32, marginTop:32, marginBottom:32/);
assert.match(player, /fontType:style\.fontType/);
const renderer = await import('node:fs').then(fs => fs.readFileSync(new URL('../render.js', import.meta.url), 'utf8'));
assert.match(renderer, /style\.fontType === 2/);
assert.match(renderer, /'「':'『', '」':'』'/);
console.log('Korean word wrapping and kinsoku tables OK');
