import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createRuntime } from "../src/runtime.js";

test("browser runtime steps retail bytes and exposes framebuffer/input/sound hooks", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "kamai-runtime-"));
  t.after(async () => (await import("node:fs/promises")).rm(root, { recursive: true }));
  await mkdir(path.join(root, "sce"));
  await writeFile(path.join(root, "sce", "r.bin"), Uint8Array.of(0x2f, 7, 0, 0, 0));
  const handlers = Array.from({ length: 256 }, () => "0x80000000");
  const subhandlers = Array.from({ length: 108 }, () => "0x80000000");
  const lengths = Array.from({ length: 256 }, () => ({ classification: "fixed", operandLength: 0 }));
  lengths[0x2f] = { classification: "fixed", operandLength: 4 };
  const record = { id: 0, memberOffset: 0, path: "sce/r.bin" };
  await writeFile(path.join(root, "manifest.json"), JSON.stringify({ schema: "kamaitachi.ps1.port-data.v1",
    opcodeTables: { primary: { handlers, lengths }, sub1d: { handlers: subhandlers, lengths: [] } },
    archives: { "SCE.PAC": { resources: [{ id: 0, records: [record] }] } } }));
  const calls = [], sound = { scenarioOp: (...args) => calls.push(args), vsync() {}, frame() {} };
  const runtime = await createRuntime(root, { resourceId: 0, recordId: 0, sound });
  assert.equal(runtime.framebuffer.length, 320 * 240 * 4);
  assert.equal(typeof runtime.step, "function");
  assert.equal(typeof runtime.input.pulse, "function");
  assert.equal(typeof runtime.touchRows, "function");
  assert.equal(typeof runtime.cursorIndex, "function");
  assert.equal(typeof runtime.moveCursor, "function");
  assert.equal((await runtime.step()).frame, 1);
  assert.deepEqual(calls, [[0x2f, [7, 0, 0, 0], false]]);
});
