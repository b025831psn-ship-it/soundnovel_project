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
  async load() {
    const get = async (name, fresh) => { const r = await fetch((name === "ko-editor.json" ? EDITOR : DATA) + name + (fresh ? `?v=${Date.now()}` : ""), fresh ? { cache: "no-store" } : {}); if (!r.ok) throw new Error(`${name} ${r.status}`); return r; };
    const [script, editor, font] = await Promise.all([get("ko-script.json").then((r) => r.json()), get("ko-editor.json").then((r) => r.json()), get("ko-font.bin").then((r) => r.arrayBuffer()).then((b) => new Uint8Array(b))]);
    if (!script.orig) throw new Error("ko-script.json is older than the editor (no orig table): rebuild it with tools/ko/build-ko.py");
    const loadEdits = async () => { try { return await (await get("text-edits.json", true)).json(); } catch { return {}; } };
    const codec = koCodec(script), width = widthOf(font, script.glyphs, editor.widths);
    const env = { width, space: script.space ?? 6, hang: new Set(script.hang ?? []), names: script.names ?? {} };
    const raw = editor.items.map(([id, ja, ko]) => ({ id, ja, ko })), index = new Map(raw.map((it, i) => [it.id, i]));
    // Letters the original types one by one (a record's run of one-glyph pieces) and the piece that ends their
    // line are one line here: { id (the first piece's), members, n (the one-letter pieces) }. It is saved piece
    // by piece again (split), under the pieces' own ids.
    const letter = (it) => it.ja.length === 1 && !/[\[\s]/.test(it.ja);
    const items = [], home = new Map();
    for (let i = 0; i < raw.length;) {
      const key = raw[i].id.slice(0, 7); let j = i;
      while (j < raw.length && letter(raw[j]) && raw[j].id.startsWith(key)) j++;
      if (j - i < 2) { items.push(raw[i]); i++; continue; }
      const n = j - i; if (j < raw.length && raw[j].id.startsWith(key)) j++;
      const members = raw.slice(i, j), it = { id: members[0].id, ja: members.map((m) => m.ja).join(""), ko: members.map((m) => m.ko).join(""), members, n };
      items.push(it); for (const m of members) home.set(m.id, it); i = j;
    }
    const byId = new Map(items.map((it) => [it.id, it]));
    let saved = await loadEdits(); // the owner's edits as stored: by piece
    const now = (m) => saved[m.id]?.ko ?? m.ko;
    const current = (it) => (it.members ? it.members.map(now).join("") : now(it));
    // the edits by line, as the page marks them
    const marks = () => { const out = {}; for (const it of items) { const ms = (it.members ?? [it]).filter((m) => saved[m.id]); if (ms.length) out[it.id] = { ko: current(it), base: ms.every((m) => saved[m.id].base === m.ko) ? it.ko : "", at: ms.map((m) => saved[m.id].at).sort().at(-1) }; } return out; };
    // a line's text given back to its pieces: each one-letter piece takes the spaces before its letter and the letter
    const split = (it, text) => {
      if (!it.members) return [text];
      const out = []; let p = 0;
      for (let k = 0; k < it.n; k++) {
        let q = p; while (text[q] === " ") q++;
        if (q >= text.length || text[q] === "[" || text[q] === "\n") return null;
        const rest = k === it.n - 1 && it.members.length === it.n; out.push(rest ? text.slice(p) : text.slice(p, q + 1)); p = q + 1;
      }
      if (it.members.length > it.n) out.push(text.slice(p));
      return out;
    };
    const texts = (it, text) => { const parts = split(it, text); return parts && new Map((it.members ?? [it]).map((m, k) => [m.id, parts[k]])); };
    const game = { items, edits: marks() };
    // the pieces of the record of `id`, and where `id` is among them
    const record = (id) => { let a = index.get(id), b = a; const key = id.slice(0, 7); while (a > 0 && raw[a - 1].id.startsWith(key)) a--; while (b + 1 < raw.length && raw[b + 1].id.startsWith(key)) b++; return { list: raw.slice(a, b + 1), at: index.get(id) - a }; };
    const stateAt = (id, text) => { const { list, at } = record(id), st = {}; for (let i = 0; i < at; i++) toParts(now(list[i]), st); return st; };
    const lines = (it, textOf) => { // the screen pages with this line, from the record typed in order
      const { list, at } = record(it.id), n = it.members?.length ?? 1, mine = (piece) => piece >= at && piece < at + n;
      const pages = layout(list.map((m) => codec.encode(textOf(m)).bytes), env);
      return { pages: pages.filter((p) => p.lines.some((l) => l.some((g) => mine(g.piece)))), mine };
    };
    const count = (shown) => shown.pages.reduce((n, p) => n + p.lines.filter((l) => l.some((g) => shown.mine(g.piece))).length, 0);

    Object.assign(game, {
      label,
      current,
      itemOf: (id) => home.get(id)?.id ?? id,
      scene: (id) => id.slice(0, 7),
      sceneName: (scene) => `장면 ${scene}`,
      // the game as a debug run in the frame, and the lines it says are on its screen
      runUrl: "/ports/kamaitachi-ps1/?debug=1",
      onScreen: (data) => (data?.type === "kamaitachi-ps1-page" ? [...new Set(data.ids.map((id) => home.get(id)?.id ?? id))] : null),
      // the text as the screen shows it, with the codes that keep their place as chips
      parts: (id, text) => toParts(text, stateAt(id)),
      text: (id, parts) => fromParts(parts, stateAt(id)),
      readable: (text) => toParts(text, {}).map((p) => (p.br ? "\n" : p.chip ? (/^\[n[12]\]$/.test(p.chip) ? `(${label(p.chip)})` : "") : p.text)).join(""),
      check(id, text) {
        const it = byId.get(id), errors = [], warnings = [], over = texts(it, text);
        const r = codec.encode(text);
        if (locked(text).join("") !== locked(it.ko).join("")) errors.push("회색 표시가 지워졌거나 순서가 바뀌었습니다. 「원래 번역으로」를 누른 뒤 다시 고쳐 주세요.");
        if (r.missing.length) errors.push(`게임 글꼴에 없는 글자: ${r.missing.join(" ")}`);
        if (r.bad.length) errors.push(`쓸 수 없는 표시: ${r.bad.join(" ")}`);
        if (!plain(text).trim() && plain(it.ko).trim()) errors.push("대사가 비어 있습니다.");
        if (!over) errors.push(`이 줄의 앞 ${it.n}글자는 한 글자씩 찍힙니다. 표시(회색) 앞에 글자가 ${it.n}개 이상 있어야 합니다.`);
        if (errors.length) return { errors, warnings };
        const shown = lines(it, (m) => over.get(m.id) ?? now(m)), ja = lines(it, (m) => m.ja);
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
        const it = byId.get(id), over = texts(it, text) ?? new Map(), shown = lines(it, (m) => over.get(m.id) ?? now(m));
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
            const y = TOP + LINE * n, bright = shown.mine(cell.piece);
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
        const it = byId.get(id), parts = entry && split(it, entry.ko);
        if (entry && !parts) return "저장하지 못했습니다 (글자 수 부족).";
        (it.members ?? [it]).forEach((m, k) => { if (entry && parts[k] !== m.ko) all[m.id] = { ko: parts[k], base: m.ko, at: entry.at }; else delete all[m.id]; });
        const r = await fetch(SAVE, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(all) });
        if (r.ok) { saved = all; game.edits = marks(); }
        return r.ok ? "" : r.status === 401 ? "비밀번호가 필요합니다. 페이지를 다시 열어 로그인해 주세요." : `저장하지 못했습니다 (${r.status}).`;
      },
    });
    return game;
  },
};
