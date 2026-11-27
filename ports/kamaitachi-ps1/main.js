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
    const player = await startMachine({ canvas: document.getElementById("screen"), dataRoot: machineRoot, lang: query.get("lang") === "ja" ? "ja" : "ko",
      gate: (onPress) => startGate(document.getElementById("stage"), { onPress }),
      onProgress: (n) => { const el = loading(); if (el) el.textContent = `원작 데이터를 불러오는 중 ${Math.min(99, Math.floor((100 * n) / total))}%`; } });
    window.kamaitachiPs1 = player;
  } else {
    const player = await startBrowserRuntime({ canvas: document.getElementById("screen"), dataRoot, soundRoot });
    window.kamaitachiPs1 = player;
  }
} catch (error) {
  console.error(error);
  const el = loading();
  if (el) el.textContent = `원작 데이터를 불러오지 못했습니다: ${error.message}`;
}
