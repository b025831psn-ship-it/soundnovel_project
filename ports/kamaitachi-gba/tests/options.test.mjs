import test from "node:test";
import assert from "node:assert/strict";
import { toneColor } from "../src/screen.js";
import { Boot } from "../src/boot.js";

// 08001D74 on the header bar's color before the transform (0x1594), checked against mGBA's
// palette RAM at 明度/彩度 0/0, 2/0 and 6/10, and two frames before the end of a fade-in.
test("明度 and 彩度 transform the menu colors as the cartridge does", () => {
  assert.equal(toneColor(0x1594, 5, 5), 0x15d9);
  assert.equal(toneColor(0x1594, 5, 7), 0x1e1b);
  assert.equal(toneColor(0x1594, 15, 11), 0x09ff);
  assert.equal(toneColor(0x1594, 5, 5 + (13 - 15) * 3), 0x0113);
});

// 08006F1C control pairs: rr breaks the line 0x14 lower (14 pixels), s8 moves 6 pixels, c4 sets
// OBJ color 12 (this port's 6), n1 prints the hero's name.
test("option text control pairs", () => {
  const widths = { 0x93a7: 12, 0x8341: 10 };
  const font = { find: (code) => (code in widths ? code : -1), glyph: (code) => ({ width: widths[code] }) };
  const boot = Object.create(Boot.prototype);
  boot.font = font;
  boot.names = { 1: [0x93, 0xa7], 2: [] };
  const bytes = [0x63, 0x34, 0x6e, 0x31, 0x63, 0x30, 0x72, 0x72, 0x83, 0x41, 0x73, 0x38, 0x83, 0x41, 0];
  const glyphs = boot.text([], bytes, 0x4b, 0x14, 2, true);
  assert.deepEqual(glyphs, [
    { x: 0x4b, y: 14, encoded: 0x93a7, color: 6 },
    { x: 0x4b, y: 28, encoded: 0x8341, color: 2 },
    { x: 0x4b + 10 + 6, y: 28, encoded: 0x8341, color: 2 },
  ]);
});
