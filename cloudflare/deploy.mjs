// Puts the site on Cloudflare: build (build.mjs), R2 objects that changed, then the Pages deploy.
// Run on the PC from the served worktree after `npx wrangler login`:  node cloudflare/deploy.mjs [--setup] [--dry]
//   --setup  first time only: creates the R2 bucket, the D1 database (and writes its id into wrangler.toml),
//            the tables (schema.sql) and the Pages project.
//   --dry    builds and lists what would be uploaded, uploads nothing.
// Live files (R2 live/: the owner's dialogue edits) are only put when missing, so a deploy never overwrites
// edits saved on the site.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const dry = args.has("--dry");
const BUCKET = "pension-spur-data", DB = "pension-spur-saves", PROJECT = "pension-spur";
const wrangler = (...a) => {
  console.log("> wrangler " + a.join(" "));
  if (dry) return "";
  return execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["--yes", "wrangler", ...a], { cwd: here, encoding: "utf8", stdio: ["inherit", "pipe", "inherit"], shell: process.platform === "win32" });
};

if (args.has("--setup")) {
  wrangler("r2", "bucket", "create", BUCKET);
  const made = wrangler("d1", "create", DB);
  const id = /database_id\s*=\s*"([0-9a-f-]{36})"/.exec(made)?.[1] ?? /"uuid":\s*"([0-9a-f-]{36})"/.exec(made)?.[1];
  if (id) { const toml = path.join(here, "wrangler.toml"); fs.writeFileSync(toml, fs.readFileSync(toml, "utf8").replace(/database_id = ".*"/, `database_id = "${id}"`)); }
  else if (!dry) throw new Error("could not read the D1 database id: put it into wrangler.toml by hand\n" + made);
  wrangler("d1", "execute", DB, "--remote", "--file", "schema.sql");
  wrangler("pages", "project", "create", PROJECT, "--production-branch", "main");
}

execFileSync(process.execPath, [path.join(here, "build.mjs")], { stdio: "inherit" });
const r2 = JSON.parse(fs.readFileSync(path.join(here, "out", "r2.json"), "utf8"));
const stateFile = path.join(here, ".deploy-state.json");
const state = (() => { try { return JSON.parse(fs.readFileSync(stateFile, "utf8")); } catch { return {}; } })();
for (const [key, o] of Object.entries(r2)) {
  const stamp = `${o.size}-${o.mtime}`;
  if (state[key] === stamp || (key.startsWith("live/") && state[key])) continue;
  wrangler("r2", "object", "put", `${BUCKET}/${key}`, "--file", o.file, "--content-type", o.type, "--remote");
  if (!dry) { state[key] = stamp; fs.writeFileSync(stateFile, JSON.stringify(state, null, 1)); }
}
wrangler("pages", "deploy", "out/dist", "--project-name", PROJECT, "--branch", "main", "--commit-dirty=true");
console.log(dry ? "dry run: nothing uploaded" : `done: https://${PROJECT}.pages.dev/`);
