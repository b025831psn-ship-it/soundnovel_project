// 428 ~封鎖された渋谷で~ (PSP, ULJS-00219) scenario container: to.sns
// Plain = cipher - key (bytewise, key repeats every 16 bytes).
export const SNS_KEY = new TextEncoder().encode('CSD-CSCNV:01.82\0');

export function decryptSns(bytes) {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = (bytes[i] - SNS_KEY[i & 15]) & 255;
  return out;
}

const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const cstr = (b, o) => { let e = o; while (b[e]) e++; return new TextDecoder('ascii').decode(b.subarray(o, e)); };

// Ops whose byte stream has no length byte (see EBOOT handler table 0x089C090C).
export const NOLEN = new Set([0x01, 0x02, 0x1c, 0x1d]);

export function parseSns(plain) {
  const count = u32(plain, 0x100);
  const scripts = [];
  for (let i = 0; i < count; i++) {
    const off = u32(plain, 0x104 + i * 8), size = u32(plain, 0x108 + i * 8);
    const f = plain.subarray(off, off + size);
    const name = cstr(f, 4);
    const sections = [0, 1, 2, 3, 4].map(k => u32(f, 0x420 + k * 4));
    const codeStart = sections[4];
    scripts.push({ index: i, name, bytes: f, codeStart, sections, labels: scanLabels(f, codeStart) });
  }
  return { scripts, byName: Object.fromEntries(scripts.map(s => [s.name.replace(/\.xml$/, ''), s])) };
}

// Walk the bytecode once and record label positions (pc just after the label op).
export function scanLabels(f, start) {
  const labels = new Map();
  for (const ins of iterate(f, start)) {
    if (ins.op === 0x56) labels.set(ins.label, ins.next);
  }
  return labels;
}

const sjis = new TextDecoder('shift_jis');
export function* iterate(f, start, end = f.length) {
  let p = start;
  while (p < end - 1) {
    const op = f[p];
    if (op === 0x01) {
      let q = p + 1; while (q < end && f[q] !== 0x02) q++;
      yield { pc: p, op, text: sjis.decode(f.subarray(p + 1, q)), next: q };
      p = q; continue;
    }
    if (NOLEN.has(op)) { yield { pc: p, op, next: p + 1 }; p++; continue; }
    const len = f[p + 1];
    const arg = f.subarray(p + 2, p + 2 + len);
    const ins = { pc: p, op, arg, next: p + 2 + len };
    if (op === 0x56 || op === 0x59) ins.label = cstr(arg, 1);
    yield ins;
    p = ins.next;
  }
}
