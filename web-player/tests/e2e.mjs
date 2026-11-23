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
// A sentence is a string or { ko | text | target, ja? }.
const ko = (s) => (typeof s === 'string' ? s : s.ko ?? s.text ?? s.target);
const ja = (s) => (typeof s === 'string' ? null : s.ja ?? s.source ?? s.original ?? null);
const isSentence = (p) => typeof p === 'string' || (p && !Array.isArray(p) && !p.lines && !p.sentences && typeof ko(p) === 'string');
// The sentences that appear one per input, in reading order across pages.
const pageItems = (p) => {
  if (isSentence(p)) return [p];
  const lines = Array.isArray(p) ? p : (p.lines || p.sentences || p.text);
  return Array.isArray(lines) ? lines : [lines];
};
const stepItems = (n) => n.pages.flatMap(pageItems);
const steps = (n) => stepItems(n).map(ko);
const firstPage = steps;
const lastVisible = async () => (await texts()).at(-1);
const opts = entry.options || entry.choices;
const question = ko(entry.question ?? entry.prompt ?? entry.text);
const label = (o) => ko(o.label ?? o.text);
const logItems = () => page.locator('.wp-log-list li').allTextContents();

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
check(JSON.stringify(labels) === JSON.stringify(opts.map(label)), `선택지가 데이터 순서대로 표시됨: ${labels.join(' / ')}`);
check((await page.locator('.wp-question').textContent()) === question, `질문 표시: ${question}`);
check(await page.evaluate(() => document.activeElement?.dataset.key) === String(opts[0].key || opts[0].id || 'A'), '첫 포커스가 첫 번째 선택지(A)');

for (const [i, how] of [[0, 'click'], [1, 'keys']]) {
  const target = nodes[opts[i].to];
  const expected = firstPage(target);
  if (i === 1) {
    // Finish path A's passage. If the segment ends there, return from the end screen;
    // if it continues, check that it moves on to its `to` node, then start over.
    for (let k = 0; k < steps(target).length; k++) await page.locator('.wp-advance').click();
    if (target.to) {
      const nx = nodes[target.to];
      const shown = nx.pages ? (await texts())[0] : await page.locator('.wp-question').textContent();
      const want = nx.pages ? steps(nx)[0] : ko(nx.question ?? nx.prompt ?? nx.text);
      check(shown === want, `A 구간 끝에서 다음 노드로 이어짐: "${want}"`);
      await page.evaluate((k) => localStorage.removeItem(k), `soundnovel.webPlayer.${story.gameId}`);
      await page.reload();
    } else {
      await page.locator('.wp-reset').click();
    }
    await page.waitForSelector('.wp-option');
  }
  await pick(i, how);
  check((await texts())[0] === expected[0], `${opts[i].key || 'AB'[i]} 선택(${how}) 후 목적지 pages[0] 첫 문장 표시: "${expected[0]}"`);
  check((await scene()) === sceneName(target), `${opts[i].key || 'AB'[i]} 장면명: ${await scene()}`);
  if (i === 1) {
    await page.keyboard.press('Enter');
    check((await lastVisible()) === expected[1], `입력 한 번에 한 문장 진행 (2번째: "${expected[1]}")`);
    const before = await texts();
    await page.reload();
    await page.waitForSelector('.wp-text p');
    const after = await texts();
    check(JSON.stringify(after) === JSON.stringify(before) && after.at(-1) === expected[1] && (await scene()) === sceneName(target), 'B의 두 번째 문장에서 새로고침 후 같은 위치로 재개');
    // Original text, checked on the sentence now on screen (B's 2nd), only when the data has it.
    const cur = stepItems(target)[1];
    const langBtn = page.locator('.wp-lang');
    const lastP = () => page.locator('.wp-text p').last().textContent();
    const anyJa = JSON.stringify(story).match(/"(ja|source|original)"\s*:\s*"[^"]/);
    if (ja(cur)) {
      await langBtn.click(); // 병기
      check((await lastP()) === ja(cur) + expected[1] && (await langBtn.textContent()) === '병기', `병기: 원문 위에 번역 ("${ja(cur)}")`);
      await langBtn.click(); // 원문
      check((await lastP()) === ja(cur) && (await langBtn.textContent()) === '원문', '원문만 표시');
      await page.reload();
      await page.waitForSelector('.wp-text p');
      check((await langBtn.textContent()) === '원문' && (await lastP()) === ja(cur), '표시 언어가 새로고침 뒤에도 유지');
      await langBtn.click(); // 번역
      check((await lastP()) === expected[1], '번역으로 돌아옴');
    } else if (!anyJa) {
      check(await langBtn.isHidden(), '원문이 없는 데이터에서는 언어 전환 버튼을 숨김');
    }
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), `soundnovel.webPlayer.${story.gameId}`);
    check(saved && saved.gameId === story.gameId && saved.schemaVersion === story.schemaVersion && saved.node === opts[1].to && saved.page * 1000 + saved.line > 0, `저장 내용: ${JSON.stringify(saved)}`);
    // Backlog: question, the picked option, and the sentences read so far, in order.
    await page.locator('.wp-log-open').click();
    const log = await logItems();
    check(JSON.stringify(log) === JSON.stringify([question, label(opts[1]), expected[0], expected[1]]), `백로그에 질문·고른 선택지·읽은 문장이 순서대로: ${log.join(' / ')}`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.classList.contains('wp-advance'));
    check(!(await page.locator('.wp-log').isVisible()) && (await lastVisible()) === expected[1], '백로그를 Esc로 닫으면 같은 위치');
    await page.keyboard.press('Enter');
    if (expected.length > 2) {
      const afterLog = await lastVisible();
      check(afterLog === expected[2], `백로그를 닫은 뒤 Enter로 계속 진행 ("${afterLog}")`);
    } else {
      check(await page.locator('.wp-reset').isVisible() || (await texts())[0] !== expected[1], '백로그를 닫은 뒤 Enter로 계속 진행 (구간 끝)');
    }
    for (let k = 3; k < expected.length; k++) await page.locator('.wp-advance').click();
    if (target.to === null || target.to === undefined) {
      if (expected.length > 2) await page.keyboard.press('Enter'); // otherwise the Enter above already ended it
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
