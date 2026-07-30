import { TR_LETTERS } from './tr';

// Türkçe Q-klavyeden Q, W, X çıkarılmış hâli. Satır sıraları gerçek telefon
// klavyesiyle birebir aynı ("erty…", "asdf…", "zcvb…") — oyuncunun kas
// hafızası bozulmaz, ama alfabede olmayan üç tuş yer kaplamaz.
// 10 + 11 + 8 = 29 tuş: Türkçe alfabenin tamamı, fazlası eksiği yok.
export const KEY_ROWS: readonly (readonly string[])[] = [
  ['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
  ['Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç'],
] as const;

// I/İ Türkçe'de en sık karıştırılan çifttir ve büyük harfken tek ayırt edici
// işaret noktadır. Tuşun altına küçük harfini de yazınca ("I" altında ı,
// "İ" altında i) hangi tuşun hangisi olduğu bir bakışta netleşir.
export const LOWERCASE_HINT: Readonly<Record<string, string>> = { I: 'ı', İ: 'i' };

export const KEYBOARD_LETTERS: readonly string[] = KEY_ROWS.flat();

/** Klavye düzeni Türkçe alfabenin tamamını tam olarak bir kez kapsıyor mu. */
export function coversAlphabet(): boolean {
  const keys = new Set(KEYBOARD_LETTERS);
  return keys.size === KEYBOARD_LETTERS.length
    && keys.size === TR_LETTERS.length
    && TR_LETTERS.every((l) => keys.has(l));
}
