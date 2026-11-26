export const TOUCH_WRAM = Object.freeze({
  choiceActive: 0x007f,
  choiceCursor: 0x0081,
  choiceLastIndex: 0x0082,
  choiceTargets: 0x0083,
  saveSlot: 0x0348,
});

export function choiceRectangles(count, { width = 256, top = 20, rowHeight = 48 } = {}) {
  if (!Number.isInteger(count) || count < 0 || count > 4) throw new RangeError('invalid choice count');
  return Array.from({ length: count }, (_, index) => ({
    index, x: 0, y: top + index * rowHeight, width, height: rowHeight,
  }));
}

export function readTouchState(wram, written = null) {
  if (!(wram instanceof Uint8Array) || wram.length < 0x349) throw new TypeError('128 KiB WRAM is required');
  const initialized = !written || written[TOUCH_WRAM.choiceActive] !== 0;
  const choice = initialized && wram[TOUCH_WRAM.choiceActive] !== 0;
  const count = choice ? Math.min(4, wram[TOUCH_WRAM.choiceLastIndex] + 1) : 0;
  const targets = [];
  for (let i = 0; i < count; i++) {
    const offset = TOUCH_WRAM.choiceTargets + i * 2;
    const valid = !written || (written[offset] && written[offset + 1]);
    targets.push(valid ? wram[offset] | (wram[offset + 1] << 8) : 0);
  }
  const targetsWritten = !written || Array.from({ length: count }, (_, i) => {
    const offset = TOUCH_WRAM.choiceTargets + i * 2;
    return written[offset] && written[offset + 1];
  }).every(Boolean);
  const ready = choice && count > 0 && targetsWritten && targets.every(target => target !== 0);
  return {
    // Choice mode is proven from the scenario VM. Menu/bookmark flags still
    // need native WRAM watchpoint evidence, so non-choice screens stay text.
    mode: choice ? 'choice' : 'text',
    choice: choice ? {
      cursor: written && !written[TOUCH_WRAM.choiceCursor] ? 0
        : Math.min(wram[TOUCH_WRAM.choiceCursor], Math.max(0, count - 1)),
      count, targets, ready, rectangles: ready ? choiceRectangles(count) : [],
    } : null,
    // $0348 is also walked 0->1->2 by startup slot validation. It does not
    // prove that the save UI is visible, so do not expose it as shell mode.
    saveSlot: null,
  };
}
