import Link from 'next/link';
import { auth } from '@/lib/auth';
import { addDays, formatTrtDate, gameDay } from '@/lib/date';
import { DIFFICULTY_TAB_CLASS, DIFFICULTY_LABELS } from '@/lib/difficulty';
import { getDb } from '@/lib/db';
import { getLeaderboard } from '@/lib/game/leaderboard';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { formatDuration } from '@/lib/share';

export const metadata = { title: 'Sıralama — Harfiyen' };
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({ searchParams }: {
  searchParams: { date?: string; difficulty?: string };
}) {
  const today = gameDay();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? '') ? (searchParams.date as string) : today;
  const difficulty = (DIFFICULTIES as readonly string[]).includes(searchParams.difficulty ?? '')
    ? (searchParams.difficulty as Difficulty) : 'easy';
  const session = await auth();
  const userId = session ? Number(session.user.id) : null;
  const board = await getLeaderboard(getDb(), { date, difficulty, userId });

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-2 bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text text-center font-display text-3xl text-transparent">
        Sıralama
      </h1>
      <div className="mb-5 flex items-center justify-center gap-3 text-sm">
        <Link href={`/leaderboard?date=${addDays(date, -1)}&difficulty=${difficulty}`} aria-label="Önceki gün"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:bg-[var(--paper-raised)]">←</Link>
        <span className="font-medium">{formatTrtDate(date)}</span>
        {date < today
          ? <Link href={`/leaderboard?date=${addDays(date, 1)}&difficulty=${difficulty}`} aria-label="Sonraki gün"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:bg-[var(--paper-raised)]">→</Link>
          : <span className="flex h-8 w-8 items-center justify-center opacity-30">→</span>}
      </div>
      <nav className="mb-6 flex justify-center gap-2">
        {DIFFICULTIES.map((d) => (
          <Link key={d} href={`/leaderboard?date=${date}&difficulty=${d}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${d === difficulty ? DIFFICULTY_TAB_CLASS[d] : 'border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--paper-raised)]'}`}>
            {DIFFICULTY_LABELS[d]}
          </Link>
        ))}
      </nav>
      {board === null
        ? <p className="py-12 text-center text-[var(--ink-soft)]">Bu gün için bulmaca yok.</p>
        : (
          <>
            <LeaderboardTable rows={board.top} myUsername={session?.user?.name} />
            {board.me && board.me.rank > 100 && (
              <p className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] px-4 py-3 text-center text-sm">
                Senin sıran: <strong>{board.me.rank}.</strong> · {formatDuration(board.me.durationMs)}
              </p>
            )}
          </>
        )}
    </main>
  );
}
