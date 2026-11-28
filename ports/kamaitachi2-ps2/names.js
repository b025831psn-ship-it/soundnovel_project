// Each kana column starts a new block of rows. The leftmost cell is reserved
// for its heading even when the list of kanji wraps onto a continuation row.
export function keyboardGroups(groups) {
  return groups.map(group => {
    const rows = [];
    for (const line of group.split('\n')) {
      const [heading, ...rest] = Array.from(line);
      for (let i = 0; i < rest.length || i === 0; i += 14) {
        rows.push([i ? null : heading, ...rest.slice(i, i + 14)]);
      }
    }
    return rows;
  });
}

export const koreanKeyboardGroups = [
  [['닿','ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ'],
   [null,'ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']],
  [['홀','ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ'],
   [null,'ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']],
];

const LEADS = Array.from('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ');
const VOWELS = Array.from('ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ');
const TAILS = ['', ...Array.from('ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ')];
const TAIL_FROM_LEAD = new Set(Array.from('ㄱㄲㄴㄷㄹㅁㅂㅅㅆㅇㅈㅊㅋㅌㅍㅎ'));

export function appendHangul(value, glyph) {
  if (!LEADS.includes(glyph) && !VOWELS.includes(glyph)) return value + glyph;
  const chars = Array.from(value), last = chars.at(-1);
  if (VOWELS.includes(glyph) && LEADS.includes(last)) {
    chars[chars.length - 1] = String.fromCharCode(0xac00 + LEADS.indexOf(last) * 588 + VOWELS.indexOf(glyph) * 28);
    return chars.join('');
  }
  if (VOWELS.includes(glyph) && last) {
    const code = last.charCodeAt(0) - 0xac00;
    const tail = code >= 0 && code < 11172 ? code % 28 : 0;
    const lead = TAILS[tail];
    if (tail && LEADS.includes(lead)) {
      chars[chars.length - 1] = String.fromCharCode(last.charCodeAt(0) - tail);
      chars.push(String.fromCharCode(0xac00 + LEADS.indexOf(lead) * 588 + VOWELS.indexOf(glyph) * 28));
      return chars.join('');
    }
  }
  if (last && TAIL_FROM_LEAD.has(glyph)) {
    const code = last.charCodeAt(0) - 0xac00;
    if (code >= 0 && code < 11172 && code % 28 === 0) {
      chars[chars.length - 1] = String.fromCharCode(last.charCodeAt(0) + TAILS.indexOf(glyph));
      return chars.join('');
    }
  }
  return value + glyph;
}

export class NameEditor {
  constructor(groups, initial) {
    this.groups = groups;
    this.initial = initial;
    this.value = initial;
    this.group = this.row = this.column = this.preferredColumn = this.scroll = 0;
  }

  get rows() { return this.groups[this.group]; }

  groupBy(delta) {
    this.group = (this.group + delta + this.groups.length) % this.groups.length;
    this.preferredColumn = this.column = this.row = this.scroll = 0;
  }

  move(dx, dy) {
    if (dy) {
      const onHeading = this.column === 0;
      const previousRow = this.row;
      const visibleRow = this.row - this.scroll;
      do {
        this.row = (this.row + dy + this.rows.length) % this.rows.length;
      } while (onHeading && this.rows[this.row][0] === null);
      if (onHeading) {
        const lastScroll = Math.max(0, this.rows.length - 8);
        const wrapped = dy > 0 ? this.row <= previousRow : this.row >= previousRow;
        if (wrapped) this.scroll = dy > 0 ? 0 : lastScroll;
        else this.scroll = Math.max(0, Math.min(lastScroll, this.row - visibleRow));
        return;
      }
    }
    const line = this.rows[this.row];
    const first = line[0] === null ? 1 : 0;
    const length = line.length - first;
    if (dx) {
      this.column = first + (this.column - first + dx + length) % length;
      this.preferredColumn = this.column;
    } else this.column = Math.min(line.length - 1, Math.max(first, this.preferredColumn));
    this.scroll = Math.min(this.row, Math.max(this.scroll, this.row - 7));
  }

  add(selected) {
    const glyph = selected ?? this.rows[this.row][this.column];
    if (!glyph) return;
    const composed = appendHangul(this.value, glyph);
    if (Array.from(composed).length <= 6) this.value = composed;
  }

  erase() { this.value = this.value.slice(0, -1); }

  finish() {
    if (!this.value) this.value = this.initial;
    return this.value;
  }
}

export class DirectionRepeat {
  direction = '';
  nextRepeat = 0;

  advance(direction, now) {
    if (direction !== this.direction) {
      this.direction = direction;
      this.nextRepeat = now + 18 * 1000 / 59.94;
      return Boolean(direction);
    }
    if (!direction || now < this.nextRepeat) return false;
    const interval = 6 * 1000 / 59.94;
    this.nextRepeat += (1 + Math.floor((now - this.nextRepeat) / interval)) * interval;
    return true;
  }
}
