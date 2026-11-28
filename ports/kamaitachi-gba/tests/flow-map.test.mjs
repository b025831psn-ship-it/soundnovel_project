import test from "node:test";
import assert from "node:assert/strict";
import { FlowMap, MapSurface } from "../src/flow-map.js";

// A flowchart with one page (cell 0): node 43 (kind 0) at (2, 3) and one link group whose last id
// (bit 15) is 5, running from (3, 0) down to (3, 2).
function sample() {
  const nodes = new Uint8Array(2 * 168 + 8);
  const links = new Uint8Array(2 * 168 + 12);
  nodes.set([(2 * 168) & 255, (2 * 168) >> 8], 0);
  nodes.set([(43 & 3) << 6, 43 >> 2, (2 << 4) | 3, 0, 0], 2 * 168);
  links.set([(2 * 168) & 255, (2 * 168) >> 8], 0);
  links.set([4, 0, 5, 0x80, (3 << 5) | (0 << 2) | 1, (3 << 5) | (2 << 2) | 2, 0xff, 0, 0], 2 * 168);
  const header = 4 + 8 * 3;
  const flow = new Uint8Array(header + nodes.length + links.length + 8);
  const be = (at, v) => flow.set([v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255], at);
  be(4, header);
  be(12, header + nodes.length);
  be(20, header + nodes.length + links.length);
  flow.set(nodes, header);
  flow.set(links, header + nodes.length);
  return new FlowMap({ flow, glyphs: new Uint8Array(24 * 42), titles: new Uint8Array(4) });
}

function ram() {
  return { node: 43, flags: new Uint8Array(256), seenNodes: new Uint8Array(0x12c), seenEdges: new Uint8Array(0x200) };
}

test("flowchart entries and link groups (bit 15 marks the last id)", () => {
  const map = sample();
  assert.deepEqual([...map.entries(0)], [{ kind: 0, id: 43, x: 2, y: 3 }]);
  const groups = [...map.groups(0)];
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].ids, [4, 0x8005]);
  assert.equal(groups[0].points.length, 2);
});

test("page marks: 7 for this play, 6 for an earlier one; the cursor starts on the current node", () => {
  const map = sample();
  const r = ram();
  r.seenNodes[43] = 1;
  let { pages, cursor } = map.survey(r);
  assert.equal(pages[0], 6);
  assert.deepEqual(cursor, { x: 2, y: 3 });
  r.seenEdges[5] = 3;
  ({ pages } = map.survey(r));
  assert.equal(pages[0], 7);
});

test("a seen scene box: yellow number row over a gray row (0800D7F8), links in pink", () => {
  const map = sample();
  const r = ram();
  r.seenNodes[43] = 3;
  r.seenEdges[4] = 3;
  const surface = new MapSurface();
  map.drawPage(surface, r, { column: 0, row: 0 });
  const at = (x, y) => surface.pixels[y * 240 + x];
  // x = (2 * 36 + 12) * 3/4 = 63; rows (3 * 28 + 47) * 0.7 = 91 and (3 * 28 + 57) * 0.7 = 98.
  assert.equal(at(63, 91), 0x0d);
  assert.equal(at(84, 97), 0x0d);
  assert.equal(at(63, 98), 3);
  assert.equal(at(85, 91), 0);
  // The link: x (3 * 36 - 9) * 3/4 = 74, from y 0x2A * 0.7 = 29 down.
  assert.equal(at(74, 35), 4);
  assert.equal(map.sceneAt(r, { x: 2, y: 3 })?.id, 43);
  assert.equal(map.sceneAt(r, { x: 2, y: 2 }), null);
});
