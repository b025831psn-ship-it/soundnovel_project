export const JAPANESE_NO_START = new Set(Array.from(
  '、。？！＿ヽヾゝゞ々仝〃ー’”）〕］〉」』】＞ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ'
));

export const KOREAN_NO_START = new Set([
  ...JAPANESE_NO_START, ...Array.from('.,!?)]}%:;'), '…',
]);

export const NO_END = new Set(Array.from('（〔［〈「『＜([{'));

export function wordWidth(chars, at, offset, advance) {
  let width = 0, cursor = offset;
  for (let i = at; i < chars.length && !/\s/u.test(chars[i]); i++) {
    width += advance(chars[i], cursor);
    cursor += chars[i].length;
  }
  return width;
}

// PCSX2 comparison: the main-island message window begins at x=18 and uses
// 34px baselines. The prologue/snow and authored margins keep their values.
export function originalStoryBox(label, layout) {
  if (/^my01_00(?:78|79|80|81)/.test(label ?? ''))
    return {...layout, lineSpacing: layout.lineSpacing === 7 ? 1 : layout.lineSpacing};
  if (!/^(?:my0[23]|_my[23])/.test(label ?? '')) return layout;
  return {
    ...layout,
    marginLeft: layout.marginLeft === 32 ? 18 : layout.marginLeft,
    marginRight: layout.marginRight === 32 ? 18 : layout.marginRight,
    lineSpacing: layout.lineSpacing === 7 ? 1 : layout.lineSpacing,
  };
}
