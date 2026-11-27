// Korean build only: the particle after an inserted name ([n1] / [n2]) follows the name's last
// syllable, since the player may change the names. The translation is written for the default
// names (no final consonant: 는 가 를 와 ...); the other forms are accepted too.
//
// m.ko.josa = { char: Map (Korean glyph code -> character), code: Map (character -> code), join: Set }
// (ko-script.json "chars" and "josaJoin", tools/ko/build-ko.py; join = EXE strings drawn right after
// the hero's name).

const HIRAGANA_N = 0x82f1, KATAKANA_N = 0x8393;
const WITH = { 는: "은", 가: "이", 를: "을", 와: "과", 랑: "이랑", 였: "이었", 예: "이에" };
const WITHOUT = { 은: "는", 을: "를", 과: "와" };
const AFTER_RA = new Set([..."면는니고도서며든"]), DROP_I = new Set([..."랑라야다나고지"]);
const CALL = new Set([0x8141, 0x8143, 0x8149]), CALL_CH = new Set([",", "!"]); // after 야: the name is called, not "is"
const hangul = (ch) => ch !== undefined && ch >= "가" && ch <= "힣";

// the last glyph of a name: 0 no final consonant, 1 one, 2 ㄹ
export function finalOf(m, code) {
  const ch = m.ko.josa.char.get(code);
  if (hangul(ch)) { const t = (ch.charCodeAt(0) - 0xac00) % 28; return t === 8 ? 2 : t ? 1 : 0; }
  return code === HIRAGANA_N || code === KATAKANA_N ? 1 : 0;
}

// last: the last glyph code of the name; g1, g2: the two glyph codes after it (0 when the next
// code is not a glyph). Returns null (nothing to change) or { skip, emit }: skip glyphs of the
// text, type the codes of emit in their place.
export function josa(m, last, g1, g2) {
  const j = m.ko?.josa; if (!j || !last || !g1) return null;
  const c1 = j.char.get(g1), c2 = j.char.get(g2), f = finalOf(m, last), ends = !hangul(c2);
  if (!hangul(c1)) return null;
  let out = null, skip = 1;
  if (f) {
    if (WITH[c1]) out = WITH[c1];
    else if (c1 === "라" && AFTER_RA.has(c2)) out = "이라";
    else if (c1 === "로" && f !== 2) out = "으로";
    else if (c1 === "야" && (ends || c2 === "말")) out = ends && (CALL.has(g2) || CALL_CH.has(c2)) ? "아" : "이야";
    else if ((c1 === "다" || c1 === "나") && ends) out = "이" + c1;
  } else {
    if (WITHOUT[c1]) out = WITHOUT[c1];
    else if (c1 === "으" && c2 === "로") out = "";
    else if (c1 === "이" && c2 === "었") { out = "였"; skip = 2; }
    else if (c1 === "이" && c2 === "에") { out = "예"; skip = 2; }
    else if (c1 === "이") out = DROP_I.has(c2) ? "" : "가";
    else if (c1 === "아" && ends) out = "야";
  }
  if (out === null) return null;
  const emit = [...out].map((ch) => j.code.get(ch));
  return emit.includes(undefined) ? null : { skip, emit };
}

// the last glyph code of the string at p (two-byte codes up to a zero byte)
export function lastGlyph(m, p) {
  let last = 0;
  for (; m.read(p, 1); p += 2) last = m.read(p, 1) << 8 | m.read(p + 1, 1);
  return last;
}
