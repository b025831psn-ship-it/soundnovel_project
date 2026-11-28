// The player around the PS2 screen: the same shell as the other ports (ports/kamaitachi-ps1/shell.js,
// 태우 2026-11-28: one UI for every port). The screen fills the stage (whole numbers only where they fill
// it anyway; full width on an upright phone), the blurred scene at the sides, sound and volume, full screen, theatre mode in the hub, and the
// bar resting while immersed. The game's own input (taps, keys, pad) stays in player.js, which publishes
//   window.kamaitachi2Ps2 = { setVolume(0..1), resume() }
import { fitScale, upright } from "/shared/player/fit-scale.js";
const W = 640, H = 480, LINES = 448; // the frame and the lines the game draws in its middle
const $ = (id) => document.getElementById(id);
const shell = $("shell"), stage = $("stage"), canvas = $("screen"), movie = $("movie");
const embedded = window.parent !== window;
const touch = matchMedia("(pointer: coarse)").matches;
const store = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

function fit() {
  const ratio = devicePixelRatio || 1;
  document.documentElement.classList.toggle("upright", upright());
  // The PS2 draws photographs and movies at 640x448, not pixel art: whole-number steps would leave it
  // at x1 on a common PC window (1280x900 less the bar), so it fills the stage at any scale, like an
  // upright phone (fit-scale.js). Whole numbers are kept only where they fill the stage anyway.
  const fitted = fitScale(stage.clientWidth, stage.clientHeight, W, H, ratio);
  const exact = Math.min(stage.clientWidth / W, stage.clientHeight / H);
  const { scale, whole, steps } = fitted.whole && fitted.scale >= exact * 0.9 ? fitted : { scale: exact, whole: false, steps: fitted.steps };
  const band = (H - LINES) / 2 * scale;
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${LINES * scale}px`;
  canvas.style.margin = `${band}px 0`;
  movie.style.top = `${band}px`;
  movie.style.height = `${LINES * scale}px`;
  $("scale").textContent = whole ? `×${steps}` : "맞춤";
  $("scale").title = `원본 ${W}×${H} → ${Math.round(W * scale * ratio)}×${Math.round(H * scale * ratio)} (정수 배율)`;
}
new ResizeObserver(fit).observe(stage);
addEventListener("resize", fit);

const game = () => window.kamaitachi2Ps2;
const resume = () => { game()?.resume?.(); apply(); };
for (const type of ["touchend", "click", "keydown"]) addEventListener(type, resume, { capture: true, passive: true });
(function whenReady() {
  if (!game() || !$("loading").hidden) return requestAnimationFrame(whenReady);
  stage.classList.add("ready");
  apply();
})();

// The blurred scene behind the screen (the sides of a wide window): the movie while one plays.
const glow = $("glow").getContext("2d");
glow.imageSmoothingEnabled = true;
let tick = 0;
(function follow() {
  if (tick++ % 4 === 0) {
    glow.globalAlpha = 0.25;
    try { glow.drawImage(!movie.hidden && movie.readyState >= 2 ? movie : canvas, 0, 0, 32, 24); } catch { /* not decodable yet */ }
  }
  requestAnimationFrame(follow);
})();

const mute = $("mute"), volume = $("volume");
let muted = store.get("kamaitachi2-ps2.muted", "0") === "1";
volume.value = store.get("kamaitachi2-ps2.volume", "80");
function apply() {
  game()?.setVolume?.(muted ? 0 : Number(volume.value) / 100);
  mute.setAttribute("aria-pressed", String(muted));
  mute.setAttribute("aria-label", muted ? "소리 켜기" : "소리 끄기");
  volume.style.setProperty("--fill", `${volume.value}%`);
}
mute.addEventListener("click", () => { muted = !muted; store.set("kamaitachi2-ps2.muted", muted ? "1" : "0"); resume(); });
volume.addEventListener("input", () => {
  muted = Number(volume.value) === 0;
  store.set("kamaitachi2-ps2.volume", volume.value);
  store.set("kamaitachi2-ps2.muted", muted ? "1" : "0");
  apply();
});
apply();

// Full screen: phones turn to landscape where the browser can (Android); where it cannot (iPhone
// Safari) the page fills the window and, held upright, draws the player a quarter turn round.
const fullscreen = $("fullscreen");
let filled = false;
const setFilled = (on) => {
  filled = on;
  shell.classList.toggle("filled", on);
  document.documentElement.classList.toggle("filled", on);
  if (embedded) parent.postMessage({ type: "fill", on }, location.origin);
  showFullscreenState();
};
const showFullscreenState = () => {
  const on = Boolean(document.fullscreenElement) || filled;
  fullscreen.setAttribute("aria-pressed", String(on));
  fullscreen.setAttribute("aria-label", on ? "전체 화면 끝내기 (F)" : "전체 화면 (F)");
  immersive();
  fit();
};
const toggleFullscreen = async () => {
  if (filled) return setFilled(false);
  if (document.fullscreenElement) return document.exitFullscreen();
  if (document.fullscreenEnabled && shell.requestFullscreen) {
    try {
      await shell.requestFullscreen({ navigationUI: "hide" });
      if (touch) await screen.orientation?.lock?.("landscape").catch(() => {});
      return;
    } catch { /* fall back to filling the window */ }
  }
  if (touch) setFilled(true);
};
if (!document.fullscreenEnabled && !touch) fullscreen.hidden = true;
fullscreen.addEventListener("click", toggleFullscreen);

// Theatre mode belongs to the hub page around this one.
const theatre = $("theatre");
let theatreOn = false;
function immersive() { shell.classList.toggle("immersive", theatreOn || filled || Boolean(document.fullscreenElement)); }
if (embedded) {
  document.documentElement.classList.add("embedded");
  theatre.hidden = false;
  theatre.addEventListener("click", () => parent.postMessage({ type: "theatre" }, location.origin));
  addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.data?.type !== "theatre") return;
    theatreOn = Boolean(event.data.on);
    theatre.setAttribute("aria-pressed", String(theatreOn));
    theatre.setAttribute("aria-label", theatreOn ? "극장 모드 끝내기 (T)" : "극장 모드 (T)");
    immersive();
  });
  parent.postMessage({ type: "hello" }, location.origin);
  parent.postMessage({ type: "pad", on: false }, location.origin);
}
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) screen.orientation?.unlock?.();
  showFullscreenState();
});
addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === "KeyF") toggleFullscreen();
  if (event.code === "KeyT" && embedded) parent.postMessage({ type: "theatre" }, location.origin);
  if (event.code === "Escape" && filled) setFilled(false);
});

// While immersed, the bar and cursor rest after 2.5 s without the pointer moving.
let idleTimer = 0;
const wake = () => {
  shell.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => shell.classList.add("idle"), 2500);
};
addEventListener("pointermove", wake);
addEventListener("pointerdown", wake);
wake();
fit();
