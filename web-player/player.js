// A small sound-novel player that renders a normalized story (see story.js)
// into a root element. It can be mounted standalone (index.html) or inside
// another page's panel: everything it touches lives under `root`.
//
// Player controls (language, backlog) sit in the bar above the 4:3 screen,
// never on top of the original picture. The backlog opens as a modal dialog.

const PALETTE = ['#1d2633', '#33251f', '#1f2f28', '#2c2238', '#332d1c'];
const SETTINGS_KEY = 'soundnovel.webPlayer.settings';
const SLOT_COUNT = 3;
const LANGS = [
  { id: 'ko', label: '번역', aria: '번역문만 표시' },
  { id: 'both', label: '병기', aria: '원문과 번역문 함께 표시' },
  { id: 'ja', label: '원문', aria: '원문만 표시' },
];

function safeStorage() {
  try {
    const k = '__wp_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch {
    return null;
  }
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}

export function storageKey(story) {
  return `soundnovel.webPlayer.${story.gameId}`;
}

// options.startMenu: show a title screen (새 게임 / 이어하기) inside the 4:3 screen before playing.
export function createPlayer(root, story, { storage = safeStorage(), startMenu = false } = {}) {
  const sceneIds = Object.keys(story.scenes);
  const key = storageKey(story);
  const globalKey = `${key}.global`;
  const uid = Math.random().toString(36).slice(2, 8);

  const sceneLabel = el('p', { class: 'wp-scene', 'aria-live': 'polite' });
  const text = el('div', { class: 'wp-text', 'aria-live': 'polite' });
  const question = el('p', { class: 'wp-question', id: `wp-q-${uid}` });
  const optionList = el('div', { class: 'wp-options', role: 'group', 'aria-labelledby': question.id });
  const choices = el('div', { class: 'wp-choices' }, [question, optionList]);
  const nextHint = el('span', { class: 'wp-next', 'aria-hidden': 'true', text: '▼' });
  const advanceBtn = el('button', { type: 'button', class: 'wp-advance', 'aria-label': '다음 문장' });
  const resetBtn = el('button', { type: 'button', class: 'wp-reset', text: '첫 선택지로 돌아가기' });
  const endMsg = el('p', { class: 'wp-end-msg', text: '이 테스트 구간은 여기까지입니다.' });
  const end = el('div', { class: 'wp-end' }, [endMsg, resetBtn]);
  const menu = el('div', { class: 'wp-menu' });
  const bgImg = el('img', { class: 'wp-bg', alt: '', 'aria-hidden': 'true' });
  const bgm = el('audio', { class: 'wp-bgm', loop: '', preload: 'auto' });
  const stage = el('section', { class: 'wp-stage', 'aria-label': story.title }, [
    bgImg, bgm, sceneLabel, advanceBtn, text, nextHint, choices, end, menu,
  ]);

  const langBtn = el('button', { type: 'button', class: 'wp-tool wp-lang' });
  const logBtn = el('button', { type: 'button', class: 'wp-tool wp-log-open', 'aria-haspopup': 'dialog', text: '백로그' });
  const savesBtn = el('button', { type: 'button', class: 'wp-tool wp-saves-open', 'aria-haspopup': 'dialog', text: '저장' });
  if (!story.hasOriginal) langBtn.hidden = true;
  const tools = el('div', { class: 'wp-tools-bar' }, [langBtn, logBtn, savesBtn]);
  const titleBar = el('header', { class: 'wp-bar' }, [el('h1', { class: 'wp-title', text: story.title }), tools]);

  const logList = el('ol', { class: 'wp-log-list' });
  const logClose = el('button', { type: 'button', class: 'wp-tool wp-log-close', text: '닫기' });
  const logTitle = el('h2', { class: 'wp-log-title', id: `wp-log-${uid}`, text: '백로그' });
  const logDialog = el('dialog', { class: 'wp-dialog wp-log', 'aria-labelledby': logTitle.id }, [
    el('div', { class: 'wp-log-head' }, [logTitle, logClose]),
    logList,
  ]);

  const slotList = el('ol', { class: 'wp-slot-list' });
  const savesClose = el('button', { type: 'button', class: 'wp-tool wp-saves-close', text: '닫기' });
  const savesTitle = el('h2', { class: 'wp-log-title', id: `wp-saves-${uid}`, text: '저장 · 불러오기' });
  const savesMsg = el('p', { class: 'wp-saves-msg', role: 'status' });
  const savesDialog = el('dialog', { class: 'wp-dialog wp-saves', 'aria-labelledby': savesTitle.id }, [
    el('div', { class: 'wp-log-head' }, [savesTitle, savesClose]),
    slotList,
    savesMsg,
  ]);

  root.classList.add('wp-root');
  root.replaceChildren(titleBar, stage, logDialog, savesDialog);

  let settings = loadSettings();
  const saved = load();
  let state = saved || initial();
  let lastScene = null;

  // Flags named "g:..." survive new games (e.g. endings seen, which unlock choices on later plays).
  function loadGlobal() {
    try { return validFlags(JSON.parse(storage?.getItem(globalKey) || 'null')); } catch { return {}; }
  }
  function saveGlobal(flags) {
    const g = Object.fromEntries(Object.entries(flags).filter(([k]) => k.startsWith('g:')));
    if (!Object.keys(g).length) return;
    try { storage?.setItem(globalKey, JSON.stringify({ ...loadGlobal(), ...g })); } catch { /* ignore */ }
  }

  function initial() {
    return settle({ node: story.entry, page: 0, line: 0, done: false, trail: [], flags: { ...story.nodes[story.entry].set, ...loadGlobal() } });
  }

  // Nodes without sentences only set flags and branch: pass through them right away.
  function settle(st) {
    for (let guard = 0; guard < 1000; guard++) {
      const node = story.nodes[st.node];
      if (node.kind !== 'text' || node.pages.length || st.done) return st;
      const to = resolve(node.next, st.flags);
      if (!to) return { ...st, done: true };
      st = { ...st, node: to, trail: [...st.trail, { node: st.node }], flags: { ...st.flags, ...story.nodes[to].set } };
    }
    return { ...st, done: true };
  }

  // First rule whose `if` matches every listed flag; its `to` (null means the data ends here).
  function resolve(rules, flags) {
    const hit = rules.find((r) => !r.if || Object.entries(r.if).every(([k, v]) => flags[k] === v));
    return hit ? hit.to : null;
  }

  function validFlags(flags) {
    if (!flags || typeof flags !== 'object' || Array.isArray(flags)) return {};
    return Object.fromEntries(Object.entries(flags).filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v)));
  }

  function loadSettings() {
    try {
      const s = JSON.parse(storage?.getItem(SETTINGS_KEY) || 'null');
      return { lang: LANGS.some((l) => l.id === s?.lang) ? s.lang : 'ko' };
    } catch {
      return { lang: 'ko' };
    }
  }

  function saveSettings() {
    try { storage?.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
  }

  function validTrail(trail) {
    if (!Array.isArray(trail)) return [];
    return trail.every((t) => t && story.nodes[t.node]
      && (t.pick === undefined || story.nodes[t.node].options?.some((o) => o.key === t.pick)))
      ? trail.map((t) => (t.pick === undefined ? { node: t.node } : { node: t.node, pick: t.pick }))
      : [];
  }

  function load() {
    if (!storage) return null;
    try {
      return fromSaved(JSON.parse(storage.getItem(key) || 'null'));
    } catch {
      return null;
    }
  }

  // A saved position (auto-save or slot) back into a state, or null if it no longer fits this data.
  function fromSaved(saved) {
    if (!saved || saved.gameId !== story.gameId || saved.schemaVersion !== story.schemaVersion) return null;
    const node = story.nodes[saved.node];
    if (!node) return null;
    if (node.kind === 'text') {
      const page = node.pages[saved.page];
      if (!page || !Number.isInteger(saved.line) || saved.line < 0 || saved.line >= page.length) return null;
    }
    return {
      node: saved.node, page: saved.page | 0, line: saved.line | 0, done: !!saved.done, trail: validTrail(saved.trail),
      flags: { ...validFlags(saved.flags), ...loadGlobal() },
      carry: Array.isArray(saved.carry) ? saved.carry.filter((id) => story.nodes[id]?.kind === 'text') : [],
    };
  }


  function snapshot() {
    return {
      gameId: story.gameId,
      schemaVersion: story.schemaVersion,
      node: state.node,
      page: state.page,
      line: state.line,
      done: state.done,
      trail: state.trail,
      flags: state.flags,
      carry: state.carry || [],
    };
  }

  const slotsKey = `${key}.slots`;

  function readSlots() {
    try {
      const raw = JSON.parse(storage?.getItem(slotsKey) || '[]');
      return Array.from({ length: SLOT_COUNT }, (_, i) => (raw[i] && typeof raw[i] === 'object' ? raw[i] : null));
    } catch {
      return Array(SLOT_COUNT).fill(null);
    }
  }

  // The sentence on screen now (or the question), used as the slot's preview.
  function currentLine() {
    const node = story.nodes[state.node];
    if (node.kind === 'choice') return node.question.ko;
    return node.pages[state.page]?.[state.line]?.ko ?? "";
  }

  function saveSlot(i) {
    const slots = readSlots();
    slots[i] = { ...snapshot(), savedAt: new Date().toISOString(), preview: currentLine() };
    try {
      storage.setItem(slotsKey, JSON.stringify(slots));
      savesMsg.textContent = `${i + 1}번 칸에 저장했습니다.`;
    } catch {
      savesMsg.textContent = '저장 공간을 쓸 수 없어 저장하지 못했습니다.';
    }
    renderSlots();
    slotList.querySelector(`[data-slot="${i + 1}"] .wp-slot-save`)?.focus();
  }

  function loadSlot(i) {
    const next = fromSaved(readSlots()[i]);
    if (!next) return;
    closeDialog(savesDialog);
    setState(next, { focus: false });
  }

  function renderSlots() {
    const slots = readSlots();
    slotList.replaceChildren(...slots.map((slot, i) => {
      const next = slot && fromSaved(slot);
      const node = next && story.nodes[next.node];
      const scene = node?.scene ? story.scenes[node.scene].name : '';
      const when = slot?.savedAt ? new Date(slot.savedAt) : null;
      const whenText = when && !Number.isNaN(+when) ? when.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '';
      const info = el('div', { class: 'wp-slot-info' }, [
        el('span', { class: 'wp-slot-name', text: `${i + 1}번 칸` }),
        el('span', { class: 'wp-slot-meta', text: next ? [scene, whenText].filter(Boolean).join(' · ') : slot ? '이 데이터와 맞지 않는 기록' : '비어 있음' }),
      ]);
      if (next && slot.preview) info.append(el('span', { class: 'wp-slot-preview', text: slot.preview }));
      const saveB = el('button', { type: 'button', class: 'wp-tool wp-slot-save', text: '여기에 저장', 'aria-label': `${i + 1}번 칸에 저장` });
      const loadB = el('button', { type: 'button', class: 'wp-tool wp-slot-load', text: '불러오기', 'aria-label': `${i + 1}번 칸 불러오기` });
      if (!next) loadB.disabled = true;
      if (!storage) saveB.disabled = true;
      saveB.addEventListener('click', () => saveSlot(i));
      loadB.addEventListener('click', () => loadSlot(i));
      return el('li', { class: 'wp-slot', 'data-slot': String(i + 1) }, [info, el('div', { class: 'wp-slot-actions' }, [saveB, loadB])]);
    }));
  }

  function save() {
    if (!storage) return;
    try {
      storage.setItem(key, JSON.stringify(snapshot()));
    } catch { /* storage full or blocked: keep playing without saving */ }
  }

  function setState(next, { focus = true } = {}) {
    state = next;
    saveGlobal(state.flags);
    save();
    render(focus);
  }

  // Arriving at a node applies its `set`.
  // `carry`: earlier nodes whose last page stays on screen (a node marked `keep` ends mid-page).
  function goTo(nodeId, step, flags = state.flags, carry = []) {
    setState(settle({
      node: nodeId, page: 0, line: 0, done: false, trail: [...state.trail, step], flags: { ...flags, ...story.nodes[nodeId].set }, carry,
    }));
  }

  // Picking applies the option's `set`, then its `next` rules decide where to go.
  // No destination means the data ends here: record the pick and show the end screen.
  function choose(option, extra = {}) {
    const step = { node: state.node, pick: option.key };
    const flags = { ...state.flags, ...option.set, ...extra };
    const to = resolve(option.next, flags);
    if (to) goTo(to, step, flags);
    else setState({ ...state, done: true, trail: [...state.trail, step], flags });
  }

  function advance() {
    const node = story.nodes[state.node];
    if (node.kind !== 'text' || state.done) return;
    const page = node.pages[state.page];
    if (state.line < page.length - 1) return setState({ ...state, line: state.line + 1 });
    if (state.page < node.pages.length - 1) return setState({ ...state, page: state.page + 1, line: 0, carry: [] });
    const to = resolve(node.next, state.flags);
    const carry = node.keep ? [...(state.page === 0 ? state.carry || [] : []), state.node] : [];
    if (to) return goTo(to, { node: state.node }, state.flags, carry);
    setState({ ...state, done: true });
  }

  function reset() {
    if (storage) {
      try { storage.removeItem(key); } catch { /* ignore */ }
    }
    state = initial();
    save();
    render(true);
  }

  // One sentence in the current language mode. Falls back to Korean when there is no original.
  function sentence(tag, s, cls) {
    const node = el(tag, cls ? { class: cls } : {});
    const lang = settings.lang;
    if (!s.ja && story.lang !== 'ko') node.lang = story.lang;
    if (lang === 'ja' && s.ja) {
      node.lang = 'ja';
      node.textContent = withSlots(s.ja);
    } else {
      if (lang === 'both' && s.ja) node.append(el('span', { class: 'wp-sub', lang: 'ja', text: withSlots(s.ja) }));
      node.append(withSlots(s.ko));
    }
    return node;
  }

  // Names typed during play ("name:<slot>" flags) fill the {name:<slot>} tokens left in the text.
  function withSlots(t) {
    return t.includes('{name:') ? t.replace(/\{name:([^}]+)\}/g, (m, id) => state.flags[`name:${id}`] ?? '？？？') : t;
  }

  // Name entry: alias match picks the option; the typed (or rewritten) name is kept in its slot.
  function submitName(node, value) {
    const typed = value.normalize('NFKC').trim().slice(0, node.input.maxLength);
    if (!typed) return;
    let name = typed;
    let key = node.input.fallback;
    if (node.input.sequential) {
      for (const m of node.input.match) {
        if (m.aliases.includes(name)) { name = m.as ?? name; key = m.option; }
      }
    } else {
      const hit = node.input.match.find((m) => m.aliases.includes(typed));
      if (hit) { name = hit.as ?? typed; key = hit.option; }
    }
    const option = node.options.find((o) => o.key === key);
    choose(option, node.input.slot ? { [`name:${node.input.slot}`]: name } : {});
  }

  function carried() {
    if (state.page !== 0) return [];
    return (state.carry || []).flatMap((id) => story.nodes[id]?.pages.at(-1) || []);
  }

  // Sentences shown on screen: a `join` sentence continues the previous one's line.
  function lines(list) {
    const out = [];
    for (const s of list) {
      if (s.join && out.length) out[out.length - 1].append(...sentence('span', s).childNodes);
      else out.push(sentence('p', s));
    }
    return out;
  }

  // Background and music follow the "media:*" flags; music only starts after a click (autoplay rules).
  function renderMedia() {
    const url = (v) => (v ? new URL(story.assets + v, document.baseURI).href : '');
    const bg = url(state.flags['media:bg']);
    if (bgImg.dataset.src !== bg) {
      bgImg.dataset.src = bg;
      if (bg) bgImg.src = bg; else bgImg.removeAttribute('src');
      bgImg.hidden = !bg;
    }
    const music = url(state.flags['media:bgm']);
    if (bgm.dataset.src !== music) {
      bgm.dataset.src = music;
      if (music) { bgm.src = music; bgm.play?.().catch(() => { /* waits for a user gesture */ }); } else { bgm.pause?.(); bgm.removeAttribute('src'); }
    }
  }

  function renderScene(node) {
    const id = node.scene;
    stage.dataset.scene = id || '';
    const idx = id ? sceneIds.indexOf(id) : -1;
    stage.style.setProperty('--wp-scene-bg', PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length]);
    sceneLabel.textContent = id ? story.scenes[id].name : '';
    if (lastScene !== null && lastScene !== id) {
      stage.classList.remove('wp-scene-change');
      void stage.offsetWidth; // restart the transition
      stage.classList.add('wp-scene-change');
    }
    lastScene = id;
  }

  function renderTools() {
    const i = LANGS.findIndex((l) => l.id === settings.lang);
    const next = LANGS[(i + 1) % LANGS.length];
    langBtn.textContent = LANGS[i].label;
    langBtn.dataset.lang = settings.lang;
    langBtn.setAttribute('aria-label', `표시 언어: ${LANGS[i].aria}. 누르면 ${next.label}(으)로 바뀝니다`);
  }

  // Title screen: drawn in place of the original's own title, so it stays inside the 4:3 screen.
  function showMenu(step = 'top') {
    stage.dataset.mode = 'menu';
    tools.style.visibility = 'hidden'; // keep the bar's height so the screen does not jump
    sceneLabel.textContent = '';
    const btn = (label, onClick, disabled = false) => {
      const b = el('button', { type: 'button', class: 'wp-menu-item', text: label });
      b.disabled = disabled;
      b.addEventListener('click', onClick);
      return b;
    };
    if (step === 'top') {
      const resume = btn('이어하기', enterGame, !saved);
      const fresh = btn('새 게임', () => (story.names.length ? showMenu('names') : startNew()));
      menu.replaceChildren(el('h2', { class: 'wp-menu-title', text: story.title }), el('div', { class: 'wp-menu-list' }, [fresh, resume]));
      (saved ? resume : fresh).focus();
    } else {
      const begin = btn('기본 이름으로 시작', startNew);
      menu.replaceChildren(
        el('p', { class: 'wp-menu-names', text: story.names.join(' · ') }),
        el('div', { class: 'wp-menu-list' }, [begin, btn('뒤로', () => showMenu('top'))]),
      );
      begin.focus();
    }
  }

  function startNew() {
    state = initial();
    save();
    enterGame();
  }

  function enterGame() {
    tools.style.visibility = '';
    menu.replaceChildren();
    render(true);
  }

  function render(focus) {
    renderTools();
    const node = story.nodes[state.node];
    renderScene(node);
    renderMedia();
    stage.dataset.mode = state.done ? 'end' : node.kind === 'choice' ? 'choice' : 'text';

    if (state.done) {
      if (node.kind === 'choice') text.replaceChildren();
      else text.replaceChildren(...lines((node.pages[state.page] || []).slice(0, state.line + 1)));
      endMsg.textContent = node.ending !== undefined ? `엔딩 ${node.ending}` : '이 테스트 구간은 여기까지입니다.';
      if (focus) resetBtn.focus({ preventScroll: true });
      return;
    }

    if (node.kind === 'choice' && node.input) {
      text.replaceChildren();
      question.replaceChildren(...sentence('span', node.question).childNodes);
      const field = el('input', { type: 'text', class: 'wp-name-input', maxlength: String(node.input.maxLength), placeholder: `이름 입력 (${node.input.maxLength}글자까지)`, 'aria-label': node.question.ko || '이름 입력', autocomplete: 'off', lang: story.lang });
      const ok = el('button', { type: 'submit', class: 'wp-option wp-name-ok', text: '확인' });
      const form = el('form', { class: 'wp-name-form' }, [field, ok]);
      form.addEventListener('submit', (e) => { e.preventDefault(); submitName(node, field.value); });
      optionList.replaceChildren(form);
      if (focus) field.focus();
      return;
    }

    if (node.kind === 'choice') {
      text.replaceChildren();
      question.replaceChildren(...sentence('span', node.question).childNodes);
      question.lang = settings.lang === 'ja' && node.question.ja ? 'ja' : '';
      const focused = document.activeElement?.closest?.('.wp-option')?.dataset.key;
      optionList.replaceChildren(...node.options.map((o) => {
        const b = el('button', { type: 'button', class: 'wp-option', 'data-key': o.key }, [
          el('span', { class: 'wp-option-key', text: o.key, 'aria-hidden': 'true' }),
          sentence('span', o.label, 'wp-option-label'),
        ]);
        b.setAttribute('aria-label', `${o.key}. ${b.querySelector('.wp-option-label').textContent}`);
        b.addEventListener('click', () => choose(o));
        return b;
      }));
      if (focus) optionList.querySelector('button')?.focus();
      else if (focused) optionList.querySelector(`[data-key="${CSS.escape(focused)}"]`)?.focus();
      return;
    }

    text.replaceChildren(...lines([...carried(), ...node.pages[state.page].slice(0, state.line + 1)]));
    if (focus) (state.done ? resetBtn : advanceBtn).focus({ preventScroll: true });
  }

  // Everything read so far: each visited node in order, then the current node up to the current sentence.
  function renderLog() {
    const items = [];
    const add = (s, cls) => items.push(sentence('li', s, cls));
    const addText = (node, upToPage, upToLine) => {
      node.pages.forEach((p, pi) => {
        if (pi > upToPage) return;
        p.forEach((s, li) => { if (pi < upToPage || li <= upToLine) add(s); });
      });
    };
    for (const t of state.trail) {
      const node = story.nodes[t.node];
      if (node.kind === 'choice') {
        add(node.question, 'wp-log-q');
        const o = node.options.find((x) => x.key === t.pick);
        if (o) add(o.label, 'wp-log-pick');
      } else {
        addText(node, Infinity, Infinity);
      }
    }
    const cur = story.nodes[state.node];
    if (cur.kind === 'choice') { if (!state.done) add(cur.question, 'wp-log-q'); }
    else addText(cur, state.page, state.done ? Infinity : state.line);
    logList.replaceChildren(...items);
  }

  function openDialog(d, focusEl) {
    if (typeof d.showModal === 'function') d.showModal();
    else d.setAttribute('open', '');
    focusEl.focus();
  }

  function closeDialog(d) {
    if (typeof d.close === 'function') d.close();
    else d.removeAttribute('open');
  }

  function openLog() {
    renderLog();
    openDialog(logDialog, logClose);
    logList.lastElementChild?.scrollIntoView({ block: 'end' });
  }

  function openSaves() {
    savesMsg.textContent = '';
    renderSlots();
    openDialog(savesDialog, savesClose);
  }

  function moveFocus(delta) {
    const buttons = [...optionList.querySelectorAll('button')];
    if (!buttons.length) return;
    const i = buttons.indexOf(document.activeElement);
    const next = i < 0 ? 0 : (i + delta + buttons.length) % buttons.length;
    buttons[next].focus();
  }

  advanceBtn.addEventListener('click', advance);
  resetBtn.addEventListener('click', reset);
  langBtn.addEventListener('click', () => {
    const i = LANGS.findIndex((l) => l.id === settings.lang);
    settings = { ...settings, lang: LANGS[(i + 1) % LANGS.length].id };
    saveSettings();
    render(false);
  });
  logBtn.addEventListener('click', openLog);
  savesBtn.addEventListener('click', openSaves);
  logClose.addEventListener('click', () => closeDialog(logDialog));
  savesClose.addEventListener('click', () => closeDialog(savesDialog));
  for (const d of [logDialog, savesDialog]) {
    // Back to the story, not to the opener, so Enter keeps reading instead of reopening the dialog.
    // The browser restores focus to the opener after 'close', so move it on the next task.
    d.addEventListener('close', () => setTimeout(() => {
      const mode = stage.dataset.mode;
      (mode === 'choice' ? optionList.querySelector('button') : mode === 'end' ? resetBtn : advanceBtn)
        ?.focus({ preventScroll: true });
    }));
    d.addEventListener('click', (e) => { if (e.target === d) closeDialog(d); });
  }

  root.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (logDialog.open || savesDialog.open) return; // dialogs handle their own keys (Esc closes them)
    if (e.target instanceof HTMLButtonElement && tools.contains(e.target)) return;
    const mode = stage.dataset.mode;
    if (mode === 'menu') {
      const items = [...menu.querySelectorAll('button:not(:disabled)')];
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
      }
      return;
    }
    if (mode === 'choice') {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); moveFocus(1); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(-1); }
      else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        (optionList.querySelector('button:focus') || optionList.querySelector('button'))?.click();
      }
    } else if (mode === 'text') {
      if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); openLog(); return; }
      const isAdvanceKey = ['Enter', ' ', 'ArrowDown', 'ArrowRight'].includes(e.key);
      // Enter/Space on the advance button itself are handled by its click.
      if (isAdvanceKey && !(e.target === advanceBtn && (e.key === 'Enter' || e.key === ' '))) {
        e.preventDefault();
        advance();
      }
    }
  });

  if (startMenu) showMenu();
  else render(true);

  return {
    get state() { return { ...state, trail: [...state.trail] }; },
    reset,
    advance,
    openLog,
    openSaves,
  };
}
