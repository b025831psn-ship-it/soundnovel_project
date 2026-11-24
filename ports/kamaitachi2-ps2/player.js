import { NameEditor, keyboardGroups } from './names.js';
import { Screen } from './render.js';

const canvas = document.querySelector('canvas');
const movie = document.querySelector('#movie');
const cover = document.querySelector('#cover');
const start = document.querySelector('#start');
const status = document.querySelector('#status');
const asset = name => new URL('assets/' + name, import.meta.url).href;
const music = new Audio();
music.loop = true;
const cues = Object.fromEntries(['confirm','cancel','move'].map(name => [name, new Audio(asset(name + '.wav'))]));
const saveKey = 'soundnovel.slps25132.opening.v1';
let saved = readSave();
let data, screen, groups, editor, pages;
let scene = 'loading', index = 0, role = 0, page = 0, revealed = 0;
let names = [], autosave = false, slot = 0, entered = 0, lastFrame, userNotice = '';
let idleMovie = 'pre_dv';
const padDown = new Set();
const images = {};

function enter(next, selected = 0) {
  scene = next;
  index = selected;
  entered = performance.now();
  canvas.dataset.scene = next;
  userNotice = '';
  announce();
}

function announce() {
  const story = scene === 'story' || scene === 'complete';
  const label = scene === 'choice' ? data.prologueChoice[index].text : story ? storyText() : editor && ['name','confirm'].includes(scene)
    ? (role === 0 ? '주인공 ' : '여자친구 ') + editor.value : scene;
  canvas.setAttribute('aria-label', label);
  status.textContent = userNotice || label;
}

function playMusic(file) {
  if (music.src === asset(file) && !music.paused) return;
  music.src = asset(file);
  music.play().catch(() => { status.textContent = '오디오를 재생하려면 화면을 눌러 주세요.'; });
}

function cue(name) {
  const sound = cues[name];
  sound.currentTime = 0;
  sound.volume = .6;
  sound.play().catch(() => {});
}

function stopMovie() {
  movie.onended = null;
  movie.onerror = null;
  movie.pause();
  movie.hidden = true;
}

function playMovie(file, next, loop = false) {
  stopMovie();
  movie.src = asset(file + '.mp4');
  movie.hidden = false;
  movie.loop = loop;
  movie.onerror = () => fail('영상을 읽을 수 없습니다. 로컬 미디어 준비 결과를 확인해 주세요.');
  movie.onended = next;
  movie.play().catch(error => { if (error.name !== 'AbortError') fail('브라우저에서 영상을 재생할 수 없습니다.'); });
}

function intro() {
  cover.hidden = true;
  canvas.focus();
  enter('logo');
  playMovie('chunlogo', () => { stopMovie(); enter('copyright'); });
}

function opening(attract = false) {
  music.pause();
  enter(attract ? 'attract' : 'opening');
  playMovie(attract ? idleMovie : 'opening', () => title(true));
  if (attract) idleMovie = idleMovie === 'pre_dv' ? 'opening' : 'pre_dv';
}

function title(animate) {
  playMusic(data.titleMusic);
  if (animate) {
    enter('title-entry');
    playMovie('title-1', () => title(false));
  } else {
    enter('title');
    playMovie('title', null, true);
  }
}

function readSave() {
  try {
    const value = JSON.parse(localStorage.getItem(saveKey));
    return Array.isArray(value?.names) && value.names.length === 2 &&
      value.names.every(n => typeof n === 'string' && n.length > 0 && n.length <= 6) ? value : null;
  } catch { return null; }
}

function newGame() {
  stopMovie(); music.pause();
  names = [...data.defaults];
  editor = null;
  enter('autosave');
}

function beginStory() {
  playMusic('k1a001.ogg');
  page = 0;
  printPage();
}

function storyText() {
  return pages?.[page]?.text?.() ?? '';
}

function printPage() {
  const block = pages[page];
  if (block.name !== undefined) {
    role = block.name;
    editor = new NameEditor(groups, names[role]);
    enter('name');
  } else {
    revealed = block.append ? pages[page - 1].text().length : 0;
    if (block.movie) {
      playMovie(block.movie, null);
      playMusic(block.music);
    }
    enter(block.end ? 'complete' : 'story');
  }
}

function makePages(s) {
  const start = s.my01_0010, first = s.my01_0012, hero = s.my01_0040;
  const second = s.my01_0055, last = s.my01_0070;
  const heroLine = () => second[0] + names[0] + second[1];
  const partnerLead = () => second.slice(2, 5).join('');
  const partnerLine = () => last[0] + names[1] + last[1];
  const classmates = () => partnerLine() + '\n' + last[2] + names[1] + last[3];
  const north = s.my01_0076;
  const letter = s.my01_0077;
  const correspondence = () => letter[0] + names[1] + letter[1] + '\n' + letter[2];
  const outcome = target => data.prologueChoice.find(route => route.target === target).text;
  return [
    { center:true, book:true, text: () => start.join('') },
    { text: () => first[0] },
    { append:true, book:true, nextLine:true, text: () => first[0] + '\n' + first[1] + s.my01_0022[0] },
    { text: () => hero[1] },
    { append:true, book:true, text: () => hero[1] + '\n' + hero[2] },
    { name:0 },
    { text: heroLine },
    { append:true, text: () => heroLine() + '\n' + partnerLead() },
    { append:true, book:true, text: () => heroLine() + '\n' + partnerLead() + '\n' + second[5] },
    { name:1 },
    { checkpoint:true, text: partnerLine },
    { append:true, text: classmates },
    { append:true, choice:true, text: () => classmates() + '\n' + last[4] + names[1] + last[5] + '\n' + last[6] },
    { target:'my01_0073', book:true, text: () => outcome('my01_0073') },
    { text: () => s.mo01_0011[0] },
    { append:true, book:true, text: () => s.mo01_0011.join('\n') },
    { background:'mo0000', book:true, text: () => s.mo01_0012[0] },
    { movie:'mo0001', music:'k2h017.ogg', book:true, text: () => s.mo02_0010[0] },
    { positioned:s.mo02_0012, text: () => s.mo02_0012.map(run => run.text).join('') },
    ...s.mo02_0015.map((_, i, lines) => ({
      retainMovie:true, append:i > 0, end:i === lines.length - 1, book:i === lines.length - 1,
      text: () => lines.slice(0, i + 1).join('\n'),
    })),
    { target:'my01_0075', book:true, text: () => outcome('my01_0075') },
    { text: () => north[0] },
    { append:true, book:true, text: () => north[0] + '\n' + north[1] + names[1] + north[2] + '\n' + north[3] + names[1] + north[4] },
    { text: correspondence },
    { append:true, end:true, book:true, text: () => correspondence() + '\n' + letter[3] },
  ];
}

function step(key) {
  if (scene === 'ready') { if (['circle','start'].includes(key)) intro(); return; }
  if (['logo','copyright','opening','attract','title-entry'].includes(scene)) {
    if (['circle','start','l2'].includes(key)) title(false);
    return;
  }
  if (scene === 'title') {
    entered = performance.now();
    if (key === 'left' || key === 'right') {
      const delta = key === 'left' ? -1 : 1;
      const next = Math.max(0, Math.min(2, index + delta));
      if (index !== next) cue('move');
      index = next;
      userNotice = '';
    } else if (['circle','start','l2'].includes(key)) {
      cue('confirm');
      if (!index) newGame();
      else if (index === 1 && saved) {
        names = [...saved.names]; stopMovie(); playMusic('k1a001.ogg');
        slot = saved.slot;
        autosave = true;
        page = pages.findIndex(block => block.checkpoint);
        printPage();
      } else {
        userNotice = index === 1 ? '이 브라우저에 이어할 기록이 없습니다.' : '이 빌드는 스키 여행 회상의 첫 분기까지 플레이할 수 있습니다.';
        status.textContent = userNotice;
      }
    }
    return;
  }
  if (scene === 'autosave' || scene === 'slot') {
    if (['up','down','left','right'].includes(key)) index = 1 - index;
    if (key === 'cross') { if (scene === 'slot') enter('autosave'); else title(false); }
    if (key === 'circle') {
      if (scene === 'autosave') { autosave = index === 0; if (autosave) enter('slot'); else beginStory(); }
      else { slot = index; enter('file-select'); }
    }
    return;
  }
  if (scene === 'file-select') {
    if (key === 'cross') enter('slot', slot);
    else if (key === 'circle') enter('created');
    return;
  }
  if (scene === 'created') { if (key === 'circle') enter('save-note'); return; }
  if (scene === 'save-note') { if (key === 'circle') beginStory(); return; }
  if (scene === 'choice') {
    if (key === 'up' || key === 'down') {
      index = (index + (key === 'up' ? -1 : 1) + data.prologueChoice.length) % data.prologueChoice.length;
      cue('move'); announce();
    } else if (key === 'circle') {
      page = pages.findIndex(block => block.target === data.prologueChoice[index].target);
      cue('confirm'); printPage();
    }
    return;
  }
  if (scene === 'story' || scene === 'complete') {
    if (key === 'circle' || key === 'start') {
      if (revealed < storyText().length) revealed = storyText().length;
      else if (scene === 'story' && pages[page].choice) enter('choice');
      else if (scene === 'story') { page++; printPage(); }
    }
    return;
  }
  if (scene === 'name') {
    const delta = {left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[key];
    if (delta) editor.move(...delta);
    else if (key === 'l1' || key === 'r1') editor.groupBy(key === 'l1' ? -1 : 1);
    else if (key === 'circle') editor.add();
    else if (key === 'cross') editor.erase();
    else if (key === 'triangle') { editor.finish(); enter('confirm', 1); }
    announce();
  } else if (scene === 'confirm') {
    if (key === 'up' || key === 'down') { index = 1 - index; cue('move'); }
    if (key === 'circle') cue('confirm');
    if (key === 'cross') cue('cancel');
    if (key === 'cross' || (key === 'circle' && index === 1)) enter('name');
    else if (key === 'circle') {
      names[role] = editor.value;
      if (role === 1 && autosave) {
        saved = {names:[...names], slot};
        try { localStorage.setItem(saveKey, JSON.stringify(saved)); } catch { /* Play continues without storage. */ }
      }
      page++; printPage();
    }
  }
}

function drawStory(time) {
  const block = pages[page], text = storyText().slice(0, Math.floor(revealed));
  const background = block.background ?? (block.center ? 'my0007' : 'my0645');
  if (block.positioned) {
    let remaining = text.length;
    for (const run of block.positioned) {
      if (remaining <= 0) break;
      screen.text(run.text.slice(0, remaining), run.x, run.y, {scale:.91});
      remaining -= run.text.length;
    }
    return;
  }
  if (!block.movie && !block.retainMovie) screen.background(background, background === 'my0645', time);
  const y = block.center ? 189 : 31;
  const x = block.center ? (640 - screen.width(storyText(), .91)) / 2 : 32;
  const end = screen.text(text, x, y, {scale:.91, max:580});
  if (revealed >= storyText().length) {
    const tick = Math.floor(time * 6);
    if (block.book) {
      const nextLine = block.nextLine || end.x + 25 > 610;
      const frame = tick % 7;
      screen.sprite('mark', (frame % 5) * 24, 48 + Math.floor(frame / 5) * 24, 24, 24,
                    nextLine ? 32 : end.x + 7, end.y + (nextLine ? 43 : 5));
    } else {
      screen.sprite('mark', tick % 8 * 16, 0, 16, 24, 34, end.y + 44);
    }
  }
}

function frame(now) {
  const dt = Math.min(100, now - (lastFrame ?? now));
  lastFrame = now;
  const time = now / 1000;
  screen.c.clearRect(0,0,640,448);
  if (scene === 'copyright') {
    screen.c.drawImage(images.copyrigh, 0, 0);
    if (now - entered >= 140 * 1000 / 59.94) opening();
  } else if (scene === 'title') {
    screen.title(index, Boolean(saved));
    if (now - entered > 4801 * 1000 / 59.94) opening(true);
  } else if (['autosave','slot','file-select','created','save-note'].includes(scene)) screen.autosave(scene, index, slot, names[0]);
  else if (scene === 'choice') {
    screen.background('my0645', true, time);
    data.prologueChoice.forEach((route, i) => {
      const y = 60 + 64 * i;
      if (i === index) screen.rect(24, y - 4, 592, 49);
      screen.text(route.text, 32, y, {scale:.91, max:580});
    });
  } else if (scene === 'story' || scene === 'complete') {
    revealed = Math.min(storyText().length, revealed + dt / 35);
    drawStory(time);
  } else if (scene === 'name' || scene === 'confirm') {
    screen.background('my0645', true, time);
    if (scene === 'name') screen.editor(editor, role, time);
    else screen.confirm(editor.value, role, index);
  }
  if (userNotice) {
    screen.rect(0, 420, 640, 28, '#14191f');
    screen.c.fillStyle = 'white'; screen.c.font = '14px sans-serif'; screen.c.fillText(userNotice, 14, 440);
  }
  const pad = Array.from(navigator.getGamepads?.() ?? []).find(p => p?.mapping === 'standard');
  const buttons = {0:'cross',1:'circle',3:'triangle',4:'l1',5:'r1',6:'l2',9:'start',12:'up',13:'down',14:'left',15:'right'};
  for (const [i, action] of Object.entries(buttons)) {
    const pressed = Boolean(pad?.buttons[i]?.pressed);
    if (pressed && !padDown.has(i)) { padDown.add(i); step(action); }
    if (!pressed) padDown.delete(i);
  }
  requestAnimationFrame(frame);
}

function fail(message) {
  stopMovie(); music.pause(); enter('error'); cover.hidden = false; start.textContent = message; start.disabled = true;
}

const keys = {ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'circle',
  Space:'start',KeyX:'circle',KeyZ:'cross',Escape:'cross',KeyS:'triangle',KeyQ:'l1',KeyW:'r1',Digit2:'l2'};
document.addEventListener('keydown', e => {
  const action = keys[e.code];
  if (!action || e.altKey || e.ctrlKey || e.metaKey || scene === 'loading') return;
  e.preventDefault();
  if (!e.repeat || ['up','down','left','right'].includes(action)) step(action);
});
document.querySelector('nav').addEventListener('click', e => {
  if (e.target.dataset.key) { step(e.target.dataset.key); canvas.focus(); }
});
canvas.addEventListener('click', () => step('circle'));
start.addEventListener('click', intro);
try {
  const response = await fetch(asset('opening.json'));
  if (!response.ok) throw new Error('Missing opening data');
  data = await response.json();
  await Promise.all(['font','copyrigh','title_00','my0007','my0645','mo0000','name_e01','mark','sys_fc01','sys_cd01','sys_cd02','sys_jo01','sys_jo02','sys_jo03','sys_save','sys_wa01'].map(async name => {
    const image = new Image(); image.src = asset(name + '.png'); await image.decode(); images[name] = image;
  }));
  groups = keyboardGroups(data.rows); pages = makePages(data.story);
  screen = new Screen(canvas, images, data);
  enter('ready'); start.disabled = false; start.textContent = '게임 시작';
  requestAnimationFrame(frame);
} catch { fail('게임 데이터를 열 수 없습니다. ISO로 로컬 미디어를 준비해 주세요.'); }
