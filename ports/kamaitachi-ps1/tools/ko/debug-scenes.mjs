// The entry states of the debug jump (src/machine-browser.js ?debug=1&scene=<id>) as one file.
//   node tools/ko/debug-scenes.mjs KO_SCRIPT.json SCE.PAC OUT.json CAPTURES.jsonl...
// KO_SCRIPT.json: the ko-script.json the captures were played with. The offsets in a state (the
// cursor, the history of passed points) are turned back to those of the original script, so the
// file stays good when the translation is rebuilt or the owner edits a line; the game turns them
// to its own build when it jumps (src/ko.js turnBookState).
// A capture line is { z, p }: z the bookmark state (work copy 0x8009eeb8, 0x1c78 bytes, then slot 0
// of 0x8008cdc0, 100 bytes; deflate-raw, base64) taken with src/helpers.js snapshot() when a page
// started waiting for a press, on the replay of every ending; p the pieces typed on that page as
// { r: resource, h: the first 16 bytes at the text pointer, hex }.
// OUT: { pieces: { "<id>": index }, snaps: [z] }. It holds no text, but it is port data made from a
// play of the game: it is served only behind the /edit/ password and not committed.
import { readFileSync, writeFileSync } from "node:fs";
import { inflateRawSync, deflateRawSync } from "node:zlib";
import { sceMembers, resourceOffsets, turnBookState } from "../../src/ko.js";
const [scriptPath, pacPath, outPath, ...captures] = process.argv.slice(2);
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const raw = sceMembers(new Uint8Array(readFileSync(pacPath))), maps = new Map();
const map = (res) => maps.get(res) ?? maps.set(res, raw.has(res) ? resourceOffsets(raw.get(res), script.resources[res]) : null).get(res);
const original = new Map(); let unfit = 0; // capture z -> z with the original script's offsets (null: an offset inside a text)
const turned = (z) => {
  if (!original.has(z)) { const st = new Uint8Array(inflateRawSync(Buffer.from(z, "base64"))); original.set(z, turnBookState(st, (res, off) => map(res)?.toOld(off) ?? off) ? deflateRawSync(st, { level: 9 }).toString("base64") : null); if (!original.get(z)) unfit++; }
  return original.get(z);
};
const byResource = new Map(); // resource -> [[id, hex of the piece and its end]]
for (const [res, list] of Object.entries(script.resources)) {
  byResource.set(+res, list.map(([rec, off, t]) => [`${String(res).padStart(3, "0")}-${String(rec).padStart(3, "0")}-${String(off).padStart(4, "0")}`, Buffer.concat([Buffer.from(t, "base64"), Buffer.from([0])]).subarray(0, 16).toString("hex")]));
}
const pieces = {}, snaps = [], index = new Map(); let unknown = 0, shared = 0;
for (const file of captures) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line) continue;
    const { z: taken, p } = JSON.parse(line), z = turned(taken);
    if (!z) continue;
    for (const { r, h } of p) {
      const ids = (byResource.get(r) ?? []).filter(([, hex]) => h.startsWith(hex)).map(([id]) => id);
      if (!ids.length) { unknown++; continue; }
      if (ids.length > 1) shared++;
      for (const id of ids) { if (id in pieces) continue; if (!index.has(z)) { index.set(z, snaps.length); snaps.push(z); } pieces[id] = index.get(z); }
    }
  }
}
writeFileSync(outPath, JSON.stringify({ schema: "kamaitachi.ps1.debug-scenes.v1", pieces, snaps }));
const total = [...byResource.values()].reduce((n, l) => n + l.length, 0);
console.log(JSON.stringify({ pieces: Object.keys(pieces).length, ofScript: total, snaps: snaps.length, captureLinesWithoutId: unknown, sharedOpenings: shared, statesLeftOut: unfit }));
