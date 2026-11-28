// AudioWorklet side of the PS1 sound: runs Ps1SoundEngine on the audio thread, so the
// SPU is paced by the audio clock like the console's VSync callback. Messages from the
// page: {type:"init", tables, pacs} once, then {type:"cmds", list:[[name, args], ...]} (one batch per page task).
import { Ps1SoundEngine } from "./engine.js";

class Ps1SoundProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.engine = null;
    this.port.onmessage = ({ data }) => {
      if (data.type === "init") {
        const pacs = Object.fromEntries(Object.entries(data.pacs).map(([k, v]) => [k, new Uint8Array(v)]));
        try {
          this.engine = new Ps1SoundEngine({ tables: data.tables, pacs, onEvent: (e) => this.port.postMessage(e) });
          this.port.postMessage({ type: "ready" });
        } catch (e) { this.port.postMessage({ type: "error", message: String(e?.message ?? e), command: "init" }); }
      } else if (data.type === "cmds") for (const [n, a] of data.list) this.engine?.command(n, a);
    };
  }
  process(_, outputs) {
    const out = outputs[0];
    if (this.engine && out?.length >= 2) this.engine.pull(out[0], out[1]);
    return true;
  }
}
registerProcessor("ps1-sound", Ps1SoundProcessor);
