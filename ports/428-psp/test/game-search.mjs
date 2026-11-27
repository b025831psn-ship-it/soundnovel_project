// Headless block search: plays a new game over and over, depth first over the sequence of decisions met (choices,
// JUMP keywords, time chart jumps back to a ZAP node), until the story reaches the target hour. Prints the winning
// decision path by choice point label (no text) and the select list. Checks the zapping progression end to end.
// Usage: node test/game-search.mjs to.sns to.flo [maxAttempts] [targetHour]
import { readFileSync } from 'node:fs';
import { decryptSns, parseSns, iterate } from '../engine/sns.js';
import { parseFlo } from '../engine/flo.js';
import { VM, decodeControl } from '../engine/vm.js';
import { Game } from '../engine/game.js';
const [snsPath, floPath, maxA = '5000', target = '11'] = process.argv.slice(2);
const raw = readFileSync(snsPath); const sns = parseSns(raw[0x10] === 0x43 ? decryptSns(raw) : raw);
const flo = parseFlo(readFileSync(floPath));
const where = new Map(); sns.scripts.forEach((s, i) => { for (const l of s.labels.keys()) if (!where.has(l)) where.set(l, i); });
const at = l => where.get(l) ?? -1;
// ZAP node label -> its keyword (first 70 after the label)
const zapAt = new Map();
for (const s of sns.scripts) { let last = null; for (const x of iterate(s.bytes, s.codeStart)) { if (x.op === 0x56) last = /_ZAP$/.test(x.label) ? x.label : last; if (x.op === 0x70 && last) { zapAt.set(last, decodeControl(0x70, x.arg)); last = null; } } }

let prefix = []; // decision indices forced for this attempt
function attempt() {
  const met = []; // [index, count, what] per decision in order
  const memo = new Map(); // a player makes the same pick at the same choice point within one attempt
  const dec = (count, what) => { if (what !== 'chart' && memo.has(what)) return memo.get(what); const i = met.length < prefix.length ? prefix[met.length] : 0; met.push([i, count, what]); if (what !== 'chart') memo.set(what, i); return i; };
  const vm = new VM(sns); { const s = sns.scripts[0]; vm.script = s; vm.pc = s.codeStart; while (!vm.halted) vm.step(); vm.halted = false; }
  const game = new Game(flo, vm); const goto0 = vm.goto.bind(vm); vm.goto = (sl, l) => { goto0(sl, l); game.passLabel(l); };
  game.newGame(); const log = []; const badCount = new Map(); let idle = 0;
  const run = c => {
    if (c) game.play(c.id, at);
    for (let st = 0; st < 400000; st++) {
      const e = vm.step(); if (!e) continue;
      if (e.type === 'label') game.passLabel(e.label);
      else if (e.type === 'zap' && e.open && !vm.get(e.v)) { if (dec(2, 'ZAP>' + e.label)) game.zap(); }
      else if (e.type === 'choice') vm.choose(dec(e.options.length, game.trail.at(-1)));
      else if (e.type === 'sceneEnd' || e.type === 'end') break;
    }
    const r = game.sceneEnd(); log.push(`${c ? c.ja : "chart"}:${r.kind} ${r.label || game.chars.get(r.char)?.resume || ""}`); return r;
  };
  for (let scene = 0; scene < 80; scene++) {
    const list = game.selectable();
    if (list.some(c => c.hour >= +target)) return { ok: true, game, log, met };
    const ready = list.filter(x => x.status === 'ready');
    const wait = list.filter(x => x.status === 'continue' || x.status === 'badend');
    // the player's move: a ready character, a waiting one again, or a time chart jump to an open ZAP node
    const zaps = [...game.passed].filter(l => zapAt.has(l) && vm.cond(zapAt.get(l).terms) && !vm.get(zapAt.get(l).v));
    let r; const before = game.passed.size;
    if (ready.length) r = run(ready[0]);
    else if (idle < wait.length) { r = run(wait[idle % wait.length]); }
    else if (zaps.length) { const z = zaps[dec(zaps.length, 'chart')]; game.jumpTo(z, at); r = run(null); }
    else { if (process.env.DBG) console.log('   vars', [300,301,31,32,33,34,14,21,202,600].map(v => v + '=' + vm.get(v)).join(' ')); return { ok: false, why: 'stuck', log, met }; }
    idle = game.passed.size > before ? 0 : idle + 1; // waiting characters get another go while the story moves
    if (r.kind === 'badend') { const n = (badCount.get(r.label) || 0) + 1; badCount.set(r.label, n); if (n > 2) return { ok: false, why: r.label, log, met }; }
  }
  return { ok: false, why: 'scenes', log, met };
}
for (let a = 1; a <= +maxA; a++) {
  const r = attempt();
  if (r.ok) {
    console.log(`attempt ${a}: reached hour ${target}`);
    console.log('decisions:', r.met.map(([i, n, w]) => `${w}=${i}/${n}`).join(' '));
    console.log('scenes:', r.log.join(' | '));
    console.log('select:', r.game.selectable().map(c => `${c.ja}:${c.status}@${c.hour}:${String(c.minute).padStart(2, '0')}`).join('  '));
    process.exit(0);
  }
  if (process.env.DBG) console.log(a, r.why, r.met.map(([i, n, w]) => `${w}=${i}/${n}`).join(' '), "\n   ", r.log.join(" | "));
  // next path: bump the last decision that has options left
  let k = r.met.length - 1; while (k >= 0 && r.met[k][0] + 1 >= r.met[k][1]) k--;
  if (k < 0) { console.log(`all ${a} paths tried, last: ${r.why}`); process.exit(1); }
  prefix = r.met.slice(0, k).map(m => m[0]).concat(r.met[k][0] + 1);
  if (a % 200 === 0) console.log(`attempt ${a}: ${r.why}, ${r.met.length} decisions`);
}
