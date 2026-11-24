// Adapter for a tiny synthetic "ROM" written for tests (tests/fixtures/make-sample-rom.mjs).
// It shows the shape a real adapter takes: check the header, read a string table and a
// script of opcodes from the bytes, and build story nodes from them. All text is self-written.
//
// Layout: GBA-style header (title at 0xA0, code "SNSM" at 0xAC), then at 0x100:
//   u16 stringCount, strings (u16 byteLength + UTF-8), u16 opCount, ops (u8 opcode + u16 args)
//   01 LABEL s        start a node named strings[s]
//   02 SCENE s        scene id of the current node
//   03 TEXT s         one page
//   04 TEXTJA s j     one page with its original
//   05 CHOICE q n     choice node: question strings[q], then n × OPTION
//   06 OPTION l t     option label strings[l] going to node strings[t]
//   07 GOTO t         current node continues to strings[t]
//   08 END            current node ends the data
import { gbaHeader } from './gba.js';

const CODE = 'SNSM';

export default {
  id: 'sample-rom',
  title: '시험용 ROM',
  files: [{ role: 'main', label: '시험용 ROM 파일 (.gba)', required: true }],

  identify(bytes) {
    return gbaHeader(bytes)?.code === CODE ? 'main' : null;
  },

  convert({ main }) {
    const view = new DataView(main.buffer, main.byteOffset, main.byteLength);
    let p = 0x100;
    const u8 = () => view.getUint8(p++);
    const u16 = () => { const v = view.getUint16(p, true); p += 2; return v; };
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const strings = Array.from({ length: u16() }, () => {
      const len = u16();
      const s = decoder.decode(main.subarray(p, p + len));
      p += len;
      return s;
    });
    const str = (i) => {
      if (strings[i] === undefined) throw new Error(`문자열 ${i}이 없습니다 (오프셋 ${p.toString(16)}).`);
      return strings[i];
    };

    const nodes = {};
    let entry = null;
    let cur = null;
    const opCount = u16();
    for (let k = 0; k < opCount; k++) {
      const op = u8();
      if (op === 0x01) {
        const id = str(u16());
        cur = nodes[id] = { kind: 'passage', pages: [] };
        entry ??= id;
      } else if (!cur) {
        throw new Error(`LABEL 전에 명령 ${op.toString(16)}이 있습니다.`);
      } else if (op === 0x02) cur.scene = str(u16());
      else if (op === 0x03) cur.pages.push(str(u16()));
      else if (op === 0x04) { const ko = str(u16()); cur.pages.push({ ko, ja: str(u16()) }); }
      else if (op === 0x05) {
        const text = str(u16());
        const n = u16();
        Object.assign(cur, { kind: 'choice', text, options: [] });
        delete cur.pages;
        for (let i = 0; i < n; i++) {
          if (u8() !== 0x06) throw new Error('CHOICE 뒤에 OPTION이 아닙니다.');
          k++;
          cur.options.push({ key: String.fromCharCode(65 + i), label: str(u16()), to: str(u16()) });
        }
      } else if (op === 0x07) cur.to = str(u16());
      else if (op === 0x08) cur.to = null;
      else throw new Error(`모르는 명령 ${op.toString(16)}`);
    }
    return { schemaVersion: 1, gameId: 'sample-rom', title: '시험용 ROM 데모', entry, nodes };
  },
};
