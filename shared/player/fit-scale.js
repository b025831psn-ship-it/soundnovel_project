// The size of a port's game screen in its box (every port's fit()).
// Wide boxes (PC, phone held sideways): the largest whole-number scale in device pixels, so every
// original pixel is the same size. An upright box (phone held upright): the screen takes the full width
// (태우 2026-11-28: "세로로 게임 켰을때 가로 길이에 맞춰서"), a fraction scale being fine at phone pixel density.
const upright = () => globalThis.matchMedia?.("(orientation: portrait) and (pointer: coarse)").matches ?? false;
export function fitScale(boxWidth, boxHeight, width, height, ratio = globalThis.devicePixelRatio || 1) {
  const exact = Math.min(boxWidth / width, boxHeight / height);
  const steps = Math.floor(exact * ratio);
  if (upright() || steps < 1) return { scale: exact, whole: false, steps };
  return { scale: steps / ratio, whole: true, steps };
}
