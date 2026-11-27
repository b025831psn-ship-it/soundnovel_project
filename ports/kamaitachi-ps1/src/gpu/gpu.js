// PS1 GPU: VRAM (1024x512, 16-bit), the GP0 drawing/transfer commands and the GP1
// display controls, written from the psx-spx hardware description. The game's own
// libgpu and screen routines (ported at their original addresses) drive it through
// gp0()/gp1() and DMA2, as on the console; display() gives the visible picture.
const W = 1024, H = 512;
const sx11 = (v) => (v << 21) >> 21; // signed 11-bit vertex coordinate
const DITHER = [[-4, 0, -3, 1], [2, -2, 3, -1], [-3, 1, -4, 0], [3, -1, 2, -2]];
const clamp5 = (v) => v < 0 ? 0 : v > 31 ? 31 : v;
const clamp8 = (v) => v < 0 ? 0 : v > 255 ? 255 : v;

// Number of parameter words (after the command word) of each GP0 command; -1 = polyline.
function gp0Size(cmd) {
  const op = cmd >>> 5;
  if (op === 1) { // polygon
    const gour = cmd & 0x10, quad = cmd & 0x08, tex = cmd & 0x04, n = quad ? 4 : 3;
    return n * (1 + (tex ? 1 : 0)) + (gour ? n - 1 : 0);
  }
  if (op === 2) return (cmd & 0x08) ? -1 : (cmd & 0x10) ? 3 : 2; // line
  if (op === 3) { const size = (cmd >> 3) & 3; return 1 + (cmd & 0x04 ? 1 : 0) + (size === 0 ? 1 : 0); }
  if (op === 4) return 3; // VRAM -> VRAM
  if (op === 5 || op === 6) return 2; // CPU <-> VRAM header
  if (cmd === 0x02) return 2;
  return 0;
}

export class Gpu {
  constructor() {
    this.vram = new Uint16Array(W * H);
    this.reset();
  }
  reset() {
    this.fifo = []; this.need = 0; this.poly = null;
    this.xfer = null; this.readBack = null;
    // draw mode (E1), texture window (E2), drawing area (E3/E4), offset (E5), mask (E6)
    this.texX = 0; this.texY = 0; this.semi = 0; this.depth = 0; this.dither = 0; this.drawDisplay = 0; this.texDisable = 0;
    this.rectFlipX = 0; this.rectFlipY = 0;
    this.twMaskX = 0; this.twMaskY = 0; this.twOffX = 0; this.twOffY = 0;
    this.areaL = 0; this.areaT = 0; this.areaR = 0; this.areaB = 0; this.offX = 0; this.offY = 0;
    this.setMask = 0; this.checkMask = 0;
    // display (GP1)
    this.dispX = 0; this.dispY = 0; this.hRange = [0x200, 0xc00]; this.vRange = [0x10, 0x100];
    this.dispMode = 0; this.dispOff = 1; this.dmaDir = 0; this.irq = 0;
    this.gpuRead = 0;
  }

  // ---- status / ports -------------------------------------------------------
  get stat() {
    let s = (this.texX & 0xf) | ((this.texY & 1) << 4) | (this.semi << 5) | (this.depth << 7) | (this.dither << 9) | (this.drawDisplay << 10);
    s |= (this.setMask << 11) | (this.checkMask << 12) | (this.texDisable << 15);
    const m = this.dispMode;
    s |= ((m >> 6) & 1) << 16; s |= (m & 3) << 17; s |= ((m >> 2) & 1) << 19; s |= ((m >> 3) & 1) << 20; s |= ((m >> 4) & 1) << 21; s |= ((m >> 5) & 1) << 22;
    s |= this.dispOff << 23; s |= this.irq << 24;
    s |= 1 << 26 | 1 << 27 | 1 << 28; // ready for command, VRAM->CPU, DMA block
    s |= this.dmaDir << 29;
    const dma = this.dmaDir === 1 ? 1 : this.dmaDir === 2 ? 1 : this.dmaDir === 3 ? 1 : 0;
    s |= dma << 25;
    return s >>> 0;
  }
  read() { // GPUREAD
    if (this.readBack) {
      const r = this.readBack; let v = 0;
      for (let k = 0; k < 2; k++) {
        const x = (r.x + r.i) & (W - 1), y = (r.y + r.j) & (H - 1);
        v |= this.vram[y * W + x] << (16 * k);
        if (++r.i >= r.w) { r.i = 0; if (++r.j >= r.h) { this.readBack = null; break; } }
      }
      this.gpuRead = v >>> 0;
    }
    return this.gpuRead;
  }

  // ---- GP1 ------------------------------------------------------------------
  gp1(v) {
    v >>>= 0;
    const cmd = (v >>> 24) & 0x3f, p = v & 0xffffff;
    switch (cmd) {
      case 0x00: this.reset(); break;
      case 0x01: this.fifo = []; this.need = 0; this.poly = null; this.xfer = null; break;
      case 0x02: this.irq = 0; break;
      case 0x03: this.dispOff = p & 1; break;
      case 0x04: this.dmaDir = p & 3; break;
      case 0x05: this.dispX = p & 0x3fe; this.dispY = (p >> 10) & 0x1ff; break;
      case 0x06: this.hRange = [p & 0xfff, (p >> 12) & 0xfff]; break;
      case 0x07: this.vRange = [p & 0x3ff, (p >> 10) & 0x3ff]; break;
      case 0x08: this.dispMode = p & 0xff | ((p >> 6) & 1) << 6; break;
      case 0x10: case 0x11: case 0x12: case 0x13: case 0x14: case 0x15: case 0x16: case 0x17:
      case 0x18: case 0x19: case 0x1a: case 0x1b: case 0x1c: case 0x1d: case 0x1e: case 0x1f: {
        const k = p & 7;
        this.gpuRead = k === 2 ? (this.twMaskX | this.twMaskY << 5 | this.twOffX << 10 | this.twOffY << 15)
          : k === 3 ? (this.areaL | this.areaT << 10) : k === 4 ? (this.areaR | this.areaB << 10)
            : k === 5 ? ((this.offX & 0x7ff) | (this.offY & 0x7ff) << 11) : k === 7 ? 2 : this.gpuRead;
        break;
      }
    }
  }

  // ---- GP0 ------------------------------------------------------------------
  gp0(v) {
    v >>>= 0;
    if (this.xfer) { this.xferWord(v); return; }
    if (this.poly) { this.polyWord(v); return; }
    if (this.need === 0) {
      const cmd = v >>> 24, n = gp0Size(cmd);
      if (n === -1) { this.poly = { cmd, words: [v], gour: !!(cmd & 0x10) }; return; }
      this.fifo = [v]; this.need = n;
      if (n === 0) this.exec();
      return;
    }
    this.fifo.push(v);
    if (--this.need === 0) this.exec();
  }
  exec() {
    const f = this.fifo, cmd = f[0] >>> 24, op = cmd >>> 5;
    this.fifo = [];
    if (op === 1) return this.polygon(cmd, f);
    if (op === 2) return this.line(cmd, f);
    if (op === 3) return this.rectangle(cmd, f);
    if (op === 4) return this.copy(f);
    if (op === 5) { const x = f[1] & 0x3ff, y = (f[1] >>> 16) & 0x1ff, w = ((f[2] - 1) & 0x3ff) + 1, h = (((f[2] >>> 16) - 1) & 0x1ff) + 1; this.xfer = { x, y, w, h, i: 0, j: 0 }; return; }
    if (op === 6) { const x = f[1] & 0x3ff, y = (f[1] >>> 16) & 0x1ff, w = ((f[2] - 1) & 0x3ff) + 1, h = (((f[2] >>> 16) - 1) & 0x1ff) + 1; this.readBack = { x, y, w, h, i: 0, j: 0 }; return; }
    switch (cmd) {
      case 0x02: return this.fill(f);
      case 0xe1: { const p = f[0]; this.texX = p & 0xf; this.texY = (p >> 4) & 1; this.semi = (p >> 5) & 3; this.depth = (p >> 7) & 3; this.dither = (p >> 9) & 1; this.drawDisplay = (p >> 10) & 1; this.texDisable = (p >> 11) & 1; this.rectFlipX = (p >> 12) & 1; this.rectFlipY = (p >> 13) & 1; return; }
      case 0xe2: { const p = f[0]; this.twMaskX = p & 31; this.twMaskY = (p >> 5) & 31; this.twOffX = (p >> 10) & 31; this.twOffY = (p >> 15) & 31; return; }
      case 0xe3: this.areaL = f[0] & 0x3ff; this.areaT = (f[0] >> 10) & 0x1ff; return;
      case 0xe4: this.areaR = f[0] & 0x3ff; this.areaB = (f[0] >> 10) & 0x1ff; return;
      case 0xe5: this.offX = sx11(f[0]); this.offY = sx11(f[0] >> 11); return;
      case 0xe6: this.setMask = f[0] & 1; this.checkMask = (f[0] >> 1) & 1; return;
      case 0x1f: this.irq = 1; return;
    }
  }
  xferWord(v) {
    const t = this.xfer;
    for (let k = 0; k < 2 && this.xfer; k++) {
      const px = (v >>> (16 * k)) & 0xffff, x = (t.x + t.i) & (W - 1), y = (t.y + t.j) & (H - 1), a = y * W + x;
      if (!(this.checkMask && (this.vram[a] & 0x8000))) this.vram[a] = px | (this.setMask << 15);
      if (++t.i >= t.w) { t.i = 0; if (++t.j >= t.h) this.xfer = null; }
    }
  }
  polyWord(v) {
    const p = this.poly;
    if ((v & 0xf000f000) === 0x50005000 && p.words.length >= (p.gour ? 4 : 3)) { this.polyline(p); this.poly = null; return; }
    p.words.push(v);
  }

  // ---- primitives -------------------------------------------------------------
  fill(f) {
    const c = f[0], col = ((c >> 3) & 31) | (((c >> 11) & 31) << 5) | (((c >> 19) & 31) << 10);
    const x0 = f[1] & 0x3f0, y0 = (f[1] >>> 16) & 0x1ff;
    const w = ((f[2] & 0x3ff) + 0xf) & ~0xf, h = (f[2] >>> 16) & 0x1ff;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.vram[((y0 + j) & (H - 1)) * W + ((x0 + i) & (W - 1))] = col;
  }
  copy(f) {
    const sx = f[1] & 0x3ff, sy = (f[1] >>> 16) & 0x1ff, dx = f[2] & 0x3ff, dy = (f[2] >>> 16) & 0x1ff;
    const w = ((f[3] - 1) & 0x3ff) + 1, h = (((f[3] >>> 16) - 1) & 0x1ff) + 1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const s = this.vram[((sy + j) & (H - 1)) * W + ((sx + i) & (W - 1))], a = ((dy + j) & (H - 1)) * W + ((dx + i) & (W - 1));
      if (!(this.checkMask && (this.vram[a] & 0x8000))) this.vram[a] = s | (this.setMask << 15);
    }
  }
  // Write one pixel with semi-transparency, mask and the drawing area.
  plot(x, y, c, semiOn, mode) {
    if (x < this.areaL || x > this.areaR || y < this.areaT || y > this.areaB) return;
    const a = (y & (H - 1)) * W + (x & (W - 1)), d = this.vram[a];
    if (this.checkMask && (d & 0x8000)) return;
    if (semiOn) {
      const br = d & 31, bg = (d >> 5) & 31, bb = (d >> 10) & 31, fr = c & 31, fg = (c >> 5) & 31, fb = (c >> 10) & 31;
      let r, g, b;
      if (mode === 0) { r = (br + fr) >> 1; g = (bg + fg) >> 1; b = (bb + fb) >> 1; }
      else if (mode === 1) { r = clamp5(br + fr); g = clamp5(bg + fg); b = clamp5(bb + fb); }
      else if (mode === 2) { r = clamp5(br - fr); g = clamp5(bg - fg); b = clamp5(bb - fb); }
      else { r = clamp5(br + (fr >> 2)); g = clamp5(bg + (fg >> 2)); b = clamp5(bb + (fb >> 2)); }
      c = (c & 0x8000) | r | (g << 5) | (b << 10);
    }
    this.vram[a] = c | (this.setMask << 15);
  }
  texel(u, v, tp, clut) {
    u = (u & ~(this.twMaskX * 8)) | ((this.twOffX & this.twMaskX) * 8);
    v = (v & ~(this.twMaskY * 8)) | ((this.twOffY & this.twMaskY) * 8);
    u &= 0xff; v &= 0xff;
    const bx = (tp & 0xf) * 64, by = ((tp >> 4) & 1) * 256, depth = (tp >> 7) & 3;
    const cx = (clut & 0x3f) * 16, cy = (clut >> 6) & 0x1ff;
    if (depth === 0) {
      const w = this.vram[(by + v) * W + ((bx + (u >> 2)) & (W - 1))], i = (w >> ((u & 3) * 4)) & 0xf;
      return this.vram[cy * W + ((cx + i) & (W - 1))];
    }
    if (depth === 1) {
      const w = this.vram[(by + v) * W + ((bx + (u >> 1)) & (W - 1))], i = (w >> ((u & 1) * 8)) & 0xff;
      return this.vram[cy * W + ((cx + i) & (W - 1))];
    }
    return this.vram[(by + v) * W + ((bx + u) & (W - 1))];
  }
  // Colour of a pixel: texel modulated by the vertex colour (unless raw), dithered when enabled.
  shade(r, g, b, t, raw, x, y, ditherOn) {
    let R, G, B;
    if (t === undefined) { R = r; G = g; B = b; }
    else if (raw) return t;
    else { R = ((t & 31) * 8 * r) >> 7; G = (((t >> 5) & 31) * 8 * g) >> 7; B = (((t >> 10) & 31) * 8 * b) >> 7; }
    if (ditherOn) { const d = DITHER[y & 3][x & 3]; R += d; G += d; B += d; }
    return (clamp8(R) >> 3) | ((clamp8(G) >> 3) << 5) | ((clamp8(B) >> 3) << 10) | (t !== undefined ? t & 0x8000 : 0);
  }
  // Rectangles (the game's text, pictures and sprites: nearly all of a frame's pixels). The same
  // result as rectangleRef, with the drawing area clipped once and the texel, the modulation, the
  // mask and the blend written out in the loop.
  rectangle(cmd, f) {
    const tex = cmd & 0x04, semiOn = cmd & 0x02, raw = cmd & 0x01, size = (cmd >> 3) & 3;
    const r = f[0] & 0xff, g = (f[0] >> 8) & 0xff, b = (f[0] >> 16) & 0xff;
    const x0 = sx11(f[1]) + this.offX, y0 = sx11(f[1] >>> 16) + this.offY;
    let k = 2, u0 = 0, v0 = 0, clut = 0;
    if (tex) { u0 = f[2] & 0xff; v0 = (f[2] >> 8) & 0xff; clut = f[2] >>> 16; k = 3; }
    let w, h;
    if (size === 0) { w = f[k] & 0x3ff; h = (f[k] >>> 16) & 0x1ff; } else { w = h = size === 1 ? 1 : size === 2 ? 8 : 16; }
    const i0 = Math.max(0, this.areaL - x0), i1 = Math.min(w, this.areaR - x0 + 1), j0 = Math.max(0, this.areaT - y0), j1 = Math.min(h, this.areaB - y0 + 1);
    if (i0 >= i1 || j0 >= j1) return;
    const vram = this.vram, checkMask = this.checkMask, setMask = this.setMask << 15, mode = this.semi;
    const blend = (d, c) => {
      const br = d & 31, bg = (d >> 5) & 31, bb = (d >> 10) & 31, fr = c & 31, fg = (c >> 5) & 31, fb = (c >> 10) & 31;
      let R, G, B;
      if (mode === 0) { R = (br + fr) >> 1; G = (bg + fg) >> 1; B = (bb + fb) >> 1; }
      else if (mode === 1) { R = clamp5(br + fr); G = clamp5(bg + fg); B = clamp5(bb + fb); }
      else if (mode === 2) { R = clamp5(br - fr); G = clamp5(bg - fg); B = clamp5(bb - fb); }
      else { R = clamp5(br + (fr >> 2)); G = clamp5(bg + (fg >> 2)); B = clamp5(bb + (fb >> 2)); }
      return (c & 0x8000) | R | (G << 5) | (B << 10);
    };
    if (!tex) {
      const c = (r >> 3) | ((g >> 3) << 5) | ((b >> 3) << 10);
      for (let j = j0; j < j1; j++) {
        let a = ((y0 + j) & (H - 1)) * W;
        for (let i = i0; i < i1; i++) {
          const p = a + ((x0 + i) & (W - 1)), d = vram[p];
          if (checkMask && (d & 0x8000)) continue;
          vram[p] = (semiOn ? blend(d, c) : c) | setMask;
        }
      }
      return;
    }
    const mx = ~(this.twMaskX * 8), ox = (this.twOffX & this.twMaskX) * 8, my = ~(this.twMaskY * 8), oy = (this.twOffY & this.twMaskY) * 8;
    const bx = this.texX * 64, by = this.texY * 256, depth = this.depth & 3;
    const cbase = ((clut >> 6) & 0x1ff) * W, cx = (clut & 0x3f) * 16, flipX = this.rectFlipX, flipY = this.rectFlipY;
    for (let j = j0; j < j1; j++) {
      const v = (((flipY ? v0 - j : v0 + j) & my) | oy) & 0xff, row = (by + v) * W, a = ((y0 + j) & (H - 1)) * W;
      for (let i = i0; i < i1; i++) {
        const u = (((flipX ? u0 - i : u0 + i) & mx) | ox) & 0xff;
        let t;
        if (depth === 0) t = vram[cbase + ((cx + ((vram[row + ((bx + (u >> 2)) & (W - 1))] >> ((u & 3) * 4)) & 0xf)) & (W - 1))];
        else if (depth === 1) t = vram[cbase + ((cx + ((vram[row + ((bx + (u >> 1)) & (W - 1))] >> ((u & 1) * 8)) & 0xff)) & (W - 1))];
        else t = vram[row + ((bx + u) & (W - 1))];
        if (t === 0) continue;
        const p = a + ((x0 + i) & (W - 1)), d = vram[p];
        if (checkMask && (d & 0x8000)) continue;
        let c = t;
        if (!raw) {
          const R = ((t & 31) * 8 * r) >> 7, G = (((t >> 5) & 31) * 8 * g) >> 7, B = (((t >> 10) & 31) * 8 * b) >> 7;
          c = (clamp8(R) >> 3) | ((clamp8(G) >> 3) << 5) | ((clamp8(B) >> 3) << 10) | (t & 0x8000);
        }
        vram[p] = (semiOn && (t & 0x8000) ? blend(d, c) : c) | setMask;
      }
    }
  }
  // The plain form of rectangle(), pixel by pixel through texel / shade / plot (tests compare the two).
  rectangleRef(cmd, f) {
    const tex = cmd & 0x04, semiOn = cmd & 0x02, raw = cmd & 0x01, size = (cmd >> 3) & 3;
    const r = f[0] & 0xff, g = (f[0] >> 8) & 0xff, b = (f[0] >> 16) & 0xff;
    const x0 = sx11(f[1]) + this.offX, y0 = sx11(f[1] >>> 16) + this.offY;
    let k = 2, u0 = 0, v0 = 0, clut = 0;
    if (tex) { u0 = f[2] & 0xff; v0 = (f[2] >> 8) & 0xff; clut = f[2] >>> 16; k = 3; }
    let w, h;
    if (size === 0) { w = f[k] & 0x3ff; h = (f[k] >>> 16) & 0x1ff; } else { w = h = size === 1 ? 1 : size === 2 ? 8 : 16; }
    const tp = this.texX | (this.texY << 4) | (this.depth << 7);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = x0 + i, y = y0 + j;
      if (x < this.areaL || x > this.areaR || y < this.areaT || y > this.areaB) continue;
      let c;
      if (tex) {
        const t = this.texel(this.rectFlipX ? u0 - i : u0 + i, this.rectFlipY ? v0 - j : v0 + j, tp, clut);
        if (t === 0) continue;
        c = this.shade(r, g, b, t, raw, x, y, false);
        this.plot(x, y, c, semiOn && (t & 0x8000), this.semi);
      } else this.plot(x, y, this.shade(r, g, b, undefined, 0, x, y, false), semiOn, this.semi);
    }
  }
  polygon(cmd, f) {
    const gour = cmd & 0x10, quad = cmd & 0x08, tex = cmd & 0x04, semiOn = cmd & 0x02, raw = cmd & 0x01, n = quad ? 4 : 3;
    const vs = []; let k = 0, tp = null, clut = 0, col = f[0];
    for (let i = 0; i < n; i++) {
      if (i > 0 && gour) col = f[k];
      if (i === 0 || gour) k++;
      const xy = f[k++];
      const vtx = { x: sx11(xy) + this.offX, y: sx11(xy >>> 16) + this.offY, r: col & 0xff, g: (col >> 8) & 0xff, b: (col >> 16) & 0xff, u: 0, v: 0 };
      if (tex) { const uv = f[k++]; vtx.u = uv & 0xff; vtx.v = (uv >> 8) & 0xff; if (i === 0) clut = uv >>> 16; if (i === 1) tp = uv >>> 16; }
      vs.push(vtx);
    }
    let semiMode = this.semi;
    if (tex) { this.texX = tp & 0xf; this.texY = (tp >> 4) & 1; this.semi = semiMode = (tp >> 5) & 3; this.depth = (tp >> 7) & 3; if (!this.texDisable) {} }
    const ctx = { tex, semiOn, raw, gour, tp: tex ? tp : 0, clut, semiMode, ditherOn: this.dither && (gour || (tex && !raw)) };
    this.triangle(vs[0], vs[1], vs[2], ctx);
    if (quad) this.triangle(vs[1], vs[2], vs[3], ctx);
  }
  // Triangle with the top-left fill rule (right and bottom edges excluded).
  triangle(a, b, c, ctx) {
    const area = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
    if (area === 0) return;
    if (Math.abs(b.x - a.x) >= 1024 || Math.abs(c.x - b.x) >= 1024 || Math.abs(a.x - c.x) >= 1024) return;
    if (Math.abs(b.y - a.y) >= 512 || Math.abs(c.y - b.y) >= 512 || Math.abs(a.y - c.y) >= 512) return;
    const minX = Math.max(Math.min(a.x, b.x, c.x), this.areaL), maxX = Math.min(Math.max(a.x, b.x, c.x) - 1, this.areaR);
    const minY = Math.max(Math.min(a.y, b.y, c.y), this.areaT), maxY = Math.min(Math.max(a.y, b.y, c.y) - 1, this.areaB);
    const s = area > 0 ? 1 : -1;
    const edge = (p, q, x, y) => (q.x - p.x) * (y - p.y) - (q.y - p.y) * (x - p.x);
    const topLeft = (p, q) => { const dy = (q.y - p.y) * s, dx = (q.x - p.x) * s; return dy < 0 || (dy === 0 && dx > 0); };
    const bias0 = topLeft(b, c) ? 0 : -1, bias1 = topLeft(c, a) ? 0 : -1, bias2 = topLeft(a, b) ? 0 : -1;
    const A = Math.abs(area);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const w0 = edge(b, c, x, y) * s + bias0, w1 = edge(c, a, x, y) * s + bias1, w2 = edge(a, b, x, y) * s + bias2;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const W0 = w0 - bias0, W1 = w1 - bias1, W2 = w2 - bias2;
      const lerp = (k) => Math.floor((a[k] * W0 + b[k] * W1 + c[k] * W2) / A);
      const r = ctx.gour ? lerp("r") : a.r, g = ctx.gour ? lerp("g") : a.g, bl = ctx.gour ? lerp("b") : a.b;
      if (ctx.tex) {
        const t = this.texel(lerp("u"), lerp("v"), ctx.tp, ctx.clut);
        if (t === 0) continue;
        this.plot(x, y, this.shade(r, g, bl, t, ctx.raw, x, y, ctx.ditherOn), ctx.semiOn && (t & 0x8000), ctx.semiMode);
      } else this.plot(x, y, this.shade(r, g, bl, undefined, 0, x, y, ctx.ditherOn), ctx.semiOn, ctx.semiMode);
    }
  }
  line(cmd, f) {
    const gour = cmd & 0x10;
    const p0 = { c: f[0], xy: f[1] }, p1 = gour ? { c: f[2], xy: f[3] } : { c: f[0], xy: f[2] };
    this.segment(p0, p1, cmd);
  }
  polyline(p) {
    const w = p.words, pts = [];
    if (p.gour) { for (let i = 0; i + 1 < w.length; i += 2) pts.push({ c: w[i], xy: w[i + 1] }); }
    else for (let i = 1; i < w.length; i++) pts.push({ c: w[0], xy: w[i] });
    for (let i = 0; i + 1 < pts.length; i++) this.segment(pts[i], pts[i + 1], p.cmd);
  }
  segment(p, q, cmd) {
    const semiOn = cmd & 0x02, gour = cmd & 0x10;
    let x0 = sx11(p.xy) + this.offX, y0 = sx11(p.xy >>> 16) + this.offY; const x1 = sx11(q.xy) + this.offX, y1 = sx11(q.xy >>> 16) + this.offY;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const t = n ? i / n : 0, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t);
      const c = gour ? q.c : p.c, mix = (k) => Math.round(((p.c >> k) & 0xff) * (1 - t) + ((c >> k) & 0xff) * t);
      this.plot(x, y, this.shade(mix(0), mix(8), mix(16), undefined, 0, x, y, this.dither && gour), semiOn, this.semi);
    }
  }

  // ---- display ----------------------------------------------------------------
  get displayWidth() { const m = this.dispMode; if (m & 0x40) return 368; return [256, 320, 512, 640][m & 3]; }
  get displayHeight() { return (this.dispMode & 0x04) && (this.dispMode & 0x20) ? 480 : 240; }
  // RGBA of the visible area (15-bit or 24-bit mode).
  display(out = null) {
    const w = this.displayWidth, h = this.displayHeight, rgba = out ?? new Uint8ClampedArray(w * h * 4);
    if (this.dispOff) { rgba.fill(0); for (let i = 3; i < rgba.length; i += 4) rgba[i] = 255; return { width: w, height: h, rgba }; }
    const is24 = this.dispMode & 0x10;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4, vy = (this.dispY + y) & (H - 1);
      if (is24) {
        const byte = x * 3, base = vy * W * 2 + this.dispX * 2 + byte;
        const B = (i) => { const a = base + i, px = this.vram[vy * W + (((a - vy * W * 2) >> 1) & (W - 1))]; return a & 1 ? px >> 8 : px & 0xff; };
        rgba[o] = B(0); rgba[o + 1] = B(1); rgba[o + 2] = B(2);
      } else {
        const p = this.vram[vy * W + ((this.dispX + x) & (W - 1))];
        rgba[o] = (p & 31) << 3 | (p & 31) >> 2; rgba[o + 1] = ((p >> 5) & 31) << 3 | ((p >> 5) & 31) >> 2; rgba[o + 2] = ((p >> 10) & 31) << 3 | ((p >> 10) & 31) >> 2;
      }
      rgba[o + 3] = 255;
    }
    return { width: w, height: h, rgba };
  }
}
