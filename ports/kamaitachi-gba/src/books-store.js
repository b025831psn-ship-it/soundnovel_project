// Bookmarks (しおり) and the web-only suspend slot on top of the shared SaveStore.
// Drop-in for the Books class in save.js: the same synchronous read/write/erase/copy/any,
// so boot.js changes only where the object is created (it must be opened asynchronously first).
//
//   const books = await openBooks({ edition: "ko" });   // before the game starts
//   books.suspend.write(pageState(...))                 // web-only slot, hidden from the bookshelf
import { SaveStore } from "../../../shared/save/store.js";

export const GAME_ID = "kamaitachi-gba";
export const SCHEMA = 1;
const BOOK_IDS = ["manual-0", "manual-1", "manual-2"];
const LEGACY_KEY = (book) => `kamaitachi-gba.book.${book}`;

// The codec for this port (docs/save/README.md). The payload is the page-start state save.js builds.
export const codec = {
  gameId: GAME_ID,
  currentSchema: SCHEMA,
  dataVersion: 1,
  slots: () => [
    ...BOOK_IDS.map((id, i) => ({ id, group: "manual", ordinal: i, canCopy: true, canErase: true, canWrite: true, showInOriginalUi: true })),
    { id: "suspend", group: "suspend", canCopy: false, canErase: true, canWrite: true, showInOriginalUi: false },
  ],
  encode: (snapshot) => snapshot,
  validate: (p) => (p && typeof p === "object" && Number.isInteger(p.bank) && Number.isInteger(p.offset) ? { ok: true } : { ok: false, reason: "corrupt" }),
  migrate: () => ({ ok: false, reason: "unsupportedSchema" }),
  decode: (p) => ({ ok: true, state: p }),
  summarize: (p) => ({ title: typeof p?.title === "string" ? p.title : "" }),
};

export class StoreBooks {
  constructor(store, edition = "ja") {
    this.store = store;
    this.edition = edition;
    this.suspend = {
      read: () => this.store.read(GAME_ID, "suspend")?.payload ?? null,
      write: (data) => this.#write("suspend", data),
      erase: () => this.store.erase(GAME_ID, "suspend"),
    };
  }

  #write(slot, data) {
    try {
      this.store.write(GAME_ID, slot, { schema: SCHEMA, dataVersion: codec.dataVersion, edition: this.edition, label: typeof data?.title === "string" ? data.title : "", payload: data });
      return true;
    } catch { return false; }
  }

  read(book) { return this.store.read(GAME_ID, BOOK_IDS[book])?.payload ?? null; }
  write(book, data) { return this.#write(BOOK_IDS[book], data); }
  erase(book) { this.store.erase(GAME_ID, BOOK_IDS[book]); }
  copy(from, to) { const data = this.read(from); if (data) this.write(to, data); }
  // 0800B79C: any book in use.
  any() { return BOOK_IDS.some((_, book) => this.read(book)); }
}

// Moves books written by the old localStorage-only Books into the store (once; existing slots win).
export function importLegacyBooks(store, storage = globalThis.localStorage, edition = "ja") {
  const entries = [];
  for (let book = 0; book < BOOK_IDS.length; book++) {
    try {
      const text = storage?.getItem(LEGACY_KEY(book));
      if (text) entries.push({ slot: BOOK_IDS[book], fields: { schema: SCHEMA, dataVersion: codec.dataVersion, edition, label: "", payload: JSON.parse(text) } });
    } catch { /* unreadable legacy book: leave it where it is */ }
  }
  return store.importLegacy(GAME_ID, entries);
}

export async function openBooks({ edition = "ja", storage = globalThis.localStorage, ...options } = {}) {
  const store = await SaveStore.open(options);
  importLegacyBooks(store, storage, edition);
  return new StoreBooks(store, edition);
}
