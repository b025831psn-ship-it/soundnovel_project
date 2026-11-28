const compare = [
  (a,b) => a === b, (a,b) => a !== b, (a,b) => a < b,
  (a,b) => a > b, (a,b) => a <= b, (a,b) => a >= b,
];

function u16(bytes, offset) {
  return bytes[offset]*256 + bytes[offset+1];
}

function flagKey(bank, index) {
  return (bank >> 4 ? 256 : 0) + index;
}

// eveComBranch reads the table in order. The first matching comparison
// replaces the number of selectable rows, while the cursor consumes them all.
function visibleChoiceCount(bytes, flags, count) {
  const conditions = bytes[3] & 15;
  const value = flags[flagKey(bytes[4], bytes[5])] ?? 0;
  let visible = 0;
  for (let i = 0; i < conditions; i++) {
    const rule = bytes[6 + 2 * i];
    visible = rule & 15;
    if (compare[rule >> 4](value, bytes[7 + 2 * i])) break;
  }
  if (visible < 1 || visible > count) throw new Error("Invalid conditional choice count");
  return visible;
}

export class Scenario {
  constructor(rows, state) {
    this.rows = rows;
    this.state = state ? structuredClone(state) : {
      page: 0, item: 0, flags: {}, visited: {}, marks: {}, menu: null
    };
    if (!rows[this.state.page] || !Number.isInteger(this.state.item) ||
        this.state.item < 0 || this.state.item > rows[this.state.page].items.length) {
      throw new Error("Invalid scenario cursor");
    }
  }

  jump(page) {
    if (!this.rows[page]) throw new Error("Invalid branch target " + page);
    this.state.visited[this.state.page] = true;
    this.state.page = page;
    this.state.item = 0;
  }

  choose(index) {
    const menu = this.state.menu;
    if (!menu || !Number.isInteger(index) || !menu.options[index]) {
      throw new Error("Invalid choice");
    }
    this.state.flags[menu.key] = index + 1;
    this.state.menu = null;
    this.jump(menu.options[index].target);
  }

  branch(bytes, items) {
    const s = this.state;
    const type = bytes[0] >> 4, count = bytes[0] & 15;
    if (type === 0 || type === 8) {
      const options = items.slice(s.item,s.item+count);
      if (options.length !== count || options.some(x => x.kind !== "choice")) {
        throw new Error("Invalid choice table");
      }
      s.item += count;
      s.menu = {kind:"choice", key:flagKey(bytes[1],bytes[2]), options};
      if (type === 8) {
        const visible = visibleChoiceCount(bytes, s.flags, count);
        s.menu.options = options.slice(0, visible);
        s.menu.condition = Array.from(bytes.slice(3, 6 + 2 * (bytes[3] & 15)));
      }
      return s.menu;
    }
    if (type === 1 || type === 9) {
      s.visited[s.page] = true;
      for (let i = 1; i < 1+6*count; i += 6) {
        const value = s.flags[flagKey(bytes[i],bytes[i+1])] ?? 0;
        if (compare[bytes[i+2]](value,bytes[i+3])) {
          this.jump(u16(bytes,i+4));
          return;
        }
      }
      if (type === 9) this.jump(u16(bytes,1+count*6));
      return;
    }
    if (type === 2) this.jump(u16(bytes,1));
    else if (type === 3) {
      if (s.visited[u16(bytes,1)]) this.jump(u16(bytes,3));
    } else return {kind:"specialBranch", bytes};
  }

  next() {
    const s = this.state;
    if (s.ending) return s.ending;
    if (s.menu) return s.menu;
    for (let steps=0; steps<10000; steps++) {
      const items = this.rows[s.page].items;
      if (s.item === items.length) {
        if (!this.rows[s.page+1]) return {kind:"end"};
        s.page++;
        s.item = 0;
        continue;
      }
      const item = items[s.item++];
      if (item.kind === "text") return item;
      if (item.kind !== "command") throw new Error("Choice outside menu");
      const bytes = Uint8Array.from(item.args.match(/../g), hex => parseInt(hex,16));
      if (item.opcode === 4) {
        const event = this.branch(bytes,items);
        if (event) return event;
      } else if (item.opcode === 5 && bytes[0] === 0x40) {
        s.marks[bytes[1]] = true;
      } else if (item.opcode === 5 && bytes[0] === 0) {
        s.flags[flagKey(bytes[1],bytes[2])] = 1;
      } else if (item.opcode === 1 && bytes[0] === 2) {
        s.textRow = bytes[1] >> 4;
        s.textColumn = bytes[1] & 15;
        return {kind: "textPosition", id: item.id, row: s.textRow, column: s.textColumn};
      } else if (item.opcode === 6) {
        // eveComEnding unpacks the same fields consumed by eveExeBookFinish.
        s.ending = {kind: "ending", id: item.id, type: bytes[0],
          number: bytes[1] >> 4, sound: bytes[1] & 15};
        return s.ending;
      } else if (item.opcode === 8 && bytes[0] === 3 && bytes[1] === 1) {
        return {kind: "movie", id: item.id, index: bytes[2]};
      } else return {...item, bytes};
    }
    throw new Error("Scenario did not reach an input or presentation event");
  }
}
