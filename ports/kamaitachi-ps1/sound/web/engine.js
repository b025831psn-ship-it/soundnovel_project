// The PS1 sound hardware loop for the browser: the game's sound module on the JS libsnd/
// libspu port and SPU model. Every frame (1/60 s, 735 samples at 44.1 kHz) it applies the
// queued commands, runs the VSync callback (0x80028f88) and the per-frame update
// (0x80029008), and renders the SPU. Samples the library renders while it waits
// (VSync, transfer waits) are played too, in order. Runs inside the AudioWorklet
// (sound-worklet.js) and in Node for tests.
import { JsSs, SAMPLES_PER_FRAME } from "../lib/ss.js";
import { SoundModule } from "../module.js";
import { memberLoader } from "../members.js";

const COMMANDS = new Set(["scenarioOp", "play", "stop", "playMusic", "stopMusic", "stopEffect", "playUi", "reset", "setStereo", "setFlag"]);

export class Ps1SoundEngine {
  constructor({ tables, pacs, onEvent = () => {} }) {
    this.js = new JsSs();
    this.queue = this.js.out; // Int16Array blocks (stereo interleaved), played in order
    this.head = 0; this.pos = 0;
    const loadMember = memberLoader(pacs);
    this.onEvent = onEvent;
    this.mod = new SoundModule(this.js.ss, tables, { loadMember, rumble: (r) => onEvent({ type: "rumble", ...r }) });
    this.pending = [];
    this.doneSent = new Uint8Array(1000);
    this.mod.reset();
  }
  command(name, args = []) { if (COMMANDS.has(name)) this.pending.push([name, args]); }
  run(name, args) {
    const m = this.mod;
    if (name === "setStereo") { m.stereo = args[0] ? 1 : 0; if (m.stereo) this.js.ss.SsSetStereo(); else this.js.ss.SsSetMono(); return; }
    return m[name](...args);
  }
  tick() {
    for (const [n, a] of this.pending.splice(0)) {
      try { this.run(n, a); } catch (e) { this.onEvent({ type: "error", message: String(e?.message ?? e), command: n }); }
    }
    this.mod.vsync(); this.mod.frame();
    this.js.frame(1);
    const d = this.mod.done;
    for (let i = 0; i < 1000; i++) if (d[i] !== this.doneSent[i]) { this.doneSent[i] = d[i]; this.onEvent({ type: "done", id: i, value: d[i] }); }
  }
  // Fill left/right Float32Arrays (any length) with the next samples.
  pull(left, right) {
    for (let i = 0; i < left.length; i++) {
      while (this.head >= this.queue.length) { this.queue.length = 0; this.head = 0; this.tick(); }
      const b = this.queue[this.head];
      left[i] = b[this.pos] / 32768; right[i] = b[this.pos + 1] / 32768;
      this.pos += 2;
      if (this.pos >= b.length) { this.pos = 0; this.head++; }
    }
  }
}
export { SAMPLES_PER_FRAME };
