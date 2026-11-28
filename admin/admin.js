// 펜션 슈프르 관리자: the owner's page, apart from the hub and the players. One frame for every title:
// the list of scenes and lines, the game itself in a debug run, and the editor of the line on screen.
// What differs between titles and editions lives in one adapter per edition (adapters/<edition>.js);
// see README.md. The edit box shows the text as the screen shows it: Enter is a line break, a space is
// a space, and the codes that must keep their place are locked chips. No code is typed.
//
// 작품 → 판본 → 장면 → 대사. An edition without an adapter is listed as 준비 중.
const TITLES = [
  { id: "kamaitachi", title: "카마이타치의 밤", editions: [{ id: "kamaitachi-ps1", name: "PS1", adapter: true }, { id: "kamaitachi-gba", name: "GBA", runUrl: "/ports/kamaitachi-gba/?debug=1" }, { id: "kamaitachi-sfc", name: "SFC", runUrl: "/ports/kamaitachi-sfc/?debug=1" }] },
  { id: "kamaitachi2", title: "카마이타치의 밤 2", editions: [{ id: "kamaitachi2-ps2", name: "PS2" }] },
  { id: "zakuro", title: "석류의 맛", editions: [{ id: "zakuro-sfc", name: "SFC", runUrl: "/ports/zakuro-sfc/?debug=1" }] },
  { id: "428", title: "428 ~봉쇄된 시부야에서~", editions: [{ id: "428-psp", name: "PSP" }] },
];
const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const STEP = 150; // list rows drawn at a time

let game = null, open = null, found = [], from = 0, shown = 0, onScreen = [], wanted = null;
const edition = () => TITLES.flatMap((t) => t.editions).find((e) => e.id === $("edition").value);
const dirty = () => open && !$("edit").hidden && game.text(open.id, read($("ko"))) !== game.current(open);

// parts <-> the edit box. A chip is a locked span; a break is a "\n" in the pre-wrap box.
function fill(box, parts) {
  box.replaceChildren(...parts.map((p) => (p.br ? document.createTextNode("\n") : p.chip ? el("span", { className: "chip", contentEditable: "false", textContent: game.label(p.chip) }) : document.createTextNode(p.text))));
  box.querySelectorAll(".chip").forEach((c, i) => { c.dataset.token = parts.filter((p) => p.chip)[i].chip; });
  tail(box);
}
// A last line break shows only with something after it: the box always ends with this <br>, which is not text.
function tail(box) { if (!box.lastChild?.dataset?.end) { const br = document.createElement("br"); br.dataset.end = "1"; box.append(br); } }
function read(box) {
  const parts = [], text = (s) => { for (const [i, t] of s.replace(/ /g, " ").split("\n").entries()) { if (i) parts.push({ br: true }); if (t) parts.push({ text: t }); } };
  const walk = (node) => {
    for (const n of node.childNodes) {
      if (n.nodeType === 3) text(n.data);
      else if (n.dataset?.token) parts.push({ chip: n.dataset.token });
      else if (n.nodeName === "BR") { if (!n.dataset.end) parts.push({ br: true }); }
      else { if (/^(DIV|P)$/.test(n.nodeName) && parts.length && !parts.at(-1).br) parts.push({ br: true }); walk(n); }
    }
  };
  walk(box);
  return parts;
}
const oneLine = (text) => game.readable(text).replace(/\n/g, " ") || "(글자 없음)";

// the list: lines under their scene, a window of the found lines
function row(it) {
  const button = el("button", { className: "row", type: "button" },
    el("span", { className: "meta" }, el("span", { className: "code", textContent: it.id }), ...(game.edits[it.id] ? [el("span", { className: "badge", textContent: "고침" })] : [])),
    el("span", { className: "ko", textContent: oneLine(game.current(it)) }), el("span", { className: "ja", lang: "ja", textContent: oneLine(it.ja) }));
  button.dataset.id = it.id; if (open?.id === it.id) button.setAttribute("aria-current", "true");
  button.addEventListener("click", () => { show(it.id); document.body.classList.remove("drawer"); });
  return el("li", {}, button);
}
function draw(more) {
  const list = $("list"); if (!more) { list.replaceChildren(); shown = 0; }
  list.querySelector(".more")?.remove();
  let scene = more ? game.scene(found[from + shown - 1]?.id ?? "") : null;
  if (!more && from) list.append(el("li", { className: "more" }, Object.assign(el("button", { className: "btn quiet", type: "button", textContent: "앞의 대사 보기" }), { onclick: () => { from = Math.max(0, from - STEP); draw(); } })));
  for (const it of found.slice(from + shown, from + shown + STEP)) {
    if (game.scene(it.id) !== scene) { scene = game.scene(it.id); list.append(el("li", { className: "scene", textContent: game.sceneName(scene) })); }
    list.append(row(it)); shown++;
  }
  if (from + shown < found.length) list.append(el("li", { className: "more" }, Object.assign(el("button", { className: "btn quiet", type: "button", textContent: "더 보기" }), { onclick: () => draw(true) })));
}
function search() {
  const q = $("q").value.trim().toLowerCase(), only = $("edited").checked;
  found = game.items.filter((it) => (!only || game.edits[it.id]) && (!q || it.id.includes(q) || it.ja.toLowerCase().includes(q) || game.readable(game.current(it)).toLowerCase().includes(q)));
  $("count").textContent = `${found.length.toLocaleString()}개 · 고침 ${Object.keys(game.edits).length}`;
  from = 0; reveal(false);
}
// the open line in the list: drawn if the window does not hold it, and marked
function reveal(scroll = true) {
  const at = open ? found.indexOf(open) : -1;
  if (at >= 0 && (at < from || at >= from + shown)) from = Math.max(0, at - 8);
  if (at < 0 || !$("list").querySelector(`[data-id="${open.id}"]`)) draw();
  for (const b of $("list").querySelectorAll(".row")) b.toggleAttribute("aria-current", b.dataset.id === open?.id), b.getAttribute("aria-current") === "" && b.setAttribute("aria-current", "true");
  if (scroll) $("list").querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
}

function review() {
  const text = game.text(open.id, read($("ko"))), { errors, warnings } = game.check(open.id, text);
  $("notes").replaceChildren(...errors.map((t) => el("li", {}, el("span", { className: "badge", textContent: "저장 불가" }), t)), ...warnings.map((t) => el("li", {}, el("span", { className: "badge warn", textContent: /넘칠/.test(t) ? "넘침 경고" : "확인" }), t)));
  $("preview").replaceChildren(...(errors.length ? [] : game.preview(open.id, text)));
  $("save").disabled = errors.length > 0 || text === game.current(open);
  return { text, errors };
}
function show(id, quiet) {
  id = game.itemOf?.(id) ?? id;
  const it = game.items.find((x) => x.id === id); if (!it) return;
  open = it; $("empty").hidden = true; $("edit").hidden = false;
  $("id").textContent = it.id;
  const e = game.edits[id];
  $("mark").hidden = !e; $("mark").textContent = e ? (e.base !== it.ko ? "고침 · 번역문이 그 뒤 바뀜" : "고침") : ""; $("mark").classList.toggle("warn", !!e && e.base !== it.ko);
  $("ja").textContent = game.readable(it.ja);
  fill($("ko"), game.parts(id, game.current(it)));
  if (!quiet) $("status").textContent = "";
  $("revert").disabled = !e; $("jump").hidden = !game.jumpUrl;
  review(); reveal(); chips();
  history.replaceState(null, "", `#${game.id}/${id}`);
}
function step(d) { const i = game.items.indexOf(open) + d; if (game.items[i]) show(game.items[i].id); }

// the game, in a debug run inside the frame; it tells which lines are on its screen
function play(url) {
  $("idle").hidden = true; $("screen").querySelector("iframe")?.remove();
  $("screen").append(el("iframe", { src: url, title: "게임 화면", allow: "autoplay; fullscreen" }));
  onScreen = []; chips();
}
function chips() {
  $("now").hidden = !onScreen.length;
  $("now-lines").replaceChildren(...onScreen.map((id) => {
    const it = game.items.find((x) => x.id === id), b = el("button", { className: "btn" + (open?.id === id ? " main" : ""), type: "button" }, el("span", { textContent: it ? oneLine(game.current(it)) : id }));
    b.addEventListener("click", () => show(id)); return b;
  }));
}
addEventListener("message", (event) => {
  if (event.origin !== location.origin || !game?.onScreen) return;
  const ids = game.onScreen(event.data); if (!ids) return;
  onScreen = ids.filter((id) => { const it = game.items.find((x) => x.id === id); return it && game.readable(game.current(it)).trim(); }); // lines with words
  // the editor follows the reading, unless a line is being changed
  if (wanted && !onScreen.includes(wanted)) return chips(); // after a jump the line asked for stays open until the game shows it
  wanted = null;
  if (onScreen.length && !dirty() && !onScreen.includes(open?.id)) show(onScreen.at(-1)); else chips();
});

async function store(entry) {
  $("save").disabled = true; $("status").textContent = "저장 중…";
  const id = open.id, failure = await game.save(id, entry);
  if (failure) { $("status").textContent = failure; $("save").disabled = false; return; }
  const running = $("screen").querySelector("iframe") && game.jumpUrl;
  show(id, true);
  $("status").replaceChildren(el("span", { className: "badge", textContent: entry ? "저장됨" : "되돌림" }), running ? " 게임 화면을 이 쪽에서 다시 엽니다." : "");
  if (running) { play(game.jumpUrl(id)); wanted = id; } // the game reads the edits when it starts: the same page again, with the change
}

async function start() {
  const e = edition(); game = null; open = null; found = [];
  $("edit").hidden = true; $("empty").hidden = false; $("list").replaceChildren(); $("screen").querySelector("iframe")?.remove(); $("idle").hidden = false; onScreen = []; chips();
  $("run").hidden = true; $("count").textContent = "자료를 불러오는 중…";
  if (!e?.adapter && e?.runUrl) {
    $("count").textContent = "대사 편집 준비 중";
    $("idle-text").textContent = "디버그로 실행하면 완료 세이브로 게임을 엽니다.";
    $("run").hidden = false;
    return;
  }
  if (!e?.adapter) { $("count").textContent = "준비 중"; $("idle-text").textContent = "이 판본은 아직 관리자 페이지에 연결되지 않았습니다."; return; }
  try { const adapter = (await import(`./adapters/${e.id}.js`)).default; game = Object.assign(await adapter.load(), { id: adapter.id }); }
  catch (error) { console.error(error); $("count").textContent = `자료를 불러오지 못했습니다: ${error.message}`; return; }
  $("idle-text").textContent = "대사를 고른 뒤 「이 장면으로」를 누르면 게임이 여기에서 그 쪽부터 열립니다."; $("run").hidden = !game.runUrl;
  const [, piece] = location.hash.slice(1).split("/");
  search();
  if (piece && game.items.some((it) => it.id === (game.itemOf?.(piece) ?? piece))) show(piece); else history.replaceState(null, "", `#${game.id}`);
}
function editions() {
  const t = TITLES.find((x) => x.id === $("title").value);
  $("edition").replaceChildren(...t.editions.map((e) => el("option", { value: e.id, textContent: (e.adapter || e.runUrl) ? e.name : `${e.name} · 준비 중` })));
  $("edition").value = (t.editions.find((e) => e.adapter) ?? t.editions[0]).id;
}

const box = $("ko");
box.addEventListener("input", () => { tail(box); review(); });
box.addEventListener("keydown", (event) => { // Enter is a line break of the game, never a new block
  if (event.key !== "Enter" || event.isComposing) return;
  event.preventDefault();
  const range = getSelection().getRangeAt(0); range.deleteContents();
  const node = document.createTextNode("\n"); range.insertNode(node); tail(box);
  range.setStartAfter(node); range.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(range);
  review();
});
box.addEventListener("paste", (event) => { event.preventDefault(); document.execCommand("insertText", false, (event.clipboardData.getData("text/plain") ?? "").replace(/\r/g, "")); });
$("q").addEventListener("input", () => game && search());
$("edited").addEventListener("change", () => game && search());
$("prev").addEventListener("click", () => step(-1));
$("next").addEventListener("click", () => step(1));
$("save").addEventListener("click", () => { const { text, errors } = review(); if (!errors.length) store({ ko: text, base: open.ko, at: new Date().toISOString() }); });
$("revert").addEventListener("click", () => store(null));
$("jump").addEventListener("click", () => { play(game.jumpUrl(open.id)); wanted = open.id; $("stage").scrollIntoView({ block: "start", behavior: "smooth" }); });
$("run").addEventListener("click", () => { wanted = null; play(game?.runUrl ?? edition().runUrl); });
$("drawer").addEventListener("click", () => $("drawer").setAttribute("aria-expanded", document.body.classList.toggle("drawer")));
$("stage").addEventListener("click", () => document.body.classList.remove("drawer"));
$("panel").addEventListener("click", () => document.body.classList.remove("drawer"));
$("title").addEventListener("change", () => { editions(); start(); });
$("edition").addEventListener("change", start);

$("title").replaceChildren(...TITLES.map((t) => el("option", { value: t.id, textContent: t.title })));
const asked = TITLES.find((t) => t.editions.some((e) => e.id === location.hash.slice(1).split("/")[0]));
if (asked) $("title").value = asked.id;
editions();
if (asked) $("edition").value = location.hash.slice(1).split("/")[0];
start();
