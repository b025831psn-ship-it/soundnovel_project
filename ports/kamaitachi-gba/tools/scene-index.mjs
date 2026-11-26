// Lists every picture request of the story for the debug mode's scene jump (src/debug-jump.js).
//
//   node tools/scene-index.mjs <port-data> [out.json]     (default <port-data>/debug-scenes.json)
//
// Entry: { site, opcode, picture (bg number), request, image, variant, node, path, occurrence,
//   order, foundAt, page (bank:offset of the next page start), silhouettes, firstText (the page's
//   text up to its first wait, hex), line (that text decoded, up to 60 characters) }.
//
// Every branch is explored as in explore-scenario.mjs (a choice state seen once is expanded once).
// Each request site (opcode 04 or 05, keyed bank:offset like the text editor) is listed the first
// time it runs: the picture, the flowchart node, the choices taken to get there and how many times
// the site had run on that path, then the silhouettes and first text run of the page after it.
// The output holds script text: it stays in the git-ignored port-data folder.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { VM, textKey } from "../src/vm.js";
import { TextWindow } from "../src/font.js";
import { TextCodec, untranslated } from "../src/text-editor.js";
import { RecordingScene, STORY_ROW, isPictureOpcode, resolvePicture, runBytes } from "../src/debug-jump.js";

const [dataPath, outputArg] = process.argv.slice(2);
if (!dataPath) throw new Error("usage: scene-index.mjs <port-data> [out.json]");
const outputPath = outputArg ?? path.join(dataPath, "debug-scenes.json");
const banks = {};
for (const name of fs.readdirSync(path.join(dataPath, "scenario")))
  if (name.endsWith(".bin")) banks[Number.parseInt(name, 16)] = new Uint8Array(fs.readFileSync(path.join(dataPath, "scenario", name)));

// The first line is decoded for the list; glyph checks are not needed here.
const codec = new TextCodec(/-ko\/?$/.test(path.resolve(dataPath)) ? "ko" : "ja", { find: () => 0 });
// The default hero and girlfriend names (ui/default-names.bin: two 0-terminated strings) for {n1} {n2}.
const nameBytes = fs.readFileSync(path.join(dataPath, "ui", "default-names.bin"));
const names = Object.fromEntries([...nameBytes.toString("latin1").split("\0").slice(0, 2)].map((name, i) =>
  [i + 1, codec.decode(Uint8Array.from(name, (c) => c.charCodeAt(0)))]));
const japanese = new TextCodec("ja", { find: () => 0 });
// A Korean run the patch left in Japanese is listed in Japanese, marked [미번역].
const lineOf = (raw) => codec.lang === "ko" && untranslated(raw)
  ? `[미번역] ${japanese.decode(raw).replace(/\{[^}]*\}|\n/g, "")}`.slice(0, 60)
  : codec.decode(raw).replace(/\{n([12])\}/g, (_, n) => names[n]).replace(/\{[^}]*\}|\n/g, "").slice(0, 60);
const MAX_PATH_STEPS = 400_000;
// Every scene of the Japanese script is found within 0.4M steps; the rest of the budget is margin.
const MAX_TOTAL_STEPS = Number(process.env.SCENE_INDEX_STEPS ?? 10_000_000);
const hex = (bytes) => Buffer.from(bytes).toString("hex");
const choiceKey = (vm) => createHash("sha256").update([
  vm.bank, vm.offset, vm.ram.group, vm.ram.slot, vm.ram.pending, vm.ram.effectDisabled, vm.ram.effectBypass,
  vm.ram.silhouetteMode, hex(vm.ram.flags), hex(vm.ram.vars),
  vm.ram.stack.map(({ bank, offset }) => `${bank}:${offset}`).join(","),
  vm.choiceState?.entries.map(({ row, key = "" }) => `${row}:${key}`).join(",") ?? "",
].join("|")).digest("hex");

const VM_FIELDS = ["bank", "offset", "halted", "waiting", "choiceState", "choiceSelection", "collectingChoice",
  "waitFrames", "audioWait", "pendingAudio", "clockWaitTarget"];
const TEXT_FIELDS = ["fragments", "pageRaw", "wait", "suppress", "waited", "deferredWait", "quote", "doubleQuote", "rest", "pendingClear"];
const snapshot = (vm, text, scene, counts) => ({
  vm: Object.fromEntries(VM_FIELDS.map((name) => [name, structuredClone(vm[name])])),
  ram: structuredClone(vm.ram),
  text: Object.fromEntries(TEXT_FIELDS.map((name) => [name, structuredClone(text[name])])),
  scene: { current: scene.current, site: scene.site },
  counts: new Map(counts),
});

const entries = new Map();
const queue = [{ path: [], state: null }];
const expanded = new Set();
let totalSteps = 0, paths = 0;
while (queue.length && totalSteps < MAX_TOTAL_STEPS) {
  const { path: decisions, state } = queue.shift();
  const scene = new RecordingScene();
  const text = new TextWindow();
  let counts = new Map();
  const awaiting = [];
  const vm = new VM({
    banks, entryRow: STORY_ROW, scene, text,
    trace(event) {
      if (!isPictureOpcode(event.opcode)) return;
      const site = textKey(event.bank, event.offset);
      scene.site = site;
      const occurrence = (counts.get(site) ?? 0) + 1;
      counts.set(site, occurrence);
      if (entries.has(site) || scene.current === null) return;
      const { image, variant } = resolvePicture(scene.current);
      const entry = { site, opcode: event.opcode, picture: image, request: scene.current, image, variant, node: vm.ram.node,
        path: decisions.slice(0, decision), occurrence, order: entries.size, foundAt: totalSteps };
      entries.set(site, entry);
      awaiting.push(entry);
    },
  });
  vm.onPageStart = (bank, offset) => {
    for (const entry of awaiting.splice(0)) {
      entry.page = textKey(bank, offset);
      entry.node = vm.ram.node;
      entry.silhouettes = [...vm.ram.silhouettes].filter((id) => id !== 0xffff);
      const raw = runBytes(banks, bank, offset);
      entry.firstText = hex(raw);
      entry.line = lineOf(raw);
      reading.push(entry);
    }
  };
  // The page's text up to its first wait (its first run may be only a name): the list's line.
  const reading = [];
  const readPage = () => {
    if (!reading.length) return;
    const raw = Uint8Array.from(text.pageRaw.flatMap((run) => [...run]));
    for (const entry of reading.splice(0)) { entry.firstText = hex(raw); entry.line = lineOf(raw); }
  };
  let decision = 0;
  if (state) {
    Object.assign(vm, structuredClone(state.vm));
    vm.ram = structuredClone(state.ram);
    Object.assign(text, structuredClone(state.text));
    Object.assign(scene, state.scene);
    counts = new Map(state.counts);
    decision = decisions.length;
  }
  let steps = 0;
  while (!vm.halted && steps < MAX_PATH_STEPS && totalSteps < MAX_TOTAL_STEPS) {
    if (vm.waiting === "choice") {
      readPage();
      const key = choiceKey(vm);
      if (!expanded.has(key)) {
        expanded.add(key);
        const base = snapshot(vm, text, scene, counts);
        for (let index = 0; index < (vm.choiceState?.entries.length ?? 0); index++) {
          const child = new VM({ banks, entryRow: STORY_ROW, scene: new RecordingScene(), text: new TextWindow() });
          Object.assign(child, structuredClone(base.vm));
          child.ram = structuredClone(base.ram);
          Object.assign(child.text, structuredClone(base.text));
          Object.assign(child.scene, base.scene);
          child.resume(index);
          queue.push({ path: [...decisions, index], state: snapshot(child, child.text, child.scene, base.counts) });
        }
      }
      break;
    }
    if (vm.waiting !== "none") { readPage(); vm.resume(); continue; }
    vm.step();
    steps++;
    totalSteps++;
  }
  for (const entry of awaiting) { entry.silhouettes = []; entry.firstText = ""; entry.line = ""; }
  paths++;
}

const scenes = [...entries.values()].sort((a, b) => a.node - b.node || a.order - b.order);
const report = { version: 1, generatedAt: new Date().toISOString(), paths, totalSteps, truncated: queue.length > 0, scenes };
fs.writeFileSync(outputPath, JSON.stringify(report));
console.log(JSON.stringify({ scenes: scenes.length, paths, totalSteps, truncated: report.truncated, out: outputPath }));
