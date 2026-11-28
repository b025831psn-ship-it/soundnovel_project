// Real-browser check of the IndexedDB backend: node tests/browser.mjs (needs playwright).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const srv = http.createServer((req, res) => {
  const f = path.join(root, req.url === "/" ? "tests/page.html" : req.url.split("?")[0]);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": f.endsWith(".html") ? "text/html" : "text/javascript" }); res.end(fs.readFileSync(f));
}).listen(0, "127.0.0.1");
await new Promise((r) => srv.on("listening", r));
const url = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
let failed = 0;
const check = (ok, msg) => { console.log(ok ? "ok  " : "FAIL", msg); if (!ok) failed++; };
await page.goto(url);
const first = await page.evaluate(async () => {
  const { SaveStore } = await import("/store.js");
  const s = await SaveStore.open({ name: "t-" + location.port });
  s.write("demo", "manual-0", { schema: 1, payload: { page: 5, big: "x".repeat(50000) } });
  await s.flush();
  return { status: s.status, id: s.deviceId };
});
check(first.status === "persistent", "IndexedDB opens (persistent)");
await page.reload();
const second = await page.evaluate(async () => {
  const { SaveStore } = await import("/store.js");
  const s = await SaveStore.open({ name: "t-" + location.port });
  return { page: s.read("demo", "manual-0")?.payload.page, id: s.deviceId, pending: s.pending().length };
});
check(second.page === 5, "slot survives a reload");
check(second.id === first.id, "deviceId is stable");
check(second.pending === 1, "outbox survives a reload");
await browser.close(); srv.close();
process.exit(failed ? 1 : 0);
