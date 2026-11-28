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
const byResource = new Map(); // resource -> [[id, hex of the piece and its end, where its command is in the original resource]]
for (const [res, list] of Object.entries(script.resources)) {
  const bytes = raw.get(+res), start = (rec) => (bytes ? bytes[2 * rec] | bytes[2 * rec + 1] << 8 : 0);
  byResource.set(+res, list.map(([rec, off, t]) => [`${String(res).padStart(3, "0")}-${String(rec).padStart(3, "0")}-${String(off).padStart(4, "0")}`, Buffer.concat([Buffer.from(t, "base64"), Buffer.from([0])]).subarray(0, 16).toString("hex"), start(rec) + off]));
}
// Lines that begin alike (a bare page break, the same words) are told apart by the state itself:
// the line meant is the one nearest to where the state's cursor stands, in the cursor's resource.
const cursor = (z) => { const st = inflateRawSync(Buffer.from(z, "base64")), S = 0x1c78; return { res: st.readUInt16LE(S + 0x20), at: st.readUInt32LE(S + 0x44) }; };
const pieces = {}, snaps = [], index = new Map(); let unknown = 0, shared = 0;
for (const file of captures) {
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line) continue;
    const { z: taken, p } = JSON.parse(line), z = turned(taken);
    if (!z) continue;
    const page = []; // the lines of this page, in the order typed: [id, where its command is, resource]
    const found = p.map(({ r, h }) => ({ r, hits: (byResource.get(r) ?? []).filter(([, hex]) => h.startsWith(hex)) }));
    found.forEach(({ r, hits }, k) => {
      if (!hits.length) { unknown++; return; }
      if (hits.length > 1) {
        // lines that begin alike (a bare code, the same words): the one nearest to a line of this
        // page that is known for sure, else to where the state's cursor stands
        shared++;
        const sure = found.map((f, j) => [Math.abs(j - k), f]).filter(([, f]) => f.r === r && f.hits.length === 1).sort((x, y) => x[0] - y[0])[0]?.[1].hits[0][2];
        const c = cursor(z), near = sure ?? (c.res === r ? c.at : null);
        if (near === null) return;
        const best = hits.reduce((b, x) => (Math.abs(x[2] - near) < Math.abs(b[2] - near) ? x : b));
        if (Math.abs(best[2] - near) > 0x400) return;
        hits = [best];
      }
      page.push([hits[0][0], hits[0][2], r]);
    });
    if (!page.length || page.every(([id]) => id in pieces)) continue;
    // The interpreter's cursor at a page wait stands inside the text being typed; a book resumes at
    // a command. The state is made to resume at the text command of the first line of its page.
    const c = cursor(z); if (c.res !== page[0][2]) continue;
    const st = inflateRawSync(Buffer.from(z, "base64")); st.writeUInt32LE(page[0][1], 0x1c78 + 0x44);
    const made = deflateRawSync(st, { level: 9 }).toString("base64");
    for (const [id] of page) { if (id in pieces) continue; if (!index.has(made)) { index.set(made, snaps.length); snaps.push(made); } pieces[id] = index.get(made); }
  }
}
writeFileSync(outPath, JSON.stringify({ schema: "kamaitachi.ps1.debug-scenes.v1", pieces, snaps }));
const total = [...byResource.values()].reduce((n, l) => n + l.length, 0);
console.log(JSON.stringify({ pieces: Object.keys(pieces).length, ofScript: total, snaps: snaps.length, captureLinesWithoutId: unknown, alikeOpenings: shared, statesLeftOut: unfit }));
