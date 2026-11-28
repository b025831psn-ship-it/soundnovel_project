import { DirectionRepeat, NameEditor, keyboardGroups } from './names.js';
import { Screen } from './render.js';
import { Sn4Vm } from './sn4.js';
import { LoopingMusic } from './music.js';
import { SePlayer } from './se-player.js';
import { psychometryRegion } from './psychometry-grid.js';
import { openSaves, varsToArray, arrayToVars, GAME_ID } from './save.js';
import { startGate } from '/shared/player/start-gate.js';

const canvas = document.querySelector('canvas');
const movie = document.querySelector('#movie');
const loading = document.querySelector('#loading');
const status = document.querySelector('#status');
const shell = document.querySelector('main');
const menuButton = document.querySelector('#menu-button');
const gameMenu = document.querySelector('#game-menu');
const asset = name => new URL('assets/' + name, import.meta.url).href;
async function startImmediately() {
  // This port starts without a gate. The global gesture listeners below wake
  // audio on the first real press, so the private build remains self-contained.
  document.querySelector('#loading').hidden = true;
}
const SCENEPACK_EFFECT_HANDLER = Object.freeze({
  0x05:0x1abb18,0x08:0x1abc38,0x09:0x1abc88,0x0a:0x1abcd8,
  0x0b:0x1abcf0,0x0e:0x1abd78,0x12:0x1abee8,0x13:0x1abf18,
  0x16:0x1abfc8,0x19:0x1ac088,0x1a:0x1ac0e8,0x1b:0x1ac138,
  0x1c:0x1ac150,0x1f:0x1ac1b8,0x23:0x1ac210,0x24:0x1ac228,
});
// L= comments in the Special Box Vorbis tracks, in 48 kHz PCM frames.
const loopFrames = {
  'k1a001.ogg': 1017889, 'k1a004.ogg': 36359, 'k2h002.ogg': 461348,
  'k2h003.ogg': 863143, 'k2h017.ogg': 863622, 'k2t002.ogg': 475399,
};
const music = new LoopingMusic({
  asset, loopFrames, onBlocked: () => { status.textContent = '오디오를 재생하려면 화면을 눌러 주세요.'; },
});
let se = null, seStarting = null, seContext = null;
const pendingSe = [];
// Called on every tap / key (shared/player/start-gate.js). resume() is not awaited: a press that may not
// start audio (iPhone pointerdown) would leave it pending forever and block the sound effects; the next
// press simply asks again.
async function unlockAudio() {
  music.unlock();
  if (seContext && seContext.state !== 'running') seContext.resume().catch(() => {});
  if (!seStarting) seStarting = (async () => {
    const context = seContext = new AudioContext({sampleRate:48000});
    context.resume().catch(() => {});
    se = await SePlayer.create(context, name => asset('se/' + name));
    for (const command of pendingSe.splice(0)) se.command(command);
    return se;
  })().catch(error => { console.warn('SE unavailable', error); seStarting = null; seContext = null; });
  return seStarting;
}
const cues = Object.fromEntries(['confirm','cancel','move'].map(name => [name, new Audio(asset(name + '.wav'))]));
// Saves (save.js): the story save on the chosen card, the carry-over variables written at each ending,
// and the web-only suspend slot, kept by the shared store and synced through /sync.
const saves = await openSaves();
let saved = saves.latest();
// The last place play can resume from: each choice or input screen (SN4 label and the command index).
let resumePoint = null, systemDue = false;
let data, screen, groups, editor, pages, sn4;
let sn4Mode = false, sn4Event, sn4WaitUntil = 0;
let specialInput = null;
// EE 0x112610: one character every max(1, speed) frames; CommandSpeed stores speed at +0x2a4.
let sn4SpeedMarks = [], sn4Shown = '';
const sn4Style = {speed:1, letterSpacing:0, lineSpacing:7, fontType:0, fontSize:33,
  marginLeft:32, marginRight:32, marginTop:32, marginBottom:32,
  moves:[], lines:[], styles:[], effects:[], centers:[], rubies:[], scene:null, scenePack:null, caption:null, retainMovie:false,
  sceneCommands:[], unknown:[], sceneFx:{layers:new Map(), filters:new Map(), models:new Map(), resources:new Map(),
    screen:null, staffRoll:null, trigger:null}};
let scene = 'loading', index = 0, role = 0, page = 0, revealed = 0;
let names = [], autosave = false, slot = 0, entered = 0, lastFrame, userNotice = '';
let idleMovie = 'opening';
let menuOpen = false, filled = false;
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
const criminalHeads = Array.from('あかさたなはまやらわがざだばぱ');
const criminalRows = [
  Array.from('あかさたなはまやらわがざだばぱ'),
  Array.from('いきしちにひみ　りゐぎじぢびぴ'),
  Array.from('うくすつぬふむゆる　ぐずづぶぷ'),
  Array.from('えけせてねへめ　れゑげぜでべぺ'),
  Array.from('おこそとのほもよろをごぞどぼぽ'),
  ['ぁ','','','っ','','','', 'ゃ','', 'ー','','','','',''],
];

function beginSpecial(event) {
  specialInput = {kind:event.kind, targets:event.targets ?? [], fallback:event.fallback,
    panels:event.panels ?? [], index:0, x:320, y:224, row:0, column:0, value:'', buttons:[], length:event.length};
  enter(event.kind === 'click-map' ? 'click-map' :
    event.kind === 'criminal-name' ? 'criminal-name' : event.kind === 'cipher' ? 'cipher' : 'panel');
}

function criminalGlyph() {
  return criminalRows[specialInput.row][specialInput.column] || '';
}

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
  closeMenu();
  menuButton.hidden = !['title','story','complete','choice','choice-wait','autosave','slot',
    'file-select','created','save-note','name','confirm'].includes(next);
  announce();
}

function closeMenu() {
  menuOpen = false;
  gameMenu.hidden = true;
  menuButton.classList.remove('is-back');
}

function openMenu() {
  if (!['title','story','complete','choice','choice-wait'].includes(scene)) return;
  menuOpen = true;
  gameMenu.querySelector('[data-menu="title"]').hidden = scene === 'title';
  gameMenu.hidden = false;
  menuButton.classList.add('is-back');
}

async function toggleFullscreen() {
  if (filled) {
    filled = false;
    document.documentElement.classList.remove('filled');
    return;
  }
  if (document.fullscreenElement) return document.exitFullscreen();
  if (document.fullscreenEnabled && shell.requestFullscreen) {
    try {
      await shell.requestFullscreen({navigationUI:'hide'});
      await globalThis.screen.orientation?.lock?.('landscape').catch(() => {});
      return;
    } catch { /* iPhone and embedded browsers use the rotated fill fallback. */ }
  }
  filled = true;
  document.documentElement.classList.add('filled');
}

function announce() {
  const story = ['story','complete','choice-wait'].includes(scene);
  const choices = sn4Mode && sn4Event?.type === 'choice'
    ? sn4Event.targets.map(choiceRoute)
    : pages?.[page]?.choice;
  const label = scene === 'choice' ? choices[index].text : story ? storyText() : editor && ['name','confirm'].includes(scene)
    ? (role === 0 ? '주인공 ' : '여자친구 ') + editor.value : scene;
  canvas.setAttribute('aria-label', label);
  status.textContent = userNotice || label;
}

function choiceRoute(target) {
  return {target, text:sn4.choiceText(target)};
}

function playMusic(file, options) {
  music.play(file, options);
}

// ScenePack executor dispatches op 0x00..0x25 through the EE jump table at
// 0x00220380 (dispatcher 0x001AB960). Preserve its layer/resource lifetime and
// timed screen effects even where the PS2-specific 3D subsystem has no web peer.
function applySceneEffect(name, command) {
  const fx = sn4Style.sceneFx, op = command.op, now = performance.now();
  if (!SCENEPACK_EFFECT_HANDLER[op]) throw new Error(`Unmapped ScenePack effect ${op}`);
  const frames = command.fadeFrames ?? command.data?.values?.[0] ?? 0;
  const timed = {op, name, command, ee:SCENEPACK_EFFECT_HANDLER[op], start:now, end:now + frames * 1000 / 60};
  if (op === 0x05) { fx.layers.clear(); fx.filters.clear(); }
  else if (op === 0x08) fx.layers.set(command.layer ?? 0, timed);
  else if (op === 0x09) fx.layers.delete(command.layer ?? 0);
  else if (op === 0x0a) fx.filters.set(command.layer ?? 0, timed);
  else if (op === 0x0b) fx.filters.set(command.id, timed);
  else if (op === 0x0e) return Math.max(0, ...[...fx.layers.values(), ...fx.filters.values()].map(x => Math.ceil((x.end - now) * 60 / 1000)));
  else if (op === 0x12) fx.screen = {...timed, from:0, to:1};
  else if (op === 0x13) fx.screen = {...timed, from:1, to:0};
  else if (op === 0x16) { fx.screen = null; fx.filters.clear(); }
  else if (op === 0x19) fx.resources.set(command.id, command.file);
  else if (op === 0x1a) fx.trigger = command.id;
  else if (op === 0x1b) fx.trigger = null;
  else if (op === 0x1c) fx.models.set(command.file, {motion:command.motion, vector:command.vector});
  else if (op === 0x1f) fx.models.clear();
  else if (op === 0x23) fx.staffRoll = command.data;
  else if (op === 0x24) fx.resources.set(command.file, command.file);
  return command.wait ? frames + 1 : 0;
}

function applyScenePack(name) {
  const entry = data.scenePack?.[name];
  if (name === 'my0003_00') {
    sn4Style.retainMovie = true;
    playMovie('my0003-1', () => playMovie('my0003-2', null, true));
  } else if (name === 'my0005_00') {
    sn4Style.retainMovie = true;
    playMovie('my0005-1', () => playMovie('my0005-2', null, true));
  } else if (name === 'my0006_00') {
    sn4Style.retainMovie = true;
    playMovie('my0006', null, true);
  }
  if (!entry) return 0;
  let wait = 0;
  const commands = entry.commands ?? (entry.music ? [entry.music] : []);
  for (const command of commands) {
    sn4Style.sceneCommands.push({name, ...command});
    switch (command.op ?? command.operation) {
      case 0x01: break;
      case 0x07:
      case 0x04: {
        const file = command.file;
        if (typeof file !== 'string') break;
        const leaf = file.replaceAll('\\', '/').split('/').at(-1);
        if (leaf.endsWith('.ipu')) sn4Style.scene = leaf.slice(0, -4);
        else if (leaf.endsWith('.m2v')) {
          sn4Style.retainMovie = true;
          playMovie(leaf.slice(0, -4), null, true);
        } else if (!leaf.endsWith('.sab')) sn4Style.unknown.push({name, command});
        break;
      }
      case 0x14:
        playMusic(command.file, {volume:command.volume ?? 100,
          fadeFrames:command.fadeFrames ?? 0});
        break;
      case 0x15: stopMusic({fadeFrames:command.fadeFrames ?? 0}); break;
      case 0x17:
        music.volume(command.volume ?? 100, {fadeFrames:command.fadeFrames ?? 0});
        break;
      case 0x0c: case 0x0d: case 0x0f: case 0x10: case 0x11:
        if (se) se.command(command); else pendingSe.push(command);
        break;
      case 0x05: case 0x08: case 0x09: case 0x0a: case 0x0b:
      case 0x0e: case 0x12: case 0x13: case 0x16: case 0x19:
      case 0x1a: case 0x1b: case 0x1c: case 0x1f: case 0x23: case 0x24:
        wait = Math.max(wait, applySceneEffect(name, command)); break;
      default:
        sn4Style.unknown.push({name, command, kind:'unknown-op'}); break;
    }
    if (command.wait) wait = Math.max(wait, (command.fadeFrames ?? 0) + 1);
  }
  if (entry.image) sn4Style.scene = entry.image;
  return wait;
}

function stopMusic(options) {
  music.stop(options);
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
  movie.muted = false;
  movie.play().catch(error => {
    // The game starts before any tap (shared/player/start-gate.js): the browser then only lets a muted
    // movie play, so it plays muted and the sound comes on with the first tap or key.
    if (error.name === 'NotAllowedError') {
      movie.muted = true;
      movie.play().catch(() => {});
      const unmute = () => { movie.muted = false; };
      for (const type of ['pointerdown', 'keydown']) addEventListener(type, unmute, { once: true, capture: true });
      return;
    }
    if (error.name !== 'AbortError') fail('브라우저에서 영상을 재생할 수 없습니다.');
  });
}

function intro() {
  canvas.focus();
  enter('logo');
  playMovie('chunlogo', () => { stopMovie(); enter('copyright'); });
}

function opening(attract = false) {
  stopMusic();
  enter(attract ? 'attract' : 'opening');
  const file = attract ? idleMovie : 'opening';
  playMovie(file, () => title(true));
  idleMovie = file === 'pre_dv' ? 'opening' : 'pre_dv';
}

function title(animate) {
  saved = saves.latest();
  sn4Mode = false;
  pendingSe.length = 0;
  se?.stop(null);
  playMusic(data.titleMusic);
  if (animate) {
    enter('title-entry');
    playMovie('title-1', () => title(false));
  } else {
    enter('title', saved ? 1 : 0);
    playMovie('title', null, true);
  }
}


function newGame() {
  stopMovie(); stopMusic();
  names = [...data.defaults];
  editor = null;
  enter('autosave');
}

function beginStory() {
  resumePoint = null;
  // The carry-over variables of the chosen card (the original reads its SYSTEM file); none without a card.
  startSn4('my01_0000', autosave ? saves.system(slot) : null);
}

// Snapshot at a choice or input screen: the command that stopped, so resuming shows it again.
function markResume(event) {
  resumePoint = {names:[...names], resume:{label:sn4.label, pc:Math.max(0, sn4.pc - 1)},
    variables:varsToArray(sn4.variables), scene:sn4Style.scene ?? null, music:music.file ?? null,
    // A looping scene movie (ScenePack .m2v) stands behind the text instead of the still.
    movie:sn4Style.retainMovie && !movie.hidden && movie.loop ? decodeURIComponent(movie.src.split('/').at(-1)).replace(/\.mp4$/, '') : null};
  if (autosave) { if (saves.writeStory(slot, resumePoint)) saved = saves.latest(); }
}

// EndFlow writes the variable block after the ending's own flag updates, which run in the same frame:
// write it at the next stop.
function writeSystemIfDue() {
  if (!systemDue) return;
  systemDue = false;
  if (autosave) saves.writeSystem(slot, varsToArray(sn4.variables));
}

function resumeAt(point) {
  names = [...point.names];
  stopMovie();
  sn4Mode = true;
  sn4.reset(point.resume.label);
  sn4.pc = point.resume.pc;
  if (point.variables) sn4.variables = arrayToVars(point.variables);
  sn4.setNames(names);
  sn4Style.scene = point.scene ?? null;
  sn4Style.retainMovie = Boolean(point.movie);
  if (point.movie) playMovie(point.movie, null, true);
  if (point.music) playMusic(point.music); else stopMusic();
  resumePoint = null;
  showSn4(sn4.run());
}

// Web only: the player left the page (another device can carry on from here).
function suspend() {
  if (!sn4Mode || !resumePoint) return;
  saves.writeSuspend({...resumePoint, card:slot, autosave});
}
addEventListener('pagehide', suspend);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') suspend(); });

function storyText() {
  if (sn4Mode) return sn4Event?.text?.trimEnd() ?? '';
  return pages?.[page]?.text?.() ?? '';
}

function showSn4(event) {
  sn4Event = event;
  writeSystemIfDue();
  if (event.type === 'choice' || event.type === 'special') markResume(event);
  if (event.type === 'break') {
    // CommandBreak tears down the active scenario state and yields the EE
    // frame. end05_0000 contains no following command, so return to title.
    sn4Mode = false;
    title(false);
  } else if (event.type === 'name') {
    role = event.role;
    editor = new NameEditor(groups, names[role]);
    enter('name');
  } else if (event.type === 'choice') {
    enter('choice');
  } else if (event.type === 'special') {
    beginSpecial(event);
  } else {
    // Text after 0x09 Pause continues the same page: keep what is already shown
    // and type only the new characters. The wait (0x50/0x51) starts once typed.
    const text = event.text?.trimEnd() ?? '';
    revealed = sn4Shown && text.startsWith(sn4Shown) ? sn4Shown.length : 0;
    textWaits = [];
    textSpeeds = [{offset:0, speed:sn4SpeedMarks.carry ?? sn4Style.speed}, ...sn4SpeedMarks];
    sn4SpeedMarks = [];
    sn4SpeedMarks.carry = sn4Style.speed;
    sn4Shown = text;
    sn4WaitUntil = event.type === 'wait' ? Infinity : 0;
    enter('story');
  }
}

function startSn4(label, variables = null) {
  sn4Mode = true;
  sn4.reset(label);
  if (variables) sn4.variables = arrayToVars(variables);
  sn4.setNames(names);
  showSn4(sn4.run());
}

function printPage() {
  const block = pages[page];
  if (block.sn4Start) { startSn4(block.sn4Start); return; }
  if (block.background && !movie.hidden) stopMovie();
  if (block.name !== undefined) {
    if (block.sn4) {
      sn4.reset(block.sn4);
      sn4.setNames(names);
      const event = sn4.run();
      if (event.type !== 'name' || event.role !== block.name) throw new Error(`SN4 name mismatch at ${block.sn4}`);
    }
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
    { sn4Start:'my01_0047', text:() => '' },
    { target:'my01_0073-cont', text: () => s.mo01_0011[0] },
    { append:true, book:true, text: () => s.mo01_0011.join('\n') },
    { background:'mo0000', book:true, text: () => s.mo01_0012[0] },
    { movie:'mo0001', music:'k2h017.ogg', book:true, text: () => s.mo02_0010[0] },
    { positioned:s.mo02_0012, text: () => s.mo02_0012.map(run => run.text).join('') },
    ...s.mo02_0015.map((_, i, lines) => ({
      retainMovie:true, append:i > 0, end:i === lines.length - 1, book:i === lines.length - 1,
      text: () => lines.slice(0, i + 1).join('\n'),
    })),
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
  if (scene === 'ready') return;
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
        slot = saved.card;
        autosave = true;
        resumeAt(saved);
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
  if (scene === 'click-map') {
    const delta = {left:[-3,0],right:[3,0],up:[0,-3],down:[0,3]}[key];
    if (delta) {
      specialInput.x = Math.max(0, Math.min(640, specialInput.x + delta[0]));
      specialInput.y = Math.max(0, Math.min(448, specialInput.y + delta[1]));
    } else if (key === 'circle') {
      const picked = psychometryRegion(specialInput.x, specialInput.y);
      cue('confirm'); showSn4(sn4.chooseSpecial(picked));
    }
    return;
  }
  if (scene === 'panel') {
    const length = specialInput.targets.length;
    if (key === 'left') specialInput.index = (specialInput.index - 1 + length) % length;
    else if (key === 'right') specialInput.index = (specialInput.index + 1) % length;
    else if (key === 'up') specialInput.index = (specialInput.index - 4 + length) % length;
    else if (key === 'down') specialInput.index = (specialInput.index + 4) % length;
    else if (key === 'circle') { cue('confirm'); showSn4(sn4.chooseSpecial(specialInput.index)); }
    else if (key === 'cross' && specialInput.fallback) { cue('cancel'); showSn4(sn4.chooseSpecial(-1)); }
    return;
  }
  if (scene === 'criminal-name') {
    if (key === 'left') specialInput.column = (specialInput.column + 1) % 15;
    else if (key === 'right') specialInput.column = (specialInput.column + 14) % 15;
    else if (key === 'up') specialInput.row = (specialInput.row + 5) % 6;
    else if (key === 'down') specialInput.row = (specialInput.row + 1) % 6;
    else if (key === 'circle') {
      const glyph = criminalGlyph();
      if (glyph && specialInput.value.length < 8) specialInput.value += glyph;
    } else if (key === 'cross') specialInput.value = specialInput.value.slice(0, -1);
    else if (key === 'triangle' && specialInput.value) {
      cue('confirm'); showSn4(sn4.submitCriminalName(specialInput.value));
    }
    return;
  }
  if (scene === 'cipher') {
    if (['cross','triangle','square'].includes(key)) {
      specialInput.buttons.push(key);
      if (specialInput.buttons.length === specialInput.length) {
        cue('confirm'); showSn4(sn4.submitCipher(specialInput.buttons));
      }
    }
    return;
  }
  if (scene === 'choice') {
    if (key === 'up' || key === 'down') {
      const length = sn4Mode ? sn4Event.targets.length : pages[page].choice.length;
      index = (index + (key === 'up' ? -1 : 1) + length) % length;
      cue('move'); announce();
    } else if (key === 'circle') {
      if (sn4Mode) {
        cue('confirm');
        showSn4(sn4.choose(index));
        return;
      }
      const target = pages[page].choice[index].target;
      page = pages.findIndex(block => block.target === target);
      cue('confirm'); printPage();
    }
    return;
  }
  if (scene === 'story' || scene === 'complete') {
    if (key === 'circle' || key === 'start') {
      if (sn4Mode && sn4Event.type === 'wait') {
        if (revealed < storyText().length) revealed = storyText().length;
        else if (performance.now() >= sn4WaitUntil) showSn4(sn4.run());
        return;
      }
      if (revealed < storyText().length) revealed = textWaits[0]?.offset ?? storyText().length;
      else if (textWaits.length) return;
      else if (sn4Mode) {
        if (sn4Event.type === 'end') {
          enter('complete');
        } else showSn4(sn4.run());
      }
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
      if (sn4Mode) {
        sn4.setNames(names);
        showSn4(sn4.resume(editor.value));
      } else { page++; printPage(); }
      if (role === 1 && autosave) {
        // Before the first choice the story save resumes where the two names have been given.
        const checkpoint = {names:[...names], resume:{label:'my01_0070', pc:0}, variables:varsToArray(sn4.variables),
          scene:null, music:'k1a001.ogg'};
        if (saves.writeStory(slot, checkpoint)) saved = saves.latest();
        else { userNotice = '자동 저장에 실패했습니다. 현재 게임은 계속할 수 있습니다.'; announce(); }
      }
    }
  }
}

function drawStory(time) {
  const block = sn4Mode ? {text:storyText, nativeGlyphWidth:true} : pages[page];
  const text = storyText().slice(0, Math.floor(revealed));
  const background = block.background ?? (sn4Mode && sn4Style.scene ? sn4Style.scene : (block.center ? 'my0007' : 'my0645'));
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
  const retainMovie = block.retainMovie || (sn4Mode && sn4Style.retainMovie);
  if (!block.movie && !retainMovie) screen.background(background, background === 'my0645', time);
  const origin = sn4Mode ? {x:sn4Style.marginLeft, y:sn4Style.marginTop}
    : (block.background === 'my0000' ? data.invitationOrigin : {x:32, y:31});
  const scale = block.center || (background === 'my0645' && !block.movie && !block.retainMovie) ? .96 : .91;
  const y = block.center ? 192 : origin.y;
  const x = block.center ? (640 - screen.width(storyText(), scale)) / 2 : origin.x;
  const rubies = sn4Mode ? sn4Style.rubies : (block.rubies ?? (block.ruby ? [block.ruby] : []));
  const readings = rubies.length ? new Map() : undefined;
  for (const ruby of rubies) {
    const start = ruby.offset ?? (block.firstRuby ? storyText().indexOf(ruby.word) : storyText().lastIndexOf(ruby.word));
    if (start >= 0) ruby.readings.forEach((reading, i) => readings.set(start + i, reading));
  }
  screen.c.save();
  if (!block.movie && !block.retainMovie && ['my0007', 'my0645'].includes(background)) {
    screen.c.filter = 'brightness(86%)';
  }
  const metrics = sn4Mode ? {spacing:sn4Style.letterSpacing, widthScale:1}
    : block.nativeGlyphWidth ? {spacing:0, widthScale:1} : {};
  const right = sn4Mode ? 640 - sn4Style.marginRight : 640;
  const max = right - x;
  const full = storyText();
  const styleAt = sn4Mode ? offset => {
    const style = sn4Style.styles.findLast(mark => mark.offset <= offset) ?? sn4Style;
    const ratio = style.fontSize / 33;
    return {scale:scale * ratio, widthScale:ratio, spacing:style.letterSpacing,
      leading:style.fontSize + style.lineSpacing};
  } : undefined;
  const lineStart = sn4Mode && sn4Style.centers.length ? offset => {
    if (!sn4Style.centers.includes(offset)) return undefined;
    const line = full.slice(offset).split('\n')[0];
    const width = Array.from(line).reduce((w, ch, index) => {
      const style = styleAt(offset + index);
      return w + ((data.font[ch] ?? data.font['�'])[2] + style.spacing) * style.widthScale;
    }, 0);
    return width < max ? x + (max - width) / 2 : x;
  } : undefined;
  const textOptions = {...metrics, scale, max, readings, colors:textColors, lineStart, styleAt,
    moves:sn4Mode ? sn4Style.moves : [], lines:sn4Mode ? sn4Style.lines : []};
  // The EE message window scrolls ordinary flowing text when a new line passes
  // the physical 448px bottom. Absolute-position title/lyric layouts do not scroll.
  const measured = sn4Mode ? screen.text(text, x, y, {...textOptions, measureOnly:true}) : null;
  const finalStyle = sn4Mode ? styleAt(text.length) : null;
  const scrollY = sn4Mode && !sn4Style.moves.some(move => move.absolute)
    ? Math.max(0, measured.y + 33 * finalStyle.scale - 448) : 0;
  const end = screen.text(text, x, y - scrollY, textOptions);
  screen.c.restore();
  const fade = sn4Mode && sn4Style.sceneFx.screen;
  if (fade) {
    const span = Math.max(1, fade.end - fade.start);
    const progress = Math.max(0, Math.min(1, (performance.now() - fade.start) / span));
    const alpha = fade.from + (fade.to - fade.from) * progress;
    if (alpha > 0) screen.rect(0, 0, 640, 448, `rgba(0,0,0,${alpha})`);
  }
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

function drawSpecialInput(time) {
  screen.background(sn4Style.scene ?? 'my0645', true, time);
  if (scene === 'click-map') {
    screen.rect(0, 0, 640, 34, 'rgba(0,0,0,.72)');
    screen.text('方向キーで調べる場所を選び、○で決定', 18, 5, {scale:.72});
    screen.c.strokeStyle = '#fff'; screen.c.lineWidth = 2;
    screen.c.beginPath();
    screen.c.moveTo(specialInput.x - 10, specialInput.y); screen.c.lineTo(specialInput.x + 10, specialInput.y);
    screen.c.moveTo(specialInput.x, specialInput.y - 10); screen.c.lineTo(specialInput.x, specialInput.y + 10);
    screen.c.stroke();
    return;
  }
  if (scene === 'panel') {
    screen.rect(40, 35, 560, 378, 'rgba(0,0,0,.62)');
    specialInput.targets.forEach((target, i) => {
      const x = 68 + i % 4 * 134, y = 68 + Math.floor(i / 4) * 78;
      if (i === specialInput.index) screen.rect(x - 5, y - 5, 124, 58, 'rgba(90,150,220,.78)');
      screen.text(String(i + 1), x + 44, y + 5, {scale:.88});
    });
    screen.text('○ 決定　× 戻る', 220, 382, {scale:.72});
    return;
  }
  if (scene === 'criminal-name') {
    screen.rect(34, 26, 572, 390, 'rgba(0,0,0,.70)');
    screen.text(`犯人の名前：${specialInput.value}`, 55, 40, {scale:.82});
    for (let column = 0; column < 15; column++) {
      const x = 548 - column * 33;
      screen.text(criminalHeads[column], x, 84, {scale:.72});
      for (let row = 0; row < 6; row++) {
        const y = 126 + row * 39;
        if (column === specialInput.column && row === specialInput.row)
          screen.rect(x - 5, y - 4, 34, 35, 'rgba(90,150,220,.80)');
        const glyph = criminalRows[row][column];
        if (glyph) screen.text(glyph, x, y, {scale:.78});
      }
    }
    screen.text('○ 入力　× 削除　△ 終了', 176, 381, {scale:.70});
    return;
  }
  screen.rect(68, 116, 504, 204, 'rgba(0,0,0,.72)');
  screen.text('暗号を入力してください', 176, 142, {scale:.86});
  const marks = specialInput.buttons.map(button => ({cross:'×',triangle:'△',square:'□'})[button]).join(' ');
  screen.text(marks, 104, 205, {scale:.83, max:440});
  screen.text(`× / △ / □　${specialInput.buttons.length}/${specialInput.length}`, 181, 278, {scale:.70});
}

function frame(now) {
  if (scene === 'name') moveKeyboardCursor(now);
  flushKeyboardEdit();
  const dt = Math.min(100, now - (lastFrame ?? now));
  lastFrame = now;
  const time = now / 1000;
  if (sn4Mode && sn4Event?.type === 'wait' && now >= sn4WaitUntil) showSn4(sn4.run());
  screen.c.clearRect(0,0,640,448);
  if (scene === 'copyright') {
    screen.c.drawImage(images.copyrigh, 0, 0);
    if (now - entered >= 140 * 1000 / 59.94) opening();
  } else if (scene === 'title') {
    screen.title(index, Boolean(saved));
    if (now - entered >= 4801 * 1000 / 59.94) opening(true);
  } else if (['autosave','slot','file-select','created','save-note'].includes(scene)) screen.autosave(scene, index, slot, names[0]);
  else if (['click-map','panel','criminal-name','cipher'].includes(scene)) drawSpecialInput(time);
  else if (scene === 'choice-wait') {
    drawStory(time);
    if (now - entered >= pages[page].choiceWait * 1000 / 59.94) enter('choice');
  } else if (scene === 'choice') {
    if (!sn4Mode && !pages[page].retainMovie) screen.background('my0645', true, time);
    else if (sn4Mode && !sn4Style.retainMovie) screen.background(sn4Style.scene ?? 'my0645', true, time);
    const choices = sn4Mode ? sn4Event.targets.map(choiceRoute) : pages[page].choice;
    choices.forEach((route, i) => {
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
      const perChar = sn4Mode ? 1000 / 59.94 * Math.max(1, speed) : 35 * speed;
      revealed = speed === 0 && !sn4Mode ? limit : Math.min(limit, revealed + dt / perChar);
    }
    if (sn4Mode && sn4Event?.type === 'wait' && sn4WaitUntil === Infinity && revealed >= storyText().length) {
      sn4WaitUntil = now + sn4Event.ticks * 1000 / 59.94;
    }
    drawStory(time);
    if (!sn4Mode && pages[page].autoAdvance && !textWaits.length && revealed >= storyText().length) { page++; printPage(); }
  } else if (scene === 'name' || scene === 'confirm') {
    screen.background('my0645', true, time);
    if (scene === 'name') screen.editor(editor, role);
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
  stopMovie(); stopMusic(); enter('error');
  loading.hidden = false; loading.textContent = '';
  const retry = document.createElement('button');
  retry.type = 'button'; retry.textContent = message + ' 다시 시도';
  retry.addEventListener('click', () => location.reload());
  loading.append(retry);
}

const keys = {ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'circle',
  Space:'start',KeyZ:'circle',KeyX:'cross',Escape:'cross',KeyA:'square',KeyS:'triangle',KeyQ:'l1',KeyW:'r1',Digit2:'l2'};
for (const type of ['pointerdown', 'keydown']) addEventListener(type, unlockAudio, {capture:true, once:true});
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
function canvasPoint(event) {
  const box = canvas.getBoundingClientRect();
  // Portrait "filled" mode rotates <main> by 90deg (player.css): the canvas x axis
  // then runs down the screen and its y axis runs right to left.
  if (filled && matchMedia('(orientation: portrait)').matches)
    return {x:(event.clientY - box.top) * 640 / box.height,
      y:(box.right - event.clientX) * 448 / box.width};
  return {x:(event.clientX - box.left) * 640 / box.width,
    y:(event.clientY - box.top) * 448 / box.height};
}

function touchGame(event) {
  if (menuOpen) return;
  const {x, y} = canvasPoint(event);
  // render.js footer(): ○ 決定 at 112..180 and × 戻る at 197..267 on the memory-card,
  // slot and name-confirm screens (the created/save-note screens show ○ only).
  if (y >= 386 && y < 420 && ['autosave','slot','file-select','created','save-note','confirm'].includes(scene)) {
    if (x >= 104 && x < 188) { step('circle'); return; }
    if (x >= 188 && x < 275 && !['created','save-note'].includes(scene)) { step('cross'); return; }
  }
  if (scene === 'click-map') {
    specialInput.x = x; specialInput.y = y; step('circle'); return;
  }
  if (scene === 'panel') {
    const column = Math.floor((x - 63) / 134), row = Math.floor((y - 63) / 78);
    const picked = row * 4 + column;
    if (column >= 0 && column < 4 && picked >= 0 && picked < specialInput.targets.length) {
      specialInput.index = picked; step('circle');
    } else if (y >= 370 && specialInput.fallback) step('cross');
    return;
  }
  if (scene === 'criminal-name') {
    if (y >= 116 && y < 360 && x >= 78 && x <= 570) {
      specialInput.column = Math.max(0, Math.min(14, Math.round((548 - x) / 33)));
      specialInput.row = Math.max(0, Math.min(5, Math.floor((y - 116) / 39)));
      step('circle');
    } else if (y >= 370) {
      if (x < 280) step('circle'); else if (x < 395) step('cross'); else step('triangle');
    }
    return;
  }
  if (scene === 'cipher') {
    if (y >= 250) step(x < 214 ? 'cross' : x < 426 ? 'triangle' : 'square');
    return;
  }
  if (scene === 'title') {
    if (y >= 360) { index = Math.max(0, Math.min(2, Math.floor((x - 79) / 152))); step('circle'); }
    return;
  }
  if (scene === 'choice') {
    const choices = sn4Mode ? sn4Event.targets : pages[page].choice;
    const picked = Math.floor((y - 48) / 64);
    if (picked >= 0 && picked < choices.length) { index = picked; step('circle'); }
    return;
  }
  if (scene === 'autosave') {
    if (x >= 235 && x <= 405 && y >= 140 && y <= 225) {
      index = y < 183 ? 0 : 1; step('circle');
    }
    return;
  }
  if (scene === 'slot') {
    if (y >= 245 && y <= 385) { index = x < 320 ? 0 : 1; step('circle'); }
    return;
  }
  if (['file-select','created','save-note'].includes(scene)) { step('circle'); return; }
  if (scene === 'confirm') {
    if (x >= 220 && x <= 390 && y >= 240 && y <= 335) {
      index = y < 287 ? 0 : 1; step('circle');
    }
    return;
  }
  if (scene === 'name') {
    if (y >= 68 && y < 112) {
      // render.js editor(): L1 + left arrow at 80..132, groups at 144 + 32i, right arrow + R1 at 506..559.
      if (x < 140) { step('l1'); return; }
      if (x >= 504) { step('r1'); return; }
      const group = Math.max(0, Math.min(editor.groups.length - 1, Math.floor((x - 144) / 32)));
      editor.groupBy(group - editor.group); announce(); return;
    }
    if (y >= 112 && y < 384 && x >= 72 && x < 568) {
      const row = editor.scroll + Math.floor((y - 119) / 32);
      const column = Math.floor((x - 80) / 32);
      if (editor.rows[row]?.[column]) {
        editor.row = row; editor.column = editor.preferredColumn = column;
        step('circle');
      }
      return;
    }
    if (y >= 384) {
      // Footer: ○ 文字決定 at 112..226, × 文字消す at 247..360, △ 入力終了 at 376..490.
      if (x < 237) step('circle');
      else if (x < 368) step('cross');
      else if (x < 500) step('triangle');
    }
    return;
  }
  step('circle');
}
canvas.addEventListener('click', touchGame);
menuButton.addEventListener('click', event => {
  event.stopPropagation();
  if (menuOpen) closeMenu();
  else if (['title','story','complete','choice','choice-wait'].includes(scene)) openMenu();
  else step('cross');
  canvas.focus();
});
gameMenu.addEventListener('click', event => {
  const action = event.target.dataset.menu;
  if (action === 'resume') closeMenu();
  else if (action === 'fullscreen') { closeMenu(); toggleFullscreen(); }
  else if (action === 'title') { closeMenu(); title(false); }
  else if (action === 'saves') { closeMenu(); syncUi?.open(); }
});
// 오류 신고 (/shared/player/report-button.js): where the player is and the sentence on screen.
globalThis.soundnovelReport = () => ({
  scene: sn4Mode ? `${sn4.label}+${sn4.pc}` : scene,
  text: scene === 'choice' && sn4Mode ? sn4Event.targets.map(t => sn4.choiceText(t)).join(' / ') : storyText(),
});
// 저장과 기기 연결 (sync-ui.js): only with the shared store, i.e. when the build is served by the hub.
let syncUi = null;
if (saves.store) {
  const savesButton = gameMenu.querySelector('[data-menu="saves"]');
  saves.store.subscribe(event => { if (event.type === 'remote') saved = saves.latest(); });
  const boot = {
    canContinue:() => Boolean(saves.suspended()),
    get titleActive() { return scene === 'title'; },
    continueSuspended:() => {
      const point = saves.suspended();
      if (!point || scene !== 'title') return false;
      slot = point.card ?? 0; autosave = Boolean(point.autosave);
      resumeAt(point);
      return true;
    },
    // Quick save (/shared/save/quick-save.js) calls this just before it uploads: the current resume point.
    saveNow:() => suspend(),
  };
  import('./sync-ui.js').then(({mountSyncUi}) => mountSyncUi({store:saves.store, gameId:GAME_ID, parent:document.querySelector('main'),
    onPaint:bad => savesButton.classList.toggle('attention', bad), onClose:() => canvas.focus(), boot})).then(ui => { syncUi = ui; }).catch(error => console.warn('Sync dialog unavailable', error));
  // 빠른 저장: the disk button left of the menu button (저장 → 4-digit code, 불러오기 → carry on).
  import('/shared/save/quick-save.js').then(m => m.mountQuickSave({store:saves.store, gameId:GAME_ID, boot})).then(() => import('/shared/player/report-button.js')).then(m => m.mountReport({gameId:GAME_ID, boot}))
    .catch(error => console.warn('Quick save unavailable', error));
} else gameMenu.querySelector('[data-menu="saves"]').hidden = true;
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) globalThis.screen.orientation?.unlock?.();
});
try {
  const [response, sn4Response] = await Promise.all([fetch(asset('opening.json')), fetch(asset('sn4.json'))]);
  if (!response.ok || !sn4Response.ok) throw new Error('Missing opening or SN4 data');
  data = await response.json();
  const sn4Program = await sn4Response.json();
  await Promise.all(['font','copyrigh','g_start','title_00','my0000','my0002','my0007','my0011','my0016b','my0021','my0645','mo0000','name_e01','mark','sys_fc01','sys_cd01','sys_cd02','sys_jo01','sys_jo02','sys_jo03','sys_save','sys_wa01'].map(async name => {
    const image = new Image(); image.src = asset(name + '.png'); await image.decode(); images[name] = image;
  }));
  groups = keyboardGroups(data.rows);
  const signed16 = value => (value << 16) >> 16;
  const point = value => ({x:value >> 16, y:signed16(value)});
  const markStyle = offset => sn4Style.styles.push({offset,
    fontType:sn4Style.fontType, fontSize:sn4Style.fontSize,
    letterSpacing:sn4Style.letterSpacing, lineSpacing:sn4Style.lineSpacing});
  sn4 = new Sn4Vm(sn4Program, {
    speed:value => { sn4Style.speed = value; sn4SpeedMarks.push({offset:sn4.text.trimEnd().length, speed:value}); },
    moveX:(value, offset) => sn4Style.moves.push({offset, x:value, y:0}),
    font:(type, size, offset) => { sn4Style.fontType = type; sn4Style.fontSize = size || 33; markStyle(offset); },
    letterSpacing:(value, offset) => { sn4Style.letterSpacing = value; markStyle(offset); },
    lineSpacing:(value, offset) => { sn4Style.lineSpacing = value; markStyle(offset); },
    // CommandLine::Execute checks the requested width against window +0x1c,
    // starts a new line when necessary, then emits the rule at the cursor.
    line:(type, width, offset) => sn4Style.lines.push({type, width, offset}),
    position:(value, offset) => sn4Style.moves.push({offset, ...point(value)}),
    absolutePosition:(value, offset) => sn4Style.moves.push({offset, ...point(value), absolute:true}),
    marginLeft:value => { sn4Style.marginLeft = value; },
    marginRight:value => { sn4Style.marginRight = value; },
    marginTop:value => { sn4Style.marginTop = value; },
    marginBottom:value => { sn4Style.marginBottom = value; },
    command5a:value => sn4Style.effects.push({name:'MojiAfterParam2', value, offset:sn4.text.length}),
    command5c:value => sn4Style.effects.push({name:'MojiAllInOutParam', value, offset:sn4.text.length}),
    ruby:(word, readings, offset) => { sn4Style.rubies.push({word, readings, offset}); },
    mojiSync:() => sn4Style.effects.length ? 1 : 0,
    clearText:() => {
      sn4Shown = ''; sn4Style.moves = []; sn4Style.lines = []; sn4Style.styles = []; sn4Style.effects = [];
      sn4Style.fontType = 0; sn4Style.fontSize = 33;
      sn4Style.centers = []; sn4Style.rubies = []; markStyle(0);
    },
    scene:value => { sn4Style.scenePack = value; },
    caption:value => { sn4Style.caption = value; return applyScenePack(value); },
    command:(name, args, context) => {
      sn4Style.sceneCommands.push({kind:'sn4', name, args, ...context});
      if (name === 'End') systemDue = true;
      // EE 0x136f30: measure the rest of the line and move the cursor by half the free width.
      if (name === 'Center') sn4Style.centers.push(sn4.text.length);
      else if (name === 'Default') {
        const value = args[0] ?? 32;
        if (context.op === 0x5e) sn4Style.marginLeft = value;
        else if (context.op === 0x60) sn4Style.marginRight = value;
        else if (context.op === 0x62) sn4Style.marginTop = value;
        else if (context.op === 0x64) sn4Style.marginBottom = value;
      } else if (['MojiInOut','MojiInOutParam','MojiAfter','MojiAfterParam','MojiAllInOut'].includes(name)) {
        sn4Style.effects.push({name, value:args[0] ?? 0, offset:sn4.text.length});
      }
      return 0;
    },
  });
  // The complete SN4 program is authoritative. Legacy page construction is
  // retained only for old save compatibility and is never used for new play.
  pages = [];
  screen = new Screen(canvas, images, data);
  enter('ready');
  requestAnimationFrame(frame);
} catch { fail('게임 데이터를 불러오지 못했습니다.'); }
if (scene === 'ready') {
  // shared/player/start-gate.js: every port starts at once; each tap or key wakes the sound.
  await startGate(stage, { onPress: () => { unlockAudio(); } });
  intro();
}
