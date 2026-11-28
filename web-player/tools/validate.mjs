// Checks a story JSON before it reaches the player, e.g. converter output.
// Usage: node tools/validate.mjs <story.json> [--strict] [--json]
//   Exit 1 on format errors (and on warnings with --strict). --json prints the report as JSON.
import { readFile } from 'node:fs/promises';
import { normalizeStory, StoryFormatError } from '../story.js';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const strict = args.includes('--strict');
const asJson = args.includes('--json');
if (!file) {
  console.error('사용법: node tools/validate.mjs <story.json> [--strict] [--json]');
  process.exit(2);
}

const report = { file, errors: [], warnings: [], stats: {} };
let story;
try {
  story = normalizeStory(JSON.parse(await readFile(file, 'utf8')));
} catch (err) {
  report.errors.push(err instanceof StoryFormatError || err instanceof SyntaxError ? err.message : String(err));
  finish();
}

const nodes = story.nodes;
const ids = Object.keys(nodes);
// Every rule list a node can leave through: its own `next`, or each option's `next`.
const ruleLists = (n) => (n.kind === 'choice' ? n.options.map((o) => o.next) : [n.next]);
const targets = (n) => ruleLists(n).flat().map((r) => r.to).filter(Boolean);
// A rule list can end the story when a rule goes nowhere or no unconditional rule catches the rest.
const canEndHere = (n) => ruleLists(n).some((rules) => rules.some((r) => r.to === null) || !rules.some((r) => !r.if));

// Reachability from entry, ignoring conditions (any rule may fire).
const reached = new Set([story.entry]);
for (const queue = [story.entry]; queue.length;) {
  for (const t of targets(nodes[queue.shift()])) if (!reached.has(t)) { reached.add(t); queue.push(t); }
}
const unreachable = ids.filter((id) => !reached.has(id));
if (unreachable.length) report.warnings.push(`entry에서 도달할 수 없는 노드 ${unreachable.length}개: ${unreachable.slice(0, 20).join(', ')}${unreachable.length > 20 ? ' …' : ''}`);

// Nodes from which no path can ever end: a loop with no way out.
const preds = Object.fromEntries(ids.map((id) => [id, []]));
for (const id of ids) for (const t of targets(nodes[id])) preds[t].push(id);
const canFinish = new Set(ids.filter((id) => canEndHere(nodes[id])));
for (const queue = [...canFinish]; queue.length;) {
  for (const p of preds[queue.shift()]) if (!canFinish.has(p)) { canFinish.add(p); queue.push(p); }
}
const trapped = [...reached].filter((id) => !canFinish.has(id));
if (trapped.length) report.warnings.push(`빠져나갈 수 없는 고리에 갇히는 노드 ${trapped.length}개: ${trapped.slice(0, 20).join(', ')}${trapped.length > 20 ? ' …' : ''}`);

// Flags tested in `if` but never set anywhere (always false), and flags set but never tested.
const setFlags = new Set();
const usedFlags = new Set();
for (const n of Object.values(nodes)) {
  for (const k of Object.keys(n.set || {})) setFlags.add(k);
  if (n.kind === 'choice') for (const o of n.options) for (const k of Object.keys(o.set || {})) setFlags.add(k);
  for (const rules of ruleLists(n)) for (const r of rules) for (const k of Object.keys(r.if || {})) usedFlags.add(k);
  if (n.bgBy) usedFlags.add(n.bgBy.by);
}
const neverSet = [...usedFlags].filter((k) => !setFlags.has(k));
if (neverSet.length) report.warnings.push(`if에 쓰였지만 어디서도 set하지 않는 플래그: ${neverSet.join(', ')}`);
const neverUsed = [...setFlags].filter((k) => !usedFlags.has(k));

// Sentences and their originals.
let sentences = 0;
let withJa = 0;
const count = (s) => { sentences++; if (s.ja) withJa++; };
for (const n of Object.values(nodes)) {
  if (n.kind === 'choice') { count(n.question); n.options.forEach((o) => count(o.label)); } else n.pages.flat().forEach(count);
}
if (story.hasOriginal && withJa < sentences) report.warnings.push(`원문(ja)이 없는 문장 ${sentences - withJa}개 / 전체 ${sentences}개`);

report.stats = {
  gameId: story.gameId,
  nodes: ids.length,
  choices: ids.filter((id) => nodes[id].kind === 'choice').length,
  reachable: reached.size,
  sentences,
  withJa,
  flagsSet: setFlags.size,
  flagsUnused: neverUsed.filter((f) => !f.startsWith("media:")), // media:* drive the screen, not branches
  endings: [...reached].filter((id) => canEndHere(nodes[id])).length,
};
finish();

function finish() {
  const failed = report.errors.length > 0 || (strict && report.warnings.length > 0);
  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const e of report.errors) console.log(`오류  ${e}`);
    for (const w of report.warnings) console.log(`경고  ${w}`);
    if (Object.keys(report.stats).length) {
      const s = report.stats;
      console.log(`정보  ${s.gameId}: 노드 ${s.nodes}개(선택지 ${s.choices}), 도달 ${s.reachable}, 끝나는 곳 ${s.endings}, 문장 ${s.sentences}개(원문 ${s.withJa}), 플래그 ${s.flagsSet}개`);
      if (s.flagsUnused.length) console.log(`정보  set만 하고 if에 쓰지 않는 플래그: ${s.flagsUnused.join(', ')}`);
    }
    console.log(failed ? '\n검사 실패' : '\n검사 통과');
  }
  process.exit(failed ? 1 : 0);
}
