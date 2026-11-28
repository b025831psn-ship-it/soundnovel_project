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
