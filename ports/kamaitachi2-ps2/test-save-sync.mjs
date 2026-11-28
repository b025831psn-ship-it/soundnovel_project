// Browser check of the server saves: PC plays to the first choice with the autosave on, connects with a
// new passcode and syncs; a phone joins with the passcode and continues (つづきから and the suspend slot);
// both then save the same card without syncing and the second sync is answered with 409 and the choice.
//   node test-save-sync.mjs http://127.0.0.1:8770/kamaitachi2-ps2/
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium, devices;
try { ({chromium, devices} = require('playwright')); } catch { ({chromium, devices} = require('/opt/node22/lib/node_modules/playwright')); }
const base = (process.argv[2] || 'http://127.0.0.1:8770/kamaitachi2-ps2/') + '?devices=1';
const browser = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const scene = page => page.evaluate(() => document.querySelector('#screen').dataset.scene);
const status = page => page.evaluate(() => document.querySelector('#status').textContent);

async function open(context, label) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`${label}: ${e.message} ${e.stack}`)); page.on('console', m => { if (m.type() === 'error' && !m.text().includes('409')) errors.push(`${label} console: ${m.text()}`); });
  await page.goto(base);
  await page.waitForFunction(() => !['loading', 'ready', undefined].includes(document.querySelector('#screen')?.dataset.scene), null, {timeout:60000});
  return {page, errors};
}

async function toTitle(page) {
  for (let i = 0; i < 40 && await scene(page) !== 'title'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
  assert.equal(await scene(page), 'title');
  await page.waitForTimeout(400);
}

// Enter through everything; names keep their defaults (△ then はい).
async function playTo(page, want, limit = 1500) {
  for (let i = 0; i < limit; i++) {
    const s = await scene(page);
    if (s === want) return;
    if (s === 'name') await page.keyboard.press('KeyS');
    else if (s === 'confirm') { await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter'); }
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }
  throw new Error(`did not reach ${want} (at ${await scene(page)})`);
}

// The device-linking dialog: the bar's cloud button, shown with ?devices=1 (shared/save/sync-ui.js).
async function dialog(page) {
  await page.click('button.icon[title="저장 동기화"]');
  await page.waitForSelector('#save-dialog[open]');
}
const button = (page, text) => page.locator('#save-dialog button', {hasText:text}).first();
const closeDialog = page => page.evaluate(() => document.querySelector('#save-dialog').close());

const pc = await browser.newContext({viewport:{width:1280, height:900}});
const phone = await browser.newContext({...devices['iPhone 13']});
const result = {};
try {
  // PC: new game, autosave on card 1, up to the first choice.
  const a = await open(pc, 'pc');
  await toTitle(a.page);
  await a.page.keyboard.press('Enter');
  await playTo(a.page, 'choice');
  result.pcChoice = await status(a.page);
  await dialog(a.page);
  await button(a.page, '이 기기로 시작하기').click();
  await a.page.waitForSelector('#save-dialog .code');
  const code = (await a.page.textContent('#save-dialog .code')).trim();
  assert.match(code, /^[0-9A-Z]{4}$/);
  await closeDialog(a.page);
  await a.page.evaluate(() => dispatchEvent(new Event('pagehide')));
  await dialog(a.page);
  await button(a.page, '지금 동기화').click();
  await a.page.waitForTimeout(1500);
  await closeDialog(a.page);
  result.code = code;

  // Phone: join with the passcode, then つづきから from the title.
  const b = await open(phone, 'phone');
  await toTitle(b.page);
  await dialog(b.page);
  await b.page.fill('#save-dialog input', code);
  await button(b.page, '연결').click();
  await b.page.waitForSelector('#save-dialog .code', {timeout:20000});
  await b.page.waitForTimeout(1500);
  result.phoneCanContinue = await button(b.page, '마지막 장면에서 이어하기').isEnabled();
  await closeDialog(b.page);
  await b.page.reload();
  await toTitle(b.page);
  result.phoneTitleNotice = await status(b.page);
  await b.page.keyboard.press('Enter');
  await playTo(b.page, 'choice', 50);
  result.phoneChoice = await status(b.page);
  assert.equal(result.phoneChoice, result.pcChoice);

  // Suspend slot: back to the title, continue from the dialog.
  await b.page.reload();
  await toTitle(b.page);
  await dialog(b.page);
  await button(b.page, '마지막 장면에서 이어하기').click();
  await b.page.waitForTimeout(500);
  result.suspendScene = await scene(b.page);
  assert.equal(result.suspendScene, 'choice');

  // Conflict: both devices pick a choice (the card's story save changes on each), then sync in turn.
  for (const p of [a.page, b.page]) { await p.keyboard.press('Enter'); await p.waitForTimeout(300); await playTo(p, 'choice', 800).catch(() => {}); }
  await dialog(b.page); await button(b.page, '지금 동기화').click(); await b.page.waitForTimeout(1500); await closeDialog(b.page);
  await dialog(a.page); await button(a.page, '지금 동기화').click(); await a.page.waitForTimeout(1500);
  result.conflict = await a.page.locator('#save-dialog h3', {hasText:'두 기기가 서로 다르게 저장했습니다'}).allTextContents();
  assert.ok(result.conflict.length >= 1, 'no conflict shown');
  await button(a.page, '이 기기 것 쓰기').click();
  await a.page.waitForTimeout(1500);
  result.afterResolve = await a.page.locator('#save-dialog h3', {hasText:'두 기기가'}).count();
  result.errors = [...a.errors, ...b.errors];
  console.log(JSON.stringify(result, null, 1));
  assert.equal(result.errors.length, 0);
} finally { await browser.close(); }
