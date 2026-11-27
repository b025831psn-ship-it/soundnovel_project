// The Korean script patch (src/ko.js) on hand-written data: no game data is needed.
import test from "node:test";
import assert from "node:assert/strict";
import { patchResource, patchScePac, SCRIPT_LIMIT } from "../src/ko.js";

const b64 = (bytes) => Buffer.from(bytes).toString("base64");
// two records: [op 0x00 text "AB" 'r' 0] [op 0x05 x, op 0x00 text 0, op 0x07]
function resource() {
  const r0 = [0x00, 0x82, 0xa0, 0x82, 0xa2, 0x72, 0x00], r1 = [0x05, 0x01, 0x00, 0x82, 0xa4, 0x70, 0x00, 0x07];
  const b = new Uint8Array(4 + r0.length + r1.length); b.set([4, 0, 4 + r0.length, 0]); b.set(r0, 4); b.set(r1, 4 + r0.length);
  return b;
}

test("ko: text payloads are replaced and the record offsets follow", () => {
  const out = patchResource(resource(), [[0, 0, b64([0xa0, 0x80, 0x20, 0xa0, 0x81, 0xa0, 0x82, 0x72])], [1, 2, b64([0xa0, 0x83])]]);
  assert.deepEqual([...out], [4, 0, 14, 0, 0x00, 0xa0, 0x80, 0x20, 0xa0, 0x81, 0xa0, 0x82, 0x72, 0x00, 0x05, 0x01, 0x00, 0xa0, 0x83, 0x00, 0x07]);
});

test("ko: a record without translations stays as it is", () => {
  const out = patchResource(resource(), [[1, 2, b64([0xa0, 0x83, 0x70])]]);
  assert.deepEqual([...out.subarray(4, 11)], [0x00, 0x82, 0xa0, 0x82, 0xa2, 0x72, 0x00]);
});

test("ko: an offset that is not a text command is refused, and so is a resource over the script buffer", () => {
  assert.throws(() => patchResource(resource(), [[1, 0, b64([0xa0, 0x80])]]), /no text command/);
  assert.throws(() => patchResource(resource(), [[0, 0, b64(new Uint8Array(SCRIPT_LIMIT).fill(0xa0))]]), /over the script buffer/);
});

test("ko: SCE.PAC is rebuilt with every member at a sector boundary", () => {
  const pac = new Uint8Array(3 * 2048); pac.set([7, 0, 1, 0, 9, 0, 2, 0, 0xff, 0xff, 3, 0]);
  pac.set(resource(), 2048); pac.set(resource(), 4096);
  const out = patchScePac(pac, { resources: { 9: [[0, 0, b64([0xa0, 0x80])]] } });
  assert.deepEqual([...out.subarray(0, 12)], [7, 0, 1, 0, 9, 0, 2, 0, 0xff, 0xff, 3, 0]);
  assert.deepEqual([...out.subarray(2048, 2048 + 11)], [...resource().subarray(0, 11)]);
  assert.deepEqual([...out.subarray(4096, 4096 + 8)], [4, 0, 8, 0, 0x00, 0xa0, 0x80, 0x00]);
});

// The particle after an inserted name (src/text/josa.js)
import { josa } from "../src/text/josa.js";
test("ko: the particle after a name follows the name's last syllable", () => {
  const chars = "토루준철는은가이를을와과랑라면로으야아였었예에요다나말,!", code = (i) => 0xa080 + i;
  const j = { char: new Map(), code: new Map(), join: new Set() };
  [...chars].forEach((ch, i) => { j.char.set(code(i), ch); j.code.set(ch, code(i)); });
  const m = { ko: { josa: j } }, c = (ch) => j.code.get(ch) ?? 0;
  const run = (name, text) => { const g = [...text].map(c), r = josa(m, c([...name].pop()), g[0], g[1] ?? 0); return r ? [...text].slice(0, 0).concat(r.emit.map((x) => j.char.get(x))).join("") + [...text].slice(r.skip).join("") : text; };
  for (const [name, text, want] of [
    ["토루", "는", "는"], ["준", "는", "은"], ["준", "가", "이"], ["준", "를", "을"], ["준", "와", "과"], ["토루", "과", "와"], ["토루", "은", "는"],
    ["준", "랑", "이랑"], ["토루", "이랑", "랑"], ["준", "라면", "이라면"], ["준", "로", "으로"], ["철", "로", "로"], ["토루", "으로", "로"],
    ["준", "야,", "아,"], ["준", "야", "이야"], ["준", "야말", "이야말"], ["준", "였다", "이었다"], ["토루", "이었다", "였다"], ["준", "예요", "이에요"], ["토루", "이에요", "예요"],
    ["준", "다", "이다"], ["준", "다나", "다나"], ["토루", "이", "가"], ["토루", "아!", "야!"], ["준", "말", "말"],
  ]) assert.equal(run(name, text), want, `${name} + ${text}`);
  assert.equal(josa(m, 0x82f1, c("는"), 0).emit[0], c("은")); // a kana name ending in ん
  assert.equal(josa(m, 0x82a0, c("는"), 0), null);
});
