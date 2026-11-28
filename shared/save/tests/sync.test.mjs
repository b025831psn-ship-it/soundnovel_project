import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { SaveStore } from "../store.js";
import { MemoryBackend } from "../backends.js";
import { newSecret, encodeCode, decodeCode, deriveKeys, SyncClient } from "../sync.js";
import { createServer } from "../server/server.mjs";

async function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vault-"));
  const server = createServer({ dir });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const secret = newSecret();
  const keys = await deriveKeys(decodeCode(encodeCode(secret)));
  const mk = async () => { const store = await SaveStore.open({ backend: new MemoryBackend() }); return { store, sync: new SyncClient({ store, baseUrl, keys }) }; };
  return { dir, server, baseUrl, keys, mk, close: () => server.close() };
}
const fields = (page) => ({ schema: 1, label: `p${page}`, payload: { page } });

test("code round trip and rejection", () => {
  const s = newSecret(); const code = encodeCode(s);
  assert.match(code, /^([0-9A-Z]{4}-){6}[0-9A-Z]{2}$/);
  assert.deepEqual(decodeCode(code.toLowerCase().replace(/-/g, " ")), s);
  assert.equal(decodeCode("short"), null);
  assert.equal(decodeCode(code.slice(0, -1) + "U"), null);
});

test("PC -> mobile continue, payload encrypted at rest", async () => {
  const t = await setup();
  const pc = await t.mk(), phone = await t.mk();
  pc.store.write("demo", "suspend", fields(42));
  assert.equal((await pc.sync.sync()).pushed, 1);
  const raw = fs.readFileSync(path.join(t.dir, fs.readdirSync(t.dir)[0]), "utf8");
  assert.ok(!raw.includes('"page":42')); assert.ok(raw.includes("$enc"));
  const r = await phone.sync.sync();
  assert.equal(r.pulled, 1);
  assert.equal(phone.store.read("demo", "suspend").payload.page, 42);
  // phone continues, PC picks it up
  phone.store.write("demo", "suspend", fields(50));
  await phone.sync.sync(); await pc.sync.sync();
  assert.equal(pc.store.read("demo", "suspend").payload.page, 50);
  t.close();
});

test("conflict asks, keeps the loser as backup", async () => {
  const t = await setup();
  const a = await t.mk(), b = await t.mk();
  a.store.write("demo", "manual-0", fields(1)); await a.sync.sync(); await b.sync.sync();
  a.store.write("demo", "manual-0", fields(2));
  b.store.write("demo", "manual-0", fields(3));
  await a.sync.sync();
  const r = await b.sync.sync();
  assert.equal(r.conflicts.length, 1);
  const key = r.conflicts[0];
  assert.equal(b.store.conflicts.get(key).payload.page, 2);
  b.store.resolveConflict(key, "local");
  assert.equal(b.store.backups.get(key).payload.page, 2);
  await b.sync.sync(); await a.sync.sync();
  assert.equal(a.store.read("demo", "manual-0").payload.page, 3);
  t.close();
});

test("delete propagates and re-create works", async () => {
  const t = await setup();
  const a = await t.mk(), b = await t.mk();
  a.store.write("demo", "manual-1", fields(1)); await a.sync.sync(); await b.sync.sync();
  a.store.erase("demo", "manual-1"); await a.sync.sync(); await b.sync.sync();
  assert.equal(b.store.read("demo", "manual-1"), null);
  a.store.write("demo", "manual-1", fields(9));
  assert.equal((await a.sync.sync()).errors.length, 0);
  await b.sync.sync();
  assert.equal(b.store.read("demo", "manual-1").payload.page, 9);
  t.close();
});

test("wrong code and oversize are refused", async () => {
  const t = await setup();
  const a = await t.mk(); a.store.write("demo", "suspend", fields(1)); await a.sync.sync();
  const other = await deriveKeys(newSecret());
  const bad = new SyncClient({ store: a.store, baseUrl: t.baseUrl, keys: { ...t.keys, authToken: other.authToken } });
  await assert.rejects(bad.sync());
  // A slot of its own: on "suspend" the server would answer 409 (a's save) before reading the body.
  const big = await t.mk(); big.store.write("demo", "big", { schema: 1, payload: { blob: "x".repeat(300000) } });
  assert.equal((await big.sync.sync()).errors.length, 1);
  t.close();
});

test("offline: sync failure leaves the outbox for later", async () => {
  const t = await setup();
  const a = await t.mk(); a.store.write("demo", "suspend", fields(1));
  t.close();
  await assert.rejects(a.sync.sync());
  assert.equal(a.store.pending().length, 1);
});
