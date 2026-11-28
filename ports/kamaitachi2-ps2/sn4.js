// Execute addresses recovered from the command vtables at EE 0x0021A240.
export const SN4_SPECIAL_EXECUTE = Object.freeze({
  0x10:0x127b88,0x11:0x127b88,0x17:0x1286e0,0x1a:0x1373b8,0x1b:0x135208,
  0x1f:0x133538,0x23:0x1314b0,0x27:0x12f048,0x28:0x12f048,0x29:0x12fb60,
  0x2d:0x133bc0,0x2e:0x132fd0,0x2f:0x12de30,0x31:0x12e1d8,0x34:0x135d50,
  0x35:0x135d50,0x3a:0x136a78,0x3b:0x136a78,0x3c:0x136f30,0x3d:0x1317c8,
  0x3e:0x1317c8,0x47:0x1314b0,0x48:0x136000,0x57:0x12de30,0x59:0x12e1d8,
  0x5b:0x12d9f0,0x76:0x12f2f8,0x79:0x12fb60,0x7a:0x12fe10,0x7b:0x133bc0,
  0x7c:0x130248,0x7e:0x130a18,0x7f:0x130f80,0x81:0x131d08,0x82:0x131d08,
  0x83:0x132fd0,0x84:0x132fd0,
});

export const CIPHER_SOLUTION = Object.freeze([
  'cross','triangle','cross','square','cross','triangle','triangle','square','cross','triangle','square','cross',
]);

const normalizeKana = value => Array.from(String(value ?? '').trim()).map(ch => {
  const code = ch.codePointAt(0);
  return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : ch;
}).join('').replace(/[\s　・]/g, '').replace(/(さん|ちゃん|くん)$/u, '');

// EE mode 3 presents the criminal-name board and returns one of the 25 packed
// labels. The first 19 entries are the named answers used by the scenario;
// arbitrary names remain distributed over the six generic response groups.
export function criminalNameIndex(value, names = ['', '']) {
  const key = normalizeKana(value);
  const player = names.map(normalizeKana);
  if (key && key === player[0]) return 0;
  if (key && key === player[1]) return 1;
  const known = new Map([
    ['こばやし',2],['としお',3],['みどり',4],['けいこ',5],['かなこ',6],
    ['むらかみ',7],['まさおか',8],['かやま',9],['なつみ',10],['みきもと',11],
    ['きよ',12],['あき',13],['せんちょう',14],['きょうこ',15],['かまいたち',16],
    ['あびこたけまる',17],['はるこ',18],
  ]);
  if (known.has(key)) return known.get(key);
  let hash = 0;
  for (const ch of key) hash = (Math.imul(hash, 31) + ch.codePointAt(0)) >>> 0;
  return 19 + hash % 6;
}

// Strict SN4 virtual machine. Presentation stays in player.js; this module
// owns scenario control flow and refuses commands it cannot execute.
export class Sn4Vm {
  constructor(program, hooks = {}) {
    this.labels = new Map(program.labels.map(label => [label.label, label]));
    this.hooks = hooks;
    this.names = ['', ''];
    this.reset(program.entry);
  }

  reset(label) {
    if (!this.labels.has(label)) throw new Error(`Unknown SN4 label ${label}`);
    this.label = label;
    this.pc = 0;
    this.text = '';
    this.pending = null;
    this.clearBeforeRun = false;
    this.variables = new Map();
    this.special = {autoRead:false, record:false, inbou:false, miniGameArea:false,
      endings:[], effects:[], events:[], clickMap:null, pageLoop:false, panel:null,
      tMemory:null, nameInput:null};
  }

  applySpecial(op, name, args, context) {
    const s = this.special;
    s.events.push({op, name, args, address:SN4_SPECIAL_EXECUTE[op], label:context.label, offset:context.offset});
    if (op === 0x27 || op === 0x28) s.endings.push(op);
    else if (op === 0x29 || op === 0x79) s.autoRead = args[0] ?? true;
    else if (op === 0x34) s.record = true;
    else if (op === 0x35) s.record = false;
    else if (op === 0x3a) s.inbou = true;
    else if (op === 0x3b) s.inbou = false;
    else if (op === 0x3d) s.miniGameArea = true;
    else if (op === 0x3e) s.miniGameArea = false;
    else if ([0x2f,0x31,0x57,0x59,0x5b].includes(op)) s.effects.push({op,args,offset:this.text.length});
    else if (op === 0x7a) s.clickMap = args[0];
    else if (op === 0x7c) s.pageLoop = true;
    else if (op === 0x7e || op === 0x7f) s.panel = {op,args};
    else if (op === 0x81 || op === 0x82) s.nameInput = {op,args};
    else if (op === 0x83) s.tMemory = new Map(this.variables);
    else if (op === 0x84 && s.tMemory) this.variables = new Map(s.tMemory);
  }

  // EE 0x0017ED10: a uniform draw over [0, max + 1) truncated and clamped
  // to [0, max]. Hooks can replace it to make a run reproducible.
  random(max) {
    const draw = this.hooks.random?.(max);
    if (Number.isInteger(draw)) return draw;
    return Math.min(max, Math.max(0, Math.floor(Math.random() * (max + 1))));
  }

  setNames(names) {
    if (!Array.isArray(names) || names.length !== 2) throw new Error('SN4 requires two names');
    this.names = [...names];
  }

  hasLabel(label) {
    return this.labels.has(label);
  }

  choiceText(label) {
    const block = this.labels.get(label);
    if (!block) return label;
    let text = '';
    for (const command of block.ops) {
      if (command.op === 0x02) text += command.args?.[0] ?? '';
      else if (command.op === 0x04) text += '\n';
      else if (command.op === 0x0d) text += this.names[0];
      else if (command.op === 0x0e) text += this.names[1];
      else if ([0x09, 0x0b, 0x16].includes(command.op)) break;
    }
    return text.trim() || label;
  }

  jump(label) {
    if (!this.labels.has(label)) throw new Error(`Unknown SN4 jump target ${label}`);
    this.label = label;
    this.pc = 0;
  }

  choose(index) {
    if (this.pending?.type !== 'choice') throw new Error('SN4 is not waiting for a choice');
    const target = this.pending.targets[index];
    if (!target) throw new Error(`Invalid SN4 choice index ${index}`);
    this.pending = null;
    this.text = '';
    this.jump(target);
    return this.run();
  }

  chooseSpecial(index) {
    if (this.pending?.type !== 'special') throw new Error('SN4 is not waiting for special input');
    if (!['click-map','panel','delusion-panel'].includes(this.pending.kind))
      throw new Error(`SN4 ${this.pending.kind} does not accept a target index`);
    const target = index === -1 ? this.pending.fallback : this.pending.targets[index];
    if (!target) throw new Error(`Invalid SN4 ${this.pending.kind} index ${index}`);
    this.pending = null;
    this.text = '';
    this.jump(target);
    return this.run();
  }

  submitCriminalName(value) {
    if (this.pending?.type !== 'special' || this.pending.kind !== 'criminal-name')
      throw new Error('SN4 is not waiting for a criminal name');
    const resolver = this.hooks.criminalNameIndex ?? criminalNameIndex;
    const index = resolver(value, this.names, this.pending.targets);
    const target = this.pending.targets[index];
    if (!target) throw new Error(`Invalid SN4 criminal-name index ${index}`);
    this.pending = null;
    this.text = '';
    this.jump(target);
    return this.run();
  }

  submitCipher(sequence) {
    if (this.pending?.type !== 'special' || this.pending.kind !== 'cipher')
      throw new Error('SN4 is not waiting for the cipher');
    const length = this.pending.length;
    if (!Array.isArray(sequence) || sequence.length !== length)
      throw new Error(`SN4 cipher requires ${length} buttons`);
    const solution = CIPHER_SOLUTION.slice(0, length);
    this.variables.set(230, sequence.every((button, i) => button === solution[i]) ? 1 : 0);
    this.pending = null;
    return this.run();
  }

  resume(value) {
    if (this.pending?.type !== 'name') throw new Error('SN4 is not waiting for a name');
    this.names[this.pending.role] = value;
    this.pending = null;
    return this.run();
  }

  run() {
    if (this.clearBeforeRun) {
      this.text = '';
      this.hooks.clearText?.();
      this.clearBeforeRun = false;
    }
    while (true) {
      const block = this.labels.get(this.label);
      if (!block) throw new Error(`Unknown SN4 label ${this.label}`);
      if (this.pc >= block.ops.length) {
        if (!block.next) return {type:'end', label:this.label, text:this.text};
        this.jump(block.next);
        continue;
      }
      const command = block.ops[this.pc++];
      const args = command.args ?? [];
      const unknown = () => this.hooks.unknown?.(command.op, args, {
        label:this.label, offset:command.offset, variables:this.variables,
      });
      const invoke = name => {
        const context = {
        op:command.op, label:this.label, offset:command.offset,
        variables:this.variables, text:this.text,
        };
        if (SN4_SPECIAL_EXECUTE[command.op]) this.applySpecial(command.op, name, args, context);
        return this.hooks.command?.(name, args, context);
      };
      switch (command.op) {
        case 0x02: this.text += args[0]; break;
        case 0x04: this.text += '\n'; break;
        case 0x09:
          return {type:'pause', label:this.label, offset:command.offset, text:this.text};
        case 0x0b:
          this.clearBeforeRun = true;
          return {type:'pause', label:this.label, offset:command.offset, text:this.text};
        case 0x0d: this.text += this.names[0]; break;
        case 0x0e: this.text += this.names[1]; break;
        // CommandNoop16 has no EE-side visual call, but it terminates a choice
        // response record. Yield the accumulated response before continuing.
        case 0x16:
          this.clearBeforeRun = true;
          return {type:'pause', reason:'choice-separator', label:this.label,
            offset:command.offset, text:this.text};
        case 0x1e: this.hooks.captionSync?.(); break;
        // BrPage::Execute (0x125170) never checks text length and tail-calls
        // 0x125048, whose command-id 0x0c path skips the input-wait setup and
        // returns complete. Clear immediately and continue in the same run.
        case 0x0c:
          this.text = '';
          this.hooks.clearText?.();
          break;
        // MojiSync::Execute (0x12e4f8) waits for the active MojiInOut/After
        // animation. Static renderers still yield one frame so ordering is kept.
        case 0x15: {
          const ticks = this.hooks.mojiSync?.() ?? 0;
          if (ticks > 0) return {type:'wait', reason:'text-effect', label:this.label,
            offset:command.offset, ticks, text:this.text};
          break;
        }
        case 0x32: break;
        case 0x68:
        case 0x69: {
          const spec = args[0] ?? {};
          const left = this.variables.get(spec.var) ?? 0;
          const right = command.op === 0x68 ? spec.value : (this.variables.get(spec.source) ?? 0);
          // EE 0x00101428 (table 0x00219670): 2 sub, 3 add, 4 mul, 5 div,
          // 6 assign, 13 remainder, 14 random 0..right. Other operators abort
          // in the executable, so they are reported and leave the value.
          let value;
          if (spec.op === 2) value = left - right;
          else if (spec.op === 3) value = left + right;
          else if (spec.op === 4) value = Math.imul(left, right);
          else if ((spec.op === 5 || spec.op === 13) && right === 0) { unknown(); break; }
          else if (spec.op === 5) value = Math.trunc(left / right);
          else if (spec.op === 6) value = right;
          else if (spec.op === 13) value = left % right;
          else if (spec.op === 14) value = this.random(right);
          else { unknown(); break; }
          this.variables.set(spec.var, (value << 16) >> 16);
          this.hooks.variable?.(spec, this.variables.get(spec.var));
          break;
        }
        case 0x12:
        case 0x13:
          this.pending = {type:'name', role:command.op - 0x12};
          return {...this.pending, label:this.label, offset:command.offset, text:this.text};
        case 0x40: this.hooks.speed?.(args[0]); break;
        case 0x46: this.hooks.moveX?.(args[0], this.text.length); break;
        case 0x4c: this.hooks.font?.(args[0], args[1], this.text.length); break;
        case 0x50:
          return {type:'wait', label:this.label, offset:command.offset, ticks:args[0], text:this.text};
        case 0x53: this.hooks.letterSpacing?.(args[0], this.text.length); break;
        case 0x55: this.hooks.lineSpacing?.(args[0], this.text.length); break;
        case 0x5a: this.hooks.command5a?.(args[0]); break;
        case 0x5c: this.hooks.command5c?.(args[0]); break;
        case 0x5d: this.hooks.marginLeft?.(args[0]); break;
        case 0x5f: this.hooks.marginRight?.(args[0]); break;
        case 0x61: this.hooks.marginTop?.(args[0]); break;
        case 0x63: this.hooks.marginBottom?.(args[0]); break;
        case 0x65: this.hooks.position?.(args[0], this.text.length); break;
        case 0x66: this.hooks.absolutePosition?.(args[0], this.text.length); break;
        case 0x6a:
        case 0x6b: this.jump(args[0]); break;
        case 0x6c:
          this.pending = {type:'choice', targets:args[0]};
          return {...this.pending, label:this.label, offset:command.offset, text:this.text};
        case 0x6f: this.hooks.wipe?.(...args); break;
        case 0x70:
        case 0x71: {
          const spec = args[0] ?? {};
          const left = this.variables.get(spec.var) ?? 0;
          const right = command.op === 0x70 ? spec.value : (this.variables.get(spec.other) ?? 0);
          const forced = this.hooks.condition?.(spec, left, right);
          if (typeof forced === 'string') { this.jump(forced); break; }
          // EE 0x001014F8 (table 0x002196B0) compares variable to value:
          // 6/7 equal, 8 greater, 9 less, 10 not less, 11 not greater,
          // 12 not equal. Other comparisons abort in the executable.
          let passes = typeof forced === 'boolean' ? forced : ({
            6:left === right, 7:left === right, 8:left > right, 9:left < right,
            10:left >= right, 11:left <= right, 12:left !== right,
          })[spec.cmp];
          if (passes === undefined) { unknown(); passes = true; }
          // CommandIf skips to target when the comparison is false.
          if (!passes && spec.target) this.jump(spec.target);
          break;
        }
        case 0x72: this.hooks.prepareScene?.(args[0]); break;
        case 0x73:
          // Loading a scene replaces the previous message layer. The following
          // caption may wait for media, so clear before yielding from it.
          this.text = '';
          this.hooks.clearText?.();
          this.hooks.scene?.(args[0]);
          break;
        case 0x74: {
          const ticks = this.hooks.caption?.(args[0]) ?? 0;
          if (ticks > 0) return {type:'wait', reason:'music', label:this.label,
            offset:command.offset, ticks, text:this.text};
          break;
        }
        case 0x75: this.hooks.color?.(...args); break;
        case 0x7b: this.hooks.command7b?.(args[0]); break;
        case 0x106: this.hooks.ruby?.(...args, this.text.length); break;
        // EE command-constructor dispatch table 0x0021A240. These are real
        // command classes, not unknown bytecode: presentation and subsystem
        // work is delegated with the original operands and source location.
        case 0x10: invoke('Name3'); break;
        case 0x11: invoke('Name4'); break;
        case 0x17: {
          const ticks = invoke('BgWait') ?? 0;
          if (ticks > 0) return {type:'wait', reason:'background', label:this.label,
            offset:command.offset, ticks, text:this.text};
          break;
        }
        case 0x1a:
          invoke('Break');
          return {type:'break', label:this.label, offset:command.offset, text:this.text};
        case 0x1b: invoke('ManualJump'); break;
        case 0x1f:
          invoke('Cipher');
          // The operand is the final zero-based slot: 11 means 12 presses.
          this.pending = {type:'special', kind:'cipher', length:(args[0] ?? 0) + 1};
          return {...this.pending, label:this.label, offset:command.offset, text:this.text};
        case 0x23: invoke('MiniGame'); break;
        // CommandEnd::Execute (0x0012EF80) only records the ending through
        // 0x001B56F0 (0x27) or 0x001B5730 (0x28) and returns 0, so the
        // following flag updates and jumps still run in the same frame.
        case 0x27: case 0x28: invoke('End'); break;
        case 0x29: invoke('AutoRead'); break;
        case 0x2d: {
          const target = invoke('SpiritJump');
          if (typeof target === 'string') this.jump(target);
          break;
        }
        case 0x2e: invoke('TMemory'); break;
        case 0x2f: invoke('MojiInOut'); break;
        case 0x31: invoke('MojiAfter'); break;
        case 0x34: invoke('RecordStart'); break;
        case 0x35: invoke('RecordEnd'); break;
        case 0x3a: invoke('InbouStart'); break;
        case 0x3b: invoke('InbouEnd'); break;
        case 0x3c: invoke('Center'); break;
        case 0x3d: invoke('MiniGameAreaStart'); break;
        case 0x3e: invoke('MiniGameAreaEnd'); break;
        case 0x41: case 0x45: case 0x54: case 0x56:
        case 0x5e: case 0x60: case 0x62: case 0x64:
          invoke('Default'); break;
        case 0x47: invoke('MiniGameParam'); break;
        case 0x48: invoke('EventBox'); break;
        case 0x4d: this.hooks.line?.(args[0], args[1], this.text.length); break;
        case 0x51:
          return {type:'wait', reason:'cancelable', label:this.label,
            offset:command.offset, ticks:args[0], text:this.text};
        case 0x57: invoke('MojiInOutParam'); break;
        case 0x59: invoke('MojiAfterParam'); break;
        case 0x5b: invoke('MojiAllInOut'); break;
        case 0x76: invoke('AddSelect'); break;
        case 0x79: invoke('AutoReadParam'); break;
        case 0x7a:
          invoke('ClickMap');
          this.pending = {type:'special', kind:'click-map', targets:args[0].targets};
          return {...this.pending, label:this.label, offset:command.offset, text:this.text};
        case 0x7c: invoke('PageLoopStart'); break;
        case 0x7e:
          invoke('Panel');
          this.pending = {type:'special', kind:'panel', ...args[0]};
          return {...this.pending, label:this.label, offset:command.offset, text:this.text};
        case 0x7f:
          invoke('DelusionPanel');
          this.pending = {type:'special', kind:'delusion-panel', ...args[0]};
          return {...this.pending, label:this.label, offset:command.offset, text:this.text};
        case 0x81: invoke('NameInputGeneral'); break;
        case 0x82:
          invoke('NameInputCriminal');
          this.pending = {type:'special', kind:'criminal-name', targets:args[0].targets};
          return {...this.pending, label:this.label, offset:command.offset, text:this.text};
        case 0x83: invoke('TMemorySave'); break;
        case 0x84: invoke('TMemoryLoad'); break;
        default:
          throw new Error(`Unsupported SN4 opcode 0x${command.op.toString(16).padStart(2, '0')} at ${this.label}+0x${command.offset.toString(16)}`);
      }
    }
  }
}
