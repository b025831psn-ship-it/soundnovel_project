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
      extended.set(signature(tiles), { pixels: ctx.getImageData(0, 0, 240, EXTENDED_HEIGHT).data, raw: untoned(tiles, palette) });
    } catch { /* not served: the picture is cut from the original only */ }
  }
}
const FIRST_SHOWN = [259, 256, 257, 258, 222, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297,
  200, 74, 1, 2, 3, 209, 9, 12, 6, 17, 11, 7, 23, 22, 24, 8, 10];
let extendedLoading = null;
const extendedFor = (screen) => screen.background?.tiles && extended.get(signature(screen.background.tiles));
function compose(screen, base) {
  const entry = extendedFor(screen);
  if (!entry) { sizeTo(160); sourceCtx.putImageData(new ImageData(new Uint8ClampedArray(base), 240, 160), 0, 0); return 0; }
  sizeTo(EXTENDED_HEIGHT);
  sourceCtx.putImageData(new ImageData(extendedPixels(entry, base), 240, EXTENDED_HEIGHT), 0, 0);
  return EXTENDED_TOP;
}
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
extend.width = 240; extend.height = EXTENDED_HEIGHT;
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
      extendCtx.fillStyle = `rgb(${top})`; extendCtx.fillRect(0, 0, 240, EXTENDED_HEIGHT / 2);
      extendCtx.fillStyle = `rgb(${bottom})`; extendCtx.fillRect(0, EXTENDED_HEIGHT / 2, 240, EXTENDED_HEIGHT / 2);
      stage.style.setProperty("--edge-top", `rgb(${top})`);
      stage.style.setProperty("--edge-bottom", `rgb(${bottom})`);
    }
    return;
  }
  flatKey = "";
  if (!entry) { extendBase = null; return; }
  if (screen.base === extendBase) return;
  extendBase = screen.base;
  const pixels = extendedPixels(entry, screen.base);
  extendCtx.putImageData(new ImageData(pixels, 240, EXTENDED_HEIGHT), 0, 0);
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

let shownBase = null, shownBackground = null, shownLayer = null, crop = -1;
function drawPicture(game) {
  const screen = game.screen;
  const base = screen.base;
  const size = { width: reader.clientWidth, height: reader.clientHeight };
  if (!base || !size.height) return;
  extendedLoading ??= loadExtended(game).then(() => { shownBase = null; });
  if (base !== shownBase) {
    compose(screen, base);
    pictureCtx.drawImage(source, 0, 0, 240 * UP, source.height * UP);
    const width = Math.min(240, (source.height * size.width) / size.height);
    // A new picture cuts straight to its place; a silhouette coming or going on the same one pans.
    const same = screen.background === shownBackground;
    const layerChanged = (screen.silhouette ? silhouetteSpan(screen.silhouette)?.left : null) !== shownLayer;
    if (!same || layerChanged || crop < 0) {
      const next = cropLeft(base, screen.silhouette, width);
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

const pageCanvas = document.createElement("canvas");
pageCanvas.className = "type";
words.replaceChildren(pageCanvas);
let shownKey = "", shownChoices = null, shownSelected = -1, shownScale = 0;
function drawText(game) {
  const { page, font, vm } = game;
  const scale = textScale();
  const glyphs = (page.layout ?? []).slice(0, page.shown ?? 0);
  const key = `${scale}|${glyphs.map((g) => `${g.encoded}.${g.x}.${g.y}.${g.color}`).join(",")}`;
  if (key !== shownKey) {
    const bottom = glyphs.length ? Math.max(...glyphs.map((g) => g.y)) + 15 : 9;
    paint(pageCanvas, font, glyphs, TEXT_LEFT, 9, TEXT_WIDTH, Math.max(1, bottom - 9), scale);
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
