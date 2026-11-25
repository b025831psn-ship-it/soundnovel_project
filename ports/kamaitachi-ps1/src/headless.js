import { loadPortData } from "./port-data.js";
import { ScenarioFault, ScenarioVM, opcodeStatus } from "./vm.js";

export async function createHeadless(portDataRoot, options = {}) {
  const data = await loadPortData(portDataRoot);
  const primary = data.manifest.opcodeTables.primary.handlers;
  const sub1d = data.manifest.opcodeTables.sub1d.handlers;
  return {
    data,
    opcodeStatus: () => opcodeStatus(primary, sub1d),
    async run(resourceId, recordId, choicePolicy = "first") {
      const loaded = await data.record(resourceId, recordId);
      const vm = new ScenarioVM({ primaryHandlers: primary, sub1dHandlers: sub1d, choicePolicy, ...options });
      try {
        return { resourceId: Number(resourceId), recordId: Number(recordId),
          events: vm.run(loaded.bytes, { resourceId: Number(resourceId), recordId: Number(recordId) }), failure: null };
      } catch (error) {
        if (!(error instanceof ScenarioFault)) throw error;
        return { resourceId: Number(resourceId), recordId: Number(recordId), events: error.events,
          failure: { reason: error.reason, message: error.message, ...error.event } };
      }
    },
  };
}

export async function run(portDataRoot, resourceId, recordId, choicePolicy = "first") {
  return (await createHeadless(portDataRoot)).run(resourceId, recordId, choicePolicy);
}
