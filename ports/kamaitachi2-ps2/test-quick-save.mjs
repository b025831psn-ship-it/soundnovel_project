// Save-code check (shared/save/quick-save.js, start-choice.js): PC picks 새로하기, plays to the first choice
// and saves (지금 저장) to its 6-digit code; a phone picks 이어하기, types the code, and after the reload, the
// logo and the opening carries on at the same choice by itself.
//   node test-quick-save.mjs http://127.0.0.1:8770/kamaitachi2-ps2/
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium, devices;
try { ({chromium, devices} = require('playwright')); } catch { ({chromium, devices} = require('/opt/node22/lib/node_modules/playwright')); }
const base = process.argv[2] || 'http://127.0.0.1:8770/kamaitachi2-ps2/';
const browser = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const scene = page => page.evaluate(() => document.querySelector('#screen').dataset.scene);
const status = page => page.evaluate(() => document.querySelector('#status').textContent);
const errors = [];
async function open(context, label) {
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
  await page.goto(base + '?choice=1');
  await page.waitForSelector('#start-choice button', {timeout:60000});
  return page;
}
try {
  const a = await open(await browser.newContext({viewport:{width:1280, height:900}}), 'pc');
  await a.click('#start-choice >> text=새로하기');
  for (let i = 0; i < 40 && await scene(a) !== 'title'; i++) { await a.keyboard.press('Enter'); await a.waitForTimeout(250); }
  await a.waitForTimeout(400);
  await a.keyboard.press('Enter');
  for (let i = 0; i < 1500 && await scene(a) !== 'choice'; i++) {
    const s = await scene(a);
    if (s === 'name') await a.keyboard.press('KeyS');
    else if (s === 'confirm') { await a.keyboard.press('ArrowUp'); await a.keyboard.press('Enter'); }
    else await a.keyboard.press('Enter');
    await a.waitForTimeout(60);
  }
  const want = await status(a);
  const disk = '.sn-tool[title="저장 / 불러오기"]';
  assert.ok(await a.locator(disk).isVisible(), 'disk button hidden');
  await a.click(disk);
  await a.locator('#quick-save button', {hasText:'지금 저장'}).click();
  await a.waitForFunction(() => document.querySelector('#quick-save .warn')?.textContent === '저장했습니다.', null, {timeout:30000});
  const code = (await a.textContent('#quick-save .code')).trim();
  assert.match(code, /^\d{6}$/);

  const b = await open(await browser.newContext({...devices['iPhone 13']}), 'phone');
  await b.click('#start-choice >> text=이어하기');
  await b.fill('#start-choice input', code);
  await b.click('#start-choice >> text=불러오기');
  await b.waitForTimeout(3000);
  const warn = await b.locator('#start-choice .warn').textContent().catch(() => null);
  if (warn) throw new Error('load failed: ' + warn);
  await b.waitForFunction(() => !['loading', 'ready', undefined].includes(document.querySelector('#screen')?.dataset.scene), null, {timeout:60000});
  // the reloaded page plays the logo and the opening first: skip them like a player would; it then carries on by itself
  for (let i = 0; i < 60 && await scene(b) !== 'choice'; i++) { if (await scene(b) !== 'title') await b.keyboard.press('Enter'); await b.waitForTimeout(300); }
  const got = await status(b);
  console.log('debug', await b.evaluate(() => new Promise(r => { const q = indexedDB.open('soundnovel'); q.onsuccess = () => { const t = q.result.transaction('saves').objectStore('saves').getAll(); t.onsuccess = () => r(JSON.stringify({slots:t.result.map(e => e.slot), cont:globalThis.__snContinue ?? null})); }; })));
  console.log(JSON.stringify({code, scene:await scene(b), same:got === want, errors}, null, 1));
  assert.equal(await scene(b), 'choice');
  assert.equal(got, want);
  assert.equal(errors.length, 0);
  console.log('PASS save code: 새로하기 -> PC choice -> 지금 저장 -> phone 이어하기 + code -> same choice');
} finally { await browser.close(); }
