// Save and sync dialog for a port's player: passcode, devices, conflicts, backup file, carry on.
// Same dialog as the Kamaitachi Advance one (ports/kamaitachi-gba/sync-ui.js), for any port:
//   const ui = await mountSyncUi({ api: { store, gameId, boot } });
//   await ui.initial;   // the first sync after opening (resolves at once when no device is linked)
// It adds a bottom-bar button before #fullscreen. `boot` (optional) carries the web suspend:
//   { canContinue(), titleActive, continueSuspended(), continueLabel?, continueNote?, notice? }
import { deriveKeys, SyncClient, startPairing, claimPairing, renewPairing, newSecret } from "./sync.js";
import { mountQuickSave } from "./quick-save.js";

const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const k of kids) e.append(k);
  return e;
};
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const css = `
#save-dialog{border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:10px;padding:0;width:min(440px,calc(100vw - 32px));max-height:calc(100vh - 32px);font:15px/1.5 "IBM Plex Sans KR",sans-serif}
#save-dialog::backdrop{background:rgba(0,0,0,.6)}
#save-dialog form{display:flex;flex-direction:column;gap:14px;padding:18px;overflow:auto;max-height:calc(100vh - 34px)}
#save-dialog h2{margin:0;font-size:17px}
#save-dialog h3{margin:0 0 6px;font-size:14px;color:var(--muted);font-weight:500}
#save-dialog .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#save-dialog button,#save-dialog input{min-height:44px;border-radius:8px;border:1px solid var(--line);background:var(--raised);color:var(--text);font:inherit;padding:0 14px}
#save-dialog button.primary{border-color:var(--accent);color:var(--accent)}
#save-dialog input{flex:1;min-width:0}
#save-dialog .code{font:600 28px/1 "IBM Plex Mono",monospace;letter-spacing:.2em;padding:10px 0}
#save-dialog .note{color:var(--muted);font-size:13px}
#save-dialog .warn{color:var(--accent);font-size:13px}
#save-dot{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--accent)}
`;

function ready() {
  return new Promise((resolve) => {
    if (globalThis.soundnovelSave) return resolve(globalThis.soundnovelSave);
    addEventListener("soundnovel-save-ready", () => resolve(globalThis.soundnovelSave), { once: true });
  });
}

let mounted = false;
export async function mountSyncUi({ api = ready(), fetchImpl, initialTimeoutMs = 4000 } = {}) {
  mounted = true;
  const { store, boot, gameId: GAME } = await api;
  mountQuickSave({ store, gameId: GAME, boot, fetchImpl });
  document.head.append(el("style", { textContent: css }));
  const dialog = el("dialog", { id: "save-dialog" });
  const button = el("button", { className: "icon", type: "button", title: "저장 동기화", ariaLabel: "저장 동기화" });
  button.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17 18z"/></svg>';
  button.style.position = "relative";
  const anchor = document.querySelector("#fullscreen");
  anchor?.parentNode ? anchor.parentNode.insertBefore(button, anchor) : document.body.append(button);
  document.body.append(dialog);

  let client = null;
  let busy = "";
  let message = "";
  let last = null;
  let pass = store.getMeta("passcode") ?? null;

  // Default: the hub's own origin under /sync (serve.cjs forwards it to the save server), so a phone that
// opens the hub reaches the same server. ?syncServer= or the dialog's address field override it.
  const server = () => new URLSearchParams(location.search).get("syncServer") ?? store.getMeta("syncServer")
    ?? (/^https?:$/.test(location.protocol) ? `${location.origin}/sync` : "");

  async function connect(secret) {
    const keys = await deriveKeys(secret);
    client = new SyncClient({ store, baseUrl: server(), keys, ...(fetchImpl ? { fetchImpl } : {}) });
    store.setMeta("vaultSecret", b64(secret));
    return keys;
  }

  // One sync at a time: two overlapping runs would push the same slot twice from the same base
  // revision and the second would come back as a conflict with this device's own save.
  let running = null, again = false;
  function sync() {
    if (running) { again = true; return running; }
    running = (async () => {
      let r;
      do { again = false; r = await syncOnce(); } while (again && client);
      running = null;
      return r;
    })();
    return running;
  }

  async function syncOnce() {
    if (!client) return null;
    try {
      const r = await client.sync();
      last = new Date();
      message = r.errors.length ? `일부 항목을 올리지 못했습니다 (${r.errors.length})` : "";
      return r;
    } catch (e) {
      message = "서버에 연결하지 못했습니다. 저장은 이 기기에 되어 있고, 연결되면 올라갑니다.";
      return null;
    } finally { paint(); }
  }

  let timer = 0;
  // At most 4 s after the first change (a game that keeps writing its bookmarks still syncs).
  const later = () => { if (!timer) timer = setTimeout(() => { timer = 0; sync(); }, 4000); };
  store.subscribe((ev) => { if (ev.type === "dirty") later(); if (ev.type === "conflict" || ev.type === "error") paint(); });
  addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sync(); });
  addEventListener("online", () => sync());

  const saved = store.getMeta("vaultSecret");
  let initial = Promise.resolve(null);
  if (saved && server()) {
    await connect(unb64(saved));
    initial = Promise.race([sync(), new Promise((r) => setTimeout(() => r(null), initialTimeoutMs))]);
  }

  function paint() {
    const bad = store.status !== "persistent" || store.conflicts.size > 0;
    button.querySelector("#save-dot")?.remove();
    if (bad) button.append(el("span", { id: "save-dot" }));
    if (!dialog.open) return;
    render();
  }

  function render() {
    const form = el("form", { method: "dialog" });
    form.append(el("h2", { textContent: "저장과 기기 연결" }));
    if (store.status !== "persistent") {
      form.append(el("p", { className: "warn", textContent: store.status === "memory"
        ? "이 브라우저는 저장 공간을 쓸 수 없어 창을 닫으면 저장이 사라집니다 (사생활 보호 모드일 수 있습니다)."
        : "저장 공간에 쓰지 못했습니다. 아래 백업 파일로 내보내 두세요." }));
    }
    if (!server()) {
      const url = el("input", { placeholder: "동기화 서버 주소", value: "" });
      form.append(section("동기화 서버", url, el("button", { type: "button", textContent: "저장", onclick: () => { store.setMeta("syncServer", url.value.trim()); location.reload(); } })));
    } else if (!client) {
      const input = el("input", { placeholder: "패스코드 4자", maxLength: 6, autocapitalize: "characters", autocomplete: "off" });
      form.append(section("처음이면", el("button", { type: "button", className: "primary", textContent: "이 기기로 시작하기", disabled: !!busy, onclick: async () => {
        busy = "start"; paint();
        try {
          const secret = newSecret();
          const keys = await connect(secret);
          await client.ensureVault(); // a passcode can only be registered by an existing vault
          const p = await startPairing(secret, { baseUrl: server(), authToken: keys.authToken, vaultId: keys.vaultId, ...(fetchImpl ? { fetchImpl } : {}) });
          pass = p.code; store.setMeta("passcode", pass);
          await sync();
        } catch { message = "시작하지 못했습니다. 서버 주소를 확인하세요."; client = null; }
        busy = ""; paint();
      } })));
      form.append(section("다른 기기에서 쓰던 세이브가 있으면", input, el("button", { type: "button", textContent: "연결", disabled: !!busy, onclick: async () => {
        busy = "join"; paint();
        const r = await claimPairing(input.value, { baseUrl: server(), ...(fetchImpl ? { fetchImpl } : {}) });
        if (!r.ok) message = r.reason === "limited" ? "시도가 너무 많습니다. 잠시 뒤 다시 해 주세요." : "패스코드가 맞지 않습니다.";
        else { await connect(r.secret); pass = input.value.trim().toUpperCase(); store.setMeta("passcode", pass); message = ""; await sync(); }
        busy = ""; paint();
      } })));
    } else {
      form.append(section("내 패스코드", el("div", { className: "code", textContent: pass ?? "----" }),
        el("p", { className: "note", textContent: "다른 기기에서 이 코드를 입력하면 같은 세이브가 열립니다. 남에게 알려 주지 마세요." }),
        el("button", { type: "button", textContent: "새로 만들기", onclick: async () => {
          const keys = await deriveKeys(unb64(store.getMeta("vaultSecret")));
          try { const p = await renewPairing(unb64(store.getMeta("vaultSecret")), pass, { baseUrl: server(), authToken: keys.authToken, vaultId: keys.vaultId, ...(fetchImpl ? { fetchImpl } : {}) }); pass = p.code; store.setMeta("passcode", pass); }
          catch { message = "새 패스코드를 만들지 못했습니다."; }
          paint();
        } })));
      form.append(section("동기화", el("button", { type: "button", className: "primary", textContent: busy === "sync" ? "동기화 중…" : "지금 동기화", onclick: async () => { busy = "sync"; paint(); await sync(); busy = ""; paint(); } }),
        el("span", { className: "note", textContent: last ? `마지막: ${last.toLocaleTimeString("ko-KR")}` : "" })));
    }
    for (const [key, remote] of store.conflicts) {
      const [, slot] = key.split("\u0000");
      const local = store.saves.get(key);
      form.append(section(`두 기기가 서로 다르게 저장했습니다 (${slot})`,
        el("p", { className: "note", textContent: `이 기기: ${local?.savedAt?.slice(0, 16).replace("T", " ") ?? "-"} / 다른 기기: ${remote.savedAt.slice(0, 16).replace("T", " ")}` }),
        el("button", { type: "button", textContent: "이 기기 것 쓰기", onclick: () => { store.resolveConflict(key, "local"); sync(); paint(); } }),
        el("button", { type: "button", textContent: "다른 기기 것 쓰기", onclick: () => { store.resolveConflict(key, "remote"); paint(); } })));
    }
    if (boot) {
      const can = boot.canContinue?.();
      form.append(section("이어하기", el("button", { type: "button", disabled: !(can && boot.titleActive), textContent: boot.continueLabel ?? "마지막 페이지에서 이어하기", onclick: async () => { if (await boot.continueSuspended()) dialog.close(); } }),
        el("p", { className: "note", textContent: can ? ((typeof boot.continueNote === "function" ? boot.continueNote() : boot.continueNote) ?? "타이틀 화면에서만 쓸 수 있습니다.") : "이어할 저장이 없습니다." })));
      const notice = boot.notice?.();
      if (notice) form.append(el("p", { className: "note", textContent: notice }));
    }
    const file = el("input", { type: "file", accept: ".snsave,application/json", hidden: true, onchange: async () => {
      try { const r = store.importBackup(JSON.parse(await file.files[0].text())); message = `가져옴 ${r.imported}, 건너뜀 ${r.skipped}, 잘못됨 ${r.invalid}`; }
      catch { message = "백업 파일을 읽지 못했습니다."; }
      later(); paint();
    } });
    form.append(section("백업 파일", el("button", { type: "button", textContent: "내보내기", onclick: () => {
      const blob = new Blob([JSON.stringify(store.exportBackup(GAME))], { type: "application/json" });
      const a = el("a", { href: URL.createObjectURL(blob), download: `soundnovel-${GAME}.snsave` }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } }), el("button", { type: "button", textContent: "가져오기", onclick: () => file.click() }), file));
    if (message) form.append(el("p", { className: "warn", role: "status", textContent: message }));
    form.append(el("button", { type: "submit", textContent: "닫기" }));
    dialog.replaceChildren(form);
  }

  function section(title, ...kids) {
    const s = el("div"); s.append(el("h3", { textContent: title }));
    const row = el("div", { className: "row" });
    for (const k of kids) (k instanceof HTMLParagraphElement || k.className === "code" ? s : row).append(k);
    s.append(row); return s;
  }

  button.addEventListener("click", () => { render(); dialog.showModal(); });
  paint();
  const open = () => { if (!dialog.open) { render(); dialog.showModal(); } };
  return { dialog, button, sync, initial, paint, open };
}

// Pages that load this file with a <script type="module"> (GBA, PS1, 석류의 맛) get the dialog once the
// player announces its store (soundnovel-save-ready); a player that calls mountSyncUi itself is left alone.
if (typeof document !== "undefined" && !globalThis.__noAutoMountSyncUi) ready().then((api) => { if (!mounted) mountSyncUi({ api }); });
