// Which screen the game shows, and what a tap at (x, y) on it means, read from the game's own WRAM.
// Measured on the 65c816 VM against the original program (tools/qa/CHECKPOINTS.md, issue #41):
// $1FFD/$1FFA are the low bytes of the return addresses of the routine waiting for input, so they
// name the screen; the cursors are the game's own variables.
import { PAD } from './input-queue.js';

const START_SCREENS = new Set([0x80, 0xcf, 0xd0]); // logo, opening, title: only START goes on
const WINDOWS = { 0x62: 'prompt', 0xeb: 'prompt', 0x81: 'names', 0x91: 'file', 0xea: 'erase' };
const W = {
  slot: 0x006e, // 0..2, the disk in front
  fileItem: 0x0337, // 0 途中から再開する, 1 最初から始める, 2 ファイルを消す
  eraseItem: 0x03a3, // 0 いいえ, 1 はい
  row: 0x0341, column: 0x0342, command: 0x0343, mode: 0x0344, side: 0x0345, // name board
};

export function screenOf(wram, touch) {
  if (touch?.choice) return 'choice';
  const at = wram[0x1ffd], sub = wram[0x1ffa];
  if (START_SCREENS.has(at)) return 'start';
  if (at === 0xef) return sub === 0 ? 'slots' : 'busy';
  if (at === 0xf0 || at === 0xf1) return WINDOWS[sub] ?? 'busy'; // f0 when opened with A on a used disk, f1 with L
  return 'story';
}

const inside = (x, y, x0, y0, x1, y1) => x >= x0 && x < x1 && y >= y0 && y < y1;

// The item under (x, y) on a menu screen, or null when the tap is away from every item.
export function itemAt(screen, x, y, wram) {
  switch (screen) {
    case 'slots': {
      // Three floppy disks, disk k from (8 + 31k, 14 + 48k) down to the bottom; the chosen one in front.
      const disk = (k) => inside(x, y, 8 + 31 * k, 14 + 48 * k, 190 + 31 * k, 224);
      const front = wram[W.slot];
      if (disk(front)) return { slot: front };
      for (let k = 2; k >= 0; k--) if (disk(k)) return { slot: k };
      return null;
    }
    case 'file':
      for (let k = 0; k < 3; k++) if (inside(x, y, 64, 106 + 24 * k, 192, 130 + 24 * k)) return { file: k };
      return null;
    case 'erase':
      if (inside(x, y, 168, 152, 206, 182)) return { erase: 0 };
      if (inside(x, y, 206, 152, 248, 182)) return { erase: 1 };
      return null;
    case 'names': {
      if (inside(x, y, 2, 14, 36, 84)) return { mode: 0 };
      if (inside(x, y, 2, 84, 36, 140)) return { mode: 1 };
      if (inside(x, y, 2, 140, 36, 182)) return { mode: 2 };
      if (inside(x, y, 216, 14, 254, 100)) return { command: 0 };
      if (inside(x, y, 216, 100, 254, 154)) return { command: 1 };
      if (inside(x, y, 216, 154, 254, 184)) return { command: 2 };
      if (inside(x, y, 39, 46, 215, 174)) return { row: Math.floor((y - 46) / 16), column: Math.floor((x - 23) / 16) };
      return null;
    }
    default: return null;
  }
}

const toward = (now, goal, less, more) => (now < goal ? more : less);

// A plan for InputQueue.seek: press toward the tapped item with the game's own cursor, read the
// cursor back after every press, then confirm. Stops if the game leaves the screen.
export function planFor(item, screen, readWram, readTouch) {
  let pressedStart = 0;
  return (touch) => {
    const wram = readWram();
    const now = screenOf(wram, touch ?? readTouch());
    if (now === 'busy') return undefined;
    if (now !== screen) return null;
    if ('slot' in item) {
      const at = wram[W.slot];
      return at === item.slot ? { press: PAD.A, done: true } : { press: toward(at, item.slot, PAD.UP, PAD.DOWN) };
    }
    if ('file' in item) {
      const at = wram[W.fileItem];
      return at === item.file ? { press: PAD.A, done: true } : { press: toward(at, item.file, PAD.UP, PAD.DOWN) };
    }
    if ('erase' in item) {
      const at = wram[W.eraseItem];
      return at === item.erase ? { press: PAD.A, done: true } : { press: toward(at, item.erase, PAD.LEFT, PAD.RIGHT) };
    }
    // $0345 is set in either side column: the mode labels (column 0) or the commands (right).
    const side = wram[W.side] !== 0;
    const left = side && wram[W.column] === 0, right = side && !left;
    if ('command' in item) {
      // 決定 is the START button on the original; it is pressed again if the board stays up.
      if (item.command === 2) return ++pressedStart > 3 ? null : { press: PAD.START };
      if (!right) return { press: PAD.RIGHT };
      const at = wram[W.command];
      return at === item.command ? { press: PAD.A, done: true } : { press: toward(at, item.command, PAD.UP, PAD.DOWN) };
    }
    if ('mode' in item) {
      if (!left) return { press: PAD.LEFT };
      const at = wram[W.mode];
      return at === item.mode ? null : { press: toward(at, item.mode, PAD.UP, PAD.DOWN) };
    }
    if (left) return { press: PAD.RIGHT };
    if (right) return { press: PAD.LEFT };
    const column = wram[W.column], row = wram[W.row];
    if (column !== item.column) return { press: toward(column, item.column, PAD.LEFT, PAD.RIGHT) };
    if (row !== item.row) return { press: toward(row, item.row, PAD.UP, PAD.DOWN) };
    return { press: PAD.A, done: true };
  };
}

// A tap that lands while a window is opening, closing or blinking: wait for the screen to settle,
// then treat it as a tap on that screen's item (or drop it when nothing is under the finger).
export function planForLateTap(x, y, readWram, readTouch) {
  let plan = null;
  return (touch) => {
    if (plan) return plan(touch);
    const wram = readWram();
    const now = screenOf(wram, touch ?? readTouch());
    if (now === 'busy') return undefined;
    const item = itemAt(now, x, y, wram);
    if (!item) return null;
    plan = planFor(item, now, readWram, readTouch);
    return plan(touch);
  };
}
