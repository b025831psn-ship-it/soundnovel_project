// Node media: `bg` / `bgm` stay until changed, "" or null clears, and saves restore them.
// Usage: node tests/media.mjs   (uses tests/fixtures/media.json, media-pick.json and two 4×4 PNGs made for the test)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  const file = path.join(webRoot, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(webRoot)) { res.writeHead(403).end(); return; }
  let body;
  try { body = await readFile(file); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  res.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?data=tests/fixtures/media.json`;

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failures++; };
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const bg = () => page.evaluate(() => { const i = document.querySelector('.wp-bg'); return i.hidden ? '' : i.getAttribute('src').split('/').pop(); });
const bgm = () => page.evaluate(() => (document.querySelector('.wp-bgm').getAttribute('src') || '').split('/').pop());
const loaded = () => page.evaluate(() => document.querySelector('.wp-bg').complete && document.querySelector('.wp-bg').naturalWidth);
const next = () => page.locator('.wp-advance').click();

await page.goto(url);
await page.waitForSelector('.wp-text p');
check(await bg() === 'red.png', '첫 노드 bg');
check(await loaded() === 4, '배경 그림이 실제로 읽힘');
check(await bgm() === 'none.ogg', 'bgm 지정');
await next();
check(await bg() === 'red.png' && await bgm() === 'none.ogg', 'bg·bgm 없는 노드에서는 유지');
await page.reload();
await page.waitForSelector('.wp-text p');
check(await bg() === 'red.png', '새로고침 뒤에도 배경 복원');
await next();
check(await bg() === 'blue.png' && await bgm() === '', '바꾸기와 bgm "" 끄기');
await next();
check(await bg() === '', 'bg null이면 배경 없음');

// `bg: { by, map }`: the flag picks the picture on entry; a value missing from map keeps the current one.
await page.evaluate(() => localStorage.clear());
await page.goto(url.replace('media.json', 'media-pick.json'));
await page.waitForSelector('.wp-text p');
check(await bg() === 'red.png', '묶음 0이면 map["0"]');
await next();
check(await bg() === 'red.png', '묶음 플래그만 바뀌면 그림은 그대로');
await next();
check(await bg() === 'blue.png', '같은 요청이 묶음 1에서는 다른 그림');
await next();
check(await bg() === 'blue.png', 'map에 없는 값이면 기존 배경 유지');
await page.reload();
await page.waitForSelector('.wp-text p');
check(await bg() === 'blue.png', '새로고침 뒤에도 유지된 배경 복원');
await next();
check(await bg() === 'red.png', '다시 묶음 0');
check(errors.length === 0, `페이지 오류 없음 ${errors.join(' | ')}`);

await browser.close();
server.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
