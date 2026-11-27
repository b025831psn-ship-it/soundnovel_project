// SaveStore: local-first save storage shared by every port.
// Reads are synchronous from an in-memory cache loaded at open(); writes go to the cache first,
// then to the backend (IndexedDB) and the sync outbox. A failing backend never stops the game:
// the store falls back to memory and reports it through `status`.
import { FORMAT, keyOf, checkIds, validateEnvelope } from "./envelope.js";
import { MemoryBackend, IndexedDbBackend } from "./backends.js";

function randomId() {
  const b = crypto.getRandomValues(new Uint8Array(6));
  return "dev-" + [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export class SaveStore {
  constructor(backend, deviceId, status) {
    this.backend = backend;
    this.deviceId = deviceId;
    this.status = status; // "persistent" | "memory" | "failed"
    this.saves = new Map();
    this.outbox = new Map(); // key -> { op: "put" | "delete", gameId, slot, baseRevision }
    this.backups = new Map();
    this.conflicts = new Map();
    this.listeners = new Set();
    this.chain = Promise.resolve();
    this.clock = () => new Date().toISOString();
  }

  // Opens IndexedDB when possible; otherwise (private mode, old browsers) keeps data in memory.
  static async open({ backend, name, factory } = {}) {
    let status = "persistent";
    if (!backend) {
      try { backend = await IndexedDbBackend.open(name, factory); }
      catch { backend = new MemoryBackend(); status = "memory"; }
    } else if (backend.kind === "memory") status = "memory";
    let meta = new Map();
    const store = new SaveStore(backend, null, status);
    try {
      for (const { key, value } of await backend.all("meta")) meta.set(key, value);
      for (const { key, value } of await backend.all("saves")) store.saves.set(key, value);
      for (const { key, value } of await backend.all("outbox")) store.outbox.set(key, value);
      for (const { key, value } of await backend.all("backups")) store.backups.set(key, value);
    } catch { store.status = "failed"; }
    store.deviceId = meta.get("deviceId");
    if (!store.deviceId) { store.deviceId = randomId(); store.#persist("meta", "deviceId", store.deviceId); }
    store.meta = meta;
    return store;
  }

  #persist(store, key, value) {
    this.chain = this.chain
      .then(() => (value === undefined ? this.backend.del(store, key) : this.backend.put(store, key, value)))
      .catch((error) => { this.status = "failed"; this.#emit({ type: "error", error }); });
    return this.chain;
  }

  #emit(event) { for (const fn of this.listeners) fn(event); }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  flush() { return this.chain; }

  setMeta(key, value) { this.meta.set(key, value); return this.#persist("meta", key, value); }
  getMeta(key) { return this.meta.get(key); }

  list(gameId) {
    return [...this.saves.values()].filter((e) => e.gameId === gameId);
  }

  read(gameId, slot) {
    return this.saves.get(keyOf(gameId, slot)) ?? null;
  }

  // Stores a new local version of a slot. `fields`: { schema, dataVersion, edition, label, payload, original? }.
  write(gameId, slot, fields) {
    checkIds(gameId, slot);
    const key = keyOf(gameId, slot);
    const prev = this.saves.get(key);
    const env = {
      format: FORMAT, gameId, slot,
      schema: fields.schema, dataVersion: fields.dataVersion ?? 1,
      edition: fields.edition ?? "ja",
      revision: prev?.revision ?? 0,
      savedAt: this.clock(), deviceId: this.deviceId,
      label: fields.label ?? "", payload: fields.payload,
      ...(fields.original ? { original: fields.original } : {}),
    };
    const bad = validateEnvelope(env);
    if (bad) throw new TypeError(`invalid save: ${bad}`);
    this.saves.set(key, env);
    this.#persist("saves", key, env);
    this.#queue(key, { op: "put", gameId, slot });
    return env;
  }

  erase(gameId, slot) {
    const key = keyOf(gameId, slot);
    const prev = this.saves.get(key);
    if (!prev) return;
    this.saves.delete(key);
    this.#persist("saves", key, undefined);
    this.#queue(key, { op: "delete", gameId, slot, baseRevision: prev.revision });
  }

  copy(gameId, from, to) {
    const src = this.read(gameId, from);
    if (!src) return null;
    return this.write(gameId, to, { ...src });
  }

  #queue(key, entry) {
    const old = this.outbox.get(key);
    // Keep the oldest known server revision so the next push can detect a divergence.
    const baseRevision = old?.baseRevision ?? entry.baseRevision ?? this.saves.get(key)?.revision ?? 0;
    const next = { ...entry, baseRevision };
    this.outbox.set(key, next);
    this.#persist("outbox", key, next);
    this.#emit({ type: "dirty", gameId: entry.gameId, slot: entry.slot });
  }

  // --- sync hooks (used by SyncClient) -------------------------------------------------------

  pending() { return [...this.outbox.entries()].map(([key, entry]) => ({ key, ...entry })); }

  markSynced(key, revision, { deleted = false } = {}) {
    this.outbox.delete(key);
    this.#persist("outbox", key, undefined);
    const env = this.saves.get(key);
    if (env && !deleted) { env.revision = revision; this.#persist("saves", key, env); }
  }

  // Installs a version received from the server (no outbox entry).
  applyRemote(env) {
    const bad = validateEnvelope(env);
    if (bad) return false;
    const key = keyOf(env.gameId, env.slot);
    this.saves.set(key, env);
    this.#persist("saves", key, env);
    this.#emit({ type: "remote", gameId: env.gameId, slot: env.slot });
    return true;
  }

  dropLocal(key) {
    this.saves.delete(key);
    this.#persist("saves", key, undefined);
    this.outbox.delete(key);
    this.#persist("outbox", key, undefined);
  }

  setConflict(key, remote) { this.conflicts.set(key, remote); this.#emit({ type: "conflict", key }); }

  // Resolves a conflict. "local" keeps this device's version and pushes it over the server's;
  // "remote" takes the server's version. The losing side is kept as the slot's single backup.
  resolveConflict(key, choice) {
    const remote = this.conflicts.get(key);
    const local = this.saves.get(key);
    if (!remote) return;
    this.conflicts.delete(key);
    if (choice === "local") {
      this.backups.set(key, remote); this.#persist("backups", key, remote);
      if (local) {
        local.revision = remote.revision; this.#persist("saves", key, local);
        this.outbox.set(key, { op: "put", gameId: local.gameId, slot: local.slot, baseRevision: remote.revision });
        this.#persist("outbox", key, this.outbox.get(key));
      }
    } else {
      if (local) { this.backups.set(key, local); this.#persist("backups", key, local); }
      this.outbox.delete(key); this.#persist("outbox", key, undefined);
      this.applyRemote(remote);
    }
  }

  // --- backup files --------------------------------------------------------------------------

  exportBackup(gameId) {
    const saves = [...this.saves.values()].filter((e) => !gameId || e.gameId === gameId);
    return { kind: "soundnovel-backup", format: FORMAT, exportedAt: this.clock(), saves: structuredClone(saves) };
  }

  // Imports a backup object; `shouldOverwrite(existing, incoming)` decides per slot (default: newer wins).
  importBackup(file, { shouldOverwrite = (cur, inc) => !cur || inc.savedAt > cur.savedAt } = {}) {
    if (file?.kind !== "soundnovel-backup" || file.format !== FORMAT || !Array.isArray(file.saves)) {
      throw new TypeError("not a soundnovel backup");
    }
    const result = { imported: 0, skipped: 0, invalid: 0 };
    for (const env of file.saves) {
      if (validateEnvelope(env)) { result.invalid++; continue; }
      const key = keyOf(env.gameId, env.slot);
      const cur = this.saves.get(key);
      if (!shouldOverwrite(cur, env)) { result.skipped++; continue; }
      const next = { ...env, revision: cur?.revision ?? 0 };
      this.saves.set(key, next);
      this.#persist("saves", key, next);
      this.#queue(key, { op: "put", gameId: env.gameId, slot: env.slot });
      result.imported++;
    }
    return result;
  }

  // One-time import of an older localStorage layout. `entries`: [{ slot, fields }]. Existing slots are kept.
  importLegacy(gameId, entries) {
    let n = 0;
    for (const { slot, fields } of entries) {
      if (this.read(gameId, slot)) continue;
      this.write(gameId, slot, fields); n++;
    }
    return n;
  }
}
