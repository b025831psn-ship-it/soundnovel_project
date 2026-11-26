// Usage: node tools/check-scenario-sound.mjs <port-data dir> <dir with VCE/VCP/MUS.PAC and SLPS_017.94>
// Feeds every sound opcode (0x2f-0x36) reached by the scenario sweep into the ported
// sound module on a recording libsnd stub. Prints counts and locations only.
import { readFileSync } from "node:fs";
import { ScenarioVM } from "../src/vm.js";
import { sweep } from "../src/sweep.js";
import { SoundModule } from "../sound/module.js";
import { vceParts, readSoundTables } from "../sound/container.js";
import { parseVabHead } from "../sound/vab.js";
const D = (process.argv[3] || ".") + "/";
const pac = (f) => { const d = readFileSync(D + f); const e = []; for (let i = 0; ; i += 4) { const id = d.readUInt16LE(i), s = d.readUInt16LE(i + 2); if (id === 0xffff) { e.push({ end: s }); break; } e.push({ id, s }); } return new Map(e.slice(0, -1).map((x, i) => [x.id, d.subarray(x.s * 2048, (e[i + 1].s ?? e[i + 1].end) * 2048)])); };
const VCE = pac("VCE.PAC"), VCP = pac("VCP.PAC"), MUS = pac("MUS.PAC");
const tables = readSoundTables(readFileSync(D + "SLPS_017.94"));
const parse = (b) => { const p = vceParts(b); return { head: { fsize: parseVabHead(p.head.bytes, 0).size }, body: p.body.bytes, script: p.script.bytes }; };
const sub = (b, i) => b.subarray(b.readUInt32BE(4 + 8 * i), b.readUInt32BE(4 + 8 * i) + b.readUInt32BE(8 + 8 * i));
const miss = new Map(); const note = (k) => miss.set(k, (miss.get(k) || 0) + 1);
const loadMember = (p, id) => {
  if (p === "MUS") { const b = MUS.get(id); if (!b) { note("MUS:" + id); throw new Error("missing MUS " + id); } const vh = b.readUInt32BE(0); return { head: { fsize: b.readUInt32LE(vh + 12) }, body: b.subarray(b.readUInt32BE(4), b.readUInt32BE(8)), seq: b.subarray(b.readUInt32BE(8), vh) }; }
  if (p === "VCE") { const b = VCE.get(id); if (!b) { note("VCE:" + id); throw new Error("missing VCE " + id); } return parse(b); }
  if (p === "VCP") { const b = VCP.get(id); if (!b) { note("VCP:" + id); throw new Error("missing VCP " + id); } return [parse(sub(b, 0)), parse(sub(b, 1))]; }
  return null;
};
const keyed = new Set(); const calls = {};
const ss = new Proxy({}, { get: (_, k) => (...a) => { calls[k] = (calls[k] || 0) + 1;
  if (k === "SpuMallocWithStartAddr") return 0x1010; if (k === "SsVabOpenHeadSticky") return 1; if (k === "SsVabTransCompleted") return 1;
  if (k === "SsUtKeyOnV") { keyed.add(a[0]); return a[0]; } if (k === "SsUtKeyOffV") { keyed.delete(a[0]); return 0; }
  if (k === "SpuGetKeyStatus") { for (const v of keyed) if (a[0] === 1 << v) return 1; return 3; } return 0; } });
const mod = new SoundModule(ss, tables, { loadMember }); mod.reset();
const ops = {}, errors = new Map(), ids = { music: new Set(), fx: new Set() };
const orig = ScenarioVM.prototype.run;
ScenarioVM.prototype.run = function (...a) {
  const ev = orig.apply(this, a);
  for (const e of ev) { const oc = parseInt(e.opcode, 16);
    if (e.subopcode || ![0x2f, 0x30, 0x31, 0x32, 0x35, 0x36].includes(oc) || !e.operands) continue;
    ops[oc.toString(16)] = (ops[oc.toString(16)] || 0) + 1;
    const o = e.operands; const id = (oc === 0x35 || oc === 0x36) ? o[1] | o[2] << 8 : (oc === 0x31 || oc === 0x32) ? o[2] | o[3] << 8 : o[0] | o[1] << 8;
    (id < 1000 ? ids.music : ids.fx).add(id);
    try { mod.scenarioOp(oc, o); for (let f = 0; f < 3; f++) { mod.vsync(); mod.frame(); } }
    catch (err) { errors.set(err.message, `${e.resourceId}:${e.recordId}+${e.offset} op${oc.toString(16)} [${o.slice(0,4)}]`); }
  }
  return ev;
};
await sweep(process.argv[2], { unlockPolicy: "both" });
console.log("sound ops executed", ops);
console.log("distinct ids: music", ids.music.size, "effects", ids.fx.size);
console.log("missing members", [...miss.keys()].join(" ") || "none");
console.log("errors", errors.size, JSON.stringify([...errors].slice(0, 10)));
console.log("libsnd calls", JSON.stringify(calls));
