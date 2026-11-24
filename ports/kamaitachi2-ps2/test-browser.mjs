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
async function advanceTo(target) {
  for (let i = 0; i < 30; i++) {
    if ((await canvas.getAttribute('data-scene')) === target) return;
    assert.equal(await canvas.getAttribute('data-scene'), 'story');
    await key('Enter');
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
  await key('w'); await key('Enter'); assert.equal(await label(),'주인공 透か');
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
  await advanceTo('complete');
  assert.equal(await label(), 'この招待状は、真理にも届いているのだろうか。');
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
