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
// The vault must exist before its owner can register a code (the sync client creates it on first sync).
const owner = async (secret, baseUrl) => {
  const k = await deriveKeys(secret);
  await fetch(`${baseUrl}/v1/vaults/${k.vaultId}`, { method: "PUT", headers: { authorization: `Bearer ${k.authToken}` } });
  return { authToken: k.authToken, vaultId: k.vaultId };
};

test("codes are 4 characters from the unambiguous alphabet", () => {
  for (let i = 0; i < 200; i++) assert.match(newPairCode(), /^[0-9A-HJKMNP-TV-Z]{4}$/);
});

test("the code keeps working days later, from any device, and survives a server restart", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pair-"));
  let t = await setup({}, dir);
  const secret = newSecret();
  const { code, expiresInSec } = await startPairing(secret, { baseUrl: t.baseUrl, ...(await owner(secret, t.baseUrl)) });
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
  const secret = newSecret(), o = await owner(secret, t.baseUrl);
  const a = await startPairing(secret, { baseUrl: t.baseUrl, ...o });
  const stranger = await owner(newSecret(), t.baseUrl);
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
  const { code } = await startPairing(secret, { baseUrl: t.baseUrl, ...(await owner(secret, t.baseUrl)) });
  for (let i = 0; i < 5; i++) assert.equal((await claimPairing("0000", { baseUrl: t.baseUrl })).reason, "wrong");
  assert.equal((await claimPairing(code, { baseUrl: t.baseUrl })).reason, "limited");
  t.clock.advance(10 * 60 * 1000 + 1);
  assert.equal((await claimPairing(code, { baseUrl: t.baseUrl })).ok, true);
  t.close();
});

test("strict mode: single use and expiry can be switched on", async () => {
  const t = await setup({ pairTtlMs: 5 * 60 * 1000, pairSingleUse: true });
  const secret = newSecret(), o = await owner(secret, t.baseUrl);
  const first = await startPairing(secret, { baseUrl: t.baseUrl, ...o });
  assert.equal(first.expiresInSec, 300);
  assert.equal((await claimPairing(first.code, { baseUrl: t.baseUrl })).ok, true);
  assert.equal((await claimPairing(first.code, { baseUrl: t.baseUrl })).reason, "wrong");
  const second = await startPairing(secret, { baseUrl: t.baseUrl, ...o });
  t.clock.advance(5 * 60 * 1000 + 1);
  assert.equal((await claimPairing(second.code, { baseUrl: t.baseUrl })).reason, "wrong");
  t.close();
});

test("only a vault owner can register a code, and blobs stay small", async () => {
  const t = await setup();
  const put = (headers, blob = { iv: "x", ct: "y" }) => fetch(`${t.baseUrl}/v1/pair/ABCD`, { method: "PUT", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify({ blob }) });
  assert.equal((await put({})).status, 401);
  const stranger = await deriveKeys(newSecret()); // no vault on the server
  assert.equal((await put({ authorization: `Bearer ${stranger.authToken}`, "x-vault-id": stranger.vaultId })).status, 401);
  const o = await owner(newSecret(), t.baseUrl);
  assert.equal((await put({ authorization: `Bearer ${o.authToken}`, "x-vault-id": o.vaultId }, { iv: "x", ct: "y".repeat(5000) })).status, 400);
  assert.equal((await put({ authorization: `Bearer ${o.authToken}`, "x-vault-id": o.vaultId })).status, 201);
  t.close();
});

test("a vault has a size and slot limit, and a client a request rate limit", async () => {
  const t = await setup({ maxVaultBytes: 3000, maxSlots: 2, maxRequestsPerMinute: 12 });
  const k = await deriveKeys(newSecret());
  const h = { authorization: `Bearer ${k.authToken}`, "content-type": "application/json", "if-match": "0" };
  await fetch(`${t.baseUrl}/v1/vaults/${k.vaultId}`, { method: "PUT", headers: h });
  const env = (slot, n) => JSON.stringify({ format: 1, gameId: "g", slot, schema: 1, dataVersion: 1, revision: 0, savedAt: "2026-01-01T00:00:00Z", payload: "x".repeat(n) });
  const put = (slot, n, match = "0") => fetch(`${t.baseUrl}/v1/vaults/${k.vaultId}/saves/g/${slot}`, { method: "PUT", headers: { ...h, "if-match": match }, body: env(slot, n) });
  assert.equal((await put("s1", 100)).status, 200);
  assert.equal((await put("s2", 100)).status, 200);
  assert.equal((await put("s3", 100)).status, 413); // third slot
  assert.equal((await put("s1", 5000, "1")).status, 413); // too big for the vault
  let limited = 0;
  for (let i = 0; i < 20; i++) if ((await fetch(`${t.baseUrl}/v1/vaults/${k.vaultId}/saves`, { headers: h })).status === 429) limited++;
  assert.ok(limited > 0);
  t.clock.advance(61_000);
  assert.equal((await fetch(`${t.baseUrl}/v1/vaults/${k.vaultId}/saves`, { headers: h })).status, 200);
  t.close();
});

test("vault creation is capped per client and in total", async () => {
  const t = await setup({ maxVaultsPerClientPerHour: 2 });
  const make = async () => { const k = await deriveKeys(newSecret()); return (await fetch(`${t.baseUrl}/v1/vaults/${k.vaultId}`, { method: "PUT", headers: { authorization: `Bearer ${k.authToken}` } })).status; };
  assert.equal(await make(), 201); assert.equal(await make(), 201);
  assert.equal(await make(), 429);
  t.clock.advance(3600_000 + 1);
  assert.equal(await make(), 201);
  t.close();
  const full = await setup({ maxVaults: 1 });
  assert.equal(await (async () => { const k = await deriveKeys(newSecret()); return (await fetch(`${full.baseUrl}/v1/vaults/${k.vaultId}`, { method: "PUT", headers: { authorization: `Bearer ${k.authToken}` } })).status; })(), 201);
  assert.equal(await (async () => { const k = await deriveKeys(newSecret()); return (await fetch(`${full.baseUrl}/v1/vaults/${k.vaultId}`, { method: "PUT", headers: { authorization: `Bearer ${k.authToken}` } })).status; })(), 429);
  full.close();
});
