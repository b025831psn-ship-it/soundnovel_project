// Runs the 65c816 VM and the APU off the main thread. Messages in:
//   { type: 'start', game, gauss, port }   game/gauss: ArrayBuffer, port: out.connectPort()
//   { type: 'buttons', mask }  { type: 'pause', on }
// Messages out: { type: 'status', frame, time, cost } about four times a second,
//               { type: 'frame', frame, pixels } (256x224 RGBA) when the picture changed,
//               { type: 'error', message }.
import { APU } from './apu.js';
import { runRealtime } from './realtime.js';
import { createPcmSink } from './pcm-sink.js';
import { VmSound } from './vm-sound.js';
import { SfcMachine } from '../../../sfc-vm/machine.js';

let machine = null, run = null;
onmessage = ({ data }) => {
  if (data.type === 'start') start(data);
  else if (data.type === 'buttons') machine?.setButtons(data.mask);
  else if (data.type === 'pause') run?.setPaused(data.on);
};

function start({ game, gauss, port }) {
  const sink = createPcmSink(port);
  const apu = new APU({ gauss: new Int16Array(gauss) }); apu.powerOn(); apu.dsp.onSample = sink.sample;
  let shown = null, latest = null, latestFrame = 0;
  // The VM keeps debug logs (bus events, APU accesses, instruction trace) unbounded by
  // default; a player must switch them off or the tab runs out of memory in minutes.
  machine = new SfcMachine({ rom: new Uint8Array(game), apu,
    busOptions: { eventLimit: 0, apuTraceLimit: 0 }, cpuOptions: { traceLimit: 0 },
    onFrame: (frame, fb) => { latest = fb; latestFrame = frame; } });
  machine.setButtons(0);
  const vm = new VmSound(machine);
  let cost = 0, reportAt = 0;
  run = runRealtime({
    get time() { return vm.time; }, end: null,
    runTo(t) {
      const a = performance.now();
      try { vm.runTo(t); } catch (e) { run.stop(); postMessage({ type: 'error', message: String(e?.message ?? e) }); }
      cost = cost * 0.9 + (performance.now() - a) * 0.1;
    },
  }, sink, {
    schedule: (f) => setTimeout(f, 8),
    onFrame: () => {
      // One copy per step at most, and only when the PPU produced a new picture.
      if (latest && latest !== shown) {
        shown = latest; const pixels = latest.slice();
        postMessage({ type: 'frame', frame: latestFrame, pixels }, [pixels.buffer]);
      }
      const now = performance.now();
      if (now < reportAt) return; reportAt = now + 250;
      postMessage({ type: 'status', frame: vm.frame, time: vm.time, cost });
    },
  });
}
