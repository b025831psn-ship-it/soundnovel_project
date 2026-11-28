// Real-browser check of the SFC saves against the reference sync server: a "PC" and a "phone"
// (touch context) link with one passcode, the PC's bookmarks and suspend reach the phone, the
// phone carries on from the PC's suspend, and a slot both devices changed gives a 409 conflict
// that the dialog resolves.
//   [SAVE_SERVER=d1] KAMAITACHI_SFC_KOR=<kamaitachi-sfc-kor checkout> NODE_PATH=$(npm root -g) node tests/save-sync-browser.mjs [seed.srm]
// seed.srm (optional, never committed): an 8 KiB SRAM put in the old localStorage key on the PC,
// which also checks the one-time import.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
// SAVE_SERVER=d1 runs the same check against the Cloudflare Pages save API (D1 on node:sqlite).
const { createServer } = await import(process.env.SAVE_SERVER === 'd1' ? '../../../cloudflare/tests/d1-server.mjs' : '../../../shared/save/server/server.mjs');
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const kor = process.env.KAMAITACHI_SFC_KOR ?? path.resolve(root, '../kamaitachi-sfc-kor');
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json' };
const web = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = p.startsWith('/kor/') ? path.join(kor, p.slice(5)) : path.join(root, p);
  if (!(f.startsWith(root) || f.startsWith(kor)) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(0, '127.0.0.1');
// Count 409 answers on the way through.
let conflicts409 = 0;
const syncServer = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), 'sfc-sync-')) });
const sync = http.createServer((req, res) => {
  const end = res.writeHead.bind(res);
  res.writeHead = (code, ...rest) => { if (code === 409 && req.method === 'PUT' && req.url.includes('/saves/')) conflicts409++; return end(code, ...rest); };
  syncServer.emit('request', req, res);
}).listen(0, '127.0.0.1');
await Promise.all([new Promise((r) => web.on('listening', r)), new Promise((r) => sync.on('listening', r))]);
const url = `http://127.0.0.1:${web.address().port}/ports/kamaitachi-sfc/index.html?data=${encodeURIComponent('/kor/port-data/')}&syncServer=${encodeURIComponent(`http://127.0.0.1:${sync.address().port}`)}`;
const seed = process.argv[2] ? fs.readFileSync(process.argv[2]).toString('base64') : null;

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
let failed = 0;
const check = (ok, msg) => { console.log(ok ? 'ok  ' : 'FAIL', msg); if (!ok) failed++; };
const open = async (options, init) => {
  const ctx = await browser.newContext(options);
  if (init) await ctx.addInitScript(init.fn, init.arg);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { console.log('pageerror', e.message); failed++; });
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('console', m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.kamaitachi?.status?.frame > 30, null, { timeout: 120000 });
  return page;
};
const dialog = async (page) => { await page.click("button[title='저장 동기화']"); await page.waitForSelector('#save-dialog[open]'); };
const close = (page) => page.click('#save-dialog button[type=submit]');
const key = async (page, code, n = 1, gap = 700) => { for (let i = 0; i < n; i++) { await page.keyboard.down(code); await page.waitForTimeout(80); await page.keyboard.up(code); await page.waitForTimeout(gap); } };
const slot = (page, s) => page.evaluate((s) => { const e = window.kamaitachi.saves.api.store.read('kamaitachi-sfc', s); return e && { rev: e.revision, sram: e.payload.sram, savedAt: e.savedAt, len: e.payload.state?.length }; }, s);
const screen = (page) => page.evaluate(() => { const c = document.getElementById('screen'); const d = c.getContext('2d').getImageData(0, 0, 256, 224).data; return Array.from(d.filter((_, i) => i % 4 !== 3)); });
const differ = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 3) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++; return n / (a.length / 3); };

// PC: old localStorage bookmarks (when a seed is given), link a new vault, play into the story.
const pc = await open({}, seed ? { fn: (s) => { if (!localStorage.getItem('kamaitachi-sfc.sram')) localStorage.setItem('kamaitachi-sfc.sram', s); }, arg: seed } : null);
if (seed) check(!!(await slot(pc, 'manual-0')), 'old localStorage SRAM moved into the store (bookmark 1)');
await dialog(pc);
await pc.click('text=이 기기로 시작하기');
await pc.waitForSelector('#save-dialog .code');
const code = (await pc.textContent('#save-dialog .code')).trim();
check(/^[0-9A-HJKMNP-TV-Z]{4}$/.test(code), `passcode shown: ${code}`);
await close(pc);
await pc.waitForTimeout(9000);
// Title -> bookmark shelf -> bookmark 1 -> story (as tools/campaign.mjs bootSlot), then read on.
await key(pc, 'Space', 1, 2700); await key(pc, 'KeyZ', 2, 2700); await key(pc, 'KeyZ', 1, 3000);
await key(pc, 'KeyZ', 12, 900);
await pc.waitForFunction(() => { const e = window.kamaitachi.saves.api.store.read('kamaitachi-sfc', 'manual-0'); return e && e.revision > 0 && !window.kamaitachi.saves.api.store.outbox.size; }, null, { timeout: 30000 });
const pcBook = await slot(pc, 'manual-0');
check(pcBook.rev > 0, `PC bookmark 1 synced (revision ${pcBook.rev})`);
// Suspend on the PC (what hiding the tab does), then leave the PC alone on that page.
await pc.waitForTimeout(1500);
check(await pc.evaluate(async () => { await window.kamaitachi.writeSuspend({ now: true }); return !!window.kamaitachi.saves.api.store.read('kamaitachi-sfc', 'suspend'); }), 'PC wrote its suspend (as when the tab is hidden)');
await pc.waitForFunction(() => { const e = window.kamaitachi.saves.api.store.read('kamaitachi-sfc', 'suspend'); return e && e.revision > 0; }, null, { timeout: 30000 });
const pcSuspend = await slot(pc, 'suspend');
check(pcSuspend.rev > 0, `PC suspend synced (${pcSuspend.len} base64 chars)`);

// Phone: touch, landscape iPhone; join with the passcode, get the PC's bookmarks, carry on.
const phone = await open({ ...devices['iPhone 13 landscape'], deviceScaleFactor: 1 });
await dialog(phone);
await phone.fill("#save-dialog input[placeholder^='패스코드']", code.toLowerCase());
await phone.click('#save-dialog button:text-is("연결")');
await phone.waitForSelector('#save-dialog .code');
check((await phone.textContent('#save-dialog .code')).trim() === code, 'phone joined with the same passcode');
const phoneBook = await slot(phone, 'manual-0');
const pcNow = await slot(pc, 'manual-0');
check(phoneBook?.sram === pcNow.sram && phoneBook.rev === pcNow.rev, `phone received the PC's bookmark 1 byte for byte (revision ${phoneBook?.rev})`);
check(!!(await slot(phone, 'suspend')), "phone received the PC's suspend");
await phone.waitForSelector('text=리셋을 누르면 반영됩니다');
check(await phone.evaluate(() => document.getElementById('save-dialog').open), "the PC's suspend arriving opened the save dialog by itself");
check(true, 'phone says the received bookmarks go in at the next Reset');
await phone.waitForSelector('text=중단한 곳에서 이어하기');
await phone.waitForSelector('text=다른 기기에서 저장');
await phone.tap('text=중단한 곳에서 이어하기');
await phone.waitForSelector('#save-dialog', { state: 'hidden' });
await phone.waitForTimeout(4000);
const phoneScreen = await screen(phone);
const pcScreen = await screen(pc); // the PC stayed on the same page, untouched
const d = differ(pcScreen, phoneScreen);
check(d < 0.02, `phone screen after carrying on = PC screen at suspend (${(d * 100).toFixed(2)}% pixels differ)`);
const info = (b64) => { const b = Buffer.from(b64, 'base64'); let e = 0; for (let n = 1; n <= 43; n++) if (b[0x18 + (n >> 3)] & (1 << (n & 7))) e++; return `${b[0x7a] | (b[0x7b] << 8)}회 엔딩 ${e}`; };
const sramNow = await phone.evaluate(() => btoa(String.fromCharCode(...window.kamaitachi.saves.last.subarray(0x800, 0x1000))));
check(info(sramNow) === info(phoneBook.sram), `phone game now runs on the PC bookmark 1 (${info(sramNow)})`);
// Reload the phone: the bookmarks come from the server-synced store before the game starts.
await phone.reload();
await phone.waitForFunction(() => window.kamaitachi?.status?.frame > 30, null, { timeout: 120000 });
const afterReload = await phone.evaluate(() => btoa(String.fromCharCode(...window.kamaitachi.saves.last.subarray(0x800, 0x1000))));
check(afterReload === (await slot(phone, 'manual-0')).sram && info(afterReload) === info(pcBook.sram), 'after a reload the phone starts with the synced bookmark 1');

// Conflict: both devices change bookmark 3 without seeing each other's change. The change keeps
// the block's checksums (word +v at 0x100, -v at 0x102), so the game accepts it at Reset.
const bump = (page, v) => page.evaluate((v) => {
  const s = window.kamaitachi.saves; const b = s.api.sram(); const before = b.slice();
  const o = 0x1800 + 0x100, w = (0x10000 - v) & 0xffff; b[o] = v; b[o + 1] = 0; b[o + 2] = w & 255; b[o + 3] = w >> 8;
  s.api.writeSram(b, before);
}, v);
await bump(pc, 0x11);
await pc.waitForFunction(() => window.kamaitachi.saves.api.store.read('kamaitachi-sfc', 'manual-2')?.revision > 0, null, { timeout: 20000 });
await bump(phone, 0x22);
await dialog(phone);
await phone.tap('text=지금 동기화');
await phone.waitForSelector('text=두 기기가 서로 다르게 저장했습니다 (manual-2)');
check(conflicts409 >= 1, `server answered 409 (${conflicts409})`);
await phone.tap('text=다른 기기 것 쓰기');
const resolved = await phone.evaluate(() => window.kamaitachi.saves.api.sram()[0x1800 + 0x100]);
check(resolved === 0x11, "phone took the PC's bookmark 3 after choosing 다른 기기 것");
const backup = await phone.evaluate(() => window.kamaitachi.saves.api.store.backups.size);
check(backup >= 1, "phone's own version kept as the slot backup");
await phone.tap('#save-dialog button[type=submit]');
await phone.tap('#menu'); await phone.waitForTimeout(300); await phone.tap('[data-action="reset"]'); await phone.waitForTimeout(1500);
const inGame = await phone.evaluate(() => window.kamaitachi.saves.last[0x1800 + 0x100]);
check(inGame === 0x11, 'Reset loaded the chosen bookmark 3 into the game');
// The other way: the PC keeps its own copy over the phone's.
await bump(phone, 0x33);
await phone.waitForFunction(() => window.kamaitachi.saves.api.store.read('kamaitachi-sfc', 'manual-2') && !window.kamaitachi.saves.api.store.outbox.size, null, { timeout: 20000 });
await bump(pc, 0x44);
await dialog(pc);
await pc.click('text=지금 동기화');
await pc.waitForSelector('text=두 기기가 서로 다르게 저장했습니다 (manual-2)');
await pc.click('text=이 기기 것 쓰기');
await pc.waitForFunction(() => !window.kamaitachi.saves.api.store.outbox.size && !window.kamaitachi.saves.api.store.conflicts.size, null, { timeout: 20000 });
await dialog(phone).catch(() => {});
await phone.tap('text=지금 동기화');
await phone.waitForTimeout(1500);
check(await phone.evaluate(() => window.kamaitachi.saves.api.sram()[0x1800 + 0x100]) === 0x44, "PC's 이 기기 것 쓰기 reached the phone");
await browser.close(); web.close(); sync.close();
process.exit(failed ? 1 : 0);
