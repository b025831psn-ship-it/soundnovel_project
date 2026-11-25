import test from "node:test";
import assert from "node:assert/strict";
import { MemoryBackend } from "../../../shared/save/backends.js";
import { SaveStore } from "../../../shared/save/store.js";
import { loadSlot } from "../../../shared/save/codec.js";
import { openBooks, codec, StoreBooks } from "../src/books-store.js";

const page = (n) => ({ bank: 19, offset: n, ram: { flags: { $bytes: [1, 2] } }, picture: 3, song: -1 });
const fakeStorage = (init = {}) => ({ getItem: (k) => init[k] ?? null, removeItem() {}, setItem() {} });

test("books behave like the old Books: save, read, copy, erase, any", async () => {
  const books = await openBooks({ backend: new MemoryBackend(), storage: fakeStorage() });
  assert.equal(books.any(), false);
  assert.equal(books.write(1, page(10)), true);
  assert.deepEqual(books.read(1), page(10));
  assert.equal(books.any(), true);
  books.copy(1, 2);
  assert.deepEqual(books.read(2), page(10));
  books.erase(1);
  assert.equal(books.read(1), null);
  assert.equal(books.read(0), null);
});

test("suspend is a separate slot that the bookshelf never sees", async () => {
  const books = await openBooks({ backend: new MemoryBackend(), storage: fakeStorage() });
  books.suspend.write(page(77));
  assert.equal(books.any(), false);
  assert.deepEqual(books.suspend.read(), page(77));
  const shown = codec.slots().filter((s) => s.showInOriginalUi).map((s) => s.id);
  assert.deepEqual(shown, ["manual-0", "manual-1", "manual-2"]);
});

test("old localStorage books are imported once and never overwrite", async () => {
  const backend = new MemoryBackend();
  const storage = fakeStorage({ "kamaitachi-gba.book.0": JSON.stringify(page(5)), "kamaitachi-gba.book.2": JSON.stringify(page(6)) });
  const books = await openBooks({ backend, storage });
  assert.deepEqual(books.read(0), page(5));
  assert.deepEqual(books.read(2), page(6));
  books.write(0, page(50));
  await books.store.flush();
  const again = await openBooks({ backend, storage });
  assert.deepEqual(again.read(0), page(50));
});

test("load pipeline accepts a book and rejects a damaged one", async () => {
  const store = await SaveStore.open({ backend: new MemoryBackend() });
  const books = new StoreBooks(store);
  books.write(0, page(9));
  assert.equal(loadSlot(store, codec, "manual-0").ok, true);
  store.write("kamaitachi-gba", "manual-1", { schema: 1, payload: { nope: true } });
  assert.equal(loadSlot(store, codec, "manual-1").reason, "corrupt");
});
