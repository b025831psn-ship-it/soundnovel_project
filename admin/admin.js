// 펜션 슈프르 관리자: the owner's page, apart from the hub and the players. Dialogue editing for every
// title through one adapter per game (adapters/<game>.js); see README.md for what an adapter gives.
// The edit box shows the text as the screen shows it: Enter is a line break, a space is a space, and
// the codes that must keep their place are locked chips. No code is typed.
const ADAPTERS = ["kamaitachi-ps1"];
const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const SHOWN = 200;

let game = null, open = null, found = [];

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

function search() {
  const q = $("q").value.trim().toLowerCase(), only = $("edited").checked;
  found = game.items.filter((it) => (!only || game.edits[it.id]) && (!q || it.id.includes(q) || it.ja.toLowerCase().includes(q) || game.readable(game.current(it)).toLowerCase().includes(q)));
  $("count").textContent = `${found.length.toLocaleString()}개` + (found.length > SHOWN ? ` (처음 ${SHOWN}개 표시)` : "") + ` · 고친 대사 ${Object.keys(game.edits).length}개`;
  $("list").replaceChildren(...found.slice(0, SHOWN).map((it) => {
    const li = el("li", {}, el("span", { className: "i", textContent: it.id }), ...(game.edits[it.id] ? [el("span", { className: "e", textContent: "고침" })] : []),
      el("span", { className: "k", textContent: game.readable(game.current(it)).replace(/\n/g, " ⏎ ") || "(글자 없음)" }), el("span", { className: "j", textContent: game.readable(it.ja).replace(/\n/g, " ⏎ ") }));
    li.addEventListener("click", () => show(it.id));
    return li;
  }));
}

function review() {
  const text = game.text(open.id, read($("ko"))), { errors, warnings } = game.check(open.id, text);
  $("notes").replaceChildren(...errors.map((t) => el("li", { className: "error", textContent: "저장 불가: " + t })), ...warnings.map((t) => el("li", { className: "warn", textContent: "확인: " + t })));
  $("preview").replaceChildren(...(errors.length ? [] : game.preview(open.id, text)));
  $("save").disabled = errors.length > 0 || text === game.current(open);
  return { text, errors };
}

function show(id) {
  open = game.items.find((it) => it.id === id); if (!open) return;
  $("find").hidden = true; $("edit").hidden = false;
  $("id").textContent = open.id;
  const e = game.edits[id];
  $("mark").textContent = e ? (e.base !== open.ko ? "고침 · 그 뒤 번역문이 바뀌었습니다" : "고침") : "";
  $("ja").textContent = game.readable(open.ja);
  fill($("ko"), game.parts(id, game.current(open)));
  $("status").textContent = "";
  $("revert").disabled = !e;
  review();
  history.replaceState(null, "", `#${game.id}/${id}`);
  scrollTo(0, 0);
}
function list() { open = null; $("edit").hidden = true; $("find").hidden = false; history.replaceState(null, "", `#${game.id}`); search(); }
function step(d) { const all = game.items, i = all.indexOf(open) + d; if (all[i]) show(all[i].id); }

async function store(entry) {
  $("save").disabled = true; $("status").textContent = "저장 중…";
  const failure = await game.save(open.id, entry);
  $("status").textContent = failure || (entry ? "저장했습니다. 게임을 새로고침하면 반영됩니다." : "원래 번역으로 되돌렸습니다.");
  if (!failure) show(open.id), $("status").textContent = entry ? "저장했습니다. 게임을 새로고침하면 반영됩니다." : "원래 번역으로 되돌렸습니다.";
  else $("save").disabled = false;
}

async function start(id) {
  $("count").textContent = "자료를 불러오는 중…"; $("list").replaceChildren();
  try { const adapter = (await import(`./adapters/${id}.js`)).default; game = Object.assign(await adapter.load(), { id: adapter.id, title: adapter.title }); }
  catch (error) { console.error(error); $("count").textContent = `자료를 불러오지 못했습니다: ${error.message}`; return; }
  const [, piece] = location.hash.slice(1).split("/");
  if (piece && game.items.some((it) => it.id === piece)) show(piece); else list();
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
$("q").addEventListener("input", search);
$("edited").addEventListener("change", search);
$("back").addEventListener("click", list);
$("prev").addEventListener("click", () => step(-1));
$("next").addEventListener("click", () => step(1));
$("save").addEventListener("click", () => { const { text, errors } = review(); if (!errors.length) store({ ko: text, base: open.ko, at: new Date().toISOString() }); });
$("revert").addEventListener("click", () => store(null));
$("game").addEventListener("change", () => start($("game").value));

const titles = await Promise.all(ADAPTERS.map(async (id) => [id, (await import(`./adapters/${id}.js`)).default.title]));
$("game").replaceChildren(...titles.map(([value, textContent]) => el("option", { value, textContent })));
const wanted = location.hash.slice(1).split("/")[0];
if (ADAPTERS.includes(wanted)) $("game").value = wanted;
start($("game").value);
