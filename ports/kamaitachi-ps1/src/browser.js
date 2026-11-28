import { createRuntime } from "./runtime.js";
import { createPs1Sound } from "../sound/web/ps1-sound.js";

export async function startBrowserRuntime({ canvas, dataRoot, soundRoot, runtimeFactory = createRuntime,
  soundFactory = createPs1Sound, requestFrame = requestAnimationFrame } = {}) {
  if (!canvas) throw new TypeError("PS1 screen canvas is required");
  const context = canvas.getContext("2d", { alpha: false });
  context.imageSmoothingEnabled = false;
  const sound = await soundFactory({ data: soundRoot });
  const runtime = await runtimeFactory(dataRoot, { sound });
  const image = context.createImageData(320, 240);
  let stopped = false, running = false;
  const draw = () => { image.data.set(runtime.framebuffer); context.putImageData(image, 0, 0); };
  const frame = async () => {
    if (stopped || running) return;
    running = true;
    try { await runtime.step(); draw(); }
    finally { running = false; if (!stopped) requestFrame(frame); }
  };
  draw(); requestFrame(frame);
  return { runtime, sound, stop() { stopped = true; } };
}
