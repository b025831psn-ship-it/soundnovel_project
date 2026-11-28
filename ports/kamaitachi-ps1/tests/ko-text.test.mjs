// The Korean text module shared by the game (the owner's edits) and the admin page.
import test from "node:test";
import assert from "node:assert/strict";
import { koCodec, koCode, toParts, fromParts, locked, applyEdits, layout, LEFT } from "../src/ko-text.js";

const script = () => ({ chars: "가나다라 ", orig: { chars: "「」あ", codes: [0x8175, 0x8176, 0x82a0] }, resources: { 27: [[3, 32, "AAAA"], [3, 40, "BBBB"]] } });

test("text is encoded as the build encodes it", () => {
  const { encode } = koCodec(script());
  const r = encode("가 나[r]「あ」[n1][c4][p]");
  assert.deepEqual([...r.bytes], [koCode(0) >> 8, koCode(0) & 0xff, 0x20, koCode(1) >> 8, koCode(1) & 0xff, 0x72, 0x81, 0x75, 0x82, 0xa0, 0x81, 0x76, 0x6e, 0x31, 0x63, 0x34, 0x70]);
  assert.deepEqual(encode("가힣").missing, ["힣"]);
  assert.deepEqual(encode("가[zz]").bad, ["[zz]"]);
});

test("the editor's form shows a break only where the game breaks the line", () => {
  const text = "가나 다[r]「라[r]가」[o]나[r][p]다[r]라[n1]가[p][g]";
  const parts = toParts(text, {});
  assert.deepEqual(parts.filter((p) => p.br).length, 2);                       // the [r] inside 「」 and after [o] are chips
  assert.deepEqual(parts.filter((p) => p.chip).map((p) => p.chip), ["[r]", "[o]", "[r]", "[p]", "[n1]", "[p]", "[g]"]);
  assert.equal(fromParts(parts, {}), text);
});

test("a break typed inside a quotation becomes [@], which always breaks", () => {
  const parts = [{ text: "「가" }, { br: true }, { text: "나」" }, { br: true }, { text: "다" }];
  assert.equal(fromParts(parts, {}), "「가[@]나」[r]다");
  assert.deepEqual(locked("「가[@]나」[r]다[p]"), ["[p]"]);
});

test("brackets typed as text never become codes", () => {
  assert.equal(fromParts([{ text: "가[p]나" }], {}), "가［p］나");
});

test("edits replace the piece's bytes; an edit that cannot be typed is left out", () => {
  const s = script(), { applied, skipped } = applyEdits(s, { "027-003-0032": { ko: "가 나" }, "027-003-0040": { ko: "힣" }, "099-000-0000": { ko: "가" } });
  assert.deepEqual(applied, ["027-003-0032"]); assert.deepEqual(skipped, ["027-003-0040", "099-000-0000"]);
  assert.equal(s.resources[27][1][2], "BBBB");
  assert.deepEqual([...Uint8Array.from(atob(s.resources[27][0][2]), (c) => c.charCodeAt(0))], [koCode(0) >> 8, koCode(0) & 0xff, 0x20, koCode(1) >> 8, koCode(1) & 0xff]);
});

test("layout: a space counts only after a glyph, a word that does not fit goes to the next line", () => {
  const { encode } = koCodec(script()), env = { width: () => 14, space: 6, hang: new Set() };
  const one = layout([encode("가  나[r] 다").bytes], env)[0].lines;
  assert.deepEqual(one.map((l) => l.map((g) => g.x)), [[LEFT, LEFT + 15 + 6], [LEFT]]);
  const long = layout([encode("가".repeat(17) + " " + "나".repeat(4)).bytes], env)[0].lines;
  assert.equal(long.length, 2); assert.equal(long[1].length, 4);
});

test("offsets of a resource follow its replaced texts, both ways", async () => {
  const { resourceOffsets, patchResource } = await import("../src/ko.js");
  // two records: [0x00 text "AB" 0] [op 5] | [0x00 text "C" 0] [op 6, op 7]
  const res = Uint8Array.from([4, 0, 9, 0, 0, 0x82, 0xa0, 0, 5, 0, 0x82, 0xa2, 0, 6, 7]);
  const texts = [[0, 0, btoa("\x82\xa0\x82\xa0\x82\xa0")], [1, 0, btoa("")]];
  const map = resourceOffsets(res, texts), out = patchResource(res, texts);
  assert.equal(map.toNew(4), 4); assert.equal(map.toNew(7), 11); assert.equal(map.toNew(8), 12); assert.equal(map.toNew(13), 15);
  assert.equal(map.toNew(6), -1);                                   // inside the first text
  for (const old of [4, 5, 7, 8, 9, 12, 13, 14]) assert.equal(map.toOld(map.toNew(old)), old);
  assert.equal(out[map.toNew(8)], 5); assert.equal(out[map.toNew(13)], 6);
});
