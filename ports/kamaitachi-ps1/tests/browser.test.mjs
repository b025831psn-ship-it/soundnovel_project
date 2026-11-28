import assert from "node:assert/strict";
import test from "node:test";
import { startBrowserRuntime } from "../src/browser.js";

test("browser player publishes sound-backed runtime frames to the 320x240 canvas", async () => {
  const calls = [], scheduled = [];
  const context = { imageSmoothingEnabled: true,
    createImageData: (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: (image, x, y) => calls.push([image.data[0], x, y]) };
  const canvas = { getContext: () => context };
  const sound = { scenarioOp() {} };
  const runtime = { framebuffer: new Uint8ClampedArray(320 * 240 * 4), async step() { this.framebuffer[0] = 77; } };
  const player = await startBrowserRuntime({ canvas, dataRoot: "/data/", soundRoot: "/sound/",
    soundFactory: async ({ data }) => { assert.equal(data, "/sound/"); return sound; },
    runtimeFactory: async (root, options) => { assert.equal(root, "/data/"); assert.equal(options.sound, sound); return runtime; },
    requestFrame: (callback) => scheduled.push(callback) });
  assert.equal(player.runtime, runtime); assert.equal(player.sound, sound);
  assert.deepEqual(calls, [[0, 0, 0]]);
  await scheduled.shift()();
  assert.deepEqual(calls.at(-1), [77, 0, 0]);
  player.stop();
});
