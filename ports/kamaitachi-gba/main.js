import { Screen } from "./src/screen.js";
import { Assets, SceneLoader } from "./src/scene.js";
import { NativeFont, TextWindow } from "./src/font.js";
import { GBAInput } from "./src/input.js";
import { VM } from "./src/vm.js";
import { PageText } from "./src/page-text.js";
import { Boot, KEY } from "./src/boot.js";
import { createSound } from "./sound/output.js";

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
const transitionTimings = await assets.json("scenario-timing.json");
// Browsers start audio only after a user gesture; until then m4a runs silently in the worklet.
const sound = await createSound(new URL(`${base}/sound/`, location.href));
for (const type of ["keydown", "pointerdown"]) addEventListener(type, () => sound.resume(), { once: true });
const screen = new Screen(document.querySelector("#screen"));
const scene = new SceneLoader(assets, screen);
const text = new TextWindow({ 1: "透", 2: "真理" });
const input = new GBAInput();
const choiceView = {
  show: (choices, selected) => screen.showChoices(font, text.pageRaw, choices, selected),
  hide: () => screen.clearChoices(),
};
const entryRow = Number.parseInt(new URLSearchParams(location.search).get("entryRow") ?? "31000", 10);
const vm = new VM({ banks, scene, text, musicMap: music.request_to_song, audio: sound,
  audioTables, choiceView, transitionTimings,
  entryRow: Number.isInteger(entryRow) ? entryRow : 31000 });
const page = new PageText(screen, font, text);
// Opcode 1D's native screens (1D 00: logo, copyright, title menu).
const boot = await new Boot({ vm, screen, assets, font, sound: vm.sound }).load();
vm.system = boot;
window.kamaitachi = { vm, screen, assets, font, input, sound, page, boot };

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
    if (pressed("A") && ((vm.waiting === "click" && !page.typing) || vm.waiting === "choice")) vm.resume();
    // KEYINPUT bits newly pressed this frame, for the native screens (020006E4).
    let trigger = 0;
    for (const key of Object.keys(KEY)) if (pressed(key)) trigger |= KEY[key];
    vm.vblank();
    if (vm.waiting === "boot") boot.frame(trigger);
    else page.frame(Boolean(screen.choiceOverlay));
    for (const key of Object.keys(KEY)) {
      if (input.pressed(key)) previous.add(key); else previous.delete(key);
    }
    accumulated -= 1000 / 60;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
