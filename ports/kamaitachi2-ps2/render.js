import { JAPANESE_NO_START, KOREAN_NO_START, NO_END, wordWidth } from './text-layout.js';

const blue = 'rgba(48,84,137,.80)';
const editorInk = { tint: Array(3).fill(219 * 128 / 255) };
const editorDimInk = { tint: Array(3).fill(109 * 128 / 255) };

export class Screen {
  constructor(canvas, images, data) {
    this.c = canvas.getContext('2d');
    this.images = images;
    this.data = data;
    this.tintedGlyphs = new Map();
    // Brightness above the stationary background around a flake in the PS2 name screen.
    const snowProfile = [
      [0,1,2,5,1,0], [0,1,6,13,1,0], [3,22,27,34,22,5],
      [10,62,64,66,62,13], [14,82,82,82,82,18], [17,82,82,82,82,18],
      [13,62,64,66,62,13], [5,22,27,34,23,5], [0,2,6,14,3,0], [0,0,2,4,0,0],
    ];
    this.flake = document.createElement('canvas');
    this.flake.width = snowProfile[0].length;
    this.flake.height = snowProfile.length;
    const flakeContext = this.flake.getContext('2d');
    snowProfile.forEach((row, y) => row.forEach((alpha, x) => {
      flakeContext.fillStyle = `rgba(255,255,255,${alpha / 255})`;
      flakeContext.fillRect(x, y, 1, 1);
    }));
  }

  rect(x, y, w, h, color = blue) {
    this.c.fillStyle = color;
    this.c.fillRect(x, y, w, h);
  }

  sprite(img, sx, sy, w, h, x, y, dw = w, dh = h) {
    this.c.drawImage(this.images[img], sx, sy, w, h, x, y, dw, dh);
  }

  width(str, scale = 1) {
    return Array.from(str).reduce((w, ch) => w + (this.metric(ch)[2] + 1) * scale, 0);
  }

  metric(ch) {
    if (this.data.font[ch]) return this.data.font[ch];
    return this.data.font['�'];
  }

  tintedGlyph(ch, rgb, gx, gy, w, h) {
    const key = ch + rgb.join(',');
    if (this.tintedGlyphs.has(key)) return this.tintedGlyphs.get(key);
    const tile = document.createElement('canvas');
    tile.width = w;
    tile.height = h;
    const ctx = tile.getContext('2d');
    ctx.drawImage(this.images.font, gx, gy, w, h, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < pixels.data.length; i += 4) {
      for (let channel = 0; channel < 3; channel++) pixels.data[i + channel] *= rgb[channel] / 128;
    }
    ctx.putImageData(pixels, 0, 0);
    this.tintedGlyphs.set(key, tile);
    return tile;
  }

  text(str, x, y, { scale = 1, max = Infinity, leading = 40, spacing = 1, widthScale = scale,
    readings, colors, tint, lineStart, styleAt, moves = [], lines = [], measureOnly = false } = {}) {
    // lineStart(offset) may move the first glyph of a line (SN4 CommandCenter).
    let px = lineStart?.(0) ?? x, py = y, offset = 0;
    const korean = this.data.language === 'ko';
    const noStart = korean ? KOREAN_NO_START : JAPANESE_NO_START;
    const chars = Array.from(str);
    for (let at = 0; at < chars.length; at++) {
      const ch = chars[at];
      for (const move of moves.filter(item => item.offset === offset)) {
        if (move.absolute) { px = move.x; py = move.y; }
        else { px += move.x; py += move.y; }
      }
      for (const line of lines.filter(item => item.offset === offset)) {
        const width = Math.max(0, line.width ?? 0);
        const lineHeight = styleAt?.(offset)?.leading ?? leading;
        if (px !== x && px + width > x + max) { px = lineStart?.(offset) ?? x; py += lineHeight; }
        if (!measureOnly) {
          this.c.fillStyle = tint ? `rgb(${tint.join(',')})` : '#fff';
          this.c.fillRect(Math.round(px), Math.round(py + Math.max(1, (line.type ?? 0))), width, 1);
        }
        px += width;
      }
      const rgb = colors?.get(offset);
      if (rgb) tint = rgb.every(channel => channel === 128) ? undefined : rgb;
      const glyph = this.metric(ch);
      const style = styleAt?.(offset) ?? {scale, widthScale, spacing, leading};
      const glyphScale = style.scale ?? scale;
      const glyphWidthScale = style.widthScale ?? widthScale;
      const glyphSpacing = style.spacing ?? spacing;
      const lineHeight = style.leading ?? leading;
      const advance = (glyph[2] + glyphSpacing) * glyphWidthScale;
      const next = chars[at + 1];
      const nextGlyph = next ? this.metric(next) : null;
      const nextAdvance = nextGlyph ? (nextGlyph[2] + glyphSpacing) * glyphWidthScale : 0;
      const beginsWord = korean && at > 0 && !/\s/u.test(ch) && /\s/u.test(chars[at - 1]);
      const tokenWidth = beginsWord ? wordWidth(chars, at, offset, (c, o) => {
        const tokenStyle = styleAt?.(o) ?? {widthScale, spacing};
        return (this.metric(c)[2] + (tokenStyle.spacing ?? spacing)) * (tokenStyle.widthScale ?? widthScale);
      }) : 0;
      const wordWrap = beginsWord && px > x && tokenWidth <= max && px + tokenWidth > x + max;
      const wrap = px + advance > x + max && !noStart.has(ch);
      const keepPair = (NO_END.has(ch) || noStart.has(next)) && next && px + advance + nextAdvance > x + max;
      if (ch === '\n' || wordWrap || wrap || keepPair) { px = lineStart?.(offset) ?? x; py += lineHeight; }
      const reading = readings?.get(offset);
      offset += ch.length;
      if (ch === '\n') { px = lineStart?.(offset) ?? px; continue; }
      if (reading && !measureOnly) this.centered(reading, px + advance / 2, py - 10, .38);
      if (glyph && !measureOnly) {
        const [gx, gy, w, h, top] = glyph;
        const x = Math.round(px), y = Math.round(py + top * glyphScale);
        if (tint && w && h) this.c.drawImage(this.tintedGlyph(ch, tint, gx, gy, w, h), x, y, w * glyphWidthScale, h * glyphScale);
        else this.sprite('font', gx, gy, w, h, x, y, w * glyphWidthScale, h * glyphScale);
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
    this.c.save();
    this.c.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 108; i++) {
      const speed = 18 + (i * 17 % 69);
      const y = (i * 183.7 + time * speed) % 463 - 8;
      const x = (i * 713.3 + Math.sin(time * .45 + i) * 13 + 640) % 640;
      const size = .45 + (i % 11) * .055;
      this.c.globalAlpha = .65 + (i % 8) * .05;
      this.c.drawImage(this.flake, x, y, this.flake.width * size, this.flake.height * size);
    }
    this.c.restore();
  }

  title(index, hasSave) {
    for (let i = 0; i < 3; i++) {
      const sx = i === 1 ? 128 : 0;
      // The selected Continue label starts one row lower in the PS2 atlas.
      const sy = i === index ? [64, 65, 96][i] : [0, 0, 32][i];
      this.c.globalAlpha = i === 1 && !hasSave ? .5 : 1;
      this.sprite('title_00', sx, sy, 128, 32, 103 + i * 152, i === 0 ? 383 : 384);
    }
    this.c.globalAlpha = 1;
  }

  pointer(x, y) {
    this.sprite('sys_fc01', 0, 73, 15, 22, x, y);
  }

  yesNo(x, y, selection, width = 128) {
    this.rect(x, y, width, 64);
    this.sprite('sys_fc01', 134, 72, 48, 24, x + 46, y + 6);
    this.sprite('sys_fc01', 191, 72, 60, 24, x + 46, y + 33);
    this.pointer(x + 16, y + 7 + 27 * selection);
  }

  footer(state) {
    const nameScreen = state === 'name' || state === 'confirm';
    const lowRow = state === 'autosave' || state === 'save-note';
    this.rect(0, 390, 640, 26);
    this.sprite('name_e01', 0, 66, 54, 22, nameScreen ? 40 : 38, lowRow ? 391 : 393);
    this.sprite('name_e01', 0, 114, 22, 22, 112, lowRow ? 391 : 392);
    if (this.data.language === 'ko' && nameScreen) {
      this.rect(34, 390, 525, 28);
      this.text(state === 'name' ? '○ 결정  × 지우기  △ 완료  L1/R1 문자표' : '○ 결정  × 돌아가기',
        45, 393, {scale:.55, widthScale:.55, spacing:0});
      return;
    }
    if (state === 'created' || state === 'save-note') {
      this.sprite('sys_fc01', 243, 0, 45, 24, 138, 390);
    } else if (state === 'name') {
      this.sprite('name_e01', 150, 66, 38, 21, 142, 393);
      this.sprite('name_e01', 59, 66, 42, 21, 187, 393);
      this.sprite('name_e01', 23, 114, 24, 22, 247, 392);
      this.sprite('name_e01', 150, 66, 82, 21, 278, 393);
      this.sprite('name_e01', 0, 139, 23, 22, 376, 393);
      this.sprite('name_e01', 41, 90, 81, 22, 409, 393);
    } else {
      this.sprite('name_e01', 59, 66, 42, 21, nameScreen ? 139 : 138, lowRow ? 391 : 393);
      this.sprite('name_e01', 23, 114, 24, 22, nameScreen ? 199 : (lowRow ? 197 : 198), 392);
      this.sprite('name_e01', 105, 66, 42, 21, nameScreen ? 225 : 224, lowRow ? 391 : 392);
    }
  }

  autosave(state, selection, slot, initialName) {
    this.rect(0, 0, 640, 448, 'black');
    const fileScreen = ['file-select','created','save-note'].includes(state);
    if (state === 'created') {
      this.c.drawImage(this.images.g_start, 0, 0);
      this.rect(0, 0, 640, 448, 'rgba(75,75,75,.25)');
    }
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
        [78,141,311,140], [78,166,310,166], [79,190,311,190], [78,216,311,216],
        [79,240,311,240], [79,265,311,265], [79,290,310,291],
      ];
      lines.forEach(([leftX, leftY, rightX, rightY], i) => {
        const sy = 3 + 25 * i;
        this.sprite('sys_jo02', 0, sy, 256, 24, leftX, leftY);
        this.sprite('sys_wa01', 0, sy, 256, 24, rightX, rightY);
      });
      this.sprite('sys_save', 399, 129, 90, 23, 86, 289);
      this.footer(state);
      return;
    }
    if (fileScreen) {
      this.rect(103, 102, 500, 89);
      if (state === 'file-select') {
        this.sprite('sys_save', 81, 130, 211, 23, 103, 73);
        this.sprite('sys_save', 258, 177, 217, 24, 313, 71);
        this.sprite('sys_cd01', 0, 0, 54, 66, 79, 111);
        this.sprite('sys_save', 388, 103, 104, 25, 187, 133);
      } else {
        this.sprite('sys_save', 0, 82, 23, 20, 49, 137);
        this.sprite('sys_cd01', 0, 64, 95, 63, 79, 112);
        this.text('わらべ唄篇', 201, 119, {scale:.76, widthScale:.74});
        this.text('１章', 326, 119, {scale:.8});
        this.rect(177, 144, 194, 6, 'rgba(0,0,0,.52)');
        this.rect(179, 146, 191, 2, '#838689');
        this.rect(178, 142, 3, 6, '#999');
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
      this.footer(state);
      return;
    }
    if (state === 'autosave') {
      this.sprite('sys_cd02', 0, 144, 295, 24, 168, 85);
      this.sprite('sys_cd02', 0, 168, 282, 24, 168, 112);
      this.yesNo(255, 150, selection);
    } else {
      this.sprite('sys_cd02', 298, 95, 210, 25, 137, 93);
      this.sprite('sys_cd02', 0, 70, 365, 26, 135, 120);
      this.sprite('sys_cd02', 296, 119, 177, 24, 134, 149);
    }
    this.rect(63, 221, 512, 28);
    this.sprite('sys_cd02', 0, 70, 365, 26, 97, 222);
    this.sprite('sys_save', 0, 104, 69, 25, 458, 222);
    for (let i = 0; i < 2; i++) {
      const x = 63 + 263 * i;
      const selected = state === 'slot' && selection === i;
      this.rect(x, 270, 248, 105, selected ? blue : '#132238');
      this.c.save();
      this.c.filter = selected ? 'none' : 'brightness(50%)';
      this.sprite('sys_jo01', 0, 97, 96, 30, x, 255, 215, 30);
      this.c.filter = selected ? 'brightness(101.4%)' : 'brightness(50.2%)';
      this.sprite('sys_save', 72, 104, 203, 25, x + 5, 255);
      if (i) this.sprite('sys_save', 284, 104, 86, 25, x + 123, 255);
      this.sprite('sys_save', 0, 129, 41, 49, x + 16, 301);
      this.sprite('sys_save', 349, 74, 119, 24, x + 65, 309);
      this.c.restore();
    }
    this.footer(state);
  }

  editor(editor, role) {
    const glyph = (ch, x, y, dim = false) => {
      const width = this.data.font[ch]?.[2] ?? 16;
      const inset = Math.max(0, Math.floor((32 - width) / 2));
      this.text(ch, x + inset, y, dim ? editorDimInk : editorInk);
    };
    this.rect(0, 28, 640, 36);
    if (this.data.language === 'ko') {
      this.text(role ? '여자친구 이름' : '주인공 이름', role ? 73 : 119, 31,
        {...editorInk, scale:.8, widthScale:.8, spacing:0});
    } else {
      this.sprite('name_e01', 0, role ? 33 : 0, role ? 183 : 94, 32, role ? 63 : 123, 29, role ? 150 : 91, 34);
      this.sprite('name_e01', 160, 0, 93, 32, 215, 29, 96, 34);
    }
    const insertionColumn = Math.min(5, editor.value.length);
    glyph('＿', 352 + 32 * insertionColumn, 33);
    for (let i = 0; i < 6; i++) {
      const ch = editor.value[i] ?? '＊';
      glyph(ch, 352 + 32 * i, 31, i >= editor.value.length);
    }
    this.rect(136, 74, 368, 32);
    this.sprite('name_e01', 0, 234, 31, 21, 80, 80);
    this.sprite('name_e01', 32, 234, 31, 21, 528, 80);
    this.sprite('name_e01', 242, 65, 14, 22, 119, 79, 13, 19);
    this.sprite('name_e01', 242, 90, 14, 22, 506, 79, 13, 19);
    editor.groups.forEach((g, i) => {
      glyph(g[0][0], 144 + 32 * i, 75, i !== editor.group);
    });
    this.rect(75, 116, 490, 262);
    for (let r = editor.scroll; r < Math.min(editor.rows.length, editor.scroll + 8); r++) {
      editor.rows[r].forEach((ch, col) => {
        if (!ch) return;
        const x = 80 + 32 * col, y = 119 + 32 * (r - editor.scroll);
        if (col === editor.column && r === editor.row) {
          this.rect(x, y - 2, 32, 1, 'rgba(39,71,0,.25)');
          this.rect(x, y - 1, 32, 1, 'rgba(39,71,0,.75)');
          this.rect(x, y, 32, 30, '#274700');
          this.rect(x, y + 30, 32, 1, 'rgba(39,71,0,.75)');
          this.rect(x, y + 31, 32, 1, 'rgba(39,71,0,.25)');
        } else if (!col) {
          this.rect(x, y, 30, 30, '#808080');
          this.rect(x + 2, y, 28, 1, '#6f6f6f');
          this.rect(x + 2, y + 1, 28, 1, '#4c4c4c');
          this.rect(x + 2, y + 2, 28, 28, '#3b3b3b');
        }
        glyph(ch, x, y);
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
    this.footer('name');
  }

  confirm(name, role, selection) {
    this.rect(0, 28, 640, 36);
    if (this.data.language === 'ko') this.text('이름 확인', 247, 31, {...editorInk, scale:.8, widthScale:.8});
    else {
      this.sprite('name_e01', 192, 0, 61, 32, 239, 29);
      this.sprite('name_e01', 160, 0, 32, 32, 302, 29);
      this.sprite('name_e01', 185, 32, 67, 32, 335, 29);
    }
    const left = role ? 48 : 112;
    const promptStyle = {...editorInk, scale:.96, widthScale:1, spacing:0};
    const prompts = this.data.language === 'ko'
      ? [role ? '여자친구 이름은 ' : '주인공 이름은 ', '이 이름으로 괜찮습니까?']
      : [this.data.prompts[role], this.data.prompts[2]];
    this.text(prompts[0] + name + (this.data.language === 'ko' ? '입니다.' : '。'), left, 143, promptStyle);
    this.text(prompts[1], this.data.language === 'ko' ? 135 : 176, 199, promptStyle);
    this.rect(235, 252, 138, 72);
    this.c.save();
    this.c.filter = 'brightness(86%)'; // Peak label intensity is 219/255 in the PS2 capture.
    this.text(this.data.language === 'ko' ? '예' : 'はい', 272, 254, {spacing:0});
    this.text(this.data.language === 'ko' ? '아니오' : 'いいえ', 272, 286, {spacing:0});
    this.c.restore();
    this.c.save();
    this.c.globalAlpha = .73;
    this.sprite('sys_fc01', 0, 73, 15, 22, 248, 265 + 32 * selection, 15, 14);
    this.c.restore();
    this.footer('confirm');
  }
}
