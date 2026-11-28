// 업데이트 내역 안내: when the game list comes into view (after the front page, or straight from a link),
// a modal shows the update notes the visitor has not seen yet. Newest first; each note's id is shown once
// per browser (localStorage). 태우 writes or approves every note's wording before it goes here.
const NOTES = [
  { id: "2026-11-28", date: "11월 28일", items: [
    "게임을 시작하기 전에 새로하기 / 이어하기를 고를 수 있어요. 게임 안에서 저장하면 내 세이브 코드(6자리)에 자동으로 올라가고, 다른 기기에서는 이어하기에서 그 코드를 넣으면 이어서 할 수 있어요.",
    "내 코드는 화면 오른쪽 아래 저장 버튼(디스크)을 누르면 볼 수 있어요.",
    "오탈자나 버그를 발견하면 맨 오른쪽 경고 버튼으로 바로 알려 주세요.",
    "휴대폰을 세로로 들어도 게임 화면이 화면 폭에 맞게 커져요.",
  ] },
];

const seenKey = "updates-seen";
const seen = () => { try { return localStorage.getItem(seenKey) ?? ""; } catch { return ""; } };
const unseen = () => NOTES.filter((n) => n.id > seen());

function show() {
  const notes = unseen();
  if (!notes.length || document.getElementById("updates")) return;
  const dialog = document.createElement("dialog");
  dialog.id = "updates";
  dialog.innerHTML = `<h2>업데이트 안내</h2>${notes.map((n) => `<section><h3>${n.date}</h3><ul>${n.items.map((t) => `<li>${t}</li>`).join("")}</ul></section>`).join("")}<button type="button">확인</button>`;
  const close = () => { try { localStorage.setItem(seenKey, NOTES[0].id); } catch { /* shown again next time */ } dialog.close(); dialog.remove(); };
  dialog.querySelector("button").addEventListener("click", close);
  dialog.addEventListener("cancel", close);
  document.body.append(dialog);
  dialog.showModal();
}

const listShown = () => !document.body.classList.contains("front-on");
if (NOTES.length) {
  if (listShown()) show();
  else new MutationObserver((_, o) => { if (listShown()) { o.disconnect(); setTimeout(show, 750); } }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
}
