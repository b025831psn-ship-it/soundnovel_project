// The browser around Machine (machine.js): fetches the user's data (the EXE's data sections,
// exe-data.bin from tools/extract-exe-data.mjs, and the disc's eight PAC files), runs one
// game frame per display frame at 60 Hz, and draws the GPU's display area on the canvas.
// It publishes the shell's contract (shell.js): runtime.input.pulse(name), menuMode().
// Sound: machine-sound.js renders each game frame's samples on the page; they play through
// sound/web/pcm-worklet.js once the shell's first tap resumes the AudioContext.
// Memory card: a virtual card in slot 1 (memory-card.js, the raw 128 KB image as a real card
// holds it), kept in localStorage after every write; runtime.exportCard() / importCard(bytes)
// hand the image to and from the shell (e.g. the save server).
import { applyEdits } from "./ko-text.js";
import { patchScePac } from "./ko.js";
import { Machine } from "./machine.js";
import { current } from "./touch.js";
import { machineSound } from "./machine-sound.js";
import { rangeSource, xaFileName } from "./xa.js";
import { PcmQueue } from "../sound/web/pcm-queue.js";
import { unpack } from "./exe-data.js";
import { MemoryCard, CARD_BYTES } from "./memory-card.js";

const CARD_KEY = "kamaitachi-ps1.card1";
const toBase64 = (b) => { let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };
const fromBase64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
// The Korean build keeps its own card: a save holds a position inside the script text, and the
// Korean text has other lengths.
let cardKey = CARD_KEY;
function loadCard() {
  try { const t = localStorage.getItem(cardKey); if (t) { const b = fromBase64(t); if (b.length === CARD_BYTES) return b; } } catch {}
  return null;
}
function storeCard(bytes) { try { localStorage.setItem(cardKey, toBase64(bytes)); } catch (e) { console.warn("[kamaitachi-ps1] memory card not stored", e); } }

const PACS = ["SCE", "VCE", "BGD", "SDW", "BIN", "MUS", "ANM", "VCP"];
// libpad bits (active high here; the machine inverts them into the pad report)
const BUTTON = { select: 1, start: 8, up: 16, right: 32, down: 64, left: 128, triangle: 4096, circle: 8192, cross: 16384, square: 32768 };
const PULSE = { confirm: "circle", cancel: "cross", menu: "triangle", up: "up", down: "down", left: "left", right: "right", start: "start", backlog: "start" };
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

export async function startMachine({ canvas, dataRoot, audio = true, onProgress = null, requestFrame = requestAnimationFrame, now = () => performance.now(), timer = requestFrame === requestAnimationFrame, gate = null, lang = "ko", displayShift = 4 }) {
  const base = new URL(dataRoot, location.href);
  let loaded = 0;
  const progress = (n) => { loaded += n; onProgress?.(loaded); };
  const exeData = unpack(await fetchBytes(new URL("exe-data.bin", base), progress));
  const pacs = {};
  await Promise.all(PACS.map(async (k) => { pacs[k] = await fetchBytes(new URL(`${k}.PAC`, base), progress); }));
  // Korean (the default): ko/ko-script.json and ko/ko-font.bin next to the PAC files
  // (tools/ko/build-ko.py). Without them, or with lang "ja", the original Japanese runs.
  let ko = null;
  if (lang !== "ja") {
    try {
      const [script, font] = await Promise.all([fetch(new URL("ko/ko-script.json", base)).then((r) => { if (!r.ok) throw new Error(`ko-script.json ${r.status}`); return r.json(); }), fetchBytes(new URL("ko/ko-font.bin", base), progress)]);
      ko = { script, font };
      // The owner's dialogue edits (the admin page, admin/): ko/text-edits.json, read fresh on every start
      // and laid over the translation, so a saved edit shows after a reload with no rebuild.
      try {
        const r = await fetch(new URL(`ko/text-edits.json?v=${Date.now()}`, base), { cache: "no-store" });
        if (r.ok) {
          const edits = await r.json(), plain = JSON.stringify(script.resources), { applied, skipped } = applyEdits(script, edits);
          if (skipped.length) console.warn("[kamaitachi-ps1 machine] dialogue edits left out", skipped);
          if (applied.length) { try { patchScePac(pacs.SCE, script); } catch (e) { console.warn("[kamaitachi-ps1 machine] dialogue edits do not fit, running without them", e); script.resources = JSON.parse(plain); } }
        }
      } catch (e) { console.warn("[kamaitachi-ps1 machine] no dialogue edits", e); }
    } catch (e) { console.warn("[kamaitachi-ps1 machine] no Korean data, running in Japanese", e); }
  }
  cardKey = ko ? `${CARD_KEY}.ko` : CARD_KEY;
  // CD-XA (the gold bookmark's voice drama): fetched by range only when it plays
  const xaSources = new Map(), xaSource = (c) => { if (!xaSources.has(c)) xaSources.set(c, rangeSource(new URL(xaFileName(c), base).href)); return xaSources.get(c); };
  const snd = machineSound({ exeData, pacs, xaSource, onRumble: (r) => { if (r.on) navigator.vibrate?.(50); } });
  const out = audio ? await audioOut() : null;
  // the shared start screen: the console is switched on by that press, so the boot sound and the opening movie play with sound
  if (gate) await gate(() => { if (out && out.ctx.state !== "running") out.ctx.resume(); });
  const card = new MemoryCard(loadCard());
  // The STR movies, converted to <NAME>.mp4 next to the PACs (tools/convert-str.sh), shown over the
  // screen while the game waits for them. Before the first tap or key the browser only lets a
  // muted video start; the sound comes on with the next tap or key.
  let volume = 1;
  const movie = (name) => {
    const v = document.createElement("video"), h = { ended: false, video: v, stop() { if (h.ended) return; h.ended = true; v.pause(); v.remove(); } };
    v.className = "movie"; v.playsInline = true; v.preload = "auto"; v.volume = volume; v.src = new URL(`${name}.mp4`, base).href;
    v.onended = () => h.stop(); v.onerror = () => { console.warn("[kamaitachi-ps1 movie]", name, "not available"); h.stop(); };
    canvas.parentElement.appendChild(v);
    const unmute = () => { v.muted = false; };
    v.play().catch(() => { v.muted = true; v.play().catch(() => h.stop()); addEventListener("pointerdown", unmute, { once: true }); addEventListener("keydown", unmute, { once: true }); });
    return h;
  };
  const machine = new Machine({ exeData, pacs, sound: snd.bridge, card, xa: snd.xa, movie, ko, onError: (e) => console.error("[kamaitachi-ps1 machine]", e) });
  machine.onCardWrite = (c) => { storeCard(c.bytes); runtime.onCardChange?.(); };

  const ctx2d = canvas.getContext("2d", { alpha: false });
  ctx2d.imageSmoothingEnabled = false;
  let image = null;
  const draw = () => {
    const d = machine.gpu.displayWidth, h = machine.gpu.displayHeight;
    if (!image || image.width !== d || image.height !== h) { image = ctx2d.createImageData(d, h); canvas.width = d; canvas.height = h; }
    machine.gpu.display(image.data);
    // The game shows its pictures 12 lines down and 4 lines short of the bottom (its own display
    // area). The web player shows the frame displayShift lines higher, 8 and 8 (태우 2026-11-28):
    // the top lines, which are black, are dropped and the bottom is filled with black. The GPU and
    // VRAM stay the original's; ?display=original shows the frame as it is.
    if (displayShift > 0 && displayShift < h) { const px = image.data, n = displayShift * d * 4; px.copyWithin(0, n); px.fill(0, px.length - n); for (let i = px.length - n + 3; i < px.length; i += 4) px[i] = 255; }
    ctx2d.putImageData(image, 0, 0);
  };
  const keys = new Map(); // button -> frames left
  // moveCursor: presses of the direction that moves the original's cursor, 1 frame down, 1 up each
  let steps = []; // [{ key, left, phase, down, up }], run in order: `left` presses of `down` frames, `up` frames apart (key null: a pause)
  // seek: a tap on another row. The direction is held until the original's own cursor has moved
  // (at most 6 frames, then let go for 3), again until it stands on the row; only then, in a plain
  // list, is circle pressed. Nothing is pressed blind, so a frame the game did not read the pad in
  // cannot turn the tap into a choice of the old row.
  let seek = null; // { to, pick, down, up, last, age }
  const seekKey = () => {
    const t = menuNow(); if (!t || ++seek.age > 180) { seek = null; return 0; }
    const at = t.index();
    if (seek.up > 0) { seek.up--; seek.last = at; return 0; }
    if (at === seek.to) { const pick = seek.pick; seek = null; if (pick) steps = [presses("circle", 1, HOLD, 1)]; return 0; }
    if (seek.down > 0 && (at !== seek.last || seek.down >= 6)) { seek.down = 0; seek.up = 3; seek.last = at; return 0; }
    let key;
    if (t.grid) { const { cols, across } = t.grid, dr = Math.floor(seek.to / cols) - Math.floor(at / cols), dc = (seek.to % cols) - (at % cols); key = dr ? t.keys[dr < 0 ? 0 : 1] : across[dc < 0 ? 0 : 1]; }
    else key = t.keys[seek.to < at ? 0 : 1];
    seek.down++; seek.last = at; return BUTTON[key];
  };
  // The unattended demo (auto mode, 0x800792c6) ends at a button and the title comes back. On the
  // console that takes a disc load, so the button is up again by then; here the title is there in
  // a few frames and would read the same press as its own (and start the game). A button pressed
  // during auto mode therefore reaches the game for one frame only, and not again until it is let go.
  let muted = 0;
  const held = () => {
    let b = pressed();
    const fresh = b & ~muted;
    if (machine.read(0x800792c6, 1) === 1) { muted |= b; return fresh; }
    muted &= b;
    return b & ~muted;
  };
  const pressed = () => {
    let b = 0; for (const [k, n] of keys) { if (n > 0) b |= BUTTON[k]; }
    if (seek) return b | seekKey();
    const s = steps[0];
    if (s) { if (s.phase < s.down && s.key) b |= BUTTON[s.key]; if (++s.phase === s.down + s.up) { s.phase = 0; if (--s.left <= 0) steps.shift(); } }
    return b;
  };
  const presses = (key, left, down = 1, up = 1) => ({ key, left, phase: 0, down, up });
  const menuNow = () => current(machine.touch);
  const runtime = {
    machine, soundModule: snd.mod, lang: ko ? "ko" : "ja",
    input: { pulse(name) { const k = PULSE[name]; if (k) keys.set(k, HOLD); }, press(k) { keys.set(k, Infinity); }, release(k) { keys.delete(k); } },
    // the corner button: × inside the in-game menu (0x800795e2 is set while it is open) and in the
    // backlog (0x800792a0), the menu (triangle) while the game allows it (0x8007929f), otherwise nothing
    menuMode: () => (machine.read(0x800795e2, 1) || machine.read(0x800792a0, 1) ? "back" : machine.read(0x8007929f, 1) ? "menu" : "none"),
    // the backlog (START at a page marker, 0x80024fd0) can open: the text waits for a key, outside
    // the menu and the backlog, with at least two history points, not in resources 0x19 / 0x1f
    canBacklog: () => !!machine.read(0x8007929e, 1) && !machine.read(0x800792a0, 1) && !machine.read(0x800795e2, 1)
      && ((machine.read(0x800792b4, 2) - 2) << 16) >= 0 && ![0x19, 0x1f].includes(machine.read(0x8007929c, 2)),
    // true while a tap's presses are still running: shell.js ignores row taps then, so a double tap
    // cannot carry its second ○ over to the next screen (e.g. the yes of a yes/no box)
    busy: () => steps.length > 0 || Boolean(seek),
    touchRows: () => menuNow()?.rows ?? [],
    cursorIndex: () => menuNow()?.index() ?? -1,
    // A tap on another row: the cursor goes there with the original's own pad presses, in frames
    // the player does not see (tick), and, in a plain list, the row is chosen at once (태우
    // 2026-11-28: a tap picks the row, with no cursor walking there).
    // In a grid (the flowchart) the tap only moves the cursor; a second tap chooses.
    moveCursor(n) {
      const t = menuNow(); if (!t || !n) return;
      const button = t.press?.[t.index() + n];
      if (button) { keys.set(button, HOLD); return; }
      steps = []; seek = { to: t.index() + n, pick: !t.grid, down: 0, up: 0, last: t.index(), age: 0 };
    },
    // Dragging (the flowchart, the backlog: screens whose rows include direction buttons): what a
    // drag may press, and n presses of a direction queued behind the ones still running.
    dragKeys: () => Object.values(menuNow()?.press ?? {}).filter((k) => ["up", "down", "left", "right"].includes(k)),
    pressSteps(key, n = 1) { if (BUTTON[key] && steps.length < 12) steps.push(presses(key, n, 2, 2)); },
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
  // The game's frames follow the clock, not the display: a timer runs them too, so the sound keeps
  // coming when the display refreshes slowly (a phone in low power mode draws 30 times a second,
  // a hidden tab not at all). The picture is drawn on the display's own frames.
  let dirty = false;
  const tick = () => {
    if (stopped) return;
    const t = now(); acc = Math.min(acc + t - last, STEP * 8); last = t;
    while (acc >= STEP && !machine.error) {
      if (hold > 0) { hold--; acc -= STEP; continue; } // the sound driver is waiting (its samples are already queued)
      // a tap on another row: the frames in which the original's cursor walks there are run at once,
      // unseen and unheard (no picture between them, no sound frame), so the row is simply chosen
      for (let n = 0; seek && n < 400 && !machine.error; n++) machine.frame(held());
      machine.frame(held()); soundFrame();
      for (const [k, n] of keys) { if (n !== Infinity) { if (n <= 1) keys.delete(k); else keys.set(k, n - 1); } }
      acc -= STEP; dirty = true;
    }
  };
  const loop = () => {
    if (stopped) return;
    tick();
    if (dirty) { dirty = false; draw(); }
    requestFrame(loop);
  };
  draw(); requestFrame(loop);
  const pump = timer ? setInterval(tick, 8) : 0;
  const sound = {
    context: out?.ctx ?? null, node: out?.node ?? null,
    get framesPlayed() { return played; },
    resume: () => (out && out.ctx.state !== "running" ? out.ctx.resume() : Promise.resolve()),
    suspend: () => out?.ctx.suspend(),
    setVolume: (v) => { volume = Math.max(0, Math.min(1, +v || 0)); if (out) out.gain.gain.value = volume; for (const el of canvas.parentElement.querySelectorAll("video.movie")) el.volume = volume; },
  };
  return { runtime, sound, stop() { stopped = true; clearInterval(pump); out?.ctx.close(); } };
}
