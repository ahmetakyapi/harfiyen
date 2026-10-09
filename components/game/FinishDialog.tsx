'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Check, ChevronDown, Flame, Share2, Sparkles, Trophy, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LetterBurst } from '@/components/motion/LetterBurst';
import { useCountUp } from '@/components/motion/useCountUp';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { DIFFICULTY_BADGE_CLASS, DIFFICULTY_LABELS, DIFFICULTY_STRIPE_CLASS } from '@/lib/difficulty';
import { buildShareText, formatDuration } from '@/lib/share';
import { DIFFICULTIES, type Difficulty, type Entry } from '@/lib/types';

export type FinishStats = {
  medianMs: number | null; fasterThanPct: number | null; solverCount: number;
  previousBestMs: number | null; isPersonalBest: boolean;
};

type SolvedEntry = Entry & { word: string };

const DIR_LABEL: Record<'across' | 'down', string> = {
  across: 'soldan sağa', down: 'yukarıdan aşağıya',
};

export function FinishDialog({
  open, onClose, durationMs, rank, isRanked, hintCount, puzzleNumber, difficulty, date,
  streak, stats, sessionId, siblings, gridLines, celebrate = false,
}: {
  open: boolean;
  /** Verilmezse diyalog kapatılamaz (arşiv "revisit" akışında kapatılacak bir
   *  oyun ekranı yok). Verildiğinde X + Escape + arka plana dokunuş çalışır. */
  onClose?: () => void;
  durationMs: number; rank: number | null; isRanked: boolean;
  hintCount: number; puzzleNumber: number; difficulty: Difficulty; date: string;
  streak?: { current: number; best: number } | null;
  stats?: FinishStats;
  /** "Bugünün Kelimeleri" dökümü bu oturumdan çekilir. */
  sessionId?: number | null;
  /** Aynı günün öbür zorluklarının süresi (bitmemişse alan yok/null). */
  siblings?: Partial<Record<Difficulty, number | null>>;
  /** Spoiler'sız paylaşım ızgarası. */
  gridLines?: string[];
  /** Bulmaca ŞİMDİ bitti: harf yağmuru oynar. Sonradan geri dönülen sonuç
   *  ekranında (revisit) kutlama yapılmaz — o an çoktan geçti. */
  celebrate?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [words, setWords] = useState<SolvedEntry[] | null>(null);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [wordsError, setWordsError] = useState(false);
  const shareRef = useRef<HTMLButtonElement | null>(null);
  // Süre sıfırdan sayarak gelir: bitirme anının "skor tabelası" hissi.
  const shownMs = useCountUp(open ? durationMs : 0);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Açılışta odak diyaloğa girer ve Tab içeride döner; kapanışta odak geri
  // verilir. aria-modal="true" ilan edip bunu kurmamak, ekran okuyucu
  // kullanıcısını arkadaki grid'i okumaya bırakıyordu.
  useFocusTrap(panelRef, open);
  useEffect(() => {
    if (open) shareRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  // Kelime dökümü YALNIZCA istendiğinde çekilir ve yalnızca oyuncunun kendi
  // TAMAMLANMIŞ oturumu için döner (sunucu tarafı sahiplik kontrolü).
  const loadWords = useCallback(async () => {
    setWordsOpen((v) => !v);
    if (words !== null || !sessionId) return;
    try {
      const res = await fetch('/api/session/words', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error('kelime dökümü alınamadı');
      const body = (await res.json()) as { words: SolvedEntry[] };
      setWords(body.words);
    } catch {
      setWordsError(true);
    }
  }, [words, sessionId]);

  async function share(): Promise<void> {
    const text = buildShareText({
      number: puzzleNumber, difficulty, durationMs, rank, hintCount,
      isPersonalBest: stats?.isPersonalBest, fasterThanPct: stats?.fasterThanPct, gridLines,
    });
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
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // pano izni yoksa sessizce geç: metin zaten ekranda paylaşılabilir
    }
  }

  const others = DIFFICULTIES.filter((d) => d !== difficulty);
  const allDone = others.every((d) => siblings?.[d] !== undefined);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog" aria-modal="true" aria-label="Bulmaca tamamlandı"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
          style={{ backgroundColor: 'var(--overlay)' }}
          onClick={onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {celebrate && <LetterBurst />}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.86, y: 40, rotate: -2 }} animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            // my-auto + max-h: kısa ekranda (yatay telefon) kart taşarsa
            // kendi içinde kaydırılır, düğmeler erişilemez kalmaz.
            className="relative z-10 my-auto w-full max-w-sm overflow-hidden rounded-3xl bg-[var(--paper-raised)] text-center shadow-2xl">
            {/* Zorlukla eşleşen ince üst şerit — kartın kime ait olduğunu (hangi
                zorluk) tek bakışta, ikinci bir metin okumadan verir. */}
            <div className={`h-1.5 w-full ${DIFFICULTY_STRIPE_CLASS[difficulty]}`} />
            {onClose && (
              // Kapatınca altta ÇÖZÜLMÜŞ grid kalır. Kare bulmacanın en doyurucu
              // anı — "hangi kelimeler çıkmış" — eskiden tamamen kapalıydı:
              // diyaloğun kapatma yolu hiç yoktu.
              <button type="button" onClick={onClose} aria-label="Kapat, çözülmüş bulmacaya bak"
                className="absolute right-2 top-3.5 flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper)]">
                <X aria-hidden className="h-5 w-5" />
              </button>
            )}
            <div className="finish-card px-6 pb-6 pt-5">
              <motion.div className="finish-icon mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--correct-soft)]"
                initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 14, delay: 0.12 }}>
                <Sparkles aria-hidden className="h-6 w-6 text-[var(--correct)]" />
              </motion.div>
              <p className="finish-title font-display-flourish mt-3 font-display text-4xl">Bitirdin!</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-sm text-[var(--ink-soft)]">
                <span>Harfiyen #{puzzleNumber}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_BADGE_CLASS[difficulty]}`}>
                  {DIFFICULTY_LABELS[difficulty]}
                </span>
              </p>
              <motion.p
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
                className="finish-time mt-5 font-mono text-5xl font-semibold tabular-nums">
                {/* Ekran okuyucu sayan ara değerleri değil, gerçek süreyi okur. */}
                <span className="sr-only">{formatDuration(durationMs)}</span>
                <span aria-hidden>{formatDuration(shownMs)}</span>
              </motion.p>

              {/* Kişisel rekor: günlük oyunda asıl rakip dünkü kendindir.
                  214. sıra hiçbir şey hissettirmez, 3:12 → 2:47 hissettirir. */}
              {stats?.isPersonalBest && stats.previousBestMs !== null && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--correct-soft)] px-3 py-1 text-sm font-medium text-[var(--correct)]">
                  <Trophy aria-hidden className="h-4 w-4" />
                  Yeni Rekor · önceki {formatDuration(stats.previousBestMs)}
                </p>
              )}
              {hintCount > 0 && (
                <p className="mt-1 text-xs text-[var(--ink-soft)]">💡 {hintCount} harf açıldı</p>
              )}

              {/* Süre dağılımı: ham süreyi anlama çeviren tek satır. */}
              {stats && stats.fasterThanPct !== null && stats.medianMs !== null && (
                <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-left">
                  <p className="flex items-center gap-1.5 text-sm">
                    <BarChart3 aria-hidden className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <span>
                      Bugün çözenlerin <strong>%{stats.fasterThanPct}</strong>&apos;inden hızlısın
                    </span>
                  </p>
                  {/* Kendi süren ile medyanın göreli konumu: çubuk soldan
                      sağa "hızlıdan yavaşa" okunur. */}
                  <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                    <motion.div className="h-full origin-left rounded-full bg-[var(--correct)]"
                      style={{ width: `${Math.max(4, stats.fasterThanPct)}%` }}
                      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.45 }} />
                  </div>
                  <p className="mt-1.5 font-mono text-xs tabular-nums text-[var(--ink-soft)]">
                    medyan {formatDuration(stats.medianMs)} · {stats.solverCount} çözücü
                  </p>
                </div>
              )}

              {isRanked && rank !== null && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium">
                  <Trophy aria-hidden className="h-4 w-4 text-[var(--accent)]" /> Bugün <strong>{rank}.</strong> sıradasın
                </p>
              )}
              {/* Seri, günlük oyunun geri dönüş kancası — bitiş anında
                  göstermek "yarın da gel" mesajının en doğal yeri. */}
              {streak && streak.current > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm">
                  <Flame aria-hidden className="h-4 w-4 text-[var(--flame)]" />
                  <strong>{streak.current}</strong> günlük seri
                  {streak.best > streak.current && (
                    <span className="text-[var(--ink-soft)]">· en iyi {streak.best}</span>
                  )}
                </p>
              )}
              {!isRanked && (
                <p className="mt-3 text-sm text-[var(--ink-soft)]">Pratik oyunu — sıralamaya girmedi.</p>
              )}

              {/* "Bugünün Kelimeleri": bulmaca bitince bütün bilgi kayboluyordu.
                  Türkçe kelime oyununda asıl değer önerisi bu — her gün birkaç
                  kelime. Cevaplar yalnızca kendi tamamlanmış oturumuna açılır. */}
              {sessionId != null && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)] text-left">
                  <button type="button" onClick={loadWords} aria-expanded={wordsOpen}
                    className="flex min-h-11 w-full items-center justify-between gap-2 bg-[var(--paper)] px-3 text-sm font-medium">
                    Bugünün Kelimeleri
                    <ChevronDown aria-hidden
                      className={`h-4 w-4 shrink-0 transition-transform ${wordsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {wordsOpen && (
                    <div className="max-h-56 overflow-y-auto overscroll-contain px-3 py-2">
                      {wordsError && <p className="py-2 text-sm text-[var(--ink-soft)]">Döküm alınamadı.</p>}
                      {!wordsError && words === null && (
                        <p className="py-2 text-sm text-[var(--ink-soft)]">Yükleniyor…</p>
                      )}
                      {words !== null && (
                        <ul className="divide-y divide-[var(--line)] text-sm">
                          {words.map((w) => (
                            <li key={`${w.no}:${w.dir}`} className="flex gap-2 py-1.5">
                              <span className="w-4 shrink-0 text-right font-mono text-xs text-[var(--ink-soft)]">
                                {w.no}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="font-semibold tracking-wide">{w.word}</span>
                                <span className="ml-1.5 text-xs text-[var(--ink-soft)]">
                                  {DIR_LABEL[w.dir]}
                                </span>
                                <span className="block text-xs leading-snug text-[var(--ink-soft)]">{w.clue}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="finish-actions mt-6 flex flex-col gap-2">
                <button type="button" onClick={share} ref={shareRef}
                  className="btn-wipe flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] font-medium text-[var(--paper)] transition-transform active:scale-[0.98] [--wipe:var(--ink)]">
                  {copied ? <Check aria-hidden className="h-4 w-4" /> : <Share2 aria-hidden className="h-4 w-4" />}
                  {copied ? 'Kopyalandı' : 'Sonucu Paylaş'}
                </button>
                <Link href={`/leaderboard?date=${date}&difficulty=${difficulty}`}
                  className="flex min-h-11 items-center justify-center rounded-xl border border-[var(--line)] text-sm font-medium">
                  Sıralamayı Gör
                </Link>
                {/* Günün diğer zorluklarına tek dokunuşla geçiş; bitmiş olan
                    ✓ ve süresiyle sönük görünür, bitmemiş olan öne çıkar. */}
                <div className="mt-1 flex gap-2">
                  {others.map((d) => {
                    const doneMs = siblings?.[d];
                    const done = doneMs !== undefined;
                    return (
                      <Link key={d} href={`/play/${date}/${d}`}
                        className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-colors ${
                          done
                            ? 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)]'
                            : 'border-[var(--ink)] bg-[var(--paper)] hover:bg-[var(--row-hover)]'
                        }`}>
                        {done && <Check aria-hidden className="h-3.5 w-3.5 text-[var(--correct)]" strokeWidth={3} />}
                        {DIFFICULTY_LABELS[d]}
                        {done && doneMs !== null && (
                          <span className="font-mono text-xs tabular-nums">{formatDuration(doneMs)}</span>
                        )}
                        {!done && ' →'}
                      </Link>
                    );
                  })}
                </div>
                {allDone && (
                  // Ürün her gün üç bulmaca vaat ediyor ama üçünü bitirmenin
                  // hiçbir görsel karşılığı yoktu.
                  <p className="mt-1 rounded-xl bg-[var(--correct-soft)] px-3 py-2 text-sm font-medium text-[var(--correct)]">
                    Günün Üçlüsü Tamam · 3/3
                  </p>
                )}
                <Link href="/" className="py-1 text-sm text-[var(--ink-soft)] underline">
                  Ana Sayfa
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
