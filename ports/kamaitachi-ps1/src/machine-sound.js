// Sound for the machine: the game's sound module (sound/module.js) on the JS libsnd / libspu
// port and SPU model, in step with the game. The game's calls reach the module at once
// (sound-bridge.js moduleSound with the RAM), the machine's VSync callback runs the module's
// VSync part, and after every game frame render() takes that frame's samples (735 stereo
// pairs at 44.1 kHz). When the driver waited inside a call (bank transfers, music changes:
// VSync waits the original spends in real frames), more than one frame comes back; the
// caller holds the game for the extra frames, as the original is held.
import { JsSs, SAMPLES_PER_FRAME } from "../sound/lib/ss.js";
import { SoundModule } from "../sound/module.js";
import { memberLoader } from "../sound/members.js";
import { soundTables } from "../sound/container.js";
import { moduleSound } from "./sound-bridge.js";
import { reader } from "./exe-data.js";

export function machineSound({ exeData, pacs, onRumble = () => {} }) {
  const js = new JsSs();
  const mod = new SoundModule(js.ss, soundTables(reader(exeData)), { loadMember: memberLoader(pacs), rumble: onRumble });
  return {
    mod, js,
    bridge: (m) => moduleSound(mod, m),
    // The frame just run: Int16Array blocks (stereo interleaved), in order.
    render() { js.frame(1); js.log.length = 0; return js.out.splice(0); },
  };
}
export { SAMPLES_PER_FRAME };
