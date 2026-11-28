import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServer } from "../server/server.mjs";

// Two devices saving different slots of one vault at the same time must not overwrite each other.
test("concurrent saves to different slots keep both", async () => {
  const srv = createServer({ dir: fs.mkdtempSync(path.join(os.tmpdir(), "vault-")) });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  const id = "a".repeat(64), h = { authorization: "Bearer t", "content-type": "application/json" };
  await fetch(`${base}/v1/vaults/${id}`, { method: "PUT", headers: h });
  // the body arrives late, so the two requests overlap while the server waits for it
  const put = (slot, delay) => new Promise((resolve) => {
    const body = JSON.stringify({ format: 1, gameId: "g", slot, savedAt: "x" });
    const req = http.request(`${base}/v1/vaults/${id}/saves/g/${slot}`, { method: "PUT", headers: { ...h, "if-match": "0", "content-length": Buffer.byteLength(body) } },
      (r) => { r.resume(); r.on("end", () => resolve(r.statusCode)); });
    req.write(body.slice(0, 5)); setTimeout(() => req.end(body.slice(5)), delay);
  });
  try {
    assert.deepEqual(await Promise.all([put("s1", 50), put("s2", 80)]), [200, 200]);
    const list = await (await fetch(`${base}/v1/vaults/${id}/saves`, { headers: h })).json();
    assert.equal(list.saves.length, 2);
  } finally { srv.close(); }
});
