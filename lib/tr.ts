export const TR_LETTERS = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H', 'I', 'İ', 'J', 'K', 'L',
  'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z',
] as const;

const LETTER_SET = new Set<string>(TR_LETTERS);

export const MIN_WORD_LEN = 3;
export const MAX_WORD_LEN = 10;

export function trUpper(s: string): string {
  return s.toLocaleUpperCase('tr-TR');
}

export function isTrLetter(ch: string): boolean {
  return ch.length === 1 && LETTER_SET.has(ch);
}

export function isValidWord(s: string): boolean {
  if (s.length < MIN_WORD_LEN || s.length > MAX_WORD_LEN) return false;
  return [...s].every(isTrLetter);
}
