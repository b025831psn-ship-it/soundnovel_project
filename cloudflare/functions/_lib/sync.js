// The save server's HTTP API (shared/save/server/server.mjs) on D1 (cloudflare/schema.sql), for Cloudflare Pages.
// Same routes, limits and answers. Each vault is one row; a write is a compare-and-set on the row's version,
// retried when another request changed the vault in between, so no slot is ever lost.
// Limits as in server.mjs; createServer-style overrides come in opts (tests: cloudflare/tests/d1-server.mjs).
const LIMITS = { maxBody: 256 * 1024, maxSlots: 20, maxVaultBytes: 5 * 1024 * 1024, maxVaults: 200, maxVaultsPerClientPerHour: 10,
  maxPairBlob: 2048, maxPairs: 1000, maxFailsPerClient: 10, maxFailsGlobal: 200, failWindowMs: 10 * 60 * 1000,
  maxRequestsPerMinute: 300, pairTtlMs: null, pairSingleUse: false, now: Date.now,
  snapTtlMs: 90 * 24 * 3600 * 1000, maxSnapsPerGame: 9000, maxSnapsPerClientPerHour: 20,
  maxCodes: 500_000, maxCodesPerClientPerHour: 20, codeHistory: 5 };
// Per-minute request counts are kept per running copy of the Function (each Cloudflare location has its own).
const rates = new WeakMap(); // database binding -> client -> { start, count }
const HEX = /^[0-9a-f]{64}$/, ID = /^[a-z0-9][a-z0-9:_-]{0,63}$/, PAIR = /^[0-9A-HJKMNP-TV-Z]{4}$/;

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,if-match,x-vault-id", "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS" };
const send = (code, body) => new Response(body === undefined || code === 204 ? null : JSON.stringify(body), { status: code, headers: { "content-type": "application/json", ...CORS } });
const sha = async (t) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map((b) => b.toString(16).padStart(2, "0")).join("");
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
const bearer = (request) => /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
const clientOf = (request) => request.headers.get("cf-connecting-ip") ?? "?";
class TooLarge extends Error {}
async function body(request, max) {
  if (Number(request.headers.get("content-length") ?? 0) > max) throw new TooLarge();
  const text = await request.text();
  if (new TextEncoder().encode(text).length > max) throw new TooLarge();
  return text;
}

async function loadVault(db, id) {
  const row = await db.prepare("SELECT auth, saves, ver FROM vaults WHERE id = ?").bind(id).first();
  return row ? { auth: row.auth, saves: JSON.parse(row.saves), ver: row.ver } : null;
}
// Applies change(vault) -> Response | {saves, response}; writes only if the vault did not change meanwhile.
async function update(db, id, change) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const vault = await loadVault(db, id);
    if (!vault) return send(404, { error: "no vault" });
    const result = change(vault);
    if (result instanceof Response) return result;
    const done = await db.prepare("UPDATE vaults SET saves = ?, ver = ver + 1 WHERE id = ? AND ver = ?").bind(JSON.stringify(result.saves), id, vault.ver).run();
    if (done.meta.changes === 1) return result.response;
  }
  return send(503, { error: "busy, try again" });
}

export async function handleSync(request, env, pathname, opts = {}) {
  const L = { ...LIMITS, ...opts }, db = env.SAVES, now = L.now();
  const { maxSlots: MAX_SLOTS, maxVaultBytes: MAX_VAULT_BYTES, maxVaults: MAX_VAULTS, maxVaultsPerClientPerHour: MAX_VAULTS_PER_CLIENT_PER_HOUR,
    maxPairBlob: MAX_PAIR_BLOB, maxPairs: MAX_PAIRS, maxFailsPerClient: MAX_FAILS_PER_CLIENT, maxFailsGlobal: MAX_FAILS_GLOBAL, failWindowMs: FAIL_WINDOW } = L;
  try {
    if (request.method === "OPTIONS") return send(204);
    {
      if (!rates.has(db)) rates.set(db, new Map());
      const rate = rates.get(db), who = clientOf(request), r = rate.get(who);
      if (!r || now - r.start >= 60_000) rate.set(who, { start: now, count: 1 });
      else if (++r.count > L.maxRequestsPerMinute) return send(429, { error: "slow down" });
      if (rate.size > 10_000) rate.clear();
    }
    const pm = /^\/v1\/pair\/([^/]+)(\/claim)?$/.exec(pathname);
    if (pm) {
      const code = pm[1].toUpperCase();
      if (!PAIR.test(code)) return send(400, { error: "bad code" });
      await db.prepare("DELETE FROM pairs WHERE expires IS NOT NULL AND expires <= ?").bind(now).run();
      if (request.method === "PUT" && !pm[2]) {
        // Only a vault's owner can register a code, so strangers cannot fill the table.
        const vid = request.headers.get("x-vault-id"), tk = bearer(request);
        const v0 = vid && HEX.test(vid) ? await loadVault(db, vid) : null;
        if (!v0 || !tk || !same(await sha(tk), v0.auth)) return send(401, { error: "vault auth required" });
        if (await db.prepare("SELECT 1 FROM pairs WHERE code = ?").bind(code).first()) return send(409, { error: "in use" });
        if ((await db.prepare("SELECT COUNT(*) AS n FROM pairs").first()).n >= MAX_PAIRS) return send(429, { error: "busy" });
        let b;
        try { b = JSON.parse(await body(request, L.maxBody)); } catch { return send(400, { error: "bad body" }); }
        if (!b?.blob || typeof b.blob.ct !== "string" || typeof b.blob.iv !== "string" || JSON.stringify(b.blob).length > MAX_PAIR_BLOB) return send(400, { error: "bad blob" });
        const expires = L.pairTtlMs == null ? null : now + L.pairTtlMs;
        const put = await db.prepare("INSERT OR IGNORE INTO pairs (code, blob, auth, expires) VALUES (?, ?, ?, ?)").bind(code, JSON.stringify(b.blob), await sha(tk), expires).run();
        if (put.meta.changes !== 1) return send(409, { error: "in use" });
        return send(201, { expiresInSec: L.pairTtlMs == null ? null : Math.floor(L.pairTtlMs / 1000) });
      }
      if (request.method === "DELETE" && !pm[2]) {
        const tk = bearer(request);
        const p = await db.prepare("SELECT auth FROM pairs WHERE code = ?").bind(code).first();
        if (!p) return send(404, { error: "no such code" });
        if (!tk || !same(await sha(tk), p.auth)) return send(401, { error: "bad token" });
        await db.prepare("DELETE FROM pairs WHERE code = ?").bind(code).run();
        return send(204);
      }
      if (request.method === "POST" && pm[2]) {
        const who = clientOf(request);
        await db.prepare("DELETE FROM fails WHERE at <= ?").bind(now - FAIL_WINDOW).run();
        const mine = (await db.prepare("SELECT COUNT(*) AS n FROM fails WHERE client = ?").bind(who).first()).n;
        const all = (await db.prepare("SELECT COUNT(*) AS n FROM fails").first()).n;
        if (mine >= MAX_FAILS_PER_CLIENT || all >= MAX_FAILS_GLOBAL) return send(429, { error: "too many attempts" });
        const p = await db.prepare("SELECT blob FROM pairs WHERE code = ?").bind(code).first();
        if (!p) { await db.prepare("INSERT INTO fails (client, at) VALUES (?, ?)").bind(who, now).run(); return send(404, { error: "no such code" }); }
        if (L.pairSingleUse) await db.prepare("DELETE FROM pairs WHERE code = ?").bind(code).run();
        return send(200, { blob: JSON.parse(p.blob) });
      }
      return send(405, { error: "method" });
    }

    const sm = /^\/v1\/snap\/([a-z0-9][a-z0-9:_-]{0,63})(?:\/(\d{4}))?$/.exec(pathname);
    if (sm) return snap(request, db, L, now, sm[1], sm[2]);
    const cm = /^\/v1\/code(?:\/(\d{6})(?:\/([a-z0-9][a-z0-9:_-]{0,63}))?)?$/.exec(pathname);
    if (cm) return saveCode(request, db, L, now, cm[1], cm[2]);

    const m = /^\/v1\/vaults\/([0-9a-f]{64})(\/saves(?:\/([^/]+)\/([^/]+))?)?$/.exec(pathname);
    if (!m) return send(404, { error: "not found" });
    const [, vaultId, savesPart, gameId, slot] = m;
    const token = bearer(request);
    if (!token) return send(401, { error: "auth required" });
    const auth = await sha(token);
    const isVaultPath = !savesPart;

    if (request.method === "PUT" && isVaultPath) {
      if (await db.prepare("SELECT 1 FROM vaults WHERE id = ?").bind(vaultId).first()) return send(409, { error: "exists" });
      // Strangers must not be able to fill the database: cap the vaults and how fast one client makes them.
      const who = clientOf(request);
      if ((await db.prepare("SELECT COUNT(*) AS n FROM vaults WHERE client = ? AND created > ?").bind(who, now - 3600_000).first()).n >= MAX_VAULTS_PER_CLIENT_PER_HOUR) return send(429, { error: "too many vaults" });
      if ((await db.prepare("SELECT COUNT(*) AS n FROM vaults").first()).n >= MAX_VAULTS) return send(429, { error: "server full" });
      const put = await db.prepare("INSERT OR IGNORE INTO vaults (id, auth, saves, ver, created, client) VALUES (?, ?, '{}', 0, ?, ?)").bind(vaultId, auth, now, who).run();
      return put.meta.changes === 1 ? send(201, {}) : send(409, { error: "exists" });
    }
    const vault = await loadVault(db, vaultId);
    if (!vault) return send(404, { error: "no vault" });
    if (!same(vault.auth, auth)) return send(401, { error: "bad token" });

    if (request.method === "DELETE" && isVaultPath) { await db.prepare("DELETE FROM vaults WHERE id = ?").bind(vaultId).run(); return send(204); }
    if (request.method === "GET" && gameId === undefined) {
      const saves = Object.entries(vault.saves).map(([key, s]) => {
        const [g, sl] = key.split("/");
        return s.deleted ? { gameId: g, slot: sl, revision: s.revision, deleted: true }
          : { gameId: g, slot: sl, revision: s.revision, savedAt: s.env.savedAt, deviceId: s.env.deviceId, label: s.env.label, size: JSON.stringify(s.env).length };
      });
      return send(200, { saves });
    }
    if (gameId === undefined) return send(405, { error: "method" });
    if (!ID.test(gameId) || !ID.test(slot)) return send(400, { error: "bad id" });
    const key = `${gameId}/${slot}`;

    if (request.method === "GET") {
      const cur = vault.saves[key];
      if (!cur || cur.deleted) return send(404, { error: "no save" });
      return send(200, { ...cur.env, revision: cur.revision });
    }
    const ifMatch = Number(request.headers.get("if-match"));
    if (!request.headers.has("if-match") || !Number.isInteger(ifMatch) || ifMatch < 0) return send(428, { error: "if-match required" });
    const conflict = (cur) => send(409, { current: cur && !cur.deleted ? { ...cur.env, revision: cur.revision } : null, revision: cur?.revision ?? 0 });

    if (request.method === "PUT") {
      let env2;
      try { env2 = JSON.parse(await body(request, L.maxBody)); } catch (e) { return send(e instanceof TooLarge ? 413 : 400, { error: "bad body" }); }
      if (env2?.gameId !== gameId || env2?.slot !== slot || env2?.format !== 1) return send(400, { error: "envelope mismatch" });
      return update(db, vaultId, (v) => {
        const cur = v.saves[key], curRev = cur?.revision ?? 0;
        if (ifMatch !== curRev) return conflict(cur);
        if (!cur && Object.values(v.saves).filter((s) => !s.deleted).length >= MAX_SLOTS) return send(413, { error: "too many slots" });
        const others = Object.entries(v.saves).reduce((n, [k, s]) => n + (k === key || s.deleted ? 0 : JSON.stringify(s.env).length), 0);
        if (others + JSON.stringify(env2).length > MAX_VAULT_BYTES) return send(413, { error: "vault full" });
        const revision = curRev + 1;
        return { saves: { ...v.saves, [key]: { env: { ...env2, revision }, revision } }, response: send(200, { revision }) };
      });
    }
    if (request.method === "DELETE") {
      return update(db, vaultId, (v) => {
        const cur = v.saves[key], curRev = cur?.revision ?? 0;
        if (ifMatch !== curRev) return conflict(cur);
        if (!cur || cur.deleted) return send(404, { error: "no save" });
        return { saves: { ...v.saves, [key]: { deleted: true, revision: curRev + 1 } }, response: send(204) };
      });
    }
    return send(405, { error: "method" });
  } catch (e) {
    return send(e instanceof TooLarge ? 413 : 500, { error: "server error" });
  }
}

// Quick save (shared/save/snap.js): the whole game's saves under a 4-digit code, per game.
//   PUT  /v1/snap/<game>         { data, code?, token? } -> { code, token }  (same code again when the token matches)
//   POST /v1/snap/<game>/<code>  -> { data }  (failed codes count like failed pairing claims)
// A code nobody saved or loaded for snapTtlMs is deleted, so the 10,000 codes of a game do not run out.
async function snap(request, db, L, now, game, code) {
  await db.prepare("DELETE FROM snaps WHERE used <= ?").bind(now - L.snapTtlMs).run();
  if (request.method === "PUT" && !code) {
    let b;
    try { b = JSON.parse(await body(request, L.maxBody)); } catch (e) { return send(e instanceof TooLarge ? 413 : 400, { error: "bad body" }); }
    if (typeof b?.data !== "string" || !b.data) return send(400, { error: "bad body" });
    if (typeof b.code === "string" && /^\d{4}$/.test(b.code) && typeof b.token === "string") {
      const row = await db.prepare("SELECT token FROM snaps WHERE game = ? AND code = ?").bind(game, b.code).first();
      if (row && same(row.token, await sha(b.token))) {
        await db.prepare("UPDATE snaps SET data = ?, used = ? WHERE game = ? AND code = ?").bind(b.data, now, game, b.code).run();
        return send(200, { code: b.code, token: b.token });
      }
    }
    const who = clientOf(request);
    if ((await db.prepare("SELECT COUNT(*) AS n FROM snaps WHERE client = ? AND created > ?").bind(who, now - 3600_000).first()).n >= L.maxSnapsPerClientPerHour) return send(429, { error: "too many codes" });
    if ((await db.prepare("SELECT COUNT(*) AS n FROM snaps WHERE game = ?").bind(game).first()).n >= L.maxSnapsPerGame) return send(429, { error: "server full" });
    const token = [...crypto.getRandomValues(new Uint8Array(16))].map((x) => x.toString(16).padStart(2, "0")).join("");
    for (let i = 0; i < 40; i++) {
      const c = String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, "0");
      const put = await db.prepare("INSERT OR IGNORE INTO snaps (game, code, token, data, used, created, client) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(game, c, await sha(token), b.data, now, now, who).run();
      if (put.meta.changes === 1) return send(201, { code: c, token });
    }
    return send(503, { error: "busy, try again" });
  }
  if (request.method === "POST" && code) {
    const who = clientOf(request);
    await db.prepare("DELETE FROM fails WHERE at <= ?").bind(now - L.failWindowMs).run();
    const mine = (await db.prepare("SELECT COUNT(*) AS n FROM fails WHERE client = ?").bind(who).first()).n;
    const all = (await db.prepare("SELECT COUNT(*) AS n FROM fails").first()).n;
    if (mine >= L.maxFailsPerClient || all >= L.maxFailsGlobal) return send(429, { error: "too many attempts" });
    const row = await db.prepare("SELECT data FROM snaps WHERE game = ? AND code = ?").bind(game, code).first();
    if (!row) { await db.prepare("INSERT INTO fails (client, at) VALUES (?, ?)").bind(who, now).run(); return send(404, { error: "no such code" }); }
    await db.prepare("UPDATE snaps SET used = ? WHERE game = ? AND code = ?").bind(now, game, code).run();
    return send(200, { data: row.data });
  }
  return send(405, { error: "method" });
}

// Save codes (shared/save/code-save.js, 태우 2026-11-28): one 6-digit code per player, for every game.
// The code itself is the key, so unknown codes count as failed attempts (like pairing claims).
//   POST /v1/code                 -> 201 { code }           a new code
//   PUT  /v1/code/<code>/<game>   { data } -> 200           that game's saves under the code; the last
//                                                             codeHistory versions are kept for restoring
//   POST /v1/code/<code>/<game>   -> 200 { data | null }    load (null: the code has nothing for this game)
// A code nobody saved or loaded for snapTtlMs is deleted with its saves.
async function saveCode(request, db, L, now, code, game) {
  const who = clientOf(request);
  await db.prepare("DELETE FROM code_saves WHERE code IN (SELECT code FROM codes WHERE used <= ?)").bind(now - L.snapTtlMs).run();
  await db.prepare("DELETE FROM code_hist WHERE code IN (SELECT code FROM codes WHERE used <= ?)").bind(now - L.snapTtlMs).run();
  await db.prepare("DELETE FROM codes WHERE used <= ?").bind(now - L.snapTtlMs).run();
  if (!code) {
    if (request.method !== "POST") return send(405, { error: "method" });
    if ((await db.prepare("SELECT COUNT(*) AS n FROM codes WHERE client = ? AND created > ?").bind(who, now - 3600_000).first()).n >= L.maxCodesPerClientPerHour) return send(429, { error: "too many codes" });
    if ((await db.prepare("SELECT COUNT(*) AS n FROM codes").first()).n >= L.maxCodes) return send(429, { error: "server full" });
    for (let i = 0; i < 40; i++) {
      const c = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
      const put = await db.prepare("INSERT OR IGNORE INTO codes (code, used, created, client) VALUES (?, ?, ?, ?)").bind(c, now, now, who).run();
      if (put.meta.changes === 1) return send(201, { code: c });
    }
    return send(503, { error: "busy, try again" });
  }
  if (!game || !["PUT", "POST"].includes(request.method)) return send(405, { error: "method" });
  await db.prepare("DELETE FROM fails WHERE at <= ?").bind(now - L.failWindowMs).run();
  const mine = (await db.prepare("SELECT COUNT(*) AS n FROM fails WHERE client = ?").bind(who).first()).n;
  const all = (await db.prepare("SELECT COUNT(*) AS n FROM fails").first()).n;
  if (mine >= L.maxFailsPerClient || all >= L.maxFailsGlobal) return send(429, { error: "too many attempts" });
  if (!(await db.prepare("SELECT 1 FROM codes WHERE code = ?").bind(code).first())) {
    await db.prepare("INSERT INTO fails (client, at) VALUES (?, ?)").bind(who, now).run();
    return send(404, { error: "no such code" });
  }
  await db.prepare("UPDATE codes SET used = ? WHERE code = ?").bind(now, code).run();
  if (request.method === "POST") {
    const row = await db.prepare("SELECT data FROM code_saves WHERE code = ? AND game = ?").bind(code, game).first();
    return send(200, { data: row?.data ?? null });
  }
  let b;
  try { b = JSON.parse(await body(request, L.maxBody)); } catch (e) { return send(e instanceof TooLarge ? 413 : 400, { error: "bad body" }); }
  if (typeof b?.data !== "string" || !b.data) return send(400, { error: "bad body" });
  const old = await db.prepare("SELECT data, used FROM code_saves WHERE code = ? AND game = ?").bind(code, game).first();
  if (old && old.data !== b.data) {
    await db.prepare("INSERT INTO code_hist (code, game, data, at) VALUES (?, ?, ?, ?)").bind(code, game, old.data, old.used).run();
    await db.prepare("DELETE FROM code_hist WHERE code = ? AND game = ? AND at NOT IN (SELECT at FROM code_hist WHERE code = ? AND game = ? ORDER BY at DESC LIMIT ?)").bind(code, game, code, game, L.codeHistory).run();
  }
  await db.prepare("INSERT INTO code_saves (code, game, data, used) VALUES (?, ?, ?, ?) ON CONFLICT (code, game) DO UPDATE SET data = excluded.data, used = excluded.used").bind(code, game, b.data, now).run();
  return send(200, {});
}
