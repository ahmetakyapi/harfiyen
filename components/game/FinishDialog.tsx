'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { buildShareText, formatDuration } from '@/lib/share';
import type { Difficulty } from '@/lib/types';

const LABELS: Record<Difficulty, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

export function FinishDialog({ open, durationMs, rank, isRanked, isGuest, hintCount, puzzleNumber, difficulty, date }: {
  open: boolean; durationMs: number; rank: number | null; isRanked: boolean; isGuest: boolean;
  hintCount: number; puzzleNumber: number; difficulty: Difficulty; date: string;
}) {
  const [copied, setCopied] = useState(false);
  async function share(): Promise<void> {
    await navigator.clipboard.writeText(
      buildShareText({ number: puzzleNumber, difficulty, durationMs, rank }),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-2xl bg-[var(--paper-raised)] p-6 text-center shadow-xl">
            <p className="font-display text-3xl">Bitirdin!</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Harfiyen #{puzzleNumber} · {LABELS[difficulty]}
              {hintCount > 0 && ` · ${hintCount} ipucu`}
            </p>
            <p className="mt-4 font-mono text-5xl tabular-nums">{formatDuration(durationMs)}</p>
            {isRanked && rank !== null && (
              <p className="mt-2 text-sm">Bugün <strong>{rank}.</strong> sıradasın 🏅</p>
            )}
            {!isRanked && !isGuest && (
              <p className="mt-2 text-sm text-[var(--ink-soft)]">Pratik oyunu — sıralamaya girmedi.</p>
            )}
            {isGuest && (
              <p className="mt-2 text-sm">
                <Link href="/register" className="underline">Üye ol</Link>, sıralamaya gir ve serini başlat.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" onClick={share}
                className="rounded-lg bg-[var(--accent)] py-2.5 font-medium text-white">
                {copied ? 'Kopyalandı ✓' : 'Sonucu paylaş'}
              </button>
              <Link href={`/leaderboard?date=${date}&difficulty=${difficulty}`}
                className="rounded-lg border border-[var(--line)] py-2.5 text-sm">
                Sıralamayı gör
              </Link>
              <Link href="/" className="py-1 text-sm text-[var(--ink-soft)] underline">
                Günün diğer bulmacaları
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
