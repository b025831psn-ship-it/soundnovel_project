// The save and sync dialog now lives in shared/save/sync-ui.js (every player uses it); this keeps
// the GBA page's <script type="module" src="sync-ui.js"> and its tests working unchanged.
export * from "../../shared/save/sync-ui.js";
