// Quick save client: the whole game's saves (store.exportBackup) go to the server under a 4-digit code,
// and the code brings them back on any device. Server side: /v1/snap in server/server.mjs and
// cloudflare/functions/_lib/sync.js. The data is gzip + base64 so it fits the 256 KB body limit.
const b64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}
export const pack = async (value) => b64(await pipe(new TextEncoder().encode(JSON.stringify(value)), new CompressionStream("gzip")));
export const unpack = async (text) => JSON.parse(new TextDecoder().decode(await pipe(unb64(text), new DecompressionStream("gzip"))));

// Saves; `last` = { code, token } from this device's earlier save keeps the same code. Returns { code, token }.
export async function saveSnap({ baseUrl, gameId, backup, last, fetchImpl = fetch }) {
  const data = await pack(backup);
  const r = await fetchImpl(`${baseUrl}/v1/snap/${gameId}`, { method: "PUT", headers: { "content-type": "application/json" },
    body: JSON.stringify({ data, ...(last?.code && last?.token ? { code: last.code, token: last.token } : {}) }) });
  if (!r.ok) throw Object.assign(new Error(`snap save ${r.status}`), { status: r.status });
  return r.json();
}

// Loads a code: { ok: true, backup } or { ok: false, reason: "code" | "limited" | "server" }.
export async function loadSnap({ baseUrl, gameId, code, fetchImpl = fetch }) {
  const c = String(code ?? "").trim();
  if (!/^\d{4}$/.test(c)) return { ok: false, reason: "code" };
  let r;
  try { r = await fetchImpl(`${baseUrl}/v1/snap/${gameId}/${c}`, { method: "POST" }); } catch { return { ok: false, reason: "server" }; }
  if (r.status === 404) return { ok: false, reason: "code" };
  if (r.status === 429) return { ok: false, reason: "limited" };
  if (!r.ok) return { ok: false, reason: "server" };
  try { return { ok: true, backup: await unpack((await r.json()).data) }; } catch { return { ok: false, reason: "server" }; }
}

// --- save codes (6 digits, one per player for every game; /v1/code on the save server) ---------------
const reasonOf = (status) => (status === 404 ? "code" : status === 429 ? "limited" : status === 413 ? "large" : "server");
export async function newCode({ baseUrl, fetchImpl = fetch }) {
  const r = await fetchImpl(`${baseUrl}/v1/code`, { method: "POST" });
  if (!r.ok) throw Object.assign(new Error(`code ${r.status}`), { status: r.status, reason: reasonOf(r.status) });
  return (await r.json()).code;
}
// Uploads a game's backup under the code. Returns { ok } or { ok: false, reason }.
export async function putCode({ baseUrl, code, gameId, backup, fetchImpl = fetch, keepalive = false }) {
  try {
    const data = await pack(backup);
    const r = await fetchImpl(`${baseUrl}/v1/code/${code}/${gameId}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ data }), keepalive: keepalive && data.length < 60_000 });
    return r.ok ? { ok: true } : { ok: false, reason: reasonOf(r.status) };
  } catch { return { ok: false, reason: "server" }; }
}
// Loads a game's backup: { ok: true, backup | null } or { ok: false, reason: "code" | "limited" | "server" }.
export async function getCode({ baseUrl, code, gameId, fetchImpl = fetch }) {
  const c = String(code ?? "").trim();
  if (!/^\d{6}$/.test(c)) return { ok: false, reason: "code" };
  try {
    const r = await fetchImpl(`${baseUrl}/v1/code/${c}/${gameId}`, { method: "POST" });
    if (!r.ok) return { ok: false, reason: reasonOf(r.status) };
    const { data } = await r.json();
    return { ok: true, backup: data ? await unpack(data) : null };
  } catch { return { ok: false, reason: "server" }; }
}
