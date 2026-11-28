// 「새로하기 / 이어하기」 before the game starts (태우 2026-11-28), shown by startGate for every port.
// 새로하기 starts the game as it is. 이어하기 carries on from this player's save code: on a device that has
// one it goes straight on (bringing newer saves from the server first); elsewhere it asks for the 6-digit
// code (shared/save/quick-save.js loadFromCode). The tap also lets the game's sound start.
// Skipped: right after a load's reload, in debug runs (?debug=1, ?replay), PS1's ?resume=1 restart, with
// ?start=new, and in automated browsers (navigator.webdriver, ?syncServer= tests) unless ?choice=1.
import { gameFromPath, myCode, loadFromCode, wantContinue } from "../save/quick-save.js";

const css = `
#start-choice{position:absolute;inset:0;z-index:20;display:grid;place-items:center;background:rgba(5,6,8,.82);font:16px/1.5 "IBM Plex Sans KR","Noto Serif KR",system-ui,sans-serif;color:#d5d8dc}
#start-choice .box{display:flex;flex-direction:column;gap:12px;width:min(260px,80%)}
#start-choice button,#start-choice input{min-height:48px;border-radius:8px;border:1px solid #3d414b;background:rgba(20,23,27,.92);color:inherit;font:inherit;cursor:pointer}
#start-choice button.primary{border-color:#e4685c;color:#e4685c}
#start-choice input{font:600 24px/1 "IBM Plex Mono",monospace;letter-spacing:.3em;text-align:center;cursor:text}
#start-choice .note{margin:0;font-size:13px;color:#8b939b;text-align:center}
#start-choice .warn{margin:0;font-size:13px;color:#e4685c;text-align:center}
`;

export function startChoice(stage) {
  const params = new URLSearchParams(location.search);
  const gameId = gameFromPath();
  // automated runs (QA replays, port tests) go straight in unless they ask for it with ?choice=1
  const automated = (navigator.webdriver || params.has("syncServer")) && params.get("choice") !== "1";
  if (!gameId || globalThis.__snSkipChoice || automated || params.has("debug") || params.has("replay") || params.has("resume") || params.get("start") === "new") return Promise.resolve();
  const doc = stage.ownerDocument;
  if (!doc.getElementById("start-choice-css")) doc.head.append(Object.assign(doc.createElement("style"), { id: "start-choice-css", textContent: css }));
  if (getComputedStyle(stage).position === "static") stage.style.position = "relative";
  const layer = Object.assign(doc.createElement("div"), { id: "start-choice" });
  const box = Object.assign(doc.createElement("div"), { className: "box" });
  layer.append(box);
  const stop = (e) => e.stopPropagation();
  for (const t of ["pointerdown", "pointerup", "click", "touchstart", "touchend", "keydown"]) layer.addEventListener(t, stop);
  stage.append(layer);
  const btn = (text, primary, onclick) => Object.assign(doc.createElement("button"), { type: "button", textContent: text, className: primary ? "primary" : "", onclick });
  const line = (cls, text) => Object.assign(doc.createElement("p"), { className: cls, textContent: text });

  return new Promise((resolve) => {
    const done = () => { layer.remove(); resolve(); };
    let busy = false;
    const go = async (code, overwrite, warn) => {
      if (busy) return; busy = true;
      const r = await loadFromCode({ code, gameId, overwrite });
      busy = false;
      if (!r.ok) {
        if (r.reason === "server" && !overwrite) { wantContinue(gameId); return done(); } // offline: this device's own saves
        return warn(r.reason === "code" ? "없는 코드입니다. 6자리 숫자를 확인해 주세요." : r.reason === "limited" ? "시도가 너무 많습니다. 잠시 뒤 다시 해 주세요." : "서버에 연결하지 못했습니다.");
      }
      if (r.reloading) { box.replaceChildren(line("note", "불러오는 중…")); return; } // the page reloads and carries on
      if (r.empty || r.pending) wantContinue(gameId);
      if (r.empty && overwrite) return warn("이 코드에는 아직 이 작품의 저장이 없습니다.");
      done();
    };
    const menu = () => box.replaceChildren(
      btn("새로하기", false, done),
      btn("이어하기", true, () => { const code = myCode(); if (code) { box.replaceChildren(line("note", "불러오는 중…")); go(code, false, (m) => { menu(); box.append(line("warn", m)); }); } else ask(); }));
    const ask = () => {
      const input = Object.assign(doc.createElement("input"), { inputMode: "numeric", maxLength: 6, autocomplete: "off", placeholder: "000000" });
      input.setAttribute("aria-label", "세이브 코드 6자리");
      const warnLine = line("warn", "");
      const warn = (m) => { warnLine.textContent = m; };
      input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, "").slice(0, 6); });
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(input.value, true, warn); } });
      box.replaceChildren(line("note", "세이브 코드 6자리를 넣어 주세요."), input,
        btn("불러오기", true, () => go(input.value, true, warn)), btn("뒤로", false, menu), warnLine);
      setTimeout(() => input.focus(), 0);
    };
    menu();
  });
}
