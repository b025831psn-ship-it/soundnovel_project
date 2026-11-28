import {drawBitmapGlyph} from './text-display.mjs';

const PARTICLES = Object.freeze({
  '은(는)': ['은', '는'], '이(가)': ['이', '가'], '을(를)': ['을', '를'], '과(와)': ['과', '와'],
  '(이)라고': ['이라고', '라고'], '(이)라는': ['이라는', '라는'], '(이)랑': ['이랑', '랑'],
  '(이)야': ['이야', '야'], '이었다(였다)': ['이었다', '였다'],
});
const PAIRED = /\[n\]([A-Za-z0-9_-]+)(은\(는\)|이\(가\)|을\(를\)|과\(와\)|\(으\)로|\(이\)라고|\(이\)라는|\(이\)랑|\(이\)야|이었다\(였다\))/g;

export function finalConsonant(value) {
  const code = Array.from(String(value).trim()).at(-1)?.codePointAt(0);
  if (code === undefined) return 0;
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
  if (code >= 0x3131 && code <= 0x314e) return 1;
  return 0;
}

export function formatKoreanText(value, names = {}) {
  return String(value)
    .replace(PAIRED, (whole, id, marker) => {
      const name = names[id];
      if (typeof name !== 'string' || !name) return whole;
      const jong = finalConsonant(name);
      if (marker === '(으)로') return name + (jong && jong !== 8 ? '으로' : '로');
      return name + PARTICLES[marker][jong ? 0 : 1];
    })
    .replace(/\[n\]([A-Za-z0-9_-]+)/g, (whole, id) => names[id] || whole);
}

export function tokenizeKoreanText(value, names = {}) {
  const text = formatKoreanText(value, names);
  const tokens = [];
  for (let cursor = 0; cursor < text.length;) {
    const control = /^\[(r|p|k|g|q|[0-9a-f]|w[0-9a-f]{2}|l[0-9a-f]{2},[0-9a-f]{2})\]/i.exec(text.slice(cursor));
    if (control) {
      tokens.push({type: 'control', value: control[1].toLowerCase()});
      cursor += control[0].length;
      continue;
    }
    const character = String.fromCodePoint(text.codePointAt(cursor));
    if (character === '[') throw new RangeError(`Unknown translation token at ${cursor}`);
    tokens.push({type: 'glyph', value: character});
    cursor += character.length;
  }
  return tokens;
}

export class KoreanTextDisplay {
  constructor(frame, font, names = {}, palettes = [[0xbdd7, 0x39c7]]) {
    this.frame = frame; this.font = font; this.names = names; this.palettes = palettes;
    this.background = frame.pixels.slice(); this.x = 0; this.line = 0; this.offset = 0;
    this.delay = 2; this.wait = null; this.colorIndex = 0; this.tokens = [];
    this.autoPages = 0;
  }

  setText(value) { this.tokens = tokenizeKoreanText(value, this.names); this.offset = 0; }

  tick(confirmed = false) {
    if (this.wait) { if (!confirmed) return {type: this.wait}; this.wait = null; }
    if (this.delay > 0) { this.delay--; return {type: 'delay'}; }
    this.delay = 1;
    const token = this.tokens[this.offset++];
    if (!token) return {type: 'end'};
    if (token.type === 'control') return this.control(token.value);
    return this.glyph(token.value);
  }

  glyph(character) {
    const metric = this.font.metrics[character];
    if (!metric) throw new RangeError(`Missing Korean glyph ${character}`);
    if (this.x + metric.advance > 270) { this.x = 0; this.line++; }
    if (this.line > 8) {
      this.frame.pixels.set(this.background); this.x = 0; this.line = 0; this.autoPages++; this.wait = 'confirm';
      this.offset--;
      return {type: 'autoPage'};
    }
    if (metric.index !== null) {
      drawBitmapGlyph(this.frame, this.font.glyphs, metric.index * 26, 21 + this.x, 24 + 24 * this.line,
        this.palettes[this.colorIndex]);
    }
    this.x += metric.advance;
    return {type: 'glyph', character};
  }

  control(value) {
    if (value === 'r') { this.x = 0; this.line++; }
    else if (value === 'p') { this.frame.pixels.set(this.background); this.x = 0; this.line = 0; }
    else if (value === 'k') this.wait = 'confirm';
    else if (value === 'q') this.wait = 'choice';
    else if (value[0] === 'w') this.delay = parseInt(value.slice(1), 16);
    else if (value[0] === 'l') {
      const [column, line] = value.slice(1).split(',').map(part => parseInt(part, 16));
      this.x = column * 15; this.line = line;
    } else if (/^[0-9a-f]$/.test(value)) this.colorIndex = parseInt(value, 16);
    return {type: 'control', code: value};
  }
}
