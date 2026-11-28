// Real-browser check of the save dialog against the reference server:
// NODE_PATH=$(npm root -g) node tests/sync-ui-browser.mjs
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createServer } from "../../../shared/save/server/server.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const types = { ".js": "text/javascript", ".html": "text/html", ".mjs": "text/javascript" };
const web = http.createServer((req, res) => {
  const p = new URL(req.url, "http://x").pathname;
  const f = p === "/page" ? path.join(root, "ports/kamaitachi-gba/tests/ui-page.html") : path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(f)] ?? "text/plain" }); res.end(fs.readFileSync(f));
}).listen(0, "127.0.0.1");
const sync = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "ui-")) }).listen(0, "127.0.0.1");
await Promise.all([new Promise((r) => web.on("listening", r)), new Promise((r) => sync.on("listening", r))]);
const url = `http://127.0.0.1:${web.address().port}/page?syncServer=${encodeURIComponent(`http://127.0.0.1:${sync.address().port}`)}`;
const browser = await chromium.launch();
let failed = 0;
const check = (ok, msg) => { console.log(ok ? "ok  " : "FAIL", msg); if (!ok) failed++; };
const open = async () => { const page = await (await browser.newContext()).newPage(); page.on("pageerror", (e) => { console.log("pageerror", e.message); failed++; }); await page.goto(url); await page.waitForSelector("button[title='저장 동기화']"); return page; };

const pc = await open();
await pc.click("button[title='저장 동기화']");
await pc.click("text=이 기기로 시작하기");
await pc.waitForSelector("#save-dialog .code");
const code = (await pc.textContent("#save-dialog .code")).trim();
check(/^[0-9A-HJKMNP-TV-Z]{4}$/.test(code), `passcode shown: ${code}`);
await pc.evaluate(() => { globalThis.soundnovelSave.store.write("kamaitachi-gba", "suspend", { schema: 1, label: "x", payload: { bank: 19, offset: 77 } }); });
await pc.click("text=지금 동기화");
await pc.waitForFunction(() => document.querySelector("#save-dialog")?.textContent.includes("마지막:"));

const phone = await open();
await phone.click("button[title='저장 동기화']");
await phone.fill("#save-dialog input[placeholder^='패스코드']", code.toLowerCase());
await phone.click('#save-dialog button:text-is("연결")');
await phone.waitForSelector("#save-dialog .code");
check((await phone.textContent("#save-dialog .code")).trim() === code, "phone joined with the same passcode");
const got = await phone.evaluate(() => globalThis.soundnovelSave.store.read("kamaitachi-gba", "suspend")?.payload.offset);
check(got === 77, "phone received the PC's suspend slot");
const wrong = await open();
await wrong.click("button[title='저장 동기화']");
await wrong.fill("#save-dialog input[placeholder^='패스코드']", "0000");
await wrong.click('#save-dialog button:text-is("연결")');
await wrong.waitForSelector("text=패스코드가 맞지 않습니다");
check(true, "a wrong passcode is refused");
await browser.close(); web.close(); sync.close();
process.exit(failed ? 1 : 0);
