// The game's own audio controller that sits between the scenario opcodes and m4a (AKZJ
// 0800A14C-0800A572). It keeps the original RAM variables and runs the same steps, so the
// scenario drives the m4a engine with the same calls, in the same order, as the cartridge.
//
// RAM kept here (names follow the native addresses):
//   request   s16 02028ACE  current scenario request, -1 = none
//   scene     u16 02000738  request recorded by 0800A510, -1 after a stop
//   volume    s32 02028AD4  16.16 volume accumulator
//   delta     s32 02028AD8  per-frame change while fading
//   fadeLeft  u16 02028ADE  fade frames left
//   active    u8  02028ADC  1 while a request is playing
//   playLeft  s16 02028AE0  play countdown from the length table, -1 = no limit
//   applied   s32 02028AE4  last value given to m4aMPlayVolumeControl, >> 3
//   enabled   u8  020289CC  set by 0800A384 at start-up
//
// engine: { startSong(n), stopSong(n), immInit(player), volumeControl(player, bits, volume) }
// tables: port-data/sound/scene-audio.json (requestSong, volume, length)

const PLAYER0 = 0;
const s16 = (v) => (v << 16) >> 16;
const asr11 = (v) => (v < 0 ? v + 0xff : v) >> 11; // 0800A47C-0800A482 and 0800A21A-0800A220
const div = (a, b) => Math.trunc(a / b); // 08016520 (signed division)

export class SceneAudio {
  constructor(engine, tables, effects = null) {
    this.engine = engine;
    this.tables = tables;
    this.effects = effects; // effects.js Effects: scripts for requests >= 1000 (08002C00)
    this.reset();
  }

  // 0800A384: called once from start-up.
  reset() {
    if (this.request !== undefined && this.request !== -1) this.stop(0);
    this.request = -1;
    this.scene = -1;
    this.volume = 0;
    this.delta = 0;
    this.fadeLeft = 0;
    this.active = 0;
    this.playLeft = 0;
    this.applied = 0;
    this.enabled = 1;
  }

  song(request) {
    return this.tables.requestSong[request] ?? -1;
  }

  // 0800A14C
  target(request) {
    return (this.tables.volume[request] ?? 0) << 8;
  }

  setVolume() {
    this.engine.volumeControl(PLAYER0, 0xffff, (this.applied << 3) & 0xffff);
  }

  // 0800A510 (opcodes 30 and 32): request a scene's music or effect.
  play(request, speed = 0) {
    if (request > 999) {
      this.effects?.start(request - 1000, speed);
      return;
    }
    if (this.request === request) return;
    this.request = request;
    if (request <= 88 && this.song(request) !== -1) {
      this.start(request, speed);
      this.scene = request;
    } else {
      this.stop(0);
    }
  }

  // 0800A1E8
  start(request, speed) {
    if (request === -1) return;
    this.stop(0);
    this.request = request;
    if (speed === 0) {
      this.volume = this.target(request);
      this.delta = 0;
      this.fadeLeft = 0;
      this.applied = asr11(this.volume);
    } else {
      this.delta = div(this.target(request), speed);
      this.volume = 0x4000;
      this.applied = this.volume >> 3;
      this.fadeLeft = speed;
    }
    this.playLeft = s16(this.tables.length[request]?.[0] ?? -1);
    this.engine.startSong(this.song(request) & 0xffff);
    this.engine.immInit(PLAYER0);
    this.setVolume();
    this.active = 1;
  }

  // 0800A164: speed 0 stops now; otherwise fades out over `speed` frames and stops at the end.
  stop(speed) {
    if (this.request === -1) return;
    if (speed === 0) {
      this.engine.stopSong(this.song(this.request) & 0xffff);
      this.volume = 0;
      this.scene = -1;
      this.request = -1;
      this.fadeLeft = 0;
      this.active = 0;
    } else {
      this.delta = -div(this.volume, speed);
      this.fadeLeft = speed;
    }
  }

  // 0800A4CC (opcode 31 with its speed, opcode 2F with speed 0)
  fade(request, speed) {
    if (request === 0xffff) return;
    if (request <= 999) {
      this.scene = -1;
      this.stop(speed);
    } else {
      this.effects?.fade(request - 1000, speed);
    }
  }

  // 0800A3E0, from the VBlank interrupt (080066E8): counts the play length down.
  irq() {
    if (this.enabled && this.active === 1 && this.playLeft > 0) this.playLeft--;
  }

  // 0800A414, from every frame wait (08002FB8): moves the volume and ends finished requests.
  frame() {
    if (!this.enabled || !this.active) return;
    if (this.fadeLeft) {
      this.fadeLeft--;
      if (this.fadeLeft === 0) {
        if (this.delta < 0) this.stop(0);
      } else {
        this.volume = (this.volume + this.delta) | 0;
        const target = this.target(this.request & 0xffff);
        if (this.volume >= target) this.volume = target;
        const v = asr11(this.volume);
        if (v !== this.applied) {
          this.applied = v;
          this.setVolume();
        }
      }
    }
    if (this.playLeft === 0) this.stop(0);
  }

  // Opcode 34 (08004DD0 -> 0800A2C4) for request <= 99: before each loop frame the routine checks
  // that a request is playing, and from the second check on also that the length table entry
  // for `request` is not -1. `frames` is the number of loop frames already run (at most 601).
  waiting(request, frames) {
    if (request > 99) return this.effects?.waiting(request - 1000, frames) ?? false; // 08002CFC
    if (this.request === -1 || frames > 600) return false;
    return frames === 0 || s16(this.tables.length?.[request]?.[0] ?? -1) !== -1;
  }
}
