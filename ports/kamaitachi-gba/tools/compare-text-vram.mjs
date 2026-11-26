import fs from "node:fs";
import path from "node:path";
import { NativeFont, TextWindow } from "../src/font.js";
import { ObjTextSurface } from "../src/obj-text.js";
import { VM } from "../src/vm.js";

if (process.argv.length !== 4) {
  console.error("usage: node compare-text-vram.mjs port-data native-vram.bin");
  process.exit(2);
}
const [base, nativePath] = process.argv.slice(2), banks = {};
for (const name of fs.readdirSync(path.join(base, "scenario")))
  banks[Number.parseInt(name.slice(0, 2), 16)] = fs.readFileSync(path.join(base, "scenario", name));
const font = new NativeFont(
  fs.readFileSync(path.join(base, "font/glyphs.bin")),
  fs.readFileSync(path.join(base, "font/lookup.bin")),
);
const text = new TextWindow(), vm = new VM({ banks, text });
for (let frame = 0; frame < 5000 && !vm.halted; frame++) {
  if (vm.waiting === "click") vm.resume();
  if (vm.waiting === "choice") break;
  vm.vblank();
}
const actual = new ObjTextSurface().choices(font, text.pageRaw, text.choiceRaw, 0).objCharblock();
// The 12 native OBJ entries cover 4×64 px in the first two rows and
// 4×64×32 px in the last row: tiles 0..639, exactly 0x5000 bytes.
const native = fs.readFileSync(nativePath).subarray(0x10000, 0x15000);
const compared = actual.subarray(0, native.length);
let equal = 0, first = null;
for (let at = 0; at < compared.length; at++) {
  if (compared[at] === native[at]) equal++;
  else if (!first) {
    const tile = Math.floor(at / 32), within = at % 32;
    first = { byte: at, tile, tile_x: tile % 32, tile_y: Math.floor(tile / 32),
      pixel_x: (tile % 32) * 8 + 2 * (within % 4),
      pixel_y: Math.floor(tile / 32) * 8 + Math.floor(within / 4),
      expected: native[at], actual: actual[at] };
  }
}
console.log(JSON.stringify({ equal, total: compared.length, first_mismatch: first }));
process.exitCode = equal === compared.length ? 0 : 1;
