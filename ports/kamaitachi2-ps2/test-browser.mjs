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
  await page.getByRole('button', {name:'게임 시작'}).click();
  await at('logo');
  await page.waitForFunction(() => document.querySelector('video').currentTime > .25);
  assert.equal(await page.locator('video').evaluate(v=>v.videoWidth), 640);
  await at('copyright'); await check('copyright');
  await at('opening');
  await page.waitForFunction(() => document.querySelector('video').currentTime > .25);
  await key('Space'); await at('title');
  await page.waitForFunction(() => document.querySelector('video').currentTime > .3);
  await check('title');
  await key('Enter'); await at('autosave'); await check('autosave');
  await key('Enter'); await at('slot'); await key('Escape'); await at('autosave');
  await key('ArrowDown'); await key('Enter'); await at('story');
  await advanceTo('name');
  assert.equal(await label(),'주인공 透');
  await check('hero');
  await key('Escape'); await key('s'); await at('confirm');
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
  await key('ArrowUp'); await key('Enter'); await at('complete'); await key('Enter');
  assert.match(await label(),/真あ/); await check('completed');
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
  await at('complete');
  const saved = await page.evaluate(()=>JSON.parse(localStorage.getItem('soundnovel.slps25132.opening.v1')));
  assert.deepEqual(saved,{names:['透ああああぁ','真理'],slot:1});
  assert.deepEqual(errors,[]);
  console.log('PASS real intro playback, title, new game, both name commands, defaults, six-character overwrite, both confirmation directions, story substitution and browser checkpoint');
} finally { await browser.close(); }
