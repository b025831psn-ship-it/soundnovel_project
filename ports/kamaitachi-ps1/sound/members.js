// PAC archives and the sound members the module loads from them (MUS.PAC, VCE.PAC,
// VCP.PAC, BIN.PAC member 1), as the game reads them. Works on Uint8Arrays, so it runs
// in Node and in the browser. Callers pass bytes from the user's own disc.
import { vceParts } from "./container.js";
import { parseVabHead } from "./vab.js";

const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const be32 = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;

// PAC: LE {id, sector} entries up to id 0xffff (whose sector is the end); 2048-byte sectors.
export function readPac(bytes) {
  const e = [];
  for (let i = 0; ; i += 4) {
    const id = u16(bytes, i), s = u16(bytes, i + 2);
    if (id === 0xffff) { e.push({ end: s }); break; }
    e.push({ id, s });
  }
  return new Map(e.slice(0, -1).map((x, i) => [x.id, bytes.subarray(x.s * 2048, (e[i + 1].s ?? e[i + 1].end) * 2048)]));
}

const vabHead = (bytes) => ({ fsize: parseVabHead(bytes, 0).size, bytes });

// MUS.PAC member: BE {vabHead, vabBody, seq} offsets; the SEQ runs up to the VAB head.
export function musMember(b) {
  const h0 = be32(b, 0), b0 = be32(b, 4), s0 = be32(b, 8);
  const h = parseVabHead(b, h0);
  return { head: { fsize: h.size, bytes: b.subarray(h0, h0 + h.headSize) }, body: b.subarray(b0, b0 + h.bodySize), seq: b.subarray(s0, h0) };
}
// VCE.PAC member: VAB head, VAB body, effect script.
export function vceMember(b) {
  const p = vceParts(b);
  return { head: vabHead(p.head.bytes), body: p.body.bytes, script: p.script.bytes };
}
// VCP.PAC member: two VCE-style members played on adjacent channels.
export function vcpMember(b) {
  const sub = (i) => b.subarray(be32(b, 4 + 8 * i), be32(b, 4 + 8 * i) + be32(b, 8 + 8 * i));
  return [vceMember(sub(0)), vceMember(sub(1))];
}
// BIN.PAC member 1: five UI banks, parts (2i, 2i+1) = head, body.
export function uiBanks(bin1) {
  const p = vceParts(bin1).parts;
  return [0, 1, 2, 3, 4].map((i) => ({ head: vabHead(p[2 * i].bytes), body: p[2 * i + 1].bytes }));
}

// The module's loadMember(kind, id) over the four archives (each a Uint8Array).
export function memberLoader({ MUS, VCE, VCP, BIN }) {
  const mus = readPac(MUS), vce = readPac(VCE), vcp = VCP ? readPac(VCP) : new Map(), bin = BIN ? readPac(BIN) : new Map();
  const need = (m, kind, id) => { const b = m.get(id); if (!b) throw new Error(`sound: no ${kind} member ${id}`); return b; };
  return (kind, id) => {
    if (kind === "MUS") return musMember(need(mus, kind, id));
    if (kind === "VCE") return vceMember(need(vce, kind, id));
    if (kind === "VCP") return vcpMember(need(vcp, kind, id));
    if (kind === "UI") return bin.has(1) ? uiBanks(bin.get(1)) : null;
    return null;
  };
}
