// Replays zakuro-sfc-kor routes/completion.json (the native Snes9x 100% campaign) on the 65c816 VM with
// the same joypad timing as tools/completion_campaign.py / autoplay.py: cold boot, per play advance to
// each recorded menu, pick the recorded option, reach the recorded ending, real reset + reload of the
// same SRAM, then compare score, flags and new IDs. Every mismatch goes into one list; it never stops
// early unless the game state makes the next play impossible.
// Usage: node vm-completion.mjs <vm ports/zakuro-sfc> <rom> <ipl.bin> <boot-dsp.bin> <layout.json> <completion.json> <out.json> [statesDir]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const [vmDir, romPath, iplPath, dspPath, layoutPath, routePath, outPath, statesDir] = process.argv.slice(2);
const SCENE_COUNT = 1342;
const BTN = { 3: 0x1000, 5: 0x0400, 8: 0x0080 };
const LAYOUT = JSON.parse(await readFile(layoutPath, 'utf8'));
const ENDINGS = Object.fromEntries(Object.entries(LAYOUT.endings).map(([k, v]) => [Number(k), v]));
const record = JSON.parse(await readFile(routePath, 'utf8'));

const { createApuLink, ZakuroVM } = await import(pathToFileURL(resolve(vmDir, 'vm/index.js')));
const [rom, ipl, powerOnDsp] = await Promise.all([readFile(romPath), readFile(iplPath), readFile(dspPath)]);
// RESET=cpu uses vm.reset() (CPU only); RESET=power rebuilds the console and keeps the cartridge SRAM.
const RESET = process.env.RESET ?? 'cpu';
let vm, w;
const powerOn = (sram) => {
  const { link } = createApuLink({ ipl, powerOnDsp });
  vm = new ZakuroVM({ rom, masterLink: link });
  vm.skipRender = true;
  if (sram) vm.importSram(sram);
  w = vm.bus.wram;
};
powerOn(null);
const hardReset = () => { if (RESET === 'cpu') vm.reset(); else powerOn(vm.exportSram()); };
let fields = 0;
const step = (b = 0) => { vm.setJoypad(b ? BTN[b] : 0); const f = vm.ppu.field; while (vm.ppu.field === f) vm.step(); fields++; };
const stepMany = (n, b = 0) => { for (let i = 0; i < n; i++) step(b); };
const u16 = (a) => w[a] | (w[a + 1] << 8);
const readCursor = () => [w[0x1000] === 0xf6 && w[0x1001] === 0xf6 ? u16(0x1002) : -1, u16(0x34)];
const menu = () => {
  if (w[0x7f] !== 255) return null;
  const count = w[0x82] + 1;
  if (!(count >= 1 && count <= 8)) throw new Error(`Unexpected menu length ${count}`);
  return Array.from({ length: count }, (_, i) => u16(0x83 + i * 2));
};
const tap = (b, wait = 8) => { stepMany(2, b); stepMany(wait); };
const scenes = new Set();
const sample = () => { const p = readCursor(); if (p[0] >= 0 && p[0] < SCENE_COUNT) scenes.add(p[0]); return p; };
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
const advance = () => {
  let previous = null, stable = 0;
  for (let i = 0; i < 1800; i++) {
    const position = sample();
    if (menu()) {
      for (let k = 0; k < 30; k++) { stepMany(6); sample(); }
      if (same(readCursor(), position) && menu()) return 'menu';
      previous = null; stable = 0; continue;
    }
    stable = same(previous, position) ? stable + 1 : 0;
    if (stable >= 32) {
      const [scene, cursor] = position;
      if (scene in ENDINGS && (cursor === 0 || u16(0x1000 + cursor) === 0xffff)) return 'ending';
      return 'stalled';
    }
    previous = position;
    stepMany(2, 8);
    for (let k = 0; k < 3; k++) { stepMany(6); sample(); }
  }
  return 'advance_limit';
};
const select = (index, expected) => {
  for (let i = 0; i < index; i++) tap(5);
  if (w[0x81] !== index) return `cursor ${w[0x81]} != ${index}`;
  stepMany(2, 8);
  for (let i = 0; i < 360; i++) { step(); if (readCursor()[0] === expected && !menu()) return null; }
  return `arrived ${readCursor()[0]}`;
};
const bootSteps = (n, starts) => { for (let s = 0; s < n; s++) { if (s) stepMany(3, starts.includes(s) ? 3 : 8); stepMany(s ? 181 : 301); } };
const progress = () => {
  const flags = [...w.subarray(0x82f, 0x835)];
  const stored = new Set();
  for (let i = 0; i < 84; i++) { const v = u16(0x835 + i * 2); if (v !== 0xffff) stored.add(v); }
  const points = flags.slice(0, 5).filter((v) => v !== 255).length * 3 + (flags[5] !== 255 ? 1 : 0) + stored.size;
  return { flags, stored, points };
};
const hex = (a) => a.map((v) => v.toString(16).padStart(2, '0')).join('');

const t0 = Date.now();
const failures = [], plays = [], branches = [], branched = new Set();
const recorded = new Set(record.plays.flatMap((p) => p.choices.map((c) => `${c.scene},${c.target}`)));
const fail = (play, where, expected, actual) => { failures.push({ play, where, expected, actual, field: fields }); console.error(`FAIL play ${play} ${where}: expected ${JSON.stringify(expected)} got ${JSON.stringify(actual)}`); };
if (statesDir) await mkdir(statesDir, { recursive: true });

// FROM=<play> SRAM=<after-play-(FROM-1).srm> [TO=<play>]: start from a saved slot so ranges run in parallel.
const FROM = Number(process.env.FROM ?? 1), TO = Number(process.env.TO ?? record.plays.length);
if (FROM > 1) { powerOn(new Uint8Array(await readFile(process.env.SRAM))); bootSteps(6, [1, 3]); }
else bootSteps(9, [1, 3, 6, 8]);
if (FROM === 1 && readCursor()[0] !== 0) fail(0, 'cold_boot', 0, readCursor()[0]);

for (const [n, want] of record.plays.entries()) {
  if (n + 1 < FROM || n + 1 > TO) continue;
  const play = n + 1, startField = fields;
  const before = progress();
  const opened = readCursor()[0];
  if (opened !== want.opening) fail(play, 'opening', want.opening, opened);
  const route = [];
  let broken = false;
  for (const c of want.choices) {
    const status = advance();
    const [scene] = readCursor();
    const targets = status === 'menu' ? menu() : null;
    if (status !== 'menu' || scene !== c.scene || !targets?.includes(c.target)) {
      fail(play, `menu ${c.scene}`, { status: 'menu', scene: c.scene, target: c.target }, { status, scene, targets });
      broken = true; break;
    }
    if (process.env.BRANCH) {
      // Fork every option the record never takes from here, check it lands on its target and runs to the next stop.
      for (const [i, t] of targets.entries()) {
        const key = `${scene},${t}`;
        if (recorded.has(key) || branched.has(key)) continue;
        branched.add(key);
        const st = vm.saveState();
        const err = select(i, t);
        const stop = err ? null : advance();
        const at = readCursor();
        branches.push({ play, scene, choice: i + 1, target: t, error: err, stop, at: at[0] });
        if (err || !['menu', 'ending'].includes(stop)) fail(play, `branch ${scene}->${t}`, 'menu or ending', { err, stop, at });
        console.error(`branch ${scene} #${i + 1} -> ${t}: ${err ?? stop} at ${at[0]}`);
        vm.loadState(st);
      }
    }
    const index = targets.indexOf(c.target);
    if (index + 1 !== c.choice) fail(play, `choice index at ${c.scene}`, c.choice, index + 1);
    const err = select(index, c.target);
    if (err) { fail(play, `select ${c.scene}->${c.target}`, c.target, err); broken = true; break; }
    route.push({ scene: c.scene, choice: index + 1, target: c.target });
  }
  let ending = null;
  if (!broken) {
    const status = advance();
    ending = readCursor()[0];
    if (status !== 'ending' || ending !== want.ending) { fail(play, 'ending', want.ending, { status, scene: ending }); broken = true; }
  }
  // Real reset and reload of the same SRAM slot.
  if (process.env.DUMP_ENDING && play === 1) await writeFile(process.env.DUMP_ENDING, gzipSync(Buffer.from(JSON.stringify({ sram: [...vm.exportSram()] }))));
  if (statesDir) await writeFile(resolve(statesDir, `after-play-${String(play).padStart(2, '0')}.srm`), vm.exportSram());
  hardReset();
  bootSteps(6, [1, 3]);
  const after = progress();
  const newIds = [...after.stored].filter((i) => !before.stored.has(i)).sort((a, b) => a - b);
  if (after.points !== want.score) fail(play, 'score', want.score, after.points);
  if (u16(0x375) !== after.points) fail(play, 'engine score $0375', after.points, u16(0x375));
  if (hex(after.flags) !== want.flags) fail(play, 'flags', want.flags, hex(after.flags));
  if (JSON.stringify(newIds) !== JSON.stringify(want.new_ids)) fail(play, 'new_ids', want.new_ids, newIds);
  plays.push({ play, opening: opened, ending, choices: route.length, score: after.points, flags: hex(after.flags), new_ids: newIds, fields: fields - startField });
  console.error(`play ${play}: ending ${ending} (${want.ending}), ${route.length}/${want.choices.length} choices, score ${after.points} (${want.score}), ${fields - startField} fields, ${((Date.now() - t0) / 1000) | 0} s`);
  if (broken && readCursor()[0] !== (after.points === 100 ? 1310 : 0)) { fail(play, 'cannot continue', 'opening', readCursor()[0]); break; }
}
const final = progress();
const out = {
  engine: 'zakuro 65c816 VM', reference: 'routes/completion.json', reference_core_sha256: record.core_sha256,
  seconds: (Date.now() - t0) / 1000, fields, game_seconds: fields / 60.0988,
  plays_replayed: plays.length, plays_expected: record.plays.length,
  choices_replayed: plays.reduce((s, p) => s + p.choices, 0), choices_expected: record.plays.reduce((s, p) => s + p.choices.length, 0),
  final_score: final.points, stored_ids: final.stored.size, stored_ids_match: JSON.stringify([...final.stored].sort((a, b) => a - b)) === JSON.stringify(record.stored_ids),
  visited_scenes: scenes.size, unvisited_scenes: Array.from({ length: SCENE_COUNT }, (_, i) => i).filter((i) => !scenes.has(i)), options_recorded: recorded.size, options_branched: branches.length, failures, branches, plays,
};
await writeFile(outPath, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ...out, plays: undefined }, null, 1));
