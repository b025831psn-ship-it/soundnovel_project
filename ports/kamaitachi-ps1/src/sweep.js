import { loadPortData } from "./port-data.js";
import { ScenarioFault, ScenarioVM } from "./vm.js";

const locationKey = ({ resourceId, recordId, offset = 0 }) => `${resourceId}:${recordId}+${offset}`;
const isEndingTarget = (target) => target?.resourceId === 31 && target?.recordId === 11;

function resolveLocation(data, location) {
  if (!location) return null;
  if (location.kind === "label-or-resource-offset") {
    const labelResource = data.resources.get(Number(location.labelTarget.resourceId));
    location = labelResource?.records?.some((record) => record.id === Number(location.labelTarget.recordId))
      ? location.labelTarget : location.offsetTarget;
  }
  if (location.kind !== "resource-offset") return location;
  const resource = data.resources.get(Number(location.resourceId)), absoluteOffset = location.resourceOffset;
  const record = resource?.records?.find((candidate, index) => { const next = resource.records[index + 1];
    return absoluteOffset >= candidate.memberOffset && (!next || absoluteOffset < next.memberOffset); });
  return record ? { resourceId: location.resourceId, recordId: record.id,
    offset: absoluteOffset - record.memberOffset } : location;
}

export async function sweep(portDataRoot, {
  resourceId = 25, recordId = 7, maxStates = 200000, includeResourceEntries = false,
  unlockPolicy = "fresh", includeFreshRoot = true, additionalRoots = [], distinguishRoots = false,
} = {}) {
  if (!["fresh", "both"].includes(unlockPolicy)) throw new Error(`unknown unlock policy: ${unlockPolicy}`);
  const data = await loadPortData(portDataRoot);
  const primary = data.manifest.opcodeTables.primary, sub1d = data.manifest.opcodeTables.sub1d;
  const vm = new ScenarioVM({ primaryHandlers: primary.handlers, sub1dHandlers: sub1d.handlers,
    primaryLengths: primary.lengths || [], sub1dLengths: sub1d.lengths || [] });
  const queue = includeFreshRoot
    ? [{ resourceId, recordId, offset: 0, stack: [], nextResource: null, root: "fresh-play" }]
    : [];
  for (const root of additionalRoots) queue.push({ ...root, offset: root.offset || 0, stack: [],
    nextResource: null, root: root.name || `${root.resourceId}:${root.recordId}` });
  if (includeResourceEntries) for (const resource of data.resources.values()) {
    const entry = resource.records?.[0];
    if (entry && (resource.id !== resourceId || entry.id !== recordId)) queue.push({ resourceId: resource.id,
      recordId: entry.id, offset: 0, stack: [], nextResource: null, root: `resource-entry:${resource.id}` });
  }
  const states = new Set(), records = new Set(), endings = [], endingRoutes = [], stops = [], failures = [];
  const counts = { choice: 0, jump: 0, call: 0, return: 0, branch: 0, flagStore: 0 };
  let activeState = null;
  const enqueue = (location, stack, nextResource = null, root = "unknown") => {
    if (!location) return;
    location = resolveLocation(data, location);
    if (location.kind === "next-resource") {
      if (nextResource == null) { failures.push({ location: "dynamic", reason: "missing-next-resource" }); return; }
      location = { resourceId: nextResource, recordId: location.recordId || 0, offset: 0 };
    }
    if (location.kind === "resource-offset") {
      const resource = data.resources.get(Number(location.resourceId)), absoluteOffset = location.resourceOffset;
      const record = resource?.records?.find((candidate, index) => { const next = resource.records[index + 1];
        return absoluteOffset >= candidate.memberOffset && (!next || absoluteOffset < next.memberOffset); });
      if (!record) { failures.push({ location: locationKey(location), reason: "missing-resource-offset",
        resourceId: location.resourceId, resourceOffset: location.resourceOffset }); return; }
      location = { resourceId: location.resourceId, recordId: record.id,
        offset: absoluteOffset - record.memberOffset };
    }
    const resource = data.resources.get(Number(location.resourceId));
    if (!resource?.records?.some((record) => record.id === Number(location.recordId))) {
      failures.push({ location: locationKey(location), reason: "missing-label-target",
        from: activeState ? locationKey(activeState) : null }); return;
    }
    queue.push({ ...location, offset: location.offset || 0, stack, nextResource, root });
  };
  const fallthroughRecord = (state) => { const resource = data.resources.get(state.resourceId);
    const index = resource?.records?.findIndex((row) => row.id === state.recordId) ?? -1;
    return index >= 0 && index + 1 < resource.records.length
      ? { resourceId: state.resourceId, recordId: resource.records[index + 1].id, offset: 0 } : null; };
  const noteEndingRoute = (state, transfer, target) => { if (isEndingTarget(target)) endingRoutes.push({
    root: state.root, source: locationKey({ ...state, offset: transfer.offset }), opcode: transfer.opcode,
    kind: transfer.kind, target: "31:11" }); };

  while (queue.length && states.size < maxStates) {
    const state = queue.shift();
    activeState = state;
    const key = `${distinguishRoots ? `${state.root}|` : ""}${locationKey(state)}|${state.stack.length ? locationKey(state.stack.at(-1)) : "root"}`;
    if (states.has(key)) continue;
    states.add(key); records.add(`${state.resourceId}:${state.recordId}`);
    let events;
    try { events = vm.run((await data.record(state.resourceId, state.recordId)).bytes, state); }
    catch (error) { if (!(error instanceof ScenarioFault)) throw error; events = error.events;
      failures.push({ location: locationKey(state), reason: error.reason, event: error.event }); }
    counts.flagStore += events.filter((event) => event.kind === "flag-store").length;
    const resourceStore = [...events].reverse().find((event) => event.kind === "flag-store" && event.flag === "next-resource");
    const nextResource = resourceStore?.value ?? state.nextResource;
    const transfer = [...events].reverse().find((event) =>
      ["choice", "choice-table", "jump", "call", "return", "branch", "ending"].includes(event.kind));
    if (!transfer) {
      const next = fallthroughRecord(state);
      if (next) enqueue(next, state.stack, nextResource, state.root);
      else if (nextResource != null && nextResource !== state.resourceId)
        enqueue({ resourceId: nextResource, recordId: 0, offset: 0 }, state.stack, null, state.root);
      else stops.push({ kind: "stop", reason: "resource-end", at: locationKey(state), root: state.root });
      continue;
    }
    if (transfer.kind === "ending") { endings.push({ kind: "ending", id: transfer.id, at: locationKey(state), root: state.root });
      enqueue(transfer.resume, [], null, state.root);
    } else if (transfer.kind === "choice" || transfer.kind === "choice-table") {
      counts.choice++;
      for (const option of transfer.options) { noteEndingRoute(state, transfer, option.target);
        enqueue(option.target, state.stack, nextResource, state.root); }
      if (transfer.fallthrough) enqueue(transfer.fallthrough, state.stack, nextResource, state.root);
    } else if (transfer.kind === "jump") { counts.jump++; noteEndingRoute(state, transfer, transfer.target);
      enqueue(transfer.target, state.stack, nextResource, state.root);
    } else if (transfer.kind === "call") { counts.call++; noteEndingRoute(state, transfer, transfer.target);
      enqueue(transfer.target, [...state.stack, transfer.returnTo], nextResource, state.root);
    } else if (transfer.kind === "return") {
      counts.return++;
      if (state.stack.length) enqueue(state.stack.at(-1), state.stack.slice(0, -1), nextResource, state.root);
      else { const next = fallthroughRecord(state);
        if (next) enqueue(next, state.stack, nextResource, state.root);
        else if (nextResource != null && nextResource !== state.resourceId)
          enqueue({ resourceId: nextResource, recordId: 0, offset: 0 }, state.stack, null, state.root);
        else stops.push({ kind: "stop", reason: "resource-end", at: locationKey(state), root: state.root }); }
    } else { counts.branch++; noteEndingRoute(state, transfer, transfer.target);
      if (!transfer.unlockRequired || unlockPolicy === "both") enqueue(transfer.target, state.stack, nextResource, state.root);
      enqueue(transfer.fallthrough, state.stack, nextResource, state.root); }
  }
  const totalRecords = [...data.resources.values()].reduce((sum, resource) => sum + (resource.records?.length || 0), 0);
  const perResource = [...data.resources.values()].map((resource) => ({ resourceId: resource.id,
    reached: [...records].filter((key) => key.startsWith(`${resource.id}:`)).length,
    records: resource.records?.length || 0 })).filter((row) => row.reached > 0);
  return { start: includeFreshRoot ? { resourceId, recordId } : null, states: states.size, records: records.size,
    totalRecords, roots: { freshPlay: includeFreshRoot, additional: additionalRoots.map((root) => root.name),
      resourceEntries: includeResourceEntries, unlockPolicy }, coverage: totalRecords ? records.size / totalRecords : 0,
    perResource, counts, endings: [...new Map(endings.map((ending) => [ending.id, ending])).values()],
    endingRoutes: [...new Map(endingRoutes.map((route) => [`${route.source}>${route.target}`, route])).values()],
    stops, failures, truncated: queue.length > 0 };
}

export async function catalogTransfers(portDataRoot, targetResourceId = 31) {
  const data = await loadPortData(portDataRoot);
  const primary = data.manifest.opcodeTables.primary, sub1d = data.manifest.opcodeTables.sub1d;
  const vm = new ScenarioVM({ primaryHandlers: primary.handlers, sub1dHandlers: sub1d.handlers,
    primaryLengths: primary.lengths || [], sub1dLengths: sub1d.lengths || [] });
  const transfers = [];
  for (const resource of data.resources.values()) for (const record of resource.records || []) {
    const bytes = (await data.record(resource.id, record.id)).bytes;
    const queue = [0], offsets = new Set();
    while (queue.length) {
      const offset = queue.shift();
      if (offset >= bytes.length || offsets.has(offset)) continue;
      offsets.add(offset);
      let events;
      try { events = vm.run(bytes, { resourceId: resource.id, recordId: record.id, offset }); }
      catch (error) { if (!(error instanceof ScenarioFault)) throw error; events = error.events; }
      const transfer = [...events].reverse().find((event) =>
        ["choice", "choice-table", "jump", "call", "return", "branch", "ending"].includes(event.kind));
      if (!transfer) continue;
      const rawTargets = [transfer.target, ...(transfer.options || []).map((option) => option.target)].filter(Boolean);
      for (const rawTarget of rawTargets) {
        const target = resolveLocation(data, rawTarget);
        if (target.resourceId === targetResourceId) transfers.push({
          source: `${resource.id}:${record.id}+${transfer.offset}`, opcode: transfer.opcode,
          kind: transfer.kind, target: `${target.resourceId}:${target.recordId}`,
        });
        if (target.resourceId === resource.id && target.recordId === record.id) queue.push(target.offset || 0);
      }
      for (const continuation of [transfer.fallthrough, transfer.returnTo].filter(Boolean))
        if (continuation.resourceId === resource.id && continuation.recordId === record.id)
          queue.push(continuation.offset || 0);
    }
  }
  const uniqueTransfers = [...new Map(transfers.map((row) => [`${row.source}>${row.target}`, row])).values()];
  const endingRoutes = uniqueTransfers.filter((row) => row.target === "31:11");
  return { targetResourceId, transfers: uniqueTransfers, endingRoutes, endingCount: endingRoutes.length };
}
