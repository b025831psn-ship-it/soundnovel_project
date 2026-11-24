// Registry of ROM adapters. An adapter turns ROM bytes the player already has
// (read from the user's own file, in this browser) into story JSON (see ../story.js).
// Nothing from the ROM leaves the browser; the converted story is cached locally only.
//
// Adapter shape:
//   id        string, used in ?rom=<id>
//   title     shown on the "open your ROM" screen
//   files     [{ role, label, required }]  e.g. the patched ROM and the original for `ja`
//   identify(bytes) -> role | null          which of `files` these bytes are (header, size, hash)
//   convert({ [role]: Uint8Array }) -> raw story JSON (may be async)
import sample from './sample-adapter.js';

const adapters = [sample];

export function getAdapter(id) {
  return adapters.find((a) => a.id === id) || null;
}

export function registerAdapter(adapter) {
  if (!getAdapter(adapter.id)) adapters.push(adapter);
}
