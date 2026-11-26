import { ScenarioFault, ScenarioVM } from "./vm.js";
import { loadPortData } from "./port-data.js";
import { RetailFramebuffer } from "./renderer.js";
import { RetailInputLatch } from "./touch-shell.js";
import { resolveLocation } from "./sweep.js";

const SOUND_OPS = new Set(["0x2f", "0x30", "0x31", "0x32", "0x35", "0x36"]);

export async function createRuntime(portDataRoot, { sound = null, renderer = new RetailFramebuffer(),
  resourceId = 25, recordId = 7, renderEvent = null, choiceLayout = null,
  branchPolicy = () => false } = {}) {
  const data = await loadPortData(portDataRoot), primary = data.manifest.opcodeTables.primary;
  const sub1d = data.manifest.opcodeTables.sub1d, input = new RetailInputLatch();
  const state = { resourceId, recordId, offset: 0, stack: [], waiting: false, choice: null, cursor: 0,
    rows: [], events: [], failure: null, frame: 0 };
  const vm = new ScenarioVM({ primaryHandlers: primary.handlers, sub1dHandlers: sub1d.handlers,
    primaryLengths: primary.lengths || [], sub1dLengths: sub1d.lengths || [], sound });
  const runtime = {
    input, sound, renderer, state,
    get framebuffer() { return renderer.rgba; },
    touchRows: () => state.rows,
    cursorIndex: () => state.cursor,
    menuMode: () => state.waiting && !state.failure ? "menu" : "none",
    moveCursor(delta) { if (!state.choice) return; state.cursor = (state.cursor + delta + state.choice.options.length) % state.choice.options.length; },
    async step() {
      const keys = input.consumeFrame().trigger;
      sound?.vsync?.();
      if (state.choice) {
        if (keys.includes("up") || keys.includes("left")) runtime.moveCursor(-1);
        if (keys.includes("down") || keys.includes("right")) runtime.moveCursor(1);
        if (keys.includes("confirm")) { const selected = state.choice.options[state.cursor]; state.choice = null; state.rows = [];
          Object.assign(state, { ...resolveLocation(data, selected.target), waiting: false }); }
      } else if (!state.waiting || keys.includes("confirm")) {
        state.waiting = false;
        const loaded = await data.record(state.resourceId, state.recordId); let events;
        try { events = vm.run(loaded.bytes, state); }
        catch (error) { if (!(error instanceof ScenarioFault)) throw error; events = error.events; state.failure = error; }
        state.events = events;
        const texts = events.filter((event) => event.kind === "text");
        if (texts.length) state.waiting = true;
        if (renderEvent) for (const event of events) await renderEvent(event, { data, renderer, runtime });
        const choice = events.find((event) => event.kind === "choice" || event.kind === "choice-table");
        if (choice) { state.choice = choice; state.cursor = 0; state.waiting = true;
          state.rows = choiceLayout ? choiceLayout(choice, { data, renderer, runtime }) : []; }
        const transfer = [...events].reverse().find((event) => ["jump", "call", "return", "branch", "ending"].includes(event.kind));
        if (!choice && transfer?.kind === "jump") Object.assign(state, resolveLocation(data, transfer.target));
        else if (!choice && transfer?.kind === "call") { state.stack.push(transfer.returnTo); Object.assign(state, resolveLocation(data, transfer.target)); }
        else if (!choice && transfer?.kind === "return" && state.stack.length) Object.assign(state, state.stack.pop());
        else if (!choice && transfer?.kind === "branch") Object.assign(state,
          resolveLocation(data, branchPolicy(transfer, state) ? transfer.target : transfer.fallthrough));
        if (!choice && !transfer) { const resource = data.resources.get(state.resourceId), index = resource.records.findIndex((r) => r.id === state.recordId);
          if (index + 1 < resource.records.length) Object.assign(state, { recordId: resource.records[index + 1].id, offset: 0 }); }
      }
      renderer.stepEffects(); sound?.frame?.(); state.frame++;
      return { frame: state.frame, waiting: state.waiting, choice: state.choice, events: state.events,
        soundOps: state.events.filter((event) => SOUND_OPS.has(event.opcode)).length };
    },
  };
  return runtime;
}
