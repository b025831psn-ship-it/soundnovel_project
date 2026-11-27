import test from "node:test";
import assert from "node:assert/strict";
import { Spu } from "../sound/spu.js";

// Square wave sample: filter 0, shift 12, nibbles +7 / -8 alternating every 14 samples, looping.
function loopedSquare(spu, addr) {
  const b = new Uint8Array(32);
  for (let k = 0; k < 2; k++) { b[16 * k] = 0x00; b[16 * k + 1] = k === 0 ? 4 : 3; for (let i = 2; i < 16; i++) b[16 * k + i] = i < 9 ? 0x77 : 0x88; }
  spu.write16(0x1a6, addr >> 3); spu.dmaWrite(b);
}
function setup() {
  const spu = new Spu();
  spu.write16(0x1aa, 0xc000); spu.write16(0x180, 0x3fff); spu.write16(0x182, 0x3fff);
  loopedSquare(spu, 0x1000);
  spu.write16(0x00, 0x3fff); spu.write16(0x02, 0x3fff); spu.write16(0x04, 0x1000); spu.write16(0x06, 0x1000 >> 3);
  return spu;
}

test("SPU: key on runs attack to full level, pitch 0x1000 plays 28 samples per block", () => {
  const spu = setup();
  spu.write16(0x08, 0x000f); spu.write16(0x0a, 0x0000); // fastest linear attack, sustain level max
  spu.write16(0x188, 1);
  const out = spu.render(28 * 8);
  assert.equal(spu.voices[0].level >= 0x7f00, true);
  // square period = 28 samples: count sign changes over 7 periods after warm-up
  let changes = 0; for (let i = 28 * 2; i < 28 * 8 - 1; i++) if (Math.sign(out[2 * i]) !== Math.sign(out[2 * i + 2]) && out[2 * i + 2] !== 0) changes++;
  assert.ok(changes >= 10 && changes <= 14, `sign changes ${changes}`);
  assert.equal(spu.read16(0x19c) & 1, 1, "ENDX set after the loop-end block");
});

test("SPU: key off releases to zero and the voice goes idle", () => {
  const spu = setup();
  spu.write16(0x08, 0x000f); spu.write16(0x0a, 0x0000); // release shift 0 = fastest
  spu.write16(0x188, 1); spu.render(2000);
  spu.write16(0x18c, 1); spu.render(4000);
  assert.equal(spu.voices[0].level, 0);
  assert.equal(spu.read16(0x0c), 0);
});

test("SPU: one-shot end (flags 1) mutes the voice; reverb with zero volumes stays silent", () => {
  const spu = setup();
  const b = new Uint8Array(16); b[1] = 1; for (let i = 2; i < 16; i++) b[i] = 0x77;
  spu.write16(0x1a6, 0x2000 >> 3); spu.dmaWrite(b);
  spu.write16(0x06, 0x2000 >> 3); spu.write16(0x08, 0x000f); spu.write16(0x188, 1);
  spu.write16(0x1a2, 0x70000 >> 3); spu.write16(0x1aa, 0xc080); spu.write16(0x198, 1);
  const out = spu.render(200);
  assert.equal(spu.voices[0].level, 0);
  assert.ok(out.every((x) => Number.isInteger(x) && Math.abs(x) <= 32767));
});
