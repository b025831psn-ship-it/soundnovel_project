export class GBAInput {
  constructor(target = document) {
    this.buttons = new Set();
    this.map = {
      KeyZ: "A",
      Enter: "START",
      KeyX: "B",
      ArrowUp: "UP",
      ArrowDown: "DOWN",
      ArrowLeft: "LEFT",
      ArrowRight: "RIGHT",
      KeyA: "L",
      KeyS: "R",
      Backspace: "SELECT",
    };
    target.addEventListener(
      "keydown",
      (e) => this.map[e.code] && this.buttons.add(this.map[e.code]),
    );
    target.addEventListener("keyup", (e) =>
      this.buttons.delete(this.map[e.code]),
    );
  }
  pressed(k) {
    return this.buttons.has(k);
  }
}
