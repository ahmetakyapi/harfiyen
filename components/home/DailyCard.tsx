import Link from 'next/link';
import { Coffee, Flame, Sparkles } from 'lucide-react';
import { DIFFICULTY_BADGE_CLASS, DIFFICULTY_CHIP_CLASS } from '@/lib/difficulty';
import { formatDuration } from '@/lib/share';
import type { Difficulty } from '@/lib/types';

const META: Record<Difficulty, { label: string; blurb: string; Icon: typeof Sparkles }> = {
  easy: { label: 'Kolay', blurb: 'Isınma Turu', Icon: Sparkles },
  medium: { label: 'Orta', blurb: 'Kahve Molası', Icon: Coffee },
  hard: { label: 'Zor', blurb: 'Günün Sınavı', Icon: Flame },
};

// Kartın kendi zorluk rengiyle hafif bir degrade zemini + sol şeridi var —
// dinlenme halinde bile üç kart birbirinden anında ayrışsın diye (sadece
// hover'da değil).
const WASH_CLASS: Record<Difficulty, string> = {
  easy: 'from-[var(--diff-easy-soft)]',
  medium: 'from-[var(--diff-medium-soft)]',
  hard: 'from-[var(--accent-soft)]',
};
const BAR_CLASS: Record<Difficulty, string> = {
  easy: 'bg-[var(--diff-easy)]',
  medium: 'bg-[var(--diff-medium)]',
  hard: 'bg-[var(--accent)]',
};
const GLOW_CLASS: Record<Difficulty, string> = {
  easy: 'shadow-[0_10px_28px_-20px_var(--diff-easy)] hover:shadow-[0_18px_40px_-16px_var(--diff-easy)]',
  medium: 'shadow-[0_10px_28px_-20px_var(--diff-medium)] hover:shadow-[0_18px_40px_-16px_var(--diff-medium)]',
  hard: 'shadow-[0_10px_28px_-20px_var(--accent)] hover:shadow-[0_18px_40px_-16px_var(--accent)]',
};

export function DailyCard({ difficulty, size, wordCount, date, status, durationMs }: {
  difficulty: Difficulty; size: number; wordCount: number; date: string;
  status: 'yeni' | 'devam' | 'bitti'; durationMs: number | null;
}) {
  const meta = META[difficulty];
  return (
    <Link href={`/play/${date}/${difficulty}`}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-br ${WASH_CLASS[difficulty]} to-[var(--paper-raised)] p-4 pl-5 transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${GLOW_CLASS[difficulty]}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${BAR_CLASS[difficulty]}`} />
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-4 ring-[var(--paper-raised)] ${DIFFICULTY_CHIP_CLASS[difficulty]}`}>
        <meta.Icon className="h-6 w-6" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-2xl">{meta.label}</p>
          <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${DIFFICULTY_BADGE_CLASS[difficulty]}`}>
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
        {status === 'yeni' && <span className="text-[var(--ink-soft)] group-hover:text-[var(--accent)]">Oyna →</span>}
      </div>
    </Link>
  );
}
