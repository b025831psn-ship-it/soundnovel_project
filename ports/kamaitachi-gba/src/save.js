// Bookmarks (しおり): the three books of 0800E328. The cartridge writes an 8 KB flash image per
// book (0800A838) holding the scenario state at the start of the current page; 本を読む
// (0800AEA4) puts it back, plays the welcome again and, at 1D 67, carries on from that page.
//
// This port's VM keeps its state in named fields rather than at the cartridge's addresses, so a
// book here holds the same moment as a snapshot of those fields: the page-start position, the
// scenario RAM, the picture and the music request. Books live in the browser's localStorage.

const KEY = (book) => `kamaitachi-gba.book.${book}`;

function plain(value) {
  if (ArrayBuffer.isView(value)) return { $bytes: Array.from(value) };
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = plain(v);
    return out;
  }
  return value;
}

function typed(value, like) {
  if (value && typeof value === "object" && "$bytes" in value) {
    const Type = like?.constructor && ArrayBuffer.isView(like) ? like.constructor : Uint8Array;
    return Type.from(value.$bytes);
  }
  if (Array.isArray(value)) return value.map((v, i) => typed(v, like?.[i]));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = typed(v, like?.[k]);
    return out;
  }
  return value;
}

export class Books {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
  }

  read(book) {
    try {
      const text = this.storage?.getItem(KEY(book));
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  write(book, data) {
    try {
      this.storage?.setItem(KEY(book), JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  erase(book) {
    try { this.storage?.removeItem(KEY(book)); } catch { /* private mode */ }
  }

  copy(from, to) {
    const data = this.read(from);
    if (data) this.write(to, data);
  }

  // 0800B79C: any book in use.
  any() {
    return [0, 1, 2].some((book) => this.read(book));
  }
}

// The scenario state at the start of a page (taken by the VM before the page's first text).
export function pageState(vm, startBank, startOffset, extra = {}) {
  return plain({
    bank: startBank,
    offset: startOffset,
    ram: vm.ram,
    picture: vm.scene?.current ?? null,
    song: vm.sound?.request ?? -1,
    ...extra,
  });
}

// Puts a book's scenario RAM back (0800AEA4, before the welcome plays).
// The brightness slots stay as they are: the load has just blacked them out to fade back in.
export function restoreData(vm, state) {
  const { brightness, ...ram } = typed(state.ram, vm.ram);
  Object.assign(vm.ram, ram);
}

// Moves the scenario to the book's page start (1D 67); that page is then typed from its start.
export function restorePosition(vm, state) {
  vm.bank = state.bank;
  vm.offset = state.offset;
  vm.waiting = "none";
  vm.choiceState = null;
  vm.collectingChoice = undefined;
}
