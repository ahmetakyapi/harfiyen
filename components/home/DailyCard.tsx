import Link from 'next/link';
import { formatDuration } from '@/lib/share';
import type { Difficulty } from '@/lib/types';

const META: Record<Difficulty, { label: string; blurb: string }> = {
  easy: { label: 'Kolay', blurb: 'Isınma turu' },
  medium: { label: 'Orta', blurb: 'Kahve molası' },
  hard: { label: 'Zor', blurb: 'Günün sınavı' },
};

export function DailyCard({ difficulty, size, wordCount, date, status, durationMs }: {
  difficulty: Difficulty; size: number; wordCount: number; date: string;
  status: 'yeni' | 'devam' | 'bitti'; durationMs: number | null;
}) {
  const meta = META[difficulty];
  return (
    <Link href={`/play/${date}/${difficulty}`}
      className="group flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-5 transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <p className="font-display text-2xl">{meta.label}</p>
        <p className="mt-0.5 text-sm text-[var(--ink-soft)]">
          {meta.blurb} · {size}×{size} · {wordCount} kelime
        </p>
      </div>
      <div className="text-right text-sm">
        {status === 'bitti' && durationMs !== null && (
          <span className="font-mono tabular-nums text-[var(--correct)]">✓ {formatDuration(durationMs)}</span>
        )}
        {status === 'devam' && <span className="text-[var(--accent)]">Devam et →</span>}
        {status === 'yeni' && <span className="text-[var(--ink-soft)] group-hover:text-[var(--accent)]">Oyna →</span>}
      </div>
    </Link>
  );
}
