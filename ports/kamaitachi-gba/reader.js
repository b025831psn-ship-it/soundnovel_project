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
const SJIS = new TextDecoder("shift_jis");
const char = (code) => SJIS.decode(new Uint8Array([code >> 8, code & 255]));
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
const source = Object.assign(document.createElement("canvas"), { width: 240, height: 160 });
const sourceCtx = source.getContext("2d");
picture.width = 240 * UP;
picture.height = 160 * UP;
const pictureCtx = picture.getContext("2d");
pictureCtx.imageSmoothingEnabled = false;

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
  const width = Math.min(240, (160 * size.width) / size.height);
  const scale = size.height / 160;
  if (base !== shownBase) {
    sourceCtx.putImageData(new ImageData(new Uint8ClampedArray(base), 240, 160), 0, 0);
    pictureCtx.drawImage(source, 0, 0, 240 * UP, 160 * UP);
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
  picture.style.width = `${240 * scale}px`;
  picture.style.height = `${size.height}px`;
  picture.style.transform = `translateX(${-crop * scale}px)`;
}

// The page as text: the glyphs PageText has shown so far, with the line breaks the script asked for
// (the cartridge's own wrapping at 220 pixels is left to the phone's width).
function pageHtml(page) {
  const fragments = page.source ?? [];
  const layout = page.layout ?? [];
  let index = 0, html = "", color = null, open = false;
  const limit = page.shown ?? layout.length;
  for (const fragment of fragments) {
    if (index >= limit) break;
    if (fragment === "\n") { html += "<br>"; continue; }
    if (fragment?.color !== undefined) {
      if (open) html += "</span>";
      color = fragment.color;
      open = color === 4;
      if (open) html += '<span class="blue">';
      continue;
    }
    const count = typeof fragment === "string" ? page.place([fragment]).length : 1;
    for (let i = 0; i < count && index < limit; i++, index++) html += escape(char(layout[index].encoded));
  }
  if (open) html += "</span>";
  return html;
}
// The ideographic space advances only 2 pixels on the cartridge (a little air around names), so a
// run of them is a thin space here, not a gap of full-width blanks.
const escape = (text) => text.replace(/\u3000+/g, "\u2009").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

function chunkText(game, chunks) {
  let out = "";
  for (const raw of chunks ?? []) for (let pos = 0; pos < raw.length; pos++) {
    const byte = raw[pos];
    if (byte > 0x80) { out += char((byte << 8) | raw[++pos]); continue; }
    const letter = String.fromCharCode(byte);
    if (letter === "n") {
      const id = raw[++pos] - 0x30;
      const bytes = game.page.text.nameBytes?.[id];
      out += bytes ? SJIS.decode(new Uint8Array(bytes)) : game.page.text.names?.[id] ?? "";
    } else if ("svcC".includes(letter)) pos++;
  }
  return out.replace(/\u3000+/g, "\u2009").trim();
}
function currentChoices(game) {
  const { vm, page, screen } = game;
  if (vm.waiting !== "choice") return null;
  const list = vm.choiceState?.opcode === 0x13 ? page.menu?.choices : screen.choiceOverlay?.choices;
  return list ? list.map((chunks) => chunkText(game, chunks)) : null;
}

let shownHtml = null, shownChoices = "", shownSelected = -1;
function drawText(game) {
  const html = pageHtml(game.page);
  if (html !== shownHtml) {
    words.innerHTML = html;
    shownHtml = html;
  }
  const choices = currentChoices(game);
  const key = choices ? choices.join("\u0001") : "";
  const selected = game.vm.choiceSelection ?? 0;
  if (key !== shownChoices) {
    choiceList.replaceChildren(...(choices ?? []).map((label, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.dataset.index = index;
      const mark = document.createElement("span");
      mark.className = "mark";
      mark.textContent = choices.length > 1 && game.vm.choiceState?.opcode !== 0x13 ? String.fromCharCode(65 + index) : "▶";
      const text = document.createElement("span");
      text.textContent = label;
      button.append(mark, text);
      return button;
    }));
    shownChoices = key;
    shownSelected = -1;
  }
  if (selected !== shownSelected) {
    for (const button of choiceList.children) button.classList.toggle("selected", Number(button.dataset.index) === selected);
    shownSelected = selected;
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
  shell.classList.toggle("reader-on", wanted);
  const story = Boolean(game) && game.vm.waiting !== "boot" && !game.boot.active;
  const reading = wanted && story;
  shell.classList.toggle("reading", reading);
  if (reading) { drawPicture(game); drawText(game); }
  else crop = -1;
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
