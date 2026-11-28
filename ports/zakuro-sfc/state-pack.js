// Packs a Zakuro VM state (vm/state.js) into a small JSON-safe object for the save store and back:
// typed arrays and Sets become tagged base64, then the whole thing is gzip-compressed.
// The state never holds the program image, the IPL ROM or the DSP gauss table (vm/state.js omits them).
const TYPES = { Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array };

const toBase64 = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const fromBase64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

function flatten(value) {
  if (ArrayBuffer.isView(value)) return { $t: value.constructor.name, b: toBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)) };
  if (value instanceof Set) return { $set: [...value].map(flatten) };
  if (Array.isArray(value)) return value.map(flatten);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, flatten(v)]));
  return value;
}

function inflate(value) {
  if (Array.isArray(value)) return value.map(inflate);
  if (value && typeof value === 'object') {
    if (typeof value.$t === 'string') {
      const Type = TYPES[value.$t];
      if (!Type) throw new TypeError(`unknown array type ${value.$t}`);
      const bytes = fromBase64(value.b);
      return new Type(bytes.buffer, 0, bytes.byteLength / Type.BYTES_PER_ELEMENT);
    }
    if (Array.isArray(value.$set)) return new Set(value.$set.map(inflate));
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, inflate(v)]));
  }
  return value;
}

async function through(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

export async function packState(state) {
  const json = new TextEncoder().encode(JSON.stringify(flatten(state)));
  return { gz: toBase64(await through(json, new CompressionStream('gzip'))) };
}

export async function unpackState(packed) {
  const json = await through(fromBase64(packed.gz), new DecompressionStream('gzip'));
  return inflate(JSON.parse(new TextDecoder().decode(json)));
}
