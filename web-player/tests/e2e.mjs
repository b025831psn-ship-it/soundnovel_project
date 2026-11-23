// End-to-end check of the completion criteria in a real browser.
// Usage: node tests/e2e.mjs [path/to/story.json]
//   Without an argument it uses data/sample.ko.json.
//   Requires Playwright (`npm i -D playwright` or a global install).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..');
const storyArg = process.argv[2];
const storyPath = storyArg ? path.resolve(storyArg) : path.join(webRoot, 'data/sample.ko.json');
const story = JSON.parse(await readFile(storyPath, 'utf8'));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const file = url.pathname === '/__story.json' ? storyPath : path.join(webRoot, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(webRoot) && file !== storyPath) { res.writeHead(403).end(); return; }
  try {
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/index.html?data=/__story.json`;

// Expected values come from the JSON itself, never from hard-coded IDs.
const nodes = Array.isArray(story.nodes) ? Object.fromEntries(story.nodes.map((n) => [n.id, n])) : story.nodes;
const entry = nodes[story.entry];
const sceneName = (n) => {
  const id = typeof n.scene === 'object' ? n.scene.id : n.scene;
  const s = story.scenes && (Array.isArray(story.scenes) ? story.scenes.find((x) => x.id === id) : story.scenes[id]);
  return (s && (s.name || s.label)) || (typeof n.scene === 'object' ? n.scene.name : n.scene);
};
const firstPage = (n) => {
  const p = n.pages[0];
  const lines = Array.isArray(p) ? p : typeof p === 'string' ? [p] : (p.lines || p.sentences || p.text);
  return lines.map((s) => (typeof s === 'string' ? s : s.text || s.target || s.ko));
};
const opts = entry.options || entry.choices;

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failures++; };

const browser = await chromium.launch();
const page = await browser.newPage();
const texts = () => page.locator('.wp-text p').allTextContents();
const scene = () => page.locator('.wp-scene').textContent();

async function pick(i, how) {
  if (how === 'keys') {
    for (let k = 0; k < i; k++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  } else {
    await page.locator('.wp-option').nth(i).click();
  }
}

await page.goto(base);
await page.waitForSelector('.wp-option');
const labels = await page.locator('.wp-option-label').allTextContents();
check(JSON.stringify(labels) === JSON.stringify(opts.map((o) => o.label || o.text)), `선택지가 데이터 순서대로 표시됨: ${labels.join(' / ')}`);
check(await page.evaluate(() => document.activeElement?.dataset.key) === String(opts[0].key || opts[0].id || 'A'), '첫 포커스가 첫 번째 선택지(A)');

for (const [i, how] of [[0, 'click'], [1, 'keys']]) {
  const target = nodes[opts[i].to];
  const expected = firstPage(target);
  if (i === 1) {
    // Finish path A, then return to the first choice from its end screen.
    while (!(await page.locator('.wp-reset').isVisible())) await page.locator('.wp-advance').click();
    await page.locator('.wp-reset').click();
    await page.waitForSelector('.wp-option');
  }
  await pick(i, how);
  check((await texts())[0] === expected[0], `${opts[i].key || 'AB'[i]} 선택(${how}) 후 목적지 pages[0] 첫 문장 표시: "${expected[0]}"`);
  check((await scene()) === sceneName(target), `${opts[i].key || 'AB'[i]} 장면명: ${await scene()}`);
  if (i === 1) {
    await page.keyboard.press('Enter');
    check((await texts()).length === 2 && (await texts())[1] === expected[1], `입력 한 번에 한 문장 진행 (2번째: "${expected[1]}")`);
    await page.reload();
    await page.waitForSelector('.wp-text p');
    const after = await texts();
    check(after.length === 2 && after[1] === expected[1] && (await scene()) === sceneName(target), 'B의 두 번째 문장에서 새로고침 후 같은 위치로 재개');
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), `soundnovel.webPlayer.${story.gameId}`);
    check(saved && saved.gameId === story.gameId && saved.schemaVersion === story.schemaVersion && saved.node === opts[1].to && saved.line === 1, `저장 내용: ${JSON.stringify(saved)}`);
    for (let k = 2; k < expected.length; k++) await page.locator('.wp-advance').click();
    if (target.to === null || target.to === undefined) {
      await page.keyboard.press('Enter');
      check(await page.locator('.wp-reset').isVisible(), 'to가 null이면 구간 종료와 "첫 선택지로 돌아가기" 표시');
      await page.evaluate(() => localStorage.setItem('unrelated.key', 'keep'));
      await page.locator('.wp-reset').click();
      check(await page.locator('.wp-option').count() === opts.length, '첫 선택지로 돌아감');
      check(await page.evaluate(() => localStorage.getItem('unrelated.key')) === 'keep', '초기화는 이 데모의 기록만 지움');
      const aTarget = nodes[opts[0].to];
      await page.locator('.wp-option').first().click();
      check((await texts())[0] === firstPage(aTarget)[0] && (await scene()) === sceneName(aTarget), '돌아간 뒤 A를 다시 고를 수 있음');
    }
  }
}

await browser.close();
server.close();
console.log(failures ? `\n${failures}개 실패` : '\n모두 통과');
process.exit(failures ? 1 : 0);
