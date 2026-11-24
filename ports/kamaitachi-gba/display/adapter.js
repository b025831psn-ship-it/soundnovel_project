import { DEFAULT_DISPLAY_MODE, displayMode } from "./modes.js";
import { Handheld25xRenderer } from "./webgl.js";

export class DisplayAdapter {
  constructor(sourceCanvas, mount, mode = DEFAULT_DISPLAY_MODE) {
    this.source = sourceCanvas;
    this.mount = mount;
    this.setMode(mode);
  }

  setMode(requested) {
    const mode = displayMode(requested);
    const output = document.createElement("canvas");
    output.width = mode.width;
    output.height = mode.height;
    try {
      this.renderer = mode.id === "handheld-2.5x" ? new Handheld25xRenderer(output) : null;
      this.mode = mode.id;
    } catch (error) {
      console.warn("handheld-2.5x unavailable; falling back to native", error);
      output.width = 240;
      output.height = 160;
      this.renderer = null;
      this.mode = DEFAULT_DISPLAY_MODE;
    }
    this.output?.remove();
    this.output = output;
    this.mount.append(output);
    if (this.renderer) {
      output.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        if (this.output !== output) return;
        this.setMode(DEFAULT_DISPLAY_MODE);
        this.render();
      }, { once: true });
    }
    return this.mode;
  }

  render() {
    if (this.renderer) {
      const frame = this.source.getContext("2d").getImageData(0, 0, 240, 160);
      this.renderer.render(frame.data);
    } else {
      const context = this.output.getContext("2d");
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, 240, 160);
      context.drawImage(this.source, 0, 0);
    }
  }
}
