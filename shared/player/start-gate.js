// The one start screen every port shows (GBA, PS1, SFC, Zakuro, PS2 ...): once the original data
// has loaded, a single "눌러서 시작" button sits in the middle of the stage. Browsers let sound start
// only inside a tap or key press, so the game is switched on from that press and the original's
// first sound (boot jingle, opening movie) is heard. Same markup, look and text in every port:
// do not copy it into a port, import it.
//
//   import { startGate } from "../../shared/player/start-gate.js";
//   await startGate(stage, { onPress: () => sound.resume() });   // onPress runs inside the gesture
//
// Any tap or click on the game screen, or any key except F (fullscreen) and modifier combinations, starts.
const STYLE = `
.sn-start { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 20;
  padding: 14px 28px; border: 1px solid var(--accent, #e4685c); border-radius: 999px;
  background: rgba(8, 9, 11, .72); color: var(--text, #ece8e1); font: 500 15px/1.2 "IBM Plex Sans KR", system-ui, sans-serif;
  letter-spacing: .04em; cursor: pointer; white-space: nowrap; }
.sn-start:hover, .sn-start:focus-visible { background: rgba(228, 104, 92, .16); outline: none; }
.sn-start[hidden] { display: none; }`;

function addStyle(doc) {
  if (doc.getElementById("sn-start-style")) return;
  const style = doc.createElement("style");
  style.id = "sn-start-style"; style.textContent = STYLE;
  doc.head.appendChild(style);
}

export function startGate(stage, { onPress = null, label = "눌러서 시작" } = {}) {
  const doc = stage.ownerDocument;
  addStyle(doc);
  const loading = doc.getElementById("loading");
  if (loading) loading.hidden = true;
  if (getComputedStyle(stage).position === "static") stage.style.position = "relative";
  const button = doc.createElement("button");
  button.type = "button"; button.className = "sn-start"; button.id = "start"; button.textContent = label;
  stage.appendChild(button);
  return new Promise((resolve) => {
    const win = doc.defaultView;
    const go = (event) => {
      if (event.type === "click" && !stage.contains(event.target)) return; // the bar's own buttons still work
      if (event.type === "keydown" && (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.code === "KeyF")) return;
      event.preventDefault?.(); event.stopPropagation?.();
      win.removeEventListener("click", go, true); win.removeEventListener("keydown", go, true);
      button.remove();
      try { onPress?.(); } catch (error) { console.error(error); }
      resolve();
    };
    // the press that starts the game is not also a tap or key for the game itself
    win.addEventListener("click", go, true);
    win.addEventListener("keydown", go, true);
  });
}
