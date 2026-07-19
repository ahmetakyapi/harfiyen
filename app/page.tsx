import Link from 'next/link';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { Countdown } from '@/components/home/Countdown';
import { DailyCard } from '@/components/home/DailyCard';
import { StreakBadge } from '@/components/home/StreakBadge';
import { formatTrtDate, gameDay, puzzleNumber } from '@/lib/date';
import { getDb } from '@/lib/db';
import { getIdentity } from '@/lib/game/identity';
import { playSessions, puzzles, users } from '@/lib/schema';
import { DIFFICULTIES, type Entry } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDb();
  const today = gameDay();
  const rows = await db.select({
    id: puzzles.id, difficulty: puzzles.difficulty, size: puzzles.size, entries: puzzles.entries,
  }).from(puzzles).where(eq(puzzles.date, today));

  const identity = await getIdentity(); // RSC: cookie sadece OKUNUR (yazma /api/session/start'ta)
  const sessionByPuzzle = new Map<number, { status: string; durationMs: number | null }>();
  if (rows.length > 0 && (identity.userId !== null || identity.anonId !== null)) {
    const mine = await db.select().from(playSessions).where(and(
      inArray(playSessions.puzzleId, rows.map((r) => r.id)),
      identity.userId !== null
        ? eq(playSessions.userId, identity.userId)
        : and(isNull(playSessions.userId), eq(playSessions.anonId, identity.anonId ?? '')),
    ));
    for (const s of mine) {
      const prev = sessionByPuzzle.get(s.puzzleId);
      if (!prev || s.status === 'completed') {
        sessionByPuzzle.set(s.puzzleId, { status: s.status, durationMs: s.durationMs });
      }
    }
  }
  const streak = identity.userId !== null
    ? (await db.select().from(users).where(eq(users.id, identity.userId)))[0] ?? null
    : null;

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <p className="text-center text-sm uppercase tracking-widest text-[var(--ink-soft)]">
        {formatTrtDate(today)} · #{puzzleNumber(today)}
      </p>
      <h1 className="mt-2 text-center font-display text-4xl">Günün bulmacaları</h1>
      <div className="mt-4 flex justify-center">
        {streak
          ? <StreakBadge current={streak.currentStreak} best={streak.bestStreak} />
          : <p className="text-sm text-[var(--ink-soft)]">
              <Link href="/register" className="underline">Üye ol</Link> — süreni sıralamada gör, serini başlat.
            </p>}
      </div>
      <div className="mt-8 flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="py-12 text-center text-[var(--ink-soft)]">
            Bugünün bulmacaları henüz yüklenmedi. Birazdan tekrar bak.
          </p>
        )}
        {DIFFICULTIES.map((d) => {
          const row = rows.find((r) => r.difficulty === d);
          if (!row) return null;
          const s = sessionByPuzzle.get(row.id);
          return (
            <DailyCard key={d} difficulty={d} size={row.size}
              wordCount={(row.entries as Entry[]).length} date={today}
              status={s?.status === 'completed' ? 'bitti' : s ? 'devam' : 'yeni'}
              durationMs={s?.durationMs ?? null} />
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-[var(--ink-soft)]">
        Yeni bulmacalara <Countdown /> kaldı
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/how-to-play" className="underline">Nasıl oynanır?</Link>
      </p>
    </main>
  );
}
