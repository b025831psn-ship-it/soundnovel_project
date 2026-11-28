import assert from 'node:assert/strict';
import test from 'node:test';
import {AudioDirector} from '../src/audio-director.mjs';
import {GameSession} from '../src/game-session.mjs';
import {CARD_SIZE, PRODUCT, VirtualMemoryCard} from '../src/memory-card.mjs';
import {DEFAULT_NAMES, completeNames, scenarioNames, validateName} from '../src/name-entry.mjs';
import {TransitionPlayer} from '../src/transition-player.mjs';

test('retail and Korean defaults use the original four-field order', () => {
  assert.deepEqual(scenarioNames(DEFAULT_NAMES.ja), ['津田', '依子']);
  assert.deepEqual(scenarioNames(DEFAULT_NAMES.ko), ['츠다', '요리코']);
  assert.equal(validateName('かなA1'), true);
  assert.equal(validateName('가 나'), false);
  assert.throws(() => completeNames({partnerGiven: '다섯글자임'}, 'ko'));
});

test('128 KiB virtual card starts empty and round-trips a session', () => {
  const card = new VirtualMemoryCard();
  assert.equal(card.export().length, CARD_SIZE);
  assert.equal(card.isEmpty(), true);
  const game = new GameSession({card});
  assert.deepEqual(game.titleOptions(), ['new']);
  game.newGame(); game.position.pc = 1234; game.flags[7] = 99; game.save();
  assert.equal(card.isEmpty(), false);
  assert.equal(new TextDecoder().decode(card.export().subarray(8192, 8192 + PRODUCT.length)), PRODUCT);
  const resumed = new GameSession({card: new VirtualMemoryCard(card.export())});
  assert.equal(resumed.continue(), true);
  assert.equal(resumed.position.pc, 1234);
  assert.equal(resumed.flags[7], 99);
});

test('audio replaces BGM, keeps exact loop metadata and plays effects', async () => {
  const calls = [];
  const director = new AudioDirector({
    stopMusic: async () => calls.push(['stop']),
    playMusic: async (id, options) => calls.push(['music', id, options]),
    playSound: async (id, options) => calls.push(['sound', id, options]),
  }, {music: {3: {loopStart: 1.25, loopEnd: 9.5}}});
  await director.handle({type: 'music', id: 3});
  await director.handle({type: 'music', id: 3});
  await director.handle({type: 'sound', id: 7, bank: 0, mode: 2, value: 4});
  assert.deepEqual(calls, [
    ['stop'], ['music', 3, {loop: true, loopStart: 1.25, loopEnd: 9.5}],
    ['sound', 7, {bank: 0, mode: 2, value: 4}],
  ]);
});

test('transition timing reaches the requested fade level', () => {
  const player = new TransitionPlayer();
  player.start({type: 'transition', actions: [['fade', 0, 255, 7, 4], ['wait', 'fade']]});
  const values = Array.from({length: 4}, () => player.tick().fadeLevel);
  assert.deepEqual(values, [64, 128, 191, 255]);
  assert.equal(player.tick().done, true);
});
