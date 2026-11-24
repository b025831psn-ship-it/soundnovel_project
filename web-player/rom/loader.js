// "Open your own ROM": read files the user picks, find which role each one is,
// convert with the adapter and keep the result in this browser's IndexedDB only.
import { getAdapter } from './adapters.js';
import { normalizeStory } from '../story.js';
import { sha256 } from './gba.js';

const DB = 'soundnovel.webPlayer.rom';
const STORE = 'stories';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
  });
}

export async function cachedStory(adapterId) {
  try { return (await tx('readonly', (s) => s.get(adapterId))) || null; } catch { return null; }
}

export async function forgetStory(adapterId) {
  try { await tx('readwrite', (s) => s.delete(adapterId)); } catch { /* nothing cached */ }
}

// files: File[] picked by the user. Returns { story, roles } or throws with a message for the user.
export async function convertFiles(adapter, files) {
  const byRole = {};
  const unknown = [];
  for (const f of files) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    const role = adapter.identify(bytes);
    if (role) byRole[role] = bytes;
    else unknown.push(f.name);
  }
  if (unknown.length) throw new Error(`${adapter.title}의 ROM이 아닌 파일입니다: ${unknown.join(', ')}`);
  const missing = adapter.files.filter((r) => r.required && !byRole[r.role]);
  if (missing.length) throw new Error(`필요한 파일이 없습니다: ${missing.map((r) => r.label).join(', ')}`);
  const raw = await adapter.convert(byRole);
  const story = normalizeStory(raw); // throws StoryFormatError if the adapter produced bad data
  const hashes = {};
  for (const [role, bytes] of Object.entries(byRole)) hashes[role] = await sha256(bytes);
  try { await tx('readwrite', (s) => s.put({ raw, hashes, at: Date.now() }, adapter.id)); } catch { /* play without caching */ }
  return { story, raw };
}

export { getAdapter };
