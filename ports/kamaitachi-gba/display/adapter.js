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
    let output = this.source;
    let renderer = null;
    try {
      if (mode.id === "handheld-2.5x") {
        output = document.createElement("canvas");
        output.width = mode.width;
        output.height = mode.height;
        renderer = new Handheld25xRenderer(output);
      }
      this.mode = mode.id;
    } catch (error) {
      console.warn("handheld-2.5x unavailable; falling back to native", error);
      output = this.source;
      this.mode = DEFAULT_DISPLAY_MODE;
    }
    this.output?.remove();
    this.renderer = renderer;
    this.output = output;
    output.dataset.displayMode = this.mode;
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
    }
  }
}
