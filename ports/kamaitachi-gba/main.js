import { Screen } from "./src/screen.js";
import { Assets, SceneLoader } from "./src/scene.js";
import { NativeFont, TextWindow } from "./src/font.js";
import { GBAInput } from "./src/input.js";
import { VM } from "./src/vm.js";
import { createSound } from "./sound/output.js";
import { DisplayAdapter } from "./display/adapter.js";

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
const audioTables = await assets.json("sound/scene-audio.json");
audioTables.effectBytes = await assets.bin("sound/effects.bin");
// Browsers start audio only after a user gesture; until then m4a runs silently in the worklet.
const sound = await createSound(new URL(`${base}/sound/`, location.href));
for (const type of ["keydown", "pointerdown"]) addEventListener(type, () => sound.resume(), { once: true });
const sourceCanvas = document.querySelector("#screen");
const screen = new Screen(sourceCanvas);
const modeSelect = document.querySelector("#display-mode");
const displayKey = "soundnovel.kamaitachiGba.displayMode";
let savedDisplayMode = "native";
try { savedDisplayMode = localStorage.getItem(displayKey) || savedDisplayMode; } catch { /* blocked storage */ }
const display = new DisplayAdapter(sourceCanvas, document.querySelector("#display"), savedDisplayMode);
modeSelect.value = display.mode;
modeSelect.addEventListener("change", () => {
  modeSelect.value = display.setMode(modeSelect.value);
  try { localStorage.setItem(displayKey, display.mode); } catch { /* blocked storage */ }
  display.render();
});
const scene = new SceneLoader(assets, screen);
const text = new TextWindow({ 1: "透", 2: "真理" });
const input = new GBAInput();
const choiceView = {
  show: (choices, selected) => screen.showChoices(font, text.pageRaw, choices, selected),
  hide: () => screen.clearChoices(),
};
const vm = new VM({ banks, scene, text, musicMap: music.request_to_song, audio: sound, audioTables, choiceView });
window.kamaitachi = { vm, screen, display, assets, font, input, sound };

let last = performance.now();
let accumulated = 0;
const previous = new Set();
function loop(now) {
  accumulated += Math.min(100, now - last);
  last = now;
  while (accumulated >= 1000 / 60) {
    const pressed = (key) => input.pressed(key) && !previous.has(key);
    if (pressed("UP")) vm.moveChoice(-1);
    if (pressed("DOWN")) vm.moveChoice(1);
    if (pressed("A") && (vm.waiting === "click" || vm.waiting === "choice")) vm.resume();
    vm.vblank();
    for (const key of ["A", "UP", "DOWN"]) {
      if (input.pressed(key)) previous.add(key); else previous.delete(key);
    }
    accumulated -= 1000 / 60;
  }
  display.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
