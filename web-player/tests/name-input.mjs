// Name entry: alias match picks the option, the shown name goes to its own slot ("name:3"),
// and the two stay independent (rewrite with `as`, fallback keeps the typed text).
// Usage: node tests/name-input.mjs   (uses tests/fixtures/name-input.json, self-written)
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
const url = `http://127.0.0.1:${server.address().port}/index.html?data=tests/fixtures/name-input.json`;

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failures++; };
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('soundnovel.webPlayer.test-name-input')));

async function enter(name) {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.wp-name-input');
  await page.fill('.wp-name-input', name);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.wp-text p');
  const s = await saved();
  return { line: await page.locator('.wp-text p').last().textContent(), node: s.node, slot: s.flags['name:3'] };
}

let r = await enter('アオキ');
check(r.node === 'hitA' && r.slot === '青木' && r.line === '犯人は青木だ。', `별칭 일치 → A, 표시 이름은 as로 바뀜: ${JSON.stringify(r)}`);
r = await enter('ｱｵｷ');
check(r.node === 'hitA', '반각 가타카나도 NFKC로 같은 별칭');
r = await enter('黒田');
check(r.node === 'hitB' && r.slot === '黒田', 'as 없으면 입력한 이름 그대로 표시');
r = await enter('しろやま');
check(r.node === 'miss' && r.slot === 'しろやま' && r.line === 'しろやまという人はいない。', '미일치 → 기본 선택지, 입력값은 슬롯에 유지');
r = await enter('あおきあおきあおき');
check(r.node === 'miss' && r.slot === 'あおきあおき', 'maxLength로 자른 뒤 비교 (결과와 슬롯이 따로 정해짐)');
await page.reload();
await page.waitForSelector('.wp-text p');
check((await page.locator('.wp-text p').last().textContent()) === 'あおきあおきという人はいない。', '새로고침 뒤에도 슬롯 유지');
// sequential: the first rule's rewrite matches the second rule's alias, so both apply in order.
async function second(name) {
  await page.locator('.wp-advance').click();
  await page.waitForSelector('.wp-name-input');
  await page.fill('.wp-name-input', name);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.wp-text p');
  const s = await saved();
  return { node: s.node, slot4: s.flags['name:4'], slot3: s.flags['name:3'] };
}
r = await enter('アオキ');
let q = await second('あお');
check(q.node === 's2' && q.slot4 === '青木', `순차 치환: あお→あおき→青木, 결과는 마지막 일치(B) ${JSON.stringify(q)}`);
check(q.slot3 === '青木', '다른 슬롯(name:3)은 그대로');
r = await enter('アオキ');
q = await second('あおき');
check(q.node === 's2' && q.slot4 === '青木', '두 번째 규칙만 일치');
r = await enter('アオキ');
q = await second('みどり');
check(q.node === 's3' && q.slot4 === 'みどり', '순차 모드 미일치 → fallback, 입력값 유지');
check(errors.length === 0, `페이지 오류 없음 ${errors.join(' | ')}`);

await browser.close();
server.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
