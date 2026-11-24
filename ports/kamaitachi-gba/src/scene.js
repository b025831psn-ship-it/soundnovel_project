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
  async load(request, generation = ++this.generation) {
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
  async response(path) {
    const response = await fetch(`${this.base}/${path}`);
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
