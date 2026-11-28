// Paces an emulated machine against wall-clock time and feeds its audio to the output.
// The same loop drives the recorded-input sound demo now and the full VM later; a
// machine only has to say how far it has run and run further on request:
//   machine.time          emulated seconds so far
//   machine.runTo(sec)    emulate until `time` reaches sec
//   machine.end           optional: stop once time reaches this
// The resampler's fill-based rate trim absorbs the small drift between wall clock and
// the audio device. A long stall (hidden tab, slow device) is not replayed at high
// speed: the loop catches up at most `maxStep` seconds per frame, then re-anchors.
export function runRealtime(machine, out, { maxStep = 0.1, onFrame = null, now = () => performance.now(),
  schedule = (f) => requestAnimationFrame(f) } = {}) {
  let anchor = null, stopped = false, paused = false;
  const frame = () => {
    if (stopped) return;
    const t = now() / 1000;
    if (!paused) {
      anchor ??= t - machine.time;
      let target = t - anchor;
      if (target - machine.time > maxStep) { target = machine.time + maxStep; anchor = t - target; }
      if (machine.end != null) target = Math.min(target, machine.end);
      if (target > machine.time) machine.runTo(target);
      out.flush();
    }
    onFrame?.(machine);
    if (machine.end != null && machine.time >= machine.end) { stopped = true; return; }
    schedule(frame);
  };
  schedule(frame);
  return {
    stop() { stopped = true; },
    setPaused(on) { paused = on; out.setPaused?.(on); if (!on) anchor = null; },
    get stopped() { return stopped; },
  };
}
