// 카마이타치의 밤 (SFC) player: the original 65c816 program runs in the VM (sfc-vm/) with the
// SPC700 + S-DSP (sound/), in a Worker. No ROM is asked for: the program image comes from the
// private port-data, each range checked by SHA-256. Played by touch like the Kamaitachi Advance
// player (issue #41): tap the story = next; tap a choice, bookmark or name-check item = choose it;
// tap a kana = type it; drag down = previous sentence; the corner button opens the other buttons.
//
// Data: ?data=URL (default ../../kamaitachi-sfc-kor/port-data/) with
//   program/manifest.json + program/NN.bin, sound/dsp-gauss.bin.
import { fitScale } from "../../shared/player/fit-scale.js";
import { createAudioOut } from './sound/output.js';
import { startGate } from '../../shared/player/start-gate.js';
import { PAD, DEFAULT_KEYS } from './sound/vm-sound.js';
import { openSaves, GAME_ID, BLOCK_SLOTS, fromBase64 } from './save/sfc-save.js';
import { mountSyncUi } from '../../shared/save/sync-ui.js';

const $ = (id) => document.getElementById(id);
const shell = $('shell'), stage = $('stage'), canvas = $('screen');
const params = new URLSearchParams(location.search);
const base = new URL(params.get('data') ?? '../../kamaitachi-sfc-kor/port-data/', location.href);
const store = {
  get(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};
if (params.has('embed') || window.self !== window.top) document.documentElement.classList.add('embedded');

// Whole-number scale in device pixels, so every SFC pixel is the same size.
function fit() {
  const ratio = devicePixelRatio || 1;
  const { scale, whole, steps } = fitScale(stage.clientWidth, stage.clientHeight, 256, 224, ratio);
  canvas.style.width = `${256 * scale}px`;
  canvas.style.height = `${224 * scale}px`;
  $('scale').textContent = whole ? `×${steps}` : '맞춤';
}
new ResizeObserver(fit).observe(stage);
fit();

const get = (p) => fetch(new URL(p, base)).then((r) => { if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r; });
const bin = (p) => get(p).then((r) => r.arrayBuffer());
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

function fail(error) {
  $('loading').hidden = true; $('start')?.remove();
  $('error').hidden = false; $('error').textContent = `원작 데이터를 불러오지 못했습니다.\n${error.message ?? error}`;
}

async function load() {
  const manifest = await get('program/manifest.json').then((r) => r.json());
  const image = new Uint8Array(manifest.size);
  let done = 0;
  const [, gauss] = await Promise.all([
    Promise.all(manifest.ranges.map(async (r) => {
      const b = await bin(`program/${r.file}`);
      if (b.byteLength !== r.length || hex(await crypto.subtle.digest('SHA-256', b)) !== r.sha256) throw new Error(`program/${r.file}: 내용이 다릅니다`);
      image.set(new Uint8Array(b), r.offset);
      $('loading-text').textContent = `원작 데이터를 불러오는 중 ${Math.round((++done / manifest.ranges.length) * 100)}%`;
    })),
    bin('sound/dsp-gauss.bin'),
  ]);
  if (hex(await crypto.subtle.digest('SHA-256', image)) !== manifest.sha256) throw new Error('프로그램 이미지가 기준 판본과 다릅니다');
  return { game: image.buffer, gauss };
}

// Saves (docs/save/README.md): the four SRAM blocks (working copy + bookmarks 1-3) and the web-only
// suspend slot live in the shared SaveStore (IndexedDB) and sync with the save server under /sync.
// Bookmarks the game writes go up block by block; bookmarks from another device are loaded when
// the game starts (after the first sync) or at the next Reset. The suspend slot is the whole VM
// state, written when the page is hidden and every 90 s of play, and loaded from the save dialog.
const SUSPEND_LIMIT = 190000; // base64 characters: the server takes 256 KB per slot after encryption
const saves = { api: null, ui: null, last: null, remoteBooks: false, played: false, worker: null, waits: new Map(), next: 0 };
const savesReady = openSaves().then(async (api) => {
  saves.api = api;
  globalThis.soundnovelSave = { store: api.store, gameId: GAME_ID };
  api.store.subscribe((ev) => { if (ev.type === 'conflict') queueMicrotask(() => { if (api.settleEmptyConflicts().length) saves.ui?.paint(); }); });
  api.store.subscribe((ev) => {
    if (ev.type !== 'remote' || ev.gameId !== GAME_ID) return;
    if (BLOCK_SLOTS.includes(ev.slot) && saves.worker) { saves.remoteBooks = true; saves.ui?.paint(); }
    // Another device's suspend: offer to carry on from it (docs/save/README.md, 충돌).
    if (ev.slot === 'suspend' && api.store.read(GAME_ID, 'suspend')?.deviceId !== api.store.deviceId) offerSuspend();
  });
  saves.ui = await mountSyncUi({ api: { store: api.store, gameId: GAME_ID, boot: suspendBoot } });
  await saves.ui.initial;
}).catch((e) => { console.warn('saves unavailable', e); });

function offerSuspend() {
  if (!saves.worker || !saves.ui) { saves.offer = true; return; }
  saves.offer = false; saves.ui.open();
}
const ask = (msg) => new Promise((resolve) => {
  const id = ++saves.next; saves.waits.set(id, resolve); saves.worker.postMessage({ ...msg, id });
});
async function writeSuspend({ now = false, force = false } = {}) {
  if (!saves.api || !saves.worker || !(saves.played || force)) return;
  saves.played = false;
  const r = await ask({ type: 'snapshot' });
  if (!r.data) return;
  if (Math.ceil(r.data.length / 3) * 4 > SUSPEND_LIMIT) { console.warn('suspend too large', r.data.length); return; }
  saves.api.writeSuspend(r.data, { frame: window.kamaitachi?.status?.frame ?? 0 });
  if (now) saves.ui?.sync();
}
const suspendBoot = {
  // Carrying on is possible on any screen (the whole VM state is restored), so always "at the title".
  titleActive: true,
  // Quick save (disk button): the suspend slot is written the moment it is pressed.
  saveNow: () => writeSuspend({ force: true }),
  continueLabel: '중단한 곳에서 이어하기',
  canContinue: () => !!(saves.worker && saves.api?.readSuspend()),
  continueNote: () => {
    const env = saves.api.store.read(GAME_ID, 'suspend');
    const when = new Date(env.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `${when}, ${env.deviceId === saves.api.store.deviceId ? '이 기기' : '다른 기기'}에서 저장`;
  },
  continueSuspended: async () => {
    const p = saves.api.readSuspend(); if (!p) return false;
    const sram = saves.remoteBooks ? saves.api.sram() : null;
    if (sram) { saves.last = sram.slice(); saves.remoteBooks = false; }
    const r = await ask({ type: 'restore', data: fromBase64(p.state).buffer, sram: sram?.buffer });
    return !r.error;
  },
  notice: () => (saves.remoteBooks ? '다른 기기에서 저장한 책갈피를 받았습니다. 게임 메뉴의 리셋을 누르면 반영됩니다.' : ''),
};
// Report button: where the script is (file offset.bit of the script reader, $00:9A1D with D = $0400)
// and the frame; the screen itself goes along as the screenshot. The SFC text has no glyph table
// yet, so the lines are not sent as text.
globalThis.soundnovelReport = () => {
  const st = window.kamaitachi?.status; if (!st) return {};
  const at = st.script;
  return { scene: at > 0 ? `script 0x${(at >> 3).toString(16).toUpperCase()}.${at & 7}` : null, text: '', frame: st.frame, mode: st.title };
};

function resetWithBooks(worker) {
  // Bookmarks that came from another device go in at the Reset (the game reads SRAM at power-on).
  let sram = null;
  if (saves.remoteBooks && saves.api) { sram = saves.api.sram(); saves.last = sram.slice(); saves.remoteBooks = false; saves.ui?.paint(); }
  worker.postMessage({ type: 'reset', ...(sram ? { sram: sram.buffer } : {}) }, sram ? [sram.buffer] : []);
}

function startGame(data, out) {
  // The VM and APU run in a Worker; samples go from there straight to the worklet.
  const worker = new Worker(new URL('./sound/vm-worker.js', import.meta.url), { type: 'module' });
  const port = out.connectPort();
  const sram = saves.api ? saves.api.sram() : null;
  saves.last = sram?.slice() ?? null;
  worker.postMessage({ type: 'start', game: data.game, gauss: data.gauss, port, sram: sram?.buffer }, [data.game, data.gauss, port, ...(sram ? [sram.buffer] : [])]);
  saves.worker = worker;
  const ctx = canvas.getContext('2d', { alpha: false });
  const glow = $('glow').getContext('2d');
  let picture = null, tick = 0;
  worker.onmessage = ({ data: m }) => {
    if (m.type === 'frame') picture = m.pixels;
    else if (m.type === 'status') {
      // The menu button sits over 終り on the name keyboards; it steps aside there.
      $('menu').classList.toggle('unavailable', m.keyboard); if (m.keyboard) { $('sheet').hidden = true; }
      window.kamaitachi && (window.kamaitachi.status = m);
    } else if (m.type === 'sram') {
      const bytes = new Uint8Array(m.bytes);
      if (saves.api) { try { saves.api.writeSram(bytes, saves.last); } catch (e) { console.warn('bookmark save failed', e); } }
      saves.last = bytes;
    } else if (m.type === 'snapshot' || m.type === 'restored') {
      const done = saves.waits.get(m.id); saves.waits.delete(m.id); done?.(m);
    } else if (m.type === 'error') { $('error').hidden = false; $('error').textContent = `게임 실행이 멈췄습니다.\n${m.message}`; }
  };
  worker.onerror = (e) => { $('error').hidden = false; $('error').textContent = `게임 실행이 멈췄습니다.\n${e.message}`; };
  const show = () => {
    if (picture) {
      ctx.putImageData(new ImageData(picture, 256, 224), 0, 0); picture = null;
      if (tick++ % 4 === 0) { glow.globalAlpha = 0.25; glow.drawImage(canvas, 0, 0, 32, 28); }
    }
    requestAnimationFrame(show);
  };
  requestAnimationFrame(show);
  // A hidden tab stops the game and the sound together.
  document.addEventListener('visibilitychange', () => {
    worker.postMessage({ type: 'pause', on: document.hidden });
    if (document.hidden) writeSuspend({ now: true });
  });
  addEventListener('pagehide', () => writeSuspend({ now: true }));
  setInterval(() => { if (!document.hidden) writeSuspend(); }, 90000);
  return worker;
}

function wireControls(worker, out) {
  const sheet = $('sheet'), menu = $('menu');
  const toggleSheet = (open) => { sheet.hidden = !open; menu.setAttribute('aria-expanded', String(open)); };
  // Game pixels of a pointer event; held upright in the window-filling full screen the picture is
  // drawn a quarter turn round, so the axes swap.
  const point = (event) => {
    const box = canvas.getBoundingClientRect();
    const turned = shell.classList.contains('filled') && innerHeight > innerWidth;
    const u = turned ? (event.clientY - box.top) / box.height : (event.clientX - box.left) / box.width;
    const v = turned ? (box.right - event.clientX) / box.width : (event.clientY - box.top) / box.height;
    return { x: u * 256, y: v * 224 };
  };
  // A tap acts on release; a vertical drag of 24+ game pixels scrolls instead (kanji list on the
  // name keyboards, or back a sentence when dragged down on the story).
  let down = null;
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault(); out.resume(); saves.played = true;
    if (!sheet.hidden) { toggleSheet(false); down = null; return; }
    down = { ...point(event), id: event.pointerId };
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!down || down.id !== event.pointerId) return;
    const p = point(event), dy = p.y - down.y, start = down; down = null;
    if (Math.abs(dy) >= 24 && Math.abs(dy) > Math.abs(p.x - start.x)) worker.postMessage({ type: 'scroll', dir: dy < 0 ? 1 : -1 });
    else worker.postMessage({ type: 'tap', x: Math.floor(start.x), y: Math.floor(start.y) });
  });
  canvas.addEventListener('pointercancel', () => { down = null; });
  let wheelAt = 0;
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const now = performance.now(); if (now < wheelAt || !event.deltaY) return; wheelAt = now + 250;
    worker.postMessage({ type: 'scroll', dir: event.deltaY > 0 ? 1 : -1 });
  }, { passive: false });
  for (const type of ['pointerdown', 'pointerup']) { menu.addEventListener(type, (e) => e.stopPropagation()); sheet.addEventListener(type, (e) => e.stopPropagation()); }
  menu.addEventListener('click', () => { navigator.vibrate?.(8); out.resume(); toggleSheet(sheet.hidden); });
  addEventListener('keydown', (event) => {
    if (event.code !== 'KeyS' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || menu.classList.contains('unavailable')) return;
    event.preventDefault(); toggleSheet(sheet.hidden); if (!sheet.hidden) sheet.querySelector('button').focus();
  });
  for (const el of sheet.querySelectorAll('button')) el.addEventListener('click', () => { saves.played = true; if (el.dataset.action === 'reset') resetWithBooks(worker); else worker.postMessage({ type: 'press', name: el.dataset.b }); toggleSheet(false); });

  let held = 0;
  const key = (down) => (event) => {
    const bit = PAD[DEFAULT_KEYS[event.code]];
    if (!bit || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault(); if (down) { out.resume(); saves.played = true; }
    held = down ? held | bit : held & ~bit; worker.postMessage({ type: 'buttons', mask: held });
  };
  addEventListener('keydown', key(true)); addEventListener('keyup', key(false));
  addEventListener('blur', () => { held = 0; worker.postMessage({ type: 'buttons', mask: 0 }); });

  const mute = $('mute'), volume = $('volume');
  const gain = out.context.createGain();
  out.node.disconnect(); out.node.connect(gain).connect(out.context.destination);
  let muted = store.get('kamaitachi-sfc.muted', '0') === '1';
  volume.value = store.get('kamaitachi-sfc.volume', '80');
  const apply = () => {
    gain.gain.value = muted ? 0 : Number(volume.value) / 100;
    mute.setAttribute('aria-pressed', String(muted));
    mute.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기');
    volume.style.setProperty('--fill', `${volume.value}%`);
  };
  mute.addEventListener('click', () => { muted = !muted; store.set('kamaitachi-sfc.muted', muted ? '1' : '0'); apply(); });
  volume.addEventListener('input', () => {
    muted = Number(volume.value) === 0;
    store.set('kamaitachi-sfc.volume', volume.value); store.set('kamaitachi-sfc.muted', muted ? '1' : '0'); apply();
  });
  apply();
}

// Full screen; phones also turn to landscape where the browser allows it. Without the browser's
// full screen (iPhone Safari), the page fills the window and, held upright, is drawn a quarter turn round.
const fullscreen = $('fullscreen');
const touch = matchMedia('(pointer: coarse)').matches;
let filled = false;
const immersive = () => shell.classList.toggle('immersive', filled || Boolean(document.fullscreenElement));
const setFilled = (on) => { filled = on; shell.classList.toggle('filled', on); document.documentElement.classList.toggle('filled', on); showFullscreen(); };
const showFullscreen = () => {
  const on = Boolean(document.fullscreenElement) || filled;
  fullscreen.setAttribute('aria-pressed', String(on));
  fullscreen.setAttribute('aria-label', on ? '전체 화면 끝내기 (F)' : '전체 화면 (F)');
  immersive(); fit();
};
const toggleFullscreen = async () => {
  if (filled) return setFilled(false);
  if (document.fullscreenElement) return document.exitFullscreen();
  if (document.fullscreenEnabled && shell.requestFullscreen) {
    try { await shell.requestFullscreen({ navigationUI: 'hide' }); if (touch) await screen.orientation?.lock?.('landscape').catch(() => {}); return; } catch { /* fall back */ }
  }
  if (touch) setFilled(true);
};
if (!document.fullscreenEnabled && !touch) fullscreen.hidden = true;
fullscreen.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) screen.orientation?.unlock?.(); showFullscreen(); });
addEventListener('keydown', (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'KeyF') toggleFullscreen();
  if (event.code === 'Escape' && filled) setFilled(false);
});
let idleTimer = 0;
const wake = () => { shell.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => shell.classList.add('idle'), 2500); };
addEventListener('pointermove', wake); addEventListener('pointerdown', wake); wake();

// The game starts at once; audio may only start inside a user gesture, so it is silent until the first tap or key.
Promise.all([load(), savesReady]).then(([data]) => {
  let out = null;
  startGate(stage, { onPress: () => out?.resume() }).then(async () => {
    out = await createAudioOut();
    out.resume(); // silent until the first tap or key (startGate's onPress)
    const worker = startGame(data, out);
    wireControls(worker, out);
    stage.classList.add('ready');
    window.kamaitachi = { worker, out, saves, writeSuspend };
    if (saves.offer) offerSuspend();
  });
}, fail);
