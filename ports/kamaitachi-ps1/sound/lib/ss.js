// The libsnd interface sound/module.js calls, served by the JS port alone: no EXE, no CPU.
// Same names and arguments as the oracle's `ss` (tools/oracle/libsnd-oracle.mjs), so a
// module run on either can be compared SPU write for SPU write. Data the module passes
// by reference (VAB heads and bodies, SEQ data) is copied into RAM at the arena, like the
// game's own buffers; the library's initialised data comes from ./data.js.
import { PsxMem } from "./mem.js";
import { SoundLib } from "./index.js";
import { JsPlatform } from "./platform.js";
import { INIT_DATA } from "./data.js";
import { Spu } from "../spu.js";

const ARENA = 0x80100000, ARENA_END = 0x801c0000, SEQ_STATE = 0x801fc568;
export const SAMPLES_PER_FRAME = 735; // 44100 / 60 (NTSC)

export class JsSs {
  constructor({ spu = new Spu(), image = INIT_DATA, onFrame } = {}) {
    this.mem = new PsxMem(spu);
    this.spu = spu; this.log = []; this.out = []; this.frames = 0; this.onFrame = onFrame;
    this.mem.onSpuWrite = (o, v) => this.log.push([this.frames, o, v]);
    const dma4 = this.mem.dma4.bind(this.mem);
    this.mem.dma4 = () => { const d = this.mem.dma; if (d[18] & 1) this.log.push([this.frames, "dma", d[16] & 0x1ffffc, (d[17] & 0xffff || 0x10000) * ((d[17] >>> 16) || 1)]); dma4(); };
    if (typeof image === "function") image(this.mem); else for (const [a, words] of image) for (let i = 0; i < words.length; i++) this.mem.write(a + i * 4, words[i], 4);
    this.platform = new JsPlatform(this.mem);
    this.lib = new SoundLib(this.mem, this.platform);
    this.arena = ARENA;
    const lib = this.lib, P = (b) => this.alloc(b);
    const special = {
      SsSetTableSize: (a, b) => lib.SsSetTableSize(SEQ_STATE, a, b),
      SsVabOpenHeadSticky: (head, id, addr) => lib.SsVabOpenHeadSticky(P(head.bytes), id, addr),
      SsVabTransBody: (body, vab) => lib.SsVabTransBody(P(body), vab),
      SsSeqOpen: (seq, vab) => lib.SsSeqOpen(P(seq), vab),
      VSync: (n) => { this.frame(Math.max(1, n | 0)); return this.frames; },
      wait80013ff0: () => { this.frame(1); return 0; },
    };
    this.ss = new Proxy({}, { get: (_, k) => special[k] ?? ((...a) => lib[k](...a.map((x) => x | 0)) | 0) });
  }
  alloc(bytes) {
    const n = (bytes.length + 15) & ~15;
    if (this.arena + n > ARENA_END) this.arena = ARENA;
    const at = this.arena; this.mem.setBytes(at, bytes); this.arena += n; return at;
  }
  frame(n = 1) { for (let i = 0; i < n; i++) { this.out.push(this.spu.render(SAMPLES_PER_FRAME)); this.frames++; this.onFrame?.(this); } }
  pcm() { const n = this.out.reduce((s, b) => s + b.length, 0); const all = new Int16Array(n); let o = 0; for (const b of this.out) { all.set(b, o); o += b.length; } return all; }
}
