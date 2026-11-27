import { NATIVE_HEIGHT, NATIVE_WIDTH } from "./touch-shell.js";

export class RetailFramebuffer {
  constructor() {
    this.width = NATIVE_WIDTH; this.height = NATIVE_HEIGHT;
    this.rgba = new Uint8ClampedArray(this.width * this.height * 4);
    this.fade = null; this.wipe = null;
    this.clear();
  }
  clear(color = [0, 0, 0, 255]) { for (let i = 0; i < this.rgba.length; i += 4) this.rgba.set(color, i); }
  blit(image, dx = 0, dy = 0, { alpha = 255, tint = null } = {}) {
    const source = image.rgba || image;
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const tx = dx + x, ty = dy + y; if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) continue;
      const s = (y * image.width + x) * 4, d = (ty * this.width + tx) * 4;
      const sa = Math.trunc(source[s + 3] * alpha / 255); if (!sa) continue;
      const inv = 255 - sa;
      for (let c = 0; c < 3; c++) { const value = tint ? tint[c] : source[s + c];
        this.rgba[d + c] = Math.trunc((value * sa + this.rgba[d + c] * inv) / 255); }
      this.rgba[d + 3] = 255;
    }
  }
  rect(left, top, width, height, color) {
    for (let y = Math.max(0, top); y < Math.min(this.height, top + height); y++)
      for (let x = Math.max(0, left); x < Math.min(this.width, left + width); x++) {
        const d = (y * this.width + x) * 4, a = color[3] ?? 255, inv = 255 - a;
        for (let c = 0; c < 3; c++) this.rgba[d + c] = Math.trunc((color[c] * a + this.rgba[d + c] * inv) / 255);
        this.rgba[d + 3] = 255;
      }
  }
  drawGlyph(glyph, dx, dy, color = [255, 255, 255, 255]) {
    if (!glyph || !Number.isInteger(glyph.width) || !Number.isInteger(glyph.height))
      throw new TypeError("a decoded retail glyph is required");
    const alpha = glyph.alpha || glyph;
    for (let y = 0; y < glyph.height; y++) for (let x = 0; x < glyph.width; x++) {
      const coverage = alpha[y * glyph.width + x] || 0;
      if (!coverage) continue;
      this.rect(dx + x, dy + y, 1, 1, [color[0], color[1], color[2], Math.trunc(coverage * color[3] / 255)]);
    }
  }
  drawText(text, font, { x = 0, y = 0, color = [255, 255, 255, 255], spacing = 0 } = {}) {
    if (!font?.glyph) throw new TypeError("retail font provider must expose glyph(character)");
    let cursor = x;
    for (const character of text) {
      const glyph = font.glyph(character);
      if (!glyph) throw new Error(`missing retail glyph ${JSON.stringify(character)}`);
      this.drawGlyph(glyph, cursor, y, color);
      cursor += (glyph.advance ?? glyph.width) + spacing;
    }
    return cursor;
  }
  beginFade(color, frames) { this.fade = { color, frames: Math.max(1, frames), at: 0 }; }
  beginWipe(direction, frames) { this.wipe = { direction, frames: Math.max(1, frames), at: 0 }; }
  stepEffects() {
    if (this.fade) { this.fade.at++; const alpha = Math.min(255, Math.trunc(this.fade.at * 255 / this.fade.frames));
      this.rect(0, 0, this.width, this.height, [...this.fade.color, alpha]); if (this.fade.at >= this.fade.frames) this.fade = null; }
    if (this.wipe) { this.wipe.at++; const amount = Math.min(this.width, Math.trunc(this.wipe.at * this.width / this.wipe.frames));
      const left = this.wipe.direction === "right" ? 0 : this.width - amount;
      this.rect(left, 0, amount, this.height, [0, 0, 0, 255]); if (this.wipe.at >= this.wipe.frames) this.wipe = null; }
  }
  snapshot() { return this.rgba.slice(); }
}
