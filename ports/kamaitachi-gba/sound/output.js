// Browser side of the sound module: loads the cartridge's sound data and drives the worklet.
// const sound = await createSound('/kamaitachi-gba-kor/port-data/sound/'); sound.startSong(0);
// Browsers start audio only after a user gesture: call `sound.resume()` from a click or key handler.
export async function createSound(dataDir) {
  const [config, bytes] = await Promise.all([
    fetch(new URL('m4a.json', dataDir)).then((r) => r.json()),
    fetch(new URL('m4a.bin', dataDir)).then((r) => r.arrayBuffer()),
  ]);
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule(new URL('./worklet.js', import.meta.url));
  const node = new AudioWorkletNode(ctx, 'm4a-player', { outputChannelCount: [2] });
  // Player volume outside the game (the cartridge's own mixing is untouched inside the worklet).
  const gain = new GainNode(ctx, { gain: 1 });
  node.connect(gain).connect(ctx.destination);
  node.port.postMessage({ type: 'init', config, bytes }, [bytes]);
  // Stopped bits reported by the worklet; a report older than the last start/stop sent is ignored.
  let stopped = ~0, seq = 0;
  node.port.onmessage = ({ data }) => { if (data.type === 'stopped' && data.seq >= seq) stopped = data.bits; };
  return {
    context: ctx,
    node,
    songCount: config.songCount,
    resume: () => ctx.resume(),
    setVolume: (value) => gain.gain.setTargetAtTime(value, ctx.currentTime, 0.02),
    startSong: (song) => node.port.postMessage({ type: 'start', song }),
    stopSong: (song) => node.port.postMessage({ type: 'stop', song }),
    stopAll: () => node.port.postMessage({ type: 'stopAll' }),
    fadeOut: (player, speed) => node.port.postMessage({ type: 'fade', player, speed }),
    // m4a calls the game's audio controller (scene-audio.js) makes; messages keep their order.
    immInit: (player) => node.port.postMessage({ type: 'immInit', player }),
    volumeControl: (player, bits, volume) => node.port.postMessage({ type: 'volume', player, bits, volume }),
    panControl: (player, bits, pan) => node.port.postMessage({ type: 'pan', player, bits, pan }),
    pitchControl: (player, bits, pitch) => node.port.postMessage({ type: 'pitch', player, bits, pitch }),
    // Effect scripts start and stop players 1-10 directly and read back whether each has stopped.
    playerStart: (player, song) => { stopped &= ~(1 << player); node.port.postMessage({ type: 'playerStart', player, song, seq: ++seq }); },
    playerStop: (player) => { stopped |= 1 << player; node.port.postMessage({ type: 'playerStop', player, seq: ++seq }); },
    playerStopped: (player) => (stopped & (1 << player)) !== 0,
  };
}
