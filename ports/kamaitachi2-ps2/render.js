const blue = 'rgba(48,84,137,.80)';

export class Screen {
  constructor(canvas, images, data) {
    this.c = canvas.getContext('2d');
    this.images = images;
    this.data = data;
  }

  rect(x, y, w, h, color = blue) {
    this.c.fillStyle = color;
    this.c.fillRect(x, y, w, h);
  }

  sprite(img, sx, sy, w, h, x, y, dw = w, dh = h) {
    this.c.drawImage(this.images[img], sx, sy, w, h, x, y, dw, dh);
  }

  width(str, scale = 1) {
    return Array.from(str).reduce((w, ch) => w + ((this.data.font[ch]?.[2] ?? 16) + 1) * scale, 0);
  }

  text(str, x, y, { scale = 1, max = Infinity, leading = 40, readings } = {}) {
    let px = x, py = y, offset = 0;
    for (const ch of str) {
      const glyph = this.data.font[ch];
      const advance = ((glyph?.[2] ?? 16) + 1) * scale;
      if (ch === '\n' || px + advance > x + max) { px = x; py += leading; }
      const reading = readings?.get(offset);
      offset += ch.length;
      if (ch === '\n') continue;
      if (reading) this.centered(reading, px + advance / 2, py - 10, .38);
      if (glyph) {
        const [gx, gy, w, h, top] = glyph;
        this.sprite('font', gx, gy, w, h, Math.round(px), Math.round(py + top * scale), w * scale, h * scale);
      }
      px += advance;
    }
    return {x:px, y:py};
  }

  centered(str, mid, y, scale = 1) {
    this.text(str, mid - this.width(str, scale) / 2, y, {scale});
  }

  background(key, snow, time) {
    this.c.drawImage(this.images[key], 0, 0, 640, 448);
    const shade = key === 'my0645' ? 'rgba(9,9,9,.72)' : 'rgba(0,0,0,.46)';
    this.rect(0, 0, 640, 448, shade);
    if (!snow) return;
    // Snow continues behind both the printed text and the name editor.
    for (let i = 1; i <= 108; i++) {
      const speed = 18 + (i * 17 % 69);
      const y = (i * 183.7 + time * speed) % 463 - 8;
      const x = (i * 713.3 + Math.sin(time * .45 + i) * 13 + 640) % 640;
      this.rect(x, y, 2 + i % 3, 2 + i % 5, 'rgba(206,210,216,.32)');
    }
  }

  title(index, hasSave) {
    for (let i = 0; i < 3; i++) {
      const sx = i === 1 ? 128 : 0;
      const sy = (i === 2 ? 32 : 0) + (i === index ? 64 : 0);
      this.c.globalAlpha = i === 1 && !hasSave ? .5 : 1;
      this.sprite('title_00', sx, sy, 128, 32, 103 + i * 152, i === 0 ? 383 : 384);
    }
    this.c.globalAlpha = 1;
  }

  pointer(x, y) {
    this.sprite('sys_fc01', 0, 73, 15, 22, x, y);
  }

  yesNo(x, y, selection, width = 128) {
    this.rect(x, y, width, 68);
    this.sprite('sys_fc01', 134, 72, 48, 24, x + 36, y + 4);
    this.sprite('sys_fc01', 191, 72, 60, 24, x + 36, y + 35);
    this.pointer(x + 10, y + 5 + 32 * selection);
  }

  footer(editor) {
    this.rect(0, 390, 640, 26);
    this.sprite('name_e01', 0, 66, 54, 22, 39, 391);
    this.sprite('name_e01', 0, 114, 22, 22, 112, 391);
    if (editor) {
      this.sprite('name_e01', 150, 66, 38, 21, 140, 392);
      this.sprite('name_e01', 59, 66, 42, 21, 180, 392);
      this.sprite('name_e01', 23, 114, 24, 22, 249, 391);
      this.sprite('name_e01', 150, 66, 82, 21, 276, 392);
      this.sprite('name_e01', 0, 139, 23, 22, 378, 391);
      this.sprite('name_e01', 41, 90, 81, 22, 406, 391);
    } else {
      this.sprite('name_e01', 59, 66, 42, 21, 140, 392);
      this.sprite('name_e01', 23, 114, 24, 22, 198, 391);
      this.sprite('name_e01', 105, 66, 42, 21, 226, 392);
    }
  }

  autosave(state, selection, slot, initialName) {
    this.rect(0, 0, 640, 448, 'black');
    const fileScreen = ['file-select','created','save-note'].includes(state);
    if (state === 'created') this.background('my0007', false, 0);
    this.rect(0, 28, 640, 37);
    if (fileScreen) {
      this.sprite('sys_jo03', 360, 368, 130, 29, 29, 31);
      this.sprite('sys_jo03', slot ? 132 : 3, 478, 108, 32, 161, 30);
    } else this.sprite('sys_jo03', 257, 477, 118, 33, 96, 31);
    this.sprite('sys_fc01', 170, 481, 200, 30, 295, 31);
    if (state === 'save-note') {
      this.rect(63, 95, 512, 248);
      this.sprite('sys_fc01', 397, 318, 87, 24, 272, 109);
      const lines = [
        [0, 0, 250, 0, 231], [0, 26, 246, 26, 225], [0, 53, 222, 52, 251],
        [0, 78, 224, 79, 159], [0, 103, 246, 105, 226], [0, 130, 203, 131, 174],
      ];
      lines.forEach(([sx, sy, w, ty, tw], i) => {
        this.sprite('sys_jo02', sx, sy, w, 25, 84, 140 + i * 25);
        this.sprite('sys_wa01', 0, ty, tw, 25, 84 + w, 140 + i * 25);
      });
      this.sprite('sys_save', 399, 129, 90, 23, 86, 289);
      this.sprite('sys_jo02', 95, 155, 154, 25, 176, 289);
      this.sprite('sys_wa01', 0, 156, 104, 24, 329, 290);
      this.rect(0,390,640,26);
      this.sprite('name_e01',0,66,54,22,39,391);
      this.sprite('name_e01',0,114,22,22,112,391);
      this.sprite('sys_fc01',243,0,45,24,138,390);
      return;
    }
    if (fileScreen) {
      this.rect(103, 102, 500, 89);
      if (state === 'file-select') {
        this.sprite('sys_save', 81, 130, 211, 23, 102, 68);
        this.sprite('sys_save', 180, 177, 296, 24, 298, 68, 236, 24);
        this.sprite('sys_cd01', 0, 0, 54, 66, 79, 110);
        this.sprite('sys_save', 388, 103, 104, 25, 183, 132);
      } else {
        this.sprite('sys_cd01', 0, 64, 95, 63, 79, 112);
        this.sprite('sys_fc01', 398, 417, 110, 23, 201, 121);
        this.text('１', 326, 120, {scale:.85});
        this.rect(376, 111, 215, 39, 'rgba(17,26,40,.46)');
        this.text(initialName, 394, 114);
        this.sprite('sys_save', 399, 130, 91, 22, 159, 159);
        this.sprite('sys_cd01', 104, 1, 24, 23, 263, 158);
        this.text('００００：００：００', 294, 157, {scale:.62});
        this.sprite('sys_cd01', 104, 25, 24, 21, 439, 159);
        this.sprite('sys_cd01', 104, 48, 24, 21, 519, 159);
        this.text('０', 484, 157, {scale:.65}); this.text('０', 576, 157, {scale:.65});
        this.sprite('sys_cd02', 0, 288, 215, 24, 152, 223);
        this.sprite('sys_cd02', 374, 288, 134, 24, 363, 223);
      }
      this.footer(false);
      return;
    }
    if (state === 'autosave') {
      this.sprite('sys_cd02', 0, 144, 295, 24, 168, 85);
      this.sprite('sys_cd02', 0, 168, 282, 24, 168, 112);
      this.yesNo(255, 150, selection);
    } else {
      this.sprite('sys_cd02', 298, 95, 210, 25, 136, 93);
      this.sprite('sys_cd02', 0, 70, 365, 26, 135, 121);
      this.sprite('sys_cd02', 296, 119, 177, 24, 136, 149);
    }
    this.rect(63, 221, 512, 28);
    this.sprite('sys_cd02', 0, 70, 365, 26, 97, 222);
    this.sprite('sys_save', 0, 104, 69, 25, 458, 222);
    for (let i = 0; i < 2; i++) {
      const x = 63 + 263 * i;
      this.rect(x, 270, 248, 105, state === 'slot' && selection === i ? blue : '#142438');
      this.sprite('sys_jo01', 0, 97, 96, 30, x, 255, 215, 30);
      this.c.globalAlpha = state === 'slot' && selection === i ? 1 : .72;
      this.sprite('sys_save', 72, 104, 203, 25, x + 5, 255);
      if (i) this.sprite('sys_save', 284, 104, 86, 25, x + 123, 255);
      this.sprite('sys_save', 0, 129, 41, 49, x + 16, 301);
      this.sprite('sys_save', 349, 74, 119, 24, x + 65, 309);
      this.c.globalAlpha = 1;
    }
    this.footer(false);
  }

  editor(editor, role, time) {
    this.rect(0, 28, 640, 36);
    this.sprite('name_e01', 0, role ? 33 : 0, role ? 183 : 94, 32, role ? 63 : 123, 29, role ? 150 : 91, 34);
    this.sprite('name_e01', 160, 0, 93, 32, 215, 29, 96, 34);
    for (let i = 0; i < 6; i++) {
      this.c.globalAlpha = i < editor.value.length ? 1 : .61;
      this.text(editor.value[i] ?? '＊', 352 + 32 * i, 31);
    }
    this.c.globalAlpha = 1;
    if (time % 1 < .65) this.rect(352 + 32 * Math.min(5, editor.value.length), 61, 28, 2, '#eee');
    this.rect(136, 74, 368, 32);
    this.sprite('name_e01', 0, 234, 31, 21, 80, 80);
    this.sprite('name_e01', 32, 234, 31, 21, 528, 80);
    this.sprite('name_e01', 242, 65, 14, 22, 119, 79, 13, 19);
    this.sprite('name_e01', 242, 90, 14, 22, 506, 79, 13, 19);
    editor.groups.forEach((g, i) => {
      this.c.globalAlpha = i === editor.group ? 1 : .67;
      this.text(g[0][0], 145 + 32 * i, 76);
    });
    this.c.globalAlpha = 1;
    this.rect(75, 116, 490, 262);
    for (let r = editor.scroll; r < Math.min(editor.rows.length, editor.scroll + 8); r++) {
      editor.rows[r].forEach((ch, col) => {
        if (!ch) return;
        const x = 80 + 32 * col, y = 119 + 32 * (r - editor.scroll);
        if (col === editor.column && r === editor.row) this.rect(x, y, 32, 32, '#395d18');
        else if (!col) this.rect(x, y, 31, 31, '#444954');
        this.text(ch, x + 1, y + 1);
      });
    }
    if (editor.scroll > 0) this.sprite('name_e01', 50, 136, 28, 15, 306, 106);
    if (editor.scroll + 8 < editor.rows.length) {
      this.c.save();
      this.c.translate(306, 386);
      this.c.scale(1, -1);
      this.sprite('name_e01', 50, 136, 28, 15, 0, 0);
      this.c.restore();
    }
    this.footer(true);
  }

  confirm(name, role, selection) {
    this.rect(0, 28, 640, 36);
    this.sprite('name_e01', 192, 0, 61, 32, 239, 29);
    this.sprite('name_e01', 160, 0, 32, 32, 302, 29);
    this.sprite('name_e01', 185, 32, 67, 32, 335, 29);
    const left = role ? 48 : 112;
    this.text(this.data.prompts[role] + name + '。', left, 144, {scale:.96});
    this.text(this.data.prompts[2], 176, 199, {scale:.96});
    this.rect(235, 252, 138, 72);
    this.sprite('sys_fc01', 134, 72, 48, 24, 274, 259, 59, 25);
    this.sprite('sys_fc01', 191, 72, 60, 24, 273, 290, 74, 27);
    this.sprite('sys_fc01', 0, 73, 15, 22, 248, 265 + 32 * selection, 15, 14);
    this.footer(false);
  }
}
