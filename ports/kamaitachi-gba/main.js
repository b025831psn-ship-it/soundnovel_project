import { Screen } from "./src/screen.js";
import { Assets, SceneLoader } from "./src/scene.js";
import { NativeFont, TextWindow } from "./src/font.js";
import { GBAInput } from "./src/input.js";
import { VM } from "./src/vm.js";

const base = "../../kamaitachi-gba-kor/port-data";
const assets = new Assets(base);
const manifest = await assets.json("manifest.json");
const bankPaths = manifest.files.filter((file) =>
  file.path.startsWith("scenario/"),
);
const banks = {};
for (const file of bankPaths) {
  const bank = Number.parseInt(file.path.slice(-6, -4), 16);
  banks[bank] = await assets.bin(file.path);
}
const font = new NativeFont(
  await assets.bin("font/glyphs.bin"),
  await assets.bin("font/lookup.bin"),
);
const music = await assets.json("sound/scenario-map.json");
const screen = new Screen(document.querySelector("#screen"));
const scene = new SceneLoader(assets, screen);
const text = new TextWindow({ 1: "透", 2: "真理" });
const input = new GBAInput();
const vm = new VM({ banks, scene, text, musicMap: music.request_to_song });
window.kamaitachi = { vm, screen, assets, font, input };

let last = performance.now();
let accumulated = 0;
function loop(now) {
  accumulated += Math.min(100, now - last);
  last = now;
  while (accumulated >= 1000 / 60) {
    if (
      input.pressed("A") &&
      (vm.waiting === "click" || vm.waiting === "choice")
    )
      vm.resume();
    vm.vblank();
    accumulated -= 1000 / 60;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
