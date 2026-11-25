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
  }

  setNames(names) {
    if (!Array.isArray(names) || names.length !== 2) throw new Error('SN4 requires two names');
    this.names = [...names];
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
      switch (command.op) {
        case 0x02: this.text += args[0]; break;
        case 0x04: this.text += '\n'; break;
        case 0x09:
        case 0x0b:
          return {type:'pause', label:this.label, offset:command.offset, text:this.text};
        case 0x0d: this.text += this.names[0]; break;
        case 0x0e: this.text += this.names[1]; break;
        case 0x16: break;
        case 0x1e: this.hooks.captionSync?.(); break;
        case 0x12:
        case 0x13:
          this.pending = {type:'name', role:command.op - 0x12};
          return {...this.pending, label:this.label, offset:command.offset, text:this.text};
        case 0x40: this.hooks.speed?.(args[0]); break;
        case 0x46: this.hooks.spacing?.(args[0]); break;
        case 0x4c: this.hooks.font?.(...args); break;
        case 0x50: this.hooks.wait?.(args[0]); break;
        case 0x55: this.hooks.lineSpacing?.(args[0]); break;
        case 0x65: this.hooks.position?.(args[0]); break;
        case 0x6a:
        case 0x6b: this.jump(args[0]); break;
        case 0x6c:
          this.pending = {type:'choice', targets:args[0]};
          return {...this.pending, label:this.label, offset:command.offset, text:this.text};
        case 0x6f: this.hooks.wipe?.(...args); break;
        case 0x70: {
          const target = this.hooks.condition?.(args[0]);
          if (target) this.jump(target);
          break;
        }
        case 0x72: this.hooks.prepareScene?.(args[0]); break;
        case 0x73: this.hooks.scene?.(args[0]); break;
        case 0x74: this.hooks.caption?.(args[0]); break;
        case 0x75: this.hooks.color?.(...args); break;
        default:
          throw new Error(`Unsupported SN4 opcode 0x${command.op.toString(16).padStart(2, '0')} at ${this.label}+0x${command.offset.toString(16)}`);
      }
    }
  }
}
