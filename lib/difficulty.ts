import type { Difficulty } from './types';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

// Küçük etiket rozetleri (oyun başlığı, 6×6 çipi vb.) — kolay/orta yumuşak
// zeminde mürekkep rengi metin; zor dolgun lacivertte kâğıt rengi metin.
// --diff-hard her iki temada da --paper ile ters döner, o yüzden güvenli.
export const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  easy: 'bg-[var(--diff-easy-soft)] text-[var(--ink)]',
  medium: 'bg-[var(--diff-medium-soft)] text-[var(--ink)]',
  hard: 'bg-[var(--diff-hard)] text-[var(--paper)]',
};

// Yalnızca dolgu rengi gereken yerler için (ör. FinishDialog'un üst şeridi).
export const DIFFICULTY_STRIPE_CLASS: Record<Difficulty, string> = {
  easy: 'bg-[var(--diff-easy)]',
  medium: 'bg-[var(--diff-medium)]',
  hard: 'bg-[var(--diff-hard)]',
};

// Sıralama sayfasındaki aktif zorluk sekmesi — yumuşak zemin + zorluk
// renginde halka; her iki temada da metin --ink olduğundan kontrast güvenli.
export const DIFFICULTY_TAB_CLASS: Record<Difficulty, string> = {
  easy: 'bg-[var(--diff-easy-soft)] text-[var(--ink)] ring-1 ring-[var(--diff-easy)]',
  medium: 'bg-[var(--diff-medium-soft)] text-[var(--ink)] ring-1 ring-[var(--diff-medium)]',
  hard: 'bg-[var(--diff-hard-soft)] text-[var(--ink)] ring-1 ring-[var(--diff-hard)]',
};

// İmza öğe: zorluk işaretleri ikon değil, oyunun kendisinden gelen "harf
// taşları" — köşesinde numarası olan birer çengel bulmaca hücresi (K/O/Z).
// Taşın zemini her iki temada da SABİT krem (fiziksel bir taş gibi), bu
// yüzden harf renkleri de sabit: krem (#fdf8ec) üzerinde üçü de ≥4.8:1.
// Gradyan çerçeve zorluk merdivenini taşır (turkuaz → azur → lacivert).
export const DIFFICULTY_TILE: Record<Difficulty, {
  letter: string; no: number; ringClass: string; letterClass: string;
}> = {
  easy: { letter: 'K', no: 1, ringClass: 'bg-gradient-to-br from-[#38c3e8] to-[#0086bf]', letterClass: 'text-[#006b96]' },
  medium: { letter: 'O', no: 2, ringClass: 'bg-gradient-to-br from-[#3f8fd9] to-[#0d5799]', letterClass: 'text-[#0d5799]' },
  hard: { letter: 'Z', no: 3, ringClass: 'bg-gradient-to-br from-[#4a6fd4] to-[#0c2f6b]', letterClass: 'text-[#0c2f6b]' },
};
