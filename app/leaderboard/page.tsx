import Link from 'next/link';
import { auth } from '@/lib/auth';
import { addDays, formatTrtDate, gameDay } from '@/lib/date';
import { getDb } from '@/lib/db';
import { getLeaderboard } from '@/lib/game/leaderboard';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { formatDuration } from '@/lib/share';

export const metadata = { title: 'Sıralama — Harfiyen' };
export const dynamic = 'force-dynamic';

const LABELS: Record<Difficulty, string> = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

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
      <h1 className="mb-2 text-center font-display text-3xl">Sıralama</h1>
      <div className="mb-4 flex items-center justify-center gap-4 text-sm">
        <Link href={`/leaderboard?date=${addDays(date, -1)}&difficulty=${difficulty}`} aria-label="Önceki gün">←</Link>
        <span>{formatTrtDate(date)}</span>
        {date < today
          ? <Link href={`/leaderboard?date=${addDays(date, 1)}&difficulty=${difficulty}`} aria-label="Sonraki gün">→</Link>
          : <span className="opacity-30">→</span>}
      </div>
      <nav className="mb-6 flex justify-center gap-2">
        {DIFFICULTIES.map((d) => (
          <Link key={d} href={`/leaderboard?date=${date}&difficulty=${d}`}
            className={`rounded-full px-4 py-1 text-sm ${d === difficulty ? 'bg-[var(--ink)] text-[var(--paper)]' : 'border border-[var(--line)]'}`}>
            {LABELS[d]}
          </Link>
        ))}
      </nav>
      {board === null
        ? <p className="py-12 text-center text-[var(--ink-soft)]">Bu gün için bulmaca yok.</p>
        : (
          <>
            <LeaderboardTable rows={board.top} myUsername={session?.user?.name} />
            {board.me && board.me.rank > 100 && (
              <p className="mt-4 text-center text-sm">
                Senin sıran: <strong>{board.me.rank}.</strong> · {formatDuration(board.me.durationMs)}
              </p>
            )}
          </>
        )}
    </main>
  );
}
