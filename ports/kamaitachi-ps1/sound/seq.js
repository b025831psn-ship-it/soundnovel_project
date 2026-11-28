// Sony SEQ ("pQES") sequence: big-endian header, then MIDI-style events with
// running status. libsnd uses NRPN controllers (CC 99/98/6) for loop marks.
export function parseSeqHeader(bytes, offset = 0) {
  if (String.fromCharCode(...bytes.subarray(offset, offset + 4)) !== "pQES") throw new Error("not a SEQ");
  const be = (o, n) => { let v = 0; for (let i = 0; i < n; i++) v = v * 256 + bytes[offset + o + i]; return v; };
  return { version: be(4, 4), resolution: be(8, 2), tempo: be(10, 3), rhythm: [bytes[offset + 13], bytes[offset + 14]], dataOffset: offset + 15 };
}

// Reads events from dataOffset until FF 2F (end of track). Returns plain events
// for analysis; the playback timing is libsnd's job (ported separately).
export function readSeqEvents(bytes, header, limit = 200000) {
  const events = [];
  let at = header.dataOffset, status = 0, tick = 0;
  const vlq = () => { let v = 0, b; do { b = bytes[at++]; v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };
  // The first event follows the header directly with its own delta time.
  for (let n = 0; n < limit && at < bytes.length; n++) {
    tick += vlq();
    let byte = bytes[at];
    if (byte & 0x80) { status = byte; at++; }
    if (status === 0xff) {
      const type = bytes[at++];
      if (type === 0x2f) { events.push({ tick, type: "end" }); break; }
      if (type === 0x51) { const t = (bytes[at] << 16) | (bytes[at + 1] << 8) | bytes[at + 2]; at += 3; events.push({ tick, type: "tempo", tempo: t }); continue; }
      events.push({ tick, type: "meta", meta: type }); continue;
    }
    const kind = status & 0xf0, channel = status & 0x0f;
    const a = bytes[at++];
    if (kind === 0xc0 || kind === 0xd0) { events.push({ tick, type: kind === 0xc0 ? "program" : "pressure", channel, a }); continue; }
    const b = bytes[at++];
    events.push({ tick, type: { 0x80: "off", 0x90: "on", 0xa0: "poly", 0xb0: "cc", 0xe0: "bend" }[kind] || "?", channel, a, b });
  }
  return { events, end: at };
}
