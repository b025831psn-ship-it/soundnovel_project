// Packs a VM state (SfcMachine.saveState(): plain objects, numbers and typed arrays) into one
// gzip'd binary, and back. Typed arrays go into a byte blob after a JSON header, so the 64 KiB
// memories compress as bytes rather than as base64 text (about 100 KB instead of 145 KB).
// Layout before gzip: u32 header length (LE), header JSON (UTF-8), blob.
const TYPES = { Uint8Array, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, Float32Array, Float64Array, Uint8ClampedArray };

async function through(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

export async function packState(state) {
  const parts = []; let size = 0;
  const header = new TextEncoder().encode(JSON.stringify(state, (key, value) => {
    if (ArrayBuffer.isView(value)) {
      const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      const ref = { $t: value.constructor.name, o: size, n: bytes.length };
      parts.push(bytes); size += bytes.length; return ref;
    }
    if (typeof value === 'number' && !Number.isFinite(value)) return { $n: String(value) };
    if (typeof value === 'bigint') throw new TypeError('bigint in state');
    return value;
  }));
  const out = new Uint8Array(4 + header.length + size);
  new DataView(out.buffer).setUint32(0, header.length, true);
  out.set(header, 4);
  let at = 4 + header.length; for (const p of parts) { out.set(p, at); at += p.length; }
  return through(out, new CompressionStream('gzip'));
}

export async function unpackState(packed) {
  const raw = await through(packed, new DecompressionStream('gzip'));
  const len = new DataView(raw.buffer, raw.byteOffset).getUint32(0, true);
  const blob = raw.subarray(4 + len);
  return JSON.parse(new TextDecoder().decode(raw.subarray(4, 4 + len)), (key, value) => {
    if (value && typeof value === 'object' && typeof value.$t === 'string' && TYPES[value.$t]) {
      const bytes = blob.slice(value.o, value.o + value.n);
      return new TYPES[value.$t](bytes.buffer);
    }
    if (value && typeof value === 'object' && typeof value.$n === 'string' && Object.keys(value).length === 1) return Number(value.$n);
    return value;
  });
}
