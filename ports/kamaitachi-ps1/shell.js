// The player around the PlayStation screen, on the GBA player's pattern (태우 2026-11-25: every port
// by touch, no pad): whole-number scaling, a tap = ○, choices tapped directly, the corner button =
// the game's menu or × inside its screens, volume, full screen, theatre mode. It never draws on the
// game screen. The game (main.js) publishes window.kamaitachiPs1 = { runtime, sound } where
//   runtime.input.pulse(name)            "confirm" | "cancel" | "menu" | "up" | "down" | "left" | "right"
//   runtime.touchRows() / cursorIndex() / moveCursor(n)   the retail renderer's tap rows (320x240)
//   runtime.menuMode?.()                  "menu" | "back" | "none" (what the corner button does now)
//   sound.resume() / sound.setVolume?.(0..1)
// (the contract of src/touch-shell.js, Claude-PS1 / Codex).
const W = 320, H = 240;
const $ = (id) => document.getElementById(id);
const shell = $("shell");
const stage = $("stage");
const canvas = $("screen");
const embedded = window.parent !== window;
const touch = matchMedia("(pointer: coarse)").matches;
const store = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

// Largest whole-number scale in device pixels, so every PlayStation pixel is the same size.
function fit() {
  const ratio = devicePixelRatio || 1;
  const box = { width: stage.clientWidth, height: stage.clientHeight };
  const steps = Math.floor(Math.min((box.width * ratio) / W, (box.height * ratio) / H));
  const scale = steps >= 1 ? steps / ratio : Math.min(box.width / W, box.height / H);
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
  $("scale").textContent = steps >= 1 ? `×${steps}` : "축소";
  $("scale").title = `원본 ${W}×${H} → ${Math.round(W * scale * ratio)}×${Math.round(H * scale * ratio)} (정수 배율)`;
}
new ResizeObserver(fit).observe(stage);
addEventListener("resize", fit);

function whenReady(callback) {
  if (window.kamaitachiPs1?.runtime) callback(window.kamaitachiPs1);
  else requestAnimationFrame(() => whenReady(callback));
}

// Tap rows from the retail renderer in native coordinates; a tap elsewhere is ○.
function nativePoint(event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(W - 1, Math.floor(((event.clientX - box.left) * W) / box.width))),
    y: Math.max(0, Math.min(H - 1, Math.floor(((event.clientY - box.top) * H) / box.height))),
  };
}
function routeTouch(runtime, x, y) {
  const hit = (runtime.touchRows?.() || []).find((row) => x >= row.left && x < row.right && y >= row.top && y < row.bottom);
  if (!hit) return runtime.input.pulse("confirm");
  const current = runtime.cursorIndex();
  if (hit.index === current) runtime.input.pulse("confirm");
  else runtime.moveCursor(hit.index - current);
}

whenReady(({ runtime, sound }) => {
  $("loading").hidden = true;
  stage.classList.add("ready");
  const resume = () => sound?.resume?.();
  // iPhone Safari starts audio only at the end of a touch: wake it on those too.
  for (const type of ["touchend", "click", "keydown"]) addEventListener(type, resume, { capture: true, passive: true });

  // A tap is ○ or a row; on screens that scroll (the flowchart, the backlog) a drag moves the
  // view the way the finger goes: every 14 screen pixels press the pad the other way once.
  const DRAG = 14;
  let drag = null;
  canvas.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    event.preventDefault();
    resume();
    const point = nativePoint(event), dragKeys = runtime.dragKeys?.() ?? [];
    if (!dragKeys.length) { routeTouch(runtime, point.x, point.y); return; }
    drag = { id: event.pointerId, x: point.x, y: point.y, from: point, moved: false, keys: dragKeys };
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const { x, y } = nativePoint(event);
    const step = (delta, back, forward) => {
      const n = Math.trunc(delta / DRAG); if (!n) return 0;
      const key = n > 0 ? back : forward;
      if (drag.keys.includes(key)) runtime.pressSteps(key, Math.abs(n));
      drag.moved = true; return n * DRAG;
    };
    drag.y += step(y - drag.y, "up", "down");
    drag.x += step(x - drag.x, "left", "right");
  });
  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (!d.moved && event.type === "pointerup") routeTouch(runtime, d.from.x, d.from.y);
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  addEventListener("keydown", (event) => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const input = { Enter: "confirm", " ": "confirm", z: "confirm", Escape: "cancel", x: "cancel", s: "menu",
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[event.key];
    if (!input || (input === "cancel" && event.key === "Escape" && filled)) return;
    event.preventDefault();
    resume();
    runtime.input.pulse(input);
  });

  // The blurred scene behind the screen (the sides of a wide window), eased toward each picture.
  const glow = $("glow").getContext("2d");
  glow.imageSmoothingEnabled = true;
  let tick = 0;
  (function follow() {
    if (tick++ % 4 === 0) { glow.globalAlpha = 0.25; glow.drawImage(canvas, 0, 0, 32, 24); }
    requestAnimationFrame(follow);
  })();

  // Corner button: the game's menu, or × inside the game's own screens.
  const menuButton = $("menu");
  let menuMode = "";
  (function watch() {
    const mode = runtime.menuMode?.() ?? "none";
    if (mode !== menuMode) {
      menuMode = mode;
      menuButton.classList.toggle("unavailable", mode === "none");
      menuButton.classList.toggle("is-back", mode === "back");
      menuButton.setAttribute("aria-label", mode === "back" ? "뒤로 (X)" : "게임 메뉴 (S)");
      menuButton.title = mode === "back" ? "뒤로 · 취소 (X)" : "게임 메뉴 (S)";
    }
    requestAnimationFrame(watch);
  })();
  for (const type of ["pointerdown", "pointerup", "click"]) menuButton.addEventListener(type, (event) => event.stopPropagation());
  menuButton.addEventListener("click", () => {
    navigator.vibrate?.(8);
    resume();
    runtime.input.pulse(menuMode === "back" ? "cancel" : "menu");
  });
  if (embedded) parent.postMessage({ type: "pad", on: false }, location.origin);

  const mute = $("mute");
  const volume = $("volume");
  let muted = store.get("kamaitachi-ps1.muted", "0") === "1";
  volume.value = store.get("kamaitachi-ps1.volume", "80");
  const apply = () => {
    sound?.setVolume?.(muted ? 0 : Number(volume.value) / 100);
    mute.setAttribute("aria-pressed", String(muted));
    mute.setAttribute("aria-label", muted ? "소리 켜기" : "소리 끄기");
    volume.style.setProperty("--fill", `${volume.value}%`);
  };
  mute.addEventListener("click", () => { muted = !muted; store.set("kamaitachi-ps1.muted", muted ? "1" : "0"); resume(); apply(); });
  volume.addEventListener("input", () => {
    muted = Number(volume.value) === 0;
    store.set("kamaitachi-ps1.volume", volume.value);
    store.set("kamaitachi-ps1.muted", muted ? "1" : "0");
    apply();
  });
  apply();
});

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

// Drawn a quarter turn round: give the game the tap where it lands on the upright screen.
const turned = () => filled && innerHeight > innerWidth;
addEventListener("pointerdown", (event) => {
  if (!event.isTrusted || !turned() || event.target !== canvas) return;
  event.stopImmediatePropagation();
  event.preventDefault();
  const box = canvas.getBoundingClientRect();
  const u = (event.clientY - box.top) / box.height;
  const v = (box.right - event.clientX) / box.width;
  canvas.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, cancelable: true, pointerId: event.pointerId, pointerType: event.pointerType, isPrimary: event.isPrimary,
    clientX: box.left + u * box.width, clientY: box.top + v * box.height,
  }));
}, { capture: true });

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
