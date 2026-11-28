// Real-browser check of 석류의 맛 saves on two devices (a PC page and an iPhone-sized touch page) against the
// reference save server, or with D1=1 the Pages (D1) API double: the game's own slot and the web suspend
// slot carry over through the passcode, and a 409 becomes a choice. Needs the private port-data.
//   ZAKURO_DATA=<zakuro-sfc-kor/port-data> NODE_PATH=$(npm root -g) node tests/two-devices-browser.mjs
import http from 'node:http'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DATA = path.resolve(process.env.ZAKURO_DATA ?? path.join(REPO, 'zakuro-sfc-kor/port-data'));
const { createServer } = await import(process.env.D1 ? `${REPO}/cloudflare/tests/d1-server.mjs` : `${REPO}/shared/save/server/server.mjs`);
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json' };
const web = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = p.startsWith('/zakuro-sfc-kor/port-data/') ? path.join(DATA, p.slice('/zakuro-sfc-kor/port-data/'.length)) : path.join(REPO, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); res.end(fs.readFileSync(f));
}).listen(0, '127.0.0.1');
const sync = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), 'zk-')) }).listen(0, '127.0.0.1');
await Promise.all([new Promise((r) => web.on('listening', r)), new Promise((r) => sync.on('listening', r))]);
const url = `http://127.0.0.1:${web.address().port}/ports/zakuro-sfc/index.html?syncServer=${encodeURIComponent(`http://127.0.0.1:${sync.address().port}`)}`;
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
  d.boot = async () => { await p.goto(url); await p.waitForFunction(() => window.zakuro?.vm, null, { timeout: 60000 }); await p.waitForSelector("button[title='저장 동기화']"); };
  d.dialog = async () => { if (!(await p.evaluate(() => document.querySelector('#save-dialog')?.open))) await p.click("button[title='저장 동기화']"); };
  d.close = () => p.evaluate(() => document.querySelector('#save-dialog').close());
  d.syncNow = async () => { await d.dialog(); await p.click('text=지금 동기화'); await p.waitForFunction(() => document.querySelector('#save-dialog')?.textContent.includes('마지막:')); await p.waitForTimeout(500); };
  d.slot = (i) => p.evaluate((i) => window.soundnovelSave.store.read('zakuro-sfc', `manual-${i}`), i);
  return d;
}
try {
  const pc = await device('PC', { viewport: { width: 1280, height: 800 } });
  await pc.boot(); log('PC started');
  await pc.until((s) => s === 'slots', 128, 112, 1000);
  await pc.tap(60, 60); await pc.until((s) => s === 'prompt');
  await pc.tap(128, 100); await pc.until((s) => s === 'names'); await pc.p.waitForTimeout(500);
  await pc.tap(235, 168); await pc.until((s) => s === 'prompt');
  await pc.tap(128, 100); await pc.until((s) => s === 'names'); await pc.p.waitForTimeout(500);
  await pc.tap(235, 168); await pc.until((s) => s === 'story');
  let st = await pc.until((s, x) => s === 'choice' && x.choice.ready, 128, 150, 600);
  const r = st.choice.r[1]; await pc.tap(r.x + r.width / 2, r.y + r.height / 2);
  await pc.until((s, x) => x.scene === st.choice.targets[1], null, null, 300, 20000);
  await pc.p.waitForTimeout(3000);
  check(!!(await pc.slot(0)), 'PC: the game\'s own save in slot 1 reached the store');
  for (let i = 0; i < 6; i++) { await pc.tap(128, 150); await pc.p.waitForTimeout(900); }
  const pcScene = (await pc.state()).scene;
  await pc.p.evaluate(() => window.zakuro.suspend());
  const suspendBytes = await pc.p.evaluate(() => JSON.stringify(window.soundnovelSave.store.read('zakuro-sfc', 'suspend')).length);
  log('PC suspended at scene', pcScene, 'suspend envelope', suspendBytes, 'bytes');
  await pc.dialog(); await pc.p.click('text=이 기기로 시작하기'); await pc.p.waitForSelector('#save-dialog .code');
  const code = (await pc.p.textContent('#save-dialog .code')).trim(); log('passcode', code);
  await pc.syncNow();
  const pending = await pc.p.evaluate(() => window.soundnovelSave.store.pending().length);
  check(pending === 0, `PC: everything uploaded (pending ${pending})`);
  await pc.close();

  const phone = await device('phone', { ...devices['iPhone 13'], deviceScaleFactor: 1 });
  await phone.boot(); log('phone started');
  await phone.dialog(); await phone.p.fill("#save-dialog input[placeholder^='패스코드']", code.toLowerCase());
  await phone.p.click('#save-dialog button:text-is("연결")'); await phone.p.waitForSelector('#save-dialog .code', { timeout: 30000 });
  await phone.p.waitForFunction(() => window.soundnovelSave.store.read('zakuro-sfc', 'suspend'), null, { timeout: 30000 });
  check(!!(await phone.slot(0)), 'phone: received slot 1 and the suspend slot');
  await phone.close();
  // Original path on the phone: slot disk -> file menu -> 途中から再開する
  await phone.until((s) => s === 'slots', 128, 112, 1000);
  await phone.tap(60, 60); await phone.until((s) => s === 'file', null, null, 300, 30000);
  await phone.tap(120, 117); await phone.until((s) => s === 'story', null, null, 300, 30000); await phone.p.waitForTimeout(4000);
  const resumed = (await phone.state()).scene;
  const savedBlock = await pc.p.evaluate(() => { const b = Uint8Array.from(atob(window.soundnovelSave.store.read('zakuro-sfc', 'manual-0').payload.sram), (c) => c.charCodeAt(0)); return b[0x28] | (b[0x29] << 8); });
  check(resumed === savedBlock, `phone: 途中から再開する continues at the block the PC's game saved (${resumed}, slot says ${savedBlock})`);
  // Web suspend: carry on from the PC's exact page
  await phone.dialog(); await phone.p.click('text=마지막 장면에서 이어하기'); await phone.p.waitForTimeout(1500);
  const sus = (await phone.state()).scene;
  check(sus === pcScene, `phone: 마지막 장면에서 이어하기 lands on the PC's page (scene ${sus}, PC ${pcScene})`);
  await phone.tap(128, 150); await phone.p.waitForTimeout(3000);
  check((await phone.p.evaluate(() => window.zakuro.vm.cpu.stopped)) === false, 'phone: game keeps running after the suspend load');

  // Stop both games first, so only the edits below touch slot 1.
  for (const d of [pc, phone]) await d.p.evaluate(() => { window.zakuro.saveSram(); window.zakuro.vm.cpu.stopped = true; });
  await phone.syncNow(); await phone.close(); await pc.syncNow(); await pc.close();
  // Conflict: both change slot 1 without seeing each other; the second to sync gets 409.
  const edit = (d, tag) => d.p.evaluate((tag) => { const s = window.soundnovelSave.store, e = s.read('zakuro-sfc', 'manual-0'); s.write('zakuro-sfc', 'manual-0', { ...e, label: tag }); }, tag);
  await edit(phone, 'phone-edit'); await phone.syncNow(); await phone.close();
  await edit(pc, 'pc-edit'); await pc.syncNow();
  const conflictShown = await pc.p.evaluate(() => document.querySelector('#save-dialog').textContent.includes('두 기기가 서로 다르게 저장했습니다'));
  check(conflictShown, 'PC: the 409 is shown as a choice, nothing overwritten');
  await pc.p.click('text=이 기기 것 쓰기'); await pc.p.waitForTimeout(1500); await pc.syncNow();
  await phone.syncNow();
  const label = (await phone.slot(0))?.label;
  check(label === 'pc-edit', `phone: after "이 기기 것 쓰기" on the PC the phone has the PC's slot (${label})`);
  const backup = await pc.p.evaluate(() => [...window.soundnovelSave.store.backups.values()].map((e) => e.label));
  check(backup.includes('phone-edit'), 'PC: the losing version is kept as the slot backup');
} catch (e) { log('FAIL', e.message); failed++; }
await browser.close(); web.close(); sync.close();
log(failed ? `${failed} failed` : 'all passed'); process.exit(failed ? 1 : 0);
