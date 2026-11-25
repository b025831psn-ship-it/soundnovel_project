// Portrait reading for phones held upright (the smartphone editions' layout): the current picture,
// cropped to fill the tall screen and slightly softened, with the page text and the choices laid over
// it in large type. The game itself keeps running on the hidden 240x160 screen; this layer only reads
// window.kamaitachi (the picture before text, the page's glyphs, the choice lists) and answers taps
// the way the screen does. The game's own screens (title, bookmarks, menu) show the original screen.
const $ = (id) => document.getElementById(id);
const shell = $("shell");
const stage = $("stage");
const reader = $("reader");
const picture = $("picture");
const words = $("words");
const choiceList = $("choices");
const store = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};
const embedded = window.parent !== window;
const touch = matchMedia("(pointer: coarse)").matches;
const asked = new URLSearchParams(location.search).get("reader");
let enabled = asked ? asked === "1" : store.get("kamaitachi.reader", touch ? "1" : "0") === "1";

// The picture: drawn three times over with whole pixels, then scaled by the browser with smoothing,
// so edges soften a little without the blur of stretching 240x160 straight to a phone.
const UP = 3;
const source = document.createElement("canvas");
const sourceCtx = source.getContext("2d");
const pictureCtx = picture.getContext("2d");
function sizeTo(height) {
  if (source.height === height) return;
  source.width = 240; source.height = height;
  picture.width = 240 * UP; picture.height = height * UP;
  pictureCtx.imageSmoothingEnabled = false;
}

// Pictures extended for an upright screen (outpainting pilot, kamaitachi-gba-kor assets/outpaint-pilot):
// 240x360 with the cartridge's 240x160 at rows 100-259. The middle is always the live screen (tone,
// fades and silhouettes as the game draws them); the margins follow the picture's tone by the ratio of
// the live screen to the untoned picture.
const EXTENDED_TOP = 100, EXTENDED_HEIGHT = 360;
const extended = new Map(); // tiles signature -> { pixels, raw }
const signature = (tiles) => { let h = tiles.length; for (let i = 0; i < tiles.length; i += 61) h = (h * 31 + tiles[i]) | 0; return h; };
// The picture without the game's tone: its pixels and channel sums.
function untoned(tiles, palette) {
  const sums = new Float64Array(3);
  const pixels = new Uint8ClampedArray(240 * 160 * 3);
  const colors = [];
  for (let i = 0; i < 256; i++) { const c = palette[2 * i] | (palette[2 * i + 1] << 8); colors.push([c & 31, (c >> 5) & 31, (c >> 10) & 31].map((v) => (v << 3) | (v >> 2))); }
  for (let y = 0; y < 160; y++) for (let x = 0; x < 240; x++) {
    const c = colors[tiles[((y >> 3) * 30 + (x >> 3)) * 64 + (y & 7) * 8 + (x & 7)]];
    pixels.set(c, 3 * (y * 240 + x));
    sums[0] += c[0]; sums[1] += c[1]; sums[2] += c[2];
  }
  return { sums, pixels };
}
const outpaint = new URLSearchParams(location.search).get("outpaint") !== "0";
async function loadExtended(game) {
  if (!outpaint) return;
  let ids = [];
  try { ids = await (await fetch("/art/outpaint/index.json")).json(); } catch { return; }
  // Pictures the game shows first load first (title, bookmarks, characters, then the story in play
  // order), a few at a time, so the title never waits behind the whole list.
  const rank = (id) => { const at = FIRST_SHOWN.indexOf(id); return at < 0 ? FIRST_SHOWN.length + id : at; };
  const queue = ids.slice().sort((a, b) => rank(a) - rank(b));
  const worker = async () => { for (let id; (id = queue.shift()) !== undefined;) await loadOne(id); };
  await Promise.all(Array.from({ length: 4 }, worker));
  async function loadOne(id) {
    try {
      const name = String(id).padStart(3, "0");
      const [tiles, palette] = await Promise.all([game.assets.bin(`bg/${name}.bin`), game.assets.bin(`palette/${name}.bin`)]);
      const image = new Image();
      image.src = `/art/outpaint/${name}.png`;
      await image.decode();
      const canvas = Object.assign(document.createElement("canvas"), { width: 240, height: EXTENDED_HEIGHT });
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      // The model's full-resolution picture for the margins, when served (portrait-hd, 720x1080).
      const hd = new Image();
      hd.src = `/art/outpaint/hd/${name}.webp`;
      const sharp = await hd.decode().then(() => hd, () => null);
      extended.set(signature(tiles), { pixels: ctx.getImageData(0, 0, 240, EXTENDED_HEIGHT).data, raw: untoned(tiles, palette), hd: sharp });
    } catch { /* not served: the picture is cut from the original only */ }
  }
}
const FIRST_SHOWN = [259, 256, 257, 258, 222, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297,
  200, 74, 1, 2, 3, 209, 9, 12, 6, 17, 11, 7, 23, 22, 24, 8, 10];
let extendedLoading = null;
// Per-picture choices made in the editor (editor.html, saved as /art/portrait-edits.json on the test
// server, 태우 2026-11-25): { "<picture id>": { mode, shift, crop } }
//   mode  "ai" (the extended picture; the default when there is one), "fill" (the original cut to fill
//         the screen) or "frame" (the original whole, over a blurred enlargement of itself)
//   shift GBA rows the picture moves (+ down) in "ai" and "frame"
//   crop  the left column of the cut in "fill" (otherwise placed automatically)
let edits = {};
let editVersion = 0;
fetch("/art/portrait-edits.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : {}))
  .then((value) => { edits = value && typeof value === "object" ? value : {}; editVersion++; }).catch(() => {});
let currentId = null;
const editFor = (id) => (id === null || id === undefined ? null : edits[id] ?? null);
function pictureId(game) {
  const scene = game.vm?.scene;
  if (!scene || scene.current === undefined || scene.current === null) return null;
  return scene.resolve(scene.current).image;
}
// The original whole, over a blurred, darkened enlargement of itself.
function paintFrame(ctx, base, width, height) {
  const scale = width / 240;
  middleCtx.putImageData(new ImageData(new Uint8ClampedArray(base), 240, 160), 0, 0);
  const cover = height / 160;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.filter = `blur(${Math.round(8 * scale)}px) brightness(.55)`;
  ctx.drawImage(middle, (width - 240 * cover) / 2, 0, 240 * cover, height);
  ctx.filter = "none";
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(middle, 0, EXTENDED_TOP * scale, width, 160 * scale);
  ctx.restore();
  const shift = Math.round((editFor(currentId)?.shift ?? 0) * scale);
  if (shift) shiftPicture(ctx, width, height, shift, scale);
}
const extendedFor = (screen) => screen.background?.tiles && extended.get(signature(screen.background.tiles));
function compose(screen, base) {
  const mode = editFor(currentId)?.mode;
  if (mode === "frame") { sizeTo(EXTENDED_HEIGHT); paintFrame(pictureCtx, base, picture.width, picture.height); return EXTENDED_TOP; }
  const entry = mode === "fill" ? null : extendedFor(screen);
  if (!entry) { sizeTo(160); sourceCtx.putImageData(new ImageData(new Uint8ClampedArray(base), 240, 160), 0, 0); }
  else {
    sizeTo(EXTENDED_HEIGHT);
    if (entry.hd) { paintSharp(pictureCtx, entry, base, picture.width, picture.height, screen.silhouette); return EXTENDED_TOP; }
    sourceCtx.putImageData(new ImageData(extendedPixels(entry, base), 240, EXTENDED_HEIGHT), 0, 0);
  }
  pictureCtx.drawImage(source, 0, 0, picture.width, picture.height);
  return entry ? EXTENDED_TOP : 0;
}
// Sharp margins: the model's own full-resolution picture, toned like the live screen (per-channel gain),
// with the cartridge's pixels in the middle as they are (whole-pixel scaling), their outer 14 rows
// fading into the picture.
const middle = Object.assign(document.createElement("canvas"), { width: 240, height: 160 });
const middleCtx = middle.getContext("2d");
// Whether a silhouette runs into the picture's top or bottom edge (cut by the frame in the original).
function silhouetteCut(layer) {
  if (!layer?.vram) return { top: false, bottom: false };
  const count = (y) => {
    let n = 0;
    for (let x = 0; x < 240; x++) {
      const byte = layer.vram[((y >> 3) * 30 + (x >> 3)) * 32 + (y & 7) * 4 + ((x & 7) >> 1)];
      if ((x & 1 ? byte >> 4 : byte & 15) !== 0) n++;
    }
    return n;
  };
  return { top: count(0) > 3, bottom: count(159) > 3 };
}
const CUT_MS = 400;
const cutLevels = new Map(); // canvas context -> { top, bottom, time }
let cutEasing = false; // set while a margin is still moving toward framed or open
function cutLevel(ctx, cut) {
  const now = performance.now();
  const state = cutLevels.get(ctx) ?? { top: cut.top ? 1 : 0, bottom: cut.bottom ? 1 : 0, time: now };
  const step = Math.min(1, (now - state.time) / CUT_MS);
  const ease = (value, wanted) => (wanted ? Math.min(1, value + step) : Math.max(0, value - step));
  state.top = ease(state.top, cut.top);
  state.bottom = ease(state.bottom, cut.bottom);
  state.time = now;
  cutLevels.set(ctx, state);
  if (state.top !== (cut.top ? 1 : 0) || state.bottom !== (cut.bottom ? 1 : 0)) cutEasing = true;
  return state;
}
function paintSharp(ctx, entry, base, width, height, layer) {
  const live = [0, 0, 0];
  for (let i = 0; i < base.length; i += 4) { live[0] += base[i]; live[1] += base[i + 1]; live[2] += base[i + 2]; }
  const gain = [0, 1, 2].map((c) => (entry.raw.sums[c] ? live[c] / entry.raw.sums[c] : 1));
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(entry.hd, 0, 0, width, height);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgb(${gain.map((g) => Math.round(Math.min(1, g) * 255))})`;
  ctx.fillRect(0, 0, width, height);
  const over = Math.max(...gain) - 1;
  if (over > 0.01) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, over); ctx.drawImage(entry.hd, 0, 0, width, height); }
  ctx.restore();
  // Where a silhouette is cut by the frame (a silhouette blinding in reaches the edge part way
  // through, so the change eases over CUT_MS):
  // - at the bottom (태우 2026-11-25), the picture moves down so the cut-off figure stands near the
  //   screen's bottom edge, the margin left below it is blurred and darkened and the figure fades
  //   into it, and the sky above grows (the extended picture's top rows, stretched and blurred);
  // - at the top, the figure is carried over the picture's top edge (its pixels stay solid in the
  //   fading rows) and a head cut flat by the frame is rounded off above it.
  const level = cutLevel(ctx, silhouetteCut(layer));
  const scale = width / 240;
  const below = (EXTENDED_TOP + 160) * scale;
  const mask = (x, y) => {
    const byte = layer?.vram?.[((y >> 3) * 30 + (x >> 3)) * 32 + (y & 7) * 4 + ((x & 7) >> 1)] ?? 0;
    return (x & 1 ? byte >> 4 : byte & 15) !== 0;
  };
  const FEATHER = 14;
  const rows = new Uint8ClampedArray(base);
  for (let y = 0; y < 160; y++) {
    const d = Math.min(y, 159 - y);
    if (d >= FEATHER) continue;
    let t = (d + 0.5) / FEATHER; t = t * t * (3 - 2 * t);
    for (let x = 0; x < 240; x++) {
      const a = y < 80 && mask(x, y) ? 1 : t;
      rows[4 * (y * 240 + x) + 3] = Math.round(255 * a);
    }
  }
  middleCtx.putImageData(new ImageData(rows, 240, 160), 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(middle, 0, EXTENDED_TOP * scale, width, 160 * scale);
  ctx.restore();
  // (Rounding off flat-cut heads was tried and dropped: a guessed shape reads as a hat, 태우 2026-11-25.)
  if (level.bottom > 0) {
    // the picture's own bottom rows, stretched down over the margin, blurred and darkening
    const from = below - 10 * scale, band = 8 * scale, room = height - below + 6 * scale;
    shifted.width = width; shifted.height = room;
    const b = shifted.getContext("2d");
    b.filter = `blur(${Math.round(5 * scale)}px)`;
    b.drawImage(ctx.canvas, 0, from, width, band, 0, -4 * scale, width, room + 8 * scale);
    b.filter = "none";
    b.globalCompositeOperation = "source-atop";
    const dark = b.createLinearGradient(0, 0, 0, room);
    dark.addColorStop(0, "rgba(0,0,0,0)"); dark.addColorStop(1, "rgba(0,0,0,.45)");
    b.fillStyle = dark; b.fillRect(0, 0, width, room);
    b.globalCompositeOperation = "destination-in";
    const soft = b.createLinearGradient(0, 0, 0, 8 * scale);
    soft.addColorStop(0, "rgba(0,0,0,0)"); soft.addColorStop(1, "#000");
    b.fillStyle = soft; b.fillRect(0, 0, width, room);
    b.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.globalAlpha = level.bottom;
    ctx.drawImage(shifted, 0, below - 6 * scale);
    ctx.restore();
  }
  // Moved by the editor (portrait-edits.json: shift, in GBA rows, + down) and for a figure standing
  // on the bottom edge.
  const drop = Math.round((level.bottom * DROP + (editFor(currentId)?.shift ?? 0)) * scale);
  if (drop) shiftPicture(ctx, width, height, drop, scale);
}
// Moves the whole picture down (drop > 0) or up; the side left open is filled with that edge's rows,
// stretched, blurred and faded into the picture.
function shiftPicture(ctx, width, height, drop, scale) {
  shifted.width = width; shifted.height = height;
  shifted.getContext("2d").drawImage(ctx.canvas, 0, 0);
  const open = Math.abs(drop), blend = 16 * scale;
  sky.width = width; sky.height = open + blend;
  const k = sky.getContext("2d");
  k.filter = `blur(${Math.round(6 * scale)}px)`;
  if (drop > 0) k.drawImage(shifted, 0, 0, width, 12 * scale, 0, -6 * scale, width, sky.height + 12 * scale);
  else k.drawImage(shifted, 0, height - 12 * scale, width, 12 * scale, 0, -6 * scale, width, sky.height + 12 * scale);
  k.filter = "none";
  k.globalCompositeOperation = "destination-in";
  const fade = drop > 0 ? k.createLinearGradient(0, open, 0, open + blend) : k.createLinearGradient(0, blend, 0, 0);
  fade.addColorStop(0, "#000"); fade.addColorStop(1, "rgba(0,0,0,0)");
  k.fillStyle = fade; k.fillRect(0, 0, width, sky.height);
  k.globalCompositeOperation = "source-over";
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  if (drop > 0) { ctx.drawImage(shifted, 0, 0, width, height - open, 0, open, width, height - open); ctx.drawImage(sky, 0, 0); }
  else { ctx.drawImage(shifted, 0, open, width, height - open, 0, 0, width, height - open); ctx.drawImage(sky, 0, height - sky.height); }
  ctx.restore();
}
// How far (GBA rows) the picture moves down for a figure standing on the bottom edge: half the bottom
// margin, so a band of blurred picture stays below the feet.
const DROP = 50;
// A figure whose top is cut flat (its first row already 10 or more pixels wide; some silhouettes are
// cropped above the head in the cartridge, 태우 2026-11-25) gets a rounded top: a half ellipse as wide
// as that row, up to 12 rows high, in the figure's own color there.
function roundHeads(ctx, base, mask, scale) {
  let first = 0;
  const any = (y) => { for (let x = 0; x < 240; x++) if (mask(x, y)) return true; return false; };
  while (first < 120 && !any(first)) first++;
  if (first >= 120) return;
  const top = (EXTENDED_TOP + first) * scale;
  const row = first * 240, next = Math.min(159, first + 1) * 240;
  const DEEP = 4; // the dome spans the figure as wide as it is a few rows down
  const at = Math.min(159, first + DEEP);
  for (let x = 0; x < 240;) {
    if (!mask(x, first)) { x++; continue; }
    let end = x;
    while (end < 240 && mask(end, first)) end++;
    if (end - x >= 10) {
      let left = x, right = end;
      while (left > 0 && mask(left - 1, at)) left--;
      while (right < 240 && mask(right, at)) right++;
      const w = right - left;
      const color = [0, 0, 0];
      for (let i = x; i < end; i++) for (let c = 0; c < 3; c++) color[c] += base[4 * (row + i) + c] + base[4 * (next + i) + c];
      const rgb = color.map((v) => Math.round(v / (2 * (end - x))));
      ctx.save();
      ctx.fillStyle = `rgb(${rgb})`;
      ctx.beginPath();
      ctx.ellipse(((left + right) / 2) * scale, top + (DEEP + 1) * scale, (w / 2) * scale, (DEEP + Math.min(9, w * 0.3)) * scale, 0, Math.PI, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
    x = end;
  }
}
const shifted = document.createElement("canvas"), sky = document.createElement("canvas");
function extendedPixels(entry, base) {
  const live = new Float64Array(3);
  for (let i = 0; i < base.length; i += 4) { live[0] += base[i]; live[1] += base[i + 1]; live[2] += base[i + 2]; }
  const gain = [0, 1, 2].map((c) => (entry.raw.sums[c] ? live[c] / entry.raw.sums[c] : 1));
  const out = new Uint8ClampedArray(entry.pixels.length);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = entry.pixels[i] * gain[0]; out[i + 1] = entry.pixels[i + 1] * gain[1]; out[i + 2] = entry.pixels[i + 2] * gain[2]; out[i + 3] = 255;
  }
  // The game's tone is not a plain gain: per column, what the live edge row differs from the toned
  // picture there (smoothed over 31 columns) is carried onto the picture's feathered edge and margin,
  // fading out with distance, so nothing steps at the join.
  const FEATHER = 14;
  const match = (edgeRow, step) => {
    const diff = new Float32Array(240 * 3);
    for (let x = 0; x < 240; x++) for (let c = 0; c < 3; c++) {
      let sum = 0, count = 0;
      for (let k = Math.max(0, x - 15); k <= Math.min(239, x + 15); k++) {
        sum += base[4 * (edgeRow * 240 + k) + c] - entry.raw.pixels[3 * (edgeRow * 240 + k) + c] * gain[c]; count++;
      }
      diff[x * 3 + c] = sum / count;
    }
    const start = EXTENDED_TOP + edgeRow + (step < 0 ? FEATHER - 1 : 1 - FEATHER);
    for (let i = 0, row = start; row >= 0 && row < EXTENDED_HEIGHT; i++, row += step) {
      const weight = i < FEATHER ? 1 : Math.exp(-(i - FEATHER) / 45);
      for (let x = 0; x < 240; x++) for (let c = 0; c < 3; c++) out[4 * (row * 240 + x) + c] += diff[x * 3 + c] * weight;
    }
  };
  match(0, -1);
  match(159, 1);
  // The live screen in the middle; its outer 14 rows fade into the picture's own feathered edge.
  for (let y = 0; y < 160; y++) {
    const d = Math.min(y, 159 - y);
    let t = d >= FEATHER ? 1 : (d + 0.5) / FEATHER;
    t = t * t * (3 - 2 * t);
    const from = y * 240 * 4, to = (EXTENDED_TOP + y) * 240 * 4;
    if (t === 1) { out.set(base.subarray(from, from + 960), to); continue; }
    for (let i = 0; i < 960; i++) out[to + i] = i % 4 === 3 ? 255 : out[to + i] * (1 - t) + base[from + i] * t;
  }
  return out;
}

// The game's own screens (title, bookmarks, character pages) upright: the screen at full width, as
// it is (menus and taps unchanged), with the extended picture's margins drawn behind it above and
// below; the screen's top and bottom rows fade into them (CSS mask).
const extend = $("extend");
const extendCtx = extend.getContext("2d");
extend.width = 240 * UP; extend.height = EXTENDED_HEIGHT * UP;
let extendBase = null;
// A row's mean color when it is flat or nearly black (the logo and copyright screens sit on black or a
// very dark glow), else null.
function flatRow(data, y) {
  const at = y * 240 * 4, r = data[at], g = data[at + 1], b = data[at + 2];
  let flat = true, brightest = 0;
  const sum = [0, 0, 0];
  for (let x = 0; x < 240; x++) {
    const i = at + x * 4;
    if (Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b) > 12) flat = false;
    brightest = Math.max(brightest, data[i] + data[i + 1] + data[i + 2]);
    for (let k = 0; k < 3; k++) sum[k] += data[i + k];
  }
  return flat || brightest <= 240 ? sum.map((v) => Math.round(v / 240)) : null;
}
let flatKey = "";
function drawExtend(game) {
  const screen = game.screen;
  const entry = screen.base && extendedFor(screen);
  // Without an extended picture, a screen whose top and bottom rows are flat continues in those colors
  // (instead of the blurred glow), so the logo and copyright fill the upright screen like the original's black.
  const data = !entry && screen.image?.data;
  const top = data && flatRow(data, 0), bottom = data && flatRow(data, 159);
  const flat = Boolean(top && bottom);
  shell.classList.toggle("extended", Boolean(entry) || flat);
  const canvas = $("screen");
  const width = canvas.clientWidth;
  extend.style.width = `${width}px`;
  extend.style.height = `${(width * EXTENDED_HEIGHT) / 240}px`;
  if (flat) {
    extendBase = null;
    const key = `${top}|${bottom}`;
    if (key !== flatKey) {
      flatKey = key;
      extendCtx.fillStyle = `rgb(${top})`; extendCtx.fillRect(0, 0, extend.width, extend.height / 2);
      extendCtx.fillStyle = `rgb(${bottom})`; extendCtx.fillRect(0, extend.height / 2, extend.width, extend.height / 2);
      stage.style.setProperty("--edge-top", `rgb(${top})`);
      stage.style.setProperty("--edge-bottom", `rgb(${bottom})`);
    }
    return;
  }
  flatKey = "";
  if (!entry) { extendBase = null; return; }
  if (screen.base === extendBase && !cutEasing) return;
  cutEasing = false;
  extendBase = screen.base;
  const pixels = extendedPixels(entry, screen.base);
  if (entry.hd) paintSharp(extendCtx, entry, screen.base, extend.width, extend.height, screen.silhouette);
  else {
    const flatSource = Object.assign(document.createElement("canvas"), { width: 240, height: EXTENDED_HEIGHT });
    flatSource.getContext("2d").putImageData(new ImageData(pixels, 240, EXTENDED_HEIGHT), 0, 0);
    extendCtx.imageSmoothingEnabled = false;
    extendCtx.drawImage(flatSource, 0, 0, extend.width, extend.height);
  }
  const last = (EXTENDED_HEIGHT - 1) * 240 * 4;
  const mean = (from) => { const c = [0, 0, 0]; for (let x = 0; x < 240; x++) for (let k = 0; k < 3; k++) c[k] += pixels[from + x * 4 + k] / 240; return c.map(Math.round); };
  stage.style.setProperty("--edge-top", `rgb(${mean(0)})`);
  stage.style.setProperty("--edge-bottom", `rgb(${mean(last)})`);
}

// Where to cut: the silhouette when one is up (people are what the page is about), otherwise the band
// with the most detail and color, pulled a little toward the middle.
function interest(base) {
  const columns = new Float32Array(240);
  for (let x = 0; x < 240; x++) {
    let sum = 0;
    for (let y = 0; y < 160; y += 2) {
      const at = 4 * (y * 240 + x);
      const r = base[at], g = base[at + 1], b = base[at + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const right = x < 239 ? at + 4 : at - 4;
      const below = y < 158 ? at + 960 * 2 : at - 960 * 2;
      const edge = Math.abs(r - base[right]) + Math.abs(g - base[right + 1]) + Math.abs(b - base[right + 2])
        + Math.abs(r - base[below]) + Math.abs(g - base[below + 1]) + Math.abs(b - base[below + 2]);
      sum += edge + (max - min) * 0.6 + max * 0.15;
    }
    columns[x] = sum;
  }
  return columns;
}
function silhouetteSpan(layer) {
  if (!layer?.vram) return null;
  let left = 240, right = -1;
  for (let tile = 0; tile < 30 * 20; tile++) {
    const at = tile * 32;
    let any = false;
    for (let i = 0; i < 32; i++) if (layer.vram[at + i]) { any = true; break; }
    if (!any) continue;
    const x = (tile % 30) * 8;
    left = Math.min(left, x);
    right = Math.max(right, x + 8);
  }
  return right > left ? { left, right } : null;
}
function cropLeft(base, layer, width) {
  if (width >= 240) return 0;
  const clamp = (x) => Math.max(0, Math.min(240 - width, Math.round(x)));
  const span = silhouetteSpan(layer);
  if (span) return clamp((span.left + span.right) / 2 - width / 2);
  const columns = interest(base);
  let best = 0, bestScore = -Infinity, sum = 0;
  for (let x = 0; x < width; x++) sum += columns[x];
  for (let left = 0; left + width <= 240; left++) {
    if (left) sum += columns[left + width - 1] - columns[left - 1];
    const center = (left + width / 2 - 120) / 120;
    const score = sum * (1 - 0.35 * center * center);
    if (score > bestScore) { bestScore = score; best = left; }
  }
  return best;
}

let shownBase = null, shownBackground = null, shownLayer = null, crop = -1, shownEdit = -1;
function drawPicture(game) {
  const screen = game.screen;
  const base = screen.base;
  const size = { width: reader.clientWidth, height: reader.clientHeight };
  if (!base || !size.height) return;
  extendedLoading ??= loadExtended(game).then(() => { shownBase = null; });
  currentId = pictureId(game);
  const edit = editFor(currentId);
  if (base !== shownBase || cutEasing || editVersion !== shownEdit) {
    const edited = editVersion !== shownEdit;
    shownEdit = editVersion;
    cutEasing = false;
    compose(screen, base);
    picture.classList.toggle("sharp", edit?.mode !== "fill" && edit?.mode !== "frame" && Boolean(extendedFor(screen)?.hd));
    if (edited) crop = -1;
    const width = Math.min(240, (source.height * size.width) / size.height);
    // A new picture cuts straight to its place; a silhouette coming or going on the same one pans.
    const same = screen.background === shownBackground;
    const layerChanged = (screen.silhouette ? silhouetteSpan(screen.silhouette)?.left : null) !== shownLayer;
    if (!same || layerChanged || crop < 0) {
      const next = edit?.mode === "fill" && Number.isFinite(edit.crop)
        ? Math.max(0, Math.min(240 - width, Math.round(edit.crop))) : cropLeft(base, screen.silhouette, width);
      picture.classList.toggle("pan", same && crop >= 0);
      crop = next;
    }
    shownBase = base;
    shownBackground = screen.background;
    shownLayer = screen.silhouette ? silhouetteSpan(screen.silhouette)?.left : null;
  }
  const scale = size.height / source.height;
  picture.style.width = `${240 * scale}px`;
  picture.style.height = `${size.height}px`;
  picture.style.transform = `translateX(${-crop * scale}px)`;
}

// The page in the cartridge's own type: the glyphs PageText has placed so far (font, line breaks and
// colors as the cartridge draws them, 08001xxx), drawn with whole device pixels per GBA pixel.
const COLORS = { 1: [0, 0, 0], 2: [255, 255, 255], 4: [181, 181, 255], 8: [255, 123, 222], 9: [255, 255, 255] };
const TEXT_LEFT = 7, TEXT_WIDTH = 226; // story glyphs start at x 8 and wrap before 220 (+ a glyph)
function paint(canvas, font, glyphs, left, top, width, height, scale) {
  canvas.width = width;
  canvas.height = height;
  const ratio = devicePixelRatio || 1;
  canvas.style.width = `${(width * scale) / ratio}px`;
  canvas.style.height = `${(height * scale) / ratio}px`;
  const image = new ImageData(width, height);
  for (const { encoded, x, y, color } of glyphs) {
    const index = font.find(encoded);
    if (index < 0) continue;
    const glyph = font.glyph(index);
    for (let gy = 0; gy < glyph.height; gy++) for (let gx = 0; gx < glyph.width; gx++) {
      const value = glyph.pixels[gy * glyph.width + gx];
      if (!value) continue;
      const px = x - left + gx, py = y - top + gy;
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const rgb = COLORS[value === 1 ? 1 : color] ?? COLORS[2];
      image.data.set([...rgb, 255], 4 * (py * width + px));
    }
  }
  canvas.getContext("2d").putImageData(image, 0, 0);
}
// Largest whole number of device pixels per GBA pixel that fits the story's 226-pixel band.
const textScale = () => Math.max(1, Math.floor(((reader.clientWidth - 8) * (devicePixelRatio || 1)) / TEXT_WIDTH));

// A choice's glyphs, laid out the way 08004200 lays out a list row (、。 advance 8), wrapped to width.
const NO_START = new Set([0x8141, 0x8142, 0x8143, 0x8144, 0x8176, 0x8178, 0x816a, 0x8175 + 0x0e, 0x8163, 0x815b]);
function choiceGlyphs(game, chunks, width, color) {
  const { font } = game;
  const glyphs = [];
  let x = 0, y = 0;
  const put = (encoded) => {
    const index = font.find(encoded);
    const glyphWidth = index < 0 ? 8 : font.glyph(index).width;
    const advance = encoded === 0x8141 || encoded === 0x8142 ? 8 : encoded === 0x8140 ? 2 : glyphWidth;
    // No row starts with 、。」』） or a small kana mark: those may hang past the edge instead.
    if (x + glyphWidth > width && !NO_START.has(encoded)) { x = 0; y += 14; }
    glyphs.push({ encoded, x, y, color });
    x += advance;
  };
  for (const raw of chunks ?? []) for (let pos = 0; pos < raw.length; pos++) {
    const byte = raw[pos];
    if (byte > 0x80) { put((byte << 8) | raw[++pos]); continue; }
    const letter = String.fromCharCode(byte);
    if (letter === "n") {
      const id = raw[++pos] - 0x30;
      const bytes = game.page.text.nameBytes?.[id] ?? { 1: [0x93, 0xa7], 2: [0x90, 0x5e, 0x97, 0x9d] }[id] ?? [];
      for (let i = 0; i + 1 < bytes.length; i += 2) put((bytes[i] << 8) | bytes[i + 1]);
    } else if ("svcC".includes(letter)) pos++;
  }
  // Leading ideographic spaces only push the row right; drop them in a button of its own.
  while (glyphs.length && glyphs[0].encoded === 0x8140) {
    const shift = 2;
    glyphs.shift();
    for (const glyph of glyphs) if (glyph.y === 0) glyph.x -= shift;
  }
  return { glyphs, height: y + 14 };
}
function currentChoices(game) {
  const { vm, page, screen } = game;
  if (vm.waiting !== "choice") return null;
  return vm.choiceState?.opcode === 0x13 ? page.menu?.choices : screen.choiceOverlay?.choices;
}

const READER_PITCH = 20;
const pageCanvas = document.createElement("canvas");
pageCanvas.className = "type";
words.replaceChildren(pageCanvas);
let shownKey = "", shownChoices = null, shownSelected = -1, shownScale = 0;
function drawText(game) {
  const { page, font, vm } = game;
  const scale = textScale();
  // Phones: the story in the large mobile type (large-text.js: 1.25 times the glyphs, wider rows,
  // Korean wrapped at spaces), laid out by PageText on its K-times canvas and brought back to glyph
  // pixels here; the page fills the reader's width. Elsewhere the cartridge's own layout.
  const big = page.large?.enabled && page.largeLayout && page.largeSource === page.layout ? page.large.geometry : null;
  const unit = big ? big.scale : 1;
  const source = big ? page.largeLayout : page.layout ?? [];
  // Rows are spread a little wider than the overlay's (READER_PITCH glyph pixels apart, 태우 2026-11-25).
  const row = (y) => Math.round((11 * big.k) / unit) + Math.round((y - 11 * big.k) / big.pitch) * READER_PITCH;
  const glyphs = source.slice(0, page.shown ?? 0).map((g) => (big ? { ...g, x: Math.round(g.x / unit), y: row(g.y) } : g));
  const bandLeft = big ? Math.round((8 * big.k) / unit) - 1 : TEXT_LEFT;
  const bandWidth = big ? Math.round((big.right + 6 * big.k) / unit) - bandLeft : TEXT_WIDTH;
  const bandTop = big ? Math.round((11 * big.k) / unit) - 2 : 9;
  const typeScale = big ? Math.max(1, ((reader.clientWidth - 8) * (devicePixelRatio || 1)) / bandWidth) : scale;
  const key = `${typeScale}|${big ? 1 : 0}|${glyphs.map((g) => `${g.encoded}.${g.x}.${g.y}.${g.color}`).join(",")}`;
  if (key !== shownKey) {
    const bottom = glyphs.length ? Math.max(...glyphs.map((g) => g.y)) + 15 : bandTop;
    paint(pageCanvas, font, glyphs, bandLeft, bandTop, bandWidth, Math.max(1, bottom - bandTop), typeScale);
    pageCanvas.hidden = !glyphs.length;
    shownKey = key;
  }
  const choices = currentChoices(game);
  const selected = vm.choiceSelection ?? 0;
  if (choices !== shownChoices || selected !== shownSelected || scale !== shownScale) {
    const lettered = choices && vm.choiceState?.opcode !== 0x13;
    const ratio = devicePixelRatio || 1;
    choiceList.replaceChildren(...(choices ?? []).map((chunks, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.classList.toggle("selected", index === selected);
      button.dataset.index = index;
      const color = index === selected ? 8 : 9;
      // Room for the row in GBA pixels: the list's width less the button's padding.
      const room = Math.floor(((reader.clientWidth - 36 - 34) * ratio) / scale) - (lettered ? 14 : 0);
      const row = choiceGlyphs(game, chunks, Math.max(64, room), color);
      // Lists drawn by the screen put Ａ, Ｂ… in front, as the cartridge does (x 10, label at 24).
      if (lettered) {
        for (const glyph of row.glyphs) glyph.x += 14;
        row.glyphs.unshift({ encoded: 0x8260 + index, x: 0, y: 0, color });
      }
      const width = Math.max(1, ...row.glyphs.map((g) => g.x + 13));
      const canvas = document.createElement("canvas");
      canvas.className = "type";
      paint(canvas, font, row.glyphs, 0, 0, width, row.height, scale);
      button.append(canvas);
      return button;
    }));
    shownChoices = choices;
    shownSelected = selected;
    shownScale = scale;
  }
  reader.classList.toggle("choosing", Boolean(choices));
  reader.classList.toggle("waiting", game.vm.waiting === "click" && !game.page.typing);
}

// Taps: a choice moves the cursor there, a tap on the chosen one confirms (as on the screen);
// anywhere else is the A button.
choiceList.addEventListener("click", (event) => {
  const button = event.target.closest(".choice");
  const game = window.kamaitachi;
  if (!button || !game || game.vm.waiting !== "choice") return;
  event.stopPropagation();
  game.sound.resume();
  navigator.vibrate?.(8);
  const index = Number(button.dataset.index);
  if (index === game.vm.choiceSelection) game.vm.resume();
  else game.vm.moveChoice(index - game.vm.choiceSelection);
});
reader.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".choice, .menu-button")) return;
  event.preventDefault();
  // Handed to the hidden screen as a tap in its top corner: the game counts a quick tap once even when
  // the finger lifts before the next frame, and treats it as A.
  const canvas = $("screen");
  const box = canvas.getBoundingClientRect();
  canvas.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, cancelable: true, pointerId: event.pointerId, pointerType: event.pointerType, isPrimary: event.isPrimary,
    clientX: box.left + 1, clientY: box.top + 1,
  }));
});

// Portrait reading applies on an upright window when it is switched on; in the game's own screens
// the original screen stays (they are laid out for 240x160 and played by their own taps).
// Upright is the phone's own orientation: inside the hub the frame starts out landscape-shaped and only
// grows tall once asked to.
const upright = () => {
  const type = globalThis.screen?.orientation?.type;
  const device = type ? type.startsWith("portrait") : globalThis.screen.height > globalThis.screen.width;
  return touch ? device : innerHeight > innerWidth * 1.15;
};
export const readerWanted = () => enabled && upright();
let wantedPosted = null;
function frame() {
  const game = window.kamaitachi;
  const wanted = readerWanted();
  if (embedded && wanted !== wantedPosted) {
    parent.postMessage({ type: "reader", on: wanted }, location.origin); // the hub makes its frame tall
    wantedPosted = wanted;
  }
  if (shell.classList.contains("reader-on") !== wanted) {
    shell.classList.toggle("reader-on", wanted);
    dispatchEvent(new Event("resize")); // the shell refits the screen (full width when upright)
  }
  const story = Boolean(game) && game.vm.waiting !== "boot" && !game.boot.active;
  const reading = wanted && story;
  shell.classList.toggle("reading", reading);
  if (reading) { drawPicture(game); drawText(game); }
  else crop = -1;
  if (wanted && game && !reading) { extendedLoading ??= loadExtended(game); drawExtend(game); }
  else shell.classList.remove("extended");
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

const toggle = $("readertoggle");
const showToggle = () => {
  toggle.setAttribute("aria-pressed", String(enabled));
  toggle.setAttribute("aria-label", enabled ? "세로 읽기 끄기 (원본 화면)" : "세로 읽기 켜기");
};
toggle.addEventListener("click", () => {
  enabled = !enabled;
  store.set("kamaitachi.reader", enabled ? "1" : "0");
  showToggle();
});
showToggle();

// Editor preview (editor.html frames the player with ?preview=1): the game holds still and shows the
// picture the editor names, with the editor's unsaved choices for it.
if (new URLSearchParams(location.search).has("preview")) {
  addEventListener("message", async (event) => {
    if (event.origin !== location.origin || event.data?.type !== "preview") return;
    const game = window.kamaitachi;
    if (!game?.vm) return;
    const { id, edit } = event.data;
    if (edit) edits[id] = edit; else delete edits[id];
    editVersion++;
    if (pictureId(game) !== id || game.vm.waiting !== "hold") {
      game.vm.waiting = "hold";
      game.boot.run = null;
      game.page.hideMenu?.();
      game.vm.text?.clearPage?.();
      await game.vm.scene.load(id);
      game.screen.setSilhouetteLayer?.(null);
      game.screen.setBrightness(1, 0x8000);
      game.screen.setBrightness(5, 0x8000);
    }
    parent.postMessage({ type: "preview-shown", id }, location.origin);
  });
  parent.postMessage({ type: "preview-ready" }, location.origin);
}
