import test from "node:test";
import assert from "node:assert/strict";
import { composeGbaFrame } from "../src/gba-compositor.js";
import { ObjTextSurface } from "../src/obj-text.js";

test("mode-0 compositor resolves text BG and OBJ pixels from native memory layout", () => {
  const vram = new Uint8Array(0x18000), palette = new Uint8Array(0x400);
  const oam = new Uint8Array(0x400);
  for (let index = 0; index < 128; index++) oam[index * 8 + 1] = 2; // disable
  vram.fill(1, 64, 128); // BG tile 1, 8bpp
  vram[0x800] = 1; // screenblock 1, tile 1
  palette[2] = 0xe0; palette[3] = 0x03; // BG green
  let frame = composeGbaFrame({ vram, palette, oam, dispcnt: 0x100, bgcnt: [0x180] });
  assert.deepEqual([...frame.slice(0, 3)], [0, 255, 0]);

  oam[1] = 0; // OBJ 0 active at 0,0
  vram[0x10000] = 1;
  palette[0x202] = 0x1f; // OBJ palette 0, color 1 red
  frame = composeGbaFrame({ vram, palette, oam, dispcnt: 0x1100, bgcnt: [0x183] });
  assert.deepEqual([...frame.slice(0, 3)], [255, 0, 0]);
});

test("OBJ text surface packs two 4bpp pixels per native tile byte", () => {
  const font = {
    find: () => 0,
    glyph: () => ({ width: 2, height: 1, pixels: Uint8Array.of(1, 14) }),
  };
  const surface = new ObjTextSurface();
  surface.glyph(font, 0, 0, 0, 8);
  assert.equal(surface.objCharblock()[0], 0x81);
});
