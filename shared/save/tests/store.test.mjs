import test from "node:test";
import assert from "node:assert/strict";
import { SaveStore } from "../store.js";
import { MemoryBackend } from "../backends.js";
import { loadSlot, saveSlot, summarizeSlots, REASON } from "../codec.js";

const codec = {
  gameId: "demo-game", currentSchema: 2, dataVersion: 1,
  slots: () => [{ id: "manual-0", group: "manual" }, { id: "suspend", group: "suspend", showInOriginalUi: false }],
  encode: (snap) => ({ page: snap.page, ver: 2 }),
  validate: (p, schema) => (p && typeof p[schema === 1 ? "pg" : "page"] === "number" ? { ok: true } : { ok: false, reason: REASON.corrupt }),
  migrate: (p, from) => (from === 1 ? { ok: true, payload: { page: p.pg, ver: 2 } } : { ok: false, reason: REASON.unsupportedSchema }),
  decode: (p) => ({ ok: true, state: { page: p.page } }),
  summarize: (p) => ({ title: `page ${p.page}` }),
};

test("write, read, persist and reopen", async () => {
  const backend = new MemoryBackend();
  const s1 = await SaveStore.open({ backend });
  saveSlot(s1, codec, "manual-0", { page: 7 });
  await s1.flush();
  const s2 = await SaveStore.open({ backend });
  assert.equal(s2.read("demo-game", "manual-0").payload.page, 7);
  assert.equal(s2.deviceId, s1.deviceId);
  assert.equal(s2.pending().length, 1);
});

test("load pipeline: ok, migrate, results instead of exceptions", async () => {
  const s = await SaveStore.open({ backend: new MemoryBackend() });
  saveSlot(s, codec, "manual-0", { page: 3 });
  assert.deepEqual(loadSlot(s, codec, "manual-0").state, { page: 3 });
  assert.equal(loadSlot(s, codec, "suspend").reason, REASON.missing);
  s.write("demo-game", "suspend", { schema: 1, payload: { pg: 9 } });
  assert.deepEqual(loadSlot(s, codec, "suspend").state, { page: 9 });
  s.write("demo-game", "suspend", { schema: 3, payload: {} });
  assert.equal(loadSlot(s, codec, "suspend").reason, REASON.unsupportedSchema);
  s.write("demo-game", "suspend", { schema: 2, dataVersion: 5, payload: { page: 1 } });
  assert.equal(loadSlot(s, codec, "suspend").reason, REASON.incompatibleDataVersion);
  s.write("demo-game", "suspend", { schema: 2, payload: { page: "x" } });
  assert.equal(loadSlot(s, codec, "suspend").reason, REASON.corrupt);
  const rows = summarizeSlots(s, codec);
  assert.equal(rows[1].used, true);
});

test("copy, erase and backup round trip", async () => {
  const s = await SaveStore.open({ backend: new MemoryBackend() });
  saveSlot(s, codec, "manual-0", { page: 4 });
  s.copy("demo-game", "manual-0", "suspend");
  assert.equal(s.read("demo-game", "suspend").payload.page, 4);
  const file = s.exportBackup("demo-game");
  s.erase("demo-game", "manual-0");
  assert.equal(s.read("demo-game", "manual-0"), null);
  const r = s.importBackup(file, { shouldOverwrite: (cur) => !cur });
  assert.equal(r.imported, 1); assert.equal(r.skipped, 1);
  assert.throws(() => s.importBackup({ kind: "other" }));
});

test("backend failure never throws into the game", async () => {
  const bad = new MemoryBackend(); bad.put = async () => { throw new Error("quota"); };
  const s = await SaveStore.open({ backend: bad });
  let err = 0; s.subscribe((e) => e.type === "error" && err++);
  saveSlot(s, codec, "manual-0", { page: 1 });
  await s.flush();
  assert.equal(s.status, "failed"); assert.ok(err > 0);
  assert.equal(s.read("demo-game", "manual-0").payload.page, 1);
});

test("rejects bad ids", async () => {
  const s = await SaveStore.open({ backend: new MemoryBackend() });
  assert.throws(() => s.write("Bad Id", "manual-0", { schema: 1, payload: {} }));
});
