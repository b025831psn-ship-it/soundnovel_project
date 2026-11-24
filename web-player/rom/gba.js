// Small helpers for GBA ROM images.
export function gbaHeader(bytes) {
  const ascii = (from, len) => String.fromCharCode(...bytes.subarray(from, from + len)).replace(/\0+$/, '');
  if (bytes.length < 0xc0) return null;
  return { title: ascii(0xa0, 12), code: ascii(0xac, 4), maker: ascii(0xb0, 2), version: bytes[0xbc] };
}

export async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
