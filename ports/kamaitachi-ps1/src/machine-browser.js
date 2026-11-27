// The browser around Machine (machine.js): fetches the user's data (the EXE's data sections,
// exe-data.bin from tools/extract-exe-data.mjs, and the disc's eight PAC files), runs one
// game frame per display frame at 60 Hz, and draws the GPU's display area on the canvas.
// It publishes the shell's contract (shell.js): runtime.input.pulse(name), menuMode().
// Sound: machine-sound.js renders each game frame's samples on the page; they play through
// sound/web/pcm-worklet.js once the shell's first tap resumes the AudioContext.
// Memory card: a virtual card in slot 1 (memory-card.js, the raw 128 KB image as a real card
// holds it), kept in localStorage after every write; runtime.exportCard() / importCard(bytes)
// hand the image to and from the shell (e.g. the save server).
import { Machine } from "./machine.js";
import { current } from "./touch.js";
import { machineSound } from "./machine-sound.js";
import { PcmQueue } from "../sound/web/pcm-queue.js";
import { unpack } from "./exe-data.js";
import { MemoryCard, CARD_BYTES } from "./memory-card.js";

const CARD_KEY = "kamaitachi-ps1.card1";
const toBase64 = (b) => { let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const fromBase64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
function loadCard() {
  try { const t = localStorage.getItem(CARD_KEY); if (t) { const b = fromBase64(t); if (b.length === CARD_BYTES) return b; } } catch {}
  return null;
}
function storeCard(bytes) { try { localStorage.setItem(CARD_KEY, toBase64(bytes)); } catch (e) { console.warn("[kamaitachi-ps1] memory card not stored", e); } }

const PACS = ["SCE", "VCE", "BGD", "SDW", "BIN", "MUS", "ANM", "VCP"];
// libpad bits (active high here; the machine inverts them into the pad report)
const BUTTON = { select: 1, start: 8, up: 16, right: 32, down: 64, left: 128, triangle: 4096, circle: 8192, cross: 16384, square: 32768 };
const PULSE = { confirm: "circle", cancel: "cross", menu: "triangle", up: "up", down: "down", left: "left", right: "right", start: "start" };
const HOLD = 4; // frames a pulse is held, as a quick press

async function fetchBytes(url, onProgress) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  // With Content-Encoding (the test server gzips) the length is the compressed size: grow the buffer as needed.
  let total = +r.headers.get("content-length") || 0;
  const reader = r.body?.getReader();
  if (!reader) return new Uint8Array(await r.arrayBuffer());
  let out = new Uint8Array(total || 1 << 20), n = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    if (n + value.length > out.length) { const grown = new Uint8Array(Math.max(out.length * 2, n + value.length)); grown.set(out.subarray(0, n)); out = grown; }
    out.set(value, n); n += value.length; onProgress?.(value.length);
  }
  return n === out.length ? out : out.subarray(0, n);
}

// The audio output: { ctx, node, gain, send(block) }. An AudioWorklet where the page has one, else a
// ScriptProcessorNode (plain http pages have no AudioWorklet); null without Web Audio (no sound).
async function audioOut() {
  try {
    const ctx = new AudioContext({ sampleRate: 44100, latencyHint: "interactive" });
    const gain = new GainNode(ctx, { gain: 1 });
    let node, send;
    if (ctx.audioWorklet) {
      await ctx.audioWorklet.addModule(new URL("../sound/web/pcm-worklet.js", import.meta.url));
      node = new AudioWorkletNode(ctx, "pcm-player", { numberOfInputs: 0, outputChannelCount: [2] });
      send = (b) => node.port.postMessage(b, [b.buffer]);
    } else {
      const queue = new PcmQueue();
      node = ctx.createScriptProcessor(1024, 0, 2);
      node.onaudioprocess = (e) => { const l = e.outputBuffer.getChannelData(0), r = e.outputBuffer.getChannelData(1); l.fill(0); r.fill(0); queue.pull(l, r); };
      send = (b) => queue.push(b);
    }
    node.connect(gain).connect(ctx.destination);
    return { ctx, node, gain, send };
  } catch (e) { console.warn("[kamaitachi-ps1 machine] no audio output", e); return null; }
}

export async function startMachine({ canvas, dataRoot, audio = true, onProgress = null, requestFrame = requestAnimationFrame, now = () => performance.now() }) {
  const base = new URL(dataRoot, location.href);
  let loaded = 0;
  const progress = (n) => { loaded += n; onProgress?.(loaded); };
  const exeData = unpack(await fetchBytes(new URL("exe-data.bin", base), progress));
  const pacs = {};
  await Promise.all(PACS.map(async (k) => { pacs[k] = await fetchBytes(new URL(`${k}.PAC`, base), progress); }));
  const snd = machineSound({ exeData, pacs, onRumble: (r) => { if (r.on) navigator.vibrate?.(50); } });
  const out = audio ? await audioOut() : null;
  const card = new MemoryCard(loadCard());
  const machine = new Machine({ exeData, pacs, sound: snd.bridge, card, onError: (e) => console.error("[kamaitachi-ps1 machine]", e) });
  machine.onCardWrite = (c) => { storeCard(c.bytes); runtime.onCardChange?.(); };

  const ctx2d = canvas.getContext("2d", { alpha: false });
  ctx2d.imageSmoothingEnabled = false;
  let image = null;
  const draw = () => {
    const d = machine.gpu.displayWidth, h = machine.gpu.displayHeight;
    if (!image || image.width !== d || image.height !== h) { image = ctx2d.createImageData(d, h); canvas.width = d; canvas.height = h; }
    machine.gpu.display(image.data); ctx2d.putImageData(image, 0, 0);
  };
  const keys = new Map(); // button -> frames left
  // moveCursor: presses of the direction that moves the original's cursor, 1 frame down, 1 up each
  let steps = []; // [{ key, left, phase }], run in order
  const held = () => {
    let b = 0; for (const [k, n] of keys) { if (n > 0) b |= BUTTON[k]; }
    const s = steps[0];
    if (s) { if (s.phase < 1) b |= BUTTON[s.key]; if (++s.phase === 2) { s.phase = 0; if (--s.left <= 0) steps.shift(); } }
    return b;
  };
  const menuNow = () => current(machine.touch);
  const runtime = {
    machine, soundModule: snd.mod,
    input: { pulse(name) { const k = PULSE[name]; if (k) keys.set(k, HOLD); }, press(k) { keys.set(k, Infinity); }, release(k) { keys.delete(k); } },
    // the corner button: × inside the in-game menu (0x800795e2 is set while it is open), the
    // menu (triangle) while the game allows it (0x8007929f), otherwise nothing
    menuMode: () => (machine.read(0x800795e2, 1) ? "back" : machine.read(0x8007929f, 1) ? "menu" : "none"),
    touchRows: () => menuNow()?.rows ?? [],
    cursorIndex: () => menuNow()?.index() ?? -1,
    moveCursor(n) {
      const t = menuNow(); if (!t || !n) return;
      const button = t.press?.[t.index() + n];
      if (button) { keys.set(button, HOLD); return; }
      const move = (k, d) => (d ? [{ key: k[d < 0 ? 0 : 1], left: Math.abs(d), phase: 0 }] : []);
      if (!t.grid) { steps = move(t.keys, n); return; }
      // a grid (index = row · cols + column): the rows first, then the columns
      const { cols, across } = t.grid, from = t.index(), to = from + n;
      steps = [...move(t.keys, Math.floor(to / cols) - Math.floor(from / cols)), ...move(across, (to % cols) - (from % cols))];
    },
    // the memory card in slot 1: a copy of the raw 128 KB image; importCard swaps the card as
    // if a different one were inserted (the library reports a new card on its next request)
    exportCard: () => card.bytes.slice(),
    importCard(bytes) {
      bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      if (bytes.length !== CARD_BYTES) throw new Error(`memory card image: ${bytes.length} bytes, expected ${CARD_BYTES}`);
      card.bytes.set(bytes); machine.cardSwapped(); storeCard(card.bytes);
    },
    onCardChange: null, // set by the shell: called after the game writes the card
    get error() { return machine.error; },
  };
  const STEP = 1000 / 60;
  let last = now(), acc = 0, stopped = false, hold = 0, played = 0;
  // One frame of sound. The driver's own waits come back as extra frames: the game is held for as long.
  const soundFrame = () => {
    const blocks = snd.render(); hold += blocks.length - 1;
    if (out?.ctx.state === "running") for (const b of blocks) { out.send(b); played++; }
  };
  const loop = () => {
    if (stopped) return;
    const t = now(); acc = Math.min(acc + t - last, STEP * 4); last = t;
    let ran = false;
    while (acc >= STEP && !machine.error) {
      if (hold > 0) { hold--; acc -= STEP; continue; } // the sound driver is waiting (its samples are already queued)
      machine.frame(held()); soundFrame();
      for (const [k, n] of keys) { if (n !== Infinity) { if (n <= 1) keys.delete(k); else keys.set(k, n - 1); } }
      acc -= STEP; ran = true;
    }
    if (ran) draw();
    requestFrame(loop);
  };
  draw(); requestFrame(loop);
  const sound = {
    context: out?.ctx ?? null, node: out?.node ?? null,
    get framesPlayed() { return played; },
    resume: () => (out && out.ctx.state !== "running" ? out.ctx.resume() : Promise.resolve()),
    suspend: () => out?.ctx.suspend(),
    setVolume: (v) => { if (out) out.gain.gain.value = Math.max(0, Math.min(1, +v || 0)); },
  };
  return { runtime, sound, stop() { stopped = true; out?.ctx.close(); } };
}
