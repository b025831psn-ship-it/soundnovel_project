// The Worker-side half of output.js: collects S-DSP samples and posts them in blocks to
// the worklet through a port from `out.connectPort()`.
export function createPcmSink(port, { block = 512 } = {}) {
  let buf = new Int16Array(block * 2), n = 0;
  const flush = () => {
    if (!n) return;
    const pcm = buf.slice(0, n * 2); n = 0;
    port.postMessage({ type: 'pcm', pcm }, [pcm.buffer]);
  };
  return {
    sample: (l, r) => { buf[n * 2] = l; buf[n * 2 + 1] = r; if (++n === block) flush(); },
    flush,
    setPaused: (on) => port.postMessage({ type: 'pause', on }),
  };
}
