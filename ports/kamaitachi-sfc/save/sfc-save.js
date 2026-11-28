// Bookmarks (しおり) and the web-only suspend slot of 카마이타치의 밤 (SFC) on the shared SaveStore
// (docs/save/README.md). The cartridge's 8 KiB battery SRAM is four 2 KiB blocks, each with its own
// checksums (ROM table $01:846D = 0000 0800 1000 1800):
//   0x0000  the game's working copy of the book being read  -> slot "system" (not on the shelf)
//   0x0800  bookmark 1 (top of the shelf)                    -> slot "manual-0"
//   0x1000  bookmark 2                                        -> slot "manual-1"
//   0x1800  bookmark 3                                        -> slot "manual-2"
// Each block is stored and synced on its own, byte for byte, so the SRAM the game reads is always
// the original layout. "suspend" holds a packed VM state (save/state-pack.js) without the SRAM.
import { SaveStore } from '../../../shared/save/store.js';

export const GAME_ID = 'kamaitachi-sfc';
export const SCHEMA = 1;
export const SRAM_SIZE = 0x2000;
export const BLOCK = 0x800;
export const BLOCK_SLOTS = ['system', 'manual-0', 'manual-1', 'manual-2'];
export const LEGACY_KEY = 'kamaitachi-sfc.sram';

export const toBase64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
export const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

const blockOf = (p) => { try { const b = fromBase64(p.sram); return b.length === BLOCK ? b : null; } catch { return null; } };
// Play count (0x87A in bookmark 1) and the ending bits (0x818-0x81F) of one bookmark block.
export function bookInfo(block) {
  let endings = 0; for (let n = 1; n <= 43; n++) if (block[0x18 + (n >> 3)] & (1 << (n & 7))) endings++;
  return { plays: block[0x7a] | (block[0x7b] << 8), endings, pink: !!(block[5] & 2), gold: !!(block[5] & 4) };
}

// A block nobody has played in: what the game writes over fresh SRAM at power-on (checksums
// 06CD at 0x00/0x02/0xC4, the rest zero), or the fresh pattern itself.
export const EMPTY_BLOCK = new Uint8Array(BLOCK); EMPTY_BLOCK.set([0xcd, 0x06, 0xcd, 0x06]); EMPTY_BLOCK.set([0xcd, 0x06], 0xc4);
export function isEmptyBlock(block) {
  if (block.every((b) => b === 0x60)) return true;
  for (let i = 0; i < block.length; i++) {
    const want = i === 0 || i === 2 || i === 0xc4 ? 0xcd : i === 1 || i === 3 || i === 0xc5 ? 0x06 : 0;
    if (block[i] !== want) return false;
  }
  return true;
}

export const codec = {
  gameId: GAME_ID,
  currentSchema: SCHEMA,
  dataVersion: 1,
  slots: () => [
    { id: 'system', group: 'system', canCopy: false, canErase: false, canWrite: true, showInOriginalUi: false, original: { fileId: 'SRAM 0x0000' } },
    ...[0, 1, 2].map((i) => ({ id: `manual-${i}`, group: 'manual', ordinal: i, canCopy: false, canErase: false, canWrite: true, showInOriginalUi: true, original: { fileId: `SRAM 0x${((i + 1) * BLOCK).toString(16)}` } })),
    { id: 'suspend', group: 'suspend', canCopy: false, canErase: true, canWrite: true, showInOriginalUi: false },
  ],
  encode: (snapshot) => snapshot,
  validate: (p) => (p && typeof p === 'object' && (typeof p.sram === 'string' ? blockOf(p) : typeof p.state === 'string') ? { ok: true } : { ok: false, reason: 'corrupt' }),
  migrate: () => ({ ok: false, reason: 'unsupportedSchema' }),
  decode: (p) => ({ ok: true, state: p }),
  summarize: (p) => {
    if (typeof p?.state === 'string') return { title: '중단 저장' };
    const b = p && blockOf(p);
    return { title: b ? `${bookInfo(b).plays}회` : '' };
  },
};

const same = (a, b) => { for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return false; return true; };
const fields = (payload) => ({ schema: SCHEMA, dataVersion: codec.dataVersion, edition: 'ja', label: codec.summarize(payload).title, payload });

export class SfcSaves {
  constructor(store) { this.store = store; }

  // The SRAM the game should start with: `base` (fresh or legacy bytes), with every stored block on top.
  sram(base = null) {
    // Blocks not stored yet are empty bookmarks as the game itself writes them over fresh SRAM.
    const out = new Uint8Array(SRAM_SIZE);
    for (let i = 0; i < SRAM_SIZE; i += BLOCK) out.set(EMPTY_BLOCK, i);
    if (base?.length === SRAM_SIZE) out.set(base);
    BLOCK_SLOTS.forEach((slot, i) => {
      const p = this.store.read(GAME_ID, slot)?.payload; const b = p && blockOf(p);
      if (b) out.set(b, i * BLOCK);
    });
    return out;
  }

  // Stores the blocks of `bytes` that differ from `before` (what the game started from or last wrote).
  // When the stored block is no longer `before` (another device's bookmark came in while this game
  // kept running on the old one), the write is made from revision 0 so the server answers 409 and
  // the player chooses, rather than this device quietly overwriting the other's progress.
  writeSram(bytes, before) {
    let n = 0;
    BLOCK_SLOTS.forEach((slot, i) => {
      const a = bytes.subarray(i * BLOCK, (i + 1) * BLOCK);
      const b = before?.subarray(i * BLOCK, (i + 1) * BLOCK);
      if (b && same(a, b)) return;
      const cur = this.store.read(GAME_ID, slot);
      // An empty block is only stored over an existing one: a new device that has merely been
      // switched on must not push blank bookmarks against the ones already on the server.
      if (isEmptyBlock(a) && !cur) return;
      const curBlock = cur && blockOf(cur.payload);
      const stale = !!(b && curBlock && !same(curBlock, b));
      this.store.write(GAME_ID, slot, fields({ sram: toBase64(a) }), stale ? { baseRevision: 0 } : {}); n++;
    });
    return n;
  }

  // Conflicts where this device only has an empty block: the other device's bookmark wins
  // without asking. Returns the slots it settled.
  settleEmptyConflicts() {
    const done = [];
    for (const [key, remote] of this.store.conflicts) {
      const [gameId, slot] = key.split('\u0000');
      if (gameId !== GAME_ID || !BLOCK_SLOTS.includes(slot)) continue;
      const local = this.store.read(GAME_ID, slot)?.payload; const b = local && blockOf(local);
      if (!local || (b && isEmptyBlock(b))) { this.store.resolveConflict(key, 'remote'); done.push(slot); }
    }
    return done;
  }

  readSuspend() { const p = this.store.read(GAME_ID, 'suspend')?.payload; return typeof p?.state === 'string' ? p : null; }
  writeSuspend(packed, info = {}) { this.store.write(GAME_ID, 'suspend', fields({ state: toBase64(packed), ...info })); }
  eraseSuspend() { this.store.erase(GAME_ID, 'suspend'); }
}

// Moves the old localStorage-only SRAM into the store once (blocks already stored win).
export function importLegacySram(store, storage = globalThis.localStorage) {
  let bytes = null;
  try { const t = storage?.getItem(LEGACY_KEY); if (t) bytes = fromBase64(t); } catch { /* unreadable: leave it */ }
  if (bytes?.length !== SRAM_SIZE) return 0;
  const entries = BLOCK_SLOTS.map((slot, i) => ({ slot, block: bytes.subarray(i * BLOCK, (i + 1) * BLOCK) }))
    .filter((e) => !isEmptyBlock(e.block)).map(({ slot, block }) => ({ slot, fields: fields({ sram: toBase64(block) }) }));
  return store.importLegacy(GAME_ID, entries);
}

export async function openSaves({ storage = globalThis.localStorage, ...options } = {}) {
  const store = await SaveStore.open(options);
  importLegacySram(store, storage);
  return new SfcSaves(store);
}
