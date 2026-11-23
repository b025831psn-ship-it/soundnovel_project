// A small sound-novel player that renders a normalized story (see story.js)
// into a root element. It can be mounted standalone (index.html) or inside
// another page's panel: everything it touches lives under `root`.

const PALETTE = ['#1d2633', '#33251f', '#1f2f28', '#2c2238', '#332d1c'];

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

  const sceneLabel = el('p', { class: 'wp-scene', 'aria-live': 'polite' });
  const text = el('div', { class: 'wp-text', 'aria-live': 'polite' });
  const question = el('p', { class: 'wp-question' });
  const optionList = el('div', { class: 'wp-options', role: 'group' });
  const choices = el('div', { class: 'wp-choices' }, [question, optionList]);
  const nextHint = el('span', { class: 'wp-next', 'aria-hidden': 'true', text: '▼' });
  const advanceBtn = el('button', { type: 'button', class: 'wp-advance', 'aria-label': '다음 문장' });
  const resetBtn = el('button', { type: 'button', class: 'wp-reset', text: '첫 선택지로 돌아가기' });
  const endMsg = el('p', { class: 'wp-end-msg', text: '이 테스트 구간은 여기까지입니다.' });
  const end = el('div', { class: 'wp-end' }, [endMsg, resetBtn]);
  const stage = el('section', { class: 'wp-stage', 'aria-label': story.title }, [
    sceneLabel, advanceBtn, text, nextHint, choices, end,
  ]);
  const titleBar = el('header', { class: 'wp-bar' }, [el('h1', { class: 'wp-title', text: story.title })]);

  root.classList.add('wp-root');
  root.replaceChildren(titleBar, stage);
  question.id = `wp-q-${Math.random().toString(36).slice(2, 8)}`;
  optionList.setAttribute('aria-labelledby', question.id);

  let state = load() || initial();
  let lastScene = null;

  function initial() {
    return { node: story.entry, page: 0, line: 0, done: false };
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
      return { node: saved.node, page: saved.page | 0, line: saved.line | 0, done: !!saved.done };
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
      }));
    } catch { /* storage full or blocked: keep playing without saving */ }
  }

  function setState(next, { focus = true } = {}) {
    state = next;
    save();
    render(focus);
  }

  function goTo(nodeId) {
    setState({ node: nodeId, page: 0, line: 0, done: false });
  }

  function advance() {
    const node = story.nodes[state.node];
    if (node.kind !== 'text' || state.done) return;
    const page = node.pages[state.page];
    if (state.line < page.length - 1) return setState({ ...state, line: state.line + 1 });
    if (state.page < node.pages.length - 1) return setState({ ...state, page: state.page + 1, line: 0 });
    if (node.to) return goTo(node.to);
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

  function render(focus) {
    const node = story.nodes[state.node];
    renderScene(node);
    stage.dataset.mode = node.kind === 'choice' ? 'choice' : state.done ? 'end' : 'text';

    if (node.kind === 'choice') {
      text.replaceChildren();
      question.textContent = node.question;
      optionList.replaceChildren(...node.options.map((o) => {
        const b = el('button', { type: 'button', class: 'wp-option', 'data-key': o.key }, [
          el('span', { class: 'wp-option-key', text: o.key, 'aria-hidden': 'true' }),
          el('span', { class: 'wp-option-label', text: o.label }),
        ]);
        b.setAttribute('aria-label', `${o.key}. ${o.label}`);
        b.addEventListener('click', () => { if (o.to) goTo(o.to); else reset(); });
        return b;
      }));
      if (focus) optionList.querySelector('button')?.focus();
      return;
    }

    const page = node.pages[state.page];
    text.replaceChildren(...page.slice(0, state.line + 1).map((s) => el('p', { text: s })));
    if (focus) (state.done ? resetBtn : advanceBtn).focus({ preventScroll: true });
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
  root.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const mode = stage.dataset.mode;
    if (mode === 'choice') {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); moveFocus(1); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(-1); }
      else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        (optionList.querySelector('button:focus') || optionList.querySelector('button'))?.click();
      }
    } else if (mode === 'text') {
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
    get state() { return { ...state }; },
    reset,
    advance,
  };
}
