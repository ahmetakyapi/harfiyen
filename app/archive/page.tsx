import Link from 'next/link';
import { and, eq, lt } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { formatTrtDate, gameDay, puzzleNumber } from '@/lib/date';
import { getDb } from '@/lib/db';
import { playSessions, puzzles } from '@/lib/schema';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';

export const metadata = { title: 'Arşiv' };
export const dynamic = 'force-dynamic';

const LABELS: Record<Difficulty, string> = { easy: 'K', medium: 'O', hard: 'Z' };

export default async function ArchivePage() {
  const db = getDb();
  const today = gameDay();
  const past = await db.select({ date: puzzles.date, difficulty: puzzles.difficulty })
    .from(puzzles).where(lt(puzzles.date, today));
  const session = await auth();
  const done = new Set<string>();
  if (session) {
    const mine = await db.select({ date: puzzles.date, difficulty: puzzles.difficulty })
      .from(playSessions)
      .innerJoin(puzzles, eq(puzzles.id, playSessions.puzzleId))
      .where(and(
        eq(playSessions.userId, Number(session.user.id)),
        eq(playSessions.status, 'completed'),
      ));
    for (const m of mine) done.add(`${m.date}:${m.difficulty}`);
  }
  const dates = [...new Set(past.map((p) => p.date))].sort().reverse();

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-center font-display text-3xl">Arşiv</h1>
      <p className="mt-2 text-center text-sm text-[var(--ink-soft)]">
        Geçmiş bulmacalar pratik içindir; süren sıralamaya girmez.
      </p>
      {dates.length === 0 && (
        <p className="py-12 text-center text-[var(--ink-soft)]">Arşiv, lansmandan sonra dolmaya başlayacak.</p>
      )}
      <ul className="mt-8 divide-y divide-[var(--line)]">
        {dates.map((date) => (
          <li key={date} className="flex items-center justify-between py-3">
            <span className="text-sm">
              <span className="mr-2 font-mono text-[var(--ink-soft)]">#{puzzleNumber(date)}</span>
              {formatTrtDate(date)}
            </span>
            <span className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <Link key={d} href={`/play/${date}/${d}`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium ${
                    done.has(`${date}:${d}`)
                      ? 'border-[var(--correct)] bg-[var(--correct-soft)] text-[var(--correct)]'
                      : 'border-[var(--line)]'
                  }`}
                  aria-label={`${formatTrtDate(date)} ${d}`}>
                  {LABELS[d]}
                </Link>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
