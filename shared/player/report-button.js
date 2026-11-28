// Report button (warning sign), left of the quick-save disk: a beta tester reports a typo or a bug on the page
// they are on, and it becomes an issue in that game's private GitHub repository (POST /report,
// cloudflare/functions/_lib/report.js). Mounted with the save dialog (shared/save/sync-ui.js); PS2 calls it.
// What the port knows about the page goes along when it offers one of these (all optional):
//   globalThis.soundnovelReport = () => ({ scene, text, ...anything small })   e.g. scene id, the lines on screen
import { toolButton } from "../save/quick-save.js";

const el = (tag, props = {}, ...kids) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const k of kids) e.append(k);
  return e;
};
const SIGN = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/></svg>';
const css = `
#report-dialog{--r-line:var(--line,#343a41);--r-surface:var(--surface,#101215);--r-raised:var(--raised,#14171b);--r-text:var(--text,#d5d8dc);--r-muted:var(--muted,#8b939b);--r-accent:var(--accent,#c8333a);
  border:1px solid var(--r-line);background:var(--r-surface);color:var(--r-text);border-radius:10px;padding:18px;width:min(380px,calc(100vw - 32px));font:15px/1.5 "IBM Plex Sans KR",system-ui,sans-serif;text-align:left}
#report-dialog::backdrop{background:rgba(0,0,0,.6)}
#report-dialog h2{margin:0 0 12px;font-size:17px}
#report-dialog .row{display:flex;gap:8px}
#report-dialog button,#report-dialog textarea{border-radius:8px;border:1px solid var(--r-line);background:var(--r-raised);color:var(--r-text);font:inherit}
#report-dialog button{min-height:44px;padding:0 14px;flex:1}
#report-dialog button[aria-pressed="true"],#report-dialog button.primary{border-color:var(--r-accent);color:var(--r-accent)}
#report-dialog textarea{display:block;width:100%;box-sizing:border-box;min-height:110px;margin:10px 0;padding:10px;resize:vertical}
#report-dialog label{display:flex;gap:8px;align-items:center;color:var(--r-muted);font-size:13px;margin-bottom:12px}
#report-dialog .note{color:var(--r-muted);font-size:13px;margin:10px 0 0}
#report-dialog .warn{color:var(--r-accent);font-size:13px;margin:10px 0 0}
`;

// The game screen as a PNG: the largest canvas on the page (blank where a canvas cannot be read back).
function screenshot() {
  const canvas = [...document.querySelectorAll("canvas")].sort((a, b) => b.width * b.height - a.width * a.height)[0];
  try { return canvas ? canvas.toDataURL("image/png") : null; } catch { return null; }
}
function context(boot) {
  try { return globalThis.soundnovelReport?.() ?? boot?.reportContext?.() ?? {}; } catch { return {}; }
}

export function mountReport({ gameId, boot, fetchImpl = (...a) => fetch(...a) } = {}) {
  if (!gameId || document.getElementById("report-dialog")) return null;
  const button = toolButton({ index: 1, label: "오류 신고", svg: SIGN });
  if (!button) return null;
  if (!document.getElementById("report-css")) document.head.append(el("style", { id: "report-css", textContent: css }));
  const dialog = el("dialog", { id: "report-dialog" });
  document.body.append(dialog);
  let kind = "typo", shot = null, ctx = {}, message = "", busy = false, done = false, draft = "", withShot = true;

  async function submit() {
    if (!draft.trim()) { message = "내용을 적어 주세요."; render(); return; }
    busy = true; message = ""; render();
    try {
      const edition = new URLSearchParams(location.search).get("lang") ?? document.documentElement.lang ?? "";
      const r = await fetchImpl("/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        gameId, kind, message: draft, edition, context: ctx, screenshot: withShot ? shot : null,
        url: location.pathname + location.search, device: `${navigator.userAgent} · ${innerWidth}×${innerHeight}`,
      }) });
      if (r.ok) { done = true; draft = ""; }
      else message = r.status === 429 ? "신고가 너무 많습니다. 잠시 뒤 다시 보내 주세요." : "보내지 못했습니다. 잠시 뒤 다시 해 주세요.";
    } catch { message = "서버에 연결하지 못했습니다."; }
    busy = false; render();
  }

  function render() {
    const kids = [el("h2", { textContent: "오류 신고" })];
    if (done) {
      kids.push(el("p", { textContent: "신고가 접수됐어요. 고맙습니다!" }));
    } else {
      kids.push(el("div", { className: "row" }, ...[["typo", "오탈자"], ["bug", "버그"], ["other", "기타"]].map(([k, label]) =>
        el("button", { type: "button", textContent: label, ariaPressed: String(kind === k), onclick: () => { kind = k; render(); } }))));
      const area = el("textarea", { placeholder: "어디가 어떻게 이상한지 적어 주세요.", maxLength: 2000, value: draft });
      area.addEventListener("input", () => { draft = area.value; });
      kids.push(area);
      const box = el("input", { type: "checkbox", checked: withShot && !!shot, disabled: !shot, onchange: () => { withShot = box.checked; } });
      kids.push(el("label", {}, box, shot ? "지금 화면 사진 같이 보내기" : "화면 사진은 이 화면에서 보낼 수 없습니다"));
      kids.push(el("button", { type: "button", className: "primary", textContent: busy ? "보내는 중…" : "보내기", disabled: busy, onclick: submit }));
      kids.push(el("p", { className: "note", textContent: "지금 보고 있는 장면 정보가 함께 전달됩니다." }));
      setTimeout(() => area.focus(), 0);
    }
    if (message) kids.push(el("p", { className: "warn", role: "status", textContent: message }));
    kids.push(el("button", { type: "button", textContent: "닫기", style: "margin-top:12px;width:100%", onclick: () => dialog.close() }));
    dialog.replaceChildren(...kids);
  }

  dialog.addEventListener("keydown", (e) => { if (e.key !== "Escape") e.stopPropagation(); });
  button.addEventListener("pointerdown", (e) => e.stopPropagation());
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    shot = screenshot(); ctx = context(boot); done = false; message = ""; withShot = true;
    render(); dialog.showModal();
  });
  return { button, dialog };
}
