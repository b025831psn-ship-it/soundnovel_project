// to.flo: time-chart / flowchart database (plain, little endian).
// Header: u32 4, u16 thumbCount, u16 groupCount, u32 groupBase, u32 nodeCount, u32 nodeBase.
//  thumbs: thumbCount x 34-byte picture names from 0x14.
//  groups: groupCount u32 offsets (from groupBase); group = u32 n, n x [label 34][u32 node].
//  nodes: 456 header bytes, then nodeCount x 460-byte records:
//    +0x002 title (Shift-JIS, 36), +0x026 up to 11 labels x 34,
//    +0x19C u8 character, u8 kind, u8 ?, u8 hour, u32 minute(low byte), u16 a, u16 block, u16 row, u16 link,
//    +0x1C0 u16 ?, u16 y.  kind (seen): 0 RESTART, 1 choice, 2 GOON, 3 ZAP, 4/7 CONTINUE, 5 BADEND.
const u16 = (d, o) => d[o] | (d[o + 1] << 8);
const u32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;
const str = (d, o, n, dec) => { let e = o; while (e < o + n && d[e]) e++; return dec.decode(d.subarray(o, e)); };

export function parseFlo(d) {
  const sj = new TextDecoder('shift_jis'), as = new TextDecoder('ascii');
  const thumbCount = u16(d, 4), groupCount = u16(d, 6), groupBase = u32(d, 8), nodeCount = u32(d, 12), nodeBase = u32(d, 16);
  const thumbs = []; for (let i = 0; i < thumbCount; i++) thumbs.push(str(d, 0x14 + i * 34, 34, as));
  const groups = [];
  for (let i = 0; i < groupCount; i++) {
    const o = groupBase + u32(d, groupBase + i * 4), n = u32(d, o); const items = [];
    for (let k = 0; k < n && k < 64; k++) { const p = o + 4 + k * 38; items.push({ label: str(d, p, 34, as), node: u32(d, p + 34) }); }
    groups.push(items);
  }
  const nodes = []; const b = nodeBase + 456;
  for (let i = 0; i < nodeCount; i++) {
    const r = b + i * 460; const labels = [];
    for (let k = 0; k < 11; k++) { const l = str(d, r + 0x26 + k * 34, 34, as); if (l) labels.push(l); }
    nodes.push({ index: i, title: str(d, r + 2, 36, sj), labels, character: d[r + 0x19c], kind: d[r + 0x19d], sub: d[r + 0x19e],
      hour: d[r + 0x19f], minute: d[r + 0x1a0], a: u16(d, r + 0x1a4), block: u16(d, r + 0x1a6), row: u16(d, r + 0x1a8), link: u16(d, r + 0x1aa), y: u16(d, r + 0x1c2) });
  }
  return { thumbs, groups, nodes };
}
