// IPL transfer records: `[len:u16le][dest:u16le][payload]...`, a zero length ends the list
// and its destination is the driver entry. Browser-safe (no Node APIs).
export function readIplRecords(bytes, at = 0) {
  const records = []; let p = at;
  for (;;) {
    const n = bytes[p] | (bytes[p + 1] << 8), dest = bytes[p + 2] | (bytes[p + 3] << 8);
    records.push({ dest, payload: n ? bytes.subarray(p + 4, p + 4 + n) : null });
    if (!n) break; p += 4 + n;
  }
  return records;
}
