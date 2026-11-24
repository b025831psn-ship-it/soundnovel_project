// Run against a locally prepared site. The test never attaches to a desktop browser.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(new URL('../../web-player/tests/e2e.mjs', import.meta.url));
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8772/';
const captures = process.argv[3];
if (captures) await mkdir(captures, {recursive:true});
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:960,height:768}});
const errors = [];
const requests = new Set();
const unexpected = [];
const site = new URL('./', base);
await page.route('**/*', route => {
  const url = new URL(route.request().url());
  requests.add(url.href);
  const local = url.origin === site.origin && url.pathname.startsWith(site.pathname);
  const relative = url.pathname.slice(site.pathname.length);
  const resource = /^(?:|index\.html|player\.css|(?:player|render|names)\.js|favicon\.ico|assets\/[\w.-]+\.(?:json|png|mp4|ogg|wav))$/.test(relative);
  if (local && resource) return route.continue();
  unexpected.push(url.href);
  return route.abort();
});
page.on('pageerror', error => errors.push(error.message));
page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(r.url()); });
const canvas = page.locator('canvas');
const at = scene => page.waitForFunction(s => document.querySelector('canvas').dataset.scene === s, scene);
const key = name => page.keyboard.press(name);
const label = () => canvas.getAttribute('aria-label');
const check = async name => {
  if (captures) await canvas.screenshot({path:path.join(captures, name + '.png')});
};
async function advanceTo(target, interval = 0) {
  for (let i = 0; i < 30; i++) {
    if ((await canvas.getAttribute('data-scene')) === target) return;
    assert.equal(await canvas.getAttribute('data-scene'), 'story');
    await key('Enter');
    if (interval) await page.waitForTimeout(interval);
  }
  throw new Error('Did not reach ' + target);
}
try {
  await page.goto(base);
  assert.equal(await page.locator('input[type=file]').count(),0);
  await page.getByRole('button', {name:'게임 시작'}).click();
  await at('logo');
  await page.waitForFunction(() => document.querySelector('video').currentTime > .25);
  assert.equal(await page.locator('video').evaluate(v=>v.videoWidth), 640);
  await at('copyright'); await check('copyright');
  await at('opening');
  await page.waitForFunction(() => document.querySelector('video').currentTime > .25);
  // Let the video emit its real ended event, including on local servers that
  // do not implement byte-range seeking.
  await page.locator('video').evaluate(v => { v.playbackRate = 8; });
  await at('title-entry');
  await page.waitForFunction(() => document.querySelector('video').currentTime > .25);
  await at('title');
  await page.waitForFunction(() => document.querySelector('video').currentTime > .3);
  await check('title');
  await key('ArrowLeft'); await key('2'); await at('autosave'); await check('autosave');
  await key('Enter'); await at('slot'); await key('Escape'); await at('autosave');
  await key('ArrowDown'); await key('Enter'); await at('story');
  await key('Enter'); await check('prologue');
  await advanceTo('name');
  assert.equal(await label(),'주인공 透');
  await check('hero');
  await key('ArrowRight');
  for (let i=0; i<9; i++) await key('ArrowDown');
  await page.getByRole('button',{name:'L1',exact:true}).click();
  await key('Enter'); assert.equal(await label(),'주인공 透Ａ');
  await key('Escape');
  await page.getByRole('button',{name:'R1',exact:true}).click();
  await key('Enter'); assert.equal(await label(),'주인공 透あ');
  await key('Escape');
  await key('ArrowDown'); await key('Enter'); assert.equal(await label(),'주인공 透い');
  await key('Escape'); await key('ArrowUp');
  await key('Escape'); await key('s'); await at('confirm');
  await key('Escape'); await at('name'); await key('s'); await at('confirm');
  assert.equal(await label(),'주인공 透');
  await key('Enter'); await at('name'); // The original confirmation starts on No.
  // Present the same pressed snapshot to the game's polling loop for one frame.
  await page.evaluate(async () => {
    const pressed = new Set([0, 1, 3, 4, 5]);
    Object.defineProperty(navigator, 'getGamepads', {configurable:true, value:() => [{
      mapping:'standard', buttons:Array.from({length:16}, (_, i) => ({pressed:pressed.has(i)})),
    }]});
    await new Promise(requestAnimationFrame);
    pressed.clear();
    await new Promise(requestAnimationFrame);
    // Hold through the second repeat, between the 24th and 30th PS2 ticks.
    pressed.add(15);
    const start = await new Promise(requestAnimationFrame);
    while (await new Promise(requestAnimationFrame) - start < 415) {}
    pressed.add(1);
    await new Promise(requestAnimationFrame);
    pressed.clear();
    await new Promise(requestAnimationFrame);
    delete navigator.getGamepads;
  });
  await at('name'); assert.equal(await label(),'주인공 透かガ');
  await key('Escape');
  await key('q'); await key('Escape'); await key('Enter');
  assert.equal(await label(),'주인공 透あ');
  await key('s'); await at('confirm'); await key('ArrowUp'); await key('Enter');
  await at('story'); assert.match(await label(),/透あ/);
  await advanceTo('name'); assert.equal(await label(),'여자친구 真理');
  await check('partner');
  await key('Escape'); await key('Enter'); await key('s'); await at('confirm');
  assert.equal(await label(),'여자친구 真あ'); await check('confirm');
  await key('ArrowUp'); await key('Enter'); await at('story');
  for (let i=0; i<8 && !(await label()).includes('真あの叔父さん'); i++) await key('Enter');
  assert.match(await label(), /ぼくと真あは以前/);
  assert.match(await label(), /真あの叔父さん/);
  assert.match(await label(),/真あ/); await check('completed');
  await advanceTo('choice');
  assert.equal(await label(), '急速に親しくなった。');
  await key('ArrowDown'); await key('Enter'); await at('story');
  assert.equal(await label(), '行ってから……どうなったんだっけ。');
  for (let i=0; i<10 && !(await label()).includes('気がつけば'); i++) await key('Enter');
  assert.equal(await label(), '気がつけば音が聞こえていた。');
  await page.waitForFunction(() => {
    const clip = document.querySelector('video');
    return clip.src.endsWith('/mo0001.mp4') && clip.ended && clip.videoWidth === 640;
  });
  for (let i=0; i<3 && !(await label()).startsWith('ぴしゃ'); i++) await key('Enter');
  assert.equal(await label(), 'ぴしゃ'.repeat(63));
  await advanceTo('complete');
  assert.equal(await label(), '波が船を舐める音だ。\nそうだ。ぼくは。\nぼくは船に乗っている。\nぼくは船に……。');
  assert.equal(await page.evaluate(()=>localStorage.getItem('soundnovel.slps25132.opening.v1')),null);
  await page.reload(); await page.getByRole('button',{name:'게임 시작'}).click();
  await key('Space'); await at('title'); await key('Enter'); await at('autosave');
  await key('Enter'); await at('slot'); await key('ArrowRight'); await key('Enter'); await at('file-select');
  await key('Escape'); await at('slot'); await key('Enter'); await at('file-select');
  await key('Enter'); await at('created'); await key('Enter'); await at('save-note'); await key('Enter'); await at('story');
  await advanceTo('name');
  for (let i=0; i<8; i++) await key('Enter');
  await key('ArrowRight'); await key('Enter');
  assert.equal((await label()).replace('주인공 ',''),'透ああああぁ');
  for (let i=0; i<2; i++) {
    await key('s'); await at('confirm'); await key('ArrowUp'); await key('Enter');
    if (!i) await advanceTo('name');
  }
  await advanceTo('choice'); await key('Enter'); await at('story');
  assert.equal(await label(), '急速に親しくなった。');
  for (let i=0; i<8 && !(await label()).includes('北海道に転勤'); i++) await key('Enter');
  assert.match(await label(), /真理のお父さんが北海道に転勤/);
  assert.match(await label(), /真理は大学をやめ、北海道に引っ越してしまった。$/);
  for (let i=0; i<8 && !(await label()).includes('一通の招待状'); i++) await key('Enter');
  assert.match(await label(), /^その後も、真理とは、手紙や電話/);
  assert.match(await label(), /一通の招待状が届いた。$/);
  for (let i=0; i<3 && !(await label()).startsWith('ゲームソフト'); i++) await key('Enter');
  assert.equal((await label()).split('\n').length, 2);
  for (let i=0; i<3 && !(await label()).includes('三日月館'); i++) await key('Enter');
  assert.equal((await label()).split('\n').length, 6);
  assert.match(await label(), /^ゲームソフト『かまいたちの夜』/);
  assert.match(await label(), /三日月館[^]*することができました。$/);
  for (let i=0; i<6 && !(await label()).includes('二日でご招待'); i++) await key('Enter');
  assert.match(await label(), /^風光明媚/);
  assert.match(await label(), /八月十五日\nから十六日まで/);
  for (let i=0; i<8 && !(await label()).endsWith('我孫子武丸'); i++) await key('Enter');
  assert.match(await label(), /八月吉日\n三日月館当主\n我孫子武丸$/);
  for (let i=0; i<8 && !(await label()).endsWith('出会ったことがないからだ。'); i++) await key('Enter');
  assert.match(await label(), /^この『我孫子武丸』というのは、『かまいたちの夜』/);
  assert.match(await label(), /出会ったことがないからだ。$/);
  for (let i=0; i<10 && !(await label()).endsWith('会えるかもしれない……。'); i++) await key('Enter');
  assert.deepEqual((await label()).split('\n'), [
    'この招待状は、真理にも届いているのだろうか。',
    'ぼくは、すぐに、真理に電話をした。',
    'もしかしたら、また、真理と会えるかもしれない……。',
  ]);
  await key('Enter');
  await key('Enter');
  assert.match(await label(), /「もしもし・・・・・・あ、真理？$/);
  await key('Enter');
  assert.equal(await canvas.getAttribute('data-scene'), 'story');
  await page.waitForTimeout(3000);
  await key('Enter');
  assert.match(await label(), /真理？ひさしぶりだね……」$/);
  await page.waitForFunction(() => document.querySelector('canvas').getAttribute('aria-label') === '八月十五日正午');
  await page.waitForFunction(() => {
    const ctx = document.querySelector('canvas').getContext('2d');
    return [[220,150],[270,230]].every(([x,y]) => {
      const pixels = ctx.getImageData(x,y,60,44).data;
      return pixels.some((value,i) => i % 4 === 0 && value > 200);
    });
  });
  for (const clip of ['my0003-1','my0003-2','my0005-1','my0005-2']) {
    await page.waitForFunction(name => {
      const v = document.querySelector('video');
      return v.src.endsWith('/' + name + '.mp4') && v.videoWidth === 640 && v.currentTime > 0;
    }, clip);
  }
  assert.equal(await label(), '「暑いわね」');
  const summerLines = ['「ほんとだ。こう暑くっちゃやりきれないよ」','「あら、私は夏は暑いほうが好きよ」',
    'え？','「だって、すがすがしいじゃない」','「・・・・・・そ、そうだよね」'];
  for (const line of summerLines) {
    const previous = await label();
    for (let i=0; i<20 && await label() === previous; i++) {
      await key('Enter');
      await page.waitForTimeout(80);
    }
    assert.equal(await label(), previous + '\n' + line);
  }
  for (let i=0; i<40 && !(await label()).endsWith('またきれいになっていた。'); i++) {
    await key('Enter');
    await page.waitForTimeout(100);
  }
  assert.deepEqual((await label()).split('\n'), [
    '真理らしい受け答えだ。',
    'ぼくは、あらためて、本物の真理が目の前にいることを実感した。',
    '１年半ぶりに会う真理。',
    '彼女は、またきれいになっていた。',
  ]);
  assert.ok(await page.locator('video').evaluate(v => v.src.endsWith('/my0006.mp4') && v.videoWidth === 640));
  for (let i=0; i<12 && !(await label()).endsWith('圧倒されていた。'); i++) await key('Enter');
  const description = (await label()).split('\n');
  assert.equal(description.length, 4);
  assert.equal(description[0], 'ショートパンツにＴシャツ……。');
  assert.equal(description[3], 'ひさしぶりに会ったぼくは、その輝かしさに圧倒されていた。');
  const seen = new Set();
  for (let i=0; i<100 && await canvas.getAttribute('data-scene') !== 'choice'; i++) {
    seen.add(await label());
    await key('Enter');
    await page.waitForTimeout(75);
  }
  await at('choice');
  assert.ok(seen.has('「どうしたの、透ああああぁ」'));
  assert.ok([...seen].some(line => line.endsWith('やる気がしなかったのだ。')));
  assert.ok([...seen].some(line => line.endsWith('真理もそうだろ」')));
  assert.ok([...seen].some(line => line.endsWith('すごく売れてるみたいよ」')));
  assert.match(await label(), /今度貸してよ」$/);
  await key('ArrowDown');
  const reply = await label();
  assert.match(reply, /なかなか面白かったよね」$/);
  await key('Enter'); await at('story');
  assert.equal(await label(), reply);
  for (let i=0; i<30 && !(await label()).endsWith('どのへんが面白かった？」'); i++) {
    await key('Enter');
    await page.waitForTimeout(100);
  }
  assert.match(await label(), /どのへんが面白かった？」$/);
  for (let i=0; i<30 && await canvas.getAttribute('data-scene') === 'story'; i++) {
    await key('Enter');
    await page.waitForTimeout(100);
  }
  await at('choice');
  assert.match(await label(), /もちろん犯人当てだよ」$/);
  if (process.env.K2_CULPRIT_ROUTE) {
    await key('Enter'); await at('story'); await advanceTo('choice-wait', 50);
    await key('ArrowDown'); await key('Enter');
    assert.equal(await canvas.getAttribute('data-scene'), 'choice-wait');
    await at('choice');
    assert.match(await label(), /当然だよ」/);
    await key('ArrowDown');
    assert.match(await label(), /チャレンジしてみるよ」/);
    await key('Enter'); await at('story');
    for (let i=0; i<100 && !(await label()).endsWith('泊まっていなかった。'); i++) {
      await key('Enter');
      await page.waitForTimeout(100);
    }
    await at('complete');
    assert.match(await label(), /あの時、我孫子なんてやつは泊まっていなかった。$/);
  } else {
    await key('ArrowDown');
    const bossReply = await label();
    assert.match(bossReply, /最後のボスキャラを倒すのがたいへんだったけどね」$/);
    await key('Enter'); await at('story');
    assert.equal(await label(), bossReply);
    for (let i=0; i<60 && await canvas.getAttribute('data-scene') === 'story'; i++) {
      await key('Enter');
      await page.waitForTimeout(100);
    }
    await at('complete');
    assert.match(await label(), /真理はにっこり笑って、/);
    assert.match(await label(), /ドラゴンを８８匹集めないと倒せないのよね」$/);
  }
  assert.ok([...requests].some(url => url.endsWith('/k2h003.ogg')));
  const saved = await page.evaluate(()=>JSON.parse(localStorage.getItem('soundnovel.slps25132.opening.v1')));
  assert.deepEqual(saved,{names:['透ああああぁ','真理'],slot:1});
  await page.reload(); await page.getByRole('button',{name:'게임 시작'}).click();
  await key('Space'); await at('title'); await key('ArrowRight'); await key('Enter');
  await at('story');
  assert.equal(await label(), '彼女の名前は、真理。');
  await advanceTo('choice');
  for (const [phase, skip] of [['copyright','2'], ['opening','Enter']]) {
    await page.reload();
    await page.getByRole('button',{name:'게임 시작'}).click();
    await at('logo');
    await page.locator('video').evaluate(v => { v.playbackRate = 8; });
    await at(phase);
    await key('Escape');
    assert.equal(await canvas.getAttribute('data-scene'), phase);
    await key(skip);
    await at('title');
    assert.ok(await page.locator('video').evaluate(v => v.src.endsWith('/title.mp4') && v.loop));
  }
  await page.clock.install();
  await page.keyboard.press('ArrowLeft');
  await page.clock.fastForward(79000);
  assert.equal(await canvas.getAttribute('data-scene'), 'title');
  await page.keyboard.press('ArrowRight');
  await page.clock.fastForward(79000);
  assert.equal(await canvas.getAttribute('data-scene'), 'title');
  await page.clock.fastForward(1200);
  await at('attract');
  assert.ok(await page.locator('video').evaluate(v => v.src.endsWith('/pre_dv.mp4')));
  for (const phase of ['title-entry', 'title']) {
    await page.locator('video').evaluate(v => { v.playbackRate = 12; });
    await at(phase);
  }
  await page.clock.fastForward(80200);
  await at('attract');
  assert.ok(await page.locator('video').evaluate(v => v.src.endsWith('/opening.mp4')));
  assert.deepEqual(unexpected,[]);
  const isoRequests = [...requests].filter(url => /\.iso(?:$|[?#])/i.test(url));
  assert.equal(isoRequests.length,0);
  for (const asset of ['chunlogo.mp4','opening.mp4','title-1.mp4','title.mp4','opening.json','font.png','k2t002.ogg','k1a001.ogg','cancel.wav']) {
    assert.ok([...requests].some(url => new URL(url).pathname.endsWith('/' + asset)), asset);
  }
  console.log('PASS standalone HTTP site: ' + requests.size + ' distinct URLs, ' + isoRequests.length + ' ISO requests, ' + unexpected.length + ' requests outside the prepared site, no file picker');
  assert.deepEqual(errors,[]);
  console.log('PASS real intro playback, title, new game, both name commands, defaults, six-character overwrite, both confirmation directions, story substitution and browser checkpoint');
} finally { await browser.close(); }
