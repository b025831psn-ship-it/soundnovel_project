import {completeNames, scenarioNames} from './name-entry.mjs';
import {VirtualMemoryCard} from './memory-card.mjs';

export class GameSession {
  constructor({locale = 'ko', card = new VirtualMemoryCard()} = {}) {
    this.locale = locale;
    this.card = card;
    this.screen = 'title';
    this.names = completeNames({}, locale);
    this.flags = new Uint8Array(512);
    this.routeCounts = new Map();
    this.totalEndings = 0;
    this.position = null;
    this.menuReturn = null;
  }

  titleOptions() {
    return this.card.load() ? ['continue', 'new'] : ['new'];
  }

  newGame(values = {}) {
    this.names = completeNames(values, this.locale);
    this.flags.fill(0);
    this.routeCounts.clear();
    this.totalEndings = 0;
    this.position = {resource: 'A10.BIN', pc: 0};
    this.screen = 'reading';
  }

  openMenu() {
    if (this.screen === 'menu') return;
    this.menuReturn = this.screen;
    this.screen = 'menu';
  }

  closeMenu() {
    if (this.screen !== 'menu') return;
    this.screen = this.menuReturn ?? 'reading';
    this.menuReturn = null;
  }

  snapshot() {
    return {
      version: 1, locale: this.locale, names: this.names, flags: Array.from(this.flags),
      routeCounts: Array.from(this.routeCounts), totalEndings: this.totalEndings,
      position: this.position,
    };
  }

  save() { return this.card.save(this.snapshot()); }

  continue() {
    const state = this.card.load();
    if (!state || state.version !== 1) return false;
    this.locale = state.locale;
    this.names = completeNames(state.names, state.locale);
    this.flags = Uint8Array.from(state.flags);
    this.routeCounts = new Map(state.routeCounts);
    this.totalEndings = state.totalEndings;
    this.position = state.position;
    this.screen = 'reading';
    return true;
  }

  vmState(nameEncoder) {
    if (typeof nameEncoder !== 'function') throw new TypeError('The active glyph path must encode names');
    return {
      names: scenarioNames(this.names).map(nameEncoder),
      routeCounts: this.routeCounts,
      totalEndings: this.totalEndings,
    };
  }
}
