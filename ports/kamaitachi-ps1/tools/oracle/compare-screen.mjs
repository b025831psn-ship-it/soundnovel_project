// Runs the whole game twice on the oracle (tools/oracle/game-boot.mjs): once with the original
// screen routines, once with the JS ports hooked in at the same addresses. Compares every
// GP0/GP1 word and the visible picture each frame, and reports the first difference.
// Usage: node tools/oracle/compare-screen.mjs <dir with SLPS_017.94 and *.PAC> [frames] [--pads JSON]
import { pathToFileURL } from "node:url";
import { GameBoot, loadDisc, padScript } from "./game-boot.mjs";
import { drawGlyph } from "../../src/text/glyph.js";
import { textTask } from "../../src/text/text.js";
import { LibGpu, LIBGPU_ENTRY } from "../../src/gpu/libgpu.js";
import { frameFlip } from "../../src/screen/frame.js";
import { spriteInit, spriteClearAll, spriteNew, spriteAdd, spriteLayer, spriteOr } from "../../src/screen/sprites.js";
import { waveTick } from "../../src/screen/wave.js";
import { shakeTick } from "../../src/screen/shake.js";
import { inputTick, inputClear, padRead } from "../../src/input.js";
import { fadeStep, fadeIn, fadeTo, fadeLater, fadeTick, fadeOut } from "../../src/screen/fader.js";

// The context a port runs with on the oracle: RAM is the interpreter's, and routines that are
// not ported run natively with sp set to the caller's frame (stack arguments at sp+0x10).
export function oracleCtx(c) {
  const call = (addr, args = [], sp = c.r[29] >>> 0) => { const old = c.r[29]; c.r[29] = (sp + 0x40) | 0; const v = c.call(addr, args); c.r[29] = old; return v; }; // Mips.call drops sp by 0x40
  return { m: c, sp: c.r[29] >>> 0, call };
}

export const DEFAULT_PADS = [[300, "circle"], [600, "circle"], [720, "down"], [780, "circle"], ...Array.from({ length: 400 }, (_, i) => [900 + 45 * i, "circle"])];

// Each port: [address, install(game)] — the hook runs the JS routine on the oracle's RAM,
// calling the game's own code only for what has not been ported yet.
const libgpuOf = (c) => c.libgpu ??= new LibGpu({ read: (a, w) => c.read(a, w), write: (a, v, w) => c.write(a, v, w), vsync: () => c.read(0x800785c0, 4) });
// Runs a ported generator routine on the oracle: each yield is a VSync(0), served by the HLE.
function drive(gen, c) { let r = gen.next(); while (!r.done) r = gen.next(c.call(0x800530f8, [0])); return r.value; }

// libgpu/libgs on the oracle: RAM and I/O are the interpreter's; VSync(-1) reads the counter.
function libgpuHooks() {
  const hooks = [];
  for (const [name, addr] of Object.entries(LIBGPU_ENTRY)) hooks.push([addr, (c) => {
    const lib = libgpuOf(c);
    const a = [4, 5, 6, 7].map((k) => c.r[k] | 0);
    if (name === "ResetGraph" && [0, 3, 5].includes(a[0] & 7)) return false; // boot-time init: not ported yet, runs natively
    const sp = c.r[29] >>> 0, st = (k) => c.read(sp + 0x10 + 4 * k, 4) | 0;
    const args = name === "LoadTPage" ? [...a, st(0), st(1), st(2), sp - 0x30] : name === "LoadClut" ? [a[0], a[1], a[2], sp - 0x28] : a;
    const v = lib[name](...args);
    c.r[2] = (v ?? c.r[2]) | 0; c.ret();
  }]);
  return hooks;
}

export const PORTS = {
  libgpu: [libgpuHooks, null],
  input: [() => {
    const ctx = (c) => ({ ...oracleCtx(c), padState: (port) => c.call(0x80064be4, [port]) | 0 });
    return [[0x80025440, (c) => { inputTick(ctx(c)); c.ret(); }], [0x80025600, (c) => { inputClear(c); c.ret(); }],
      [0x80025eec, (c) => { c.r[2] = padRead(ctx(c)); c.ret(); }]];
  }, null],
  sprite: [() => {
    const ctx = (c) => ({ ...oracleCtx(c), gs: libgpuOf(c) }), st = (c, k) => c.read((c.r[29] >>> 0) + 0x10 + 4 * k, 4) | 0, a = (c, k) => c.r[4 + k] | 0;
    return [
      [0x8003b6fc, (c) => { spriteInit(c); c.ret(); }], [0x8003b7ec, (c) => { spriteClearAll(ctx(c)); c.ret(); }],
      [0x8003ba54, (c) => { spriteNew(ctx(c), a(c, 0), a(c, 1), a(c, 2), a(c, 3), st(c, 0) & 0xffff, st(c, 1) & 0xffff, st(c, 2) & 0xffff); c.ret(); }],
      [0x8001c838, (c) => { spriteAdd(ctx(c), a(c, 0), a(c, 1), a(c, 2), a(c, 3), st(c, 0), st(c, 1), st(c, 2), st(c, 3), st(c, 4) & 0xffff); c.ret(); }],
      [0x8003bdc0, (c) => { spriteLayer(c, a(c, 0), a(c, 1)); c.ret(); }], [0x8003be10, (c) => { spriteOr(c, a(c, 0), a(c, 1)); c.ret(); }],
    ];
  }, null],
  shake: [0x8003ede0, () => (c) => { shakeTick(oracleCtx(c)); c.ret(); }],
  wave: [0x8002cf5c, () => (c) => { waveTick(oracleCtx(c)); c.ret(); }],
  fader: [() => [
    [0x8002c5a0, (c) => { fadeStep(c); c.ret(); }], [0x8002c6e4, (c) => { fadeIn(c, c.r[4], c.r[5]); c.ret(); }],
    [0x8002c80c, (c) => { fadeLater(c, c.r[4], c.r[5], c.r[6]); c.ret(); }], [0x8002c838, (c) => { fadeTick(c); c.ret(); }],
    [0x8002c8e8, (c) => { fadeTo(c, c.r[4], c.r[5]); c.ret(); }], [0x8002ca08, (c) => { fadeOut(c, c.r[4], c.r[5]); c.ret(); }],
  ], null],
  frame: [0x800353b8, () => (c) => { drive(frameFlip({ ...oracleCtx(c), gs: libgpuOf(c) }), c); c.ret(); }],
  glyph: [0x800380ec, () => (c) => { drawGlyph(oracleCtx(c), c.r[4] | 0, c.r[5] | 0, c.r[6] >>> 0); c.ret(); }],
  text: [0x80039288, () => (c) => { textTask(oracleCtx(c)); c.ret(); }],
};

function hashWords(log, from) { let h = 0x811c9dc5; for (let i = from; i < log.length; i++) { h = Math.imul(h ^ log[i][1], 0x01000193); h = Math.imul(h ^ (log[i][0] === "gp1" ? 1 : 0), 0x01000193); } return h >>> 0; }

export function run(disc, frames, pads, ports = []) {
  const hashes = [], pics = [];
  let last = 0, g, ram = null;
  g = new GameBoot({ ...disc, buttons: padScript(pads), onFrame: (f) => {
    hashes.push(hashWords(g.o.log, last)); last = g.o.log.length;
    if (f % 10 === 0) { const d = g.display().rgba; let h = 0x811c9dc5; for (let i = 0; i < d.length; i += 4) h = Math.imul(h ^ (d[i] | d[i + 1] << 8 | d[i + 2] << 16), 0x01000193); pics.push(h >>> 0); }
    if (g.o.log.length > 1 << 22) { g.o.log.length = 0; last = 0; }
    if (f === frames) ram = g.cpu.ram.slice(); // at the vertical blank, where both runs are at the same point
  } });
  const calls = {};
  for (const name of ports) {
    const [addr, make] = PORTS[name]; calls[name] = 0;
    const list = make === null ? addr() : [[addr, make(g)]];
    for (const [a, fn] of list) g.cpu.hooks.set(a, (c) => { calls[name]++; return fn(c); });
  }
  g.runFrames(frames);
  return { hashes, pics, calls, g, ram };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [dir, framesArg = "1500", ...rest] = process.argv.slice(2);
  const i = rest.indexOf("--pads"), pads = i < 0 ? DEFAULT_PADS : JSON.parse(rest[i + 1]);
  const j = rest.indexOf("--ports"), ports = j < 0 ? Object.keys(PORTS) : rest[j + 1].split(",");
  const disc = loadDisc(dir), n = +framesArg;
  const a = run(disc, n, pads), b = run(disc, n, pads, ports);
  const fd = a.hashes.findIndex((h, k) => h !== b.hashes[k]), pd = a.pics.findIndex((h, k) => h !== b.pics[k]);
  const ramDiff = [];
  const stackFloor = 0x1ff000; // the stack (0x801ff000-0x801fffff) keeps the original frames' saved registers
  for (let k = 0; k < stackFloor && ramDiff.length < 8; k++) if (a.ram[k] !== b.ram[k]) ramDiff.push(((0x80000000 | k) >>> 0).toString(16));
  console.log(JSON.stringify({ frames: n, ports, calls: b.calls, firstGpuDiffFrame: fd < 0 ? null : fd + 1, firstPictureDiffFrame: pd < 0 ? null : (pd + 1) * 10, ramDiff: ramDiff }));
  process.exitCode = fd < 0 && pd < 0 && !ramDiff.length ? 0 : 1;
}
