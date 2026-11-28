// Beta testers' reports (shared/player/report-button.js) -> a GitHub issue in the game's private repository.
// Used by the Pages Function (functions/[[path]].js) and by serve.cjs on the PC, with their own storage:
//   handleReport(request, { token, allow(client) -> bool, putShot(id, bytes) -> url | null, fileIssue?, now })
// token: a GitHub token that may open issues in the repositories below (secret GITHUB_REPORT_TOKEN).
// fileIssue(repo, { title, body }, id) -> ok replaces GitHub (the PC without a token keeps reports in files).
export const REPOS = {
  "kamaitachi-gba": "b025831psn-ship-it/kamaitachi-gba-kor",
  "kamaitachi-ps1": "b025831psn-ship-it/kamaitachi-ps1-kor",
  "kamaitachi-sfc": "b025831psn-ship-it/kamaitachi-sfc-kor",
  "zakuro-sfc": "b025831psn-ship-it/zakuro-sfc-kor",
  "kamaitachi2-ps2": "b025831psn-ship-it/kamaitachi2-ps2-kor",
};
const KINDS = { typo: "오탈자", bug: "버그", other: "기타" };
const send = (code, body) => new Response(JSON.stringify(body), { status: code, headers: { "content-type": "application/json" } });
const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").slice(0, n);
// inside a fenced block a tester cannot close the fence or mention anyone
const fence = (s) => "```\n" + s.replace(/```/g, "ˋˋˋ") + "\n```";

export async function handleReport(request, { token, allow, putShot, fileIssue = github(token), now = Date.now } = {}) {
  if (request.method !== "POST") return send(405, { error: "method" });
  if (!token && !fileIssue.local) return send(503, { error: "reports are not set up" });
  const text = await request.text();
  if (text.length > 1_500_000) return send(413, { error: "too large" });
  let b;
  try { b = JSON.parse(text); } catch { return send(400, { error: "bad body" }); }
  const repo = REPOS[b?.gameId];
  const message = clean(b?.message, 2000).trim();
  if (!repo || !KINDS[b?.kind] || !message) return send(400, { error: "bad report" });
  const client = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? "?";
  if (!(await allow(client))) return send(429, { error: "too many reports" });

  const id = new Date(now()).toISOString().replace(/[-:]/g, "").slice(0, 15) + "-" + Math.random().toString(36).slice(2, 8);
  let shot = null;
  const png = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(String(b.screenshot ?? ""))?.[1];
  if (png && png.length < 1_400_000) {
    try { shot = await putShot(id, Uint8Array.from(atob(png), (c) => c.charCodeAt(0))); } catch { shot = null; }
  }
  const ctx = b.context && typeof b.context === "object" ? b.context : {};
  const where = clean(ctx.scene ?? ctx.page ?? "", 120);
  const lines = [
    `**종류**: ${KINDS[b.kind]}`,
    `**작품**: ${b.gameId}${b.edition ? ` (${clean(b.edition, 8)})` : ""}`,
    where && `**장면**: ${fence(where)}`,
    "", "**내용**", fence(message), "",
    ctx.text && `**화면의 글**\n${fence(clean(ctx.text, 3000))}`,
    Object.keys(ctx).length && `<details><summary>게임 상태</summary>\n\n${fence(clean(JSON.stringify(ctx, null, 1), 6000))}\n</details>`,
    shot && `**화면**: ${shot} (관리자 비밀번호로 열림)`,
    "",
    `주소: ${fence(clean(b.url, 500))}`,
    `기기: ${fence(clean(b.device, 300))}`,
    `신고 번호: ${id}`,
  ].filter((x) => x === "" || Boolean(x));
  const title = `[신고] ${KINDS[b.kind]} · ${where || clean(message.split("\n")[0], 40)}`.slice(0, 120);
  if (!(await fileIssue(repo, { title, body: lines.join("\n") }, id))) return send(502, { error: "github" });
  return send(201, { ok: true, id });
}

const github = (token) => async (repo, issue) => {
  const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json", "user-agent": "pension-spur-report", "x-github-api-version": "2022-11-28" },
    body: JSON.stringify(issue),
  });
  return r.ok;
};
