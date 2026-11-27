// Usage: node tools/check-vce-scripts.mjs <dir with VCE.PAC and SLPS_017.94 from the user-owned disc>
// Runs every effect script through the ported sound module on a recording libsnd
// stub and prints counts only (no payload bytes).
import { readFileSync } from "node:fs";
import { SoundModule, VCE_OPS } from "../sound/module.js";
import { vceParts, readSoundTables } from "../sound/container.js";
import { parseVabHead } from "../sound/vab.js";

const dir = (process.argv[2] || ".") + "/";
const frames = Number(process.argv[3] || 1800);
const flagAt = Number(process.argv[4] || -1); // frame at which the scenario flag for the effect is raised
const pac = (f) => { const d = readFileSync(dir + f); const e = []; for (let i = 0; ; i += 4) { const id = d.readUInt16LE(i), s = d.readUInt16LE(i + 2); if (id === 0xffff) { e.push({ end: s }); break; } e.push({ id, s }); } return e.slice(0, -1).map((x, i) => ({ id: x.id, bytes: d.subarray(x.s * 2048, (e[i + 1].s ?? e[i + 1].end) * 2048) })); };
const tables = readSoundTables(readFileSync(dir + "SLPS_017.94"));

function stub(log) {
  const keyed = new Set(); let vab = 0;
  const ss = new Proxy({}, { get: (_, k) => {
    if (k === "SpuMallocWithStartAddr") return (s, n) => 0x1010;
    if (k === "SsVabOpenHeadSticky") return () => vab++ % 16;
    if (k === "SsVabTransCompleted") return () => 1;
    if (k === "SsSeqOpen") return () => 0;
    if (k === "SsUtKeyOnV") return (v) => { keyed.add(v); log.push(k); return v; };
    if (k === "SsUtKeyOffV") return (v) => { keyed.delete(v); log.push(k); return 0; };
    if (k === "SpuGetKeyStatus") return (mask) => { for (const v of keyed) if (mask === 1 << v) return 1; return 3; };
    return (...a) => { log.push(k); return 0; };
  } });
  return ss;
}

const ops = new Array(VCE_OPS.length).fill(0);
const res = { ok: 0, ended: 0, running: 0, errors: [], noNote: 0, rumble: 0 };
for (const m of pac("VCE.PAC")) {
  const log = [];
  try {
    const p = vceParts(m.bytes);
    const head = parseVabHead(p.head.bytes, 0);
    const mod = new SoundModule(stub(log), tables, { trace: (t) => ops[VCE_OPS.findIndex((o) => o.name === t.op)]++, rumble: () => res.rumble++ });
    mod.reset();
    mod.startEffect(m.id, 0, 0, { head: { fsize: head.size }, body: p.body.bytes, script: p.script.bytes });
    let f = 0;
    for (; f < frames && mod.active[0]; f++) { if (f === flagAt) mod.setFlag(mod.ch[0].id, 1); mod.vsync(); mod.frame(); }
    if (mod.active[0]) res.running++; else res.ended++;
    if (!log.includes("SsUtKeyOnV")) res.noNote++;
    res.ok++;
  } catch (e) { res.errors.push({ id: m.id, err: e.message }); }
}
console.log("VCE scripts", { ...res, errors: res.errors.length }, JSON.stringify(res.errors.slice(0, 8)));
console.log("ops used", Object.fromEntries(VCE_OPS.map((o, i) => [o.name, ops[i]])));

// Scenario path: play(1000 + member) / stop for every VCE member and every VCP pair.
{
  const vce = new Map(pac("VCE.PAC").map((m) => [m.id, m.bytes]));
  let vcp = new Map();
  try { vcp = new Map(pac("VCP.PAC").map((m) => [m.id, m.bytes])); } catch {}
  const parse = (bytes) => { const p = vceParts(bytes); return { head: { fsize: parseVabHead(p.head.bytes, 0).size }, body: p.body.bytes, script: p.script.bytes }; };
  const sub = (bytes, i) => { const be = (o) => bytes.readUInt32BE(o); return bytes.subarray(be(4 + 8 * i), be(4 + 8 * i) + be(8 + 8 * i)); };
  const loadMember = (pacName, id) => pacName === "VCE" ? parse(vce.get(id)) : pacName === "VCP" ? [parse(sub(vcp.get(id), 0)), parse(sub(vcp.get(id), 1))] : null;
  const r = { played: 0, pairs: 0, missing: [], errors: [] };
  const log = [];
  const mod = new SoundModule(stub(log), tables, { loadMember });
  mod.reset();
  const ids = [...vce.keys(), ...[...vcp.keys()].filter((k) => tables.effects[k % 1000].pairMode === 1)];
  for (const member of ids) {
    const n = member % 1000, fx = tables.effects[n];
    if (fx.pairMode === 1 && !vcp.has(member)) { r.missing.push(member); continue; }
    try {
      mod.play(1000 + member, 0);
      for (let f = 0; f < 120; f++) { mod.vsync(); mod.frame(); }
      if (mod.channelOf[n] !== 0xff) { r.played++; if (fx.pairMode === 1) r.pairs++; }
      mod.stop(1000 + member, 0); mod.frame();
    } catch (e) { r.errors.push({ member, err: e.message }); }
  }
  console.log("scenario play/stop", { ...r, missing: r.missing.length, errors: r.errors.length }, JSON.stringify([r.missing.slice(0, 8), r.errors.slice(0, 4)]));
}
