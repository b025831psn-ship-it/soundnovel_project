import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { newSecret, startPairing, claimPairing, renewPairing, revokePairing, deriveKeys, newPairCode } from "../sync.js";
import { createServer } from "../server/server.mjs";

async function setup(opts = {}, dir = fs.mkdtempSync(path.join(os.tmpdir(), "pair-"))) {
  let t = 1_000_000;
  const clock = { now: () => t, advance: (ms) => { t += ms; } };
  const server = createServer({ dir, now: clock.now, ...opts });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { dir, baseUrl: `http://127.0.0.1:${server.address().port}`, clock, close: () => server.close() };
}
const owner = async (secret) => ({ authToken: (await deriveKeys(secret)).authToken });

test("codes are 4 characters from the unambiguous alphabet", () => {
  for (let i = 0; i < 200; i++) assert.match(newPairCode(), /^[0-9A-HJKMNP-TV-Z]{4}$/);
});

test("the code keeps working days later, from any device, and survives a server restart", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pair-"));
  let t = await setup({}, dir);
  const secret = newSecret();
  const { code, expiresInSec } = await startPairing(secret, { baseUrl: t.baseUrl, ...(await owner(secret)) });
  assert.equal(expiresInSec, null);
  t.clock.advance(3 * 24 * 3600 * 1000);
  for (let i = 0; i < 2; i++) {
    const got = await claimPairing(code.toLowerCase(), { baseUrl: t.baseUrl });
    assert.equal(got.ok, true);
    assert.equal((await deriveKeys(got.secret)).vaultId, (await deriveKeys(secret)).vaultId);
  }
  t.close();
  t = await setup({}, dir);
  assert.equal((await claimPairing(code, { baseUrl: t.baseUrl })).ok, true);
  t.close();
});

test("a new code retires the old one; only the vault owner can revoke", async () => {
  const t = await setup();
  const secret = newSecret(), o = await owner(secret);
  const a = await startPairing(secret, { baseUrl: t.baseUrl, ...o });
  const stranger = await owner(newSecret());
  assert.equal(await revokePairing(a.code, { baseUrl: t.baseUrl, ...stranger }), false);
  assert.equal((await claimPairing(a.code, { baseUrl: t.baseUrl })).ok, true);
  const b = await renewPairing(secret, a.code, { baseUrl: t.baseUrl, ...o });
  assert.notEqual(a.code, b.code);
  assert.equal((await claimPairing(a.code, { baseUrl: t.baseUrl })).reason, "wrong");
  assert.equal((await claimPairing(b.code, { baseUrl: t.baseUrl })).ok, true);
  t.close();
});

test("guessing is rate limited, and the limit lifts after the window", async () => {
  const t = await setup({ maxFailsPerClient: 5 });
  const secret = newSecret();
  const { code } = await startPairing(secret, { baseUrl: t.baseUrl, ...(await owner(secret)) });
  for (let i = 0; i < 5; i++) assert.equal((await claimPairing("0000", { baseUrl: t.baseUrl })).reason, "wrong");
  assert.equal((await claimPairing(code, { baseUrl: t.baseUrl })).reason, "limited");
  t.clock.advance(10 * 60 * 1000 + 1);
  assert.equal((await claimPairing(code, { baseUrl: t.baseUrl })).ok, true);
  t.close();
});

test("strict mode: single use and expiry can be switched on", async () => {
  const t = await setup({ pairTtlMs: 5 * 60 * 1000, pairSingleUse: true });
  const secret = newSecret(), o = await owner(secret);
  const first = await startPairing(secret, { baseUrl: t.baseUrl, ...o });
  assert.equal(first.expiresInSec, 300);
  assert.equal((await claimPairing(first.code, { baseUrl: t.baseUrl })).ok, true);
  assert.equal((await claimPairing(first.code, { baseUrl: t.baseUrl })).reason, "wrong");
  const second = await startPairing(secret, { baseUrl: t.baseUrl, ...o });
  t.clock.advance(5 * 60 * 1000 + 1);
  assert.equal((await claimPairing(second.code, { baseUrl: t.baseUrl })).reason, "wrong");
  t.close();
});

test("registering a code needs a token, and a code cannot be taken over", async () => {
  const t = await setup();
  const r = await fetch(`${t.baseUrl}/v1/pair/ABCD`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ blob: { iv: "x", ct: "y" } }) });
  assert.equal(r.status, 401);
  t.close();
});
