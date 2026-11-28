// Runs the 65c816 VM and the APU off the main thread. Messages in:
//   { type: 'start', game, gauss, port, sram? }   game/gauss/sram: ArrayBuffer, port: out.connectPort()
//   { type: 'buttons', mask }  held keys    { type: 'pause', on }
//   { type: 'tap', x, y }      screen pixels; pressed as planTap() decides
//   { type: 'press', name }    one button press (menu icon actions)
//   { type: 'reset' }          the console Reset button
// Messages out: { type: 'status', frame, time, cost, keyboard, cursor, title } about four
//               times a second (keyboard: a name keyboard is up, so the menu button hides),
//               { type: 'frame', frame, pixels } (256x224 RGBA) when the picture changed,
//               { type: 'sram', bytes } (8 KiB) a little after the game writes its bookmarks,
//               { type: 'error', message }.
import { APU } from './apu.js';
import { runRealtime } from './realtime.js';
import { createPcmSink } from './pcm-sink.js';
import { VmSound, PAD } from './vm-sound.js';
import { tapTarget, storyChoice, PressQueue, isKeyboard, keyboardTarget, keyboardStep } from './touch.js';
import { SfcMachine } from '../../../sfc-vm/machine.js';

let machine = null, vm = null, run = null, held = 0, seek = null;
// The option the game last took from a story choice (its cursor when the choice closed), for status.
let choiceCursor = null, picked = null;
const watchChoice = () => { const c = storyChoice(machine.bus.wram); if (c) choiceCursor = c.current; else if (choiceCursor != null) { picked = choiceCursor; choiceCursor = null; } };
// Taps on lists and keyboards walk the game's own cursor one press at a time, reading it back
// after each press, because the game drops presses while a screen fades in or text types.
// List (choice, bookmark shelf, name check): the tapped item is chosen at once: the cursor
// moves there, then A.
// Keyboard: the cursor goes to the tapped cell and A types it at once. When a press does not
// move the cursor it tries the other axis; if that does not move it either (a message box is
// up), it presses A once and stops.
const seekStep = () => {
  if (!seek || queue.busy) return;
  const w = machine.bus.wram;
  if (seek.confirm) {
    // A on a list item, pressed again every half second while the list is still up (the game
    // ignores A until the text above the items has finished), at most six times.
    if (seek.wait > 0) { seek.wait--; return; }
    if (seek.tries > 0 && seek.read(w, machine.bus.io) == null) { seek = null; return; }
    if (++seek.tries > 6) { seek = null; return; }
    seek.wait = 30; queue.push(PAD.A); return;
  }
  if (seek.read) {
    const cur = seek.read(w, machine.bus.io);
    if (cur == null) { if (++seek.waits > 90) seek = null; return; }
    if (cur === seek.target) { seek = { read: seek.read, target: seek.target, confirm: true, tries: 0, wait: 0 }; return; }
    if (++seek.presses > 40) { seek = null; return; }
    queue.push(PAD[seek.target > cur ? 'DOWN' : 'UP']);
    return;
  }
  const pos = w[0x1020];
  if (seek.moved && seek.last === pos) {
    if (seek.stuck) { seek = null; queue.push(PAD.A); return; }
    seek.stuck = true; seek.vertical = !seek.vertical;
  } else if (seek.moved) seek.stuck = false;
  const b = keyboardStep(w, seek.target, seek.vertical);
  if (b === 'A') { const s = seek; seek = null; if (s.press) queue.push(PAD.A); else if (s.scroll) queue.push(PAD[s.scroll > 0 ? 'DOWN' : 'UP']); return; }
  if (++seek.presses > 30) { seek = null; return; }
  seek.last = pos; seek.moved = true; queue.push(PAD[b]);
};
const queue = new PressQueue();
onmessage = ({ data }) => {
  if (data.type === 'start') start(data);
  else if (data.type === 'buttons') held = data.mask;
  else if (data.type === 'pause') run?.setPaused(data.on);
  else if (data.type === 'tap' && machine && !queue.busy && !seek) {
    const w = machine.bus.wram;
    const hit = isKeyboard(w) ? keyboardTarget(data.x, data.y, w) : null;
    if (hit) seek = { ...hit, presses: 0 };
    else if (!isKeyboard(w)) {
      const t = tapTarget(w, machine.bus.io, data.x, data.y);
      if (t === 'A') queue.push(PAD.A);
      else if (t && t.read(w, machine.bus.io) === t.target) seek = { ...t, confirm: true, tries: 0, wait: 0 };
      else if (t) seek = { ...t, presses: 0, waits: 0 };
    }
  }
  else if (data.type === 'press' && PAD[data.name]) queue.push(PAD[data.name]);
  // The console's Reset button (陰謀編 is entered with it, as on the original).
  else if (data.type === 'reset' && vm) { seek = null; queue.clear?.(); vm.reset(); choiceCursor = null; }
  // A vertical drag or the wheel: on a name keyboard it pages the kanji list; on the story it
  // goes back a sentence (X) when dragged down / wheeled up.
  else if (data.type === 'scroll' && machine && !queue.busy && !seek) {
    const w = machine.bus.wram;
    if (isKeyboard(w)) { const col = Math.min(11, Math.max(2, w[0x1020] & 15)); seek = { target: (data.dir > 0 ? 9 : 1) * 16 + col, press: false, scroll: data.dir, presses: 0 }; }
    else if (data.dir < 0 && tapTarget(w, machine.bus.io, 128, 112) === 'A') queue.push(PAD.X);
  }
};

function start({ game, gauss, port, sram }) {
  const sink = createPcmSink(port);
  const apu = new APU({ gauss: new Int16Array(gauss) }); apu.powerOn(); apu.dsp.onSample = sink.sample;
  let shown = null, latest = null, latestFrame = 0;
  // The VM keeps debug logs (bus events, APU accesses, instruction trace) unbounded by
  // default; a player must switch them off or the tab runs out of memory in minutes.
  machine = new SfcMachine({ rom: new Uint8Array(game), apu,
    busOptions: { eventLimit: 0, apuTraceLimit: 0 }, cpuOptions: { traceLimit: 0 },
    onFrame: (frame, fb) => { latest = fb; latestFrame = frame; watchChoice(); seekStep(); machine.setButtons(held | queue.frame()); } });
  machine.setButtons(0);
  // Battery save: load the stored bookmarks, and hand them back when the game changes them
  // (checked twice a second; sent once the bytes have stayed the same for one check).
  const live = machine.bus.sram;
  if (sram && sram.byteLength === live.length) live.set(new Uint8Array(sram));
  let kept = live.slice(), dirty = false, sramAt = 0;
  const watchSram = (now) => {
    if (now < sramAt) return; sramAt = now + 500;
    let same = true; for (let i = 0; i < live.length; i++) if (live[i] !== kept[i]) { same = false; break; }
    if (!same) { kept = live.slice(); dirty = true; return; }
    if (dirty) { dirty = false; const bytes = kept.slice(); postMessage({ type: 'sram', bytes }, [bytes.buffer]); }
  };
  vm = new VmSound(machine);
  let cost = 0, reportAt = 0;
  run = runRealtime({
    get time() { return vm.time; }, end: null,
    runTo(t) {
      const a = performance.now();
      try { vm.runTo(t); } catch (e) { run.stop(); postMessage({ type: 'error', message: String(e?.message ?? e) }); }
      cost = cost * 0.9 + (performance.now() - a) * 0.1;
    },
  }, sink, {
    schedule: (f) => setTimeout(f, 8),
    onFrame: () => {
      // One copy per step at most, and only when the PPU produced a new picture.
      if (latest && latest !== shown) {
        shown = latest; const pixels = latest.slice();
        postMessage({ type: 'frame', frame: latestFrame, pixels }, [pixels.buffer]);
      }
      const now = performance.now();
      watchSram(now);
      if (now < reportAt) return; reportAt = now + 250;
      const w = machine.bus.wram;
      postMessage({ type: 'status', frame: vm.frame, time: vm.time, cost, keyboard: isKeyboard(w), cursor: w[0x1020], title: w[0x3c3], item: w[0x2482], typed: w[0x1024], choice: storyChoice(w), picked });
    },
  });
}
