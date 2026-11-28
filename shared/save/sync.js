// Sync code, key derivation, payload encryption and the sync client. See docs/save/README.md.
import { keyOf } from "./envelope.js";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32
const enc = new TextEncoder();
const dec = new TextDecoder();

export function newSecret() { return crypto.getRandomValues(new Uint8Array(16)); }

// 16 bytes -> 26 characters, shown as groups of 4.
export function encodeCode(secret) {
  let bits = "";
  for (const b of secret) bits += b.toString(2).padStart(8, "0");
  bits = bits.padEnd(130, "0");
  let out = "";
  for (let i = 0; i < 130; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  return out.match(/.{1,4}/g).join("-");
}

export function decodeCode(text) {
  const s = String(text).toUpperCase().replace(/[\s-]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0");
  if (s.length !== 26) return null;
  let bits = "";
  for (const ch of s) {
    const v = ALPHABET.indexOf(ch);
    if (v < 0) return null;
    bits += v.toString(2).padStart(5, "0");
  }
  if (/1/.test(bits.slice(128))) return null;
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return out;
}

// Chunked: a spread of a few hundred KB overflows the call stack (SFC suspend states).
const binary = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return s; };
const b64 = (u8) => btoa(binary(u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const hex = (u8) => [...u8].map((x) => x.toString(16).padStart(2, "0")).join("");

// HKDF-SHA256 with distinct info strings: vault id, auth token, payload key.
export async function deriveKeys(secret) {
  const base = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveBits", "deriveKey"]);
  const salt = enc.encode("soundnovel-save-v1");
  const bits = async (info) => new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode(info) }, base, 256));
  const encKey = await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode("enc") }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  return { vaultId: hex(await bits("id")), authToken: b64(await bits("auth")), encKey };
}

const aad = (e) => enc.encode(`${e.gameId}/${e.slot}`);

export async function sealEnvelope(env, encKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad(env) }, encKey, enc.encode(JSON.stringify(env.payload))));
  return { ...env, payload: { $enc: 1, iv: b64(iv), ct: b64(ct) } };
}

export async function openEnvelope(env, encKey) {
  const p = env.payload;
  if (!p || p.$enc !== 1) return env;
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p.iv), additionalData: aad(env) }, encKey, unb64(p.ct));
  return { ...env, payload: JSON.parse(dec.decode(pt)) };
}

export class SyncClient {
  constructor({ store, baseUrl, keys, fetchImpl = globalThis.fetch.bind(globalThis) }) {
    Object.assign(this, { store, baseUrl: baseUrl.replace(/\/$/, ""), keys, fetchImpl });
  }

  #url(path = "") { return `${this.baseUrl}/v1/vaults/${this.keys.vaultId}${path}`; }
  #req(method, path, { body, headers } = {}) {
    return this.fetchImpl(this.#url(path), {
      method,
      headers: { authorization: `Bearer ${this.keys.authToken}`, ...(body ? { "content-type": "application/json" } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // Creates the vault on first use; 409 means it already exists (fine).
  async ensureVault() {
    const r = await this.#req("PUT", "");
    if (r.status === 401) throw new Error("sync code rejected");
    if (!r.ok && r.status !== 409) throw new Error(`vault create failed: ${r.status}`);
  }

  // Pushes pending changes, then pulls newer remote versions. Returns a summary; never throws on conflicts.
  async sync() {
    const out = { pushed: 0, pulled: 0, conflicts: [], errors: [] };
    await this.ensureVault();
    for (const item of this.store.pending()) {
      try {
        const path = `/saves/${item.gameId}/${item.slot}`;
        if (item.op === "delete") {
          const r = await this.#req("DELETE", path, { headers: { "if-match": String(item.baseRevision) } });
          if (r.ok || r.status === 404) { this.store.markSynced(item.key, 0, { deleted: true }); out.pushed++; }
          else if (r.status === 409) { out.conflicts.push(item.key); }
          else out.errors.push(`${item.key}: ${r.status}`);
          continue;
        }
        const env = this.store.saves.get(item.key);
        if (!env) { this.store.markSynced(item.key, 0, { deleted: true }); continue; }
        const sealed = await sealEnvelope(env, this.keys.encKey);
        let r = await this.#req("PUT", path, { body: sealed, headers: { "if-match": String(item.baseRevision) } });
        if (r.status === 409) {
          const body = await r.json();
          if (!body.current) {
            // The slot was deleted on the server: this device's version is a fresh write on top of the tombstone.
            r = await this.#req("PUT", path, { body: sealed, headers: { "if-match": String(body.revision) } });
          } else {
            const remote = await openEnvelope(body.current, this.keys.encKey);
            this.store.setConflict(item.key, remote); out.conflicts.push(item.key);
            continue;
          }
        }
        if (r.ok) { const { revision } = await r.json(); this.store.markSynced(item.key, revision); out.pushed++; }
        else out.errors.push(`${item.key}: ${r.status}`);
      } catch (e) { out.errors.push(`${item.key}: ${e.message}`); }
    }
    const listing = await (await this.#req("GET", "/saves")).json();
    for (const meta of listing.saves) {
      const key = keyOf(meta.gameId, meta.slot);
      if (this.store.outbox.has(key) || this.store.conflicts.has(key)) continue;
      const local = this.store.saves.get(key);
      if (local && local.revision >= meta.revision) continue;
      if (meta.deleted) { if (local) { this.store.dropLocal(key); out.pulled++; } continue; }
      const r = await this.#req("GET", `/saves/${meta.gameId}/${meta.slot}`);
      if (!r.ok) { out.errors.push(`${key}: ${r.status}`); continue; }
      const env = await openEnvelope(await r.json(), this.keys.encKey);
      if (this.store.applyRemote(env)) out.pulled++;
    }
    return out;
  }
}

// --- pairing with a short one-time code ---------------------------------------------------------
// The 4-character code only moves the long secret between two devices within minutes. It is not
// the account password, so it can be short; the server limits failed claims.
export function newPairCode() {
  const b = crypto.getRandomValues(new Uint8Array(4));
  return [...b].map((x) => ALPHABET[x % 32]).join("");
}

async function pairKey(code, usage) {
  const base = await crypto.subtle.importKey("raw", enc.encode(code.toUpperCase()), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", iterations: 200000, salt: enc.encode("soundnovel-pair-v1") }, base, { name: "AES-GCM", length: 256 }, false, [usage]);
}

// `authToken` ties the code to the vault so only its owner can revoke it ("make a new code").
export async function startPairing(secret, { baseUrl, authToken, vaultId, fetchImpl = globalThis.fetch.bind(globalThis), attempts = 5 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const code = newPairCode();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await pairKey(code, "encrypt"), secret));
    const r = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/v1/pair/${code}`, {
      method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${authToken}`, "x-vault-id": vaultId }, body: JSON.stringify({ blob: { iv: b64(iv), ct: b64(ct) } }),
    });
    if (r.status === 409) continue; // code already in use: pick another
    if (!r.ok) throw new Error(`pairing failed: ${r.status}`);
    return { code, expiresInSec: (await r.json()).expiresInSec ?? null };
  }
  throw new Error("no free pairing code");
}

// Returns the secret, or a reason: "wrong" (unknown, expired or already used), "limited", "error".
export async function claimPairing(code, { baseUrl, fetchImpl = globalThis.fetch.bind(globalThis) } = {}) {
  const clean = String(code).toUpperCase().replace(/[\s-]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0");
  const r = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/v1/pair/${clean}/claim`, { method: "POST" });
  if (r.status === 429) return { ok: false, reason: "limited" };
  if (r.status === 404 || r.status === 400) return { ok: false, reason: "wrong" };
  if (!r.ok) return { ok: false, reason: "error" };
  const { blob } = await r.json();
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(blob.iv) }, await pairKey(clean, "decrypt"), unb64(blob.ct));
    return { ok: true, secret: new Uint8Array(pt) };
  } catch { return { ok: false, reason: "error" }; }
}

export async function revokePairing(code, { baseUrl, authToken, fetchImpl = globalThis.fetch.bind(globalThis) }) {
  const r = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/v1/pair/${code.toUpperCase()}`, { method: "DELETE", headers: { authorization: `Bearer ${authToken}` } });
  return r.status === 204;
}

// Gives this vault a new code and retires the old one (lost or leaked code).
export async function renewPairing(secret, oldCode, opts) {
  const fresh = await startPairing(secret, opts);
  if (oldCode) await revokePairing(oldCode, opts);
  return fresh;
}
