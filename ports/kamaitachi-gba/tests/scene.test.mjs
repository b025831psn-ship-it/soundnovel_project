import test from "node:test";
import assert from "node:assert/strict";
import { SceneLoader } from "../src/scene.js";
test("request mapping and group-0 deferral preserve current background", async () => {
  let loads = [];
  const s = new SceneLoader({}, {});
  s.load = async (n) => loads.push(n);
  let r = { group: 0, slot: 0x61, pending: 0 };
  await s.request(0x4e, r);
  assert.deepEqual(loads, []);
  assert.equal(r.pending, 0x4e);
  r = { group: 1, slot: 0xffff, pending: 0 };
  await s.request(0x4e, r);
  assert.deepEqual(loads, [1078]);
  assert.deepEqual(s.resolve(1200), { image: 201, variant: 0 });
});
