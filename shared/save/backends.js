// Key-value backends for SaveStore. Stores: "saves", "outbox", "backups", "meta".
export const STORES = ["saves", "outbox", "backups", "meta"];

export class MemoryBackend {
  constructor() { this.data = Object.fromEntries(STORES.map((s) => [s, new Map()])); this.kind = "memory"; }
  async all(store) { return [...this.data[store].entries()].map(([key, value]) => ({ key, value: structuredClone(value) })); }
  async put(store, key, value) { this.data[store].set(key, structuredClone(value)); }
  async del(store, key) { this.data[store].delete(key); }
}

export class IndexedDbBackend {
  constructor(db) { this.db = db; this.kind = "indexeddb"; }

  static async open(name = "soundnovel", factory = globalThis.indexedDB) {
    if (!factory) throw new Error("indexedDB unavailable");
    const db = await new Promise((resolve, reject) => {
      const req = factory.open(name, 1);
      req.onupgradeneeded = () => { for (const s of STORES) req.result.createObjectStore(s); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("indexedDB blocked"));
    });
    return new IndexedDbBackend(db);
  }

  #run(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, mode);
      let out;
      tx.oncomplete = () => resolve(out);
      tx.onerror = tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"));
      out = fn(tx.objectStore(store));
    });
  }

  all(store) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, "readonly");
      const os = tx.objectStore(store);
      const k = os.getAllKeys();
      const v = os.getAll();
      tx.oncomplete = () => resolve(k.result.map((key, i) => ({ key, value: v.result[i] })));
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
  }
  put(store, key, value) { return this.#run(store, "readwrite", (os) => { os.put(value, key); }); }
  del(store, key) { return this.#run(store, "readwrite", (os) => { os.delete(key); }); }
}
