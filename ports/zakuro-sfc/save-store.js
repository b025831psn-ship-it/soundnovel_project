// 석류의 맛 saves on the shared SaveStore (docs/save/README.md), so they reach the save server and
// carry over between PC and phone.
//   manual-0..2  the cartridge's three SRAM slots ($048A bytes each at $0000/$048A/$0914, zakuro-sfc-kor
//                docs/save-layout.md), stored as they are. Endings and the 100-point progress live
//                inside each slot, so there is no separate system slot.
//   suspend      web only: the whole VM state (vm/state.js) at the moment the page was left, without
//                the SRAM (the slots above stay the only source of saves).
// The game itself still reads and writes its SRAM; this module keeps that SRAM and the store in step.
import { SaveStore } from '../../shared/save/store.js';
import { packState, unpackState } from './state-pack.js';

export const GAME_ID = 'zakuro-sfc';
export const SCHEMA = 1;
export const SLOT_BYTES = 0x048a;
const SLOTS = ['manual-0', 'manual-1', 'manual-2'];
const LEGACY_KEY = 'zakuro-sfc.sram';

const toBase64 = (bytes) => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

// $00:F443 / $00:F48F: a slot is in use when its first word is 1-3 and the byte sum matches.
export function slotInUse(bytes) {
  const marker = bytes[0] | (bytes[1] << 8);
  if (marker < 1 || marker > 3) return false;
  let sum = 0;
  for (let i = 0; i < SLOT_BYTES - 1; i++) sum = (sum + bytes[i]) & 0xff;
  return sum === bytes[SLOT_BYTES - 1];
}

export const codec = {
  gameId: GAME_ID,
  currentSchema: SCHEMA,
  dataVersion: 1,
  slots: () => [
    ...SLOTS.map((id, i) => ({ id, group: 'manual', ordinal: i, canCopy: false, canErase: true, canWrite: true, showInOriginalUi: true, original: { blocks: SLOT_BYTES } })),
    { id: 'suspend', group: 'suspend', canCopy: false, canErase: true, canWrite: true, showInOriginalUi: false },
  ],
  encode: (snapshot) => snapshot,
  validate: (p) => (typeof p?.sram === 'string' || typeof p?.state?.gz === 'string' || p?.state === null ? { ok: true } : { ok: false, reason: 'corrupt' }),
  migrate: () => ({ ok: false, reason: 'unsupportedSchema' }),
  decode: (p) => ({ ok: true, state: p }),
  summarize: (p) => ({ title: typeof p?.title === 'string' ? p.title : '' }),
};


export class ZakuroSaves {
  constructor(store, edition = 'ja') {
    this.store = store;
    this.edition = edition;
    this.known = SLOTS.map(() => null); // the SRAM bytes of each slot as last written to or read from the store
  }

  #fields(payload, label = '') {
    return { schema: SCHEMA, dataVersion: codec.dataVersion, edition: this.edition, label, payload };
  }

  // The store's version of slot i, or null (empty or erased).
  slotBytes(i) {
    const env = this.store.read(GAME_ID, SLOTS[i]);
    if (typeof env?.payload?.sram !== 'string') return null;
    const bytes = fromBase64(env.payload.sram);
    return bytes.length === SLOT_BYTES ? bytes : null;
  }

  // Lays the store's slots into the cartridge SRAM: used slots as saved, the rest erased ($FF, as $00:F526 does).
  fillSram(sram) {
    for (let i = 0; i < SLOTS.length; i++) {
      const bytes = this.slotBytes(i) ?? new Uint8Array(SLOT_BYTES).fill(0xff);
      sram.set(bytes, i * SLOT_BYTES);
      this.known[i] = bytes.slice();
    }
    return sram;
  }

  // After the game wrote its SRAM: store each slot that changed (or erase it when no longer in use).
  // Returns the slots that changed.
  takeSram(sram) {
    const changed = [];
    for (let i = 0; i < SLOTS.length; i++) {
      const bytes = sram.slice(i * SLOT_BYTES, (i + 1) * SLOT_BYTES);
      const before = this.known[i];
      if (before && before.every((b, k) => b === bytes[k])) continue;
      this.known[i] = bytes;
      changed.push(i);
      if (slotInUse(bytes)) this.store.write(GAME_ID, SLOTS[i], this.#fields({ sram: toBase64(bytes) }));
      else this.store.erase(GAME_ID, SLOTS[i]);
    }
    return changed;
  }

  // A slot that arrived from another device: put it into the running SRAM. Returns true when it changed.
  applyRemote(sram, slot) {
    const i = SLOTS.indexOf(slot);
    if (i < 0) return false;
    const bytes = this.slotBytes(i) ?? new Uint8Array(SLOT_BYTES).fill(0xff);
    if (this.known[i]?.every((b, k) => b === bytes[k])) return false;
    sram.set(bytes, i * SLOT_BYTES);
    this.known[i] = bytes.slice();
    return true;
  }

  hasSuspend() { return typeof this.store.read(GAME_ID, 'suspend')?.payload?.state?.gz === 'string'; }

  // "Nothing to carry on from" (saved at the title or the slots): written rather than erased, so a quick
  // save made there also replaces an older suspend slot on the device that loads it.
  clearSuspend() { this.store.write(GAME_ID, 'suspend', this.#fields({ state: null, scene: -1 })); }

  async writeSuspend(state, { scene = -1 } = {}) {
    const packed = await packState({ ...state, bus: { ...state.bus, sram: undefined } });
    this.store.write(GAME_ID, 'suspend', this.#fields({ state: packed, scene }, scene >= 0 ? `장면 ${scene}` : ''));
  }

  async readSuspend() {
    const env = this.store.read(GAME_ID, 'suspend');
    if (typeof env?.payload?.state?.gz !== 'string') return null;
    return unpackState(env.payload.state);
  }
}

// Moves the SRAM the player kept in localStorage before the store into the store (once; existing slots win).
export function importLegacySram(store, storage = globalThis.localStorage, edition = 'ja') {
  let text = null;
  try { text = storage?.getItem(LEGACY_KEY); } catch { /* storage blocked */ }
  if (!text) return 0;
  let sram;
  try { sram = fromBase64(text); } catch { return 0; }
  const entries = [];
  for (let i = 0; i < SLOTS.length; i++) {
    const bytes = sram.slice(i * SLOT_BYTES, (i + 1) * SLOT_BYTES);
    if (bytes.length === SLOT_BYTES && slotInUse(bytes)) entries.push({ slot: SLOTS[i], fields: { schema: SCHEMA, dataVersion: codec.dataVersion, edition, label: '', payload: { sram: toBase64(bytes) } } });
  }
  return store.importLegacy(GAME_ID, entries);
}

export async function openSaves({ edition = 'ja', storage = globalThis.localStorage, ...options } = {}) {
  const store = await SaveStore.open(options);
  importLegacySram(store, storage, edition);
  return new ZakuroSaves(store, edition);
}
