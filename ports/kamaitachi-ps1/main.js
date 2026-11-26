// Placeholder until the retail screen renderer lands (Codex, PR #22): a stand-in runtime on the
// shell's contract (shell.js), so the player around the screen can be checked. It draws nothing
// but a test card and is replaced by the real main.js.
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const rows = [0, 1, 2].map((index) => ({ index, left: 96, right: 224, top: 120 + index * 24, bottom: 140 + index * 24 }));
let cursor = 0, presses = 0, last = "";
function draw() {
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 320, 240);
  ctx.fillStyle = "#333"; for (let x = 0; x < 320; x += 32) ctx.fillRect(x, 0, 1, 240); for (let y = 0; y < 240; y += 24) ctx.fillRect(0, y, 320, 1);
  ctx.fillStyle = "#ddd"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("PS1 320×240 — 화면 엔진 준비 중", 160, 60);
  ctx.fillText(`입력 ${presses}: ${last}`, 160, 84);
  rows.forEach((row) => {
    ctx.fillStyle = row.index === cursor ? "#c33" : "#555";
    ctx.fillRect(row.left, row.top, row.right - row.left, row.bottom - row.top);
    ctx.fillStyle = "#fff"; ctx.fillText(`선택지 ${row.index + 1}`, 160, row.top + 14);
  });
}
const runtime = {
  input: { pulse(name) { presses++; last = name; if (name === "up") cursor = Math.max(0, cursor - 1); if (name === "down") cursor = Math.min(2, cursor + 1); draw(); } },
  touchRows: () => rows,
  cursorIndex: () => cursor,
  moveCursor(n) { cursor = Math.max(0, Math.min(2, cursor + n)); draw(); },
  menuMode: () => "menu",
};
draw();
// The real sound (Claude-PS1, sound/web/ps1-sound.js) when this PC has made its data: after the first
// tap the title music (song 1) plays, as an audio check until the game drives it.
const quiet = { resume() {}, setVolume() {} };
window.kamaitachiPs1 = { runtime, sound: quiet };
import("./sound/web/ps1-sound.js")
  .then(({ createPs1Sound }) => createPs1Sound({ data: "/kamaitachi-ps1-kor/port-data/sound/" }))
  .then((sound) => {
    let started = false;
    window.kamaitachiPs1.sound = {
      ...sound,
      resume() { const r = sound.resume(); if (!started) { started = true; sound.play(1); } return r; },
      setVolume: (v) => sound.setVolume(v),
    };
    last = "소리 준비됨 (탭하면 타이틀 음악)"; draw();
  })
  .catch((error) => { last = `소리 없음: ${error.message}`; draw(); });
