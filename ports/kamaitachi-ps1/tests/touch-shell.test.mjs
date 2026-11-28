import assert from "node:assert/strict";
import test from "node:test";
import { NATIVE_HEIGHT, NATIVE_WIDTH, RetailInputLatch, nativePoint, routeTouch } from "../src/touch-shell.js";

test("quick taps latch exactly one VSync trigger", () => {
  const input = new RetailInputLatch();
  input.pulse("confirm");
  assert.deepEqual(input.consumeFrame(), { trigger: ["confirm"], held: [] });
  assert.deepEqual(input.consumeFrame(), { trigger: [], held: [] });
});

test("screen coordinates map to native 320x240 pixels", () => {
  const canvas = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 640, height: 480 }) };
  assert.deepEqual(nativePoint(canvas, { clientX: 330, clientY: 260 }), { x: 160, y: 120 });
  assert.deepEqual(nativePoint(canvas, { clientX: -1, clientY: 999 }), { x: 0, y: NATIVE_HEIGHT - 1 });
  assert.equal(NATIVE_WIDTH, 320);
});

test("a row tap moves first and confirms only the current retail row", () => {
  const pulses = [], moves = [];
  let cursor = 0;
  const runtime = {
    input: { pulse: (input) => pulses.push(input) },
    cursorIndex: () => cursor,
    moveCursor: (delta) => { moves.push(delta); cursor += delta; },
    touchRows: () => [
      { index: 0, left: 20, right: 300, top: 80, bottom: 110 },
      { index: 1, left: 20, right: 300, top: 110, bottom: 140 },
    ],
  };
  routeTouch(runtime, 100, 120);
  assert.deepEqual({ moves, pulses }, { moves: [1], pulses: [] });
  routeTouch(runtime, 100, 120);
  assert.deepEqual(pulses, ["confirm"]);
  routeTouch(runtime, 5, 5);
  assert.deepEqual(pulses, ["confirm", "confirm"]);
});
