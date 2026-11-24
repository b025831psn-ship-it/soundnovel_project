export class NativeFont {
  constructor(blob, lookup) {
    this.blob = blob;
    this.view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
    this.lookup = new DataView(
      lookup.buffer,
      lookup.byteOffset,
      lookup.byteLength,
    );
    this.count = 2 * this.view.getUint16(0, false);
  }

  glyph(index) {
    const at = 4 * this.view.getUint16(index * 2, false);
    const next =
      index + 1 < this.count
        ? 4 * this.view.getUint16(index * 2 + 2, false)
        : this.blob.length;
    const width = this.blob[at] & 63;
    const height = this.blob[at + 1] & 63;
    const nibbles = [];
    const pixels = [];
    for (let pos = at + 2; pos < next; pos++)
      nibbles.push(this.blob[pos] >> 4, this.blob[pos] & 15);
    for (
      let pos = 0;
      pixels.length < width * height && pos < nibbles.length;
      pos++
    ) {
      const value = nibbles[pos];
      if (value !== 15) {
        pixels.push(value);
        continue;
      }
      const color = nibbles[++pos];
      const run = 4 + nibbles[++pos];
      for (let count = 0; count < run; count++) pixels.push(color);
    }
    return {
      width,
      height,
      pixels: Uint8Array.from(pixels.slice(0, width * height)),
    };
  }

  find(encoded) {
    let slot =
      (5 * (((encoded - 0x8140) >>> 8) + 16 * ((encoded - 0x8140) & 255))) &
      4095;
    for (let count = 0; count < 4096; count++, slot = (slot + 45) & 4095) {
      const key = this.lookup.getUint16(slot * 4, true);
      if (key === encoded) return this.lookup.getUint16(slot * 4 + 2, true);
      if (key === 0xffff) return -1;
    }
    return -1;
  }
}

export class TextWindow {
  constructor(names = {}) {
    this.names = names;
    this.fragments = [];
    this.wait = "none";
    this.suppressNextWait = false;
    this.afterWait = false;
    this.pageRaw = [];
    this.choiceRaw = [];
  }

  beginChoices(count) {
    this.choiceRaw = Array.from({ length: count }, () => []);
  }

  collectChoice(index, raw) {
    this.choiceRaw[index]?.push(raw);
  }

  feed(raw) {
    this.pageRaw.push(raw);
    this.wait = "none";
    for (let pos = 0; pos < raw.length; pos++) {
      const byte = raw[pos];
      if (byte > 0x80) {
        this.fragments.push(raw.slice(pos, pos + 2));
        pos++;
        this.afterWait = false;
        continue;
      }
      const control = String.fromCharCode(byte);
      const arg = "nsvcC".includes(control) ? raw[++pos] : undefined;
      if (control === "r") {
        if (this.suppressNextWait) this.suppressNextWait = false;
        else this.wait = "click";
        this.afterWait = true;
      } else if (control === "p") {
        if (this.afterWait) this.fragments.push("\n");
        this.afterWait = false;
      } else if (control === "P") {
        this.afterWait = false;
      } else if (control === "g") {
        this.fragments = [];
        this.pageRaw = [];
        this.wait = "none";
        this.afterWait = false;
      } else if (control === "o") {
        this.suppressNextWait = true;
      } else if (control === "n") {
        this.fragments.push(this.names[arg] ?? `{name:${arg}}`);
        this.afterWait = false;
      }
    }
    return this.wait;
  }
}
