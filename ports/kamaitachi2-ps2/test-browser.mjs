// Browser regression for the complete SN4 VM. It deliberately avoids the old
// hand-authored page sequence and drives the extracted program from my01_0000.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../web-player/tests/e2e.mjs', import.meta.url));
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8772/';
const browser = await chromium.launch({
  executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  args:['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

try {
  const page = await browser.newPage({viewport:{width:960, height:768}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(response.url());
  });
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.scene === 'ready');

  const result = await page.evaluate(async () => {
    const [{Sn4Vm}, program] = await Promise.all([
      import('./sn4.js'), fetch('./assets/sn4.json').then(response => response.json()),
    ]);
    const commands = [];
    const vm = new Sn4Vm(program, {
      command:(name, args, context) => { commands.push({name, args, op:context.op}); return 0; },
      caption:() => 0,
    });
    vm.reset('my01_0000');
    vm.setNames(['透', '真理']);
    let event = vm.run();
    const reach = expected => {
      for (let steps = 0; steps < 50000; steps++) {
        if (event.type === expected) return event;
        if (event.type === 'end') throw new Error(`ended at ${event.label} before ${expected}`);
        if (event.type === 'name') event = vm.resume(event.role ? '真理' : '透');
        else if (event.type === 'choice') event = vm.choose(0);
        else event = vm.run();
      }
      throw new Error(`did not reach ${expected}`);
    };
    const hero = reach('name');
    event = vm.resume('透');
    const partner = reach('name');
    event = vm.resume('真理');
    const choice = reach('choice');
    const labels = choice.targets.map(target => vm.choiceText(target));
    return {entry:program.entry, hero, partner, choice, labels, commands};
  });

  assert.equal(result.entry, 'my01_0000');
  assert.equal(result.hero.role, 0);
  assert.equal(result.partner.role, 1);
  assert.ok(result.choice.targets.length >= 2);
  assert.ok(result.labels.every(label => label && !/^my/.test(label)));
  assert.ok(result.commands.some(command => command.name === 'Default'));
  assert.deepEqual(errors, []);
  console.log(`PASS browser VM: names -> ${result.choice.label}, ${result.commands.length} subsystem commands`);
} finally {
  await browser.close();
}
