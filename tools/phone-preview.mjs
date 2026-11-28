// Phone preview on the PC: opens the test server in a separate window that behaves like a phone
// (an iPhone's screen size and pixel ratio, touch input, coarse pointer, mobile user agent), so the
// players take exactly the code paths and CSS they take on a real phone. Mouse clicks arrive as taps.
//
//   node tools/phone-preview.mjs [url] [--landscape] [--device "iPhone 13"]
//
// Default url: http://127.0.0.1:8770/ . Saves made in the preview stay in its own profile folder
// (phone-preview-profile next to this repository's checkout), apart from the normal browser.
// Uses Microsoft Edge when Playwright's own Chromium is missing. Started by 휴대폰 미리보기.vbs on the
// desktop, which hides this console; nothing opens until someone runs it.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
function loadPlaywright() {
  try { return require("playwright"); } catch {}
  try { return require(path.join(execSync("npm root -g", { encoding: "utf8" }).trim(), "playwright")); } catch {}
  throw new Error("playwright 모듈을 찾지 못했습니다 (npm i -g playwright)");
}
const { chromium, devices } = loadPlaywright();

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const url = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--device") || "http://127.0.0.1:8770/";
const base = devices[option("--device") || "iPhone 13"];
if (!base) throw new Error(`unknown device: ${option("--device")}`);
const landscape = flag("--landscape");
const viewport = landscape ? { width: base.viewport.height, height: base.viewport.width } : base.viewport;

const here = path.dirname(fileURLToPath(import.meta.url));
const profile = path.resolve(here, "..", "..", "phone-preview-profile");
const options = {
  headless: process.env.PREVIEW_HEADLESS === "1",
  viewport, screen: viewport,
  deviceScaleFactor: base.deviceScaleFactor, isMobile: true, hasTouch: true, userAgent: base.userAgent,
  locale: "ko-KR",
  args: [`--window-size=${viewport.width + 16},${viewport.height + 88}`, "--app=about:blank"],
  ignoreDefaultArgs: ["--enable-automation"],
};
let context;
try { context = await chromium.launchPersistentContext(profile, options); }
catch { context = await chromium.launchPersistentContext(profile, { ...options, channel: "msedge" }); }
const closed = new Promise((resolve) => context.on("close", resolve));

const [page = await context.newPage()] = context.pages();
await page.goto(url).catch(() => {});
if (process.env.PREVIEW_HEADLESS === "1") { // self-check only
  console.log(JSON.stringify(await page.evaluate(() => ({ coarse: matchMedia("(pointer: coarse)").matches,
    hover: matchMedia("(hover: none)").matches, w: innerWidth, h: innerHeight, dpr: devicePixelRatio, touch: "ontouchstart" in window }))));
  await context.close();
}
// Done when the window is closed.
await closed;
