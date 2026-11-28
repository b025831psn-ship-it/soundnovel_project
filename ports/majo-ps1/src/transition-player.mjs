export class TransitionPlayer {
  constructor() {
    this.queue = [];
    this.current = null;
    this.fadeLevel = 0;
    this.textLevel = 255;
  }

  start(event) {
    if (event.type !== 'transition') throw new TypeError('Expected transition event');
    this.queue.push(...event.actions.map(action => [...action]));
  }

  tick() {
    if (!this.current) {
      const action = this.queue.shift();
      if (!action) return {done: true, fadeLevel: this.fadeLevel, textLevel: this.textLevel};
      if (action[0] === 'wait') return this.tick();
      if (action[0] === 'fade') this.current = {kind: 'fade', from: action[1], to: action[2], frames: action[4], elapsed: 0};
      else if (action[0] === 'textFade') this.current = {kind: 'text', from: this.textLevel, to: action[1], frames: action[2], elapsed: 0};
      else if (action[0] === 'fadeIn') this.current = {kind: 'fade', from: 255, to: action[1], frames: action[2], elapsed: 0};
      else if (action[0] === 'fadeOut') this.current = {kind: 'fade', from: this.fadeLevel, to: 255, frames: action[1], elapsed: 0};
      else throw new RangeError(`Unknown transition action ${action[0]}`);
    }
    const item = this.current;
    item.elapsed++;
    const ratio = Math.min(1, item.elapsed / Math.max(1, item.frames));
    const value = Math.round(item.from + (item.to - item.from) * ratio);
    if (item.kind === 'text') this.textLevel = value;
    else this.fadeLevel = value;
    if (ratio === 1) this.current = null;
    return {done: !this.current && this.queue.length === 0, fadeLevel: this.fadeLevel, textLevel: this.textLevel};
  }
}
