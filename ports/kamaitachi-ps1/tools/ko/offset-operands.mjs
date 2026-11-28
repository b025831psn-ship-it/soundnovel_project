#!/usr/bin/env node
// Usage: node tools/ko/offset-operands.mjs SCE.PAC PORT_DATA/manifest.json OUT.json
// The operands of the scenario commands that hold a byte offset into their own resource:
//   0x1e (u16 offset)   0x45 (u16 value, u16 offset)   0x39 animStart (u8 slot, u16 offset, ...)
// The Korean text changes the length of the records, so these operands are moved with the bytes
// they point to (src/ko.js patchResource). OUT.json: { "RID": [[record, operand offset in the
// record], ...] }; tools/ko/build-ko.py --offsets puts it in ko-script.json. Records are read
// linearly with the opcode lengths of the manifest, as tools/extract-script.mjs reads them.
import { readFileSync, writeFileSync } from "node:fs";
import { ike } from "../../src/screen/ike.js";

const [pacPath, manifestPath, out] = process.argv.slice(2);
if (!out) { console.error("usage: node tools/ko/offset-operands.mjs SCE.PAC PORT_DATA/manifest.json OUT.json"); process.exit(2); }
const pac = new Uint8Array(readFileSync(pacPath)), manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const u16 = (b, o) => b[o] | (b[o + 1] << 8);
function unpackMember(b) {
  if (b[2] !== 0x69 || b[3] !== 0x6b || b[4] !== 0x65) return b; // "ike"
  const buf = new Uint8Array(0x40000); buf.set(b);
  const m = { read: (a, w) => { let v = 0; for (let k = 0; k < w; k++) v |= buf[a + k] << (8 * k); return v >>> 0; }, write: (a, v, w) => { for (let k = 0; k < w; k++) buf[a + k] = (v >>> (8 * k)) & 0xff; } };
  const n = ike(m, 0, 0x20000); return buf.slice(0x20000, 0x20000 + n);
}
const rows = []; for (let i = 0; ; i += 4) { const id = u16(pac, i), s = u16(pac, i + 2); rows.push({ id, s }); if (id === 0xffff) break; }
const P = manifest.opcodeTables.primary.lengths, S = manifest.opcodeTables.sub1d.lengths;
const SINGLE = new Set([0x20, 0x40, 0x72, 0x52, 0x4c, 0x70, 0x50, 0x67, 0x6b, 0x6f]);
const textEnd = (b, e) => { while (e < b.length && b[e] !== 0) e += SINGLE.has(b[e]) ? 1 : 2; return Math.min(e, b.length); };
function len(row, b, pc) {
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
function nested(b, at, prefix) {
  const op = b[at]; if (op == null) return prefix;
  if (op === 0x00) { const e = textEnd(b, at + 1); return e < b.length ? prefix + e - at + 1 : null; }
  if (op === 0x17) return prefix + 1;
  const n = len(P[op], b, at + 1); return n == null ? null : prefix + 1 + n;
}
const AT = { 0x1e: 0, 0x45: 2, 0x39: 1 }; // where the offset is among the operands
const result = {}; let count = 0;
rows.slice(0, -1).forEach((r, i) => {
  const b = unpackMember(pac.subarray(r.s * 2048, rows[i + 1].s * 2048));
  const n = u16(b, 0) / 2; if (!n || u16(b, 0) % 2 || u16(b, 0) > b.length) return;
  const offs = Array.from({ length: n }, (_, k) => u16(b, 2 * k)), list = [];
  offs.forEach((o, rec) => {
    const d = b.subarray(o, rec + 1 < n ? offs[rec + 1] : b.length);
    const note = (op, at) => { if (op in AT) list.push([rec, at + AT[op]]); };
    for (let pc = 0; pc < d.length;) {
      const op = d[pc++];
      if (op === 0x00) { pc = textEnd(d, pc) + 1; continue; }
      if (op === 0x17) continue;
      const row = op === 0x1d ? S[d[pc]] : P[op], at = op === 0x1d ? pc + 1 : pc;
      if (op === 0x1d && d[pc] === 0x03) { pc++; continue; }
      const k = len(row, d, at);
      if (k == null || at + k > d.length) break;
      if (op !== 0x1d) note(op, at);
      if (row?.lengthRule?.includes("nested")) { const w = row.lengthRule.startsWith("2") ? 2 : 4; note(d[at + w], at + w + 1); }
      pc = at + k;
    }
  });
  if (list.length) { result[r.id] = list; count += list.length; }
});
writeFileSync(out, JSON.stringify(result));
console.log(JSON.stringify({ resources: Object.keys(result).length, operands: count }));
