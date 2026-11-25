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

// The upright canvas: 240x360 with the cartridge's 240x160 at rows 100-259.
const EXTENDED_TOP = 100, EXTENDED_HEIGHT = 360;
// Per-picture choices made in the editor (editor.html, saved as /art/portrait-edits.json on the test
// server, 태우 2026-11-25): { "<picture id>": { mode, shift, crop } }
//   mode  "frame" (the original whole, over a blurred enlargement of itself; the default) or "fill"
//         (the original cut to fill the screen)
//   shift GBA rows the picture moves (+ down) in "frame"
//   zoom  enlargement, 1 to 3 (cut evenly above and below)
//   crop  where the part shown across sits, 0 (left edge) to 100 (right edge)
let edits = {};
let editVersion = 0;
// Read again whenever the picture changes, so a value saved in the editor shows without reloading
// the player (the editor's own preview sends its values instead).
const PREVIEW = new URLSearchParams(location.search).has("preview");
let editsText = "";
function loadEdits() {
  fetch("/art/portrait-edits.json", { cache: "no-cache" }).then((r) => (r.ok ? r.text() : "{}"))
    .then((text) => {
      if (text === editsText) return;
      editsText = text;
      const value = JSON.parse(text);
      edits = value && typeof value === "object" ? value : {};
      editVersion++;
    }).catch(() => {});
}
loadEdits();
// and every few seconds while the page is in front, so a value saved with the picture already up
// shows on it too
if (!PREVIEW) setInterval(() => { if (document.visibilityState === "visible") loadEdits(); }, 3000);
let currentId = null;
// Every picture: the original whole over a blurred backdrop of itself, at 120%, centred (태우 2026-11-26;
// AI-extended margins were given up). The editor's values for a picture go on top.
const DEFAULT_EDIT = { mode: "frame", zoom: 1.2, crop: 50 };
const editFor = (id) => {
  if (id === null || id === undefined) return null;
  const edit = { ...DEFAULT_EDIT, ...(edits[id] ?? {}) };
  if (edit.mode !== "fill") edit.mode = "frame";
  return edit;
};
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
function compose(screen, base) {
  if (editFor(currentId)?.mode !== "fill") { sizeTo(EXTENDED_HEIGHT); paintFrame(pictureCtx, base, picture.width, picture.height); return EXTENDED_TOP; }
  sizeTo(160);
  sourceCtx.putImageData(new ImageData(new Uint8ClampedArray(base), 240, 160), 0, 0);
  pictureCtx.drawImage(source, 0, 0, picture.width, picture.height);
  return 0;
}
const middle = Object.assign(document.createElement("canvas"), { width: 240, height: 160 });
const middleCtx = middle.getContext("2d");
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
const shifted = document.createElement("canvas"), sky = document.createElement("canvas");

// The game's own screens (title, bookmarks, character pages) upright: the screen at full width, as
// it is (menus and taps unchanged); a screen with flat top and bottom rows continues in those colors
// above and below (CSS mask).
const extend = $("extend");
const extendCtx = extend.getContext("2d");
extend.width = 240 * UP; extend.height = EXTENDED_HEIGHT * UP;
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
  // A screen whose top and bottom rows are flat continues in those colors (instead of the blurred
  // glow), so the logo and copyright fill the upright screen like the original's black.
  const data = screen.image?.data;
  const top = data && flatRow(data, 0), bottom = data && flatRow(data, 159);
  const flat = Boolean(top && bottom);
  shell.classList.toggle("extended", flat);
  if (!flat) { flatKey = ""; return; }
  const canvas = $("screen");
  const width = canvas.clientWidth;
  extend.style.width = `${width}px`;
  extend.style.height = `${(width * EXTENDED_HEIGHT) / 240}px`;
  const key = `${top}|${bottom}`;
  if (key === flatKey) return;
  flatKey = key;
  extendCtx.fillStyle = `rgb(${top})`; extendCtx.fillRect(0, 0, extend.width, extend.height / 2);
  extendCtx.fillStyle = `rgb(${bottom})`; extendCtx.fillRect(0, extend.height / 2, extend.width, extend.height / 2);
  stage.style.setProperty("--edge-top", `rgb(${top})`);
  stage.style.setProperty("--edge-bottom", `rgb(${bottom})`);
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

let shownBase = null, shownBackground = null, shownLayer = null, crop = -1, shownEdit = -1, settledZoom = 1.2;
function drawPicture(game) {
  const screen = game.screen;
  const base = screen.base;
  const size = { width: reader.clientWidth, height: reader.clientHeight };
  if (!base || !size.height) return;
  const id = pictureId(game);
  if (id !== currentId && !PREVIEW) loadEdits();
  currentId = id;
  const edit = editFor(currentId);
  if (base !== shownBase || editVersion !== shownEdit) {
    const edited = editVersion !== shownEdit;
    shownEdit = editVersion;
    compose(screen, base);
    if (edited) crop = -1;
    // The zoom too is settled when the picture first shows: the editor's, or 120% unless silhouettes
    // are on it then (or about to be), which stay whole at 100% (태우 2026-11-26).
    if (!(screen.background === shownBackground) || crop < 0) {
      const people = [game.vm?.scene?.layerBuffer, screen.silhouette?.vram].some((v) => v && v.some((b) => b));
      settledZoom = Number.isFinite(edits[currentId]?.zoom) ? zoomOf(edit) : people ? 1 : zoomOf(edit);
    }
    const width = Math.min(240, (source.height * size.width) / (size.height * settledZoom));
    // Across, the place is settled when a picture first shows: the editor's value, or centred on the
    // silhouettes of that moment (the layer's buffer, shown or about to be). While the same picture
    // stays it holds, whatever the silhouettes do (태우 2026-11-26); the zoom is the editor's.
    const same = screen.background === shownBackground;
    if (!same || crop < 0) {
      const layer = game.vm?.scene?.layerBuffer ? { vram: game.vm.scene.layerBuffer } : screen.silhouette;
      crop = Number.isFinite(edit?.crop)
        ? Math.round((Math.max(0, Math.min(100, edit.crop)) / 100) * Math.max(0, 240 - width)) : cropLeft(base, layer, width);
      picture.classList.remove("pan");
    }
    shownBase = base;
    shownBackground = screen.background;
    shownLayer = screen.silhouette ? silhouetteSpan(screen.silhouette)?.left : null;
  }
  const zoom = settledZoom;
  const scale = (size.height * zoom) / source.height;
  picture.style.width = `${240 * scale}px`;
  picture.style.height = `${size.height * zoom}px`;
  // A zoomed picture is cut evenly above and below.
  picture.style.transform = `translate(${-crop * scale}px, ${(-(zoom - 1) * size.height) / 2}px)`;
}
// The editor's enlargement (zoom, 1 to 3), on top of filling the screen's height.
const zoomOf = (edit) => (Number.isFinite(edit?.zoom) ? Math.max(1, Math.min(3, edit.zoom)) : 1);

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
  if (wanted && game && !reading) drawExtend(game);
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
