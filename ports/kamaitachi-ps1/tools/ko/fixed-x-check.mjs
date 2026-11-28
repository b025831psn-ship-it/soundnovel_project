// Text pieces that follow a "set x" command (script command 0x18: x = v * 5/4): the original types
// single glyphs at fixed places on a line (a memo read down a column, lines with spread first
// letters). A translated piece that is wider than the room up to the next fixed place is typed
// over by the next piece, and a space at its start moves it 6 pixels into the next place.
//   node tools/ko/fixed-x-check.mjs KO_DIR SCE.PAC      (KO_DIR: ko-script.json, ko-editor.json, ko-font.bin)
// Prints the pieces that do not fit; exit code 1 when there are any.
import { readFileSync } from "node:fs";
import { sceMembers } from "../../src/ko.js";
import { koCodec, widthOf } from "../../src/ko-text.js";
const dir = process.argv[2], pac = process.argv[3];
const script = JSON.parse(readFileSync(dir + "/ko-script.json")), editor = JSON.parse(readFileSync(dir + "/ko-editor.json")), font = new Uint8Array(readFileSync(dir + "/ko-font.bin"));
const raw = sceMembers(new Uint8Array(readFileSync(pac))), codec = koCodec(script), width = widthOf(font, script.glyphs, editor.widths);
const px = (text) => { const b = codec.encode(text).bytes; let w = 0, i = 0; while (i < b.length) { if (b[i] === 0x20) { w += script.space ?? 6; i++; } else if (b[i] < 0x78) i += "cChsvnw".includes(String.fromCharCode(b[i])) ? 2 : 1; else { w += width(b[i] << 8 | b[i + 1]) + 1; i += 2; } } return w; };
const rows = [];
editor.items.forEach(([id, ja, ko], k) => {
  const [res, rec, off] = id.split("-").map(Number), b = raw.get(res); if (!b) return;
  const at = (b[2 * rec] | b[2 * rec + 1] << 8) + off;
  if (b[at - 3] === 0x18) { const v = b[at - 2] | b[at - 1] << 8; rows.push({ k, id, x: v + (v >> 2), ja, ko, w: px(ko), wja: px(ja) }); }
});
let bad = 0;
rows.forEach((r, i) => {
  const n = rows[i + 1];
  // the next fixed place is on this line: the same record, further right, and no line break typed in between
  if (!n || n.id.slice(0, 7) !== r.id.slice(0, 7) || n.x <= r.x || editor.items.slice(r.k, n.k).some((it) => /\[[@rg]\]/.test(it[2]))) return;
  const room = n.x - r.x, lead = r.ko.startsWith(" ");
  // wider than the room by more than the original is (its own glyphs run a pixel or two over)
  if (r.w - room > Math.max(0, r.wja - room) + 2 || lead) { bad++; console.log(`${r.id} x ${r.x}, room ${room}px, Korean ${r.w}px (Japanese ${r.wja}px)${lead ? ", starts with a space" : ""}: ${JSON.stringify(r.ko)}`); }
});
console.log(`${rows.length} pieces at a fixed x, ${bad} do not fit`);
process.exit(bad ? 1 : 0);
