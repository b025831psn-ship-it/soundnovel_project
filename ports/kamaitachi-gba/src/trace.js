const hex = (value, width) => value.toString(16).padStart(width, "0");
export const TRACE_HEADER =
  "frame\tbank\toffset\topcode\targs\tgroup\tslot\tpending\tsp\twrites\twait";
export function traceLine(event) {
  return [
    event.frame,
    hex(event.bank, 2),
    hex(event.offset, 4),
    hex(event.opcode, 2),
    event.args.map((value) => hex(value, value > 255 ? 4 : 2)).join(","),
    event.group,
    event.slot,
    event.pending,
    event.sp,
    event.writes.join(","),
    event.wait,
  ].join("\t");
}
