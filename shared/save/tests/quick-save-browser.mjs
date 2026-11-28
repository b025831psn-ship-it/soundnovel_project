// Real-browser check of save codes and the report button: 새로하기/이어하기 before the game, saves going up
// to the player's 6-digit code by themselves, another device carrying on with the code, the disk dialog.
// node tests/quick-save-browser.mjs (needs playwright).
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createServer } from "../server/server.mjs";
import { handleReport } from "../../../cloudflare/functions/_lib/report.js";
const reports = [];
const { chromium } = createRequire(import.meta.url)("playwright");
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const api = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "qs-")) });
await new Promise((r) => api.listen(0, "127.0.0.1", r));
const page = `<!doctype html><meta charset="utf-8"><style>.stage{position:relative;width:480px;height:320px;background:#000}
.menu-button{position:absolute;right:12px;bottom:12px;width:44px;height:44px;border-radius:50%;background:#222;color:#ddd;border:1px solid #555;opacity:.8}</style>
<div class="stage" id="stage"><canvas width="240" height="160"></canvas><button class="menu-button" id="menu">M</button></div>
<script type="module">
import { SaveStore } from "/save/store.js";
import { startGate } from "/player/start-gate.js";
const store = await SaveStore.open({ name: "qs" });
globalThis.continued = null; globalThis.started = false;
globalThis.store = store;
globalThis.soundnovelReport = () => ({ scene: "page 12", text: "テスト" });
globalThis.soundnovelSave = { store, gameId: "kamaitachi-gba", boot: { titleActive: true, canContinue: () => !!store.read("kamaitachi-gba", "suspend"),
  continueSuspended: () => { globalThis.continued = store.read("kamaitachi-gba", "suspend").payload.page; return true; } } };
const { mountSyncUi } = await import("/save/sync-ui.js");
await mountSyncUi({ api: globalThis.soundnovelSave });
await startGate(document.getElementById("stage"));
globalThis.started = true;
</script>`;
const srv = http.createServer((req, res) => {
  const u = req.url.split("?")[0];
  if (u.startsWith("/sync/")) {
    const up = http.request({ host: "127.0.0.1", port: api.address().port, path: u.slice(5), method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    return req.pipe(up);
  }
  if (u === "/report") {
    const chunks = []; req.on("data", (c) => chunks.push(c)); req.on("end", async () => {
      const r = await handleReport(new Request("http://x/report", { method: "POST", body: Buffer.concat(chunks) }), { allow: async () => true,
        putShot: async (id) => `/edit/reports/${id}.png`, fileIssue: Object.assign(async (repo, issue) => { reports.push({ repo, ...issue }); return true; }, { local: true }) });
      res.writeHead(r.status, { "content-type": "application/json" }); res.end(await r.text());
    });
    return;
  }
  if (u.endsWith("/test.html")) { res.writeHead(200, { "content-type": "text/html" }); return res.end(page); }
  const f = path.join(root, u);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": "text/javascript" }); res.end(fs.readFileSync(f));
}).listen(0, "127.0.0.1");
await new Promise((r) => srv.on("listening", r));
const url = `http://127.0.0.1:${srv.address().port}/ports/kamaitachi-gba/test.html?choice=1`;
const browser = await chromium.launch();
let failed = 0;
const check = (ok, msg) => { console.log(ok ? "ok  " : "FAIL", msg); if (!ok) failed++; };
const pcContext = await browser.newContext();
const pc = await pcContext.newPage();
const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage();
for (const p of [pc, phone]) { p.on("pageerror", (e) => { console.log("pageerror", e.message); failed++; }); await p.goto(url); await p.waitForSelector("#start-choice"); }
check(await pc.evaluate(() => !globalThis.started), "the game waits for 새로하기 / 이어하기");
await pc.click("#start-choice >> text=새로하기");
await pc.waitForFunction(() => globalThis.started);
const box = await pc.evaluate(() => { const a = document.querySelector(".sn-tool").getBoundingClientRect(), m = document.querySelector("#menu").getBoundingClientRect(); return { gap: m.left - a.right, top: a.top - m.top, w: a.width }; });
check(box.gap === 8 && box.top === 0 && box.w === 44, `disk button sits left of the menu button (${JSON.stringify(box)})`);
await pc.evaluate(async () => { store.write("kamaitachi-gba", "suspend", { schema: 1, payload: { page: 42 } }); store.write("kamaitachi-gba", "manual-0", { schema: 1, payload: { page: 7 } }); });
await pc.waitForFunction(() => /^\d{6}$/.test(localStorage.getItem("sn-save-code") ?? ""), null, { timeout: 15000 });
await pc.click(".sn-tool"); 
const code = await pc.waitForSelector("#quick-save .code").then((e) => e.textContent());
check(/^\d{6}$/.test(code), `a save made the player's 6-digit code by itself (${code})`);
await pc.evaluate(async () => { store.write("kamaitachi-gba", "suspend", { schema: 1, payload: { page: 43 } }); });
await pc.click("#quick-save button.primary");
await pc.waitForSelector("#quick-save >> text=저장했습니다");
check(await pc.textContent("#quick-save .code") === code, "지금 저장 keeps the same code");
await pc.click("#quick-save .close");

await phone.tap("#start-choice >> text=이어하기");
await phone.fill("#start-choice input", "x" + (code === "000000" ? "000001" : "000000"));
await phone.tap("#start-choice >> text=불러오기");
check(/없는 코드/.test(await phone.waitForSelector("#start-choice .warn:not(:empty)").then((e) => e.textContent())), "a wrong code says so");
await phone.fill("#start-choice input", code);
await Promise.all([phone.waitForNavigation(), phone.tap("#start-choice >> text=불러오기")]);
await phone.waitForFunction(() => globalThis.continued !== null, null, { timeout: 10000 });
check(await phone.evaluate(() => globalThis.continued) === 43, "이어하기 with the code on another device carries on from the latest save");
check(await phone.evaluate(() => !document.getElementById("start-choice")), "after the load the choice is not asked again");
check(await phone.evaluate(() => store.read("kamaitachi-gba", "manual-0")?.payload.page) === 7, "the bookmarks came along");
check(await phone.evaluate(() => localStorage.getItem("sn-save-code")) === code, "the phone now saves to the same code");

const again = await pcContext.newPage();
await again.goto(url); await again.waitForSelector("#start-choice");
await again.click("#start-choice >> text=이어하기");
await again.waitForFunction(() => globalThis.continued !== null, null, { timeout: 10000 });
check(await again.evaluate(() => globalThis.continued) === 43 && !(await again.$("#start-choice input")), "이어하기 on the same device goes straight on without the code");

await pc.click(".sn-tool >> nth=1");
check(await pc.evaluate(() => { const [a, b] = [...document.querySelectorAll(".sn-tool")].map((x) => x.getBoundingClientRect()); return Math.round(a.left - b.right); }) === 8, "report button sits left of the disk");
await pc.click("#report-dialog button >> text=버그");
await pc.fill("#report-dialog textarea", "글자가 겹쳐요 @someone");
await pc.click("#report-dialog button.primary");
await pc.waitForSelector("#report-dialog >> text=접수");
const rep = reports[0];
check(rep?.repo === "b025831psn-ship-it/kamaitachi-gba-kor" && /버그 · page 12/.test(rep.title) && /テスト/.test(rep.body) && /reports\//.test(rep.body), "the report becomes an issue in the game's private repository with the scene, its text and the screenshot");
check(/```\n글자가 겹쳐요 @someone\n```/.test(rep?.body ?? ""), "the tester's words stay inside a code block");
await browser.close(); srv.close(); api.close();
process.exit(failed ? 1 : 0);
