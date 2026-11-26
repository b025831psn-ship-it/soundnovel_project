// The game's graphics library (libgpu / libgs, linked into SLPS_017.94), ported routine by
// routine. Every routine keeps its state in PS1 RAM at the original addresses and talks to
// the hardware the way the original does: through the GPU/DMA/interrupt registers, whose
// addresses it reads from the driver table in RAM (0x80072c24...). `m` is the machine:
// m.read(a, w) / m.write(a, v, w) over RAM and I/O (src/machine.js, or the interpreter in
// the verification oracle), m.vsync(-1) for the frame counter.
//
// Only the paths this game takes are ported; any other path throws with its address, so a
// new path shows up as an error instead of silently different output.
//
//   libgpu                               libgs
//   0x80048858 GetTPage                  0x8004c5e8 GsSortBoxFill
//   0x80048894 GetClut                   0x8004c6c8   (link a packet into the OT)
//   0x80048984 AddPrim                   0x8004cc68 GsSortFastSprite
//   0x80048f38 ResetGraph (mode 1)       0x8004d200 GsSortClear
//   0x8004921c SetDispMask               0x8004d338 GsGetActiveBuff
//   0x800492b4 DrawSync (mode 0)         0x8004d348   (geometry offset of the active buffer)
//   0x80049438 ClearImage                0x8004d458   (PutDrawEnv of the active buffer)
//   0x80049560 LoadImage                 0x8004d518 GsSwapDispBuff
//   0x800497a0 ClearOTagR                0x8004dc78 GsDrawOt
//   0x800498a8 DrawOTag                  0x8004dca8 GsClearOt
//   0x80049918 PutDrawEnv                0x8004dd58 GsGetTimInfo
//   0x80049ae4 PutDispEnv                0x8004df18 GsSetWorkBase
//   0x80046c28 LoadTPage, 0x80046d10 LoadClut, 0x80053494 SetIntrMask, 0x80053e7c GetVideoMode
//   driver (table at 0x80072b08): 0x8004a310 draw-env packet, 0x8004a784 OT clear (DMA6),
//   0x8004a864 VRAM fill, 0x8004aa94 VRAM upload, 0x8004afc8 OT send (DMA2), 0x8004af50 GP1,
//   0x8004b010 GPU info, 0x8004b064 command queue, 0x8004b574 reset, 0x8004b6c4 sync
const unported = (addr) => { throw new Error(`libgpu: path at 0x${addr.toString(16)} is not ported`); };
const s16 = (v) => (v << 16) >> 16;

// libgpu globals (0x80072b50 block, the GsDRAWENV/GsDISPENV copies, the queue) and libgs's
const G = {
  env: 0x80072b50, mode: 0x80072b50, queued: 0x80072b51, debug: 0x80072b52, busy: 0x80072b58, flag: 0x80072b5c,
  vramW: 0x80072b54, vramH: 0x80072b56, drawEnv: 0x80072b60, dispEnv: 0x80072bbc, interlace: 0x80072b53,
  gp0: 0x80072c24, gp1: 0x80072c28, d2madr: 0x80072c2c, d2bcr: 0x80072c30, d2chcr: 0x80072c34,
  d6madr: 0x80072c38, d6bcr: 0x80072c3c, d6chcr: 0x80072c40, dpcr: 0x80072c44,
  qHead: 0x80072c48, qTail: 0x80072c4c, qMask: 0x80072c50, rMask: 0x80072c58, timeout: 0x80072c5c, timeoutN: 0x80072c60,
  gp1Shadow: 0x8008a2f8, fillPacket: 0x8008a2b0, fillEnv: 0x8008a2d8, otTerm: 0x80072bfc, otTermLink: 0x80072c10,
  imask: 0x80078588, videoMode: 0x80078600,
  // libgs
  psdIdx: 0x801fec88, psdCount: 0x801fec84, workBase: 0x800a6da8, clipX: 0x801f7088, offX: 0x801d665a, offY: 0x801d665c,
  dispX: 0x8009cbf8, dispY: 0x8009ccdc, drawEnvA: 0x801d64b0, dispEnvA: 0x801d6510, clearPackets: 0x8008a400,
  geomOfs: 0x800a0b30, offsetMode: 0x801fecb4, clearW: 0x801eef10, clearH: 0x801eef08, sortClearMask: 0x801d6521,
};

export class LibGpu {
  constructor(m) { this.m = m; }
  r8(a) { return this.m.read(a, 1); } r16(a) { return this.m.read(a, 2); } r32(a) { return this.m.read(a, 4) >>> 0; }
  w8(a, v) { this.m.write(a, v & 0xff, 1); } w16(a, v) { this.m.write(a, v & 0xffff, 2); } w32(a, v) { this.m.write(a, v >>> 0, 4); }
  reg(p) { return this.r32(p); } // hardware register address stored in the driver table

  setIntrMask(v) { const p = this.r32(G.imask), old = this.r16(p); this.w16(p, v); return old; } // 0x80053494
  videoMode() { return this.r32(G.videoMode); } // 0x80053e7c
  startTimeout() { this.w32(G.timeout, this.m.vsync(-1) + 240); this.w32(G.timeoutN, 0); } // 0x8004b800
  gp1(v) { this.w32(this.reg(G.gp1), v); this.w8(G.gp1Shadow + (v >>> 24), v); } // 0x8004af50
  info(n) { this.w32(this.reg(G.gp1), n | 0x10000000); return this.r32(this.reg(G.gp0)) & 0xffffff; } // 0x8004b010

  // 0x8004b064: run `fn(arg, param)` now when the GPU is idle and nothing is queued (the only
  // case this game reaches); the queued path is not ported.
  enqueue(fn, arg, size, param) {
    this.startTimeout();
    if (((this.r32(G.qHead) + 1) & 0x3f) === this.r32(G.qTail)) unported(0x8004b098);
    this.w32(G.qMask, this.setIntrMask(0));
    const queued = this.r8(G.queued);
    this.w32(G.busy, 1);
    if (queued && (this.r32(G.qHead) !== this.r32(G.qTail) || (this.r32(this.reg(G.d2chcr)) & 0x01000000) || this.r32(G.flag))) unported(0x8004b188);
    while (!(this.r32(this.reg(G.gp1)) & 0x04000000));
    fn.call(this, arg, param);
    this.setIntrMask(this.r32(G.qMask));
    return 0;
  }

  // 0x8004afc8: send a linked list (OT or packet) to the GPU by DMA2.
  sendList(p) {
    this.w32(this.reg(G.gp1), 0x04000002);
    this.w32(this.reg(G.d2madr), p); this.w32(this.reg(G.d2bcr), 0); this.w32(this.reg(G.d2chcr), 0x01000401);
  }

  // 0x8004a864: fill a VRAM rectangle (rect clipped to the VRAM size) with a packet at 0x8008a2b0.
  fillRect(rect, colour) {
    const clip = (o, lim) => { const v = s16(this.r16(rect + o)); this.w16(rect + o, v < 0 ? 0 : v > s16(this.r16(lim)) - 1 ? this.r16(lim) - 1 : v); };
    clip(4, G.vramW); clip(6, G.vramH);
    if (!(this.r16(rect) & 0x3f) && !(this.r16(rect + 4) & 0x3f)) unported(0x8004a9fc); // 64-aligned fill
    const P = G.fillPacket, E = G.fillEnv;
    this.w32(P, (E & 0xffffff) | 0x08000000);
    this.w32(P + 4, 0xe3000000); this.w32(P + 8, 0xe4ffffff); this.w32(P + 0xc, 0xe5000000); this.w32(P + 0x10, 0xe6000000);
    const st = this.r32(this.reg(G.gp1));
    this.w32(P + 0x18, (colour & 0xffffff) | 0x60000000);
    this.w32(P + 0x14, (st & 0x7ff) | ((colour >>> 31) << 10) | 0xe1000000);
    this.w32(P + 0x1c, this.r32(rect)); this.w32(P + 0x20, this.r32(rect + 4));
    this.w32(E, 0x03ffffff);
    this.w32(E + 4, this.info(3) | 0xe3000000);
    this.w32(E + 8, this.info(4) | 0xe4000000);
    this.w32(E + 0xc, this.info(5) | 0xe5000000);
    this.sendList(P);
    return 0;
  }

  // 0x8004aa94: upload `src` into a VRAM rectangle: header and the odd words through the GP0
  // port, the rest by DMA2 in blocks of 16 words.
  upload(rect, src) {
    this.startTimeout();
    const clip = (o, lim) => { const v = s16(this.r16(rect + o)); this.w16(rect + o, v < 0 ? 0 : s16(this.r16(lim)) < v ? this.r16(lim) : v); };
    clip(4, G.vramW); clip(6, G.vramH);
    const words = (s16(this.r16(rect + 4)) * s16(this.r16(rect + 6)) + 1) >> 1;
    if (words <= 0) unported(0x8004ab68);
    const blocks = words >> 4; let n = words - blocks * 16;
    if (!(this.r32(this.reg(G.gp1)) & 0x04000000)) unported(0x8004ab9c);
    this.w32(this.reg(G.gp1), 0x04000000); this.w32(this.reg(G.gp0), 0x01000000);
    this.w32(this.reg(G.gp0), 0xa0000000); this.w32(this.reg(G.gp0), this.r32(rect)); this.w32(this.reg(G.gp0), this.r32(rect + 4));
    for (; n > 0; n--, src += 4) this.w32(this.reg(G.gp0), this.r32(src));
    if (blocks) {
      this.w32(this.reg(G.gp1), 0x04000002);
      this.w32(this.reg(G.d2madr), src); this.w32(this.reg(G.d2bcr), (blocks << 16) | 0x10); this.w32(this.reg(G.d2chcr), 0x01000201);
    }
    return 0;
  }

  // 0x8004a784: clear an ordering table by DMA6 (reverse links, the first entry ends the list).
  clearOt(ot, n) {
    const dpcr = this.reg(G.dpcr); this.w32(dpcr, this.r32(dpcr) | 0x08000000);
    this.w32(this.reg(G.d6chcr), 0);
    this.w32(this.reg(G.d6madr), ot + 4 * n - 4); this.w32(this.reg(G.d6bcr), n); this.w32(this.reg(G.d6chcr), 0x11000002);
    this.startTimeout();
    if (this.r32(this.reg(G.d6chcr)) & 0x01000000) unported(0x8004a81c);
    return n;
  }

  // 0x8004a310: the drawing-environment packet (E3 E4 E5 E1 E2 E6, no background fill here).
  drawEnvPacket(p, env) {
    const clipXY = (x, y, code, a1) => {
      const cx = (v, lim) => v < 0 ? 0 : s16(this.r16(lim)) - 1 < v ? this.r16(lim) - 1 : v;
      return ((cx(y, G.vramH) & 0x3ff) << 10 | (cx(x, G.vramW) & 0x3ff) | code) >>> 0;
    };
    this.w32(p + 4, clipXY(s16(this.r16(env)), s16(this.r16(env + 2)), 0xe3000000));
    this.w32(p + 8, clipXY(s16(this.r16(env + 4) + this.r16(env) - 1), s16(this.r16(env + 2) + this.r16(env + 6) - 1), 0xe4000000));
    this.w32(p + 0xc, ((this.r16(env + 0xa) & 0x7ff) << 11 | (this.r16(env + 8) & 0x7ff) | 0xe5000000) >>> 0);
    const dtd = this.r8(env + 0x17), dfe = this.r8(env + 0x16), tpage = this.r16(env + 0x14);
    this.w32(p + 0x10, ((dfe ? 0xe1000200 : 0xe1000000) | (tpage & 0x9ff) | (dtd ? 0x400 : 0)) >>> 0);
    const tw = env + 0xc; // texture window (RECT)
    const u = this.r8(tw) >> 3, v = this.r8(tw + 2) >> 3, w = (-s16(this.r16(tw + 4)) & 0xff) >> 3, h = (-s16(this.r16(tw + 6)) & 0xff) >> 3;
    this.w32(p + 0x14, (0xe2000000 | v << 15 | u << 10 | h << 5 | w) >>> 0);
    this.w32(p + 0x18, 0xe6000000);
    if (this.r8(env + 0x18)) unported(0x8004a3c4); // isbg
    this.w8(p + 3, 6);
  }

  // 0x8004b574 with mode 1 (ResetGraph(1): cancel drawing, keep the environment)
  reset(mode) {
    this.w32(G.rMask, this.setIntrMask(0)); this.w32(G.qTail, 0); this.w32(G.qHead, this.r32(G.qTail));
    if ((mode & 7) !== 1) unported(0x8004b5b0);
    this.w32(this.reg(G.d2chcr), 0x401);
    const dpcr = this.reg(G.dpcr); this.w32(dpcr, this.r32(dpcr) | 0x800);
    this.w32(this.reg(G.gp1), 0x02000000); this.w32(this.reg(G.gp1), 0x01000000);
    this.setIntrMask(this.r32(G.rMask));
    return 0;
  }

  // --- libgpu API ---
  ResetGraph(mode) { // 0x80048f38
    const v = mode & 7;
    if (v === 0 || v === 3 || v === 5) unported(0x80048f84);
    if (this.r8(G.debug) >= 2) unported(0x80049060);
    return this.reset(1);
  }
  SetDispMask(on) { // 0x8004921c
    if (this.r8(G.debug) >= 2) unported(0x80049248);
    if (!on) for (let i = 0; i < 0x14; i++) this.w8(G.debug + 0x6a + i, 0xff);
    this.gp1(on ? 0x03000000 : 0x03000001);
  }
  DrawSync(mode) { // 0x800492b4 -> 0x8004b6c4
    if (this.r8(G.debug) >= 2) unported(0x800492d4);
    if (mode) unported(0x8004b778);
    this.startTimeout();
    if (this.r32(G.qHead) !== this.r32(G.qTail)) unported(0x8004b718);
    if (this.r32(this.reg(G.d2chcr)) & 0x01000000) unported(0x8004b720);
    if (!(this.r32(this.reg(G.gp1)) & 0x04000000)) unported(0x8004b720);
    return 0;
  }
  checkRect(rect) { const d = this.r8(G.debug); if (d === 1 || d === 2) unported(0x80049358); } // 0x8004931c
  ClearImage(rect, r, g, b) { // 0x80049438
    this.checkRect(rect);
    return this.enqueue(this.fillRect, rect, 8, ((b & 0xff) << 16 | (g & 0xff) << 8 | (r & 0xff)) >>> 0);
  }
  LoadImage(rect, src) { this.checkRect(rect); return this.enqueue(this.upload, rect, 8, src); } // 0x80049560
  ClearOTagR(ot, n) { // 0x800497a0
    if (this.r8(G.debug) >= 2) unported(0x800497c8);
    this.clearOt(ot, n);
    this.w32(G.otTermLink, (G.otTerm & 0xffffff) | 0x04000000);
    this.w32(ot, G.otTermLink & 0xffffff);
    return ot;
  }
  DrawOTag(p) { // 0x800498a8
    if (this.r8(G.debug) >= 2) unported(0x800498c8);
    this.enqueue(this.sendList, p, 0, 0);
  }
  PutDrawEnv(env) { // 0x80049918
    if (this.r8(G.debug) >= 2) unported(0x80049948);
    const p = env + 0x1c;
    this.drawEnvPacket(p, env);
    this.w32(p, this.r32(p) | 0xffffff);
    this.enqueue(this.sendList, p, 0x40, 0);
    for (let i = 0; i < 0x5c; i++) this.w8(G.drawEnv + i, this.r8(env + i));
    return env;
  }
  PutDispEnv(env) { // 0x80049ae4
    if (this.r8(G.debug) >= 2) unported(0x80049b1c);
    let mode = 0x08000000;
    this.gp1(0x05000000 | (this.r16(env + 2) & 0x3ff) << 10 | (this.r16(env) & 0x3ff));
    const prev = G.dispEnv, same = (o) => s16(this.r16(prev + o)) === s16(this.r16(env + o));
    if (!(same(8) && same(0xa) && same(0xc) && same(0xe))) {
      const pal = this.videoMode(); this.w8(env + 0x12, pal);
      let x1 = s16(this.r16(env + 8)) * 10 + 0x260, y1 = s16(this.r16(env + 0xa)) + ((pal & 0xff) ? 0x13 : 0x10);
      const sw = s16(this.r16(env + 0xc)), sh = s16(this.r16(env + 0xe));
      let x2 = sw ? x1 + sw * 10 : x1 + 0xa00, y2 = sh ? y1 + sh : y1 + 0xf0;
      x1 = x1 < 0x1f4 ? 0x1f4 : x1 < 0xcdb ? x1 : 0xcda;
      x2 = x2 < x1 + 0x50 ? x1 + 0x50 : x2 < 0xcdb ? x2 : 0xcda;
      const pv = this.r8(env + 0x12);
      if (y1 < 0x10) y1 = 0x10; else if (pv ? y1 >= 0x137 : y1 >= 0x101) y1 = pv ? 0x136 : 0x100;
      if (y2 < y1 + 2) y2 = y1 + 2; else if (pv ? y2 >= 0x139 : y2 >= 0x103) y2 = pv ? 0x138 : 0x102;
      this.gp1(0x06000000 | (x2 & 0xfff) << 12 | (x1 & 0xfff));
      this.gp1(0x07000000 | (y2 & 0x3ff) << 10 | (y1 & 0x3ff));
    }
    const sameDisp = this.r32(prev + 0x10) === this.r32(env + 0x10) && [0, 2, 4, 6].every((o) => s16(this.r16(prev + o)) === s16(this.r16(env + o)));
    if (!sameDisp) {
      const pal = this.videoMode(); this.w8(env + 0x12, pal);
      if ((pal & 0xff) === 1) mode |= 8;
      if (this.r8(env + 0x11)) mode |= 0x10;
      if (this.r8(env + 0x10)) mode |= 0x20;
      if (this.r8(G.interlace)) mode |= 0x80;
      const w = s16(this.r16(env + 4));
      if (w >= 0x119) mode |= w < 0x161 ? 1 : w < 0x191 ? 0x40 : w < 0x231 ? 2 : 3;
      const h = s16(this.r16(env + 6));
      if (!(this.r8(env + 0x12) ? h < 0x121 : h < 0x101)) mode |= 0x24;
      this.gp1(mode);
    }
    for (let i = 0; i < 0x14; i++) this.w8(G.dispEnv + i, this.r8(env + i));
    return env;
  }
  GetTPage(tp, abr, x, y) { return ((tp & 3) << 7 | (abr & 3) << 5 | (y & 0x100) >> 4 | (x & 0x3ff) >> 6 | (y & 0x200) << 2) & 0xffff; } // 0x80048858
  GetClut(x, y) { return (y << 6 | (x >> 4) & 0x3f) & 0xffff; } // 0x80048894
  AddPrim(ot, p) { // 0x80048984
    this.w32(p, (this.r32(p) & 0xff000000 | this.r32(ot) & 0xffffff) >>> 0);
    this.w32(ot, (this.r32(ot) & 0xff000000 | p & 0xffffff) >>> 0);
  }

  // --- libgs ---
  GsGetActiveBuff() { return s16(this.r16(G.psdIdx)); } // 0x8004d338
  GsSetWorkBase(p) { this.w32(G.workBase, p); } // 0x8004df18
  GsClearOt(offset, point, ot) { // 0x8004dca8
    offset &= 0xffff; point &= 0xffff;
    this.w32(ot + 8, offset);
    const len = this.r32(ot); this.w32(ot + 0xc, point);
    this.w32(ot + 0x10, (this.r32(ot + 4) + (4 << len) - 4) >>> 0);
    this.ClearOTagR(this.r32(ot + 4), 1 << len);
  }
  GsDrawOt(ot) { this.DrawOTag(this.r32(ot + 0x10)); } // 0x8004dc78
  setGeomOffset() { // 0x8004d348: GTE offset of the active buffer (the GTE is not used for drawing)
    if (s16(this.r16(G.offsetMode))) unported(0x8004d364);
    const i = s16(this.r16(G.psdIdx));
    const ox = s16(this.r16(G.geomOfs)) + s16(this.r16(i ? G.dispX : G.dispX + 2));
    const oy = s16(this.r16(G.geomOfs + 2)) + s16(this.r16(i ? G.dispY : G.dispY + 2));
    this.w16(G.offX, ox); this.w16(G.offY, oy);
  }
  putActiveDrawEnv() { // 0x8004d458
    const i = s16(this.r16(G.psdIdx)), c = G.clipX, e = G.drawEnvA;
    this.w16(e + 6, this.r16(c + 6)); this.w16(e + 4, this.r16(c + 4));
    this.w16(e, s16(this.r16(c)) + s16(this.r16(G.dispX + 2 * i)));
    this.w16(e + 2, s16(this.r16(c + 2)) + s16(this.r16(G.dispY + 2 * i)));
    this.PutDrawEnv(e);
  }
  GsSwapDispBuff() { // 0x8004d518
    const i = s16(this.r16(G.psdIdx)), d = G.dispEnvA;
    this.w16(d, this.r16(G.dispX + 2 * i)); this.w16(d + 2, this.r16(G.dispY + 2 * i));
    this.PutDispEnv(d);
    this.SetDispMask(1);
    let n = (this.r32(G.psdCount) + 1) >>> 0; if (!n) unported(0x8004d580);
    this.w32(G.psdCount, n);
    this.w16(G.psdIdx, s16(this.r16(G.psdIdx)) === 0 ? 1 : 0);
    this.putActiveDrawEnv();
    this.setGeomOffset();
  }
  GsSortClear(r, g, b, ot) { // 0x8004d200
    const i = s16(this.r16(G.psdIdx)), p = G.clearPackets + 16 * i;
    this.w8(p + 4, r); this.w8(p + 5, g); this.w8(p + 6, b);
    this.w16(p + 8, this.r16(G.dispX + 2 * i)); this.w16(p + 0xe, this.r16(G.clearW));
    this.w16(p + 0xa, this.r16(G.dispY + 2 * i));
    if (this.r8(G.sortClearMask)) unported(0x8004d2c4);
    this.w16(p + 0xc, this.r16(G.clearH));
    this.AddPrim(this.r32(ot + 0x10), p);
  }
  linkPacket(p, ot, z, words) { // 0x8004c6c8
    let k = (z & 0xffff) - this.r32(ot + 8);
    if (k < 0) unported(0x8004c700);
    const slot = this.r32(ot + 4) + 4 * k;
    this.w32(p, this.r32(slot)); this.w8(p + 3, words); this.w32(slot, p); this.w8(slot + 3, 0);
    return p + 4 * (words & 0xff) + 4;
  }
  GsSortBoxFill(box, ot, z) { // 0x8004c5e8
    const attr = this.r32(box) | 0;
    if (attr < 0) return;
    const p = this.r32(G.workBase);
    this.w32(p + 4, (attr >> 17 & 0x180 | (attr >> 23 & 0x60 | 0xe1000200)) >>> 0);
    this.w8(p + 8, this.r8(box + 0xc)); this.w8(p + 9, this.r8(box + 0xd));
    this.w8(p + 0xb, attr >> 29 & 2 | 0x60); this.w8(p + 0xa, this.r8(box + 0xe));
    this.w16(p + 0xc, this.r16(box + 4) + this.r16(G.offX)); this.w16(p + 0xe, this.r16(box + 6) + this.r16(G.offY));
    this.w16(p + 0x10, this.r16(box + 8)); this.w16(p + 0x12, this.r16(box + 0xa));
    this.w32(G.workBase, this.linkPacket(p, ot, z, 4));
  }
  GsSortFastSprite(sp, ot, z) { // 0x8004cc68
    const attr = this.r32(sp);
    if (attr & 0x80000000 || !this.r16(sp + 8) || !this.r16(sp + 0xa)) return;
    const p = this.r32(G.workBase);
    this.w32(p + 4, (this.r16(sp + 0xc) & 0x1f | (attr >>> 17 & 0x180 | 0xe1000200) | attr >>> 23 & 0x60) >>> 0);
    const x = (this.r16(sp + 4) + this.r16(G.offX)) & 0xffff, y = (this.r16(sp + 6) + this.r16(G.offY)) & 0xffff;
    this.w32(p + 0xc, (x | y << 16) >>> 0);
    this.w32(p + 8, (attr >>> 5 & 0x02000000 | (attr << 18 & 0x01000000 | 0x64000000) | this.r8(sp + 0x16) << 16 | this.r8(sp + 0x15) << 8 | this.r8(sp + 0x14)) >>> 0);
    this.w32(p + 0x10, (this.r8(sp + 0xe) | this.r8(sp + 0xf) << 8 | s16(this.r16(sp + 0x12)) << 22 | (s16(this.r16(sp + 0x10)) << 12 & 0x3f0000)) >>> 0);
    this.w32(p + 0x14, (this.r16(sp + 8) | this.r16(sp + 0xa) << 16) >>> 0);
    const slot = (this.r32(ot + 4) + 4 * (z & 0xffff) - 4 * this.r32(ot + 8)) >>> 0;
    this.w32(p, (this.r32(slot) + 0x05000000) >>> 0);
    this.w32(slot, p & 0xffffff);
    this.w32(G.workBase, p + 0x18);
  }
  GsGetTimInfo(im, tim) { // 0x8004dd58 (im points past the TIM id word)
    const flag = this.r32(im); this.w32(tim, flag);
    if (!(flag >>> 3 & 1)) unported(0x8004ddfc);
    let a = im + 4;
    const pix = a + (this.r32(a) >>> 2 << 2) + 4; a += 4;
    this.w16(tim + 0x10, this.r16(a)); this.w16(tim + 0x12, this.r16(a + 2)); a += 4;
    this.w16(tim + 0x14, this.r16(a)); this.w16(tim + 0x16, this.r16(a + 2)); a += 4;
    this.w32(tim + 0x18, a);
    this.w16(tim + 4, this.r16(pix)); this.w16(tim + 6, this.r16(pix + 2));
    this.w16(tim + 8, this.r16(pix + 4)); this.w16(tim + 0xa, this.r16(pix + 6));
    this.w32(tim + 0xc, pix + 8);
  }
  LoadTPage(pix, tp, abr, x, y, w, h, sp) { // 0x80046c28 (rect in the caller-provided frame sp+0x10)
    const rect = sp + 0x10;
    this.w16(rect, x); this.w16(rect + 6, h); this.w16(rect + 2, y);
    if (tp === 1) unported(0x80046cb8);
    if (tp !== 0) unported(0x80046c8c);
    this.w16(rect + 4, (w < 0 ? w + 3 : w) >> 2);
    this.LoadImage(rect, pix);
    return this.GetTPage(tp, abr, x, y);
  }
  LoadClut(clut, x, y, sp) { // 0x80046d10 (rect at sp+0x10 of its own frame)
    const rect = sp + 0x10;
    this.w16(rect + 4, 0x100); this.w16(rect + 6, 1); this.w16(rect, x); this.w16(rect + 2, y);
    this.LoadImage(rect, clut);
    return this.GetClut(x, y);
  }
}

// Addresses of the routines above, for hooking a port into the oracle in place of the original.
export const LIBGPU_ENTRY = {
  GetTPage: 0x80048858, GetClut: 0x80048894, AddPrim: 0x80048984, ResetGraph: 0x80048f38, SetDispMask: 0x8004921c,
  DrawSync: 0x800492b4, ClearImage: 0x80049438, LoadImage: 0x80049560, ClearOTagR: 0x800497a0, DrawOTag: 0x800498a8,
  PutDrawEnv: 0x80049918, PutDispEnv: 0x80049ae4, LoadTPage: 0x80046c28, LoadClut: 0x80046d10,
  GsSortBoxFill: 0x8004c5e8, GsSortFastSprite: 0x8004cc68, GsSortClear: 0x8004d200, GsGetActiveBuff: 0x8004d338,
  GsSwapDispBuff: 0x8004d518, GsDrawOt: 0x8004dc78, GsClearOt: 0x8004dca8, GsGetTimInfo: 0x8004dd58, GsSetWorkBase: 0x8004df18,
};
