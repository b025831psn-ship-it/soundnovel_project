// Flag branching check: `set` on options and nodes, `next` with `if`, and flags kept in saves.
// Usage: node tests/flags.mjs   (uses tests/fixtures/flags.json, a self-written fixture)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  const file = path.join(webRoot, decodeURIComponent(p));
  if (!file.startsWith(webRoot)) { res.writeHead(403).end(); return; }
  let body;
  try { body = await readFile(file); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  res.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?data=tests/fixtures/flags.json`;

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failures++; };
const browser = await chromium.launch();
const page = await browser.newPage();
const line = () => page.locator('.wp-text p').last().textContent();
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('soundnovel.webPlayer.test-flags')));
const option = (k) => page.locator(`.wp-option[data-key="${k}"]`);

await page.goto(url);
await page.waitForSelector('.wp-option');
await option('B').click();
check((await line()) === '복도 끝에 잠긴 문이 있다.', 'B: 플래그 없이 복도 도착');
await page.locator('.wp-advance').click();
check((await line()) === '문은 열리지 않았다. 돌아가자.', 'key가 없으면 next의 기본 규칙(locked)');
await page.locator('.wp-advance').click();
check(await option('A').isVisible(), 'locked 뒤 첫 선택지로 되돌아옴 (노드 재방문)');

await option('A').click();
check(JSON.stringify((await saved()).flags) === '{"key":true}', `선택지 set이 저장에 들어감: ${JSON.stringify((await saved()).flags)}`);
await page.reload();
await page.waitForSelector('.wp-text p');
await page.locator('.wp-saves-open').click();
await page.locator('.wp-slot-save').first().click();
await page.keyboard.press('Escape');
await page.waitForFunction(() => document.activeElement?.classList.contains('wp-advance'));
await page.keyboard.press('Enter');
check((await line()) === '열쇠로 문을 열었다.', '새로고침 뒤에도 key가 유지되어 open으로 분기');
const end = await saved();
check(JSON.stringify(end.flags) === '{"key":true,"door":"open"}', `노드 set이 도착 시 적용: ${JSON.stringify(end.flags)}`);

await page.keyboard.press('Enter');
await page.locator('.wp-reset').click();
check(JSON.stringify((await saved()).flags) === '{}', '첫 선택지로 돌아가면 플래그 초기화');
await page.locator('.wp-saves-open').click();
await page.locator('.wp-slot-load').first().click();
await page.waitForFunction(() => document.activeElement?.classList.contains('wp-advance'));
await page.keyboard.press('Enter');
check((await line()) === '열쇠로 문을 열었다.', '저장 칸을 불러오면 그때의 플래그로 분기');

const log = await (async () => { await page.locator('.wp-log-open').click(); return page.locator('.wp-log-list li').allTextContents(); })();
check(log.includes('그냥 지나간다.') && log.includes('서랍을 연다.') && log.at(-1) === '열쇠로 문을 열었다.', `백로그에 두 번의 선택과 분기 결과: ${log.join(' / ')}`);

await browser.close();
server.close();
console.log(failures ? `\n${failures}개 실패` : '\n모두 통과');
process.exit(failures ? 1 : 0);
