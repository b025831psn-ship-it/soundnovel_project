import { normalizeStory, StoryFormatError } from './story.js';
import { createPlayer } from './player.js';
import { getAdapter, cachedStory, convertFiles, forgetStory } from './rom/loader.js';

// Data source, in priority order:
//   1. a JSON file picked with "JSON 파일 열기" (kept for this tab in sessionStorage)
//   2. ?data=<path> in the URL, e.g. ?data=data/local/first-choice.ko.json
//   3. the bundled sample, data/sample.ko.json
// ?rom=<adapter id> instead plays from the user's own ROM, converted in this browser (see rom/).
const PICKED_KEY = 'soundnovel.webPlayer.pickedFile';
const DEFAULT_DATA = 'data/sample.ko.json';

// ?embed=1: only the 4:3 screen, sized to fit the frame (for the hub's iframe panel).
if (new URLSearchParams(location.search).get('embed') === '1') document.documentElement.dataset.embed = '';

const root = document.getElementById('player');
const status = document.getElementById('source');
const picker = document.getElementById('file');
const useDefault = document.getElementById('use-default');

function session() {
  try { return window.sessionStorage; } catch { return null; }
}

function showError(message) {
  const p = document.createElement('p');
  p.className = 'wp-error';
  p.setAttribute('role', 'alert');
  p.textContent = message;
  root.replaceChildren(p);
}

async function loadRaw() {
  const picked = session()?.getItem(PICKED_KEY);
  if (picked) {
    const { name, text } = JSON.parse(picked);
    return { label: `열어 둔 파일: ${name}`, raw: JSON.parse(text), picked: true };
  }
  const path = new URLSearchParams(location.search).get('data') || DEFAULT_DATA;
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path}를 불러오지 못했습니다 (HTTP ${res.status}).`);
  return { label: `데이터: ${path}`, raw: await res.json(), picked: false };
}

const params = new URLSearchParams(location.search);
const startMenu = params.get('start') === '1';

function play(story) {
  createPlayer(root, story, { startMenu });
}

// "Open your ROM" screen, drawn where the game screen will be.
function showRomPrompt(adapter, message = '') {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = adapter.files.length > 1;
  input.accept = '.gba,.bin,application/octet-stream';
  input.className = 'wp-rom-input';
  const label = document.createElement('label');
  label.className = 'wp-menu-item wp-rom-pick';
  label.append('ROM 파일 열기', input);
  const list = document.createElement('ul');
  list.className = 'wp-rom-files';
  for (const f of adapter.files) {
    const li = document.createElement('li');
    li.textContent = `${f.label}${f.required ? '' : ' (선택)'}`;
    list.append(li);
  }
  const note = document.createElement('p');
  note.className = 'wp-rom-note';
  note.textContent = '파일은 이 브라우저 안에서만 읽고, 어디에도 올리지 않습니다.';
  const err = document.createElement('p');
  err.className = 'wp-rom-error';
  err.setAttribute('role', 'alert');
  err.textContent = message;
  const title = document.createElement('h2');
  title.className = 'wp-menu-title';
  title.textContent = adapter.title;
  const box = document.createElement('section');
  box.className = 'wp-rom';
  box.setAttribute('aria-label', `${adapter.title} ROM 열기`);
  box.append(title, list, label, note, err);
  root.classList.add('wp-root');
  root.replaceChildren(box);
  input.addEventListener('change', async () => {
    if (!input.files?.length) return;
    err.textContent = '변환하는 중…';
    try {
      const { story } = await convertFiles(adapter, [...input.files]);
      status.textContent = `${adapter.title}: 내 ROM에서 변환 (이 브라우저에만 저장)`;
      forget.hidden = false;
      play(story);
    } catch (e) {
      err.textContent = (e instanceof StoryFormatError ? '변환 결과 형식 오류: ' : '') + e.message;
    }
  });
  label.focus?.();
}

const forget = document.getElementById('forget-rom');

async function startFromRom(id) {
  const adapter = getAdapter(id);
  if (!adapter) throw new Error(`모르는 ROM 종류입니다: ${id}`);
  picker.closest('label').hidden = true;
  forget.addEventListener('click', async () => {
    await forgetStory(adapter.id);
    location.reload();
  });
  const cached = await cachedStory(adapter.id);
  if (cached) {
    status.textContent = `${adapter.title}: 내 ROM에서 변환 (이 브라우저에만 저장)`;
    forget.hidden = false;
    play(normalizeStory(cached.raw));
  } else {
    status.textContent = `${adapter.title}: ROM 파일이 필요합니다`;
    showRomPrompt(adapter);
  }
}

async function start() {
  try {
    if (params.get('rom')) return await startFromRom(params.get('rom'));
    const { label, raw, picked } = await loadRaw();
    status.textContent = label;
    useDefault.hidden = !picked;
    // ?start=1: open on the title screen (새 게임 / 이어하기), as the hub does.
    play(normalizeStory(raw));
  } catch (err) {
    const prefix = err instanceof StoryFormatError ? 'JSON 형식 오류: ' : '';
    showError(prefix + err.message);
    if (location.protocol === 'file:') {
      showError('파일을 직접 열면 JSON을 읽을 수 없습니다. README의 실행 방법대로 로컬 서버로 열어 주세요.');
    }
  }
}

picker.addEventListener('change', async () => {
  const file = picker.files && picker.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    normalizeStory(JSON.parse(text));
  } catch (err) {
    showError(`${file.name}: ${err.message}`);
    return;
  }
  session()?.setItem(PICKED_KEY, JSON.stringify({ name: file.name, text }));
  location.reload();
});

useDefault.addEventListener('click', () => {
  session()?.removeItem(PICKED_KEY);
  location.reload();
});

start();
