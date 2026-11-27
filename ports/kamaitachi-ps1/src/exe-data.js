// The EXE data asset (made by tools/extract-exe-data.mjs from the user's own SLPS_017.94):
// "KPXD", u32 count, then per range u32 address, u32 length and the bytes. Data only, no code.
export function pack(parts) {
  const n = parts.reduce((s, p) => s + 8 + p.bytes.length, 8), out = new Uint8Array(n), dv = new DataView(out.buffer);
  out.set([0x4b, 0x50, 0x58, 0x44]); dv.setUint32(4, parts.length, true);
  let o = 8; for (const p of parts) { dv.setUint32(o, p.addr >>> 0, true); dv.setUint32(o + 4, p.bytes.length, true); out.set(p.bytes, o + 8); o += 8 + p.bytes.length; }
  return out;
}
export function unpack(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), parts = [];
  if (String.fromCharCode(...buf.subarray(0, 4)) !== "KPXD") throw new Error("not an EXE data asset (exe-data.bin)");
  for (let i = 0, o = 8, n = dv.getUint32(4, true); i < n; i++) { const addr = dv.getUint32(o, true), len = dv.getUint32(o + 4, true); parts.push({ addr, bytes: buf.subarray(o + 8, o + 8 + len) }); o += 8 + len; }
  return parts;
}
// Reads of the data by address (for tables read before there is a machine), as sound/container.js's exeReader.
export function reader(parts) {
  const at = (a) => { for (const p of parts) { const o = (a >>> 0) - (p.addr >>> 0); if (o >= 0 && o < p.bytes.length) return [p.bytes, o]; } throw new Error(`EXE data: 0x${(a >>> 0).toString(16)} is not in the asset`); };
  const u8 = (a) => { const [b, o] = at(a); return b[o]; };
  return { u8, u16: (a) => u8(a) | (u8(a + 1) << 8), u32: (a) => (u8(a) | (u8(a + 1) << 8) | (u8(a + 2) << 16) | (u8(a + 3) << 24)) >>> 0,
    bytes: (a, n) => { const [b, o] = at(a); return b.subarray(o, o + n); } };
}
