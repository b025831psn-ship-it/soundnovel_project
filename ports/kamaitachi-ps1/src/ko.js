// The Korean build of the machine. The game's code is the same; two pieces of data change:
//   - the script: SCE.PAC is rebuilt with the translated text in place of the Japanese text
//     payloads (koScript: tools/ko/build-ko.py; per resource [record, offset, base64 bytes]),
//   - the font: a second font in the game's own glyph format for the codes 0xa080-0xdfff
//     (src/text/glyph.js), a width for the space byte and the Korean punctuation that may
//     hang past the right edge like the original's (src/text/text.js).
// Members are stored unpacked ("ike" members are unpacked here): the game's loader copies an
// unpacked member as it is. A resource must stay within the game's 0xb000-byte script buffer.
import { ike } from "./screen/ike.js";

const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const SINGLE = new Set([0x20, 0x40, 0x72, 0x52, 0x4c, 0x70, 0x50, 0x67, 0x6b, 0x6f]);
export const SCRIPT_LIMIT = 0xb000;

function unpackMember(b) {
  if (b[2] !== 0x69 || b[3] !== 0x6b || b[4] !== 0x65) return b; // "ike"
  const buf = new Uint8Array(0x40000); buf.set(b);
  const m = { read: (a, w) => { let v = 0; for (let k = 0; k < w; k++) v |= buf[a + k] << (8 * k); return v >>> 0; }, write: (a, v, w) => { for (let k = 0; k < w; k++) buf[a + k] = (v >>> (8 * k)) & 0xff; } };
  const n = ike(m, 0, 0x20000); return buf.slice(0x20000, 0x20000 + n);
}
// The end (the 0x00) of a text payload, as the game's text routine reads it.
function textEnd(b, from) {
  let e = from;
  while (e < b.length && b[e] !== 0) e += SINGLE.has(b[e]) ? 1 : 2;
  return Math.min(e, b.length);
}
const fromBase64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));

// One resource with its text payloads replaced. texts: [[record, offset, base64], ...]
export function patchResource(bytes, texts, id = "?") {
  const n = u16(bytes, 0) / 2, offs = Array.from({ length: n }, (_, i) => u16(bytes, 2 * i));
  const byRecord = new Map();
  for (const [rec, off, t] of texts) (byRecord.get(rec) ?? byRecord.set(rec, []).get(rec)).push([off, fromBase64(t)]);
  const parts = [], starts = []; let size = 2 * n;
  for (let i = 0; i < n; i++) {
    const b = bytes.subarray(offs[i], i + 1 < n ? offs[i + 1] : bytes.length), out = []; let at = 0;
    for (const [off, text] of (byRecord.get(i) ?? []).sort((x, y) => x[0] - y[0])) {
      if (off < at || b[off] !== 0) throw new Error(`ko: resource ${id} record ${i}: no text command at ${off}`);
      out.push(b.subarray(at, off + 1), text); at = textEnd(b, off + 1);
    }
    out.push(b.subarray(at));
    starts.push(size); for (const p of out) size += p.length; parts.push(out);
  }
  // the last record of an unpacked member runs to the end of its sector: drop that padding
  let tail = parts.at(-1).at(-1), end = tail.length; while (end > 1 && tail[end - 1] === 0 && tail[end - 2] === 0) end--;
  size -= tail.length - end; parts.at(-1)[parts.at(-1).length - 1] = tail.subarray(0, end);
  if (size > SCRIPT_LIMIT) throw new Error(`ko: resource ${id} is ${size} bytes, over the script buffer (${SCRIPT_LIMIT})`);
  const res = new Uint8Array(size); let o = 2 * n;
  starts.forEach((s, i) => { res[2 * i] = s & 0xff; res[2 * i + 1] = s >> 8; });
  for (const out of parts) for (const p of out) { res.set(p, o); o += p.length; }
  if (res[2] === 0x69 && res[3] === 0x6b && res[4] === 0x65 || res[0] === 0x4c && res[1] === 0x5a && res[2] === 0x53) throw new Error(`ko: resource ${id} looks packed`);
  return res;
}

// SCE.PAC with the Korean text. PAC: rows {id u16, sector u16} up to id 0xffff; 2048-byte sectors.
export function patchScePac(pac, koScript) {
  const rows = []; for (let i = 0; ; i += 4) { const id = u16(pac, i), s = u16(pac, i + 2); rows.push({ id, s }); if (id === 0xffff) break; }
  const members = rows.slice(0, -1).map((r, i) => {
    const raw = unpackMember(pac.subarray(r.s * 2048, rows[i + 1].s * 2048)), texts = koScript.resources[r.id];
    return { id: r.id, bytes: texts?.length ? patchResource(raw, texts, r.id) : raw };
  });
  let sector = rows[0].s; const place = members.map((x) => { const s = sector; sector += Math.ceil(x.bytes.length / 2048); return s; });
  if (sector > 0xffff) throw new Error("ko: SCE.PAC is too large");
  const out = new Uint8Array(sector * 2048);
  members.forEach((x, i) => { out[4 * i] = x.id & 0xff; out[4 * i + 1] = x.id >> 8; out[4 * i + 2] = place[i] & 0xff; out[4 * i + 3] = place[i] >> 8; out.set(x.bytes, place[i] * 2048); });
  const e = 4 * members.length; out[e] = 0xff; out[e + 1] = 0xff; out[e + 2] = sector & 0xff; out[e + 3] = sector >> 8;
  return out;
}

// What the Machine takes as `ko`: { font: Uint8Array (ko-font.bin), script: object (ko-script.json) }
export function koBuild(pacs, ko) {
  return { pacs: { ...pacs, SCE: patchScePac(pacs.SCE, ko.script) }, text: { font: ko.font, glyphs: ko.script.glyphs, space: ko.script.space ?? 6, hang: new Set(ko.script.hang ?? []),
      // strings of the EXE that did not fit their place: old address -> new address (title.js drawString, scenario/lib.js textStart)
      moved: new Map(ko.script.moved ?? []),
      // the title section of the flowchart table: kept in spare RAM; the header of the table the game has just unpacked is pointed to it (menu/calls.js)
      chart: ko.script.chart ? { addr: ko.script.chart.addr, header: ko.script.chart.header, bytes: fromBase64(ko.script.chart.bytes) } : null },
    patches: (ko.script.patches ?? []).map(([addr, t]) => [addr, fromBase64(t)]) }; // bytes of the EXE data: the default names
}
