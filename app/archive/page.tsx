import Link from 'next/link';
import { and, eq, lt } from 'drizzle-orm';
import { Coffee, Flame, Sparkles } from 'lucide-react';
import { auth } from '@/lib/auth';
import { formatTrtDate, gameDay, puzzleNumber } from '@/lib/date';
import { DIFFICULTY_CHIP_CLASS, DIFFICULTY_LABELS } from '@/lib/difficulty';
import { getDb } from '@/lib/db';
import { playSessions, puzzles } from '@/lib/schema';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';

export const metadata = { title: 'Arşiv' };
export const dynamic = 'force-dynamic';

const ICONS: Record<Difficulty, typeof Sparkles> = { easy: Sparkles, medium: Coffee, hard: Flame };

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
      <h1 className="bg-gradient-to-r from-[var(--diff-medium)] to-[var(--accent)] bg-clip-text text-center font-display text-3xl text-transparent">
        Arşiv
      </h1>
      <p className="mt-2 text-center text-sm text-[var(--ink-soft)]">
        Geçmiş bulmacalar pratik içindir; süren sıralamaya girmez.
      </p>
      {dates.length === 0 && (
        <p className="py-12 text-center text-[var(--ink-soft)]">Arşiv, lansmandan sonra dolmaya başlayacak.</p>
      )}
      <ul className="mt-8 flex flex-col gap-1.5">
        {dates.map((date) => (
          <li key={date} className="flex items-center justify-between rounded-2xl px-3 py-2.5 transition-colors hover:bg-[var(--paper-raised)]">
            <span className="text-sm">
              <span className="mr-2 font-mono text-[var(--ink-soft)]">#{puzzleNumber(date)}</span>
              {formatTrtDate(date)}
            </span>
            <span className="flex gap-2">
              {DIFFICULTIES.map((d) => {
                const Icon = ICONS[d];
                const isDone = done.has(`${date}:${d}`);
                return (
                  <Link key={d} href={`/play/${date}/${d}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105 ${
                      isDone ? 'bg-[var(--correct-soft)] text-[var(--correct)]' : DIFFICULTY_CHIP_CLASS[d]
                    }`}
                    aria-label={`${formatTrtDate(date)} ${DIFFICULTY_LABELS[d]}`}>
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </Link>
                );
              })}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
