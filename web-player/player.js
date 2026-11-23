// A small sound-novel player that renders a normalized story (see story.js)
// into a root element. It can be mounted standalone (index.html) or inside
// another page's panel: everything it touches lives under `root`.
//
// Player controls (language, backlog) sit in the bar above the 4:3 screen,
// never on top of the original picture. The backlog opens as a modal dialog.

const PALETTE = ['#1d2633', '#33251f', '#1f2f28', '#2c2238', '#332d1c'];
const SETTINGS_KEY = 'soundnovel.webPlayer.settings';
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

export function createPlayer(root, story, { storage = safeStorage() } = {}) {
  const sceneIds = Object.keys(story.scenes);
  const key = storageKey(story);
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
  const stage = el('section', { class: 'wp-stage', 'aria-label': story.title }, [
    sceneLabel, advanceBtn, text, nextHint, choices, end,
  ]);

  const langBtn = el('button', { type: 'button', class: 'wp-tool wp-lang' });
  const logBtn = el('button', { type: 'button', class: 'wp-tool wp-log-open', 'aria-haspopup': 'dialog', text: '백로그' });
  if (!story.hasOriginal) langBtn.hidden = true;
  const tools = el('div', { class: 'wp-tools-bar' }, [langBtn, logBtn]);
  const titleBar = el('header', { class: 'wp-bar' }, [el('h1', { class: 'wp-title', text: story.title }), tools]);

  const logList = el('ol', { class: 'wp-log-list' });
  const logClose = el('button', { type: 'button', class: 'wp-tool wp-log-close', text: '닫기' });
  const logTitle = el('h2', { class: 'wp-log-title', id: `wp-log-${uid}`, text: '백로그' });
  const logDialog = el('dialog', { class: 'wp-log', 'aria-labelledby': logTitle.id }, [
    el('div', { class: 'wp-log-head' }, [logTitle, logClose]),
    logList,
  ]);

  root.classList.add('wp-root');
  root.replaceChildren(titleBar, stage, logDialog);

  let settings = loadSettings();
  let state = load() || initial();
  let lastScene = null;

  function initial() {
    return { node: story.entry, page: 0, line: 0, done: false, trail: [] };
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
      const saved = JSON.parse(storage.getItem(key) || 'null');
      if (!saved || saved.gameId !== story.gameId || saved.schemaVersion !== story.schemaVersion) return null;
      const node = story.nodes[saved.node];
      if (!node) return null;
      if (node.kind === 'text') {
        const page = node.pages[saved.page];
        if (!page || !Number.isInteger(saved.line) || saved.line < 0 || saved.line >= page.length) return null;
      }
      return {
        node: saved.node, page: saved.page | 0, line: saved.line | 0, done: !!saved.done, trail: validTrail(saved.trail),
      };
    } catch {
      return null;
    }
  }

  function save() {
    if (!storage) return;
    try {
      storage.setItem(key, JSON.stringify({
        gameId: story.gameId,
        schemaVersion: story.schemaVersion,
        node: state.node,
        page: state.page,
        line: state.line,
        done: state.done,
        trail: state.trail,
      }));
    } catch { /* storage full or blocked: keep playing without saving */ }
  }

  function setState(next, { focus = true } = {}) {
    state = next;
    save();
    render(focus);
  }

  function goTo(nodeId, step) {
    setState({ node: nodeId, page: 0, line: 0, done: false, trail: [...state.trail, step] });
  }

  function choose(option) {
    if (option.to) goTo(option.to, { node: state.node, pick: option.key });
    else reset();
  }

  function advance() {
    const node = story.nodes[state.node];
    if (node.kind !== 'text' || state.done) return;
    const page = node.pages[state.page];
    if (state.line < page.length - 1) return setState({ ...state, line: state.line + 1 });
    if (state.page < node.pages.length - 1) return setState({ ...state, page: state.page + 1, line: 0 });
    if (node.to) return goTo(node.to, { node: state.node });
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
    if (lang === 'ja' && s.ja) {
      node.lang = 'ja';
      node.textContent = s.ja;
    } else {
      if (lang === 'both' && s.ja) node.append(el('span', { class: 'wp-sub', lang: 'ja', text: s.ja }));
      node.append(s.ko);
    }
    return node;
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

  function render(focus) {
    renderTools();
    const node = story.nodes[state.node];
    renderScene(node);
    stage.dataset.mode = node.kind === 'choice' ? 'choice' : state.done ? 'end' : 'text';

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

    const page = node.pages[state.page];
    text.replaceChildren(...page.slice(0, state.line + 1).map((s) => sentence('p', s)));
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
    if (cur.kind === 'choice') add(cur.question, 'wp-log-q');
    else addText(cur, state.page, state.done ? Infinity : state.line);
    logList.replaceChildren(...items);
  }

  function openLog() {
    renderLog();
    if (typeof logDialog.showModal === 'function') logDialog.showModal();
    else logDialog.setAttribute('open', '');
    logDialog.querySelector('.wp-log-list').lastElementChild?.scrollIntoView({ block: 'end' });
    logClose.focus();
  }

  function closeLog() {
    if (typeof logDialog.close === 'function') logDialog.close();
    else logDialog.removeAttribute('open');
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
  logClose.addEventListener('click', closeLog);
  // Back to the story, not to the backlog button, so Enter keeps reading instead of reopening it.
  // The browser restores focus to the opener after 'close', so move it on the next task.
  logDialog.addEventListener('close', () => setTimeout(() => {
    const mode = stage.dataset.mode;
    (mode === 'choice' ? optionList.querySelector('button') : mode === 'end' ? resetBtn : advanceBtn)
      ?.focus({ preventScroll: true });
  }));
  logDialog.addEventListener('click', (e) => { if (e.target === logDialog) closeLog(); });

  root.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (logDialog.open) return; // the dialog handles its own keys (Esc closes it)
    if (e.target instanceof HTMLButtonElement && tools.contains(e.target)) return;
    const mode = stage.dataset.mode;
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

  render(true);

  return {
    get state() { return { ...state, trail: [...state.trail] }; },
    reset,
    advance,
    openLog,
  };
}
