import type { Difficulty } from './types';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

// "correct" (kolay) → "accent" (zor) ekseninde ilerler; oyuncu bir bakışta
// hangi zorlukta olduğunu renkten anlar.
export const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  easy: 'bg-[var(--correct-soft)] text-[var(--correct)]',
  medium: 'bg-[var(--accent-soft)] text-[var(--ink)]',
  // text-white DEĞİL: dark modda --accent açık bir turuncu olduğundan beyaz metin
  // WCAG AA'yı geçemez (~2.8:1). --paper her iki temada da doğru yönde ters döner.
  hard: 'bg-[var(--accent)] text-[var(--paper)]',
};

// Yalnızca dolgu rengi gereken yerler için (ör. FinishDialog'un üst şeridi) —
// DIFFICULTY_BADGE_CLASS'tan string ayrıştırmak yerine ayrı, sağlam bir sözlük.
export const DIFFICULTY_STRIPE_CLASS: Record<Difficulty, string> = {
  easy: 'bg-[var(--correct)]',
  medium: 'bg-[var(--accent-soft)]',
  hard: 'bg-[var(--accent)]',
};
