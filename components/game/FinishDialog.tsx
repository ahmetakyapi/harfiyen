'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Share2, Sparkles, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { DIFFICULTY_BADGE_CLASS, DIFFICULTY_LABELS, DIFFICULTY_STRIPE_CLASS } from '@/lib/difficulty';
import { buildShareText, formatDuration } from '@/lib/share';
import type { Difficulty } from '@/lib/types';

export function FinishDialog({ open, durationMs, rank, isRanked, hintCount, puzzleNumber, difficulty, date }: {
  open: boolean; durationMs: number; rank: number | null; isRanked: boolean;
  hintCount: number; puzzleNumber: number; difficulty: Difficulty; date: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share(): Promise<void> {
    const text = buildShareText({ number: puzzleNumber, difficulty, durationMs, rank, hintCount });
    // Mobilde işletim sisteminin kendi paylaşım sayfası açılır (WhatsApp dahil
    // doğrudan hedef listesiyle) — bu, ekran görüntüsü almaktan çok daha
    // sorunsuz bir "arkadaşına gönder" deneyimi. Masaüstünde (Web Share API
    // yok) panoya kopyalayıp kısa bir "Kopyalandı" geri bildirimi gösteririz.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
      } catch {
        // kullanıcı paylaşım sayfasını iptal etti — bu bir hata değil
      }
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-[var(--paper-raised)] text-center shadow-2xl">
            {/* Zorlukla eşleşen ince üst şerit — kartın kime ait olduğunu (hangi
                zorluk) tek bakışta, ikinci bir metin okumadan verir. */}
            <div className={`h-1.5 w-full ${DIFFICULTY_STRIPE_CLASS[difficulty]}`} />
            <div className="px-6 pb-6 pt-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--correct-soft)]">
                <Sparkles className="h-6 w-6 text-[var(--correct)]" />
              </div>
              <p className="font-display-flourish mt-3 font-display text-4xl">Bitirdin!</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-sm text-[var(--ink-soft)]">
                <span>Harfiyen #{puzzleNumber}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_BADGE_CLASS[difficulty]}`}>
                  {DIFFICULTY_LABELS[difficulty]}
                </span>
              </p>
              <motion.p
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
                className="mt-5 font-mono text-5xl font-semibold tabular-nums">{formatDuration(durationMs)}</motion.p>
              {hintCount > 0 && (
                <p className="mt-1 text-xs text-[var(--ink-soft)]">💡 {hintCount} ipucu kullanıldı</p>
              )}
              {isRanked && rank !== null && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium">
                  <Trophy className="h-4 w-4 text-[var(--accent)]" /> Bugün <strong>{rank}.</strong> sıradasın
                </p>
              )}
              {!isRanked && (
                <p className="mt-3 text-sm text-[var(--ink-soft)]">Pratik oyunu — sıralamaya girmedi.</p>
              )}
              <div className="mt-6 flex flex-col gap-2">
                <button type="button" onClick={share}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 font-medium text-[var(--paper)] transition-transform active:scale-[0.98]">
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? 'Kopyalandı' : 'Sonucu Paylaş'}
                </button>
                <Link href={`/leaderboard?date=${date}&difficulty=${difficulty}`}
                  className="rounded-xl border border-[var(--line)] py-2.5 text-sm font-medium">
                  Sıralamayı Gör
                </Link>
                <Link href="/" className="py-1 text-sm text-[var(--ink-soft)] underline">
                  Günün Diğer Bulmacaları
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
