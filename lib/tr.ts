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

/**
 * Kullanıcı adını tek ve KAYIPSIZ bir biçime indirger.
 *
 * Neden özel bir fonksiyon: `toLocaleLowerCase('tr-TR')` 'I' harfini 'ı'ya
 * çevirir ve USERNAME_RE (`^[a-z0-9_]+$`) bunu reddeder — "Islam" ile kayıt
 * olmaya çalışan ya da telefonu ilk harfi büyüten bir oyuncu KALICI olarak
 * kilitleniyordu (kilit sunucu tarafındaydı, istemciden aşılamıyordu).
 * Düz `toLowerCase()` de çözmez: 'İ' → 'i' + U+0307 birleşik imi üretir.
 * Bu yüzden iki Türkçe tuzağı açıkça eşliyor, sonra birleşik imleri atıyoruz.
 */
export function normalizeUsername(input: string): string {
  return input
    .trim()
    .replaceAll('İ', 'i')
    .replaceAll('I', 'i')
    .toLowerCase()
    .normalize('NFD')
    .replaceAll('\u0307', '')
    .normalize('NFC');
}

export function isValidWord(s: string): boolean {
  if (s.length < MIN_WORD_LEN || s.length > MAX_WORD_LEN) return false;
  return [...s].every(isTrLetter);
}
