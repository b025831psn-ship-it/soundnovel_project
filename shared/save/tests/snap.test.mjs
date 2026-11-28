import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { saveSnap, loadSnap } from "../snap.js";
import { createServer } from "../server/server.mjs";

async function setup(opts = {}) {
  let t = 1_000_000;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const server = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "snap-")), now: clock.now, ...opts });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { baseUrl: `http://127.0.0.1:${server.address().port}`, clock, close: () => server.close() };
}
const backup = (n) => ({ kind: "soundnovel-backup", format: 1, saves: [{ slot: "suspend", n, big: "x".repeat(300_000) }] });

test("a save gets a 4-digit code that loads the same data elsewhere; saving again keeps the code", async () => {
  const t = await setup();
  const first = await saveSnap({ baseUrl: t.baseUrl, gameId: "kamaitachi-gba", backup: backup(1) });
  assert.match(first.code, /^\d{4}$/);
  const again = await saveSnap({ baseUrl: t.baseUrl, gameId: "kamaitachi-gba", backup: backup(2), last: first });
  assert.equal(again.code, first.code);
  const got = await loadSnap({ baseUrl: t.baseUrl, gameId: "kamaitachi-gba", code: first.code });
  assert.equal(got.ok, true); assert.equal(got.backup.saves[0].n, 2);
  // another game has its own codes; a wrong token makes a new code instead of overwriting
  assert.equal((await loadSnap({ baseUrl: t.baseUrl, gameId: "zakuro-sfc", code: first.code })).ok, false);
  const other = await saveSnap({ baseUrl: t.baseUrl, gameId: "kamaitachi-gba", backup: backup(3), last: { code: first.code, token: "nope" } });
  assert.notEqual(other.code, first.code);
  assert.equal((await loadSnap({ baseUrl: t.baseUrl, gameId: "kamaitachi-gba", code: first.code })).backup.saves[0].n, 2);
  t.close();
});

test("unused codes expire after 90 days; loading counts as use; wrong codes are rate limited", async () => {
  const t = await setup({ maxFailsPerClient: 3 });
  const a = await saveSnap({ baseUrl: t.baseUrl, gameId: "g", backup: backup(1) });
  const b = await saveSnap({ baseUrl: t.baseUrl, gameId: "g", backup: backup(1) });
  t.clock.advance(80 * 864e5);
  assert.equal((await loadSnap({ baseUrl: t.baseUrl, gameId: "g", code: a.code })).ok, true);
  t.clock.advance(20 * 864e5);
  assert.equal((await loadSnap({ baseUrl: t.baseUrl, gameId: "g", code: a.code })).ok, true);
  const free = [...Array(10000).keys()].map((i) => String(i).padStart(4, "0")).find((c) => c !== a.code);
  for (let i = 0; i < 3; i++) assert.equal((await loadSnap({ baseUrl: t.baseUrl, gameId: "g", code: free === b.code ? "9999" : free })).reason, "code");
  assert.equal((await loadSnap({ baseUrl: t.baseUrl, gameId: "g", code: b.code })).reason, "limited");
  t.close();
});
