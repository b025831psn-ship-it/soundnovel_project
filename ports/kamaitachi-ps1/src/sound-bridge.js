// The sound driver as the ported game code sees it. The game's own sound routines keep their
// state in RAM; in the browser that state lives in sound/module.js instead (not RAM
// compatible), so every call and every read of driver state goes through sound(ctx):
//   ctx.sound set   -> that object (moduleSound(): the JS sound module, used in the browser)
//   ctx.sound unset -> ramSound(ctx): the original routines through ctx.call and RAM reads
//                      (on the oracle, so the ports stay checked against the original)
// Driver entry points: 0x800292b0 play(id, fade)  0x80029174 stop(id, fade)
//   0x80026534 setVariant(bank, id)  0x80028c74 playUi(n)  0x80029008 frame()  0x80028ccc reset()
// Driver state: gp+0x7e current song (-1 = none); 0x801d6240 six effect channels of 0x68
//   bytes, +6 = effect number; 0x801fd388 done flags by effect number.
const GP = 0x8007913c, CHANNELS = 0x801d6240, DONE = 0x801fd388;
const s16 = (v) => (v << 16) >> 16;

// 0x800264f0: an effect id's number within its bank, (id - 1000) mod 1000, as u16.
// What a library call returns when there is no sound: VAB opens fail (-1), the rest 0.
const LIB_DEFAULT = (addr) => (addr === 0x8005e188 ? -1 : 0);

export const soundIndex = (id) => (((id & 0xffff) - 1000) % 1000) & 0xffff;

export function ramSound(ctx) {
  const { m } = ctx, call = (addr, args, sp) => ctx.call(addr, args, sp);
  return {
    play: (id, fade, sp) => call(0x800292b0, [id, fade], sp),
    stop: (id, fade, sp) => call(0x80029174, [id, fade], sp),
    setVariant: (bank, id, sp) => call(0x80026534, [bank, id], sp),
    playUi: (n, sp) => call(0x80028c74, [n], sp),
    frame: (sp) => call(0x80029008, [], sp),
    reset: () => {}, // the game's part is ported (sound-reset.js); the library calls come through lib
    lib: (addr, args, sp) => call(addr, args, sp),
    keyOn: (vab, prog, tone, note, fine, voll, volr, sp) => call(0x80059cd8, [vab, prog, tone, note], sp), // SsUtKeyOn; the caller put fine/voll/volr at sp+0x10
    vsync: (sp) => { // the sound part of the VSync callback 0x8002d46c
      if (m.read(GP + 0x7b, 1) !== 1) return;
      if (!m.read(0x8007928d, 1)) call(0x80027490, [], sp); // effect scripts
      call(0x80054738, [], sp); // SsSeqCalledTbyT
      if (m.read(GP + 0x82, 1) === 1) { const v = m.read(GP + 0x4b4, 2); if (((v + 1) & 0xffff) >= 2) m.write(GP + 0x4b4, v - 1, 2); }
    },
    start: (sp) => { // the library part of 0x80028e74
      call(0x80055f28, [], sp); call(0x80058ec8, [0x801fc568, 16, 1], sp); call(0x800590e8, [0x1000], sp); call(0x800589a8, [], sp);
      call(0x800585b8, [0, 0, 1], sp);
      call(m.read(0x800792c5, 1) ? 0x8005e098 : 0x8005e088, [], sp); // stereo / mono
      call(0x8005a748, [], sp); call(0x800586c8, [0, 0], sp); call(0x8005a5a8, [0, 0], sp); call(0x80060ff8, [5], sp);
      call(0x8005a6e8, [0], sp); call(0x8005a638, [0], sp);
    },
    song: () => s16(m.read(GP + 0x7e, 2)),
    effectPlaying: (n) => { for (let i = 0; i < 6; i++) if (s16(m.read(CHANNELS + 0x68 * i + 6, 2)) === n) return true; return false; },
    done: (n) => m.read(DONE + n, 1) === 1,
    clearDone: (n) => m.write(DONE + n, 0, 1),
  };
}

// The browser side: the same calls on a SoundModule. Known difference: the module runs the
// driver's own frame waits (stopMusic's 0x80013ff0, playMusic's VSyncs) without game frames.
export function moduleSound(mod) {
  return {
    play: (id, fade) => mod.play(id, fade),
    stop: (id, fade) => mod.stop(id, fade),
    setVariant: (bank, id) => mod.setVariant(bank, id),
    playUi: (n) => mod.playUi(n),
    frame: () => mod.frame(),
    reset: () => mod.reset(),
    lib: (addr, args) => mod.lib?.(addr, args) ?? LIB_DEFAULT(addr),
    keyOn: (...a) => mod.keyOn?.(...a.slice(0, 7)),
    start: () => {}, // the module starts the library when it is made
    vsync: () => {}, // the audio thread runs the module's VSync part on its own clock
    song: () => s16(mod.music.song),
    effectPlaying: (n) => mod.ch.some((c) => s16(c.id) === n),
    done: (n) => mod.done[n] === 1,
    clearDone: (n) => { mod.done[n] = 0; },
  };
}

export const sound = (ctx) => ctx.sound ?? ramSound(ctx);

// No audio (a browser without sound yet, or muted start-up): every effect has finished.
export function silentSound() {
  const no = () => {};
  return { play: no, stop: no, keyOn: no, lib: (addr) => LIB_DEFAULT(addr), setVariant: no, playUi: no, frame: no, reset: no, start: no, vsync: no,
    song: () => -1, effectPlaying: () => false, done: () => true, clearDone: no };
}
