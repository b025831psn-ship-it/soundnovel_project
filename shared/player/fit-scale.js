// The size of a port's game screen in its box (every port's fit()).
// Wide boxes (PC, phone held sideways): the largest whole-number scale in device pixels, so every
// original pixel is the same size. An upright box (phone held upright): the screen takes the full width
// (태우 2026-11-28: "세로로 게임 켰을때 가로 길이에 맞춰서"), a fraction scale being fine at phone pixel density.
// The phone itself, not this page's box: in the hub the player is an iframe wider than tall even on an upright phone.
const upright = () => {
  if (!(globalThis.matchMedia?.("(pointer: coarse)").matches)) return false;
  const type = globalThis.screen?.orientation?.type;
  return type ? type.startsWith("portrait") : (globalThis.screen?.height ?? 0) > (globalThis.screen?.width ?? 0);
};
export function fitScale(boxWidth, boxHeight, width, height, ratio = globalThis.devicePixelRatio || 1) {
  const exact = Math.min(boxWidth / width, boxHeight / height);
  const steps = Math.floor(exact * ratio);
  if (upright() || steps < 1) return { scale: exact, whole: false, steps };
  return { scale: steps / ratio, whole: true, steps };
}
