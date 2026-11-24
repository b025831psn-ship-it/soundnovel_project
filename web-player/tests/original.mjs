// Original-script features: `lang`, `{name:id}`, `join` (same line), `ending`, and "g:" flags kept across new games.
// Usage: node tests/original.mjs   (uses tests/fixtures/original.json, self-written)
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
  const file = path.join(webRoot, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(webRoot)) { res.writeHead(403).end(); return; }
  let body;
  try { body = await readFile(file); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  res.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?data=tests/fixtures/original.json`;

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failures++; };
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const paras = () => page.locator('.wp-text p').allTextContents();
const next = () => page.locator('.wp-advance').click();

await page.goto(url);
await page.waitForSelector('.wp-text p');
check((await paras())[0] === 'はるが窓の外を見た。', '{name:32} 치환');
check(await page.locator('.wp-text p').first().getAttribute('lang') === 'ja', '본문 lang="ja"');
await next(); await next();
check(JSON.stringify(await paras()) === JSON.stringify(['はるが窓の外を見た。', '「雨かな？」']), `join은 같은 줄에 이어짐: ${JSON.stringify(await paras())}`);
await next();
check((await paras())[1] === '「雨かな？」ゆうはうなずいた。', 'join 두 번 연속');
await next();
check(await page.locator('.wp-option').count() === 1, '첫 회차: 선택지 1개');
await page.locator('.wp-option').first().click();
await next();
check(JSON.stringify(await paras()) === JSON.stringify(['雨の中を歩いた。傘はない。']), `keep: 다음 노드가 같은 화면에 이어짐 ${JSON.stringify(await paras())}`);
await next();
check((await page.locator('.wp-end-msg').textContent()) === '엔딩 1', '엔딩 번호 표시');

await page.locator('.wp-reset').click();
for (let i = 0; i < 4; i++) await next();
check(await page.locator('.wp-option').count() === 2, '새 게임에서도 g: 플래그 유지 → 선택지 2개');
await page.reload();
await page.waitForSelector('.wp-option');
check(await page.locator('.wp-option').count() === 2, '새로고침 뒤에도 유지');
check(errors.length === 0, `페이지 오류 없음 ${errors.join(' | ')}`);

await browser.close();
server.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
