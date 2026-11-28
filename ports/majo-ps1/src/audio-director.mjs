// Private port data supplies decoded buffers and exact loop points. The
// adapter owns WebAudio nodes; this class mirrors retail music replacement,
// stop/special IDs and overlapping effects without embedding audio assets.
export class AudioDirector {
  constructor(adapter, manifest = {}) {
    this.adapter = adapter;
    this.manifest = manifest;
    this.music = null;
    this.effects = new Set();
  }

  async handle(event) {
    if (event.type === 'music') {
      if (event.id === this.music) return;
      await this.adapter.stopMusic?.();
      this.music = event.id;
      if (event.id !== null) {
        const entry = this.manifest.music?.[event.id] ?? {};
        await this.adapter.playMusic(event.id, {loop: true, loopStart: entry.loopStart ?? 0, loopEnd: entry.loopEnd});
      }
    } else if (event.type === 'sound') {
      const token = await this.adapter.playSound(event.id, {bank: event.bank, mode: event.mode, value: event.value});
      if (token) this.effects.add(token);
    } else if (event.type === 'resetSoundBank') {
      await this.adapter.stopBank?.(event.bank);
    }
  }

  async stop() {
    this.music = null;
    this.effects.clear();
    await Promise.all([this.adapter.stopMusic?.(), this.adapter.stopAllSounds?.()]);
  }
}
