import { SceneAudio } from "../sound/scene-audio.js";
import { Effects } from "../sound/effects.js";
export const HANDLERS = {
  0x00: "08003708",
  0x01: "080036A8",
  0x02: "08003724",
  0x03: "080037BC",
  0x04: "08003930",
  0x05: "080039D0",
  0x08: "08003AE0",
  0x09: "08003B64",
  0x0a: "08003C3C",
  0x0b: "08003C78",
  0x0c: "08003CB0",
  0x0d: "08003CF0",
  0x0e: "08003DF0",
  0x0f: "08003E58",
  0x12: "08004008",
  0x13: "080040A0",
  0x14: "0800411C",
  0x15: "08004154",
  0x16: "08004200",
  0x17: "08004478",
  0x18: "080044D0",
  0x19: "0800450C",
  0x1a: "08003D30",
  0x1c: "08004574",
  0x1d: "080045B4",
  0x1e: "080045F4",
  0x21: "08003D70",
  0x22: "08003DB0",
  0x23: "080046D4",
  0x25: "08003F30",
  0x26: "08004724",
  0x27: "0800475C",
  0x28: "08004794",
  0x29: "080048C0",
  0x2c: "080049FC",
  0x2d: "08004B10",
  0x2e: "08004B98",
  0x2f: "08004C34",
  0x40: "080051B4",
  0x41: "08005264",
  0x43: "08005290",
  0x44: "080053DC",
  0x30: "08004C8C",
  0x31: "08004CDC",
  0x32: "08004D4C",
  0x33: "08004DC4",
  0x34: "08004DD0",
  0x35: "08004E28",
  0x36: "08004E84",
  0x37: "08004EE0",
  0x39: "08004F8C",
  0x3a: "08005000",
  0x3b: "08004F54",
  0x3c: "08005094",
  0x3d: "080050F4",
  0x3e: "08005110",
  0x45: "08005214",
  0x46: "080047CC",
  0x47: "08004804",
  0x48: "0800483C",
  0x4b: "080057C0",
  0x4c: "080057E8",
  0x4d: "080057EC",
  0x4e: "08005828",
  0x4f: "08005848",
  0x51: "080058B4",
  0x52: "080058EC",
  0x53: "08005914",
  0x54: "08005A0C",
  0x55: "08005A94",
  0x56: "08005B1C",
  0x57: "08005BA8",
  0x58: "08005C30",
  0x59: "08005C7C",
  0x5a: "08005CA8",
  0x5b: "08005CD4",
  0x5c: "08005D24",
  0x5d: "08005D54",
  0x5e: "08005DE0",
  0x5f: "080059C0",
  0x60: "08005E6C",
  0x61: "08005EA4",
  0x62: "08005EE4",
  0x63: "08005F38",
};

// Native handlers which short-circuit while a 57 choice candidate is being
// collected. Arguments are consumed before this gate is evaluated.
// Opcodes 31 and 32 (08004D20-08004D32): raw > 99 is divided by 16 first, then both take * 10.
const audioSpeed = (raw) => (raw > 99 ? raw >> 4 : raw) * 10;
const SILENT = {
  startSong() {}, stopSong() {}, immInit() {}, volumeControl() {}, panControl() {}, pitchControl() {},
  playerStart() {}, playerStop() {}, playerStopped: () => true,
};

export const SUPPRESSION = Object.freeze({
  0x04: ["77e-or-78e", "u16"], 0x08: ["77e-or-78e", "u16,u8"], 0x09: ["77e-or-78e", "u16,u8"],
  0x0a: ["77e-or-78e", "u8"], 0x0b: ["77e-or-78e", "u8"], 0x0c: ["77e-or-78e", "u16"],
  0x0d: ["77e", "u8"], 0x0e: ["77e", "u8,u16"], 0x0f: ["77e", "u8,u16"],
  0x19: ["77e", "u16"], 0x1a: ["77e", "u8"],
  0x13: ["sets-77e", "choice[]"], 0x15: ["78e-or-choice-return", ""],
  0x1c: ["77e-or-78e", "u8"], 0x21: ["77e", "u8"], 0x22: ["77e", "u8"],
  0x23: ["77e-or-78e", "u8,u8"], 0x25: ["77e", "u8,u16"], 0x29: ["77e-or-78e", "u8,u16"],
  0x2c: ["77e-or-78e", ""], 0x2d: ["77e-or-78e", "u8,u16"], 0x2e: ["77e-or-78e", "u8,u8"],
  0x2f: ["77e-or-78e", "u16"], 0x30: ["77e-or-78e", "u16"], 0x31: ["77e-or-78e", "u16,u16"],
  0x32: ["77e-or-78e", "u16,u16"], 0x34: ["77e-or-78e", "u16"], 0x35: ["77e-or-78e", "u8,u16"],
  0x37: ["77e-or-78e", "u16"], 0x46: ["78e", "u8"], 0x47: ["78e", "u8"], 0x48: ["78e", "u8"],
  0x2b: ["77e-or-78e", "u16,u8"], 0x3f: ["77e-or-78e", "u8"], 0x50: ["77e-or-78e", "u16"],
  0x64: ["77e-or-78e", ""],
  0x4d: ["77e-or-78e", "u8"], 0x51: ["77e-or-78e", "u8,u16"],
  0x52: ["77e-or-78e", ""], 0x53: ["77e-or-78e", "u16"],
  0x54: ["77e", "u8,u16,u16"], 0x55: ["77e", "u8,u16,u16"],
  0x57: ["sets-77e", "choice-key[]"], 0x58: ["77e-or-78e", "u16"],
  0x5a: ["77e-or-78e", "u8"], 0x5c: ["77e-or-78e", "u8,u8"],
  0x5d: ["77e", "u8,u16,u16"], 0x5e: ["77e", "u8,u16,u16"],
  0x5f: ["77e-or-78e", "u16"], 0x60: ["77e-or-78e", "u8"],
  0x61: ["77e-or-78e", "u16"],
  0x62: ["77e-or-78e", "u16"],
});

export const textKey = (bank, offset) => `${bank.toString(16).padStart(2, "0")}:${offset.toString(16).padStart(4, "0")}`;

export class VM {
  constructor({
    banks = {},
    entryRow = 27000,
    scene = null,
    text = null,
    audio = null,
    musicMap = [],
    audioTables = null,
    choiceView = null,
    system = null,
    transitionTimings = null,
    trace = null,
  } = {}) {
    this.banks = banks;
    this.rows = this.indexRows(banks);
    this.scene = scene;
    this.text = text;
    this.audio = audio;
    this.musicMap = musicMap;
    // The game's audio controller (0800A14C-0800A572) owns the request state and drives m4a.
    const engine = audio ?? SILENT;
    const tables = audioTables ?? { requestSong: musicMap };
    const effects = tables.effects && tables.effectBytes
      ? new Effects(engine, tables.effects, tables.effectBytes)
      : null;
    this.sound = new SceneAudio(engine, tables, effects);
    this.choiceView = choiceView;
    this.system = system;
    this.transitionTimings = transitionTimings?.sites ?? transitionTimings ?? {};
    this.transitionVisits = new Map();
    this.trace = trace;
    this.frame = 0;
    this.skipAudioFrame = false;
    this.skipAudioIrq = false;
    this.halted = false;
    this.pageRuns = []; // the text runs of the page being read (bank, offset of the 00, bytes)
    this.textEdits = null; // Map textKey -> replacement bytes (text-editor.js)
    this.waiting = "none";
    this.unimplemented = new Set();
    this.ram = {
      flags: new Uint8Array(256),
      node: 0, // 02004608: current flowchart node (opcode 53)
      visited: new Uint8Array(0x12c), // 0200293C: flowchart nodes seen
      edges: new Uint8Array(0x200), // 02002B94: flowchart links taken (jump and choice keys)
      seenNodes: new Uint8Array(0x12c), // 02002A68: 0200293C as of the last opcode 53 (the map)
      seenEdges: new Uint8Array(0x200), // 02002D94: 02002B94 as of the last opcode 53 (the map)
      tried: new Uint8Array(0x12c), // 02002F94: per node, 2 bits per choice entry taken (0800D084)
      seenTried: new Uint8Array(0x12c), // 020030C0: 02002F94 as of the last opcode 53
      flowMask: 0, // 02004640: 16-bit route mask tested by opcodes 5D/5E
      endingCount: 0, // 02004604: endings reached this power-on (opcode 44, up to 10)
      inGame: 0, // 0200078D: set by 1D 67, lets R open the in-game menu
      selectArmed: 0, // 02000797: 1D 6A sets, 1D 6B clears; SELECT at a page wait then sets var 2
      vars: new Uint8Array(256),
      bits: new Uint8Array(256),
      stack: [],
      group: 0,
      slot: 0xffff,
      pending: 0,
      effectDisabled: 0,
      effectBypass: 0,
      updatePending: 0,
      silhouettes: new Uint16Array(4).fill(0xffff), // 02000728: the silhouettes on the layer (29)
      silhouetteMode: 0, // 020007A5 (4D): 2E shows the layer; at 0 the fade-in of 09 does
      presentationC5: 5, // 020066C5..C7: the layer's tint, red/green/blue (080034D0 defaults)
      presentationC6: 0,
      presentationC7: 15,
      audioRequest: 0xffff,
      choiceActive: 0,
      inputReady: 0,
      system47: 0,
      system48: 0,
      clockTarget: 0,
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

  // 0800337C: opcodes 30/32 consume and execute an immediately following
  // opcode 00 through the native handler table before continuing audio work.
  followingText() {
    if (this.banks[this.bank][this.offset] !== 0x00) return "none";
    const runBank = this.bank, runOffset = this.offset;
    this.offset++;
    const original = this.textBytes();
    const raw = this.textRun(runBank, runOffset, original);
    if (this.ram.choiceActive && this.collectingChoice !== undefined) {
      this.text?.collectChoice?.(this.collectingChoice, raw);
      return "none";
    }
    if (this.choiceLabel(raw)) return "none";
    this.writes.push(`inline-text=${raw.length}`);
    if (!this.text?.fragments?.length) this.pageRuns = [];
    this.pageRuns.push({ bank: runBank, offset: runOffset, raw: original });
    return this.text?.feed?.(raw) ?? "none";
  }

  // A text run as shown: the text editor's replacement for the run at bank:offset (the 00 opcode),
  // if there is one; the script's bytes and offsets are unchanged either way.
  textRun(bank, offset, raw) {
    return this.textEdits?.get(textKey(bank, offset)) ?? raw;
  }

  // While a choice collects its entries, a text run that opens with 'v' n selects entry n's
  // window buffer: "v0 c1 Ａ" is the label of entry 0, not page text.
  choiceLabel(raw) {
    return Boolean(this.ram.choiceActive) && raw[0] === 0x76;
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
    const blocked = (gate !== "78e" && this.ram.effectDisabled === 1) ||
      (gate !== "77e" && this.ram.effectBypass === 1);
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
    } else {
      // 080040A0 also sets 0200077E: the 14/00/02/17/15 that follow collect the labels and
      // opcode 16 waits (19:15F welcome menu). 1D 1C makes 16 take the preset entry instead.
      this.ram.choiceActive = 1;
      this.ram.effectDisabled = 1; // 080040D6-080040DA write 0200077E, as 57 does
      this.text?.beginChoices?.(entries.length);
    }
    return [
      count,
      index,
      ...entries.flatMap((entry) =>
        opcode === 0x57 ? [entry.row, entry.key] : [entry.row],
      ),
    ];
  }

  // Native transition handlers can cross several VBlanks before returning to
  // the scenario dispatcher. The timing table is captured from the original
  // cartridge and keyed by bank and cursor, because decompression/copy cost is
  // site-specific and can differ for the same opcode and arguments.
  nativeWait(bank, offset) {
    const key = `${bank.toString(16)}:${offset.toString(16)}`;
    const entries = this.transitionTimings[key];
    if (!entries?.length) return;
    const visit = this.transitionVisits.get(key) ?? 0;
    const timing = entries[Math.min(visit, entries.length - 1)];
    this.transitionVisits.set(key, visit + 1);
    if (!timing.frames) return;
    this.skipAudioFrame = timing.audioFrame?.[0] === "0";
    // IRQ/play-length runs before dispatch, so frame zero cannot be changed by
    // the opcode. Captures normally have it set; retain the observed value for
    // documentation and apply the remaining frames from the next VBlank.
    this.transitionWait = { ...timing, index: 1 };
    this.waiting = "transition";
  }

  prepareNativeWaitFrame() {
    const timing = this.transitionWait;
    if (!timing) return;
    if (timing.index >= timing.frames) {
      this.transitionWait = null;
      this.waiting = "none";
      return;
    }
    this.skipAudioFrame = timing.audioFrame?.[timing.index] === "0";
    this.skipAudioIrq = timing.audioIrq?.[timing.index] === "0";
    timing.index++;
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
        const original = this.textBytes();
        args.push(...original);
        const raw = this.textRun(startBank, startOffset, original);
        if (this.ram.choiceActive && this.collectingChoice !== undefined)
          this.text?.collectChoice?.(this.collectingChoice, raw);
        else if (this.choiceLabel(raw)) {
          // The entry's 'v' buffer label (Ａ, Ｂ, ...) belongs to the choice window, which draws
          // its own labels; it must not reach the page (it showed as "AB" after the choice).
        } else {
          // A page's first text: what a bookmark records (0800A838 keeps the page start).
          // A page that ended in 'p' + 'g' is only cleared here, so clear it before the check.
          this.text?.resumed?.();
          if (!this.text?.fragments?.length) { this.onPageStart?.(startBank, startOffset); this.pageRuns = []; }
          this.pageRuns.push({ bank: startBank, offset: startOffset, raw: original });
          this.waiting = this.text?.feed(raw) ?? "none";
        }
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
          if (index >= 0) {
            this.collectingChoice = index;
            this.choiceState.entries[index].x = this.ram.textX;
          }
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
      case 0x05: {
        const request = this.word();
        args.push(request);
        if (this.ram.effectDisabled === 1 || this.ram.effectBypass === 1) {
          this.ram.updatePending = 1;
          this.writes.push("updatePending=1");
          break;
        }
        // 080039D0 calls the shared scene loader in mode 1. Request 0x83
        // additionally wraps it in slot 1/5 transitions; those pixels remain
        // a renderer hook, while nativeWait preserves its cartridge timing.
        this.scene?.request(request, this.ram, 1);
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
        if (opcode === 0x09) {
          // 08003BC8: with 020007A5 clear, the fade-in also shows the silhouette layer.
          if (!this.ram.silhouetteMode) this.scene?.silhouetteShow?.(0, this.tint());
          this.ram.updatePending = 1;
        }
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
      case 0x12:
        // 08004008: composite six-slot fade, menu command 00, and restore.
        // Rendering is host-owned; nativeWait preserves its 36-frame span.
        this.system?.cue?.(0x12, 0, this.ram);
        break;
      case 0x13:
      case 0x57:
        args.push(...this.choice(opcode));
        break;
      case 0x14:
        args.push(this.byte());
        // 0800814C: the text x origin of the current window becomes the operand + 8.
        this.ram.textX = args[0] + 8;
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
        // 08004200: when 0200077F is set (system command 1D 1C), the menu is not shown and the
        // entry chosen beforehand (02000780, written by opcode 3C) is taken at once.
        if (this.ram.choiceSkip) {
          this.ram.choiceSkip = 0;
          this.waiting = "choice";
          this.resume(this.ram.choicePreset ?? 0);
          break;
        }
        this.waiting = "choice";
        this.choiceView?.show?.(this.text?.choiceRaw ?? [], this.choiceSelection);
        break;
      case 0x17:
        // 08004478: outside choice collection, advance over the already-shown
        // label until (and including) opcode 15. Text bytes > 80 consume their
        // following byte as well, exactly as the native cursor loop does.
        if (!this.ram.choiceActive) {
          while (this.banks[this.bank][this.offset] !== 0x15) {
            if (this.byte() > 0x80) this.offset++;
          }
          this.offset++;
        }
        break;
      case 0x18: {
        const command = this.word();
        args.push(command);
        if (!this.ram.choiceActive) {
          this.system?.cue?.(0x18, command, this.ram);
          this.ram.updatePending = 1;
          this.writes.push("updatePending=1");
        }
        break;
      }
      case 0x19: {
        const command = this.word();
        args.push(command);
        if (!this.suppressed(opcode)) this.system?.cue?.(0x19, command, this.ram);
        this.ram.updatePending = 1; // 02000781, both the call and suppressed paths
        if (!this.writes.includes("updatePending=1")) this.writes.push("updatePending=1");
        break;
      }
      case 0x21:
      case 0x22: {
        const index = this.byte();
        args.push(index);
        if (this.suppressed(opcode)) break;
        // 08003D70/08003DB0 set or clear the 1-based bit in 02004640.
        const mask = 1 << (index - 1);
        if (opcode === 0x21) this.ram.flowMask = (this.ram.flowMask | mask) & 0xffff;
        else this.ram.flowMask &= ~mask;
        this.writes.push(`flowMask=${this.ram.flowMask}`);
        break;
      }
      case 0x1c: {
        const command = this.byte();
        args.push(command);
        const blocked = this.suppressed(opcode);
        // Subcommand 14 (0800913E) performs one frame of presentation work,
        // then consumes an immediately following `1C 00` pair itself.
        if (
          !blocked && command === 0x14 &&
          this.banks[this.bank][this.offset] === 0x1c &&
          this.banks[this.bank][this.offset + 1] === 0x00
        ) this.offset += 2;
        break;
      }
      case 0x1d: {
        const command = this.byte();
        args.push(command);
        if (this.ram.choiceActive || this.ram.effectBypass === 1) break;
        // 08009478's 00-6F system-command table. UI-specific commands are
        // supplied by the host; a missing host is a deliberate no-op so the
        // bytecode remains aligned while the corresponding UI is being ported.
        const result = this.system?.command?.(command, this.ram);
        if (result?.inputReady !== undefined)
          this.ram.inputReady = result.inputReady ? 1 : 0;
        if (result?.waiting) this.waiting = result.waiting;
        break;
      }
      case 0x1e: {
        const offset = this.word();
        args.push(offset);
        // Also taken while 0200077F (1D 1C) asks opcode 16 to pick the preset entry (mGBA 19:80 -> A6).
        if (this.ram.inputReady || this.ram.choiceSkip) this.offset = offset;
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
        // 08003F30 tests the same 1-based 02004640 bit as 5E.
        if ((this.ram.flowMask >> (index - 1)) & 1) this.branch(row);
        break;
      }
      case 0x26:
      case 0x27:
      case 0x28: {
        const value = this.byte();
        args.push(value);
        if (this.ram.effectBypass !== 1) {
          const field = opcode === 0x26 ? "presentationC6" :
            opcode === 0x27 ? "presentationC5" : "presentationC7";
          this.ram[field] = value;
          this.ram.updatePending = 1;
          this.writes.push(`${field}=${value}`, "updatePending=1");
        }
        break;
      }
      case 0x29: {
        // 080048C0: silhouette (high << 8) + word joins the layer's buffer, in the first free of
        // the four 02000728 slots (slot 0 when all are taken).
        const high = this.byte();
        const low = this.word();
        args.push(high, low);
        if (this.suppressed(opcode)) break;
        const id = ((high << 8) + low) & 0xffff;
        const slots = this.ram.silhouettes;
        const free = slots.indexOf(0xffff);
        slots[free < 0 ? 0 : free] = id;
        this.scene?.silhouetteAdd?.(id);
        break;
      }
      case 0x2e: {
        // 08004B98: with 020007A5 set, the layer is shown at once (first operand 0, or 7F), or
        // as a blind: row n of every tile in step n, two frames a step.
        const mode = this.byte();
        const speed = this.byte();
        args.push(mode, speed);
        if (this.suppressed(opcode) || !this.ram.silhouetteMode) break;
        if (mode === 0 || speed === 0x7f) this.scene?.silhouetteShow?.(0, this.tint());
        else {
          this.scene?.silhouetteShow?.(1, this.tint());
          this.silhouetteBlind = { step: 1, frames: 0 };
        }
        break;
      }
      case 0x2f: {
        // 08004C34: the native reader (080033D0 + 08009B34) yields the little-endian word.
        const request = this.word();
        args.push(request);
        if (this.suppressed(opcode)) break;
        this.sound.fade(request, 0);
        this.syncAudio();
        this.ram.updatePending = 1;
        this.writes.push("updatePending=1");
        break;
      }
      case 0x2c:
        // 080049FC: unless opcode 39 follows, every silhouette is removed (0800350C, 08004928(5))
        // and the tint returns to its default (080034D0).
        if (this.suppressed(opcode)) break;
        if (this.banks[this.bank]?.[this.offset] !== 0x39) {
          this.ram.silhouettes.fill(0xffff);
          this.scene?.silhouetteClear?.();
          Object.assign(this.ram, { presentationC5: 5, presentationC6: 0, presentationC7: 15 });
        }
        this.ram.updatePending = 1;
        break;
      case 0x2d: {
        const high = this.byte();
        const lowPair = this.word();
        // 08004B10: 080033D0 reads the word big-endian and 08009B34 swaps it back, so the
        // value is the little-endian word.
        const request = ((high << 8) + lowPair) & 0xffff;
        args.push(high, lowPair, request);
        if (this.suppressed(opcode)) break;
        // 080014DC: silhouette `request` is decoded and its pixels are cleared from the layer's
        // buffer (020117C8; the other silhouettes keep theirs), and 020007A5 = 1 so the next 2E
        // shows the result (1B:10B3 takes the two standing people off before 29 seats them).
        this.scene?.silhouetteRemove?.(request);
        this.ram.silhouetteMode = 1;
        // The 02000728 slots holding it (compared as signed halfwords) are freed; request 0
        // frees the slots holding 13 instead.
        const slots = this.ram.silhouettes;
        for (let index = 0; index < slots.length; index++) {
          const signedValue = (slots[index] << 16) >> 16;
          if (signedValue === request || (request === 0 && signedValue === 13)) slots[index] = 0xffff;
        }
        this.writes.push(`silhouetteRemove=${request}`);
        break;
      }
      case 0x30: {
        const request = this.word();
        args.push(request);
        if (this.suppressed(opcode)) break;
        const afterText = this.followingText(); // 0800337C before 08004C80
        this.sound.play(request, 0); // 08004C8C -> 0800A510
        this.syncAudio();
        if (afterText !== "none") this.waiting = afterText;
        break;
      }
      case 0x31: {
        const rawSpeed = this.word();
        const request = this.word();
        args.push(rawSpeed, request);
        if (this.suppressed(opcode)) break;
        this.sound.fade(request, audioSpeed(rawSpeed)); // 08004CDC -> 0800A4CC
        this.syncAudio();
        break;
      }
      case 0x32: {
        const rawSpeed = this.word();
        const request = this.word();
        args.push(rawSpeed, request);
        if (this.suppressed(opcode)) break;
        const afterText = this.followingText(); // 0800337C before the one-frame wait
        // 08004D4C: inline 00, one frame (08003044(1)), then 0800A510.
        this.pendingAudio = { request, speed: audioSpeed(rawSpeed), afterText };
        this.waitFrames = 1;
        this.waiting = "audio-start";
        break;
      }
      case 0x33:
        // 08004DC4: set the dispatch-continue flag (02000781).
        this.ram.updatePending = 1;
        this.writes.push("updatePending=1");
        break;
      case 0x34: {
        const request = this.word();
        args.push(request);
        if (this.suppressed(opcode)) break;
        // 08004DD0: one frame, the 0800A2C4 loop while the request plays, then two frames.
        this.audioWait = { request, phase: "pre", loop: 0, post: 2 };
        this.waiting = "audio";
        break;
      }
      case 0x35: {
        // 08004E28: sets the flag that effect script opcodes 0A/0B test (08002D50).
        const value = this.byte();
        const request = this.word();
        args.push(value, request);
        if (this.suppressed(opcode)) break;
        if (request !== 0xffff) this.sound.effects?.setFlag(value, (request - 1000) << 16 >> 16);
        break;
      }
      case 0x36: {
        const value = this.byte();
        const request = this.word();
        args.push(value, request);
        if (this.ram.effectDisabled === 1 || this.ram.effectBypass === 1) {
          this.ram.updatePending = 1;
          this.writes.push("updatePending=1");
          break;
        }
        if (request === 0xffff) break;
        // 08004E84: start the request through 08004C80, then apply the same
        // effect-program flag operation used by opcode 35.
        this.sound.play(request, 0);
        this.syncAudio();
        this.sound.effects?.setFlag(value, (request - 1000) << 16 >> 16);
        break;
      }
      case 0x37: {
        args.push(this.word());
        this.suppressed(opcode);
        break;
      }
      case 0x39:
        // 08004F8C -> 080086F8: u8 plus three little-endian words.
        // The first word is a bank-buffer-relative data address.
        args.push(this.byte(), this.word(), this.word(), this.word());
        break;
      case 0x3a: {
        const command = this.byte();
        args.push(command);
        if (!this.ram.choiceActive && this.ram.effectBypass !== 1) {
          this.system?.cue?.(0x3a, command, this.ram);
          this.ram.updatePending = 1;
          this.writes.push("updatePending=1");
        }
        break;
      }
      case 0x3b:
        // 08004F54 -> 08008684: one u8 presentation command.
        args.push(this.byte());
        break;
      case 0x3c:
        // 08005094: two u8 operands, followed by the 0800B79C menu-state
        // query when its first operand is zero. The boot UI owns that state;
        // retain bytecode alignment until the host implementation is attached.
        {
          const query = this.byte();
          const index = this.byte();
          args.push(query, index);
          // 0800B79C: 1 when any save slot is in use (020007AC != FF), else 0.
          if (query === 0) this.ram.choicePreset = this.system?.anySave?.() ? 1 : 0;
        }
        break;
      case 0x3d:
        // 080050F4: clears two menu/input bytes after 0800AEA4.
        break;
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
      case 0x43: {
        const command = this.word();
        args.push(command);
        this.system?.cue?.(0x43, command, this.ram);
        break;
      }
      case 0x44: {
        // 080053DC: the screens after an ending (save, then 続ける / 終了する). Without a host the
        // script goes on as after セーブしない and 続ける.
        this.system?.cue?.(0x44, 0, this.ram);
        const result = this.system?.ending?.(this.ram);
        if (result?.waiting) this.waiting = result.waiting;
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
      case 0x46:
      case 0x47:
      case 0x48: {
        const value = this.byte();
        args.push(value);
        if (!this.suppressed(opcode)) {
          this.ram[`system${opcode.toString(16)}`] = value;
          this.writes.push(`system${opcode.toString(16)}=${value}`);
        }
        this.ram.updatePending = 1; // 02000781, both the store and suppressed paths
        if (!this.writes.includes("updatePending=1")) this.writes.push("updatePending=1");
        break;
      }
      case 0x4b:
        args.push(this.word());
        break;
      case 0x4c:
        break;
      case 0x2b: {
        // 080049A0 -> 080065A8: the slot's brightness maximum becomes level << 8 (level at most
        // 0xFF) and the slot stands at half of it at once.
        const level = Math.min(this.word(), 0xff);
        const slot = this.byte();
        args.push(level, slot);
        if (this.suppressed(opcode)) break;
        const effect = this.ram.brightness[slot];
        if (effect) {
          effect.maximum = level << 8;
          effect.current = effect.target = level << 7;
          effect.duration = 0;
          this.scene?.brightness?.(slot, effect.current, effect.maximum);
        }
        this.ram.updatePending = 1;
        break;
      }
      case 0x3f: {
        // 0800516C: unless 02000380 is set (続ける on the screen after an ending, 0800562C), the
        // seven bytes after the operand are skipped; the flag is cleared either way.
        args.push(this.byte());
        if (this.suppressed(opcode)) break;
        if (!this.ram.continueChosen) this.offset += 7;
        this.ram.continueChosen = 0;
        break;
      }
      case 0x50:
        // 08005880: one word and no effect outside the suppressed path.
        args.push(this.word());
        this.suppressed(opcode);
        break;
      case 0x64:
        // 08005F68 -> 0800A384: the music stops.
        if (this.suppressed(opcode)) break;
        this.sound.stop?.(0);
        this.syncAudio();
        break;
      case 0x4d: {
        // 080057EC: 020007A5, whether 2E (set) or 09 (clear) shows the silhouette layer.
        const value = this.byte();
        args.push(value);
        if (!this.suppressed(opcode)) this.ram.silhouetteMode = value;
        break;
      }
      case 0x4e:
        // 08005828: composite boot/menu teardown; no scenario operands.
        break;
      case 0x4f:
        // 08005848 -> 08008940: one u8 presentation command.
        args.push(this.byte());
        break;
      case 0x51:
        // 080058B4 consumes a u8/u16 pair; the native handler has no normal-path side effect.
        args.push(this.byte(), this.word());
        this.suppressed(opcode);
        break;
      case 0x52:
        // 080058EC has no operands or normal-path side effect.
        this.suppressed(opcode);
        break;
      case 0x53: {
        const effect = this.word();
        args.push(effect);
        if (this.suppressed(opcode)) break;
        // 08005914: the operand is the flowchart node (080033D0 reads it high byte first and
        // 08009B34 swaps it back). Unless it is 0x105 it becomes the current node (02004608, the
        // bookmark and menu title) and is marked visited (0200293C[node] = 3) for the 移動 map.
        const node = effect;
        if (node !== 0x105) {
          this.ram.node = node;
          this.ram.visited[node] = 3;
          this.ram.seenEdges.set(this.ram.edges);
          this.ram.seenNodes.set(this.ram.visited);
          this.ram.seenTried.set(this.ram.tried);
        }
        if (node === 0x84 && this.banks[this.bank][this.offset] === 0x0a) this.offset += 2;
        break;
      }
      case 0x54:
      case 0x55: {
        const index = this.byte();
        const row = this.word();
        const key = this.word();
        args.push(index, row, key);
        if (this.suppressed(opcode)) break;
        // 08005A0C/08005A94 test the byte array at 020024EC.
        const set = this.ram.flags[index] !== 0;
        if ((opcode === 0x54 && !set) || (opcode === 0x55 && set)) {
          this.branch(row);
          this.ram.edges[key] = 3;
        }
        break;
      }
      case 0x56: {
        const row = this.word();
        const key = this.word();
        args.push(row, key);
        this.branch(row);
        // 08005B1C: the key is the flowchart link taken (02002B94), unless 0200078E is set.
        if (this.ram.effectBypass !== 1) this.ram.edges[key] = 3;
        break;
      }
      case 0x5d:
      case 0x5e: {
        const index = this.byte();
        const row = this.word();
        const key = this.word();
        args.push(index, row, key);
        if (this.suppressed(opcode)) break;
        // 08005D54/08005DE0 test the 1-based bit in 02004640, not 020024EC.
        const set = ((this.ram.flowMask >> (index - 1)) & 1) !== 0;
        if ((opcode === 0x5d && !set) || (opcode === 0x5e && set)) {
          this.branch(row);
          this.ram.edges[key] = 3;
        }
        break;
      }
      case 0x5f: {
        const node = this.word();
        args.push(node);
        // 080059C0: marks a flowchart node seen (0200293C) without making it current.
        if (!this.suppressed(opcode)) this.ram.visited[node] = 3;
        break;
      }
      case 0x61: {
        const value = this.word();
        args.push(value);
        if (!this.suppressed(opcode)) {
          this.ram.clockTarget = value;
          this.writes.push(`clockTarget=${value}`);
        }
        break;
      }
      case 0x62: {
        const value = this.word();
        args.push(value);
        if (!this.suppressed(opcode) && this.ram.clockTarget < value) {
          this.clockWaitTarget = value;
          this.waiting = "clock";
        }
        break;
      }
      case 0x63:
        // 08005F38: invokes 080135C0(0); no scenario operands.
        break;
      case 0x58: {
        const key = this.word();
        args.push(key);
        // 08005C30: marks a flowchart link taken (02002B94).
        if (!this.suppressed(opcode)) this.ram.edges[key] = 3;
        break;
      }
      case 0x59:
        // 08005C7C -> 0800FF24: wait until the shared presentation flag
        // clears. The cartridge-frame duration is supplied by nativeWait.
        break;
      case 0x5a:
        // 08005CA8 consumes one byte; the normal path has no other side effect.
        args.push(this.byte());
        this.suppressed(opcode);
        break;
      case 0x5b: {
        const command = this.byte();
        args.push(command);
        if (this.ram.choiceActive || this.ram.effectBypass === 1) {
          this.ram.updatePending = 1;
          this.writes.push("updatePending=1");
          break;
        }
        // 08005CFC: after consuming its u8 operand, skip a fixed 0x21-byte
        // inline block and continue at the following scenario command.
        this.offset += 0x21;
        break;
      }
      case 0x5c:
        // 08005D24 consumes two bytes; the normal path has no other side effect.
        args.push(this.byte(), this.byte());
        this.suppressed(opcode);
        break;
      case 0x60: {
        const value = this.byte();
        args.push(value);
        // 08005E6C writes the shared frame flag at 020006E2.
        if (!this.suppressed(opcode)) this.ram.frameFlag = value;
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
    if (this.waiting === "none") this.nativeWait(startBank, startOffset);
    return !this.halted;
  }

  syncAudio() {
    this.ram.audioRequest = this.sound.request & 0xffff; // 02028ACE
    this.ram.audioScene = this.sound.scene & 0xffff; // 02000738
  }

  // One frame of an opcode 34 wait; the condition is read after the frame's audio update, as in
  // 0800A2C4. Returns true while the wait still holds the scenario.
  audioWaitFrame() {
    const w = this.audioWait;
    if (w.phase === "pre") {
      w.phase = this.sound.waiting(w.request, 0) ? "loop" : "post";
    } else if (w.phase === "loop") {
      w.loop++;
      if (!this.sound.waiting(w.request, w.loop)) w.phase = "post";
    } else if (--w.post === 0) {
      this.audioWait = null;
      return false;
    }
    return true;
  }

  tint() {
    return [this.ram.presentationC5 ?? 5, this.ram.presentationC6 ?? 0, this.ram.presentationC7 ?? 15];
  }

  // 08004C04: the rest of 2E's blind, one step every two frames up to row 8.
  silhouetteBlindFrame() {
    const blind = this.silhouetteBlind;
    if (!blind || ++blind.frames < 2) return;
    blind.frames = 0;
    if (++blind.step > 8) { this.silhouetteBlind = null; return; }
    this.scene?.silhouetteShow?.(blind.step, this.tint());
  }

  // 0800750C: SELECT newly pressed at a page wait while 1D 6A has armed it sets var 2 = 1
  // (08003658) and counts as the A press. Returns true when taken.
  select() {
    if (this.waiting !== "click" || this.ram.selectArmed !== 1) return false;
    this.ram.vars[2] = 1;
    this.resume();
    return true;
  }

  resume(rowIndex = null) {
    if (this.waiting === "choice") {
      if (rowIndex === null) rowIndex = this.choiceSelection;
      const { row, key } = this.choiceState.entries[rowIndex] ?? {};
      // 080043F0: the chosen entry's key is the flowchart link taken (02002B94).
      if (key !== undefined) this.ram.edges[key] = 3;
      // 0800D084: the entry is marked taken at the current node, unless the choice's index is 0xBC.
      if (this.choiceState.opcode === 0x57 && this.choiceState.index !== 0xbc)
        this.ram.tried[this.ram.node] |= 3 << (rowIndex * 2);
      this.waiting = "none";
      this.ram.choiceActive = 0;
      this.ram.effectDisabled = 0;
      this.choiceView?.hide?.();
      // 080043F8 -> 080080C4: the page is cleared and the text starts again at the top, so the
      // chosen entry's text opens a new page (mGBA: the question above the choices is gone).
      this.text?.clearPage?.();
      if (row !== undefined) this.branch(row);
      return;
    }
    this.waiting = "none";
    this.text?.resumed?.();
    // The text run goes on from the wait (08007880 reads on from 02024E24).
    const rest = this.text?.rest;
    if (rest?.length) this.waiting = this.text.feed(rest, true) ?? "none";
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
    this.prepareNativeWaitFrame();
    this.silhouetteBlindFrame();
    // Frame order on the cartridge: the VBlank interrupt runs the effect scripts (08002B00 from
    // 080005F0); the frame wait's tail 080062E0 -> 080003D8 -> 080066E8 then counts the play
    // length (0800A3E0); the frame's dispatches follow; the next frame wait (08002FB8) runs
    // 0800A414 before it waits for VBlank. Wait loops that bypass 08002FB8 or 080062E0 (the
    // screen transitions of opcodes 02/04/05/09/29/2D, ...) set skipAudioFrame / skipAudioIrq.
    this.sound.effects?.vblank();
    if (!this.skipAudioIrq) this.sound.irq();
    this.syncAudio();
    if (this.waiting === "audio" && !this.audioWaitFrame()) this.waiting = "none";
    if (this.waiting === "delay" && --this.waitFrames <= 0)
      this.waiting = "none";
    if (this.waiting === "clock" && ++this.ram.clockTarget >= this.clockWaitTarget)
      this.waiting = "none";
    if (this.waiting === "audio-start" && --this.waitFrames <= 0) {
      const { request, speed, afterText } = this.pendingAudio;
      this.sound.play(request, speed);
      this.syncAudio();
      this.pendingAudio = null;
      this.waiting = afterText ?? "none";
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
    // 0800A414 runs in the frame wait (08002FB8) after the frame's dispatches and before the
    // VBlank wait, so a fade started by this frame's opcode 31 takes its first step this frame.
    if (!this.skipAudioFrame) this.sound.frame();
    this.syncAudio();
    this.skipAudioFrame = false;
    this.skipAudioIrq = false;
  }
}
