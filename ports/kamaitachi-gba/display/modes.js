export const DISPLAY_MODES = Object.freeze({
  native: Object.freeze({ id: "native", width: 240, height: 160, scale: 1 }),
  "handheld-2.5x": Object.freeze({ id: "handheld-2.5x", width: 600, height: 400, scale: 2.5 }),
});

export const DEFAULT_DISPLAY_MODE = "native";

export function displayMode(id) {
  return DISPLAY_MODES[id] ?? DISPLAY_MODES[DEFAULT_DISPLAY_MODE];
}
