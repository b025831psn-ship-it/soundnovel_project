// Real-browser check of 석류의 맛's quick save and report buttons (shared/save/quick-save.js,
// shared/player/report-button.js) on a PC page and an iPhone-sized touch page. Needs the private port-data.
//   ZAKURO_DATA=<zakuro-sfc-kor/port-data> NODE_PATH=$(npm root -g) node tests/quick-save-browser.mjs
// (Built on the same helpers as tests/two-devices-browser.mjs.)
// Original header of those helpers: Real-browser check of 석류의 맛 saves on two devices (a PC page and an iPhone-sized touch page) against the
// reference save server, or with D1=1 the Pages (D1) API double: the game's own slot and the web suspend
// slot carry over through the passcode, and a 409 becomes a choice. Needs the private port-data.
//   ZAKURO_DATA=<zakuro-sfc-kor/port-data> NODE_PATH=$(npm root -g) node tests/two-devices-browser.mjs
import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DATA = path.resolve(process.env.ZAKURO_DATA ?? path.join(REPO, 'zakuro-sfc-kor/port-data'));
const { createServer } = await import(`${REPO}/shared/save/server/server.mjs`);
const { handleReport } = await import(`${REPO}/cloudflare/functions/_lib/report.js`);
const reports = [];
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json' };
const web = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/report') {
    const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', async () => {
      const r = await handleReport(new Request('http://x/report', { method: 'POST', body: Buffer.concat(chunks) }), { allow: async () => true,
        putShot: async (id) => `/edit/reports/${id}.png`, fileIssue: Object.assign(async (repo, issue) => { reports.push({ repo, ...issue }); return true; }, { local: true }) });
      res.writeHead(r.status, { 'content-type': 'application/json' }); res.end(await r.text());
    }); return;
  }
  const f = p.startsWith('/zakuro-sfc-kor/port-data/') ? path.join(DATA, p.slice('/zakuro-sfc-kor/port-data/'.length)) : path.join(REPO, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(0, '127.0.0.1');
const sync = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), 'zk-')) }).listen(0, '127.0.0.1');
await Promise.all([new Promise((r) => web.on('listening', r)), new Promise((r) => sync.on('listening', r))]);
const url = `http://127.0.0.1:${web.address().port}/ports/zakuro-sfc/index.html?choice=1&syncServer=${encodeURIComponent(`http://127.0.0.1:${sync.address().port}`)}`;
const t0 = Date.now(); const log = (...a) => console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s`, ...a);
let failed = 0; const check = (ok, msg) => { log(ok ? 'ok  ' : 'FAIL', msg); if (!ok) failed++; };
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const screenOf = (st) => { if (st.choice) return 'choice'; const [a, b] = st.s; if ([0x80, 0xcf, 0xd0].includes(a)) return 'start'; if (a === 0xef) return b === 0 ? 'slots' : 'busy';
  if (a === 0xf0 || a === 0xf1) return ({ 0x62: 'prompt', 0xeb: 'prompt', 0x81: 'names', 0x91: 'file', 0xea: 'erase' })[b] ?? 'busy'; return 'story'; };
async function device(name, ctxOpts) {
  const ctx = await browser.newContext(ctxOpts); const p = await ctx.newPage();
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  p.on('pageerror', (e) => { log(name, 'pageerror', e.message); failed++; });
  const touch = !!ctxOpts.hasTouch;
  const d = { p, name };
  d.state = () => p.evaluate(() => { const w = window.zakuro.vm.bus.wram, t = window.zakuro.vm.getTouchState();
    return { s: [w[0x1ffd], w[0x1ffa]], choice: t.choice && { ready: t.choice.ready, targets: t.choice.targets, r: t.choice.rectangles }, scene: w[0x1000] === 0xf6 ? w[0x1002] | (w[0x1003] << 8) : -1 }; });
  d.tap = async (x, y) => { const box = await p.locator('#screen').boundingBox(); const X = box.x + x / 256 * box.width, Y = box.y + y / 224 * box.height; if (touch) await p.touchscreen.tap(X, Y); else await p.mouse.click(X, Y); };
  d.until = async (want, x, y, every = 700, max = 240000) => { const end = Date.now() + max; for (;;) { const st = await d.state(); if (want(screenOf(st), st)) return st; if (Date.now() > end) throw new Error(`${name} timeout at ${JSON.stringify(st)}`); if (x != null) await d.tap(x, y); await p.waitForTimeout(every); } };
  d.boot = async (choice = '새로하기', code = null) => { await p.goto(url); await p.waitForSelector('#start-choice', { timeout: 60000 }); await p.click(`#start-choice >> text=${choice}`);
    if (code) { await p.fill('#start-choice input', code); await Promise.all([p.waitForNavigation({ timeout: 30000 }), p.click('#start-choice >> text=불러오기')]); }
    await p.waitForFunction(() => window.zakuro?.vm, null, { timeout: 60000 }); await p.waitForSelector("button[title='저장 동기화']"); };
  d.dialog = async () => { if (!(await p.evaluate(() => document.querySelector('#save-dialog')?.open))) await p.click("button[title='저장 동기화']"); };
  d.close = () => p.evaluate(() => document.querySelector('#save-dialog').close());
  d.syncNow = async () => { await d.dialog(); await p.click('text=지금 동기화'); await p.waitForFunction(() => document.querySelector('#save-dialog')?.textContent.includes('마지막:')); await p.waitForTimeout(500); };
  d.slot = (i) => p.evaluate((i) => window.soundnovelSave.store.read('zakuro-sfc', `manual-${i}`), i);
  return d;
}
const shots = path.resolve(process.env.SHOTS ?? os.tmpdir());
try {
  const pc = await device('PC', { viewport: { width: 1280, height: 800 } });
  await pc.boot(); log('PC started');
  await pc.until((s) => s === 'slots', 128, 112, 1000);
  await pc.tap(60, 60); await pc.until((s) => s === 'prompt');
  await pc.tap(128, 100); await pc.until((s) => s === 'names'); await pc.p.waitForTimeout(800);
  const hidden = await pc.p.evaluate(() => [...document.querySelectorAll('.sn-tool')].map((b) => getComputedStyle(b).display));
  check(hidden.length === 2 && hidden.every((d) => d === 'none'), `name board: save and report buttons step aside with the menu button (${hidden})`);
  await pc.p.screenshot({ path: path.join(shots, 'qs-pc-names.png') });
  await pc.tap(235, 168); await pc.until((s) => s === 'prompt');
  await pc.tap(128, 100); await pc.until((s) => s === 'names'); await pc.p.waitForTimeout(500);
  await pc.tap(235, 168); await pc.until((s) => s === 'story');
  for (let i = 0; i < 8; i++) { await pc.tap(128, 150); await pc.p.waitForTimeout(900); }
  const at = await pc.state();
  await pc.p.screenshot({ path: path.join(shots, 'qs-pc-story.png') });
  // Saves go up by themselves to the player's 6-digit code; 지금 저장 writes this very page first.
  await pc.p.waitForFunction(() => /^\d{6}$/.test(localStorage.getItem('sn-save-code') ?? ''), null, { timeout: 40000 });
  await pc.p.click("button[title='저장 / 불러오기']");
  const code = (await pc.p.textContent('#quick-save .code')).trim();
  await pc.p.click('#quick-save button.primary'); await pc.p.waitForSelector('#quick-save >> text=저장했습니다', { timeout: 30000 });
  check(/^\d{6}$/.test(code) && (await pc.p.textContent('#quick-save .code')).trim() === code, `PC: saved at scene ${at.scene} to the player's code ${code}`);
  await pc.p.evaluate(() => document.querySelector('#quick-save').close());
  // Report
  const ctx = await pc.p.evaluate(() => globalThis.soundnovelReport());
  check(ctx.scene === at.scene && /^s\d{4}-[0-9a-f]{6}$/.test(ctx.line) && ctx.text.length > 0, `report context: scene ${ctx.scene}, line ${ctx.line}, text ${JSON.stringify(ctx.text.slice(0, 40))}`);
  await pc.p.click("button[title='오류 신고']"); await pc.p.fill('#report-dialog textarea', '시험 신고');
  await pc.p.click('#report-dialog button.primary'); await pc.p.waitForSelector('#report-dialog >> text=신고가 접수됐어요', { timeout: 15000 });
  const filed = reports.at(-1);
  check(!!filed && filed.body?.includes(ctx.line), `report filed with the line id (${filed?.repo})`);
  await pc.p.evaluate(() => document.querySelector('#report-dialog').close());

  const phone = await device('phone', { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await phone.boot('이어하기', code); log('phone: 이어하기 with the code');
  const landed = await phone.until((s, x) => x.scene === at.scene && s === 'story', null, null, 300, 30000).catch(() => null);
  check(!!landed, `phone: after 이어하기 + code the game carries on by itself at scene ${landed?.scene ?? (await phone.state()).scene} (PC ${at.scene})`);
  await phone.p.waitForTimeout(9000); // the Japanese lines are fetched 8 s after start
  const same = await phone.p.evaluate(() => globalThis.soundnovelReport().line);
  check(same === ctx.line, `phone: same line as the PC (${same})`);
  await phone.p.screenshot({ path: path.join(shots, 'qs-phone-story.png') });
  const boxes = await phone.p.evaluate(() => [...document.querySelectorAll('.sn-tool, .menu-button')].map((b) => { const r = b.getBoundingClientRect(); return [b.title || b.id, Math.round(r.x), Math.round(r.y), Math.round(r.width)]; }));
  log('phone buttons', JSON.stringify(boxes));
  // Same device again: 이어하기 goes straight on without the code
  const again = await pc.p.context().newPage();
  await again.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await again.goto(url); await again.waitForSelector('#start-choice', { timeout: 60000 });
  await again.click('#start-choice >> text=이어하기');
  const back = await again.waitForFunction((want) => { const w = window.zakuro?.vm?.bus.wram; return w && w[0x1000] === 0xf6 && (w[0x1002] | (w[0x1003] << 8)) === want; }, at.scene, { timeout: 60000 }).then(() => true, () => false);
  check(back && !(await again.$('#start-choice input')), 'PC: 이어하기 on the same device goes straight on without the code');
} catch (e) { log('FAIL', e.message); failed++; }
await browser.close(); web.close(); sync.close();
log(failed ? `${failed} failed` : 'all passed'); process.exit(failed ? 1 : 0);
