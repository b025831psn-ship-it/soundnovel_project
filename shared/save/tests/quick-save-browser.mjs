// Real-browser check of the quick-save button: two browser contexts, a code from one loads in the other
// and the game carries on. node tests/quick-save-browser.mjs (needs playwright).
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createServer } from "../server/server.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const api = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "qs-")) });
await new Promise((r) => api.listen(0, "127.0.0.1", r));
const page = `<!doctype html><meta charset="utf-8"><style>.stage{position:relative;width:480px;height:320px;background:#000}
.menu-button{position:absolute;right:12px;bottom:12px;width:44px;height:44px;border-radius:50%;background:#222;color:#ddd;border:1px solid #555;opacity:.8}</style>
<div class="stage"><button class="menu-button" id="menu">M</button></div>
<script type="module">
import { SaveStore } from "/store.js";
const store = await SaveStore.open({ name: "qs" });
globalThis.continued = null;
globalThis.store = store;
globalThis.soundnovelSave = { store, gameId: "demo", boot: { titleActive: true, canContinue: () => !!store.read("demo", "suspend"),
  continueSuspended: () => { globalThis.continued = store.read("demo", "suspend").payload.page; return true; } } };
const { mountSyncUi } = await import("/sync-ui.js");
await mountSyncUi({ api: globalThis.soundnovelSave });
</script>`;
const srv = http.createServer((req, res) => {
  const u = req.url.split("?")[0];
  if (u.startsWith("/sync/")) {
    const up = http.request({ host: "127.0.0.1", port: api.address().port, path: u.slice(5), method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    return req.pipe(up);
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
await pc.evaluate(async () => { store.write("demo", "suspend", { schema: 1, payload: { page: 42 } }); store.write("demo", "manual-0", { schema: 1, payload: { page: 7 } }); await store.flush(); });
await pc.click(".sn-tool"); await pc.click("#quick-save button.primary");
const code = await pc.waitForSelector("#quick-save .code").then((e) => e.textContent());
check(/^\d{4}$/.test(code), `저장 shows a 4-digit code (${code})`);
await pc.click("#quick-save .close");
await pc.evaluate(async () => { store.write("demo", "suspend", { schema: 1, payload: { page: 43 } }); await store.flush(); });
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
check(await phone.evaluate(() => store.read("demo", "manual-0")?.payload.page) === 7, "the bookmarks came along");
await browser.close(); srv.close(); api.close();
process.exit(failed ? 1 : 0);
