// 428 game progress (zapping) on top of the script VM.
// The scripts decide locks (KEEP OUT), GOON checks and the jump into the next block themselves; the engine keeps
// where each character stands and when a block is complete:
//  - every scene label maps to a time-chart node (to.flo: character, hour, minute, kind);
//  - a scene end (AC) after ..._CONTINUE leaves that character waiting at its ..._CONTINUE_CHECK, which is run again
//    when the player picks the character later (it jumps on once the target was reached by a JUMP or the block is done);
//  - after ..._BADEND the character goes back to its last checkpoint (RESTART / GOON check / CONTINUE_CHECK);
//  - a JUMP keyword (op 70) moves play to another character and sets the var its CONTINUE_CHECK waits for;
//  - when the block is complete (EBOOT tables below) var 14 is raised and new characters join the select.
// Character select itself (original: 主人公を選択してください, 10:00 - 11:00 band) is drawn by the host.
export const CHARACTERS = [
  { id: 0, key: 'achi', ja: '亜智', ko: '아치' },
  { id: 1, key: 'kanou', ja: '加納', ko: '카노' },
  { id: 2, key: 'minori', ja: '御法川', ko: '미노리카와' },
  { id: 3, key: 'tama', ja: 'タマ', ko: '타마' },
  { id: 4, key: 'oosawa', ja: '大沢', ko: '오오사와' },
  { id: 5, key: 'tateno', ja: '建野', ko: '타테노' },
  { id: 6, key: 'jack', ja: 'ジャック', ko: '잭' },
  { id: 7, key: 'canan', ja: 'カナン', ko: '카난' },
  { id: 8, key: 'suzune', ja: '鈴音', ko: '스즈네' },
  { id: 9, key: 'ecokichi', ja: 'エコ吉', ko: '에코키치' },
  { id: 10, key: 'minori', ja: '御法川', ko: '미노리카와' },
];
const MAIN = new Set([0, 1, 2, 3, 4, 5, 6]); // main story; 7–10 are bonus/hidden scenarios started from their own menus

// Hour blocks, from the EBOOT tables (column order K A O M F J T S C E -> character id below):
//  START 0x089BDD04: each character's first scene in the block; END 0x089BE2E4: the CONTINUE_CHECK that ends it;
//  DONE 0x089AB654: var set at that character's block end (..._CONTINUE: 5c 300..); STORY 0x089BFACC: the block's
//  story vars [from, to) that must all be set. The engine (0x08876338) moves to the next block once every DONE var
//  and STORY var is set and every END label was passed; it then raises var 14 (the furthest block) which the
//  scripts' TOP_FLAG_xxA_GOON_CHECK test before jumping into the next block.
const COLS = [1, 0, 4, 2, 3, 6, 5, 8, 7, 9];
const T = (s) => s.split(' ').map(x => (x === '-' ? null : x));
const BLOCK_START = [
  'K01A_0010_01 A01A_0000_01 - - - - -', 'K02A_0010_01 A02A_0010_01 O02A_0010_01 M02A_0010_01 F02A_0010_01 - -',
  'K03A_0010_01 A03A_0010_01 O03A_0010_01 M03A_0010_01 F03A_0010_01 - -', 'K04A_0010_01 A04A_0010_01 O04A_0010_01 M04A_0010_01 F04A_0010_01 - -',
  'K05A_0010_01 A05A_0010_01 O05A_0010_01 M05A_0010_01 F05A_0010_01 - -', 'K06A_0010_01 A06A_0010_01 O06A_0010_01 M06A_0010_00 F06A_0010_01 - -',
  'K07A_0010_01 A07A_0010_01 O07A_0010_01 M07A_0010_01 F07A_0010_01 - -', 'K08A_0010_01 A08A_0010_01 O08A_0010_01 - F08A_0010_01 - -',
  'K09A_0010_01 A09A_0010_01 - - F09A_0010_01 J09A_0010_01 T09A_0010_01',
].map(r => T(r).map(x => x && x + '_RESTART'));
const BLOCK_END = [
  'K01A_0140_08 A01A_0090_15 - - - - -', 'K02A_0100_11 A02A_0110_04 O02A_0110_04 M02A_0070_02 F02A_0130_06 - -',
  'K03A_0090_23 A03A_0080_09 O03A_0120_01 M03A_0120_03 F03A_0060_14 - -', 'K04A_0110_03 A04A_0130_07 O04A_0100_06 M04A_0120_09 F04A_0090_08 - -',
  'K05A_0080_17 A05A_0210_01 O05A_0150_11 M05A_0210_05 F05A_0070_01 - -', 'K06A_0130_05 A06A_0080_16 O06A_0060_16 M06A_0080_04 F06A_0100_04 - -',
  'K07A_0160_06 A07A_0090_12 O07A_0070_13 - F07A_0100_15 - -', 'K08A_0067_25 A08A_0180_06 - - F08A_0050_05 - -',
].map(r => T(r).map(x => x && x + '_CONTINUE_CHECK'))
  .concat([T('K09A_0095_4310 A09A_0090_4000 O08A_0100_0110 M07A_0190_0200 F09A_0040_4800 J09A_0200_0800 T09A_0190_1300')]);
const BLOCK_DONE = [[300, 301], [302, 303, 304, 305, 306], [307, 308, 309, 310, 311], [312, 313, 314, 315, 316], [317, 318, 319, 320, 321],
  [322, 323, 324, 325, 326], [327, 328, 329, 330, 331], [332, 333, 334, -1, 335], [336, 337, -1, -1, 338, 339, 340]];
const BLOCK_STORY = [31, 35, 42, 50, 58, 64, 70, 77, 78, 88];
export const BLOCKS = BLOCK_START.map((st, b) => ({
  start: new Map(st.map((l, i) => [COLS[i], l]).filter(([, l]) => l)),
  end: new Map(BLOCK_END[b].map((l, i) => [COLS[i], l]).filter(([, l]) => l)),
  done: BLOCK_DONE[b].filter(v => v >= 0), story: [BLOCK_STORY[b], BLOCK_STORY[b + 1]],
}));

export class Game {
  constructor(flo, vm) {
    this.vm = vm; this.nodeOf = new Map();
    // a ZAP node (kind 3) lists the zap target of another character after its own label: map only its own label
    for (const n of flo.nodes) for (const l of n.kind === 3 ? n.labels.slice(0, 1) : n.labels) if (!this.nodeOf.has(l)) this.nodeOf.set(l, n);
    this.chars = new Map(); // char -> { resume, status, hour, minute }
    this.block = 0; this.current = null; this.trail = []; // labels passed in the current scene (goto and inline 56)
    this.passed = new Set(); // every scene label ever passed (time chart nodes that can be jumped to)
  }
  // Open block b: characters whose story starts in it join the select at their first scene.
  openBlock(b) {
    this.block = b; const B = BLOCKS[b]; if (!B) return;
    for (const [c, l] of B.start) {
      if (this.chars.has(c)) continue; const n = this.nodeOf.get(l);
      this.chars.set(c, { resume: l, status: 'ready', hour: n?.hour ?? 10 + b, minute: n?.minute ?? 0 });
    }
  }
  newGame() { this.chars.clear(); this.passed.clear(); this.vm.set(14, 0); this.openBlock(0); }
  // Engine block check (0x08876338), run at each scene end: all characters of the block at their block end.
  blockDone(b = this.block) {
    const B = BLOCKS[b], v = this.vm; if (!B || b >= 8) return false;
    if (!B.done.every(x => v.get(x) > 0)) return false;
    for (let x = B.story[0]; x < B.story[1]; x++) if (!v.get(x)) return false;
    return [...B.end.values()].every(l => this.passed.has(l));
  }
  advance() {
    if (!this.blockDone()) return false;
    const b = this.block + 1; if (this.vm.get(14) < b) this.vm.set(14, b);
    this.openBlock(b); return true;
  }
  // Characters shown on the select screen, in story order.
  selectable() { return [...this.chars].filter(([, s]) => s.status !== 'end').map(([c, s]) => ({ ...CHARACTERS[c], ...s })).sort((a, b) => a.id - b.id); }
  // Called for every label the VM passes (vm.flow / 'label' events).
  passLabel(label) {
    if (label[0] !== "_") { this.trail.push(label); this.passed.add(label); } if (this.trail.length > 64) this.trail.shift();
    const n = this.nodeOf.get(label); if (!n || !MAIN.has(n.character)) return;
    this.current = n.character;
    const s = this.chars.get(n.character) || { status: 'ready' };
    s.hour = n.hour; s.minute = n.minute;
    // checkpoints; a RESTART inside a KEEP OUT branch (..._LOCKnnn_...) is not one: after that bad end the player
    // goes back to the GOON check before it, which passes once the other character has made the needed choice
    if (!/_LOCK\d/.test(label) && (/_RESTART\d*$|_CONTINUE_CHECK$|_GOON\d*_CHECK$/.test(label) || n.kind === 0)) { s.resume = label; s.status = 'ready'; }
    this.chars.set(n.character, s);
  }
  // Called at a scene end (AC). Returns what happened to the character that was playing.
  sceneEnd() {
    const r = this.sceneEnd0(); if (this.advance()) r.block = this.block; return r;
  }
  sceneEnd0() {
    const c = this.current, s = this.chars.get(c); if (!s) return { kind: 'none' };
    const flow = this.trail, last = flow.at(-1) || '';
    if (/_CONTINUE$/.test(last)) {
      const check = [...flow].reverse().find(l => /_CONTINUE_CHECK$/.test(l));
      s.status = 'continue'; if (check) s.resume = check; return { kind: 'continue', char: c };
    }
    if (/_BADEND$/.test(last)) { s.status = 'badend'; return { kind: 'badend', char: c, label: last }; } // resume stays at the last checkpoint
    if (/_END$|_THE_END$/.test(last)) { s.status = 'end'; return { kind: 'end', char: c, label: last }; }
    return { kind: 'other', char: c, label: last };
  }
  // JUMP (zap) through a keyword: the character who was playing can come back to the zap point later
  // (its ZAP node on the time chart), and the target character's scene runs now.
  zap() {
    const z = this.vm.zap; if (!z?.open) return false;
    const c = this.current, s = this.chars.get(c);
    const here = [...this.trail].reverse().find(l => this.nodeOf.get(l)?.kind === 3 && this.nodeOf.get(l).character === c);
    if (s && here) { s.resume = here; s.status = 'ready'; }
    this.trail = []; this.vm.jump(z); return true;
  }
  // Time chart jump: play from any scene node passed before (the original lets the player pick a node on タイムチャート).
  jumpTo(label, where) {
    const n = this.nodeOf.get(label); if (!n) return false;
    const s = this.chars.get(n.character); if (!s) return false;
    s.resume = label; s.status = 'ready'; return this.play(n.character, where);
  }
  // Start playing a character from where they stand.
  play(c, where) {
    const s = this.chars.get(c); if (!s?.resume) return false;
    const slot = where(s.resume); if (slot < 0) return false;
    this.vm.pendingChoice = null; this.vm.stack = []; this.vm.halted = false;
    this.trail = []; this.vm.goto(slot, s.resume); this.current = c; return true;
  }
}
