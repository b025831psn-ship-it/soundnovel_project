import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { newCode, putCode, getCode } from "../snap.js";
import { createServer } from "../server/server.mjs";

async function setup(opts = {}) {
  let t = 1_000_000;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const server = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "code-")), now: clock.now, ...opts });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { baseUrl: `http://127.0.0.1:${server.address().port}`, clock, close: () => server.close() };
}
const backup = (n) => ({ kind: "soundnovel-backup", format: 1, saves: [{ slot: "suspend", n, big: "y".repeat(200_000) }] });

test("one 6-digit code holds every game's saves; another device loads them", async () => {
  const t = await setup();
  const code = await newCode({ baseUrl: t.baseUrl });
  assert.match(code, /^\d{6}$/);
  assert.deepEqual(await getCode({ baseUrl: t.baseUrl, code, gameId: "kamaitachi-gba" }), { ok: true, backup: null });
  assert.equal((await putCode({ baseUrl: t.baseUrl, code, gameId: "kamaitachi-gba", backup: backup(1) })).ok, true);
  assert.equal((await putCode({ baseUrl: t.baseUrl, code, gameId: "zakuro-sfc", backup: backup(7) })).ok, true);
  assert.equal((await putCode({ baseUrl: t.baseUrl, code, gameId: "kamaitachi-gba", backup: backup(2) })).ok, true);
  assert.equal((await getCode({ baseUrl: t.baseUrl, code, gameId: "kamaitachi-gba" })).backup.saves[0].n, 2);
  assert.equal((await getCode({ baseUrl: t.baseUrl, code, gameId: "zakuro-sfc" })).backup.saves[0].n, 7);
  t.close();
});

test("unknown codes cannot be written or read and are rate limited; unused codes expire after 90 days", async () => {
  const t = await setup({ maxFailsPerClient: 3 });
  const code = await newCode({ baseUrl: t.baseUrl });
  const other = code === "000000" ? "000001" : "000000";
  assert.equal((await putCode({ baseUrl: t.baseUrl, code: other, gameId: "g", backup: backup(1) })).reason, "code");
  assert.equal((await getCode({ baseUrl: t.baseUrl, code: other, gameId: "g" })).reason, "code");
  assert.equal((await getCode({ baseUrl: t.baseUrl, code: other, gameId: "g" })).reason, "code");
  assert.equal((await getCode({ baseUrl: t.baseUrl, code, gameId: "g" })).reason, "limited");
  t.close();
  const u = await setup();
  const c = await newCode({ baseUrl: u.baseUrl });
  await putCode({ baseUrl: u.baseUrl, code: c, gameId: "g", backup: backup(1) });
  u.clock.advance(89 * 864e5);
  assert.equal((await getCode({ baseUrl: u.baseUrl, code: c, gameId: "g" })).ok, true);
  u.clock.advance(89 * 864e5);
  assert.equal((await getCode({ baseUrl: u.baseUrl, code: c, gameId: "g" })).ok, true);
  u.clock.advance(91 * 864e5);
  assert.equal((await getCode({ baseUrl: u.baseUrl, code: c, gameId: "g" })).reason, "code");
  u.close();
});
