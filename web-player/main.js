import { normalizeStory, StoryFormatError } from './story.js';
import { createPlayer } from './player.js';

// Data source, in priority order:
//   1. a JSON file picked with "JSON 파일 열기" (kept for this tab in sessionStorage)
//   2. ?data=<path> in the URL, e.g. ?data=data/local/first-choice.ko.json
//   3. the bundled sample, data/sample.ko.json
const PICKED_KEY = 'soundnovel.webPlayer.pickedFile';
const DEFAULT_DATA = 'data/sample.ko.json';

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

async function start() {
  try {
    const { label, raw, picked } = await loadRaw();
    status.textContent = label;
    useDefault.hidden = !picked;
    createPlayer(root, normalizeStory(raw));
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
