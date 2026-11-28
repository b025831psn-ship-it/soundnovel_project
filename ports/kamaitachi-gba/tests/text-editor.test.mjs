import test from "node:test";
import assert from "node:assert/strict";
import { TextCodec } from "../src/text-editor.js";

const font = { find: () => 0 }; // every glyph present

test("dialogue editor: Korean run -> box text -> the same bytes", () => {
  const codec = new TextCodec("ko", font);
  // 「가 나」 r p n1 C4 : EUC-KR A1B8 B0A1 A1A1 B3AA A1B9, then codes
  const raw = Uint8Array.from([0xa1, 0xb8, 0xb0, 0xa1, 0xa1, 0xa1, 0xb3, 0xaa, 0xa1, 0xb9, 0x72, 0x70, 0x6e, 0x31, 0x43, 0x34]);
  const text = codec.decode(raw);
  assert.equal(text, "「가 나」{r}\n{p}{n1}{C4}");
  assert.deepEqual([...codec.encode(text).bytes], [...raw]);
});

test("dialogue editor: plain spaces and digits become full-width; unknown characters are reported", () => {
  const codec = new TextCodec("ko", font);
  const result = codec.encode("가 1{p}😀");
  assert.deepEqual([...result.bytes], [0xb0, 0xa1, 0xa1, 0xa1, 0xa3, 0xb1, 0x70]);
  assert.deepEqual(result.unknown, ["\ud83d", "\ude00"]);
});

test("dialogue editor: Japanese runs round-trip through Shift JIS", () => {
  const codec = new TextCodec("ja", font);
  const raw = Uint8Array.from([0x82, 0xa0, 0x81, 0x42, 0x6f, 0x72, 0x70, 0x67]);
  assert.equal(codec.decode(raw), "あ。{o}{r}\n{p}{g}\n");
  assert.deepEqual([...codec.encode(codec.decode(raw)).bytes], [...raw]);
});
