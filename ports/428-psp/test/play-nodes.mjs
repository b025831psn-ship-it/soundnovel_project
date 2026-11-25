// Dynamic bulk run: start the VM at every time-chart node's first label (to.flo) and run to the
// next scene end (AC). Choices take every option in turn (one run per option). Collects all failures
// in one list: missing labels, runaway loops, stack errors, and ops the VM still hands to the host.
import { readFileSync, writeFileSync } from 'node:fs';
import { decryptSns, parseSns } from '../engine/sns.js';
import { parseFlo } from '../engine/flo.js';
import { VM } from '../engine/vm.js';
const [snsPath, floPath, outPath] = process.argv.slice(2);
const raw = readFileSync(snsPath); const sns = parseSns(raw[0x10] === 0x43 ? decryptSns(raw) : raw);
const flo = parseFlo(readFileSync(floPath));
const where = new Map(); sns.scripts.forEach((s, i) => { for (const n of s.labels.keys()) where.set(n, i); });
// initial variables from initialize_def
const init = new VM(sns); init.script = sns.scripts[0]; init.pc = init.script.codeStart; while (!init.halted) init.step();
const LIMIT = +(process.env.LIMIT || 60000); const failures = []; const hostOps = new Map(); const reached = new Set(); let runs = 0, ok = 0, loops = 0;
function run(slot, label, vars, tag, depth) {
  const vm = new VM(sns); vm.vars.set(vars); vm.goto(slot, label); runs++; const seenChoice = new Map();
  const done = () => { for (const l of vm.flow) reached.add(l); };
  for (let n = 0; n < LIMIT; n++) {
    let e; try { e = vm.step(); } catch (err) { done(); failures.push({ tag, kind: 'error', msg: err.message, at: `${vm.script.name}@${vm.pc.toString(16)}` }); return; }
    if (!e) continue;
    if (e.type === 'op') hostOps.set(e.op, (hostOps.get(e.op) || 0) + 1);
    else if (e.type === 'label') reached.add(e.label);
    else if (e.type === 'sceneEnd' || e.type === 'end') { ok++; done(); return; }
    else if (e.type === 'choice') {
      const k = vm.script.name + vm.pc; const c = (seenChoice.get(k) || 0) + 1; seenChoice.set(k, c);
      if (c > 1) { loops++; done(); return; } // same choice again in one run: a retry loop, all options already explored
      if (depth < 2) e.options.slice(1).forEach((o, i) => run(o.slot, o.label, vm.vars, `${tag}>${i + 1}`, depth + 1));
      vm.choose(0);
    }
  }
  done(); failures.push({ tag, kind: 'runaway', at: `${vm.script.name}@${vm.pc.toString(16)}`, last: vm.flow.slice(-4) });
}
let missing = 0;
for (const node of flo.nodes) {
  const l = node.labels[0]; const slot = where.get(l);
  if (slot === undefined) { failures.push({ tag: `node${node.index}`, kind: 'missingLabel', label: l }); missing++; continue; }
  run(slot, l, init.vars, `node${node.index}:${l}`, 0);
  if (node.index % 100 === 0) console.error(node.index, runs, failures.length);
}
const allScene = [...where.keys()].filter(n => !n.startsWith('__'));
const unreached = allScene.filter(n => !reached.has(n) && !flo.nodes.some(x => x.labels[0] === n));
const kinds = {}; for (const f of failures) kinds[f.kind] = (kinds[f.kind] || 0) + 1;
const summary = { nodes: flo.nodes.length, runs, reachedSceneEnd: ok, choiceLoops: loops, failures: failures.length, kinds, sceneLabels: allScene.length, labelsNeverPassed: unreached.length,
  hostOps: Object.fromEntries([...hostOps].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k.toString(16).padStart(2, '0'), v])) };
console.log(JSON.stringify({ ...summary, hostOps: Object.keys(summary.hostOps).length + ' kinds' }, null, 1));
if (outPath) writeFileSync(outPath, JSON.stringify({ summary, failures, unreached }, null, 1));
