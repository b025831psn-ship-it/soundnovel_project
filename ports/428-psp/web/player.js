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

// Whole-number scale in device pixels (so a phone narrower than 480 CSS px still gets a crisp 1x/2x of the original).
function fit() { const d = devicePixelRatio || 1, k = Math.max(1, Math.floor(Math.min(Math.min(innerWidth, screen.width) / W, Math.min(innerHeight, screen.height) / H) * d)); cv.style.width = W * k / d + 'px'; cv.style.height = H * k / d + 'px'; }
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
const S = { pic: null, next: null, trans: { type: 0, frames: 0, t: 0, run: false }, fade: { a: 0, step: 0 },
  win: 0, lines: [[]], center: false, ruby: null, wait: 0, click: null, choice: null, speed: 2, typing: 0 };

function advanceOps() {
  // Run VM ops until something needs time or input.
  for (let guard = 0; guard < 5000; guard++) {
    if (S.movieWait && !S.movieWait.ended && !FAST) return; S.movieWait = null;
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
      case 0x44: { const e = picture(u16(0)); S.next = e && { id: u16(0), get img() { return e.img; }, keys: [], t: 0 }; break; } // picture to show at next transition
      case 0x66: case 0x67: key(e.op, a); break;                                     // property keyframe (camera rect = property 8)
      case 0x69: for (const p of [S.pic, S.next]) if (p && p.id === u16(3)) { p.keys = []; } break; // release the picture's keyframes
      case 0x63: S.trans = { type: a[0], frames: a.length >= 5 ? u16(3) : 0, t: 0, run: false }; break;
      case 0x64: if (S.next) { S.trans.run = true; S.trans.t = 0; if (!S.trans.frames || FAST) finishTrans(); } break;
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
function key(op, a) {
  const id = (a[3] << 8) | a[4], n = a[5], v = []; for (let i = 0; i < n; i++) v.push((a[6 + i * 2] << 8) | a[7 + i * 2]);
  if (a[0] !== 8 || n !== 6) return;
  const p = [S.next, S.pic].find(p => p && p.id === id); if (!p) return;
  const k = { t: v[0], r: [v[1] * 464 / 1280, v[2] * 256 / 720, v[3] * 464 / 1280, v[4] * 256 / 720], ease: v[5] };
  if (op === 0x66) { p.keys = [k]; p.t = 0; } else { p.keys.push(k); p.keys.sort((x, y) => x.t - y.t); }
}
const EASE = [t => t, t => t * t, t => 1 - (1 - t) * (1 - t), t => t * t * (3 - 2 * t)];
function rectOf(p) {
  const k = p.keys; if (!k?.length) return null;
  let i = 0; while (i < k.length - 1 && k[i + 1].t <= p.t) i++;
  if (i === k.length - 1) return k[i].r;
  const a = k[i], b = k[i + 1], u = (EASE[b.ease] || EASE[0])((p.t - a.t) / Math.max(1, b.t - a.t));
  return a.r.map((x, j) => x + (b.r[j] - x) * u);
}
function drawPic(p) {
  const r = rectOf(p); const im = p.img; if (!im) return;
  if (r) g.drawImage(im, r[0], r[1], r[2] - r[0], r[3] - r[1], 0, 0, W, H); else g.drawImage(im, 0, 0, W, H);
}
function finishTrans() { S.pic = S.next; S.next = null; S.trans.run = false; S.trans.block = false; }

function click() {
  if (S.choice) return;
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
  if (S.choice) {
    const r = cv.getBoundingClientRect(); const y = (ev.clientY - r.top) * H / r.height;
    const i = Math.floor((y - 90) / 32); if (i >= 0 && i < S.choice.options.length) { vm.choose(i); S.choice = null; }
    return;
  }
  click();
});
addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') click(); if (ev.key === 'Escape') setMenu(menu.hidden); });
addEventListener('fullscreenchange', fit);

// ---- drawing
// Glyph header (font units): [adv, em, bx, by, bw, bh] horizontal, then full-width and vertical sets.
// Units are 1280-wide-screen pixels: screen px = unit x 480/1280 (matches the original's line widths).
const CELL = 50 * 0.375 + 0.7; // full-width cell (glyph advance 50)
function advance(ch, scale = 1) {
  if (ch === '…' || ch === '―') return CELL * scale;
  const m = fontMeta[ch.codePointAt(0)]; return m ? (m[4] * 0.375 + 0.7) * scale : 10 * scale;
}
// The font has no ellipsis or dash; the original draws them as cells (ops 43, 2B).
function drawSpecial(ch, x, y, scale) {
  if (ch === '…') { for (let i = 0; i < 3; i++) g.fillRect(Math.round(x + (3 + i * 6) * scale), Math.round(y + 9 * scale), Math.max(1, 2 * scale), Math.max(1, 2 * scale)); }
  else g.fillRect(Math.round(x), Math.round(y + 9 * scale), Math.ceil(CELL * scale), Math.max(1, Math.round(1.5 * scale)));
}
function drawGlyph(ch, x, y, scale = 1) {
  if (ch === '…' || ch === '―') { g.fillStyle = g.filter === 'none' ? '#e8e8ee' : '#000'; drawSpecial(ch, x, y, scale); return advance(ch, scale); }
  const m = fontMeta[ch.codePointAt(0)]; if (!m) return advance(ch, scale);
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
      for (const ch of chars) { if (row.w + advance(ch) > RIGHT - LEFT) open(row.center); row.items.push({ ch, x: row.w }); row.w += advance(ch); }
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
  // timers
  if (S.wait > 0) S.wait--;
  if (S.fade.step) { S.fade.a = Math.min(1, Math.max(0, S.fade.a + S.fade.step)); if (S.fade.a === 0 || S.fade.a === 1) S.fade.step = 0; }
  if (S.trans.run) { S.trans.t++; if (S.trans.t >= S.trans.frames) finishTrans(); }
  advanceOps();
  // picture layer
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  for (const p of [S.pic, S.trans.run && S.next]) if (p && p.keys?.length) p.t++;
  if (S.pic?.img) drawPic(S.pic);
  if (S.trans.run && S.next?.img) { g.globalAlpha = S.trans.t / S.trans.frames; drawPic(S.next); g.globalAlpha = 1; }
  // The original shows pictures and movies darker and warmer than the decoded files (measured: ×0.73 R, ×0.69 G,
  // ×0.65 B on K01A_0010 c04; cause not found yet, possibly a vertex colour or a brightness setting).
  if (S.pic || S.next) { g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(186,176,166)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  if (S.fade.a) { g.fillStyle = `rgba(0,0,0,${S.fade.a})`; g.fillRect(0, 0, W, H); }

  tick++;
  drawWaitIcon(drawText());
  if (S.choice) S.choice.options.forEach((o, i) => { g.fillStyle = 'rgba(20,20,24,.85)'; g.fillRect(60, 90 + i * 32, 360, 28); g.fillStyle = '#b3262d'; g.fillRect(60, 90 + i * 32, 3, 28); g.fillStyle = '#ddd'; g.font = '13px serif'; g.fillText(o.label, 72, 108 + i * 32); });
  if (q.has('debug')) status.textContent = `${vm.script.name} ${vm.flow.at(-1) || ''}`;
  requestAnimationFrame(frame);
}
window.__428 = { vm, S }; // for automated tests
requestAnimationFrame(frame);
