import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Tilt } from '@/components/motion/Tilt';
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

export function DailyCard({ difficulty, size, wordCount, date, status, durationMs, locked = false }: {
  difficulty: Difficulty; size: number; wordCount: number; date: string;
  status: 'yeni' | 'devam' | 'bitti'; durationMs: number | null;
  /** Üye olmayan ziyaretçi: karta dokunduğunda giriş duvarına çarpacağını
   *  ÖNCEDEN bilsin. Eskiden hiçbir işaret yoktu. */
  locked?: boolean;
}) {
  const meta = META[difficulty];
  return (
    // Eğim fareyle çalışır; dokunmatikte basılı tutma geri bildirimi
    // active:scale ile gelir.
    <Tilt>
    <Link href={locked ? `/login?next=/play/${date}/${difficulty}` : `/play/${date}/${difficulty}`}
      className={`group flex items-center gap-4 rounded-[1.6rem] border border-[var(--line)] bg-gradient-to-r ${WASH_CLASS[difficulty]} via-[var(--paper-raised)] to-[var(--paper-raised)] p-4 transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.985] ${GLOW_CLASS[difficulty]}`}>
      <span className="tile-wobble"><LetterTile difficulty={difficulty} /></span>
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
        {!locked && status === 'bitti' && durationMs !== null && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--correct-soft)] px-3 py-1.5 font-mono text-xs font-semibold tabular-nums text-[var(--correct)]">
            ✓ {formatDuration(durationMs)}
          </span>
        )}
        {!locked && status === 'devam' && <span className="font-medium text-[var(--accent)]">Devam Et →</span>}
        {locked && (
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper-raised)] text-[var(--ink-soft)]">
            <Lock aria-label="Üyelik gerekir" className="h-4 w-4" />
          </span>
        )}
        {!locked && status === 'yeni' && (
          // Ok, düğmenin içinde sağa kayıp çıkar ve soldan yeniden girer.
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--paper-raised)] text-[var(--ink-soft)] transition-colors duration-300 group-hover:border-transparent group-hover:bg-[var(--ink)] group-hover:text-[var(--paper)]">
            <span className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-[180%]">→</span>
            <span aria-hidden className="absolute -translate-x-[180%] transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0">→</span>
          </span>
        )}
      </div>
    </Link>
    </Tilt>
  );
}
