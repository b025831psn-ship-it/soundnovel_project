// Reference sync server (file-backed, no dependencies). Any host that implements the same
// HTTP API can replace it. Run: node server.mjs [dataDir] [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const MAX_BODY = 256 * 1024;
const MAX_SLOTS = 200;
const HEX = /^[0-9a-f]{64}$/;
const ID = /^[a-z0-9][a-z0-9:_-]{0,63}$/;

export function createServer({ dir, maxBody = MAX_BODY, maxSlots = MAX_SLOTS } = {}) {
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
      const m = /^\/v1\/vaults\/([0-9a-f]{64})(\/saves(?:\/([^/]+)\/([^/]+))?)?$/.exec(new URL(req.url, "http://x").pathname);
      if (!m || !HEX.test(m[1])) return send(res, 404, { error: "not found" });
      const [, vaultId, savesPart, gameId, slot] = m;
      const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1];
      if (!token) return send(res, 401, { error: "auth required" });
      const vault = load(vaultId);
      const isVaultPath = !savesPart;

      if (req.method === "PUT" && isVaultPath) {
        if (vault) return send(res, 409, { error: "exists" });
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dir = "./vaults", port = "8780"] = process.argv.slice(2);
  createServer({ dir }).listen(Number(port), () => console.log(`save server on :${port}, data in ${dir}`));
}
