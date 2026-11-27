// Replays the 43 walkthrough routes on the VM, as kamaitachi-sfc-kor tools/campaign.py does
// on the instrumented Snes9x core, so both can be compared route by route (same decisions,
// same END_GAME site, same ending flag saved to bookmark 1).
//   node tools/campaign.mjs <rom.sfc> --data <dir with guide-sfc.json, scenario-catalog.json>
//        --work <dir> [--endings 1 2 3] [--vm <sfc-vm dir>]
// The observation points are the ones the core patch uses (kama_trace.inc):
//   $00:9A1D script bit position, $00:9A20 token, $00:A4D8 option poll (X/2 = highlighted
//   row), $00:A476 option accepted (X/2; $0B9A/B nonzero = script-chosen row; $03C9 target).
import fs from 'node:fs';
import path from 'node:path';
import { APU } from '../sound/apu.js';
import { MasterLink } from '../sound/master-link.js';

const BTN = { B: 0x8000, Y: 0x4000, SELECT: 0x2000, START: 0x1000, UP: 0x0800, DOWN: 0x0400,
  LEFT: 0x0200, RIGHT: 0x0100, A: 0x0080, X: 0x0040, L: 0x0020, R: 0x0010 };
const SCRIPT_BASE = 0x2fce1 * 8;
const SAVE_SIZE = 8192, SLOT_ONE = 0x800;

const fileBit = (packed) => { const a = packed >>> 3; return (((a >>> 16) & 127) * 0x8000 + (a & 0x7fff)) * 8 + (packed & 7); };

class Huffman {
  constructor(rom) {
    this.rom = rom; const u16 = (o) => rom[o] | (rom[o + 1] << 8);
    this.root = u16(0x1b0f); this.branches = [u16(0x1b28), u16(0x1b30)]; this.u16 = u16;
  }
  read(pos) {
    let node = this.root;
    while (!(node & 0x8000)) { node = this.u16(this.branches[(this.rom[pos >> 3] >> (pos & 7)) & 1] + node); pos++; }
    return [node & 0x1fff, pos];
  }
}

export class Session {
  constructor(m, rom, catalog) {
    this.m = m; this.tree = new Huffman(rom); this.frames = 0;
    this.byMenu = new Map(); this.byBit = new Map();
    for (const s of catalog.choices) {
      const k = `${s.choice_number}|${s.targets.map((t) => t.start_bit).join(',')}`;
      if (!this.byMenu.has(k)) this.byMenu.set(k, []);
      this.byMenu.get(k).push(s); this.byBit.set(s.start_bit, s);
    }
    this.endings = new Map(catalog.endings.map((s) => [s.start_bit, s]));
    this.observed = new Map(); this.dispatches = new Set();
    this.resetSignals();
    const cpu = m.cpu, wram = m.bus.wram, step = cpu.step.bind(cpu);
    cpu.step = () => { if (cpu.pbr === 0) this.hook(cpu.pc, cpu, wram); return step(); };
  }
  resetSignals() {
    Object.assign(this, { internal: null, lastBit: null, pending: null, accepted: null, acceptedBit: null,
      terminal: null, lastMenuRead: null, lastName: null, lastEndingFlag: null });
  }
  hook(pc, cpu, w) {
    if (pc === 0x9a1d) {
      const d = cpu.d, b = (i) => w[(d + i) & 0xffff];
      const ptr = (b(10) & 127) * 0x8000 + ((b(8) | (b(9) << 8)) & 0x7fff);
      let buffer = b(11) | (b(12) << 8), remaining = 0; while ((buffer >>= 1)) remaining++;
      this.lastBit = ptr * 8 - remaining;
    } else if (pc === 0x9a20) {
      const d = cpu.d, value = w[(d + 13) & 0xffff] | (w[(d + 14) & 0xffff] << 8);
      if (this.lastBit == null) return;
      const prev = this.observed.get(this.lastBit);
      if (prev === undefined) this.observed.set(this.lastBit, value); else if (prev !== value) this.observed.set(this.lastBit, -1);
      if (value >= 0x1050 && value <= 0x1057) this.lastMenuRead = this.lastBit;
      else if (value === 0x103b || value === 0x1020) {
        const [, pos] = this.tree.read(this.lastBit); const [arg] = this.tree.read(pos);
        if (value === 0x103b && arg === 4) this.lastName = this.lastBit;
        if (value === 0x1020 && arg >= 1 && arg <= 43) this.lastEndingFlag = arg;
      } else if (value === 0x1018) this.terminal = this.lastBit;
    } else if (pc === 0xa4d8) {
      this.pending = (cpu.x & 255) >> 1;
    } else if (pc === 0xa476) {
      const row = (cpu.x & 255) >> 1;
      if (w[0xb9a] || w[0xb9b]) this.internal = [this.lastMenuRead, row];
      else { this.accepted = row; this.pending = null; }
      const actual = fileBit(w[0x3c9] | (w[0x3ca] << 8) | (w[0x3cb] << 16));
      if (!this.internal) this.acceptedBit = actual;
      else {
        const [pos, option] = this.internal; this.internal = null;
        const site = this.byBit.get(pos);
        if (!site || option >= site.targets.length || site.targets[option].start_bit !== actual)
          throw new Error(`Unknown VM dispatch ${pos} row ${option}, target ${actual}`);
        this.dispatches.add(`${site.id}|${option}|${actual}`);
      }
    }
  }
  step(n = 1, button = null) {
    this.m.setButtons(button ? BTN[button] : 0);
    const end = this.m.frame + n; while (this.m.frame < end) this.m.step();
    this.frames += n;
  }
  press(key, wait = 8) { this.step(2, key); this.step(wait); }
  boot() { this.step(600); this.press('START', 160); this.press('A', 200); this.press('A', 200); this.press('A', 240); this.pending = this.accepted = this.terminal = null; }
  menu() {
    const w = this.m.bus.wram, d = (i) => w[0x423 + i];
    const count = d(0) >> 1;
    if (count < 2 || count > 5) throw new Error(`Invalid option count ${count}`);
    const number = d(1) | (d(2) << 8);
    const targets = []; for (let i = 0; i < count; i++) targets.push(fileBit(d(13 + i * 3) | (d(14 + i * 3) << 8) | (d(15 + i * 3) << 16)));
    const cands = this.byMenu.get(`${number}|${targets.join(',')}`) ?? [];
    let site = cands.find((s) => s.start_bit === this.lastMenuRead);
    if (!site && cands.length === 1) site = cands[0];
    if (!site) throw new Error(`Unmapped live choice ${number} with pointers ${targets}`);
    const options = []; for (let i = 0; i < count; i++) if (!(d(4 + 2 * i) & 128)) options.push(i);
    return { status: 'choice', id: site.id, options, targets, choice_number: number, highlight: this.pending };
  }
  select(index) {
    const menu = this.menu();
    if (!menu.options.includes(index)) throw new Error(`Inactive option ${index} at ${menu.id}`);
    let i = 0; for (; i < 6 && this.pending !== index; i++) this.press('DOWN', 6);
    if (this.pending !== index) throw new Error(`Cursor failed to reach ${index} at ${menu.id}`);
    this.accepted = this.acceptedBit = null;
    for (let k = 0; k < 4 && this.accepted == null; k++) this.press('A', 6);
    if (this.accepted !== index) throw new Error(`Expected accepted option ${index}, got ${this.accepted}`);
    if (this.acceptedBit !== menu.targets[index]) throw new Error(`Accepted option points to ${this.acceptedBit}, expected ${menu.targets[index]}`);
    this.accepted = this.acceptedBit = null;
  }
  cultpritReady() { const w = this.m.bus.wram; return w[0x102b] === 2 && w[0x102c] === 0 && w[0x1028] === 1 && w[0x11644] === 0xc5 && w[0x11645] === 0x06; }
  advance(budget = 90000, stall = 4800) {
    const start = this.frames; let last = this.frames, prev = null;
    while (this.frames - start < budget) {
      if (this.pending != null) return this.menu();
      if (this.terminal != null) {
        const site = this.endings.get(this.terminal);
        if (!site) throw new Error(`Unmapped END_GAME at bit ${this.terminal}`);
        return { status: 'ending', id: site.id, flag: this.lastEndingFlag };
      }
      if (this.lastName != null && this.cultpritReady()) { this.step(45); return { status: 'name', id: `name-${this.lastName}` }; }
      this.press('A', 8);
      if (this.accepted != null) throw new Error('A menu was accepted before its checkpoint');
      if (this.lastBit !== prev) { prev = this.lastBit; last = this.frames; }
      if (this.frames - last >= stall) return { status: 'stall', last_bit: this.lastBit };
    }
    return { status: 'timeout', last_bit: this.lastBit };
  }
}

// Suspect-name keyboard (name_input.py).
const KANA_ROWS = ['あいうえおぁぃぅぇぉ', 'かきくけこがぎぐげご', 'さしすせそざじずぜぞ', 'たちつてとだぢづでど', 'なにぬねの     ',
  'はひふへほばびぶべぼ', 'まみむめもぱぴぷぺぽ', 'や ゆ よゃゅょっー', 'らりるれろわ を ん'];
const POS = new Map(); KANA_ROWS.forEach((line, r) => [...line].forEach((c, i) => { if (c !== ' ') POS.set(c, (r + 1) * 16 + i + 2); }));
function enterCulprit(s, name) {
  const w = s.m.bus.wram;
  if (!s.cultpritReady()) throw new Error('The suspect keyboard is not ready');
  if (w[0x1024] !== 0) throw new Error('Expected an empty suspect-name buffer');
  [...name].forEach((c, i) => {
    const target = POS.get(c); if (target == null) throw new Error(`Name outside keyboard: ${name}`);
    let k = 0; for (; k < 24 && w[0x1020] !== target; k++) {
      const pos = w[0x1020], dx = (target & 15) - (pos & 15), dy = (target >> 4) - (pos >> 4);
      s.press(dx ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP'));
    }
    if (w[0x1020] !== target) throw new Error(`Keyboard cursor could not reach ${c}`);
    const g0 = w[0x11620 + target * 2], g1 = w[0x11621 + target * 2];
    s.press('A');
    if (w[0x120d0 + i * 2] !== g0 || w[0x120d1 + i * 2] !== g1) throw new Error(`The game did not enter glyph ${i + 1} of ${name}`);
  });
  s.press('START');
}

class Route {
  constructor(guide) { this.steps = guide.steps; this.next = '1'; this.log = []; }
  distance(a, pred) {
    const q = [[String(a), 0]], seen = new Set();
    while (q.length) { const [n, d] = q.shift(); if (seen.has(n)) continue; seen.add(n); if (pred(n)) return d; if (n === 'END') continue;
      for (const nx of Object.values(this.steps[n].moves)) q.push([String(nx), d + 1]); }
    return Infinity;
  }
  match(site) {
    const ranked = Object.keys(this.steps).filter((n) => n !== 'END' && this.steps[n].sites.includes(site))
      .map((n) => [this.distance(this.next, (x) => x === n), n]).sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1));
    if (!ranked.length || ranked[0][0] === Infinity) throw new Error(`Unexpected ${site} after guide step ${this.next}`);
    return ranked[0][1];
  }
  choice(site, options) {
    const n = this.match(site), moves = this.steps[n].moves;
    const possible = Object.entries(moves).filter(([l]) => 'ABCDE'.includes(l) && l.length === 1 && options.includes(l.charCodeAt(0) - 65))
      .map(([l, dst]) => [this.distance(dst, (x) => x === 'END'), l, String(dst)]).sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1));
    if (!possible.length) throw new Error(`Guide step ${n} has no allowed option for ${site}`);
    const [, label, next] = possible[0]; this.next = next;
    this.log.push({ step: n, site, option: label });
    return label.charCodeAt(0) - 65;
  }
  name() {
    const opts = Object.entries(this.steps[this.next]?.moves ?? {}).filter(([k]) => k.startsWith('name:'));
    if (opts.length !== 1) throw new Error(`Unexpected suspect keyboard at guide step ${this.next}`);
    const [k, v] = opts[0]; this.log.push({ step: this.next, name: k.slice(5) }); this.next = String(v); return k.slice(5);
  }
}

const endingFlags = (sram) => { let f = 0n; for (let i = 7; i >= 0; i--) f = (f << 8n) | BigInt(sram[SLOT_ONE + 0x18 + i]); const out = new Set(); for (let i = 1; i <= 43; i++) if (f & (1n << BigInt(i))) out.add(i); return out; };

function bootSlot(s, seed) {
  if (!seed) { s.boot(); return; }
  s.m.bus.sram.set(seed);
  s.step(600); s.press('START', 160); s.press('A', 160); s.press('A', 160); s.press('DOWN', 30); s.press('A', 180);
  s.pending = s.accepted = s.terminal = null;
}

export function runRoute(s, guide, seed) {
  const ending = +guide.id.slice(3), route = new Route(guide);
  bootSlot(s, seed);
  const before = seed ? endingFlags(seed) : new Set();
  let event;
  for (let i = 0; ; i++) {
    if (i >= 150) throw new Error('Exceeded guide step limit');
    if ('reset' in (route.steps[route.next]?.moves ?? {})) throw new Error('Console reset route is not supported yet');
    event = s.advance();
    if (event.status === 'choice') { const c = route.choice(event.id, event.options); s.step(20); s.select(c); }
    else if (event.status === 'name') { enterCulprit(s, route.name()); s.lastName = null; }
    else if (event.status === 'ending') break;
    else throw new Error(`Route stopped at ${JSON.stringify(event)} after ${JSON.stringify(route.log.slice(-2))}`);
  }
  if (route.next !== 'END') throw new Error(`The ending arrived before guide step ${route.next}`);
  if (event.flag !== ending) throw new Error(`Expected ending opcode flag ${ending}, observed ${JSON.stringify(event)}`);
  let fresh = new Set();
  for (let i = 0; i < 1500; i++) { fresh = new Set([...endingFlags(s.m.bus.sram)].filter((x) => !before.has(x))); if (fresh.size) break; s.press('A', 12); }
  const now = endingFlags(s.m.bus.sram);
  if (![...before].every((x) => now.has(x))) throw new Error('Previously earned endings disappeared from the bookmark');
  if (fresh.size !== 1 || !fresh.has(ending)) throw new Error(`Expected slot-one ending ${ending}, obtained ${[...fresh]}`);
  return { save: s.m.bus.sram.slice(), report: { guide: guide.id, steps: route.log, terminal: event, decisions: route.log.filter((x) => x.option).length,
    new_slot_one_ending: ending, frames: s.frames, internal_dispatches: [...s.dispatches].sort() } };
}

async function main() {
  const args = process.argv.slice(2); const romPath = args[0];
  const opt = (k, d) => { const i = args.indexOf(k); return i < 0 ? d : args[i + 1]; };
  const data = opt('--data'), work = opt('--work'), vm = opt('--vm', process.env.SFC_VM ?? '../../../sfc-vm');
  const ei = args.indexOf('--endings');
  const endings = ei < 0 ? [...Array(20).keys()].map((i) => i + 1).concat([43], [...Array(22).keys()].map((i) => i + 21))
    : args.slice(ei + 1).filter((x) => /^\d+$/.test(x)).map(Number);
  fs.mkdirSync(work, { recursive: true });
  const guides = JSON.parse(fs.readFileSync(path.join(data, 'guide-sfc.json'))).endings;
  const catalog = JSON.parse(fs.readFileSync(path.join(data, 'scenario-catalog.json')));
  const rom = new Uint8Array(fs.readFileSync(romPath));
  const { SfcMachine } = await import(`${vm}/machine.js`);
  const statePath = path.join(work, 'campaign.srm');
  let seed = fs.existsSync(statePath) ? new Uint8Array(fs.readFileSync(statePath)) : null;
  for (const n of endings) {
    if (seed && endingFlags(seed).has(n)) continue;
    const guide = guides.find((g) => g.id === `end${String(n).padStart(2, '0')}`);
    const apu = new APU(); apu.powerOn();
    const m = new SfcMachine({ rom, apu, busOptions: { masterLink: new MasterLink(apu) } });
    const s = new Session(m, rom, catalog); const t0 = Date.now();
    try {
      const { save, report } = runRoute(s, guide, seed);
      seed = save; report.seconds = (Date.now() - t0) / 1000; report.slot_one_endings = [...endingFlags(seed)].sort((a, b) => a - b);
      fs.writeFileSync(path.join(work, `${guide.id}.json`), JSON.stringify(report));
      fs.writeFileSync(statePath, seed);
      console.log(`${guide.id}: ok ${report.decisions} decisions, ${report.terminal.id}, ${s.frames} frames, ${report.seconds}s; bookmark ${report.slot_one_endings.length}/43`);
    } catch (err) {
      const finding = { guide: guide.id, frames: s.frames, last_script_bit: s.lastBit, reason: String(err.message ?? err) };
      fs.writeFileSync(path.join(work, `${guide.id}-failure.json`), JSON.stringify(finding));
      console.log(`${guide.id}: FAIL ${finding.reason} at frame ${s.frames}`);
      if (!args.includes('--keep-going')) process.exitCode = 1;
      if (!args.includes('--keep-going')) return;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
