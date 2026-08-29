import Link from 'next/link';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { Lock } from 'lucide-react';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { Countdown } from '@/components/home/Countdown';
import { DailyCard } from '@/components/home/DailyCard';
import { StreakBadge } from '@/components/home/StreakBadge';
import { auth } from '@/lib/auth';
import { formatTrtDate, gameDay, puzzleNumber } from '@/lib/date';
import { getDb } from '@/lib/db';
import { playSessions, puzzles, users } from '@/lib/schema';
import { DIFFICULTIES } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDb();
  const today = gameDay();

  // Bulmaca listesi ile oturum kimliği birbirini beklemiyor — paralel.
  // `entries` JSONB'i eskiden yalnızca uzunluğu için TAMAMEN çekiliyordu;
  // 10×10'da bu, sayfa başına onlarca kilobayt boşa taşınan ipucu metniydi.
  const [rows, session] = await Promise.all([
    db.select({
      id: puzzles.id, difficulty: puzzles.difficulty, size: puzzles.size,
      wordCount: sql<number>`jsonb_array_length(${puzzles.entries})`,
    }).from(puzzles).where(eq(puzzles.date, today)),
    auth(),
  ]);

  const userId = session ? Number(session.user.id) : null;
  const sessionByPuzzle = new Map<number, { status: string; durationMs: number | null }>();
  let streak: { currentStreak: number; bestStreak: number } | null = null;
  if (userId !== null && rows.length > 0) {
    const [mine, [me]] = await Promise.all([
      db.select({
        puzzleId: playSessions.puzzleId, status: playSessions.status,
        durationMs: playSessions.durationMs,
      }).from(playSessions).where(and(
        inArray(playSessions.puzzleId, rows.map((r) => r.id)),
        eq(playSessions.userId, userId),
      )),
      db.select({ currentStreak: users.currentStreak, bestStreak: users.bestStreak })
        .from(users).where(eq(users.id, userId)),
    ]);
    for (const s of mine) {
      const prev = sessionByPuzzle.get(s.puzzleId);
      if (!prev || s.status === 'completed') {
        sessionByPuzzle.set(s.puzzleId, { status: s.status, durationMs: s.durationMs });
      }
    }
    streak = me ?? null;
  }

  const doneCount = rows.filter((r) => sessionByPuzzle.get(r.id)?.status === 'completed').length;
  const allDone = rows.length > 0 && doneCount === rows.length;
  const totalMs = rows.reduce((sum, r) => sum + (sessionByPuzzle.get(r.id)?.durationMs ?? 0), 0);

  return (
    <main className="page-enter mx-auto max-w-lg px-4 py-8 sm:py-12">
      <AutoRefresh />
      <p className="mx-auto w-fit rounded-full bg-[var(--accent-soft)] px-4 py-1 text-center text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        {formatTrtDate(today)} · #{puzzleNumber(today)}
      </p>
      <h1 className="font-display-flourish mt-4 bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text text-center font-display text-4xl text-transparent sm:text-5xl">
        Günün Bulmacaları
      </h1>
      <div className="mt-5 flex justify-center">
        {streak
          ? <StreakBadge current={streak.currentStreak} best={streak.bestStreak} />
          : (
            // Eski metin "oynayabilirsin, üyelik sadece sıralama için" vaadi
            // kuruyordu; oysa /play üyeliğe kapalı. Kapı ne ise onu söylüyoruz.
            <p className="text-center text-sm text-[var(--ink-soft)]">
              Oynamak için <Link href="/register" className="underline">üye ol</Link> — 10 saniye sürer.
            </p>
          )}
      </div>
      <div className="mt-8 flex flex-col gap-3">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] px-5 py-10 text-center">
            <p className="font-medium">Bugünün bulmacaları henüz hazır değil.</p>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">
              Bu beklenmedik bir durum. Bu arada{' '}
              <Link href="/archive" className="underline">arşivden</Link> bir bulmaca çözebilirsin.
            </p>
          </div>
        )}
        {DIFFICULTIES.map((d) => {
          const row = rows.find((r) => r.difficulty === d);
          if (!row) return null;
          const s = sessionByPuzzle.get(row.id);
          return (
            <DailyCard key={d} difficulty={d} size={row.size}
              wordCount={Number(row.wordCount)} date={today}
              status={s?.status === 'completed' ? 'bitti' : s ? 'devam' : 'yeni'}
              durationMs={s?.durationMs ?? null} locked={userId === null} />
          );
        })}
      </div>

      {/* Ürün her gün üç bulmaca vaat ediyor; üçünü bitirmenin görsel bir
          karşılığı yoktu. Günün kapanışı burada. */}
      {allDone && (
        <div className="mt-6 rounded-2xl border border-[var(--correct)]/40 bg-[var(--correct-soft)] px-5 py-4 text-center">
          <p className="font-display text-2xl text-[var(--correct)]">Günün Üçlüsü Tamam</p>
          <p className="mt-1 font-mono text-sm tabular-nums text-[var(--ink-soft)]">
            3/3 · toplam {Math.floor(totalMs / 60000)} dk {Math.round((totalMs % 60000) / 1000)} sn
          </p>
          <p className="mt-2 text-sm">
            <Link href="/leaderboard" className="underline">Sıralamaya bak</Link>
            {' · '}
            <Link href="/archive" className="underline">arşivde devam et</Link>
          </p>
        </div>
      )}
      {!allDone && doneCount > 0 && (
        <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
          Bugün <strong className="text-[var(--ink)]">{doneCount}/{rows.length}</strong> bitti.
        </p>
      )}

      <p className="mt-8 text-center text-sm text-[var(--ink-soft)]">
        {userId === null && (
          <span className="mb-2 flex items-center justify-center gap-1.5">
            <Lock aria-hidden className="h-3.5 w-3.5" /> Bulmacalar üyelere açık
          </span>
        )}
        Yeni bulmacalara <Countdown /> kaldı
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/how-to-play" className="underline">Nasıl Oynanır?</Link>
      </p>
    </main>
  );
}
