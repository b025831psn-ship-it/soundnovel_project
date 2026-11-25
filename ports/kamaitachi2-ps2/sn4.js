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
      const invoke = name => this.hooks.command?.(name, args, {
        op:command.op, label:this.label, offset:command.offset,
        variables:this.variables, text:this.text,
      });
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
        case 0x0c:
        case 0x15:
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
        case 0x46: this.hooks.spacing?.(args[0]); break;
        case 0x4c: this.hooks.font?.(...args); break;
        case 0x50:
          return {type:'wait', label:this.label, offset:command.offset, ticks:args[0], text:this.text};
        case 0x55: this.hooks.lineSpacing?.(args[0]); break;
        case 0x5a: this.hooks.command5a?.(args[0]); break;
        case 0x5c: this.hooks.command5c?.(args[0]); break;
        case 0x5d: this.hooks.marginLeft?.(args[0]); break;
        case 0x61: this.hooks.marginTop?.(args[0]); break;
        case 0x65: this.hooks.position?.(args[0], this.text.length); break;
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
        case 0x106: this.hooks.ruby?.(...args); break;
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
          return {type:'pause', reason:'break', label:this.label, offset:command.offset, text:this.text};
        case 0x1b: invoke('ManualJump'); break;
        case 0x1f: invoke('Cipher'); break;
        case 0x23: invoke('MiniGame'); break;
        case 0x27: case 0x28:
          invoke('End');
          return {type:'end', reason:command.op === 0x27 ? 'normal' : 'alternate',
            label:this.label, offset:command.offset, text:this.text};
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
        case 0x4d: invoke('Line'); break;
        case 0x51:
          return {type:'wait', reason:'cancelable', label:this.label,
            offset:command.offset, ticks:args[0], text:this.text};
        case 0x53: invoke('LetterSpace'); break;
        case 0x57: invoke('MojiInOutParam'); break;
        case 0x59: invoke('MojiAfterParam'); break;
        case 0x5b: invoke('MojiAllInOut'); break;
        case 0x76: invoke('AddSelect'); break;
        case 0x79: invoke('AutoReadParam'); break;
        case 0x7a: invoke('ClickMap'); break;
        case 0x7c: invoke('PageLoopStart'); break;
        case 0x7e: invoke('Panel'); break;
        case 0x7f: invoke('DelusionPanel'); break;
        case 0x81: invoke('NameInputGeneral'); break;
        case 0x82: invoke('NameInputCriminal'); break;
        case 0x83: invoke('TMemorySave'); break;
        case 0x84: invoke('TMemoryLoad'); break;
        default:
          throw new Error(`Unsupported SN4 opcode 0x${command.op.toString(16).padStart(2, '0')} at ${this.label}+0x${command.offset.toString(16)}`);
      }
    }
  }
}
