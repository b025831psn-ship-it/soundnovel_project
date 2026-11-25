import { loadPortData } from "./port-data.js";
import { ScenarioFault, ScenarioVM, opcodeStatus } from "./vm.js";

export async function createHeadless(portDataRoot, options = {}) {
  const data = await loadPortData(portDataRoot);
  const primary = data.manifest.opcodeTables.primary.handlers;
  const sub1d = data.manifest.opcodeTables.sub1d.handlers;
  const primaryLengths = data.manifest.opcodeTables.primary.lengths || [];
  const sub1dLengths = data.manifest.opcodeTables.sub1d.lengths || [];
  return {
    data,
    opcodeStatus: () => opcodeStatus(primary, sub1d, primaryLengths, sub1dLengths),
    async run(resourceId, recordId, choicePolicy = "first") {
      const vm = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d,
        primaryLengths, sub1dLengths, choicePolicy, ...options });
      const events = [];
      const resource = data.resources.get(Number(resourceId));
      const start = resource?.records?.findIndex((record) => record.id === Number(recordId)) ?? -1;
      if (start < 0) throw new Error(`missing SCE resource ${resourceId} record ${recordId}`);
      const end = options.followFlow === false ? start + 1 : resource.records.length;
      for (let index = start; index < end; index++) {
        const current = resource.records[index];
        const loaded = await data.record(resourceId, current.id);
        try {
          const recordEvents = vm.run(loaded.bytes, { resourceId: Number(resourceId), recordId: current.id });
          events.push(...recordEvents.filter((event) => event.kind !== "terminal"));
          if (recordEvents.some((event) => event.kind === "choice"))
            return { resourceId: Number(resourceId), recordId: Number(recordId), events, failure: null };
        } catch (error) {
          if (!(error instanceof ScenarioFault)) throw error;
          events.push(...error.events);
          return { resourceId: Number(resourceId), recordId: Number(recordId), events,
            failure: { reason: error.reason, message: error.message, ...error.event } };
        }
      }
      events.push({ resourceId: Number(resourceId), recordId: resource.records[Math.min(end, resource.records.length) - 1]?.id,
        kind: "terminal", reason: options.followFlow === false ? "record-end" : "resource-end" });
      return { resourceId: Number(resourceId), recordId: Number(recordId), events, failure: null };
    },
  };
}

export async function run(portDataRoot, resourceId, recordId, choicePolicy = "first") {
  return (await createHeadless(portDataRoot)).run(resourceId, recordId, choicePolicy);
}
