import type { Difficulty } from './types';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

// Açık (kolay) → koyu (zor) mavi merdiveni — oyuncu bir bakışta hangi
// zorlukta olduğunu renkten anlar. --diff-easy/--diff-medium bilinçli olarak
// sabittir (temayla dönüşmez); --accent (zor) her iki temada da --paper ile
// doğru yönde ters döner, bu yüzden text-[var(--paper)] güvenlidir.
export const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  easy: 'bg-[var(--diff-easy-soft)] text-[var(--ink)]',
  medium: 'bg-[var(--diff-medium-soft)] text-[var(--ink)]',
  hard: 'bg-[var(--accent)] text-[var(--paper)]',
};

// Yalnızca dolgu rengi gereken yerler için (ör. FinishDialog'un üst şeridi) —
// DIFFICULTY_BADGE_CLASS'tan string ayrıştırmak yerine ayrı, sağlam bir sözlük.
export const DIFFICULTY_STRIPE_CLASS: Record<Difficulty, string> = {
  easy: 'bg-[var(--diff-easy)]',
  medium: 'bg-[var(--diff-medium)]',
  hard: 'bg-[var(--accent)]',
};

// Ana sayfa kartlarındaki ikon rozeti — text rengi bilinçli olarak sabit
// (Tailwind literal), çünkü diff-easy/diff-medium arka planları da sabit:
// koyu lacivert ikon parlak turkuazda (kontrast ~7.2:1), beyaz ikon orta
// mavide (~4.9:1) — her iki temada da aynı, hesaplanmış kontrast korunur.
export const DIFFICULTY_CHIP_CLASS: Record<Difficulty, string> = {
  easy: 'bg-[var(--diff-easy)] text-slate-900',
  medium: 'bg-[var(--diff-medium)] text-white',
  hard: 'bg-[var(--accent)] text-[var(--paper)]',
};
