import { startBrowserRuntime } from "./src/browser.js";

const query = new URLSearchParams(location.search);
const privateRoot = new URL("../../kamaitachi-ps1-kor/port-data/", import.meta.url);
const dataRoot = query.get("data") || privateRoot.href;
const soundRoot = query.get("sound") || new URL("sound/", privateRoot).href;

try {
  const player = await startBrowserRuntime({ canvas: document.getElementById("screen"), dataRoot, soundRoot });
  window.kamaitachiPs1 = player;
} catch (error) {
  console.error(error);
  const loading = document.querySelector("#loading span:last-child");
  if (loading) loading.textContent = `원작 데이터를 불러오지 못했습니다: ${error.message}`;
}
