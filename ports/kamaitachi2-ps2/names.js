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

export class NameEditor {
  constructor(groups, initial) {
    this.groups = groups;
    this.initial = initial;
    this.value = initial;
    this.group = this.row = this.column = this.scroll = 0;
  }

  get rows() { return this.groups[this.group]; }

  groupBy(delta) {
    this.group = (this.group + delta + this.groups.length) % this.groups.length;
    this.column = this.row = this.scroll = 0;
  }

  move(dx, dy) {
    if (dy) this.row = (this.row + dy + this.rows.length) % this.rows.length;
    const line = this.rows[this.row];
    const first = line[0] === null ? 1 : 0;
    const length = line.length - first;
    if (dx) this.column = first + (this.column - first + dx + length) % length;
    else this.column = Math.min(line.length - 1, Math.max(first, this.column));
    this.scroll = Math.min(this.row, Math.max(this.scroll, this.row - 7));
  }

  add() {
    const glyph = this.rows[this.row][this.column];
    if (glyph) this.value = this.value.slice(0, 5) + glyph;
  }

  erase() { this.value = this.value.slice(0, -1); }

  finish() {
    if (!this.value) this.value = this.initial;
    return this.value;
  }
}
