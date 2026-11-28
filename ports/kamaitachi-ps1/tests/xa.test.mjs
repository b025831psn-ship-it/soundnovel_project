import test from "node:test";
import assert from "node:assert/strict";
import { decodeSector, XaStream, memorySource, XA_BYTES } from "../src/xa.js";
import { LibCd } from "../src/libcd.js";

// One sector whose groups all use filter 1 (K0 = 60) and shift 12 on the left units, every nibble 1.
function sector() {
  const b = new Uint8Array(XA_BYTES);
  for (let g = 0; g < 18; g++) {
    for (let u = 0; u < 8; u++) b[g * 128 + 4 + u] = u & 1 ? 0x00 : 0x1c; // right: filter 0, shift 0 -> nibble << 12
    for (let w = 0; w < 28; w++) for (let k = 0; k < 4; k++) b[g * 128 + 16 + w * 4 + k] = 0x11;
  }
  return b;
}

test("XA ADPCM: 4-bit stereo units, the filter on the previous samples", () => {
  const { left, right } = decodeSector(sector());
  assert.equal(left.length, 2016); assert.equal(right.length, 2016);
  assert.equal(right[0], 4096); // nibble 1 << 12, shift 0, filter 0
  // left: (1 << 12) >> 12 = 1 plus (s1 * 60 + 32) >> 6
  let s1 = 0; const want = [];
  for (let i = 0; i < 4; i++) { s1 = 1 + ((s1 * 60 + 32) >> 6); want.push(s1); }
  assert.deepEqual([...left.subarray(0, 4)], want);
});

test("libcd: Setfilter, Setmode (XA) and ReadS on PINK.XA start the stream; Stop ends it", () => {
  const ram = new Map(), m = { read: (a, w) => { let v = 0; for (let k = 0; k < w; k++) v |= (ram.get(a + k) ?? 0) << (8 * k); return v >>> 0; }, write: (a, v, w) => { for (let k = 0; k < w; k++) ram.set(a + k, (v >>> (8 * k)) & 0xff); } };
  const data = new Uint8Array(XA_BYTES * 4); data.set(sector(), XA_BYTES * 2);
  const xa = new XaStream(() => memorySource(data)), cd = new LibCd({ m, xa });
  const name = 0x1000; [..."\\PINK.XA;1"].forEach((c, i) => m.write(name + i, c.charCodeAt(0), 1));
  assert.ok(cd.CdSearchFile(0x2000, name));
  cd.CdIntToPos(cd.CdPosToInt(0x2000) + 16, 0x2000); // file sector 16 = channel 0's third sector
  m.write(0x3000, 1, 1); m.write(0x3001, 0, 1); cd.CdControlB(0x0d, 0x3000, 0);
  m.write(0x3004, 0xc9, 1); cd.CdControlB(0x0e, 0x3004, 0);
  cd.CdControlB(0x1b, 0x2000, 0);
  assert.equal(xa.playing, true); assert.equal(xa.pos, 2);
  m.write(0x80001000, 0x80, 1); m.write(0x80001001, 0, 1); m.write(0x80001002, 0x80, 1); m.write(0x80001003, 0, 1);
  cd.CdFlush(0x80001000); assert.deepEqual(xa.mixAtt, [0x80, 0, 0x80, 0]);
  const block = new Int16Array(735 * 2); xa.mix(block);
  assert.ok(block.some((v) => v !== 0));
  cd.CdControlB(8, 0, 0); assert.equal(xa.playing, false);
});
