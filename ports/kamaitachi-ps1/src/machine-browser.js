// The browser around Machine (machine.js): fetches the user's data (the EXE's data sections,
// exe-data.bin from tools/extract-exe-data.mjs, and the disc's eight PAC files), runs one
// game frame per display frame at 60 Hz, and draws the GPU's display area on the canvas.
// It publishes the shell's contract (shell.js): runtime.input.pulse(name), menuMode().
// No sound yet (the sound bridge's silent mode): libsnd and the driver come next.
import { Machine } from "./machine.js";
import { unpack } from "./exe-data.js";

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

export async function startMachine({ canvas, dataRoot, onProgress = null, requestFrame = requestAnimationFrame, now = () => performance.now() }) {
  const base = new URL(dataRoot, location.href);
  let loaded = 0;
  const progress = (n) => { loaded += n; onProgress?.(loaded); };
  const exeData = unpack(await fetchBytes(new URL("exe-data.bin", base), progress));
  const pacs = {};
  await Promise.all(PACS.map(async (k) => { pacs[k] = await fetchBytes(new URL(`${k}.PAC`, base), progress); }));
  const machine = new Machine({ exeData, pacs, onError: (e) => console.error("[kamaitachi-ps1 machine]", e) });

  const ctx2d = canvas.getContext("2d", { alpha: false });
  ctx2d.imageSmoothingEnabled = false;
  let image = null;
  const draw = () => {
    const d = machine.gpu.displayWidth, h = machine.gpu.displayHeight;
    if (!image || image.width !== d || image.height !== h) { image = ctx2d.createImageData(d, h); canvas.width = d; canvas.height = h; }
    machine.gpu.display(image.data); ctx2d.putImageData(image, 0, 0);
  };
  const keys = new Map(); // button -> frames left
  const held = () => { let b = 0; for (const [k, n] of keys) { if (n > 0) b |= BUTTON[k]; } return b; };
  const runtime = {
    machine,
    input: { pulse(name) { const k = PULSE[name]; if (k) keys.set(k, HOLD); }, press(k) { keys.set(k, Infinity); }, release(k) { keys.delete(k); } },
    menuMode: () => "menu",
    get error() { return machine.error; },
  };
  const STEP = 1000 / 60;
  let last = now(), acc = 0, stopped = false;
  const loop = () => {
    if (stopped) return;
    const t = now(); acc = Math.min(acc + t - last, STEP * 4); last = t;
    let ran = false;
    while (acc >= STEP && !machine.error) {
      machine.frame(held());
      for (const [k, n] of keys) { if (n !== Infinity) { if (n <= 1) keys.delete(k); else keys.set(k, n - 1); } }
      acc -= STEP; ran = true;
    }
    if (ran) draw();
    requestFrame(loop);
  };
  draw(); requestFrame(loop);
  return { runtime, sound: { resume() {}, setVolume() {} }, stop() { stopped = true; } };
}
