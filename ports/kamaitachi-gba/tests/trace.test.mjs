import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("trace comparison can ignore only the frame column", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kama-trace-"));
  const a = path.join(dir, "a.tsv");
  const b = path.join(dir, "b.tsv");
  fs.writeFileSync(a, "1\t1b\t0002\t0d\t01\t0\t65535\t0\t0\tflags:1=1\tnone\n");
  fs.writeFileSync(b, "8\t1b\t0002\t0d\t01\t0\t65535\t0\t0\tflags:1=1\tnone\n");
  const tool = new URL("../tools/compare-traces.mjs", import.meta.url);
  execFileSync(process.execPath, [tool.pathname, "--ignore-frame", a, b]);
  assert.notEqual(spawnSync(process.execPath, [tool.pathname, a, b]).status, 0);
});
