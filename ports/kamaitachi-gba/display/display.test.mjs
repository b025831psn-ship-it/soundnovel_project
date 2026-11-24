import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { extname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { DEFAULT_DISPLAY_MODE, displayMode } from "./modes.js";
import { upscaleHandheld25x } from "./reference.js";

test("native is the default and preserves 240x160", () => {
  assert.equal(DEFAULT_DISPLAY_MODE, "native");
  assert.deepEqual(displayMode("unknown"), displayMode("native"));
  assert.deepEqual([displayMode("native").width, displayMode("native").height], [240, 160]);
});

test("CPU reference copies corners, selects the darker cross, and preserves alpha", () => {
  const source = new Uint8ClampedArray([
    200, 0, 0, 11, 0, 20, 0, 22,
    0, 0, 10, 33, 40, 40, 40, 44,
  ]);
  const result = upscaleHandheld25x(source, 2, 2);
  assert.deepEqual([result.width, result.height], [5, 5]);
  const pixel = (x, y) => [...result.data.slice((y * 5 + x) * 4, (y * 5 + x + 1) * 4)];
  assert.deepEqual(pixel(0, 0), [200, 0, 0, 11]);
  assert.deepEqual(pixel(4, 4), [40, 40, 40, 44]);
  assert.deepEqual(pixel(2, 0), [0, 20, 0, 22]);
  assert.deepEqual(pixel(0, 2), [0, 0, 10, 33]);
  assert.deepEqual(pixel(2, 2), [0, 0, 10, 33]);
});

test("dark-pixel priority thins a bright pixel on a dark background", () => {
  const source = new Uint8ClampedArray([
    255, 255, 255, 255, 0, 0, 0, 255,
    0, 0, 0, 255, 0, 0, 0, 255,
  ]);
  const { data } = upscaleHandheld25x(source, 2, 2);
  let brightPixels = 0;
  for (let at = 0; at < data.length; at += 4) if (data[at] === 255) brightPixels++;
  assert.equal(brightPixels, 4, "the bright corner occupies only its copied 2x2 area");
  assert.ok(brightPixels < 2.5 * 2.5, "coverage is below area-preserving 2.5x scaling");
});

test("actual WebGL output exactly matches CPU reference", { timeout: 30_000 }, async () => {
  const root = fileURLToPath(new URL(".", import.meta.url));
  const server = createServer(async (request, response) => {
    if (request.url === "/favicon.ico") { response.writeHead(204); response.end(); return; }
    const relative = request.url === "/" ? "browser-test.html" : request.url.slice(1);
    const path = join(root, relative);
    response.setHeader("content-type", extname(path) === ".js" ? "text/javascript" : "text/html");
    try { response.end(await readFile(path)); }
    catch { response.writeHead(404); response.end(); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const userData = await mkdtemp(join(tmpdir(), "gba-display-chromium-"));
  const chromium = spawn("chromium", [
    "--headless", "--no-sandbox", "--disable-extensions", "--disable-gpu-sandbox", "--enable-webgl", "--use-gl=angle",
    "--use-angle=swiftshader", "--remote-debugging-port=0", `--user-data-dir=${userData}`, `http://127.0.0.1:${port}/`,
  ]);
  let stderr = "";
  const debugUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(stderr)), 10_000);
    chromium.stderr.on("data", (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const debugPort = new URL(debugUrl).port;
  let target;
  for (let attempt = 0; attempt < 100; attempt++) {
    const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
    target = targets.find((entry) => entry.url.startsWith(`http://127.0.0.1:${port}/`));
    if (target) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.ok(target, "Chromium did not open the test page");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const evaluate = (expression) => new Promise((resolve) => {
    const id = ++sequence;
    const listener = (event) => {
      const message = JSON.parse(event.data);
      if (message.id === id) { socket.removeEventListener("message", listener); resolve(message.result.result.value); }
    };
    socket.addEventListener("message", listener);
    socket.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, returnByValue: true } }));
  });
  let encoded = "";
  for (let attempt = 0; attempt < 600; attempt++) {
    encoded = await evaluate("document.body.textContent");
    if (encoded?.startsWith("{")) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  socket.close();
  const exited = new Promise((resolve) => chromium.on("exit", resolve));
  chromium.kill("SIGTERM");
  await exited;
  server.close();
  server.closeAllConnections();
  await rm(userData, { recursive: true });
  assert.ok(encoded?.startsWith("{"), stderr);
  const result = JSON.parse(encoded);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.size, [600, 400]);
  assert.equal(result.alphaAtLastPixel, 20);
  assert.equal(result.nativeMismatch, -1, "native adapter must preserve every RGBA byte");
  assert.equal(result.fallbackMode, "native");
  assert.deepEqual(result.fallbackSize, [240, 160]);
  assert.ok(result.medianMillisecondsPerFrame < 1000 / 60, JSON.stringify(result));
  console.log("WebGL benchmark", result);
});
