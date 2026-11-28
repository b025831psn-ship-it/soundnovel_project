// Usage: node tools/check-sound-browser.mjs <sound data dir> [seconds]
// <sound data dir> holds MUS/VCE/VCP/BIN.PAC and sound-tables.json (tools/export-sound-tables.mjs).
// Renders music 1 + effect 5 through the real AudioWorklet in headless Chromium
// (OfflineAudioContext) and checks it sample for sample against sound/web/engine.js in Node.
// Serves files from a local 127.0.0.1 server that stops when the check ends.
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { Ps1SoundEngine } from "../sound/web/engine.js";

const [dataDir, secArg = "4"] = process.argv.slice(2);
const PORT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const N = 44100 * +secArg;
const page = `<!doctype html><meta charset="utf-8"><script type="module">
import { createPs1Sound } from "/port/sound/web/ps1-sound.js";
window.run = async (n) => {
  const ctx = new OfflineAudioContext(2, n, 44100);
  const errors = [];
  const s = await createPs1Sound({ data: "/data/", context: ctx, onEvent: (e) => e.type === "error" && errors.push(e) });
  s.play(1, 0); s.play(1005, 0);
  await new Promise((res) => setTimeout(res, 200)); // let the batch reach the audio thread first
  const buf = await ctx.startRendering();
  return { errors, l: Array.from(buf.getChannelData(0), (x) => Math.round(x * 32768)), r: Array.from(buf.getChannelData(1), (x) => Math.round(x * 32768)) };
};
window.ok = 1;
</script>`;
const server = createServer((q, r) => {
  const u = decodeURIComponent(q.url.split("?")[0]);
  if (u === "/t.html") { r.writeHead(200, { "content-type": "text/html" }); return r.end(page); }
  const f = u.startsWith("/port/") ? join(PORT_DIR, u.slice(6)) : u.startsWith("/data/") ? join(dataDir, u.slice(6)) : null;
  if (!f || !existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : f.endsWith(".json") ? "application/json" : "application/octet-stream" });
  r.end(readFileSync(f));
});
await new Promise((res) => server.listen(0, "127.0.0.1", res));
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
try {
  const p = await browser.newPage();
  p.on("pageerror", (e) => console.log("pageerror", e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/t.html`);
  await p.waitForFunction(() => window.ok);
  const t0 = Date.now();
  const got = await p.evaluate((n) => window.run(n), N);
  const ms = Date.now() - t0;
  const pacs = Object.fromEntries(["MUS", "VCE", "VCP", "BIN"].map((k) => [k, new Uint8Array(readFileSync(join(dataDir, k + ".PAC")))]));
  const e = new Ps1SoundEngine({ tables: JSON.parse(readFileSync(join(dataDir, "sound-tables.json"))), pacs });
  e.command("play", [1, 0]); e.command("play", [1005, 0]);
  const l = new Float32Array(N), r = new Float32Array(N);
  for (let o = 0; o < N; o += 128) e.pull(l.subarray(o, Math.min(N, o + 128)), r.subarray(o, Math.min(N, o + 128)));
  let diff = -1;
  for (let i = 0; i < N; i++) if (got.l[i] !== Math.round(l[i] * 32768) || got.r[i] !== Math.round(r[i] * 32768)) { diff = i; break; }
  console.log(JSON.stringify({ seconds: +secArg, browserMs: ms, errors: got.errors, nonzero: got.l.filter((x) => x).length, firstDiff: diff < 0 ? null : diff }));
  process.exitCode = diff < 0 && !got.errors.length ? 0 : 1;
} finally { await browser.close(); server.close(); }
