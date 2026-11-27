// Character select (主人公を選択してください), drawn after the original screen (captures in project files,
// 428-psp/shots/original-character-select.png). Pictures from chrselectchunk: cs_<hour>00 = the halftone band of the
// hour, cs_<char>_01 = the small standing figure shown at the side, cs_<char>_02.pmf (mp4) = the large figure: its
// first frame (filmed on white) stands in the middle, and the whole movie (zoom to the face, fade to black) plays when
// the character is picked. The white around the first frame is removed by a flood fill from the edges; how the original
// composites it is not yet confirmed.
// Provisional parts: header bar, name plates and guide row are drawn with canvas shapes until the menuall_mat sprite
// rectangles are read.
// Touch: tap the side figure (or left / right half outside the plate) to move, tap the large figure or its plate to pick.
const FILE = { 0: 'achi_a', 1: 'kanou', 2: 'minori_a', 3: 'tama', 4: 'oosawa', 5: 'tateno', 6: 'jack' };
const PLATE = { 0: '#b3262d', 1: '#1f6fd0', 2: '#3f8f3a', 3: '#c86a14', 4: '#6b4aa8', 5: '#8a7a2a', 6: '#555' };
const ROMA = { 0: 'achi', 1: 'kano', 2: 'minorikawa', 3: 'tama', 4: 'osawa', 5: 'tateno', 6: 'jack' };

export function createSelect({ g, W, H, BASE, img, ko }) {
  const pics = new Map(), vids = new Map();
  const pic = n => { if (!pics.has(n)) { const e = { i: null }; pics.set(n, e); img(`${BASE}png/chrselectchunk/${n}.png`).then(i => e.i = i, () => {}); } return pics.get(n).i; };
  const vid = c => {
    if (!vids.has(c)) {
      const v = document.createElement('video'); v.src = `${BASE}mov/chrselectchunk/cs_${FILE[c]}_02.mp4`;
      v.muted = true; v.playsInline = true; v.preload = 'auto'; vids.set(c, v);
    }
    return vids.get(c);
  };
  const stills = new Map(); // char -> keyed first frame
  const st = { list: [], i: 0, hour: 10, on: false, picked: null, done: null };
  function open(list, hour, current) {
    st.list = list; st.hour = hour; st.on = true;
    st.i = Math.max(0, list.findIndex(c => c.id === current)); play();
  }
  function play() { for (const l of st.list) vid(l.id); }
  function move(d) { if (st.picked != null) return; st.i = (st.i + d + st.list.length) % st.list.length; }
  function close() { st.on = false; st.picked = null; for (const v of vids.values()) v.pause(); }
  function still(c) {
    if (stills.has(c)) return stills.get(c);
    const v = vid(c); if (v.readyState < 2 || v.currentTime > 0.01) return null;
    const cv = new OffscreenCanvas(W, H), kg = cv.getContext('2d', { willReadFrequently: true });
    kg.drawImage(v, 0, 0, W, H); const d = kg.getImageData(0, 0, W, H), p = d.data;
    const white = k => Math.min(p[k], p[k + 1], p[k + 2]) > 222, seen = new Uint8Array(W * H), todo = [];
    for (let x = 0; x < W; x++) todo.push(x, (H - 1) * W + x); for (let y = 0; y < H; y++) todo.push(y * W, y * W + W - 1);
    while (todo.length) { const i = todo.pop(); if (seen[i] || !white(i * 4)) continue; seen[i] = 1; p[i * 4 + 3] = 0;
      const x = i % W; if (x > 0) todo.push(i - 1); if (x < W - 1) todo.push(i + 1); if (i >= W) todo.push(i - W); if (i < W * (H - 1)) todo.push(i + W); }
    for (let i = 0; i < W * H; i++) if (!seen[i] && ((i % W > 0 && seen[i - 1]) || (i % W < W - 1 && seen[i + 1]))) p[i * 4 + 3] = 150; // soften the edge
    kg.putImageData(d, 0, 0); stills.set(c, cv); return cv;
  }
  function figure(c) { const k = still(c); if (k) g.drawImage(k, 0, 0); }
  // picked: play the movie, then call done(id)
  function pick(done) {
    const c = st.list[st.i].id, v = vid(c); st.picked = c; st.done = done;
    v.loop = false; v.currentTime = 0; v.onended = () => { const f = st.done; close(); f?.(c); }; v.play().catch(() => v.onended());
  }
  function plate(c, x, y, w, h, big) {
    g.fillStyle = '#e8902a'; g.fillRect(x - 2, y - 2, w + 4, h + 4);
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, PLATE[c.id]); gr.addColorStop(1, '#111');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = `italic ${big ? 20 : 12}px 'Noto Serif KR', serif`;
    g.fillText(ko ? c.ko : c.ja, x + w / 2, y + h * (big ? 0.62 : 0.66));
    g.font = `italic ${big ? 10 : 7}px sans-serif`; g.fillStyle = PLATE[c.id] === '#555' ? '#ccc' : '#ffd8a0'; g.fillText(ROMA[c.id], x + w / 2, y + h - 3);
    g.textAlign = 'left';
  }
  function draw() {
    if (st.picked != null) { const v = vid(st.picked); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); if (v.readyState >= 2) g.drawImage(v, 0, 0, W, H); return; }
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const band = pic(`cs_${st.hour}00`); if (band) g.drawImage(band, 0, 0, W, 64, 0, 55, W, 64);
    g.strokeStyle = '#888'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 54.5); g.lineTo(W, 54.5); g.moveTo(0, 119.5); g.lineTo(W, 119.5); g.stroke();
    const spot = g.createRadialGradient(240, 215, 10, 240, 215, 200); spot.addColorStop(0, 'rgba(90,80,60,.35)'); spot.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = spot; g.fillRect(0, 120, W, 152);
    const c = st.list[st.i]; if (!c) return;
    // side figure: the next character
    if (st.list.length > 1) { const n = st.list[(st.i + 1) % st.list.length], s = pic(`cs_${FILE[n.id]}_01`); if (s) g.drawImage(s, -24, 0); }
    figure(c.id);
    // header
    g.fillStyle = '#000'; g.fillRect(0, 0, W, 28);
    g.fillStyle = '#eee'; g.font = `bold 13px 'Noto Serif KR', serif`; g.fillText(ko ? '주인공을 선택하세요' : '主人公を選択してください', 24, 20);
    g.strokeStyle = '#e8902a'; g.lineWidth = 2; g.beginPath(); g.roundRect(343, 11, 114, 15, 8); g.stroke();
    g.fillStyle = '#eee'; g.font = '11px sans-serif'; g.textAlign = 'center'; g.fillText(`${st.hour}:00 - ${st.hour + 1}:00`, 400, 23); g.textAlign = 'left';
    const bar = g.createLinearGradient(0, 30, 0, 45); bar.addColorStop(0, '#f6b04a'); bar.addColorStop(1, '#d9700f');
    g.fillStyle = bar; g.fillRect(0, 30, W, 14);
    g.fillStyle = '#111'; g.font = `italic bold 11px 'Noto Serif KR', serif`; g.fillText(ko ? c.ko : c.ja, 36, 42);
    plate(c, 312, 168, 143, 32, true);
    // status of the character (provisional wording, the original shows it on the time chart)
    const note = c.status === 'continue' ? (ko ? '계속 대기 중' : 'TO BE CONTINUED') : c.status === 'badend' ? 'BAD END' : '';
    if (note) { g.fillStyle = c.status === 'badend' ? '#e33' : '#ccc'; g.font = '10px sans-serif'; g.textAlign = 'center'; g.fillText(note, 383, 214); g.textAlign = 'left'; }
    // guide row
    g.fillStyle = '#ddd'; g.font = '10px sans-serif';
    g.fillText(ko ? '◀▶ 주인공 선택    ○ 결정' : '◀▶ 主人公選択    ○ 決定', 80, 258);
  }
  // returns true when the tap picks the shown character
  function tap(x, y) {
    if (st.picked != null) return false;
    if ((x >= 312 && x <= 455 && y >= 160 && y <= 205) || (x > 160 && x < 312 && y > 120)) return true;
    move(x < 160 ? 1 : -1); return false;
  }
  return { st, open, close, draw, tap, move, pick };
}
