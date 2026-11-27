// 428 PSP web player prototype: runs the original bytecode (engine/vm.js) and draws a 480x272 frame.
// Display-op semantics are provisional (see OPCODES.md); timings are in 60 fps frames.
// Assets are not in this repository: ?assets=<url> points at a folder produced from the user's disc
// (to.sns, to.flo, ids.json, png/<cpk>/*.png, snd/<cpk>/*.ogg, font/font_0_50.*).
import { decryptSns, parseSns } from '../engine/sns.js';
import { VM } from '../engine/vm.js';
import { parseFlo } from '../engine/flo.js';
import { Game, CHARACTERS } from '../engine/game.js';
import { createSelect } from './select.js';

const q = new URLSearchParams(location.search);
const BASE = (q.get('assets') || '../assets/').replace(/\/?$/, '/');
const START = q.get('label'); // debug: run from a label; without it a new game starts at the character select
const FAST = q.has('fast'); // tests: skip waits and auto-advance
const cv = document.getElementById('screen'); const g = cv.getContext('2d');
const status = document.getElementById('status');
const W = 480, H = 272;

// Whole-number scale in device pixels (so a phone narrower than 480 CSS px still gets a crisp 1x/2x of the original).
function fit() { const d = devicePixelRatio || 1, k = Math.max(1, Math.floor(Math.min(Math.min(innerWidth, screen.width) / W, Math.min(innerHeight, screen.height) / H) * d)); cv.style.width = W * k / d + 'px'; cv.style.height = H * k / d + 'px'; }
addEventListener('resize', fit); fit();

const bytes = async p => new Uint8Array(await (await fetch(BASE + p)).arrayBuffer());
const json = async p => (await fetch(BASE + p)).json();
const img = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(src)); i.src = src; });

const [rawSns, rawFlo, ids, fontMeta, fontImg] = await Promise.all([bytes('to.sns'), bytes('to.flo'), json('ids.json'), json('font/font_0_50.json'), img(BASE + 'font/font_0_50.png')]);
const sns = parseSns(rawSns[0x10] === 0x43 ? decryptSns(rawSns) : rawSns);
const vm = new VM(sns);
{ const init = sns.scripts[0]; vm.script = init; vm.pc = init.codeStart; while (!vm.halted) vm.step(); vm.halted = false; }
const slotOf = l => sns.scripts.findIndex(s => s.labels.has(l));
// ---- game progress (engine/game.js): character select, zapping, hour blocks
const game = new Game(parseFlo(rawFlo), vm);
{ const goto0 = vm.goto.bind(vm); vm.goto = (sl, l) => { goto0(sl, l); game.passLabel(l); }; }
const KO_UI = q.get('lang') === 'ko';
const select = createSelect({ g: cv.getContext('2d'), W: 480, H: 272, BASE, img: src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }), ko: KO_UI });
game.newGame();
if (START) vm.goto(slotOf(START), START); else openSelect();
function openSelect() {
  status.textContent = '';
  const list = game.selectable(); if (!list.length) return;
  select.open(list, 10 + game.block, game.current);
}
function resetScreen() {
  S.lines = [[]]; S.click = null; S.choice = null; S.wait = 0; S.propWait = null; S.zap = null; S.pic = null; S.next = null; S.layers.clear();
  S.trans = { type: 0, frames: 0, t: 0, run: false }; S.fade = { a: 0, step: 0 }; koSkip = false;
  bgm?.pause(); bgm = null; for (const a of audio.values()) a?.pause?.(); for (const m of movies.values()) m.img.pause?.();
}
function startChar(id) { select.close(); resetScreen(); game.play(id, slotOf); }
function doZap() { if (!S.zap?.open) return; resetScreen(); game.zap(); }

// ---- Korean (?lang=ko): lines come from the private 428-psp-kor data (?kodata=<folder with script-ja/ and script-ko/>).
// Each exported entry starts at the pc of its first text op; the Korean line replaces every text op of that entry.
const KO = q.get('lang') === 'ko';
const KODATA = (q.get('kodata') || BASE + 'kor/').replace(/\/?$/, '/');
const koScripts = new Map(); // script name -> Map(pc -> entry) | 'loading'
async function loadKo(name) {
  if (koScripts.has(name)) return; koScripts.set(name, 'loading');
  try {
    const [ja, ko] = await Promise.all([json2(`${KODATA}script-ja/${name}.json`), json2(`${KODATA}script-ko/${name}.json`)]);
    const byId = new Map(ko.entries.map(e => [e.id, e.ko])); const m = new Map();
    for (const e of ja.entries) if (e.ja !== undefined && byId.has(e.id)) m.set(e.pc, { ...e, ko: byId.get(e.id) });
    koScripts.set(name, m);
  } catch { koScripts.set(name, new Map()); }
}
async function json2(u) { const r = await fetch(u); if (!r.ok) throw new Error(u); return r.json(); }
if (KO && vm.script) await loadKo(vm.script.name.replace(/\.xml$/, ''));
let koSkip = false; // inside a replaced entry: drop the original's text-building ops until the entry ends
function koEntry(pc) { const m = koScripts.get(vm.script.name.replace(/\.xml$/, '')); return m instanceof Map ? m.get(pc) : null; }
function putKo(t) { // {base|reading} ruby, \n forced line, … and ― as cells, 仝 kept as the original's indent glyph
  for (const [i, part] of t.split('\n').entries()) {
    if (i) newLine();
    for (const m of part.matchAll(/\{([^|}]*)\|([^}]*)\}|[^{]+/g)) {
      if (m[1] !== undefined) { curLine().push({ text: m[1], ruby: m[2] }); } else curLine().push({ text: m[0] });
    }
  }
}

// ---- resources: id -> file in the current chapter CPK (script k01.xml <-> k01.cpk)
const cpkOf = () => vm.script.name.replace(/\.xml$/, '');
const resName = id => (ids[cpkOf()] || {})[id & 0x7fff];
const picCache = new Map();
function picture(id) {
  const n = resName(id); if (!n) return null;
  const url = `${BASE}png/${cpkOf()}/${n.replace(/\.gim$/, '.png')}`;
  if (!picCache.has(url)) { const e = { img: null }; picCache.set(url, e); img(url).then(i => e.img = i, () => {}); }
  return picCache.get(url);
}
// Movies (9C id|0x4000 flag, volume, 1, 1 / 9E wait for end / 9D stop): pmf converted to mp4 (tools/pmf2mp4.py).
// A movie becomes the next picture and enters through the pending transition (63 .. 9C .. 64 65), like a still.
const movies = new Map();
function movie(id, vol) {
  const n = resName(id & 0x3fff); if (!n) return null;
  const v = document.createElement('video'); v.src = `${BASE}mov/${cpkOf()}/${n.replace(/\.pmf$/, '.mp4')}`;
  v.muted = muted || vol === 0; v.volume = Math.min(1, vol / 100); v.playsInline = true; v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  const e = { img: v, video: true }; movies.set(id, e); return e;
}
const audio = new Map(); let bgm = null;
function sound(id, vol, kind) {
  const n = resName(id); if (!n) return null;
  const a = new Audio(`${BASE}snd/${cpkOf()}/${n.replace(/\.(csb|at3)$/, '.ogg')}`);
  a.loop = !!(id & 0x8000) || kind === 'bgm'; a.volume = Math.min(1, vol / 100);
  a.muted = muted; a.play().catch(() => {}); return a;
}

// ---- screen state
const S = { pic: null, next: null, layers: new Map(), propWait: null, trans: { type: 0, frames: 0, t: 0, run: false }, fade: { a: 0, step: 0 },
  win: 0, lines: [[]], center: false, ruby: null, wait: 0, click: null, choice: null, speed: 2, typing: 0 };

function advanceOps() {
  // Run VM ops until something needs time or input.
  for (let guard = 0; guard < 5000; guard++) {
    if (S.movieWait && !S.movieWait.ended && !FAST) return; S.movieWait = null;
    if (S.wait > 0 || S.click || S.choice || (S.trans.run && S.trans.block)) return;
    if (S.propWait) { const { p, prop } = S.propWait, k = p.pk[prop]; if (!FAST && k?.length && p.t < k.at(-1).t && (S.layers.get(p.layer) === p || S.pic === p)) return; S.propWait = null; }
    const e = vm.step(); if (!e) continue;
    if (KO && (e.type === 'text' || (e.type === 'op' && (e.op === 0x1c || e.op === 0x43)))) { const k = !koSkip && koEntry(e.pc); if (k) { putKo(k.ko); koSkip = true; continue; } if (koSkip && e.type === 'text') continue; }
    if (KO) loadKo(vm.script.name.replace(/\.xml$/, ''));
    if (KO && koSkip && e.type === 'op') {
      if ([0x1c, 0x1d, 0x43, 0x1e].includes(e.op)) continue;
      if (e.op === 0x1b && S.center) continue;
      if (e.op === 0x2b) { koSkip = false; continue; }
      if ([0x1b, 0x1f, 0x25, 0x18].includes(e.op)) koSkip = false;
    }
    if (KO && koSkip && e.type !== 'op' && e.type !== 'text') koSkip = false;
    if (e.type === 'text') { putText(e.text); continue; }
    if (e.type === 'label') { game.passLabel(e.label); continue; }
    if (e.type === 'zap') { S.zap = e.open ? e : null; continue; }
    if (e.type === 'choice') { S.choice = e; return; }
    if (e.type === 'sceneEnd' || e.type === 'end') { status.textContent = '장면 끝'; S.click = 'end'; return; }
    if (e.type !== 'op') continue;
    const a = e.arg || [];
    const u16 = o => (a[o] << 8) | a[o + 1], u32 = o => ((a[o] << 24) | (a[o + 1] << 16) | (a[o + 2] << 8) | a[o + 3]) >>> 0;
    switch (e.op) {
      case 0x2d: S.wait = FAST ? 0 : u32(0); break;                                  // wait frames
      case 0x44: { const e = picture(u16(0)), l = a[2]; const p = e && { id: u16(0), layer: l, get img() { return e.img; }, pk: {}, get keys() { return this.pk[8]; }, t: 0, on: false };
        if (l <= 1) S.next = p; else if (p) S.layers.set(l, p); break; } // layer 1: picture shown at the next transition; 2+: overlay sprite
      case 0x66: case 0x67: key(e.op, a); break;                                     // property keyframe (camera rect = property 8)
      case 0x69: { const p = findPic(u16(3)); if (p) delete p.pk[a[0]]; break; } // release one property's keyframes
      case 0x68: { const p = findPic(u16(3)); if (p) S.propWait = { p, prop: a[0] }; break; } // wait until that property's keyframes have run
      case 0x6a: { const p = S.layers.get(a[0]); if (p) { p.on = true; } break; } // show overlay layer
      case 0x6b: if (a[0] > 1) S.layers.delete(a[0]); break;                     // remove overlay layer
      case 0x63: S.trans = { type: a[0], frames: a[0] === 4 && a.length >= 9 ? u16(7) : a.length >= 5 ? u16(3) : 0, t: 0, run: false, rgb: a[0] === 4 && a.length >= 15 ? [u16(9), u16(11), u16(13)] : null }; break;
      case 0x64: if (S.next) { S.trans.run = true; S.trans.t = 0; if (!TRANS_TIMED.has(S.trans.type) || !S.trans.frames || FAST) finishTrans(); else if (S.trans.type === 1) { S.pic = S.next; } } break;
      case 0x65: if (S.trans.run) S.trans.block = true; break;                       // wait for transition
      case 0x03: case 0x05: { const n = Math.max(1, u32(0)); S.fade.step = 1 / n; if (FAST) S.fade.a = 1; break; } // darken over n frames
      case 0x07: case 0x09: { const n = Math.max(1, u32(0)); S.fade.step = -1 / n; if (FAST) S.fade.a = 0; break; } // lighten
      case 0x04: case 0x08: S.fade.a = 0; S.fade.step = 0; break;
      case 0x06: case 0x0a: S.fade.a = 1; S.fade.step = 0; break;
      case 0x23: S.win = a[0]; break;                                               // text block style (original keeps the page; only 1F clears)
      case 0x25: break;                                                              // end of text block
      case 0x1e: newLine(); break;                                                   // newline
      case 0x17: S.center = true; if (!curLine().length) curLine().center = true; break; // centred block (black-screen lines)
      case 0x18: S.center = false; break;
      case 0x43: curLine().push({ text: '…' }); break;                                 // ellipsis cell (43 1,0); other args seen rarely
      case 0x2b: curLine().push({ text: '―'.repeat(a[0] || 1) }); break;             // dash of n cells
      case 0x0f: if (!FAST) S.wait = a[0]; break;                                    // short pause (after ellipses), provisional
      case 0x1b: if (S.center) newLine(); else if (!FAST && S.lines.some(l => l.length)) S.click = 'line'; break; // line wait; inside a centred block it only breaks the line, and the original skips it on an empty page
      case 0x1f: if (!FAST) S.click = 'page'; else clearPage(); break;               // wait (book icon), then clear page
      case 0x1c: S.ruby = { reading: '', base: null }; break;
      case 0x1d: S.ruby.base = ''; break;
      case 0x7a: case 0x91: { const id = u16(0); audio.get(id)?.pause(); audio.set(id, sound(id, u16(2), 'se')); break; }
      case 0x7b: { const id = u16(0); audio.get(id)?.pause(); audio.delete(id); break; }
      case 0x9c: { const m = movie(u16(0), u16(2)); if (m) S.next = m; break; }
      case 0x9e: S.movieWait = movies.get(u16(0))?.img || null; break;
      case 0x9d: movies.get(u16(0))?.img.pause(); movies.delete(u16(0)); break;
      case 0x92: bgm?.pause(); bgm = sound(u16(0), u16(2), 'bgm'); break;
      case 0x93: bgm?.pause(); bgm = null; break;
    }
  }
}
const curLine = () => S.lines[S.lines.length - 1];
function newLine() { const l = []; l.center = S.center; S.lines.push(l); }
function clearPage() { S.lines = [[]]; S.lines[0].center = S.center; }
function putText(t) {
  const line = curLine();
  if (S.ruby) {
    if (S.ruby.base === null) { S.ruby.reading += t; return; }
    line.push({ text: t, ruby: S.ruby.reading }); S.ruby = null; return;
  }
  line.push({ text: t });
}
// 66/67 <prop> <layer> 00 <id u16> <n values> <u16 × n>: 66 sets the first keyframe, 67 adds one later.
// prop 8 (n=6) = [frame, x1, y1, x2, y2, ease]: the source rectangle shown on screen. Units: 1280×720 = 464×256 picture
// pixels (the size of an ordinary full-screen picture); camera pictures are 752×496. Matched on the original
// (K01A_0010 c04 end keyframe, correlation 0.98). ease 0 linear, 1–3 eased (curves provisional).
function findPic(id) { return [S.next, S.pic, ...S.layers.values()].find(p => p && p.id === id); }
// prop 8 (n=6) [frame, x1, y1, x2, y2, ease] source rect; prop 14 (n=6) [frame, x, y, _, _, ease]? screen position of an
// overlay (1280×720 units; K08A_0010_1200 scrolls four sprites with it); prop 24 (n=3) [frame, alpha 0–255, ease].
function key(op, a) {
  const id = (a[3] << 8) | a[4], n = a[5], v = []; for (let i = 0; i < n; i++) { const x = (a[6 + i * 2] << 8) | a[7 + i * 2]; v.push(x > 0x7fff ? x - 0x10000 : x); }
  const prop = a[0]; const p = findPic(id); if (!p) return;
  let k;
  if (prop === 8 && n === 6) k = { t: v[0], r: [v[1] * 464 / 1280, v[2] * 256 / 720, v[3] * 464 / 1280, v[4] * 256 / 720], ease: v[5] };
  else if (prop === 14 && n === 6) k = { t: v[0], r: [v[1], v[2], v[3], v[4]], ease: v[5] };
  else if (prop === 24 && n === 3) k = { t: v[0], r: [v[1] / 255], ease: v[2] };
  else return;
  // The frame count of a 67 runs from now (K08A_0010_1230 sends 15-frame moves long after a 6000-frame one, then waits
  // with 68); for the usual 66-then-67 pair at the same moment this is the same as an absolute time.
  if (op === 0x66) { p.pk[prop] = [k]; p.t = 0; return; }
  const cur = valueAt(p.pk[prop], p.t), ks = (p.pk[prop] || []).filter(x => x.t < p.t);
  if (cur) ks.push({ t: p.t, r: cur, ease: 0 });
  k.t += p.t; ks.push(k); p.pk[prop] = ks;
}
const EASE = [t => t, t => t * t, t => 1 - (1 - t) * (1 - t), t => t * t * (3 - 2 * t)];
function valueAt(k, t) {
  if (!k?.length) return null;
  let i = 0; while (i < k.length - 1 && k[i + 1].t <= t) i++;
  if (i === k.length - 1 || t <= k[0].t) return t <= k[0].t ? k[0].r : k[i].r;
  const a = k[i], b = k[i + 1], u = (EASE[b.ease] || EASE[0])((t - a.t) / Math.max(1, b.t - a.t));
  return a.r.map((x, j) => x + (b.r[j] - x) * u);
}
function rectOf(p) { return valueAt(p.pk?.[8], p.t); }
function drawPic(p) {
  const r = rectOf(p); const im = p.img; if (!im) return;
  const al = valueAt(p.pk?.[24], p.t), ga = g.globalAlpha; if (al) g.globalAlpha = ga * Math.max(0, Math.min(1, al[0]));
  const pos = valueAt(p.pk?.[14], p.t);
  if (pos) { // overlay sprite at a screen position, drawn at picture scale (464×256 picture px = 480×272 screen)
    const sw = r ? r[2] - r[0] : im.width, sh = r ? r[3] - r[1] : im.height;
    const dx = pos[0] * W / 1280, dy = pos[1] * H / 720, dw = sw * W / 464, dh = sh * H / 256;
    if (r) g.drawImage(im, r[0], r[1], sw, sh, dx, dy, dw, dh); else g.drawImage(im, dx, dy, dw, dh);
  } else if (r) g.drawImage(im, r[0], r[1], r[2] - r[0], r[3] - r[1], 0, 0, W, H); else g.drawImage(im, 0, 0, W, H);
  g.globalAlpha = ga;
}
// 63 transition types (EBOOT table 0x089CAAB4, state functions per type):
//  1 = new picture at once under a black full-screen rect whose alpha runs 1→0 (fade in from black, 0x0891285C → 0x0888CF40)
//  2 = black rect over the old picture runs 0→1, then the new picture (fade out to black)
//  3 = blend weight between old and new layers runs 0→1 (crossfade, 0x08911BD8 → 0x0888ABD0)
//  4 = colour (r,g,b from the args, e.g. white) over the old picture 0→1, swap, then 1→0 (provisional: flash)
//  11 = cut. Others (12 = masked wipe with a rule picture, …) fall back to a crossfade until compared.
const TRANS_TIMED = new Set([1, 2, 3, 4, 12]);
function transDraw() {
  const T = S.trans, u = Math.min(1, T.t / Math.max(1, T.frames));
  if (T.type === 1) return { over: 1 - u };
  if (T.type === 2) return { over: u };
  if (T.type === 4) return u < 0.5 ? { over: u * 2, rgb: T.rgb } : { over: 2 - u * 2, rgb: T.rgb, swapped: true };
  return { blend: u };
}
function finishTrans() { if (S.next) S.pic = S.next; S.next = null; S.trans.run = false; S.trans.block = false; }

function click() {
  if (S.choice) return;
  if (S.click === 'end') { game.sceneEnd(); resetScreen(); openSelect(); return; }
  if (S.click === 'page') clearPage();
  if (S.click !== 'end') S.click = null;
}
// ---- touch: a tap on the screen is ○ (advance / pick the tapped choice); the menu icon holds the rest.
const menu = document.getElementById('menu'), menuBtn = document.getElementById('menuBtn');
let muted = false;
const setMenu = open => { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open); };
menuBtn.addEventListener('pointerdown', ev => ev.stopPropagation());
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('pointerdown', ev => ev.stopPropagation());
menu.addEventListener('click', ev => {
  const act = ev.target.dataset?.act; if (!act) return;
  if (act === 'sound') { muted = !muted; ev.target.textContent = muted ? '소리 켜기' : '소리 끄기'; for (const a of [bgm, ...audio.values(), ...[...movies.values()].map(m => m.img)]) if (a) a.muted = muted; }
  if (act === 'full') { const st = document.getElementById('stage'); document.fullscreenElement ? document.exitFullscreen() : st.requestFullscreen?.(); }
  setMenu(false);
});
cv.addEventListener('pointerdown', ev => {
  if (!menu.hidden) { setMenu(false); return; }
  { const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width, y = (ev.clientY - r.top) * H / r.height;
    if (select.st.on) { if (select.tap(x, y)) select.pick(FAST ? null : startChar); if (FAST && select.st.picked != null) { const c = select.st.picked; select.close(); startChar(c); } return; }
    if (S.zap?.open && x < 76 && y > 196 && y < 228) { doZap(); return; } }
  if (S.choice) {
    const r = cv.getBoundingClientRect(); const y = (ev.clientY - r.top) * H / r.height;
    const i = Math.floor((y - 90) / 32); if (i >= 0 && i < S.choice.options.length) { vm.choose(i); S.choice = null; }
    return;
  }
  click();
});
addEventListener('keydown', ev => {
  if (select.st.on) { if (ev.key === 'ArrowLeft') select.move(-1); if (ev.key === 'ArrowRight') select.move(1); if (ev.key === 'Enter' || ev.key === ' ') select.pick(startChar); return; }
  if ((ev.key === 'j' || ev.key === 'J') && S.zap?.open) doZap();
  if (ev.key === 'Enter' || ev.key === ' ') click(); if (ev.key === 'Escape') setMenu(menu.hidden); });
addEventListener('fullscreenchange', fit);

// ---- drawing
// Glyph header (font units): [adv, em, bx, by, bw, bh] horizontal, then full-width and vertical sets.
// Units are 1280-wide-screen pixels: screen px = unit x 480/1280 (matches the original's line widths).
const CELL = 50 * 0.375 + 0.7; // full-width cell (glyph advance 50)
// Characters the original font lacks (Hangul) are drawn with a web font sized to the original's body text.
const HANGUL = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/;
const KFONT = 17, kMeasure = new Map();
document.fonts?.ready.then(() => kMeasure.clear());
function kAdv(ch) { if (!kMeasure.has(ch)) { g.font = `500 ${KFONT}px 'Noto Sans KR', sans-serif`; kMeasure.set(ch, g.measureText(ch).width); } return kMeasure.get(ch); }
function advance(ch, scale = 1) {
  if (ch === '…' || ch === '―' || ch === '仝') return CELL * scale; // 仝 = the script's full-width space (indent, gap after ？！)
  if (!fontMeta[ch.codePointAt(0)] && ch !== ' ') return (kAdv(ch) + 1) * scale;
  if (ch === ' ') return CELL * 0.4 * scale;
  const m = fontMeta[ch.codePointAt(0)]; return m ? (m[4] * 0.375 + 0.7) * scale : 10 * scale;
}
// The font has no ellipsis or dash; the original draws them as cells (ops 43, 2B).
function drawSpecial(ch, x, y, scale) {
  if (ch === '…') { for (let i = 0; i < 3; i++) g.fillRect(Math.round(x + (3 + i * 6) * scale), Math.round(y + 9 * scale), Math.max(1, 2 * scale), Math.max(1, 2 * scale)); }
  else g.fillRect(Math.round(x), Math.round(y + 9 * scale), Math.ceil(CELL * scale), Math.max(1, Math.round(1.5 * scale)));
}
function drawGlyph(ch, x, y, scale = 1) {
  if (ch === '仝') return advance(ch, scale);
  if (ch === '…' || ch === '―') { g.fillStyle = g.filter === 'none' ? '#e8e8ee' : '#000'; drawSpecial(ch, x, y, scale); return advance(ch, scale); }
  const m = fontMeta[ch.codePointAt(0)];
  if (!m) { if (ch !== ' ') { g.font = `500 ${KFONT * scale}px 'Noto Sans KR', sans-serif`; g.textBaseline = 'top'; g.fillStyle = g.filter === 'none' ? '#f0f0f0' : '#000'; g.fillText(ch, x, y + 1 * scale); } return advance(ch, scale); }
  g.drawImage(fontImg, m[0], m[1], m[2], m[3], x, y, m[2] * scale, m[3] * scale); return advance(ch, scale);
}
const OUTLINE = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]; // dark rim seen on the original text
function outlined(ch, x, y, scale = 1) {
  g.filter = 'brightness(0)'; g.globalAlpha = 0.7; for (const [dx, dy] of OUTLINE) drawGlyph(ch, x + dx, y + dy, scale);
  g.filter = 'none'; g.globalAlpha = 1; return drawGlyph(ch, x, y, scale);
}
// Measured on the original (PPSSPP, K01A_0010): body text top-left x=50, first line top 26, pitch 27, wrap at 430.
// Centred lines (17..18) are centred on x=240; a centred page is centred on y=116 (line tops 108 - 13.5 per extra line).
const LEFT = 50, TOP = 26, PITCH = 27, RIGHT = 430;
function layout() {
  // -> rows of { x, y, items:[{ch,x}], rubies } ; wraps like the original (a ruby group never splits).
  const rows = []; let row = null;
  const open = center => { row = { center, items: [], rubies: [], w: 0 }; rows.push(row); };
  for (const line of S.lines) {
    open(!!line.center);
    for (const seg of line) {
      const chars = [...seg.text], sw = chars.reduce((w, c) => w + advance(c), 0);
      if (seg.ruby && row.w + sw > RIGHT - LEFT) open(row.center);
      const x0 = row.w, r0 = row;
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        // Korean wraps between words (Japanese per character, as the original); a wrapped line drops its leading space.
        if (ch === ' ' && row.w === 0 && row.items.length === 0 && rows.length > 1) continue;
        if (HANGUL.test(ch) && (i === 0 || chars[i - 1] === ' ')) {
          let j = i, ww = 0; while (j < chars.length && chars[j] !== ' ') ww += advance(chars[j++]);
          if (row.w > 0 && row.w + ww > RIGHT - LEFT && ww <= RIGHT - LEFT) open(row.center);
        } else if (row.w + advance(ch) > RIGHT - LEFT) open(row.center);
        if (ch === ' ' && row.w === 0 && rows.length > 1) continue;
        row.items.push({ ch, x: row.w }); row.w += advance(ch);
      }
      if (seg.ruby) r0.rubies.push({ text: seg.ruby, x: x0, w: row.w - x0 });
    }
  }
  const centred = rows.length && rows.every(r => r.center || !r.items.length) && rows.some(r => r.center);
  const n = rows.filter((r, i) => r.items.length || i < rows.length - 1).length || 1;
  const top = centred ? Math.round(108 - (n - 1) * PITCH / 2) : TOP;
  rows.forEach((r, i) => { r.y = top + i * PITCH; r.x = r.center ? Math.round(240 - r.w / 2) : LEFT; });
  return rows;
}
function drawText() {
  if (!S.win) return null;
  const rows = layout();
  for (const r of rows) {
    for (const it of r.items) outlined(it.ch, r.x + it.x, r.y);
    // ruby: kana spread evenly over the base, each centred in its slot, small font just above the line
    for (const rb of r.rubies) { const k = [...rb.text], slot = rb.w / k.length; k.forEach((ch, i) => outlined(ch, r.x + rb.x + slot * (i + 0.5) - advance(ch, 0.45) / 2, r.y - 8, 0.45)); }
  }
  const last = rows[rows.length - 1];
  return { x: last.x + last.w, y: last.y, nextY: last.y + PITCH, left: last.center ? last.x : LEFT };
}
// Wait icons, drawn like the original: a shaded right-pointing triangle that flips about its middle (line wait, 1B)
// at the start of the next line, and an open book after the last character (page wait, 1F).
let tick = 0;
function drawWaitIcon(cur) {
  if (!cur || !S.click || S.click === 'end') return;
  if (S.click === 'line') {
    const p = (tick % 40) / 40, k = p < 0.3 ? Math.abs(Math.cos(p / 0.3 * Math.PI)) : 1, h = Math.max(1, 16 * k);
    const x = cur.left + 1, cy = cur.nextY + 8.5;
    const grad = g.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); grad.addColorStop(0, '#dcdce8'); grad.addColorStop(0.55, '#d0d0dc'); grad.addColorStop(1, '#9090a0');
    g.beginPath(); g.moveTo(x, cy - h / 2); g.lineTo(x + 9, cy); g.lineTo(x, cy + h / 2); g.closePath();
    g.fillStyle = grad; g.fill(); g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1; g.stroke();
  } else if (S.click === 'page') {
    const x = Math.round(cur.x + 4), y = cur.y;
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x - 1, y - 1, 17, 16);
    for (const [px, flip] of [[x, 0], [x + 8, 1]]) {
      const grad = g.createLinearGradient(px, 0, px + 7, 0); grad.addColorStop(flip ? 1 : 0, '#e4e4ec'); grad.addColorStop(flip ? 0 : 1, '#8a8a98');
      g.fillStyle = grad; g.beginPath(); g.moveTo(px, y + 1); g.quadraticCurveTo(px + 3.5, y - 1 + (flip ? 2 : 0), px + 7, y + 1 + (flip ? -1 : 1));
      g.lineTo(px + 7, y + 12); g.quadraticCurveTo(px + 3.5, y + 10, px, y + 12); g.closePath(); g.fill();
    }
  }
}
function frame() {
  if (select.st.on) { select.draw(); requestAnimationFrame(frame); return; }
  // timers
  if (S.wait > 0) S.wait--;
  if (S.fade.step) { S.fade.a = Math.min(1, Math.max(0, S.fade.a + S.fade.step)); if (S.fade.a === 0 || S.fade.a === 1) S.fade.step = 0; }
  if (S.trans.run) { S.trans.t++; if (S.trans.t >= S.trans.frames) finishTrans(); }
  advanceOps();
  // picture layer
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  for (const p of new Set([S.pic, S.trans.run && S.next, ...[...S.layers.values()].filter(l => l.on)])) if (p) p.t++;
  const td = S.trans.run ? transDraw() : {};
  const base = td.swapped && S.next ? S.next : S.pic;
  if (base?.img) drawPic(base);
  if (td.blend != null && S.next?.img) { g.globalAlpha = td.blend; drawPic(S.next); g.globalAlpha = 1; }
  for (const l of [...S.layers.keys()].sort((x, y) => x - y)) { const p = S.layers.get(l); if (p.on) drawPic(p); }
  // The original shows pictures and movies darker and warmer than the decoded files (measured: ×0.73 R, ×0.69 G,
  // ×0.65 B on K01A_0010 c04; cause not found yet, possibly a vertex colour or a brightness setting).
  if (S.pic || S.next) { g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(186,176,166)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  if (S.fade.a) { g.fillStyle = `rgba(0,0,0,${S.fade.a})`; g.fillRect(0, 0, W, H); }
  if (td.over) { const c = td.rgb || [0, 0, 0]; g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${td.over})`; g.fillRect(0, 0, W, H); }

  tick++;
  drawWaitIcon(drawText());
  if (S.zap?.open) { // JUMP keyword on screen (provisional badge until the zap_mat sprites are placed)
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(6, 200, 66, 24); g.strokeStyle = '#e33'; g.lineWidth = 2; g.strokeRect(7, 201, 64, 22);
    g.fillStyle = '#f44'; g.font = 'bold 13px sans-serif'; g.fillText('JUMP', 18, 217);
    const n = game.nodeOf.get(S.zap.label); g.fillStyle = '#ddd'; g.font = '9px sans-serif'; if (n) g.fillText((KO_UI ? CHARACTERS[n.character].ko : CHARACTERS[n.character].ja), 76, 217);
  }
  if (S.choice) S.choice.options.forEach((o, i) => { g.fillStyle = 'rgba(20,20,24,.85)'; g.fillRect(60, 90 + i * 32, 360, 28); g.fillStyle = '#b3262d'; g.fillRect(60, 90 + i * 32, 3, 28); g.fillStyle = '#ddd'; g.font = '13px serif'; g.fillText(o.label, 72, 108 + i * 32); });
  if (q.has('debug')) status.textContent = `${vm.script.name} ${vm.flow.at(-1) || ''}`;
  requestAnimationFrame(frame);
}
window.__428 = { vm, S, game, select, startChar, doZap }; // for automated tests
requestAnimationFrame(frame);
