// Music checks against a locally prepared site: loop seams and ScenePack volume/fade.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../web-player/tests/e2e.mjs', import.meta.url));
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8772/';
const browser = await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
try {
  const page = await browser.newPage();
  await page.goto(base);
  // L= values must match the Ogg comments; the seam must repeat [L, end) sample for sample.
  const seams = await page.evaluate(async () => {
    const { LoopingMusic } = await import('./music.js');
    const loopFrames = {
      'k1a001.ogg': 1017889, 'k1a004.ogg': 36359, 'k2h002.ogg': 461348,
      'k2h003.ogg': 863143, 'k2h017.ogg': 863622, 'k2t002.ogg': 475399,
    };
    const results = [];
    for (const [file, loop] of Object.entries(loopFrames)) {
      const bytes = await (await fetch('assets/' + file)).arrayBuffer();
      const text = new TextDecoder('latin1').decode(new Uint8Array(bytes, 0, 4096));
      const comment = Number(/L=(\d+)/.exec(text)?.[1]);
      const buffer = await new OfflineAudioContext(2, 1, 48000).decodeAudioData(bytes);
      const extra = 48000, n = buffer.length;
      const context = new OfflineAudioContext(2, n + extra, 48000);
      const source = context.createBufferSource();
      source.buffer = buffer; source.loop = true;
      source.loopStart = loop / 48000; source.loopEnd = buffer.duration;
      source.connect(context.destination); source.start();
      const out = (await context.startRendering()).getChannelData(0), src = buffer.getChannelData(0);
      let seam = 0;
      for (let k = 0; k < extra; k++) seam = Math.max(seam, Math.abs(out[n + k] - src[loop + k]));
      results.push({file, loop, comment, rate:buffer.sampleRate, seam});
    }
    // Runtime: ScenePack start (volume 50, fade 30) then stop with fade 60.
    const music = new LoopingMusic({asset: name => new URL('assets/' + name, location.href).href, loopFrames});
    music.play('k1a001.ogg', {volume:50, fadeFrames:30});
    while (!music.voice) await new Promise(r => setTimeout(r, 20));
    const started = {loopStart: music.voice.source.loopStart, loop: music.voice.source.loop, initial: music.voice.gain.gain.value};
    await new Promise(r => setTimeout(r, 700));
    started.after = music.voice.gain.gain.value;
    music.volume(20, {fadeFrames:30});
    await new Promise(r => setTimeout(r, 700));
    started.changed = music.voice.gain.gain.value;
    const voice = music.voice;
    music.stop({fadeFrames:60});
    await new Promise(r => setTimeout(r, 300));
    const fading = voice.gain.gain.value;
    // A volume change that arrives before decoding finishes must not be lost.
    const early = new LoopingMusic({asset: name => new URL('assets/' + name, location.href).href, loopFrames});
    early.play('k2h002.ogg', {volume:50});
    early.volume(20);
    while (!early.voice) await new Promise(r => setTimeout(r, 20));
    const earlyLevel = early.voice.gain.gain.value;
    early.stop();
    return {results, started, fading, playing: music.playing, earlyLevel};
  });
  for (const r of seams.results) {
    assert.equal(r.comment, r.loop, r.file + ' L= comment');
    assert.equal(r.rate, 48000, r.file + ' rate');
    assert.equal(r.seam, 0, r.file + ' seam');
  }
  assert.equal(seams.started.loop, true);
  assert.ok(Math.abs(seams.started.loopStart - 1017889 / 48000) < 1e-9);
  assert.equal(seams.started.initial, 0);
  const volume50 = 63 / 127;
  assert.ok(Math.abs(seams.started.after - volume50) < 1e-6, 'fade-in reaches quantized volume 50');
  const volume20 = 25 / 127;
  assert.ok(Math.abs(seams.started.changed - volume20) < 1e-6, 'volume change reaches quantized volume 20');
  assert.ok(seams.fading > 0 && seams.fading < volume20, 'fade-out in progress');
  assert.equal(seams.playing, false);
  assert.ok(Math.abs(seams.earlyLevel - volume20) < 1e-6, 'volume change during decode is kept');
  console.log('PASS music: 6 loop seams sample-exact at L=, EE volume quantization/change, fade-in/fade-out');
} finally {
  await browser.close();
}
