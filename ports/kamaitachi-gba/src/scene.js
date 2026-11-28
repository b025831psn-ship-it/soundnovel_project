import { LAYER_BYTES, mergeSilhouette, removeSilhouette } from "./silhouette.js";

export class SceneLoader {
  constructor(assets, screen) {
    this.assets = assets;
    this.screen = screen;
    this.generation = 0;
  }
  resolve(request) {
    let variant = Math.floor(request / 1000),
      image = request % 1000;
    if (image === 200 && variant) {
      image = 201;
      variant--;
    }
    return { image, variant };
  }
  async request(argument, ram) {
    const request = argument + 1000 * ram.group;
    if (
      (ram.slot === 0x61 && argument === 0x4e) ||
      (ram.slot === 0x63 && (argument === 0x51 || argument === 0x54))
    ) {
      ram.pending = request;
      return;
    }
    await this.load(request, ++this.generation);
  }
  async overlay(request) {
    this.screen.setEffect?.(request);
  }
  brightness(slot, current) {
    this.screen.setBrightness?.(slot, current);
  }
  // Opcode 29 (08001444): silhouette `id` is merged into the layer's buffer (020117C8), whose
  // pointer (020117BC) is then set. Its palette replaces the layer's (0201ADC8).
  silhouetteAdd(id) {
    const picture = this.silhouettes?.picture(id);
    if (!picture) return;
    this.layerBuffer ??= new Uint8Array(LAYER_BYTES);
    mergeSilhouette(this.layerBuffer, picture.tiles);
    this.layerColors = picture.colors;
  }

  // 08008408 -> 08001354(step): step 0 copies the whole buffer to the layer, steps 1..8 copy row
  // step-1 of every tile (2E's blind, two frames a step). The layer turns on with the tint of the
  // moment (080011B0(-1)). Without a buffer, 080015DC(0) turns the layer off.
  silhouetteShow(step, tint) {
    if (!this.layerBuffer) {
      if (this.screen.silhouette) this.screen.setSilhouetteLayer?.(null);
      return;
    }
    const layer = this.screen.silhouette ?? { vram: new Uint8Array(LAYER_BYTES), colors: this.layerColors, tint: [...tint] };
    if (step === 0) layer.vram.set(this.layerBuffer);
    else for (let at = 4 * (step - 1); at < LAYER_BYTES; at += 32) layer.vram.set(this.layerBuffer.subarray(at, at + 4), at);
    this.screen.setSilhouetteLayer?.(layer);
  }

  // 080014DC (opcode 2D): the picture's nonzero nibbles are cleared from the buffer.
  silhouetteRemove(id) {
    const picture = this.silhouettes?.picture(id);
    if (!picture || !this.layerBuffer) return;
    removeSilhouette(this.layerBuffer, picture.tiles);
  }

  // 0800350C: buffer, layer and palette cleared, the layer off and the buffer pointer 0.
  silhouetteClear() {
    this.layerBuffer = null;
    this.layerColors = null;
    if (this.screen.silhouette) this.screen.setSilhouetteLayer?.(null);
  }

  async load(request, generation = ++this.generation) {
    this.current = request; // the picture a bookmark records
    const { image, variant } = this.resolve(request),
      [tiles, palette] = await Promise.all([
        this.assets.bin(`bg/${String(image).padStart(3, "0")}.bin`),
        this.assets.bin(`palette/${String(image).padStart(3, "0")}.bin`),
      ]);
    if (generation !== this.generation) return;
    this.screen.setBackground(tiles, palette, variant);
  }
}
export class Assets {
  constructor(base = "port-data") {
    this.base = base.replace(/\/$/, "");
  }
  // Paths `match` accepts are read from `base` instead (a translation's files over the originals).
  overlay(base, match) {
    this.overlayBase = base.replace(/\/$/, "");
    this.overlayMatch = match;
    return this;
  }
  async response(path) {
    const root = this.overlayMatch?.(path) ? this.overlayBase : this.base;
    const response = await fetch(`${root}/${path}`);
    if (!response.ok) throw new Error(`${response.status} ${path}`);
    return response;
  }
  async bin(path) {
    return new Uint8Array(await (await this.response(path)).arrayBuffer());
  }
  async json(path) {
    return (await this.response(path)).json();
  }
}
