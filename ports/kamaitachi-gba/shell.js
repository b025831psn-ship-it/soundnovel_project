// The player around the game screen: whole-number scaling, touch buttons, volume and full screen.
// It only reads window.kamaitachi (set by main.js) and never draws on the game screen.
const $ = (id) => document.getElementById(id);
const stage = $("stage");
const canvas = $("screen");
const store = {
  get(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

// Largest whole-number scale in device pixels, so every GBA pixel is the same size.
function fit() {
  const ratio = devicePixelRatio || 1;
  const box = stage.getBoundingClientRect();
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

  // The glow behind the screen follows its colors a few times a second.
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

  // Game menu button: the port's own API when present (main.js), else a short R press.
  const menuButton = $("menu");
  const showMenuState = (available) => menuButton.classList.toggle("unavailable", !available);
  addEventListener("kamaitachi:menu", (event) => showMenuState(event.detail.available));
  showMenuState(window.kamaitachi?.menuAvailable ?? false);
  menuButton.addEventListener("click", () => {
    navigator.vibrate?.(8);
    if (window.kamaitachi?.openMenu) { window.kamaitachi.openMenu(); return; }
    input.buttons.add("R");
    setTimeout(() => input.buttons.delete("R"), 100);
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

const shell = $("shell");
const fullscreen = $("fullscreen");
const toggleFullscreen = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else shell.requestFullscreen?.();
};
if (!document.fullscreenEnabled) fullscreen.hidden = true;
fullscreen.addEventListener("click", toggleFullscreen);

// Theatre mode belongs to the hub page around this one: ask it, and follow what it says.
const embedded = window.parent !== window;
const theatre = $("theatre");
let theatreOn = false;
const immersive = () => shell.classList.toggle("immersive", theatreOn || Boolean(document.fullscreenElement));
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
  const on = Boolean(document.fullscreenElement);
  fullscreen.setAttribute("aria-pressed", String(on));
  fullscreen.setAttribute("aria-label", on ? "전체 화면 끝내기 (F)" : "전체 화면 (F)");
  immersive();
  fit();
});

// T and F are not GBA keys, so they never reach the game.
addEventListener("keydown", (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === "KeyF") toggleFullscreen();
  if (event.code === "KeyT" && embedded) parent.postMessage({ type: "theatre" }, location.origin);
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
