import fs from "node:fs";
import { composeGbaFrame } from "../src/gba-compositor.js";

if (process.argv.length !== 7) {
  console.error("usage: node compose-native-dump.mjs state.json vram.bin palette.bin oam.bin output.ppm");
  process.exit(2);
}
const [statePath, vramPath, palettePath, oamPath, outputPath] = process.argv.slice(2);
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const pixels = composeGbaFrame({
  ...state,
  vram: fs.readFileSync(vramPath),
  palette: fs.readFileSync(palettePath),
  oam: fs.readFileSync(oamPath),
});
fs.writeFileSync(outputPath, Buffer.concat([
  Buffer.from("P6\n240 160\n255\n"), Buffer.from(pixels),
]));
