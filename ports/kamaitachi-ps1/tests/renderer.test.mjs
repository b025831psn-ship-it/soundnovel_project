import assert from "node:assert/strict";
import test from "node:test";
import { RetailFramebuffer } from "../src/renderer.js";

test("renderer exports the native 320x240 RGBA framebuffer", () => {
  const renderer = new RetailFramebuffer();
  assert.equal(renderer.rgba.length, 320 * 240 * 4);
  renderer.blit({ width: 1, height: 1, rgba: Uint8Array.of(255, 0, 0, 255) }, 10, 20);
  assert.deepEqual([...renderer.rgba.slice((20 * 320 + 10) * 4, (20 * 320 + 10) * 4 + 4)], [255, 0, 0, 255]);
});

test("text rendering refuses to synthesize a missing retail glyph", () => {
  const renderer = new RetailFramebuffer();
  assert.throws(() => renderer.drawText("A", { glyph: () => null }), /missing retail glyph/);
});
