// The game's effect-script player (AKZJ 08002B00 and 080023B0-08002D94): scenario requests
// >= 1000 start a small script that plays sound effects on m4a players 1-10 and moves their
// volume, pan and pitch. Six slots of 0x78 bytes at 020000A8 run once per VBlank interrupt.
//
// Slot fields keep the native offsets in their names:
//   id s16 +00, pc +04, loopPc +08, base +0C, players s16[11] +10 (song per player 1-10),
//   cont u16 +26, wait u16 +28, flag u8 +2A, done u8 +2B,
//   volume: frames +2C, delta +3C, current +44, target +4C, applied +30
//   master: frames +2E, delta +40, current +48, target +50
//   pitch:  current +54, delta +58, value +5C, target +60, frames +74, base u16 +70, applied +38
//   pan:    delta +64, current +68, target +6C, frames +72, applied +34
//   loop count u16 +76
// Global: busy s16[11] 02000090 (song per player 1-10), paused u8 02000378.
//
// engine: m4a.js M4A (playerStart, playerStop, playerStopped, immInit, volumeControl,
//   panControl, pitchControl).
// data: { base, programs } from scene-audio.json `effects` and the bytes of effects.bin.

const SLOTS = 6;
const asr8 = (v) => (v < 0 ? v + 0xff : v) >> 8; // the `adds #0xff; asrs #8` rounding
const div = (a, b) => Math.trunc(a / b); // 08016520
const s16 = (v) => (v << 16) >> 16;
const s8 = (v) => (v << 24) >> 24;

function newSlot() {
  return {
    id: -1, pc: 0, loopPc: 0, base: 0, players: new Array(11).fill(0),
    cont: 0, wait: 0, flag: 0, done: 0,
    volFrames: 0, volDelta: 0, vol: 0, volTarget: 0, volApplied: 0,
    masterFrames: 0, masterDelta: 0, master: 0, masterTarget: 0,
    pitch: 0, pitchDelta: 0, pitchValue: 0, pitchTarget: 0, pitchFrames: 0, pitchBase: 0, pitchApplied: 0,
    panDelta: 0, pan: 0, panTarget: 0, panFrames: 0, panApplied: 0,
    loopCount: 0,
  };
}

export class Effects {
  constructor(engine, data, bytes) {
    this.engine = engine;
    this.data = data;
    this.bytes = bytes;
    this.slots = Array.from({ length: SLOTS }, newSlot);
    this.busy = new Array(11).fill(0);
    this.paused = 0;
  }

  u8(addr) {
    return this.bytes[addr - this.data.base] ?? 0;
  }

  // 0800259C
  byte(slot) {
    return this.u8(slot.pc++);
  }

  // 08002580 reads big-endian, then 08009B34 swaps: the little-endian word.
  word(slot) {
    const lo = this.u8(slot.pc), hi = this.u8(slot.pc + 1);
    slot.pc += 2;
    return lo | (hi << 8);
  }

  // ---- calls from the scenario ---------------------------------------------------------------

  // 08002C00 (0800A510 with request - 1000)
  start(id, speed) {
    for (const slot of this.slots) {
      if (slot.id === id) {
        this.stopPlayers(slot);
        slot.id = -1;
      }
    }
    const index = this.slots.findIndex((slot) => slot.id === -1);
    if (index < 0) return;
    const slot = (this.slots[index] = newSlot());
    slot.id = 0; // the clear leaves 0 until the end of the routine
    slot.pitchBase = 0x3000;
    if (speed === 0) {
      slot.master = 0x10000;
      slot.masterTarget = 0x10000;
    } else {
      slot.masterFrames = speed;
      slot.masterDelta = div(0x10000, speed);
      slot.masterTarget = 0x10000;
    }
    const program = this.data.programs[id] ?? 0;
    slot.loopPc = slot.pc = slot.base = program;
    slot.id = id;
  }

  // 08002CB0 (0800A4CC with request - 1000)
  fade(id, speed) {
    const slot = this.slots.find((s) => s.id === id);
    if (!slot) return;
    if (speed === 0) {
      this.stopPlayers(slot);
      slot.id = -1;
    } else {
      slot.masterFrames = speed;
      slot.masterDelta = -div(slot.master, speed);
      slot.masterTarget = 0;
    }
  }

  // 08002D50 (opcode 35): the flag that script opcodes 0A/0B test.
  setFlag(value, id) {
    const slot = this.slots.find((s) => s.id === id);
    if (slot) slot.flag = value & 0xff;
  }

  // 08002CFC (opcode 34 with request > 99): a slot running effect `id` holds the scenario until
  // it marks itself done (at most 601 frames); the mark is then cleared.
  waiting(id, frames) {
    const slot = this.slots.find((s) => s.id === id);
    if (!slot) return false;
    if (slot.done === 1 || frames > 600) {
      slot.done = 0;
      return false;
    }
    return true;
  }

  // ---- m4a calls -----------------------------------------------------------------------------

  // 0800252C
  stopPlayers(slot) {
    for (let i = 1; i <= 10; i++) {
      if (!slot.players[i]) continue;
      this.engine.playerStop(i);
      this.busy[i] = 0;
      slot.players[i] = 0;
    }
  }

  volumeOf(slot) { return (asr8(asr8(slot.vol) * asr8(slot.master)) << 1); } // 0800235C
  panOf(slot) { const p = (asr8(slot.pan) - 0x40) << 1; return p ? p - 1 : 0; } // 08002384
  pitchOf(slot) { return slot.pitchBase - (slot.pitchValue >> 8); } // 080023A0

  // 080023B0
  play(slot, player, song) {
    this.engine.playerStart(player, song);
    this.engine.immInit(player);
    this.engine.volumeControl(player, 0xffff, this.volumeOf(slot) & 0xffff);
    this.engine.panControl(player, 0xffff, s8(this.panOf(slot)));
    this.engine.pitchControl(player, 0xffff, s16(this.pitchOf(slot)));
  }

  // 08002424 / 0800247C / 080024D4: send a changed value to every player the slot uses.
  applyVolume(slot) {
    const v = this.volumeOf(slot) >> 3;
    if (v === slot.volApplied) return;
    slot.volApplied = v;
    for (let i = 1; i <= 10; i++) if (slot.players[i]) this.engine.volumeControl(i, 0xffff, (v << 3) & 0xffff);
  }

  applyPan(slot) {
    const p = this.panOf(slot);
    if (p === slot.panApplied) return;
    slot.panApplied = p;
    for (let i = 1; i <= 10; i++) if (slot.players[i]) this.engine.panControl(i, 0xffff, s8(p));
  }

  applyPitch(slot) {
    const p = this.pitchOf(slot);
    if (p === slot.pitchApplied) return;
    slot.pitchApplied = p;
    for (let i = 1; i <= 10; i++) if (slot.players[i]) this.engine.pitchControl(i, 0xffff, s16(p));
  }

  // ---- per VBlank (08002B00) -----------------------------------------------------------------

  vblank() {
    if (this.paused) return;
    for (let i = 1; i <= 10; i++) {
      if (this.busy[i] && this.engine.playerStopped(i)) {
        this.engine.playerStop(i);
        this.busy[i] = 0;
      }
    }
    for (const slot of this.slots) {
      if (slot.id === -1) continue;
      for (let i = 1; i <= 10; i++) {
        if (slot.players[i] && !this.busy[i]) {
          slot.players[i] = 0;
          slot.done = 1;
        }
      }
      if (this.ramps(slot)) continue;
      do {
        slot.cont = 0;
        if (slot.wait) slot.wait--;
        else this.op(slot, this.byte(slot));
      } while (slot.cont);
    }
  }

  // 08002A38: returns true when the master fade has stopped the slot.
  ramps(slot) {
    if (slot.pitchFrames) {
      slot.pitchValue = --slot.pitchFrames ? slot.pitchValue + slot.pitchDelta : slot.pitchTarget;
      slot.pitch = slot.pitchValue;
    }
    if (slot.volFrames) slot.vol = --slot.volFrames ? slot.vol + slot.volDelta : slot.volTarget;
    if (slot.masterFrames) {
      if (--slot.masterFrames === 0) {
        slot.master = slot.masterTarget;
        if (slot.master === 0) {
          this.stopPlayers(slot);
          slot.done = 1;
          slot.id = -1;
          return true;
        }
      } else {
        slot.master += slot.masterDelta;
      }
    }
    if (slot.panFrames) slot.pan = --slot.panFrames ? slot.pan + slot.panDelta : slot.panTarget;
    this.applyVolume(slot);
    this.applyPan(slot);
    this.applyPitch(slot);
    return false;
  }

  // Script opcodes, handler table 0881FCEC.
  op(slot, code) {
    switch (code) {
      case 0x00: { // 080025B0 jump
        const offset = this.word(slot);
        slot.pc = slot.base + offset;
        slot.cont = 1;
        break;
      }
      case 0x01: // 080025D8 wait
        slot.wait = this.word(slot);
        slot.cont = 1;
        break;
      case 0x02: // 080025F8: nothing, ends the frame
        break;
      case 0x03: { // 0800262C play song on a free player
        const song = s16(this.word(slot));
        slot.pitchBase = this.word(slot);
        slot.pitch = slot.pitchBase << 8;
        for (let i = 1; i <= 10; i++) {
          if (slot.players[i] !== song) continue;
          this.engine.playerStop(i);
          slot.players[i] = 0;
          this.busy[i] = 0;
        }
        const player = this.busy.findIndex((v, i) => i >= 1 && v === 0); // 080025FC
        if (player > 0) {
          this.busy[player] = song;
          slot.players[player] = song;
          this.play(slot, player, song & 0xffff);
        }
        slot.cont = 1;
        break;
      }
      case 0x04: { // 08002704 volume to u8 << 8 over frames
        slot.volTarget = this.byte(slot) << 8;
        slot.volFrames = this.word(slot);
        if (slot.volFrames === 0) {
          slot.vol = slot.volTarget;
          this.applyVolume(slot);
        } else {
          slot.volDelta = div(slot.volTarget - slot.vol, slot.volFrames);
        }
        slot.cont = 1;
        break;
      }
      case 0x05: { // 0800276C pan to u8 << 8 over frames
        slot.panTarget = this.byte(slot) << 8;
        slot.panFrames = this.word(slot);
        if (slot.panFrames === 0) {
          slot.pan = slot.panTarget;
          this.applyPan(slot);
        } else {
          slot.panDelta = div(slot.panTarget - slot.pan, slot.panFrames);
        }
        slot.cont = 1;
        break;
      }
      case 0x06: // 080027C4 skip one byte
        slot.pc += 1;
        slot.cont = 1;
        break;
      case 0x07: // 080027D8 pitch to word << 8 over frames
      case 0x08: { // 08002840 pitch by s16 << 8 over frames
        const value = this.word(slot);
        slot.pitchTarget = code === 0x07 ? value << 8 : slot.pitch + (s16(value) << 8);
        slot.pitchFrames = this.word(slot);
        slot.pitchValue = slot.pitch;
        if (slot.pitchFrames === 0) {
          slot.pitch = slot.pitchValue = slot.pitchTarget;
          this.applyPitch(slot);
        } else {
          slot.pitchDelta = div(slot.pitchTarget - slot.pitch, slot.pitchFrames);
        }
        slot.cont = 1;
        break;
      }
      case 0x09: // 080026E8 stop every player of the slot
        this.stopPlayers(slot);
        slot.cont = 1;
        break;
      case 0x0a: // 080028AC jump if flag == u8
      case 0x0b: { // 080028EC jump if flag != u8
        const value = this.byte(slot);
        const offset = this.word(slot);
        if ((slot.flag === value) === (code === 0x0a)) slot.pc = slot.base + offset;
        slot.cont = 1;
        break;
      }
      case 0x0c: // 0800292C loop start (count 0 counts as 1)
        slot.loopCount = this.word(slot) || 1;
        slot.loopPc = slot.pc;
        slot.cont = 1;
        break;
      case 0x0d: // 08002964 loop end
        slot.loopCount = (slot.loopCount - 1) & 0xffff;
        if (slot.loopCount) slot.pc = slot.loopPc;
        slot.cont = 1;
        break;
      case 0x0e: // 0800298C stop the players and mark done; ends the frame
        this.stopPlayers(slot);
        slot.done = 1;
        break;
      case 0x0f: // 080029A8 mark done; ends the frame
        slot.done = 1;
        break;
      case 0x10: // 080029B8 clear the flag; ends the frame
        slot.flag = 0;
        break;
      case 0x11: // 08002758 skip three bytes
        slot.pc += 3;
        slot.cont = 1;
        break;
      case 0x12: // 080029C8 skip two bytes
        slot.pc += 2;
        slot.cont = 1;
        break;
      case 0x13: { // 080029DC end: wait 10 frames while a player still sounds, else free the slot
        for (let i = 1; i <= 10; i++) {
          if (slot.players[i] && this.busy[i]) {
            slot.pc -= 1;
            slot.wait = 10;
            return;
          }
        }
        slot.id = -1;
        slot.done = 1;
        break;
      }
      default: // the handler table has 20 entries; other bytes jump to whatever follows it
        slot.id = -1;
        break;
    }
  }
}
