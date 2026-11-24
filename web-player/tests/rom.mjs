// "Open your own ROM" check with a synthetic ROM built from self-written text (no original game data).
// Usage: node tests/rom.mjs
import http from 'node:http';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..');
const tmp = await mkdtemp(path.join(os.tmpdir(), 'wp-rom-'));
const romPath = path.join(tmp, 'sample.gba');
execFileSync(process.execPath, [path.join(here, 'fixtures/make-sample-rom.mjs'), romPath]);
const junkPath = path.join(tmp, 'other.gba');
await writeFile(junkPath, new Uint8Array(0x200).fill(7));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const requests = [];
const server = http.createServer(async (req, res) => {
  requests.push(`${req.method} ${req.url}`);
  const p = new URL(req.url, 'http://x').pathname;
  const file = path.join(webRoot, decodeURIComponent(p));
  if (!file.startsWith(webRoot)) { res.writeHead(403).end(); return; }
  let body;
  try { body = await readFile(file); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  res.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html?rom=sample-rom`;

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failures++; };
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const line = () => page.locator('.wp-text p').last().textContent();

await page.goto(url);
await page.waitForSelector('.wp-rom');
check(await page.locator('.wp-rom-note').isVisible(), 'ROM이 없으면 "내 ROM 열기" 화면');

await page.setInputFiles('.wp-rom-input', junkPath);
await page.waitForFunction(() => /ROM이 아닌 파일/.test(document.querySelector('.wp-rom-error')?.textContent));
check(true, '다른 파일은 거부하고 이유를 보여줌');

await page.setInputFiles('.wp-rom-input', romPath);
await page.waitForSelector('.wp-option');
check((await page.locator('.wp-root').textContent()).includes('대문 앞에서 잠시 망설였다.'), '합성 ROM을 변환해 첫 선택지 표시');
await page.locator('.wp-option[data-key="A"]').click();
check((await line()) === '현관에는 불이 켜져 있었다.', 'A: inside 첫 문장');
check(!(await page.locator('#forget-rom').isHidden()), '"변환한 데이터 지우기" 표시');

await page.reload();
await page.waitForSelector('.wp-text p');
check(!(await page.locator('.wp-rom').count()), '새로고침하면 브라우저에 저장된 변환 결과로 바로 재생');
check((await line()) === '현관에는 불이 켜져 있었다.', '이어하기 위치도 유지');
check(!requests.some((r) => r.startsWith('POST') || r.includes('.gba')), 'ROM은 서버로 전송되지 않음');

await page.locator('#forget-rom').click();
await page.waitForSelector('.wp-rom');
check(true, '지우면 다시 ROM 열기 화면');
check(errors.length === 0, `페이지 오류 없음 ${errors.join(' | ')}`);

await browser.close();
server.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
