import test from "node:test";
import assert from "node:assert/strict";
import { SoundModule } from "../sound/module.js";

// Hand-written tables and scripts only (no game data).
const tables = { panLaw: Uint8Array.from({ length: 64 }, (_, i) => i * 4), songs: Array.from({ length: 4 }, () => ({ reverbType: 5, reverbDepth: 60, duration: 0xffff, loops: 0, volume: 256 })) };

function rig() {
  const calls = []; const keyed = new Set();
  const ss = new Proxy({}, { get: (_, k) => (...a) => {
    calls.push([k, ...a]);
    if (k === "SpuMallocWithStartAddr") return 0x1010;
    if (k === "SsVabOpenHeadSticky") return 3;
    if (k === "SsVabTransCompleted") return 1;
    if (k === "SsUtKeyOnV") { keyed.add(a[0]); return a[0]; }
    if (k === "SsUtKeyOffV") { keyed.delete(a[0]); return 0; }
    if (k === "SpuGetKeyStatus") { for (const v of keyed) if (a[0] === 1 << v) return 1; return 3; }
    return 0;
  } });
  const mod = new SoundModule(ss, tables, {
    loadMember: (pac, id) => pac === "MUS" ? { head: { fsize: 0x1000 }, body: new Uint8Array(16), seq: new Uint8Array(16) } : null,
  });
  mod.reset();
  return { mod, calls, keyed };
}
const start = (mod, script, id = 1005, ch = 0, fade = 0) => mod.startEffect(id, ch, fade, { head: { fsize: 0x100 }, body: new Uint8Array(16), script: Uint8Array.from(script) });
const run = (mod, n) => { for (let i = 0; i < n; i++) { mod.vsync(); mod.frame(); } };

test("effect: note on uses voice 18+ch, wait counts frames, stop closes the bank", () => {
  const { mod, calls } = rig();
  // noteOn prog 2, pitch 0x3c00; wait 3; stop
  start(mod, [3, 2, 0, 0x00, 0x3c, 1, 3, 0, 14], 1005, 1);
  assert.equal(mod.ch[1].id, 5);
  run(mod, 1);
  const on = calls.find((c) => c[0] === "SsUtKeyOnV");
  assert.deepEqual(on.slice(1, 7), [0x13, 3, 2, 0, 0x3c, 0]);
  run(mod, 2);
  assert.equal(mod.active[1], 1, "wait 3 = this frame + 2 more");
  run(mod, 1);
  assert.equal(mod.active[1], 0);
  assert.equal(mod.isDone(5), true);
  assert.ok(calls.some((c) => c[0] === "SsVabClose"));
});

test("effect: loop and flag jump (scenario ends a looping effect)", () => {
  const { mod } = rig();
  // 0: loopStart 2 ; 3: wait 1 ; 6: loopEnd ; 7: jumpIfFlag 1 -> 14 ; 11: jump 0 ; 14: stop
  start(mod, [12, 2, 0, 1, 1, 0, 13, 10, 1, 14, 0, 0, 0, 0, 14]);
  run(mod, 20);
  assert.equal(mod.active[0], 1);
  mod.setFlag(mod.ch[0].id, 1);
  run(mod, 6);
  assert.equal(mod.active[0], 0);
});

test("effect: volume ramp reaches target in N frames and fade-out queues stop", () => {
  const { mod, calls } = rig();
  start(mod, [3, 0, 0, 0, 0x30, 4, 0x40, 4, 0, 2, 0, 9, 0]); // noteOn; volume 0x40 over 4; then spin
  run(mod, 6);
  assert.equal(mod.ch[0].vol, 0x4000);
  const vv = calls.filter((c) => c[0] === "SsUtSetVVol").at(-1);
  assert.equal(vv[1], 0x12);
  mod.stopEffect(0, 3);
  run(mod, 5);
  assert.equal(mod.active[0], 0);
});

test("music: play sets reverb from table, fade-in steps volume, stop with fade closes", () => {
  const { mod, calls } = rig();
  mod.playMusic(2, 10);
  assert.ok(calls.some((c) => c[0] === "SsUtSetReverbType" && c[1] === 5));
  assert.equal(mod.music.sbAddr, 0x80000 - (0x1000 + 0xade0 * 2));
  run(mod, 12);
  assert.equal(mod.music.vol, 256 * 90);
  mod.stopMusic(4);
  run(mod, 6);
  assert.equal(mod.music.playing, 0);
  assert.ok(calls.some((c) => c[0] === "SsSeqClose"));
});
