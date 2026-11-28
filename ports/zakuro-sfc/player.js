// 석류의 맛 (SFC) player: runs the original program in the 65c816 VM with its own PPU and APU,
// from private port-data (no ROM). Everything is played by touch, like the Kamaitachi Advance
// player (issue #41): on the logo and title a tap is START; on a choice, the slot disks, the file
// menu and the name board the tapped item is chosen; a tap away from every item does nothing;
// elsewhere a tap goes on (A). The corner button is B. Keys: Z/Enter confirm, X cancel.
//
// Data: ?data=URL (default ../../zakuro-sfc-kor/port-data/) with
//   sound/ipl.bin, sound/boot-dsp.bin, sound/dsp-gauss.bin, program/manifest.json + ranges.
import { fitScale } from "../../shared/player/fit-scale.js";
import { createAudioOut } from './sound/output.js';
import { startGate } from '../../shared/player/start-gate.js';
import { ProgramImage, ZakuroVM, createApuLink } from './vm/browser.js';
import { InputQueue, PAD } from './input-queue.js';
import { GAME_ID, openSaves } from './save-store.js';
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
const bin = (p) => get(p).then((r) => r.arrayBuffer()).then((b) => new Uint8Array(b));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

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

function startGame(data, out, saves) {
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
  // Saves (save-store.js): the cartridge's three SRAM slots live in the shared save store, which syncs
  // them with the save server; a verification run (?replay) never touches them.
  function saveSram() { clearTimeout(saveTimer); if (saves) saves.takeSram(vm.exportSram()); }
  if (saves) {
    vm.importSram(saves.fillSram(vm.exportSram()));
    saves.store.subscribe((event) => {
      if (event.type === 'remote' && event.gameId === GAME_ID) saves.applyRemote(vm.bus.sram, event.slot);
    });
  }
  // Web only: the page being played is kept in the suspend slot when the page is left (and every
  // minute of play), so another device can carry on from the same moment.
  // The state is ~130 KB packed, so the minute timer writes it only after the scene has changed.
  let suspendedAt = -1, suspendedScene = -1;
  const suspend = async ({ always = true } = {}) => {
    if (!saves || vm.ppu.field === suspendedAt) return;
    const w = vm.bus.wram;
    if (w[0x1000] !== 0xf6) return; // not in the story yet (logo, title, slots, name board)
    const scene = w[0x1002] | (w[0x1003] << 8);
    if (!always && scene === suspendedScene) return;
    suspendedAt = vm.ppu.field; suspendedScene = scene;
    try { await saves.writeSuspend(vm.saveState(), { scene }); } catch { /* keep playing */ }
  };
  addEventListener('pagehide', () => { saveSram(); suspend(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { saveSram(); suspend(); } });
  setInterval(() => suspend({ always: false }), 60000);
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
  // Until the first tap the AudioContext is suspended (browser rule) and its clock stands still: the game
  // then runs by the wall clock, and the clock is re-anchored when the sound starts.
  const wallStart = performance.now() / 1000;
  const clock = () => (out.context.state === 'running' ? out.context.currentTime : performance.now() / 1000 - wallStart);
  let startTime = clock();
  out.context.addEventListener('statechange', () => { startTime = clock() - produced / DSP_HZ; });
  const glow = $('glow').getContext('2d');
  let tick = 0;
  const step = () => {
    const started = performance.now();
    let ahead = produced / DSP_HZ - (clock() - startTime);
    // After a hidden tab or a stall, restart the clock instead of racing to catch up.
    if (ahead < -0.25) { startTime = clock() - produced / DSP_HZ; ahead = 0; }
    try {
      while (ahead < LEAD && !vm.cpu.stopped && performance.now() - started < BUDGET_MS) {
        const goal = vm.bus.clock.master + SLICE;
        while (vm.bus.clock.master < goal && !vm.cpu.stopped) { vm.step(); perField(); }
        link.sync(vm.bus.clock.master);
        ahead = produced / DSP_HZ - (clock() - startTime);
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
  const resume = async () => {
    const state = await saves?.readSuspend();
    if (!state) return false;
    vm.loadState(state);
    vm.importSram(saves.fillSram(vm.exportSram()));
    input.clear(); lastField = -1; shown = null;
    return true;
  };
  window.zakuro = { vm, input, out, saveSram, suspend, resume };
  return { vm, input, resume };
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

// The game starts at once; audio may only start inside a user gesture, so it is silent until the first tap or key.
// The save dialog (shared/save/sync-ui.js) reaches the store and the suspend slot through this.
let game = null;
const openStore = (data) => (data.replay ? Promise.resolve(null) : openSaves().catch(() => null)).then((saves) => {
  if (saves) {
    globalThis.soundnovelSave = { store: saves.store, gameId: GAME_ID, boot: {
      get titleActive() { return !!game; },
      canContinue: () => saves.hasSuspend(),
      continueSuspended: () => game?.resume() ?? false,
      continueLabel: '마지막 장면에서 이어하기',
      continueNote: '게임 중 언제든 쓸 수 있습니다. 원작 저장 슬롯은 그대로 둡니다.',
    } };
    dispatchEvent(new Event('soundnovel-save-ready'));
  }
  return saves;
});

load().then(async (data) => {
  const saves = await openStore(data);
  let out = null;
  startGate(stage, { onPress: () => out?.resume() }).then(async () => {
    try {
      out = await createAudioOut();
      out.resume(); // silent until the first tap or key (startGate's onPress)
      game = startGame(data, out, saves);
      wireControls(game, out);
      stage.classList.add('ready');
    } catch (error) { fail(error); } // no audio or a failed start: say so instead of leaving a blank page
  });
}, fail);
