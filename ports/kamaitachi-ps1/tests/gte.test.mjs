import test from "node:test";
import assert from "node:assert/strict";
import { Gte } from "../src/gpu/gte.js";

test("GTE RotTransPers4: identity rotation at the screen distance maps x, y one to one", () => {
  const ram = new Map(), m = { read: (a, w) => { let v = 0; for (let k = 0; k < w; k++) v |= (ram.get(a + k) ?? 0) << (8 * k); return w === 4 ? v : v >>> 0; }, write: (a, v, w) => { for (let k = 0; k < w; k++) ram.set(a + k, (v >>> (8 * k)) & 0xff); } };
  const g = new Gte(); g.setOffset(160, 120);
  g.setRot([0x1000, 0, 0x1000, 0, 0x1000]); g.setTrans([0, 0, 1000]);
  const vs = [[-10, -20], [10, -20], [-10, 20], [10, 20]];
  vs.forEach(([x, y], i) => { m.write(0x100 + 8 * i, x, 2); m.write(0x102 + 8 * i, y, 2); m.write(0x104 + 8 * i, 0, 2); });
  const out = [0x200, 0x204, 0x208, 0x20c, 0x210, 0x214];
  const otz = g.rotTransPers4(m, [0x100, 0x108, 0x110, 0x118], out);
  assert.equal(otz, 250);
  const xy = (a) => { const v = m.read(a, 4); return [(v << 16) >> 16, v >> 16]; };
  assert.deepEqual(vs.map((_, i) => xy(out[i])), vs.map(([x, y]) => [160 + x, 120 + y]));
  assert.equal(m.read(0x214, 4) >>> 0, 0x1000); // only IR0 saturated (depth cue below 0), no error bit
});
