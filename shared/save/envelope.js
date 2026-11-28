// Save envelope (format 1). See docs/save/README.md.
export const FORMAT = 1;
const ID = /^[a-z0-9][a-z0-9:_-]{0,63}$/;

export function keyOf(gameId, slot) {
  return `${gameId}\u0000${slot}`;
}

export function checkIds(gameId, slot) {
  if (!ID.test(gameId ?? "")) throw new TypeError(`bad gameId: ${gameId}`);
  if (!ID.test(slot ?? "")) throw new TypeError(`bad slot: ${slot}`);
}

export function validateEnvelope(env) {
  if (!env || typeof env !== "object") return "not an object";
  if (env.format !== FORMAT) return `unsupported format ${env.format}`;
  try { checkIds(env.gameId, env.slot); } catch (e) { return e.message; }
  for (const f of ["schema", "dataVersion", "revision"]) {
    if (!Number.isInteger(env[f]) || env[f] < 0) return `bad ${f}`;
  }
  if (typeof env.savedAt !== "string" || Number.isNaN(Date.parse(env.savedAt))) return "bad savedAt";
  if (!("payload" in env)) return "missing payload";
  return null;
}
