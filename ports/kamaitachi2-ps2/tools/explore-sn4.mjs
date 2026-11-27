// Exhaustive SN4 explorer: runs the browser VM over every reachable path and
// collects problems in one report instead of checking scenes one at a time.
//
//   node ports/kamaitachi2-ps2/tools/explore-sn4.mjs <web-dir> [out-dir] [--disc-files list.txt]
//
// With --disc-files (one disc path per line, tab-separated extras allowed),
// ScenePack media are checked against the disc instead of the built web
// assets, which is how the full extracted scenario is checked before a build.
//
// Choices fork into every target and 0x70 conditions fork into both the taken
// and the fall-through path. A path stops when it re-enters a label another
// path already entered (flags are not modelled yet), at an end, or on an error.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const discAt = argv.indexOf('--disc-files');
const discList = discAt >= 0 ? argv.splice(discAt, 2)[1] : null;
const web = path.resolve(argv[0] || '.');
const out = argv[1] ? path.resolve(argv[1]) : null;
const { Sn4Vm } = await import(pathToFileURL(path.join(web, 'sn4.js')).href);
const program = JSON.parse(await readFile(path.join(web, 'assets/sn4.json'), 'utf8'));
const opening = JSON.parse(await readFile(path.join(web, 'assets/opening.json'), 'utf8'));
const scenePack = opening.scenePack ?? {};
const glyphs = new Set(Object.keys(opening.font ?? {}));
const NAMES = ['名前一', '名前二'];
const hex = n => '0x' + n.toString(16);

const discFiles = discList ? new Set((await readFile(discList, 'utf8')).split(/\r?\n/)
  .map(line => line.split('\t')[0].split('/').pop().toLowerCase()).filter(Boolean)) : null;
const exists = async file => discFiles ? discFiles.has(file.toLowerCase())
  : access(path.join(web, 'assets', file)).then(() => true, () => false);
const problems = new Map(); // kind -> Map(key -> {count, first})
function report(kind, key, where) {
  if (!problems.has(kind)) problems.set(kind, new Map());
  const bucket = problems.get(kind);
  const entry = bucket.get(key) ?? {count: 0, first: where};
  entry.count++;
  bucket.set(key, entry);
}

const labels = new Map(program.labels.map(l => [l.label, l]));
const entered = new Set();
const opcodes = new Map();
for (const l of program.labels) for (const op of l.ops) opcodes.set(op.op, (opcodes.get(op.op) ?? 0) + 1);
// Static checks that do not depend on reaching the command.
for (const l of program.labels) {
  if (l.next && !labels.has(l.next)) report('missing-next', l.next, `${l.label}`);
  for (const op of l.ops) {
    const at = `${l.label}+${hex(op.offset - l.offset)}`;
    if ((op.op === 0x6a || op.op === 0x6b) && !labels.has(op.args[0])) report('missing-jump', op.args[0], at);
    if (op.op === 0x6c) for (const t of op.args[0]) if (!labels.has(t)) report('missing-choice-target', t, at);
    if (op.op === 0x74 && !(op.args[0] in scenePack)) report('missing-scenepack', op.args[0], at);
  }
}
for (const [name, entry] of Object.entries(scenePack)) {
  if (entry.commands && discFiles) {
    // Full ScenePack dump: every file-bearing command, as named on the disc.
    for (const c of entry.commands) for (const file of [c.file, c.motion])
      if (typeof file === 'string' && !await exists(file)) report('missing-media', file, name);
    continue;
  }
  if (entry.music?.file && !await exists(entry.music.file)) report('missing-music-file', entry.music.file, name);
  if (entry.image && !await exists(entry.image + (discFiles ? '.ipu' : '.png'))) report('missing-image', entry.image + '.png', name);
}

class Explorer extends Sn4Vm {
  jump(label) {
    super.jump(label);
    if (entered.has(label)) throw new Revisit();
    entered.add(label);
  }
}
class Revisit extends Error {}

const queue = [];
const endOps = new Set();
let fromEntry = true;
const BRANCHING = new Set(['NameInputCriminal', 'NameInputGeneral', 'Panel', 'DelusionPanel', 'ClickMap']);
const labelList = hex => (Buffer.from(hex, 'hex').toString('latin1').match(/[_a-z]+\d*_?\d*/g) ?? []).filter(t => labels.has(t));
const endings = new Map();
let paths = 0, steps = 0;
function fork(vm, payload) {
  // 0x70 payloads are still raw until the extractor decodes them; fork only
  // into a target that names a real label.
  const label = typeof payload === 'string' ? payload : payload?.target;
  if (labels.has(label)) queue.push({label, names: [...vm.names], bgm: current, unknownBgm: current === undefined});
  else report('condition-undecoded', typeof payload === 'string' ? payload : JSON.stringify(payload), where(vm));
}
function makeVm() {
  const hooks = {};
  const vm = new Explorer(program, new Proxy(hooks, {
    get: (_, name) => (...args) => {
      // Queue the taken branch, then make the VM fall through so both sides
      // run. The variable-aware VM takes a boolean (true = no jump); the
      // earlier one jumps to whatever label the hook returns.
      if (name === 'condition') { fork(vm, args[0]); return vm.variables ? true : null; }
      if (name === 'command' && BRANCHING.has(args[0])) {
        // The typed name, the picked panel cell or the clicked area chooses one
        // of the labels packed into a hex operand (section byte + NUL-terminated
        // label each), so every one of them is a branch.
        for (const packed of args[1] ?? []) if (typeof packed === 'string' && /^[0-9a-f]+$/.test(packed))
          for (const t of labelList(packed)) fork(vm, t);
      }
      if (name === 'command' && args[0] === 'End' && fromEntry) endOps.add(`${vm.label}+${hex(args[2]?.offset ?? 0)}`);
      if (name === 'caption') { music(vm, args[0]); return 0; }
      if (name === 'unknown') { report('unknown-op', hex(args[0]), where(vm)); return undefined; }
      // Layout state, mirrored from player.js so every page can be laid out without a browser.
      const L = vm.layout ??= {letterSpacing:0, lineSpacing:7, fontSize:33,
        marginLeft:32, marginRight:32, marginTop:32, marginBottom:32,
        moves:[], lines:[], styles:[], centers:[]};
      const mark = offset => L.styles.push({offset, letterSpacing:L.letterSpacing,
        lineSpacing:L.lineSpacing, fontSize:L.fontSize});
      const signed16 = value => (value << 16) >> 16;
      const point = value => ({x:value >> 16, y:signed16(value)});
      if (name === 'moveX') L.moves.push({offset:args[1], x:args[0], y:0});
      else if (name === 'font') { L.fontSize = args[1] || 33; mark(args[2]); }
      else if (name === 'letterSpacing') { L.letterSpacing = args[0]; mark(args[1]); }
      else if (name === 'lineSpacing') { L.lineSpacing = args[0]; mark(args[1]); }
      else if (name === 'marginLeft') L.marginLeft = args[0];
      else if (name === 'marginRight') L.marginRight = args[0];
      else if (name === 'marginTop') L.marginTop = args[0];
      else if (name === 'marginBottom') L.marginBottom = args[0];
      else if (name === 'position') L.moves.push({offset:args[1], ...point(args[0])});
      else if (name === 'absolutePosition') L.moves.push({offset:args[1], ...point(args[0]), absolute:true});
      else if (name === 'line') L.lines.push({type:args[0], width:args[1], offset:args[2]});
      else if (name === 'clearText') {
        L.moves = []; L.lines = []; L.styles = []; L.centers = [];
        L.fontSize = 33; mark(0);
      }
      else if (name === 'command' && args[0] === 'Center') L.centers.push(vm.text.length);
      else if (name === 'command' && args[0] === 'Default') {
        const value = args[1][0] ?? 32, op = args[2].op;
        if (op === 0x5e) L.marginLeft = value;
        else if (op === 0x60) L.marginRight = value;
        else if (op === 0x62) L.marginTop = value;
        else if (op === 0x64) L.marginBottom = value;
      }
      if (name === 'command') return 0;
      return undefined;
    },
  }));
  return vm;
}
const where = vm => `${vm.label}+${hex((labels.get(vm.label)?.ops[vm.pc - 1]?.offset ?? 0) - (labels.get(vm.label)?.offset ?? 0))}`;
let current = null;
function music(vm, name) {
  const m = scenePack[name]?.music;
  if (!m) return;
  if (current === undefined) {
    current = m.operation === 0x14 ? {file: m.file} : m.operation === 0x15 ? null : undefined;
    return;
  }
  if (m.operation === 0x14) {
    if (current && current.file !== m.file) report('info-bgm-switch-without-stop', `${current.file} -> ${m.file}`, where(vm));
    current = {file: m.file};
  } else if (m.operation === 0x15) {
    if (!current) report('info-bgm-stop-while-stopped', name, where(vm));
    current = null;
  } else if (m.operation === 0x17 && !current) report('bgm-volume-without-start', name, where(vm));
}

// Lay out a page like player.js drawStory()/render.text() and flag what the
// original would not show: lines past the screen, automatic wraps that start a
// line with a closing mark, centered lines wider than the text box.
const NO_START = new Set([...'、。？！＿ヽヾゝゞ々仝〃ー’”）〕］〉」』】＞ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ']);
const NO_END = new Set([...'（〔［〈「『＜']);
function checkLayout(vm, raw) {
  const text = raw.trimEnd();
  if (!text.trim()) return;
  const L = vm.layout ?? {letterSpacing:0, lineSpacing:7, fontSize:33,
    marginLeft:32, marginRight:32, marginTop:32, marginBottom:32, moves:[], lines:[], styles:[], centers:[]};
  const at = where(vm);
  const x = L.marginLeft, y = L.marginTop, right = 640 - L.marginRight, bottom = 448;
  let px = x, py = y, offset = 0, lineStart = true, overRight = false;
  const styleAt = o => L.styles.findLast(mark => mark.offset <= o) ?? L;
  const advance = (ch, o) => {
    const s = styleAt(o), ratio = s.fontSize / 33;
    return ((opening.font?.[ch] ?? opening.font?.['�'] ?? [0, 0, 32])[2] + s.letterSpacing) * ratio;
  };
  const centerAt = o => {
    if (!L.centers.includes(o)) return x;
    const line = text.slice(o).split('\n')[0];
    let p = o, w = 0; for (const ch of line) { w += advance(ch, p); p += ch.length; }
    // CommandCenter leaves the cursor at the left margin when the line does
    // not fit; this is a valid fallback, not an overflow.
    return w < right - x ? x + (right - x - w) / 2 : x;
  };
  px = centerAt(0);
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], style = styleAt(offset), leading = style.fontSize + style.lineSpacing;
    for (const move of L.moves.filter(item => item.offset === offset)) {
      if (move.absolute) { px = move.x; py = move.y; } else { px += move.x; py += move.y; }
    }
    for (const line of L.lines.filter(item => item.offset === offset)) {
      if (px !== x && px + line.width > right) { px = centerAt(offset); py += leading; }
      px += line.width;
    }
    const a = advance(ch, offset), next = chars[i + 1], nextA = next ? advance(next, offset + ch.length) : 0;
    const wrap = px + a > right && !NO_START.has(ch);
    const pushOpening = NO_END.has(ch) && next && px + a + nextA > right;
    if (ch === '\n' || wrap || pushOpening) { px = centerAt(offset); py += leading; }
    if (ch === '\n') { offset += ch.length; px = centerAt(offset); continue; }
    if (px + a > right + 1 && !NO_START.has(ch) && !overRight) {
      overRight = true; report('layout-positioned-past-right', `${vm.label} (${Math.round(px + a)}px)`, at);
    }
    px += a; offset += ch.length;
  }
  // Flowing message text scrolls upward at the physical bottom. Only authored
  // absolute layouts can genuinely place a glyph outside the framebuffer.
  if (L.moves.some(move => move.absolute) && py + styleAt(offset).fontSize > bottom)
    report('layout-past-bottom', `${vm.label} (${Math.round(py)}px)`, at);
}

function checkText(vm, text) {
  checkLayout(vm, text);
  for (const ch of text) if (ch !== '\n' && !glyphs.has(ch) && !NAMES.join('').includes(ch))
    report(glyphs.has('�') ? 'fallback-char' : 'unsupported-char', ch, where(vm));
}

// An unsupported opcode is reported and skipped so one gap does not hide the
// rest of the scenario. Sn4Vm advances pc before dispatching, so run() resumes
// after the failing command. 0x71 (compare two variables) forks like 0x70.
function step(vm, first) {
  let call = first;
  for (;;) {
    try { return call(); } catch (error) {
      const m = /Unsupported SN4 opcode (0x[0-9a-f]+)/.exec(error.message);
      if (!m) throw error;
      report('unsupported-op', m[1], where(vm));
      const op = labels.get(vm.label)?.ops[vm.pc - 1];
      if (op?.op === 0x71) fork(vm, op.args[0]);
      call = () => vm.run();
    }
  }
}

function runPath(start) {
  paths++;
  current = start.unknownBgm ? undefined : start.bgm ?? null;
  const vm = makeVm();
  if (!labels.has(start.label)) return report('missing-root', start.label, start.from ?? '');
  try {
    vm.reset(start.label);
    if (entered.has(start.label)) return;
    entered.add(start.label);
    vm.setNames(start.names ?? NAMES);
    let event = step(vm, () => vm.run());
    for (;;) {
      steps++;
      checkText(vm, event.text ?? '');
      if (event.type === 'pause' || event.type === 'wait') {
        if (event.type === 'pause' && !(event.text ?? '').trim() && event.reason !== 'choice-separator') report('empty-pause', vm.label, where(vm));
        event = step(vm, () => vm.run());
      } else if (event.type === 'name') {
        event = step(vm, () => vm.resume(NAMES[event.role]));
      } else if (event.type === 'choice') {
        for (const t of event.targets) queue.push({label: t, names: [...vm.names], bgm: current, unknownBgm: current === undefined, from: where(vm)});
        return;
      } else if (event.type === 'end' || event.type === 'break') {
        endings.set(event.label, (endings.get(event.label) ?? 0) + 1);
        return;
      } else {
        report('unknown-event', event.type, where(vm));
        return;
      }
    }
  } catch (error) {
    if (error instanceof Revisit) return;
    report('vm-error', error.message.replace(/ at \S+$/, ''), where(vm));
  }
}

queue.push({label: program.entry, names: NAMES});
while (queue.length) runPath(queue.shift());
// Labels nobody reached from the entry are explored as roots so their own
// problems still show up; they are listed separately as unreachable.
fromEntry = false;
const unreachable = program.labels.map(l => l.label).filter(l => !entered.has(l));
for (const l of unreachable) { queue.push({label: l, names: NAMES, unknownBgm: true}); while (queue.length) runPath(queue.shift()); }

const summary = {
  web, labels: program.labels.length, ops: [...opcodes.values()].reduce((a, b) => a + b, 0),
  opcodes: Object.fromEntries([...opcodes].sort((a, b) => a[0] - b[0]).map(([k, v]) => [hex(k), v])),
  reachedFromEntry: program.labels.length - unreachable.length, unreachable,
  paths, steps, endings: Object.fromEntries(endings),
  endOpsFromEntry: [...endOps].sort(),
  problems: Object.fromEntries([...problems].map(([k, b]) => [k, Object.fromEntries(b)])),
};
const md = [
  `# SN4 전수 검사`, '',
  `라벨 ${summary.labels}개, 명령 ${summary.ops}개, 시작점에서 도달 ${summary.reachedFromEntry}개, 경로 ${paths}개, 끝 라벨 ${endings.size}개, 시작점에서 도달한 엔딩 명령(0x27/0x28) ${endOps.size}개.`, '',
  // info-* kinds are expected engine behaviour worth counting, not listing.
  ...[...problems].flatMap(([kind, bucket]) => [`## ${kind} (${bucket.size}종)`, '',
    ...[...bucket].slice(0, kind.startsWith('info-') ? 3 : 50).map(([key, e]) => `- \`${key}\` ×${e.count} — 처음 ${e.first}`), '']),
  unreachable.length ? `## 시작점에서 도달하지 못한 라벨 (${unreachable.length})\n\n${unreachable.slice(0, 200).map(l => '`' + l + '`').join(', ')}\n` : '',
].join('\n');
if (out) {
  await mkdir(out, {recursive: true});
  await writeFile(path.join(out, 'sn4-explore.json'), JSON.stringify(summary, null, 2));
  await writeFile(path.join(out, 'sn4-explore.md'), md);
}
console.log(md);
const blocking = ['unsupported-op', 'vm-error', 'missing-jump', 'missing-next', 'missing-choice-target', 'missing-scenepack', 'missing-music-file', 'missing-image', 'missing-media'];
process.exitCode = blocking.some(k => problems.has(k)) ? 1 : 0;
