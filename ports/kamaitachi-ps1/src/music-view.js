// One song of the game played outside the machine, by the port's own sound engine (the game's sound
// module on the libsnd / SPU port, as machine-sound.js runs it): for a page that plays one piece (the
// hub's front page). Nothing is written anywhere: exe-data.bin and the song's member of MUS.PAC are
// read from the port's own data (the member alone, by range requests).
//   const music = await songPlayer("/kamaitachi-ps1-kor/port-data/machine/", { song: 8, volume: 0.5 });
//   button.onclick = () => music.start();     // inside a tap or key handler: browsers start sound only there
//   music.setVolume(0.3); music.stop();       // stop: silent, the song stays where it is; start() goes on
// Song 8 is the piece of the greeting / name screen. The song repeats as it does in the game.
// The sound stops while the page is hidden.
import { JsSs } from "../sound/lib/ss.js";
import { SoundModule } from "../sound/module.js";
import { musMember } from "../sound/members.js";
import { soundTables } from "../sound/container.js";
import { PcmQueue } from "../sound/web/pcm-queue.js";
import { unpack, reader } from "./exe-data.js";
import { fetchPacMember } from "./picture-view.js";

const AHEAD = 0.3; // seconds of sound kept queued

export async function songPlayer(dataRoot, { song = 8, volume = 0.5 } = {}) {
  const base = new URL(dataRoot, location.href);
  const [exe, member] = await Promise.all([
    fetch(new URL("exe-data.bin", base)).then(async (r) => { if (!r.ok) throw new Error(`exe-data.bin: ${r.status}`); return unpack(new Uint8Array(await r.arrayBuffer())); }),
    fetchPacMember(new URL("MUS.PAC", base).href, song)]);
  if (!member) throw new Error(`song ${song}: no such member`);
  const js = new JsSs();
  const mod = new SoundModule(js.ss, soundTables(reader(exe)), { loadMember: (kind, id) => (kind === "MUS" && id === song ? musMember(member) : null), rumble() {} });
  mod.reset(); mod.stereo = 1; mod.play(song, 0);
  let out = null, timer = 0, sent = 0, t0 = 0, on = false;
  const open = async () => {
    const ctx = new AudioContext({ sampleRate: 44100 }), gain = new GainNode(ctx, { gain: volume });
    let node, send;
    if (ctx.audioWorklet) {
      await ctx.audioWorklet.addModule(new URL("../sound/web/pcm-worklet.js", import.meta.url));
      node = new AudioWorkletNode(ctx, "pcm-player", { numberOfInputs: 0, outputChannelCount: [2] });
      send = (b) => node.port.postMessage(b, [b.buffer]);
    } else {
      const queue = new PcmQueue();
      node = ctx.createScriptProcessor(1024, 0, 2);
      node.onaudioprocess = (e) => { const l = e.outputBuffer.getChannelData(0), r = e.outputBuffer.getChannelData(1); l.fill(0); r.fill(0); queue.pull(l, r); };
      send = (b) => queue.push(b);
    }
    node.connect(gain).connect(ctx.destination);
    return { ctx, gain, send };
  };
  // the game's frame: the module's VSync part and frame part, then that frame's samples (735 pairs)
  const frame = () => { mod.vsync(); mod.frame(); js.frame(1); js.log.length = 0; for (const b of js.out.splice(0)) out.send(b); sent++; };
  const pump = () => {
    if (!on || out.ctx.state !== "running") return;
    const due = Math.floor((out.ctx.currentTime - t0 + AHEAD) * 60);
    if (due - sent > 60) { t0 = out.ctx.currentTime - sent / 60; return; } // the page slept: go on from here, no burst
    while (sent < due) frame();
  };
  const hidden = () => { if (!out || !on) return; if (document.hidden) out.ctx.suspend(); else out.ctx.resume(); };
  let starting = null;
  return {
    get playing() { return on; },
    // true once the browser really lets it sound (a swipe or a too-early call leaves it suspended)
    get sounding() { return on && out?.ctx.state === "running"; },
    start() {
      // one start at a time: two quick calls (a press and its click) make one sound, not two
      return (starting ??= (async () => {
        const first = !out; out ??= await open();
        await out.ctx.resume();
        if (on) return;
        on = true;
        if (first) { t0 = out.ctx.currentTime; document.addEventListener("visibilitychange", hidden); }
        timer = setInterval(pump, 50); pump();
      })().finally(() => { starting = null; }));
    },
    stop() { if (!on) return; on = false; clearInterval(timer); out.ctx.suspend(); },
    setVolume(v) { volume = Math.max(0, Math.min(1, +v || 0)); if (out) out.gain.gain.value = volume; },
  };
}
