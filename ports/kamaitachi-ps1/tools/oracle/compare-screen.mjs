// Runs the whole game twice on the oracle (tools/oracle/game-boot.mjs): once with the original
// screen routines, once with the JS ports hooked in at the same addresses. Compares every
// GP0/GP1 word and the visible picture each frame, and reports the first difference.
// Usage: node tools/oracle/compare-screen.mjs <dir with SLPS_017.94 and *.PAC> [frames] [--pads JSON]
import { pathToFileURL } from "node:url";
import { GameBoot, loadDisc, padScript } from "./game-boot.mjs";
import { drawGlyph } from "../../src/text/glyph.js";
import { textTask } from "../../src/text/text.js";

// The context a port runs with on the oracle: RAM is the interpreter's, and routines that are
// not ported run natively with sp set to the caller's frame (stack arguments at sp+0x10).
export function oracleCtx(c) {
  const call = (addr, args = [], sp = c.r[29] >>> 0) => { const old = c.r[29]; c.r[29] = (sp + 0x40) | 0; const v = c.call(addr, args); c.r[29] = old; return v; }; // Mips.call drops sp by 0x40
  return { m: c, sp: c.r[29] >>> 0, call };
}

export const DEFAULT_PADS = [[300, "circle"], [600, "circle"], [720, "down"], [780, "circle"], ...Array.from({ length: 400 }, (_, i) => [900 + 45 * i, "circle"])];

// Each port: [address, install(game)] — the hook runs the JS routine on the oracle's RAM,
// calling the game's own code only for what has not been ported yet.
export const PORTS = {
  glyph: [0x800380ec, () => (c) => { drawGlyph(oracleCtx(c), c.r[4] | 0, c.r[5] | 0, c.r[6] >>> 0); c.ret(); }],
  text: [0x80039288, () => (c) => { textTask(oracleCtx(c)); c.ret(); }],
};

function hashWords(log, from) { let h = 0x811c9dc5; for (let i = from; i < log.length; i++) { h = Math.imul(h ^ log[i][1], 0x01000193); h = Math.imul(h ^ (log[i][0] === "gp1" ? 1 : 0), 0x01000193); } return h >>> 0; }

export function run(disc, frames, pads, ports = []) {
  const hashes = [], pics = [];
  let last = 0, g;
  g = new GameBoot({ ...disc, buttons: padScript(pads), onFrame: (f) => {
    hashes.push(hashWords(g.o.log, last)); last = g.o.log.length;
    if (f % 10 === 0) { const d = g.display().rgba; let h = 0x811c9dc5; for (let i = 0; i < d.length; i += 4) h = Math.imul(h ^ (d[i] | d[i + 1] << 8 | d[i + 2] << 16), 0x01000193); pics.push(h >>> 0); }
    if (g.o.log.length > 1 << 22) { g.o.log.length = 0; last = 0; }
  } });
  const calls = {};
  for (const name of ports) { const [addr, make] = PORTS[name]; const fn = make(g); calls[name] = 0; g.cpu.hooks.set(addr, (c) => { calls[name]++; fn(c); }); }
  g.runFrames(frames);
  return { hashes, pics, calls, g };
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
  for (let k = 0; k < stackFloor && ramDiff.length < 8; k++) if (a.g.cpu.ram[k] !== b.g.cpu.ram[k]) ramDiff.push(((0x80000000 | k) >>> 0).toString(16));
  console.log(JSON.stringify({ frames: n, ports, calls: b.calls, firstGpuDiffFrame: fd < 0 ? null : fd + 1, firstPictureDiffFrame: pd < 0 ? null : (pd + 1) * 10, ramDiff: ramDiff }));
  process.exitCode = fd < 0 && pd < 0 && !ramDiff.length ? 0 : 1;
}
