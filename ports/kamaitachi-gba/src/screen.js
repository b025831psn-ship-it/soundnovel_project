export class Screen {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = 240;
    canvas.height = 160;
    this.ctx = canvas.getContext("2d");
    this.image = this.ctx.createImageData(240, 160);
  }

  setBackground(tiles, palette, variant = 0) {
    const factor = [15, 13, 11, 6][variant] ?? 15;
    const colors = [];
    for (let index = 0; index < 256; index++) {
      let color = palette[2 * index] | (palette[2 * index + 1] << 8);
      if (index < 236 && color & 0x7fff) {
        const scale = (channel) => Math.floor((channel * factor) / 15);
        color =
          scale(color & 31) |
          (scale((color >> 5) & 31) << 5) |
          (scale((color >> 10) & 31) << 10);
      }
      colors.push([color & 31, (color >> 5) & 31, (color >> 10) & 31]);
    }
    for (let y = 0; y < 160; y++) {
      for (let x = 0; x < 240; x++) {
        const tile = ((y >> 3) * 30 + (x >> 3)) * 64;
        const pixel = tile + (y & 7) * 8 + (x & 7);
        const color = colors[tiles[pixel]];
        const output = 4 * (y * 240 + x);
        this.image.data[output] = (color[0] * 255) / 31;
        this.image.data[output + 1] = (color[1] * 255) / 31;
        this.image.data[output + 2] = (color[2] * 255) / 31;
        this.image.data[output + 3] = 255;
      }
    }
    this.ctx.putImageData(this.image, 0, 0);
  }
}
