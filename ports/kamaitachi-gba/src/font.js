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

  // Another language's font container and lookup (the objects holding this font stay the same).
  replace(blob, lookup) {
    this.blob = blob;
    this.view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
    this.lookup = new DataView(lookup.buffer, lookup.byteOffset, lookup.byteLength);
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
    this.suppress = false; // 02024DFC ('o')
    this.waited = false; // 02024DFA: a click wait with no glyph since
    this.deferredWait = false; // 02024E1B
    this.quote = false; // 02024DF6: inside 「」
    this.doubleQuote = false; // 02024DF8: inside 『』
    this.pageRaw = [];
    this.choiceRaw = [];
    this.rest = null; // the text after a wait (02024E24 stops there until the press)
  }

  beginChoices(count) {
    this.choiceRaw = Array.from({ length: count }, () => []);
  }

  collectChoice(index, raw) {
    this.choiceRaw[index]?.push(raw);
  }

  // The click wait is over (02024DFA released): a page that ended in a lone 'p' + 'g' is cleared
  // now, even when other opcodes run before the next text.
  resumed() {
    if (!this.pendingClear) return;
    this.pendingClear = false;
    this.fragments = [];
    this.pageRaw = [];
  }

  // 080080C4 after a choice: an empty page.
  clearPage() {
    this.pendingClear = false;
    this.rest = null;
    this.fragments = [];
    this.pageRaw = [];
  }

  // The control codes of 08007880..08008018 (table 080076A0), per window:
  //  r  (08007908) new line (x back to 8, y + 20), skipped inside 「」/『』 (02024DF6/F8, set
  //     and cleared by the Shift JIS 8175/8176 and 8177/8178 glyphs) and after 'o' (02024DFC);
  //  @  (080079A4) new line, always;  L (08007E50) new line when x is past 0xC3;
  //  o  (08007C5C) 02024DFC = 1: the next 'r' is skipped and the next 'p'/'P' does not wait
  //     (02024E1B: the wait moves to the page's 'g');
  //  p  (08007A40) the click wait (02024DFA), unless a wait came just before with no glyph since;
  //  P  (08007AA4) the same, but no wait inside 「」/『』 either;
  //  g  (08007B70) clears the page, after a wait first when one was moved there.
  feed(raw, continued = false) {
    this.resumed();
    // pageRaw keeps whole runs: the rest of a run after a wait belongs to the run already kept.
    if (!continued || !this.pageRaw.length) this.pageRaw.push(raw);
    this.wait = "none";
    this.rest = null;
    for (let pos = 0; pos < raw.length; pos++) {
      if (this.wait !== "none") {
        // The window stops at the wait; the rest of the run is read after the press.
        this.rest = raw.slice(pos);
        break;
      }
      const byte = raw[pos];
      if (byte > 0x80) {
        const code = (byte << 8) | raw[pos + 1];
        this.fragments.push(raw.slice(pos, pos + 2));
        pos++;
        this.waited = false;
        if (code === 0x8175) this.quote = true;
        else if (code === 0x8176) this.quote = false;
        else if (code === 0x8177) this.doubleQuote = true;
        else if (code === 0x8178) this.doubleQuote = false;
        continue;
      }
      const control = String.fromCharCode(byte);
      const arg = "nsvcC".includes(control) ? raw[++pos] : undefined;
      const quoted = this.quote || this.doubleQuote;
      if (control === "r") {
        if (!quoted && !this.suppress) this.fragments.push("\n");
      } else if (control === "@") {
        this.fragments.push("\n");
      } else if (control === "L") {
        this.fragments.push({ breakPast: 0xc3 });
      } else if (control === "o") {
        this.suppress = true;
      } else if (control === "p" || control === "P") {
        const clears = raw[pos + 1] === 0x67;
        if (this.waited || (control === "P" && quoted)) this.suppress = false;
        else if (this.suppress) { this.suppress = false; this.deferredWait = true; }
        else {
          this.wait = "click";
          this.waited = true;
          this.deferredWait = false; // the press that ends this wait also ends a moved one
          if (clears) { pos++; this.pendingClear = true; }
        }
      } else if (control === "g") {
        if (this.deferredWait) {
          this.deferredWait = false;
          this.wait = "click";
          this.waited = true;
          this.pendingClear = true;
        } else {
          this.fragments = [];
          this.pageRaw = [];
          this.wait = "none";
        }
      } else if (control === "c") {
        // 08007CC2: foreground n for the glyphs that follow (C sets n + 8).
        this.fragments.push({ objColor: arg - 0x30 });
      } else if (control === "C") {
        // Text color: C4 (light blue) marks the player's names, C0 returns to white.
        this.fragments.push({ color: arg - 0x30 });
      } else if (control === "n") {
        this.fragments.push(this.names[arg] ?? `{name:${arg}}`);
        this.waited = false;
      }
    }
    return this.wait;
  }
}
