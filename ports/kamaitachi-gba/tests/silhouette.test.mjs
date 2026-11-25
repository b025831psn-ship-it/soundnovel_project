import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TINT, lz10, mergeSilhouette, Silhouettes, tintColor } from "../src/silhouette.js";
import { toneColor } from "../src/screen.js";

// 08001138 with the default tint, then 08001D74 at 明度/彩度 5/5: mGBA's BG bank 15 after opcode
// 29 0,20 (silhouette palette 0x18C6 ... 0x7BDE).
test("the silhouette palette is tinted and toned as on the cartridge", () => {
  const tone = (raw) => toneColor(tintColor(raw, DEFAULT_TINT), 5, 5);
  assert.equal(tone(0x18c6), 0x2085);
  assert.equal(tone(0x4631), 0x3446);
  assert.equal(tone(0x7bde), 0x5007);
});

test("a silhouette replaces only the nonzero nibbles below it", () => {
  const buffer = Uint8Array.from([0x12, 0x34, 0x56]);
  mergeSilhouette(buffer, Uint8Array.from([0x70, 0x08, 0x00]));
  assert.deepEqual([...buffer], [0x72, 0x38, 0x56]);
});

test("LZ10 back-references and silhouette ids", () => {
  // 3 literals "abc", then a copy of 3 bytes from distance 3.
  const data = Uint8Array.from([0x10, 6, 0, 0, 0x10, 0x61, 0x62, 0x63, 0x00, 0x02]);
  assert.deepEqual([...lz10(data, 0)], [0x61, 0x62, 0x63, 0x61, 0x62, 0x63]);
  assert.equal(Silhouettes.index(0x20), 0x20);
  assert.equal(Silhouettes.index(1000 + 0x20), 0x20);
  assert.equal(Silhouettes.index(0x350), 0x31b);
});
