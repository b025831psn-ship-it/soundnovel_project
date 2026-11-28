// Admin adapter: 카마이타치의 밤 (PS1). Text model, checks and screen preview of the Korean script,
// with the game's own encoding and line rules (ports/kamaitachi-ps1/src/ko-text.js).
//
// Data (private, next to the game's Korean data): ko-script.json, ko-font.bin, ko-editor.json
// (tools/ko/build-ko.py --editor) and text-edits.json (the owner's edits: { id: { ko, base, at } }).
import { koCodec, toParts, fromParts, locked, plain, layout, widthOf, koGlyphPixels, LINES, LINE, TOP } from "/ports/kamaitachi-ps1/src/ko-text.js";

const DATA = "/kamaitachi-ps1-kor/port-data/machine/ko/";
const EDITOR = "/edit/kamaitachi-ps1/"; // the side-by-side script is read behind the password
const SAVE = "/edit/kamaitachi-ps1/text-edits.json";
// What a locked code does, for the label on its chip.
const LABEL = { p: "누르면 계속", P: "누르면 계속", g: "쪽 넘김", o: "이어 쓰기", k: "잠깐 멈춤", L: "줄바꿈 자리", R: "줄 처음으로", r: "줄바꿈(따옴표 안)", n1: "주인공 이름", n2: "동행 이름" };
const label = (token) => { const t = token.slice(1, -1); return LABEL[t] ?? ({ c: "글자색", C: "글자색", h: "효과", s: "속도", v: "음성", w: "기다림" }[t[0]] ?? "코드") + (LABEL[t] ? "" : " " + t.slice(1)); };
// Spellings fixed for this title (the common glossary): [pattern, the spelling to use].
const SPELLING = [[/슈푸르|슈풀/, "슈프르"], [/토루(?!오)|도오루/, "토오루"], [/타나카/, "다나카"], [/고바야시/, "코바야시"]];
const NAMES = { 1: "토오루", 2: "마리" };
const ending = (text) => (plain(text).trim().match(/[.!?…~」』)]+$/) ?? [""])[0];

export default {
  id: "kamaitachi-ps1",
  title: "카마이타치의 밤 (PS1)",
  async load() {
    const get = async (name, fresh) => { const r = await fetch((name === "ko-editor.json" ? EDITOR : DATA) + name + (fresh ? `?v=${Date.now()}` : ""), fresh ? { cache: "no-store" } : {}); if (!r.ok) throw new Error(`${name} ${r.status}`); return r; };
    const [script, editor, font] = await Promise.all([get("ko-script.json").then((r) => r.json()), get("ko-editor.json").then((r) => r.json()), get("ko-font.bin").then((r) => r.arrayBuffer()).then((b) => new Uint8Array(b))]);
    if (!script.orig) throw new Error("ko-script.json is older than the editor (no orig table): rebuild it with tools/ko/build-ko.py");
    const loadEdits = async () => { try { return await (await get("text-edits.json", true)).json(); } catch { return {}; } };
    const codec = koCodec(script), width = widthOf(font, script.glyphs, editor.widths);
    const env = { width, space: script.space ?? 6, hang: new Set(script.hang ?? []), names: script.names ?? {} };
    const items = editor.items.map(([id, ja, ko]) => ({ id, ja, ko })), index = new Map(items.map((it, i) => [it.id, i]));
    const game = { items, edits: await loadEdits() };
    const now = (it) => game.edits[it.id]?.ko ?? it.ko;
    // the pieces of the record of `id`, and where `id` is among them
    const record = (id) => { let a = index.get(id), b = a; const key = id.slice(0, 7); while (a > 0 && items[a - 1].id.startsWith(key)) a--; while (b + 1 < items.length && items[b + 1].id.startsWith(key)) b++; return { list: items.slice(a, b + 1), at: index.get(id) - a }; };
    const stateAt = (id, text) => { const { list, at } = record(id), st = {}; for (let i = 0; i < at; i++) toParts(now(list[i]), st); return st; };
    const lines = (id, texts) => { // the screen pages with this piece, from the record typed in order
      const { list, at } = record(id);
      const pages = layout(list.map((it, i) => codec.encode(texts(it, i === at)).bytes), env);
      return { pages: pages.filter((p) => p.lines.some((l) => l.some((g) => g.piece === at))), at };
    };
    const count = (shown) => shown.pages.reduce((n, p) => n + p.lines.filter((l) => l.some((g) => g.piece === shown.at)).length, 0);

    Object.assign(game, {
      label,
      current: now,
      scene: (id) => id.slice(0, 7),
      // the text as the screen shows it, with the codes that keep their place as chips
      parts: (id, text) => toParts(text, stateAt(id)),
      text: (id, parts) => fromParts(parts, stateAt(id)),
      readable: (text) => toParts(text, {}).map((p) => (p.br ? "\n" : p.chip ? (/^\[n[12]\]$/.test(p.chip) ? `(${label(p.chip)})` : "") : p.text)).join(""),
      check(id, text) {
        const it = items[index.get(id)], errors = [], warnings = [];
        const r = codec.encode(text);
        if (locked(text).join("") !== locked(it.ko).join("")) errors.push("회색 표시가 지워졌거나 순서가 바뀌었습니다. 「원래 번역으로」를 누른 뒤 다시 고쳐 주세요.");
        if (r.missing.length) errors.push(`게임 글꼴에 없는 글자: ${r.missing.join(" ")}`);
        if (r.bad.length) errors.push(`쓸 수 없는 표시: ${r.bad.join(" ")}`);
        if (!plain(text).trim() && plain(it.ko).trim()) errors.push("대사가 비어 있습니다.");
        if (errors.length) return { errors, warnings };
        const shown = lines(id, (x, me) => (me ? text : now(x))), ja = lines(id, (x) => x.ja);
        if (shown.pages.some((p) => p.lines.length > LINES)) warnings.push(`이 쪽이 화면(${LINES}줄)을 넘칠 수 있습니다. 미리보기의 붉은 줄을 확인하세요.`);
        const n = count(shown), j = count(ja);
        if (n > j) warnings.push(`일본어보다 ${n - j}줄 깁니다 (${n}줄, 일본어 ${j}줄).`);
        if (ending(text) !== ending(it.ko)) warnings.push(`문장 끝이 번역문과 다릅니다 (「${ending(it.ko) || "없음"}」 → 「${ending(text) || "없음"}」).`);
        if (/ {2,}/.test(plain(text))) warnings.push("띄어쓰기를 여러 칸 넣어도 게임에서는 한 칸으로 나옵니다.");
        for (const [bad, good] of SPELLING) if (bad.test(plain(text))) warnings.push(`표기 확인: 「${good}」로 통일합니다.`);
        return { errors, warnings };
      },
      // One canvas per screen page that holds the piece: this piece bright, the rest of the page dim.
      preview(id, text) {
        const shown = lines(id, (x, me) => (me ? text : now(x)));
        return shown.pages.map((page) => {
          const rows = Math.max(LINES, page.lines.length), canvas = Object.assign(document.createElement("canvas"), { width: 320, height: TOP + LINE * rows + 6 });
          const g = canvas.getContext("2d"); g.fillStyle = "#101820"; g.fillRect(0, 0, canvas.width, canvas.height);
          if (rows > LINES) { g.fillStyle = "#5a1512"; g.fillRect(0, TOP + LINE * LINES - 1, 320, canvas.height); }
          const image = g.getImageData(0, 0, canvas.width, canvas.height), put = (x, y, v, bright) => {
            if (x < 0 || x >= 320 || y < 0 || y >= canvas.height) return; const o = (y * 320 + x) * 4, c = v === 1 ? 0 : Math.round((bright ? 255 : 120) * (v + 1) / 15);
            image.data[o] = image.data[o + 1] = image.data[o + 2] = c;
          };
          const later = [];
          const glyph = (code, x, y, bright) => { const k = koGlyphPixels(font, script.glyphs, code); if (!k) return false; for (let r = 0; r < k.h; r++) for (let c = 0; c < k.w; c++) { const v = k.px[r * k.w + c]; if (v) put(x + c, y + r, v, bright); } return k.w + 1; };
          page.lines.forEach((line, n) => line.forEach((cell) => {
            const y = TOP + LINE * n, bright = cell.piece === shown.at;
            if (cell.name) { let x = cell.x; for (const ch of NAMES[cell.name] ?? "") { const c = codec.encode(ch).bytes; x += glyph(c[0] << 8 | c[1], x, y, bright) || 15; } return; }
            if (!glyph(cell.code, cell.x, y, bright)) later.push([codec.char.get(cell.code) ?? "?", cell.x, y, bright]); // a glyph of the original font: drawn with the browser's
          }));
          g.putImageData(image, 0, 0);
          g.font = "14px sans-serif"; g.textBaseline = "top";
          for (const [ch, x, y, bright] of later) { g.fillStyle = bright ? "#fff" : "#787878"; g.fillText(ch, x, y + 2); }
          return canvas;
        });
      },
      // the game opened at the page with this line (a debug run: src/machine-browser.js ?debug=1&scene=)
      jumpUrl: (id) => `/ports/kamaitachi-ps1/?debug=1&scene=${id}`,
      // true when the server took it; the edits of other devices are read first and kept
      async save(id, entry) {
        const all = await loadEdits();
        if (entry) all[id] = entry; else delete all[id];
        const r = await fetch(SAVE, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(all) });
        if (r.ok) game.edits = all;
        return r.ok ? "" : r.status === 401 ? "비밀번호가 필요합니다. 페이지를 다시 열어 로그인해 주세요." : `저장하지 못했습니다 (${r.status}).`;
      },
    });
    return game;
  },
};
