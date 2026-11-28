// Headless driver for the branch explorer: boots the VM with the APU, starts a new game and
// advances text until a story choice is fully drawn (its option table unchanged for
// STABLE frames) or a stop condition. Shared by walk.mjs and explore.mjs.
import fs from 'node:fs';
import { APU } from '../sound/apu.js';
import { MasterLink } from '../sound/master-link.js';
import { storyChoice } from '../sound/touch.js';

export const PAD = { A: 0x80, DOWN: 0x400, UP: 0x800, START: 0x1000 };
const STABLE = 24;

export async function createMachine(romPath, vmDir = process.env.SFC_VM ?? '../../../sfc-vm') {
  const { SfcMachine } = await import(`${vmDir}/machine.js`);
  const apu = new APU(); apu.powerOn();
  const ctx = { fb: null };
  const m = new SfcMachine({ rom: new Uint8Array(fs.readFileSync(romPath)), apu,
    busOptions: { masterLink: new MasterLink(apu) }, onFrame: (f, b) => { ctx.fb = b; } });
  m.setButtons(0);
  ctx.m = m; ctx.apu = apu;
  ctx.run = (n) => { const end = m.frame + n; while (m.frame < end) m.step(); };
  ctx.press = (name, hold = 3, gap = 4) => { m.setButtons(PAD[name]); ctx.run(hold); m.setButtons(0); ctx.run(gap); };
  ctx.save = () => m.saveState({ apu });
  ctx.load = (s) => m.loadState(s, { apu });
  return ctx;
}

export function newGame(ctx) {
  ctx.run(1800); ctx.press('START'); ctx.run(120); ctx.press('A'); ctx.run(180); ctx.press('A');
}

const key = (c) => c.tops.join(',');

// Advances with A until a stable choice; returns { choice } or { stop: reason }.
export function advance(ctx, { maxFrames = 60000, every = 10 } = {}) {
  const { m } = ctx, start = m.frame;
  let seen = null, since = 0;
  while (m.frame - start < maxFrames) {
    const c = storyChoice(m.bus.wram);
    if (c) {
      if (seen === key(c)) { if (m.frame - since >= STABLE) return { choice: c, frame: m.frame }; }
      else { seen = key(c); since = m.frame; }
      ctx.run(4); continue;
    }
    seen = null;
    ctx.press('A', 3, every - 3);
  }
  return { stop: 'timeout', frame: m.frame };
}

// Moves the cursor from the current option to `index` and confirms.
export function choose(ctx, c, index) {
  for (let i = c.current; i !== index; i += index > i ? 1 : -1) ctx.press(index > i ? 'DOWN' : 'UP', 3, 8);
  ctx.press('A', 3, 8);
}
