// SFC saves on the shared SaveStore: SRAM blocks <-> slots, empty blocks, stale writes, state packing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveStore } from '../../../shared/save/store.js';
import { MemoryBackend } from '../../../shared/save/backends.js';
import { SfcSaves, GAME_ID, EMPTY_BLOCK, isEmptyBlock, importLegacySram, toBase64, bookInfo } from '../save/sfc-save.js';
import { packState, unpackState } from '../save/state-pack.js';

const open = async () => new SfcSaves(await SaveStore.open({ backend: new MemoryBackend() }));
const book = (plays) => { const b = EMPTY_BLOCK.slice(); b[0x7a] = plays; b[0x18] = 0b110; return b; };

test('a fresh device has empty bookmarks and stores none of them', async () => {
  const s = await open();
  const sram = s.sram();
  for (let i = 0; i < 4; i++) assert.ok(isEmptyBlock(sram.subarray(i * 0x800, (i + 1) * 0x800)));
  assert.equal(s.writeSram(sram.slice(), new Uint8Array(0x2000).fill(0x60)), 0);
  assert.equal(s.store.pending().length, 0);
});

test('only the blocks the game changed are written, one slot per block', async () => {
  const s = await open();
  const before = s.sram(), after = before.slice();
  after.set(book(3), 0x800); after.set(book(3), 0);
  assert.equal(s.writeSram(after, before), 2);
  assert.deepEqual(s.store.pending().map((p) => p.slot).sort(), ['manual-0', 'system']);
  assert.deepEqual(s.sram(), after);
  assert.equal(bookInfo(after.subarray(0x800, 0x1000)).plays, 3);
  assert.equal(bookInfo(after.subarray(0x800, 0x1000)).endings, 2);
});

test('a block replaced by another device is written from revision 0, so the push is a 409', async () => {
  const s = await open();
  const before = s.sram(), mine = before.slice(); mine.set(book(1), 0x1000);
  s.writeSram(mine, before);
  for (const p of s.store.pending()) s.store.markSynced(p.key, 5);
  // Another device's bookmark 2 arrives while this game still runs on its own.
  const env = { ...s.store.read(GAME_ID, 'manual-1'), revision: 6, payload: { sram: toBase64(book(9)) } };
  assert.ok(s.store.applyRemote(env));
  const next = mine.slice(); next[0x1000 + 0x7a] = 2;
  s.writeSram(next, mine);
  const out = s.store.pending().find((p) => p.slot === 'manual-1');
  assert.equal(out.baseRevision, 0);
  // Not stale: the game writes on top of what it loaded.
  const t = await open(); const b0 = t.sram(), b1 = b0.slice(); b1.set(book(4), 0x1800);
  t.writeSram(b1, b0); for (const p of t.store.pending()) t.store.markSynced(p.key, 7);
  const b2 = b1.slice(); b2[0x1800 + 0x7a] = 5; t.writeSram(b2, b1);
  assert.equal(t.store.pending()[0].baseRevision, 7);
});

test('old localStorage SRAM is moved in once, without empty blocks', async () => {
  const s = await open();
  const sram = s.sram(); sram.set(book(8), 0x800);
  const storage = { getItem: () => Buffer.from(sram).toString('base64') };
  assert.equal(importLegacySram(s.store, storage), 1);
  assert.equal(importLegacySram(s.store, storage), 0);
  assert.deepEqual(s.sram(), sram);
});

test('a packed VM state comes back with the same values and types', async () => {
  const state = { version: 3, a: new Uint8Array([1, 2, 3]), nested: { w: new Uint16Array([65535, 7]), f: new Float64Array([0.5, -1]), list: [1, { i: new Int16Array([-5]) }] }, inf: Infinity, nan: NaN, n: null };
  const back = await unpackState(await packState(state));
  assert.deepEqual(back.a, state.a); assert.deepEqual(back.nested.w, state.nested.w); assert.deepEqual(back.nested.f, state.nested.f);
  assert.deepEqual(back.nested.list[1].i, state.nested.list[1].i);
  assert.equal(back.inf, Infinity); assert.ok(Number.isNaN(back.nan)); assert.equal(back.n, null); assert.equal(back.version, 3);
});
