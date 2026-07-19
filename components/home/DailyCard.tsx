import Link from 'next/link';
import { Coffee, Flame, Sparkles } from 'lucide-react';
import { DIFFICULTY_CHIP_CLASS } from '@/lib/difficulty';
import { formatDuration } from '@/lib/share';
import type { Difficulty } from '@/lib/types';

const META: Record<Difficulty, { label: string; blurb: string; Icon: typeof Sparkles }> = {
  easy: { label: 'Kolay', blurb: 'Isınma Turu', Icon: Sparkles },
  medium: { label: 'Orta', blurb: 'Kahve Molası', Icon: Coffee },
  hard: { label: 'Zor', blurb: 'Günün Sınavı', Icon: Flame },
};

// Kart hover'ında zorluk rengiyle uyumlu, hafif "glow" gölge — genel
// border/shadow yerine her karta kendi kimliğini veren premium bir dokunuş.
const GLOW_CLASS: Record<Difficulty, string> = {
  easy: 'hover:shadow-[0_16px_36px_-16px_var(--diff-easy)]',
  medium: 'hover:shadow-[0_16px_36px_-16px_var(--diff-medium)]',
  hard: 'hover:shadow-[0_16px_36px_-16px_var(--accent)]',
};

export function DailyCard({ difficulty, size, wordCount, date, status, durationMs }: {
  difficulty: Difficulty; size: number; wordCount: number; date: string;
  status: 'yeni' | 'devam' | 'bitti'; durationMs: number | null;
}) {
  const meta = META[difficulty];
  return (
    <Link href={`/play/${date}/${difficulty}`}
      className={`group flex items-center gap-4 rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)] p-4 transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${GLOW_CLASS[difficulty]}`}>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${DIFFICULTY_CHIP_CLASS[difficulty]}`}>
        <meta.Icon className="h-6 w-6" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl">{meta.label}</p>
        <p className="mt-0.5 truncate text-sm text-[var(--ink-soft)]">
          {meta.blurb} · {size}×{size} · {wordCount} kelime
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
