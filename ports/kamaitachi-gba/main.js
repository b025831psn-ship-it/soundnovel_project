import { Screen } from "./src/screen.js";
import { Assets, SceneLoader } from "./src/scene.js";
import { NativeFont, TextWindow } from "./src/font.js";
import { GBAInput } from "./src/input.js";
import { VM, textKey } from "./src/vm.js";
import { PageText } from "./src/page-text.js";
import { Boot, KEY } from "./src/boot.js";
import { createSound } from "./sound/output.js";
import { Silhouettes } from "./src/silhouette.js";
import { openBooks } from "./src/books-store.js";
import { restoreData, restorePosition } from "./src/save.js";
import { TextEdits, TextCodec, openTextEditor, untranslated } from "./src/text-editor.js";
import { openScenePanel, replayTo } from "./src/debug-jump.js";

const base = "../../kamaitachi-gba-kor/port-data";
const KOREAN = "../../kamaitachi-gba-kor/port-data-ko";
// Text language. Only the original Japanese for now: the Korean fan-patch data (kgk port-data-ko)
// was removed on 2026-11-27 (태우) and a new translation will come in its place. The "ko" paths
// below stay unused until then; setLanguage() refuses anything outside LANGUAGES.
const LANGUAGE_KEY = "kamaitachi-gba.lang";
const LANGUAGES = ["ja"];
function storedLanguage() {
  try { return localStorage.getItem(LANGUAGE_KEY); } catch { return null; }
}
let language = new URLSearchParams(location.search).get("lang") ?? storedLanguage() ?? "ja";
if (!LANGUAGES.includes(language)) language = "ja";
try { localStorage.setItem(LANGUAGE_KEY, language); } catch {}
function languageAssets(lang) {
  const result = new Assets(base);
  if (lang === "ko") result.overlay(KOREAN, (path) =>
    /^(manifest\.json|scenario\/|font\/|ui\/(flow-map|option-text|name-table|map-titles|system-text|default-names)\.bin|text-edits\.json)/.test(path));
  return result;
}
// The scenario banks and the font of one language.
async function languageData(lang) {
  const from = languageAssets(lang);
  const manifest = await from.json("manifest.json");
  const banks = {};
  const files = manifest.files.filter((entry) => entry.path.startsWith("scenario/"));
  const [glyphs, lookup, ...bytes] = await Promise.all([from.bin("font/glyphs.bin"), from.bin("font/lookup.bin"),
    ...files.map((file) => from.bin(file.path))]);
  files.forEach((file, i) => { banks[Number.parseInt(file.path.slice(-6, -4), 16)] = bytes[i]; });
  return { assets: from, banks, glyphs, lookup };
}
const assets = languageAssets(language);
// Everything the start needs is fetched at once (each request is a round trip over the tunnel).
const [first, music, audioTables, effectBytes, transitionTimings, sound] = await Promise.all([
  languageData(language),
  assets.json("sound/scenario-map.json"),
  assets.json("sound/scene-audio.json"),
  assets.bin("sound/effects.bin"),
  assets.json("scenario-timing.json"),
  // Browsers start audio only after a user gesture; until then m4a runs silently in the worklet.
  createSound(new URL(`${base}/sound/`, location.href)),
]);
audioTables.effectBytes = effectBytes;
const banks = first.banks;
const font = new NativeFont(first.glyphs, first.lookup);
for (const type of ["keydown", "pointerdown"]) addEventListener(type, () => sound.resume(), { once: true });
const screen = new Screen(document.querySelector("#screen"));
const scene = new SceneLoader(assets, screen);
// Where in the script the picture on screen was asked for ("bb:oooo" of the 04/05 opcode, like the
// text editor's keys; the opcode's word has just been read when it calls the loader). A debug jump
// sets it from the replay; the debug scene list marks the current one with it.
let sceneSite = null;
{
  const request = scene.request.bind(scene);
  scene.request = (argument, ram, mode) => {
    sceneSite = textKey(vm.bank, vm.offset - 3);
    return request(argument, ram, mode);
  };
}
// The silhouette pictures (2 MB) are first needed in the story, so the title does not wait for them.
Silhouettes.load(assets).then((loaded) => { scene.silhouettes = loaded; }).catch(() => {});
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
// The shell's save dialog (sync-ui.js) reaches the store and the title through this.
globalThis.soundnovelSave = { store: books.store, boot, gameId: "kamaitachi-gba" };
globalThis.dispatchEvent?.(new Event("soundnovel-save-ready"));
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
// Switches the text language in place. In the story the page being read starts over in the other
// language: its start is paired through kgk port-data-ko/scenario-align.json (the Korean patch
// splits some text runs), and the RAM goes back to what it was at that page start.
let alignment = null;
function pairedOffset(bank, offset, from, to) {
  const pairs = alignment?.[bank.toString(16).padStart(2, "0")];
  if (!pairs?.length) return null;
  const a = from === "ja" ? 0 : 1;
  let low = 0, high = pairs.length - 1, found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (pairs[mid][a] <= offset) { found = mid; low = mid + 1; } else high = mid - 1;
  }
  return found < 0 ? null : pairs[found][1 - a];
}
let switching = false;
async function setLanguage(next) {
  if (!LANGUAGES.includes(next) || next === language || switching) return false;
  switching = true;
  try {
    const data = await languageData(next);
    alignment ??= await new Assets(KOREAN).json("scenario-align.json").catch(() => ({}));
    const start = boot.pageStart;
    const offset = start ? pairedOffset(start.bank, start.offset, language, next) : null;
    font.replace(data.glyphs, data.lookup);
    vm.banks = data.banks;
    vm.rows = vm.indexRows(data.banks);
    await boot.loadText(data.assets);
    if (start && offset !== null && vm.ram.inGame && !boot.run && ["click", "choice", "none"].includes(vm.waiting)) {
      vm.textEdits = null; // the other language's edits; its own are loaded below
      restoreData(vm, start);
      restorePosition(vm, { bank: start.bank, offset });
      text.clearPage();
      page.hideMenu();
      screen.clearChoices();
      boot.pageStart = null;
    }
    page.drawn = -1;
    screen.renderBackground();
    language = next;
    window.kamaitachi.language = next;
    await loadTextEdits();
    try { localStorage.setItem(LANGUAGE_KEY, next); } catch {}
    const url = new URL(location.href);
    url.searchParams.set("lang", next);
    history.replaceState(history.state, "", url.href);
    window.dispatchEvent(new CustomEvent("kamaitachi:language", { detail: { language: next } }));
    return true;
  } finally {
    switching = false;
  }
}
// The dialogue editor (src/text-editor.js): the language's text-edits.json in the game data (kgk
// port-data, port-data-ko) replaces text runs as they are shown, the same on every device. E on a keyboard, or the shell's button, opens it on the page being read.
let textEdits = null;
async function loadTextEdits() {
  textEdits = await new TextEdits(language).load(languageAssets(language));
  vm.textEdits = textEdits.map();
}
await loadTextEdits();
// The page being read starts over from its start (RAM as it was there), now with the edits.
function restartPage() {
  const start = boot.pageStart;
  if (!start || !vm.ram.inGame || boot.run || !["click", "choice", "none"].includes(vm.waiting)) return false;
  restoreData(vm, start);
  restorePosition(vm, start);
  text.clearPage();
  page.hideMenu();
  screen.clearChoices();
  boot.pageStart = null;
  page.drawn = -1;
  screen.renderBackground();
  return true;
}
function openDialogueEditor() {
  if (document.querySelector(".te-back")) return false;
  openTextEditor({ vm, font, language, textEdits, restartPage });
  return true;
}
addEventListener("keydown", (event) => {
  if (event.code !== "KeyE" || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (openDialogueEditor()) event.preventDefault(); // the E itself must not land in the box
});
// Debug mode (?debug=1, not shown to beta visitors): a list of every scene from the language's
// debug-scenes.json (tools/scene-index.mjs, git-ignored) and a jump to any of them.
const debugMode = new URLSearchParams(location.search).get("debug") === "1";
let debugScenes = null;
function debugJump(target) {
  const entry = typeof target === "string" ? debugScenes?.find((scene) => scene.site === target) : target;
  if (!entry) return false;
  const state = replayTo(vm.banks, entry, { names: boot.names });
  if (!state) return false;
  text.clearPage();
  page.hideMenu();
  screen.clearChoices();
  boot.debugJump(state);
  sceneSite = state.sceneSite ?? entry.site;
  page.drawn = -1;
  return true;
}
if (debugMode) {
  const codec = new TextCodec(language, font);
  const japanese = new TextCodec("ja", { find: () => 0 });
  debugScenes = (await languageAssets(language).json("debug-scenes.json").catch(() => null))?.scenes ?? [];
  openScenePanel({
    scenes: debugScenes,
    decode: (hex) => {
      const raw = Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16));
      if (language === "ko" && untranslated(raw)) return `[미번역] ${japanese.decode(raw).replace(/\{[^}]*\}|\n/g, "")}`;
      return codec.decode(raw).replace(/\{n([12])\}/g, (_, n) => codec.decode(Uint8Array.from(boot.names[n] ?? []))).replace(/\{[^}]*\}|\n/g, "");
    },
    thumb: (entry) => `/kamaitachi-gba-kor/assets/bg/${String(entry.image).padStart(3, "0")}${entry.variant ? `-${entry.variant}` : ""}.png`,
    jump: debugJump,
    current: () => sceneSite,
  });
}

window.kamaitachi = { language, languages: LANGUAGES, setLanguage, vm, screen, assets, font, input, sound, page, boot, tap, openMenu,
  openDialogueEditor, get textEdits() { return textEdits; }, debugJump, get debugScenes() { return debugScenes; }, get sceneSite() { return sceneSite; },
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
    // 0800750C: while 1D 6A has armed SELECT, the page wait takes it instead of opening the menu.
    if (pressed("SELECT") && vm.waiting === "click" && !page.typing) vm.select();
    if ((pressed("R") || menuRequested) && vm.waiting === "click" && !page.typing && !vm.ram.selectArmed) boot.openMenu();
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
    if (vm.waiting === "boot") { page.large?.clear(); boot.frame(trigger, held); }
    else {
      // 080073F4: the click-wait marker (8484, or 8483 when the page is cleared after the press).
      page.waitMarker = vm.waiting === "click" && vm.ram.inGame ? (text.pendingClear ? 0x8483 : 0x8484) : 0;
      page.frame(Boolean(screen.choiceOverlay));
    }
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
