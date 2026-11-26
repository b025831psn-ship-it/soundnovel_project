// Debug mode (태우, 2026-11-26): jump straight to any scene of the story.
//
// tools/scene-index.mjs walks every branch and lists each picture request (opcodes 04 and 05) in
// debug-scenes.json next to the script (git-ignored: it holds script text). A jump replays the
// script without a screen from the story's start, taking the recorded choices, until that request
// has run as often as recorded, then puts the live game at the next page start the way a bookmark
// load does. The panel shows only with ?debug=1.
import { VM, textKey } from "./vm.js";
import { TextWindow } from "./font.js";
import { pageState } from "./save.js";

export const STORY_ROW = 27000;
const STEP_LIMIT = 5_000_000;

// The scene loader's bookkeeping without pictures: which request is on screen and where it came from.
export class RecordingScene {
  constructor() {
    this.current = null;
    this.site = null;
    this.requested = false; // set by each request; a suppressed 04/05 (effects off) makes none
  }

  // SceneLoader.request: request = argument + 1000 * group, two cases held back in ram.pending.
  request(argument, ram) {
    this.requested = true;
    const request = argument + 1000 * ram.group;
    if ((ram.slot === 0x61 && argument === 0x4e) || (ram.slot === 0x63 && (argument === 0x51 || argument === 0x54))) {
      ram.pending = request;
      return;
    }
    this.current = request;
  }
}

// SceneLoader.resolve: the bg file and palette variant of a request.
export function resolvePicture(request) {
  let variant = Math.floor(request / 1000), image = request % 1000;
  if (image === 200 && variant) { image = 201; variant--; }
  return { image, variant };
}

// The bytes of the text run of the 00 opcode at bank:offset (VM.textBytes).
export function runBytes(banks, bank, offset) {
  const data = banks[bank];
  const bytes = [];
  let at = offset + 1;
  while (at < data.length) {
    const value = data[at++];
    if (value === 0) break;
    bytes.push(value);
    if (value > 0x80 || "nsvcC".includes(String.fromCharCode(value))) bytes.push(data[at++]);
  }
  return Uint8Array.from(bytes);
}

const PICTURE_OPCODES = new Set([0x04, 0x05]);
export const isPictureOpcode = (opcode) => PICTURE_OPCODES.has(opcode);

// Replays to `entry` (from debug-scenes.json) and returns the page state after it, or null.
export function replayTo(banks, entry, { names } = {}) {
  const scene = new RecordingScene();
  let count = 0, armed = false, state = null, steps = 0, decision = 0;
  const vm = new VM({
    banks,
    entryRow: STORY_ROW,
    scene,
    text: new TextWindow(),
    trace(event) {
      if (!isPictureOpcode(event.opcode)) return;
      const site = textKey(event.bank, event.offset);
      scene.site = site;
      if (site === entry.site && ++count === entry.occurrence) armed = true;
    },
  });
  vm.onPageStart = (bank, offset) => {
    if (armed && !state) state = { ...pageState(vm, bank, offset, names ? { names } : {}), sceneSite: scene.site };
  };
  while (!state && !vm.halted && steps < STEP_LIMIT) {
    if (vm.waiting === "choice") { vm.resume(entry.path[decision++] ?? 0); continue; }
    if (vm.waiting !== "none") { vm.resume(); continue; }
    vm.step();
    steps++;
  }
  return state;
}

const STYLE = `
.dj { position: fixed; top: 0; right: 0; bottom: 0; width: min(380px, 100vw); z-index: 45; background: #121116ee;
  color: #eee; font: 13px/1.4 "Noto Sans KR", system-ui, sans-serif; display: flex; flex-direction: column;
  border-left: 1px solid #333; transform: translateX(0); transition: transform .2s; }
.dj.closed { transform: translateX(100%); }
.dj header { display: flex; gap: 6px; padding: 10px; border-bottom: 1px solid #2a2930; align-items: center; }
.dj header input { flex: 1; min-width: 0; background: #0b0a0e; color: #fff; border: 1px solid #3a3940; border-radius: 6px; padding: 6px 8px; font: inherit; }
.dj header b { font-size: 14px; }
.dj ol { list-style: none; margin: 0; padding: 0; overflow: auto; flex: 1; }
.dj li { display: grid; grid-template-columns: 96px 1fr; gap: 8px; padding: 8px 10px; border-bottom: 1px solid #1f1e24; cursor: pointer; }
.dj li:hover, .dj li:focus { background: #1d1c23; outline: none; }
.dj li.here { background: #3a1814; }
.dj img { width: 96px; height: 64px; object-fit: cover; image-rendering: pixelated; background: #000; border-radius: 3px; }
.dj .meta { color: #9a98a3; font-size: 12px; }
.dj .line { margin-top: 2px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.dj .meta a { color: #ff8a7a; }
.dj-tab { position: fixed; right: 0; top: 40%; z-index: 46; background: #c0392b; color: #fff; border: 0; border-radius: 6px 0 0 6px;
  padding: 10px 6px; writing-mode: vertical-rl; font: 13px system-ui, sans-serif; cursor: pointer; }
.dj .status { padding: 6px 10px; color: #ffb3a7; min-height: 1em; }
`;

// The ?debug=1 panel. `game` gives scenes (the index), decode(raw) for the first line, thumb(image)
// for a picture URL, jump(entry) and current() (the site on screen).
export function openScenePanel(game) {
  document.head.append(Object.assign(document.createElement("style"), { textContent: STYLE }));
  const panel = Object.assign(document.createElement("aside"), { className: "dj closed" });
  panel.innerHTML = `<header><b>장면 이동</b><input type="search" placeholder="그림 번호·노드·대사 검색" aria-label="검색"></header>
    <div class="status"></div><ol></ol>`;
  const tab = Object.assign(document.createElement("button"), { className: "dj-tab", type: "button", textContent: "장면 이동" });
  const list = panel.querySelector("ol");
  const search = panel.querySelector("input");
  const status = panel.querySelector(".status");
  for (const type of ["keydown", "keyup"]) panel.addEventListener(type, (event) => event.stopPropagation());
  tab.addEventListener("click", () => { panel.classList.toggle("closed"); render(); });

  const rows = game.scenes.map((entry, index) => {
    const line = game.decode(entry.firstText);
    return { entry, index, line, haystack: `${entry.image} ${String(entry.image).padStart(3, "0")} n${entry.node} ${entry.site} ${line}` };
  });
  let shown = 0;
  function render() {
    if (panel.classList.contains("closed")) return;
    const query = search.value.trim();
    const here = game.current();
    const matches = rows.filter((row) => !query || (/^\d+$/.test(query)
      ? row.entry.image === Number(query) || row.entry.node === Number(query)
      : row.haystack.includes(query)));
    list.replaceChildren();
    shown = 0;
    const more = () => {
      const fragment = document.createDocumentFragment();
      for (const row of matches.slice(shown, shown + 80)) {
        const { entry } = row;
        const item = document.createElement("li");
        item.tabIndex = 0;
        if (entry.site === here) item.className = "here";
        const pic = String(entry.image).padStart(3, "0");
        const silhouettes = entry.silhouettes.length ? ` · 실루엣 ${entry.silhouettes.join(",")}` : "";
        item.innerHTML = `<img loading="lazy" alt="">
          <div><div class="meta">그림 ${pic}${entry.variant ? `-${entry.variant}` : ""} · 노드 ${entry.node}${silhouettes}
          · <a href="${game.editorLink(entry)}" target="_blank" rel="noopener">편집기</a></div><div class="line"></div></div>`;
        item.querySelector("img").src = game.thumb(entry);
        item.querySelector(".line").textContent = row.line;
        item.querySelector("a").addEventListener("click", (event) => event.stopPropagation());
        const go = async () => {
          status.textContent = "이동 중…";
          await new Promise((resolve) => setTimeout(resolve, 20));
          const ok = game.jump(entry);
          status.textContent = ok ? "" : "이 장면으로 갈 수 없어요.";
          if (ok) { panel.classList.add("closed"); }
        };
        item.addEventListener("click", go);
        item.addEventListener("keydown", (event) => { if (event.key === "Enter") go(); });
        fragment.append(item);
      }
      shown += 80;
      list.append(fragment);
    };
    more();
    list.onscroll = () => { if (list.scrollTop + list.clientHeight > list.scrollHeight - 200 && shown < matches.length) more(); };
    status.textContent = `${matches.length}개 장면`;
  }
  search.addEventListener("input", render);
  document.body.append(panel, tab);
  return { panel, render };
}
