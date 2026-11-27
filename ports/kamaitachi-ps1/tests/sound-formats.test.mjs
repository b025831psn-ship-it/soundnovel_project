import test from "node:test";
import assert from "node:assert/strict";
import { decodeBlock, decodeSample } from "../sound/vag.js";
import { parseVabHead } from "../sound/vab.js";
import { parseSeqHeader, readSeqEvents } from "../sound/seq.js";

test("VAG block: filter 0, shift 12 gives raw nibbles", () => {
  const b = new Uint8Array(16); b[0] = 0x0c; b[2] = 0x71; // samples: 1, 7
  const out = new Int16Array(28); decodeBlock(b, 0, out, 0, [0, 0]);
  assert.equal(out[0], 1); assert.equal(out[1], 7);
});

test("VAG block: filter 1 accumulates history (60/64)", () => {
  const b = new Uint8Array(16); b[0] = 0x10 | 0x0c; b[2] = 0x01;
  const out = new Int16Array(28); decodeBlock(b, 0, out, 0, [640, 0]);
  assert.equal(out[0], 1 + ((640 * 60 + 32) >> 6));
});

test("VAG sample stops at loop-end flag and reports repeat", () => {
  const b = new Uint8Array(48); b[16 + 1] = 4; b[32 + 1] = 3;
  const r = decodeSample(b, 0);
  assert.equal(r.blocks, 3); assert.equal(r.loopStart, 28); assert.equal(r.repeats, true);
});

test("VAB head: one program, one tone, one VAG", () => {
  const b = new Uint8Array(32 + 128 * 16 + 16 * 32 + 512);
  b.set([0x70, 0x42, 0x41, 0x56, 7]); b[18] = 1; b[20] = 1; b[22] = 1; b[24] = 0x7f;
  b[32] = 1; // program 0 has one tone
  const tone = 32 + 128 * 16; b[tone + 4] = 60; b[tone + 22] = 1; b[tone + 16] = 0xff;
  const table = tone + 16 * 32; b[table + 2] = 4; // VAG 1 = 32 bytes
  const h = parseVabHead(b);
  assert.equal(h.programs[0].toneList.length, 1);
  assert.equal(h.programs[0].toneList[0].center, 60);
  assert.equal(h.programs[0].toneList[0].vag, 1);
  assert.equal(h.vagSizes[1], 32); assert.equal(h.bodySize, 32);
});

test("SEQ header is big-endian and events use running status", () => {
  const b = new Uint8Array([0x70, 0x51, 0x45, 0x53, 0, 0, 0, 1, 0x01, 0xe0, 0x07, 0xa1, 0x20, 4, 2,
    0x00, 0x90, 60, 100, 0x60, 60, 0, 0x00, 0xff, 0x2f, 0x00]);
  const h = parseSeqHeader(b);
  assert.deepEqual([h.version, h.resolution, h.tempo], [1, 480, 500000]);
  const { events } = readSeqEvents(b, h);
  assert.deepEqual(events.map((e) => [e.tick, e.type, e.a, e.b]), [[0, "on", 60, 100], [96, "on", 60, 0], [96, "end", undefined, undefined]]);
});
