// Browser output for the SFC APU. The APU runs where the VM runs; this collects its
// samples and posts them to the worklet in blocks.
// const out = await createAudioOut(); apu.dsp.onSample = out.sample; ... out.flush() each frame.
// Browsers start audio only after a user gesture: call `out.resume()` from a click or key handler.
import { DSP_RATE } from './resampler.js';

export async function createAudioOut({ inRate = DSP_RATE, target = 0.08, block = 512 } = {}) {
  const context = new AudioContext();
  await context.audioWorklet.addModule(new URL('./sfc-worklet.js', import.meta.url));
  const node = new AudioWorkletNode(context, 'sfc-audio-out', { outputChannelCount: [2], processorOptions: { inRate, target } });
  node.connect(context.destination);
  let buf = new Int16Array(block * 2), n = 0, stats = null;
  node.port.onmessage = ({ data }) => { if (data.type === 'stats') stats = data; };
  const flush = () => {
    if (!n) return;
    const pcm = buf.slice(0, n * 2); n = 0;
    node.port.postMessage({ type: 'pcm', pcm }, [pcm.buffer]);
  };
  return {
    context, node,
    sample: (l, r) => { buf[n * 2] = l; buf[n * 2 + 1] = r; if (++n === block) flush(); },
    flush,
    resume: () => context.resume(),
    setMuted: (on) => node.port.postMessage({ type: 'mute', on }),
    setPaused: (on) => node.port.postMessage({ type: 'pause', on }),
    stats: () => stats,
    // A MessagePort straight to the worklet, for an APU running in a Worker: hand it to
    // createPcmSink() there so samples skip the main thread.
    connectPort() { const ch = new MessageChannel(); node.port.postMessage({ type: 'connect', port: ch.port1 }, [ch.port1]); return ch.port2; },
  };
}
