export const DEFAULT_NAMES = Object.freeze({
  ja: Object.freeze({protagonistFamily: '津田', protagonistGiven: '俊夫', partnerFamily: '中込', partnerGiven: '依子'}),
  ko: Object.freeze({protagonistFamily: '츠다', protagonistGiven: '토시오', partnerFamily: '나카고메', partnerGiven: '요리코'}),
});

export const NAME_FIELDS = Object.freeze([
  'partnerGiven', 'partnerFamily', 'protagonistGiven', 'protagonistFamily',
]);

// The retail screen accepts kana, Latin letters/numbers/symbols and searched
// kanji, four code points per family/given-name field. Hangul is the web-only
// equivalent for the Korean display path.
const ALLOWED = /^(?:[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Hangul}\p{Letter}\p{Number}\p{Punctuation}\p{Symbol}])+$/u;

export function validateName(value) {
  const characters = Array.from(value.normalize('NFC'));
  if (characters.length < 1 || characters.length > 4) return false;
  return ALLOWED.test(characters.join('')) && !characters.some(character => /[\p{Control}\p{Separator}]/u.test(character));
}

export function completeNames(values, locale = 'ja') {
  const defaults = DEFAULT_NAMES[locale] ?? DEFAULT_NAMES.ja;
  const result = {};
  for (const field of NAME_FIELDS) {
    const value = (values[field] ?? defaults[field]).normalize('NFC');
    if (!validateName(value)) throw new RangeError(`Invalid ${field}`);
    result[field] = value;
  }
  return result;
}

export function scenarioNames(names) {
  return [names.protagonistFamily, names.partnerGiven];
}
