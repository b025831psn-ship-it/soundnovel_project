// Korean script text outside the machine: the same encoding and line layout as tools/ko/build-ko.py,
// for the owner's dialogue edits (ko/text-edits.json, applied when the game starts) and for the
// dialogue editor (tools/text-editor). Pure functions: no DOM, no machine.
//
// Text form (script.ko.json): characters, an ASCII space, and control codes in brackets ([r], [p],
// [n1], [c4], [sp] ...). A piece is the payload of one text command; its id is
// "resource-record-offset" ("027-012-0033").
export const TOKEN = /(\[[^\]]*\])/;
const SINGLE = new Set([..."@rRLpPgko"]);
const TWO = new Set([..."cChsvnw"]);
export const LEFT = 8, RIGHT = 0x120, TOP = 0x11, LINE = 0x16, LINES = 10;
export const koCode = (i) => ((0xa0 + (i >> 7)) << 8) | (0x80 + (i & 0x7f));
const koIndex = (c) => (((c >> 8) - 0xa0) << 7) | (c & 0x7f);
const isKo = (c) => c >= 0xa000 && c < 0xe000;

export const tokens = (text) => text.split(TOKEN).filter((p) => p[0] === "[" && p.at(-1) === "]");
export const plain = (text) => text.split(TOKEN).filter((p) => !(p[0] === "[" && p.at(-1) === "]")).join("");

// script: ko-script.json ({ chars, orig: { chars, codes } }). encode(text) -> { bytes, missing }.
export function koCodec(script) {
  const code = new Map(), char = new Map(), orig = new Map();
  [...(script.chars ?? "")].forEach((ch, i) => { code.set(ch, koCode(i)); char.set(koCode(i), ch); });
  [...(script.orig?.chars ?? "")].forEach((ch, i) => { orig.set(ch, script.orig.codes[i]); if (!char.has(script.orig.codes[i])) char.set(script.orig.codes[i], ch); });
  const encode = (text) => {
    const b = [], missing = [], bad = [];
    for (const part of text.split(TOKEN)) {
      if (!part) continue;
      if (part[0] === "[" && part.at(-1) === "]") {
        const t = part.slice(1, -1);
        if (t === "sp") b.push(0x20);
        else if (t.length === 1 && SINGLE.has(t)) b.push(t.charCodeAt(0));
        else if (TWO.has(t[0]) && t.length >= 2) {
          const arg = t.slice(1), v = arg.length === 1 ? arg.charCodeAt(0) : parseInt(arg, 16);
          if (arg.length !== 1 && !/^[0-9a-fA-F]{2}$/.test(arg) || !v) bad.push(part); else b.push(t.charCodeAt(0), v);
        } else bad.push(part);
        continue;
      }
      for (const ch of part) {
        if (ch === " ") b.push(0x20);
        else if (ch === "　") b.push(0x81, 0x40);
        else {
          const c = ch.charCodeAt(0) < 0x80 || !orig.has(ch) ? code.get(ch) : orig.get(ch);
          if (c === undefined) missing.push(ch); else b.push(c >> 8, c & 0xff);
        }
      }
    }
    return { bytes: Uint8Array.from(b), missing: [...new Set(missing)], bad };
  };
  return { encode, char };
}

const toBase64 = (b) => { let s = ""; for (const v of b) s += String.fromCharCode(v); return btoa(s); };

// The owner's edits over the translation: edits = { id: { ko } }. Changes script.resources in
// place; an edit that cannot be typed (a character the font lacks, a broken code) is left out.
export function applyEdits(script, edits) {
  const codec = koCodec(script), applied = [], skipped = [];
  if (!script.orig) return { applied, skipped: Object.keys(edits ?? {}) };
  for (const [id, e] of Object.entries(edits ?? {})) {
    const m = /^(\d{3})-(\d{3})-(\d{4})$/.exec(id), list = m && script.resources[+m[1]];
    const row = list?.find((r) => r[0] === +m[2] && r[1] === +m[3]);
    const r = typeof e?.ko === "string" ? codec.encode(e.ko) : null;
    if (!row || !r || r.missing.length || r.bad.length || !r.bytes.length || r.bytes.includes(0)) { skipped.push(id); continue; }
    row[2] = toBase64(r.bytes); applied.push(id);
  }
  return { applied, skipped };
}

// The text routine's flags that decide whether [r] breaks the line (src/text/text.js): inside
// 「」 or 『』, and between [o] and the next [p]/[P], it does not. [@] always breaks.
const breaks = (st) => !st.quote && !st.quote2 && !st.skip;
function step(st, c) {
  if (c === 0x8175) st.quote = true; else if (c === 0x8176) st.quote = false;
  else if (c === 0x8177) st.quote2 = true; else if (c === 0x8178) st.quote2 = false;
  else if (c === 0x6f) st.skip = true; else if (c === 0x70 || c === 0x50) st.skip = false;
}
const QUOTES = { "「": 0x8175, "」": 0x8176, "『": 0x8177, "』": 0x8178 };

// The editor's form of a piece: what the screen shows, without codes to type. parts:
//   { text }   characters and spaces, as typed
//   { br }     a line break (Enter)
//   { chip }   a control code that keeps its place ([p], [n1], [o] ...), locked in the editor
// A break is written back as [r] where [r] breaks the line and as [@] elsewhere, so the break the
// editor shows is the break the game makes. state: the flags at the start of the piece
// ({ quote, quote2, skip }, from the pieces before it in the record); it is advanced.
export function toParts(text, state = {}) {
  const parts = [];
  for (const part of text.split(TOKEN)) {
    if (!part) continue;
    if (part[0] === "[" && part.at(-1) === "]") {
      if (part === "[@]" || (part === "[r]" && breaks(state))) parts.push({ br: true });
      else if (part === "[sp]") parts.push({ text: " " });
      else parts.push({ chip: part });
      if (part.length === 3) step(state, part.charCodeAt(1));
      continue;
    }
    for (const ch of part) if (QUOTES[ch]) step(state, QUOTES[ch]);
    parts.push({ text: part });
  }
  return parts;
}
export function fromParts(parts, state = {}) {
  let out = "";
  for (const p of parts) {
    if (p.br) out += breaks(state) ? "[r]" : "[@]";
    else if (p.chip) { out += p.chip; if (p.chip.length === 3) step(state, p.chip.charCodeAt(1)); }
    else { for (const ch of p.text) if (QUOTES[ch]) step(state, QUOTES[ch]); out += p.text.replace(/\[/g, "［").replace(/\]/g, "］"); }
  }
  return out;
}
// The locked codes of a text in order (line breaks left out): an edit must keep them.
export const locked = (text) => tokens(text).filter((t) => t !== "[r]" && t !== "[@]" && t !== "[sp]");

// Glyph widths: the Korean font's own (ko-font.bin), the original font's from a table
// ({ code: width }, build-ko.py --editor), 15 for an original glyph the table lacks.
export function widthOf(font, glyphs, origWidths = {}) {
  return (c) => {
    if (c === 0x8140) return 2;
    if (isKo(c)) { const i = koIndex(c); return i < glyphs ? font[(font[i * 2] << 8 | font[i * 2 + 1]) * 4] & 0x3f : 0; }
    return origWidths[c] ?? 15;
  };
}

// The pages of the pieces of one record typed one after another, as the text routine types them
// (src/text/text.js; the same steps as build-ko.py layout). pieces: [Uint8Array]; env: { width,
// space, hang: Set, names: { 1: px, 2: px } }. Returns pages: [{ lines: [[{ x, code | name, piece }]] }].
export function layout(pieces, env) {
  const { width, space = 6, hang = new Set(), names = {} } = env;
  const pages = []; let page = null, line = null, x = LEFT, y = TOP, kin = 0, after = false; const st = { quote: false, quote2: false, skip: false };
  const open = () => { if (!page) { page = { lines: [] }; pages.push(page); } const n = (y - TOP) / LINE; while (page.lines.length <= n) page.lines.push([]); line = page.lines[n]; };
  const down = () => { x = LEFT; y += LINE; after = false; };
  pieces.forEach((b, piece) => {
    let i = 0;
    while (i < b.length) {
      const c = b[i];
      if (c === 0x20) {
        i++;
        if (after) {
          let n = 0, last = 0, j = i;
          while (j + 1 < b.length && b[j] >= 0x78) { last = width(b[j] << 8 | b[j + 1]) + 1; n += last; j += 2; }
          if (n && x + space + n - last >= RIGHT) down(); else x += space;
          after = false;
        }
        continue;
      }
      if (c === 0x72 || c === 0x40) { if (c === 0x40 || breaks(st)) down(); i++; continue; }
      if (c === 0x4c) { if (x >= 0x100) down(); i++; continue; }
      if (c === 0x67) { page = null; x = LEFT; y = TOP; after = false; i++; continue; }
      if (c < 0x78) {
        if (c === 0x6e) { // a name: counted with the default name's width
          const w = names[String.fromCharCode(b[i + 1])] ?? 0;
          if (x >= RIGHT) down();
          open(); line.push({ x, name: String.fromCharCode(b[i + 1]), w, piece }); x += w; after = true;
        }
        step(st, c);
        i += TWO.has(String.fromCharCode(c)) ? 2 : 1; continue;
      }
      const g = c << 8 | b[i + 1]; i += 2;
      step(st, g);
      if (hang.has(g)) { if (x >= RIGHT) { if (kin) { down(); kin = 0; } else kin = 1; } }
      else { if (x >= RIGHT) down(); kin = 0; }
      open(); line.push({ x, code: g, piece }); x += width(g) + 1; after = true;
    }
  });
  return pages;
}

// One glyph of ko-font.bin as rows of 4-bit pixels (0 empty, 1 the outline, 2..14 the stroke).
export function koGlyphPixels(font, glyphs, code) {
  if (!isKo(code)) return null;
  const i = koIndex(code); if (i >= glyphs) return null;
  let p = (font[i * 2] << 8 | font[i * 2 + 1]) * 4; const w = font[p] & 0x3f, h = font[p + 1] & 0x3f; p += 2;
  const nib = (k) => { const b = font[p + (k >> 1)]; return k & 1 ? b & 0xf : b >> 4; };
  const px = new Uint8Array(w * h); let out = 0, n = 0;
  while (out < px.length) {
    const v = nib(n++);
    if (v === 0xf) { const colour = nib(n++); let count = nib(n++) + 4; while (count-- && out < px.length) px[out++] = colour; }
    else px[out++] = v;
  }
  return { w, h, px };
}
