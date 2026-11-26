// Ground-truth runner: boots the user's own EXE from its entry point on the R3000A interpreter
// with the GPU model (src/gpu/gpu.js) and the SPU model, and plays the game headlessly.
// Only the console services the game reaches through libraries are replaced (HLE):
//   - libcd: CdInit/CdSync/CdControl/CdSearchFile/CdRead/CdReadSync serve sectors from the PAC files
//   - libetc VSync: one call = one frame; the VSync callback runs, then the pad buffer is filled
//   - libpad: the buffer that PadInitDirect registered (0x801d6660) gets a digital pad report
//   - memory card sync 0x80063748: reports "no card" (or the code given in `card`)
//   - STR movie player 0x800343b0: skipped (no MDEC model), returns as after a finished movie
// Everything else (scenario, text, pictures, fades, menus, sound driver) is the game's own code.
// Usage: node tools/oracle/game-boot.mjs <dir with SLPS_017.94 and *.PAC> [--steps N] [--every F]
//          [--out DIR] [--pads JSON]   (pads: [[frame, "circle"|"cross"|"up"|...], ...], held 4 frames)
// Frames written to --out are the game's pictures: keep them local, never commit them.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { GpuOracle } from "./gpu-oracle.mjs";
import { Spu } from "../../sound/spu.js";
import { encodePng } from "./png.mjs";

// ISO 9660 extents of the files on the disc (SLPS-01794); CdSearchFile reports these.
export const DISC_LBA = { SCE: 250, VCE: 581, BGD: 5600, SDW: 21279, BIN: 29098, MUS: 29963, ANM: 37429, VCP: 37873 };
export const BUTTON = { select: 1, start: 8, up: 16, right: 32, down: 64, left: 128, l2: 256, r2: 512, l1: 1024, r1: 2048, triangle: 4096, circle: 8192, cross: 16384, square: 32768 };
const ADDR = {
  entry: 0x800622d8, vsync: 0x800530f8, vsyncCount: 0x800785c0, vsyncCallback: 0x800785b0,
  padBuffer: 0x801d6660, cardSync: 0x80063748, cardCommand: 0x8008ca80, cardPending: 0x8008ca40, movie: 0x800343b0,
  cdInit: 0x8004e928, cdSync: 0x8004eb7c, cdFlush: 0x8004efa0, cdControl: 0x8004ebe4, cdControlB: 0x8004ee54,
  cdSearchFile: 0x80050988, cdRead: 0x80051928, cdReadSync: 0x80051a28, cdReadCallback: 0x8004e6d8, cdDataCallback: 0x8004e6a8,
};
const bcd = (n) => ((n / 10) | 0) << 4 | n % 10;
const fromBcd = (b) => (b >> 4) * 10 + (b & 15);

export class GameBoot {
  constructor({ exe, pacs, card = 1, buttons = () => 0, onFrame = null }) {
    this.o = new GpuOracle(exe); this.cpu = this.o.cpu; this.spu = new Spu();
    this.frames = 0; this.loc = 0; this.events = []; this.buttons = buttons; this.onFrame = onFrame; this.card = card;
    this.files = Object.entries(DISC_LBA).map(([name, lba]) => ({ name, lba, data: pacs[name] ?? new Uint8Array(0) }));
    const c = this.cpu, o = this.o, spu = this.spu, r0 = o.ioRead.bind(o), w0 = o.ioWrite.bind(o);
    o.ioRead = (a, w) => { if (a >= 0x1f801c00 && a < 0x1f802000) { const k = a - 0x1f801c00; return w === 4 ? spu.read16(k) | spu.read16(k + 2) << 16 : spu.read16(k & ~1); } return r0(a, w); };
    o.ioWrite = (a, v, w) => { if (a >= 0x1f801c00 && a < 0x1f802000) { const k = a - 0x1f801c00; spu.write16(k, v & 0xffff); if (w === 4) spu.write16(k + 2, v >>> 16); return; } return w0(a, v, w); };
    c.io = { read: (a, w) => o.ioRead(a, w), write: (a, v, w) => o.ioWrite(a, v, w) };
    const H = (a, f) => c.hooks.set(a, (cc) => { f(cc); cc.ret(); });
    H(ADDR.cdInit, (cc) => { cc.r[2] = 1; });
    H(ADDR.cdSync, (cc) => { cc.r[2] = 2; }); // CdlComplete
    H(ADDR.cdFlush, (cc) => { cc.r[2] = 1; });
    H(ADDR.cdReadCallback, (cc) => { cc.r[2] = 1; });
    H(ADDR.cdDataCallback, (cc) => { cc.r[2] = 0; });
    const control = (cc) => {
      const com = cc.r[4] & 0xff, p = cc.r[5] >>> 0;
      if (com === 2 && p) this.loc = (fromBcd(c.read(p, 1)) * 60 + fromBcd(c.read(p + 1, 1))) * 75 + fromBcd(c.read(p + 2, 1)) - 150; // CdlSetloc
      cc.r[2] = 1;
    };
    H(ADDR.cdControl, control); H(ADDR.cdControlB, control);
    H(ADDR.cdSearchFile, (cc) => {
      const fp = cc.r[4] >>> 0, name = this.str(cc.r[5] >>> 0), f = this.files.find((x) => name.startsWith("\\" + x.name + "."));
      this.events.push({ frame: this.frames, search: name, found: !!f });
      if (!f) { cc.r[2] = 0; return; }
      const l = f.lba + 150;
      c.write(fp, bcd((l / 4500) | 0), 1); c.write(fp + 1, bcd(((l / 75) | 0) % 60), 1); c.write(fp + 2, bcd(l % 75), 1); c.write(fp + 3, 0, 1);
      c.write(fp + 4, f.data.length, 4); cc.r[2] = fp;
    });
    H(ADDR.cdRead, (cc) => {
      const n = cc.r[4], buf = cc.r[5] >>> 0, f = this.files.find((x) => this.loc >= x.lba && this.loc < x.lba + x.data.length / 2048);
      if (f) { const off = (this.loc - f.lba) * 2048; c.setBytes(buf, f.data.subarray(off, off + n * 2048)); }
      this.events.push({ frame: this.frames, read: f?.name ?? null, sector: f ? this.loc - f.lba : this.loc, count: n });
      this.loc += n; cc.r[2] = 1;
    });
    H(ADDR.cdReadSync, (cc) => { cc.r[2] = 0; });
    H(ADDR.cardSync, (cc) => {
      const a1 = cc.r[5] >>> 0, a2 = cc.r[6] >>> 0;
      if (a1) c.write(a1, c.read(ADDR.cardCommand, 4), 4);
      if (a2) c.write(a2, this.card, 4);
      c.write(ADDR.cardPending, 0, 4); cc.r[2] = 1;
    });
    H(ADDR.movie, (cc) => { this.events.push({ frame: this.frames, movie: this.str(c.read(cc.r[4] >>> 0, 4) >>> 0) }); cc.r[2] = 0; });
    H(ADDR.vsync, (cc) => {
      const mode = cc.r[4] | 0;
      if (mode < 0) { cc.r[2] = c.read(ADDR.vsyncCount, 4); return; }
      if (mode === 1) { cc.r[2] = 0; return; }
      for (let i = 0, n = mode || 1; i < n; i++) this.vblank();
      cc.r[2] = 0;
    });
    c.pc = ADDR.entry; c.next = c.pc + 4; c.r[29] = 0x801ffff0 | 0;
  }
  str(a) { let s = ""; for (let ch; (ch = this.cpu.read(a++, 1)); ) s += String.fromCharCode(ch); return s; }
  vblank() {
    const c = this.cpu;
    c.write(ADDR.vsyncCount, (c.read(ADDR.vsyncCount, 4) + 1) >>> 0, 4); this.frames++;
    const cb = c.read(ADDR.vsyncCallback, 4) >>> 0; if (cb) c.call(cb, []);
    const v = ~this.buttons(this.frames) & 0xffff, p = ADDR.padBuffer; // libpad report: status 0, digital pad 0x41, buttons active low
    c.write(p, 0, 1); c.write(p + 1, 0x41, 1); c.write(p + 2, v & 0xff, 1); c.write(p + 3, v >> 8, 1);
    this.onFrame?.(this.frames, this);
  }
  run(steps) { const c = this.cpu; for (let i = 0; i < steps; i++) { c.steps++; c.step(); } }
  runFrames(n) { const end = this.frames + n; while (this.frames < end) { this.cpu.steps++; this.cpu.step(); } }
  display() { return this.o.gpu.display(); }
}

export function loadDisc(dir) {
  const exe = readFileSync(join(dir, "SLPS_017.94")), pacs = {};
  for (const k of Object.keys(DISC_LBA)) { const f = join(dir, k + ".PAC"); if (existsSync(f)) pacs[k] = new Uint8Array(readFileSync(f)); }
  return { exe, pacs };
}
export function padScript(list) { // [[frame, name], ...] -> buttons(frame), each press held 4 frames
  return (f) => { let m = 0; for (const [fr, b] of list) if (f >= fr && f < fr + 4) m |= BUTTON[b]; return m; };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [dir, ...rest] = process.argv.slice(2);
  const opt = (k, d) => { const i = rest.indexOf("--" + k); return i < 0 ? d : rest[i + 1]; };
  const out = opt("out", null), every = +opt("every", 30), steps = +opt("steps", 2e8);
  if (out) mkdirSync(out, { recursive: true });
  const g = new GameBoot({
    ...loadDisc(dir), card: +opt("card", 1), buttons: padScript(JSON.parse(opt("pads", "[]"))),
    onFrame: out ? (f) => { if (f % every) return; const d = g.display(); writeFileSync(join(out, `f${String(f).padStart(6, "0")}.png`), encodePng(d.width, d.height, d.rgba)); } : null,
  });
  const t0 = Date.now(); let error = null;
  try { g.run(steps); } catch (e) { error = e.message; }
  console.log(JSON.stringify({ frames: g.frames, steps: g.cpu.steps, ms: Date.now() - t0, pc: (g.cpu.pc >>> 0).toString(16), gpuWords: g.o.log.length, error, movies: g.events.filter((e) => e.movie).map((e) => e.movie) }));
}
