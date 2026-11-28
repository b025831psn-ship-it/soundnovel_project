// A background picture of BGD.PAC as pixels, outside the machine: for a page that shows one picture
// (the hub's front page). The member is unpacked with the game's own decompressor (screen/ike.js)
// and its TIMs are read as the picture routine reads them (screen/picture.js): 8-bit pixels and a
// 15-bit palette, 320x240. Nothing is written anywhere: the page reads the port's own data.
import { ike } from "./screen/ike.js";

const u16 = (b, o) => b[o] | b[o + 1] << 8, u32 = (b, o) => (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;

// One member of a PAC archive ({id u16, sector u16} rows up to id 0xffff; 2048-byte sectors).
export function pacMember(pac, id) {
  for (let i = 0; ; i += 4) { const k = u16(pac, i); if (k === 0xffff) return null; if (k === id) return pac.subarray(u16(pac, i + 2) * 2048, u16(pac, i + 6) * 2048); }
}

// member -> { width, height, rgba }. Packed members ("ike" at +2) are unpacked first.
export function decodePicture(member) {
  let b = member;
  if (b[2] === 0x69 && b[3] === 0x6b && b[4] === 0x65) {
    // the header holds only the low 16 bits of the size: room for the largest picture, and the TIMs say where they end
    const ram = new Uint8Array(b.length + 0x40000); ram.set(b, 0);
    ike({ read: (a) => ram[a], write: (a, v) => { ram[a] = v; } }, 0, b.length);
    b = ram.subarray(b.length);
  }
  const tims = []; let o = 0;
  while (u32(b, o) === 0x10) { // a TIM: flags, then the palette block and the image block
    const flags = u32(b, o + 4); let p = o + 8, clut = null;
    if (flags & 8) { clut = p + 12; p += u32(b, p); }
    const x = u16(b, p + 4), y = u16(b, p + 6), w = u16(b, p + 8) * 2, h = u16(b, p + 10);
    tims.push({ bpp: flags & 7, clut, x: x * 2, y, w, h, at: p + 12 }); o = p + u32(b, p);
  }
  if (!tims.length || tims.some((t) => t.bpp !== 1 || t.clut === null)) throw new Error("picture: not an 8-bit TIM");
  const x0 = Math.min(...tims.map((t) => t.x)), y0 = Math.min(...tims.map((t) => t.y));
  const width = Math.max(...tims.map((t) => t.x - x0 + t.w)), height = Math.max(...tims.map((t) => t.y - y0 + t.h)), rgba = new Uint8ClampedArray(width * height * 4);
  for (const t of tims) for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
    const c = u16(b, t.clut + 2 * b[t.at + y * t.w + x]), q = ((t.y - y0 + y) * width + t.x - x0 + x) * 4;
    rgba[q] = (c & 31) * 255 / 31; rgba[q + 1] = (c >> 5 & 31) * 255 / 31; rgba[q + 2] = (c >> 10 & 31) * 255 / 31; rgba[q + 3] = 255;
  }
  return { width, height, rgba };
}

// One member of the PAC at `url`, fetched by itself: the table at the head of the archive, then the member's
// sectors (two range requests). A server without range requests sends the whole archive, once per URL.
const heads = new Map(), wholes = new Map();
export async function fetchPacMember(url, id) {
  const range = async (from, to) => {
    if (wholes.has(url)) return (await wholes.get(url)).subarray(from, to);
    const r = await fetch(url, { headers: { Range: `bytes=${from}-${to - 1}` } }); if (!r.ok) throw new Error(`${url}: ${r.status}`);
    const b = new Uint8Array(await r.arrayBuffer());
    if (r.status !== 200) return b;
    wholes.set(url, Promise.resolve(b)); return b.subarray(from, to);
  };
  if (!heads.has(url)) heads.set(url, (async () => { for (let n = 0x4000; ; n *= 2) { const h = await range(0, n); for (let i = 0; i + 3 < h.length; i += 4) if (u16(h, i) === 0xffff) return h; if (h.length < n) throw new Error(`${url}: no archive table`); } })());
  const h = await heads.get(url);
  for (let i = 0; ; i += 4) { const k = u16(h, i); if (k === 0xffff) return null; if (k === id) return range(u16(h, i + 2) * 2048, u16(h, i + 6) * 2048); }
}

// Draws picture `id` of the BGD.PAC at `dataRoot` on `canvas`, at the picture's own size (320x240;
// scale it with CSS and image-rendering: pixelated). Only that picture is fetched.
export async function drawPicture(canvas, dataRoot, id) {
  const member = await fetchPacMember(new URL("BGD.PAC", new URL(dataRoot, location.href)).href, id); if (!member) throw new Error(`picture ${id}: no such member`);
  const p = decodePicture(member);
  canvas.width = p.width; canvas.height = p.height; canvas.getContext("2d").putImageData(new ImageData(p.rgba, p.width, p.height), 0, 0);
  return p;
}
