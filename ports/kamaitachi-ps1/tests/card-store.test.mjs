import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { MemoryCard } from "../src/memory-card.js";
import { CardSaves, GAME_ID, bookFile, fileName } from "../src/card-store.js";
import { SaveStore } from "../../../shared/save/store.js";
import { MemoryBackend } from "../../../shared/save/backends.js";
import { newSecret, deriveKeys, SyncClient } from "../../../shared/save/sync.js";
import { createServer } from "../../../shared/save/server/server.mjs";

async function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vault-")), server = createServer({ dir });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`, keys = await deriveKeys(newSecret());
  const device = async (card = new MemoryCard(), storage = null, backend = new MemoryBackend()) => {
    const store = await SaveStore.open({ backend }); store.status = "persistent";
    const saves = new CardSaves(store, card, "ko", storage), sync = new SyncClient({ store, baseUrl, keys });
    store.subscribe((e) => { if (e.type === "remote") saves.pull(); }); // as machine-browser.js does
    return { card, store, saves, sync, changed: saves.start() };
  };
  return { dir, device, close: () => { server.closeAllConnections?.(); server.close(); } };
}
// what the game does when it saves book n: the file is made if it is not there, then written
const gameSaves = (d, n, fill) => { d.card.create(fileName(n), 1); d.card.write(fileName(n), 0, new Uint8Array(0x2000).fill(fill)); return d.saves.push(); };

test("a book saved on the PC is on the phone, and back", async () => {
  const t = await setup(), pc = await t.device(), phone = await t.device();
  assert.equal(gameSaves(pc, 0, 7), 1);
  assert.equal(pc.saves.push(), 0); // nothing new: nothing written again
  assert.equal((await pc.sync.sync()).pushed, 1);
  assert.ok(!fs.readFileSync(path.join(t.dir, fs.readdirSync(t.dir)[0]), "utf8").includes("BwcHBwcH")); // the book itself is sealed on the server
  assert.equal((await phone.sync.sync()).pulled, 1);
  assert.deepEqual(bookFile(phone.card, 0), new Uint8Array(0x2000).fill(7));
  assert.equal(bookFile(phone.card, 1), null);
  gameSaves(phone, 0, 9); gameSaves(phone, 2, 3);
  await phone.sync.sync(); await pc.sync.sync();
  assert.equal(bookFile(pc.card, 0)[100], 9); assert.equal(bookFile(pc.card, 2)[100], 3);
  t.close();
});

test("both devices saved the same book: 409, the player picks, the other is kept as backup", async () => {
  const t = await setup(), pc = await t.device(), phone = await t.device();
  gameSaves(pc, 1, 1); await pc.sync.sync(); await phone.sync.sync();
  gameSaves(pc, 1, 2); gameSaves(phone, 1, 3);
  await pc.sync.sync();
  const r = await phone.sync.sync(), key = `${GAME_ID}\u0000manual-1`;
  assert.deepEqual(r.conflicts, [key]);
  assert.equal(bookFile(phone.card, 1)[0], 3); // nothing is overwritten before the choice
  phone.store.resolveConflict(key, "remote");
  assert.equal(bookFile(phone.card, 1)[0], 2);
  assert.equal(phone.store.backups.get(key).payload.name, fileName(1));
  // the other choice: this device's book goes over the server's
  gameSaves(pc, 1, 4); gameSaves(phone, 1, 5); await pc.sync.sync(); await phone.sync.sync();
  phone.store.resolveConflict(key, "local"); await phone.sync.sync(); await pc.sync.sync();
  assert.equal(bookFile(pc.card, 1)[0], 5);
  t.close();
});

test("a card with books from before the store, and a book erased elsewhere", async () => {
  const t = await setup(), old = new MemoryCard(); old.create(fileName(0), 1); old.write(fileName(0), 0, new Uint8Array(0x2000).fill(6));
  const pc = await t.device(old), phone = await t.device();
  assert.equal(pc.store.read(GAME_ID, "manual-0").original.fileId, fileName(0)); // taken in on the first run
  await pc.sync.sync(); await phone.sync.sync();
  assert.equal(bookFile(phone.card, 0)[0], 6);
  phone.card.erase(fileName(0)); assert.equal(phone.saves.push(), 1); // the game's own erase
  await phone.sync.sync(); await pc.sync.sync();
  assert.equal(pc.saves.pull(), true); assert.equal(bookFile(pc.card, 0), null);
  // a store that cannot keep anything never takes books off the card
  const priv = await t.device(old.bytes ? new MemoryCard(old.bytes) : old); priv.store.status = "memory";
  assert.equal(priv.saves.pull(), false);
  t.close();
});

test("the suspend slot", async () => {
  const t = await setup(), pc = await t.device(), phone = await t.device();
  assert.equal(pc.saves.suspend.read(), null);
  pc.saves.suspend.write({ state: "AAAA", book: 1 });
  await pc.sync.sync(); await phone.sync.sync();
  assert.equal(phone.saves.suspend.read().payload.book, 1);
  t.close();
});

test("a tab closed right after a save: the card counts, not the store that missed the write", async () => {
  const t = await setup(), items = new Map(), storage = { getItem: (k) => items.get(k) ?? null, setItem: (k, v) => items.set(k, v), removeItem: (k) => items.delete(k) };
  const first = await t.device(new MemoryCard(), storage); await first.store.flush();
  // the game saves; the store's write never lands (a backend that drops it), the card image is kept
  const lost = new MemoryBackend(); await lost.put("meta", "kamaitachi-ps1.card", 1); lost.put = () => new Promise(() => {});
  const closing = await t.device(first.card, storage, lost); gameSaves(closing, 0, 8);
  assert.match(items.get("kamaitachi-ps1.card.unsaved"), /manual-0/);
  const again = new MemoryBackend(); await again.put("meta", "kamaitachi-ps1.card", 1);
  const next = await t.device(new MemoryCard(first.card.bytes), storage, again);
  assert.equal(bookFile(next.card, 0)[0], 8); assert.equal(next.store.read(GAME_ID, "manual-0").payload.name, fileName(0));
  await next.store.flush(); await new Promise((r) => setTimeout(r, 10)); assert.equal(items.has("kamaitachi-ps1.card.unsaved"), false);
  t.close();
});
