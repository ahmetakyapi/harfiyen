'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';

// Zorluk sekmeleri. Etkin sekmenin zemini sekmeler arasında KAYAR (layoutId):
// sayfa sunucuda yeniden render edilse de bu bileşen ağaçta aynı yerde
// kaldığı için framer-motion eski konumdan yenisine geçişi çizer.
const PILL: Record<Difficulty, string> = {
  easy: 'bg-[var(--diff-easy-soft)] ring-1 ring-[var(--diff-easy)]',
  medium: 'bg-[var(--diff-medium-soft)] ring-1 ring-[var(--diff-medium)]',
  hard: 'bg-[var(--diff-hard-soft)] ring-1 ring-[var(--diff-hard)]',
};

export function DifficultyTabs({ date, difficulty }: { date: string; difficulty: Difficulty }) {
  return (
    <nav className="mb-6 flex justify-center gap-2">
      {DIFFICULTIES.map((d) => {
        const active = d === difficulty;
        return (
          <Link key={d} href={`/leaderboard?date=${date}&difficulty=${d}`}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
              active ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)] ring-1 ring-inset ring-[var(--line)] hover:text-[var(--ink)]'
            }`}>
            {active && (
              <motion.span layoutId="difficulty-tab" aria-hidden
                className={`absolute inset-0 rounded-full ${PILL[d]}`}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
            )}
            <span className="relative">{DIFFICULTY_LABELS[d]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
