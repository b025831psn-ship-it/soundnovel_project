#!/usr/bin/env node
// Usage: node tools/extract-script.mjs SCE.PAC PORT_DATA/manifest.json OUT_DIR
// The whole Japanese script for translation, from the user's own SCE.PAC (members unpacked
// as the game does: "ike" with src/screen/ike.js, header size at +0xb; records by the
// member's u16 offset table) and the opcode lengths of the port-data manifest:
// every text command in every scenario record, in record order, with a fixed id
// "RRR-SSS-OOOO" = resource, record (the game's label is resource*1000 + record) and the
// command's byte offset in the record. Writes OUT_DIR/script.ja.json and one Markdown file
// per resource (OUT_DIR/md/RRR.md). The format is in docs/script-format.md.
// The records are read linearly with the opcode lengths from the manifest (no branches are
// followed), so text that only a branch reaches is listed too; bytes that do not decode as
// commands are reported as gaps.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { ike } from "../src/screen/ike.js";

const [pacPath, manifestPath, out] = process.argv.slice(2);
if (!out) { console.error("usage: node tools/extract-script.mjs SCE.PAC PORT_DATA/manifest.json OUT_DIR"); process.exit(2); }
const pac = new Uint8Array(readFileSync(pacPath)), manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const u16 = (b, o) => b[o] | (b[o + 1] << 8);
function members(bytes) { // PAC: {id u16, sector u16} up to id 0xffff; 2048-byte sectors
  const rows = []; for (let i = 0; ; i += 4) { const id = u16(bytes, i), s = u16(bytes, i + 2); rows.push({ id, s }); if (id === 0xffff) break; }
  return rows.slice(0, -1).map((r, i) => ({ id: r.id, bytes: bytes.subarray(r.s * 2048, rows[i + 1].s * 2048) }));
}
function unpackMember(b) {
  if (b[2] !== 0x69 || b[3] !== 0x6b || b[4] !== 0x65) return b; // "ike"
  const buf = new Uint8Array(0x40000); buf.set(b);
  const m = { read: (a, w) => { let v = 0; for (let k = 0; k < w; k++) v |= buf[a + k] << (8 * k); return v >>> 0; }, write: (a, v, w) => { for (let k = 0; k < w; k++) buf[a + k] = (v >>> (8 * k)) & 0xff; } };
  const n = ike(m, 0, 0x20000); return buf.slice(0x20000, 0x20000 + n);
}
function recordsOf(b) { // u16 offset table; the first offset is the table's size
  const n = u16(b, 0) / 2; if (!n || u16(b, 0) % 2 || u16(b, 0) > b.length) return [];
  const offs = Array.from({ length: n }, (_, i) => u16(b, 2 * i));
  return offs.map((o, i) => ({ id: i, bytes: b.subarray(o, i + 1 < n ? offs[i + 1] : b.length) }));
}
const data = { resources: new Map(members(pac).map((x) => [x.id, { records: recordsOf(unpackMember(x.bytes)) }])) };
const T = manifest.opcodeTables, P = T.primary.lengths, S = T.sub1d.lengths;
const sjis = new TextDecoder("shift_jis", { fatal: true });
const pad = (n, w) => String(n).padStart(w, "0"), hx = (v) => v.toString(16).padStart(2, "0");

// One text payload (up to its 0x00) as a string: SJIS glyphs as characters, the text codes
// (src/text/text.js) as [tokens]: [@] [r] [R] [L] [p] [P] [g] [k] [o] [sp], and with one
// argument byte [c4] [C0] [h1] [s2] [v0] [n1] [w05] (printable argument as is, else 2 hex digits).
const ARG = new Set([0x63, 0x43, 0x68, 0x73, 0x76, 0x6e, 0x77]), SINGLE = new Set([0x40, 0x72, 0x52, 0x4c, 0x70, 0x50, 0x67, 0x6b, 0x6f]);
function decodeText(b, issues) {
  let s = "";
  for (let i = 0; i < b.length;) {
    const c = b[i];
    if (c === 0x20) { s += "[sp]"; i++; continue; }
    if (SINGLE.has(c)) { s += `[${String.fromCharCode(c)}]`; i++; continue; }
    if (ARG.has(c)) { const v = b[i + 1]; s += `[${String.fromCharCode(c)}${v >= 0x21 && v < 0x7f ? String.fromCharCode(v) : hx(v ?? 0)}]`; i += 2; continue; }
    const pair = b.subarray(i, i + 2);
    try { s += sjis.decode(pair); } catch { s += `[x${hx(c)}${hx(b[i + 1] ?? 0)}]`; issues.push(`undecoded ${hx(c)}${hx(b[i + 1] ?? 0)}`); }
    i += 2;
  }
  return s;
}

function len(row, b, pc) { // operand bytes after the opcode (src/vm.js operandLength)
  if (row?.classification === "fixed" && Number.isInteger(row.operandLength)) return row.operandLength;
  const u8 = (k) => b[pc + k];
  switch (row?.lengthRule) {
    case "4+2*u8(0)": return u8(0) == null ? null : 4 + 2 * u8(0);
    case "u8(0)==0?2:1": return u8(0) == null ? null : u8(0) === 0 ? 2 : 1;
    case "6+4*u8(0)": return u8(0) == null ? null : 6 + 4 * u8(0);
    case "2+nested(2)": return nested(b, pc + 2, 2);
    case "4+nested(4)": return nested(b, pc + 4, 4);
    default: return null;
  }
}
// The end (the 0x00) of a text payload, read as the game's text routine reads it: one byte for
// the codes, two for the codes with an argument, two for anything else (a glyph, even 82 00).
function textEnd(b, from) {
  let e = from;
  while (e < b.length && b[e] !== 0) { const c = b[e]; e += c === 0x20 || SINGLE.has(c) ? 1 : 2; }
  return Math.min(e, b.length);
}
function nested(b, at, prefix) {
  const op = b[at]; if (op == null) return prefix;
  if (op === 0x00) { const e = textEnd(b, at + 1); return e < b.length ? prefix + e - at + 1 : null; }
  if (op === 0x17) return prefix + 1; // 0x17 takes no operand (see the main loop)
  const n = len(P[op], b, at + 1); return n == null ? null : prefix + 1 + n;
}

const entries = [], gaps = [], nonText = [], perResource = new Map();
let records = 0;
for (const [rid, res] of [...data.resources].sort((a, b) => a[0] - b[0])) {
  for (const row of res.records) {
    records++;
    const b = row.bytes;
    let skipBlock = false, lastText = null;
    const add = (off, op, mode, start, end, via = null) => {
      const issues = [], ja = decodeText(b.subarray(start, end), issues);
      const e = { id: `${pad(rid, 3)}-${pad(row.id, 3)}-${pad(off, 4)}`, label: rid * 1000 + row.id, offset: off };
      if (skipBlock) e.skipBlock = true;
      if (via != null) e.via = `0x${hx(via)}`;
      lastText = e;
      e.ja = ja; Object.defineProperty(e, "bytes", { value: end - start + (off === start - 1 ? 0 : start - off - 1) });
      // Bytes that decode to control characters or invalid SJIS are data the linear read ran into, not text.
      if (issues.length || /[\x00-\x1f]/.test(ja)) { nonText.push({ id: e.id, issues, bytes: Buffer.from(b.subarray(start, end)).toString("hex") }); return; }
      entries.push(e); (perResource.get(rid) ?? perResource.set(rid, []).get(rid)).push(e);
    };
    for (let pc = 0; pc < b.length;) {
      const off = pc, op = b[pc++];
      if (op === 0x00) {
        const e = textEnd(b, pc);
        if (e > pc) add(off, op, null, pc, e);
        pc = e + 1; continue;
      }
      if (op === 0x17) { skipBlock = true; continue; } // 0x8001e... : runs the commands up to the next 0x15 only while skipping
      if (op === 0x15) skipBlock = false;
      if (op === 0x16 && lastText) lastText.beforeChoice = true;
      const lrow = op === 0x1d ? S[b[pc]] : P[op], at = op === 0x1d ? pc + 1 : pc;
      if (op === 0x1d && b[pc] === 0x03) { pc++; continue; }
      const n = len(lrow, b, at);
      if (n == null || at + n > b.length) { gaps.push({ label: rid * 1000 + row.id, offset: off, opcode: `0x${hx(op)}`, bytesLeft: b.length - off }); break; }
      // a wrapper (condition + one command) whose command is text
      if (lrow?.lengthRule?.includes("nested")) {
        const k = lrow.lengthRule.startsWith("2") ? 2 : 4, nop = b[at + k];
        if (nop === 0x00) { const s = at + k + 1; add(at + k, nop, null, s, textEnd(b, s), op); }
      }
      pc = at + n;
    }
  }
}

mkdirSync(join(out, "md"), { recursive: true });
const ids = new Set(); for (const e of entries) { if (ids.has(e.id)) throw new Error(`duplicate id ${e.id}`); ids.add(e.id); }
writeFileSync(join(out, "script.ja.json"), JSON.stringify({ schema: "kamaitachi.ps1.script.v1", source: { file: "SCE.PAC", sha1: createHash("sha1").update(pac).digest("hex") }, records, entries: entries.length, gaps, nonText, items: entries }, null, 1) + "\n");
for (const [rid, list] of perResource) {
  const md = [`# SCE resource ${rid}`, "", `${list.length} entries. Ids: resource-record-offset. Codes in [brackets] (docs/script-format.md).`, ""];
  let rec = -1;
  for (const e of list) {
    const r = e.label % 1000; if (r !== rec) { rec = r; md.push(`## ${e.label} (record ${r})`, ""); }
    md.push(`- \`${e.id}\`${e.beforeChoice ? " (choice)" : ""}${e.skipBlock ? " (skip block)" : ""}${e.via ? ` via ${e.via}` : ""}: ${e.ja}`);
  }
  writeFileSync(join(out, "md", `${pad(rid, 3)}.md`), md.join("\n") + "\n");
}
const chars = entries.reduce((n, e) => n + e.ja.replace(/\[[^\]]*\]/g, "").length, 0);
console.log(JSON.stringify({ records, entries: entries.length, beforeChoice: entries.filter((e) => e.beforeChoice).length, skipBlock: entries.filter((e) => e.skipBlock).length, glyphs: chars, gaps: gaps.length, nonText: nonText.length }));

// Check: text-like runs (four or more SJIS glyphs) that no entry covers, as a list for review.
{
  const covered = new Map(); // label -> [start, end) ranges of entries
  for (const e of entries) (covered.get(e.label) ?? covered.set(e.label, []).get(e.label)).push([e.offset, e.offset + 1 + e.bytes]);
  const missed = [];
  for (const [rid, res] of data.resources) for (const row of res.records) {
    const b = row.bytes, label = rid * 1000 + row.id, cov = covered.get(label) ?? [];
    for (let i = 0; i + 1 < b.length;) {
      let j = i, n = 0;
      while (j + 1 < b.length && b[j] >= 0x81 && b[j] <= 0x9f && b[j + 1] >= 0x40) { j += 2; n++; }
      if (n >= 4 && !cov.some(([s, e]) => i >= s && i < e)) { missed.push({ label, offset: i, ja: new TextDecoder("shift_jis").decode(b.subarray(i, j)) }); }
      i = n ? j : i + 1;
    }
  }
  writeFileSync(join(out, "uncovered.json"), JSON.stringify(missed, null, 1) + "\n");
  console.log(JSON.stringify({ uncoveredRuns: missed.length }));
}
