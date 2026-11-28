// Page side of the PS1 sound. Loads the private sound data, starts the AudioWorklet and
// forwards the game's sound calls. The shell passes this object as `sound`:
//   const sound = await createPs1Sound({ data: "/kamaitachi-ps1-kor/port-data/sound/" });
//   window.kamaitachiPs1 = { runtime, sound };         // shell: first tap -> resume(), volume -> setVolume()
//   vm hook: sound.scenarioOp(opcode, operands, skip)  // ops 0x2f/30/31/32/35/36
// `data` must hold MUS.PAC, VCE.PAC, VCP.PAC, BIN.PAC (from the user's disc) and
// sound-tables.json (tools/export-sound-tables.mjs).
export async function createPs1Sound({ data, context = null, onEvent = () => {} } = {}) {
  const base = data.endsWith("/") ? data : data + "/";
  const get = async (f) => { const r = await fetch(base + f); if (!r.ok) throw new Error(`sound: ${f} ${r.status}`); return r; };
  const [tables, MUS, VCE, VCP, BIN] = await Promise.all([
    get("sound-tables.json").then((r) => r.json()),
    ...["MUS.PAC", "VCE.PAC", "VCP.PAC", "BIN.PAC"].map((f) => get(f).then((r) => r.arrayBuffer())),
  ]);
  const ctx = context ?? new AudioContext({ sampleRate: 44100, latencyHint: "interactive" });
  await ctx.audioWorklet.addModule(new URL("./sound-worklet.js", import.meta.url));
  const node = new AudioWorkletNode(ctx, "ps1-sound", { numberOfInputs: 0, outputChannelCount: [2] });
  const gain = new GainNode(ctx, { gain: 1 });
  node.connect(gain).connect(ctx.destination);
  const done = new Uint8Array(1000);
  let ready;
  const readyP = new Promise((res, rej) => { ready = { res, rej }; });
  node.port.onmessage = ({ data: e }) => {
    if (e.type === "ready") ready.res();
    else if (e.type === "done") done[e.id] = e.value;
    else if (e.type === "error" && e.command === "init") ready.rej(new Error(e.message));
    else if (e.type === "rumble" && e.on && navigator.vibrate) navigator.vibrate(50);
    onEvent(e);
  };
  node.port.postMessage({ type: "init", tables, pacs: { MUS, VCE, VCP, BIN } }, [MUS, VCE, VCP, BIN]);
  await readyP;
  // Calls made in the same task (one game frame) reach the audio thread together.
  let batch = null;
  const cmd = (name, ...args) => {
    if (!batch) { batch = []; queueMicrotask(() => { node.port.postMessage({ type: "cmds", list: batch }); batch = null; }); }
    batch.push([name, args]);
  };
  return {
    context: ctx, node,
    resume: () => ctx.state !== "running" ? ctx.resume() : Promise.resolve(),
    suspend: () => ctx.suspend(),
    setVolume: (v) => { gain.gain.value = Math.max(0, Math.min(1, +v || 0)); },
    scenarioOp: (opcode, operands, skip = false) => cmd("scenarioOp", opcode, Array.from(operands), skip),
    play: (id, fade = 0) => cmd("play", id, fade), // 0x800292b0
    stop: (id, fade = 0) => cmd("stop", id, fade), // 0x80029174
    playUi: (n) => cmd("playUi", n), // 0x80028c74
    setFlag: (i, v) => cmd("setFlag", i, v),
    setStereo: (on) => cmd("setStereo", on),
    reset: () => cmd("reset"),
    isDone: (i) => done[i] === 1, // effect script reached op 15 (mirrored from the audio thread)
  };
}
