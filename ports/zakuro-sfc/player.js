// 석류의 맛 (SFC) player: runs the original program in the 65c816 VM with its own PPU and APU,
// from private port-data (no ROM). Everything is played by touch, like the Kamaitachi Advance
// player (issue #41): on the logo and title a tap is START; on a choice, the slot disks, the file
// menu and the name board the tapped item is chosen; a tap away from every item does nothing;
// elsewhere a tap goes on (A). The corner button is B. Keys: Z/Enter confirm, X cancel.
//
// Data: ?data=URL (default ../../zakuro-sfc-kor/port-data/) with
//   sound/ipl.bin, sound/boot-dsp.bin, sound/dsp-gauss.bin, program/manifest.json + ranges.
import { createAudioOut } from './sound/output.js';
import { startGate } from '../../shared/player/start-gate.js';
import { ProgramImage, ZakuroVM, createApuLink } from './vm/browser.js';
import { InputQueue, PAD } from './input-queue.js';
import { itemAt, planFor, planForLateTap, screenOf } from './screens.js';

const $ = (id) => document.getElementById(id);
const shell = $('shell'), stage = $('stage'), canvas = $('screen');
const params = new URLSearchParams(location.search);
const base = new URL(params.get('data') ?? '../../zakuro-sfc-kor/port-data/', location.href);
const store = {
  get(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

const MASTER_HZ = 21477272.727, DSP_HZ = 32000, SLICE = 35791; // ~1/600 s of master clock
const LEAD = 0.12, BUDGET_MS = 30;
const SRAM_KEY = 'zakuro-sfc.sram';

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
const bin = (p) => get(p).then((r) => r.arrayBuffer()).then((b) => new Uint8Array(b));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const toBase64 = (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

function fail(error) {
  $('loading').hidden = true; $('start')?.remove();
  $('error').hidden = false; $('error').textContent = `원작 데이터를 불러오지 못했습니다.\n${error.message ?? error}`;
}

async function load() {
  const manifest = await get('program/manifest.json').then((r) => r.json());
  const [ipl, dsp, gauss, program] = await Promise.all([
    bin('sound/ipl.bin'), bin('sound/boot-dsp.bin'), bin('sound/dsp-gauss.bin'),
    ProgramImage.load(manifest, async (r) => {
      const b = await bin(`program/${r.file}`);
      if (hex(await crypto.subtle.digest('SHA-256', b)) !== r.sha256) throw new Error(`program/${r.file}: SHA-256 differs`);
      return b;
    }),
  ]);
  // ?replay (verification only): play the recorded native input first, then hand over to the player.
  const replay = params.has('replay')
    ? (await get('trace/input.tsv').then((r) => r.text())).trimEnd().split(/\r?\n/).slice(1).map((l) => parseInt(l.split('\t')[1], 16))
    : null;
  return { ipl, dsp, gauss: new Int16Array(gauss.buffer, gauss.byteOffset, 512), program, replay };
}

function startGame(data, out) {
  const { apu, link } = createApuLink({ ipl: data.ipl, gauss: data.gauss, powerOnDsp: data.dsp });
  let produced = 0;
  apu.dsp.onSample = (l, r) => { produced++; out.sample(l, r); };

  const input = new InputQueue();
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(256, 224);
  let saveTimer = 0, lastField = -1, shown = null;
  const vm = new ZakuroVM({
    program: data.program, sram: data.program.sram, masterLink: link, inputFrames: data.replay,
    onSramWrite() {
      if (data.replay) return; // a verification run never overwrites the player's save
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveSram, 800);
    },
  });
  function saveSram() { clearTimeout(saveTimer); store.set(SRAM_KEY, toBase64(vm.exportSram())); }
  addEventListener('pagehide', saveSram);
  const saved = data.replay ? null : store.get(SRAM_KEY);
  if (saved) { try { vm.importSram(fromBase64(saved)); } catch { /* size changed: start fresh */ } }
  // The VM renders only when asked (once per display frame, below), so catching up after a stall
  // costs CPU time only. Input is fed once per field from the field counter instead.
  vm.skipRender = true;
  const perField = () => {
    const field = vm.ppu.field;
    if (field === lastField) return;
    lastField = field;
    const mask = input.next(vm.getTouchState());
    if (mask || !data.replay || field + 1 >= data.replay.length) vm.setJoypad(mask);
  };
  vm.reset();

  // Paced by the audio buffer: run the VM until ~LEAD s of S-DSP output is queued ahead of playback.
  let startTime = out.context.currentTime;
  const glow = $('glow').getContext('2d');
  let tick = 0;
  const step = () => {
    const started = performance.now();
    let ahead = produced / DSP_HZ - (out.context.currentTime - startTime);
    // After a hidden tab or a stall, restart the clock instead of racing to catch up.
    if (ahead < -0.25) { startTime = out.context.currentTime - produced / DSP_HZ; ahead = 0; }
    try {
      while (ahead < LEAD && !vm.cpu.stopped && performance.now() - started < BUDGET_MS) {
        const goal = vm.bus.clock.master + SLICE;
        while (vm.bus.clock.master < goal && !vm.cpu.stopped) { vm.step(); perField(); }
        link.sync(vm.bus.clock.master);
        ahead = produced / DSP_HZ - (out.context.currentTime - startTime);
      }
    } catch (error) {
      out.flush(); out.setPaused(true);
      $('error').hidden = false; $('error').textContent = `게임 실행이 멈췄습니다.\n${error.message ?? error}`;
      return;
    }
    out.flush();
    // presentField re-renders only when the PPU state changed since the last render.
    const frame = vm.ppu.field >= 0 ? vm.ppu.presentField(vm.ppu.field, vm.bus.clock.master, true) : null;
    if (frame && (frame !== shown || vm.ppu.renderedRevision !== shown.revision)) {
      image.data.set(frame); ctx.putImageData(image, 0, 0);
      shown = frame; shown.revision = vm.ppu.renderedRevision;
      if (tick++ % 4 === 0) { glow.globalAlpha = 0.25; glow.drawImage(canvas, 0, 0, 32, 28); }
    }
    if (!vm.cpu.stopped) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  window.zakuro = { vm, input, out, saveSram };
  return { vm, input };
}

// Screen coordinates of a pointer event, in the game's 256x224 pixels.
function gamePoint(event) {
  const box = canvas.getBoundingClientRect();
  const turned = shell.classList.contains('filled') && innerHeight > innerWidth;
  const u = turned ? (event.clientY - box.top) / box.height : (event.clientX - box.left) / box.width;
  const v = turned ? (box.right - event.clientX) / box.width : (event.clientY - box.top) / box.height;
  return { x: u * 256, y: v * 224 };
}

function wireControls({ vm, input }, out) {
  const wram = vm.bus.wram;
  const screen = () => screenOf(wram, vm.getTouchState());
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    out.resume();
    const { x, y } = gamePoint(event);
    const touch = vm.getTouchState();
    const now = screenOf(wram, touch);
    if (now === 'choice') {
      const choice = touch.choice;
      const hit = choice.ready ? choice.rectangles.find((r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height) : null;
      if (hit) { input.clear(); input.choose(hit.index); } // away from every choice: nothing
      return;
    }
    if (now === 'start') { input.tap(PAD.START, 4); return; }
    if (now === 'story') { input.tap(PAD.A); return; }
    if (now === 'prompt') { input.clear(); input.tap(PAD.A, 6); return; } // shows the default name
    if (now === 'busy') { input.clear(); input.seek(planForLateTap(x, y, () => wram, () => vm.getTouchState())); return; }
    const item = itemAt(now, x, y, wram);
    if (!item) return; // away from every item: decides nothing
    input.clear();
    input.seek(planFor(item, now, () => wram, () => vm.getTouchState()));
  });
  const menu = $('menu');
  for (const type of ['pointerdown', 'pointerup', 'click']) menu.addEventListener(type, (event) => event.stopPropagation());
  menu.addEventListener('click', () => { navigator.vibrate?.(8); out.resume(); input.tap(PAD.B, 6); });
  // The button sits over 決定 on the name board; it steps aside there, as in the Kamaitachi player.
  // The board blinks through other values for a field now and then, so only settled screens count.
  setInterval(() => { const now = screen(); if (now !== 'busy') menu.classList.toggle('unavailable', now === 'names' || now === 'prompt'); }, 200);

  // Z/Enter confirm (START on the logo and title, where A does nothing), X cancels.
  const confirm = () => (screen() === 'start' ? PAD.START : PAD.A);
  const keys = { KeyZ: confirm, Enter: confirm, KeyX: PAD.B, KeyA: PAD.Y, KeyS: PAD.X, Space: PAD.START, ShiftRight: PAD.SELECT, KeyQ: PAD.L, KeyW: PAD.R,
    ArrowUp: PAD.UP, ArrowDown: PAD.DOWN, ArrowLeft: PAD.LEFT, ArrowRight: PAD.RIGHT };
  const down = new Map();
  addEventListener('keydown', (event) => {
    const key = keys[event.code];
    if (!key || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault(); out.resume();
    if (down.has(event.code)) return;
    const bit = typeof key === 'function' ? key() : key;
    down.set(event.code, bit); input.held |= bit;
  });
  const release = (code) => { const bit = down.get(code); down.delete(code); if (bit) input.held &= ~[...down.values()].reduce((m, b) => m & ~b, bit); };
  addEventListener('keyup', (event) => release(event.code));
  addEventListener('blur', () => { down.clear(); input.held = 0; });

  const mute = $('mute'), volume = $('volume');
  const gain = out.context.createGain();
  out.node.disconnect(); out.node.connect(gain).connect(out.context.destination);
  let muted = store.get('zakuro-sfc.muted', '0') === '1';
  volume.value = store.get('zakuro-sfc.volume', '80');
  const apply = () => {
    gain.gain.value = muted ? 0 : Number(volume.value) / 100;
    mute.setAttribute('aria-pressed', String(muted));
    mute.setAttribute('aria-label', muted ? '소리 켜기' : '소리 끄기');
    volume.style.setProperty('--fill', `${volume.value}%`);
  };
  mute.addEventListener('click', () => { muted = !muted; store.set('zakuro-sfc.muted', muted ? '1' : '0'); apply(); });
  volume.addEventListener('input', () => {
    muted = Number(volume.value) === 0;
    store.set('zakuro-sfc.volume', volume.value); store.set('zakuro-sfc.muted', muted ? '1' : '0'); apply();
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
  startGate(stage).then(async () => {
    try {
      const out = await createAudioOut();
      await out.resume();
      const game = startGame(data, out);
      wireControls(game, out);
      stage.classList.add('ready');
    } catch (error) { fail(error); } // no audio or a failed start: say so instead of leaving a blank page
  });
}, fail);
