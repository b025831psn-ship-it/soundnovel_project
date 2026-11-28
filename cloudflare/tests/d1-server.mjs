// Test double: the Pages save API (functions/_lib/sync.js) on node:sqlite behind node:http, with the same
// createServer() shape as shared/save/server/server.mjs, so the save tests run unchanged against it.
import http from "node:http";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { handleSync } from "../functions/_lib/sync.js";

const schema = fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
function d1() {
  const db = new DatabaseSync(":memory:");
  db.exec(schema);
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    run: async () => { const r = db.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; },
  });
  return { prepare: (sql) => stmt(sql) };
}
const dbs = new Map(); // dir -> database, so a "restarted" server keeps its data like the file server
export function createServer({ dir, ...opts } = {}) {
  if (!dbs.has(dir)) dbs.set(dir, d1());
  const env = { SAVES: dbs.get(dir) };
  const server = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const headers = new Headers(); for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(",") : v);
    const request = new Request("http://x" + req.url, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const response = await handleSync(request, env, new URL(req.url, "http://x").pathname, opts);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  const close = server.close.bind(server);
  server.close = (cb) => { close(cb); server.closeAllConnections(); return server; };
  return server;
}
