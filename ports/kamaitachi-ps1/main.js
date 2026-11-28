import { startBrowserRuntime } from "./src/browser.js";
import { startGate } from "../../shared/player/start-gate.js";

const query = new URLSearchParams(location.search);
const privateRoot = new URL("../../kamaitachi-ps1-kor/port-data/", import.meta.url);
const dataRoot = query.get("data") || privateRoot.href;
const soundRoot = query.get("sound") || new URL("sound/", privateRoot).href;
const loading = () => document.querySelector("#loading span:last-child");

try {
  if (query.get("engine") !== "vm") { // the ported original is the default; ?engine=vm keeps the older bytecode VM
    // The ported original (src/machine.js): the user's EXE data and PAC files from ?machineData=
    const { startMachine } = await import("./src/machine-browser.js");
    const machineRoot = query.get("machineData") || new URL("machine/", privateRoot).href;
    const total = 77_000_000;
    const player = await startMachine({ canvas: document.getElementById("screen"), dataRoot: machineRoot, lang: query.get("lang") === "ja" ? "ja" : "ko", displayShift: query.get("display") === "original" ? 0 : 4, debug: query.get("debug") === "1", scene: query.get("scene") || "", resume: query.get("resume") === "1",
      gate: (onPress) => startGate(document.getElementById("stage"), { onPress }),
      onProgress: (n) => { const el = loading(); if (el) el.textContent = `원작 데이터를 불러오는 중 ${Math.min(99, Math.floor((100 * n) / total))}%`; } });
    window.kamaitachiPs1 = player;
    // The shell's save dialog, quick save and report buttons (shared/save/sync-ui.js) reaches the store and "carry on" through this.
    // Carrying on restarts the game with ?resume=1; the mark is taken off the address again, so a reload starts at the title.
    if (query.get("resume") === "1") { const u = new URL(location.href); u.searchParams.delete("resume"); history.replaceState(null, "", u); }
    const runtime = player.runtime ?? player;
    if (runtime.saveStore) {
      globalThis.soundnovelSave = { store: runtime.saveStore, gameId: "kamaitachi-ps1",
        boot: { canContinue: () => runtime.canResume(), titleActive: true, saveNow: () => runtime.saveNow(), continueSuspended: () => { const u = new URL(location.href); u.searchParams.set("resume", "1"); location.replace(u); return true; } } };
      globalThis.dispatchEvent(new Event("soundnovel-save-ready"));
    }
    globalThis.soundnovelReport = () => runtime.report(); // the report button: the scene and the lines on screen
  } else {
    const player = await startBrowserRuntime({ canvas: document.getElementById("screen"), dataRoot, soundRoot });
    window.kamaitachiPs1 = player;
  }
} catch (error) {
  console.error(error);
  const el = loading();
  if (el) el.textContent = `원작 데이터를 불러오지 못했습니다: ${error.message}`;
}
