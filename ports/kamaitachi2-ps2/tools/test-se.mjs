// Bulk SE check: every SE id the ScenePack plays must resolve to a sep.pac record whose
// tracks parse to an end, whose bank exists, and which renders finite, audible audio.
//   node test-se.mjs <se-dir> <scenepack.json> [--wav id out.wav] [--seconds 8]
import fs from 'node:fs';
import path from 'node:path';
import { SepPack, WdBank, SeEngine, parseTrack, SPU_RATE, setGaussTable } from '../se.js';

const [dir, packPath, ...rest] = process.argv.slice(2);
const opt = (name, fallback) => { const i = rest.indexOf(name); return i < 0 ? fallback : rest[i + 1]; };
const seconds = +opt('--seconds', 8);
const buf = f => { const b = fs.readFileSync(f); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); };
const sep = new SepPack(buf(path.join(dir, 'sep.pac')));
const gaussFile = path.join(dir, 'gauss.bin');
if (fs.existsSync(gaussFile)) setGaussTable(new Int16Array(buf(gaussFile)));
console.log(`interpolation: ${fs.existsSync(gaussFile) ? 'SPU2 gaussian (gauss.bin)' : 'cubic stand-in'}`);
const banks = new Map();
const bank = id => {
  if (!banks.has(id)) {
    const f = path.join(dir, `wave${String(id).padStart(4, '0')}.wd`);
    banks.set(id, fs.existsSync(f) ? new WdBank(buf(f)) : null);
  }
  return banks.get(id);
};

function render(id, params = {}, limit = seconds) {
  const engine = new SeEngine(sep, bank);
  engine.play(id, params);
  const L = [], R = [], block = 4800;
  let peak = 0, ended = 0, bad = 0;
  for (let n = 0; n < limit * SPU_RATE; n += block) {
    const l = new Float32Array(block), r = new Float32Array(block);
    engine.render(l, r);
    for (let i = 0; i < block; i++) {
      if (!Number.isFinite(l[i]) || !Number.isFinite(r[i])) bad++;
      peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
    }
    L.push(l); R.push(r);
    if (!engine.active) { ended = (n + block) / SPU_RATE; break; }
  }
  return {L, R, peak, ended, bad};
}

function wav(file, L, R) {
  const n = L.reduce((a, b) => a + b.length, 0), out = Buffer.alloc(44 + n * 4);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 4, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SPU_RATE, 24); out.writeUInt32LE(SPU_RATE * 4, 28); out.writeUInt16LE(4, 32);
  out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(n * 4, 40);
  let o = 44;
  L.forEach((l, k) => { const r = R[k]; for (let i = 0; i < l.length; i++) {
    out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(l[i] * 32767))), o);
    out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(r[i] * 32767))), o + 2); o += 4; } });
  fs.writeFileSync(file, out);
}

const wavId = opt('--wav', null);
if (wavId) {
  const {L, R, peak, ended} = render(+wavId, {}, seconds);
  wav(rest[rest.indexOf('--wav') + 2], L, R);
  console.log(`${wavId}: peak ${peak.toFixed(3)}, ${ended ? 'ended ' + ended.toFixed(2) + 's' : 'still playing'}`);
  process.exit(0);
}

const source = JSON.parse(fs.readFileSync(packPath, 'utf8'));
const pack = source.scenePack ?? source;
const uses = new Map();
for (const [name, entry] of Object.entries(pack)) for (const c of entry.commands ?? [])
  if (c.op === 0x0c) uses.set(c.id, uses.get(c.id) || name);
const failures = [], summary = {ids: uses.size, ended: 0, looping: 0, silent: 0};
for (const [id, scene] of uses) {
  const rec = sep.get(id);
  if (!rec) { failures.push(`${id} (${scene}): not in sep.pac`); continue; }
  if (!bank(rec.bank)) { failures.push(`${id}: wave${rec.bank}.wd missing`); continue; }
  rec.tracks.forEach((t, k) => { const p = parseTrack(t); if (p.error) failures.push(`${id} track ${k}: ${p.error}`); });
  const {peak, ended, bad} = render(id, {}, 4);
  if (bad) failures.push(`${id}: ${bad} non-finite samples`);
  if (peak < 1e-4) { summary.silent++; failures.push(`${id} (${scene}): silent`); }
  if (peak > 1) summary.saturating = (summary.saturating || 0) + 1;  // the SPU2 output saturates too
  ended ? summary.ended++ : summary.looping++;
}
console.log(JSON.stringify(summary));
if (failures.length) { console.log(failures.join('\n')); process.exitCode = 1; }
else console.log('every ScenePack SE id resolves, parses and renders: PASS');
