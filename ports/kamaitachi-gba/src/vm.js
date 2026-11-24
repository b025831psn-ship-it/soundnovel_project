export const HANDLERS = {
  0x00: "08003708",
  0x01: "080036A8",
  0x02: "08003724",
  0x03: "080037BC",
  0x04: "08003930",
  0x08: "08003AE0",
  0x09: "08003B64",
  0x0a: "08003C3C",
  0x0b: "08003C78",
  0x0c: "08003CB0",
  0x0d: "08003CF0",
  0x0e: "08003DF0",
  0x0f: "08003E58",
  0x13: "080040A0",
  0x14: "0800411C",
  0x15: "08004154",
  0x16: "08004200",
  0x1a: "08003D30",
  0x1c: "08004574",
  0x1e: "080045F4",
  0x21: "08003D70",
  0x22: "08003DB0",
  0x23: "080046D4",
  0x25: "08003F30",
  0x29: "080048C0",
  0x2c: "080049FC",
  0x2d: "08004B10",
  0x2e: "08004B98",
  0x2f: "08004C34",
  0x40: "080051B4",
  0x41: "08005264",
  0x30: "08004C8C",
  0x31: "08004CDC",
  0x32: "08004D4C",
  0x34: "08004DD0",
  0x35: "08004E28",
  0x37: "08004EE0",
  0x3e: "08005110",
  0x45: "08005214",
  0x4b: "080057C0",
  0x4c: "080057E8",
  0x4d: "080057EC",
  0x53: "08005914",
  0x56: "08005B1C",
  0x57: "08005BA8",
  0x58: "08005C30",
  0x5e: "08005DE0",
  0x5f: "080059C0",
};

// Native handlers which short-circuit while a 57 choice candidate is being
// collected. Arguments are consumed before this gate is evaluated.
export const SUPPRESSION = Object.freeze({
  0x04: ["77e-or-78e", "u16"], 0x08: ["77e-or-78e", "u16,u8"], 0x09: ["77e-or-78e", "u16,u8"],
  0x0a: ["77e-or-78e", "u8"], 0x0b: ["77e-or-78e", "u8"], 0x0c: ["77e-or-78e", "u16"],
  0x0d: ["77e", "u8"], 0x0e: ["77e", "u8,u16"], 0x0f: ["77e", "u8,u16"], 0x1a: ["77e", "u8"],
  0x13: ["sets-77e", "choice[]"], 0x15: ["78e-or-choice-return", ""],
  0x1c: ["77e-or-78e", "u8"], 0x21: ["77e", "u8"], 0x22: ["77e", "u8"],
  0x23: ["77e-or-78e", "u8,u8"], 0x25: ["77e", "u8,u16"], 0x29: ["77e-or-78e", "u8,u16"],
  0x2c: ["77e-or-78e", ""], 0x2d: ["77e-or-78e", "u8,u16"], 0x2e: ["77e-or-78e", "u8,u8"],
  0x2f: ["77e-or-78e", "u16"], 0x30: ["77e-or-78e", "u16"], 0x31: ["77e-or-78e", "u16,u16"],
  0x32: ["77e-or-78e", "u16,u16"], 0x34: ["77e-or-78e", "u16"], 0x35: ["77e-or-78e", "u8,u16"],
  0x37: ["77e-or-78e", "u16"], 0x4d: ["77e-or-78e", "u8"], 0x53: ["77e-or-78e", "u16"],
  0x57: ["sets-77e", "choice-key[]"], 0x58: ["77e-or-78e", "u16"],
  0x5e: ["77e", "u8,u16,u16"], 0x5f: ["77e-or-78e", "u16"],
});

export class VM {
  constructor({
    banks = {},
    entryRow = 27000,
    scene = null,
    text = null,
    audio = null,
    musicMap = [],
    choiceView = null,
    trace = null,
  } = {}) {
    this.banks = banks;
    this.rows = this.indexRows(banks);
    this.scene = scene;
    this.text = text;
    this.audio = audio;
    this.musicMap = musicMap;
    this.choiceView = choiceView;
    this.currentSong = null;
    this.currentRequest = null;
    this.trace = trace;
    this.frame = 0;
    this.halted = false;
    this.waiting = "none";
    this.unimplemented = new Set();
    this.ram = {
      flags: new Uint8Array(256),
      vars: new Uint8Array(256),
      bits: new Uint8Array(256),
      stack: [],
      group: 0,
      slot: 0xffff,
      pending: 0,
      effectDisabled: 0,
      effectBypass: 0,
      updatePending: 0,
      overlayActive: 0,
      overlayMasks: new Uint16Array(4),
      audioRequest: 0xffff,
      choiceActive: 0,
      inputReady: 0,
      brightness: Array.from({ length: 11 }, (_, slot) => ({
        current: slot === 9 ? 0x8000 : 0,
        target: slot === 9 ? 0x8000 : 0,
        delta: 0,
        duration: 0,
        maximum: 0x10000,
      })),
    };
    this.gotoRow(entryRow);
  }

  indexRows(banks) {
    const rows = {};
    for (const [bankText, bytes] of Object.entries(banks)) {
      const bank = Number(bankText);
      if (bytes.length < 2) continue;
      const tableBytes = bytes[0] | (bytes[1] << 8);
      rows[bank] = [];
      for (let at = 0; at < tableBytes; at += 2) {
        rows[bank].push(bytes[at] | (bytes[at + 1] << 8));
      }
    }
    return rows;
  }

  gotoRow(rowId) {
    const bank = Math.floor(rowId / 1000);
    const row = rowId % 1000;
    const offset = this.rows[bank]?.[row];
    if (offset === undefined) {
      this.halted = true;
      return false;
    }
    this.bank = bank;
    this.offset = offset;
    return true;
  }

  byte() {
    return this.banks[this.bank][this.offset++];
  }

  word() {
    const lo = this.byte();
    return lo | (this.byte() << 8);
  }

  textBytes() {
    const bytes = [];
    while (true) {
      const value = this.byte();
      if (value === 0) return Uint8Array.from(bytes);
      bytes.push(value);
      if (value > 0x80 || "nsvcC".includes(String.fromCharCode(value)))
        bytes.push(this.byte());
    }
  }

  write(kind, index, value) {
    this.ram[kind][index] = value;
    this.writes.push(`${kind}:${index}=${value}`);
  }

  branch(rowId) {
    if (!this.gotoRow(rowId)) this.halted = true;
  }

  suppressed(opcode) {
    const gate = SUPPRESSION[opcode]?.[0];
    const blocked = this.ram.effectDisabled === 1 ||
      (gate === "77e-or-78e" && this.ram.effectBypass === 1);
    if (blocked) {
      this.ram.updatePending = 1;
      this.writes.push("updatePending=1");
    }
    return blocked;
  }

  choice(opcode) {
    const count = this.byte();
    const index = this.byte();
    const entries = [];
    for (let n = 0; n <= count; n++) {
      const row = this.word();
      entries.push(opcode === 0x57 ? { row, key: this.word() } : { row });
    }
    this.choiceState = { opcode, count, index, entries };
    this.choiceSelection = 0;
    if (opcode === 0x57) {
      this.ram.choiceActive = 1;
      this.ram.effectDisabled = 1;
      this.text?.beginChoices?.(entries.length);
    } else this.waiting = "choice";
    return [
      count,
      index,
      ...entries.flatMap((entry) =>
        opcode === 0x57 ? [entry.row, entry.key] : [entry.row],
      ),
    ];
  }

  step() {
    if (this.halted || this.waiting !== "none") return false;
    const startBank = this.bank;
    const startOffset = this.offset;
    const opcode = this.byte();
    const args = [];
    this.writes = [];
    switch (opcode) {
      case 0x00: {
        const raw = this.textBytes();
        args.push(...raw);
        if (this.ram.choiceActive && this.collectingChoice !== undefined)
          this.text?.collectChoice?.(this.collectingChoice, raw);
        else this.waiting = this.text?.feed(raw) ?? "none";
        break;
      }
      case 0x01: {
        const row = this.word();
        args.push(row);
        this.branch(row);
        break;
      }
      case 0x02: {
        const row = this.word();
        args.push(row);
        this.ram.stack.push({ bank: this.bank, offset: this.offset });
        if (this.ram.choiceActive) {
          const index = this.choiceState?.entries.findIndex((entry) => entry.row === row);
          if (index >= 0) this.collectingChoice = index;
        }
        this.branch(row);
        break;
      }
      case 0x03: {
        const target = this.ram.stack.pop();
        if (target) Object.assign(this, target);
        else this.halted = true;
        break;
      }
      case 0x04: {
        const request = this.word();
        args.push(request);
        if (!this.suppressed(opcode)) this.scene?.request(request, this.ram);
        break;
      }
      case 0x08:
      case 0x09: {
        const raw = this.word();
        const slot = this.byte();
        args.push(raw, slot);
        if (this.suppressed(opcode)) break;
        let duration = raw === 0x7f ? (opcode === 0x08 ? 1 : 4) : Math.floor(raw * 3 / 4);
        if (opcode === 0x09 && this.ram.engineMode === 0x10) duration = 1;
        const configure = (index) => {
          const effect = this.ram.brightness[index];
          if (!effect || (opcode === 0x08 && effect.current === 0)) return;
          let target = opcode === 0x08 ? 0 : Math.trunc(effect.maximum / 2);
          if (opcode === 0x09 && this.ram.brightness[0].maximum !== 0x10000)
            target = (target * this.ram.brightness[0].maximum) >> 8;
          effect.target = target;
          effect.duration = Math.max(1, duration);
          effect.delta = Math.trunc((target - effect.current) / effect.duration);
        };
        configure(slot);
        if (opcode === 0x09 && slot !== 5) configure(5);
        if (opcode === 0x08 && slot === 1 && this.ram.mirrorBrightness === 1)
          configure(2);
        if (opcode === 0x09) this.ram.updatePending = 1;
        break;
      }
      case 0x0a: {
        const slot = this.byte();
        args.push(slot);
        if (!this.suppressed(opcode)) {
          this.ram.slot = 0xffff;
          this.writes.push(`slot=${this.ram.slot}`);
        }
        break;
      }
      case 0x0b: {
        args.push(this.byte());
        this.suppressed(opcode);
        break;
      }
      case 0x0c: {
        this.waitFrames = this.word();
        args.push(this.waitFrames);
        if (!this.suppressed(opcode))
          this.waiting = this.waitFrames ? "delay" : "none";
        break;
      }
      case 0x0d:
      case 0x1a: {
        const index = this.byte();
        args.push(index);
        if (this.suppressed(opcode)) break;
        this.write("flags", index, opcode === 0x0d ? 1 : 0);
        break;
      }
      case 0x0e:
      case 0x0f: {
        const index = this.byte();
        const row = this.word();
        args.push(index, row);
        if (this.suppressed(opcode)) break;
        if ((opcode === 0x0e) === (this.ram.flags[index] === 0))
          this.branch(row);
        break;
      }
      case 0x13:
      case 0x57:
        args.push(...this.choice(opcode));
        break;
      case 0x14:
        args.push(this.byte());
        break;
      case 0x15: {
        if (this.ram.effectBypass === 1) {
          this.ram.updatePending = 1;
          this.writes.push("updatePending=1");
          break;
        }
        if (this.ram.choiceActive) {
          const target = this.ram.stack.pop();
          if (target) Object.assign(this, target);
          this.collectingChoice = undefined;
        }
        break;
      }
      case 0x16:
        this.waiting = "choice";
        this.choiceView?.show?.(this.text?.choiceRaw ?? [], this.choiceSelection);
        break;
      case 0x21:
      case 0x22: {
        const index = this.byte();
        args.push(index);
        if (this.suppressed(opcode)) break;
        this.write("bits", index, opcode === 0x21 ? 1 : 0);
        break;
      }
      case 0x1c: {
        args.push(this.byte());
        this.suppressed(opcode);
        break;
      }
      case 0x1e: {
        const offset = this.word();
        args.push(offset);
        if (this.ram.inputReady) this.offset = offset;
        this.ram.updatePending = 1;
        break;
      }
      case 0x23: {
        const a = this.byte();
        const b = this.byte();
        args.push(a, b);
        if (this.suppressed(opcode)) break;
        this.ram.group = (31 - a) >> 3;
        this.writes.push(`group=${this.ram.group}`);
        break;
      }
      case 0x25: {
        const index = this.byte();
        const row = this.word();
        args.push(index, row);
        if (this.suppressed(opcode)) break;
        if (this.ram.bits[index]) this.branch(row);
        break;
      }
      case 0x29: {
        args.push(this.byte(), this.word());
        this.suppressed(opcode);
        break;
      }
      case 0x2e: {
        args.push(this.byte(), this.byte());
        this.suppressed(opcode);
        break;
      }
      case 0x2f: {
        const raw = this.word();
        const request = ((raw & 0xff) << 8) | (raw >> 8);
        args.push(raw, request);
        if (this.suppressed(opcode)) break;
        if (request <= 999) {
          if (this.currentSong !== null) this.audio?.stopSong(this.currentSong);
          this.currentSong = null;
          this.currentRequest = null;
          this.ram.audioRequest = 0xffff;
        } else if (request !== 0xffff) {
          this.audio?.stopEffect?.(request - 1000);
        }
        this.ram.updatePending = 1;
        this.writes.push("updatePending=1");
        break;
      }
      case 0x2c:
        this.suppressed(opcode);
        break;
      case 0x2d: {
        const high = this.byte();
        const lowPair = this.word();
        const request =
          ((high << 8) + ((lowPair & 0xff) << 8) + (lowPair >> 8)) & 0xffff;
        args.push(high, lowPair, request);
        if (this.suppressed(opcode)) break;
        this.scene?.overlay?.(request, this.ram);
        this.ram.overlayActive = 1;
        for (let index = 0; index < this.ram.overlayMasks.length; index++) {
          const value = this.ram.overlayMasks[index];
          const signedValue = (value << 16) >> 16;
          if (
            signedValue === request ||
            (request === 0 && signedValue === 13)
          )
            this.ram.overlayMasks[index] = 0xffff;
        }
        this.writes.push(`overlay=${request}`);
        break;
      }
      case 0x30: {
        const request = this.word();
        args.push(request);
        if (this.suppressed(opcode)) break;
        this.startAudio(request);
        break;
      }
      case 0x31: {
        const rawSpeed = this.word();
        const request = this.word();
        args.push(rawSpeed, request);
        if (this.suppressed(opcode)) break;
        const speed =
          (rawSpeed > 99 ? Math.floor(rawSpeed / 16) : rawSpeed) * 10;
        if (request !== 0xffff && request <= 999) {
          this.audio?.fadeOut(0, speed);
          this.currentRequest = null;
        } else if (request >= 1000 && request !== 0xffff) {
          this.audio?.fadeOutEffect?.(request - 1000, speed);
        }
        break;
      }
      case 0x32: {
        const rawSpeed = this.word();
        const request = this.word();
        args.push(rawSpeed, request);
        if (this.suppressed(opcode)) break;
        const speed =
          (rawSpeed > 99 ? Math.floor(rawSpeed / 16) : rawSpeed) * 10;
        this.pendingAudio = { request, speed };
        this.waitFrames = 1;
        this.waiting = "audio-start";
        break;
      }
      case 0x34: {
        const request = this.word();
        args.push(request);
        if (this.suppressed(opcode)) break;
        if (this.audio && !this.audio.isComplete?.(request))
          this.waiting = "audio";
        break;
      }
      case 0x35: {
        args.push(this.byte(), this.word());
        this.suppressed(opcode);
        break;
      }
      case 0x37: {
        args.push(this.word());
        this.suppressed(opcode);
        break;
      }
      case 0x3e:
        break;
      case 0x40: {
        const index = this.byte();
        const value = this.byte();
        const row = this.word();
        args.push(index, value, row);
        if (this.ram.vars[index] === value) this.branch(row);
        break;
      }
      case 0x41: {
        const index = this.byte();
        const value = this.byte();
        args.push(index, value);
        this.write("vars", index, value);
        break;
      }
      case 0x45: {
        args.push(this.word(), this.word());
        if (
          this.ram.effectBypass !== 1 &&
          this.banks[this.bank][this.offset] === 0x0a
        )
          this.offset += 2;
        break;
      }
      case 0x4b:
        args.push(this.word());
        break;
      case 0x4c:
        break;
      case 0x4d: {
        args.push(this.byte());
        this.suppressed(opcode);
        break;
      }
      case 0x53: {
        const effect = this.word();
        args.push(effect);
        this.suppressed(opcode);
        break;
      }
      case 0x56: {
        const row = this.word();
        const key = this.word();
        args.push(row, key);
        this.branch(row);
        break;
      }
      case 0x5e: {
        const index = this.byte();
        const row = this.word();
        const key = this.word();
        args.push(index, row, key);
        if (this.suppressed(opcode)) break;
        if (this.ram.bits[index]) this.branch(row);
        break;
      }
      case 0x5f: {
        args.push(this.word());
        this.suppressed(opcode);
        break;
      }
      case 0x58: {
        args.push(this.word());
        this.suppressed(opcode);
        break;
      }
      default:
        this.unimplemented.add(opcode);
        this.halted = true;
    }
    this.trace?.({
      frame: this.frame,
      bank: startBank,
      offset: startOffset,
      opcode,
      args,
      group: this.ram.group,
      slot: this.ram.slot,
      pending: this.ram.pending,
      sp: this.ram.stack.length,
      writes: [...this.writes],
      wait: this.waiting,
    });
    return !this.halted;
  }

  startAudio(request, speed = 0) {
    if (request >= 1000) {
      this.audio?.startEffect?.(request - 1000, speed);
      return;
    }
    if (request === this.currentRequest) return;
    this.ram.audioRequest = request;
    const song = this.musicMap[request] ?? -1;
    if (song < 0) {
      if (this.currentSong !== null) this.audio?.stopSong(this.currentSong);
      this.currentSong = null;
      this.currentRequest = request;
      return;
    }
    if (this.currentSong !== null) this.audio?.stopSong(this.currentSong);
    this.audio?.startSong(song);
    if (speed) this.audio?.fadeInSong?.(song, speed);
    this.currentSong = song;
    this.currentRequest = request;
  }

  resume(rowIndex = null) {
    if (this.waiting === "choice") {
      if (rowIndex === null) rowIndex = this.choiceSelection;
      const row = this.choiceState.entries[rowIndex]?.row;
      this.waiting = "none";
      this.ram.choiceActive = 0;
      this.ram.effectDisabled = 0;
      this.choiceView?.hide?.();
      if (row !== undefined) this.branch(row);
      return;
    }
    this.waiting = "none";
  }

  moveChoice(delta) {
    if (this.waiting !== "choice" || !this.choiceState) return;
    const length = this.choiceState.entries.length;
    this.choiceSelection = (this.choiceSelection + delta + length) % length;
    this.choiceView?.show?.(this.text?.choiceRaw ?? [], this.choiceSelection);
  }

  vblank(budget = 1024) {
    this.frame++;
    this.ram.updatePending = 0;
    if (this.waiting === "delay" && --this.waitFrames <= 0)
      this.waiting = "none";
    if (this.waiting === "audio-start" && --this.waitFrames <= 0) {
      const { request, speed } = this.pendingAudio;
      this.startAudio(request, speed);
      this.pendingAudio = null;
      this.waiting = "none";
    }
    for (let slot = 0; slot < this.ram.brightness.length; slot++) {
      const effect = this.ram.brightness[slot];
      if (effect.duration <= 0) continue;
      effect.duration--;
      effect.current = effect.duration === 0
        ? effect.target
        : effect.current + effect.delta;
      this.scene?.brightness?.(slot, effect.current, effect.maximum);
    }
    for (let count = 0; count < budget && this.step(); count++);
  }
}
