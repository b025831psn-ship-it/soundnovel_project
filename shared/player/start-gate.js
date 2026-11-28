// How every port (GBA, PS1, SFC, Zakuro, PS2 ...) starts: straight away, with no start button
// (태우 2026-11-28: "눌러서 시작은 없애고 바로 들어가게"). The game is switched on as soon as its
// data has loaded. Browsers let sound play only after a tap or key press, so until the first one the
// game runs silently; `onPress` runs inside every tap / key press (it should resume the audio, and is
// harmless to call again). Keep this in one place: do not give a port its own start screen.
//
//   import { startGate } from "../../shared/player/start-gate.js";
//   await startGate(stage, { onPress: () => sound.resume() });
import { startChoice } from "./start-choice.js";

// Before the game starts it asks 「새로하기 / 이어하기」 (start-choice.js; 태우 2026-11-28), whose tap also wakes the sound.
export function startGate(stage, { onPress = null } = {}) {
  const doc = stage.ownerDocument, win = doc.defaultView;
  const loading = doc.getElementById("loading");
  if (loading) loading.hidden = true;
  if (onPress) {
    const press = (event) => {
      if (event.type === "keydown" && (event.ctrlKey || event.metaKey || event.altKey)) return;
      try { onPress(); } catch (error) { console.error(error); }
    };
    // iPhone Safari starts audio only at the end of a touch (touchend / click), others on the press
    for (const type of ["pointerdown", "touchend", "click", "keydown"]) win.addEventListener(type, press, { capture: true, passive: true });
  }
  return startChoice(stage);
}
