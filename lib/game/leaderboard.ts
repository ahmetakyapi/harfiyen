import { and, asc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/lib/db';
import { playSessions, puzzles, users } from '@/lib/schema';
import type { Difficulty } from '@/lib/types';

export type LeaderboardRow = { rank: number; username: string; durationMs: number; hintCount: number };

export async function getLeaderboard(db: Db, opts: {
  date: string; difficulty: Difficulty; userId?: number | null;
}): Promise<{ top: LeaderboardRow[]; me: { rank: number; durationMs: number } | null; total: number } | null> {
  const [puzzle] = await db.select({ id: puzzles.id }).from(puzzles)
    .where(and(eq(puzzles.date, opts.date), eq(puzzles.difficulty, opts.difficulty)));
  if (!puzzle) return null;

  const completedRanked = and(
    eq(playSessions.puzzleId, puzzle.id),
    eq(playSessions.isRanked, true),
    eq(playSessions.status, 'completed'),
  );
  const rows = await db.select({
    userId: playSessions.userId, username: users.username,
    durationMs: playSessions.durationMs, hintCount: playSessions.hintCount,
  }).from(playSessions)
    .innerJoin(users, eq(users.id, playSessions.userId))
    .where(completedRanked)
    .orderBy(asc(playSessions.durationMs), asc(playSessions.submittedAt))
    .limit(1000);

  const top = rows.slice(0, 100).map((r, i) => ({
    rank: i + 1, username: r.username, durationMs: r.durationMs ?? 0, hintCount: r.hintCount,
  }));
  let me: { rank: number; durationMs: number } | null = null;
  if (opts.userId != null) {
    const idx = rows.findIndex((r) => r.userId === opts.userId);
    if (idx >= 0) me = { rank: idx + 1, durationMs: rows[idx].durationMs ?? 0 };
  }
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(playSessions).where(completedRanked);
  return { top, me, total: Number(n) };
}
