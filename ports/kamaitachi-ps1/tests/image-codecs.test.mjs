import assert from "node:assert/strict";
import test from "node:test";
import { decodeLzs, decodeTim } from "../src/image-codecs.js";

test("retail LZS marker is followed immediately by the flag stream", () => {
  const packed = Uint8Array.of(0x4c, 0x5a, 0x53, 0xff, 0x10, 0, 0, 0, 9, 0, 0, 0);
  assert.deepEqual([...decodeLzs(packed)], [0x10, 0, 0, 0, 9, 0, 0, 0]);
});

test("16-bit TIM pixels decode from PlayStation BGR555", () => {
  const tim = Uint8Array.of(
    0x10, 0, 0, 0, 2, 0, 0, 0,
    16, 0, 0, 0, 4, 0, 8, 0, 2, 0, 1, 0,
    0x1f, 0, 0, 0x7c,
  );
  const image = decodeTim(tim);
  assert.deepEqual({ x: image.x, y: image.y, width: image.width, height: image.height },
    { x: 4, y: 8, width: 2, height: 1 });
  assert.deepEqual([...image.rgba], [255, 0, 0, 255, 0, 0, 255, 255]);
});

test("indexed TIM may use a separately loaded retail CLUT", () => {
  const tim = Uint8Array.of(
    0x10, 0, 0, 0, 1, 0, 0, 0,
    14, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0,
    0, 1,
  );
  const palette = new Uint16Array(256); palette[1] = 0x03e0;
  const image = decodeTim(tim, { palette });
  assert.deepEqual([...image.rgba], [0, 0, 0, 255, 0, 255, 0, 255]);
});
