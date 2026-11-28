// The memory card's books in the shared save store (shared/save, docs/save/README.md), so a book
// written on one device is there on another. The game keeps each book as one file of the card
// (BISLPS-01794KAMAITA0..2, one block); a file is a slot (manual-0..2) and travels whole, as the
// game wrote it. The card image in the browser stays what the game reads and writes: after the
// game writes, push() brings the store up to the card; when the store changes (another device, a
// conflict settled, a backup read), pull() brings the card up to the store.
// The web-only slot "suspend" holds the page the player is on (machine-browser.js).
import { SaveStore } from "../../../shared/save/store.js";

export const GAME_ID = "kamaitachi-ps1", SCHEMA = 1;
const SLOTS = ["manual-0", "manual-1", "manual-2"], BLOCK = 0x2000, FLAG = "kamaitachi-ps1.card", UNSAVED = "kamaitachi-ps1.card.unsaved";
export const fileName = (n) => `BISLPS-01794KAMAITA${n}`;

const toBase64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const fromBase64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const good = (p) => !!p && typeof p === "object" && typeof p.data === "string" && /^BISLPS-01794KAMAITA[0-2]$/.test(p.name ?? "") && p.data.length > 0 && p.data.length <= 15 * BLOCK * 4 / 3 + 4;

export const codec = {
  gameId: GAME_ID, currentSchema: SCHEMA, dataVersion: 1,
  slots: () => [
    ...SLOTS.map((id, i) => ({ id, group: "manual", ordinal: i, canCopy: true, canErase: true, canWrite: true, showInOriginalUi: true, original: { containerId: "card-1", fileId: fileName(i), blocks: 1 } })),
    { id: "suspend", group: "suspend", canCopy: false, canErase: true, canWrite: true, showInOriginalUi: false },
  ],
  encode: (snapshot) => snapshot,
  validate: (p) => (good(p) || (p && typeof p.state === "string") ? { ok: true } : { ok: false, reason: "corrupt" }),
  migrate: () => ({ ok: false, reason: "unsupportedSchema" }),
  decode: (p) => ({ ok: true, state: p }),
  summarize: (p) => ({ title: typeof p?.title === "string" ? p.title : "" }),
};

// The file of book n as the card holds it (its blocks in order), or null.
export function bookFile(card, n) { const c = card.chain(fileName(n)); return c ? card.read(fileName(n), 0, c.length * BLOCK) : null; }
function putBook(card, n, data) {
  const name = fileName(n), blocks = Math.ceil(data.length / BLOCK), c = card.chain(name);
  if (c && c.length !== blocks) card.erase(name);
  if (!card.chain(name) && card.create(name, blocks) !== 0) return false; // an unformatted or full card
  return card.write(name, 0, data);
}

export class CardSaves {
  // storage: where the card image itself is kept (localStorage). The store writes to IndexedDB a moment
  // later than the card is stored, so a tab closed right after a save leaves the store behind the card.
  // The slots pushed and not yet written down are noted there at once; at the next start the card
  // counts for them, the store for the rest.
  constructor(store, card, edition = "ko", storage = globalThis.localStorage) { this.store = store; this.card = card; this.edition = edition; this.storage = storage; this.turn = 0; }
  #unsaved() { try { return JSON.parse(this.storage?.getItem(UNSAVED) ?? "[]"); } catch { return []; } }
  #note(slots) {
    try { this.storage?.setItem(UNSAVED, JSON.stringify([...new Set([...this.#unsaved(), ...slots])])); } catch { return; }
    const turn = ++this.turn;
    this.store.flush().then(() => { if (turn === this.turn && this.store.status === "persistent") try { this.storage?.removeItem(UNSAVED); } catch {} });
  }
  #env(n) { const e = this.store.read(GAME_ID, SLOTS[n]); return e && e.schema === SCHEMA && good(e.payload) ? e : null; }
  #write(n, file) {
    try {
      this.store.write(GAME_ID, SLOTS[n], { schema: SCHEMA, dataVersion: codec.dataVersion, edition: this.edition, label: `책 ${n + 1}`,
        payload: { name: fileName(n), data: toBase64(file) }, original: { containerId: "card-1", fileId: fileName(n), blocks: file.length / BLOCK } });
      return true;
    } catch { return false; }
  }
  // The card was written by the game: the books that changed go to the store. Returns how many.
  push(only = null) { // only: just these slots
    const done = [];
    SLOTS.forEach((slot, i) => {
      if (only && !only.includes(slot)) return;
      const file = bookFile(this.card, i), env = this.#env(i);
      if (file) { if (env?.payload.data !== toBase64(file) && this.#write(i, file)) done.push(slot); }
      else if (this.store.read(GAME_ID, slot)) { this.store.erase(GAME_ID, slot); done.push(slot); }
    });
    if (done.length) this.#note(done);
    return done.length;
  }
  // The store changed: the card's books become the store's. erase: a book the store does not have is
  // taken off the card (not on a first run, and not when the store cannot keep anything). True when the card changed.
  pull({ erase = this.store.status === "persistent" && !!this.store.getMeta(FLAG) } = {}) {
    let changed = false;
    SLOTS.forEach((slot, i) => {
      const file = bookFile(this.card, i), env = this.#env(i);
      if (env) { if (!file || toBase64(file) !== env.payload.data) changed = putBook(this.card, i, fromBase64(env.payload.data)) || changed; }
      else if (file && erase && !this.store.read(GAME_ID, slot)) { this.card.erase(fileName(i)); changed = true; }
    });
    return changed;
  }
  // At start. The first time on a device, the books of its card that the store lacks go in (books made
  // before the store was there); after that the store is what counts. True when the card changed.
  start() {
    if (!this.store.getMeta(FLAG)) {
      SLOTS.forEach((slot, i) => { const file = bookFile(this.card, i); if (file && !this.store.read(GAME_ID, slot)) this.#write(i, file); });
      const changed = this.pull({ erase: false });
      this.store.setMeta(FLAG, 1);
      return changed;
    }
    if (this.#unsaved().length) this.push(this.#unsaved()); // saves the store did not get to write down: the card has them
    return this.pull();
  }
  suspend = {
    read: () => { const e = this.store.read(GAME_ID, "suspend"); return e?.schema === SCHEMA && typeof e.payload?.state === "string" ? e : null; },
    write: (payload) => { try { this.store.write(GAME_ID, "suspend", { schema: SCHEMA, dataVersion: codec.dataVersion, edition: this.edition, label: "이어하기", payload }); return true; } catch { return false; } },
    erase: () => this.store.erase(GAME_ID, "suspend"),
  };
}

export async function openCardSaves({ card, edition = "ko", storage = globalThis.localStorage, ...options } = {}) {
  return new CardSaves(await SaveStore.open(options), card, edition, storage);
}
