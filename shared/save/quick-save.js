// Save codes (태우 2026-11-28): every player has one 6-digit code for all games. Each game's saves (the
// in-game memory card / bookmarks and the web suspend slot) go up to it by themselves after every save;
// before the game starts, 「새로하기 / 이어하기」 (start-gate.js -> startChoice) lets a player on another
// device type the code and carry on. A disk button beside the on-screen menu (flowchart) button shows the
// code, saves right now, or loads another code. Mounted by sync-ui.js for every player (PS2 calls it itself):
//   mountQuickSave({ store, gameId, boot })   boot: { canContinue(), titleActive, continueSuspended(), saveNow?() }
// Server: /v1/code in shared/save/server/server.mjs and cloudflare/functions/_lib/sync.js (90 days unused -> deleted).
import { newCode, putCode, getCode } from "./snap.js";

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
#quick-save .code{font:600 34px/1 "IBM Plex Mono",monospace;letter-spacing:.25em;text-align:center;padding:12px 0 8px}
#quick-save .note{color:var(--qs-muted);font-size:13px;margin:10px 0 0}
#quick-save .warn{color:var(--qs-accent);font-size:13px;margin:10px 0 0}
#quick-save .close{margin-top:14px;width:100%}
`;
const CONTINUE = "sn-quick-continue:";
const PENDING = "sn-code-import:";
const CODE_KEY = "sn-save-code";

export const GAMES = ["kamaitachi-gba", "kamaitachi-ps1", "kamaitachi-sfc", "zakuro-sfc", "kamaitachi2-ps2"];
export const gameFromPath = (p = location.pathname) => GAMES.find((g) => p.includes(`/${g}/`)) ?? null;
export const serverBase = () => new URLSearchParams(location.search).get("syncServer")
  ?? (/^https?:$/.test(location.protocol) ? `${location.origin}/sync` : "");
export const myCode = () => { try { return localStorage.getItem(CODE_KEY); } catch { return null; } };
const setMyCode = (c) => { try { c ? localStorage.setItem(CODE_KEY, c) : localStorage.removeItem(CODE_KEY); } catch { /* this tab only */ } };
const session = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); return true; } catch { return false; } },
  del: (k) => { try { sessionStorage.removeItem(k); } catch { /* none */ } },
};
// The game should carry on from its suspend slot as soon as it can (set by 이어하기 or after a load's reload).
export const wantContinue = (gameId) => { globalThis.__snContinue = gameId; globalThis.dispatchEvent?.(new Event("sn-continue")); };
if (typeof sessionStorage !== "undefined") {
  const g = gameFromPath?.();
  if (g && session.get(CONTINUE + g) === "1") { session.del(CONTINUE + g); globalThis.__snContinue = g; globalThis.__snSkipChoice = true; }
}

// Loads a game's saves from a code. A code typed on this device replaces its saves (overwrite); this
// device's own code only brings newer ones. With the store at hand the saves go in at once and the page
// reloads to carry on; otherwise they wait in sessionStorage for mountQuickSave. Returns { ok, reason? }.
export async function loadFromCode({ code, gameId, overwrite, fetchImpl }) {
  const r = await getCode({ baseUrl: serverBase(), code, gameId, ...(fetchImpl ? { fetchImpl } : {}) });
  if (!r.ok) return r;
  setMyCode(code);
  if (!r.backup) { wantContinue(gameId); return { ok: true, empty: true }; }
  const store = globalThis.soundnovelSave?.gameId === gameId ? globalThis.soundnovelSave.store : null;
  if (store) { await applyBackup(store, gameId, r.backup, overwrite); return { ok: true, reloading: true }; }
  if (!session.set(PENDING + gameId, JSON.stringify({ backup: r.backup, overwrite }))) return { ok: false, reason: "server" };
  return { ok: true, pending: true };
}
async function applyBackup(store, gameId, backup, overwrite) {
  store.importBackup(backup, overwrite ? { shouldOverwrite: () => true } : undefined);
  await store.flush();
  session.set(CONTINUE + gameId, "1");
  location.reload();
}


// The on-screen menu button of each player (GBA/PS1/SFC/석류: .menu-button, PS2: #menu-button).
const menuButton = () => document.querySelector("#menu-button, .menu-button");

// A button in the menu button's corner, styled and shown like it (태우 2026-11-28: left to right
// 플로우차트 / 저장 / 신고). `index` counts from the corner: 0 takes the menu button's own place, and the menu
// button moves left past all of them (CSS translate, so the port's own transform and hit tests stay).
const tools = new Set();
export function toolButton({ index = 0, label, svg }) {
  const menu = menuButton();
  if (!menu?.parentNode) return null;
  if (!document.getElementById("sn-tool-css")) document.head.append(el("style", { id: "sn-tool-css", textContent: css }));
  const button = el("button", { type: "button", className: "sn-tool", title: label, ariaLabel: label });
  button.innerHTML = svg;
  menu.parentNode.insertBefore(button, menu);
  tools.add(button);
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
    const step = menu.offsetWidth + 8;
    // A phone held sideways lays the player's bottom bar over the screen's lower right corner: lift the
    // whole row above any bar button it would sit on, so neither covers the other (2026-11-28).
    let lift = 0;
    const box = parent.getBoundingClientRect();
    const rowBottom = box.top + menu.offsetTop + menu.offsetHeight;
    const rowRight = box.left + menu.offsetLeft + menu.offsetWidth, rowLeft = rowRight - (tools.size + 1) * step;
    for (const b of document.querySelectorAll("#bar button, .bar button")) {
      if (!b.offsetWidth || b.closest(".sn-tool")) continue;
      const r = b.getBoundingClientRect();
      if (r.right > rowLeft && r.left < rowRight && r.top < rowBottom && r.bottom > rowBottom - menu.offsetHeight) lift = Math.max(lift, rowBottom - r.top + 6);
    }
    button.style.right = `${right + index * step}px`;
    button.style.bottom = `${bottom + lift}px`;
    menu.style.translate = `${-tools.size * step}px ${-lift}px`;
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
  const fx = fetchImpl ? { fetchImpl } : {};
  // saves fetched before the store was open (이어하기 on a page that opens it late, e.g. PS1)
  const pending = session.get(PENDING + gameId);
  if (pending) {
    session.del(PENDING + gameId);
    try { const { backup, overwrite } = JSON.parse(pending); applyBackup(store, gameId, backup, overwrite); return null; } catch { /* a broken stash: play on */ }
  }

  // --- every save goes up to this player's code by itself ---------------------------------------
  let timer = 0, last = 0, uploading = null, again = false, failed = "", sent = "", sentTo = "", size = 0;
  async function upload({ keepalive = false } = {}) {
    if (uploading) { again = true; return uploading; }
    uploading = (async () => {
      do {
        again = false;
        let code = myCode();
        try { if (!code) { code = await newCode({ baseUrl: serverBase(), ...fx }); setMyCode(code); } }
        catch (e) { failed = e.reason ?? "server"; break; }
        await store.flush();
        const backup = store.exportBackup(gameId);
        const text = JSON.stringify(backup.saves);
        if (text === sent && myCode() === sentTo) break; // nothing new since the last upload
        size = text.length;
        const r = await putCode({ baseUrl: serverBase(), code, gameId, backup, keepalive, ...fx });
        if (r.ok) { sent = text; sentTo = code; }
        if (!r.ok && r.reason === "code") { setMyCode(null); again = true; continue; } // expired: a new code next round
        failed = r.ok ? "" : r.reason; last = Date.now();
      } while (again);
      uploading = null;
      if (dialog.open) render();
    })();
    return uploading;
  }
  const schedule = () => {
    if (timer) return;
    // big saves (a VM state of ~180 KB) go up at most every 2 minutes while playing, small ones every 20 s;
    // leaving or hiding the page sends the latest at once
    const gap = size > 100_000 ? 120_000 : 20_000;
    timer = setTimeout(() => { timer = 0; upload(); }, Math.max(5000, gap - (Date.now() - last)));
  };
  store.subscribe((ev) => { if (ev.type === "dirty" && ev.gameId === gameId) schedule(); });
  addEventListener("pagehide", () => { if (timer) { clearTimeout(timer); timer = 0; upload({ keepalive: true }); } });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && timer) { clearTimeout(timer); timer = 0; upload({ keepalive: true }); } });

  // --- the disk button ---------------------------------------------------------------------------
  const button = toolButton({ index: 1, label: "저장 / 불러오기", svg: DISK });
  const dialog = el("dialog", { id: "quick-save" });
  document.body.append(dialog);
  let view = "menu", message = "", busy = false;

  async function saveNow() {
    busy = true; message = ""; render();
    try { await boot?.saveNow?.(); } catch { /* the slots as they are */ }
    await upload();
    busy = false;
    message = failed ? (failed === "large" ? "저장 데이터가 너무 커서 올리지 못했습니다." : failed === "limited" ? "잠시 뒤 다시 해 주세요." : "서버에 연결하지 못했습니다. 이 기기에는 저장되어 있습니다.") : "저장했습니다.";
    render();
  }
  async function load(value) {
    busy = true; message = ""; render();
    const r = await loadFromCode({ code: value, gameId, overwrite: true, ...fx });
    busy = false;
    if (!r.ok) message = r.reason === "code" ? "없는 코드입니다. 6자리 숫자를 확인해 주세요." : r.reason === "limited" ? "시도가 너무 많습니다. 잠시 뒤 다시 해 주세요." : "서버에 연결하지 못했습니다.";
    else if (r.empty) message = "이 코드에는 아직 이 작품의 저장이 없습니다. 앞으로 이 코드에 저장됩니다.";
    render();
  }

  function render() {
    const kids = [el("h2", { textContent: "저장 / 불러오기" })];
    const code = myCode();
    if (view === "menu") {
      kids.push(el("p", { className: "note", textContent: "내 세이브 코드" }),
        el("div", { className: "code", textContent: code ?? "------" }),
        el("p", { className: "note", textContent: code
          ? "게임 안에서 저장하면 이 코드에 자동으로 올라갑니다. 다른 기기에서 이어하기를 누르고 이 코드를 넣으면 이어서 할 수 있습니다. 90일 동안 쓰지 않으면 지워집니다."
          : "처음 저장할 때 코드가 만들어집니다." }));
      kids.push(el("div", { className: "row" },
        el("button", { type: "button", className: "primary", textContent: busy ? "저장 중…" : "지금 저장", disabled: busy, onclick: saveNow }),
        el("button", { type: "button", textContent: "다른 코드 불러오기", disabled: busy, onclick: () => { view = "load"; message = ""; render(); } })));
    } else {
      const input = el("input", { inputMode: "numeric", maxLength: 6, autocomplete: "off", placeholder: "000000", ariaLabel: "6자리 코드" });
      input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, "").slice(0, 6); });
      input.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); load(input.value); } });
      kids.push(el("div", { className: "row" }, input,
        el("button", { type: "button", className: "primary", textContent: busy ? "불러오는 중…" : "불러오기", disabled: busy, onclick: () => load(input.value) })));
      kids.push(el("p", { className: "note", textContent: "불러오면 이 기기의 이 작품 저장이 그 코드의 저장으로 바뀌고, 앞으로 그 코드에 저장됩니다." }));
      setTimeout(() => input.focus(), 0);
    }
    if (message) kids.push(el("p", { className: "warn", role: "status", textContent: message }));
    kids.push(el("button", { type: "button", className: "close", textContent: view === "load" ? "뒤로" : "닫기", onclick: () => { if (view === "load") { view = "menu"; message = ""; render(); } else dialog.close(); } }));
    dialog.replaceChildren(...kids);
  }

  dialog.addEventListener("keydown", (e) => { if (e.key !== "Escape") e.stopPropagation(); });
  if (button) {
    button.addEventListener("click", (e) => { e.stopPropagation(); view = "menu"; message = ""; render(); dialog.showModal(); });
    button.addEventListener("pointerdown", (e) => e.stopPropagation());
  }

  // carry on from the suspend slot as soon as the game can, when 이어하기 or a load asked for it
  const until = Date.now() + 30 * 60_000; // the title may come only after a logo and an opening movie (PS2)
  const tryContinue = async () => {
    if (Date.now() > until) return;
    if (globalThis.__snContinue === gameId && boot?.titleActive && boot.canContinue?.()) {
      if (await boot.continueSuspended()) { globalThis.__snContinue = null; return; }
    }
    if (globalThis.__snContinue === gameId) setTimeout(tryContinue, 300);
  };
  if (globalThis.__snContinue === gameId) tryContinue();
  addEventListener("sn-continue", () => tryContinue());
  return { button, dialog, upload };
}
