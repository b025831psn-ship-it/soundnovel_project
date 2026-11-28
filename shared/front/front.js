// The hub's front page: the pension at night, the weather of this visit, and the song of the
// greeting / name screen. The picture and the song come from the PS1 port's own data, drawn and played by
// the port's code (picture-view.js, music-view.js); nothing is copied out of the game.
// The picture and the song load apart: if one fails on a browser, the other still comes.
const pictureModule = import("/ports/kamaitachi-ps1/src/picture-view.js");
const musicModule = import("/ports/kamaitachi-ps1/src/music-view.js?v=8");

const DATA = "/kamaitachi-ps1-kor/port-data/machine/";
const PICTURE = 2; // the pension at the end of the snowy road, windows lit

const front = document.querySelector("#front");
const picture = front.querySelector(".front-picture");
const sky = front.querySelector(".front-sky");
const snow = front.querySelector(".front-snow");
const sound = front.querySelector(".front-sound");
const enter = front.querySelector(".front-enter");

// Night only, as the game shows the pension (태우 2026-11-28: day and dusk pictures dropped).
front.dataset.hour = "night";

// The weather of this visit, picked once: clear, light snow, snow, or a blizzard.
const forced = new URLSearchParams(location.search).get("weather");
const weathers = [["clear", .25], ["light", .3], ["snow", .3], ["blizzard", .15]];
let weather = forced;
if (!weathers.some(([w]) => w === weather)) { let r = Math.random(); weather = weathers.find(([, p]) => (r -= p) < 0)?.[0] ?? "snow"; }
front.dataset.weather = weather;

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

// Snow in three depths, drawn as soft flakes: far ones small and dim, near ones large, loose and out of
// focus; each falls with its own sway and a slow turn. How much, and how hard the wind blows, is the weather's.
(function snowfall() {
  const amount = { clear: 0, light: .35, snow: 1, blizzard: 2.4 }[weather];
  if (!amount) return;
  const wind = { light: 8, snow: 18, blizzard: 220 }[weather];
  const ctx = snow.getContext("2d"), still = matchMedia("(prefers-reduced-motion: reduce)");
  const rand = (a, b) => a + Math.random() * (b - a);
  // A flake: a few soft overlapping blobs (a clump of crystals), brightest in the middle; a blurred one for
  // the near, out-of-focus flakes.
  function sprite(size, soft) {
    const c = document.createElement("canvas"), n = Math.ceil(size * 4); c.width = c.height = n;
    const g = c.getContext("2d"), m = n / 2;
    const blobs = soft ? 1 : 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < blobs; i++) {
      const r = size * (soft ? 1.6 : rand(.45, .8)), x = m + (soft ? 0 : rand(-.5, .5) * size), y = m + (soft ? 0 : rand(-.5, .5) * size);
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, soft ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.95)");
      grad.addColorStop(soft ? .5 : .55, soft ? "rgba(240,244,252,.25)" : "rgba(246,249,255,.55)");
      grad.addColorStop(1, "rgba(235,240,250,0)");
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
    }
    return c;
  }
  const layers = [
    { share: .55, size: [1, 2.2], speed: [20, 36], alpha: [.35, .7], soft: false },
    { share: .33, size: [2.2, 4], speed: [40, 70], alpha: [.6, .95], soft: false },
    { share: .12, size: [5, 9], speed: [80, 130], alpha: [.35, .7], soft: true },
  ];
  const sprites = layers.map((l) => Array.from({ length: 12 }, (_, i) => sprite(l.size[0] + (l.size[1] - l.size[0]) * (i / 11), l.soft)));
  let flakes = [], w = 0, h = 0, ratio = 1, last = 0;
  const speedUp = weather === "blizzard" ? 2.2 : 1;
  const make = (layer, y) => {
    const li = layers.indexOf(layer), k = Math.floor(Math.random() * 12), img = sprites[li][k];
    return { layer, img, d: img.width, x: Math.random() * (w + 400) - 200, y: y ?? rand(-h, h), v: rand(...layer.speed) * speedUp,
      a: rand(...layer.alpha), phase: Math.random() * 6.28, sway: rand(.3, 1.1), drift: rand(10, 30), turn: rand(-1, 1), angle: Math.random() * 6.28, flutter: rand(.6, 1.6) };
  };
  function resize() {
    ratio = Math.min(devicePixelRatio || 1, 2); w = snow.clientWidth; h = snow.clientHeight;
    snow.width = Math.round(w * ratio); snow.height = Math.round(h * ratio);
    const count = Math.round(Math.min(1100, w * h / 2600 * amount));
    flakes = layers.flatMap((layer) => Array.from({ length: Math.round(count * layer.share) }, () => make(layer)));
  }
  function draw(dt) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
    for (const f of flakes) {
      f.phase += dt * f.sway; f.angle += dt * f.turn;
      // a flake drifts down unevenly: it slows and speeds as it rocks
      f.y += f.v * dt * (.75 + .25 * Math.sin(f.phase * f.flutter * 2));
      f.x += (wind * (.6 + f.layer.share) + Math.sin(f.phase) * f.drift) * dt;
      if (f.y - f.d > h) Object.assign(f, make(f.layer, -f.d));
      if (f.x > w + 200) f.x -= w + 400;
      ctx.globalAlpha = f.a;
      ctx.setTransform(ratio, 0, 0, ratio, f.x * ratio, f.y * ratio); ctx.rotate(f.angle);
      // seen edge-on as it turns, a flake narrows a little
      ctx.scale(1, .7 + .3 * Math.abs(Math.cos(f.angle)));
      ctx.drawImage(f.img, -f.d / 2, -f.d / 2);
    }
    ctx.globalAlpha = 1;
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
const loading = musicModule.then(({ songPlayer }) => songPlayer(DATA, { song: 8, volume: .45 })).then((m) => (music = m)).catch((e) => { fail("불러오기", e); return null; });
function showProblem() {
  let note = front.querySelector(".front-note");
  if (!note) { note = document.createElement("p"); note.className = "front-note"; front.append(note); }
  note.textContent = problem || "음악을 불러오는 중입니다";
}
function showSound() { sound.setAttribute("aria-pressed", String(Boolean(music?.sounding))); if (!problem) sound.title = music?.sounding ? "음악 끄기" : "음악 켜기"; }
// When the song cannot sound, the button says why (shown on a press of it), so the reason can be told back.
let problem = "";
function fail(step, e) { console.error("front music", step, e); problem = `음악 ${step} 실패: ${e?.name ?? ""} ${e?.message ?? e}`.trim(); sound.title = problem; sound.dataset.error = ""; }
async function begin() { try { await music.start(); } catch (e) { fail("재생", e); } }
async function play() { await loading; if (!music || music.sounding) return; await begin(); showSound(); return music.sounding; }
// Only a tap, click or key counts as a press for the browser (a swipe does not), so the song is asked for on
// each of them until it really sounds; the sound button does its own work.
const presses = ["pointerup", "touchend", "click", "keydown"];
async function wake(e) {
  if (e?.target?.closest?.(".front-sound") || !wanted || front.hidden) return;
  if (await play()) presses.forEach((t) => removeEventListener(t, wake, true));
}
presses.forEach((t) => addEventListener(t, wake, true));
sound.addEventListener("click", async (e) => {
  e.stopPropagation(); if (!music || problem) showProblem(); await loading;
  if (!music || problem) { showProblem(); if (!music) return; } else front.querySelector(".front-note")?.remove();
  if (music.sounding) { music.stop(); wanted = false; } else {
    wanted = true;
    // a browser that never answers: after 2 seconds the button says what the browser's sound is doing
    const slow = setTimeout(() => { if (!music.sounding) { problem ||= `음악이 시작되지 않습니다 (브라우저 소리 상태: ${music.state})`; showProblem(); } }, 2000);
    await begin(); clearTimeout(slow); if (problem && !music.sounding) showProblem(); else if (music.sounding) { problem = ""; front.querySelector(".front-note")?.remove(); }
  }
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
