import { DirectionRepeat, NameEditor, keyboardGroups } from './names.js';
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
let idleMovie = 'opening';
let textWaits = [];
let textSpeeds = [];
let textColors;
const padDown = new Set();
const padRepeat = new DirectionRepeat();
const keyboardRepeat = new DirectionRepeat();
const heldArrows = new Set();
const keyboardEdits = new Set();
const editPriority = ['circle', 'cross', 'triangle'];
const confirmPriority = ['circle', 'cross', 'square', 'up', 'down'];

function titleAction(actions) {
  const confirm = actions.find(key => ['circle', 'start', 'l2'].includes(key));
  const direction = index > 0 && actions.includes('left') ? 'left' : 'right';
  return confirm ?? (actions.includes(direction) ? direction : actions[0]);
}

function flushKeyboardEdit() {
  if (!keyboardEdits.size) return;
  const priority = scene === 'confirm' ? confirmPriority : editPriority;
  const action = scene === 'title' ? titleAction([...keyboardEdits]) : priority.find(key => keyboardEdits.has(key));
  keyboardEdits.clear();
  if (action) step(action);
}

function moveKeyboardCursor(now) {
  const horizontal = heldArrows.has('left') ? 'left' : heldArrows.has('right') ? 'right' : '';
  const vertical = heldArrows.has('up') ? 'up' : heldArrows.has('down') ? 'down' : '';
  if (keyboardRepeat.advance(horizontal + vertical, now)) {
    if (horizontal) step(horizontal);
    if (vertical) step(vertical);
  }
}
const images = {};

function enter(next, selected = 0) {
  keyboardEdits.clear();
  heldArrows.clear();
  keyboardRepeat.advance('', performance.now());
  scene = next;
  index = selected;
  entered = performance.now();
  canvas.dataset.scene = next;
  userNotice = '';
  announce();
}

function announce() {
  const story = ['story','complete','choice-wait'].includes(scene);
  const label = scene === 'choice' ? pages[page].choice[index].text : story ? storyText() : editor && ['name','confirm'].includes(scene)
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
  movie.onerror = () => fail('게임 영상을 불러오지 못했습니다.');
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
  const file = attract ? idleMovie : 'opening';
  playMovie(file, () => title(true));
  idleMovie = file === 'pre_dv' ? 'opening' : 'pre_dv';
}

function title(animate) {
  playMusic(data.titleMusic);
  if (animate) {
    enter('title-entry');
    playMovie('title-1', () => title(false));
  } else {
    enter('title', saved ? 1 : 0);
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
  page = 0;
  printPage();
}

function storyText() {
  return pages?.[page]?.text?.() ?? '';
}

function printPage() {
  const block = pages[page];
  if (block.background && !movie.hidden) stopMovie();
  if (block.name !== undefined) {
    role = block.name;
    editor = new NameEditor(groups, names[role]);
    enter('name');
  } else {
    revealed = block.append ? pages[page - 1].text().length : 0;
    textWaits = block.waits?.() ?? [];
    textColors = block.resolveColors?.();
    textSpeeds = block.resolveSpeeds?.() ?? block.speeds ?? [];
    if (block.movie) {
      playMovie(block.movie, block.loopMovie ? () => playMovie(block.loopMovie, null, true) : null);
    }
    if (block.music) playMusic(block.music);
    enter(block.end ? 'complete' : 'story');
  }
}

function summerDialogue(sceneData) {
  const blocks = [];
  let text = '';
  let waits = [{offset:0, remaining:sceneData.introWaits[2] * 1000 / 59.94}];
  let speeds = [];
  for (const event of sceneData.events) {
    if (event.text) text += event.text;
    else if (event.wait) waits.push({offset:text.length, remaining:event.wait * 1000 / 59.94});
    else if (event.speed !== undefined) speeds.push({offset:text.length, speed:event.speed});
    else if (event.command === 4) text += '\n';
    else if (event.command === 9 || event.command === 11) {
      const visible = text.trimEnd();
      const pauses = waits;
      blocks.push({retainMovie:true, append:blocks.length > 0,
        text: () => visible, speeds, waits: () => pauses.map(pause => ({...pause}))});
      waits = [];
      speeds = [];
    }
  }
  Object.assign(blocks[0], {movie:'my0005-1', loopMovie:'my0005-2'});
  return blocks;
}

function narrationPages(reunion, final) {
  const reunionPages = [];
  const reunionParts = [];
  const speedChanges = [];
  const colorChanges = [];
  let waits = [];
  for (const event of reunion.events) {
    if (event.text || event.name !== undefined) reunionParts.push(event);
    else if (event.wait) waits.push({parts:reunionParts.slice(), ticks:event.wait});
    else if (event.rgb) colorChanges.push({parts:reunionParts.slice(), rgb:event.rgb});
    else if (event.speed !== undefined) speedChanges.push({parts:reunionParts.slice(), speed:event.speed});
    else if (event.command === 4) reunionParts.push({text:'\n'});
    else if (event.command === 9 || event.command === 11) {
      const parts = reunionParts.slice();
      const pauses = waits;
      const changes = speedChanges.slice();
      const colors = colorChanges.slice();
      const resolve = fragments => fragments.map(part => part.text ?? names[part.name]).join('');
      reunionPages.push({retainMovie:true, append:reunionPages.length > 0, end:final && event.command === 11,
        waits: () => pauses.map(pause => ({offset:resolve(pause.parts).length, remaining:pause.ticks * 1000 / 59.94})),
        resolveColors: colors.length ? () => new Map(colors.map(change => [resolve(change.parts).length, change.rgb])) : undefined,
        resolveSpeeds: () => changes.map(change => ({offset:resolve(change.parts).length, speed:change.speed})),
        text: () => resolve(parts).trimEnd()});
      waits = [];
    }
  }
  return reunionPages;
}

function makePages(s) {
  const sharedNarration = narrationPages(s.my02_0120, false);
  const authorQuestion = narrationPages(s.my02_0150, false);
  authorQuestion[0].movie = s.my02_0150.events.find(event => event.scene).scene;
  for (const block of authorQuestion) block.rubies = s.my02_0150.ruby;
  const kobayashiReply = narrationPages(s.my02_0180, false);
  kobayashiReply[0].movie = s.my02_0180.events.find(event => event.scene).scene;
  const innBackground = s.my02_0210.events.find(event => event.scene).scene;
  const innHistory = [...narrationPages(s.my02_0210, false), ...narrationPages(s.my02_0215, false)];
  for (const block of innHistory) Object.assign(block, {background:innBackground, retainMovie:false});
  innHistory.at(-1).rubies = s.my02_0215.ruby;
  const sharedBackground = s.my02_0120.events.find(event => event.scene).scene;
  for (const block of sharedNarration) Object.assign(block, {background:sharedBackground, retainMovie:false});
  sharedNarration[0].target = 'my02_0120';
  const reunionPages = narrationPages(s.my02_0030, false);
  Object.assign(reunionPages[0], {movie:'my0006',
    waits: () => [{offset:0, remaining:s.my02_0030.introWaits[0] * 1000 / 59.94}]});
  const start = s.my01_0010, first = s.my01_0012, hero = s.my01_0040;
  const second = s.my01_0055, last = s.my01_0070;
  const heroLine = () => second[0] + names[0] + second[1];
  const partnerLead = () => second[2] + second[3] + '\n' + second[4];
  const partnerLine = () => last[0] + names[1] + last[1];
  const classmates = () => partnerLine() + '\n' + last[2] + names[1] + last[3];
  const north = s.my01_0076;
  const middle = s.my01_0079, closing = s.my01_0080;
  const phone = s.my01_0085;
  const invitationQuestion = () => phone[2] + names[1] + phone[3];
  const phoneCall = () => invitationQuestion() + '\n' + phone[4] + names[1] + phone[5];
  const beforeGreeting = () => phoneCall() + '\n' + phone[6] + names[1] + phone[7];
  const greetingParts = s.phoneGreeting.slice(0, s.phoneGreeting.findIndex(part => part.pause) + 1);
  const partText = part => part.name === undefined ? part.text : names[part.name];
  const greeting = () => beforeGreeting() + '\n' + greetingParts.map(partText).join('');
  function greetingWaits() {
    let offset = beforeGreeting().length + 1;
    const waits = [];
    for (const part of greetingParts) {
      if (part.wait) waits.push({offset, remaining:part.wait * 1000 / 59.94});
      offset += partText(part).length;
    }
    return waits;
  }
  const author = s.my01_0081;
  const introduction = () => author.slice(0, 9).join('');
  const sceneryRuby = {word:middle[4].slice(0, 4), readings:middle.slice(0, 4)};
  const letter = s.my01_0077;
  const correspondence = () => letter[0] + names[1] + letter[1] + '\n' + letter[2];
  const reaction = narrationPages(s.my02_0100, false);
  reaction.at(-1).choice = data[s.my02_0100.choice];
  const outcome = target => data.prologueChoice.find(route => route.target === target).text;
  return [
    { center:true, book:true, text: () => start.join(''),
      waits:() => [{offset:0, remaining:120 * 1000 / 59.94}], speeds:[{offset:0, speed:0}] },
    { music:'k1a001.ogg', text: () => first[0], nativeGlyphWidth:true, advanceMark:{x:33, y:117},
      waits:() => [{offset:0, remaining:60 * 1000 / 59.94}] },
    { append:true, book:true, nativeGlyphWidth:true, advanceMark:{x:36, y:157}, text: () => first[0] + '\n' + first[1] + s.my01_0022[0] },
    { text: () => hero[1], nativeGlyphWidth:true, advanceMark:{x:39, y:77} },
    { append:true, book:true, nativeGlyphWidth:true, advanceMark:{x:278, y:77}, text: () => hero[1] + '\n' + hero[2] },
    { name:0 },
    { text: heroLine },
    { append:true, text: () => heroLine() + '\n' + partnerLead(),
      waits:() => [{offset:heroLine().length + 1 + second[2].length, remaining:20 * 1000 / 59.94}] },
    { append:true, book:true, text: () => heroLine() + '\n' + partnerLead() + '\n' + second[5] },
    { name:1 },
    { checkpoint:true, nativeGlyphWidth:true, advanceMark:{x:40, y:77}, text: partnerLine },
    { append:true, nativeGlyphWidth:true, text: classmates },
    { append:true, nativeGlyphWidth:true, choice:data.prologueChoice, text: () => classmates() + '\n' + last[4] + names[1] + last[5] + '\n' + last[6] },
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
    { append:true, book:true, text: () => correspondence() + '\n' + letter[3] },
    { background:'my0000', text: () => s.my01_0078.slice(0, 2).join('\n') },
    { background:'my0000', append:true, book:true, text: () => s.my01_0078.join('\n') },
    { background:'my0000', ruby:sceneryRuby, text: () => middle.slice(4, 7).join('\n') },
    { background:'my0000', ruby:sceneryRuby, append:true, book:true, text: () => middle.slice(4).join('\n') },
    { background:'my0000', text: () => closing[0] },
    { background:'my0000', append:true, text: () => closing.slice(0, 4).join('\n') },
    { background:'my0000', append:true, book:true, ruby:{word:closing[11], readings:closing.slice(6, 11)},
      text: () => [...closing.slice(0, 6), closing[11]].join('\n') },
    { background:'my0002', text:introduction },
    { background:'my0002', append:true, book:true, text: () => introduction() + '\n' + author.slice(9).join('') },
    { background:'my0002', text:invitationQuestion },
    { background:'my0002', append:true, text:phoneCall },
    { background:'my0002', append:true, text:beforeGreeting },
    { background:'my0002', append:true, text:greeting, waits:greetingWaits },
    { background:'my0002', append:true, autoAdvance:true, text: () => greeting() + s.phoneGreeting.at(-1).text },
    { background:'my0000', positioned:s.my02_0010.lines, autoAdvance:true,
      speeds:[{offset:0, speed:s.my02_0010.speed}],
      waits: () => [{offset:0, remaining:s.my02_0010.waitBefore * 1000 / 59.94},
        {offset:s.my02_0010.lines.reduce((size,line) => size + line.text.length, 0), remaining:s.my02_0010.waitAfter * 1000 / 59.94}],
      text: () => s.my02_0010.lines.map(run => run.text).join('') },
    { movie:'my0003-1', loopMovie:'my0003-2', music:'k2h003.ogg', autoAdvance:true,
      waits: () => [{offset:0, remaining:(s.my02_0015.introWaits[0] + s.my02_0015.introWaits[1]) * 1000 / 59.94}],
      text: () => '' },
    ...summerDialogue(s.my02_0015),
    ...reunionPages,
    ...narrationPages(s.my02_0035, false),
    ...narrationPages(s.my02_0040, false),
    ...narrationPages(s.my02_0075, false),
    ...narrationPages(s.my02_0080, false),
    ...narrationPages(s.my02_0083, false),
    ...narrationPages(s.my02_0085, false),
    ...narrationPages(s.my02_0090, false),
    ...reaction,
    ...data.summerChoice.flatMap(route => {
      const pages = narrationPages(s[route.target], true);
      pages[0].target = route.target;
      if (route.target === 'myb02_0010') pages.at(-1).choice = data.followupChoice;
      else Object.assign(pages.at(-1), {end:false, nextTarget:'my02_0120'});
      return pages;
    }),
    ...data.followupChoice.flatMap(route => {
      const pages = narrationPages(s[route.target], true);
      pages[0].target = route.target;
      if (route.target === 'myb02_0120') Object.assign(pages.at(-1), {end:false, choice:data.culpritChoice, choiceWait:data.culpritChoiceWait});
      return pages;
    }),
    ...data.culpritChoice.flatMap(route => {
      const pages = narrationPages(s[route.target], true);
      pages[0].target = route.target;
      if (route.target === 'myb02_0140') Object.assign(pages.at(-1), {end:false, nextTarget:'my02_0120'});
      return pages;
    }),
    ...sharedNarration,
    ...authorQuestion,
    ...narrationPages(s.my02_0160, false),
    ...narrationPages(s.my02_0170, false).map((block, index, pages) =>
      index === pages.length - 1 ? {...block, rubies:s.my02_0170.ruby} : block),
    ...kobayashiReply,
    ...narrationPages(s.my02_0190, false),
    ...innHistory,
    ...narrationPages(s.my02_0217, false).map((block, i) => ({
      ...block, rubies:s.my02_0217.ruby, ...(i === 0 ? {movie:'my0010', music:'k1a004.ogg'} : {}),
    })),
    ...narrationPages(s.my02_0240, false).map((block, i) => i === 0 ? {...block, movie:'my0004'} : block),
    ...narrationPages(s.my02_0250, false),
    ...narrationPages(s.my02_0260, false),
    ...narrationPages(s.my02_0270, false),
    ...narrationPages(s.my02_0280, false).map((block, i) => ({
      ...block, rubies:s.my02_0280.ruby, ...(i === 0 ? {movie:'my0012'} : {}),
    })),
    ...narrationPages(s.my02_0300, false).map((block, i) => i === 0 ? {...block, movie:'my0018'} : block),
    {retainMovie:true, text:() => s.my02_0330.text, choice:data.captainChoice},
    ...data.captainChoice.flatMap(route => {
      const pages = narrationPages(s[route.target], false);
      pages[0].target = route.target;
      pages[1].movie = 'my0014';
      if (route.target === 'my02_0340') return [...pages, ...narrationPages(s.my02_0350, true)];
      const nickname = narrationPages(s.myb02_0340, false);
      nickname[0].movie = 'my0012';
      nickname[1].music = 'k2t002.ogg';
      nickname[1].movie = 'my0012';
      const history = narrationPages(s.my02_0400, false);
      for (const block of nickname) Object.assign(block, {rubies:s.myb02_0340.ruby, firstRuby:true});
      for (const block of history) Object.assign(block, {rubies:s.my02_0400.ruby, firstRuby:true});
      const factory = [s.my02_0410, s.my02_0430, s.my02_0450, s.my02_0460, s.my02_0463, s.my02_0465].flatMap((scene, i) =>
        narrationPages(scene, false).map(block => ({
          ...block, background:i < 4 ? 'my0016b' : 'my0021', retainMovie:false, rubies:scene.ruby, firstRuby:true,
        })));
      return [...pages, ...narrationPages(s.myb02_0330, false), ...narrationPages(s.myb02_0335, false),
        ...nickname, ...history, ...factory,
        ...narrationPages(s.my02_0470, false).map((block, i) => i === 0 ? {...block, movie:'my0008'} : block),
        ...narrationPages(s.my02_0480, false),
        ...narrationPages(s.my03_0010, false).map((block, i) => i === 0 ? {...block, movie:'my0018'} : block),
        ...[s.my03_0040, s.my03_0050, s.my03_0060, s.my03_0070, s.my03_0080].map((song, i) => {
          const text = song.placements.map(run => run.text).join('');
          return {background:'my0000', music:i === 0 ? 'k2h002.ogg' : undefined,
            positioned:song.placements, text:() => text,
            speeds:[{offset:0, speed:0}], waits:() => [
              {offset:0, remaining:song.introWait * 1000 / 59.94},
              {offset:text.length, remaining:song.hold * 1000 / 59.94},
            ]};
        }),
        ...narrationPages(s.my03_0127, true).map((block, i) => ({
          ...block, rubies:s.my03_0127.ruby, ...(i === 0 ? {movie:'my0018'} : {}),
        }))];
    }),
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
      index = (index + (key === 'up' ? -1 : 1) + pages[page].choice.length) % pages[page].choice.length;
      cue('move'); announce();
    } else if (key === 'circle') {
      page = pages.findIndex(block => block.target === pages[page].choice[index].target);
      cue('confirm'); printPage();
    }
    return;
  }
  if (scene === 'story' || scene === 'complete') {
    if (key === 'circle' || key === 'start') {
      if (revealed < storyText().length) revealed = textWaits[0]?.offset ?? storyText().length;
      else if (textWaits.length) return;
      else if (scene === 'story' && pages[page].choice) enter(pages[page].choiceWait ? 'choice-wait' : 'choice');
      else if (scene === 'story') {
        const target = pages[page].nextTarget;
        page = target ? pages.findIndex(block => block.target === target) : page + 1;
        if (target && pages[page].background) stopMovie();
        printPage();
      }
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
    if (['up', 'down', 'square'].includes(key)) { index = 1 - index; cue('move'); }
    if (key === 'circle') cue('confirm');
    if (key === 'cross') cue('cancel');
    if (key === 'cross' || (key === 'circle' && index === 1)) enter('name');
    else if (key === 'circle') {
      names[role] = editor.value;
      page++; printPage();
      if (role === 1 && autosave) {
        const checkpoint = {names:[...names], slot};
        try {
          localStorage.setItem(saveKey, JSON.stringify(checkpoint));
          saved = checkpoint;
        } catch {
          userNotice = '자동 저장에 실패했습니다. 현재 게임은 계속할 수 있습니다.';
          announce();
        }
      }
    }
  }
}

function drawStory(time) {
  const block = pages[page], text = storyText().slice(0, Math.floor(revealed));
  const background = block.background ?? (block.center ? 'my0007' : 'my0645');
  if (block.positioned) {
    if (block.background) screen.background(block.background, false, time);
    let remaining = text.length;
    for (const run of block.positioned) {
      if (remaining <= 0) break;
      if (run.reading) screen.centered(run.reading, run.x + screen.width(run.text, .91) / 2, run.y - 10, .38);
      else screen.text(run.text.slice(0, remaining), run.x, run.y, {scale:.91});
      remaining -= run.text.length;
    }
    return;
  }
  if (block.movie && !text) return;
  if (!block.movie && !block.retainMovie) screen.background(background, background === 'my0645', time);
  const origin = block.background === 'my0000' ? data.invitationOrigin : {x:32, y:31};
  const scale = block.center || (background === 'my0645' && !block.movie && !block.retainMovie) ? .96 : .91;
  const y = block.center ? 192 : origin.y;
  const x = block.center ? (640 - screen.width(storyText(), scale)) / 2 : origin.x;
  const rubies = block.rubies ?? (block.ruby ? [block.ruby] : []);
  const readings = rubies.length ? new Map() : undefined;
  for (const ruby of rubies) {
    const start = block.firstRuby ? storyText().indexOf(ruby.word) : storyText().lastIndexOf(ruby.word);
    if (start >= 0) ruby.readings.forEach((reading, i) => readings.set(start + i, reading));
  }
  screen.c.save();
  if (!block.movie && !block.retainMovie && ['my0007', 'my0645'].includes(background)) {
    screen.c.filter = 'brightness(86%)';
  }
  const metrics = block.nativeGlyphWidth ? {spacing:0, widthScale:1} : {};
  const end = screen.text(text, x, y, {...metrics, scale, max:Math.min(580, 640 - x), readings, colors:textColors});
  screen.c.restore();
  if (revealed >= storyText().length) {
    const tick = Math.floor(time * 6);
    if (block.book) {
      const nextLine = block.nextLine || end.x + 25 > 610;
      const frame = tick % 7;
      screen.sprite('mark', (frame % 5) * 24, 48 + Math.floor(frame / 5) * 24, 24, 24,
                    block.advanceMark?.x ?? (nextLine ? 36 : end.x + 7),
                    block.advanceMark?.y ?? (end.y + (nextLine ? 46 : 5)));
    } else {
      const mark = block.advanceMark ?? {x:34, y:end.y + 44};
      screen.sprite('mark', tick % 8 * 16, 0, 16, 24, mark.x, mark.y);
    }
  }
}

function frame(now) {
  if (scene === 'name') moveKeyboardCursor(now);
  flushKeyboardEdit();
  const dt = Math.min(100, now - (lastFrame ?? now));
  lastFrame = now;
  const time = now / 1000;
  screen.c.clearRect(0,0,640,448);
  if (scene === 'copyright') {
    screen.c.drawImage(images.copyrigh, 0, 0);
    if (now - entered >= 140 * 1000 / 59.94) opening();
  } else if (scene === 'title') {
    screen.title(index, Boolean(saved));
    if (now - entered >= 4801 * 1000 / 59.94) opening(true);
  } else if (['autosave','slot','file-select','created','save-note'].includes(scene)) screen.autosave(scene, index, slot, names[0]);
  else if (scene === 'choice-wait') {
    drawStory(time);
    if (now - entered >= pages[page].choiceWait * 1000 / 59.94) enter('choice');
  } else if (scene === 'choice') {
    if (!pages[page].retainMovie) screen.background('my0645', true, time);
    pages[page].choice.forEach((route, i) => {
      const y = 60 + 64 * i;
      if (i === index) screen.rect(24, y - 4, 592, 49);
      screen.text(route.text, 32, y, {scale:.91, max:580});
    });
  } else if (scene === 'story' || scene === 'complete') {
    const wait = textWaits[0];
    if (wait && revealed >= wait.offset) {
      wait.remaining -= dt;
      if (wait.remaining <= 0) textWaits.shift();
    } else {
      const speed = textSpeeds.findLast(change => change.offset <= revealed)?.speed ?? 1;
      const nextChange = textSpeeds.find(change => change.offset > revealed);
      const limit = Math.min(wait?.offset ?? Infinity, nextChange?.offset ?? Infinity, storyText().length);
      revealed = speed === 0 ? limit : Math.min(limit, revealed + dt / (35 * speed));
    }
    drawStory(time);
    if (pages[page].autoAdvance && !textWaits.length && revealed >= storyText().length) { page++; printPage(); }
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
  const buttons = {0:'cross',1:'circle',2:'square',3:'triangle',4:'l1',5:'r1',6:'l2',9:'start',12:'up',13:'down',14:'left',15:'right'};
  const actions = [];
  for (const [i, action] of Object.entries(buttons)) {
    const pressed = Boolean(pad?.buttons[i]?.pressed);
    if (pressed && !padDown.has(i)) { padDown.add(i); actions.push(action); }
    if (!pressed) padDown.delete(i);
  }
  if (scene === 'name') {
    const group = ['r1', 'l1'].find(action => actions.includes(action));
    const edit = editPriority.find(action => actions.includes(action));
    const up = padDown.has('12'), down = padDown.has('13');
    const left = padDown.has('14'), right = padDown.has('15');
    // EE 0x11BFE8 picks a diagonal first, then up/down/left/right.
    const vertical = up ? 'up' : down ? 'down' : '';
    const horizontal = left ? 'left' : right ? 'right' : '';
    const direction = horizontal + vertical;
    if (group) step(group);
    if (padRepeat.advance(direction, now)) {
      if (horizontal) step(horizontal);
      if (vertical) step(vertical);
    }
    if (edit) step(edit);
  } else if (scene === 'confirm') {
    const action = confirmPriority.find(key => actions.includes(key));
    if (action) step(action);
  } else if (scene === 'title' && actions.length) {
    step(titleAction(actions));
  } else {
    padRepeat.advance('', now);
    const initialScene = scene;
    for (const action of actions) {
      step(action);
      if (scene !== initialScene) break;
    }
  }
  requestAnimationFrame(frame);
}

function fail(message) {
  stopMovie(); music.pause(); enter('error'); cover.hidden = false;
  start.textContent = message + ' 다시 시도';
  start.disabled = false;
}

const keys = {ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'circle',
  Space:'start',KeyX:'circle',KeyZ:'cross',Escape:'cross',KeyA:'square',KeyS:'triangle',KeyQ:'l1',KeyW:'r1',Digit2:'l2'};
document.addEventListener('keydown', e => {
  const action = keys[e.code];
  if (!action || e.altKey || e.ctrlKey || e.metaKey || scene === 'loading' || scene === 'error') return;
  e.preventDefault();
  if (scene === 'title' || (scene === 'name' && editPriority.includes(action)) ||
      (scene === 'confirm' && confirmPriority.includes(action))) {
    if (!e.repeat) keyboardEdits.add(action);
    return;
  }
  if (scene === 'name' && e.code.startsWith('Arrow')) {
    if (!e.repeat) {
      heldArrows.add(action);
      moveKeyboardCursor(performance.now());
    }
    return;
  }
  if (!e.repeat || ['up','down','left','right'].includes(action)) step(action);
});
document.addEventListener('keyup', e => {
  if (keyboardEdits.has(keys[e.code])) flushKeyboardEdit();
  if (heldArrows.delete(keys[e.code])) moveKeyboardCursor(performance.now());
});
window.addEventListener('blur', () => {
  keyboardEdits.clear();
  heldArrows.clear();
  keyboardRepeat.advance('', performance.now());
});
document.querySelector('nav').addEventListener('click', e => {
  if (e.target.dataset.key) { step(e.target.dataset.key); canvas.focus(); }
});
canvas.addEventListener('click', () => step('circle'));
start.addEventListener('click', () => {
  if (scene === 'error') location.reload();
  else intro();
});
try {
  const response = await fetch(asset('opening.json'));
  if (!response.ok) throw new Error('Missing opening data');
  data = await response.json();
  await Promise.all(['font','copyrigh','g_start','title_00','my0000','my0002','my0007','my0011','my0016b','my0021','my0645','mo0000','name_e01','mark','sys_fc01','sys_cd01','sys_cd02','sys_jo01','sys_jo02','sys_jo03','sys_save','sys_wa01'].map(async name => {
    const image = new Image(); image.src = asset(name + '.png'); await image.decode(); images[name] = image;
  }));
  groups = keyboardGroups(data.rows); pages = makePages(data.story);
  screen = new Screen(canvas, images, data);
  enter('ready'); start.disabled = false; start.textContent = '게임 시작';
  requestAnimationFrame(frame);
} catch { fail('게임 데이터를 불러오지 못했습니다.'); }
