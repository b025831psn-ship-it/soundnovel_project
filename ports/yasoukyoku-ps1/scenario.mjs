const sjis = new TextDecoder("shift_jis", { fatal: true });

function requireBytes(bytes, offset, length, end) {
  if (offset < 0 || offset + length > end || end > bytes.length) {
    throw new RangeError("Truncated scenario data at " + offset);
  }
}

function character(bytes, offset, end) {
  const lead = bytes[offset];
  if ((lead >= 0x80 && lead <= 0x9f) || (lead >= 0xe0 && lead <= 0xef)) {
    requireBytes(bytes, offset, 2, end);
    return [sjis.decode(bytes.subarray(offset, offset + 2)), 2];
  }
  // SLPS-01462 compact character conversion, original routine 0x80027878.
  let bias = 0x829e;
  if (lead < 0x73) bias = 0x827f;
  else if (lead < 0x80) bias = 0x82cd;
  else if (lead < 0xd2) bias = 0x82ad;
  else if (lead < 0xe0) bias = 0x82ae;
  const code = lead + bias;
  return [sjis.decode(Uint8Array.of(code >> 8, code & 255)), 1];
}

function phrase(bytes, offset, end) {
  let text = "";
  let cursor = offset;
  while (cursor < end && bytes[cursor] >= 0x1b) {
    const op = bytes[cursor];
    if (op >= 0x20) {
      const [glyph, size] = character(bytes, cursor, end);
      text += glyph;
      cursor += size;
    } else {
      const hex = n => n.toString(16).toUpperCase().padStart(2, "0");
      cursor++;
      const hasArgument = op === 0x1d || op === 0x1e;
      requireBytes(bytes, cursor, Number(hasArgument), end);
      text += "[" + hex(op) + (hasArgument ? ":" + hex(bytes[cursor++]) : "") + "]";
    }
  }
  return { text, end: cursor };
}

function options(bytes, start, end) {
  requireBytes(bytes, start, 3, end);
  const mode = bytes[start];
  let cursor = start + 3;
  if (mode & 0x80) {
    requireBytes(bytes, cursor, 1, end);
    const flag = bytes[cursor];
    cursor += 3 + (flag >> 4 ? 2 * (flag & 15) : 0);
  }
  const result = [];
  for (let n = 0; n < (mode & 15); n++) {
    const option = phrase(bytes, cursor, end);
    requireBytes(bytes, option.end, 3, end);
    if (bytes[option.end] !== 0) throw Error("Invalid choice terminator at " + option.end);
    result.push({ offset: cursor, ...option, target: bytes[option.end+1] * 256 + bytes[option.end+2] });
    cursor = option.end + 3;
  }
  if (cursor !== end) throw Error("Invalid choice length at " + start);
  return result;
}

// Offsets refer to the complete ED resource. Payloads remain in the caller's private buffer.
export function* decodeRecord(bytes, start, end) {
  requireBytes(bytes, start, 1, end);
  let offset = start;
  while (offset < end) {
    const op = bytes[offset];
    if (op === 0) {
      if (offset + 1 !== end) throw Error("Early record end at " + offset);
      yield { kind: "end", offset };
      return;
    }
    if (op >= 0x1b) {
      const decoded = phrase(bytes, offset, end);
      yield { kind: "text", offset, ...decoded };
      offset = decoded.end;
      continue;
    }
    if (op > 9) throw Error("Unknown scenario opcode " + op + " at " + offset);
    requireBytes(bytes, offset, 2, end);
    const start = offset + 2;
    const size = bytes[offset + 1];
    requireBytes(bytes, start, size, end);
    const next = start + size;
    const command = { kind: "command", op, offset, payload: bytes.subarray(start, next) };
    if (op === 4 && size && (bytes[start] & 0x30) === 0) {
      command.options = options(bytes, start, next);
    }
    yield command;
    offset = next;
  }
  throw Error("Missing record terminator at " + end);
}
