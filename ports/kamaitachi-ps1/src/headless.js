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
      const walk = async (startResourceId, startRecordId, stopAtChoice = true) => {
        const events = [];
        const resource = data.resources.get(Number(startResourceId));
        const start = resource?.records?.findIndex((record) => record.id === Number(startRecordId)) ?? -1;
        if (start < 0) throw new Error(`missing SCE resource ${startResourceId} record ${startRecordId}`);
        const end = options.followFlow === false ? start + 1 : resource.records.length;
        for (let index = start; index < end; index++) {
          const current = resource.records[index];
          const loaded = await data.record(startResourceId, current.id);
          try {
            const recordEvents = vm.run(loaded.bytes, { resourceId: Number(startResourceId), recordId: current.id });
            events.push(...recordEvents.filter((event) => event.kind !== "terminal"));
            const choice = recordEvents.find((event) => event.kind === "choice");
            if (choice && stopAtChoice) return { events, choice, failure: null };
          } catch (error) {
            if (!(error instanceof ScenarioFault)) throw error;
            events.push(...error.events);
            return { events, choice: null,
              failure: { reason: error.reason, message: error.message, ...error.event } };
          }
        }
        events.push({ resourceId: Number(startResourceId), recordId: resource.records[Math.min(end, resource.records.length) - 1]?.id,
          kind: "terminal", reason: options.followFlow === false ? "record-end" : "resource-end" });
        return { events, choice: null, failure: null };
      };
      const root = await walk(resourceId, recordId);
      const result = { resourceId: Number(resourceId), recordId: Number(recordId), events: root.events, failure: root.failure };
      if (root.choice && choicePolicy === "enumerate") {
        result.branches = [];
        for (const option of root.choice.options) {
          const branch = await walk(option.target.resourceId, option.target.recordId);
          result.branches.push({ option, events: branch.events, choice: branch.choice, failure: branch.failure });
        }
      } else if (root.choice) {
        const selected = root.choice.options[Number.isInteger(choicePolicy) ? choicePolicy : 0] || root.choice.options[0];
        root.choice.target = selected?.target || null;
      }
      return result;
    },
  };
}

export async function run(portDataRoot, resourceId, recordId, choicePolicy = "first") {
  return (await createHeadless(portDataRoot)).run(resourceId, recordId, choicePolicy);
}
