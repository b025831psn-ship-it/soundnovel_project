// 428 PSP web player prototype: runs the original bytecode (engine/vm.js) and draws a 480x272 frame.
// Display-op semantics are provisional (see OPCODES.md); timings are in 60 fps frames.
// Assets are not in this repository: ?assets=<url> points at a folder produced from the user's disc
// (to.sns, to.flo, ids.json, png/<cpk>/*.png, snd/<cpk>/*.ogg, font/font_0_50.*).
import { decryptSns, parseSns } from '../engine/sns.js';
import { VM } from '../engine/vm.js';

const q = new URLSearchParams(location.search);
const BASE = (q.get('assets') || '../assets/').replace(/\/?$/, '/');
const START = q.get('label') || 'K01A_0010_01_RESTART';
const FAST = q.has('fast'); // tests: skip waits and auto-advance
const cv = document.getElementById('screen'); const g = cv.getContext('2d');
const status = document.getElementById('status');
const W = 480, H = 272;

function fit() { const s = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H))); cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; }
addEventListener('resize', fit); fit();

const bytes = async p => new Uint8Array(await (await fetch(BASE + p)).arrayBuffer());
const json = async p => (await fetch(BASE + p)).json();
const img = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error(src)); i.src = src; });

const [rawSns, ids, fontMeta, fontImg] = await Promise.all([bytes('to.sns'), json('ids.json'), json('font/font_0_50.json'), img(BASE + 'font/font_0_50.png')]);
const sns = parseSns(rawSns[0x10] === 0x43 ? decryptSns(rawSns) : rawSns);
const vm = new VM(sns);
{ const init = sns.scripts[0]; vm.script = init; vm.pc = init.codeStart; while (!vm.halted) vm.step(); vm.halted = false; }
const slot = sns.scripts.findIndex(s => s.labels.has(START));
vm.goto(slot, START);

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
const audio = new Map(); let bgm = null;
function sound(id, vol, kind) {
  const n = resName(id); if (!n) return null;
  const a = new Audio(`${BASE}snd/${cpkOf()}/${n.replace(/\.(csb|at3)$/, '.ogg')}`);
  a.loop = !!(id & 0x8000) || kind === 'bgm'; a.volume = Math.min(1, vol / 100);
  a.play().catch(() => {}); return a;
}

// ---- screen state
const S = { pic: null, next: null, trans: { type: 0, frames: 0, t: 0, run: false }, fade: { a: 0, step: 0 },
  win: 0, lines: [[]], ruby: null, wait: 0, click: null, choice: null, speed: 2, typing: 0 };

function advanceOps() {
  // Run VM ops until something needs time or input.
  for (let guard = 0; guard < 5000; guard++) {
    if (S.wait > 0 || S.click || S.choice || (S.trans.run && S.trans.block)) return;
    const e = vm.step(); if (!e) continue;
    if (e.type === 'text') { putText(e.text); continue; }
    if (e.type === 'choice') { S.choice = e; return; }
    if (e.type === 'sceneEnd' || e.type === 'end') { status.textContent = '장면 끝'; S.click = 'end'; return; }
    if (e.type !== 'op') continue;
    const a = e.arg || [];
    const u16 = o => (a[o] << 8) | a[o + 1], u32 = o => ((a[o] << 24) | (a[o + 1] << 16) | (a[o + 2] << 8) | a[o + 3]) >>> 0;
    switch (e.op) {
      case 0x2d: S.wait = FAST ? 0 : u32(0); break;                                  // wait frames
      case 0x44: S.next = picture(u16(0)); break;                                    // picture to show at next transition
      case 0x63: S.trans = { type: a[0], frames: a.length >= 5 ? u16(3) : 0, t: 0, run: false }; break;
      case 0x64: if (S.next) { S.trans.run = true; S.trans.t = 0; if (!S.trans.frames || FAST) finishTrans(); } break;
      case 0x65: if (S.trans.run) S.trans.block = true; break;                       // wait for transition
      case 0x03: case 0x05: { const n = Math.max(1, u32(0)); S.fade.step = 1 / n; if (FAST) S.fade.a = 1; break; } // darken over n frames
      case 0x07: case 0x09: { const n = Math.max(1, u32(0)); S.fade.step = -1 / n; if (FAST) S.fade.a = 0; break; } // lighten
      case 0x04: case 0x08: S.fade.a = 0; S.fade.step = 0; break;
      case 0x06: case 0x0a: S.fade.a = 1; S.fade.step = 0; break;
      case 0x23: if (S.win !== a[0]) S.lines = [[]]; S.win = a[0]; break;           // text block style (2 window, 3 narration)
      case 0x25: break;                                                              // end of text block
      case 0x1e: S.lines.push([]); break;                                            // newline
      case 0x1b: if (!FAST) S.click = 'line'; break;                                 // wait for input
      case 0x1f: if (!FAST) S.click = 'page'; else S.lines = [[]]; break;            // wait, then clear page
      case 0x1c: S.ruby = { reading: '', base: null }; break;
      case 0x1d: S.ruby.base = ''; break;
      case 0x7a: case 0x91: { const id = u16(0); audio.get(id)?.pause(); audio.set(id, sound(id, u16(2), 'se')); break; }
      case 0x7b: { const id = u16(0); audio.get(id)?.pause(); audio.delete(id); break; }
      case 0x92: bgm?.pause(); bgm = sound(u16(0), u16(2), 'bgm'); break;
      case 0x93: bgm?.pause(); bgm = null; break;
    }
  }
}
function putText(t) {
  const line = S.lines[S.lines.length - 1];
  if (S.ruby) {
    if (S.ruby.base === null) { S.ruby.reading += t; return; }
    line.push({ text: t, ruby: S.ruby.reading }); S.ruby = null; return;
  }
  line.push({ text: t });
}
function finishTrans() { S.pic = S.next; S.next = null; S.trans.run = false; S.trans.block = false; }

function click() {
  if (S.choice) return;
  if (S.click === 'page') S.lines = [[]];
  if (S.click !== 'end') S.click = null;
}
cv.addEventListener('pointerdown', ev => {
  if (S.choice) {
    const r = cv.getBoundingClientRect(); const y = (ev.clientY - r.top) * H / r.height;
    const i = Math.floor((y - 90) / 32); if (i >= 0 && i < S.choice.options.length) { vm.choose(i); S.choice = null; }
    return;
  }
  click();
});
addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') click(); });

// ---- drawing
// Glyph header (font units): [adv, em, bx, by, bw, bh] horizontal, then full-width and vertical sets.
// Screen px per unit = bitmap height / em (provisional until compared with the original screen).
function advance(ch, scale = 1) { const m = fontMeta[ch.codePointAt(0)]; return m ? m[4] * m[3] / m[5] * scale : 10 * scale; }
function drawGlyph(ch, x, y, scale = 1) {
  const m = fontMeta[ch.codePointAt(0)]; if (!m) return advance(ch, scale);
  g.drawImage(fontImg, m[0], m[1], m[2], m[3], x, y, m[2] * scale, m[3] * scale); return advance(ch, scale);
}
function drawText() {
  if (!S.win) return;
  const top = S.win === 3 ? 100 : 176, left = 24;
  let row = 0;
  S.lines.forEach(line => {
    let x = left; let y = top + row * 24;
    for (const seg of line) {
      if (x + [...seg.text].reduce((w, c) => w + advance(c), 0) > W - left && seg.ruby) { row++; x = left; y = top + row * 24; }
      const x0 = x; for (const ch of seg.text) { if (x + advance(ch) > W - left) { row++; x = left; y = top + row * 24; } g.globalAlpha = 0.6; g.filter = 'brightness(0)'; drawGlyph(ch, x + 1, y + 1); g.filter = 'none'; g.globalAlpha = 1; x += drawGlyph(ch, x, y); }
      if (seg.ruby) { const w = x - x0, n = [...seg.ruby].length, step = Math.min(10, w / n); let rx = x0 + (w - step * n) / 2; for (const ch of seg.ruby) { drawGlyph(ch, rx, y - 9, 0.45); rx += step; } }
    }
    row++;
  });
}
function frame() {
  // timers
  if (S.wait > 0) S.wait--;
  if (S.fade.step) { S.fade.a = Math.min(1, Math.max(0, S.fade.a + S.fade.step)); if (S.fade.a === 0 || S.fade.a === 1) S.fade.step = 0; }
  if (S.trans.run) { S.trans.t++; if (S.trans.t >= S.trans.frames) finishTrans(); }
  advanceOps();
  // picture layer
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (S.pic?.img) g.drawImage(S.pic.img, 0, 0, W, H);
  if (S.trans.run && S.next?.img) { g.globalAlpha = S.trans.t / S.trans.frames; g.drawImage(S.next.img, 0, 0, W, H); g.globalAlpha = 1; }
  if (S.fade.a) { g.fillStyle = `rgba(0,0,0,${S.fade.a * 0.6})`; g.fillRect(0, 0, W, H); }
  if (S.win === 2) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 166, W, 106); }
  drawText();
  if (S.choice) S.choice.options.forEach((o, i) => { g.fillStyle = 'rgba(20,20,24,.85)'; g.fillRect(60, 90 + i * 32, 360, 28); g.fillStyle = '#b3262d'; g.fillRect(60, 90 + i * 32, 3, 28); g.fillStyle = '#ddd'; g.font = '13px serif'; g.fillText(o.label, 72, 108 + i * 32); });
  if (q.has('debug')) status.textContent = `${vm.script.name} ${vm.flow.at(-1) || ''}`;
  requestAnimationFrame(frame);
}
window.__428 = { vm, S }; // for automated tests
requestAnimationFrame(frame);
