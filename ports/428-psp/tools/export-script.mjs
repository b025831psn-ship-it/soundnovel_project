// Export every line of to.sns for translation: one JSON per script, entries in script order with fixed IDs.
// usage: node tools/export-script.mjs <to.sns> <outdir>
// Entry: { id: "<scene label>/<n>", pc, ja, end, center? }  — ja keeps ruby as {base|reading}, 43 as …, 2B n as ―×n, 1E as \n.
// end = the op that closes the entry: 1B line wait, 1F page wait, 25 block end, 2B dash+wait.
// Choice: { id: "<scene label>/c<n>", pc, choice: [{ label, slot }], timer } (option text is shown by the preceding lines).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { decryptSns, parseSns, iterate } from '../engine/sns.js';
import { decodeControl } from '../engine/vm.js';

const [src, out] = process.argv.slice(2);
const raw = new Uint8Array(readFileSync(src)); const sns = parseSns(raw[0x10] === 0x43 ? decryptSns(raw) : raw);
mkdirSync(out, { recursive: true });
const index = []; let total = 0;
for (const s of sns.scripts) {
  const name = s.name.replace(/\.xml$/, ''); const entries = [];
  let label = `${name}@start`, n = 0, c = 0, buf = '', pc0 = null, ruby = null, center = false;
  const flush = end => {
    if (buf.replace(/\n/g, '') === '') { buf = ''; pc0 = null; return; }
    const e = { id: `${label}/${++n}`, pc: pc0, ja: buf.replace(/\n+$/, ''), end }; if (center) e.center = true;
    entries.push(e); buf = ''; pc0 = null;
  };
  for (const x of iterate(s.bytes, s.codeStart)) {
    const at = () => { if (pc0 === null) pc0 = x.pc; };
    switch (x.op) {
      case 0x01: at(); if (ruby) { if (ruby.base === null) ruby.reading += x.text; else { buf += `{${x.text}|${ruby.reading}}`; ruby = null; } } else buf += x.text; break;
      case 0x1c: at(); ruby = { reading: '', base: null }; break;
      case 0x1d: if (ruby) ruby.base = ''; break;
      case 0x43: at(); buf += '…'; break;
      case 0x2b: at(); buf += '―'.repeat(x.arg[0] || 1); flush('2B'); break;
      case 0x1e: if (buf) buf += '\n'; break;
      case 0x1b: if (center) { if (buf) buf += '\n'; } else flush('1B'); break;
      case 0x1f: flush('1F'); break;
      case 0x25: flush('25'); break;
      case 0x17: center = true; break;
      case 0x18: flush('18'); center = false; break;
      case 0x56: flush('label'); label = x.label; n = 0; c = 0; break;
      case 0x53: case 0x54: case 0x55: { flush('choice'); const d = decodeControl(x.op, x.arg); entries.push({ id: `${label}/c${++c}`, pc: x.pc, choice: d.options.map(o => ({ label: o.label, slot: o.slot })), timer: d.timer }); break; }
    }
  }
  flush('eof');
  const lines = entries.filter(e => e.ja).length; total += lines;
  writeFileSync(`${out}/${name}.json`, JSON.stringify({ script: name, entries }, null, 1));
  index.push({ script: name, lines, choices: entries.length - lines });
}
writeFileSync(`${out}/index.json`, JSON.stringify({ source: 'to.sns', total, scripts: index }, null, 1));
console.log(JSON.stringify({ scripts: index.length, lines: total }));
