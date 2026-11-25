// Background music with the Special Box loop points.
//
// Each Vorbis track carries an `L=` comment that SLPS_251.32 parses at
// 0x001C30EC-0x001C3138 (decimal, stored at object +0x30). Waveform checks on
// the decoded tracks show that the audio ending at the file's last sample
// matches the audio ending at sample L (k2h002 corr 0.993, k2h003 0.960), so
// playback runs from 0 to the end once and then repeats [L, end) without a gap.
//
// ScenePack music commands (0x14 start, 0x15 stop) give a volume and a fade
// length in 59.94 Hz frames. EE 0x001BE2E8 converts volume with integer
// truncation: (value * 127) / 100. The normalized Web Audio gain preserves
// that 0..127 linear scale. EE 0x001BF110 waits fadeFrames + 1 updates when
// the command's 0x2E completion-wait flag is set.
//
// Web Audio gives a sample-accurate seam. If the browser cannot decode the
// file, an HTML audio element seeks back to L on `ended` instead.

const RATE = 48000;
const FRAME = 1001 / 60000;

export class LoopingMusic {
  constructor({ asset, loopFrames, onBlocked = () => {} }) {
    this.asset = asset;
    this.loopFrames = loopFrames;
    this.onBlocked = onBlocked;
    this.file = null;
    this.token = 0;
    this.buffers = new Map();
    this.voice = null;
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    this.context = Context ? new Context() : null;
  }

  get playing() {
    return this.file !== null;
  }

  // volume: 0-100 as in the ScenePack command; fadeFrames: 59.94 Hz frames.
  play(file, { volume = 100, fadeFrames = 0 } = {}) {
    const level = Math.floor(Math.min(100, Math.max(0, volume)) * 127 / 100) / 127;
    if (this.file === file) return this.retarget(level, fadeFrames);
    this.stop();
    this.file = file;
    this.target = { level, fadeFrames };
    const token = ++this.token;
    if (!this.context) return this.playElement(file, level);
    this.context.resume().catch(() => {});
    this.decode(file).then(buffer => {
      if (token !== this.token) return;
      const gain = this.context.createGain();
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = Math.min((this.loopFrames[file] ?? 0) / RATE, buffer.duration);
      source.loopEnd = buffer.duration;
      source.connect(gain).connect(this.context.destination);
      this.voice = { source, gain };
      // A volume change that arrived while decoding replaces the start level.
      const target = this.target;
      gain.gain.value = target.fadeFrames > 0 ? 0 : target.level;
      if (target.fadeFrames > 0) this.ramp(this.voice, target.level, target.fadeFrames);
      source.start();
      if (this.context.state !== 'running') this.onBlocked();
    }, () => {
      if (token === this.token) this.playElement(file, this.target.level);
    });
  }

  stop({ fadeFrames = 0 } = {}) {
    this.token++;
    this.file = null;
    const voice = this.voice;
    this.voice = null;
    if (!voice) return;
    if (voice.element) {
      voice.element.onended = null;
      voice.element.pause();
      return;
    }
    const end = fadeFrames > 0 ? this.ramp(voice, 0, fadeFrames) : this.context.currentTime;
    try { voice.source.stop(end); } catch {}
    voice.source.onended = () => voice.gain.disconnect();
  }

  volume(volume, { fadeFrames = 0 } = {}) {
    if (this.file === null) return 0;
    return this.retarget(Math.floor(Math.min(100, Math.max(0, volume)) * 127 / 100) / 127, fadeFrames);
  }

  retarget(level, fadeFrames) {
    if (this.voice) return this.ramp(this.voice, level, fadeFrames);
    this.target = { level, fadeFrames };
    return 0;
  }

  // Resume after a user gesture when the browser held audio back.
  unlock() {
    this.context?.resume().catch(() => {});
    this.voice?.element?.play().catch(() => {});
  }

  ramp(voice, level, fadeFrames) {
    if (voice.element) {
      voice.element.volume = Math.min(1, level);
      return 0;
    }
    const now = this.context.currentTime;
    const param = voice.gain.gain;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    const end = now + Math.max(0, fadeFrames) * FRAME;
    if (end > now) param.linearRampToValueAtTime(level, end);
    else param.setValueAtTime(level, now);
    return end;
  }

  decode(file) {
    if (!this.buffers.has(file)) {
      const pending = fetch(this.asset(file))
        .then(response => {
          if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
          return response.arrayBuffer();
        })
        .then(bytes => this.context.decodeAudioData(bytes));
      pending.catch(() => this.buffers.delete(file));
      this.buffers.set(file, pending);
    }
    return this.buffers.get(file);
  }

  playElement(file, level) {
    const element = new Audio(this.asset(file));
    element.volume = Math.min(1, level);
    element.onended = () => {
      element.currentTime = (this.loopFrames[file] ?? 0) / RATE;
      element.play().catch(this.onBlocked);
    };
    element.play().catch(this.onBlocked);
    this.voice = { element };
  }
}
