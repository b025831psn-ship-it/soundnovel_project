import { Screen } from "./src/screen.js";
import { Assets, SceneLoader } from "./src/scene.js";
import { NativeFont, TextWindow } from "./src/font.js";
import { GBAInput } from "./src/input.js";
import { VM } from "./src/vm.js";
import { PageText } from "./src/page-text.js";
import { Boot, KEY } from "./src/boot.js";
import { createSound } from "./sound/output.js";
import { Silhouettes } from "./src/silhouette.js";
import { openBooks } from "./src/books-store.js";

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
scene.silhouettes = await Silhouettes.load(assets);
const text = new TextWindow({ 1: "透", 2: "真理" });
const input = new GBAInput();
// Opcode 57 lists (A/B rows over the story) are drawn by the screen; opcode 13 menus (welcome
// screen) put their labels under the story text, which PageText keeps drawing.
const choiceView = {
  show: (choices, selected) => {
    if (vm.choiceState?.opcode === 0x13) page.showMenu(choices, selected, vm.choiceState.entries);
    else screen.showChoices(font, text.pageRaw, choices, selected);
  },
  hide: () => { page.hideMenu(); screen.clearChoices(); },
};
const entryRow = Number.parseInt(new URLSearchParams(location.search).get("entryRow") ?? "31000", 10);
const vm = new VM({ banks, scene, text, musicMap: music.request_to_song, audio: sound,
  audioTables, choiceView, transitionTimings,
  entryRow: Number.isInteger(entryRow) ? entryRow : 31000 });
const page = new PageText(screen, font, text);
// Opcode 1D's native screens (1D 00: logo, copyright, title menu, bookmarks; 1D 03/04: names).
// Bookmarks live in the shared SaveStore (IndexedDB), opened before the game starts.
const books = await openBooks();
const boot = await new Boot({ vm, screen, assets, font, sound: vm.sound, books }).load();
// The cartridge's loading pauses (black while a picture decodes or the flash is read) are cut
// in the web version; ?timing=original keeps them for frame comparisons with mGBA.
boot.originalLoadTiming = new URLSearchParams(location.search).get("timing") === "original";
vm.system = boot;
boot.onMenuClosed = () => { page.drawn = -1; screen.renderBackground(); };
text.nameBytes = boot.names; // names entered on 1D 03 / 1D 04 show up in the story text
// Touch and mouse: a tap on an item picks it (the cursor moves there as with the d-pad; a tap on
// the current item confirms). Taps elsewhere fall through to the shell, which presses A.
function tap(x, y) {
  if (vm.waiting === "boot") return boot.tap(x, y);
  if (vm.waiting !== "choice") return false;
  const rows = vm.choiceState?.opcode === 0x13 ? page.menuRows() : screen.choiceRows ?? [];
  const index = rows.findIndex(({ top, bottom }) => y >= top && y < bottom);
  if (index < 0) return true;
  if (index === vm.choiceSelection) vm.resume();
  else vm.moveChoice(index - vm.choiceSelection);
  return true;
}
const canvas = document.querySelector("#screen");
let tapA = false;
canvas.addEventListener("pointerdown", (event) => {
  const box = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - box.left) * 240) / box.width);
  const y = Math.floor(((event.clientY - box.top) * 160) / box.height);
  if (!tap(x, y)) {
    // A quick click can release before the next frame looks at the keys; count it once anyway.
    tapA = true;
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation(); // the shell's "tap = A" must not also fire
  sound.resume();
}, { capture: true });
// The player's menu icon (touch screens have no R key): the same as pressing R, taken on the next
// frame. `menuAvailable` and the "kamaitachi:menu" event (detail.available) tell the icon when R
// would open the menu: in the game proper, at a finished page waiting for A.
let menuRequested = false;
let menuAvailable = false;
const openMenu = () => { if (!menuAvailable) return false; menuRequested = true; sound.resume(); return true; };
window.kamaitachi = { vm, screen, assets, font, input, sound, page, boot, tap, openMenu,
  get menuAvailable() { return menuAvailable; } };

let last = performance.now();
let accumulated = 0;
const previous = new Set();
function loop(now) {
  accumulated += Math.min(100, now - last);
  last = now;
  while (accumulated >= 1000 / 60) {
    const pressed = (key) => (input.pressed(key) && !previous.has(key)) || (key === "A" && tapA);
    if (pressed("UP")) vm.moveChoice(-1);
    if (pressed("DOWN")) vm.moveChoice(1);
    // R at a page wait opens the in-game menu (0800C9xx): 移動, オプション, セーブ.
    if ((pressed("R") || menuRequested) && vm.waiting === "click" && !page.typing) boot.openMenu();
    menuRequested = false;
    if (pressed("A") && ((vm.waiting === "click" && !page.typing) || vm.waiting === "choice")) vm.resume();
    // KEYINPUT bits newly pressed this frame, for the native screens (020006E4).
    let trigger = 0;
    let held = 0;
    for (const key of Object.keys(KEY)) {
      if (pressed(key)) trigger |= KEY[key];
      if (input.pressed(key)) held |= KEY[key];
    }
    vm.vblank();
    boot.vblank();
    if (vm.waiting === "boot") boot.frame(trigger, held);
    else page.frame(Boolean(screen.choiceOverlay));
    for (const key of Object.keys(KEY)) {
      if (input.pressed(key) || (key === "A" && tapA)) previous.add(key); else previous.delete(key);
    }
    tapA = false;
    const available = Boolean(vm.ram.inGame) && vm.waiting === "click" && !page.typing && !boot.active;
    if (available !== menuAvailable) {
      menuAvailable = available;
      window.dispatchEvent(new CustomEvent("kamaitachi:menu", { detail: { available } }));
    }
    accumulated -= 1000 / 60;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
