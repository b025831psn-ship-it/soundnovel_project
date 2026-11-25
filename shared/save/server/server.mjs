// Reference sync server (file-backed, no dependencies). Any host that implements the same
// HTTP API can replace it. Run: node server.mjs [dataDir] [port] [host=127.0.0.1]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const MAX_BODY = 256 * 1024;
const MAX_SLOTS = 200;
const HEX = /^[0-9a-f]{64}$/;
const ID = /^[a-z0-9][a-z0-9:_-]{0,63}$/;

const PAIR = /^[0-9A-HJKMNP-TV-Z]{4}$/;

// Pairing: a one-time, short-lived 4-character code hands a wrapped secret from one device to another.
// It is never an account password; failed claims are rate limited per client and globally.
export function createServer({ dir, maxBody = MAX_BODY, maxSlots = MAX_SLOTS, now = Date.now,
  maxVaults = 500, maxVaultsPerClientPerHour = 10, pairTtlMs = null, pairSingleUse = false, maxPairs = 1000, maxFailsPerClient = 10, maxFailsGlobal = 200, failWindowMs = 10 * 60 * 1000 } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  const pairFile = path.join(dir, "pairs.json");
  // code -> { blob, auth, expires|null }. Persistent by default (beta: a few dozen users); a short TTL and
  // single use can be switched on for a stricter deployment.
  const pairs = new Map(Object.entries((() => { try { return JSON.parse(fs.readFileSync(pairFile, "utf8")); } catch { return {}; } })()));
  const savePairs = () => { fs.writeFileSync(pairFile + ".tmp", JSON.stringify(Object.fromEntries(pairs))); fs.renameSync(pairFile + ".tmp", pairFile); };
  const fails = new Map(); // client -> [timestamps]
  let globalFails = [];
  const recent = (list) => list.filter((t) => now() - t < failWindowMs);
  const clientOf = (req) => req.headers["cf-connecting-ip"] ?? req.socket.remoteAddress ?? "?";
  const created = new Map(); // client -> vault creation timestamps (last hour)
  const sweep = () => { let n = 0; for (const [c, p] of pairs) if (p.expires != null && p.expires <= now()) { pairs.delete(c); n++; } if (n) savePairs(); };
  const shaOf = (t) => crypto.createHash("sha256").update(t).digest("hex");
  fs.mkdirSync(dir, { recursive: true });
  const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
  const vaultFile = (id) => path.join(dir, `${id}.json`);
  const load = (id) => { try { return JSON.parse(fs.readFileSync(vaultFile(id), "utf8")); } catch { return null; } };
  const store = (id, v) => { const f = vaultFile(id); fs.writeFileSync(f + ".tmp", JSON.stringify(v)); fs.renameSync(f + ".tmp", f); };
  const send = (res, code, body) => { res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,if-match", "access-control-allow-methods": "GET,PUT,DELETE,OPTIONS" }); res.end(body === undefined ? "" : JSON.stringify(body)); };
  const readBody = (req) => new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on("data", (c) => { n += c.length; if (n > maxBody) { reject(Object.assign(new Error("too large"), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

  return http.createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") return send(res, 204);
      const pm = /^\/v1\/pair\/([^/]+)(\/claim)?$/.exec(new URL(req.url, "http://x").pathname);
      if (pm) {
        const code = pm[1].toUpperCase();
        if (!PAIR.test(code)) return send(res, 400, { error: "bad code" });
        sweep();
        if (req.method === "PUT" && !pm[2]) {
          if (pairs.has(code)) return send(res, 409, { error: "in use" });
          if (pairs.size >= maxPairs) return send(res, 429, { error: "busy" });
          let body;
          try { body = JSON.parse(await readBody(req)); } catch { return send(res, 400, { error: "bad body" }); }
          if (!body?.blob || typeof body.blob.ct !== "string" || typeof body.blob.iv !== "string") return send(res, 400, { error: "bad blob" });
          const tk = /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1];
          if (!tk) return send(res, 401, { error: "auth required" });
          pairs.set(code, { blob: body.blob, auth: shaOf(tk), expires: pairTtlMs == null ? null : now() + pairTtlMs });
          savePairs();
          return send(res, 201, { expiresInSec: pairTtlMs == null ? null : Math.floor(pairTtlMs / 1000) });
        }
        if (req.method === "DELETE" && !pm[2]) {
          const tk = /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1];
          const p = pairs.get(code);
          if (!p) return send(res, 404, { error: "no such code" });
          if (!tk || shaOf(tk) !== p.auth) return send(res, 401, { error: "bad token" });
          pairs.delete(code); savePairs();
          return send(res, 204);
        }
        if (req.method === "POST" && pm[2]) {
          const who = clientOf(req);
          const mine = recent(fails.get(who) ?? []); fails.set(who, mine);
          globalFails = recent(globalFails);
          if (mine.length >= maxFailsPerClient || globalFails.length >= maxFailsGlobal) return send(res, 429, { error: "too many attempts" });
          const p = pairs.get(code);
          if (!p) { mine.push(now()); globalFails.push(now()); return send(res, 404, { error: "no such code" }); }
          if (pairSingleUse) { pairs.delete(code); savePairs(); }
          return send(res, 200, { blob: p.blob });
        }
        return send(res, 405, { error: "method" });
      }
      const m = /^\/v1\/vaults\/([0-9a-f]{64})(\/saves(?:\/([^/]+)\/([^/]+))?)?$/.exec(new URL(req.url, "http://x").pathname);
      if (!m || !HEX.test(m[1])) return send(res, 404, { error: "not found" });
      const [, vaultId, savesPart, gameId, slot] = m;
      const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1];
      if (!token) return send(res, 401, { error: "auth required" });
      const vault = load(vaultId);
      const isVaultPath = !savesPart;

      if (req.method === "PUT" && isVaultPath) {
        if (vault) return send(res, 409, { error: "exists" });
        // Strangers must not be able to fill the disk: cap the number of vaults and how fast one client makes them.
        const who = clientOf(req);
        const mine = (created.get(who) ?? []).filter((t) => now() - t < 3600_000);
        if (mine.length >= maxVaultsPerClientPerHour) return send(res, 429, { error: "too many vaults" });
        if (fs.readdirSync(dir).filter((f) => /^[0-9a-f]{64}\.json$/.test(f)).length >= maxVaults) return send(res, 429, { error: "server full" });
        mine.push(now()); created.set(who, mine);
        store(vaultId, { auth: sha(token), saves: {} });
        return send(res, 201, {});
      }
      if (!vault) return send(res, 404, { error: "no vault" });
      const a = Buffer.from(vault.auth), b = Buffer.from(sha(token));
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, { error: "bad token" });

      if (req.method === "DELETE" && isVaultPath) { fs.unlinkSync(vaultFile(vaultId)); return send(res, 204); }
      if (req.method === "GET" && gameId === undefined) {
        const saves = Object.entries(vault.saves).map(([key, s]) => {
          const [g, sl] = key.split("/");
          return s.deleted ? { gameId: g, slot: sl, revision: s.revision, deleted: true }
            : { gameId: g, slot: sl, revision: s.revision, savedAt: s.env.savedAt, deviceId: s.env.deviceId, label: s.env.label, size: JSON.stringify(s.env).length };
        });
        return send(res, 200, { saves });
      }
      if (gameId === undefined) return send(res, 405, { error: "method" });
      if (!ID.test(gameId) || !ID.test(slot)) return send(res, 400, { error: "bad id" });
      const key = `${gameId}/${slot}`;
      const cur = vault.saves[key];

      if (req.method === "GET") {
        if (!cur || cur.deleted) return send(res, 404, { error: "no save" });
        return send(res, 200, { ...cur.env, revision: cur.revision });
      }
      const ifMatch = Number(req.headers["if-match"]);
      if (!Number.isInteger(ifMatch) || ifMatch < 0) return send(res, 428, { error: "if-match required" });
      const curRev = cur?.revision ?? 0;
      if (ifMatch !== curRev) return send(res, 409, { current: cur && !cur.deleted ? { ...cur.env, revision: cur.revision } : null, revision: curRev });

      if (req.method === "PUT") {
        let env;
        try { env = JSON.parse(await readBody(req)); } catch (e) { return send(res, e.code === 413 ? 413 : 400, { error: "bad body" }); }
        if (env?.gameId !== gameId || env?.slot !== slot || env?.format !== 1) return send(res, 400, { error: "envelope mismatch" });
        if (!cur && Object.values(vault.saves).filter((s) => !s.deleted).length >= maxSlots) return send(res, 413, { error: "too many slots" });
        const revision = curRev + 1;
        vault.saves[key] = { env: { ...env, revision }, revision };
        store(vaultId, vault);
        return send(res, 200, { revision });
      }
      if (req.method === "DELETE") {
        if (!cur || cur.deleted) return send(res, 404, { error: "no save" });
        vault.saves[key] = { deleted: true, revision: curRev + 1 };
        store(vaultId, vault);
        return send(res, 204);
      }
      return send(res, 405, { error: "method" });
    } catch (e) {
      return send(res, e.code === 413 ? 413 : 500, { error: "server error" });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Binds to 127.0.0.1 unless a host is given; put a front (serve.cjs, a proxy) in front for anything else.
  const [dir = "./vaults", port = "8780", host = "127.0.0.1"] = process.argv.slice(2);
  createServer({ dir }).listen(Number(port), host, () => console.log(`save server on ${host}:${port}, data in ${dir}`));
}
