// Gold bookmark on the VM, the way the original-hardware baseline earned it
// (qa/kamaitachi-sfc-beta tools/gold_explore.py): boot bookmark 1 from a save that already
// holds the 43 endings, and at every live prompt take the option whose own new gold bits
// plus the best continuation in the site graph is largest. The graph is the one the
// original run mapped (graph.json + learned.json); it is updated with what the VM actually
// did. Each run continues from the save the game wrote; stops when the game itself sets
// the gold bookmark (0x805 bit 2).
//   node tools/gold.mjs <rom.sfc> --data <dir: guide-sfc.json, scenario-catalog.json>
//        --graph <dir: graph.json, learned.json> --seed <endings-43.srm> --work <dir> [--vm <dir>] [--runs N]
// Gold rows: one byte per choice site n at 0xA08+n; option i sets bit 3+i, and the row is
// complete when (byte & 0xF8) == 0xF8 (the game pre-fills options a site does not have).
import fs from 'node:fs';
import path from 'node:path';
import { APU } from '../sound/apu.js';
import { MasterLink } from '../sound/master-link.js';
import { Session, enterCulprit, endingFlags, bootSlot } from './campaign.mjs';

export const NAMES = ['みきもと', 'たなか', 'としお', 'かやま', 'みどり', 'こばやし', 'きょうこ',
  'はるこ', 'あき', 'かなこ', 'けいこ', 'おーえる', 'しゅんすけ', 'まり', 'とおる', 'あ',
  'おーえるたち', 'さんにんぐみ', 'さんにん', 'おーなー', 'ぼく'];
const SNOW = 'choice-03afa8-0'; // timing-sensitive snow sequence after option 0
const key = (n, i) => `${n}:${i}`;

export const goldHave = (save) => { const out = new Set(); for (let n = 1; n <= 160; n++) for (let i = 0; i < 5; i++) if (save[0xa08 + n] & (8 << i)) out.add(key(n, i)); return out; };
export const completedRows = (save) => { let c = 0; for (let n = 1; n <= 160; n++) if ((save[0xa08 + n] & 0xf8) === 0xf8) c++; return c; };

class Graph {
  constructor(report, sites) {
    this.edges = new Map();
    for (const e of report.edges) {
      if (!('to' in e)) continue;
      const bits = new Set();
      if (e.from.startsWith('choice')) bits.add(key(sites.get(e.from).choice_number, e.option));
      for (const b of e.gold ?? []) bits.add(key(b[0], b[1]));
      this.learn(e.from, e.option, e.to, bits);
    }
  }
  addGuides(guides, sites) {
    let added = 0;
    for (const g of guides) {
      const st = g.steps;
      for (const [n, step] of Object.entries(st)) {
        if (n === 'END') continue;
        for (const [label, dst0] of Object.entries(step.moves)) {
          if (label.length !== 1 || !'ABCDE'.includes(label)) continue;
          const dst = String(dst0);
          const to = dst === 'END' ? 'END' : (st[dst]?.sites?.length ? st[dst].sites[0] : null);
          for (const site of step.sites) {
            const opt = label.charCodeAt(0) - 65;
            if (sites.has(site) && !this.edges.get(site)?.has(opt)) { this.learn(site, opt, to, new Set([key(sites.get(site).choice_number, opt)])); added++; }
          }
        }
      }
    }
    return added;
  }
  learn(frm, opt, to, bits) { if (!this.edges.has(frm)) this.edges.set(frm, new Map()); this.edges.get(frm).set(opt, [to, new Set(bits)]); }
  value(node, have, memo, stack = []) {
    if (memo.has(node)) return memo.get(node);
    if (stack.includes(node) || !this.edges.has(node)) return 0;
    let v = 0;
    for (const [to, bits] of this.edges.get(node).values()) {
      let gain = 0; for (const b of bits) if (!have.has(b)) gain++;
      v = Math.max(v, gain + (to ? this.value(to, have, memo, [...stack, node]) : 0));
    }
    memo.set(node, v);
    return v;
  }
  best(node, options, have, visits) {
    const memo = new Map(), scored = [];
    for (const opt of options) {
      const known = this.edges.get(node)?.has(opt);
      const [to, bits] = this.edges.get(node)?.get(opt) ?? [null, new Set()];
      let gain = (!known && typeof opt === 'string') ? 1 : 0; for (const b of bits) if (!have.has(b)) gain++;
      const total = gain + (to ? this.value(to, have, memo, [node]) : 0);
      scored.push([total, gain, -(visits.get(to) ?? 0), opt]);
    }
    // Same ordering as the Python max over (total or -1 when revisited, gain, -visits, -int option).
    const rank = (x) => [x[2] > -2 ? x[0] : -1, x[1], x[2], typeof x[3] === 'number' ? -x[3] : 0];
    let best = scored[0];
    for (const x of scored.slice(1)) { const a = rank(x), b = rank(best); for (let i = 0; i < 4; i++) { if (a[i] > b[i]) { best = x; break; } if (a[i] < b[i]) break; } }
    return { total: best[0], gain: best[1], opt: best[3] };
  }
}

class Tracker extends Session {
  constructor(...a) { super(...a); this.pad = 0; }
  press(k, wait = 8) { super.press(k, wait + this.pad); }
}

function run(s, graph, sites, seed) {
  const before = goldHave(seed), picked = new Set(), steps = [], visits = new Map();
  bootSlot(s, seed);
  let prev = null;
  for (let i = 0; i < 250; i++) {
    const ev = s.advance();
    if (prev) {
      let [frm, opt, bits] = prev;
      if (typeof opt === 'string') { bits = new Set([...s.dispatches].map((d) => { const [id, o] = d.split('|'); return key(sites.get(id).choice_number, +o); })); bits.forEach((b) => picked.add(b)); }
      graph.learn(frm, opt, ev.status === 'ending' ? 'END' : ev.id ?? null, bits);
      prev = null;
    }
    const have = new Set([...before, ...picked]);
    if (ev.id) visits.set(ev.id, (visits.get(ev.id) ?? 0) + 1);
    if (ev.status === 'choice') {
      let { gain, opt } = graph.best(ev.id, ev.options, have, visits);
      if (visits.get(ev.id) >= 3) { opt = ev.options[visits.get(ev.id) % ev.options.length]; gain = +!have.has(key(ev.choice_number, opt)); }
      s.pad = (ev.id === SNOW && opt === 0) ? 4 : 0;
      s.step(20); s.select(opt);
      picked.add(key(ev.choice_number, opt)); steps.push([ev.id, opt, gain]);
      prev = [ev.id, opt, new Set([key(ev.choice_number, opt)])];
    } else if (ev.status === 'name') {
      const { gain, opt: name } = graph.best(ev.id, NAMES, have, visits);
      s.dispatches = new Set();
      enterCulprit(s, name); s.lastName = null;
      steps.push([ev.id, name, gain]); prev = [ev.id, name, new Set()];
    } else if (ev.status === 'ending') {
      const sram = s.m.bus.sram;
      for (let k = 0; k < 1800; k++) {
        if (sram[0x87a] !== seed[0x87a] || sram[0x87b] !== seed[0x87b]) return { save: sram.slice(), info: { ending: ev, steps, frames: s.frames } };
        s.press('A', 12);
      }
      throw new Error('Ending did not update the slot-one counter');
    } else throw new Error(`Run stopped at ${JSON.stringify(ev)} after ${JSON.stringify(steps.slice(-3))}`);
  }
  throw new Error(`Run exceeded the event budget: ${JSON.stringify(steps.slice(-14))}`);
}

async function main() {
  const args = process.argv.slice(2), romPath = args[0];
  const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
  const data = opt('--data'), gdir = opt('--graph'), work = opt('--work'), runs = +opt('--runs', 80);
  const vm = opt('--vm', process.env.SFC_VM ?? '../../../sfc-vm');
  fs.mkdirSync(work, { recursive: true });
  const catalog = JSON.parse(fs.readFileSync(path.join(data, 'scenario-catalog.json')));
  const guides = JSON.parse(fs.readFileSync(path.join(data, 'guide-sfc.json'))).endings;
  const sites = new Map(catalog.choices.map((x) => [x.id, x]));
  const report = JSON.parse(fs.readFileSync(path.join(gdir, 'graph.json')));
  const graph = new Graph(report, sites);
  const learnedPath = path.join(work, 'learned.json');
  const learned = JSON.parse(fs.readFileSync(fs.existsSync(learnedPath) ? learnedPath : path.join(gdir, 'learned.json')));
  for (const [f, o, t, b] of learned) graph.learn(f, o, t, new Set(b.map((x) => key(x[0], x[1]))));
  console.log('guide edges added', graph.addGuides(guides, sites));
  const rom = new Uint8Array(fs.readFileSync(romPath));
  const { SfcMachine } = await import(`${vm}/machine.js`);
  const statePath = path.join(work, 'gold.srm');
  let seed = new Uint8Array(fs.readFileSync(fs.existsSync(statePath) ? statePath : opt('--seed')));
  let n = fs.readdirSync(work).filter((f) => /^run\d+\.json$/.test(f)).length;
  while (n < runs) {
    if (seed[0x805] & 4) { console.log('gold bookmark set by the game'); break; }
    n++;
    const apu = new APU(); apu.powerOn();
    const m = new SfcMachine({ rom, apu, busOptions: { masterLink: new MasterLink(apu) } });
    const s = new Tracker(m, rom, catalog), t0 = Date.now(), bits0 = goldHave(seed).size;
    let res;
    try { res = run(s, graph, sites, seed); } catch (err) {
      fs.writeFileSync(path.join(work, `run${String(n).padStart(2, '0')}-failure.json`), JSON.stringify({ frames: s.frames, last_script_bit: s.lastBit, reason: String(err.message ?? err) }));
      console.log(`run ${n}: FAIL ${err.message ?? err} at frame ${s.frames}`); process.exitCode = 1; return;
    }
    const { save, info } = res;
    if (![...endingFlags(seed)].every((x) => endingFlags(save).has(x))) throw new Error('A previously earned ending flag disappeared');
    const gained = goldHave(save).size - bits0;
    seed = save; fs.writeFileSync(statePath, seed);
    fs.writeFileSync(learnedPath, JSON.stringify([...graph.edges].flatMap(([f, d]) => [...d].map(([o, [t, b]]) => [f, o, t, [...b].map((x) => x.split(':').map(Number)).sort((p, q) => p[0] - q[0] || p[1] - q[1])]))));
    Object.assign(info, { run: n, gained_bits: gained, rows: completedRows(seed), gold: !!(seed[0x805] & 4), seconds: (Date.now() - t0) / 1000 });
    fs.writeFileSync(path.join(work, `run${String(n).padStart(2, '0')}.json`), JSON.stringify(info));
    console.log(`run ${n}: +${gained} bits, rows ${info.rows}/160, ending ${info.ending.flag}, gold ${info.gold}, ${info.seconds}s`);
    if (info.gold) { console.log('gold bookmark set by the game'); break; }
    if (gained === 0 && n > 1) { console.log('no gain; stopping'); break; }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
