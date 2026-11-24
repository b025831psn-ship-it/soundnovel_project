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

  // Touch buttons press the same GBA keys as the keyboard.
  for (const button of document.querySelectorAll("[data-key]")) {
    const key = button.dataset.key;
    const release = () => { input.buttons.delete(key); button.classList.remove("down"); };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
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
if (!document.fullscreenEnabled) fullscreen.hidden = true;
fullscreen.addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.querySelector(".shell").requestFullscreen?.();
});
document.addEventListener("fullscreenchange", () => {
  fullscreen.setAttribute("aria-label", document.fullscreenElement ? "전체 화면 끝내기" : "전체 화면");
  fit();
});
fit();
