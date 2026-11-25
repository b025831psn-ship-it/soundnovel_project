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
    const [{Sn4Vm}, program, opening] = await Promise.all([
      import('./sn4.js'), fetch('./assets/sn4.json').then(response => response.json()),
      fetch('./assets/opening.json').then(response => response.json()),
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
    return {entry:program.entry, hero, partner, choice, labels, commands,
      fallback:opening.font['�'], fullSpace:opening.font['　']};
  });

  assert.equal(result.entry, 'my01_0000');
  assert.equal(result.hero.role, 0);
  assert.equal(result.partner.role, 1);
  assert.ok(result.choice.targets.length >= 2);
  assert.ok(result.labels.every(label => label && !/^my/.test(label)));
  assert.ok(result.commands.some(command => command.name === 'Default'));
  assert.deepEqual(result.fallback.slice(2), [24, 24, 0]);
  assert.deepEqual(result.fullSpace.slice(2), [33, 0, 0]);

  // The actual shell must reach the same checkpoint using clicks alone.
  const canvas = page.locator('canvas');
  const at = async scene => {
    await page.waitForFunction(value => document.querySelector('canvas').dataset.scene === value,
      scene, {timeout:10000});
  };
  const tap = async (x = 320, y = 224) => {
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + x * box.width / 640, box.y + y * box.height / 448);
  };
  const advanceTo = async target => {
    for (let count = 0; count < 1500; count++) {
      const current = await canvas.getAttribute('data-scene');
      if (current === target) return;
      if (count && count % 500 === 0) console.log(`click flow: ${current} -> ${target} (${count})`);
      assert.ok(['story','complete'].includes(current), `${current} before ${target}`);
      await tap();
      await page.waitForTimeout(15);
    }
    throw new Error(`click-only flow did not reach ${target}`);
  };
  await page.getByRole('button', {name:'게임 시작'}).click();
  await at('logo');
  console.log('click flow: logo');
  await tap();
  await at('title');
  console.log('click flow: title');
  await tap(165, 400);
  await at('autosave');
  console.log('click flow: autosave');
  await tap(320, 205);
  await at('story');
  assert.equal(await page.locator('nav').count(), 0, 'virtual pad is absent');
  const menuButton = page.getByRole('button', {name:'게임 메뉴'});
  await menuButton.click();
  await page.locator('#game-menu').waitFor({state:'visible'});
  await menuButton.click();
  await page.locator('#game-menu').waitFor({state:'hidden'});
  await advanceTo('name');
  console.log('click flow: hero name');
  await tap(120, 130); // 이름판 첫 글자를 직접 선택
  // Footer areas follow the drawn labels: × 文字消す deletes, ○ 文字決定 enters.
  const nameLabel = () => canvas.getAttribute('aria-label');
  const typed = await nameLabel();
  await tap(300, 410);
  assert.equal(await nameLabel(), typed.slice(0, -1), '× 文字消す deletes one character');
  await tap(170, 410);
  assert.equal(await nameLabel(), typed, '○ 文字決定 enters the selected character');
  await tap(430, 410); // △ 入力終了
  await at('confirm');
  await tap(300, 270);
  await at('story');
  await advanceTo('name');
  console.log('click flow: partner name');
  await tap(120, 130);
  await tap(430, 410); // △ 入力終了
  await at('confirm');
  await tap(300, 270);
  await at('story');
  await advanceTo('choice');
  console.log('click flow: choice');
  await tap(200, 76);
  await at('story');
  assert.deepEqual(errors, []);
  console.log(`PASS browser VM + click-only shell: names -> ${result.choice.label}, ${result.commands.length} subsystem commands`);
} finally {
  await browser.close();
}
