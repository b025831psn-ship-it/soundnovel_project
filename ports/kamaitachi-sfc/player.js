// 카마이타치의 밤 (SFC) player: the original 65c816 program runs in the VM (sfc-vm/) with the
// SPC700 + S-DSP (sound/), in a Worker. No ROM is asked for: the program image comes from the
// private port-data, each range checked by SHA-256. Played by touch like the Kamaitachi Advance
// player (issue #41): tap the story = next; tap a choice, bookmark or name-check item = choose it;
// tap a kana = type it; drag down = previous sentence; the corner button opens the other buttons.
//
// Data: ?data=URL (default ../../kamaitachi-sfc-kor/port-data/) with
//   program/manifest.json + program/NN.bin, sound/dsp-gauss.bin.
import { createAudioOut } from './sound/output.js';
import { PAD, DEFAULT_KEYS } from './sound/vm-sound.js';

const $ = (id) => document.getElementById(id);
const shell = $('shell'), stage = $('stage'), canvas = $('screen');
const params = new URLSearchParams(location.search);
const base = new URL(params.get('data') ?? '../../kamaitachi-sfc-kor/port-data/', location.href);
const store = {
  get(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};
const SRAM_KEY = 'kamaitachi-sfc.sram';
if (params.has('embed') || window.self !== window.top) document.documentElement.classList.add('embedded');

// Whole-number scale in device pixels, so every SFC pixel is the same size.
function fit() {
  const ratio = devicePixelRatio || 1;
  const steps = Math.floor(Math.min((stage.clientWidth * ratio) / 256, (stage.clientHeight * ratio) / 224));
  const scale = steps >= 1 ? steps / ratio : Math.min(stage.clientWidth / 256, stage.clientHeight / 224);
  canvas.style.width = `${256 * scale}px`;
  canvas.style.height = `${224 * scale}px`;
  $('scale').textContent = steps >= 1 ? `×${steps}` : '축소';
}
new ResizeObserver(fit).observe(stage);
fit();

const get = (p) => fetch(new URL(p, base)).then((r) => { if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`); return r; });
const bin = (p) => get(p).then((r) => r.arrayBuffer());
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const toBase64 = (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

function fail(error) {
  $('loading').hidden = true; $('start').hidden = true;
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

function startGame(data, out) {
  // The VM and APU run in a Worker; samples go from there straight to the worklet.
  const worker = new Worker(new URL('./sound/vm-worker.js', import.meta.url), { type: 'module' });
  const port = out.connectPort();
  const saved = store.get(SRAM_KEY);
  let sram = null;
  if (saved) { try { sram = fromBase64(saved).buffer; } catch { /* unreadable: start fresh */ } }
  worker.postMessage({ type: 'start', game: data.game, gauss: data.gauss, port, sram }, [data.game, data.gauss, port, ...(sram ? [sram] : [])]);
  const ctx = canvas.getContext('2d', { alpha: false });
  const glow = $('glow').getContext('2d');
  let picture = null, tick = 0;
  worker.onmessage = ({ data: m }) => {
    if (m.type === 'frame') picture = m.pixels;
    else if (m.type === 'status') {
      // The menu button sits over 終り on the name keyboards; it steps aside there.
      $('menu').classList.toggle('unavailable', m.keyboard); if (m.keyboard) { $('sheet').hidden = true; }
      window.kamaitachi && (window.kamaitachi.status = m);
    } else if (m.type === 'sram') store.set(SRAM_KEY, toBase64(new Uint8Array(m.bytes)));
    else if (m.type === 'error') { $('error').hidden = false; $('error').textContent = `게임 실행이 멈췄습니다.\n${m.message}`; }
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
  document.addEventListener('visibilitychange', () => worker.postMessage({ type: 'pause', on: document.hidden }));
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
    event.preventDefault(); out.resume();
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
  for (const el of sheet.querySelectorAll('button')) el.addEventListener('click', () => { worker.postMessage({ type: 'press', name: el.dataset.b }); toggleSheet(false); });

  let held = 0;
  const key = (down) => (event) => {
    const bit = PAD[DEFAULT_KEYS[event.code]];
    if (!bit || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault(); if (down) out.resume();
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

// Audio may only start inside a user gesture, so the game starts on the first tap or key.
load().then((data) => {
  $('loading').hidden = true;
  const start = $('start');
  start.hidden = false;
  let begun = false;
  const begin = async (event) => {
    if (begun || event?.code === 'KeyF') return; begun = true;
    start.hidden = true;
    removeEventListener('keydown', begin);
    const out = await createAudioOut();
    await out.resume();
    const worker = startGame(data, out);
    wireControls(worker, out);
    stage.classList.add('ready');
    window.kamaitachi = { worker, out };
  };
  start.addEventListener('click', begin);
  addEventListener('keydown', begin);
}, fail);
