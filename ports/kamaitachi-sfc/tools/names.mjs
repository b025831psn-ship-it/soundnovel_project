// Suspect-name prompts on the VM against the original-hardware map (graph.json): for each of
// the three culprit keyboards, follow the recorded path from the 43-ending save, save the VM
// state at the keyboard, and for every name the original tried enter it again and compare
// the next event and the gold rows the game itself picked (internal dispatches).
// Extra names check rules from the 78514.com name table (honorifics, nicknames): each must
// lead to the same place as its base name, or must not when the table says it is rejected.
//   node tools/names.mjs <rom.sfc> --data <dir> --graph <dir with graph.json> --seed <srm> --out <json> [--vm <dir>]
import fs from 'node:fs';
import path from 'node:path';
import { APU } from '../sound/apu.js';
import { MasterLink } from '../sound/master-link.js';
import { Session, enterCulprit, bootSlot } from './campaign.mjs';

// [name, base name it should behave like, true = accepted as the base, false = must differ]
const EXTRA = [['みきもとさん', 'みきもと', true], ['あきべえどん', 'あき', true], ['あきさんだぜ', 'あき', true],
  ['あきどんくん', 'あき', false], ['としおさん', 'としお', true], ['ちょんまげ', 'としお', true], ['まげ', 'としお', true]];

async function main() {
  const args = process.argv.slice(2), romPath = args[0];
  const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
  const vm = opt('--vm', process.env.SFC_VM ?? '../../../sfc-vm');
  const catalog = JSON.parse(fs.readFileSync(path.join(opt('--data'), 'scenario-catalog.json')));
  const sites = new Map(catalog.choices.map((x) => [x.id, x]));
  const report = JSON.parse(fs.readFileSync(path.join(opt('--graph'), 'graph.json')));
  const seed = new Uint8Array(fs.readFileSync(opt('--seed')));
  const rom = new Uint8Array(fs.readFileSync(romPath));
  const { SfcMachine } = await import(`${vm}/machine.js`);
  const groups = new Map();
  for (const e of report.edges) if (e.from.startsWith('name-')) {
    const k = JSON.stringify(e.path.slice(0, -1)); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e);
  }
  const results = [], prompts = new Map();
  for (const [k, edges] of groups) {
    const prefix = JSON.parse(k);
    const apu = new APU(); apu.powerOn();
    const m = new SfcMachine({ rom, apu, busOptions: { masterLink: new MasterLink(apu) } });
    const s = new Session(m, rom, catalog);
    const hook = s.hook.bind(s);
    s.hook = (pc, cpu, w) => {
      if (pc === 0xa476 && (w[0xb9a] || w[0xb9b]) && !s.raw) { const a = (w[0x3c9] | (w[0x3ca] << 8) | (w[0x3cb] << 16)) >>> 3;
        s.raw = [(cpu.x & 255) >> 1, (((a >>> 16) & 127) * 0x8000 + (a & 0x7fff)) * 8 + ((w[0x3c9]) & 7)]; }
      return hook(pc, cpu, w);
    };
    bootSlot(s, seed);
    for (const step of prefix) {
      const ev = s.advance(), cut = step.lastIndexOf('/'), site = step.slice(0, cut), o = step.slice(cut + 1);
      if (ev.id !== site) throw new Error(`Path expected ${site}, VM reached ${JSON.stringify(ev)}`);
      if (ev.status === 'choice') { s.step(20); s.select(+o); } else { enterCulprit(s, o); s.lastName = null; }
    }
    const prompt = s.advance();
    if (prompt.id !== edges[0].from) throw new Error(`Expected ${edges[0].from}, VM reached ${JSON.stringify(prompt)}`);
    const base = m.saveState();
    const sig = ['internal', 'lastBit', 'pending', 'accepted', 'acceptedBit', 'terminal', 'lastMenuRead', 'lastName', 'lastEndingFlag'].map((k) => [k, s[k]]);
    prompts.set(k, { m, s, base, sig });
    const tryName = (name) => {
      m.loadState(base); for (const [k, v] of sig) s[k] = v; s.dispatches = new Set();
      enterCulprit(s, name); s.lastName = null;
      const ev = s.advance();
      const gold = [...s.dispatches].map((d) => { const [id, op] = d.split('|'); return [sites.get(id).choice_number, +op]; }).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      return { to: ev.id ?? ev.status, gold };
    };
    const got = new Map();
    for (const e of edges) {
      const r = tryName(e.option); got.set(e.option, r);
      const want = { to: e.to, gold: (e.gold ?? []).map((x) => [x[0], x[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]) };
      const ok = r.to === want.to && JSON.stringify(r.gold) === JSON.stringify(want.gold);
      results.push({ prompt: prompt.id, name: e.option, ok, vm: r, original: want });
      console.log(`${prompt.id} ${e.option}: ${ok ? 'ok' : 'DIFF'} -> ${r.to} ${JSON.stringify(r.gold)}`);
    }
    for (const [name, baseName, same] of EXTRA) {
      if (!got.has(baseName)) continue;
      const r = tryName(name), b = got.get(baseName);
      const equal = r.to === b.to && JSON.stringify(r.gold) === JSON.stringify(b.gold);
      results.push({ prompt: prompt.id, name, rule: `${same ? '=' : '≠'} ${baseName}`, ok: equal === same, vm: r });
      console.log(`${prompt.id} ${name} (${same ? '=' : '≠'} ${baseName}): ${equal === same ? 'ok' : 'DIFF'} -> ${r.to} ${JSON.stringify(r.gold)}`);
    }
  }
  // The 131-name table the original run recorded (hidden/names-prompt1..3.json): each name's
  // first script-chosen row and its target bit, compared exactly.
  const table = opt('--table');
  if (table) for (const [k, edges] of groups) {
    const idx = [...groups.keys()].sort((a, b) => JSON.parse(a).length - JSON.parse(b).length).indexOf(k) + 1;
    const want = JSON.parse(fs.readFileSync(path.join(table, `names-prompt${idx}.json`)));
    const { m, s, base, sig } = prompts.get(k);
    let ok = 0;
    for (const [name, expect] of Object.entries(want)) {
      m.loadState(base); for (const [kk, v] of sig) s[kk] = v; s.raw = null;
      try { enterCulprit(s, name); for (let f = 0; f < 4000 && !s.raw; f += 10) s.press('A', 8); }
      catch (err) { if (!s.raw) s.raw = ['ERR', String(err.message ?? err).slice(0, 80)]; }
      const same = JSON.stringify(s.raw) === JSON.stringify(expect);
      if (same) ok++; else console.log(`${edges[0].from} ${name}: DIFF vm ${JSON.stringify(s.raw)} original ${JSON.stringify(expect)}`);
      results.push({ prompt: edges[0].from, name, table: true, ok: same, vm: s.raw, original: expect });
    }
    console.log(`${edges[0].from} table ${ok}/${Object.keys(want).length}`);
  }
  fs.writeFileSync(opt('--out'), JSON.stringify(results, null, 1));
  const bad = results.filter((r) => !r.ok);
  console.log(`${results.length - bad.length}/${results.length} ok`);
  if (bad.length) process.exitCode = 1;
}

await main();
