import {paintFrame, renderBackground, unpackPicture} from './src/background.mjs';
import {GameSession} from './src/game-session.mjs';
import {VirtualMemoryCard} from './src/memory-card.mjs';
import {DEFAULT_NAMES, NAME_FIELDS, completeNames} from './src/name-entry.mjs';
import {chooseStart, startOptions} from '../../shared/player/start-choice.js';
import {wireReportButton} from '../../shared/player/report-button.js';
import {wireTouchChoices} from '../../shared/player/touch-choices.js';

const $ = id => document.getElementById(id);
const canvas = $('screen'), panel = $('panel'), overlay = $('overlay'), status = $('status');
const params = new URLSearchParams(location.search);
const base = new URL(params.get('data') ?? '../../majo-tachi-ps1-kor/port-data/', location.href);

const storage = {
  get() { try { return localStorage.getItem('majo-ps1.card'); } catch { return null; } },
  set(value) { try { localStorage.setItem('majo-ps1.card', value); } catch { /* private mode */ } },
};
const encode = bytes => { let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); return btoa(binary); };
const decode = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));
const saved = storage.get();
const card = new VirtualMemoryCard(saved ? decode(saved) : null);
const session = new GameSession({locale: params.get('lang') === 'ja' ? 'ja' : 'ko', card});
let touchRows = [], currentText = null;

async function get(path, type = 'arrayBuffer') {
  const response = await fetch(new URL(path, base));
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response[type]();
}

async function loadTitle() {
  const manifest = await get('manifest.json', 'json');
  const entry = manifest.resources?.['TITLE.P'];
  if (!entry) throw new Error('manifest has no TITLE.P');
  const bytes = new Uint8Array(await get(typeof entry === 'string' ? entry : entry.file));
  paintFrame(canvas, renderBackground(unpackPicture(bytes)));
  status.textContent = 'SLPS-01863';
}

function showStart() {
  panel.replaceChildren();
  const heading = document.createElement('h1');
  heading.textContent = session.locale === 'ko' ? '마녀들의 잠 ―부활제―' : '魔女たちの眠り ―復活祭―';
  panel.append(heading);
  const labels = {new: '새로 시작', continue: '이어하기'};
  for (const action of startOptions(Boolean(card.load()))) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = labels[action];
    button.addEventListener('click', () => chooseStart(action, {new: showNames, continue: resume}));
    panel.append(button);
  }
  overlay.hidden = false;
}

function showNames() {
  panel.replaceChildren();
  const heading = document.createElement('h1'); heading.textContent = '이름 입력'; panel.append(heading);
  const defaults = DEFAULT_NAMES[session.locale];
  const labels = {partnerGiven: '연인 이름', partnerFamily: '연인 성', protagonistGiven: '주인공 이름', protagonistFamily: '주인공 성'};
  const fields = {};
  for (const name of NAME_FIELDS) {
    const label = document.createElement('label'); label.className = 'name-row'; label.textContent = labels[name];
    const input = document.createElement('input'); input.value = defaults[name]; input.maxLength = 4; input.required = true;
    label.append(input); panel.append(label); fields[name] = input;
  }
  const submit = document.createElement('button'); submit.type = 'button'; submit.textContent = '결정'; panel.append(submit);
  submit.addEventListener('click', () => {
    try {
      session.newGame(completeNames(Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value])), session.locale));
      overlay.hidden = true; status.textContent = '독서 중';
      globalThis.dispatchEvent(new CustomEvent('majo-session-start', {detail: session}));
    } catch { status.textContent = '각 항목에 허용된 글자를 1~4자 입력하세요'; }
  });
}

function resume() {
  if (!session.continue()) return showStart();
  overlay.hidden = true; status.textContent = '이어하기';
  globalThis.dispatchEvent(new CustomEvent('majo-session-continue', {detail: session}));
}

$('save').addEventListener('click', () => { if (session.screen !== 'reading') return; storage.set(encode(session.save())); status.textContent = '저장했습니다'; });
$('menu').addEventListener('click', () => { session.screen === 'menu' ? session.closeMenu() : session.openMenu(); status.textContent = session.screen === 'menu' ? '독서 메뉴' : '독서 중'; });
wireReportButton($('report'));
wireTouchChoices(canvas, () => ({touchRows}), index => globalThis.dispatchEvent(new CustomEvent('majo-choice', {detail: {index}})), () => globalThis.dispatchEvent(new Event('majo-confirm')));
globalThis.soundnovelReport = () => ({scene: session.position, text: currentText});
globalThis.majoPlayer = {session, setTouchRows(rows) { touchRows = rows; }, setCurrentText(text) { currentText = text; }};

loadTitle().catch(error => { status.textContent = error.message; }).finally(showStart);
