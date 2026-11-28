export const NATIVE_WIDTH = 320;
export const NATIVE_HEIGHT = 240;

export class RetailInputLatch {
  #pending = new Set();
  pulse(input) { this.#pending.add(input); }
  consumeFrame() {
    const trigger = [...this.#pending];
    this.#pending.clear();
    return { trigger, held: [] };
  }
}

export function nativePoint(canvas, event) {
  const box = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(NATIVE_WIDTH - 1,
      Math.floor(((event.clientX - box.left) * NATIVE_WIDTH) / box.width))),
    y: Math.max(0, Math.min(NATIVE_HEIGHT - 1,
      Math.floor(((event.clientY - box.top) * NATIVE_HEIGHT) / box.height))),
  };
}

export function routeTouch(runtime, x, y) {
  const hit = (runtime.touchRows() || []).find((row) => x >= row.left && x < row.right
    && y >= row.top && y < row.bottom);
  if (!hit) return runtime.input.pulse("confirm");
  const current = runtime.cursorIndex();
  if (hit.index === current) runtime.input.pulse("confirm");
  else runtime.moveCursor(hit.index - current);
}

// touchRows() comes from the retail menu/name/memory-card renderer in native
// 320x240 coordinates. No HTML overlay is used as a hit map.
export function attachTouchShell({ canvas, runtime, sound = null, back = null, menu = null }) {
  if (!canvas || !runtime?.input || typeof runtime.touchRows !== "function")
    throw new TypeError("canvas and a retail touch runtime are required");
  const resume = () => sound?.resume?.();
  const tap = (event) => {
    if (!event.isPrimary) return;
    event.preventDefault();
    resume();
    const { x, y } = nativePoint(canvas, event);
    routeTouch(runtime, x, y);
  };
  canvas.addEventListener("pointerdown", tap);

  const bind = (element, input) => element?.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;
    event.preventDefault();
    resume();
    runtime.input.pulse(input);
  });
  bind(back, "cancel");
  bind(menu, "menu");

  const keydown = (event) => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const input = { Enter: "confirm", " ": "confirm", Escape: "cancel", m: "menu",
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" }[event.key];
    if (!input) return;
    event.preventDefault();
    runtime.input.pulse(input);
  };
  addEventListener("keydown", keydown);
  return () => {
    canvas.removeEventListener("pointerdown", tap);
    removeEventListener("keydown", keydown);
  };
}
