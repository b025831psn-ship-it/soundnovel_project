// Plays one path headless: reset -> new game -> advance text with A, take option `pick` at
// every story choice. Logs choices; optional screenshots. Prototype for the branch explorer.
// node tools/walk.mjs <rom.sfc> <frames> [outdir]   (env SFC_VM=path to sfc-vm/machine.js dir)
import fs from 'node:fs';
import { APU } from '../sound/apu.js';
import { MasterLink } from '../sound/master-link.js';
import { storyChoice } from '../sound/touch.js';
const VM = process.env.SFC_VM ?? '../../../sfc-vm';
const { SfcMachine } = await import(`${VM}/machine.js`);
const PAD = { A: 0x80, DOWN: 0x400, UP: 0x800, START: 0x1000 };
const [romPath, frameArg = '20000', out] = process.argv.slice(2);
const apu = new APU(); apu.powerOn();
let fb = null;
const m = new SfcMachine({ rom: new Uint8Array(fs.readFileSync(romPath)), apu,
  busOptions: { masterLink: new MasterLink(apu) }, onFrame: (f, b) => { fb = b; } });
m.setButtons(0);
const run = (n) => { const end = m.frame + n; while (m.frame < end) m.step(); };
const press = (name, hold = 3, gap = 4) => { m.setButtons(PAD[name]); run(hold); m.setButtons(0); run(gap); };
const shot = (name) => { if (out) fs.writeFileSync(`${out}/${name}.rgba`, fb); };
run(1800); press('START'); run(120); press('A'); run(180); press('A');
const choices = []; const limit = +frameArg; let lastChoiceFrame = -1;
const t0 = Date.now();
while (m.frame < limit) {
  const c = storyChoice(m.bus.wram);
  if (c && m.frame - lastChoiceFrame > 30) {
    choices.push({ frame: m.frame, tops: c.tops, current: c.current });
    shot(`choice-${choices.length}`);
    console.log('choice', choices.length, 'frame', m.frame, 'options', c.tops.length);
    press('A'); lastChoiceFrame = m.frame; run(30); continue;
  }
  press('A', 3, 7);
}
console.log('done frame', m.frame, 'choices', choices.length, 'sec', (Date.now() - t0) / 1000);
shot('end');
