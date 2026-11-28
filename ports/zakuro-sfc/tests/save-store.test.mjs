import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveStore } from '../../../shared/save/store.js';
import { MemoryBackend } from '../../../shared/save/backends.js';
import { GAME_ID, SLOT_BYTES, ZakuroSaves, importLegacySram, slotInUse } from '../save-store.js';

const open = async () => new ZakuroSaves(await SaveStore.open({ backend: new MemoryBackend() }));
// A slot as the game writes it: marker 1, some progress, byte sum in the last byte ($00:F48F).
const slot = (seed) => { const b = new Uint8Array(SLOT_BYTES); b[0] = 1; b[0x28] = seed; let s = 0; for (let i = 0; i < SLOT_BYTES - 1; i++) s = (s + b[i]) & 0xff; b[SLOT_BYTES - 1] = s; return b; };
const sram = () => new Uint8Array(0x2000).fill(0x60);

test('only slots the game accepts count as used', () => {
  assert.equal(slotInUse(slot(5)), true);
  assert.equal(slotInUse(new Uint8Array(SLOT_BYTES).fill(0xff)), false);
  const bad = slot(5); bad[3] ^= 1; assert.equal(slotInUse(bad), false);
});

test('SRAM writes become store slots, erases become deletes', async () => {
  const saves = await open();
  const s = saves.fillSram(sram());
  assert.deepEqual([...s.subarray(0, 4)], [0xff, 0xff, 0xff, 0xff]);
  s.set(slot(7), SLOT_BYTES); // slot 1
  assert.deepEqual(saves.takeSram(s), [1]);
  assert.equal(saves.store.read(GAME_ID, 'manual-1').payload.sram.length > 0, true);
  assert.deepEqual(saves.takeSram(s), []); // nothing new
  s.fill(0xff, SLOT_BYTES, 2 * SLOT_BYTES); // $00:F526
  assert.deepEqual(saves.takeSram(s), [1]);
  assert.equal(saves.store.read(GAME_ID, 'manual-1'), null);
});

test('a slot from another device is laid into the running SRAM', async () => {
  const a = await open(), b = await open();
  const sa = a.fillSram(sram()); sa.set(slot(9), 2 * SLOT_BYTES); a.takeSram(sa);
  const sb = b.fillSram(sram());
  b.store.applyRemote(a.store.read(GAME_ID, 'manual-2'));
  assert.equal(b.applyRemote(sb, 'manual-2'), true);
  assert.deepEqual([...sb.subarray(2 * SLOT_BYTES, 3 * SLOT_BYTES)], [...slot(9)]);
  assert.equal(b.applyRemote(sb, 'manual-2'), false);
});

test('the old localStorage SRAM moves into the store once', async () => {
  const saves = await open();
  const old = sram(); old.set(slot(3), 0);
  let text = ''; for (const x of old) text += String.fromCharCode(x);
  const storage = { getItem: () => btoa(text) };
  assert.equal(importLegacySram(saves.store, storage), 1);
  assert.equal(importLegacySram(saves.store, storage), 0);
  assert.deepEqual([...saves.slotBytes(0)], [...slot(3)]);
});

test('the suspend slot packs the VM state without the SRAM and unpacks it', async () => {
  const saves = await open();
  const state = { format: 'zakuro-vm-state', cpu: { a: 1 }, bus: { wram: new Uint8Array([1, 2, 3]), sram: new Uint8Array(8) }, set: new Set([1]) };
  await saves.writeSuspend(state, { scene: 12 });
  assert.equal(saves.hasSuspend(), true);
  const back = await saves.readSuspend();
  assert.deepEqual([...back.bus.wram], [1, 2, 3]);
  assert.equal('sram' in back.bus, false);
  assert.deepEqual([...back.set], [1]);
  assert.equal(saves.store.read(GAME_ID, 'suspend').payload.scene, 12);
});

test('a suspend slot marked empty offers nothing to carry on from', async () => {
  const saves = await open();
  await saves.writeSuspend({ bus: {} }, { scene: 3 });
  saves.clearSuspend();
  assert.equal(saves.hasSuspend(), false);
  assert.equal(await saves.readSuspend(), null);
});
