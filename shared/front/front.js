// The hub's front page: the pension at the visitor's hour, the weather of this visit, and the song of the
// greeting / name screen. The picture and the song come from the PS1 port's own data, drawn and played by
// the port's code (picture-view.js, music-view.js); nothing is copied out of the game.
// The picture and the song load apart: if one fails on a browser, the other still comes.
const pictureModule = import("/ports/kamaitachi-ps1/src/picture-view.js");
const musicModule = import("/ports/kamaitachi-ps1/src/music-view.js?v=5");

const DATA = "/kamaitachi-ps1-kor/port-data/machine/";
const PICTURE = 2; // the pension at the end of the snowy road, windows lit

const front = document.querySelector("#front");
const picture = front.querySelector(".front-picture");
const sky = front.querySelector(".front-sky");
const snow = front.querySelector(".front-snow");
const sound = front.querySelector(".front-sound");
const enter = front.querySelector(".front-enter");

// The hour: day, dusk or night, from the visitor's own clock; checked again each minute.
function hourClass(h) { return h >= 7 && h < 16 ? "day" : (h >= 5 && h < 7) || (h >= 16 && h < 19) ? "dusk" : "night"; }
function setHour() {
  const cls = hourClass(new Date().getHours());
  front.dataset.hour = cls;
}
setHour(); setInterval(setHour, 60000);

// The weather of this visit, picked once: clear, light snow, snow, or a blizzard.
const forced = new URLSearchParams(location.search).get("weather");
const weathers = [["clear", .25], ["light", .3], ["snow", .3], ["blizzard", .15]];
let weather = forced;
if (!weathers.some(([w]) => w === weather)) { let r = Math.random(); weather = weathers.find(([, p]) => (r -= p) < 0)?.[0] ?? "snow"; }
front.dataset.weather = weather;
const forcedHour = new URLSearchParams(location.search).get("hour");
if (["day", "dusk", "night"].includes(forcedHour)) { front.dataset.hour = forcedHour; }

// A sharper copy of the same picture (AI 4x with the original texture laid back, made on the PC, kept with
// the port data) is used when the server has it; otherwise the port draws the original 320x240.
function drawSharp() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { picture.width = img.naturalWidth; picture.height = img.naturalHeight; picture.getContext("2d").drawImage(img, 0, 0); picture.classList.add("sharp"); resolve(); };
    img.onerror = reject; img.src = DATA + "front-pension.png";
  });
}
drawSharp().catch(() => pictureModule.then(({ drawPicture }) => drawPicture(picture, DATA, PICTURE))).then(() => front.classList.add("ready")).catch((e) => { console.error("front picture", e); front.classList.add("ready", "no-picture"); });

// Snow in three depths; how much and how hard the wind blows depends on the weather.
(function snowfall() {
  const amount = { clear: 0, light: .35, snow: 1, blizzard: 2.4 }[weather];
  if (!amount) return;
  const wind = { light: 8, snow: 18, blizzard: 220 }[weather];
  const ctx = snow.getContext("2d"), still = matchMedia("(prefers-reduced-motion: reduce)");
  const layers = [
    { share: .55, size: [.8, 2], speed: [22, 40], alpha: [.4, .75], blur: 0 },
    { share: .33, size: [2, 3.4], speed: [45, 80], alpha: [.65, .95], blur: 0 },
    { share: .12, size: [4, 7], speed: [90, 140], alpha: [.45, .8], blur: 3 },
  ];
  const rand = (a, b) => a + Math.random() * (b - a);
  let flakes = [], w = 0, h = 0, ratio = 1, last = 0;
  const speedUp = weather === "blizzard" ? 2.2 : 1;
  const make = (layer, y) => ({ layer, x: Math.random() * (w + 400) - 200, y: y ?? rand(-h, h), r: rand(...layer.size), v: rand(...layer.speed) * speedUp,
    a: rand(...layer.alpha), phase: Math.random() * 6.28, sway: rand(.4, 1.4), drift: rand(8, 26) });
  function resize() {
    ratio = Math.min(devicePixelRatio || 1, 2); w = snow.clientWidth; h = snow.clientHeight;
    snow.width = Math.round(w * ratio); snow.height = Math.round(h * ratio);
    const count = Math.round(Math.min(1100, w * h / 2600 * amount));
    flakes = layers.flatMap((layer) => Array.from({ length: Math.round(count * layer.share) }, () => make(layer)));
  }
  function draw(dt) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#f4f6fb";
    for (const f of flakes) {
      f.phase += dt * f.sway; f.y += f.v * dt; f.x += (wind * (.6 + f.layer.share) + Math.sin(f.phase) * f.drift) * dt;
      if (f.y - f.r > h) Object.assign(f, make(f.layer, -f.r * 2));
      if (f.x > w + 200) f.x -= w + 400;
      ctx.globalAlpha = f.a; ctx.shadowColor = "rgba(255,255,255,.9)"; ctx.shadowBlur = f.layer.blur;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  function tick(now) {
    const dt = Math.min((now - (last || now)) / 1000, .05); last = now;
    if (!front.hidden && !still.matches) draw(dt);
    requestAnimationFrame(tick);
  }
  new ResizeObserver(resize).observe(snow); requestAnimationFrame(tick);
})();

// The song: browsers sound only after a press, so the first tap or key anywhere starts it.
let music = null, wanted = (() => { try { return localStorage.getItem("front-music") !== "off"; } catch { return true; } })();
const loading = musicModule.then(({ songPlayer }) => songPlayer(DATA, { song: 8, volume: .45 })).then((m) => (music = m)).catch((e) => { console.error("front music", e); return null; });
function showSound() { sound.setAttribute("aria-pressed", String(Boolean(music?.sounding))); sound.title = music?.sounding ? "음악 끄기" : "음악 켜기"; }
async function play() { await loading; if (!music || music.sounding) return; await music.start(); showSound(); return music.sounding; }
// Only a tap, click or key counts as a press for the browser (a swipe does not), so the song is asked for on
// each of them until it really sounds; the sound button does its own work.
const presses = ["pointerup", "touchend", "click", "keydown"];
async function wake(e) {
  if (e?.target?.closest?.(".front-sound") || !wanted || front.hidden) return;
  if (await play()) presses.forEach((t) => removeEventListener(t, wake, true));
}
presses.forEach((t) => addEventListener(t, wake, true));
sound.addEventListener("click", async (e) => {
  e.stopPropagation(); await loading; if (!music) return;
  if (music.sounding) { music.stop(); wanted = false; } else { wanted = true; await music.start(); }
  try { localStorage.setItem("front-music", wanted ? "on" : "off"); } catch {}
  showSound();
});

// Into the hub: the front fades away; the song goes on until a game starts.
function leave() { front.classList.add("leaving"); setTimeout(() => { front.hidden = true; document.body.classList.remove("front-on"); }, 700); try { sessionStorage.setItem("front-seen", "1"); } catch {} }
enter.addEventListener("click", (e) => { e.preventDefault(); wake(); leave(); });
export function stopFrontMusic() { if (music?.playing) music.stop(); }
window.addEventListener("hashchange", () => { if (location.hash) { stopFrontMusic(); if (!front.hidden) { front.hidden = true; document.body.classList.remove("front-on"); } } });
// A link straight to a game skips the front page.
if (location.hash) { front.hidden = true; document.body.classList.remove("front-on"); }
showSound();
