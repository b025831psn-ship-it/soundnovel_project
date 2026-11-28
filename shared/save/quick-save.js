// Quick save: a disk button beside the on-screen menu (flowchart) button. 「저장」 puts the whole game's
// saves on the server and shows a 4-digit code; 「불러오기」 takes a code and carries on from that state
// on any device. Mounted by sync-ui.js for every player (PS2 calls it itself); same api as that dialog:
//   mountQuickSave({ store, gameId, boot })   boot: { canContinue(), titleActive, continueSuspended() }
// Codes: shared/save/snap.js and /v1/snap on the save server (90 days unused -> deleted).
import { saveSnap, loadSnap } from "./snap.js";

const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const k of kids) e.append(k);
  return e;
};
const DISK = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></svg>';
const css = `
.sn-tool{position:absolute;z-index:5;display:grid;place-items:center;padding:0;cursor:pointer}
.sn-tool svg{width:22px;height:22px}
#quick-save{--qs-line:var(--line,#343a41);--qs-surface:var(--surface,#101215);--qs-raised:var(--raised,#14171b);--qs-text:var(--text,#d5d8dc);--qs-muted:var(--muted,#8b939b);--qs-accent:var(--accent,#c8333a);
  border:1px solid var(--qs-line);background:var(--qs-surface);color:var(--qs-text);border-radius:10px;padding:18px;width:min(340px,calc(100vw - 32px));font:15px/1.5 "IBM Plex Sans KR",system-ui,sans-serif;text-align:left}
#quick-save::backdrop{background:rgba(0,0,0,.6)}
#quick-save h2{margin:0 0 14px;font-size:17px}
#quick-save .row{display:flex;gap:8px}
#quick-save button,#quick-save input{min-height:44px;border-radius:8px;border:1px solid var(--qs-line);background:var(--qs-raised);color:var(--qs-text);font:inherit;padding:0 14px;flex:1}
#quick-save button.primary{border-color:var(--qs-accent);color:var(--qs-accent)}
#quick-save input{font:600 24px/1 "IBM Plex Mono",monospace;letter-spacing:.3em;text-align:center;min-width:0}
#quick-save .code{font:600 40px/1 "IBM Plex Mono",monospace;letter-spacing:.25em;text-align:center;padding:12px 0 8px}
#quick-save .note{color:var(--qs-muted);font-size:13px;margin:10px 0 0}
#quick-save .warn{color:var(--qs-accent);font-size:13px;margin:10px 0 0}
#quick-save .close{margin-top:14px;width:100%}
`;
const CONTINUE = "sn-quick-continue:";

// The on-screen menu button of each player (GBA/PS1/SFC/석류: .menu-button, PS2: #menu-button).
const menuButton = () => document.querySelector("#menu-button, .menu-button");

// A button that sits left of the menu button, styled and shown like it. `index` 0 is next to it.
export function toolButton({ index = 0, label, svg }) {
  const menu = menuButton();
  if (!menu?.parentNode) return null;
  if (!document.getElementById("sn-tool-css")) document.head.append(el("style", { id: "sn-tool-css", textContent: css }));
  const button = el("button", { type: "button", className: "sn-tool", title: label, ariaLabel: label });
  button.innerHTML = svg;
  menu.parentNode.insertBefore(button, menu);
  const copy = ["width", "height", "background-color", "border-top-width", "border-top-style", "border-top-color", "border-radius", "color", "backdrop-filter", "box-shadow", "opacity", "transition"];
  const place = () => {
    const shown = menu.offsetWidth > 0 && getComputedStyle(menu).display !== "none";
    button.style.display = shown ? "" : "none";
    if (!shown) return;
    const s = getComputedStyle(menu);
    for (const p of copy) button.style.setProperty(p, s.getPropertyValue(p));
    if (Number(s.opacity) < .3) button.style.opacity = ".72"; // PS1 hides its menu button while the game has no menu
    button.style.borderWidth = s.borderTopWidth; button.style.borderStyle = s.borderTopStyle; button.style.borderColor = s.borderTopColor;
    const parent = menu.offsetParent ?? menu.parentNode;
    const right = parent.clientWidth - (menu.offsetLeft + menu.offsetWidth);
    const bottom = parent.clientHeight - (menu.offsetTop + menu.offsetHeight);
    button.style.right = `${right + (index + 1) * (menu.offsetWidth + 8)}px`;
    button.style.bottom = `${bottom}px`;
  };
  place();
  new ResizeObserver(place).observe(menu.offsetParent ?? menu.parentNode);
  new ResizeObserver(place).observe(menu);
  new MutationObserver(place).observe(menu, { attributes: true });
  // the shells fade the menu button when idle (a class on an ancestor): follow it
  new MutationObserver(place).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ["class"] });
  menu.addEventListener("transitionend", place);
  return button;
}

export function mountQuickSave({ store, gameId, boot, fetchImpl } = {}) {
  if (!store || !gameId || document.getElementById("quick-save")) return null;
  const server = () => new URLSearchParams(location.search).get("syncServer") ?? store.getMeta("syncServer")
    ?? (/^https?:$/.test(location.protocol) ? `${location.origin}/sync` : "");
  const button = toolButton({ index: 0, label: "저장 / 불러오기", svg: DISK });
  if (!button) return null;
  const dialog = el("dialog", { id: "quick-save" });
  document.body.append(dialog);
  const fx = fetchImpl ? { fetchImpl } : {};
  let view = "menu", code = "", message = "", busy = false;

  const metaKey = `snap:${gameId}`;
  async function save() {
    busy = true; message = ""; render();
    try {
      await boot?.saveNow?.();
      await store.flush();
      const got = await saveSnap({ baseUrl: server(), gameId, backup: store.exportBackup(gameId), last: store.getMeta(metaKey), ...fx });
      store.setMeta(metaKey, got);
      code = got.code; view = "saved";
    } catch (e) {
      message = e.status === 413 ? "저장 데이터가 너무 커서 올리지 못했습니다." : e.status === 429 ? "코드를 너무 많이 만들었습니다. 잠시 뒤 다시 해 주세요." : "서버에 연결하지 못했습니다.";
    }
    busy = false; render();
  }
  async function load(value) {
    busy = true; message = ""; render();
    const r = await loadSnap({ baseUrl: server(), gameId, code: value, ...fx });
    if (!r.ok) {
      message = r.reason === "code" ? "없는 코드입니다. 4자리 숫자를 확인해 주세요." : r.reason === "limited" ? "시도가 너무 많습니다. 잠시 뒤 다시 해 주세요." : "서버에 연결하지 못했습니다.";
      busy = false; render(); return;
    }
    try { store.importBackup(r.backup, { shouldOverwrite: () => true }); }
    catch { message = "저장 데이터를 읽지 못했습니다."; busy = false; render(); return; }
    await store.flush();
    try { sessionStorage.setItem(CONTINUE + gameId, "1"); } catch { /* the page still reloads with the saves */ }
    location.reload();
  }

  function render() {
    const kids = [el("h2", { textContent: "저장 / 불러오기" })];
    if (view === "menu") {
      kids.push(el("div", { className: "row" },
        el("button", { type: "button", className: "primary", textContent: busy ? "저장 중…" : "저장", disabled: busy, onclick: save }),
        el("button", { type: "button", textContent: "불러오기", disabled: busy, onclick: () => { view = "load"; message = ""; render(); } })));
      kids.push(el("p", { className: "note", textContent: "저장하면 지금 상황이 서버에 올라가고 4자리 코드가 나옵니다." }));
    } else if (view === "saved") {
      kids.push(el("div", { className: "code", textContent: code }),
        el("p", { className: "note", textContent: "다른 기기에서도 불러오기에 이 4자리를 넣으면 이 상황에서 이어집니다. 이 기기에서 다시 저장하면 같은 코드에 덮어씁니다. 90일 동안 쓰지 않으면 지워집니다." }));
    } else {
      const input = el("input", { inputMode: "numeric", maxLength: 4, autocomplete: "off", placeholder: "0000", ariaLabel: "4자리 코드" });
      input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, "").slice(0, 4); });
      input.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); load(input.value); } });
      kids.push(el("div", { className: "row" }, input,
        el("button", { type: "button", className: "primary", textContent: busy ? "불러오는 중…" : "불러오기", disabled: busy, onclick: () => load(input.value) })));
      kids.push(el("p", { className: "note", textContent: "불러오면 이 기기의 저장이 그 코드의 저장으로 바뀌고 그 상황에서 이어집니다." }));
      setTimeout(() => input.focus(), 0);
    }
    if (message) kids.push(el("p", { className: "warn", role: "status", textContent: message }));
    kids.push(el("button", { type: "button", className: "close", textContent: "닫기", onclick: () => dialog.close() }));
    dialog.replaceChildren(...kids);
  }

  // keys typed in the dialog must not reach the game
  dialog.addEventListener("keydown", (e) => { if (e.key !== "Escape") e.stopPropagation(); });
  button.addEventListener("click", (e) => { e.stopPropagation(); view = "menu"; message = ""; render(); dialog.showModal(); });
  button.addEventListener("pointerdown", (e) => e.stopPropagation());

  // After 불러오기 the page reloads; carry on from the loaded state as soon as the game can.
  let pending = false;
  try { pending = sessionStorage.getItem(CONTINUE + gameId) === "1"; sessionStorage.removeItem(CONTINUE + gameId); } catch { /* none */ }
  if (pending && boot) {
    const until = Date.now() + 30 * 60_000; // the title may come only after a logo and an opening movie (PS2)
    const tryContinue = async () => {
      if (Date.now() > until) return;
      if (boot.titleActive && boot.canContinue?.() && await boot.continueSuspended()) return;
      setTimeout(tryContinue, 300);
    };
    tryContinue();
  }
  return { button, dialog };
}
