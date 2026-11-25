// 428 PSP script VM: control flow and variables, reimplemented from the EBOOT handlers
// (table 0x089C090C). Presentation ops are not executed here: they are handed to the host
// as events so the renderer/sound layers can implement them one by one.
import { decodeAt } from './sns.js';

const be = (a, o, n) => { let v = 0; for (let i = 0; i < n; i++) v = (v << 8) | a[o + i]; return v >>> 0; };
const s16 = v => (v << 16) >> 16;
const cstrAt = (a, o) => { let e = o; while (e < a.length && a[e]) e++; return [new TextDecoder('ascii').decode(a.subarray(o, e)), e + 1]; };

// 0x08882978: compare codes. Unknown codes return 0x0fffffff (true).
export function compare(a, code, b) {
  switch (code) {
    case 6: case 7: return a === b;
    case 8: return a > b;
    case 9: return a < b;
    case 10: return a >= b;
    case 11: return a <= b;
    case 12: return a !== b;
    default: return true;
  }
}
// 0x08882a08 / 0x08882a90 arithmetic codes on byte variables. Other codes store 0xff.
export function arith(a, code, b) {
  switch (code) {
    case 2: return a - b; case 3: return a + b; case 4: return a * b;
    case 5: return b ? Math.trunc(a / b) : 0; case 13: return b ? a % b : 0;
    case 6: case 14: return b;
    default: return 0xff;
  }
}

// Decode the control ops' payloads (arg = bytes after the length byte).
export function decodeControl(op, arg) {
  switch (op) {
    case 0x4f: case 0x50: return { v: be(arg, 0, 2), code: arg[2], x: be(arg, 3, 2) };
    case 0x51: case 0x52: case 0x56: case 0x59: case 0x5a: { const [label] = cstrAt(arg, 1); return { slot: arg[0], label }; }
    case 0x57: case 0x58: return decodeIf(op, arg);
    case 0x53: case 0x54: case 0x55: return decodeChoice(op, arg);
    case 0x5c: case 0x5d: return { v: be(arg, 0, 2) };
  }
  return null;
}
function decodeIf(op, arg) {
  let p = 0; const terms = []; let tail;
  if (op === 0x58) { terms.push({ kind: 'vv', a: be(arg, 0, 2), code: arg[2], b: be(arg, 3, 2), mode: 0 }); p = 5; }
  else {
    const n = s16(be(arg, 0, 2)); p = 2;
    if (n >= 0) { terms.push({ kind: 'vi', a: n, code: arg[p], b: be(arg, p + 1, 2), mode: 0 }); p += 3; }
    else {
      let left = -n, mode = 0;
      while (left > 0) {
        const t = arg[p++];
        if (t === 0 || t === 1) { mode = t; continue; }
        terms.push({ kind: t === 0x58 ? 'vv' : 'vi', a: be(arg, p, 2), code: arg[p + 2], b: be(arg, p + 3, 2), mode });
        p += 5; left--;
      }
    }
  }
  const slot = arg[p]; [tail] = cstrAt(arg, p + 1);
  return { terms, slot, label: tail };
}
function decodeChoice(op, arg) {
  // 53/54/55: three header bytes (third*60 = timer frames), count, then per choice u8, slot, label.
  let p = 3; const head = [arg[0], arg[1], arg[2]]; const n = arg[p++]; const options = [];
  for (let i = 0; i < n; i++) { const id = arg[p], slot = arg[p + 1]; const [label, q] = cstrAt(arg, p + 2); options.push({ id, slot, label }); p = q; }
  let extra = null; if (op === 0x54 && p < arg.length) [extra] = cstrAt(arg, p);
  return { head, timer: arg[2] * 60, options, extra };
}

export class VM {
  constructor(sns, host = {}) {
    this.sns = sns; this.host = host;
    this.vars = new Uint8Array(0x10000);
    this.script = null; this.pc = 0; this.halted = false; this.pendingChoice = null;
    this.flow = []; this.stack = []; // 5A call / 5B,BB return (0x0887A210 / 0x0887A334) // labels passed by goto (not starting with '_'), cf. ctx+0x27a8
  }
  get(v) { return this.vars[v]; }
  set(v, x) { this.vars[v] = x & 0xff; }
  goto(slot, label) {
    const s = this.sns.scripts[slot];
    const pc = s && s.labels.get(label);
    if (pc === undefined) throw new Error(`missing label ${slot}:${label}`);
    this.script = s; this.pc = pc;
    if (label[0] !== '_') this.flow.push(label);
  }
  cond(terms) {
    let acc = 0;
    for (const t of terms) {
      const a = this.vars[t.a], b = t.kind === 'vv' ? this.vars[t.b] : t.b;
      const r = compare(a, t.code, b) ? 1 : 0;
      acc = t.mode ? (acc & r) : (acc | r);
    }
    return !!acc;
  }
  choose(index) {
    const c = this.pendingChoice; if (!c) throw new Error('no choice pending');
    const o = c.options[index]; this.pendingChoice = null; this.goto(o.slot, o.label);
  }
  // Run until the host must act (choice, wait-type op) or the script ends. Returns the event.
  step() {
    if (this.pendingChoice) return { type: 'choice', ...this.pendingChoice };
    const f = this.script.bytes;
    const x = decodeAt(f, this.pc);
    if (!x) { this.halted = true; return { type: 'end' }; }
    this.pc = x.next; const op = x.op;
    switch (op) {
      case 0x4f: { const d = decodeControl(op, x.arg); this.set(d.v, arith(this.get(d.v), d.code, d.x)); return null; }
      case 0x50: { const d = decodeControl(op, x.arg); this.set(d.v, arith(this.get(d.v), d.code, this.get(d.x))); return null; }
      case 0x57: case 0x58: { const d = decodeControl(op, x.arg); if (!this.cond(d.terms)) this.goto(d.slot, d.label); return null; }
      case 0x52: case 0x59: { const d = decodeControl(op, x.arg); this.goto(d.slot, d.label); return { type: 'jump', op, ...d }; }
      case 0x56: return { type: 'label', label: x.label };
      case 0x5a: { const d = decodeControl(op, x.arg); this.stack.push([this.script, this.pc]); this.goto(d.slot, d.label); return null; }
      case 0x5b: case 0xbb: { const r = this.stack.pop(); if (!r) throw new Error('return with empty stack'); [this.script, this.pc] = r; return null; }
      case 0xac: return { type: 'sceneEnd', pc: x.pc };
      case 0x5c: { const d = decodeControl(op, x.arg); this.set(d.v, 1); return null; }
      case 0x5d: { const d = decodeControl(op, x.arg); this.set(d.v, 0); return null; }
      case 0x53: case 0x54: case 0x55: { const d = decodeControl(op, x.arg); this.pendingChoice = { op, ...d }; return { type: 'choice', op, ...d }; }
      case 0x01: return { type: 'text', text: x.text, pc: x.pc };
      case 0x00: return null;
      default: return { type: 'op', op, arg: x.arg, pc: x.pc };
    }
  }
}
