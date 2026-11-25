// Usage: node tools/check-sound-data.mjs <dir with MUS.PAC and VCE.PAC from the user-owned disc>
// Prints counts only; never writes or prints payload bytes.
import { readFileSync } from "node:fs";
import { parseVabHead } from "../sound/vab.js";
import { parseSeqHeader, readSeqEvents } from "../sound/seq.js";
import { decodeSample } from "../sound/vag.js";
const U = (process.argv[2] || ".") + "/";
const pac = (f) => { const d = readFileSync(U + f); const e = []; for (let i = 0; ; i += 4) { const id = d.readUInt16LE(i), s = d.readUInt16LE(i + 2); if (id === 0xffff) { e.push({ end: s }); break; } e.push({ id, s }); } return e.slice(0, -1).map((x, i) => ({ id: x.id, bytes: d.subarray(x.s * 2048, (e[i + 1].s ?? e[i + 1].end) * 2048) })); };
const be = (b, o) => b.readUInt32BE(o);
let ok = 0, bad = [], stat = { notes: 0, vags: 0, loops: 0, nrpn: 0, tempo: new Set() };
for (const m of pac("MUS.PAC")) {
  const b = m.bytes; const vab = be(b, 0), seq = be(b, 8);
  try {
    const h = parseVabHead(b, vab); const s = parseSeqHeader(b, seq); const ev = readSeqEvents(b, s);
    const vbStart = 0x1c, vbEnd = seq; const fits = h.bodySize <= vbEnd - vbStart + 16;
    if (!ev.events.length || ev.events.at(-1).type !== "end" || !fits) bad.push({ id: m.id, end: ev.events.at(-1)?.type, body: h.bodySize, room: vbEnd - vbStart });
    else ok++;
    stat.notes += ev.events.filter(e => e.type === "on" && e.b).length; stat.nrpn += ev.events.filter(e => e.type === "cc" && (e.a === 99 || e.a === 98)).length; stat.tempo.add(s.tempo);
    for (let v = 1; v <= h.vagCount; v++) { const r = decodeSample(b, vbStart + h.vagOffsets[v]); stat.vags++; if (r.repeats) stat.loops++; if (r.blocks * 16 > h.vagSizes[v] + 16) bad.push({ id: m.id, vag: v, blocks: r.blocks, size: h.vagSizes[v] }); }
  } catch (e) { bad.push({ id: m.id, err: e.message }); }
}
console.log("MUS ok", ok, "bad", bad.length, JSON.stringify(bad.slice(0, 6)), { ...stat, tempo: stat.tempo.size });
let vok = 0, vbad = [];
for (const m of pac("VCE.PAC")) { const b = m.bytes; try { const n = be(b, 0); const offs = [1, 2, 3].map(i => be(b, 4 * i)); const h = parseVabHead(b, offs[0]); const room = be(b, 16) ; vok++; if (vok < 3) console.log(m.id, n, offs, h.version, h.programCount, h.toneCount, h.vagCount, h.bodySize, be(b,16), be(b,20), be(b,24)); } catch (e) { vbad.push({ id: m.id, err: e.message }); } }
console.log("VCE ok", vok, "bad", vbad.length, JSON.stringify(vbad.slice(0, 4)));
