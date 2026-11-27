import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryCard, CARD_BYTES } from "../src/memory-card.js";

const xor = (b, o) => { let x = 0; for (let i = 0; i < 127; i++) x ^= b[o + i]; return x; };

test("a new card is formatted like a real one", () => {
  const c = new MemoryCard();
  assert.equal(c.bytes.length, CARD_BYTES);
  assert.ok(c.formatted());
  for (let i = 0; i < 16; i++) assert.equal(c.bytes[i * 128 + 127], xor(c.bytes, i * 128), `frame ${i} checksum`);
  assert.deepEqual(c.bytes.subarray(63 * 128, 64 * 128), c.bytes.subarray(0, 128));
  assert.equal(c.free().length, 15);
});

test("create, write, read, erase through the block chain", () => {
  const c = new MemoryCard();
  assert.equal(c.create("BISLPS-01794TEST0", 2), 0);
  assert.equal(c.create("BISLPS-01794TEST0", 1), 6);
  assert.deepEqual(c.files(), ["BISLPS-01794TEST0"]);
  const e = c.entry(1);
  assert.equal(e.state, 0x51); assert.equal(c.bytes[128 + 4] | c.bytes[128 + 5] << 8 | c.bytes[128 + 6] << 16, 0x4000);
  assert.equal(e.next, 1); assert.equal(c.entry(2).state, 0x53); assert.equal(c.entry(2).next, 0xffff);
  const data = Uint8Array.from({ length: 0x300 }, (_, i) => i * 7);
  assert.ok(c.write("BISLPS-01794TEST0", 0x1f00, data)); // across the block boundary
  assert.deepEqual(c.read("BISLPS-01794TEST0", 0x1f00, 0x300), data);
  assert.equal(c.read("NONE", 0, 4), null);
  assert.equal(c.erase("BISLPS-01794TEST0"), 0);
  assert.equal(c.entry(1).state, 0xa1); assert.equal(c.files().length, 0); assert.equal(c.free().length, 15);
  assert.equal(c.erase("BISLPS-01794TEST0"), 5);
});

test("a full card refuses a new file", () => {
  const c = new MemoryCard();
  assert.equal(c.create("BIG", 15), 0);
  assert.equal(c.create("MORE", 1), 7);
});

test("an image round-trips", () => {
  const a = new MemoryCard(); a.create("X", 1); a.write("X", 0, Uint8Array.of(1, 2, 3));
  const b = new MemoryCard(a.bytes.slice());
  assert.deepEqual(b.read("X", 0, 3), Uint8Array.of(1, 2, 3));
});
