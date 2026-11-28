// Saves of the web build on the shared SaveStore (soundnovel_project shared/save, docs/save/README.md).
//
// The original (SLPS_251.32) keeps its saves on a memory card: mc0:/mc1: chosen on the slot screen,
// a game folder BISLPS-25135DATA%02d with note01/note02 (.dat 79,872 bytes + .dhd 256-byte header),
// and SYSTEM/system%02d.dat that the ending flow (EE 0x123924 -> 0x105408) writes with the whole
// 300-variable block, so unlocks carry over to the next playthrough. The web keeps the same units as
// slots of a virtual card per game (cardId kamaitachi2-ps2): the binary layout is not reproduced.
//
//   mc0-data01 / mc1-data01   the story save on each card (names, variables, resume point)
//   mc0-system / mc1-system   the carry-over variables written at each ending
//   suspend                   web only: where the player left off, for carrying on on another device
//
// The shared store is loaded from the hub (/shared/save/). When it is missing (the build opened on its
// own) the old localStorage checkpoint keeps working and nothing is synced.
export const GAME_ID = 'kamaitachi2-ps2';
export const SCHEMA = 1;
export const CARD_ID = 'kamaitachi2-ps2';
const LEGACY_KEY = 'soundnovel.slps25132.opening.v1';
const CARDS = [0, 1];
export const dataSlot = card => `mc${card}-data01`;
export const systemSlot = card => `mc${card}-system`;

const original = (card, file) => ({containerId:`${CARD_ID}/mc${card}`, fileId:`BISLPS-25135${file}`});

const validNames = names => Array.isArray(names) && names.length === 2 &&
  names.every(n => typeof n === 'string' && n.length > 0 && n.length <= 6);
const validVars = v => Array.isArray(v) && v.length === 300 && v.every(Number.isInteger);

export const codec = {
  gameId: GAME_ID,
  currentSchema: SCHEMA,
  dataVersion: 1,
  slots: () => [
    ...CARDS.map(card => ({id:dataSlot(card), group:'manual', ordinal:card, canCopy:false, canErase:true, canWrite:true,
      showInOriginalUi:true, original:original(card, 'DATA01')})),
    ...CARDS.map(card => ({id:systemSlot(card), group:'system', ordinal:card, canCopy:false, canErase:true, canWrite:true,
      showInOriginalUi:false, original:original(card, 'SYSTEM')})),
    {id:'suspend', group:'suspend', canCopy:false, canErase:true, canWrite:true, showInOriginalUi:false},
  ],
  encode: snapshot => snapshot,
  // story / suspend: {names, card, resume:{label, pc}, variables, scene, music}; system: {variables}
  validate: p => {
    if (!p || typeof p !== 'object') return {ok:false, reason:'corrupt'};
    if (p.kind === 'system') return validVars(p.variables) ? {ok:true} : {ok:false, reason:'corrupt'};
    const resume = p.resume;
    return validNames(p.names) && resume && typeof resume.label === 'string' && Number.isInteger(resume.pc) &&
      (p.variables == null || validVars(p.variables)) ? {ok:true} : {ok:false, reason:'corrupt'};
  },
  migrate: () => ({ok:false, reason:'unsupportedSchema'}),
  decode: p => ({ok:true, state:p}),
  summarize: p => ({title: p?.kind === 'system' ? '' : (p?.names?.[0] ?? '')}),
};

export const varsToArray = map => Array.from({length:300}, (_, i) => map.get(i) ?? 0);
export const arrayToVars = list => new Map((list ?? []).map((v, i) => [i, v]).filter(([, v]) => v));

// Same calls as before for player.js, on top of the store (or of localStorage when the store is missing).
export class Ps2Saves {
  constructor(store) { this.store = store; }

  #payload(slot) {
    const env = this.store?.read(GAME_ID, slot);
    if (!env) return null;
    return codec.validate(env.payload).ok ? env.payload : null;
  }

  #write(slot, payload) {
    if (!this.store) return false;
    try {
      const desc = codec.slots().find(s => s.id === slot);
      this.store.write(GAME_ID, slot, {schema:SCHEMA, dataVersion:codec.dataVersion, edition:'ja',
        label:codec.summarize(payload).title, payload, ...(desc?.original ? {original:desc.original} : {})});
      return true;
    } catch { return false; }
  }

  // The story save the title's つづきから opens: the most recently written card.
  latest() {
    if (!this.store) return legacy();
    const found = CARDS.map(card => ({card, env:this.store.read(GAME_ID, dataSlot(card))}))
      .filter(x => x.env && codec.validate(x.env.payload).ok)
      .sort((a, b) => (b.env.savedAt > a.env.savedAt ? 1 : -1));
    return found[0]?.env.payload ?? null;
  }
  story(card) { return this.store ? this.#payload(dataSlot(card)) : legacy(); }
  writeStory(card, payload) {
    if (!this.store) {
      try { localStorage.setItem(LEGACY_KEY, JSON.stringify({names:payload.names, slot:card})); return true; } catch { return false; }
    }
    return this.#write(dataSlot(card), {...payload, card});
  }
  system(card) { return this.#payload(systemSlot(card))?.variables ?? null; }
  writeSystem(card, variables) { return this.#write(systemSlot(card), {kind:'system', variables}); }
  suspended() { return this.#payload('suspend'); }
  writeSuspend(payload) { return this.#write('suspend', payload); }
}

// The checkpoint the build kept before the store: names and card, resumed at my01_0070.
function legacy(storage = globalThis.localStorage) {
  try {
    const value = JSON.parse(storage?.getItem(LEGACY_KEY));
    if (!validNames(value?.names)) return null;
    const card = value.slot === 1 ? 1 : 0;
    return {names:[...value.names], card, resume:{label:'my01_0070', pc:0}, variables:null, scene:null, music:null};
  } catch { return null; }
}

// Moves the old checkpoint into the store once (an existing slot wins). The old key is kept.
export function importLegacy(store, storage = globalThis.localStorage) {
  const old = legacy(storage);
  if (!old) return 0;
  return store.importLegacy(GAME_ID, [{slot:dataSlot(old.card), fields:{schema:SCHEMA, dataVersion:codec.dataVersion,
    edition:'ja', label:old.names[0], payload:old, original:original(old.card, 'DATA01')}}]);
}

export async function openSaves({base = '/shared/save/', ...options} = {}) {
  try {
    const {SaveStore} = await import(base + 'store.js');
    const store = await SaveStore.open(options);
    importLegacy(store);
    return new Ps2Saves(store);
  } catch (error) {
    console.warn('Shared save store unavailable; using this browser only', error);
    return new Ps2Saves(null);
  }
}
