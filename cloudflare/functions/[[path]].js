// Pages Function for the paths in _routes.json (cloudflare/build.mjs); everything else is a static file.
// Bindings (wrangler.toml): DATA = R2 bucket, SAVES = D1 database; secret EDIT_PASSWORD.
//   /sync/*   the save server (shared/save/server/server.mjs API) on D1  -> sync.js
//   /edit/*   the owner's pages and writes, behind the password           -> owner files in R2 edit/
//   others    big or ranged game files (R2 data/) and the editable dialogue edits (R2 live/)
import { handleSync } from "./_lib/sync.js";

const textEdits = /^\/edit\/text-edits-(ja|ko)\.json$/;

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const p = decodeURIComponent(url.pathname);
  if (p === "/sync" || p.startsWith("/sync/")) return handleSync(request, env, p.slice("/sync".length) || "/");
  if (p.startsWith("/edit/")) return edit(request, env, p);
  if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405 });
  if (/(^|\/)text-edits\.json$/.test(p)) return (await object(env, request, "live" + p, "no-store")) ?? new Response("{}", { headers: { "content-type": "application/json", "cache-control": "no-store" } });
  return (await object(env, request, "data" + p, "no-cache")) ?? next();
}

// An R2 object as the PC server answers a file: validator, no-cache, a single byte range.
async function object(env, request, key, cache) {
  const range = request.headers.get("range");
  const obj = await env.DATA.get(key, { range: range ? request.headers : undefined, onlyIf: request.headers });
  if (!obj) return null;
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", cache);
  headers.set("accept-ranges", "bytes");
  headers.set("x-robots-tag", "noindex, nofollow");
  if (!("body" in obj)) return new Response(null, { status: 304, headers });
  if (range && obj.range) {
    const start = obj.range.offset ?? 0, length = obj.range.length ?? obj.size - start;
    headers.set("content-range", `bytes ${start}-${start + length - 1}/${obj.size}`);
    headers.set("content-length", String(length));
    return new Response(request.method === "HEAD" ? null : obj.body, { status: 206, headers });
  }
  headers.set("content-length", String(obj.size));
  return new Response(request.method === "HEAD" ? null : obj.body, { headers });
}

// The owner's password: Basic (any user name) or the sn_gate cookie a page opened with it leaves, as serve.cjs.
async function sha256(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function same(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}
async function owner(request, env) {
  const password = env.EDIT_PASSWORD ?? "";
  if (!password) return { ok: false, response: new Response("No owner password is set.", { status: 503 }) };
  const gate = await sha256("soundnovel-gate:" + password);
  const [scheme, token] = (request.headers.get("authorization") ?? "").split(" ");
  let given = "";
  try { given = scheme === "Basic" && token ? atob(token).split(":").slice(1).join(":") : ""; } catch { /* a bad header */ }
  if (same(given, password)) return { ok: true, cookie: `sn_gate=${gate}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000` };
  const cookie = /(?:^|;\s*)sn_gate=([0-9a-f]{64})/.exec(request.headers.get("cookie") ?? "")?.[1] ?? "";
  if (same(cookie, gate)) return { ok: true };
  const quiet = request.headers.get("x-quiet-auth") === "1";
  return { ok: false, response: new Response(null, { status: 401, headers: quiet ? {} : { "www-authenticate": 'Basic realm="soundnovel test", charset="UTF-8"' } }) };
}

async function edit(request, env, p) {
  const who = await owner(request, env);
  if (!who.ok) return who.response;
  const done = (response) => { if (who.cookie) response.headers.append("set-cookie", who.cookie); return response; };
  if (request.method === "PUT") {
    const gba = textEdits.exec(p);
    if (gba) return done(await putJson(request, env, `live/kamaitachi-gba-kor/${gba[1] === "ko" ? "port-data-ko" : "port-data"}/text-edits.json`, 1 << 20, () => true));
    if (p === "/edit/kamaitachi-ps1/text-edits.json") {
      return done(await putJson(request, env, "live/kamaitachi-ps1-kor/port-data/machine/ko/text-edits.json", 4 << 20,
        (value) => Object.entries(value).every(([id, e]) => /^\d{3}-\d{3}-\d{4}$/.test(id) && e && typeof e.ko === "string" && e.ko.length < 4000), true));
    }
    return new Response(null, { status: 404 });
  }
  if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405 });
  // the GBA debug scene lists are read at /edit/kamaitachi-gba/debug-scenes-(ja|ko).json (serve.cjs)
  const key = "edit" + (p.endsWith("/") ? p + "index.html" : p);
  const res = await object(env, request, key, "no-cache");
  return done(res ?? new Response(null, { status: 404 }));
}

// Saves a JSON object of dialogue edits; for the PS1 script every change is also added to the history log.
async function putJson(request, env, key, max, valid, log = false) {
  const text = await request.text();
  if (text.length > max) return new Response(null, { status: 413 });
  let value = null;
  try { value = JSON.parse(text); } catch { /* not JSON */ }
  if (!value || typeof value !== "object" || Array.isArray(value) || !valid(value)) return new Response(null, { status: 400 });
  const body = JSON.stringify(value, null, 1) + "\n";
  if (log) {
    const before = JSON.parse((await (await env.DATA.get(key))?.text()) || "{}");
    const changed = [...new Set([...Object.keys(before), ...Object.keys(value)])].filter((id) => before[id]?.ko !== value[id]?.ko)
      .map((id) => ({ id, from: before[id]?.ko ?? null, to: value[id]?.ko ?? null }));
    if (changed.length) {
      const logKey = key.replace(/\.json$/, ".log.jsonl");
      const old = (await (await env.DATA.get(logKey))?.text()) ?? "";
      await env.DATA.put(logKey, old + JSON.stringify({ at: new Date().toISOString(), changed }) + "\n", { httpMetadata: { contentType: "application/x-ndjson" } });
    }
  }
  await env.DATA.put(key, body, { httpMetadata: { contentType: "application/json; charset=utf-8" } });
  return new Response(null, { status: 204 });
}
