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
// offsets: [[record, operand offset], ...]: the u16 operands that hold a byte offset into the
// resource (tools/ko/offset-operands.mjs); they follow the bytes they point to.
export function patchResource(bytes, texts, id = "?", offsets = []) {
  const n = u16(bytes, 0) / 2, offs = Array.from({ length: n }, (_, i) => u16(bytes, 2 * i));
  const byRecord = new Map();
  for (const [rec, off, t] of texts) (byRecord.get(rec) ?? byRecord.set(rec, []).get(rec)).push([off, fromBase64(t)]);
  const parts = [], starts = [], cuts = []; let size = 2 * n; // cuts[i]: [old start, old end, new length] of each replaced text
  for (let i = 0; i < n; i++) {
    const b = bytes.subarray(offs[i], i + 1 < n ? offs[i + 1] : bytes.length), out = [], cut = []; let at = 0;
    for (const [off, text] of (byRecord.get(i) ?? []).sort((x, y) => x[0] - y[0])) {
      if (off < at || b[off] !== 0) throw new Error(`ko: resource ${id} record ${i}: no text command at ${off}`);
      out.push(b.subarray(at, off + 1), text); at = textEnd(b, off + 1); cut.push([off + 1, at, text.length]);
    }
    out.push(b.subarray(at));
    starts.push(size); for (const p of out) size += p.length; parts.push(out); cuts.push(cut);
  }
  // the last record of an unpacked member runs to the end of its sector: drop that padding
  let tail = parts.at(-1).at(-1), end = tail.length; while (end > 1 && tail[end - 1] === 0 && tail[end - 2] === 0) end--;
  size -= tail.length - end; parts.at(-1)[parts.at(-1).length - 1] = tail.subarray(0, end);
  if (size > SCRIPT_LIMIT) throw new Error(`ko: resource ${id} is ${size} bytes, over the script buffer (${SCRIPT_LIMIT})`);
  const res = new Uint8Array(size); let o = 2 * n;
  starts.forEach((s, i) => { res[2 * i] = s & 0xff; res[2 * i + 1] = s >> 8; });
  for (const out of parts) for (const p of out) { res.set(p, o); o += p.length; }
  // an offset inside record i, old -> new
  const moved = (i, rel) => {
    let d = 0;
    for (const [a, e, len] of cuts[i]) { if (rel >= e) d += len - (e - a); else if (rel > a) throw new Error(`ko: resource ${id} record ${i}: an offset points into a text`); }
    return starts[i] + rel + d;
  };
  for (const [rec, at] of offsets) {
    const o = offs[rec] + at, old = u16(bytes, o);
    let i = n - 1; while (i > 0 && offs[i] > old) i--;
    if (old < offs[0] || old >= bytes.length) continue; // not an offset of this resource: left as it is
    const to = moved(i, old - offs[i]), w = moved(rec, at);
    if (to > 0xffff) throw new Error(`ko: resource ${id}: an offset passes 0xffff`);
    res[w] = to & 0xff; res[w + 1] = to >> 8;
  }
  if (res[2] === 0x69 && res[3] === 0x6b && res[4] === 0x65 || res[0] === 0x4c && res[1] === 0x5a && res[2] === 0x53) throw new Error(`ko: resource ${id} looks packed`);
  return res;
}

// Where a byte offset of a resource is after its texts were replaced, and back: for state that
// holds offsets (the bookmark's cursor and history) made with one build and used with another
// (the debug jump, src/machine-browser.js). An offset inside a replaced text has no counterpart.
export function resourceOffsets(bytes, texts) {
  const n = u16(bytes, 0) / 2, offs = Array.from({ length: n }, (_, i) => u16(bytes, 2 * i));
  const byRecord = new Map();
  for (const [rec, off, t] of texts ?? []) (byRecord.get(rec) ?? byRecord.set(rec, []).get(rec)).push([off, fromBase64(t).length]);
  const spans = []; let d = 0; // [old start, old end, new start, new end] of each replaced text, in order
  for (let i = 0; i < n; i++) {
    const b = bytes.subarray(offs[i], i + 1 < n ? offs[i + 1] : bytes.length);
    for (const [off, len] of (byRecord.get(i) ?? []).sort((x, y) => x[0] - y[0])) {
      const a = offs[i] + off + 1, e = offs[i] + textEnd(b, off + 1);
      spans.push([a, e, a + d, a + d + len]); d += len - (e - a);
    }
  }
  const map = (v, from, to) => { let shift = 0; for (const s of spans) { if (v >= s[from + 1]) shift = s[to + 1] - s[from + 1]; else { if (v > s[from]) return -1; break; } } return v + shift; };
  return { toNew: (old) => map(old, 0, 2), toOld: (now) => map(now, 2, 0) };
}
// The members of SCE.PAC, unpacked: id -> bytes.
export function sceMembers(pac) {
  const rows = []; for (let i = 0; ; i += 4) { const id = u16(pac, i), s = u16(pac, i + 2); rows.push({ id, s }); if (id === 0xffff) break; }
  return new Map(rows.slice(0, -1).map((r, i) => [r.id, unpackMember(pac.subarray(r.s * 2048, rows[i + 1].s * 2048))]));
}
// The offsets a bookmark state holds (work copy 0x1c78 bytes, then slot 0): the history of passed
// points (count at 0x1c68, offsets at 0x868, their resources at 0x1068) and the slot's cursor
// (+0x44, resource +0x20), each turned by turn(resource, offset). False when one has no counterpart.
export function turnBookState(st, turn) {
  const S = 0x1c78, r16 = (o) => st[o] | st[o + 1] << 8, w16 = (o, v) => { st[o] = v & 0xff; st[o + 1] = v >> 8 & 0xff; };
  let ok = true;
  for (let i = 0, n = Math.min(r16(0x1c68), 0x400); i < n; i++) { const v = turn(st[0x1068 + i], r16(0x868 + 2 * i)); if (v < 0 || v > 0xffff) ok = false; else w16(0x868 + 2 * i, v); }
  const cur = (st[S + 0x44] | st[S + 0x45] << 8 | st[S + 0x46] << 16 | st[S + 0x47] << 24) >>> 0, v = turn(r16(S + 0x20), cur);
  if (v < 0) ok = false; else { st[S + 0x44] = v & 0xff; st[S + 0x45] = v >> 8 & 0xff; st[S + 0x46] = v >> 16 & 0xff; st[S + 0x47] = v >>> 24; }
  return ok;
}

// SCE.PAC with the Korean text. PAC: rows {id u16, sector u16} up to id 0xffff; 2048-byte sectors.
export function patchScePac(pac, koScript) {
  if (!koScript.offsets) throw new Error("ko: ko-script.json has no offsets (tools/ko/offset-operands.mjs, build-ko.py --offsets)");
  const rows = []; for (let i = 0; ; i += 4) { const id = u16(pac, i), s = u16(pac, i + 2); rows.push({ id, s }); if (id === 0xffff) break; }
  const members = rows.slice(0, -1).map((r, i) => {
    const raw = unpackMember(pac.subarray(r.s * 2048, rows[i + 1].s * 2048)), texts = koScript.resources[r.id];
    return { id: r.id, bytes: texts?.length ? patchResource(raw, texts, r.id, koScript.offsets[r.id] ?? []) : raw };
  });
  let sector = rows[0].s; const place = members.map((x) => { const s = sector; sector += Math.ceil(x.bytes.length / 2048); return s; });
  if (sector > 0xffff) throw new Error("ko: SCE.PAC is too large");
  const out = new Uint8Array(sector * 2048);
  members.forEach((x, i) => { out[4 * i] = x.id & 0xff; out[4 * i + 1] = x.id >> 8; out[4 * i + 2] = place[i] & 0xff; out[4 * i + 3] = place[i] >> 8; out.set(x.bytes, place[i] * 2048); });
  const e = 4 * members.length; out[e] = 0xff; out[e + 1] = 0xff; out[e + 2] = sector & 0xff; out[e + 3] = sector >> 8;
  return out;
}

const koCode = (i) => ((0xa0 + (i >> 7)) << 8) | (0x80 + (i & 0x7f));
function koJosa(script) {
  const char = new Map(), code = new Map();
  [...script.chars].forEach((ch, i) => { char.set(koCode(i), ch); code.set(ch, koCode(i)); });
  return { char, code, join: new Set(script.josaJoin ?? []) };
}

// What the Machine takes as `ko`: { font: Uint8Array (ko-font.bin), script: object (ko-script.json) }
export function koBuild(pacs, ko) {
  return { pacs: { ...pacs, SCE: patchScePac(pacs.SCE, ko.script) }, text: { font: ko.font, glyphs: ko.script.glyphs, space: ko.script.space ?? 6, hang: new Set(ko.script.hang ?? []),
      // strings of the EXE that did not fit their place: old address -> new address (title.js drawString, scenario/lib.js textStart)
      moved: new Map(ko.script.moved ?? []),
      // the title section of the flowchart table: kept in spare RAM; the flowchart's title pointer is turned to it (menu/calls.js)
      chart: ko.script.chart ? { addr: ko.script.chart.addr, bytes: fromBase64(ko.script.chart.bytes) } : null,
      // the culprit judge: address of a name of its table -> the Korean names taken as that name (menu/calls.js)
      culprit: new Map((ko.script.culprit ?? []).map(([a, list]) => [a >>> 0, list.map(fromBase64)])),
      // the particle after a name (text/josa.js)
      josa: ko.script.chars ? koJosa(ko.script) : null,
      // the ending list: written over the copy the game makes of it (menu/calls.js)
      endings: ko.script.endings ? { addr: ko.script.endings.addr, bytes: fromBase64(ko.script.endings.bytes) } : null },
    patches: (ko.script.patches ?? []).map(([addr, t]) => [addr, fromBase64(t)]) }; // bytes of the EXE data: the default names
}
