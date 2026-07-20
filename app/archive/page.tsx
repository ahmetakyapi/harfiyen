import Link from 'next/link';
import { and, eq, lt } from 'drizzle-orm';
import { Check } from 'lucide-react';
import { auth } from '@/lib/auth';
import { AutoRefresh } from '@/components/layout/AutoRefresh';
import { LetterTile } from '@/components/ui/LetterTile';
import { formatTrtDayMonth, formatTrtWeekday, gameDay, puzzleNumber } from '@/lib/date';
import { DIFFICULTY_LABELS } from '@/lib/difficulty';
import { getDb } from '@/lib/db';
import { playSessions, puzzles } from '@/lib/schema';
import { DIFFICULTIES, type Difficulty } from '@/lib/types';
import { formatDuration } from '@/lib/share';

export const metadata = { title: 'Arşiv' };
export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const db = getDb();
  const today = gameDay();
  const past = await db.select({ date: puzzles.date, difficulty: puzzles.difficulty })
    .from(puzzles).where(lt(puzzles.date, today));
  const session = await auth();
  // `${date}:${difficulty}` → tamamlanan oturumun süresi (kart üstünde göster).
  const doneMs = new Map<string, number | null>();
  if (session) {
    const mine = await db.select({
      date: puzzles.date, difficulty: puzzles.difficulty, durationMs: playSessions.durationMs,
    })
      .from(playSessions)
      .innerJoin(puzzles, eq(puzzles.id, playSessions.puzzleId))
      .where(and(
        eq(playSessions.userId, Number(session.user.id)),
        eq(playSessions.status, 'completed'),
      ));
    for (const m of mine) doneMs.set(`${m.date}:${m.difficulty}`, m.durationMs);
  }
  const dates = [...new Set(past.map((p) => p.date))].sort().reverse();

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <AutoRefresh />
      <h1 className="bg-gradient-to-r from-[var(--title-from)] to-[var(--title-to)] bg-clip-text text-center font-display text-3xl text-transparent">
        Arşiv
      </h1>
      <p className="mt-2 text-center text-sm text-[var(--ink-soft)]">
        Geçmiş bulmacalar pratik içindir; süren sıralamaya girmez.
      </p>
      {dates.length === 0 && (
        <p className="py-12 text-center text-[var(--ink-soft)]">Arşiv, lansmandan sonra dolmaya başlayacak.</p>
      )}
      <div className="mt-8 flex flex-col gap-4">
        {dates.map((date) => {
          const solvedCount = DIFFICULTIES.filter((d) => doneMs.has(`${date}:${d}`)).length;
          return (
            <section key={date}
              className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--paper-raised)] shadow-[0_10px_30px_-24px_var(--ink)]">
              <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-xl font-semibold text-[var(--ink)]">
                    {formatTrtDayMonth(date)}
                  </span>
                  <span className="text-sm text-[var(--ink-soft)]">{formatTrtWeekday(date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--ink-soft)]">#{puzzleNumber(date)}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    solvedCount === 3
                      ? 'bg-[var(--correct-soft)] text-[var(--correct)]'
                      : 'bg-[var(--paper)] text-[var(--ink-soft)]'
                  }`}>
                    {solvedCount}/3
                  </span>
                </div>
              </header>
              <div className="divide-y divide-[var(--line)]">
                {DIFFICULTIES.map((d) => {
                  const key = `${date}:${d}`;
                  const isDone = doneMs.has(key);
                  const ms = doneMs.get(key) ?? null;
                  return (
                    <Link key={d} href={`/play/${date}/${d}`}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--paper)]"
                      aria-label={`${formatTrtDayMonth(date)} ${DIFFICULTY_LABELS[d]}${isDone ? ' — çözüldü' : ''}`}>
                      <LetterTile difficulty={d} size="sm" />
                      <span className="flex-1 font-medium">{DIFFICULTY_LABELS[d]}</span>
                      {isDone
                        ? <span className="flex items-center gap-1.5 rounded-full bg-[var(--correct-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--correct)]">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            {ms !== null && <span className="font-mono tabular-nums">{formatDuration(ms)}</span>}
                          </span>
                        : <span className="text-sm text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent)]">
                            Oyna →
                          </span>}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
