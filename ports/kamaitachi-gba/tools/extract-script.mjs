// Lists every text run of the scenario for translation: one entry per run, keyed bank:offset like
// the dialogue editor (vm.textKey), so a translated run plugs into text-edits.json unchanged.
//
//   node tools/extract-script.mjs <port-data> [out.json]     (default <port-data>/script-ja.json)
//
// The banks are read directly (no playthrough): a run is an opcode 00 followed by Shift-JIS pairs
// and control codes up to a 00 terminator. A walk of every branch with the VM (scene-index.mjs's
// method) reached 1,663 runs in 20M steps without finishing; every one of them that holds text is
// also found here, and the 62 it found that are not are control codes only ({p}, {c0}), which need
// no translation and are left out here too.
//
// Entry: { id, kind ("text", or "label" for a choice entry's 'v' letter), text (decoded, control
// codes as {r} {p} {g} {n1} ...), chars (characters without control codes), page (id of the run that
// opens its page: runs follow each other in a bank until one ends the page with {g}) }.
// The output holds script text: it stays in the private repository.
import fs from "node:fs";
import path from "node:path";
import { textKey } from "../src/vm.js";
import { TextCodec } from "../src/text-editor.js";

const [dataPath, outputArg] = process.argv.slice(2);
if (!dataPath) throw new Error("usage: extract-script.mjs <port-data> [out.json]");
const outputPath = outputArg ?? path.join(dataPath, "script-ja.json");
const codec = new TextCodec("ja", { find: () => 0 });
const isLead = (v) => (v >= 0x81 && v <= 0x9f) || (v >= 0xe0 && v <= 0xef);
const isTrail = (v) => v >= 0x40 && v <= 0xfc && v !== 0x7f;

// The run starting at the 00 opcode at `at`: { end (its terminator), pairs } or null.
function runAt(data, at) {
  let pos = at + 1, pairs = 0;
  while (pos < data.length && data[pos] !== 0) {
    const value = data[pos], control = String.fromCharCode(value);
    if (isLead(value)) { if (!isTrail(data[pos + 1])) return null; pairs++; pos += 2; }
    else if ("nsvcC".includes(control)) pos += 2;
    else if (/[A-Za-z@]/.test(control)) pos++;
    else return null;
  }
  return pos < data.length && pairs > 0 ? { end: pos, pairs } : null;
}

const entries = [];
const scenario = path.join(dataPath, "scenario");
for (const name of fs.readdirSync(scenario).filter((n) => n.endsWith(".bin")).sort()) {
  const bank = Number.parseInt(name, 16);
  const data = new Uint8Array(fs.readFileSync(path.join(scenario, name)));
  let page = null;
  for (let at = 0; at < data.length - 2; at++) {
    if (data[at] !== 0) continue;
    const run = runAt(data, at);
    if (!run) continue;
    const id = textKey(bank, at);
    const raw = data.subarray(at + 1, run.end);
    const text = codec.decode(raw);
    const kind = raw[0] === 0x76 ? "label" : "text";
    if (kind === "text") page ??= id;
    entries.push({ id, kind, text, chars: text.replace(/\{[^}]*\}|\n/g, "").length, page: kind === "text" ? page : null });
    if (/\{g\}/.test(text)) page = null;
    at = run.end;
  }
}

const unique = new Map();
for (const entry of entries) unique.set(entry.text, entry.chars);
const summary = {
  runs: entries.length, labels: entries.filter((e) => e.kind === "label").length,
  pages: new Set(entries.map((e) => e.page).filter(Boolean)).size,
  chars: entries.reduce((sum, e) => sum + e.chars, 0),
  uniqueRuns: unique.size, uniqueChars: [...unique.values()].reduce((a, b) => a + b, 0),
};
fs.writeFileSync(outputPath, JSON.stringify({ version: 1, summary, entries }));
console.log(JSON.stringify({ ...summary, out: outputPath }));
