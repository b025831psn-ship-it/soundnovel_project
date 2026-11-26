import { test } from "node:test";
import assert from "node:assert/strict";
import { Gpu } from "../src/gpu/gpu.js";

const px = (g, x, y) => g.vram[y * 1024 + x];
const area = (g) => { g.gp0(0xe3000000); g.gp0(0xe4000000 | (511 << 10) | 1023); };

test("fill, CPU->VRAM, VRAM->CPU", () => {
  const g = new Gpu();
  g.gp0(0x02f80800); g.gp0(0x00100010); g.gp0(0x00020010); // fill 16x2 at (16,16), r=0x00 g=0x08 b=0xf8
  assert.equal(px(g, 16, 16), (1 << 5) | (31 << 10));
  g.gp0(0xa0000000); g.gp0(0x00200040); g.gp0(0x00010002); g.gp0(0x12345678);
  assert.equal(px(g, 64, 32), 0x5678); assert.equal(px(g, 65, 32), 0x1234);
  g.gp0(0xc0000000); g.gp0(0x00200040); g.gp0(0x00010002);
  assert.equal(g.read() >>> 0, 0x12345678);
});

test("4-bit CLUT sprite, transparent 0, semi-transparency on bit 15", () => {
  const g = new Gpu(); area(g);
  g.gp0(0xa0000000); g.gp0(0x01e00000); g.gp0(0x00010004); g.gp0(0x7c000000); g.gp0(0x0000801f); // CLUT (0,480): 0, 0x7c00, 0x801f
  g.gp0(0xa0000000); g.gp0(0x00000040); g.gp0(0x00010001); g.gp0(0x00002210); // texels 0,1,2,2 at x=64
  g.gp0(0xa0000000); g.gp0(0x00000100); g.gp0(0x00010004); g.gp0(0x03e003e0); g.gp0(0x03e003e0); // green background
  g.gp0(0xe1000000 | 1 | (1 << 5)); // texture page x=64, 4-bit, semi B+F
  g.gp0(0x66808080); g.gp0(0x00000100); g.gp0(0x78000000); g.gp0(0x00010004); // sprite 4x1 at (256,0)
  assert.equal(px(g, 256, 0), 0x03e0); // index 0 = transparent
  assert.equal(px(g, 257, 0), 0x7c00); // bit 15 clear: opaque
  assert.equal(px(g, 258, 0), 0x83ff); // bit 15 set: background + foreground
});

test("display() reads the display area in 15-bit mode", () => {
  const g = new Gpu();
  g.gp1(0x08000001); g.gp1(0x03000000); g.gp1(0x05000000 | (0 << 10) | 0);
  g.gp0(0x02ff0000); g.gp0(0); g.gp0(0x00010010);
  const { width, height, rgba } = g.display();
  assert.equal(width, 320); assert.equal(height, 240);
  assert.deepEqual([...rgba.slice(0, 4)], [0, 0, 255, 255]);
});
