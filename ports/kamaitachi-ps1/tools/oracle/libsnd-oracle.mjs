// Verification oracle: runs the game's own libsnd/libspu code (from the user's local EXE)
// on the Mips interpreter, with SPU registers wired to sound/spu.js. Exposes the same `ss`
// interface that sound/module.js calls, so the module can drive either this oracle or the
// JS libsnd port, and the two SPU register logs can be compared.
import { Mips, hex } from "./mips.js";
import { Spu } from "../../sound/spu.js";

// name -> [address, arg mapper]. Pointers to data are copied into the arena first.
const P = Symbol("ptr");
export const NATIVE = {
  SsInit: [0x80055f28], SsEnd: [0x80055d88],
  SsSetTableSize: [0x80058ec8, (a, b) => [0x801fc568, a, b]],
  SsSetTickMode: [0x800590e8], SsStart: [0x800589a8], SsSetSerialAttr: [0x800585b8],
  SsSetMono: [0x8005e088], SsSetStereo: [0x8005e098], call8005e0a8: [0x8005e0a8],
  SsSeqCalledTbyT: [0x80054738],
  SsVabOpenHeadSticky: [0x8005e188, (head, id, addr) => [P, head.bytes, id, addr]],
  SsVabTransBody: [0x8005e5b8, (body, vab) => [P, body, vab]],
  SsVabTransCompleted: [0x8005e678], SsVabClose: [0x8005e0d8],
  SsSeqOpen: [0x80055f58, (seq, vab) => [P, seq, vab]],
  SsSeqPlay: [0x80058418], SsSeqStop: [0x80058d58], SsSeqClose: [0x80055ba4],
  SsSeqSetVol: [0x800592c8], SsSeqSetDecrescendo: [0x80055d1c],
  SsSetMVol: [0x80058678], SsSetRVol: [0x800586c8],
  SsUtSetReverbDepth: [0x8005a5a8], SsUtSetReverbType: [0x8005a638], SsUtSetReverbFeedback: [0x8005a6e8],
  SsUtReverbOn: [0x8005a748], SsUtReverbOff: [0x8005a728],
  SsUtKeyOn: [0x80059cd8], SsUtKeyOnV: [0x8005a188], SsUtKeyOffV: [0x8005a4e8],
  SsUtChangePitch: [0x80059848], SsUtSetVVol: [0x8005a974],
  SpuGetKeyStatus: [0x80061368], SpuClearReverbWorkArea: [0x80060ff8], SpuMallocWithStartAddr: [0x8005fd48], SpuFree: [0x8005fff8],
};
const ARENA = 0x80100000, ARENA_END = 0x801c0000;
export const SAMPLES_PER_FRAME = 735; // 44100 / 60 (NTSC)

export class LibsndOracle {
  constructor(exe, { spu = new Spu(), onFrame } = {}) {
    this.cpu = new Mips();
    const info = this.cpu.loadExe(exe);
    this.cpu.r[29] = 0x801ffff0 | 0; this.cpu.r[28] = 0x8007913c | 0; // gp from the entry point 0x80062354
    this.spu = spu; this.log = []; this.out = []; this.frames = 0; this.onFrame = onFrame;
    this.arena = ARENA;
    this.dma = new Uint32Array(0x80 / 4); this.ioMem = new Map();
    this.cpu.io = { read: (a, w) => this.ioRead(a, w), write: (a, v, w) => this.ioWrite(a, v, w) };
    for (const v of [0xa0, 0xb0, 0xc0]) this.cpu.hooks.set(v, (c) => { this.bios(v, c.r[9]); c.ret(); });
    this.ss = new Proxy({}, { get: (_, k) => (...a) => this.callNamed(k, a) });
  }
  bios(table, fn) {
    // B(08) OpenEvent -> a handle; B(0B) TestEvent -> 1: DMA transfers finish at once here.
    this.cpu.r[2] = table === 0xb0 && fn === 0x08 ? 0xf1000004 | 0 : table === 0xb0 && (fn === 0x0b || fn === 0x0c) ? 1 : 0;
  }
  alloc(bytes) {
    const n = (bytes.length + 15) & ~15;
    if (this.arena + n > ARENA_END) this.arena = ARENA;
    const at = this.arena; this.cpu.setBytes(at, bytes); this.arena += n; return at;
  }
  callNamed(name, args) {
    if (name === "VSync") { this.frame(Math.max(1, args[0] | 0)); return this.frames; }
    if (name === "wait80013ff0") { this.frame(1); return 0; }
    const e = NATIVE[name];
    if (!e) throw new Error(`oracle: no native entry for ${String(name)}`);
    let a = e[1] ? e[1](...args) : args;
    const real = [];
    for (let i = 0; i < a.length; i++) { if (a[i] === P) { real.push(this.alloc(a[++i])); } else real.push(a[i] | 0); }
    return this.cpu.call(e[0], real);
  }
  frame(n = 1) { for (let i = 0; i < n; i++) { this.out.push(this.spu.render(SAMPLES_PER_FRAME)); this.frames++; this.onFrame?.(this); } }
  // ---- I/O
  ioRead(a, w) {
    if (a >= 0x1f801c00 && a < 0x1f802000) {
      const o = a - 0x1f801c00;
      if (w === 4) return this.spu.read16(o) | (this.spu.read16(o + 2) << 16);
      const v = this.spu.read16(o & ~1); return w === 1 ? (o & 1 ? v >> 8 : v & 0xff) : v;
    }
    if (a >= 0x1f801080 && a < 0x1f801100) return this.dma[(a - 0x1f801080) >> 2];
    return this.ioMem.get(a) ?? 0;
  }
  ioWrite(a, v, w) {
    if (a >= 0x1f801c00 && a < 0x1f802000) {
      const o = a - 0x1f801c00;
      if (w === 4) { this.spuW(o, v & 0xffff); this.spuW(o + 2, v >>> 16); } else this.spuW(o, v & 0xffff);
      return;
    }
    if (a >= 0x1f801080 && a < 0x1f801100) {
      const r = (a - 0x1f801080) >> 2; this.dma[r] = v;
      if (r === 4 * 4 + 2 && (v & 0x01000000)) this.dma4();
      return;
    }
    this.ioMem.set(a, v);
  }
  spuW(o, v) { this.log.push([this.frames, o, v]); this.spu.write16(o, v); }
  dma4() {
    const madr = this.dma[16] & 0x1ffffc, bcr = this.dma[17], chcr = this.dma[18];
    const words = (bcr & 0xffff || 0x10000) * ((bcr >>> 16) || 1);
    if (chcr & 1) { this.spu.dmaWrite(this.cpu.ram.subarray(madr, madr + words * 4)); this.log.push([this.frames, "dma", madr, words]); }
    else this.cpu.ram.set(this.spu.dmaRead(words * 4), madr);
    this.dma[18] = chcr & ~0x01000000;
    const dicr = this.dma[0x74 >> 2]; if (dicr & (1 << 20)) this.dma[0x74 >> 2] = dicr | (1 << 28);
  }
  pcm() { const n = this.out.reduce((s, b) => s + b.length, 0); const all = new Int16Array(n); let o = 0; for (const b of this.out) { all.set(b, o); o += b.length; } return all; }
}
export { hex };
