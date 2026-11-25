// Dialogue editor (태우, 2026-11-26): the lines of the page being read can be rewritten in place.
// An edit replaces one text run (the bytes of one 00 opcode, keyed "bank:offset" by vm.textKey)
// only when it is shown, so the script, its rows and every save position stay the cartridge's.
//
// Edits are kept per language in text-edits-<lang>.json on the test PC (GET /art/..., PUT /edit/...,
// served by serve.cjs) and, when the PC cannot be written to, in this browser until then.
//
// In the edit box the text is plain Korean or Japanese; the cartridge's control codes appear as
// {r} (new line), {p} (wait), {g} (next page), {o}, {@}, {n31} (a name) and so on, and must stay.
import { textKey } from "./vm.js";

const ARG_CODES = "nsvcC";
// Control codes shown with a line break after them in the box (the break itself is ignored).
const BREAKING = new Set(["r", "@", "g"]);

// Two-byte code <-> character tables for the language's text encoding.
function codeTables(lang) {
  const decoder = new TextDecoder(lang === "ko" ? "euc-kr" : "shift_jis");
  const toChar = new Map();
  const toCode = new Map();
  const leads = lang === "ko" ? range(0xa1, 0xfe) : [...range(0x81, 0x9f), ...range(0xe0, 0xef)];
  const trails = lang === "ko" ? range(0xa1, 0xfe) : [...range(0x40, 0x7e), ...range(0x80, 0xfc)];
  for (const lead of leads) for (const trail of trails) {
    const char = decoder.decode(Uint8Array.of(lead, trail));
    if (char.length !== 1 || char === "�") continue;
    const code = (lead << 8) | trail;
    toChar.set(code, char);
    if (!toCode.has(char)) toCode.set(char, code);
  }
  return { toChar, toCode };
}

function range(a, b) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export class TextCodec {
  constructor(lang, font) {
    this.lang = lang;
    this.font = font;
    Object.assign(this, codeTables(lang));
  }

  decode(raw) {
    let out = "";
    for (let pos = 0; pos < raw.length; pos++) {
      const byte = raw[pos];
      if (byte > 0x80 && pos + 1 < raw.length) {
        const code = (byte << 8) | raw[++pos];
        let char = this.toChar.get(code);
        // Full-width spaces, digits and letters read as plain ones in the box (encode turns them back).
        if (char === "\u3000") char = " ";
        else if (char >= "\uff01" && char <= "\uff5e" && char !== "\uff5b" && char !== "\uff5d") char = String.fromCharCode(char.charCodeAt(0) - 0xfee0);
        out += char ?? `{#${code.toString(16)}}`;
        continue;
      }
      const control = String.fromCharCode(byte);
      if (ARG_CODES.includes(control) && pos + 1 < raw.length) {
        const arg = raw[++pos];
        out += arg >= 0x30 && arg <= 0x7a ? `{${control}${String.fromCharCode(arg)}}` : `{${control}:${arg.toString(16)}}`;
      } else if (/[A-Za-z@]/.test(control)) out += `{${control}}` + (BREAKING.has(control) ? "\n" : "");
      else out += `{#${byte.toString(16).padStart(2, "0")}}`;
    }
    return out;
  }

  // Text from the box back to bytes. Returns { bytes, missing (characters the font cannot show),
  // unknown (characters with no code) }.
  encode(text) {
    const bytes = [];
    const missing = new Set();
    const unknown = new Set();
    const source = text.replace(/\r?\n/g, "");
    for (let pos = 0; pos < source.length; pos++) {
      let char = source[pos];
      if (char === "{") {
        const end = source.indexOf("}", pos);
        const token = end > pos ? source.slice(pos + 1, end) : null;
        if (token !== null && this.token(token, bytes)) { pos = end; continue; }
      }
      // Plain spaces, digits and letters become their full-width forms (bytes below 0x80 are codes).
      if (char === " ") char = "　";
      else if (char > " " && char <= "~") char = String.fromCharCode(char.charCodeAt(0) + 0xfee0);
      const code = this.toCode.get(char);
      if (code === undefined) { unknown.add(source[pos]); continue; }
      if (this.font.find(code) < 0) missing.add(char);
      bytes.push(code >> 8, code & 255);
    }
    return { bytes: Uint8Array.from(bytes), missing: [...missing], unknown: [...unknown] };
  }

  token(token, bytes) {
    let match = /^#([0-9a-f]{2}|[0-9a-f]{4})$/i.exec(token);
    if (match) {
      const value = parseInt(match[1], 16);
      if (match[1].length === 4) bytes.push(value >> 8, value & 255); else bytes.push(value);
      return true;
    }
    match = /^([nsvcC])(?::([0-9a-f]{1,2})|(.))$/.exec(token);
    if (match) {
      bytes.push(match[1].charCodeAt(0), match[2] !== undefined ? parseInt(match[2], 16) : match[3].charCodeAt(0));
      return true;
    }
    if (/^[A-Za-z@]$/.test(token)) { bytes.push(token.charCodeAt(0)); return true; }
    return false;
  }
}

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const unhex = (text) => Uint8Array.from(text.match(/../g) ?? [], (h) => parseInt(h, 16));

// Stored form: { "<bank>:<offset>": { "text": "<box text>", "bytes": "<hex>" } }.
export class TextEdits {
  constructor(lang) {
    this.lang = lang;
    this.entries = {};
    this.local = false; // some edits live only in this browser (the PC could not be written)
  }

  get storageKey() {
    return `kamaitachi-gba.text-edits.${this.lang}`;
  }

  async load() {
    let server = {};
    try {
      const response = await fetch(`/art/text-edits-${this.lang}.json`, { cache: "no-cache" });
      if (response.ok) server = await response.json();
    } catch {}
    let local = {};
    try { local = JSON.parse(localStorage.getItem(this.storageKey) ?? "{}"); } catch {}
    this.local = Object.keys(local).length > 0;
    this.entries = { ...server, ...local };
    return this;
  }

  map() {
    return new Map(Object.entries(this.entries).map(([key, entry]) => [key, unhex(entry.bytes)]));
  }

  set(key, text, bytes) {
    if (text === null) delete this.entries[key];
    else this.entries[key] = { text, bytes: hex(bytes) };
  }

  // To the PC first; what it does not take stays in this browser (and is sent again next time).
  async save() {
    try {
      const response = await fetch(`/edit/text-edits-${this.lang}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.entries),
      });
      if (response.ok) {
        try { localStorage.removeItem(this.storageKey); } catch {}
        this.local = false;
        return "pc";
      }
    } catch {}
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.entries)); } catch {}
    this.local = true;
    return "browser";
  }

  download() {
    const blob = new Blob([JSON.stringify(this.entries, null, 1)], { type: "application/json" });
    const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `text-edits-${this.lang}.json` });
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
}

const STYLE = `
.te-back { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,.72); display: grid; place-items: center; padding: 16px; }
.te { width: min(640px, 100%); max-height: 100%; overflow: auto; background: #16151a; color: #eee; border: 1px solid #333;
  border-radius: 10px; padding: 16px; font: 15px/1.5 "Noto Sans KR", system-ui, sans-serif; box-sizing: border-box; }
.te h2 { margin: 0 0 4px; font-size: 17px; }
.te .help { margin: 0 0 12px; color: #9a98a3; font-size: 13px; }
.te .run { margin: 0 0 14px; }
.te .orig { color: #8d8b96; font-size: 13px; white-space: pre-wrap; margin: 0 0 4px; }
.te textarea { width: 100%; box-sizing: border-box; min-height: 5.5em; background: #0d0c10; color: #fff; border: 1px solid #3a3940;
  border-radius: 6px; padding: 8px; font: inherit; resize: vertical; }
.te .run.edited textarea { border-color: #c0392b; }
.te .warn { color: #ff8a7a; font-size: 13px; min-height: 1em; }
.te .row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; margin-top: 8px; }
.te button { background: #2a2930; color: #eee; border: 0; border-radius: 6px; padding: 8px 14px; font: inherit; cursor: pointer; }
.te button.main { background: #c0392b; }
.te .small { padding: 4px 10px; font-size: 13px; }
.te .status { color: #9a98a3; font-size: 13px; margin-right: auto; align-self: center; }
`;

// The editor dialog for the page being read. `game` gives vm, font, language and restartPage().
export function openTextEditor(game) {
  const { vm, font } = game;
  const lang = game.language;
  const runs = (vm.pageRuns ?? []).filter((run) => run.raw?.length);
  const edits = game.textEdits;
  const codec = new TextCodec(lang, font);
  if (!document.getElementById("te-style")) document.head.append(Object.assign(document.createElement("style"), { id: "te-style", textContent: STYLE }));
  const back = document.createElement("div");
  back.className = "te-back";
  const box = document.createElement("div");
  box.className = "te";
  box.setAttribute("role", "dialog");
  box.innerHTML = `<h2>대사 편집 (${lang === "ko" ? "한국어" : "日本語"})</h2>
    <p class="help">중괄호 { } 안은 원작 제어 명령이라 그대로 두세요. {r} 줄바꿈, {p} 누를 때까지 대기, {g} 다음 페이지, {n1} 주인공 이름, {n2} 여자친구 이름.</p>`;
  if (!runs.length) box.insertAdjacentHTML("beforeend", `<p>이 화면에는 고칠 대사가 없어요. 이야기 화면에서 열어 주세요.</p>`);
  const fields = runs.map((run) => {
    const key = textKey(run.bank, run.offset);
    const original = codec.decode(run.raw);
    const current = edits.entries[key]?.text ?? original;
    const item = document.createElement("div");
    item.className = "run" + (edits.entries[key] ? " edited" : "");
    const orig = Object.assign(document.createElement("p"), { className: "orig", textContent: `원문 ${key}\n${original}` });
    const area = Object.assign(document.createElement("textarea"), { value: current, spellcheck: false });
    const warn = Object.assign(document.createElement("div"), { className: "warn" });
    const reset = Object.assign(document.createElement("button"), { className: "small", textContent: "원문으로" });
    reset.addEventListener("click", () => { area.value = original; check(); });
    const row = Object.assign(document.createElement("div"), { className: "row" });
    row.append(reset);
    item.append(orig, area, warn, row);
    box.append(item);
    const check = () => {
      const result = codec.encode(area.value);
      const notes = [];
      if (result.unknown.length) notes.push(`쓸 수 없는 문자: ${result.unknown.join(" ")}`);
      if (result.missing.length) notes.push(`글꼴에 없는 글자(빈칸으로 보임): ${result.missing.join(" ")}`);
      const tokens = (text) => (text.match(/\{[^}]*\}/g) ?? []).join("");
      if (tokens(area.value) !== tokens(original)) notes.push("제어 명령 { }이 원문과 달라요. 의도한 게 아니면 원문으로 되돌려 주세요.");
      warn.textContent = notes.join(" · ");
      return result;
    };
    area.addEventListener("input", check);
    check();
    return { key, original, area, check };
  });
  const actions = Object.assign(document.createElement("div"), { className: "row" });
  const status = Object.assign(document.createElement("span"), { className: "status" });
  if (edits.local) status.textContent = "PC에 아직 저장되지 않은 수정이 이 기기에 있어요.";
  const download = Object.assign(document.createElement("button"), { textContent: "수정 목록 내려받기" });
  const close = Object.assign(document.createElement("button"), { textContent: "닫기" });
  const save = Object.assign(document.createElement("button"), { className: "main", textContent: "저장하고 다시 보기" });
  actions.append(status, download, close);
  if (runs.length) actions.append(save);
  box.append(actions);
  back.append(box);
  // Keys typed here must not reach the game (Z would press A).
  for (const type of ["keydown", "keyup"]) back.addEventListener(type, (event) => event.stopPropagation());
  const done = () => { back.remove(); game.onEditorClosed?.(); };
  close.addEventListener("click", done);
  back.addEventListener("pointerdown", (event) => { if (event.target === back) done(); });
  download.addEventListener("click", () => edits.download());
  save.addEventListener("click", async () => {
    for (const field of fields) {
      const result = field.check();
      const text = field.area.value;
      edits.set(field.key, text === field.original ? null : text, result.bytes);
    }
    save.disabled = true;
    status.textContent = "저장 중…";
    const where = await edits.save();
    vm.textEdits = edits.map();
    game.restartPage();
    status.textContent = where === "pc" ? "PC에 저장했어요." : "PC에 저장하지 못해 이 기기에만 저장했어요.";
    setTimeout(done, where === "pc" ? 300 : 1500);
  });
  document.body.append(back);
  fields[0]?.area.focus();
  return back;
}
