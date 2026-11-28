// Quick save check: PC plays to the first choice, 저장 gives a 4-digit code; a phone context loads that
// code from the title and carries on at the same choice.
//   node test-quick-save.mjs http://127.0.0.1:8770/kamaitachi2-ps2/
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium, devices;
try { ({chromium, devices} = require('playwright')); } catch { ({chromium, devices} = require('/opt/node22/lib/node_modules/playwright')); }
const base = process.argv[2] || 'http://127.0.0.1:8770/kamaitachi2-ps2/';
const browser = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const scene = page => page.evaluate(() => document.querySelector('canvas').dataset.scene);
const status = page => page.evaluate(() => document.querySelector('#status').textContent);
const errors = [];
async function open(context, label) {
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
  await page.goto(base);
  await page.waitForFunction(() => !['loading', 'ready', undefined].includes(document.querySelector('canvas')?.dataset.scene), null, {timeout:60000});
  for (let i = 0; i < 40 && await scene(page) !== 'title'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
  await page.waitForTimeout(400);
  return page;
}
try {
  const a = await open(await browser.newContext({viewport:{width:1280, height:900}}), 'pc');
  await a.keyboard.press('Enter');
  for (let i = 0; i < 600 && await scene(a) !== 'choice'; i++) {
    const s = await scene(a);
    if (s === 'name') await a.keyboard.press('KeyS');
    else if (s === 'confirm') { await a.keyboard.press('ArrowUp'); await a.keyboard.press('Enter'); }
    else await a.keyboard.press('Enter');
    await a.waitForTimeout(60);
  }
  const want = await status(a);
  assert.ok(await a.locator('.sn-tool').isVisible(), 'disk button hidden');
  await a.click('.sn-tool');
  await a.locator('#quick-save button', {hasText:'저장'}).first().click();
  await a.waitForSelector('#quick-save .code');
  const code = (await a.textContent('#quick-save .code')).trim();
  assert.match(code, /^\d{4}$/);

  const b = await open(await browser.newContext({...devices['iPhone 13']}), 'phone');
  assert.ok(await b.locator('.sn-tool').isVisible(), 'disk button hidden at the title');
  await b.click('.sn-tool');
  await b.locator('#quick-save button', {hasText:'불러오기'}).first().click();
  await b.fill('#quick-save input', code);
  await b.locator('#quick-save button.primary').click();
  await b.waitForEvent('load');
  await b.waitForFunction(() => !['loading', 'ready', undefined].includes(document.querySelector('canvas')?.dataset.scene), null, {timeout:60000});
  // the reloaded page plays its intro first: skip to the title like a player would; it then carries on by itself
  for (let i = 0; i < 60 && await scene(b) !== 'choice'; i++) { if (await scene(b) !== 'title') await b.keyboard.press('Enter'); await b.waitForTimeout(300); }
  const got = await status(b);
  const slots = await b.evaluate(() => new Promise(r => { const q = indexedDB.open('soundnovel'); q.onsuccess = () => { const t = q.result.transaction('saves').objectStore('saves').getAll(); t.onsuccess = () => r(t.result.map(e => e.slot)); }; }));
  console.log('phone slots', slots, 'pending', await b.evaluate(() => JSON.stringify(sessionStorage)));
  console.log(JSON.stringify({code, want, got, errors}, null, 1));
  assert.equal(await scene(b), 'choice');
  assert.equal(got, want);
  assert.equal(errors.length, 0);
  console.log('PASS quick save: PC choice -> code -> phone continues at the same choice');
} finally { await browser.close(); }
