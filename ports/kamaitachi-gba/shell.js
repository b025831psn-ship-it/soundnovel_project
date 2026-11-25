// The player around the game screen: whole-number scaling, touch buttons, volume and full screen.
// It only reads window.kamaitachi (set by main.js) and never draws on the game screen.
const $ = (id) => document.getElementById(id);
const shell = $("shell");
const stage = $("stage");
const canvas = $("screen");
const store = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

// Largest whole-number scale in device pixels, so every GBA pixel is the same size.
function fit() {
  const ratio = devicePixelRatio || 1;
  // Layout size, not the on-screen box: the stage may be drawn turned a quarter (sideways full screen).
  const box = { width: stage.clientWidth, height: stage.clientHeight };
  const steps = Math.floor(Math.min((box.width * ratio) / 240, (box.height * ratio) / 160));
  const scale = steps >= 1 ? steps / ratio : Math.min(box.width / 240, box.height / 160);
  canvas.style.width = `${240 * scale}px`;
  canvas.style.height = `${160 * scale}px`;
  $("scale").textContent = steps >= 1 ? `×${steps}` : "축소";
  $("scale").title = `원본 240×160 → ${Math.round(240 * scale * ratio)}×${Math.round(160 * scale * ratio)} (정수 배율)`;
}
new ResizeObserver(fit).observe(stage);
addEventListener("resize", fit);

function whenReady(callback) {
  if (window.kamaitachi) callback(window.kamaitachi);
  else requestAnimationFrame(() => whenReady(callback));
}

whenReady(({ input, sound }) => {
  $("loading").hidden = true;
  stage.classList.add("ready");

  // The blurred scene behind the screen (the sides of a wide window) follows it a few times a second.
  const glow = $("glow").getContext("2d");
  glow.imageSmoothingEnabled = true;
  let tick = 0;
  (function follow() {
    if (tick++ % 8 === 0) glow.drawImage(canvas, 0, 0, 24, 16);
    requestAnimationFrame(follow);
  })();

  // Touch buttons press the same GBA keys as the keyboard.
  for (const button of document.querySelectorAll("[data-key]")) {
    const key = button.dataset.key;
    const release = () => { input.buttons.delete(key); button.classList.remove("down"); };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      navigator.vibrate?.(8);
      sound.resume();
      input.buttons.add(key);
      button.classList.add("down");
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) button.addEventListener(type, release);
  }
  // Tapping the screen is the A button, as most players expect on a phone.
  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    sound.resume();
    input.buttons.add("A");
    const up = () => { input.buttons.delete("A"); removeEventListener("pointerup", up); };
    addEventListener("pointerup", up);
  });

  // Game menu button: at a finished page it opens the menu (the port's API when present, else a short
  // R press); inside the game's own screens (menu, options, bookmarks, title) it is B, to go back.
  const menuButton = $("menu");
  let menuMode = "";
  const showMenuState = () => {
    const game = window.kamaitachi;
    const mode = game?.menuAvailable ? "menu" : game?.vm?.ram?.inGame && game.boot?.active && game.boot.hits?.length ? "back" : "none";
    if (mode === menuMode) return;
    menuMode = mode;
    menuButton.classList.toggle("unavailable", mode === "none");
    menuButton.classList.toggle("is-back", mode === "back");
    menuButton.setAttribute("aria-label", mode === "back" ? "뒤로 (X)" : "게임 메뉴 (S)");
    menuButton.title = mode === "back" ? "뒤로 · 취소 (X)" : "게임 메뉴 · 이동 · 저장 (S)";
  };
  addEventListener("kamaitachi:menu", showMenuState);
  (function watch() { showMenuState(); requestAnimationFrame(watch); })();
  const press = (key) => { input.buttons.add(key); setTimeout(() => input.buttons.delete(key), 100); };
  // Keep the tap on the button: the screen's own handlers (tap = A, tap to pick) must not see it.
  for (const type of ["pointerdown", "pointerup", "click"]) menuButton.addEventListener(type, (event) => event.stopPropagation());
  menuButton.addEventListener("click", () => {
    navigator.vibrate?.(8);
    sound.resume();
    if (menuMode === "back") { press("B"); return; }
    if (window.kamaitachi?.openMenu) { window.kamaitachi.openMenu(); return; }
    press("R");
  });

  // Console buttons on touch screens: off by default, since taps on the screen and this button play
  // the whole game. The choice is remembered.
  const padToggle = $("padtoggle");
  const showPad = (on) => {
    shell.classList.toggle("pad-on", on);
    padToggle.setAttribute("aria-pressed", String(on));
    padToggle.setAttribute("aria-label", on ? "게임 버튼 숨기기" : "게임 버튼 보이기");
    fit();
  };
  showPad(store.get("kamaitachi.pad", "0") === "1");
  padToggle.addEventListener("click", () => {
    const on = !shell.classList.contains("pad-on");
    store.set("kamaitachi.pad", on ? "1" : "0");
    showPad(on);
  });

  const mute = $("mute");
  const volume = $("volume");
  let muted = store.get("kamaitachi.muted", "0") === "1";
  volume.value = store.get("kamaitachi.volume", "80");
  const apply = () => {
    sound.setVolume?.(muted ? 0 : Number(volume.value) / 100);
    mute.setAttribute("aria-pressed", String(muted));
    mute.setAttribute("aria-label", muted ? "소리 켜기" : "소리 끄기");
    volume.style.setProperty("--fill", `${volume.value}%`);
  };
  mute.addEventListener("click", () => { muted = !muted; store.set("kamaitachi.muted", muted ? "1" : "0"); sound.resume(); apply(); });
  volume.addEventListener("input", () => {
    muted = Number(volume.value) === 0;
    store.set("kamaitachi.volume", volume.value);
    store.set("kamaitachi.muted", muted ? "1" : "0");
    apply();
  });
  apply();
});

const fullscreen = $("fullscreen");
const embedded = window.parent !== window;
const touch = matchMedia("(pointer: coarse)").matches;
// Full screen. Where the browser has it, phones also turn to landscape (Android Chrome), so the screen
// comes up sideways even with rotation lock on. Where it has none (iPhone Safari), the page fills the
// window itself and, held upright, draws the player a quarter turn round: turn the phone sideways
// and it reads as landscape, rotation lock or not.
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

// Drawn a quarter turn round, the screen's box on the page is turned too: give the game the tap where
// it would land on the upright screen. (Runs before the game's own handlers, which read clientX/Y.)
const turned = () => filled && innerHeight > innerWidth;
addEventListener("pointerdown", (event) => {
  if (!event.isTrusted || !turned() || event.target !== canvas) return;
  event.stopImmediatePropagation();
  event.preventDefault();
  const box = canvas.getBoundingClientRect();
  const u = (event.clientY - box.top) / box.height; // across the upright screen, left to right
  const v = (box.right - event.clientX) / box.width; // down the upright screen
  canvas.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, cancelable: true, pointerId: event.pointerId, pointerType: event.pointerType, isPrimary: event.isPrimary,
    clientX: box.left + u * box.width, clientY: box.top + v * box.height,
  }));
}, { capture: true });

// Theatre mode belongs to the hub page around this one: ask it, and follow what it says.
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
addEventListener("resize", () => { if (filled) fit(); });

// T and F are not GBA keys, so they never reach the game.
addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === "KeyF") toggleFullscreen();
  if (event.code === "KeyT" && embedded) parent.postMessage({ type: "theatre" }, location.origin);
  if (event.code === "Escape" && filled) setFilled(false);
  if (event.code === "Escape" && embedded && theatreOn && !document.fullscreenElement) parent.postMessage({ type: "theatre", on: false }, location.origin);
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
