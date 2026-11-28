// Real-browser check of the quick-save button: two browser contexts, a code from one loads in the other
// and the game carries on. node tests/quick-save-browser.mjs (needs playwright).
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
<div class="stage"><canvas width="240" height="160"></canvas><button class="menu-button" id="menu">M</button></div>
<script type="module">
import { SaveStore } from "/save/store.js";
const store = await SaveStore.open({ name: "qs" });
globalThis.continued = null;
globalThis.store = store;
globalThis.soundnovelReport = () => ({ scene: "page 12", text: "テスト" });
globalThis.soundnovelSave = { store, gameId: "kamaitachi-gba", boot: { titleActive: true, canContinue: () => !!store.read("kamaitachi-gba", "suspend"),
  continueSuspended: () => { globalThis.continued = store.read("kamaitachi-gba", "suspend").payload.page; return true; } } };
const { mountSyncUi } = await import("/save/sync-ui.js");
await mountSyncUi({ api: globalThis.soundnovelSave });
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
  if (u === "/") { res.writeHead(200, { "content-type": "text/html" }); return res.end(page); }
  const f = path.join(root, u);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": "text/javascript" }); res.end(fs.readFileSync(f));
}).listen(0, "127.0.0.1");
await new Promise((r) => srv.on("listening", r));
const url = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch();
let failed = 0;
const check = (ok, msg) => { console.log(ok ? "ok  " : "FAIL", msg); if (!ok) failed++; };
const pc = await (await browser.newContext()).newPage();
const phone = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage();
for (const p of [pc, phone]) { p.on("pageerror", (e) => { console.log("pageerror", e.message); failed++; }); await p.goto(url); await p.waitForSelector(".sn-tool"); }
const box = await pc.evaluate(() => { const a = document.querySelector(".sn-tool").getBoundingClientRect(), m = document.querySelector("#menu").getBoundingClientRect(); return { gap: m.left - a.right, top: a.top - m.top, w: a.width }; });
check(box.gap === 8 && box.top === 0 && box.w === 44, `disk button sits left of the menu button (${JSON.stringify(box)})`);
await pc.evaluate(async () => { store.write("kamaitachi-gba", "suspend", { schema: 1, payload: { page: 42 } }); store.write("kamaitachi-gba", "manual-0", { schema: 1, payload: { page: 7 } }); await store.flush(); });
await pc.click(".sn-tool"); await pc.click("#quick-save button.primary");
const code = await pc.waitForSelector("#quick-save .code").then((e) => e.textContent());
check(/^\d{4}$/.test(code), `저장 shows a 4-digit code (${code})`);
await pc.click("#quick-save .close");
await pc.evaluate(async () => { store.write("kamaitachi-gba", "suspend", { schema: 1, payload: { page: 43 } }); await store.flush(); });
await pc.click(".sn-tool"); await pc.click("#quick-save button.primary");
check(await pc.waitForSelector("#quick-save .code").then((e) => e.textContent()) === code, "saving again keeps the code");
await phone.tap(".sn-tool"); await phone.tap("#quick-save button:not(.primary):not(.close)");
await phone.fill("#quick-save input", "x" + (code === "0000" ? "0001" : "0000"));
await phone.tap("#quick-save button.primary");
check(/없는 코드/.test(await phone.waitForSelector("#quick-save .warn").then((e) => e.textContent())), "a wrong code says so");
await phone.fill("#quick-save input", code);
await Promise.all([phone.waitForNavigation(), phone.tap("#quick-save button.primary")]);
await phone.waitForFunction(() => globalThis.continued !== null, null, { timeout: 10000 });
check(await phone.evaluate(() => globalThis.continued) === 43, "불러오기 reloads and carries on from the saved state");
check(await phone.evaluate(() => store.read("kamaitachi-gba", "manual-0")?.payload.page) === 7, "the bookmarks came along");
await pc.click("#quick-save .close"); await pc.click(".sn-tool >> nth=1");
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
