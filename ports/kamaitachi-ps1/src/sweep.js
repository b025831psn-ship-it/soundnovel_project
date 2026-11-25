import { loadPortData } from "./port-data.js";
import { ScenarioFault, ScenarioVM } from "./vm.js";

const locationKey = ({ resourceId, recordId, offset = 0 }) => `${resourceId}:${recordId}+${offset}`;

export async function sweep(portDataRoot, {
  resourceId = 25, recordId = 7, maxStates = 200000, includeResourceEntries = false,
  unlockPolicy = "fresh",
} = {}) {
  if (!["fresh", "both"].includes(unlockPolicy)) throw new Error(`unknown unlock policy: ${unlockPolicy}`);
  const data = await loadPortData(portDataRoot);
  const primary = data.manifest.opcodeTables.primary;
  const sub1d = data.manifest.opcodeTables.sub1d;
  const vm = new ScenarioVM({
    primaryHandlers: primary.handlers, sub1dHandlers: sub1d.handlers,
    primaryLengths: primary.lengths || [], sub1dLengths: sub1d.lengths || [],
  });
  const queue = [{ resourceId, recordId, offset: 0, stack: [], nextResource: null }];
  if (includeResourceEntries) for (const resource of data.resources.values()) {
    const entry = resource.records?.[0];
    if (entry && (resource.id !== resourceId || entry.id !== recordId))
      queue.push({ resourceId: resource.id, recordId: entry.id, offset: 0, stack: [], nextResource: null });
  }
  const states = new Set(), records = new Set(), endings = [], stops = [], failures = [];
  const counts = { choice: 0, jump: 0, call: 0, return: 0, branch: 0, flagStore: 0 };

  const enqueue = (location, stack, nextResource = null) => {
    if (!location) return;
    if (location.kind === "next-resource") {
      if (nextResource == null) { failures.push({ location: "dynamic", reason: "missing-next-resource" }); return; }
      location = { resourceId: nextResource, recordId: location.recordId || 0, offset: 0 };
    }
    if (location.kind === "resource-offset") {
      const resource = data.resources.get(Number(location.resourceId));
      const absoluteOffset = location.resourceOffset;
      const record = resource?.records?.find((candidate, index) => {
        const next = resource.records[index + 1];
        return absoluteOffset >= candidate.memberOffset
          && (!next || absoluteOffset < next.memberOffset);
      });
      if (!record) { failures.push({ location: locationKey(location), reason: "missing-resource-offset",
        resourceId: location.resourceId, resourceOffset: location.resourceOffset }); return; }
      location = { resourceId: location.resourceId, recordId: record.id,
        offset: absoluteOffset - record.memberOffset };
    }
    const resource = data.resources.get(Number(location.resourceId));
    if (!resource?.records?.some((record) => record.id === Number(location.recordId))) {
      failures.push({ location: locationKey(location), reason: "missing-label-target" });
      return;
    }
    queue.push({ ...location, offset: location.offset || 0, stack, nextResource });
  };
  const fallthroughRecord = (state) => {
    const resource = data.resources.get(state.resourceId);
    const index = resource?.records?.findIndex((row) => row.id === state.recordId) ?? -1;
    return index >= 0 && index + 1 < resource.records.length
      ? { resourceId: state.resourceId, recordId: resource.records[index + 1].id, offset: 0 } : null;
  };

  while (queue.length && states.size < maxStates) {
    const state = queue.shift();
    // Coverage is a control-flow graph property. Keying on the complete call
    // history explodes on recursive/shared subroutines, so retain only the
    // current location and immediate return site.
    const key = `${locationKey(state)}|${state.stack.length ? locationKey(state.stack.at(-1)) : "root"}`;
    if (states.has(key)) continue;
    states.add(key); records.add(`${state.resourceId}:${state.recordId}`);
    let events;
    try {
      const loaded = await data.record(state.resourceId, state.recordId);
      events = vm.run(loaded.bytes, state);
    } catch (error) {
      if (!(error instanceof ScenarioFault)) throw error;
      events = error.events;
      failures.push({ location: locationKey(state), reason: error.reason, event: error.event });
    }
    counts.flagStore += events.filter((event) => event.kind === "flag-store").length;
    const resourceStore = [...events].reverse().find((event) => event.kind === "flag-store" && event.flag === "next-resource");
    const nextResource = resourceStore?.value ?? state.nextResource;
    const transfer = [...events].reverse().find((event) =>
      ["choice", "choice-table", "jump", "call", "return", "branch", "ending"].includes(event.kind));
    if (!transfer) {
      const next = fallthroughRecord(state);
      if (next) enqueue(next, state.stack, nextResource);
      else if (nextResource != null && nextResource !== state.resourceId)
        enqueue({ resourceId: nextResource, recordId: 0, offset: 0 }, state.stack, null);
      else stops.push({ kind: "stop", reason: "resource-end", at: locationKey(state) });
      continue;
    }
    if (transfer.kind === "ending") {
      endings.push({ kind: "ending", id: transfer.id, at: locationKey(state) });
      enqueue(transfer.resume, [], null);
    } else if (transfer.kind === "choice" || transfer.kind === "choice-table") {
      counts.choice++;
      for (const option of transfer.options) enqueue(option.target, state.stack, nextResource);
      if (transfer.fallthrough) enqueue(transfer.fallthrough, state.stack, nextResource);
    } else if (transfer.kind === "jump") {
      counts.jump++; enqueue(transfer.target, state.stack, nextResource);
    } else if (transfer.kind === "call") {
      counts.call++; enqueue(transfer.target, [...state.stack, transfer.returnTo], nextResource);
    } else if (transfer.kind === "return") {
      counts.return++;
      if (state.stack.length) enqueue(state.stack.at(-1), state.stack.slice(0, -1), nextResource);
      else {
        // Retail handler 0x8001e830 only redirects while the call-depth byte
        // is non-zero; at depth zero opcode 15 is a fall-through no-op.
        const next = fallthroughRecord(state);
        if (next) enqueue(next, state.stack, nextResource);
        else if (nextResource != null && nextResource !== state.resourceId)
          enqueue({ resourceId: nextResource, recordId: 0, offset: 0 }, state.stack, null);
        else stops.push({ kind: "stop", reason: "resource-end", at: locationKey(state) });
      }
    } else {
      counts.branch++;
      if (!transfer.unlockRequired || unlockPolicy === "both") enqueue(transfer.target, state.stack, nextResource);
      enqueue(transfer.fallthrough, state.stack, nextResource);
    }
  }
  const totalRecords = [...data.resources.values()].reduce((sum, resource) => sum + (resource.records?.length || 0), 0);
  return {
    start: { resourceId, recordId }, states: states.size, records: records.size, totalRecords,
    roots: { freshPlay: true, resourceEntries: includeResourceEntries, unlockPolicy },
    coverage: totalRecords ? records.size / totalRecords : 0, counts,
    endings: [...new Map(endings.map((ending) => [ending.id, ending])).values()], stops,
    failures, truncated: queue.length > 0,
  };
}
