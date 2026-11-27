// Touch and keyboard input for the SFC VM, counted in fields (one auto-joypad latch per field).

// SNES joypad bits as the game reads them from $4218/$4219.
export const PAD = { B: 0x8000, Y: 0x4000, SELECT: 0x2000, START: 0x1000, UP: 0x0800, DOWN: 0x0400, LEFT: 0x0200, RIGHT: 0x0100, A: 0x0080, X: 0x0040, L: 0x0020, R: 0x0010 };

// Input: what the keyboard holds, plus a queue of short presses from taps. The VM latches one
// mask per field (auto-joypad read), so presses are counted in fields: held 3, released 3.
export class InputQueue {
  constructor() { this.held = 0; this.steps = []; this.current = null; }
  tap(mask) { this.steps.push({ mask, fields: 3 }, { mask: 0, fields: 3 }); }
  choose(index) { this.steps.push({ choose: index, tries: 0 }); }
  clear() { this.steps.length = 0; this.current = null; }
  // Called once per field with the game's touch state; returns the mask for the next field.
  next(touch) {
    for (;;) {
      if (!this.current) this.current = this.steps.shift() ?? null;
      const s = this.current;
      if (!s) return this.held;
      if (s.choose != null) {
        // Move the game's own cursor to the tapped choice one press at a time, reading it back
        // each time, then press A. Waits while the list is still being built; gives up after ~2 s.
        const choice = touch?.choice;
        this.current = null;
        if (++s.tries > 120) continue;
        if (!choice?.ready) { this.current = s; return this.held; }
        const key = choice.cursor < s.choose ? PAD.DOWN : choice.cursor > s.choose ? PAD.UP : PAD.A;
        this.steps.unshift({ mask: key, fields: 3 }, { mask: 0, fields: 3 });
        if (key !== PAD.A) this.steps.splice(2, 0, s);
        continue;
      }
      if (s.fields-- > 0) return this.held | s.mask;
      this.current = null;
    }
  }
}

