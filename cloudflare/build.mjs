// Builds the Cloudflare Pages site from exactly what serve.cjs serves on the PC (its own route tables), so the
// two never drift apart. Run on the PC from the served worktree:  node cloudflare/build.mjs
//
// Output (cloudflare/out, git-ignored):
//   dist/              static files at their URL paths (Pages: at most 25 MiB a file, 20,000 files)
//   dist/_routes.json  which paths run the Function (functions/[[path]].js); everything else is static
//   dist/_headers      noindex, like the PC's open beta
//   r2.json            { key: { file, type, size, mtime } } to put in the R2 bucket (big or ranged files,
//                      owner-only /edit/ files, and the editable text-edits.json starting copies)
// Nothing is uploaded here; cloudflare/deploy.mjs does that.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const { routes, portRoute, PORT_PREFIXES, cartridges } = createRequire(import.meta.url)(path.join(root, "serve.cjs"));
const out = path.join(here, "out"), dist = path.join(out, "dist");

const PAGES_MAX = 25 * 1024 * 1024 - 1;
// Files the ports read in byte ranges (picture-view.js: BGD/MUS .PAC; xa.js: .ch0; video): R2 answers ranges.
const RANGED = /\.(PAC|pac|ch0|mp4)$/;
// The dialogue edits the owner saves from /edit/: they change after a deploy, so they live in R2.
const LIVE = /(^|\/)text-edits\.json$/;
// Not part of the site: verification traces, old hub-art tries in sub-folders, old PS1 test captures.
const SKIP = /\/trace\/|^\/art\/hub\/[^/]+\/|^\/kamaitachi-ps1-kor\/port-data\/machine-[^/]*\.png$/;

const files = new Map(); // url -> [file, type]
const add = (url, route) => { if (route && fs.existsSync(route[0]) && !cartridges.has(url) && !SKIP.test(decodeURIComponent(url))) files.set(url, route); };
for (const [url, route] of routes) {
  if (url.startsWith("/play/") || url.startsWith("/web-player/")) continue; // the old ROM players: not shipped
  add(url, route);
}
const walk = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : e.isFile() ? [path.join(dir, e.name)] : []) : [];
for (const [prefix, dir] of PORT_PREFIXES) {
  if (!dir) continue;
  for (const file of walk(dir)) {
    const url = prefix + path.relative(dir, file).split(path.sep).map(encodeURIComponent).join("/");
    add(url, portRoute(url)); // serve.cjs decides: extensions, owner-only files, tests/tools/server folders
  }
}
const bg = path.join(root, "kamaitachi-gba-kor", "assets", "bg");
for (const file of walk(bg)) if (/^\d{3}(-[1-3])?\.png$/.test(path.basename(file))) add("/kamaitachi-gba-kor/assets/bg/" + path.basename(file), [file, "image/png"]);

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
const r2 = {}, fnPaths = [];
let staticCount = 0, staticBytes = 0;
for (const [url, [file, type]] of [...files].sort()) {
  const stat = fs.statSync(file);
  const plain = decodeURIComponent(url);
  if (url.startsWith("/edit/") || LIVE.test(plain) || RANGED.test(plain) || stat.size > PAGES_MAX) {
    const key = (url.startsWith("/edit/") ? "edit" : LIVE.test(plain) ? "live" : "data") + plain;
    r2[key] = { file, type, size: stat.size, mtime: Math.floor(stat.mtimeMs) };
    if (!url.startsWith("/edit/")) fnPaths.push(plain);
    continue;
  }
  const target = path.join(dist, ...(plain.endsWith("/") ? [...plain.split("/"), "index.html"] : plain.split("/")));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  try { fs.linkSync(file, target); } catch { fs.copyFileSync(file, target); }
  staticCount++; staticBytes += stat.size;
}
if (staticCount > 20000) throw new Error(`${staticCount} static files: over the Pages limit of 20,000`);

// _routes.json: at most 100 rules. Single files while they fit, else their folders.
let include = ["/sync/*", "/edit/*", ...fnPaths];
if (include.length > 100) include = ["/sync/*", "/edit/*", ...new Set(fnPaths.map((p) => p.slice(0, p.lastIndexOf("/") + 1) + "*"))];
if (include.length > 100) throw new Error(`${include.length} function routes: over 100`);
fs.writeFileSync(path.join(dist, "_routes.json"), JSON.stringify({ version: 1, include, exclude: [] }, null, 1));
fs.writeFileSync(path.join(dist, "_headers"), "/*\n  X-Robots-Tag: noindex, nofollow\n");
fs.writeFileSync(path.join(out, "r2.json"), JSON.stringify(r2, null, 1));

const mb = (n) => (n / 1048576).toFixed(1) + " MB";
const r2Bytes = Object.values(r2).reduce((n, o) => n + o.size, 0);
console.log(`static: ${staticCount} files, ${mb(staticBytes)}`);
console.log(`R2: ${Object.keys(r2).length} objects, ${mb(r2Bytes)} (data ${Object.keys(r2).filter((k) => k.startsWith("data/")).length}, live ${Object.keys(r2).filter((k) => k.startsWith("live/")).length}, edit ${Object.keys(r2).filter((k) => k.startsWith("edit/")).length})`);
console.log(`function routes: ${include.length}`);
