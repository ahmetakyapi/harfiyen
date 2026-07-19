import Link from 'next/link';
import { LetterTile } from '@/components/ui/LetterTile';
import { DIFFICULTY_BADGE_CLASS } from '@/lib/difficulty';
import { formatDuration } from '@/lib/share';
import type { Difficulty } from '@/lib/types';

const META: Record<Difficulty, { label: string; blurb: string }> = {
  easy: { label: 'Kolay', blurb: 'Isınma Turu' },
  medium: { label: 'Orta', blurb: 'Kahve Molası' },
  hard: { label: 'Zor', blurb: 'Günün Sınavı' },
};

// Kartın sol yarısında zorluk renginde çok hafif bir yıkama — dinlenme
// halinde bile üç kart ayrışır; via/to ile kartın sağı temiz kâğıt kalır.
const WASH_CLASS: Record<Difficulty, string> = {
  easy: 'from-[var(--diff-easy-soft)]',
  medium: 'from-[var(--diff-medium-soft)]',
  hard: 'from-[var(--diff-hard-soft)]',
};
const GLOW_CLASS: Record<Difficulty, string> = {
  easy: 'shadow-[0_12px_30px_-22px_var(--diff-easy)] hover:shadow-[0_20px_44px_-18px_var(--diff-easy)]',
  medium: 'shadow-[0_12px_30px_-22px_var(--diff-medium)] hover:shadow-[0_20px_44px_-18px_var(--diff-medium)]',
  hard: 'shadow-[0_12px_30px_-22px_var(--diff-hard)] hover:shadow-[0_20px_44px_-18px_var(--diff-hard)]',
};

export function DailyCard({ difficulty, size, wordCount, date, status, durationMs }: {
  difficulty: Difficulty; size: number; wordCount: number; date: string;
  status: 'yeni' | 'devam' | 'bitti'; durationMs: number | null;
}) {
  const meta = META[difficulty];
  return (
    <Link href={`/play/${date}/${difficulty}`}
      className={`group flex items-center gap-4 rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-r ${WASH_CLASS[difficulty]} via-[var(--paper-raised)] to-[var(--paper-raised)] p-4 transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${GLOW_CLASS[difficulty]}`}>
      <LetterTile difficulty={difficulty} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-2xl">{meta.label}</p>
          <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide ${DIFFICULTY_BADGE_CLASS[difficulty]}`}>
            {size}×{size}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-[var(--ink-soft)]">
          {meta.blurb} · {wordCount} kelime
        </p>
      </div>
      <div className="shrink-0 text-right text-sm">
        {status === 'bitti' && durationMs !== null && (
          <span className="font-mono tabular-nums text-[var(--correct)]">✓ {formatDuration(durationMs)}</span>
        )}
        {status === 'devam' && <span className="font-medium text-[var(--accent)]">Devam Et →</span>}
        {status === 'yeni' && (
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper-raised)] text-[var(--ink-soft)] transition-colors duration-200 group-hover:border-transparent group-hover:bg-[var(--ink)] group-hover:text-[var(--paper)]">
            →
          </span>
        )}
      </div>
    </Link>
  );
}
