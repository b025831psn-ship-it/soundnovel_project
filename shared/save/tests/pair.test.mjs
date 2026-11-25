import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { newSecret, startPairing, claimPairing, deriveKeys, newPairCode } from "../sync.js";
import { createServer } from "../server/server.mjs";

async function setup(opts = {}) {
  let t = 1_000_000;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const server = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "pair-")), now: clock.now, ...opts });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { baseUrl: `http://127.0.0.1:${server.address().port}`, clock, close: () => server.close() };
}

test("codes are 4 characters from the unambiguous alphabet", () => {
  for (let i = 0; i < 200; i++) assert.match(newPairCode(), /^[0-9A-HJKMNP-TV-Z]{4}$/);
});

test("PC creates a code, phone claims it and gets the same vault", async () => {
  const t = await setup();
  const secret = newSecret();
  const { code, expiresInSec } = await startPairing(secret, { baseUrl: t.baseUrl });
  assert.equal(expiresInSec, 300);
  const got = await claimPairing(code.toLowerCase(), { baseUrl: t.baseUrl });
  assert.equal(got.ok, true);
  assert.equal((await deriveKeys(got.secret)).vaultId, (await deriveKeys(secret)).vaultId);
  t.close();
});

test("a code works once and expires", async () => {
  const t = await setup();
  const { code } = await startPairing(newSecret(), { baseUrl: t.baseUrl });
  assert.equal((await claimPairing(code, { baseUrl: t.baseUrl })).ok, true);
  assert.equal((await claimPairing(code, { baseUrl: t.baseUrl })).reason, "wrong");
  const second = await startPairing(newSecret(), { baseUrl: t.baseUrl });
  t.clock.advance(5 * 60 * 1000 + 1);
  assert.equal((await claimPairing(second.code, { baseUrl: t.baseUrl })).reason, "wrong");
  t.close();
});

test("guessing is rate limited, and the limit lifts after the window", async () => {
  const t = await setup({ maxFailsPerClient: 5 });
  const { code } = await startPairing(newSecret(), { baseUrl: t.baseUrl });
  for (let i = 0; i < 5; i++) assert.equal((await claimPairing("0000", { baseUrl: t.baseUrl })).reason, "wrong");
  assert.equal((await claimPairing(code, { baseUrl: t.baseUrl })).reason, "limited"); // even the right code is refused now
  t.clock.advance(10 * 60 * 1000 + 1);
  assert.equal((await claimPairing(code, { baseUrl: t.baseUrl })).reason, "wrong"); // it has expired by then
  t.close();
});

test("a wrong-key blob never yields a secret", async () => {
  const t = await setup();
  const { code } = await startPairing(newSecret(), { baseUrl: t.baseUrl });
  const other = code === "ZZZZ" ? "0000" : "ZZZZ";
  // someone who put a blob under another code cannot open this code's blob
  const r = await fetch(`${t.baseUrl}/v1/pair/${other}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ blob: (await (await fetch(`${t.baseUrl}/v1/pair/${code}/claim`, { method: "POST" })).json()).blob }) });
  assert.equal(r.status, 201);
  assert.equal((await claimPairing(other, { baseUrl: t.baseUrl })).reason, "error");
  t.close();
});
